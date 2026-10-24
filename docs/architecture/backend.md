# Backend

`src/index.ts` validates configuration, creates one pool and auth instance, initializes identity services and starts the Node Hono adapter. `createApp` accepts dependencies for HTTP tests. SIGINT/SIGTERM drain HTTP and close the pool with a bounded shutdown deadline.

Middleware generates server-controlled UUID request IDs, security headers, exact-origin credentialed CORS and a 16 KiB body limit. Unsafe versioned requests require a trusted Origin; Better Auth owns its own CSRF checks. Logs allow only event/method/status/duration/request-ID fields, excluding paths, headers, bodies and raw errors. Production config requires HTTPS origins. Database errors become generic error contracts.

| Endpoint                                          | Purpose                                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| GET /api/health                                   | Process liveness; no dependency calls                 |
| GET /api/ready                                    | Actual bounded PostgreSQL `select 1`; 503 on failure  |
| GET /api/openapi.json                             | OpenAPI 3.1 schemas derived from shared Zod contracts |
| /api/auth/\*                                      | Better Auth framework handler; its own error envelope |
| GET /api/v1/me                                    | Session-verified minimal identity                     |
| GET /api/v1/memberships                           | Current user's active institution memberships         |
| GET /api/v1/institutions/:institutionId/workspace | Validated ID, membership, permission and scoped query |

Versioned errors use `{ error: { code, message, requestId } }`. Zod validates request parameters and successful application response data. Auth framework responses follow Better Auth, deliberately unmodified. New modules group code by capability; keep domain rules in services rather than handlers. Redis readiness is intentionally excluded until an actual critical use exists.
