# agent-development-kit

Gary's personal agent workflows, packaged as portable plugins. Claude Code consumes `.claude-plugin/marketplace.json`, Cursor consumes `.cursor-plugin/marketplace.json`, and Codex consumes `.agents/plugins/marketplace.json`.

## Current Inventory

| Plugin | Claude Code | Cursor | Codex | Status | Purpose |
| --- | --- | --- | --- | --- | --- |
| [`context-framework`](plugins/context-framework/README.md) | Yes | IDE only | Yes | WIP | Standardize how in-repo AI context is created and consumed, tool-agnostic. |
| [`core`](plugins/core/README.md) | Yes | IDE only | Yes | Ready | Portable engineering-discipline skills. Currently: `autoresearch`. |

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

### Cursor IDE

```bash
git clone git@github.com:gejustin/agent-development-kit.git
mkdir -p ~/.cursor/plugins/local
ln -s "$(pwd)/agent-development-kit/plugins/context-framework" ~/.cursor/plugins/local/context-framework
```

Then **Developer: Reload Window** in Cursor. `git pull` picks up updates — no reinstall.

The Cursor CLI (`agent` / `cursor-agent`) does not read this path yet. CLI support pending Cursor unifying plugin resolution between IDE and CLI.

### Codex CLI

```bash
codex plugin marketplace add gejustin/agent-development-kit
```

Then open `/plugins` and install `context-framework`.

## License

MIT.
