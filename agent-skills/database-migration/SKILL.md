---
name: database-migration
description: Change EduOS Drizzle schemas and produce reviewed PostgreSQL migrations with constraints and data-preservation verification. Use whenever persistence structure changes.
---

# Database Migration

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/architecture/database.md`.

## Workflow

1. Inspect schema ownership and committed migrations. Determine data preservation, lock duration and compatibility with existing deployments.
2. Add explicit institution ownership, tenant indexes, scoped unique constraints and composite ownership FKs for tenant references. Use UUIDs and timestamptz.
3. Run `pnpm db:generate`. Read every generated statement and snapshot; replace unsafe operations with an expand/backfill/contract plan where needed.
4. Apply to a disposable eduos_test database using committed migration tooling. Verify clean apply, reapplication idempotence, constraints and transactional integrity.
5. Describe deployment order, backfill verification and recovery. Do not rewrite applied SQL, use push on shared data or reset volumes.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
