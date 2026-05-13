---
name: create-guide
description: >-
  Use when adding place-based knowledge to a root or nested AGENTS.md —
  "write an AGENTS.md for <path>", "add a note about <pkg> conventions",
  "document the landmines in this package", "create a nested AGENTS.md",
  "add agent context to <path>".
  CRITICAL — run the decision check first; refuse if the rule is discoverable,
  enforceable, or task-based.
---

# create-guide

Author a Guide (root or nested `AGENTS.md`) for place-based knowledge an agent needs because of *where* it is working in the repo.

A Guide is the third-strongest primitive — weaker than discovery and weaker than mechanical enforcement. Reach for it only after the decision check rules out the stronger options. Most "we should write this down" instincts are actually missing tests, missing lint rules, or missing scaffolding. Audit the instinct before authoring.

`AGENTS.md` is a living list of codebase smells we have not yet fixed — not a permanent configuration surface. Every line is debt. A shrinking Guide means the environment is getting stronger; a growing one means tooling is lagging.

## When to use this skill

Use when the user asks for an `AGENTS.md`, place-based notes, package-local landmines, or scoped conventions tied to a path. Typical phrasings:

- "write an AGENTS.md for packages/database"
- "add a note about <package> conventions to AGENTS.md"
- "document the landmines in this package"
- "create a nested AGENTS.md for X"
- "add agent context to <path>"

Do NOT use when:
- The rule is mechanically enforceable (lint, type, hook, CI gate) → `create-guardrail-recommendation`.
- The rule is a reusable procedure across the repo (auth review, migration steps, release validation) → `create-skill`.
- The work needs isolated context, parallel investigation, or fresh-eyes review → `create-subagent`.
- The information is discoverable by reading code, tests, or config → write nothing; let the agent find it.

A Guide earns its place only when the knowledge is *local* to a path and *cannot* be discovered, enforced, or generalized.

## Decision check (run before authoring)

Walk these five questions from `../../references/framework.md` ("Decision Order"). Stop at the first match.

1. Can the agent discover this from code, tests, types, config, scripts, or existing docs? → No new context. HALT: tell the user the agent will find it on its own; do not author.
2. Can this be enforced mechanically (lint, format, typecheck, test, hook, generator, CI, runtime guard)? → Guardrail. HALT: hand off to `create-guardrail-recommendation`. A linter is a wall; a context file is a suggestion. Always prefer the wall.
3. Is this knowledge needed because of *where* the agent is working? → Guide. Continue to the interview.
4. Is this knowledge needed because of *what task* the agent is performing? → Skill. HALT: hand off to `create-skill`. Procedures, review criteria, and reusable workflows are not Guide content.
5. Does this need isolated execution, fresh eyes, or independent review? → Subagent. HALT: hand off to `create-subagent`.

Do NOT author a Guide if the answer landed on 1, 2, 4, or 5. State which primitive fits and stop. Authoring a Guide for content that belongs elsewhere creates drift, duplicates a stronger primitive, and grows `AGENTS.md` unnecessarily.

## Interview

Ask all five questions before authoring. HALT until every answer is given. Do not guess or fill in plausible defaults.

1. **Intent.** What agent behavior should change after reading this? State the desired action concretely (e.g., "agent wraps multi-table writes in a transaction", not "agent is careful with the database").
2. **Trigger.** What path or work surface is the agent editing when this matters? (root repo, `packages/X`, `apps/Y/server`, a specific generated-file boundary, etc.) This decides root vs. nested placement.
3. **Audience.** Agent-only, or human readers too? Affects tone, not content. Both audiences read the same file — keep prose tight.
4. **Success signal.** How will we know the Guide worked? Examples: a specific review comment stops appearing, a class of CI failures disappears, a known landmine stops being tripped.
5. **Current failure mode.** What goes wrong today without this Guide? Cite a real incident, review comment, or broken PR if possible. "Agents might get confused" is not a failure mode.

If the failure mode is hypothetical with no concrete example, HALT: the rule is not earning its place yet. Tell the user to come back when the failure shows up in real work.

## Authoring

1. **Pick the path.**
   - Repo-wide guidance → root `AGENTS.md`.
   - Scoped to a package, app, or directory → nested `<scope>/AGENTS.md`. Prefer nested — root growth is a smell.
   - If a Guide already exists at the chosen path, edit it; do not create a sibling.
2. **Open the template** at `../../templates/AGENTS.md` and copy its body to the chosen path.
3. **Fill `<<placeholder>>` slots** with the interview answers. Drop sections you do not need — empty headings are noise.
4. **Keep it minimal.** Manifesto invariant: a shrinking `AGENTS.md` is a healthy `AGENTS.md`. Aim under 50 lines. Hard ceiling 80.
5. **Cross-reference, don't duplicate.** If a related Skill or Subagent exists, link it in `## Pointers`. Never inline procedure that belongs in a Skill.
6. **Final state only.** Write what *is*, not what *was*. No deprecated tools, no removed packages, no prior conventions — the pink elephant problem anchors agents on the wrong thing.
7. **Add the lifecycle reminder.** For each line authored, the agent should know the lifecycle: add the line → investigate root cause → fix it → delete the line. If a line cannot articulate its eventual removal path, it is not ready to ship.

## Examples

**Belongs in a Guide (nested at `packages/database/AGENTS.md`):**

```
## Local landmines

- Migrations run in a single transaction by default. Splitting a migration across files breaks rollback.
- The `tenants` table has a soft-delete column; `deleted_at IS NULL` is implicit in most reads but NOT in raw SQL helpers.
```

Concrete, local, non-discoverable, tied to a path. Each line points to a specific failure.

**Does NOT belong — route elsewhere:**

- "Always run `pnpm typecheck` before committing." → Guardrail (pre-commit hook).
- "Here is how to write a new GraphQL resolver." → Skill (`graphql-changes`).
- "Review this PR for auth regressions." → Subagent (`auth-reviewer`).
- "We use TypeScript with strict mode." → Discoverable from `tsconfig.json`. Delete.

## Landmines

- **Duplicating discoverable info.** Tech stack, directory layout, naming conventions — the agent reads the code. Delete it.
- **Growing root `AGENTS.md` unboundedly.** If the new content is scoped, nest it. Root is a last resort.
- **Pink elephant.** Mentioning a deprecated tool ("we no longer use X") anchors the agent on X. State the current rule, omit the history.
- **Tool-specific forks.** Do not author parallel `CLAUDE.md` / `.cursor/rules` content. Canonical home is `AGENTS.md`; tool files should be thin shims (e.g., `CLAUDE.md` is one line: `@AGENTS.md`).
- **Style rules in prose.** If it can be linted, it should be — file a guardrail recommendation instead.
- **Procedures in a Guide.** Multi-step workflows belong in a Skill. A Guide is a list of local truths, not a runbook.

## Validation

After writing the file, verify:

- [ ] Target file exists at the chosen path.
- [ ] No `<<placeholder>>` strings remain in the body.
- [ ] Body is under 80 lines (excluding optional front-matter).
- [ ] No mention of deprecated tools, removed packages, or "we used to".
- [ ] No procedures, style rules, or discoverable facts.
- [ ] At least one `## Pointers` link if related Skills or Subagents exist.

If any check fails, HALT and report the failing check. Do not silently fix and continue — the user needs to see what the Guide is missing.

## After authoring

Tell the user:

1. The path the Guide was written to.
2. The line count, so they know how close to the 80-line ceiling it is.
3. The success signal from the interview, so they have a concrete test for whether the Guide is working in a month.
4. A reminder that each line is debt — the lifecycle is add → investigate → fix root cause → delete. A Guide is healthy when it shrinks.
