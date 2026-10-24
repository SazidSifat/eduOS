# Database

PostgreSQL 18, node-postgres pooling (10 connections/process), Drizzle ORM and Drizzle Kit. Pool connections use UTC, a 3 second connection timeout and a 10 second statement timeout. Respect database URL TLS configuration; production should use verified TLS and a restricted runtime role separate from the migration role.

`schema/auth.ts` owns Better Auth user/session/account/verification/rate-limit tables. `schema/identity.ts` owns institution and membership. Auth IDs are UUID strings stored as text for adapter compatibility; institution IDs are PostgreSQL UUIDs. Timestamps use `timestamptz` with creation defaults; mutable auth rows also have updated timestamps. Institutions are intentionally not yet a full configuration aggregate.

Constraints include unique email/token/slug/provider-account keys, membership composite PK, foreign keys, slug format and lookup/expiry indexes. Membership deletion follows user removal; institution deletion is restricted while memberships exist. Future tenant-to-tenant references must include institution ID in composite ownership constraints.

`createDatabase` returns `db`, `pool`, a transaction helper and `close`. Multi-write operations use transactions. Schema changes use `pnpm db:generate`, review SQL/snapshots, then `pnpm db:migrate`; migration execution is explicit and tracked by Drizzle, never API startup. `db:studio` requires configured reachable PostgreSQL. No automatic reset or destructive push script is provided.

Integration tests require a dedicated `eduos_test*` database, apply committed migrations, create unique synthetic fixtures, verify authentication/isolation/rollback, and remove only their own rows. Do not point tests at development or production data. Backups, restore drills and online migration strategies need deployment-specific work before pilot use.
