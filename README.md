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

1. An admin imports this repository in Cursor Dashboard under Team Marketplaces.
2. Install an available plugin from that marketplace with `/add-plugin`.

### Codex CLI

1. Clone or open this repository in Codex.
2. Codex discovers `.agents/plugins/marketplace.json`.
3. Open `/plugins` and install an available plugin from the local marketplace.

## License

MIT.
