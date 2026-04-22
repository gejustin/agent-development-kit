# Context Framework

The doctrine. One decision, three containers, two metadata fields.

## Thesis

Good developer experience is good agent experience. AI context is an environment problem, not a prompt problem.

- **Environment > instructions** — a lint, type, or template beats a paragraph of prose.
- **Discoverability is primary** — context with no activation path is dead weight.

## Delete-check first

Before authoring anything, ask: can the agent already discover this from code, types, tests, or templates? If yes, do not document it again unless you are capturing a known failure mode.

## Three containers

- **Guardrail** — a machine enforces it (lint, typecheck, CI, hook, formatter, harness hook).
- **Guide** — place-based codebase knowledge. Root `AGENTS.md`, nested `AGENTS.md`, or glob-scoped rule files.
- **Skill** — work-based expertise loaded when relevant. Standards, rules, procedures, knowledge.

## Two metadata fields

- **Reach** — `Repo` · `Path` · `Global` · `Task`
- **Activation** — `Always` · `On path` · `On event` · `On match` · `On invoke`

## Decision rule

1. Machine-enforceable? → **Guardrail**.
2. True because of *where* the agent is in the codebase? → **Guide**.
3. True because of the *kind of work* the agent is doing? → **Skill**.
4. None of those? → **Delete**.

First match wins. Always prefer the leftmost container that can carry the rule.

## Anti-patterns

- **Monolithic root context** — a giant `AGENTS.md` stuffed with every rule. Context rot. Fix: distribute by reach.
- **Tool-specific duplication** — the same rule in `CLAUDE.md`, `.cursor/rules`, `copilot-instructions.md`. Forks and drifts. Fix: one canonical `AGENTS.md`; tool-specific rule files are absent.
- **Instructions when environment would suffice** — prose asking for X when a lint could enforce X. Fix: promote to guardrail.
- **Context with no discovery path** — files no activation fires. Fix: delete, or add a trigger.

## Skill design: the 9×5 grid

Skills are placed on a 9×5 coverage grid:

**9 domain categories** (Anthropic): Library/API, Product Verification, Data Fetching, Business Process, Code Scaffolding, Code Quality, CI/CD, Runbooks, Infrastructure Ops.

**5 structural patterns** (Google ADK): Tool Wrapper, Generator, Reviewer, Inversion, Pipeline.

Used two ways:

- **Sharpen a single skill** — place it on the grid as a specificity check. If it lands in many cells it is too broad.
- **Map gaps across a library** — empty rows are problem classes unaddressed; empty columns are patterns unused (Inversion is systematically underinvested).

## Three laws of skill design

1. **Constraints beat instructions.** At least three explicit `Do NOT` / `HALT` / `NEVER` statements.
2. **Composition over classification.** The best skills combine 2–3 patterns.
3. **Skills are living systems.** Include a feedback loop or a planned pruning path.

## Budget

- Skill body: ≤ 1,500 tokens.
- Reference files: ≤ 1,000 tokens each.

## Cross-tool portability

One canonical `AGENTS.md` and portable `SKILL.md` are the source of truth. Tool-specific *rule* files (`CLAUDE.md`, `.cursor/rules/*`, `copilot-instructions.md`, `GEMINI.md`, etc.) are **absent by default**. Do not fork rules across tools.

**Rules vs. mechanism.** This anti-pattern applies to *rules* — instructions about how agents should behave. It does **not** apply to *mechanism* that a tool legitimately owns: plugin manifests (`.claude-plugin/`, `.cursor-plugin/`), hooks and settings (`settings.json`), slash commands, MCP configuration (`.mcp.json`). Those live in their native surfaces.

**Shim as extreme edge case, not default.** A thin `@import` or `@file` shim pointing at canonical `AGENTS.md` is justified only when a tool cannot read canonical context at all *and* the content is load-bearing *and* upgrading the tool is not an option. Shims are tracked as tech debt — the moment the tool can read canonical context, the shim is deleted. Any shim authored this way carries a one-line rationale naming what it bridges and when it can be removed.

The default answer to "do I need a tool-specific rule file?" is **no**.

## Portable activation

Each tool ships native activation mechanisms (Cursor's `.cursor/rules/*.mdc` with `globs:` frontmatter; Claude's slash commands and hook events; Codex's prompt matching). The framework's stance: **replicate every tool-native activation behavior in the portable surface.** If you cannot, the portability claim is false.

The cross-tool experiment established the mapping. Rely on these replacements instead of forking per-tool:

| Tool-native mechanism | Portable replacement |
|---|---|
| Cursor `.cursor/rules/*.mdc` with `globs:` (path-scoped activation) | Nested `AGENTS.md` at the relevant path **or** path hints inside a skill `description` |
| Cursor rule `alwaysApply: true` | Root `AGENTS.md` |
| Claude proactive skill matching | `SKILL.md` with task-verb `description` |
| Claude slash command | `SKILL.md` with explicit trigger phrase in `description` |
| Claude hook enforcement (`PreToolUse`, `SessionStart`, etc.) | Guardrail implemented in repo tooling (lint, typecheck, CI, pre-commit hook). Claude hooks stay in `settings.json`; the rule they enforce also lives as a guardrail-spec. |
| Per-tool "when to use" frontmatter | Task-verb `description` text ("Use when ..."), with path hints inline |

**Four activation vectors** (these are what the tools actually evaluate):

1. **Description match.** The skill `description` matches task wording. Strongest vector across all three tools.
2. **Implicit file or path match.** Path hints inside `description` text trigger the skill during organic work on those paths.
3. **Manual invocation.** The skill appears in the catalog for explicit selection. Fallback only.
4. **Cross-skill reference.** Another skill or guide points at this one and the tool follows the chain.

If a skill only activates via manual invocation, activation is weak — strengthen the description.

### Portable-skill frontmatter allowlist

From prior cross-tool evals, only two frontmatter fields are safe across Claude, Cursor, and Codex:

- `name`
- `description`

Forbidden for portable skills: `paths`, `when_to_use`, `context`, `agent`, `model`, `globs`, `alwaysApply`, and any other tool-specific extension. Specifically:

- `paths` removes the skill from proactive description matching in Claude and Cursor, and Codex ignores it entirely — net regression.
- Path hints, file patterns, and activation conditions all go inside the `description` text, not frontmatter.

### Description pattern

Strong descriptions lead with task verbs and include trigger surface inline:

```yaml
description: >
  Use when migrating to the new design system, converting legacy UI, or building new feature-area components.
  CRITICAL: the design system is not repo-wide — check scope before applying.
  Also activate when working with packages/design-system/ or any file under apps/<feature-area>/.
```

Required attributes: task verbs first, domain nouns second, `CRITICAL:` for prerequisite gates, path hints inline, short enough (≤ 3 lines) to preserve matching signal.

### Defense in depth for prerequisite gates

When a rule is a prerequisite check the agent must run before acting, the same truth lives in three discovery surfaces — not as a fork, but as parallel activation paths:

1. Full expertise in the `SKILL.md` body.
2. Named gate section in root `AGENTS.md` (always-loaded prerequisite).
3. Pointer in the relevant nested `AGENTS.md` (path-local reminder and handoff to the skill).

Each surface covers a different discovery vector. This is the portable replacement for tool-native "priority" or "load first" mechanisms.

## Deferred

- **Subagents / delegated contexts** — composition mechanism across all three containers; not yet a first-class primitive here. Do not author new subagent patterns through this framework until the model is resolved.

## Sources

- AGENTS.md open convention: https://agents.md/
- Agent Skills open format: https://agentskills.io/
- 9 domain categories — Thariq Shaukat (Anthropic)
- 5 structural patterns — Google Cloud Tech (ADK)
