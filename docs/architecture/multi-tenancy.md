# Multi-tenancy

One institution is one tenant. A global user may hold independent active memberships in multiple institutions. The browser's selected institution ID is never proof of access.

Implemented request path: validate session → validate UUID selector → resolve active membership and role for user/institution → require an explicit operation permission → scoped query or transaction that revalidates access. Listings join only the current user's memberships. Revocation is checked per request; no tenant grant is cached in sessions. Unassigned roles deny workspace access. Admin and Principal manage existing institution memberships, including role and active state; writes serialize on the institution row, recheck the actor and protect the last active Admin.

Persistence has explicit institution ownership on memberships, composite membership PK and foreign keys. No school-owned tables exist yet. Future records require `institution_id NOT NULL`, tenant-first query filters/indexes, scoped uniqueness and composite foreign keys for references to tenant-owned entities. An indirect ownership path must be documented and enforced at both authorization and SQL boundaries.

**PostgreSQL row-level security is not enabled.** Current safeguards are application checks and relational constraints. Introduce RLS only with a restricted runtime role, transaction-local context, pool-leak tests, explicit worker/migration policies and cross-tenant integration tests. RLS is defense in depth and cannot replace application authorization.

Platform operators use their own role records and permission checks, separate from tenant membership. Platform Owner/Manager may inspect institution metadata but cannot bypass tenant checks. Membership-change audit rows have composite actor/target ownership foreign keys to institution membership. Platform operator changes have a separate global audit table. Platform support access, institution suspension and resource-level teaching/guardian relationships remain future policy work. There is no global super-admin bypass. Cross-institution requests return 403 without revealing whether a target exists.
