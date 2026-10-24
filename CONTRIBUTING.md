# Contributing

Read AGENTS.md, the relevant domain/architecture docs and development conventions. Work on a focused branch in a normal writable Git checkout. Do not commit secrets, real student data, node_modules or local build output.

Install pinned tooling and dependencies, configure local env/infrastructure, then run the commands in docs/development/getting-started.md. Hooks are installed by `prepare` only in a writable checkout; pre-commit runs lint-staged rather than full tests. CI remains authoritative and requires a committed generated lockfile.

For changes, test important rules and denial paths; database changes include reviewed migrations and apply/rollback-integrity checks on a disposable test database. Keep presentation and HTTP glue thin. Update contracts/OpenAPI and documentation when behavior changes; record architecture decisions with a numbered ADR.

Before review: format, lint, typecheck, tests and production build; run integration/browser checks when affected. Describe the problem, resulting behavior, actual verification and remaining limits. Preserve unrelated changes and avoid force-pushes, destructive resets, volume deletion or deployment without authorization.
