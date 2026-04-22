# Security Policy

## Reporting a vulnerability

Report privately via GitHub's ["Report a vulnerability"](https://github.com/gejustin/agent-development-kit/security/advisories/new) flow. Do not open a public issue.

Expect an acknowledgement within 7 days. Coordinated disclosure preferred.

## Scope

This repo ships prompt/skill content consumed by AI coding agents. Security-relevant concerns include:

- Prompt injection vectors in distributed skill/guide content
- Instructions that would cause an agent to exfiltrate data, run destructive commands, or bypass safety checks
- Supply-chain risks in `marketplace.json` manifests

Out of scope: disagreements about skill doctrine, prompt quality, or framework opinions.
