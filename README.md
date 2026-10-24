# EduOS

TypeScript foundation for a multi-tenant school SaaS serving Bangladesh, initially Classes 1–10. This bootstrap includes a React shell, Hono API, PostgreSQL/Drizzle schema, Better Auth integration, tenant authorization boundaries, tests and agent instructions. School business modules are intentionally deferred.

**Bootstrap status:** source implemented; full installation and production-readiness verification are blocked in the current restricted environment. Read [verification](docs/development/verification.md) for exact results before relying on this setup.

```text
apps/admin                 React/Vite shell with src/app/**/page.tsx routes
apps/api                   Hono process, middleware and identity capability
packages/contracts         Zod request/response contracts
packages/auth              Separate browser/server Better Auth exports
packages/permissions       Tenant, membership, role and resource policy interfaces
packages/database          PostgreSQL pool, schemas and migrations
packages/ui                shadcn-style primitives and Tailwind tokens
packages/typescript-config Shared strict TS settings
packages/oxlint-config     Shared Oxlint policy
infrastructure/docker      PostgreSQL and reserved Redis Compose services
docs                       Architecture, domain, ADRs and development guides
agent-skills               Eleven skills pending installation into .agents/skills
scripts                    Environment, hooks and agent validation/install tools
.github/workflows          Quality and integration CI
```

Start with [getting started](docs/development/getting-started.md). Use Node 24 LTS and pnpm 12.14.0. Selected dependency versions are in package manifests and [versions.json](docs/development/versions.json); they are not all installed in this environment.

```sh
pnpm install
pnpm env:setup
pnpm infra:up
pnpm db:migrate
pnpm dev
```

Admin: http://localhost:5173. API: http://localhost:3001/api/health. API documentation: `/api/openapi.json`. Development user provisioning and browser setup are documented in the getting-started guide. Never commit `.env` files.

Quality commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`, `pnpm format:check`. Formatting: `pnpm format`. Database: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`. Infrastructure shutdown: `pnpm infra:down`, preserving data.

Architecture starts [here](docs/architecture/overview.md); product scope and the inspected specification are in [domain overview](docs/domain/overview.md). Agent source of truth: [AGENTS.md](AGENTS.md). Recommended first feature: controlled institution provisioning and invitations, with permission policy and cross-tenant integration tests, before academic modules.
