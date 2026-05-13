// Layer 2: self-discovery proxy. Score skill description quality against a
// human-curated prompt set using a deterministic keyword heuristic.
//
// LIMITATION: this is a description-quality proxy. The real Layer 2 test is
// running these prompts in fresh Claude/Codex/Cursor sessions with the plugin
// installed — we do NOT do that here.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PLUGIN_ROOT = join(__dirname, "..", "..");
const SKILL_DIR = join(PLUGIN_ROOT, "skills");
const PROMPTS_PATH = join(__dirname, "prompts.yaml");
const RESULTS_PATH = join(__dirname, "results.tsv");
const SUMMARY_PATH = join(__dirname, "summary.md");

const STOPWORDS = new Set([
  "use", "when", "the", "and", "or", "for", "with", "that", "this", "from",
  "into", "what", "where", "which", "should", "would", "could", "their",
  "they", "them", "have", "has", "are", "was", "were", "been", "being",
  "but", "not", "you", "your", "user", "users", "wants", "want", "to",
  "of", "in", "on", "by", "as", "is", "be", "an", "a", "it", "its",
  "via", "per", "across", "between", "without", "before", "after",
  "phrasing", "like", "phrasings", "typical", "ask", "asks", "says",
  "critical", "halt", "stop", "must", "never", "always", "skill", "skills",
  "agent", "agents", "team", "teams",
]);

type Prompt = {
  id: string;
  prompt: string;
  expected_skill: string | null;
  phrasing_type?: string;
  category?: string;
};
type PromptSet = {
  intended_triggers: Prompt[];
  false_positive_baits: Prompt[];
};

type SkillTriggers = {
  name: string;
  description: string;
  quoted: string[];      // double-quoted substrings
  nounPhrases: Set<string>; // multi-word non-stopword phrases (lowercased)
  unigrams: Set<string>; // single content words for fallback
};

// ---------- parse skill triggers ----------

function splitFrontmatter(src: string): { fm: string; body: string } {
  if (!src.startsWith("---")) return { fm: "", body: src };
  const end = src.indexOf("\n---", 3);
  if (end < 0) return { fm: "", body: src };
  return { fm: src.slice(3, end).trim(), body: src.slice(end + 4) };
}

// Replace placeholder tokens (<...>, single capital letters used as variables
// like X/Y/Z, and bracket markers) so quoted phrases stay matchable when the
// real prompt swaps in concrete nouns.
function normalizeQuoted(s: string): string[] {
  // Strip <placeholder>, [placeholder]
  let t = s.toLowerCase().replace(/<[^>]*>/g, " ").replace(/\[[^\]]*\]/g, " ");
  // Strip standalone single-letter placeholder tokens (x/y/z/n).
  t = t.replace(/\b[xyzn]\b/g, " ");
  // Collapse whitespace.
  t = t.replace(/\s+/g, " ").trim();
  if (!t) return [];
  // Also yield the largest contiguous chunks (≥3 words) so partial prompts
  // still hit.
  const chunks = t.split(/\s{2,}/).filter((c) => c.split(" ").length >= 2);
  return Array.from(new Set([t, ...chunks]));
}

function extractQuoted(s: string): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(/"([^"]+)"/g)) {
    for (const n of normalizeQuoted(m[1]!)) out.push(n);
  }
  return out;
}

function extractNounPhrases(s: string): Set<string> {
  // Strip quoted regions so they don't double-contribute as ngrams.
  const stripped = s.replace(/"[^"]*"/g, " ");
  const tokens = stripped
    .toLowerCase()
    .replace(/[^a-z0-9\s\-./]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const phrases = new Set<string>();
  // bigrams + trigrams of non-stopword tokens.
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const window = tokens.slice(i, i + n);
      if (window.every((t) => !STOPWORDS.has(t) && t.length > 2)) {
        phrases.add(window.join(" "));
      }
    }
  }
  return phrases;
}

function extractUnigrams(s: string): Set<string> {
  const stripped = s.replace(/"[^"]*"/g, " ");
  const out = new Set<string>();
  for (const t of stripped.toLowerCase().replace(/[^a-z0-9\s\-./]/g, " ").split(/\s+/)) {
    if (t.length > 3 && !STOPWORDS.has(t)) out.add(t);
  }
  return out;
}

function tolerantParse(fm: string): { name?: string; description?: string } {
  const out: Record<string, string> = {};
  const lines = fm.split("\n");
  let key: string | null = null;
  let val: string[] = [];
  const flush = (): void => {
    if (key) out[key] = val.join(" ").trim();
    key = null;
    val = [];
  };
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s?(.*)$/);
    if (m) {
      flush();
      key = m[1]!;
      const v = m[2] ?? "";
      val = v ? [v] : [];
    } else if (key && line.trim()) {
      val.push(line.trim());
    }
  }
  flush();
  return out;
}

async function loadSkills(): Promise<SkillTriggers[]> {
  const dirs = (await readdir(SKILL_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const skills: SkillTriggers[] = [];
  for (const d of dirs) {
    const src = await readFile(join(SKILL_DIR, d, "SKILL.md"), "utf8");
    const { fm } = splitFrontmatter(src);
    let parsed: { name?: string; description?: string };
    try {
      parsed = (yaml.load(fm) ?? {}) as { name?: string; description?: string };
    } catch {
      parsed = tolerantParse(fm);
    }
    const desc = parsed.description ?? "";
    skills.push({
      name: parsed.name ?? d,
      description: desc,
      quoted: extractQuoted(desc),
      nounPhrases: extractNounPhrases(desc),
      unigrams: extractUnigrams(desc),
    });
  }
  return skills;
}

// ---------- scoring ----------

type Score = { skill: string; quotedHits: string[]; phraseHits: string[]; unigramHits: string[] };

function fuzzyContains(prompt: string, phrase: string): boolean {
  if (prompt.includes(phrase)) return true;
  // Fall back to content-token overlap on whole-word boundaries.
  // Phrase passes if ≥ 60% of its content tokens appear as whole words.
  const tokens = phrase.split(/\s+/).filter((t) => t.length > 2 && !STOPWORDS.has(t));
  if (tokens.length < 2) return false;
  let hits = 0;
  for (const t of tokens) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`);
    if (re.test(prompt)) hits++;
  }
  return hits / tokens.length >= 0.6;
}

function scorePrompt(prompt: string, skill: SkillTriggers): Score {
  const lower = prompt.toLowerCase();
  const quotedHits: string[] = [];
  for (const q of skill.quoted) {
    if (q && fuzzyContains(lower, q)) quotedHits.push(q);
  }
  const phraseHits: string[] = [];
  for (const p of skill.nounPhrases) {
    if (lower.includes(p)) phraseHits.push(p);
  }
  const unigramHits: string[] = [];
  for (const u of skill.unigrams) {
    // Whole-word match.
    const re = new RegExp(`\\b${u.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`);
    if (re.test(lower)) unigramHits.push(u);
  }
  return { skill: skill.name, quotedHits, phraseHits, unigramHits };
}

function totalScore(s: Score): number {
  // Heavier weight on quoted phrases (explicit triggers), then bigrams, then
  // unigrams (lowest signal but useful for tie-breaking implicit prompts).
  return s.quotedHits.length * 5 + s.phraseHits.length * 2 + s.unigramHits.length;
}

function predict(prompt: string, skills: SkillTriggers[]): { predicted: string | null; matched: string[] } {
  const scores = skills.map((s) => scorePrompt(prompt, s));
  scores.sort((a, b) => totalScore(b) - totalScore(a));
  const top = scores[0];
  if (!top) return { predicted: null, matched: [] };
  // Threshold: at least 1 quoted phrase OR at least 2 bigrams OR at least
  // 3 unigram hits (the last bucket needs more evidence — unigrams are weak).
  const passes =
    top.quotedHits.length >= 1 ||
    top.phraseHits.length >= 2 ||
    top.unigramHits.length >= 3;
  if (!passes) return { predicted: null, matched: [] };
  // Ambiguity: if runner-up has the same composite score AND >0 evidence,
  // refuse to predict.
  const runner = scores[1];
  if (runner && totalScore(runner) === totalScore(top) && totalScore(top) > 0) {
    return { predicted: null, matched: [...top.quotedHits, ...top.phraseHits, ...top.unigramHits] };
  }
  return {
    predicted: top.skill,
    matched: [...top.quotedHits, ...top.phraseHits, ...top.unigramHits],
  };
}

// ---------- main ----------

async function main(): Promise<void> {
  const skills = await loadSkills();
  const promptSrc = await readFile(PROMPTS_PATH, "utf8");
  const set = yaml.load(promptSrc) as PromptSet;
  const all: Prompt[] = [...(set.intended_triggers ?? []), ...(set.false_positive_baits ?? [])];

  const rows: string[] = ["prompt_id\texpected\tpredicted\tmatched_phrases\tcorrect"];
  const perSkill = new Map<string, { tp: number; fn: number; wrong: number; total: number }>();
  for (const s of skills) perSkill.set(s.name, { tp: 0, fn: 0, wrong: 0, total: 0 });

  let intendedTotal = 0;
  let intendedCorrect = 0;
  let intendedWrong = 0;
  let baitTotal = 0;
  let baitFalsePositive = 0;

  for (const p of all) {
    const { predicted, matched } = predict(p.prompt, skills);
    const expected = p.expected_skill;
    const correct = predicted === expected;
    rows.push([
      p.id,
      expected ?? "null",
      predicted ?? "null",
      matched.join(" | "),
      String(correct),
    ].join("\t"));

    if (expected) {
      intendedTotal++;
      const bucket = perSkill.get(expected);
      if (bucket) bucket.total++;
      if (predicted === expected) {
        intendedCorrect++;
        if (bucket) bucket.tp++;
      } else if (predicted === null) {
        if (bucket) bucket.fn++;
      } else {
        intendedWrong++;
        if (bucket) bucket.wrong++;
      }
    } else {
      baitTotal++;
      if (predicted !== null) baitFalsePositive++;
    }
  }

  const overallTPR = intendedTotal ? intendedCorrect / intendedTotal : 0;
  const overallFPR = baitTotal ? baitFalsePositive / baitTotal : 0;
  const wrongSkillRate = intendedTotal ? intendedWrong / intendedTotal : 0;

  await writeFile(RESULTS_PATH, rows.join("\n") + "\n", "utf8");

  // ---- summary.md ----
  const lines: string[] = [];
  lines.push("# Self-discovery summary");
  lines.push("");
  lines.push("> Heuristic proxy only. This grader matches prompts against trigger phrases extracted from each skill's frontmatter `description`. It measures description quality, **not** actual harness behavior. The real test is running these prompts in fresh Claude / Codex / Cursor sessions with the plugin installed — that is not done here.");
  lines.push("");
  lines.push("## Per-skill");
  lines.push("");
  lines.push("| Skill | Intended | TP | Wrong | FN | TPR |");
  lines.push("| :---- | -------: | -: | ----: | -: | --: |");
  for (const [name, b] of perSkill) {
    const tpr = b.total ? (b.tp / b.total) : 0;
    lines.push(`| ${name} | ${b.total} | ${b.tp} | ${b.wrong} | ${b.fn} | ${(tpr * 100).toFixed(1)}% |`);
  }
  lines.push("");
  lines.push("## Overall");
  lines.push("");
  lines.push(`- Intended prompts: ${intendedTotal}`);
  lines.push(`- Correct: ${intendedCorrect}`);
  lines.push(`- Wrong-skill: ${intendedWrong} (${(wrongSkillRate * 100).toFixed(1)}%)`);
  lines.push(`- TPR overall: ${(overallTPR * 100).toFixed(1)}%`);
  lines.push("");
  lines.push(`- Bait prompts: ${baitTotal}`);
  lines.push(`- False positives: ${baitFalsePositive}`);
  lines.push(`- FPR overall: ${(overallFPR * 100).toFixed(1)}%`);
  lines.push("");
  const tprPass = overallTPR >= 0.80;
  const fprPass = overallFPR <= 0.05;
  lines.push("## Gate");
  lines.push("");
  lines.push(`- TPR ≥ 80%: ${tprPass ? "PASS" : "FAIL"} (${(overallTPR * 100).toFixed(1)}%)`);
  lines.push(`- FPR ≤ 5%: ${fprPass ? "PASS" : "FAIL"} (${(overallFPR * 100).toFixed(1)}%)`);
  lines.push(`- Verdict: **${tprPass && fprPass ? "PASS" : "FAIL"}**`);
  lines.push("");
  await writeFile(SUMMARY_PATH, lines.join("\n"), "utf8");

  console.log(`Layer 2 (self-discovery proxy)`);
  console.log(`  Intended: ${intendedCorrect}/${intendedTotal} correct (TPR ${(overallTPR * 100).toFixed(1)}%)`);
  console.log(`  Wrong-skill: ${intendedWrong}/${intendedTotal} (${(wrongSkillRate * 100).toFixed(1)}%)`);
  console.log(`  Baits: ${baitFalsePositive}/${baitTotal} false-positive (FPR ${(overallFPR * 100).toFixed(1)}%)`);
  for (const [name, b] of perSkill) {
    const tpr = b.total ? (b.tp / b.total) : 0;
    console.log(`    ${name}: ${b.tp}/${b.total} (${(tpr * 100).toFixed(1)}%) — wrong:${b.wrong} fn:${b.fn}`);
  }
  console.log(`  Wrote ${RESULTS_PATH}`);
  console.log(`  Wrote ${SUMMARY_PATH}`);

  process.exit(tprPass && fprPass ? 0 : 1);
}

await main();
