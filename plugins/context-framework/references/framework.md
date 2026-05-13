# A Framework for Context Engineering

## Prior Art

This framework builds on two related pieces of work.

The first is the [AI-friendly codebase manifesto](./ai-friendliness-manifesto.md): the argument that good developer experience is good agent experience, and that most "AI-friendly" work is just good engineering made more explicit, discoverable, and enforceable.

The second is the [context migration process](./migration-process.md): the operational playbook for moving an existing repo from scattered, tool-specific context toward canonical guides, portable skills, guardrails, and validation without breaking activation.

This document sits between those two ideas. The manifesto explains the philosophy. The migration process explains how to move a real repo. This framework defines the primitives and standards we should use when deciding what belongs where.

## AI Tools Are an Amplifier

AI tools are an amplifier.

If you only read that line, it might sound like I mean that in a positive way. Unfortunately, AI is exceptionally good at amplifying the bad parts too.

If a repository has discoverable patterns, good architecture choices, fast feedback loops, strong tests, good types, and enforceable standards, AI agents can approximate the judgment of our strongest engineers. But if a repository depends on tribal knowledge, stale docs, inconsistent conventions, unorganized AI context, and rules that were never enforced, AI will amplify those systemic problems. It will confidently follow the wrong patterns and spread them faster than humans could before.

That is the uncomfortable truth this document aims to address.

## Current State

AI coding agents are already being adopted across our engineering org. However, given the nature of these tools and the speed at which they are changing, our adoption is similarly chaotic.

We have Cursor rules, Claude skills, Copilot instructions, repo documentation, scripts, and other stale guidance that overlap, drift apart, or even create conflicting context for agents. Some of this guidance is useful, some is outdated, and much of it is written for one specific tool that was popular at a particular point in time. Most importantly, we don't even know if any of it actually gets agents to do the right thing.

The problem is not that we lack instructions for agents. The problem is that instructions are the weakest form of control.

## AI as Institutional Leverage

The goal of this document is to propose a mental model for how we should think about getting the most out of AI coding agents: how we can amplify the good parts of our system, make agents more reliable and useful, and invest in practices that outlast the trends of the day.

If harnessed correctly, AI agents are institutional leverage: a pair-programmer in everyone's pocket that can apply the patterns, standards, and judgment of our strongest engineers. They can make difficult areas like accessibility, security, testing, and migration work more automatic. That should improve both speed and quality across the engineering organization.

## Good Developer Experience Is Good Agent Experience

The core philosophy is simple. The same things that enable a new hire or junior engineer to be successful in a codebase will also help an AI agent: clear structure, discoverable patterns, fast feedback loops, good tests, strong quality gates, type-checking, simple commands, and documentation that reflects how the code actually works.

This might seem obvious, but historically we have underoptimized for strong enforcement, usually because it's a burden on human engineers. Linters and formatters can be annoying, tools take time to run and disrupt the flow of the development process, and CI is already flaky enough.

With agents taking on more work inside the developer loop, this feedback can be given directly to the agent while it is working. The engineer does not need to manually remember every rule, run every command, or interpret every failure. The environment can push the agent back onto the right path.

In this agent-first model, enforcement and discoverability are the key differentiators. Humans read docs and forget. Agents read docs and hallucinate. Neither reliably follows suggestions. So the defaults that matter should be enforced, not described in markdown.

A context file is a suggestion. A linter is a wall.

## Strategy: 80% Environment, 20% Context

Most of our strategy should not be AI-specific.

Roughly 80% should be the same engineering work we already know improves quality: tests, type-checking, linting, formatting, CI gates, code generation, clear ownership, predictable architecture, and fast local feedback.

The remaining 20% is where agents need reasoning or judgment: understanding local conventions, avoiding landmines, making tradeoffs, and making decisions about things that cannot be reduced to a script or mechanical check.

For that context-focused 20%, we need to ensure that we're not putting in garbage and that agents get the right context at the moment they need it. We also need to make sure we are creating context that survives tooling churn and evolution.

The important habit is to avoid turning every repeated task into a prompt. A prompt may be the right starting point, but it should not automatically become the permanent solution. If a prompt describes a repeatable procedure, we should ask whether it should become a script, generator, lint rule, test, hook, or CI check instead.

## Enforcement Hierarchy

Before writing guidance for an agent, we should ask three questions in order:

1. Can the agent discover this by reading the code?
2. Can this be a lint rule, type constraint, generator, hook, or other mechanical guardrail?
3. Can this be a CI gate or validation step?

If the answer is yes to any of those, we should prefer that path over adding more prose.

Agents can already inspect package files, grep naming patterns, read tests, and infer structure from the codebase. Writing down information that is already discoverable often adds noise, increases runtime cost, and creates another source that can go stale.

If something is deterministic and checkable, it should be enforced mechanically. A formatter config beats a style guide. An import restriction beats an architecture diagram. A narrow type beats a comment explaining valid values. A CI gate beats a reminder.

If a convention survives all three questions, meaning it cannot be discovered, cannot be linted, and cannot be gated, then it belongs in context. Everything else is likely noise.

## Context Primitives

This is a rapidly evolving ecosystem, and at the time of writing this framework has identified four context primitives that should cover most of what we need within the 20% AI surface area: **Guardrails**, **Guides**, **Skills**, and **Subagents**.

**Guardrails** are machine-enforced constraints. Use them when correctness is deterministic and checkable: syntax, types, structure, allowed commands, file boundaries, write paths, tests, lint rules, formatters, CI gates, runtime hooks, sandboxes, or allowlists. If the same review comment appears repeatedly, we probably have a missing Guardrail.

**Guides** are local domain knowledge. Use them when something is true because of where the agent is in the repo: local conventions, package-specific landmines, scoped migration state, domain vocabulary, ownership notes, or exceptions.

**Skills** are work-based expertise. Use them when the agent needs reusable knowledge, procedure, or review criteria for a type of task: accessibility review, security review, GraphQL changes, testing strategy, component migration, incident triage, or release validation. A Skill should not be a prompt dump; it should have a procedure, constraints, and a validation step.

**Subagents** are isolated context and execution. Use them when the parent agent needs the result, not the working memory: deep codebase research, code review, independent verification, fresh eyes, or parallelizable investigation. Subagents are powerful, but over-delegation loses context and causes under-specified work.

## Tool-Agnostic Context

Tool-specific files should not become independent sources of truth. They can exist as compatibility shims, but the durable investment should live in tool-agnostic primitives.

The ecosystem is still moving quickly, but current community direction appears to be converging around `AGENTS.md` and portable skill definitions.

References:

- [https://agents.md/](https://agents.md/)
- [https://agentskills.io/home](https://agentskills.io/home)
- [https://skills.sh/](https://skills.sh/)

In our repositories this takes the following shape:

```
handshake/
  {AGENTS,CLAUDE}.md

  .agents/
    skills/
      <skill-name>/
        SKILL.md
        references/
    agents/
      <subagent-name>.md

  packs/<pack>/{AGENTS,CLAUDE}.md
  next/packages/<pkg>/{AGENTS,CLAUDE}.md
```

Cursor and Codex have already adopted these open standards and discover `AGENTS.md` and `.agents/<primitive>/*` automatically. There is nothing to wire up. Adding a new tool to a repo that follows this convention is a no-op.

### The Claude Exception

Claude Code does not yet read this convention. We need to add a couple symlinks and be aware that all `CLAUDE.md` files need to import `AGENTS.md`.

```
CLAUDE.md                          # one line: @AGENTS.md
.claude/
  skills/  -> ../.agents/skills    # symlink
  agents/  -> ../.agents/agents    # symlink
```

## Implementation and Standards

The framework only works if every piece of agent-facing context has a clear home, a clear activation path, and a reason it cannot live in a stronger primitive.

The goal is for the agent to do the right thing during normal work without the developer having to remember the rule, invoke the right prompt, or ask for the right context. That will never be perfectly deterministic, because agents are not deterministic systems. This is why the best context engineering is mostly environment design: make correct behavior discoverable, validated, or enforced whenever possible.

### Decision Order

Before adding agent-facing context, ask these questions in order:

1. Can the agent discover this from code, tests, types, config, scripts, or existing docs?
2. Can this be enforced mechanically through linting, formatting, type-checking, tests, hooks, generators, CI, or runtime guards?
3. Is this knowledge needed because of where the agent is working?
4. Is this knowledge needed because of what task the agent is performing?
5. Does this work need isolated context, fresh review, or independent investigation?

The answers map to the primitives:

| Need | Primitive | Home |
| :---- | :---- | :---- |
| Discoverable from the repo | No new context | Code, tests, config, scripts, docs |
| Deterministic and enforceable | Guardrail | Lint, typecheck, test, hook, generator, CI, runtime guard |
| Place-based knowledge | Guide | Root or nested `AGENTS.md` |
| Work-based expertise | Skill | `.agents/skills/<skill-name>/SKILL.md` |
| Isolated execution or review | Subagent | `.agents/agents/<subagent-name>.md` |

### Authoring Guardrails

Guardrails are the strongest primitive. If something can be checked or generated by a machine, it should not depend on an agent remembering prose.

Use Guardrails for code that can be generated and deterministic rules such as generated file boundaries, import restrictions, formatting, type constraints, required tests, ownership boundaries, dangerous commands, security checks, accessibility checks, or repeated pull request review comments that can be handled mechanically.

Examples:

```
Do not edit generated files directly.
Components in this package may not import from internal server modules.
Every database migration needs a rollback note.
```

These should become hooks, lint rules, validation scripts, type constraints, tests, or CI checks.

If we find ourselves writing the same review comment repeatedly, we should assume we are missing a Guardrail.

### Validation Is the Feedback Loop

Guardrails prevent known bad patterns. Validation proves the work actually behaves correctly.

Tests, type-checking, CI, security scans, and structured failure output are how the environment teaches the agent while it works. Fast, specific feedback matters more for agents than for humans because agents iterate quickly and will otherwise keep moving in the wrong direction.

Documentation describes intent. Tests prove it. When an agent needs to understand what a function should do, a well-written test suite is worth more than any README.

Error messages are part of the agent experience. "Build failed, exit code 1" teaches almost nothing. "Unexpected import from @internal/auth in a shared module" teaches the rule and points to the fix.

If we give the same review comment on AI-generated code repeatedly, that feedback should become a test, lint rule, CI check, hook, security gate, or validation script.

### Guide Standard

Guides are for place-based context. They should answer: "What does the agent need to know because it is working here?"

The canonical file is `AGENTS.md`.

Use root `AGENTS.md` for repo-wide guidance. Use nested `AGENTS.md` files for app, package, or domain-specific guidance.

A Guide should be short, local, and operational. It should contain context that becomes more relevant because of the path the agent is editing: local architecture constraints, package-specific commands, scoped landmines, domain vocabulary, ownership notes, exceptions, or pointers to relevant Skills.

`AGENTS.md` is a living list of codebase smells we have not fixed yet, not a permanent configuration surface. Every line is a signal that something in the codebase, tooling, or validation loop is confusing enough to trip an agent.

A growing root `AGENTS.md` is usually a sign that guidance is being placed too globally, or that some of it should become a Skill or Guardrail. A shrinking `AGENTS.md` means the environment is getting stronger.

The lifecycle for Guide context should be: add the line, investigate why it is needed, fix the root cause when possible, then delete the line.

### Skill Standard

Skills are for work-based expertise. They should answer: "What does the agent need to know because of the task it is performing?"

The canonical location is:

```
.agents/skills/<skill-name>/SKILL.md
```

Use Skills for reusable procedures such as accessibility review, security review, GraphQL changes, database migrations, release validation, incident triage, testing strategy, and component migrations.

A Skill should contain when to use it, critical checks, workflow, landmines, and validation.

The description is the primary activation surface. It should start with `Use when ...` and match the way engineers actually ask for work.

Good:

```
description: Use when changing auth, login, session, token refresh, permission checks, roles, or user access behavior. CRITICAL: Verify backwards compatibility for existing sessions before changing token semantics.
```

Weak:

```
description: Authentication skill.
```

Skill frontmatter should stay minimal:

```
---
name: auth-domain
description: Use when changing auth, login, session, token refresh, permission checks, roles, or user access behavior. CRITICAL: Verify backwards compatibility for existing sessions before changing token semantics.
---
```

**Note:** As of the time of writing, not all harnesses respect the `paths` frontmatter. Path hints or globs can be put in the description to get them to match.

A Skill is healthy when it activates naturally from a realistic task request. It is weak if the developer has to explicitly say "use the skill."

### Subagent Standard

Subagents are for isolated context and execution. They should answer: "What work should be delegated because the parent agent needs the result, not the working memory?"

The canonical location is:

```
.agents/agents/<subagent-name>.md
```

Use Subagents for deep codebase research, independent review, adversarial review, security investigation, accessibility audit, test gap analysis, large parallelizable searches, or fresh-eyes validation.

A good Subagent has a narrow mission, explicit inputs, explicit outputs, boundaries, review criteria, and failure conditions.

Subagents are powerful, but over-delegation creates shallow work. Use them when isolation improves quality, not as a default way to split up work.

### Tool-Specific Files

Tool-specific files should be rare and thin. They should not become independent sources of truth.

The durable investment should live in tool-agnostic primitives. Tool-specific files should exist only when they materially improve activation for a specific tool and cannot be replaced by the canonical structure.

When tool-specific files are necessary, they should usually be thin compatibility shims that point to canonical context.

For Claude:

```
@AGENTS.md
```

A tool-specific file should not contain unique rules unless there is no practical alternative. If it duplicates canonical guidance, it creates drift. If it becomes required for normal correctness, the system is too dependent on one tool.

### Activation Standard

Context is only useful if it activates at the right moment.

For every Guide, Skill, Subagent, or rare tool shim, ask:

1. How will the agent discover this during normal work?
2. Is discovery based on path, task, tool behavior, or explicit invocation?
3. Does the context appear before the agent makes the relevant decision?
4. Would the agent still do the right thing if the developer did not know this rule existed?
5. Is there defense in depth for critical failures?

Manual invocation should be a fallback, not the primary success path.

For critical checks, use multiple layers where appropriate: Skill description, root Guide, nested Guide, and eventually a Guardrail.

### Quality Bar

The ecosystem is changing quickly, but these are the standards we should move toward when writing context.

A good piece of context should generally:

1. Have one canonical home.
2. Have a clear activation path.
3. Avoid duplicating a stronger primitive.
4. Avoid replacing something that should be enforced.
5. Be durable across tool churn where possible.
6. Help the agent do the right thing with minimal developer prompting.

Not every piece of context will satisfy all of these immediately. The ecosystem is still evolving, and some amount of experimentation is healthy. But when context fails several of these checks, we should treat it as temporary, experimental, or a candidate for a stronger primitive later.

The practical direction is straightforward: a fresh agent should increasingly encounter the right information at the moment it needs it, and the environment should enforce as much correctness as possible without depending on prompts, tribal knowledge, or tool-specific sprawl.
