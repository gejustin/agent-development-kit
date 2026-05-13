# context-framework

Author and migrate AI context using four primitives. Mechanical-first. Structured artifacts. Cross-tool.

## What it does

Provides skills that interview the user, classify intent against the framework, and emit structured artifacts the team's tools can validate. Four authoring skills (one per primitive) plus a migration skill that consolidates sprawling AI context into the canonical shape.

## Primitives

1. **Guardrail** — machine-enforced constraint (lint, type, hook, CI). The plugin emits a *recommendation*; the team wires enforcement.
2. **Guide** — place-based knowledge. Canonical home: root or nested `AGENTS.md`.
3. **Skill** — work-based expertise. Canonical home: `.agents/skills/<name>/SKILL.md`.
4. **Subagent** — isolated execution. Canonical home: `.agents/agents/<name>.md`.

Decision order — discover from code, then enforce mechanically, then guide, then skill, then subagent. Full doctrine in [`references/framework.md`](references/framework.md).

## Install

### Claude Code

```bash
/plugin marketplace add git@github.com:gejustin/agent-development-kit.git
/plugin install context-framework
```

### Cursor

Follow the root [README](../../README.md) Cursor section, then install `context-framework` from the marketplace.

### Codex

Follow the root [README](../../README.md) Codex section — `context-framework` is listed in `.agents/plugins/marketplace.json`.

## Use

State intent.

```
> Create a skill for our PR description style
> Write an AGENTS.md for packages/database
> We need a subagent for adversarial review of auth changes
> Make a rule for our auth code  →  triggers guardrail-recommendation flow
> Audit our AI context and consolidate it
```

The matching authoring skill runs an interview, fills a template, and writes the artifact. `migrate-context` runs the 6-phase consolidation pipeline against an existing repo.

## Layout

```
context-framework/
  .claude-plugin/plugin.json
  .cursor-plugin/plugin.json
  .codex-plugin/plugin.json
  references/
    framework.md            # doctrine: primitives, decision order
    manifesto.md            # philosophy: good DX = good agent UX
    migration-process.md    # 12-phase doctrine + 6-phase plugin mapping
    _doctrine.yaml          # canonical surface + schema fingerprints
  schemas/                  # JSON Schema (draft 2020-12) for cross-boundary artifacts
  skills/
    create-guide/
    create-skill/
    create-subagent/
    create-guardrail-recommendation/
    migrate-context/        # 6 internal phases, resumable via resume-index.yaml
  templates/
    AGENTS.md
    SKILL.md
    subagent.md
    guardrail-recommendation.md
  evals/                    # dev-time only — run in this repo, not by consumers
    self-conformance/       # Layer 1: mechanical plugin doctrine self-checks (bun)
    self-discovery/         # Layer 2: trigger-rate proxy on skill descriptions (bun)
    fixtures/{greenfield,messy}/
```

## Boundary

- **Skill** — interview, decide, fill template, write artifact. Judgment lives here.
- **Template** — inert markdown with `<<placeholder>>` slots. No logic.
- **Schema** — authoritative shape (JSON Schema draft 2020-12 in YAML).
- **Validator** — skills self-validate inline by reading the schema and the artifact (required fields, enum membership, types). No runtime dependency on the consumer side. The plugin's own Layer 1 evals use bun + ajv in this repo only.

## Removability

Every piece is a file. Delete the plugin folder, the plugin is gone. Delete a schema, the matching artifact still authors but loses validation. Delete a skill, the others still work.
