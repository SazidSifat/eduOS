# Platform console

`apps/platform` is a separate React/Vite app on port 5174. Generated TanStack routes validate `/api/v1/me` and `/api/v1/platform/access`. Anonymous users go to `/login`; school users without a separate operator assignment go to `/access-denied`. No institution, operator, subscription or message sample records are seeded or displayed.

```sh
pnpm db:migrate
pnpm dev:platform
```

Open http://localhost:5174. Shared packages build before dev. The Vite server proxies `/api` to the local API; trusted origins include the exact platform origin. `apps/platform/.env` contains only public origins. The school administration app remains on http://localhost:5173 and receives the new first school Admin's login.

| Route                          | Current behavior                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `/`                            | Live institution directory counts, operator assignments and resolved role                             |
| `/institutions`                | Search live institution names, slugs, type, state and identifiers                                     |
| `/institutions/new`            | Super Admin creates an institution, selects its type and provisions its first school Admin atomically |
| `/institutions/:institutionId` | Live institution details with access state, module controls and the inline subscription editor        |
| `/subscriptions`               | Subscription directory; Manage opens the subscription section on institution details                  |
| `/operators`                   | Live operator list and role/active-state updates for Super Admin                                      |
| `/operators/:operatorId`       | Live operator assignment and role grants                                                              |
| `/messages`                    | Unavailable state until delivery and recipient policies exist; hidden from navigation                 |

The platform access provider derives role/grants from the API. There is no client role selector. Platform Manager can inspect institution settings; only Super Admin receives institution creation/management, subscription-management and operator-management grants. Every API rechecks policy independently. Platform roles never bypass school membership checks.

Each institution has a database-generated, unique six-digit code. The directory shows/searches it, details provide a read-only copy control, and the subscription directory and school workspace include it. Entering an exact six-digit code performs a server lookup beyond the first directory page. Creation assigns the code automatically. Apply migration `0003_institution_code` before this API/client version; existing institutions receive codes without replacing their UUIDs or memberships.

Platform handlers stay in `apps/api/src/modules/platform` and mount separately at `/api/v1/platform`; frontend clients retain the `/api/v1` prefix. Creation requires kindergarten, high-school or coaching-center type and a new first Admin's name/email/initial password. Every module starts off. After creation, the console opens the institution details page, where Super Admin can enable or disable school modules. A duplicate slug or existing Admin email returns a safe field-specific 409 code and rolls back the transaction. Passwords are masked in the form and excluded from responses/audit/logs. Existing identities are not automatically attached or reset by this workflow.

Frozen/deactivated institutions retain their records but cannot enter the school workspace or use membership APIs. A reason is required. Reactivation restores access according to existing memberships. Module switches independently enable academic setup, admissions, attendance, assessment/results and fees/collections. Missing grants deny module access, and role permissions are still required. These settings do not implement the corresponding school business workflows.

Subscription management is embedded on the institution details page; no separate subscription edit route exists. Subscriptions are manually recorded terms with a free-form plan name, trial/active/past-due/cancelled state, monthly/annual cycle, whole-taka amount and optional period end date. Saving does not charge, invoice, auto-renew or change institution access. Subscription cancellation and school deactivation remain independent explicit actions.

Migration `0002` is additive. Existing institutions remain active with a nullable unclassified type, no configured subscription and no enabled module grants until Super Admin configures them. Institution creation/status/module/subscription changes append attributable audit records in the same transaction. Identical repeated state writes do not append duplicate events.

The interface uses a persistent 224px sidebar, compact tables, restrained green controls and neutral light/matte charcoal surfaces. Type sizes are 12, 14 and 24px; small-screen body/controls use 16px. Panels use 6px radii, controls 4px and interactions 150ms ease-out with reduced-motion support. Forms use shared UI components, React Hook Form and Zod; TanStack Query owns live data.

See [ADR 0009](../decisions/0009-platform-institution-management.md) for access/billing boundaries and [testing](testing.md) for dedicated-database verification.
