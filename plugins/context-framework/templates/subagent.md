<!--
A subagent has a narrow mission and produces a RESULT, not working memory.
If the parent needs the journey (file reads, false starts, partial state),
do not use a subagent. Over-delegation creates shallow, under-specified work.

Frontmatter portability: `name` and `description` are portable. The tools key
varies — `tools` (Claude) vs `allowedTools` (other hosts). Pick the one your
target host expects, or omit and let the host default.
-->
---
name: <<subagent-name>>
description: >
  Use when <<the parent needs an isolated investigation or review of>> <<scope>>.
  Returns <<the single result type>>.
model: <<optional: opus | sonnet | haiku — omit to inherit>>
tools: <<optional: comma-separated allowlist — host-specific key>>
color: <<optional display color>>
---

# <<Subagent Name>>

## Mission

<!-- One sentence. If it takes two, the mission is too wide. -->

<<single-sentence mission>>

## Inputs

<!-- Exactly what the parent must hand in. No implicit context. -->

- <<input name>>: <<shape or example>>

## Outputs

<!-- The contract. "A summary of what I looked at" is broken. -->

- <<artifact or structured result the parent will consume>>
- Format: <<markdown | JSON | file edits | PR | etc.>>

## Boundaries

<!-- What this subagent must NOT do. Prevents scope creep and over-delegation. -->

- Do NOT <<scope-expanding action>>.
- Do NOT spawn further subagents unless <<explicit condition>>.
- NEVER <<destructive or out-of-scope action>>.

## Review criteria

- <<criterion the output must meet>>

## Failure conditions

- HALT and report if <<condition>>.
