# LLM Judge Protocol

Judge mode scores soft metrics (writing quality, API design, diff readability) via isolated LLM subagent. Locked at Phase 2 — NEVER modify rubric, weights, exemplars, or judge_runs mid-loop.

## When to Use Judge Mode

Use command mode whenever a shell command can output a number. Use judge mode ONLY when:
- The metric requires taste (e.g., "better error message", "cleaner API")
- No deterministic scorer exists
- A rubric can make the scoring reproducible

Red flag: if you can express the metric as a regex count, line count, or benchmark number, use command mode.

## Rubric Format

Rubric is a markdown file with weighted criteria. Total weights must sum to 1.0.

```markdown
# Rubric: <goal>

## Criteria

### Clarity (weight: 0.4)
Score 1-10 on whether a first-time reader understands what the function does without reading its body.
- 10: Name and signature fully convey intent
- 5: Requires reading docstring
- 1: Requires reading implementation

### Correctness (weight: 0.4)
Score 1-10 on whether the output handles the documented contract.
- 10: Handles all documented inputs, edge cases named
- 5: Handles happy path, edge cases unclear
- 1: Incorrect for stated inputs

### Economy (weight: 0.2)
Score 1-10 on code-to-value ratio.
- 10: Minimum viable surface area
- 5: Some extraneous abstraction
- 1: Gratuitous layers
```

Weighted score = sum(weight_i * score_i). Range: 1.0 - 10.0.

## Exemplars (Optional)

If an `exemplars_dir` is provided:
- `exemplars/gold/` — expected 9-10 scores
- `exemplars/trash/` — expected 1-3 scores

The judge is shown exemplars before scoring the candidate to anchor the scale. If the judge scores a gold exemplar < 7 or a trash exemplar > 4 during calibration, emit a warning to the results log and halt — the rubric is ambiguous.

## Subagent Invocation

Spawn a Sonnet subagent per judge run. The subagent sees ONLY:
- The rubric file
- The exemplars (if any)
- The candidate output (from `generate_command` stdout)
- Goal text

The subagent does NOT see:
- Prior iterations
- The results log
- Git history
- The current loop state

This isolation prevents score drift across iterations.

Prompt template:
```
You are scoring a candidate output against a weighted rubric. Do not invent criteria. Score each criterion 1-10 exactly as the rubric defines.

<rubric>
{rubric_markdown}
</rubric>

<exemplars optional>
Gold (expected 9-10):
{gold_exemplar_contents}

Trash (expected 1-3):
{trash_exemplar_contents}
</exemplars>

<goal>
{goal_text}
</goal>

<candidate>
{generate_command_stdout}
</candidate>

Output EXACTLY this JSON schema, nothing else:
{
  "scores": { "<criterion>": <int 1-10>, ... },
  "reasoning": { "<criterion>": "<one sentence>", ... },
  "weighted_total": <float>
}
```

## Multi-Run Median

`judge_runs` (1-5, default 1) controls how many independent judge subagents score each candidate. The loop uses the MEDIAN of their `weighted_total` scores.

Why median, not mean: judges occasionally hallucinate an outlier score. Median absorbs it; mean doesn't.

- 1 run: fast, noisy — fine for coarse optimization
- 3 runs: default for production judge mode
- 5 runs: high-stakes scoring where noise matters more than cost

Never cherry-pick runs. Never re-run if a score looks wrong. The red-flags table in SKILL.md covers this.

## Guard in Judge Mode

Guard command still runs in judge mode. Typical guards:
- `generate_command` exits 0
- Output is non-empty
- Output matches a required schema (e.g., valid JSON)

The rubric itself is NOT the guard. The rubric scores quality; the guard ensures the artifact exists and is well-formed.

## Cost Control

Judge mode is expensive (1+ subagent per iteration × judge_runs). Mitigations:
- Default `judge_runs: 1` unless user specifies
- Keep `generate_command` fast — the subagent reads its stdout
- Keep candidate output small (< 4K tokens ideal)
- Use `/loop` to bound iteration count explicitly

## When Judges Disagree Systemically

If >30% of candidates show high variance across judge runs (stddev > 1.5 on the 1-10 scale), the rubric is the problem. Stop the loop, tell the user, suggest rubric refinement. Do not silently lower `judge_runs` to hide variance.
