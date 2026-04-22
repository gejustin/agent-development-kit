# Discovery Protocol

Full detection protocol for autoresearch Phase 1. Zero hardcoded assumptions.

## Detection Order

1. **VCS state check.** Run `git status --porcelain`. If non-empty, stop and ask user to commit or stash before running — autoresearch requires a clean tree.

2. **Manifest scan.** Glob project root (depth 2 max):

   | File(s) | Ecosystem | Implies |
   |---------|-----------|---------|
   | `package.json` | Node/JS/TS | npm/pnpm/yarn, possibly nx/turbo/lerna |
   | `nx.json` | Nx monorepo | `nx build`, `nx test`, `--skip-nx-cache` |
   | `turbo.json` | Turborepo | `turbo run build`, `--force` |
   | `lerna.json` | Lerna | `lerna run build` |
   | `pnpm-workspace.yaml` | pnpm workspaces | `pnpm -r` |
   | `go.mod` | Go | `go build`, `go test ./...` |
   | `Cargo.toml` | Rust | `cargo build --release`, `cargo test` |
   | `pyproject.toml` | Python (modern) | `pytest`, `ruff`, `mypy`, check `[tool.*]` blocks |
   | `setup.py` / `requirements.txt` / `Pipfile` | Python (legacy) | `pytest`, `pip install -r` |
   | `Makefile` | Any | `make <target>` — grep `^[a-z].*:` for targets |
   | `Justfile` | Any | `just <target>` |
   | `Taskfile.yml` | Any | `task <name>` |
   | `Dockerfile` | Container | `docker build`, bundle-size analog |
   | `.tool-versions` / `.nvmrc` / `.python-version` | Version pins | Use pinned versions for commands |

3. **Package-manager resolution (JS).** If `package.json` exists:
   - `pnpm-lock.yaml` → pnpm
   - `yarn.lock` → yarn (check v1 vs berry via `.yarnrc.yml`)
   - `package-lock.json` → npm
   - `bun.lockb` → bun

4. **Script enumeration.** For each manifest found, list scripts/tasks without running them:
   - `package.json` → `scripts` object
   - `Makefile` → target names
   - `Justfile` → `just --list`
   - `pyproject.toml` → `[tool.poetry.scripts]`, `[project.scripts]`

5. **Test runner detection.** Look for config files:
   - `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*` (JS)
   - `pytest.ini`, `tox.ini`, `conftest.py` (Python)
   - `_test.go` files anywhere (Go)
   - `tests/` directory structure (Rust)

6. **Bundler detection (for bundle-size metrics):**
   - `vite.config.*`, `webpack.config.*`, `rollup.config.*`, `esbuild.config.*`, `next.config.*`, `rspack.config.*`
   - Build output hint: check `.gitignore` for `dist/`, `build/`, `.next/`, `out/`

7. **Linter detection:**
   - `.eslintrc.*`, `biome.json`, `.prettierrc.*` (JS/TS)
   - `ruff.toml`, `.ruff.toml`, `[tool.ruff]` in pyproject (Python)
   - `.golangci.yml` (Go)
   - `clippy.toml` (Rust)

## Baseline Measurement

Run each detected command ONCE with timing. Record to discovery report, not results log.

- Prefix with `time` or equivalent to capture wall-clock.
- Use cache-bust flags from the start so baseline matches loop measurements.
- For bundle size, measure output directory with `du -sb <dir>` or equivalent.
- For test count, capture pass/fail from runner output (each runner has its own format).

## Cache-Bust Flags

| Tool | Flag |
|------|------|
| Nx | `--skip-nx-cache` |
| Turbo | `--force` |
| Bazel | `--noremote_cache --noremote_upload_local_results` |
| Gradle | `--no-build-cache --rerun-tasks` |
| pytest | `--cache-clear` |
| Jest | `--no-cache` |
| Vitest | `--no-cache` |
| Go test | `-count=1` (disables test result cache) |
| Cargo | remove `target/` between runs (no built-in flag) |

## Output of Discovery

Structured summary for the user presentation in Phase 1 step 4. Do NOT auto-select a target — always ask.

## Edge Cases

- **No manifests found.** Ask user to name a verify command manually. Offer command mode only (judge mode needs a generate command they can specify).
- **Multiple manifests (polyglot repo).** Present all detected targets grouped by ecosystem. Let user pick.
- **Commands fail during baseline.** Report the failure, do NOT proceed to loop. User fixes the repo first.
- **Dirty tree on re-entry (resume).** If `$STATE_DIR/results.tsv` exists for this repo (state dir resolved per `references/results-logging.md`) and tree has uncommitted changes, assume a previous iteration crashed mid-modify. Offer to reset or investigate.
