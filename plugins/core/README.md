# core

Portable engineering-discipline skills. Tool-agnostic, no external dependencies beyond what the skill itself discovers in your repo.

## Skills

### `autoresearch` — autonomous goal-directed optimization loop

Inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch). Discover repo tooling → define a metric → iterate: modify → commit → verify → keep/revert.

**Two verify modes:**
- `command` (default): shell command outputs a number. Mechanical, zero ambiguity.
- `judge`: command produces output, LLM subagent scores it against a weighted rubric.

**Invoke with:** `/autoresearch` (discovery + loop), `/autoresearch:plan` (discovery-only), `/autoresearch:status` (summarize results log).

State lives in `$XDG_STATE_HOME/autoresearch/<repo-hash>/` — never touches the working tree, never modifies `.gitignore`.

See [`skills/autoresearch/SKILL.md`](skills/autoresearch/SKILL.md) for the full protocol.
