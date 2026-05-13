---
name: migrate-context
description: >-
  Use when the user asks to "audit our AI context and consolidate it",
  "migrate AGENTS.md / CLAUDE.md / cursor rules", "clean up our AI context
  sprawl", "consolidate scattered agent instructions", "run a context migration
  on this repo", or says "we have sprawl in our agent files, fix it".
  Runs a 6-phase behavior-preserving consolidation with two HITL gates.
  Resumable via `<target>/.workflow-context/resume-index.yaml`.
  CRITICAL — never auto-advance past a HITL gate.
---

# migrate-context

Consolidates sprawling AI context in a target repo (AGENTS.md, CLAUDE.md, `.cursor/rules/`, `.cursor/skills/`, `.claude/skills/`, BUGBOT.md, workflow commands) into the four framework primitives. Six internal phases, two human gates, resumable state.

Full doctrine: [`references/migration-process.md`](../../references/migration-process.md). The 12→6 phase collapse, role separation, and HITL gate semantics are defined in the "Plugin Pipeline Mapping" appendix at the bottom of that document. **Do not re-derive doctrine here.** Read that file.

## When to use this skill

Trigger on any of: "audit our AI context", "consolidate our agent instructions", "migrate AGENTS.md", "clean up cursor rules", "context migration", "sprawl in agent files". Use against an existing repo that already has more than one AI context surface and shows duplication, staleness, or activation drift.

Do not use for greenfield context authoring — that's `create-guide`, `create-skill`, `create-subagent`, or `create-guardrail-recommendation`. Those skills produce one artifact at a time; this skill orchestrates a behavior-preserving migration across many.

The slice is the unit of work. A slice is a path glob plus the set of context carriers that touch it. Migrate one slice at a time. Repo-wide migrations are an aggregation of slice runs, not a single run.

## What this skill produces

All artifacts land under `<target>/.workflow-context/`. Every artifact validates against a schema in [`../../schemas/`](../../schemas/).

| Phase | Artifact | Schema |
|---|---|---|
| onboard | `repo-profile.yaml`, `capabilities.tsv`, `resume-index.yaml` | [`resume-index.schema.yaml`](../../schemas/resume-index.schema.yaml) |
| plan | `inventory.tsv`, `classifications.tsv`, `plan.yaml`, `evals.md` | [`inventory.schema.yaml`](../../schemas/inventory.schema.yaml), [`classifications.schema.yaml`](../../schemas/classifications.schema.yaml), [`plan.schema.yaml`](../../schemas/plan.schema.yaml) |
| apply | `apply-receipt.yaml`, `before-evals.md`, `after-evals.md`, `cross-tool-results.md`, source consolidation commit; on regression `apply-blockers.yaml` | [`apply-receipt.schema.yaml`](../../schemas/apply-receipt.schema.yaml) |
| enrich (optional) | `enrich-receipt.yaml` (additive diffs only) | [`apply-receipt.schema.yaml`](../../schemas/apply-receipt.schema.yaml) |
| review | `review.md` | — |
| grade | `grade.md`, finalized `index.tsv`, `current/<slice>.md` | — |

`resume-index.yaml` is updated by every phase. It is the durable resume point. Its schema requires `plugin_version`, `doctrine_version`, `slice`, `started_at`, `updated_at`, `latest_phase`, `next_allowed_phase`, `artifacts[]`, and `gates_passed[]`. Optional `blockers[]` captures any halt reason.

Layout under `<target>/.workflow-context/`:

```
.workflow-context/
  resume-index.yaml
  repo-profile.yaml
  capabilities.tsv
  inventory.tsv
  classifications.tsv
  plan.yaml
  evals.md
  before-evals.md
  after-evals.md
  cross-tool-results.md
  apply-receipt.yaml
  apply-blockers.yaml      # only on regression
  enrich-receipt.yaml      # only if enrich ran
  review.md
  grade.md
  index.tsv                # finalized in grade
  current/<slice>.md       # finalized in grade
```

## Prerequisites

- Target repo has a clean git working tree.
- No uncommitted AI context changes — the migration produces two clean commits and they must be reviewable on their own.
- A human is available for HITL gate review at two points (after `plan`, after `apply`).
- `CRITICAL:` The plugin's `schemas/` directory is readable from the skill. Every phase ends by validating its outputs against the schema for that artifact. Validation is inline shape checking — the skill reads the schema and the artifact and confirms required fields, enums, and types — no separate runtime.

## Phase contract

One line per phase. Doctrine details: [`references/migration-process.md`](../../references/migration-process.md).

- **onboard** — detect tool launchers (Claude, Codex, Cursor), inventory existing context carriers (AGENTS.md, CLAUDE.md, `.claude/commands/`, `.cursor/commands/`, `.cursor/rules/`, `.cursor/skills/`, `.agents/skills/`, `shared-skills/`, BUGBOT.md, hooks, review surfaces), write `repo-profile.yaml` + `capabilities.tsv` + initial `resume-index.yaml`. If a tool launcher is missing, record the run as partial-cross-tool with an explicit reason — never silently skip.
- **plan** — classify every substantive rule (DELETE / GUIDE_ROOT / GUIDE_NESTED / SKILL / SUBAGENT / guardrail recommendation), record `reach` / `activation` / `repo_action` / `rationale` per row, write `inventory.tsv` + `classifications.tsv` + `plan.yaml` + coordinator-owned `evals.md`. The eval set covers discovery, trigger behavior, task or landmine behavior, and regression detection. **HALT — HITL Gate 1.**
- **apply** — run baseline evals against current state into `before-evals.md`, design the target, apply slice changes as a source-only commit (`chore(<slice>): consolidate AI context into canonical containers`), run after-evals into `after-evals.md`, run cross-tool subset into `cross-tool-results.md`, then write `apply-receipt.yaml` linking the commit SHA, file deltas, and the before/after matrix. **HALT — HITL Gate 2** if no regressions. If any regression, write `apply-blockers.yaml` and HALT before any further phase.
- **enrich** (optional, additive only) — research conventions enforced in practice but missing from current context; test each candidate against the migration baseline; keep only candidates that improve the eval matrix without regression; write `enrich-receipt.yaml`. Apply is move-only — new domain conventions belong here, not in apply.
- **review** — spawn a fresh subagent with no apply-phase context; check the real repo diff (not just the plan) for scope discipline, deleted behavior disguised as cleanup, activation regressions, invented conventions, and stale conflicting files; rerun the highest-risk evals in fresh worktrees; write `review.md`.
- **grade** — spawn a fresh subagent with no apply-phase context; score per-prompt and per-dimension results from recorded evidence; dimensions are `layer`, `type`, `reach`, `activation`; status is `ready` / `blocked` / `partially verified`; any critical or dimension regression sets `blocked`; write `grade.md` and finalize `.workflow-context/index.tsv` + `.workflow-context/current/<slice>.md`.

## Phase advancement protocol

Every phase, in order:

1. Read `<target>/.workflow-context/resume-index.yaml`. Confirm `next_allowed_phase` equals the requested phase. **HALT** if not — explain the mismatch and point at the resume command for the actual next phase.
2. Validate every prior-phase artifact against its schema in `../../schemas/<id>.schema.yaml`. Inline check: load the schema, load the artifact, confirm required fields present, enum values valid, types match. **HALT** if any check fails. Stale or corrupted artifacts force a re-run of their owning phase, not a hand edit.
3. Run the phase work (see doctrine for what each phase touches).
4. Validate the phase's own output artifacts the same way. **HALT** on any non-zero exit. Do not partial-commit invalid artifacts — they pollute the resume state.
5. Update `resume-index.yaml` atomically — write to a temp file, fsync, rename. New `latest_phase`, new `next_allowed_phase`, append each new artifact with `path`, `sha256` (computed over file bytes), `phase`, `kind`. `updated_at` advances on every write.
6. Commit the `.workflow-context/` artifact updates to git. Source consolidation changes (in `apply`) are a separate commit per the rule below.

**Commit shape rule.** Source consolidation changes in `apply` are a separate commit from `.workflow-context/` artifact updates. Two commits, in order:

```
chore(<slice>): consolidate AI context into canonical containers
chore(<slice>): record migration artifacts
```

Never combine them. The first commit must be reviewable on its own diff.

## HITL gate protocol

Two gates. The skill writes artifacts, prints the next-step instruction verbatim, then halts. No phase advance until the human runs the resume command.

**After `plan`:**

```
HALT — HITL Gate 1
Review:
  - <target>/.workflow-context/classifications.tsv
  - <target>/.workflow-context/plan.yaml
  - <target>/.workflow-context/evals.md
When approved, run: /migrate-context resume
```

**After `apply` (no regressions):**

```
HALT — HITL Gate 2
Review the before / after / cross-tool matrix in:
  - <target>/.workflow-context/apply-receipt.yaml
When approved, run: /migrate-context resume
```

**After `apply` (any regression — after-evals do not meet or exceed before-evals on every prompt):**

```
HALT — apply regressions detected
See: <target>/.workflow-context/apply-blockers.yaml
Reconcile and re-run apply. Review cannot run on a regressed apply.
```

The skill never grades through a regression. The doctrine's "after >= before on every prompt" rule carries forward unchanged.

## Role separation

The doctrine names five roles (coordinator, implementer, reviewer, adversarial reviewer, eval grader). In plugin mode:

- The skill caller is the **coordinator**.
- The skill body is the **implementer** for `apply` and the **enricher** for `enrich`.
- `review` and `grade` **MUST** spawn fresh subagents with no shared context from `apply`. Same harness, isolated execution. This is the minimum role separation the "implementer does not grade its own work" invariant requires.

If the host harness does not support subagents with isolated context, the skill records this in `resume-index.yaml` under `blockers` and labels `grade.md` as `self-graded — not independently verified`. Do not silently downgrade — the limitation has to be visible in the receipt trail.

## Landmines

- **Skipping HITL gates.** Both gates are non-negotiable. Auto-advance is a regression to "looks clean, broke activation". The skill must print the halt block verbatim and stop tool use until the resume command runs.
- **Combining source + artifact commits.** Two commits. The source commit must be reviewable in isolation — a reviewer who only sees that diff should be able to judge the consolidation without reading run artifacts.
- **Re-grading on the apply context.** `review` and `grade` on a context that saw apply work violates role separation. Always fresh subagents. If the harness cannot guarantee isolation, label the output `self-graded — not independently verified` and record a `blockers` entry.
- **Silently advancing past a regression.** If `after_evals_passed < before_evals_passed` on any prompt, write `apply-blockers.yaml` and HALT. The doctrine treats this as a hard halt; the skill enforces it before writing `apply-receipt.yaml`.
- **Inventing new domain facts in apply.** Apply is move-only. Strengthen wording for activation; do not introduce conventions that were not previously documented in some carrier. New conventions belong in `enrich` where each one is tested against the migration baseline.
- **Trusting frontmatter `paths` for skill activation.** Forbidden. Path hints belong in `description` text. See [`../../references/framework.md`](../../references/framework.md) and the `create-skill` skill.
- **Treating manual invocation as success.** A skill that only works when explicitly invoked has weak activation. The eval set must include discovery and trigger-behavior prompts, not just task prompts.
- **Editing `resume-index.yaml` by hand.** Every mutation goes through the phase advancement protocol. Hand edits break the sha256 trail and the gate accounting in `gates_passed[]`.
- **Letting the slice scope drift mid-run.** The slice is fixed at `onboard`. Adding paths or carriers mid-run invalidates the baseline. If scope changes, end the current run with a `blockers` entry and start a new slice.

## Resume + recovery

The skill is session-loss tolerant. Everything needed to continue is in `<target>/.workflow-context/`.

To resume a stalled run:

1. Read `<target>/.workflow-context/resume-index.yaml`.
2. Inspect `latest_phase`, `next_allowed_phase`, `blockers[]`, and `gates_passed[]`.
3. If `next_allowed_phase` is `done`, the run is closed — start a new slice instead of mutating this one.
4. If `blockers[]` is non-empty, reconcile each blocker before any phase advance. The schema requires `phase`, `description`, `created_at` per blocker so root cause is recorded.
5. Re-run the phase named in `next_allowed_phase`. The phase advancement protocol re-validates prior artifacts before doing any work, so a corrupted artifact halts the resume before damage compounds.

The two HITL gates are recorded in `gates_passed[]` with `gate_id`, `passed_at`, `reviewer`. A resume after a gate is only valid if the matching gate entry is present. Missing gate entry plus `latest_phase` past the gate means the run was advanced incorrectly — start over rather than paper over it.

## Validation

Mechanical checks that hold every phase:

- Every phase ends with an inline shape check on each of its outputs against the matching schema in `../../schemas/`. The skill reads the schema, reads the artifact, confirms required fields, enum membership, and types. No artifact is committed before its shape check passes.
- `resume-index.yaml` `latest_phase` advances monotonically forward through the enum `onboard → plan → apply → enrich → review → grade`. The skill rejects any rewrite that moves `latest_phase` backward; rollback is a new run, not an in-place edit.
- The apply phase's source consolidation commit, when filtered to source context paths (AGENTS.md, CLAUDE.md, `.cursor/rules/`, `.cursor/skills/`, `.claude/skills/`, `.agents/skills/`, BUGBOT.md, related shims), has `files_deleted >= files_added`. Sprawl reduces. This is the doctrine's verification heuristic and the skill enforces it before writing `apply-receipt.yaml`. If `files_added` exceeds `files_deleted`, the skill halts with an explanation and asks whether the additions are actually consolidation targets or smuggled enrichment.
- The regression halt is enforced: any `regressions[]` entry in `apply-receipt.yaml` blocks the transition to `review`. The blocker file `apply-blockers.yaml` enumerates each regressing eval with its before status, after status, and a short diff summary so reconciliation can target the root cause.
- `resume-index.yaml` `plugin_version` and `doctrine_version` are written from [`../../references/_doctrine.yaml`](../../references/_doctrine.yaml). Mismatches between a stored run and the current plugin version surface a `blockers` entry; the human decides whether to resume or restart.
- Cross-tool coverage is recorded explicitly. Every prompt in the cross-tool subset has a `pass` / `fail` / `unavailable` result with a `reason` when `unavailable`. A silent skip is treated as a validation failure.

## References

- [`../../references/migration-process.md`](../../references/migration-process.md) — full 12-phase doctrine plus the "Plugin Pipeline Mapping" appendix that defines the 6-phase collapse this skill implements.
- [`../../references/framework.md`](../../references/framework.md) — the four primitives and the decision order (discover → enforce → guide → skill → subagent) the classification step uses.
- [`../../references/_doctrine.yaml`](../../references/_doctrine.yaml) — pinned `plugin_version`, `doctrine_version`, schema list, and forbidden-string set.
- [`../../schemas/`](../../schemas/) — every artifact this skill writes validates against a schema here.
- [`../../schemas/`](../../schemas/) — every artifact this skill produces validates against a schema here via inline shape check. No runtime dependency on the consumer side.
