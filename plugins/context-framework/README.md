# context-framework

Interview-driven authoring of AI context (skills, `AGENTS.md` guides, guardrail specs) against a portable context framework, with evidence attached.

One skill. One doctrine. Three templates. Enough to move a rule out of someone's head and into the repo with proof it activates.

## What it does

The `create-context` skill interviews the user, applies the framework decision rule, writes the right artifact from a matching template, validates the result, and runs an activation evidence check before declaring done.

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
> I want AI to always run type checks with increased memory before committing
> Create a skill for our PR description style
> Write an AGENTS.md for packages/database
```

The skill runs the interview, classifies (guardrail | guide | skill | delete), authors from the matching template, validates against `references/validators.md`, proves activation, and attaches an evidence sidecar next to the artifact.

## Layout

```
context-framework/
  .claude-plugin/plugin.json
  .cursor-plugin/plugin.json
  .codex-plugin/plugin.json
  skills/
    create-context/
      SKILL.md
  references/
    framework.md       # doctrine — decision rule, containers, 9×5, budget
    validators.md      # per-container Tier 1/2/3 checks
  templates/
    AGENTS-entry.md    # root or nested guide
    SKILL.md           # portable skill, sections mirror the validator
    guardrail-spec.md  # machine-enforceable rule, not yet implemented
```

## Doctrine in one paragraph

Three containers: **Guardrail** (machine-enforced), **Guide** (place-based), **Skill** (work-based). Two metadata fields: **reach** (repo/path/global/task) and **activation** (always/on path/on event/on match/on invoke). One decision rule: guardrail > guide > skill > delete, first match wins. Skill design follows the 9×5 grid (9 Anthropic domains × 5 ADK structural patterns) under three laws: constraints beat instructions, composition over classification, skills are living systems.

Full doctrine: [`references/framework.md`](references/framework.md).

## Cross-tool

One canonical `AGENTS.md` and portable `SKILL.md`. Tool-specific *rule* files (`CLAUDE.md`, `.cursor/rules/*`, `copilot-instructions.md`, `GEMINI.md`, etc.) are **absent by default**. A thin `@import` shim is an extreme edge case — justified only when a tool cannot read canonical context *and* the content is load-bearing *and* upgrading the tool is not an option. Tool *mechanism* (plugin manifests, hooks, slash commands, MCP configs) stays in native surfaces. The skill does not author rule forks and will flag drift in evidence reports.

**Portable activation.** Every tool-native activation mechanism has a portable replacement — Cursor glob rules → nested `AGENTS.md` or path hints inside a skill `description`; Claude slash commands → skill description with explicit trigger phrase; Claude hooks → guardrail-spec + repo tooling. Portable skills use a strict frontmatter allowlist (`name`, `description` only — `paths`, `globs`, and similar extensions break proactive matching in Claude and Cursor and are ignored by Codex). Defense in depth for prerequisite gates: `CRITICAL:` in the skill description + named gate in root `AGENTS.md` + nested pointer. Full mapping table in [`references/framework.md`](references/framework.md#portable-activation).

When Cursor or Codex launchers are available locally, the activation evidence check runs against them too. When not, the skill runs a static portability check and labels the result `static only` so the gap is explicit.

## Removability

Every piece is a file. Delete the plugin folder and the plugin is gone. Delete a reference and the skill still authors with less rigor. Delete a template and the skill still runs and reports the missing template in evidence.

## Contributing

PRs welcome. New validators, sharper interview questions, additional templates. Keep to the framework's own budget: skill body ≤ 1,500 tokens, each reference ≤ 1,000 tokens.
