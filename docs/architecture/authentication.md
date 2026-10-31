# Authentication and authorization

Better Auth uses the PostgreSQL Drizzle adapter. Email/password login is enabled, public signup disabled, passwords require 12–128 characters. Sessions last seven days, update daily, and are checked against the database without cookie caching. Cookies are HttpOnly, SameSite=Lax, host-scoped and Secure in production. Configure frontend and API on the same site; unrelated-site deployment requires an explicit cookie/CSRF design change. Do not store session tokens in localStorage.

`pnpm auth:create-user` is a development-only internal CLI using Better Auth's password hasher and transactional user/account writes. Repeat invocations preserve existing identity, credentials and access; they are not password resets. The CLI creates no membership or public registration route. `pnpm auth:bootstrap` grants initial development Admin or Super Admin (`platform_owner`) access to an existing account. First school Admins can now be provisioned by an authorized Super Admin through institution creation. Email verification, invitations, password-reset delivery, MFA and production platform-owner onboarding/recovery remain deferred.

`pnpm auth:replace-platform-owner` is a development-only atomic handoff for a single active Super Admin. It promotes an existing target identity and deactivates the previous platform operator in one transaction, retaining both identities and recording both audit entries. It refuses if more than one Super Admin is active. It does not delete accounts or alter institution memberships.

Active institution state, membership and role are verified for each institution request. Frozen/inactive institutions are omitted from school membership selection and deny workspace, access and membership operations, including direct service calls. Reactivation restores the existing membership grants. Switching is a validated per-request selection, not a global session grant. Roles and module grants are not stored in session claims or accepted from the browser. `MembershipResolver`, `RoleDefinition`, `ResourcePolicy` and `can` define institution boundaries. A nullable membership role means unassigned and grants nothing. Existing memberships are not automatically assigned a role during migration.

| Institution role                        | Workspace | List and manage institution memberships |
| --------------------------------------- | --------- | --------------------------------------- |
| Admin (`admin`)                         | Yes       | Yes                                     |
| Principal (`principal`)                 | Yes       | Yes                                     |
| Admission Officer (`admission_officer`) | Yes       | No                                      |
| Accountant (`accountant`)               | Yes       | No                                      |
| Teacher (`teacher`)                     | Yes       | No                                      |

Implemented grants cover workspace/memberships, admissions, school settings, academic configuration, attendance, fees, expenses and routine. Admin/Principal manage institution memberships and school settings/reviews; the last active Admin cannot be removed. New school membership uses an existing identity email, without granting platform access or creating authentication credentials. Membership updates and their audit events commit atomically. Current access is checked under the institution/actor lock before every protected operation, including idempotent replay.

Admission Officers retain assigned-candidate scope and admission collection permission. Accountants receive school fee reads/collections and expense recording/payment grants. Teachers receive attendance read/write for their current class assignments and published routine reads for their lessons. Review, reversal, configuration and membership grants remain explicit Admin/Principal operations. Module entitlements are checked independently: Academics for routines/configuration, Attendance for registers, Admissions for intake, Fees for collections/expenses. Proposed school policies still require discovery; see [ADR 0012](../decisions/0012-live-school-workspace.md).

## Platform authorization

`platform_operator` is separate from institution membership. `PlatformResolver` and `canPlatform` use separate role and permission types. An identity can be explicitly provisioned in both scopes, but neither scope implies the other.

| Platform role                         | Inspect access | Read institution settings | Create institution/Admin | Manage state/modules/subscription | Manage operators |
| ------------------------------------- | -------------- | ------------------------- | ------------------------ | --------------------------------- | ---------------- |
| Super Admin (`platform_owner`)        | Yes            | Yes                       | Yes                      | Yes                               | Yes              |
| Platform Manager (`platform_manager`) | Yes            | Yes                       | No                       | No                                | No               |

Platform permissions are `platform.access.read`, `platform.institutions.read`, `platform.institutions.create`, `platform.institutions.manage`, `platform.subscriptions.manage` and `platform.operators.manage`. Super Admin receives these explicit grants; Platform Manager only inspects platform access and institution settings. Institution creation provisions a new first school Admin through the owning identity service in the same transaction. Duplicate slugs and existing Admin emails return distinct safe 409 codes; no existing credentials are reset or identities silently granted access. The creating platform operator receives no school membership. Institution status/module changes and subscription terms are audited and recheck the operator at the data boundary. The last active Super Admin remains protected. Operator mutations and bootstrap share an advisory lock before operator row locks. Platform staff receive no automatic school data access or impersonation route.

Institution module availability is independent of school role permissions. Tenant access/workspace responses include enabled modules. `requireTenantModule` resolves active institution/membership/role and requires both an explicit operation permission and module grant. Missing grants deny access. Future school business services must repeat both checks at their data boundary. Module availability does not grant an operation or implement its workflow. Subscription records are manual plan terms and do not automatically suspend schools; access state is an explicit Super Admin action.

## Login and access flow

1. Send email/password to Better Auth `/api/auth/sign-in/email` from an exact trusted origin. Better Auth validates credentials/rate limits and sets the existing HttpOnly session cookie. Public signup remains disabled. Never accept a requested role at login.
2. Use `/api/v1/me` to validate identity. The school app loads `/api/v1/memberships`, including each active membership's nullable role. A user with no membership or unassigned role must be given access by an authorized provisioning workflow, rather than selecting a role themselves.
3. After school selection, call `/api/v1/institutions/:institutionId/access` to obtain current role and effective permissions. The server still checks session, selector, membership, permission and ownership for every protected operation. Client permissions only guide presentation.
4. The separate platform frontend calls `/api/v1/platform/access` after validating identity. A school role receives 403 here unless a separate active platform operator exists. It never falls back to school Admin privileges. The platform UI sends unauthenticated users to `/login` and non-operators to an access-denied page; the API remains authoritative.
5. Mutations use the trusted Origin and JSON body; both API scopes keep protected responses `no-store`. Missing session returns 401, denied/foreign/missing protected target returns 403, invalid input returns 400 and last-administrator conflicts return 409.
6. Role changes and deactivation take effect on the next request with the same session cookie. A read already authorized under its database lock can finish before revocation commits. Logout uses `/api/auth/sign-out`; subsequent requests fail session validation.

The school frontend remains `apps/admin`. The separate `apps/platform` uses the same identity provider and resolves its separate operator record through the server. Institution creation/settings, first Admin provisioning, subscriptions and operator assignments use live platform APIs. First school Admins sign in through the school app and have no platform access. Messaging and automated billing remain deferred. Local development trusts the exact platform origin `http://localhost:5174`. Separate sessions or MFA for privileged operators need a deliberate production design.

Better Auth rate limits are enabled in every environment with database storage, 60 general requests/minute and 5 sign-in attempts/minute. The pinned 1.7 adapter handles shared database counters. A trusted reverse proxy MUST strip client-supplied `x-eduos-client-ip`, set that header from the verified connection IP and prevent direct API access. With no trusted IP header, local callers may share a limiter bucket. Test proxy behavior before deployment and add edge limits against distributed attacks.

Auth's own error responses are framework-managed. Application errors do not expose auth internals. See integration tests for real login/cookie/session, forged origins, logout, rate limiting and cross-institution denial; check verification.md before treating any as passed.
