# orderflow — Claude rules

Use yarn for all dependency operations. Never invoke npm.

## Conventions

- Prefer `const` over `let`. No `var`.
- Functions over classes unless state is needed.
- Imports use double quotes; strings use single quotes.
- Two-space indent. Trailing commas. Semicolons required.
- Files end with a newline.
- Maximum line length 100.
- Test files live next to source: `foo.js` -> `foo.test.js`.

## Don't edit

- `generated/` — regenerate via `yarn codegen`.
- `db/migrations/*.sql` after they've shipped.
