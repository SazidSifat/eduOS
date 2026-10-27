# School admissions module — proposed implementation plan

Status: implementation started. This document retains the proposed design and future discovery scope. See [the implementation guide](../development/admissions.md) and [ADR 0011](../decisions/0011-school-admissions.md) for the actual first school slice and explicit limits. The field role is the existing Admission Officer; no Marketer role is introduced.

## Confirmed scope

- Version one covers school admission. College admission is deferred; do not add college programs or institution types in this slice.
- An admission officer can collect a follow-up lead, record a student as willing to admit, or complete direct admission with the necessary fee.
- Follow-up leads need student details, parent/guardian details, a contact number and a next follow-up date.
- Follow-up notifications occur before the follow-up date and on that date. Each institution configures the reminder timing.
- Willing students do not receive follow-up reminders. They need the fuller admission information. Staff can optionally collect a willing/registration fee while creating the willing record; skipping collection must not block creation.
- Each institution configures whether the willing fee is credited toward admission or charged separately.
- Admission from a follow-up lead collects the missing full details and required fee. Confirmed admissions appear in the admitted-student list.
- A call can result in agreement, more time needed or refusal. Record the outcome and preserve the history.

These are confirmed requirements. Defaults, field exceptions and the detailed permissions below are proposals for implementation review.

## Workflow and state rules

| State     | Required information                                                                                                       | Actions                                                                                                    | Reminders                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Follow-up | Basic student information, target class/session, guardian/contact details, assigned admission officer, next follow-up date | Record call, reschedule, mark willing, complete admission, mark not interested                             | Configured before-date and on-date notifications |
| Willing   | Full student/guardian information and required identity details                                                            | Optionally collect a willing fee at creation, complete admission, withdraw, explicitly return to follow-up | None                                             |
| Admitted  | Validated full information, satisfied fee requirements or authorized waiver, student/enrollment reference                  | Open student record, view receipts and admission history                                                   | No prospect follow-up notifications              |
| Closed    | Previous information and closing outcome/reason                                                                            | View history; explicitly reopen as follow-up with a new date                                               | None                                             |

- New entries choose Follow-up, Willing or Direct admission. Direct admission starts the complete form without requiring an earlier marketing lead.
- Agreement on a call opens the admission form with existing information prefilled. Agreement alone does not confirm admission or payment.
- Needs more time keeps the student in Follow-up and requires a replacement date.
- No answer records an unsuccessful attempt; it does not imply refusal. Staff choose another follow-up date.
- Not interested closes the lead and cancels unsent reminders. Reopening is explicit and audited.
- Moving to Willing, Admitted or Closed cancels pending follow-up reminders. Rescheduling replaces the previous schedule.
- A partially completed admission remains on the existing candidate; it never appears in the admitted list before confirmation.
- Keep one candidate and its history throughout conversion. Link it to one durable student and a year-specific enrollment when admitted.

## Information collection

The short field form prioritizes quick entry on a phone. Full details are collected progressively; staff should not retype information during conversion.

**Follow-up form:** student name, approximate age or known date of birth, desired class, academic session, parent/guardian names, contact relationship, primary phone, locality/address, lead source, assigned admission officer, notes and next follow-up date. A contact number may be shared by siblings and must not be globally unique.

**Willing/admission form:** legal student name, date of birth, birth certificate number and required evidence, nationality, complete address, target class/session, previous school information where applicable, parent names, parent NID/nationality details, guardian relationship and contact information. Record a primary contact separately from legal guardianship.

- Confirm required versus optional fields before coding the schema. Missing parent records, absent certificates or foreign nationality need an explicit authorized exception path rather than fabricated values.
- Collect only necessary identity data. Mask NID/certificate numbers in lists and restrict full values/documents to authorized detail views.
- Provide secure document upload/download if copies are required: private storage, ownership checks, bounded file size/types and verified-file status. Do not place file bodies in the existing JSON endpoints.
- Similar names or shared phone numbers prompt review; never auto-merge students. Check identity conflicts within the institution without leaking another institution's records.
- Existing students should receive a new eligible enrollment rather than a second person identity. Preserve earlier academic history.
- Student admission does not automatically create a student or guardian login account.

## Fees and receipts

Student fees belong to the Fees & Collections context, separate from the platform subscription.

- Configure optional willing/registration fee amounts and required admission fees per school, session and class where needed. A configured willing fee amount does not make collection mandatory.
- The willing creation form includes an optional **Collect willing fee now** control. When selected, show the configured amount, permitted payment methods and collection details; validate a positive amount and the required settlement information. When skipped, create the willing record without a charge, payment, receipt or outstanding willing-fee balance.
- Save a willing record and its selected, valid collection/receipt in one shared transaction through the owning services. A failed collection must not leave a partially saved paid record. Retry the same operation safely without duplicate candidates or receipts. The same optional collection flow applies when moving an existing follow-up candidate to Willing.
- School settings choose whether registration payment is credited toward admission or remains a separate charge. Snapshot the applied policy; later configuration changes must not rewrite old receipts or balances.
- Show admission charges, eligible earlier payment credit, amount already paid and remaining payable before confirmation. Never count the same payment twice.
- Store charges, payments, allocations and receipts separately, using integer minor units for BDT. A mutable paid checkbox is insufficient.
- An admission officer may record permitted collections and complete admission for assigned candidates. Record collector, amount, method, collection time and receipt reference.
- Cash collection can be posted through the authorized collector flow. An electronic transfer reference alone is not proof of payment; settlement/verification must follow the configured collection policy.
- Discounts, waivers, refunds and reversals require explicit authority and reasons. Keep posted financial history; do not delete or overwrite a receipt to correct it.
- Confirm admission only after required charges are satisfied or an authorized waiver/exception applies. Installment admission is deferred unless explicitly added to scope.
- Registration and final admission submissions need persisted request identities so retries cannot duplicate a collection or admission. Replaying the same request returns the original outcome; changed payloads conflict.

## Configurable follow-up reminders

School Admin/Principal configure:

- How many days before a follow-up date to remind the assigned admission officer.
- The notification time before that date and the start-of-day notification time on the date.
- The institution time zone, using its existing configured zone; Asia/Dhaka is the local default.

Version one proposes in-app notifications and a Today/Upcoming/Overdue call queue. SMS, WhatsApp, email and automatic calls require separate delivery scope; do not expose nonfunctional channel switches.

Persist the follow-up calendar date and time zone; derive UTC delivery instants. Persist reminder jobs with schedule versions and unique delivery keys. A small PostgreSQL-backed processor is justified by this actual timed workload; Redis or a general event bus is unnecessary for this slice.

Delivery must recheck candidate state, current assignment, active institution, enabled Admissions module and recipient access. Retries must not duplicate the visible notification. Rescheduling, reassignment and status changes invalidate old jobs. Configuration changes recalculate unsent jobs without resending delivered notifications or flooding users with historical reminders. Define a single overdue catch-up notification after downtime.

Notification text contains minimal information and links to an authorized record; no NID, certificate details or private notes. Viewing a notification does not bypass admission-record permissions. Reading and completing a follow-up are separate actions.

## School interface

Use `apps/admin` and shared shadcn components, retaining the existing typography, dense aligned tables, restrained colors and accessible phone layouts.

1. **Admissions → Follow-ups:** date groups, student/contact, target class, admission officer, next date and outcome. Filters for Today, Upcoming, Overdue, assignee and class; row detail and Record call actions.
2. **Admissions → Willing:** complete/pending information, registration charge/payment state, assigned admission officer and Complete admission action. No overdue or follow-up alerts here.
3. **Admissions → Admitted students:** admission number/date, student, class/session, guardian contact and receipt access. Only confirmed admissions appear here.
4. **New candidate / direct admission:** stage selection followed by the appropriate short or full form; server validation remains authoritative.
5. **Candidate details:** profile, guardian details, identity documents, call history, payments and attributable status history. Admission completion happens from this record with existing details prefilled.
6. **Admissions settings:** reminder timing, required admission fields/exceptions and links to authorized fee configuration.

Forms use React Hook Form and Zod. TanStack Query owns server state with identity/institution-scoped keys. Routes are generated from thin `page.tsx` files with colocated `_component/` and `_api/` directories. Do not use frontend sample arrays as production data.

## Permissions and module access

Use the existing `admission_officer` institution role for field collection and assigned admission records. No additional marketing role is introduced. Admin and Principal have institution-wide management permissions.

| Actor             | Proposed authority                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Admission Officer | Create candidates, manage assigned follow-ups/willing records, record permitted collections and confirm assigned admissions |
| Accountant        | Read necessary collection context, manage authorized fee posting/verification and permitted financial corrections           |
| Admin / Principal | Configure admissions, assign staff and authorize policy exceptions through explicit permissions                             |
| Teacher           | No admission or identity-document access by default                                                                         |
| Platform operator | No automatic access to school candidate, document or fee records                                                            |

Check session, active membership, active institution, operation permission, enabled module and assigned-resource scope on every request and again inside mutations. Admissions enables candidate workflows; actual charges/collections additionally require Fees to be enabled. Disabling a module must not erase its history or silently forgive an outstanding balance.

## Proposed service and persistence boundaries

- **Admissions:** candidate, parent/guardian intake, assignment, intent, call outcomes, follow-up schedule, admission application and transition history.
- **Student lifecycle:** durable student/guardian identity and year-specific enrollment. Admissions calls explicit lifecycle services for confirmation.
- **Academic structure:** the minimum real session/class offerings needed to select a valid admission destination. Do not hard-code classes or build unrelated timetable features.
- **Fees & Collections:** charge policy, payment, allocation, receipt and reversal. Admissions consumes an explicit settlement decision.
- **Communication:** durable in-app notifications and timed delivery jobs for follow-ups; start only with the actual reminder workload.

All owned rows carry `institution_id`. Tenant-owned relationships use composite ownership constraints; identifiers alone must not authorize cross-school references. Index assignee/date/state call queues and session/class admission lists. Keep documents private and define retention before production use.

Proposed confirmation use case:

`confirmAdmission(actor, institutionId, candidateId, expectedVersion, operationKey, fullDetails, feeSettlement)`

The persisted client operation key is separate from the server-generated diagnostic request ID.

The service rechecks access, locks or conditionally updates the candidate version, validates the target academic offering and documents, delegates financial writes, creates or links the durable student/enrollment, marks admission confirmed, cancels pending reminders and writes audit history in one shared database transaction. Owning services receive that transaction and never commit independently. Failed validation or payment posting rolls everything back. External payment/provider network calls stay outside the transaction and require a verified persisted result before confirmation.

Constraints and replay handling must prevent two concurrent confirmations from creating two students, enrollments, payments or receipts. Stale edits return a conflict with a refresh path. A lost HTTP response after commit can be retried safely.

## Proposed API surface

Mount school capability routes separately from platform routes under `/api/v1/institutions/:institutionId/admissions`.

| Method and suffix                           | Purpose                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /candidates`                           | Bounded, permission-scoped list filtered by state, assignee, date, class and session |
| `POST /candidates`                          | Create follow-up, willing or an admission draft                                      |
| `GET /candidates/:candidateId`              | Authorized details and bounded related history                                       |
| `PATCH /candidates/:candidateId`            | Version-checked edits to permitted intake fields                                     |
| `POST /candidates/:candidateId/follow-ups`  | Record call outcome and set/replace the next date                                    |
| `POST /candidates/:candidateId/transitions` | Explicit willing, closed or reopened transition with reason/version                  |
| `POST /candidates/:candidateId/confirm`     | Idempotent, transactional admission confirmation                                     |
| `GET /admitted`                             | Confirmed admission projection, scoped to school/session                             |
| `GET, PUT /settings`                        | Authorized admission/reminder configuration                                          |

Fee collection/receipt endpoints belong to the Fees capability and share its authorization. Willing creation/transition accepts an optional collection instruction and operation key; Admissions coordinates the Fees service in the same transaction rather than requiring a second browser request after saving. Notification inbox endpoints belong to Communication. Define bounded pagination, search exposure, strict Zod request/response contracts and OpenAPI schemas before implementing these routes. Document/document-upload endpoints are conditional on the confirmed evidence policy.

## Delivery sequence and acceptance

1. Agree field requirements, exceptions, collection methods and permissions. Update domain definitions and architecture decisions for the permission grants and capability boundaries.
2. Add the minimal academic offerings, admissions contracts, reviewed migrations, tenant constraints and permission grants. Preserve existing data and applied migrations.
3. Build the school admissions shell, short intake form, candidate details and follow-up/call workflow against real APIs.
4. Deliver configurable in-app reminders with scheduling, cancellation, retries and access revalidation.
5. Add full willing/admission forms, private evidence handling where required, configurable fees and receipts.
6. Complete atomic student/enrollment conversion and the admitted list; verify the full browser journey.

Important checks: willing creation with no fee creates no financial obligation; optional willing collection creates one receipt atomically and remains retry-safe; cross-school denial; admission officer assignment isolation; revoked access and frozen institutions; disabled modules; incomplete admission rejection; no reminders for willing/admitted/closed candidates; reschedule and configuration cancellation; timezone/date boundaries; duplicate payment and confirmation retries; concurrent admission; rollback after financial/lifecycle failures; unchanged historical receipts; and keyboard/mobile form completion. Integration checks use only dedicated `eduos_test*` databases.

Before implementation, settle the exact required fields/document exceptions, accepted payment methods and verification, refund/waiver authority, and the minimum academic-session setup. Before production, settle evidence retention, communication consent and durable processor deployment/recovery.

## Planning evidence

Reviewed current domain overview/glossary/bounded contexts, backend/database/multi-tenancy/frontend architecture, school app instructions, permission catalogs, app factory and identity service. The linked external proposed specification was inaccessible; this plan uses the local repository and the user's current requirements. Implementation and verification evidence belong in the development guide rather than this original planning note.
