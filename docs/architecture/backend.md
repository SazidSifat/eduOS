# Backend

`src/index.ts` validates configuration, creates one pool and auth instance, initializes identity services and starts the Node Hono adapter. `createApp` accepts dependencies for HTTP tests. SIGINT/SIGTERM drain HTTP and close the pool with a bounded shutdown deadline.

Middleware generates server-controlled UUID request IDs, security headers, exact-origin credentialed CORS and a 16 KiB body limit. Unsafe versioned requests require a trusted Origin; Better Auth owns its own CSRF checks. Logs allow only event/method/status/duration/request-ID fields, excluding paths, headers, bodies and raw errors. Production config requires HTTPS origins. Database errors become generic error contracts.

| Endpoint                                                    | Purpose                                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| GET /api/health                                             | Process liveness; no dependency calls                             |
| GET /api/ready                                              | Actual bounded PostgreSQL `select 1`; 503 on failure              |
| GET /api/openapi.json                                       | OpenAPI 3.1 schemas derived from shared Zod contracts             |
| /api/auth/\*                                                | Better Auth framework handler; its own error envelope             |
| GET /api/v1/me                                              | Session-verified minimal identity                                 |
| GET /api/v1/memberships                                     | Current user's active institution memberships                     |
| GET /api/v1/institutions/:institutionId/workspace           | Validated ID, membership, permission and scoped query             |
| GET /api/v1/institutions/:institutionId/access              | Current school role and effective permissions                     |
| GET /api/v1/institutions/:institutionId/roles               | School role catalog for an authorized member                      |
| GET /api/v1/institutions/:institutionId/memberships         | Bounded membership list for Admin/Principal                       |
| PUT /api/v1/institutions/:institutionId/memberships/:userId | Audited role/active-state update for an existing membership       |
| GET /api/v1/platform/access                                 | Current platform operator role and permissions                    |
| GET /api/v1/platform/institutions                           | Bounded institution metadata list for Owner/Manager               |
| GET /api/v1/platform/operators                              | Bounded platform operator list for Owner                          |
| PUT /api/v1/platform/operators/:userId                      | Owner assigns or updates platform access for an existing identity |

Versioned errors use `{ error: { code, message, requestId } }`. Zod validates request parameters and successful application response data. Auth framework responses follow Better Auth, deliberately unmodified. New modules group code by capability; keep domain rules in services rather than handlers. Redis readiness is intentionally excluded until an actual critical use exists.

Identity routes live in `modules/identity/routes.ts`; platform routes live in `modules/platform/routes.ts`. The app factory mounts both and retains global session-cookie, origin, logging, body-limit and error protections. School role/status PUT bodies are exactly `{ role, active }`, with nullable role for unassignment. Platform PUT bodies require a platform role and active boolean. Unknown fields and roles are rejected; body-provided identities/permissions are never trusted. A same-state PUT returns 200 without another audit event. Conflicting last-administrator changes return 409. Role changes currently use last-writer-wins desired state, with authorization and continuity serialized by service transactions; there is no optimistic-version API guarantee.

Lists accept `limit` (1–100, default 50) and `offset` (0–100000, default 0), ordered by unique user or institution ID. Pagination does not promise a snapshot across requests. Institution membership targets must already belong to the selected institution; missing and foreign targets return 403. Platform Owner can add operators only for existing identities; school account onboarding remains separate. Session and policy checks precede protected reads/writes, and services recheck grants at the data boundary.
