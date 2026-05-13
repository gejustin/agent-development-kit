# Making Your Codebase AI-Friendly

Good developer experience IS good agent experience. Every improvement that helps a new hire onboard faster also helps an AI agent write better code. Stop thinking about "AI-friendly" as a separate concern. It's just good engineering, enforced consistently.

The difference is enforcement. Humans read docs and forget. Agents read docs and hallucinate. Neither reliably follows suggestions, so enforce the defaults that matter.

**A context file is a suggestion. A linter rule is a wall.**

---

## The Enforcement Hierarchy

Before writing any rule anywhere, ask three questions in order:

1. **Can an agent discover this by reading the code?** → Prefer not to write it down unless it captures a known failure mode. Agents read your package.json, grep your naming patterns, and ls your directories. Documenting discoverable information often adds noise, can lower accuracy, and increases runtime/cost by duplicating what agents already find.

2. **Can this be a lint rule or type constraint?** → Then make it one. Deterministic, runs every time, cannot be ignored. A formatter config beats a style guide. An import restriction beats an architecture diagram. A narrow type beats a comment explaining valid values.

3. **Can this be a CI gate?** → Then make it a gate. Catches what linters miss, blocks merge, provides feedback.

If a convention survives all three questions — it cannot be discovered, cannot be linted, cannot be gated — *then* it belongs in a context file. Everything else is noise.

Everything in this guide falls into three layers. Each one escalates in how hard it is to get wrong.

---

## Layer 1: Constraints

*Make bad code hard to produce.*

Constraints are walls. They do not ask — they reject. Ideally, a developer or agent who has never seen your repo should be able to write code that passes CI quickly, guided entirely by the tools that stop them.

### Types as Constraints

Untyped code forces guessing. Typed code forces correctness. This matters more for agents than humans — agents cannot lean over and ask a colleague "hey, what does this function actually return?"

- **Narrow types over broad ones.** `"active" | "inactive"` tells the agent exactly what is valid. `string` tells it nothing.
- **Schema-first.** Define data shapes before logic. Zod, Prisma, protobuf, OpenAPI — pick one and make it the source of truth for everything downstream. When the schema is the contract, agents cannot invent the wrong shape. Without it, every file that touches the data is a chance to drift. Schema-first eliminates an entire class of errors that no amount of documentation prevents.

### Linter Configs and Formatters

Your linter config is doing more work than your style guide ever did. Treat it that way.

- **Enforce import boundaries.** If a shared module should not import from an internal one, make it an error. Do not rely on an architecture diagram nobody reads.
- **Enforce function constraints.** Max parameters, max complexity, explicit return types. These are not pedantic — they are guardrails that produce code agents and humans can actually reason about.
- **When you add a lint rule, trim duplicate prose.** If your AGENTS.md says "do not use var" and your linter catches it too, remove or shorten the AGENTS.md line. Redundancy creates confusion about what is enforced and what is aspirational.
- **Automate formatting completely.** Format-on-save, pre-commit hook, CI check. The agent should never have to think about formatting — and neither should your team. Three layers of enforcement, zero discussion.

### Hooks as Walls

Git hooks and agent hooks are another way to build walls — ones that catch mistakes at the moment they happen, not after a push.

- **Wrong package manager?** A pre-install hook that rejects `npm install` when the project uses yarn. The agent does not need to read a doc. It hits the wall and learns.
- **Wrong command?** An agent hook that intercepts `rake db:reset` and redirects to `bin/reset_dev`. The mistake becomes hard to repeat.
- **Wrong file location?** A pre-commit hook that rejects files created outside expected directories.

Hooks are constraints that feel like context — they correct in real-time rather than rejecting after the fact. That makes them especially effective for agents, which iterate fast and learn from immediate feedback.

---

## Layer 2: Context

*Make the right code easy to discover.*

Constraints stop bad code. Context guides good code. This is where you make the right pattern the most visible pattern — so anyone converges on it naturally.

### Codebase Structure

Agents are fast at pattern-matching and weak at ambiguity. When a human hits a confusing boundary, they ask a colleague. When an agent hits one, it guesses — and silently propagates that guess across every file it touches.

- **Make boundaries explicit.** Keep responsibilities clear between modules, services, and layers. An agent that cannot tell where one domain ends and another begins will cross boundaries constantly and confidently.
- **Prefer one obvious path.** Two valid ways to do the same thing means random outcomes in generated code. Pick one, deprecate the other, and enforce the choice.
- **Design for local reasoning.** Hidden dependencies and side effects force agents to load more context to understand less code. If understanding a file requires reading five other files, the agent will misunderstand at least one of them.
- **Keep coupling low.** Tight coupling means an agent editing one module must understand all its dependents. The blast radius of a wrong guess grows with the coupling.

### Scaffolding and Templates

**Reduce decisions, increase velocity.** Every time a developer or agent has to choose between approaches, that is friction. Generators, templates, and scaffolding tools are not conveniences — they are guardrails that encode your team's patterns into reproducible starting points.

If adding a new feature requires knowing 6 files to create in 3 directories with specific naming — that is a generator, not a wiki page.

### AGENTS.md / CLAUDE.md

Context files are the fallback for things you *cannot* automate. That is their strength and their risk.

**AGENTS.md is a living list of codebase smells you have not fixed yet — not a permanent configuration.** Every line is a signal that something in your codebase is confusing enough to trip an agent. The right response is not to grow the file — it is to fix the actual problem, then delete the line.

Human-written AGENTS.md files can materially reduce runtime and token usage when they are concise and curated. Auto-generated ones — the kind you get from `/init` — usually make agents worse. They duplicate what agents already discover, add noise, and go stale.

**A growing AGENTS.md means your tooling is lagging. A shrinking one means your infrastructure is maturing.**

#### What belongs

Every line should fail the discoverability test — if an agent could figure it out from the code, delete it.

- **Tooling gotchas.** "Use `uv`, not pip." "Run tests with `--no-cache` or you will get false positives."
- **Negative constraints.** "Never add Enzyme tests — we are migrating to RTL."
- **Decision heuristics.** "If operation writes to multiple tables → wrap in a transaction."
- **Landmines.** Things that look dead but are not. Things that look fine but will break.

#### What does not belong

Tech stack descriptions, directory structure, naming conventions, layering diagrams — anything the agent discovers by reading code. And watch for **the pink elephant problem:** mentioning a deprecated tool (even in passing) anchors the agent on it. LLMs do not distinguish "this is what we used to do" from "this is what you should do."

#### Keeping it alive

The lifecycle is: add line → investigate why → fix root cause → delete line. Review during tech debt sweeps. A stale AGENTS.md is worse than none — it teaches wrong things confidently. Scope files to directories, not the whole repo.

---

## Layer 3: Validation

*Prove the code actually works.*

Constraints prevent bad patterns. Context guides good ones. Validation closes the loop — it proves correctness and teaches through feedback.

### Tests as Specifications

Documentation describes intent. Tests prove it. When an agent needs to understand what a function should do, a well-written test suite is worth more than any README.

**The killer workflow: write the test, let the agent make it pass.** Clear spec in, validated code out. Every red-to-green cycle is a lesson.

- **Test behavior, not implementation.** Tests coupled to internals break when agents refactor — which they do constantly.
- **Edge cases as tests.** If you know the gotchas, encode them. The agent will learn your boundaries from your test suite faster than from any doc.

### CI Pipeline

Your pipeline is the agent's teacher. Make it a good one.

- **Speed is a feature.** Lint in seconds. Type-check in seconds. Unit tests in under a minute. The faster the feedback, the less drift accumulates.
- **Specific errors over cryptic failures.** "Build failed, exit code 1" teaches nothing. "Unexpected import from @internal/auth in a shared module — architectural boundary violation" teaches everything. Error messages are the UX of your toolchain.
- **Structured output where possible.** JSON, SARIF, TAP — machine-readable formats let agents parse failures precisely instead of guessing from log noise.

If you give the same review comment on AI-generated code three times, it is a lint rule. Promote recurring feedback into automation.

### Security

AI-generated code has measurably higher vulnerability rates. Agents do not think adversarially — they optimize for "works" not "works safely."

- **Static analysis is non-negotiable.** SAST tools (Semgrep, CodeQL, Bandit) in CI, blocking on findings. This is not optional when code is being generated at speed.
- **Dependency scanning.** Agents will pull in packages they have seen in training data. Pin versions, audit dependencies, and flag unexpected additions in review.
- **Human gates for sensitive paths.** Auth flows, payment processing, data access controls, cryptography — require human review for changes in these areas regardless of who or what authored them.
- **Security-specific lint rules.** Ban dangerous patterns at the lint layer: raw SQL construction, `dangerouslySetInnerHTML`, `eval`, hardcoded credentials. Do not rely on agents knowing these are dangerous.

### Scoping AI Work

How much rope to give an agent matters as much as how good the guardrails are.

- **One task, one module, one PR.** Small scope limits blast radius. An agent that touches three modules in one PR will get at least one of them wrong.
- **Define the stop condition.** Give a clear definition of done. Agents do not know when to stop. Set explicit boundaries: "modify only files in `src/payments/`," "do not change the public API," "stop and ask if tests fail after two attempts."
- **Escalation over persistence.** An agent retrying the same failing approach five times is wasting cycles. Two or three failures on the same problem should trigger escalation — to a human, to a different approach, or to a narrower scope.

---

## The Three Layers Together

| Layer | Purpose | Enforcement |
|-------|---------|-------------|
| **Constraints** | Bad code impossible | Linters, types, formatters, hooks, import rules |
| **Context** | Good code obvious | Structure, patterns, AGENTS.md, templates, scaffolding |
| **Validation** | Code proven correct | Tests, CI, structured feedback, security gates |

Each layer catches what the one above misses. Constraints cannot tell you the *right* pattern — only reject wrong ones. Context cannot *prove* correctness — only guide toward it. Validation closes the gap.

Skip a layer and you feel it:
- **Constraints without context** → agents write code that passes lint but misses the point
- **Context without validation** → code looks right but does not work
- **Validation without constraints** → you catch problems too late, every time

---

## The Uncomfortable Truth

Most "AI-unfriendly" codebases are not unfriendly because they lack AI-specific tooling. They are unfriendly because they have the same problems they have always had — inconsistency, implicit knowledge, poor boundaries, slow feedback — and those problems are now amplified by agents that move faster than humans and do not know when to stop and ask.

Fix the fundamentals. The AI part takes care of itself.
