# Backend

The API uses MVC-style layers. `src/index.ts` starts the server and `src/app.ts` composes the Hono app. `src/routes/<capability>.routes.ts` registers URLs against typed controller handler chains in `src/controllers/<capability>.controller.ts`. Controllers validate requests, preserve session/permission middleware order, delegate to services and validate response contracts. `src/services/<capability>` owns business rules and transaction coordination. Focused persistence helpers live in `src/models`; shared Drizzle schemas remain the canonical models in `packages/database`. The React apps provide the views. Shared middleware stays in `src/middleware`, utilities and OpenAPI builders in `src/lib`, and configuration in `src/config`. See [ADR 0014](../decisions/0014-mvc-api-layout.md).

`src/index.ts` validates configuration, creates one pool and auth instance, initializes identity services and starts the Node Hono adapter. `createApp` accepts dependencies for HTTP tests. SIGINT/SIGTERM drain HTTP and close the pool with a bounded shutdown deadline.

Middleware generates server-controlled UUID request IDs, security headers, exact-origin credentialed CORS and a 16 KiB body limit. Unsafe versioned and auth requests require a trusted Origin; Better Auth also retains its framework CSRF checks. Logs allow only event/method/status/duration/request-ID fields, excluding paths, headers, bodies and raw errors. Production config requires HTTPS origins. Database errors become generic error contracts.

| Endpoint                                                      | Purpose                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| GET /api/health                                               | Process liveness; no dependency calls                                     |
| GET /api/ready                                                | Actual bounded PostgreSQL `select 1`; 503 on failure                      |
| GET /api/openapi.json                                         | OpenAPI 3.1 schemas derived from shared Zod contracts                     |
| /api/auth/\*                                                  | Better Auth framework handler; its own error envelope                     |
| GET /api/v1/me                                                | Session-verified minimal identity                                         |
| GET /api/v1/memberships                                       | Current user's active institution memberships                             |
| GET /api/v1/institutions/:institutionId/workspace             | Validated ID, membership, permission and scoped query                     |
| GET /api/v1/institutions/:institutionId/access                | Current school role and effective permissions                             |
| GET /api/v1/institutions/:institutionId/roles                 | School role catalog for an authorized member                              |
| GET /api/v1/institutions/:institutionId/memberships           | Bounded membership list for Admin/Principal                               |
| PUT /api/v1/institutions/:institutionId/memberships/:userId   | Audited role/active-state update for an existing membership               |
| GET /api/v1/platform/access                                   | Current platform operator role and permissions                            |
| GET /api/v1/platform/institutions                             | Bounded institution metadata list for Owner/Manager                       |
| POST /api/v1/platform/institutions                            | Super Admin creates institution, module grants and first Admin atomically |
| GET /api/v1/platform/institutions/:institutionId              | Institution metadata detail for platform staff                            |
| PUT /api/v1/platform/institutions/:institutionId/status       | Super Admin freezes, deactivates or reactivates with an audited reason    |
| PUT /api/v1/platform/institutions/:institutionId/modules      | Super Admin replaces enabled institution modules                          |
| GET /api/v1/platform/subscriptions                            | Paged institutions and their optional manual subscription terms           |
| GET /api/v1/platform/institutions/:institutionId/subscription | Super Admin reads subscription; null when unconfigured                    |
| PUT /api/v1/platform/institutions/:institutionId/subscription | Super Admin creates/replaces audited manual subscription terms            |
| GET /api/v1/platform/operators                                | Bounded platform operator list for Super Admin                            |
| PUT /api/v1/platform/operators/:userId                        | Super Admin assigns or updates platform access for an existing identity   |

Versioned errors use `{ error: { code, message, requestId } }`. Zod validates request parameters and successful application response data. Auth framework responses follow Better Auth, deliberately unmodified. New modules group code by capability; keep domain rules in services rather than handlers. Redis readiness is intentionally excluded until an actual critical use exists.

Identity routes live in `routes/identity.routes.ts` and mount at `/api/v1`; platform routes live in `routes/platform.routes.ts` and mount separately at `/api/v1/platform`. The app factory mounts both and retains global session-cookie, origin, logging, body-limit and error protections. School role/status PUT bodies are exactly `{ role, active }`, with nullable role for unassignment. Platform PUT bodies require a platform role and active boolean. Unknown fields and roles are rejected; body-provided identities/permissions are never trusted. A same-state PUT returns 200 without another audit event. Conflicting last-administrator changes return 409. Role changes currently use last-writer-wins desired state, with authorization and continuity serialized by service transactions; there is no optimistic-version API guarantee.

Lists accept `limit` (1–100, default 50) and `offset` (0–100000, default 0), ordered by unique user/institution ID. Pagination does not promise a snapshot across requests. Tenant membership targets must already belong to the selected institution; missing/foreign targets return 403. Platform missing-institution responses return 404 after permission checks. Creation validates name, unique slug, IANA time zone, kindergarten/high-school/coaching-center type and a new first Admin's name/email/password. Slug conflicts return `INSTITUTION_SLUG_TAKEN`; an existing Admin email returns `ADMIN_EMAIL_TAKEN`, both 409. The whole transaction rolls back on either conflict. Credentials are never returned or logged. Creation rejects module settings and initializes all module grants off; the separate modules PUT manages them after creation.

Status writes require a reason for frozen/inactive states and block subsequent tenant access. Module replacement does not change role grants. Subscription PUT records plan name/status, monthly/annual cycle, whole-taka BDT amount and optional calendar period end. It performs no payment or automatic access-state change. Institution settings writes lock the operator and institution, audit atomically and leave identical repeated desired states unchanged. See [ADR 0009](../decisions/0009-platform-institution-management.md).

Institution responses include the read-only six-digit `code`; school membership/workspace and subscription-directory responses also expose it. Creation rejects client-provided codes. `GET /api/v1/platform/institutions` accepts an optional exact `code` filter, validated as six digits beginning with 1–9 and applied before pagination. This lookup retains platform read authorization and never grants tenant access. UUIDs remain the route/resource selectors. See [ADR 0010](../decisions/0010-institution-codes.md).

School Admissions routes mount separately under `/api/v1/institutions/:institutionId/admissions`. Services enforce assigned Admission Officer scope, module access and transaction-boundary checks. The API process delivers durable in-app reminders every 30 seconds; it never migrates on startup. See [ADR 0011](../decisions/0011-school-admissions.md) and the [setup/API workflow](../development/admissions.md).

The live school facade at `/api/v1/institutions/:institutionId/school` aggregates authorized capability reads and delegates validated idempotent commands to their owning services inside one transaction. Evidence upload/download remain authenticated and tenant-scoped. See [ADR 0012](../decisions/0012-live-school-workspace.md) and [school workspace setup](../development/school-workspace.md).

The school command `enrollment-dates` delegates to Student Lifecycle, requires Academics management access, records atomic date history and protects submitted attendance. Shared Zod contracts also document the action in OpenAPI. See [ADR 0013](../decisions/0013-dated-enrollment-rosters.md).

Enrollment date history has a separate bounded school read endpoint requiring current Academics management access and enrollment ownership. Audit reasons are not included in general attendance snapshots. See [ADR 0013](../decisions/0013-dated-enrollment-rosters.md).
