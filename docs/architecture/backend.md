# Backend

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

Identity routes live in `modules/identity/routes.ts` and mount at `/api/v1`; platform routes live in `modules/platform/routes.ts` and mount separately at `/api/v1/platform`. The app factory mounts both and retains global session-cookie, origin, logging, body-limit and error protections. School role/status PUT bodies are exactly `{ role, active }`, with nullable role for unassignment. Platform PUT bodies require a platform role and active boolean. Unknown fields and roles are rejected; body-provided identities/permissions are never trusted. A same-state PUT returns 200 without another audit event. Conflicting last-administrator changes return 409. Role changes currently use last-writer-wins desired state, with authorization and continuity serialized by service transactions; there is no optimistic-version API guarantee.

Lists accept `limit` (1–100, default 50) and `offset` (0–100000, default 0), ordered by unique user/institution ID. Pagination does not promise a snapshot across requests. Tenant membership targets must already belong to the selected institution; missing/foreign targets return 403. Platform missing-institution responses return 404 after permission checks. Creation validates name, unique slug, IANA time zone, kindergarten/high-school/coaching-center type and a new first Admin's name/email/password. Slug conflicts return `INSTITUTION_SLUG_TAKEN`; an existing Admin email returns `ADMIN_EMAIL_TAKEN`, both 409. The whole transaction rolls back on either conflict. Credentials are never returned or logged. Creation rejects module settings and initializes all module grants off; the separate modules PUT manages them after creation.

Status writes require a reason for frozen/inactive states and block subsequent tenant access. Module replacement does not change role grants. Subscription PUT records plan name/status, monthly/annual cycle, whole-taka BDT amount and optional calendar period end. It performs no payment or automatic access-state change. Institution settings writes lock the operator and institution, audit atomically and leave identical repeated desired states unchanged. See [ADR 0009](../decisions/0009-platform-institution-management.md).
