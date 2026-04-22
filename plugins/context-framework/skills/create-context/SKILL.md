---
name: create-context
description: >
  Interview-driven authoring of AI context artifacts (skills, AGENTS.md guides,
  guardrail specs) against a portable context framework. Use when the user
  wants to design a new skill, write an AGENTS.md file, encode a new rule for
  agents, or turn a prompt or intent into durable context. Self-discovers when
  the user says "create a skill", "write an AGENTS.md", "make this a rule",
  "I want AI to always do X", "encode this as context", "draft a guardrail", or
  asks to take a loose instruction and make it permanent. Runs an interview,
  applies the framework decision rule, writes the artifact, and attaches
  evidence that it activates as intended.
---

# Create Context

Turn an intent into a committed context artifact with evidence. One skill covers all three containers — guardrail, guide, skill — because the hard part is the decision and the proof, not the typing.

## When This Fires

- User asks to author, design, or draft any of: a skill, AGENTS.md entry, Cursor rule, Copilot instructions, guardrail, or "how the agent should behave" rule.
- User describes intent ("I want AI to always X", "agents keep doing Y, make them stop") without naming the artifact type.
- An existing repo pattern is recurring in prompts and the user wants it permanent.

## Constraints

- Do NOT author anything without completing the interview. Vague intent produces vague context. HALT at Phase 1 until intent, proof criteria, and placement are all named.
- Do NOT skip the delete-check. If the agent can already discover the rule from code, types, tests, or templates, HALT and recommend deletion instead of authoring.
- Do NOT author tool-specific rule files (`CLAUDE.md`, `.cursor/rules/*`, `copilot-instructions.md`, `GEMINI.md`, etc.). Absent is the default. A thin `@import` shim is justified only when a tool cannot read canonical `AGENTS.md` or `SKILL.md` at all *and* the content is load-bearing *and* upgrading the tool is not an option — rationale must be stated and the shim tracked as tech debt. Same rule in two tool files is an automatic HALT and consolidate.
- NEVER declare the artifact done before running the validator for the chosen container and running the activation check. Unverified context is not shipped context.
- NEVER write placeholder language (`TBD`, `TODO`, `handle edge cases`, `as needed`, `and so on`) into the artifact. Drafts ship.
- HALT if the authored artifact fails 2+ Tier 1 validator checks. Fix structural issues before proceeding to Tier 2 or activation evidence.

## Red Flags

| Rationalization | Reality |
|-----------------|---------|
| "The user told me what they want — I can skip the interview." | The user named a symptom. The interview finds the real intent, prior art, and proof. Skip it and ship dead context. |
| "This is obviously a skill, no need to run the decision rule." | The rule takes 10 seconds and catches guardrail-shaped work being written as prose. Run it every time. |
| "The framework doctrine is long, I'll work from memory." | Read `references/framework.md`. Do not author from memory. |
| "I'll skip activation evidence — the skill is clearly well-formed." | Well-formed is not activated. Run the evidence check. |
| "We only have Claude here, cross-tool portability is not my problem." | Static portability is always free. Run the check, report gaps. |
| "The user is in a hurry, I'll author first and validate later." | Then the validator becomes review, not a gate. HALT rules exist for this reason. |

## Process

### Phase 1: Intent

Ask, in order:

1. What do you want the agent to do, and when?
2. What triggers the behavior — a path, an event, a task type, a user phrase, or always?
3. Who benefits — one engineer, this repo, the whole org?
4. What does success look like? Name a concrete signal ("when I open a file matching `<path-glob>`, the relevant migration guide fires").
5. What goes wrong today without this context?

HALT and surface the missing piece if any of these is vague. Do not guess.

### Phase 2: Discovery

Before writing, read:

- Existing `AGENTS.md` at root and along the target path.
- Existing skills in `skills/` and `.agents/skills/`.
- Relevant source, types, tests, or templates that the agent would already see.
- Any recent PR or commit that motivated this.

State out loud: does this rule already exist? Is it machine-discoverable? If either is true, HALT and recommend reuse or deletion.

### Phase 3: Placement

Apply `references/framework.md` decision rule. State the answer and the reason in one sentence each.

1. Machine-enforceable? → **Guardrail**. Author a `guardrail-spec.md`.
2. True because of *where* the agent is? → **Guide**. Author an `AGENTS.md` entry (root or nested).
3. True because of the *kind of work*? → **Skill**. Author a portable `SKILL.md`.
4. None of those? → **Delete**. Stop here.

First match wins. Do not skip this step even if the user already named the container — the user can be wrong.

### Phase 4: Shape

Declare:

- **Reach:** `Repo` · `Path` · `Global` · `Task`.
- **Activation:** `Always` · `On path` · `On event` · `On match` · `On invoke`.

Then map the activation to its **portable replacement** per `references/framework.md` (Portable Activation section). Tool-native mechanisms must be recreated in portable surfaces — no forking:

- `On path` / glob → nested `AGENTS.md` at the path, or path hints inline in a skill `description`. Never `paths:` frontmatter. Never `.cursor/rules/*.mdc` as the primary home.
- `Always` → root `AGENTS.md` or skill description with broad task verbs.
- `On invoke` / trigger phrase → skill description with explicit trigger phrasing.
- `On event` (Claude hook) → guardrail implemented in repo tooling (lint, CI, pre-commit); hook stays in `settings.json` and the rule also lives as a guardrail-spec.

State which of the four activation vectors the artifact relies on: **description match**, **implicit path match**, **manual invocation**, **cross-skill reference**. If only manual invocation is named, the description is too weak — strengthen it before authoring.

For skills, also:

- Name the 9×5 cell(s): one of 9 domain categories, one or more of 5 structural patterns. If the skill lands in many cells, it is too broad — narrow it.
- Confirm ≥3 explicit `Do NOT` / `HALT` / `NEVER` statements are planned.
- Frontmatter will contain **only** `name` and `description`. Any `paths`, `when_to_use`, `context`, `agent`, `model`, `globs`, or `alwaysApply` is a portability regression. Path hints and trigger phrases live inside the description text.
- If the rule is a prerequisite gate, plan **defense in depth**: `CRITICAL:` in the skill description + named gate section in root `AGENTS.md` + pointer in the relevant nested `AGENTS.md`.

### Phase 5: Proof Criteria

From the user's success signal in Phase 1, write concrete activation criteria. Examples:

- "A fresh session asked to refactor `src/hai/foo.tsx` cites this guide."
- "A fresh session given the trigger phrase `run the migration` follows this skill's process."
- "A repo state with a missing required import or config fails this guardrail's example check."

If you cannot write the criteria, the intent in Phase 1 was incomplete. Return to Phase 1.

### Phase 6: Author

Copy the right template from `templates/` and fill it in. Write to the target path the user named.

- Skill: `<repo>/skills/<name>/SKILL.md` or `<repo>/.agents/skills/<name>/SKILL.md` per repo convention.
- Guide: `AGENTS.md` at root or nested at the relevant path. Path-scoped rules are a nested `AGENTS.md` — not a `.cursor/rules/*.mdc` file.
- Guardrail-spec: `<repo>/.context/guardrails/<name>.md` or wherever the repo collects specs.

**Portable frontmatter for skills** — allowlist: `name`, `description`. Forbidden: `paths`, `when_to_use`, `context`, `agent`, `model`, `globs`, `alwaysApply`. `paths` is a documented cross-tool regression; the others are tool-specific extensions with no portable guarantee. Path hints, trigger phrases, and prerequisite-gate language all live inside the `description` text.

**Defense in depth for prerequisite gates** — if the artifact is a gate the agent must check before acting, author all three surfaces together: `CRITICAL:` in the skill description, named gate section in root `AGENTS.md`, pointer in the nested `AGENTS.md` at the relevant path. This is not duplication — each surface is a different portable activation vector.

Cross-tool stance: do not create `CLAUDE.md`, `.cursor/rules/*`, `copilot-instructions.md`, `GEMINI.md`, or other tool-specific rule files. Absent is the default. If the repo already has them, note the drift in evidence and recommend collapsing to canonical `AGENTS.md` — propose a shim only if a specific tool cannot read canonical context and the content is load-bearing. This does not apply to tool *mechanism* surfaces (`.claude-plugin/`, `.cursor-plugin/`, hooks, slash commands, MCP config) — those live in their native surfaces.

### Phase 7: Prove

Load `references/validators.md`. Run the section matching the container:

1. **Tier 1 structural.** Mechanical checks. If 2+ fail, HALT and fix before continuing.
2. **Tier 2 quality.** Judgment checks with line references.
3. **Tier 3 design.** Placement, composition, scope, improvement path.

Then run the **activation evidence check**:

- **On-invoke skill** → spawn a fresh subagent (Sonnet is enough), give it the trigger phrase or scenario, read the response, grade adherence to the skill body.
- **On-path guide** → spawn a fresh subagent in a file matching the path, ask a task that the guide should influence, compare to a subagent in an out-of-path file.
- **Always-active guide** → spawn a fresh subagent on a sample task, check whether the guide is cited or followed.
- **Guardrail-spec** → static only. Confirm example violation and example pass are unambiguous; simulate whether the enforcement mechanism would fire.
- **Cross-tool portability (always, static).**
  - Frontmatter allowlist: only `name` and `description` present (skills). Any `paths`, `when_to_use`, `context`, `agent`, `model`, `globs`, or `alwaysApply` = fail.
  - Description leads with task verbs, stays ≤ 3 lines, includes path hints inline if activation is path-scoped, includes `CRITICAL:` if a prerequisite gate exists.
  - No tool-specific rule files authored. No `.cursor/rules/*.mdc` as the primary home for a path-scoped rule — nested `AGENTS.md` is the portable replacement.
  - If a prerequisite gate was authored, verify all three defense-in-depth surfaces exist (skill `CRITICAL:` + root named gate + nested pointer).
- **Cross-tool portability (dynamic, when launchers present).** If Cursor or Codex launchers are installed locally, run the same trigger through them and compare activation — a skill that fires in Claude but not Cursor is an activation regression, not a content regression. Otherwise, label the dynamic check `static only` and flag the gap in the receipt.

### Phase 8: Receipt

Write an evidence sidecar next to the artifact:

- Skill: `<artifact-dir>/EVIDENCE.md`
- Guide: `<artifact-dir>/AGENTS.evidence.md`
- Guardrail-spec: in the spec file under an `## Evidence` section.

The sidecar contains the full validator report (Tier 1/2/3), the activation check result, and an explicit list of what was proved vs. what could not be proved in the current environment.

## Output

- One artifact file at the target path, filled in from the matching template.
- One evidence sidecar adjacent to the artifact.
- Conversation summary: container chosen, reach, activation, score, activation evidence result, what was not proved.

## Pipeline Position

- **Input:** a user intent or prompt.
- **Output:** a committed context artifact with evidence attached.
- **Standalone:** yes. Does not depend on other skills.

## Improvement Path

Every evidence sidecar appends a one-liner to `<repo>/.context/log.md` if that path exists:

```
YYYY-MM-DD | <container> | <artifact>: <score>, activation: <pass|fail|static-only>, gap: <top issue>
```

Over time, the log reveals which containers and patterns consistently pass or fail — feeding future framework updates.
