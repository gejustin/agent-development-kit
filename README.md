# agent-development-kit

Gary's personal agent workflows, packaged as portable plugins. Claude Code consumes `.claude-plugin/marketplace.json`, Cursor consumes `.cursor-plugin/marketplace.json`, and Codex consumes `.agents/plugins/marketplace.json`.

## Current Inventory

| Plugin | Claude Code | Cursor | Codex | Status | Purpose |
| --- | --- | --- | --- | --- | --- |
| [`context-framework`](plugins/context-framework/README.md) | Yes | Yes | Yes | WIP | Standardize how in-repo AI context is created and consumed, tool-agnostic. |

## Installation

### Claude Code

```bash
# Add the marketplace from a local clone
/plugin marketplace add .

# Or add it directly from GitHub
/plugin marketplace add git@github.com:gejustin/agent-development-kit.git

# Install a plugin
/plugin install context-framework@agent-development-kit
```

### Cursor (IDE + `agent` CLI)

Clone and symlink each skill into `~/.cursor/skills-cursor/`. Works for both the Cursor IDE and the Cursor CLI (`agent` / `cursor-agent`).

```bash
git clone git@github.com:gejustin/agent-development-kit.git
cd agent-development-kit
mkdir -p ~/.cursor/skills-cursor
ln -s "$(pwd)/plugins/context-framework/skills/create-context" ~/.cursor/skills-cursor/create-context
```

No reload needed for the CLI. In the IDE, run **Developer: Reload Window** once. `git pull` picks up updates.

### Codex CLI

```bash
codex plugin marketplace add gejustin/agent-development-kit
```

Then open `/plugins` and install `context-framework`.

## License

MIT.
