# Getting started

Use Node 24 LTS, pnpm 12.14.0, Docker Engine with Compose v2 and Git. Install pnpm through Corepack or the official pnpm installer. Network access to the npm registry is required on the first install. This environment generated a lockfile but could not complete a verified frozen install; read verification.md before attempting CI.

```sh
pnpm install
pnpm agents:install
pnpm env:setup
pnpm infra:up
pnpm db:migrate
pnpm dev
```

`env:setup` generates independent cryptographic auth/database secrets and creates root/API/admin local env files without overwriting existing files. Root `.env` is for Compose/database tools, API `.env` is private server configuration, and admin `.env` contains public origins only. If some files already existed, align database credentials and origins manually. Set secrets with your deployment secret manager in production. Never commit generated env files.

Open http://localhost:5173. API health is http://localhost:3001/api/health; readiness checks the real database. Use localhost for browser origins consistently; Compose binds infrastructure ports to loopback. API OpenAPI JSON is `/api/openapi.json`. Shared packages build before dev; rebuild them after edits.

To test login, set `EDUOS_USER_EMAIL`, `EDUOS_USER_NAME`, and `EDUOS_USER_PASSWORD` in the private API `.env`, run `pnpm auth:create-user`, then remove those temporary provisioning values. Do not pass passwords in shell arguments. Sign in at `/login`; an account without memberships correctly sees an empty workspace. Institution provisioning and invitations are intentionally deferred. Synthetic institutions/memberships are created only by integration tests.

For initial development access, use `pnpm auth:bootstrap` after applying migrations. Set `EDUOS_BOOTSTRAP_EMAIL` to an existing account in the private API `.env`. Set `EDUOS_BOOTSTRAP_SCOPE=platform` for the first Platform Owner, or `EDUOS_BOOTSTRAP_SCOPE=institution` with `EDUOS_BOOTSTRAP_INSTITUTION_ID` for the first Admin of an existing institution. The command is development-only, creates no institution or account, records an audit event and refuses if an active Owner/Admin already exists in that scope. Remove the temporary bootstrap variables afterward. No bootstrap runs automatically and no default credentials exist. Production provisioning/recovery needs a separate authorized workflow.

Admin and Principal can update existing school memberships through the documented API. Platform Owner can assign platform roles to existing accounts; Platform Manager can inspect institution metadata. See [authentication](../architecture/authentication.md) for role grants and the login/access flow. Migrated existing school memberships have an unassigned role and require explicit assignment before workspace access. This backend change does not add role-management or platform frontend screens.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
pnpm infra:down
```

`infra:down` preserves named data volumes. Never add `--volumes` as a routine reset. Redis is reserved and not used by apps. PostgreSQL 18's volume is mounted at `/var/lib/postgresql` per its image convention. Configure backups/restore separately.

Before editing schema: `pnpm db:generate`, inspect SQL, then `pnpm db:migrate`. Studio: `pnpm db:studio`. Do not run migration generation instead of applying committed migrations on first setup. To use alternate ports, update Compose port variables, DATABASE_URL and app origins together. Do not use URL credentials that need escaping without percent-encoding them.
