---
name: create-guardrail-recommendation
description: >-
  Use when the user wants a deterministic rule enforced — phrasing like
  "make a rule for our auth code", "AI should always run typecheck", "ban X",
  "agents should never Y", "enforce migrations have rollback notes",
  "create a guardrail for Z", or "add a lint rule for X".
  CRITICAL — writes a RECOMMENDATION, not the guardrail; the team wires the
  mechanism. Route judgment rules to create-skill.
---

# create-guardrail-recommendation

Capture a candidate rule as a structured recommendation. The team triages it and wires the actual enforcement.

**CRITICAL: This skill does NOT generate lint configs, hook scripts, CI YAML, or type definitions. It produces a markdown artifact with YAML frontmatter that names the rule, the harm, the recommended layer, and an interim instruction. The mechanism is a team decision.**

Most rule requests are missing guardrails. The job here is to (a) confirm the rule is mechanically enforceable, (b) name the strongest viable layer, and (c) record the recommendation in a stable schema so it survives triage.

## When to use this skill

Use when the user wants a deterministic, checkable rule enforced — for agents, humans, or both. Typical phrasings:

- "make a rule for our auth code"
- "AI should always run typecheck before committing"
- "ban direct imports from internal/* in shared modules"
- "every migration must have a rollback note"
- "agents must never run `rake db:reset`"
- "add a lint rule for X" (skill captures the recommendation; team wires it)

Do NOT use when:
- The rule is judgment-bearing (review taste, architectural tradeoffs, naming nuance) → `create-skill`.
- The rule is place-based knowledge, not a constraint → `create-guide`.
- The information is already discoverable from code, config, or tests → write nothing.

## What this skill produces

One file per recommendation, at a team-chosen path. Default:

```
.workflow-context/guardrail-recommendations/<id>.md
```

The file has YAML frontmatter matching `../../schemas/guardrail-recommendation.schema.yaml` and a structured body from `../../templates/guardrail-recommendation.md`.

It is NOT:
- a lint rule, ESLint plugin, or formatter config
- a git hook or agent hook script
- a CI workflow file
- a type definition or schema
- a generator

It IS a recommendation the team uses to wire the actual enforcement.

## Decision check (run before authoring)

From `../../references/framework.md` ("Enforcement Hierarchy") and `../../references/manifesto.md` ("Layer 1: Constraints"), walk these five questions. Stop at the first match.

1. Can the agent discover the rule by reading code, types, tests, or config? → No artifact. HALT: the rule is already encoded.
2. Is the rule deterministic and mechanically checkable (lint, typecheck, hook, test, ci-gate, runtime-guard, generator)? → Continue to Interview.
3. Is the rule fundamentally judgment-bearing (taste, tradeoff, review nuance)? → HALT: refuse, route to `create-skill`. A Guardrail must be deterministic; otherwise it produces false positives and noise.
4. Is the rule local to a path with no general enforcement? → HALT: route to `create-guide`. Place-based knowledge is a Guide, not a Guardrail.
5. Is the rule a multi-step procedure rather than a constraint? → HALT: route to `create-skill`.

A recommendation is only earned at step 2. If you cannot name a concrete mechanism, the rule is not a Guardrail yet.

## Interview

Ask every question. HALT until each is answered. Do not guess — guessed evidence pollutes triage.

1. **rule.** State the constraint in one sentence. Concrete enough that a reviewer can check a violation by eye.
2. **why_enforce.** What harm occurs if it is violated? Incident, repeated PR comment, security risk, broken build?
3. **scope.** `repo`, `path`, `package`, or `task`?
4. **recommended_mechanism.** Pick the STRONGEST viable layer: `lint`, `typecheck`, `hook`, `test`, `ci-gate`, `runtime-guard`, `generator`. Prefer types over lint, lint over hook, hook over CI, CI over runtime. Do not pick a weaker layer than necessary.
5. **priority.** `P0` (security / data loss), `P1` (correctness / repeated harm), `P2` (hygiene).
6. **current_home.** Where does the rule live in prose today? AGENTS.md line, PR review template, Slack thread, nowhere.
7. **interim_instruction.** Exact short text to add to a nested AGENTS.md or skill body until the mechanism ships. This closes the gap between filing and enforcement.
8. **validation_signal.** How will the team know the mechanism works? CI step name, hook exit code, failing test path, lint rule id.
9. **evidence.** File paths, PR links, incident refs that show the rule is needed. Without evidence this is opinion.

If the user cannot cite at least one piece of evidence, HALT — the rule has not earned a guardrail yet.

## Authoring

1. **Choose `id`.** kebab-case, stable, e.g. `ban-internal-imports-from-shared`.
2. **Copy `../../templates/guardrail-recommendation.md`** to `.workflow-context/guardrail-recommendations/<id>.md` (or the team-chosen path).
3. **Fill frontmatter** with every required field from `../../schemas/guardrail-recommendation.schema.yaml`. `status` defaults to `proposed`. Leave `developer_decision` blank — the team fills it on triage.
4. **Fill body sections.** Each section in the template restates a frontmatter field with the specificity a developer needs to implement the mechanism. "A lint rule" is not enough — name the rule id and where its config lives. "A hook" is not enough — name the trigger and the script path.
5. **Pick the mechanism layer deliberately.** Strongest viable wins:
   - `typecheck` — encode invalid states as unrepresentable. Highest leverage; agent cannot even write the wrong code.
   - `lint` — catch at edit-time in the IDE. Fast feedback, fixes the pattern early.
   - `hook` — pre-commit or agent hook. Blocks the action at the moment of mistake.
   - `test` — required test that fails when the rule is broken. Slower feedback but proves behavior.
   - `ci-gate` — required CI step. Last line of defense; do not rely on it if a faster layer works.
   - `runtime-guard` — fail loudly in production. Use when a static check is impossible.
   - `generator` — make the right shape the default by scaffolding it.
6. **Write the interim instruction now.** Commit the recommendation alongside a one-line addition to the closest nested AGENTS.md so the rule is enforced as prose-context until the mechanism ships. Skipping this leaves the rule unenforced anywhere — the worst outcome. The interim line should be short, imperative, and match the eventual mechanism's intent.
7. **Cite specific evidence.** A PR URL with the violation, an incident reference, a file:line where the harm occurred. Without it, triage cannot rank priority and the recommendation rots.
8. **Do not write the mechanism.** No lint config. No hook script. No CI YAML. The recommendation ends at the artifact. Mechanism authorship is a separate change owned by the team that owns the enforcement layer.

## Landmines

- **Leaving the rule as prose-only context forever.** A recommendation that never gets wired is just an AGENTS.md line that nobody enforces. The artifact exists to force escalation — track `status` and revisit `proposed` items on a cadence.
- **Recommending the wrong layer.** Picking `typecheck` when a `hook` suffices wastes engineering time; picking `ci-gate` when `lint` would catch it locally costs developers a slow feedback loop. Pick the strongest layer that gives the fastest feedback. Manifesto invariant: walls beat reminders, and walls that catch at edit-time beat walls that catch at push-time.
- **Skipping the interim instruction.** Filing the recommendation without adding a context line creates a gap where neither prose nor mechanism enforces the rule. The interim line is the bridge between "we filed it" and "the wall exists".
- **Calling the recommendation a Guardrail.** The recommendation is metadata about a future Guardrail. The Guardrail is the mechanism the team builds from it. Do not conflate them in commits, PRs, or chat — the distinction is what keeps the backlog honest.
- **Filing without evidence.** "Agents might do X" is not evidence. A real PR, incident, or repeated review comment is. Unevidenced recommendations crowd the triage queue.
- **Filing judgment rules.** If the rule needs human taste to evaluate, it is a Skill, not a Guardrail. False positives from a fuzzy lint rule cost more attention than the prose ever did.
- **Duplicating an existing mechanism.** Search the repo before filing — if the rule is already enforced by an existing lint config or hook, the recommendation is redundant and the AGENTS.md prose should be trimmed instead.

## Examples of valid recommendations

These illustrate the shape, not the mechanism — the team still picks the implementation.

**Example 1 — import boundary.**
- rule: `Packages under shared/* must not import from internal/*.`
- scope: `repo`
- recommended_mechanism: `lint`
- priority: `P1`
- interim_instruction: Add to root AGENTS.md: "Do not import `internal/*` from `shared/*` — file a guardrail recommendation if blocked."
- validation_signal: ESLint rule `boundaries/element-types` fails build with named violation.
- evidence: `PR #4821`, `PR #4910` — both bounced for the same import.

**Example 2 — migration rollback.**
- rule: `Every migration file must include a rollback section.`
- scope: `path` (`db/migrations/`)
- recommended_mechanism: `ci-gate`
- priority: `P0`
- interim_instruction: Add to `db/migrations/AGENTS.md`: "Each migration must include a rollback section before merging."
- validation_signal: CI step `verify-migrations` fails when rollback header is missing.
- evidence: incident `INC-2026-03-11` (production rollback blocked).

**Example 3 — dangerous command.**
- rule: `Agents must not run \`rake db:reset\` directly; use \`bin/reset_dev\`.`
- scope: `repo`
- recommended_mechanism: `hook`
- priority: `P0`
- interim_instruction: Add to root AGENTS.md: "Use `bin/reset_dev`. Never run `rake db:reset`."
- validation_signal: Agent hook intercepts the command and exits non-zero with a redirect message.
- evidence: Slack thread (data loss in staging, 2026-02-04).

Each example produces ONE artifact. The mechanism is wired in a separate PR by the team that owns the layer.

## Validation

After writing the file:

- [ ] Frontmatter contains every required field from `../../schemas/guardrail-recommendation.schema.yaml`.
- [ ] `status` is `proposed`.
- [ ] `recommended_mechanism` is one of the schema enum values.
- [ ] `priority` is one of `P0`, `P1`, `P2`.
- [ ] `evidence` is a non-empty array with at least one concrete reference.
- [ ] `interim_instruction` is filled and a matching line was added to the closest AGENTS.md.
- [ ] Inline shape check: read `../../schemas/guardrail-recommendation.schema.yaml`, confirm the artifact's frontmatter has every required field, every enum value matches, every type is correct. **HALT** if any check fails. Report the failing fields. Do not silently fix — the user needs to see the gap.
