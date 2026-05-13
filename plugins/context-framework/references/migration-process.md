# Context Migration: Process & Architecture

## The Problem

AI context in a mature repo tends to sprawl across agent-facing files and tool-specific surfaces: AGENTS.md, CLAUDE.md, .cursor/rules/*.mdc, .cursor/skills/, shared-skills/, BUGBOT.md, workflow commands, and one-off shims. Some of that context is still valuable. A lot of it is duplicated, stale, over-scoped, or better enforced somewhere else.

The failure mode is not just mess. The real risk is activation regression: a migration makes the files look cleaner, but the agent no longer gets the right context at the moment it matters.

This pipeline is the operational companion to the context engineering framework. The framework defines the primitives. This process explains how to migrate a real repo toward them without losing behavior.

This pipeline treats migration as a behavior-preserving consolidation problem:

- remove what the agent can already discover from code
- push enforceable rules toward guardrails and CI
- consolidate surviving place-based truths into guides
- consolidate surviving work-based expertise into portable skills
- prove the result works the same as or better than the previous system

The target is a repo-first system where context is durable, reviewable, and available when the agent needs it.

## Scope Note

This full process is intended for meaningful repo or slice migrations where activation, cross-tool behavior, and evidence matter. Smaller context edits can borrow the same principles without running every phase.

Migration is consolidation. It should preserve behavior first, reduce sprawl second, and avoid inventing new domain facts. Additive improvements belong in the separate enrichment loop.

## Design Principles

- **Behavior parity beats tidiness.** A migration is successful only if the new system works the same as or better than the old one.
- **Developer experience is part of correctness.** Context should load during normal work. Manual invocation is fallback, not the bar.
- **Git-tracked repo state is the source of truth.** Migration status lives in committed repo files and `.workflow-context/`, not private scratchpads.
- **The implementer does not grade its own work.** The coordinator writes evals. Fresh review, adversarial review, and grading happen after apply.
- **Move first, enrich later.** `domain-migrate` only moves existing content into stronger containers. New conventions belong to a separate enrichment loop.
- **Cross-tool or it didn't happen.** Claude, Codex, and Cursor all matter. A migration is not fully verified unless the critical prompts work across tools or the missing verification is explicitly recorded.
- **Activation is a first-class design constraint.** The canonical location is wrong if it makes the agent less likely to see the rule.

## Canonical Containers

- **Root or nested `AGENTS.md`**: place-based truths discovered by repo or path context
- **Portable skills**: `.agents/skills/<name>/SKILL.md` for work-based expertise that should follow the task, not the folder
- **Tool-specific files**: thin shims or activation-specific glue only
- **`guardrail-specs.md`**: transitional backlog for prose rules that should become lint, hook, typecheck, test, or CI enforcement later

`guardrail-specs.md` is not a durable context primitive. It is where we park rules that are still written in prose only because the stronger enforcement layer does not exist yet.

## Pipeline

Preflight -> Inventory -> Plan -> Baseline -> Apply -> Verify -> Review -> Closeout

Twelve operational phases, two human gates, and separated roles:

- coordinator
- implementer
- reviewer
- adversarial reviewer
- eval grader

These roles may be performed by humans, agents, or subagents when the harness supports isolated execution. The important part is separation of responsibility: the same worker should not implement, grade, and bless its own migration.

### Phase 0: Capability Preflight + Audit Intake

Goal: establish slice boundary, repo tooling, and verification capability before touching context.

The migration starts by defining the slice precisely, reading any prior onboarding or audit artifacts, and detecting what eval runners are actually available for Claude, Codex, and Cursor.

**What it reads**

- `.workflow-context/repo-profile.md` if present
- prior audit artifacts for the slice
- existing context carriers touching the slice
- available launchers or native CLIs for cross-tool evals

**What it produces**

- `capabilities.md`
- optional `audit-intake.md`

If some tools are unavailable, the run is downgraded to partial-cross-tool or manual-cross-tool. That is acceptable only when recorded explicitly.

### Phase 1: Inventory + Classification

Agent: Implementer

One worker inventories all agent-facing context that touches the slice and classifies each substantive rule.

**Context carriers in scope**

- AGENTS.md
- CLAUDE.md
- .claude/commands/*.md
- .cursor/commands/*.md
- .cursor/rules/*.mdc
- .cursor/skills/*
- .agents/skills/*
- shared-skills/*
- BUGBOT.md
- other review, hook, or workflow surfaces carrying agent-facing rules

**Classification model**

Each rule becomes one of:

- DELETE
- GUARDRAIL_SPEC
- GUIDE_ROOT
- GUIDE_NESTED
- GUIDE_GLOB
- SKILL

Every row records:

- reach
- activation
- repo_action
- rationale

**Output artifacts**

- `inventory.tsv`
- `classifications.tsv`

This is the proof table for the whole migration. If the classification is weak, everything downstream gets weaker.

### Phase 2: Migration Plan + Coordinator-Owned Evals

Agent: Coordinator

The coordinator does not read source files to implement the change. It reads the migration artifacts and writes the plan and exam.

**What it writes**

- `migration-plan.md`
- `evals.md`

The eval set covers at least:

- discovery
- trigger behavior
- task or landmine behavior
- regression detection

Every eval declares explicit targets:

- layer
- reach
- activation

Missing targets block the plan.

### HITL Gate 1: Plan + Evals

Before anything is migrated, the human reviews:

- the classification table
- the migration plan
- the eval prompt set

Stop. Wait for approval.

This gate exists because a bad classification or weak eval set can make the rest of the run look "successful" while testing the wrong thing.

### Phase 3: Plan Review

Agent: Reviewer

A fresh reviewer checks the plan before apply.

**Review focus**

- are the classifications defensible?
- are important gates and landmines preserved?
- does the plan weaken activation?
- do the evals actually test the important behavior?
- is tool capability detection explicit?

**Output**

- `review.md`

If plan review finds issues, the plan is fixed before baseline evals run.

### Phase 4: Before Evals (Baseline)

Goal: measure the current system before the slice changes.

This is the old-world baseline. The scattered current context might be ugly, but if it protects important behavior today, the migration has to preserve that.

**Protocol**

- one fresh worktree per eval
- Sonnet as the baseline model floor
- same prompt set reused later for after-evals
- launcher strategy recorded in `capabilities.md`

**Output**

- `before-evals.md`

One regression later is impossible to judge honestly if this baseline was never captured.

### Phase 5: Target Design

Goal: define the consolidated target state before rewriting files.

The migration decides:

- which truths belong in root or nested guides
- which expertise becomes portable skills
- which tool-specific files shrink into shims
- which rules stay tool-specific because they materially improve activation
- which prose rules are future guardrails instead of durable context

This phase is move-only. It may strengthen wording for activation, but it does not invent new domain facts.

### Phase 6: Apply

Agent: Implementer

The implementer applies the slice-scoped changes directly in the repo.

**What it does**

- writes or updates canonical guides
- writes or moves portable skills
- rewrites shims down to pointers
- deletes dead or duplicate context
- preserves behavior-sensitive gates and triggers
- records what changed in `receipt.md`

**Commit shape**

This phase ends with the source consolidation commit:

```
chore(<slice>): consolidate AI context into canonical containers
```

This commit contains source context changes only. It does not include `.workflow-context/` run artifacts.

**Verification heuristic**

When restricted to source context paths, files deleted should be greater than or equal to files added. The migration should reduce sprawl, not add a new parallel layer of source context.

### Phase 7: After Evals

Goal: run the same eval set against the migrated slice.

After-evals use the same prompts as the baseline, but now run against the migration branch.

**Gate**

After must be greater than or equal to Before on every prompt.

When something regresses, debug in this order:

- contamination
- discovery
- turn budget
- content

**Output**

- `after-evals.md`

### Phase 8: Cross-Tool Evals

Goal: prove the migrated context works outside the host tool.

Cross-tool verification runs after-only checks in Codex and Cursor using the highest-value prompt subset from the coordinator-owned eval set.

This is not just "does the file exist?" It is real content verification focused on:

- discovery
- trigger behavior
- landmines
- regressions

**Output**

- `cross-tool-results.md`

If a tool cannot be exercised, record UNAVAILABLE with the reason. Do not silently skip it.

### HITL Gate 2: Full Eval Matrix

Before final grading and closeout, the human reviews the populated matrix:

| Eval | Claude Before | Claude After | Codex After | Cursor After |

Every cell must have a grade or an explicit UNAVAILABLE reason.

Stop. Wait for approval.

### Phase 9: Eval Grade

Agent: Eval Grader

A fresh grader scores the migration from recorded evidence.

**It grades**

- per-prompt results
- per-dimension results
- blind spots between tools

**Dimensions**

- layer
- type
- reach
- activation

**Output**

- `eval-grade.md`

Completion status is one of:

- ready
- blocked
- partially verified

Any critical regression blocks ship. Any dimension regression blocks ship.

### Phase 10: Post-Apply Review

Agent: Reviewer

A fresh review checks the real repo diff, not just the plan.

**Review focus**

- scope discipline
- deleted behavior disguised as cleanup
- activation regressions
- invented conventions
- quality of repo-local continuation artifacts

**Output**

- `review.md`

### Phase 11: Adversarial Review

Agent: Adversarial Reviewer

The adversarial reviewer tries to break the migration.

**Required checks**

- rerun the highest-risk evals in fresh worktrees or sessions
- run negative probes against gates and exclusions
- search for stale conflicting files or triggers
- verify that retained tool-specific files are still justified

**Output**

- `adversarial-review.md`

This phase exists to catch the "looks good in the happy path" failures that normal review misses.

### Phase 12: Closeout

Goal: make the migration durable and resumable from repo state alone.

The run is finalized by updating:

- `.workflow-context/current/<slice>.md`
- `.workflow-context/index.tsv`
- `handoff.md`
- `guardrail-specs.md`

The run artifacts are then committed in a second and final migration commit:

```
chore(<slice>): record migration artifacts
```

This artifact commit includes the full run directory, the slice status pointer, and the index append. It is the durable evidence trail for continuation and review.

## Portable Skill Activation Rules

Skill activation is one of the easiest places to regress a migration.

For portable skills:

- canonical home is `.agents/skills/<name>/SKILL.md`
- frontmatter is only `name` and `description`
- `description` is the primary proactive activation surface
- descriptions start with `Use when ...` and match real developer task phrasing
- `paths` frontmatter is forbidden
- path and file hints belong in description text, not frontmatter
- prerequisite checks use `CRITICAL:` in the description plus defense in depth in guides

For critical prerequisite checks, use all three layers:

- skill description
- named root AGENTS.md gate
- nested guide pointer

Manual invocation is fallback. If a skill only works when explicitly invoked, activation is weak.

## Repo-First Artifact Model

Migration state is stored in the repo:

```
.workflow-context/
  repo-profile.md
  index.tsv
  current/<slice>.md
  runs/<slice>-<timestamp>/
    capabilities.md
    inventory.tsv
    classifications.tsv
    evals.md
    migration-plan.md
    before-evals.md
    after-evals.md
    cross-tool-results.md
    review.md
    adversarial-review.md
    eval-grade.md
    guardrail-specs.md
    receipt.md
    handoff.md
```

This is the continuation model. Another operator should be able to resume the slice by reading the repo, even if the original session transcripts are gone.

## Optional Follow-On: Enrich

`workflow-context:enrich` is a separate pipeline that runs only after a verified migration.

Its job is different:

- add conventions enforced in practice but missing from current context
- test each addition against the migration baseline
- keep only candidates that improve the eval matrix without regression

Migration is consolidation. Enrichment is additive research. They are intentionally separate so behavior-preserving cleanup does not get mixed with speculative improvements.

---

## Plugin Pipeline Mapping (context-framework v0.1)

The `migrate-context` skill in this plugin collapses the 12-phase doctrine into 6 internal phases. Each phase reads and writes schema-validated artifacts in `<target>/.workflow-context/`. State survives session loss via `resume-index.yaml`.

| Doctrine phase | Plugin phase | Inputs | Outputs |
|---|---|---|---|
| Phase 0 (Preflight + Audit Intake) | `onboard` | repo tree, prior artifacts | `repo-profile.yaml`, `capabilities.tsv`, `resume-index.yaml` |
| Phase 1 (Inventory + Classification), Phase 2 (Plan + Evals), Phase 3 (Plan Review), HITL Gate 1 | `plan` | onboard outputs, context carriers | `inventory.tsv`, `classifications.tsv`, `plan.yaml`, `evals.md` |
| Phase 4 (Before), Phase 5 (Target Design), Phase 6 (Apply), Phase 7 (After), Phase 8 (Cross-Tool), HITL Gate 2 | `apply` | plan.yaml | source consolidation commit, `apply-receipt.yaml`, `after-evals.md` |
| Optional Follow-On (Enrich) | `enrich` | apply-receipt | `enrich-receipt.yaml` (additive diffs only) |
| Phase 10 (Post-Apply Review), Phase 11 (Adversarial Review) | `review` | apply-receipt, real repo diff | `review.md` |
| Phase 9 (Eval Grade), Phase 12 (Closeout) | `grade` | all prior artifacts | `grade.md`, finalized `.workflow-context/` |

### Role separation in plugin mode

The doctrine names five separated roles (coordinator, implementer, reviewer, adversarial reviewer, eval grader). In plugin mode, the skill caller is the coordinator. The skill itself is the implementer for `apply` and the enricher for `enrich`. Review and grade phases spawn fresh subagents — same harness, no shared context with the apply phase. This is the minimum role separation required to keep the "implementer does not grade its own work" invariant.

### HITL gates

Two gates survive the collapse:

- **After `plan`** — human reviews `classifications.tsv`, `plan.yaml`, `evals.md`. The skill writes the artifacts, then halts and prints next-step instructions. No phase advance until the human runs the resume command.
- **After `apply`** — human reviews the full before/after/cross-tool matrix. Same halt-and-resume pattern.

### Activation regression as a first-class failure

The mechanical halt rule from the doctrine carries forward unchanged: if `apply` produces a build where after-evals do not meet or exceed before-evals on every prompt, the phase blocks. The skill writes `apply-blockers.yaml` listing the regressions and halts. The team must reconcile before `review` runs.
