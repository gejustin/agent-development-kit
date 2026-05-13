<!--
Frontmatter allowlist: ONLY `name` and `description` are portable across hosts.
FORBIDDEN — these break portability:
  paths, globs, alwaysApply, when_to_use, agent, model
  (`paths` removes Claude/Cursor proactive matching and Codex ignores it —
   put path hints inside the description text instead.)

`description` is the primary activation surface. Lead with task verbs, match
realistic developer phrasing, keep within ~3 lines.
-->
---
name: <<skill-name>>
description: >
  Use when <<task verb one>>, <<task verb two>>, or <<task verb three>>.
  CRITICAL: <<prerequisite gate the agent must verify before acting — delete
  this sentence if no prerequisite gate exists>>.
  Also activate when working with <<path hint or file pattern>>.
---

# <<Skill Name>>

<!-- One paragraph: what this skill does and why it exists. -->

<<one paragraph summary>>

## When to use this skill

<!-- Explicit triggers: phrases, situations, file types, or upstream artifacts. -->

- <<trigger phrase or situation>>
- <<file pattern, path, or event that should activate this>>

## Prerequisites

<!-- Mark load-bearing prerequisites CRITICAL. Delete the section if none. -->

- CRITICAL: <<gate the agent must verify before proceeding>>

## Procedure

<!-- Numbered, observable steps. Name what to verify, not just what to do. -->

1. <<step — expected observable signal>>
2. <<step — expected observable signal>>
3. <<step — expected observable signal>>

## Landmines

<!-- Non-obvious failure modes specific to this work. -->

- <<landmine and how to avoid it>>

## Validation

<!-- Concrete command, signal, or artifact that proves success. -->

- <<command, signal, or artifact that proves success>>
