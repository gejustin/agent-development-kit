// Layer 1: Mechanical self-conformance checks for the context-framework plugin.
// No LLM. Pure file/schema/string inspection. Exits 0 iff all checks pass.

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PLUGIN_ROOT = join(__dirname, "..", "..");

type Check = { name: string; passed: boolean; failures: string[] };

const SKILL_DIR = join(PLUGIN_ROOT, "skills");
const TEMPLATES_DIR = join(PLUGIN_ROOT, "templates");
const SCHEMAS_DIR = join(PLUGIN_ROOT, "schemas");
const REFERENCES_DIR = join(PLUGIN_ROOT, "references");
const DOCTRINE_PATH = join(REFERENCES_DIR, "_doctrine.yaml");
const FRAMEWORK_PATH = join(REFERENCES_DIR, "framework.md");

const CANONICAL_PRIMITIVES = ["Guardrails", "Guides", "Skills", "Subagents"];

const FORBIDDEN_FRONTMATTER_KEYS = [
  "paths",
  "globs",
  "alwaysApply",
  "when_to_use",
  "context",
  "agent",
  "model",
  "tools",
  "allowedTools",
  "color",
];

const ALLOWED_TEMPLATE_FILES = new Set([
  "AGENTS.md",
  "SKILL.md",
  "subagent.md",
  "guardrail-recommendation.md",
]);

const TOOL_SPECIFIC_FILES = [
  "CLAUDE.md",
  "GEMINI.md",
  "copilot-instructions.md",
  "BUGBOT.md",
];
const TOOL_SPECIFIC_DIRS = [".cursor/rules", ".cursor/skills"];

// ---------- helpers ----------

async function readUtf8(p: string): Promise<string> {
  return await readFile(p, "utf8");
}

function splitFrontmatter(src: string): { fm: string | null; body: string } {
  if (!src.startsWith("---")) return { fm: null, body: src };
  const end = src.indexOf("\n---", 3);
  if (end < 0) return { fm: null, body: src };
  const fm = src.slice(3, end).trim();
  const body = src.slice(end + 4).replace(/^\s*\n/, "");
  return { fm, body };
}

// Tolerant frontmatter parser: extracts `name:` and `description:` as plain
// strings by splitting on the FIRST `:` of each top-level line. Used only as a
// fallback after strict YAML parse fails, so the rest of S-2's invariants
// (key allowlist, description shape) can still be checked.
function tolerantFrontmatter(fm: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const lines = fm.split("\n");
  let currentKey: string | null = null;
  let currentVal: string[] = [];
  const flush = (): void => {
    if (currentKey) out[currentKey] = currentVal.join(" ").trim();
    currentKey = null;
    currentVal = [];
  };
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s?(.*)$/);
    if (m) {
      flush();
      currentKey = m[1]!;
      const v = m[2] ?? "";
      currentVal = v ? [v] : [];
    } else if (currentKey && line.trim()) {
      currentVal.push(line.trim());
    }
  }
  flush();
  return out;
}

async function listSkillDirs(): Promise<string[]> {
  const entries = await readdir(SKILL_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

// ---------- checks ----------

async function checkFourPrimitives(): Promise<Check> {
  const failures: string[] = [];
  const src = await readUtf8(FRAMEWORK_PATH);

  // Find "Context Primitives" heading and the next heading
  const cpMatch = src.match(
    /##\s+Context Primitives\s*\n([\s\S]*?)(?=\n##\s+|\n#\s+|$)/,
  );
  if (!cpMatch) {
    failures.push("Could not locate '## Context Primitives' section.");
  } else {
    const body = cpMatch[1] ?? "";
    for (const p of CANONICAL_PRIMITIVES) {
      // Match either bold form **X** or plain X used as the primitive header.
      const re = new RegExp(`\\*\\*${p}\\*\\*`);
      if (!re.test(body)) {
        failures.push(`Missing primitive header '**${p}**' in Context Primitives.`);
      }
    }
    // Reject any extra **Foo** primitive headers beyond the canonical four.
    const boldHeaders = Array.from(body.matchAll(/\*\*([A-Z][A-Za-z]+)\*\*/g))
      .map((m) => m[1]!)
      .filter((h) => /s$/.test(h) && h !== "AGENTS");
    const extras = boldHeaders.filter(
      (h) => !CANONICAL_PRIMITIVES.includes(h),
    );
    if (extras.length) {
      failures.push(
        `Unexpected primitive-like headers in Context Primitives: ${[...new Set(extras)].join(", ")}.`,
      );
    }
  }

  // Decision Order under Implementation and Standards
  const isMatch = src.match(
    /##\s+Implementation and Standards[\s\S]*?###\s+Decision Order\s*\n([\s\S]*?)(?=\n###\s+|\n##\s+|$)/,
  );
  if (!isMatch) {
    failures.push(
      "Could not locate '### Decision Order' under '## Implementation and Standards'.",
    );
  } else {
    const body = isMatch[1] ?? "";
    const numbered = Array.from(body.matchAll(/^\s*(\d+)\.\s+/gm)).map((m) =>
      Number(m[1]),
    );
    // Must be exactly 1..5 sequentially (at least once each).
    const expected = [1, 2, 3, 4, 5];
    const seen = expected.every((n) => numbered.includes(n));
    if (!seen || numbered.length !== 5) {
      failures.push(
        `Decision Order should have exactly 5 numbered questions; found ${numbered.length} (${numbered.join(",")}).`,
      );
    }
  }

  return { name: "S-1: Four primitives only", passed: !failures.length, failures };
}

async function checkSkillFrontmatter(): Promise<Check> {
  const failures: string[] = [];
  const skills = await listSkillDirs();
  for (const s of skills) {
    const p = join(SKILL_DIR, s, "SKILL.md");
    if (!existsSync(p)) {
      failures.push(`${s}: SKILL.md missing.`);
      continue;
    }
    const src = await readUtf8(p);
    const { fm, body } = splitFrontmatter(src);
    if (!fm) {
      failures.push(`${s}: frontmatter not delimited by --- ... ---.`);
      continue;
    }
    let parsed: Record<string, unknown> | null = null;
    let parseError: unknown = null;
    try {
      parsed = (yaml.load(fm) ?? {}) as Record<string, unknown>;
    } catch (e) {
      parseError = e;
    }
    if (parseError) {
      const msg = String(parseError).split("\n")[0];
      failures.push(`${s}: frontmatter YAML parse error (real defect — description contains unquoted colons): ${msg}`);
      // Tolerant fallback so we can still check the remaining invariants.
      parsed = tolerantFrontmatter(fm);
    }
    if (!parsed) continue;
    const keys = Object.keys(parsed);
    const extras = keys.filter((k) => k !== "name" && k !== "description");
    if (extras.length) {
      failures.push(`${s}: extra frontmatter keys ${JSON.stringify(extras)} (only name+description allowed).`);
    }
    for (const fk of FORBIDDEN_FRONTMATTER_KEYS) {
      if (fk in parsed) failures.push(`${s}: forbidden frontmatter key '${fk}'.`);
    }
    const desc = parsed["description"];
    if (typeof desc !== "string") {
      failures.push(`${s}: description missing or not a string.`);
    } else {
      if (!desc.startsWith("Use when ")) {
        failures.push(`${s}: description must start with 'Use when ' (got: '${desc.slice(0, 40)}...').`);
      }
      if (desc.length > 500) {
        failures.push(`${s}: description length ${desc.length} > 500.`);
      }
    }
    const name = parsed["name"];
    if (typeof name !== "string" || !name) {
      failures.push(`${s}: name missing or not a string.`);
    }
    if (!/^##\s+/m.test(body)) {
      failures.push(`${s}: body has no '## ' section header.`);
    }
  }
  return { name: "S-2: Skill frontmatter portable", passed: !failures.length, failures };
}

async function checkTemplates(): Promise<Check> {
  const failures: string[] = [];
  const entries = await readdir(TEMPLATES_DIR);
  const set = new Set(entries);
  for (const required of ALLOWED_TEMPLATE_FILES) {
    if (!set.has(required)) failures.push(`templates/ missing required file '${required}'.`);
  }
  for (const e of entries) {
    if (!ALLOWED_TEMPLATE_FILES.has(e)) failures.push(`templates/ has unexpected file '${e}'.`);
  }
  // Explicit deprecated-name check.
  if (set.has("guardrail-spec.md")) failures.push("templates/guardrail-spec.md is a deprecated name.");
  return { name: "S-3: Templates match 4 primitives", passed: !failures.length, failures };
}

type DoctrineSchemaEntry = { id: string; path: string };
type Doctrine = {
  schemas?: DoctrineSchemaEntry[];
  forbidden_strings?: string[];
};

async function loadDoctrine(): Promise<Doctrine> {
  const src = await readUtf8(DOCTRINE_PATH);
  return (yaml.load(src) ?? {}) as Doctrine;
}

async function checkSchemas(): Promise<Check> {
  const failures: string[] = [];
  const doctrine = await loadDoctrine();
  const listed = doctrine.schemas ?? [];
  if (!listed.length) failures.push("_doctrine.yaml has no schemas listed.");

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);

  const listedPaths = new Set<string>();
  for (const entry of listed) {
    const abs = join(PLUGIN_ROOT, entry.path);
    listedPaths.add(entry.path);
    if (!existsSync(abs)) {
      failures.push(`schema '${entry.id}' missing at ${entry.path}.`);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = yaml.load(await readUtf8(abs));
    } catch (e) {
      failures.push(`schema '${entry.id}' YAML parse error: ${String(e)}`);
      continue;
    }
    if (!parsed || typeof parsed !== "object") {
      failures.push(`schema '${entry.id}' is not a YAML mapping.`);
      continue;
    }
    const obj = parsed as Record<string, unknown>;
    if (obj["$schema"] !== "https://json-schema.org/draft/2020-12/schema") {
      failures.push(`schema '${entry.id}' $schema is not draft 2020-12 (got ${JSON.stringify(obj["$schema"])}).`);
    }
    const raw = await readUtf8(abs);
    if (!/additionalProperties:\s*false/.test(raw)) {
      failures.push(`schema '${entry.id}' has no 'additionalProperties: false' anywhere.`);
    }
    try {
      ajv.compile(obj);
    } catch (e) {
      failures.push(`schema '${entry.id}' does not compile as JSON Schema: ${String(e)}`);
    }
  }

  // Check no extra schema files exist beyond doctrine list.
  const onDisk = (await readdir(SCHEMAS_DIR)).filter((f) => f.endsWith(".schema.yaml"));
  for (const f of onDisk) {
    const rel = `schemas/${f}`;
    if (!listedPaths.has(rel)) {
      failures.push(`schemas/${f} is not registered in _doctrine.yaml.`);
    }
  }

  return { name: "S-4: Schemas match _doctrine.yaml", passed: !failures.length, failures };
}

async function checkHaltRules(): Promise<Check> {
  const failures: string[] = [];
  const skills = await listSkillDirs();
  for (const s of skills) {
    const p = join(SKILL_DIR, s, "SKILL.md");
    const src = await readUtf8(p);
    const { body } = splitFrontmatter(src);
    if (!/HALT/.test(body)) failures.push(`${s}: body has no HALT token.`);
    const hasWhen = /##\s+When to use/i.test(body) || /##\s+Decision check/i.test(body);
    if (!hasWhen) failures.push(`${s}: body has no '## When to use' or '## Decision check' section.`);
    if (!/##\s+Validation/i.test(body)) failures.push(`${s}: body has no '## Validation' section.`);
  }
  return { name: "S-5: Skills carry halt rules", passed: !failures.length, failures };
}

async function checkNoToolForks(): Promise<Check> {
  const failures: string[] = [];
  // direct children of plugin root only
  const entries = await readdir(PLUGIN_ROOT, { withFileTypes: true });
  const names = new Set(entries.map((e) => e.name));
  for (const f of TOOL_SPECIFIC_FILES) {
    if (names.has(f)) failures.push(`plugin root contains forbidden tool-specific file '${f}'.`);
  }
  for (const d of TOOL_SPECIFIC_DIRS) {
    // d may be nested like .cursor/rules — check the first segment.
    const [head, tail] = d.split("/") as [string, string];
    if (names.has(head)) {
      const sub = join(PLUGIN_ROOT, head);
      const st = await stat(sub).catch(() => null);
      if (st?.isDirectory()) {
        const subEntries = await readdir(sub).catch(() => []);
        if (subEntries.includes(tail)) {
          failures.push(`plugin root contains forbidden tool-specific dir '${d}'.`);
        }
      }
    }
  }
  return { name: "S-6: No tool-specific rule forks", passed: !failures.length, failures };
}

async function walkMd(root: string, skip: (relPath: string) => boolean, out: string[] = []): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const e of entries) {
    const abs = join(root, e.name);
    const rel = relative(PLUGIN_ROOT, abs);
    if (skip(rel)) continue;
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      await walkMd(abs, skip, out);
    } else if (e.name.endsWith(".md")) {
      out.push(abs);
    }
  }
  return out;
}

async function checkForbiddenStrings(): Promise<Check> {
  const failures: string[] = [];
  const doctrine = await loadDoctrine();
  const forbidden = doctrine.forbidden_strings ?? [];
  if (!forbidden.length) failures.push("_doctrine.yaml has no forbidden_strings entries.");

  const files = await walkMd(PLUGIN_ROOT, (rel) => {
    return (
      rel === "references/migration-process.md" ||
      rel.startsWith("evals/fixtures") ||
      rel.startsWith("evals/node_modules")
    );
  });

  for (const file of files) {
    const src = await readUtf8(file);
    for (const needle of forbidden) {
      if (src.includes(needle)) {
        const rel = relative(PLUGIN_ROOT, file);
        failures.push(`${rel}: contains forbidden string '${needle}'.`);
      }
    }
  }
  return { name: "S-7: No forbidden strings", passed: !failures.length, failures };
}

// ---------- runner ----------

function pad(name: string, width = 40): string {
  if (name.length >= width) return name + " ";
  return name + " " + ".".repeat(width - name.length - 1) + " ";
}

async function main(): Promise<void> {
  const checks: Check[] = [];
  checks.push(await checkFourPrimitives());
  checks.push(await checkSkillFrontmatter());
  checks.push(await checkTemplates());
  checks.push(await checkSchemas());
  checks.push(await checkHaltRules());
  checks.push(await checkNoToolForks());
  checks.push(await checkForbiddenStrings());

  let passed = 0;
  let failed = 0;
  for (const c of checks) {
    const status = c.passed ? "PASS" : "FAIL";
    console.log(`${pad(c.name)}${status}`);
    if (!c.passed) {
      for (const f of c.failures) console.log(`    - ${f}`);
      failed++;
    } else passed++;
  }
  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

await main();
