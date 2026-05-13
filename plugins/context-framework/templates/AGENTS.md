<!-- Optional front-matter. Uncomment only if the host tool needs it. -->
<!--
---
reach: <<repo | package | path-scope>>
activation: <<path-based | always | manual>>
owners: <<team or person>>
---
-->

# <<package or scope name>>

<!--
A Guide answers: "What does the agent need to know because it is working here?"
A healthy AGENTS.md is SHORT — usually under 50 lines. Each line is a signal
that something in the codebase or tooling is confusing enough to trip an agent.
A growing AGENTS.md means guidance is too global or should become a Skill or
Guardrail.

Do NOT include:
- Tech stack descriptions (the agent reads package.json / go.mod).
- Naming conventions discoverable from the code.
- Style rules — those belong in a linter.
- Procedures for recurring tasks — those are Skills.
- Deterministic rules — those are Guardrails.
-->

## Local landmines

<!-- Non-obvious traps in this scope. Delete a line when its root cause is fixed. -->

- <<landmine the agent will hit if it does not know about this>>

## Conventions enforced here

<!-- Conventions NOT discoverable from code and NOT yet enforceable mechanically. -->
<!-- If a convention can be linted, file a guardrail recommendation instead. -->

- <<convention that only applies in this scope>>

## Pointers

<!-- Links to skills, subagents, or nested guides. Pointers — not duplicated content. -->

- Skill: <<skill-name>> — <<when it applies>>
- Subagent: <<subagent-name>> — <<when to delegate>>
- Nested guide: <<path/to/AGENTS.md>>
