# Bootstrap verification — 20 October 2026

The source foundation is implemented, but setup is **not fully verified or ready for production deployment**. This environment prevents a clean install, live services and skill installation. No successful install, CI run, database connection, credential flow or browser smoke is claimed.

## Environment and dependencies

Installed runtime: Node 22.23.3; installed package manager: pnpm 12.14.0. The repository selects Node 24 LTS. Node 24 could not be obtained with registry DNS unavailable. Docker is not installed. PostgreSQL 18.6 binaries and Chrome exist, but TCP and Unix listening sockets are denied by the sandbox.

Initial pnpm attempts failed because the default runtime lock directory is read-only. Using a task-owned `XDG_RUNTIME_DIR` fixed that lock-directory issue. pnpm's script preparation briefly populated the selected package versions and generated a real multi-document pnpm 12 lockfile. The final routing dependencies were added with a successful offline `--lockfile-only --ignore-scripts --trust-lockfile` update using temporary copies of cached metadata. This reused existing lock entries only for generation and did not install or execute dependencies. **pnpm-lock.yaml exists and includes the app-directory routing tooling.**

A complete frozen install still fails: required full package metadata is absent from the offline cache and registry DNS is unavailable. Its supply-chain metadata check was not bypassed for installation. The generated lockfile must be reviewed and a normal `pnpm install --frozen-lockfile` must pass on Node 24 with registry access before claiming reproducible setup or passing CI.

For diagnostics only, ignored local dependency links referenced readable cached packages; temporary diagnostic links are removed after checks. Some cached versions differ from selected versions. The direct-command results below do not establish compatibility of the complete selected dependency set.

| Tool                  | Selected            | Used for diagnostics                                  |
| --------------------- | ------------------- | ----------------------------------------------------- |
| Node                  | 24 LTS              | 22.23.3                                               |
| TypeScript            | 6.0.3               | 6.0.3                                                 |
| Oxlint                | 1.88.0              | 1.87.0                                                |
| Oxfmt                 | 0.73.0              | 0.55.0                                                |
| Vitest                | 4.1.11              | 4.1.11                                                |
| Vite                  | 8.3.4               | 8.3.4                                                 |
| React                 | 19.3.1              | 19.2.7                                                |
| Hono                  | 4.13.13             | 4.13.13                                               |
| Drizzle ORM / Kit     | 0.45.4 / 0.31.11    | 0.45.4 / 0.31.11                                      |
| Better Auth / adapter | 1.7.11              | 1.6.24, diagnostics only; never a production fallback |
| Router plugin / CLI   | 1.168.47 / 1.167.45 | 1.168.19 / 1.167.18 for final route generation/build  |
| Playwright            | 1.64.1              | 1.64.0, discovery only                                |

All selected versions are in [versions.json](versions.json) and package manifests. The final compatibility check must use a clean Node 24 install of the selected versions, especially Better Auth's current adapter/schema and Oxc formatting changes.

## Results

| Check                                              | Result                                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workspace graph                                    | Turbo dry-run discovers all 9 child workspaces and dependency ordering; initial run warned about missing Git/lockfile; final lockfile is present |
| Shared packages and API compilation                | Pass using direct TypeScript commands against cached dependencies                                                                                |
| Admin/application/test TypeScript projects         | Pass using direct TypeScript commands against cached dependencies                                                                                |
| Oxlint                                             | Pass, zero diagnostics with cached 1.87.0                                                                                                        |
| Oxfmt write/check                                  | Pass with cached 0.55.0                                                                                                                          |
| Unit/HTTP/UI tests                                 | 15 tests pass in 4 files using cached dependencies                                                                                               |
| Production frontend bundle                         | Pass with cached dependencies; separate home/workspace/login chunks                                                                              |
| Lockfile and package exports                       | All 10 manifests match generated lockfile specifiers; static public export targets exist after build                                             |
| Secret-value artifact scan                         | Generated auth/database secret values absent from checked app/auth/database dist outputs                                                         |
| Drizzle migration generation                       | Pass; 7 tables, SQL/journal/snapshot generated and reviewed                                                                                      |
| Live PostgreSQL / migrations                       | Blocked; temporary cluster initializes, server cannot create TCP or Unix sockets; migrator reports connect EPERM                                 |
| API startup                                        | Blocked by listen EPERM on 127.0.0.1:3001; in-process health HTTP test passes                                                                    |
| Frontend startup                                   | Blocked by listen EPERM on 127.0.0.1:5173                                                                                                        |
| Better Auth login/session/logout and SQL isolation | Integration suite supplied; not verified against a live database. Suite rejects missing TEST_DATABASE_URL rather than silently skipping          |
| Playwright                                         | Test discovery passes (1 smoke test); browser execution blocked by unavailable listening app servers                                             |
| Agent instructions                                 | 6 files present and checked                                                                                                                      |
| Skills                                             | All 8 source skills pass repository validation and the locally available skill-creator quick_validate.py                                         |
| Skill discovery installation                       | Blocked: .agents is a read-only mount. Sources preserved in agent-skills/; installer reports failure honestly                                    |
| Git / Husky                                        | .git is an empty read-only mount, not an initialized checkout. Hook installation cannot run; prepare reports the prerequisite                    |
| Docker Compose                                     | Configuration supplied; Docker execution/health checks unverified because Docker is missing                                                      |
| CI                                                 | Configured, not run; requires a successful frozen install and PostgreSQL service                                                                 |

Direct checks used `node node_modules/typescript/bin/tsc -p <project>`, `node node_modules/vitest/vitest.mjs run --config vitest.config.ts`, `node node_modules/oxlint/bin/oxlint --max-warnings 0 .`, `node node_modules/oxfmt/bin/oxfmt --check .`, and Vite's build CLI from apps/admin. [verification-results.json](verification-results.json) records the direct command exit codes. Root pnpm wrappers could not be verified end to end; pnpm script preparation reported failed install metadata checks. The final direct checks cover the app-directory route conversion, including generated routes and three separate page chunks.

## Completion in an unrestricted checkout

1. Use a writable normal Git checkout and Node 24. Review the generated pnpm-lock.yaml, run `pnpm install --frozen-lockfile` with registry access, and commit the verified lockfile.
2. Run `pnpm agents:install` and `pnpm agents:validate`. Keep canonical skill sources synchronized if editing installed copies.
3. Configure local env files with `pnpm env:setup`, start Compose and run `pnpm db:migrate` against development PostgreSQL.
4. Create a dedicated eduos_test database. Run `pnpm test:integration` with TEST_DATABASE_URL and confirm migration reapplication, current Better Auth login/session/logout, limiter and cross-tenant behavior.
5. Run format, lint, typecheck, unit tests, build and Playwright smoke with the pinned versions. Review any Oxfmt version changes, use `pnpm format`, and commit consistent output.
6. Verify production HTTPS cookie/proxy behavior and complete invitations/account recovery, deployment secrets, backup/restore and operational monitoring before real school use.

No admissions, attendance, exams, fees or other school business modules were implemented. PostgreSQL RLS is not enabled.
