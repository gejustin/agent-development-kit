# Layer 1 — self-conformance

Mechanical doctrine checks on the plugin source. No LLM. Pure file/schema/string inspection.

## Run

```
cd plugins/context-framework/evals
bun install   # first time only
bun run layer1
```

Exit 0 iff every check passes.

## Checks

- **S-1 Four primitives only** — `references/framework.md` lists exactly Guardrails / Guides / Skills / Subagents and Decision Order has exactly 5 questions.
- **S-2 Skill frontmatter portable** — every `skills/*/SKILL.md` has only `name`+`description`, `description` starts with `Use when ` and is ≤500 chars, body has at least one `## ` section.
- **S-3 Templates match the 4 primitives** — `templates/` contains exactly `AGENTS.md`, `SKILL.md`, `subagent.md`, `guardrail-recommendation.md`. No deprecated names.
- **S-4 Schemas match _doctrine.yaml** — every schema listed parses, validates as JSON Schema (ajv), uses draft 2020-12, has `additionalProperties: false`, and no extra schema files exist.
- **S-5 Skills carry halt rules** — every skill body contains `HALT` and has a `When to use` / `Decision check` section plus a `Validation` section.
- **S-6 No tool-specific rule forks** — no `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md`, `BUGBOT.md`, `.cursor/rules/`, or `.cursor/skills/` directly in the plugin root.
- **S-7 No forbidden strings** — none of `_doctrine.yaml#forbidden_strings` appears in any plugin `*.md` (excluding `references/migration-process.md` and `evals/fixtures/`).

## When to add a new check

New check = new mechanical invariant the plugin must hold. Add a function returning `{name, passed, failures}`, register it in `main()`, document it here.
