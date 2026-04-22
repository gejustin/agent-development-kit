# Results Logging

`$STATE_DIR/results.tsv` is the append-only memory of the loop. It is the ONLY canonical record of the run — git history captures code, but not decisions, metrics, or judge scores.

## State Directory

All autoresearch artifacts live outside the working repo:

```
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/autoresearch/$(git rev-parse --show-toplevel | shasum -a 256 | cut -c1-12)"
```

Contents:
- `results.tsv` — the append-only log (this file's subject)
- `config.json` — locked Phase 2 config for resume + status
- `reviews/iter-<N>.md` — reviewer-pass reports

Keyed by hash of repo root path so multiple repos get separate state and the same repo resumes cleanly. NEVER write artifacts into the working tree. NEVER modify `.gitignore`.

## Schema

Tab-separated. Header row on creation. Append-only. Never edit prior rows.

| Column | Type | Meaning |
|--------|------|---------|
| `iter` | int | 0 = baseline, 1..N = experiments |
| `timestamp` | ISO8601 UTC | `2026-04-20T10:00:00Z` |
| `decision` | enum | `baseline` \| `keep` \| `discard` \| `discard_guard` \| `crash` \| `review` |
| `metric` | float | Verify output (command mode) or weighted judge score (judge mode) |
| `delta_pct` | float | % change vs. current best. Negative = lower; positive = higher. Baseline = 0.00 |
| `guard` | enum | `pass` \| `fail` \| `n/a` (no guard configured) |
| `commit_sha` | string | Short SHA if kept, `-` if reverted or crashed |
| `diff_loc` | signed int | Net lines added (positive) or removed (negative) in this experiment |
| `description` | string | One-line human description. No tabs, no newlines. |

## Header Row

```
iter	timestamp	decision	metric	delta_pct	guard	commit_sha	diff_loc	description
```

## Example

```
iter	timestamp	decision	metric	delta_pct	guard	commit_sha	diff_loc	description
0	2026-04-20T10:00:00Z	baseline	12.40	0.00	pass	abc1234	0	initial measurement: nx build api --skip-nx-cache
1	2026-04-20T10:02:11Z	keep	11.80	-4.84	pass	def5678	-23	inline hot-path function foo
2	2026-04-20T10:03:45Z	discard	11.82	-0.16	pass	-	0	reverted: delta < 2% gate (complexity rule 7)
3	2026-04-20T10:05:02Z	discard_guard	10.90	-7.65	fail	-	-45	reverted: tests failed after removing validation
4	2026-04-20T10:06:30Z	crash	-	-	n/a	-	0	build crashed: missing import after extract-method
5	2026-04-20T10:08:14Z	keep	11.10	-5.93	pass	ghi9012	-12	merge duplicate helpers into shared util
6	2026-04-20T10:10:00Z	review	-	-	n/a	-	0	reviewer pass: no gaming detected, 3 unexplored clusters suggested
```

## Append Semantics

- ALWAYS append. Never truncate. Never delete rows.
- If the file does not exist, create it with the header row, then append baseline.
- Use atomic append — open `O_APPEND`, write one row, close. No buffered partial writes.
- Rows are single-line. Escape tabs/newlines in the description field with spaces.

## Decision Values

- `baseline` — iter 0 only. Always recorded first.
- `keep` — metric improved AND guard passed AND complexity gate passed. Commit stays.
- `discard` — metric same/worse OR complexity gate failed. Reverted via `git reset --hard HEAD~1`.
- `discard_guard` — metric improved but guard failed after retry. Reverted.
- `crash` — verify or build threw. Reverted after fix attempts exhausted.
- `review` — reviewer-pass entry (every 20 iters). No metric. Description summarizes findings.

## Reviewer-Pass Artifacts

Every 20 iterations, a Sonnet subagent audits the last 20 rows for:
- Gaming (guard modification, cache-flag drop, rubric drift)
- Local maxima (flat metric, low keep rate)
- Untried clusters (change families absent from the log)

The reviewer writes its full report to `$STATE_DIR/reviews/iter-<N>.md` and appends a single `review` row to the TSV summarizing findings. The full report is NOT in the TSV — keeps the log parseable.

## Parsing

The TSV is trivially parseable by `awk -F'\t'`, `cut`, `csvkit`, Python `csv.DictReader` with `delimiter='\t'`, etc. Never use commas — descriptions will break CSV.

## Status Command

`/autoresearch:status` reads the TSV and prints:
- Baseline metric
- Current best metric (min or max depending on `metric_direction`)
- Delta % best vs. baseline
- Count of iterations, keeps, discards, discard_guards, crashes, reviews
- Last 5 decisions
- Best iteration: iter number + description

If the file has only the header row (or is missing), report "no session found in this directory."

## Recovery

If the TSV gets corrupted (partial row, encoding issue), the loop halts. The user inspects manually — do NOT auto-repair. The log is evidence.
