# Multi-tenancy

One institution is one tenant. A global user may hold independent active memberships in multiple institutions. The browser's selected institution ID is never proof of access.

Implemented request path: validate session → validate UUID selector → resolve active membership for user and institution → require `workspace.read` → query using user ID, institution ID and active membership together. Listings join only the current user's memberships. Revocation is checked per request; no tenant grant is cached in sessions.

Persistence has explicit institution ownership on memberships, composite membership PK and foreign keys. No school-owned tables exist yet. Future records require `institution_id NOT NULL`, tenant-first query filters/indexes, scoped uniqueness and composite foreign keys for references to tenant-owned entities. An indirect ownership path must be documented and enforced at both authorization and SQL boundaries.

**PostgreSQL row-level security is not enabled.** Current safeguards are application checks and relational constraints. Introduce RLS only with a restricted runtime role, transaction-local context, pool-leak tests, explicit worker/migration policies and cross-tenant integration tests. RLS is defense in depth and cannot replace application authorization.

Platform support access, institution suspension, role assignment, resource-level teaching/guardian relationships and audit persistence are future policy work. There is no global super-admin bypass. Cross-institution requests return 403 without revealing whether a target exists.
