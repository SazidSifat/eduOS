# Authentication and authorization

Better Auth uses the PostgreSQL Drizzle adapter. Email/password login is enabled, public signup disabled, passwords require 12–128 characters. Sessions last seven days, update daily, and are checked against the database without cookie caching. Cookies are HttpOnly, SameSite=Lax, host-scoped and Secure in production. Configure frontend and API on the same site; unrelated-site deployment requires an explicit cookie/CSRF design change. Do not store session tokens in localStorage.

`pnpm auth:create-user` is a development-only internal CLI using Better Auth's password hasher and transactional user/account writes. It creates no membership and offers no public registration route. `pnpm auth:bootstrap` grants initial development Admin or Platform Owner access to an existing account; see getting-started.md. Email verification, invitations, password reset delivery, MFA and production provisioning remain deferred; this bootstrap is not ready for public onboarding.

Active membership and its role are verified for each institution request. Switching is a validated per-request selection, not a global session grant. Roles and grants are not stored in session claims or accepted from the browser. `MembershipResolver`, `RoleDefinition`, `ResourcePolicy` and `can` define institution boundaries. A nullable membership role means unassigned and grants nothing. Existing memberships are not automatically assigned a role during migration.

| Institution role                        | Workspace | List and manage institution memberships |
| --------------------------------------- | --------- | --------------------------------------- |
| Admin (`admin`)                         | Yes       | Yes                                     |
| Principal (`principal`)                 | Yes       | Yes                                     |
| Admission Officer (`admission_officer`) | Yes       | No                                      |
| Accountant (`accountant`)               | Yes       | No                                      |
| Teacher (`teacher`)                     | Yes       | No                                      |

Implemented grants are `workspace.read`, `memberships.read` and `memberships.manage`. Admin and Principal can assign any of the five roles, clear a role, deactivate or reactivate an existing membership in their institution. Neither is a global SaaS administrator. The last active Admin cannot be demoted, unassigned or deactivated through the service. A membership update and its audit event commit atomically; identical repeated desired-state writes do not append duplicate events. A revoked/demoted actor is checked again under a row lock inside the service transaction, even if earlier middleware allowed the request. Concurrent role changes serialize on the institution row before membership locks. Other future write paths must follow this protocol; direct administrative SQL is outside this service guarantee.

Admission Officer admissions duties, Accountant finance duties, Principal academic oversight and Teacher assigned-class operations are proposed business permission areas. No admission, finance, attendance or assessment grant is currently issued. Add permissions alongside their actual authorized workflow and ownership tests, especially teaching-assignment checks; a role alone must not authorize arbitrary student records.

## Platform authorization

`platform_operator` is separate from institution membership. `PlatformResolver` and `canPlatform` use separate role and permission types. An identity can be explicitly provisioned in both scopes, but neither scope implies the other.

| Platform role                         | Inspect own platform access | List institution metadata | List/assign/change platform operators |
| ------------------------------------- | --------------------------- | ------------------------- | ------------------------------------- |
| Platform Owner (`platform_owner`)     | Yes                         | Yes                       | Yes                                   |
| Platform Manager (`platform_manager`) | Yes                         | Yes                       | No                                    |

The corresponding permissions are `platform.access.read`, `platform.institutions.read` and `platform.operators.manage`. Owner can grant platform access to an existing account by UUID, change its role or deactivate it. Manager cannot promote itself or change other operators. The last active Owner is protected. Operator mutations and bootstrap use the same transaction-scoped advisory lock before row locks; authorization is rechecked inside each mutation. Protected platform list reads lock the operator row for the transaction. Audit writes are atomic with the operator change. Institution metadata is limited to ID, name, slug and timezone; platform staff receive no automatic school data access or impersonation route.

## Login and access flow

1. Send email/password to Better Auth `/api/auth/sign-in/email` from an exact trusted origin. Better Auth validates credentials/rate limits and sets the existing HttpOnly session cookie. Public signup remains disabled. Never accept a requested role at login.
2. Use `/api/v1/me` to validate identity. The school app loads `/api/v1/memberships`, including each active membership's nullable role. A user with no membership or unassigned role must be given access by an authorized provisioning workflow, rather than selecting a role themselves.
3. After school selection, call `/api/v1/institutions/:institutionId/access` to obtain current role and effective permissions. The server still checks session, selector, membership, permission and ownership for every protected operation. Client permissions only guide presentation.
4. A future separate platform frontend calls `/api/v1/platform/access`. A school role receives 403 here unless a separate active platform operator exists. It never falls back to school Admin privileges.
5. Mutations use the trusted Origin and JSON body; both API scopes keep protected responses `no-store`. Missing session returns 401, denied/foreign/missing protected target returns 403, invalid input returns 400 and last-administrator conflicts return 409.
6. Role changes and deactivation take effect on the next request with the same session cookie. A read already authorized under its database lock can finish before revocation commits. Logout uses `/api/auth/sign-out`; subsequent requests fail session validation.

The school frontend remains `apps/admin`. The recommended future owner console is a separate `apps/platform` in this monorepo, sharing identity/contracts/UI where appropriate and calling the platform routes. That frontend is not created by this backend change. Both currently use the same identity provider; separate role records and server checks enforce access. Configure its exact origin only when implemented. Separate sessions or MFA enforcement for privileged operators need a deliberate production design, not role claims in browser storage.

Better Auth rate limits are enabled in every environment with database storage, 60 general requests/minute and 5 sign-in attempts/minute. The pinned 1.7 adapter handles shared database counters. A trusted reverse proxy MUST strip client-supplied `x-eduos-client-ip`, set that header from the verified connection IP and prevent direct API access. With no trusted IP header, local callers may share a limiter bucket. Test proxy behavior before deployment and add edge limits against distributed attacks.

Auth's own error responses are framework-managed. Application errors do not expose auth internals. See integration tests for real login/cookie/session, forged origins, logout, rate limiting and cross-institution denial; check verification.md before treating any as passed.
