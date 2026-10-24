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

`env:setup` generates independent cryptographic auth/database secrets and creates root/API/admin/platform local env files without overwriting existing files. Root `.env` is for Compose and Drizzle generation/Studio tools, API `.env` is private server configuration and the local migration connection source, and admin/platform `.env` files contain public origins only. If some files already existed, align database credentials and origins manually. Set secrets with your deployment secret manager in production. Never commit generated env files.

Run `pnpm db:migrate:check` to verify database connectivity without applying migrations, then `pnpm db:migrate` to apply the committed Drizzle migrations. Both load `apps/api/.env` when present; an explicitly supplied shell `DATABASE_URL` takes precedence. A deployed migration environment may omit the local file and inject its own connection. Connection failures exit nonzero with sanitized guidance; the commands do not create databases, reset data, generate SQL, create login accounts or run on API startup. PostgreSQL error `28P01` requires correcting database credentials before migrations can run. After changing the API's environment file, restart the API process to load it.

Open http://localhost:5173. API health is http://localhost:3001/api/health; readiness checks the real database. Use localhost for browser origins consistently; Compose binds infrastructure ports to loopback. API OpenAPI JSON is `/api/openapi.json`. Shared packages build before dev; rebuild them after edits.

For the platform console, run `pnpm dev:platform` and open http://localhost:5174. It requires a provisioned Super Admin (`platform_owner`) or Platform Manager. Apply migration `0002` before starting this API/client version. Super Admin can create an institution and its first school Admin, set institution type/modules, freeze/deactivate/reactivate access and manage manual subscription terms. The new school Admin signs in at http://localhost:5173. Messaging and automated billing remain deferred. See [platform integration](platform-preview.md).

For a standalone development identity, set `EDUOS_USER_EMAIL`, `EDUOS_USER_NAME`, and `EDUOS_USER_PASSWORD` in the private API `.env`, run `pnpm auth:create-user`, then remove the temporary values. Repeating the command preserves existing credentials/profile/access and does not reset a password. Identity and credential creation commit together. Do not pass passwords in shell arguments. This standalone identity has no membership until explicitly granted access. Platform institution creation provisions its own new first school Admin atomically. Invitations and password-reset delivery remain deferred.

For initial development access, use `pnpm auth:bootstrap` after applying migrations. First create an account with the private API `.env` values `EDUOS_USER_EMAIL`, `EDUOS_USER_NAME` and `EDUOS_USER_PASSWORD`, then run `pnpm auth:create-user`. Set `EDUOS_BOOTSTRAP_SCOPE=platform` and `EDUOS_BOOTSTRAP_EMAIL` to that existing account's email in `apps/api/.env`, then run `pnpm auth:bootstrap` to grant the first Super Admin (`platform_owner`). Alternatively, set scope to `institution` and provide `EDUOS_BOOTSTRAP_INSTITUTION_ID` for the first Admin of an existing institution. The command is development-only, creates no institution or account, records an audit event and refuses if an active Super Admin/Admin already exists in that scope. Remove the temporary bootstrap variables afterward. No bootstrap runs automatically and no default credentials exist. Production provisioning/recovery needs a separate authorized workflow.

To replace one active development Super Admin, create the target account first, set `EDUOS_PLATFORM_REPLACEMENT_EMAIL` in the private API `.env`, then run `pnpm auth:replace-platform-owner`. The atomic handoff activates the new `platform_owner` and deactivates the previous operator with audit rows. It preserves both identity records and refuses ambiguous states with multiple active Super Admins. This command is development-only.

Admin and Principal can update existing school memberships through the documented API while their institution is active. Super Admin can create institutions with a new first Admin and assign platform roles to existing accounts; Platform Manager can inspect institution settings. Existing institution types remain unclassified and module grants are off until explicitly configured. See [authentication](../architecture/authentication.md). Older unassigned memberships still require an explicit role before workspace access.

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
