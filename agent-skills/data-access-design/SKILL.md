---
name: data-access-design
description: Design or improve EduOS Drizzle queries and PostgreSQL transaction behavior, including tenant ownership, concurrency, indexes and bounded reads. Use for persistence behavior or a concrete query bottleneck; use database-migration to produce schema migrations.
---

# Data Access Design

Read root and database `AGENTS.md` instructions, `docs/architecture/database.md` and `docs/architecture/multi-tenancy.md`. Inspect the affected schema, committed migrations, `packages/database/src/client/index.ts` and the nearest capability service. `apps/api/src/modules/identity/service.ts` demonstrates membership checks repeated in the data query. Paths are relative to the repository root.

## Trace ownership and access patterns

List each query's actor, institution, ownership path, filters, projection, ordering and expected cardinality. Keep queries with the owning capability. Use explicit services for cross-context writes and existing `@eduos/database` exports; extend public exports narrowly if a needed Drizzle primitive is absent.

Enforce institution and resource ownership in reads and writes, including joins, counts, bulk operations and conflict targets. Revalidate active membership at the data boundary; a UUID or earlier HTTP middleware check is not proof of ownership. For tenant references, design composite ownership constraints and scoped unique keys. Use the auth-security skill when permission or revocation semantics change. RLS remains disabled in this foundation.

## Specify atomicity and concurrency

- Name the transaction owner and use the same transaction connection for all related writes. Inspect the existing transaction helper before proposing how services share its context.
- Encode uniqueness and valid relationships in PostgreSQL constraints. Use a conditional update, version predicate or row lock when a state transition depends on the current row; check the affected result and map a failed precondition to a domain outcome.
- Choose isolation from the actual anomaly being prevented. If serialization/deadlock retries are needed, bound retries and rerun the entire safe transaction; never retry an arbitrary statement or every database error. Keep external effects outside that retry loop.
- For writes requiring strict revocation ordering, specify how membership and resource checks are coordinated with the mutation. An earlier membership read alone does not serialize against concurrent revocation.
- For idempotent operations, define the scoped uniqueness key, payload equivalence, atomic claim/result write and replay behavior. Use persisted records only when the use case needs this guarantee.

## Bound work and measure before tuning

Select required columns, bound lists and batch repeated relation reads when needed to avoid N+1 queries. Derive indexes from tenant filters, joins and ordering; consider write cost and redundant indexes rather than indexing every field. Use stable ordering with a unique tie-breaker for pagination. Keep institution calendar dates distinct from UTC instants when the domain introduces them; do not silently reinterpret school days using server timezone.

For a reported bottleneck, capture query shape, representative synthetic cardinality and a plan on a dedicated test database. `EXPLAIN ANALYZE` executes the statement: use it only for safe reads or an isolated, rollback-safe test with no external effects. Compare observable query/latency behavior before and after; a small fixture cannot prove production performance. Respect the current per-process pool and statement budgets. Introduce caching only with defined tenant keys, invalidation and revocation behavior.

Use database-migration for schema/index changes and migration review. Use [references/checks.md](references/checks.md) for evidence; report unexecuted database checks as gaps rather than inferring success from mocks.
