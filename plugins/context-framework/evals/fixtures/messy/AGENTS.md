# orderflow

Internal order-fulfillment service. Postgres-backed Express server with a TypeScript codegen pipeline.

## Stack

- Node 20, TypeScript 5
- Yarn 4 (Berry). Use yarn, not npm. Lockfile is `yarn.lock`.
- Postgres 14 in production. Local dev uses Docker compose.
- Jest for unit tests. `yarn test` runs the suite.
- ESLint with our shared config. Run `yarn lint` before pushing.

## Layout

- `src/` — service source. Entry at `src/index.js`.
- `src/db/` — repository layer. All database access goes through here.
- `db/migrations/` — SQL migrations, numbered.
- `generated/` — TypeScript types generated from the GraphQL schema. Do not edit by hand.
- `tools/` — release scripts, codegen, migration helpers.
- `test/` — Jest test suites.

## Conventions

- Use yarn for all dependency operations. Never invoke npm.
- Prefer `const` over `let`. No `var`.
- Functions over classes unless state is needed.
- Imports use double quotes; strings use single quotes.
- Two-space indent. Trailing commas. Semicolons required.
- Files end with a newline.
- Maximum line length 100.
- Test files live next to source: `foo.js` -> `foo.test.js`.
- All database access goes through `src/db/` repository functions, not direct `pg.Pool` calls.
- Migrations are append-only. Never edit a numbered migration after it has shipped to production.
- Use `tools/release-validate.js` before tagging a release.

## Don't edit

- `generated/` — regenerate via `yarn codegen`. Files have `// AUTO-GENERATED` headers.
- `db/migrations/*.sql` after they've shipped — write a new numbered migration instead.

## Production landmines

- The `orders.shipped_at` column is a tz-naive timestamp recorded in UTC. Do not assume local time.
- Production runs read-replicas that lag the primary by up to 30 seconds. Reads from the API hit replicas; do not read your own writes for at least 30s after `INSERT`/`UPDATE`. The `useReplica` flag in `src/db/pool.js` controls routing.
- Webhook deliveries to downstream partners run through `tools/webhook-relay.js`. Failed deliveries are not automatically retried; check `webhook_failures` table after large batches.

## Testing

- Run `yarn test` for unit tests.
- Run `yarn test:integration` for integration suite. Requires Docker.
- Snapshot tests live in `test/snapshots/`.
- Mocks live in `test/mocks/`.

## Releases

- Tag releases as `v<major>.<minor>.<patch>`.
- Run `yarn release:validate` to confirm the release is shippable. The script checks lockfile drift, migration ordering, generated file freshness, and CHANGELOG entry presence.
- CI runs the release-validation skill on every PR labeled `release:candidate`.

## Style notes

- Match existing file style. Look at neighbors before introducing patterns.
- Comments are sparse — only when the WHY is non-obvious.
- Error messages quote the failing input.

## Cursor rules

The `.cursor/rules/` directory has tool-specific copies of some of the above. They are out of date. Prefer this AGENTS.md.

## Skills

The `.agents/skills/` directory has portable skills. The release-validation skill is current. The `legacy/` skill is from before we had AGENTS.md and may be stale.
