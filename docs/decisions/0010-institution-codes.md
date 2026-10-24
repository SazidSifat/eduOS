# Six-digit institution codes

Status: Accepted, 25 October 2026. Extends ADR 0009.

Every institution has a database-generated six-digit reference code between `100000` and `999999`. It is returned as a string. PostgreSQL owns allocation through the non-cycling `institution_code_seq`, with non-null, unique and six-digit-format constraints on `institution.code`. Concurrent creation therefore cannot allocate the same code. Failed/rolled-back creations can leave gaps; codes are not promised to be contiguous and are never automatically reused. Allocation fails once the six-digit range is exhausted.

Creation does not accept a code from the client, and no application update operation edits one. The code is a visible reference for identifying an institution, not a credential or authorization grant. Existing UUID primary keys, foreign keys, route selectors and tenant policy checks remain the security/ownership boundary.

The platform directory, institution details, subscription directory and school workspace display the code. Institution details offer a copy control. An exact code search calls `GET /api/v1/platform/institutions?code=123456`; the server filters by the unique indexed code before pagination, retaining normal platform permissions.

Migration `0003_institution_code` creates the sequence and adds the code column with its sequence default, backfilling one distinct code for each existing row before applying uniqueness/format constraints. It does not delete or replace institutions, accounts or memberships. Apply the migration before deploying the new API/client contracts. Adding a volatile default rewrites existing institution rows while holding an ALTER TABLE lock; larger deployments need a suitable maintenance window. A separate restricted runtime database role needs USAGE on the new sequence. Schema/sequence access must be granted through the deployment's existing role-management process.

Migration integration checks create a disposable child `eduos_test_*` database, apply the actual pre-code migrations, insert legacy institutions/membership, then apply/reapply the committed full journal. They verify preserved rows, backfill, concurrent allocation, constraints and the non-cycling upper bound. The supplied test database and development database are never reset by this suite.
