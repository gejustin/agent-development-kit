---
name: <skill-name>
description: >
  Use when <task verb one>, <task verb two>, or <task verb three>.
  CRITICAL: <prerequisite gate the agent must check before acting — omit this
  line only if the skill has no prerequisite gate>.
  Also activate when working with <path hint> or <file pattern>.
---

<!--
Frontmatter allowlist (Tier 1.2): ONLY `name` and `description` are portable.
Do NOT add `paths`, `when_to_use`, `context`, `agent`, `model`, `globs`,
`alwaysApply`, or any other tool-specific extension.

- `paths` is a documented cross-tool regression: it removes the skill from
  proactive description matching in Claude and Cursor, and Codex ignores it.
  Put path hints inside the description text instead.
- Description leads with task verbs, keeps path hints inline, uses `CRITICAL:`
  for prerequisite gates, and stays within ~3 lines to preserve matching signal.

Validator mapping — each section below ties to a specific check in
references/validators.md. Keep the section order. Constraints MUST appear
before Process (Tier 2.1).

Tier 1 Structural:
  1.1 Frontmatter present — `name` and `description` set above.
  1.2 Frontmatter allowlist — only `name` and `description`, no extensions.
  1.3 Description triggers — task-verb lead, third person, path hints inline.
  1.4 Description budget — ≤ 3 lines of prose.
  1.5 Size budget — body ≤ 1,500 tokens (warn at 300 lines, fail at 500).
  1.6 Placeholder scan — no `TBD`, `TODO`, `FIXME`, `handle edge cases`,
      `as needed`, `and so on`, `etc.`, `to be determined`, `placeholder`
      outside code blocks, anti-rationalization tables, or scan definitions.
  1.7 Constraints section — present below, before Process.
-->

# <Skill Name>

<One paragraph: what this skill does and why it exists. Make the 9×5 cell
obvious — which of the 9 domain categories (Library/API, Product Verification,
Data Fetching, Business Process, Code Scaffolding, Code Quality, CI/CD,
Runbooks, Infrastructure Ops) and which structural pattern(s) (Tool Wrapper,
Generator, Reviewer, Inversion, Pipeline). Restated explicitly in Grid
Placement below.>

## When This Fires

<!-- Tier 1.2: trigger specificity. Tier 2.7: pipeline input. -->

- <Explicit user trigger: phrases, commands, or situations.>
- <Self-discovery trigger: a file type, path, or event.>
- <Pipeline trigger: the prior skill or artifact that hands off to this one.>

## Constraints

<!--
Tier 1.5 Constraints section present.
Tier 2.1 Constraints appear before Process.
Tier 2.2 Constraints are falsifiable — "do NOT proceed until X", "HALT after N",
         "NEVER modify files outside scope". At least three explicit Do NOT /
         HALT / NEVER statements (Three Laws: Constraints beat instructions).
-->

- Do NOT <specific, falsifiable prohibition>.
- NEVER <second prohibition, also falsifiable>.
- HALT if <condition that must stop execution before damage>.

## Red Flags

<!--
Tier 2.3 Anti-rationalization coverage. Required for discipline or enforcement
skills. Name specific shortcuts the agent will try to take. Omit only for
purely procedural skills with no judgment surface.
-->

| Rationalization | Reality |
|-----------------|---------|
| "<Shortcut the agent will tell itself>" | <Why that shortcut is wrong> |
| "<Second shortcut>" | <Why that one is wrong> |

## Process

<!--
Tier 2.4 Observable outcomes. Every step names what to verify, not just what
to do. "Run `<cmd>` — expected: <signal>. If <other signal>, stop." beats
"Review the code for issues".
-->

### Phase 1: <Name>

<What to do. Expected observable outcome. Explicit halt condition.>

- Run `<command>` — expected: <signal>.
- If <condition>, HALT and surface.

### Phase 2: <Name>

<Observable steps.>

### Phase 3: <Name>

<Observable steps.>

## Output

<!--
Tier 2.6 Output specification. Name the artifact, the path, and the format.
-->

- **Produces:** <artifact or change>.
- **Location:** <path, directory, or destination>.
- **Format:** <markdown, JSON, PR, file edit, etc.>.

## Pipeline Position

<!-- Tier 2.7 Pipeline position. -->

- **Input:** <what feeds this skill>.
- **Output consumer:** <what uses this skill's output>.
- **Standalone:** <yes | no>.

## Activation Vectors

<!--
Tier 3.5 Activation vector coverage. Name the portable vectors this skill
relies on. Skills relying only on manual invocation are flagged — strengthen
the description.
-->

- **Description match:** <the task phrases in `description` the agent will match on>.
- **Implicit path match:** <paths or file patterns embedded in the description>.
- **Manual invocation:** <yes | no — fallback only>.
- **Cross-skill reference:** <which other skills or guides link here>.

## Defense in Depth

<!--
Tier 2.9. Required only if this skill enforces a prerequisite gate the agent
must run before acting. Delete this section entirely if no prerequisite gate
exists.
-->

- **Full expertise:** this `SKILL.md` body.
- **Named root gate:** <section name in root `AGENTS.md` that references this skill>.
- **Nested pointer:** <nested `AGENTS.md` path that points at this skill>.

## Grid Placement

<!-- Tier 3.1 Grid placement, 3.3 One concern. -->

- **Domain:** <one of the 9 categories>.
- **Pattern(s):** <one or more of Tool Wrapper, Generator, Reviewer, Inversion, Pipeline>.
- **Concern:** <the one concern this skill addresses. If more than one, split the skill.>

## Pattern Composition

<!-- Tier 3.2 Pattern composition. Three Laws: Composition over classification. -->

<Which two or more patterns this skill combines, and why. Single-pattern
skills are more brittle; adding Inversion ("ask before acting") is usually
underinvested — consider it.>

## Improvement Path

<!-- Tier 3.4 Improvement path. Three Laws: Skills are living systems. -->

<Eval rubric, success metric, or feedback loop. How this skill gets better
over time. How it would be pruned if it stopped earning its place.>

## Domain Knowledge

<!--
Tier 2.5 Domain knowledge placement.
Domain-specific facts that do not serve workflow logic belong in AGENTS.md,
NOT here. If this section would grow large, move its contents to a guide and
link to it. Exception: skills targeting repos without AGENTS.md may inline
sparingly. Delete this heading entirely if not needed — empty is better than
filler.
-->

<Reference `../AGENTS.md` or a specific guide. Inline only if the target repo has no guide surface.>

<!--
Final checks before committing this skill:

- Frontmatter contains only `name` and `description` (Tier 1.2). No `paths`,
  `when_to_use`, `context`, `agent`, `model`, `globs`, or `alwaysApply`.
- Description leads with task verbs and includes `CRITICAL:` when a
  prerequisite gate exists (Tier 1.3, 2.8).
- Description ≤ 3 lines (Tier 1.4).
- Constraints section is BEFORE Process (Tier 2.1).
- At least three Do NOT / HALT / NEVER statements (Tier 2.2, Three Laws).
- Red Flags table present unless the skill is purely procedural (Tier 2.3).
- Every Process step names an observable outcome (Tier 2.4).
- Output, Pipeline Position, Activation Vectors, Grid Placement, Pattern
  Composition, and Improvement Path sections are all filled (Tiers 2.6, 2.7,
  3.1–3.5).
- Defense in Depth section present if the skill enforces a prerequisite gate
  (Tier 2.9).
- No placeholder language outside code, tables, or scan definitions
  (Tier 1.6).
- Body ≤ 1,500 tokens (Tier 1.5). Each file in `references/` ≤ 1,000 tokens.
- Skill addresses one concern (Tier 3.3). If more, split it.
-->
