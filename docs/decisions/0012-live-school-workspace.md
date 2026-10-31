# ADR 0012: Live school workspace routes

Status: accepted for implementation, 27 October 2026.

## Context

The 38 school pages under `apps/admin/src/app/_school` previously operated on synthetic browser state. Keep their URLs and presentation while replacing their runtime data source and action handling. Admissions and its first-installment/monthly billing already have persistent services; a second candidate or student ledger would create conflicting records.

## Decision

The pathless `_school` layout protects `/admissions`, `/attendance`, `/fees`, `/expenses`, `/routine` and `/settings`, including their existing child pages. Better Auth identifies the user; the optional `institutionId` search parameter selects an assigned school. With one assigned school it can be inferred. Multiple schools use `/app`; all subsequent links retain the selected institution in the URL. Server queries are keyed by identity and institution. `/` goes through `/login`. The existing institution-prefixed admission routes remain compatible.

A school application service exposes an authorized snapshot and a validated discriminated command API under `/api/v1/institutions/:institutionId/school`. It coordinates explicit services in Admissions, Academics, Identity, Attendance, Fees, Expenses and Routine. Business rules remain in those services. Clients cannot replace the snapshot, reset school data, set derived financial amounts or author audit history. TanStack Query owns saved server data; React state holds only transient form inputs, attendance marking and a payment allocation draft.

Commands lock the institution before membership/module rows, revalidate current access and serialize writes per school. A school revision rejects stale edits. An institution-scoped operation key plus an actor/action fingerprint makes a retried command idempotent; a reused key with a different actor or payload is rejected. The operation audit, revision and capability writes commit together. Existing admission commands keep their own versions, idempotency and ownership rules through nested transactions on the same connection. Permission is rechecked before replaying an operation.

Admissions reuse existing candidates, histories, settings, offerings, students, enrollments, charges, receipts and monthly schedules. Enrollment validates the actual class section and capacity. Admission Officers retain assignment scope. Accountants receive finance/expense grants; Teachers receive attendance and routine reads for their assignments. Admin/Principal manage school configuration, reviews and memberships. Adding a school membership requires an existing account email and does not create an identity or deliver an invitation. Existing last-Admin protection remains in the Identity service.

Attendance requires the exact enrolled roster and rejects incomplete submission. Submitted originals and normalized student marks are retained. Corrections record the original/proposed status, reason, requester, reviewer and review instant; approval changes only the current projection. A configured cutoff applies to Teachers' same-day submission. A Principal-only correction policy is enforced. Current assignments are used for teacher access; an effective-dated staff-assignment editor is outside this slice.

Fee collections support partial allocations against actual monthly charges. Cash payments, allocations and reversals are separate rows. Reversal restores balances without deleting the payment. Existing first-installment receipts and legacy monthly payments remain visible and count toward the same balances. Admission/willing receipts are retained and do not acquire a new reversal policy. Future charges continue through the existing monthly processor; no automated payment is taken.

Expenses persist draft/submitted requests, protected evidence, review history and cash payment vouchers. Approved/paid requests cannot be overwritten. Every submitted request needs approval; the configured threshold selects when the Principal-only reviewer restriction applies. Evidence rules apply before submission. PDF/PNG/JPEG uploads are size/signature validated, stored institution-scoped in PostgreSQL and downloaded through session-protected endpoints with attachment disposition. At most 5 MB per file is accepted. Object storage and retention/quota policies remain future operational work.

Routines keep a draft and immutable numbered published versions per offering/section. Publication requires complete, non-overlapping periods, active school Teachers and no time overlap with other relevant published class routines for the teacher or room. Historical superseded versions do not block a current schedule. Future conflicting published versions are also checked. The former automatic synthetic conflict resolver is replaced by editing actual lesson assignments.

## Persistence and consequences

Migrations `0007_damp_meteorite` and `0008_modern_celestials` are additive. Existing offerings gain sections, capacity, an optional teacher and active state; existing enrollments default to section A. New capability tables carry institution ownership, indexed tenant keys and composite ownership foreign keys. JSON holds validated value objects, display projections and immutable originals; normalized attendance marks enforce student/register tenant references. RLS is not enabled.

School snapshots currently load the authorized school working set, with batched candidate/history/fee queries and aggregated balances. High-volume server pagination and long-term archival need a separate iteration before unusually large institutions. No sample students, staff, transactions or access grants are inserted by migrations.

Deploy migrations before the API/client version. Restart the API and rebuild shared packages after applying the change. Do not reset data or edit applied migrations. Integration and browser tests require a dedicated `eduos_test*` database; browser fixtures contain synthetic records only.
