---
name: release-validation
description: >
  Use when validating a release candidate, tagging a version, or running
  pre-release checks for orderflow. Confirms lockfile, migration ordering,
  generated file freshness, and CHANGELOG entry before tag.
---

# Release Validation

Confirm a release candidate is shippable.

## Constraints

- Do NOT tag a release before `yarn release:validate` exits zero.
- Do NOT skip the CHANGELOG check; a release without an entry is a release without a changelog.
- NEVER bump the version field in `package.json` without an accompanying CHANGELOG entry.
- HALT if the validator reports lockfile drift; fix the lockfile first.

## Process

### Phase 1: Pre-checks

- Run `yarn install --immutable` — expected: zero changes.
- Run `yarn release:validate` — expected: exit 0 and a green summary.

### Phase 2: CHANGELOG

- Confirm `CHANGELOG.md` has an entry for the new version with a non-empty bullet list.

### Phase 3: Tag

- Tag as `v<major>.<minor>.<patch>` matching `package.json`.
- Push the tag to origin.

## Output

- Pass: tag pushed, CHANGELOG entry committed.
- Fail: surface the failing check; do not tag.
