# Autonomous Loop Protocol

Full spec for Phase 3. Assumes Phase 1 (discovery) and Phase 2 (setup + baseline) are done.

## Loop Invariants

Before every iteration, these must hold. If any is violated, HALT.

- Tree is clean (no uncommitted changes from prior step).
- Guard command still passes at current HEAD.
- `$STATE_DIR/results.tsv` is append-writable (state dir resolved per `references/results-logging.md`).
- Scope globs still match at least one file.
- Locked config (goal, verify_mode, rubric, judge_runs, etc.) has not been mutated.

## Step 1: REVIEW

Read, in order:
1. Last 10-20 rows of `$STATE_DIR/results.tsv`
2. `git log -n 20 --oneline` to see recent kept commits
3. In-scope files that were modified in the last 3 `keep` iterations
4. The last reviewer-pass report if one exists (`$STATE_DIR/reviews/iter-<latest>.md`)

Do NOT re-read unchanged files every iteration — too expensive. Re-read only when invariants change or after a reviewer-pass.

## Step 2: IDEATE

Pick ONE change. Bias toward:
- Ideas the reviewer-pass flagged as unexplored
- Variations of successful `keep` iterations
- Opposites of repeated `discard` patterns

Avoid:
- Repeating a change already logged
- Touching files outside scope
- Combining two ideas into one commit

If no idea is obvious, apply the "when stuck" recovery (SKILL.md Phase 3).

## Step 3: MODIFY

Atomic, minimal diff. No drive-by cleanups. No style changes unrelated to the hypothesis. If you find yourself touching > 5 files, reconsider — the change is probably too big.

## Step 4: COMMIT

```
git add <modified files — enumerate, do NOT use -A>
git commit -m "experiment: <description>"
```

Commit message is the same string that goes in the TSV `description` column. Commit MUST happen before verify — Rule 3.

## Step 5: VERIFY

### Command Mode
- Run `verify_command` with cache-bust flags.
- Extract metric — single float from stdout. If the command outputs multiple numbers, the config must specify extraction (e.g., `| awk '{print $2}'`). No silent assumptions.
- On non-zero exit → treat as CRASH, go to Step 8 with `decision=crash`.

### Judge Mode
- Run `generate_command`, capture stdout.
- Spawn `judge_runs` independent Sonnet subagents (parallel). Each scores per `references/llm-judge-protocol.md`.
- Take median of `weighted_total`. That's the metric.
- If any subagent returns malformed JSON, retry that run once. Second failure → CRASH.

## Step 6: GUARD

If `guard_command` is configured:
- Run it.
- Exit 0 = pass. Non-zero = fail.
- Guard runs every iteration. No skipping (red flag in SKILL.md).

## Step 7: DECIDE

Apply in order:

1. Verify crashed → try to fix (max 3 attempts on in-scope files). Still crashing → `git reset --hard HEAD~1`, log `crash`.
2. Guard failed → rework up to 2x (only on in-scope files, never guard files). Still failing → revert, log `discard_guard`.
3. Metric improved (delta > 2% in favorable direction OR metric unchanged AND diff_loc < 0) AND guard passed AND complexity gate passed → `keep`. Commit stays. This becomes the new best.
4. Otherwise → revert, log `discard`.

**Complexity gate (Rule 7):**
- `delta_pct| < 2%` AND `diff_loc > 50` → DISCARD regardless of direction.
- `delta_pct == 0` AND `diff_loc < 0` → KEEP (code removal without regression is always valuable).

**Revert:**
```
git reset --hard HEAD~1
```
After revert, verify tree is clean and guard passes. If not, the baseline or prior state was broken — HALT, alert user.

## Step 8: LOG

Append one row to `$STATE_DIR/results.tsv` per `references/results-logging.md`. Atomic append.

## Step 9: REVIEWER PASS (Every 20 Iterations)

When `iter % 20 == 0` and iter > 0:

Spawn a Sonnet subagent with:
- Last 20 rows of the TSV
- Current best metric, baseline metric
- The goal
- Locked rubric (judge mode) or verify command (command mode)
- `git log --since=<iter-20 timestamp> --name-only`

Ask the reviewer:
1. **Gaming detection:** Did any iteration modify guard/test/rubric files? Did any iteration change cache-bust flags? Did judge scores cluster suspiciously?
2. **Local maxima:** Is the keep rate < 20% for the last 20 iters? Has the metric plateaued (delta < 1% across 20 iters)?
3. **Unexplored clusters:** Which file types / change families are absent from the log? Name 3 concrete untried directions.

Reviewer writes `$STATE_DIR/reviews/iter-<N>.md` with findings. The main loop appends a `review` row to the TSV summarizing in one line.

If the reviewer flags gaming → HALT. The user investigates. Do NOT auto-revert gaming rows — evidence.

## Status Updates

- Every 5 iters: one-line status (`iter 15: metric=11.2 (-9.7% vs baseline), last=keep`)
- Every 10 iters: summary block (baseline → current best, keeps/discards/crashes counts, last 5 decisions)

## When Stuck: >5 Consecutive Discards

Trigger recovery:
1. Re-read ALL in-scope files from scratch — assumptions may be stale.
2. Re-read original goal verbatim.
3. Scan full results log for patterns: which change families always fail? Which succeeded early and haven't been revisited?
4. Try combining TWO previously successful changes.
5. Try the OPPOSITE of the most-repeated discard.
6. Try a radical architectural change.
7. If 10 consecutive discards → HALT. Alert user. The metric or scope may be saturated.

## Termination

The loop runs forever unless:
- User interrupts (Ctrl-C or /loop boundary hit)
- 10 consecutive discards after recovery (saturation)
- Reviewer flags gaming (halt for investigation)
- Guard command starts failing at HEAD before any modify step (repo broken — HALT)
- Disk / tooling error that can't be fixed in 3 attempts

On clean termination, print final summary from `/autoresearch:status`.

## What NOT To Do

- Ask "should I continue?" — never. Rule 10.
- Silently skip verify or guard steps — never.
- Modify the config, rubric, weights, or judge_runs after Phase 2 — never.
- Truncate or edit the results log — never. Rule 7 in red-flags table.
- Batch two ideas into one commit to "save iterations" — never. Rule 2.
