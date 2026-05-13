# Layer 2 — self-discovery proxy

Measures whether each skill's `description` is phrased well enough to trigger on realistic developer prompts and not fire on look-alike noise.

## What this measures

For every prompt in `prompts.yaml`, the grader extracts trigger phrases from each skill's frontmatter `description`:

- every double-quoted substring (these are the explicit example phrases)
- every multi-word non-stopword bigram / trigram

…then predicts a skill if the prompt contains ≥1 quoted phrase OR ≥2 phrase overlaps. Ambiguous ties resolve to `null`.

It reports per-skill TPR, overall TPR, overall FPR on baits, and wrong-skill rate.

## Limitation

**This is a description-quality proxy.** The real Layer 2 test is running prompts in fresh Claude / Codex / Cursor sessions with the plugin installed and observing which skill the harness actually activates. We do NOT do that here. A passing grader means descriptions look discoverable to a keyword matcher — it does not prove harness activation.

## Run

```
cd plugins/context-framework/evals
bun install   # first time only
bun run layer2
```

Outputs:

- `results.tsv` — one row per prompt with predicted vs. expected
- `summary.md` — per-skill table + overall metrics + gate verdict

## Gate

- overall TPR ≥ 80%
- overall FPR ≤ 5%

Exit 0 iff both pass.

## Adding prompts

Edit `prompts.yaml`:

- `intended_triggers` — realistic developer phrasing for a specific skill. Mix `direct` / `paraphrase` / `implicit` / `contextual` phrasings. Aim for ≥8 per skill.
- `false_positive_baits` — prompts that should match NO skill in this plugin. Make them genuinely tempting (look-alike phrasing, adjacent domains, vague conversational).
