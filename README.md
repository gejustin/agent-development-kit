# agent-development-kit

Gary's personal agent workflows, packaged as portable plugins. Claude Code consumes `.claude-plugin/marketplace.json`, Cursor consumes `.cursor-plugin/marketplace.json`, and Codex consumes `.agents/plugins/marketplace.json`.

## Current Inventory

| Plugin | Claude Code | Cursor | Codex | Status | Purpose |
| --- | --- | --- | --- | --- | --- |
| [`context-framework`](plugins/context-framework/README.md) | Yes | WIP | Yes | WIP | Standardize how in-repo AI context is created and consumed, tool-agnostic. |

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

Not yet. The repo ships `.cursor-plugin/marketplace.json` so the structure is ready, but Cursor has no local-marketplace CLI command and the IDE local-plugin path does not feed the `agent` CLI. Will revisit when Cursor unifies plugin resolution between CLI and IDE.

### Codex CLI

```bash
codex plugin marketplace add gejustin/agent-development-kit
```

Then open `/plugins` and install `context-framework`.

## License

MIT.
