# Authentication and authorization

Better Auth uses the PostgreSQL Drizzle adapter. Email/password login is enabled, public signup disabled, passwords require 12–128 characters. Sessions last seven days, update daily, and are checked against the database without cookie caching. Cookies are HttpOnly, SameSite=Lax, host-scoped and Secure in production. Configure frontend and API on the same site; unrelated-site deployment requires an explicit cookie/CSRF design change. Do not store session tokens in localStorage.

`pnpm auth:create-user` is a development-only internal CLI using Better Auth's password hasher and transactional user/account writes. It creates no membership and offers no public registration route. Email verification, invitations, password reset delivery, MFA and production provisioning are deferred; this bootstrap is not ready for public onboarding.

Active membership is verified for each institution request. Switching is a validated per-request selection, not a global session grant; revocation takes effect on subsequent reads. `MembershipResolver`, `RoleDefinition`, `ResourcePolicy` and `can` define application boundaries. Only `workspace.read` is currently granted to active members; proposed school roles remain unimplemented.

Better Auth rate limits are enabled in every environment with database storage, 60 general requests/minute and 5 sign-in attempts/minute. The pinned 1.7 adapter handles shared database counters. A trusted reverse proxy MUST strip client-supplied `x-eduos-client-ip`, set that header from the verified connection IP and prevent direct API access. With no trusted IP header, local callers may share a limiter bucket. Test proxy behavior before deployment and add edge limits against distributed attacks.

Auth's own error responses are framework-managed. Application errors do not expose auth internals. See integration tests for real login/cookie/session, forged origins, logout, rate limiting and cross-institution denial; check verification.md before treating any as passed.
