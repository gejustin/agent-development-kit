---
name: create-skill
description: >-
  Use when user says "create a skill", "add a skill for X reviews",
  "we need a skill that handles Y", "make a portable skill for X",
  "skill for changelog entries", "add a SKILL.md for Z", or wants reusable
  work-based expertise (accessibility, security, GraphQL, releases, PR style).
  CRITICAL — run the 5-question decision order BEFORE authoring; most requests
  are missing guardrails or guides.
---

# create-skill

Interview the user, decide whether the request is actually a Skill (versus Guardrail, Guide, or Subagent), then fill `../../templates/SKILL.md` and write to `.agents/skills/<name>/SKILL.md`. Skills are for **work-based expertise** that follows the task, not the folder.

The framework defines four primitives — Guardrail, Guide, Skill, Subagent. Skill is the fallback for reusable knowledge that is not discoverable from code, not enforceable mechanically, and not bound to a folder. Most "we need a skill for X" requests fail the decision check. The first job of this skill is to refuse the wrong ones.

## When to use this skill

- User says: "create a skill for ...", "add a skill that ...", "make a portable skill for ...", "we need a SKILL.md for ...", "skill for [domain] reviews", "skill for changelog / PR descriptions / migrations"
- User wants reusable procedure + constraints + validation for a recurring task type
- The work is task-triggered (what the agent is doing), not path-triggered (where the agent is) and not deterministically checkable
- The expertise should follow the task across packages, repos, or contributors

## Decision check (run before authoring)

Walk the framework decision order from `../../references/framework.md` (section "Decision Order"). HALT and redirect if any earlier primitive fits.

1. **Discoverable from code?** Tests, types, scripts, existing docs already encode this? → No new context. REFUSE.
2. **Deterministic and enforceable?** Lint, typecheck, hook, generator, CI gate could enforce this? → REFUSE and recommend `create-guardrail-recommendation`.
3. **Place-based?** True because of where the agent is editing (package, app, domain folder)? → REFUSE and recommend `create-guide`.
4. **Work-based expertise?** Reusable procedure / review criteria / landmines for a *type of task* regardless of path? → Skill. Continue.
5. **Needs isolated context or fresh-eyes review?** Parent only needs the result, not the working memory? → REFUSE and recommend `create-subagent`.

HALT if steps 1–3 or 5 fit better. State which primitive applies, point the user at the right authoring skill, and stop.

Redirect table:

| Decision answer | Right primitive | Authoring skill |
|---|---|---|
| Discoverable from code | None | Do not author |
| Deterministic / checkable | Guardrail | `create-guardrail-recommendation` |
| Place-based knowledge | Guide | `create-guide` |
| Work-based expertise | Skill | continue here |
| Isolated context / fresh eyes | Subagent | `create-subagent` |

## Interview

Ask all five. HALT until answered. Do not infer.

1. **Intent** — what task does this skill help with? (e.g., "review GraphQL schema changes", "write release notes")
2. **Trigger** — what would the engineer actually type to invoke this work? Collect 3+ realistic phrasings.
3. **Audience** — agent-only, or also read by humans? (Affects tone, not structure.)
4. **Success signal** — how does the user know the skill produced good work? Tests pass? Reviewer approves? Artifact matches a shape?
5. **Current failure mode** — what goes wrong today without this skill? What does the agent get wrong?

If any answer is vague, push back once. "We want a skill for migrations" is not enough — which migration? What is the recurring failure? If the user cannot answer 4 and 5 concretely, the skill is premature: there is no clear pattern to encode yet.

## Authoring

Fill `../../templates/SKILL.md`. Write to `.agents/skills/<slug>/SKILL.md` in the target repo.

1. **Slug** — short, lowercased, hyphenated. Matches the work, not the team (`graphql-changes`, not `platform-graphql`).
2. **Description** — the activation surface. Start with `Use when ...`. Pack at least three real trigger phrases gathered in the interview. Include path hints inline (not in frontmatter). If the skill carries a defense-in-depth gate, add `CRITICAL: <gate>` to the description. Keep ≤ 400 chars.
3. **When to use this skill** — bullets of realistic triggers, paths, upstream artifacts.
4. **Prerequisites** — only if a real gate exists. Mark `CRITICAL:`. Delete the section otherwise.
5. **Procedure** — numbered, observable steps. Name what to verify, not just what to do.
6. **Landmines** — non-obvious failure modes specific to this work.
7. **Validation** — concrete command, signal, or artifact that proves success. The skill must say how it verifies its own output.

Good description example (from framework doctrine):

```
description: Use when changing auth, login, session, token refresh, permission checks, roles, or user access behavior. CRITICAL: Verify backwards compatibility for existing sessions before changing token semantics.
```

Weak description example — reject and rewrite:

```
description: Authentication skill.
```

The first activates on real task language. The second activates on nothing.

## Frontmatter rules (FORBIDDEN list)

Only `name` and `description` are portable across Claude, Codex, and Cursor. See `../../references/framework.md` section "Skill Standard".

FORBIDDEN keys in portable skills:

- `paths` — Claude/Cursor stop proactively matching; Codex ignores it. Path hints go in description text.
- `globs` — same reason as `paths`.
- `alwaysApply` — Cursor-only; breaks portability and burns context.
- `when_to_use` — non-standard; description carries this.
- `agent`, `model`, `tools` — host-specific; pin behavior to the wrong harness.
- `color` — cosmetic; not portable.

HALT and strip any forbidden key before writing. If the user insists on one of these, write a tool-specific shim alongside the portable skill instead of polluting the portable frontmatter.

The canonical shape is:

```
---
name: <slug>
description: Use when ...
---
```

Nothing else. Path hints, gates, and prerequisite warnings all live inside the description text.

## Landmines

- **Weak description.** `description: Authentication skill.` is dead. The description must lead with `Use when ...` and list real task phrasings the engineer types.
- **Frontmatter that breaks portability.** Any key beyond `name` and `description` regresses activation on at least one host. See the framework Skill Standard.
- **Manual invocation as the primary path.** A healthy skill self-triggers from realistic task language. If the engineer has to say "use the X skill," activation is broken — rewrite the description.
- **Prompt dump.** A skill is procedure + constraints + validation. If the body is just prose about the topic, it belongs in a doc, not a skill.
- **Duplicates discoverable info.** Anything inferable from code, tests, or types is noise. Cut it.
- **Domain-shaped but place-bound.** If the work only matters in one package, it is a Guide, not a Skill.
- **Skill written when a Guardrail would land.** If the same review comment recurs, the right answer is a lint rule, hook, or CI check — not prose.
- **Skill name shaped by team or tool.** `platform-graphql` couples to org structure. `graphql-changes` describes the work and survives reorgs.
- **Validation missing.** A skill that does not declare how to verify its output is a prompt, not a skill.

## Validation

After writing, mechanically verify. HALT if any check fails.

- Frontmatter has only `name` and `description`. No other keys.
- Description starts with the literal string `Use when `.
- Description contains at least 3 distinct trigger phrases.
- Description ≤ 400 characters.
- Body contains `## When to use this skill`, `## Procedure`, and `## Validation` sections at minimum.
- File path is `.agents/skills/<slug>/SKILL.md` in the target repo. Slug is lowercased and hyphenated.
- No forbidden frontmatter keys (`paths`, `globs`, `alwaysApply`, `when_to_use`, `agent`, `model`, `tools`, `color`).
- The Validation section in the new skill names at least one concrete command, signal, or artifact.
- The Procedure section is numbered and each step names an observable signal.

Report to the caller:

- the written file path
- the final description string
- which decision-check answer justified Skill over Guardrail, Guide, and Subagent
- any interview answers the user should revisit before the first run

If the user has not yet answered the interview, HALT and ask. Do not invent triggers, success signals, or failure modes.

## References

- `../../references/framework.md` — section "Skill Standard" and "Decision Order"
- `../../references/migration-process.md` — section "Portable Skill Activation Rules"
- `../../templates/SKILL.md` — the template to fill
