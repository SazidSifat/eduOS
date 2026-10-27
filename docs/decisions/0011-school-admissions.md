# ADR 0011: School admissions, collections and follow-up delivery

Status: accepted for the first school admission implementation. College admission remains deferred.

## Context

An Admission Officer collects student information in the field, follows up with guardians, records willingness to admit and completes admission. Willing fees are optional when creating or transitioning a willing record. Each institution configures reminder timing and whether its willing fee counts toward admission.

The existing `admission_officer` role owns this work. There is no Marketer role, no platform bypass and no automatic student/guardian login provisioning.

## Decision

- Keep candidates, call outcomes, assignments, settings and attributable transition history in the Admissions capability. Mount its routes below `/api/v1/institutions/:institutionId/admissions` separately from platform routes.
- Admission Officers read/write assigned records only. Admin and Principal have institution-wide admissions management and settings permissions. Teacher and Accountant receive no admission identity-data grants by default; broader accounting workflows remain deferred.
- Require an active institution, active membership, explicit permission and enabled Admissions module at the transaction boundary. Actual collections additionally require `fees.collect` and the enabled Fees module.
- Store a minimal school class/session offering through the Academic capability. Admissions settings expose creation of these offerings without introducing an unrelated timetable or full academic-configuration workflow. Their ownership remains Academic.
- Snapshot institution-wide admission/willing fee amounts and credit policy on candidate creation. Configuration changes affect new candidates; reminder changes recalculate pending schedules. Class-specific fee policies are deferred.
- Keep charges, cash payments and issued receipts distinct in Fees. A skipped optional willing fee creates none of them. A credited willing fee reduces the admission charge payable; it is not allocated as a second payment. Credit is capped at the admission charge. No automatic refund or gateway settlement is implemented.
- Confirm admission in one transaction shared by explicit Admissions, Fees and Student Lifecycle services. Persist a durable student and a session-specific enrollment. A matching birth certificate can link a later session after identity checks; conflicting identity or a duplicate same-session enrollment is rejected.
- Lock the institution before membership/candidate access, following existing identity lock order. Institution-scoped writes serialize in this first slice. This favors simple consistency over maximum per-school write throughput; revisit with measured contention.
- Use expected record versions and a persisted client operation key plus payload fingerprint. Same actor/key/payload replays return the same candidate identity with its current details; changed payloads conflict. Diagnostic request IDs remain separate.
- Keep birth certificate and guardian NID details in authorized profiles; directory responses exclude them and details mask them until revealed. Missing identity documents require Admin/Principal completion with a recorded exception reason. Physical document copies and private object-storage delivery are deferred.

## Timed notifications

PostgreSQL reminder rows hold the calendar date, recipient, candidate version and UTC delivery instant calculated from institution time-zone rules. Delivery and notification visibility commit atomically. No external send occurs in a database transaction.

The API process runs a non-overlapping delivery pass every 30 seconds, and once at startup. The timer performs no schema migration. Rows survive restarts; per-institution database locks coordinate concurrent processes. The worker checks current state, assignment, recipient permission, institution state and module entitlement before delivery. Willing/admitted/closed records do not receive follow-up reminders.

Rescheduling/reassignment invalidate pending jobs. Settings updates replace unsent schedules without resending notices already delivered for the same recipient/date/kind. Downtime produces a single on-date catch-up notice instead of both overdue notices. Frozen institutions and disabled modules pause delivery while preserving data. An active API process and reachable PostgreSQL are prerequisites for timely notification; a separate deployment worker can be extracted when operational demand justifies it.

## Consequences and limits

School UI uses generated TanStack routes, Query, React Hook Form/Zod and shared shadcn components in `apps/admin`. Forms collect progressively and retain existing information during conversion. Server rules authorize every operation regardless of UI visibility.

There is no college workflow, external messaging, online gateway, installment admission, fee refund/waiver UI, parent portal, document upload or general student-record editor in this slice. Identity exceptions require parent/nationality/date-of-birth details and an accountable administrator. Additional required-field policies need school discovery. RLS remains disabled; tenant filtering and composite foreign keys provide the implemented boundary.

Migrations `0004` and `0005` create new tables/constraints/indexes only. They neither promote roles nor modify existing institution/authentication rows. Apply them explicitly before starting this version; never run schema push/reset. Existing institution module grants stay unchanged.
