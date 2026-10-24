# 0006: Separate institution and platform RBAC

Status: accepted for the backend foundation.

## Context

EduOS needs five institution roles: Admin, Principal, Admission Officer, Accountant and Teacher. The product decision is that both Admin and Principal manage school membership roles. The provider also needs Platform Owner and Platform Manager identities without turning school administrators into global administrators. School business modules are not implemented yet.

## Decision

Keep Better Auth responsible for identity and database-backed sessions. Resolve application grants on each request from separate persistence: one nullable role per institution membership, and one platform role per operator. A user may hold different institution roles and separately hold a platform role. Unknown, missing or inactive records deny access. No wildcard permissions, automatic role inheritance or tenant bypass exists.

Admin and Principal have workspace and institution membership read/manage grants. Other school roles have workspace access until their workflows introduce confirmed permissions and resource relationships. Platform Owner manages platform operators and reads institution metadata; Manager reads metadata and cannot manage operators. Account creation, school onboarding, invitations and subscriptions are distinct workflows, not implicitly enabled by a role name.

Recheck authorization at data boundaries. Serialize membership changes on the institution row and platform operator changes with one transaction-scoped advisory lock. Retain at least one active Admin/Owner. Write attributable audit rows in the same transaction; desired-state replay is a no-op. Restrictive audit foreign keys preserve attribution. Initial development bootstrap uses the same locking protocol and refuses to replace an existing active administrator. Production onboarding/recovery remains a separate decision.

Keep the proposed platform console as a separate frontend app in this monorepo while retaining the modular API. Backend authorization supplies the separation; frontend deployment alone is not a security boundary. No platform frontend is added in this change.

## Alternatives

- A global `auth_user.role` would conflate institution and platform privileges and prevent different roles at different schools.
- Authentication-library business roles would couple identity to application policy and risk stale grants in sessions.
- Dynamic role builders and multiple roles per membership would add policy-composition semantics without a confirmed use case. Add them only with explicit conflict/union rules and migration planning.
- A separate platform API/auth provider could provide stronger operational isolation later, but is not necessary for this foundation's existing capabilities.

## Consequences and migration

Deploy the additive migration before the new API. Existing membership roles remain null and lose the old implicit workspace grant until explicitly assigned by an authorized provisioning process. Do not bulk-promote existing users. Development bootstrap can assign the first Admin for an existing institution or the first Platform Owner for an existing identity. Subsequent membership updates require existing tenant membership; production invitations and provisioning remain deferred.

Role/status changes apply to subsequent requests without login renewal. Reads in progress can finish before their shared authorization lock releases; later revocation then takes effect. Direct database administration must preserve continuity and audit independently. Retention, production recovery, MFA, trusted proxy deployment and secure-cookie browser checks remain rollout prerequisites.

The design follows the existing modular-monolith boundaries and the [SaaS control/application plane distinction](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/control-plane-vs.-application-plane.html). Transaction serialization relies on [PostgreSQL row and advisory locking](https://www.postgresql.org/docs/18/explicit-locking.html); integration tests exercise the actual service protocols when PostgreSQL is available.
