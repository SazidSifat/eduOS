# ADR 0013: Explicit enrollment dates and attendance rosters

Status: accepted for this implementation slice, 31 October 2026.

## Context

Year-specific enrollment identifies a student, class and section but has no
effective dates. Attendance therefore includes all enrollments, even when the
office knows a student joined later or left earlier. Session labels and candidate
creation timestamps cannot reliably establish those dates.

## Decision

Add nullable `starts_on` and `ends_on` calendar dates to enrollment. Known
boundaries are inclusive. Null means unknown. Migration and admission confirmation
leave both dates null; the office provides evidence before setting them. Date-only
values never pass through timezone conversion. Audit instants use `timestamptz`.

The school command API accepts `enrollment-dates` with an enrollment UUID, both
nullable boundaries and a required reason. It requires current `academics.manage`
permission and Academics entitlement (currently Admin and Principal). The student
lifecycle service owns the write; the school facade delegates through the existing
school transaction, revision and operation key. Foreign enrollments, revoked users
and replay after entitlement loss are denied.

Each actual change records old/new dates, actor, reason and timestamp in
`enrollment_date_change`, with composite tenant foreign keys for enrollment and
actor. The change and audit commit together. Identical desired dates create no
extra date-history row. There is no audit-delete API.

New attendance submissions must match the dated roster. Unknown boundaries retain
previous eligibility for compatibility and remain null in the snapshot; reviewing
legacy dates remains an onboarding task. This does not certify historical eligibility.

Submitted marks define the recorded roster. Expanding dates does not insert a
student into an existing submission. Date changes that exclude an already submitted
mark return 409 without changing dates or attendance. An exception/amendment workflow
needs separate policy discovery. Drafts use dated eligibility, retain marks for
eligible students and initialize newly eligible students as Unmarked. The server
rejects mismatched rosters. Monthly views include overlapping enrollments and
students with submitted marks in that month. Dates never change posted fees.

## Scope and migration

This is the first B07/B08 slice, not complete transfer/withdrawal management. It
adds an API command and attendance consumption. Academic setup now also provides
a date editor and paginated history viewer for Academics managers. Dates do not release seats, change capacity policy,
transfer sections, promote students or end teacher assignments. Teacher access
still uses the current class assignment. Calendar closures and offline queuing
remain separate work.

Migration `0009_enrollment_dates` adds nullable columns, constraints/indexes and
an audit table. No dates are backfilled or identities deleted. It excludes the
independent unfinished guardian schema: generation used a temporary explicit
schema inventory matching 0008 plus enrollment history, then removed that temporary
configuration. Snapshot comparison found only one changed existing table and the
new audit table. Before execution, the generated unique constraint was moved ahead
of its referencing foreign key.

Deploy the migration before this API/client and rebuild shared packages. Adding
constraints/indexes requires table locks; assess volume and a maintenance window
before shared deployment. Application rollback can retain this additive schema;
preserve audit history. Validation uses dedicated test databases. Following a missing-column error, the
reviewed migration was also applied to the configured application database. No
deployment occurred. RLS remains disabled.

## Acceptance

SQL/API tests cover inclusive boundaries, unknown dates, audit history, replay,
tenant constraints, role/revocation/entitlement denial, invalid date order and
audit-failure rollback. A child test database upgrades a real pre-0009 enrollment,
checks unchanged identity/null dates, then reapplies migrations. UI tests cover
dated filtering and submitted-roster preservation. The browser suite exercises
dated attendance through the real API using synthetic records.

## Management interface and history read

Academic setup includes a student-enrollment selector, nullable start/end date
controls and a required change reason. Clearing a date persists null. Validation
and server conflicts preserve input; successful saves refresh the school snapshot
and the identity/institution/enrollment-scoped history query. Read access requires
current Academics management permission and entitlement, including after revocation.

`GET /school/enrollments/:enrollmentId/history` returns only that institution's
selected enrollment history, newest first, with bounded limit/offset pagination.
Responses include before/after dates, actor display name, timestamp and reason;
teacher attendance snapshots never receive these audit reasons. Pagination is not
a snapshot across concurrent changes. Academic managers can select enrollments
without enabling the separate Attendance module. No new schema migration is needed.

The interface is a local extension of Academic setup, not a new visual identity.
Root/scoped AGENTS.md and existing DemoForm, Choice, DataTable and school style
sources are its product/design authority. The Impeccable local-extension exception
applies: inherit the incumbent surface without a concept seed or replacement
PRODUCT.md/DESIGN.md. The launcher was unavailable; source and rendered review
were used. No durable design-system changes are part of this slice.
