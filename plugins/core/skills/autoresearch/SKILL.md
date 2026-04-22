---
name: autoresearch
description: Autonomous goal-directed optimization loop. Discover repo tooling, define a metric, then iterate: modify -> commit -> verify -> keep/revert. Supports mechanical metrics (shell commands) and soft metrics (LLM-as-judge with weighted rubrics). Works in any repo.
version: 2.1.0
---

# Autoresearch — Autonomous Iterative Optimization

Inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch). Constraint-driven autonomous iteration for ANY measurable goal.

**Core idea:** Discover tooling -> Define metric -> Modify -> Verify -> Keep/Discard -> Repeat.

**Two verify modes:**
- `command` (default): Shell command outputs a number. Fast, mechanical, zero ambiguity.
- `judge`: Shell command generates output, LLM subagent scores it against a weighted rubric. See `references/llm-judge-protocol.md`.

## Subcommands

| Subcommand | Purpose |
|------------|---------|
| `/autoresearch` | Discovery + autonomous loop (default) |
| `/autoresearch:plan` | Discovery-only — detect tooling, suggest targets, output config |
| `/autoresearch:status` | Print current results log summary |

## When to Activate

- User invokes `/autoresearch` → run discovery then loop
- User invokes `/autoresearch:plan` → run discovery only, output suggestions
- User invokes `/autoresearch:status` → read and summarize results log
- User says "optimize", "iterate until done", "keep improving" → run discovery then loop

---

## Critical Rules (Read Before Anything Else)

1. **Discovery first** — never assume tooling. Detect it.
2. **One change per iteration** — atomic. If it breaks, you know exactly why.
3. **Commit before verify** — enables clean `git reset --hard HEAD~1` on failure.
4. **Verification produces numbers** — command mode mechanical, judge mode weighted LLM score. The loop only sees a number.
5. **Automatic rollback** — failed/regressed changes revert instantly.
6. **Guard files are read-only** — never modify test/guard/rubric files to make optimization pass.
7. **Complexity gate (replaces "simplicity wins")** — if metric delta < 2% AND diff > 50 LOC net-added, DISCARD. If metric unchanged AND diff removes code, KEEP.
8. **Git is memory** — agent reads history to learn what works.
9. **Fail-safe** — if anything unexpected happens, revert and stop. Never leave repo broken.
10. **Never ask "should I continue?"** — loop until interrupted or bounded.
11. **Disable caches** — always use discovered cache-bust flags so metrics are real.
12. **Reviewer pass every 20 iterations** — spawn a Sonnet subagent to audit the results log for gaming / local maxima / guard drift. See `references/autonomous-loop-protocol.md`.

## Red Flags (If You Catch Yourself Doing This, Stop)

| Rationalization | Reality |
|-----------------|---------|
| "I'll just tweak the guard once — it's flaky anyway" | Guard modification = instant DISCARD. Fix flakiness as a separate commit before the loop. |
| "Same metric but cleaner code, I'll call it KEEP" | Rule 7 handles this. Don't reinterpret — follow the gate. |
| "The cache-bust flag is slowing things down, I'll drop it" | Caches falsify metrics. Never drop the flag mid-run. |
| "The rubric weights feel wrong, let me adjust" | Rubric is locked at Phase 2. Adjusting mid-run invalidates all prior judge scores. |
| "Skipping the commit this once — the change is tiny" | No commit = no clean revert. ALWAYS commit before verify. |
| "I'll batch these two changes, they're related" | Atomic means one. If both are needed, land change A, verify, then land change B. |
| "Results log is full, I'll truncate it" | Log is memory. Never truncate. Append only. |
| "Guard passed once, I'll skip it this iteration to save time" | Guard runs every iteration. No exceptions. |
| "Judge gave a weird score — re-run until it gives a good one" | Judge runs are locked at config. Take the median of configured runs. No cherry-picking. |

---

## Phase 1: Discovery (Always Runs First)

**Goal:** Detect the repo's tooling with zero hardcoded assumptions. Full protocol in `references/discovery-protocol.md`.

1. **Scan project root** for manifest/config files:
   - `package.json`, `nx.json`, `turbo.json`, `lerna.json` (JS/TS ecosystems)
   - `go.mod`, `go.sum` (Go)
   - `Cargo.toml` (Rust)
   - `pyproject.toml`, `setup.py`, `requirements.txt`, `Pipfile` (Python)
   - `Makefile`, `Justfile`, `Taskfile.yml` (task runners)
   - `Dockerfile`, `docker-compose.yml` (containers)
   - Any other build/config files present

2. **Detect capabilities** from what's found:
   - Build system & build command
   - Test runner & test command
   - Bundler & bundle command (if applicable)
   - Linter & lint command
   - Benchmark runner (if any)
   - Cache-bust flags to disable (e.g., `--skip-nx-cache`, `--force` for turbo)

3. **Measure current baselines** by running detected commands with timing:
   - Build time, test time + pass/fail count, bundle size, lint error count, any other measurable outputs

4. **Present findings interactively** (use AskUserQuestion):
   ```
   == Autoresearch Discovery ==

   Detected: [build system] monorepo with [N] projects

   Measurable targets I can optimize:
   1. Build time for [target] (currently ~Xs) — verify: [command]
   2. Test suite time for [target] (currently ~Xs) — verify: [command]
   3. Bundle size for [target] (currently X KB) — verify: [command]
   4. [Other detected metrics...]

   Or define your own:

   [Command mode — mechanical metric]
     Goal: <what to optimize>
     Verify: <command that outputs a number>
     Direction: higher|lower is better
     Guard: <optional command that must always pass>
     Scope: <file globs to modify>

   [Judge mode — LLM-scored metric]
     Goal: <what to optimize>
     Generate: <command that produces output to stdout>
     Rubric: <path to rubric.md, or define inline>
     Exemplars: <optional directory with gold/trash examples>
     Judge runs: <1-5, default 1>
     Guard: <optional command that must always pass>
     Scope: <file globs to modify>
   ```

5. **Wait for user confirmation** before proceeding to the loop.

---

## Phase 2: Setup (After User Confirms Target)

1. **Lock configuration:**
   - `goal`: What we're optimizing (human-readable)
   - `verify_mode`: `command` or `judge`
   - **If command mode:** `verify_command` (outputs number), `metric_direction` (`higher`|`lower`)
   - **If judge mode:** `generate_command`, `rubric` (see `references/llm-judge-protocol.md`), `exemplars_dir` (optional), `judge_runs` (1-5, default 1), `metric_direction` always `higher`
   - `guard_command`: Optional command that must always pass (exit 0)
   - `scope`: File globs that can be modified
   - `cache_bust_flags`: Any flags needed to disable caching (discovered, not hardcoded)

2. **Read all in-scope files** for full context.

3. **Establish baseline:**
   - Run `verify_command`, extract metric, record as iteration 0.
   - Run `guard_command` if set, confirm it passes.
   - If either fails, stop and ask user to fix before proceeding.

4. **Resolve state dir** — all loop artifacts live OUTSIDE the working repo:
   ```
   STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/autoresearch/$(git rev-parse --show-toplevel | shasum -a 256 | cut -c1-12)"
   mkdir -p "$STATE_DIR/reviews"
   ```
   Contains: `results.tsv`, `config.json`, `reviews/iter-<N>.md`. Never write to cwd. Never modify `.gitignore`.

5. **Create results log** — `$STATE_DIR/results.tsv`. Full protocol in `references/results-logging.md`. Essential schema:

   ```
   iter	timestamp	decision	metric	delta_pct	guard	commit_sha	diff_loc	description
   0	2026-04-20T10:00:00Z	baseline	12.40	0.00	pass	abc1234	0	initial measurement
   1	2026-04-20T10:02:11Z	keep	11.80	-4.84	pass	def5678	-23	inline hot-path function foo
   2	2026-04-20T10:03:45Z	discard	11.82	-0.16	pass	-	0	reverted: delta < 2% (complexity gate)
   ```

   Tab-separated. Append-only. Header row on create. Commit SHA `-` when reverted.

6. **Write locked config** to `$STATE_DIR/config.json` (goal, verify_mode, commands, rubric path, scope, cache flags). Used for resume and status.

7. **Confirm config and go** — print the state dir path so the user can find it, show config summary, then BEGIN THE LOOP.

---

## Phase 3: The Loop

Full protocol in `references/autonomous-loop-protocol.md`.

```
LOOP (FOREVER or until interrupted / bounded by /loop):
  1. REVIEW: Read current state + git log + last 10-20 results log entries
  2. IDEATE: Pick next change based on goal, past results, what's untried
  3. MODIFY: Make ONE focused, atomic change to in-scope files
  4. COMMIT: git add <files> && git commit -m "experiment: <description>"
  5. VERIFY:
     - Command mode: Run verify_command, extract metric number
     - Judge mode: Run generate_command, spawn judge subagent(s), extract weighted score
  6. GUARD: If guard set, run guard_command
  7. DECIDE:
     - Improved (> 2% delta OR net-LOC removed) + guard passed → KEEP
     - Improved + guard failed → REVERT. Rework up to 2x. Still fails → log "discard (guard)"
     - Same/worse OR complexity-gated → REVERT (git reset --hard HEAD~1). Log "discard"
     - Crashed → Try fix (max 3x), else REVERT. Log "crash"
  8. LOG: Append row to $STATE_DIR/results.tsv
  9. EVERY 20 ITERS: Spawn Sonnet reviewer subagent (see references/autonomous-loop-protocol.md)
 10. REPEAT
```

### Status Updates
- One-line status every 5 iterations
- Summary every 10 iterations (baseline -> current, keeps/discards/crashes)

### When Stuck (>5 consecutive discards)
1. Re-read ALL in-scope files from scratch
2. Re-read the original goal
3. Review entire results log for patterns
4. Try combining previously successful changes
5. Try the OPPOSITE of what hasn't worked
6. Try a radical architectural change

---

## /autoresearch:plan

Discovery-only mode. Runs Phase 1, presents findings, does NOT start the loop.

## /autoresearch:status

Resolves `$STATE_DIR` from current repo root, reads `$STATE_DIR/results.tsv`, and prints:
```
=== Autoresearch Status ===
Baseline: {value} → Current best: {value} ({delta})
Iterations: {total} | Keeps: {n} | Discards: {n} | Crashes: {n}
Last 5: keep, discard, keep, crash, keep
Best iteration: #{n} — {description}
```

If no results log found at `$STATE_DIR/results.tsv`, report that no autoresearch session has been run for this repo.
