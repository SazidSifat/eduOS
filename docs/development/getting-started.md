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
