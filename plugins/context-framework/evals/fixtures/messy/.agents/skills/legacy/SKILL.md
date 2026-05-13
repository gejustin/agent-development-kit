---
name: legacy-db-helper
description: Helper notes for working in the database layer
paths: db/**
---

# Legacy DB Helper

This skill predates our AGENTS.md. Some content overlaps; the `paths` frontmatter tells Cursor when to load it.

## When working in db/

- Always go through repository functions in `src/db/`.
- Migrations are numbered; do not edit shipped ones.
- The `orders.shipped_at` column is tz-naive but UTC.

## Run before commit

- `yarn lint`
- `yarn test`
