# <Repo or path name>

<One paragraph: what lives here, who owns it, what the agent needs to know to be useful.>

## Domain

<Domain verbs, key entities, invariants. Skip if root covers it.>

## Conventions

- <One-sentence rule.> (reach: <repo | path | glob>, activation: <always | on path | on event | on match>)
- <One-sentence rule.>

## Known failure modes

- <A rule that exists only because the agent has failed without it. Include the failure mode explicitly.>

## Pointers

- `path/to/related/AGENTS.md` — <when to follow it>
- `path/to/code` — <when to read it>

<!--
Guide template. Use for root or nested AGENTS.md.

Delete-check before committing:
- Can the agent discover any of this from code, types, tests, or templates? If yes, remove that rule.
- Is any rule machine-enforceable (lint, typecheck, CI)? If yes, write a guardrail-spec instead.
- Does any rule duplicate a skill's workflow? If yes, reference the skill, do not inline.

Size budget: 300 lines at root, 150 lines nested.
Do NOT fork rules into CLAUDE.md, .cursor/rules/*, or copilot-instructions.md. Shims only.
-->
