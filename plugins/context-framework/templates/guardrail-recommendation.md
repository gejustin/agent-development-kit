<!-- This is a guardrail RECOMMENDATION, not the guardrail. The team wires the enforcement. -->

<!--
Fields below mirror schemas/guardrail-recommendation.schema.yaml. The team
reviews these during triage and decides whether to implement, defer, or reject.
-->

---
id: <<kebab-case-id>>
source: <<path or skill that surfaced this>>
rule: <<the rule, one sentence>>
why_enforce: <<one-sentence rationale>>
scope: <<repo | path | package | task>>
recommended_mechanism: <<lint | typecheck | hook | test | ci-gate | runtime-guard | generator>>
priority: <<P0 | P1 | P2>>
current_home: <<where the rule lives now — e.g. AGENTS.md line 14>>
recommended_action: <<concrete action the team should take to implement>>
interim_instruction: <<context line to add now, until the mechanism exists>>
validation_signal: <<the signal that proves the rule is being enforced>>
status: <<proposed | accepted | rejected | implemented>>
evidence:
  - <<file:line or PR link>>
---

## Rule

<<restated with enough specificity that a developer can implement it>>

## Why enforce

<!-- Cost of not enforcing. Frequency. Risk class. Reviewer burden. -->

<<why this earns mechanical enforcement instead of prose>>

## Recommended mechanism

<!-- Name the specific tool, config, or script. "A lint rule" is not enough. -->

<<specific check, tool, or script and where it would live>>

## Interim instruction

<!-- Exact text to add to AGENTS.md or a skill body until the mechanism ships. -->

<<bridge instruction, kept short>>

## Validation signal

<!-- How we will know the guardrail is actually catching violations. -->

<<CI step name, test output, hook exit code, etc.>>

## Evidence

<!-- Cite specifics. Without evidence this is opinion. -->

- <<file:line, PR URL, or incident reference>>

## Developer decision

<!-- Filled in by the team after triage. Leave blank on submission. -->

- decided_by: <<name>>
- decided_at: <<ISO-8601 timestamp>>
- outcome: <<accepted | rejected | deferred>>
- notes: <<rationale or follow-up link>>
