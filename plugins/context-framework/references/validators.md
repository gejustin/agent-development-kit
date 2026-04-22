# Validators

Per-container conformance checks. The `create-context` skill runs the section matching the authored container before declaring the artifact done.

Each validator has three tiers:

- **Tier 1 — Structural.** Mechanical. Pass/fail.
- **Tier 2 — Quality.** Judgment. Show reasoning with line references.
- **Tier 3 — Design.** Intent, placement, composition.

**Gate rule:** if 2+ Tier 1 checks fail, HALT and surface results. The author fixes structural issues before Tier 2 and Tier 3 run.

---

## Skill validator

Target: any `SKILL.md` the skill authored (portable or plugin-scoped).

### Tier 1 — Structural

1. **Frontmatter present.** `---` fences exist. `name` and `description` fields exist and are non-empty.
2. **Frontmatter allowlist.** Only `name` and `description` appear in frontmatter. Any of `paths`, `when_to_use`, `context`, `agent`, `model`, `globs`, `alwaysApply`, or other tool-specific extensions = fail. `paths` is a documented cross-tool regression; the others are portability footguns waiting to happen.
3. **Description triggers.** Description leads with task verbs (`Use when ...`, `Self-discovers when ...`, `Activate on ...`, or enumerated phrases). Written in third person. Path or file hints, if any, live inside the description text — never in frontmatter.
4. **Description budget.** Description is short enough to preserve matching signal (≤ 3 lines in prose). Long descriptions dilute the activation signal across all three tools.
5. **Size budget.** Body ≤ 1,500 tokens (warn at 300 lines, fail at 500). If `references/` exists, each file ≤ 1,000 tokens (warn at 200 lines, fail at 300).
6. **Placeholder scan.** No `TBD`, `TODO`, `FIXME`, `handle edge cases`, `as needed`, `and so on`, `etc.`, `to be determined`, `placeholder` outside code blocks, anti-rationalization tables, or scan definitions.
7. **Constraints section.** A section headed `Constraints`, `Rules`, `Iron Law`, `Red Flags`, or equivalent enforcement language exists.

### Tier 2 — Quality

1. **Constraint ordering.** Constraints appear before the process/steps section.
2. **Constraint specificity.** Constraints are falsifiable. `do NOT proceed until X`, `HALT after N failures`, `NEVER modify files outside scope` pass. `be thorough`, `follow best practices`, `be careful` fail.
3. **Anti-rationalization coverage.** Discipline skills include an anti-rationalization table or equivalent naming specific shortcuts the agent will try to take. Not required for purely procedural skills.
4. **Observable outcomes.** Process steps specify what to verify, not just what to do. `Run nx test — expected: 0 failures. If failures, stop.` passes. `Review the code for issues.` fails.
5. **Domain knowledge placement.** Domain-specific facts that do not serve workflow logic should live in `AGENTS.md`, not in the skill. Exception: skills targeting repos without `AGENTS.md` may inline sparingly.
6. **Output specification.** The skill specifies what it produces, where the output goes, and in what format.
7. **Pipeline position.** Input and output are identifiable. Standalone skills declare themselves as such.
8. **CRITICAL gate for prerequisite checks.** If the skill enforces a prerequisite check the agent must run before acting, the description includes a `CRITICAL:` line naming it. Without this, proactive matching routinely skips the gate across all three tools.
9. **Defense in depth for prerequisite gates.** Prerequisite checks are also present as a named gate section in root `AGENTS.md` and as a pointer in the relevant nested `AGENTS.md`. Each surface covers a different discovery vector. This is the portable replacement for tool-native priority/load-first mechanisms and is not treated as duplication.

### Tier 3 — Design

1. **Grid placement.** Name the 9×5 cell(s). Domain: one of the 9 categories. Pattern(s): one or more of Tool Wrapper, Generator, Reviewer, Inversion, Pipeline. If the skill lands in many cells, it is too broad.
2. **Pattern composition.** The skill combines 2+ patterns (three laws, law 2). Single-pattern skills are more brittle. Consider adding Inversion (`ask before acting`) — the Inversion column is systematically underinvested.
3. **One concern.** The skill addresses one concern. Skills covering authentication AND authorization AND session management are three skills.
4. **Improvement path.** An eval rubric, a success metric, or a feedback loop exists (three laws, law 3). Skills without measurement paths decay.
5. **Activation vector coverage.** Name which of the four activation vectors the skill relies on (description match, implicit path match, manual invocation, cross-skill reference). Skills that rely only on manual invocation are flagged — strengthen the description.

### Scoring

| Score | Criteria |
|-------|----------|
| **Strong** | All Tier 1 pass. Tier 2 clean or minor. Thoughtful Tier 3. Ship it. |
| **Adequate** | All Tier 1 pass. Tier 2 has addressable issues. Tier 3 not fully resolved but acceptable for scope. |
| **Needs Work** | Tier 1 failures, or significant Tier 2 gaps. Fix before shipping. |
| **Reject** | Missing constraints section, placeholder language throughout, do-everything scope, prompt dump (>500 lines), or no clear trigger. Redesign. |

---

## Guide validator

Target: `AGENTS.md` at root or nested, or glob-scoped rule files.

### Tier 1 — Structural

1. **Scope declared.** The file names its reach: root (repo-wide), nested (path-scoped by location), or glob (scoped by match). Nested `AGENTS.md` does not repeat root content.
2. **Size budget.** ≤ 300 lines at root, ≤ 150 lines nested. Warn at 80% of limit.
3. **No tool-specific rule files.** `CLAUDE.md`, `.cursor/rules/*`, `copilot-instructions.md`, `GEMINI.md`, and similar rule surfaces are absent. Exception: a thin `@import` shim that delegates to canonical `AGENTS.md` with an inline rationale naming what it bridges and when it can be removed. Any tool-specific rule file without that rationale fails this check. Tool *mechanism* surfaces (plugin manifests, hooks, slash commands, MCP config) are out of scope for this check.
4. **Path-scoped activation is portable.** Any rule that applies to a specific path or glob is expressed as a nested `AGENTS.md` at that path, or via path hints inside a skill `description`. Cursor `.cursor/rules/*.mdc` with `globs:` frontmatter is not a portable mechanism — the cross-tool experiment proved that nested `AGENTS.md` at the same path covers the same activation vector across Claude, Cursor, and Codex.
5. **Placeholder scan.** Same placeholder rules as the skill validator.
6. **Discoverable triggers.** Each rule states when it applies (always / on path / on event / on match). Rules without a trigger fail.

### Tier 2 — Quality

1. **Environment over instructions.** Rules that could be a lint, type, or template are flagged for promotion to a guardrail.
2. **Domain language.** Rules use domain verbs (dispatch, load, depart) rather than generic CRUD.
3. **No prose bloat.** Each rule is actionable in one or two sentences. Multi-paragraph rationale is moved to a referenced document.
4. **Override clarity.** If a nested `AGENTS.md` overrides root guidance, the override is explicit and justified.

### Tier 3 — Design

1. **Distribution.** Content is at the right level. Repo-wide truths at root, path-specific truths nested, match-specific truths in glob rules.
2. **Delete audit.** Any rule the agent could discover from code, types, or tests is a candidate for deletion unless it captures a known failure mode.

---

## Guardrail-spec validator

Target: a `guardrail-spec.md` authored for a rule that should be machine-enforced but is not yet implemented.

### Tier 1 — Structural

1. **Rule stated.** The rule is one sentence, imperative, falsifiable.
2. **Enforcement mechanism named.** Lint, typecheck, CI, hook, formatter, or harness hook is named explicitly.
3. **Example violation.** A concrete example of a violating repo state exists.
4. **Example pass.** A concrete example of a passing repo state exists.
5. **Migration path.** The path from "spec exists" to "spec is enforced" is named — tool, package, owner, or target PR.

### Tier 2 — Quality

1. **No ambiguity.** The example violation and pass are unambiguous; a reviewer can decide without context.
2. **Scope declared.** The spec names which files or paths it applies to.
3. **Cost realistic.** The migration path is a unit of work someone could accept in a week, not a multi-quarter rewrite.

### Tier 3 — Design

1. **Right container.** Is this truly machine-enforceable, or is it actually a guide? If enforcement requires human judgment, it is a guide.
2. **Composability.** Does the spec compose with existing guardrails (same tool, same CI job) or fork a new surface?

---

## Reporting format

The skill writes validator output into the artifact's evidence sidecar. Format:

```
## Validator: <skill | guide | guardrail-spec>

### Tier 1
- <check>: PASS / FAIL — <detail>
...

### Tier 2
<findings with line refs>

### Tier 3
<placement, composition, scope, improvement path>

### Score: Strong / Adequate / Needs Work / Reject

### Recommendations
<ordered by impact, concrete>
```

## Port notes

The skill validator is adapted from `self:validate-skill` with personal-graph logging stripped. Guide and guardrail-spec validators are derived from the framework's anti-patterns and composition rules.
