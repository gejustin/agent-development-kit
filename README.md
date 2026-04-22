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

### Cursor

Clone and symlink the plugin into `~/.cursor/plugins/local/`, then reload Cursor.

```bash
git clone git@github.com:gejustin/agent-development-kit.git
mkdir -p ~/.cursor/plugins/local
ln -s "$(pwd)/agent-development-kit/plugins/context-framework" ~/.cursor/plugins/local/context-framework
```

In Cursor, run **Developer: Reload Window**. `git pull` picks up updates — no reinstall needed.

Team-wide install (admin): Dashboard → Settings → Plugins → Team Marketplaces → Import, paste the repo URL. Requires Teams/Enterprise.

### Codex CLI

```bash
codex plugin marketplace add gejustin/agent-development-kit
```

Then open `/plugins` and install `context-framework`.

## License

MIT.
