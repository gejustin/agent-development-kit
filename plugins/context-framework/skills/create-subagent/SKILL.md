---
name: create-subagent
description: >-
  Use when the user wants a Subagent for isolated context and result-only return
  — phrasing like "subagent for adversarial review", "create a subagent that
  does X", "agent for deep research on Y", "separate agent to verify Z", or
  "fresh-eyes review agent".
  CRITICAL — do not over-delegate. Refuse if the parent needs working memory.
---

# create-subagent

Author a Subagent (`.agents/agents/<name>.md`) for work the parent must delegate because it needs an isolated result, not the journey.

## When to use this skill

Use when the user asks for an isolated investigator, reviewer, verifier, or researcher — work where the parent should consume a single result and discard the intermediate context. Common shapes:

- Adversarial review of a focused diff or design.
- Deep codebase research where the parent only needs the conclusions.
- Fresh-eyes verification of an implementation the parent just produced.
- Parallelizable investigation across packages where each branch is throwaway context.

Do NOT use when:

- The task can be done inline in the parent's context without bloat → write nothing; do the work.
- The need is reusable work-based expertise (procedure, review criteria for a task type) → `create-skill`.
- The need is place-based knowledge about a path → `create-guide`.
- The rule is mechanically enforceable → `create-guardrail-recommendation`.
- The parent needs the intermediate state (file reads, partial edits) → do the work inline.

## Decision check (run before authoring)

A Subagent earns its place only when **isolation improves quality** — see `../../references/framework.md` ("Subagent Standard"). Walk these gates in order:

1. Does the parent need the *result*, not the *working memory* (file reads, false starts, partial state)? If the parent needs the journey → HALT: do the work inline.
2. Is the task narrow enough that one specific result type is the contract? If the mission is broad ("help with frontend") → HALT: this is a Skill or a Guide, not a Subagent.
3. Is this reusable expertise applied to a *task type* rather than an isolated investigation? → HALT: route to `create-skill`.
4. Is this place-based knowledge for a path? → HALT: route to `create-guide`.
5. Will the parent invoke this often enough that the delegation cost is justified, but rarely enough that inlining would bloat context? If neither, HALT.

If any gate routes elsewhere, state the recommendation and stop. Do NOT author a Subagent to "have one on hand." Speculative Subagents become stale and pollute the routing surface for the ones that earn their place.

The framework's `Subagent Standard` summary, paraphrased: narrow mission, explicit inputs and outputs, hard boundaries, review criteria, failure conditions. Anything weaker is not a Subagent yet.

## Interview

Ask all five questions before authoring. HALT until every answer is given. Do not guess.

1. **Mission.** What specific outcome does this Subagent produce? One sentence. If you need two, the mission is too wide.
2. **Inputs.** What must the parent hand in for the Subagent to do the work? Be explicit — no implicit context, no "the agent will figure it out."
3. **Outputs.** What does it return, and *why does the parent only need the result*? If the parent needs the intermediate steps, the answer is no Subagent.
4. **Boundaries.** What must this Subagent NOT do? What is the scope limit? (Over-delegation and scope creep are the failure modes.)
5. **Failure conditions.** When should it halt and escalate rather than guess? (No failure conditions = a Subagent that runs forever on bad input.)

If mission is vague, inputs are implicit, or there are no failure conditions, HALT: the Subagent is not specified enough to author. Push back on the user and re-ask the failing question — guessing here produces a Subagent that drifts.

Example of a well-shaped answer set:

- Mission: "Adversarial review of auth-related diffs for backwards-compatibility risk."
- Inputs: diff URL or patch text; the auth invariants doc path.
- Outputs: markdown report listing each risk, severity, and proposed mitigation. Parent only needs the verdict + risks, not the file-by-file scan.
- Boundaries: no edits, no spawning sub-subagents, no scope beyond auth files.
- Failure conditions: HALT if no diff is provided; HALT if the diff touches more than auth.

## Authoring

1. **Pick a slug.** Short, hyphen-separated, scoped to the mission. `adversarial-auth-review`, not `reviewer`. Becomes the filename and `name:` frontmatter.
2. **Open `../../templates/subagent.md`** and copy it to `.agents/agents/<slug>.md`.
3. **Frontmatter.** `name` and `description` are required and portable. The `description` should read as "when the parent should delegate to this." `model`, `tools`, and `color` are optional and host-dependent — `tools` in particular varies between hosts (Claude `tools` vs other hosts' `allowedTools`). Leave a brief comment noting host-dependence, or omit them and inherit the host default.
4. **Mission.** 1–3 sentences. Narrow. The mission is the strongest guard against scope drift — a wide mission is unfixable downstream.
5. **Inputs / Outputs.** Make the contract explicit. "A summary of what I looked at" is a broken output — name the artifact shape (markdown report, JSON object with fixed keys, file edits, PR). Inputs should read like a function signature: every value the Subagent operates on appears here.
6. **Boundaries.** Non-negotiable. List what the Subagent must NOT do — spawning further Subagents, editing files outside scope, expanding into adjacent reviews, calling out to the network. Over-delegation and scope creep are the dominant failure modes; the Boundaries section is where you stop them.
7. **Review criteria.** Specify the bar the output must clear before the Subagent returns. This is the Subagent's self-check before handing back to the parent.
8. **Failure conditions.** HALT-prefixed. Cover at minimum: missing inputs, out-of-scope work, low-confidence result. Without these, the Subagent will produce confident garbage on bad input.
9. **Final state only.** Describe what the Subagent *does*. No history, no "we used to delegate this to X," no migration notes.

## Landmines

- **Over-delegation.** Spinning up Subagents for everything produces shallow, under-specified work. If the parent could just do it, the parent should just do it. Subagents lose context — every delegation is a context-shaped cost.
- **Wide mission.** "Help with code review" becomes a general-purpose agent that drifts. Narrow to one task type, one result shape. A good test: can you describe the output in one noun phrase?
- **Implicit inputs.** "Knows the codebase" is not an input. If the parent does not hand it in, the Subagent will fabricate. List the inputs the way a function signature would.
- **No failure conditions.** A Subagent without HALT rules will keep going on garbage input and return confident nonsense. Always specify the missing-input and out-of-scope cases.
- **Tool/model frontmatter copied blindly.** Host-specific keys (`tools` vs `allowedTools`) differ across harnesses. Omit when unsure; the host default is usually correct. Add a brief comment if you do set them.
- **Subagents that spawn Subagents.** Allowed only with an explicit boundary condition. Default is no recursion — recursion turns delegation cost into delegation tax.
- **Treating Subagents as Skills.** Reusable procedures with criteria belong in a Skill the parent invokes directly. Subagents are for *isolation*, not just *reuse*.
- **Vague description.** The description is the routing surface. If the parent can't tell from one read when to delegate, it won't — and the Subagent dies on the shelf.
- **Skipping review criteria.** Without an explicit bar to clear, the Subagent will return whatever it has when it runs out of steam.

## Activation

A Subagent activates because the *parent* decides to delegate. That means the `description` is read by the parent agent, not by a human. Phrase it as a delegation cue, not a label:

- Good: "Use when the parent has an auth-related diff and needs an adversarial review for backwards-compatibility risk. Returns a markdown risk report."
- Weak: "Auth reviewer."

The description should make the routing decision obvious from a single read. If the parent will not naturally route to this Subagent during normal work, the Subagent is dead context — tighten the description or reconsider whether it should exist.

Note: hosts vary in how they discover Subagents. Some auto-load `.agents/agents/*.md`, some require an explicit allowlist or symlink. The canonical home is `.agents/agents/<slug>.md` per `../../references/framework.md`; tool-specific symlinks live elsewhere and are out of scope for authoring.

## Validation

After writing the file, verify each check in order. Stop at the first failure.

- [ ] File exists at `.agents/agents/<slug>.md`.
- [ ] Frontmatter has `name` and `description`. Other keys are optional.
- [ ] `## Mission` is 1–3 sentences. Not a paragraph.
- [ ] `## Inputs` lists every value the Subagent operates on — no implicit context.
- [ ] `## Outputs` names the artifact shape, not "a summary."
- [ ] `## Boundaries` section is non-empty and lists at least one explicit "Do NOT".
- [ ] `## Failure conditions` section is non-empty and uses HALT-prefixed rules.
- [ ] No `<<placeholder>>` strings remain in the body.
- [ ] Description reads as "when the parent should delegate to this," not a generic label.

If any check fails, HALT and report the failing check. Do not silently fix and continue — the user needs to see what the Subagent contract is missing, and a half-specified Subagent is worse than none.
