# EduOS agent instructions

EduOS is a Bangladesh school SaaS for Classes 1–10. This repository currently implements infrastructure and identity only. Read `docs/domain/overview.md`, the relevant bounded context, and `docs/architecture/` before implementing a feature. The linked product specification is proposed; school policies require discovery.

## Architecture and code

- Inspect existing code and Git status first. Preserve unrelated work; never overwrite or delete another person's changes. In this environment `.git` and `.agents` may be read-only mounts; do not bypass their permissions.
- Prefer existing utilities and `@eduos/*` exports. Browser code may import `@eduos/auth/client`, contracts, permissions and UI; never database or auth server code.
- Organize API capabilities under `apps/api/src/modules/<capability>` and frontend capabilities under `apps/admin/src/features/<capability>`. Add folders only with actual files. No worker until processing exists.
- Keep business rules in domain/application services, outside HTTP handlers and presentation components. Avoid cross-module writes; use explicit services. Avoid dependencies and abstractions without a concrete use.
- Keep each manually maintained source file at a maximum of 400 lines, including comments and blank lines. When creating or modifying a file, split it into focused files before exceeding this limit; do not compress formatting or remove useful comments to fit.
- Keep components focused on one responsibility. Extract cohesive child components, hooks, schemas, types and utilities as needed, colocated with their feature or capability. Use clear names and explicit interfaces; avoid arbitrary file splits, unrelated helpers and unnecessary abstractions.
- Use strict TypeScript, narrow unknown values, type-only imports and explicit package exports. Do not use `any`, unchecked casts, or non-null assertions to hide errors. Use `.js` relative imports in compiled Node packages.
- Validate every external input with Zod. Validate API responses with shared contracts. Update OpenAPI when adding routes.
- TanStack Query owns server state. Use the central API client and feature queries. Zustand currently stores theme preference only. Routes originate in `apps/admin/src/app` using folder `page.tsx` files and the generated TanStack tree. Never maintain a manual route list or edit generated routing output. Forms use React Hook Form and Zod. Preserve keyboard access, labels, focus and semantic HTML.

## Identity, data and security

- Better Auth establishes identity; application policy establishes institution access. Check session, active membership, permission, and resource ownership on every tenant operation. A client tenant ID is only a selector.
- Default deny. Keep grants out of the authentication library. Existing `workspace.read` is the only foundation grant. Revalidate membership at the data boundary; test revocation and cross-tenant denial.
- Every tenant-owned row needs an explicit institution ID or a documented enforced ownership path. Future cross-tenant references require composite ownership constraints. RLS is **not enabled**; do not claim otherwise.
- Schema changes require reviewed Drizzle migrations, indexes and constraints. Never edit an applied migration, run `push` against shared data, or run migrations on API startup. Persist instants as UTC `timestamptz`.
- Never expose credentials, cookies, tokens, passwords or private student information in source, logs, errors, fixtures, screenshots or reports. Use synthetic data. Public Vite variables must contain no secrets.
- Keep secure cookies, exact trusted origins, origin checks and authentication rate limits. Never disable TLS verification or blindly trust forwarded IP headers.

## Commands and completion

Read `docs/development/getting-started.md` before commands. Do not delete Docker volumes, reset a database, force-push, publish, or deploy without authorization. Integration tests must use a dedicated `eduos_test*` database. Never substitute cached dependency checks for a verified clean install.

Test important policy rules, negative authorization, transactions and regressions. Run focused checks while working, then the applicable root quality commands. UI changes need a browser check. Update architecture docs and ADRs when boundaries or decisions change.

Definition of done: requirements implemented, boundaries preserved, migrations reviewed, important tests passing, documentation accurate, no secrets or unrelated changes. Report changed files, commands run, actual results, blockers and unresolved risks. Never report an unexecuted check as passing.

## Local skills

The canonical skill sources are temporarily in `agent-skills/` because this environment mounts `.agents` read-only. `pnpm agents:install` copies them without overwriting to `.agents/skills/` in a writable checkout. Until then, explicitly read the relevant `agent-skills/<name>/SKILL.md`. Shared rules above apply to all skills. `pnpm agents:validate` checks frontmatter, names, references and expected inventory; it does not prove automatic discovery or behavior in every agent.
