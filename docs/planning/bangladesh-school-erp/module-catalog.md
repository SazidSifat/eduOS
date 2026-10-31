# Proposed module catalog

All designs below are proposed. “Core” means required for the first complete Classes 1–10 school product, not necessarily the first pilot. “Expansion” means later capability. “Optional” means a service-dependent pack. Technical controls can span modules without creating separate deployments. See [research](research.md) for evidence and [delivery](delivery-plan.md) for sequencing.

Every module must enforce institution ownership, current permission, entitlement and relevant assignment/relationship at the data boundary. Every list/export must preserve that scope. New specialist duties require reviewed permission extensions; the five current roles do not automatically authorize them.

## M01 — Institution, calendar and policy setup · Core

- **Users/value:** Admin and Principal configure the school's operational identity once.
- **Scope/flow:** Profile → academic calendar → shifts/closures → policy drafts → approved effective version. Include optional EIIN/board references, locale, school branding, receipt series, rooms and operating contacts. Campus support is a later explicit extension.
- **Records/outputs:** InstitutionProfile, Calendar, Closure, PolicyVersion; setup checklist and calendar export.
- **Controls/dependencies:** M33; changes must not retroactively alter posted fees, attendance or results. Temporary closures adjust future expectations with audit.
- **Acceptance/discovery:** A holiday added after submission preserves the register and flags review; confirm session dates, weekend pattern and policy approver.

## M02 — Academic structure and subject enrollment · Core

- **Users/value:** Academic administrator and Principal define what each class actually studies.
- **Scope/flow:** Year → class offering → section/shift/version/group → subject components/electives → student subject enrollment. Support distinct primary/secondary assessment packs and effective-dated curriculum changes.
- **Records/outputs:** AcademicYear, Offering, Section, Subject, SubjectComponent, CurriculumVersion, StudentSubjectEnrollment; subject/section registers.
- **Controls/dependencies:** M01, M03, M05; explicit capacity and uniqueness rules, tenant-safe references. A subject used in published results cannot be deleted.
- **Acceptance/discovery:** Only a student's enrolled subjects appear in marks entry; validate group, religion/elective, roll uniqueness and curriculum applicability per school/session.

## M03 — Student and guardian directory · Core

- **Users/value:** Authorized school staff maintain durable identities without re-entering them every year.
- **Scope/flow:** Create/import → duplicate review → verify documents/contact → link guardian relationship → update with history. Support sibling links, address/contact preferences and restricted collection/viewing authority.
- **Records/outputs:** Student, Guardian, GuardianRelationship, ContactVerification, ProtectedDocument; student dossier and class contact sheets.
- **Controls/dependencies:** M33, M32 for imports; minimize sensitive data, log privileged document access and separate school staff access from guardian rights.
- **Acceptance/discovery:** Two children sharing a phone remain distinct; removing a guardian relationship removes access on the next request. Define custody/document verification and required versus optional fields.

## M04 — Admissions and applicant relationship management · Core

- **Users/value:** Admission Officer manages assigned prospects; Principal controls eligibility and seat decisions.
- **Scope/flow:** Inquiry/application → follow-up → eligibility/document review → selection/waitlist → offer → acceptance/payment → admission. Configure internal selection only where appropriate; record official selection evidence for applicable schools.
- **Records/outputs:** Candidate, Application, Interaction, SelectionEvidence, Offer, AdmissionDecision; prospect funnel, waiting list and admission form.
- **Controls/dependencies:** M01–M03, M05, M11; explicit conversion service/transaction; fees and seat reservation are separate from a phone follow-up status.
- **Acceptance/discovery:** Repeated confirmation creates one student/enrollment and one intended charge; confirm quotas, external selection, admission refunds and expired offers.

## M05 — Enrollment, transfer, promotion and year closing · Core

- **Users/value:** Academic office preserves a student's school history through every session.
- **Scope/flow:** Admit/enroll → section change → active/withdrawn/transferred/completed; year-end eligibility review → proposed promotion/repeat → approval → new-year enrollment. Transfer/withdrawal has an effective date and reason.
- **Records/outputs:** Enrollment, PlacementHistory, Transfer, PromotionBatch, YearClose; promotion register, enrollment trend and transfer checklist.
- **Controls/dependencies:** M02–M04, M10 for result-based promotion; never overwrite past enrollment or silently erase debts. Use finance/library clearance only under approved policy.
- **Acceptance/discovery:** A mid-month transfer preserves prior attendance and charges; rerunning promotion creates no duplicate enrollment. Confirm arrears carryover and repeat/roll allocation rules.

## M06 — Staff directory and teaching assignments · Core

- **Users/value:** Principal assigns responsibility without confusing employment with login access.
- **Scope/flow:** Staff profile → employment dates → subject/class/section assignment → temporary replacement → end assignment. Staff can exist without a user account.
- **Records/outputs:** Staff, Employment, Qualification, TeachingAssignment, Substitution; staff roster, workload and class teacher list.
- **Controls/dependencies:** M02, M33; employment records do not automatically grant system permission. Ended assignments stop future roster/marks access according to approved correction policy.
- **Acceptance/discovery:** A substitute gets only the approved date/section/subject scope; confirm assistant teachers, co-teaching and workload limits.

## M07 — Routine, room booking and substitutions · Core

- **Users/value:** Academic coordinator publishes usable class and teacher routines.
- **Scope/flow:** Configure periods → draft slots → resolve teacher/room/section clashes → review → publish effective version → substitute/cancel. Allow Ramadan or exam-day variants.
- **Records/outputs:** PeriodPattern, RoutineVersion, LessonSlot, RoomBooking, Substitution; class/teacher/room routine prints.
- **Controls/dependencies:** M01, M02, M06; archived published versions remain readable. Distinguish missing slot from intentional break/free period.
- **Acceptance/discovery:** Concurrent publication cannot assign one teacher to overlapping lessons; confirm travel buffers, double periods and multi-shift rules.

## M08 — Student attendance and absence follow-up · Core

- **Users/value:** Assigned teachers submit registers; reviewers correct them without losing originals.
- **Scope/flow:** Dated roster → draft marks → submit → missing-register review → authorized correction → absence follow-up. Daily first; period attendance/device imports later. Offline work needs a durable, visible conflict queue.
- **Records/outputs:** Register, RosterSnapshot, Mark, Correction, AbsenceCase; daily missing registers, monthly summary and chronic-absence list.
- **Controls/dependencies:** M01, M05, M06; no unmarked-to-present assumption; holidays/transfers affect expected days. M17 sends approved alerts after commit.
- **Acceptance/discovery:** A correction retains original mark, actor and reason; stale offline marks cannot overwrite reviewed data. Confirm statuses, late cutoff and alert timing.

## M09 — Examination operations and marks entry · Core

- **Users/value:** Exam committee organizes exams; assigned teachers enter only their subjects.
- **Scope/flow:** Exam plan → component/max/pass configuration → schedule/seating/admit cards → marks draft/import → validation → submit/lock → review. Distinguish absent, exempt, withheld and zero.
- **Records/outputs:** Exam, AssessmentComponent, ExamSchedule, SeatPlan, MarkSubmission; admit cards, attendance sheets and missing-mark register.
- **Controls/dependencies:** M02, M05, M06; marks range and component completeness validated server-side; approved reopen with reason rather than editing locked marks silently.
- **Acceptance/discovery:** Imported out-of-range or wrong-subject marks fail with row errors; confirm practical/MCQ/written components, combined papers and exam eligibility.

## M10 — Assessment rules, results and publication · Core

- **Users/value:** Exam reviewer and Principal publish reproducible, approved results.
- **Scope/flow:** Approve applicable rule version → calculate preview → inspect anomalies → sign off → publish immutable snapshot → notify → reviewed amendment. Descriptive primary assessment must coexist with configured numeric schemes.
- **Records/outputs:** GradePolicyVersion, CalculationRun, ResultSnapshot, Publication, Amendment; marksheet, tabulation, merit list and progression advice.
- **Controls/dependencies:** M09; version weights, rounding, component pass requirements, combined subjects, optional-subject treatment and tie rules. No universal GPA assumptions.
- **Acceptance/discovery:** Golden examples reproduce signed school calculations; later policy changes leave old results unchanged. Confirm ranking privacy, retakes and promotion separately.

## M11 — Fees, scholarships, concessions and receivables · Core

- **Users/value:** Finance staff know what is owed and why.
- **Scope/flow:** Effective fee schedule → preview assessment → approve/post charges → concession/scholarship approval → due aging → reviewed adjustment. Include admission, tuition, session, exam and opted-in service charges.
- **Records/outputs:** FeeHead, FeeScheduleVersion, Charge, Concession, ScholarshipAward, Adjustment; student ledger, demand bill, arrears and scholarship register.
- **Controls/dependencies:** M05; exact monetary arithmetic; service owners request charges through finance services. Discounts/waivers require explicit authority and do not count as cash received.
- **Acceptance/discovery:** Re-running a month's billing creates no duplicate charge; joining/leaving mid-month follows the approved policy. Confirm late fines, sibling concessions and allocation order.

## M12 — Collections, gateways, refunds and reconciliation · Core

- **Users/value:** Cashier collects quickly while finance can prove settlement.
- **Scope/flow:** Select open charges → allocate full/partial amount → confirm tender → post receipt → close till; online attempt → server verify → settle → reconcile. Refunds and reversals are separate approved actions.
- **Records/outputs:** Payment, Allocation, Receipt, GatewayAttempt, Settlement, Refund, TillClose; serial receipts, tender summary and unmatched-settlement queue.
- **Controls/dependencies:** M11, M33, M35; unique provider transaction and operation IDs, atomic allocation, actor attribution, locked closing totals; uploaded screenshot alone is not proof.
- **Acceptance/discovery:** Duplicate/delayed callbacks yield one payment; a bounced bank payment reverses settlement through an audit trail. Confirm cashier custody, overpayment, refund and gateway-fee policies.

## M13 — General ledger, funds and financial reporting · Expansion

- **Users/value:** Accountant produces traceable accounts beyond a receipts-minus-expenses dashboard.
- **Scope/flow:** Approved opening balances/chart → journal posting from source transactions → bank/fund reconciliation → period close → authorized adjustment/reversal.
- **Records/outputs:** Account, Fund, Journal, JournalLine, PeriodClose, BankReconciliation; trial balance, ledgers, income/expenditure, balance sheet where applicable and fund position.
- **Controls/dependencies:** M11/M12/M14 and approved accounting basis; balanced postings, immutable posted entries, source uniqueness and locked periods. Avoid double-counting fee receipts and revenue.
- **Acceptance/discovery:** Every posted journal balances and ties to its source; accountant approves cash/accrual basis, funds, opening balance and report presentation. Current expense/fee reports are not a full GL.

## M14 — Procurement, vendors and operating expenses · Core expense slice; Expansion procurement

- **Users/value:** Staff request expenditure; reviewers approve it; finance pays with evidence.
- **Scope/flow:** Requisition → quotation/approval → purchase order → goods receipt → vendor bill → payment. Retain a simpler approved-expense path for small purchases.
- **Records/outputs:** Vendor, Requisition, PurchaseOrder, GoodsReceipt, Expense, VendorBill, Voucher; unpaid bills, spending by category and budget variance.
- **Controls/dependencies:** M12/M13 as applicable, M23 for stocked goods; approval thresholds, separation of duties, duplicate invoice checks and protected evidence.
- **Acceptance/discovery:** Partial goods receipt leaves the order open; payment cannot exceed approved outstanding liability. Confirm quotation policy, advances and who may approve their own request.

## M15 — HR, staff attendance and leave · Expansion

- **Users/value:** HR/Principal maintains employment and leave records fairly.
- **Scope/flow:** Employment terms → attendance/leave request → substitute review → approval → monthly attendance lock. Include staff documents and service history.
- **Records/outputs:** EmploymentTerm, LeavePolicyVersion, LeaveBalance, LeaveRequest, StaffAttendance; leave register, staffing gaps and payroll inputs.
- **Controls/dependencies:** M06/M07; sensitive HR scope, effective policy versions and explicit corrections. Device events are evidence, not automatically salary deductions.
- **Acceptance/discovery:** Overlapping approved leave is rejected; backdated correction is auditable. Confirm leave categories, holidays, overtime and substitute expectations.

## M16 — Payroll and staff advances · Expansion

- **Users/value:** Payroll operator and approver calculate and pay an explainable salary run.
- **Scope/flow:** Salary structure → approved monthly inputs → draft run → review → approve → pay → payslip → reversal/correction. Track loans/advances separately.
- **Records/outputs:** SalaryStructureVersion, PayrollRun, Earning, Deduction, Advance, PayrollPayment; salary sheet, payslip, bank advice and liability register.
- **Controls/dependencies:** M06, M12, M13, M15; prevent duplicate employee-period/source payments; private salary permissions. Distinguish MPO amounts from school-paid components.
- **Acceptance/discovery:** An approved run is reproducible after salary revision; confirm bonuses, deductions, tax/provident-fund applicability and professional accounting review.

## M17 — Notices, consent and message delivery · Core

- **Users/value:** School staff reach the correct audience and know delivery outcomes.
- **Scope/flow:** Audience selection → permission/consent filter → Bangla/English template → recipient/cost preview → approve/send → delivery/retry/suppression. Start with notices, absence and fee reminders.
- **Records/outputs:** Notice, Consent, RecipientSnapshot, Message, DeliveryAttempt, Budget; delivery, failed-contact and communication-cost reports.
- **Controls/dependencies:** M03, M33, M35; post-commit outbox, deduplication, quiet hours, opt-outs where applicable and accurate SMS segment/provider quotes. Never expose group recipient numbers.
- **Acceptance/discovery:** A repeated job does not resend a delivered notification; revoked guardian link is rechecked before dispatch. Confirm urgent exceptions and channel preferences.

## M18 — Guardian portal and family services · Core

- **Users/value:** Verified guardians view permitted children's information and request action.
- **Scope/flow:** Invitation/contact verification → school-approved relationship → child switch → attendance/fees/published results/notices → payment or leave request → school response.
- **Records/outputs:** GuardianAccountLink, RelationshipGrant, Acknowledgement, FamilyRequest; family dashboard, receipts and request history.
- **Controls/dependencies:** M03, M08, M10–M12, M17, M33; per-child/per-purpose access. Link removal must invalidate requests and cached scope; no public student-ID lookup.
- **Acceptance/discovery:** Shared phone does not reveal another family's child; a restricted guardian cannot view prohibited documents. Confirm account recovery, custody restrictions and consent authority.

## M19 — Student self-service portal · Expansion

- **Users/value:** Age-appropriate student access reduces office queries.
- **Scope/flow:** Approved account provisioning → own routine/materials/attendance/published results → permitted requests → response. Guardian access remains separate.
- **Records/outputs:** StudentAccountLink, StudentRequest, Acknowledgement; personal timetable, results and school documents.
- **Controls/dependencies:** M03, M05, M10, M20, M33; no default adult privileges, no classmate balances or sensitive wellbeing records.
- **Acceptance/discovery:** A changed roll or year does not change identity/access ownership; approve age, recovery and personal-device policies before rollout.

## M20 — Learning materials, homework and lesson planning · Expansion

- **Users/value:** Teachers share class work without turning the initial ERP into a full LMS.
- **Scope/flow:** Plan lesson → share protected material/homework → submission → feedback → archive by session. Question bank/manual paper assembly can follow; AI drafting is optional and requires teacher review.
- **Records/outputs:** LessonPlan, Resource, Assignment, Submission, Feedback, QuestionItem; homework completion and syllabus coverage.
- **Controls/dependencies:** M02, M05, M06, M19; subject assignment scope, upload validation, content rights, deadlines and accommodations.
- **Acceptance/discovery:** A teacher sees only assigned submissions; expired enrollment loses current-class material access under policy. Confirm whether online submission is actually needed.

## M21 — Certificates, ID cards and verified documents · Core

- **Users/value:** School office issues consistent documents without editing Word files repeatedly.
- **Scope/flow:** Approved template → record eligibility → preview → authorized issue/serial → print/download → revoke/reissue. Include student/staff ID, testimonial, transfer and character certificates.
- **Records/outputs:** TemplateVersion, DocumentIssue, Serial, Revocation; issue register and approved branded documents.
- **Controls/dependencies:** M03, M05, M33; snapshot historical names/signatory, protected downloads and minimal public verification response if enabled. QR is a reference, not an access grant.
- **Acceptance/discovery:** Reissue references the original rather than replacing it; verify Bangla fonts, page breaks and signature rules with school-approved samples.

## M22 — Library and circulation · Optional

- **Users/value:** Librarian knows who holds each copy and which items are overdue.
- **Scope/flow:** Catalog title → accession copy → lend/renew/reserve → return/lost/damaged → approved fee request/clearance.
- **Records/outputs:** BibliographicItem, Copy, Loan, Reservation, LibraryAdjustment; accession register, overdue list and stock verification.
- **Controls/dependencies:** M03/M06, M11 for fines; copy-level concurrency and school-defined limits. Catalog and physical copy are different records.
- **Acceptance/discovery:** Two users cannot borrow the same copy concurrently; confirm fines, holiday extension and withdrawal clearance exceptions.

## M23 — Inventory, assets and textbook distribution · Optional

- **Users/value:** Storekeeper tracks consumables, equipment and assigned assets.
- **Scope/flow:** Receive → inspect → stock location → issue/return/transfer → count → approved adjustment/disposal. Track textbook distribution separately from reusable assets.
- **Records/outputs:** Item, StockMovement, Asset, Custody, StockCount, TextbookDistribution; stock ledger, asset register and shortage report.
- **Controls/dependencies:** M14, M33; no negative stock unless explicitly permitted; immutable movements, lot/serial where needed and adjustment approval.
- **Acceptance/discovery:** Partial issues reconcile to actual received quantities; confirm valuation/depreciation with M13 and government textbook reporting fields.

## M24 — Transport and authorized pickup · Optional

- **Users/value:** Transport coordinator and guardians know route assignment and handover status.
- **Scope/flow:** Vehicle/driver verification → route/stops/capacity → student service enrollment → trip roster → boarding/alighting → authorized handover → incident follow-up.
- **Records/outputs:** Vehicle, Driver, Route, Stop, TransportEnrollment, Trip, Handover; manifests, capacity and service-charge requests.
- **Controls/dependencies:** M03, M05, M11; restricted location access, time-bounded pickup authority and manual safety fallback. Live GPS is a separate provider-backed extension.
- **Acceptance/discovery:** A student cannot be assigned past vehicle capacity; confirm consent, driver-device access, emergency escalation and charge proration.

## M25 — Hostel and boarding · Optional

- **Users/value:** Warden manages beds, residence and safe leave/handover.
- **Scope/flow:** Application → approved bed allocation → check-in → daily presence/outpass/visitor → check-out → deposit settlement.
- **Records/outputs:** Building, Room, Bed, Residency, Outpass, Visitor, Deposit; occupancy, meal counts, leave and incident reports.
- **Controls/dependencies:** M03, M05, M11/M12; no double allocation, restricted minors' location/access and guardian authorization at departure.
- **Acceptance/discovery:** Concurrent admissions cannot occupy the same bed; approve safeguarding procedures and refundable-deposit accounting before launch.

## M26 — Canteen, meal plans and shop sales · Optional

- **Users/value:** Canteen operator records meal entitlement and sales without altering fee accounts directly.
- **Scope/flow:** Menu/stock → subscription or sale → serve/fulfill → payment/charge request → returns/waste/close. Cash-first; no stored-value wallet initially.
- **Records/outputs:** Menu, MealPlan, Sale, Fulfillment, Waste, TillClose; daily sales, meal count and stock usage.
- **Controls/dependencies:** M12/M23, M11 for approved service billing; allergy data access restricted. A future wallet needs separate financial/regulatory design.
- **Acceptance/discovery:** Retried sale cannot debit twice; confirm cash custody, dietary accommodations and whether the school operates this service itself.

## M27 — Student wellbeing, discipline and safeguarding · Expansion

- **Users/value:** Designated staff manage concerns with appropriate confidentiality.
- **Scope/flow:** Concern/incident → restricted triage → authorized case owner → action/referral → follow-up → restricted closure. Separate routine behavior notes from sensitive safeguarding and health records.
- **Records/outputs:** RestrictedCase, Incident, CarePlan, Referral, CaseAccessEvent; authorized case queue and aggregate trends.
- **Controls/dependencies:** M03/M33; existing Admin/Principal status does not automatically grant every sensitive case. No automated punitive or medical decisions.
- **Acceptance/discovery:** Teacher/guardian access excludes protected case details; obtain qualified safeguarding procedures, emergency escalation and retention decisions before implementation.

## M28 — Reception, visitors and service desk · Optional

- **Users/value:** Front office tracks inquiries, visitors and requested documents safely.
- **Scope/flow:** Inquiry/ticket → assign → respond → resolve; visitor purpose → approval → badge/check-in → host confirmation → checkout. Pickup uses M03 authority.
- **Records/outputs:** VisitorVisit, Appointment, ServiceTicket, Dispatch; open requests, visitor register and turnaround report.
- **Controls/dependencies:** M03/M33; minimal visitor data, restricted search and no exposure of student timetables to visitors.
- **Acceptance/discovery:** An unapproved visitor cannot be marked as authorized to collect a child; confirm badges, emergency processes and retention.

## M29 — Events, clubs, alumni and donations · Optional

- **Users/value:** Coordinators run participation and alumni relationships; finance records donations separately.
- **Scope/flow:** Event/club → eligibility/consent → registration → attendance/award; graduation → opt-in alumni → consented contact; donation pledge → verified receipt → fund reporting.
- **Records/outputs:** Event, Club, Participation, Award, AlumniConsent, Pledge; participation, alumni contact and donation reports.
- **Controls/dependencies:** M03, M05, M12/M13; alumni consent separate from former guardian rights, restricted publication of minors' images and donor-purpose tracking.
- **Acceptance/discovery:** Leaving school does not retain guardian portal privileges; confirm event charges, image consent and donation accounting.

## M30 — Reporting, management analytics and government preparation · Core

- **Users/value:** Principal/committee sees actionable information; office prepares reconciled returns.
- **Scope/flow:** Select period/scope → validate completeness → inspect drill-down → export → authorized sign-off. Report packs cover enrollment, attendance, arrears, collections, results, staff and applicable surveys.
- **Records/outputs:** ReportDefinitionVersion, ExportJob, SubmissionChecklist; source-linked management dashboard, BANBEIS/IPEMIS/board/MPO preparation where formats are validated.
- **Controls/dependencies:** Owning modules; explicit metric definitions, reporting dates and row-level restrictions. Export assistance is not official submission/API integration.
- **Acceptance/discovery:** Dashboard totals tie to the underlying register and calendar; confirm fields and circular year with the responsible school officer.

## M31 — SaaS platform, subscriptions and support · Core

- **Users/value:** Platform Owner/Manager operate customer provisioning and commercial support independently of school data.
- **Scope/flow:** Prospect → contract/trial → institution/first Admin → entitlement → subscription/invoice/payment → renewal/change → export/offboarding. Separate support metadata from tenant content.
- **Records/outputs:** Tenant, Entitlement, Subscription, Invoice, PlatformPayment, SupportCase; renewal, activation, support load and service-status reports.
- **Controls/dependencies:** M33/M34; no automatic school access or impersonation. Subscription changes must not silently overwrite institution access policy. Support access, if ever added, needs separate consented, timed, audited design.
- **Acceptance/discovery:** A Platform Manager cannot read marks or receipts; confirm commercial grace, read-only/export access, refunds and cancellation before automated billing.

## M32 — Import, migration, export and data quality · Core

- **Users/value:** School operator switches safely and can recover its usable data when leaving.
- **Scope/flow:** Download template → upload/map → validate/stage → duplicate review → preview counts/balances → approve/commit → reconcile → export. Failed batches report each row without partial hidden success.
- **Records/outputs:** ImportBatch, Mapping, RowError, SourceKey, Reconciliation, ExportManifest; count/balance reconciliation and portable school exports.
- **Controls/dependencies:** Owning module services and M33; private uploads, formula-injection-safe spreadsheet exports, source idempotency and reviewed corrections after live use.
- **Acceptance/discovery:** Re-importing a source batch creates no duplicate student or opening balance; confirm which history is trustworthy enough to import and who signs it off.

## M33 — Identity, permissions, privacy and audit · Core

- **Users/value:** Authorized people get only the access needed for their responsibilities.
- **Scope/flow:** Identity provisioning → verified school membership/relationship → explicit grants → per-operation checks → revoke/recover → inspect audit. Extend specialist duties through reviewed permission design.
- **Records/outputs:** Identity, Membership, Assignment, RelationshipGrant, AuditEvent, RecoveryRequest; access review and sensitive-action history.
- **Controls/dependencies:** Better Auth establishes identity; application services enforce policy. Preserve last administrator, tenant-safe foreign keys, secure cookies, exact origins and minimal logs; RLS is not currently enabled.
- **Acceptance/discovery:** Revocation blocks repeat/idempotent operations and exports on next authorization check; agree retention, erasure exceptions and privileged recovery with qualified review.

## M34 — Reliability, backups and operational continuity · Core

- **Users/value:** School and support staff can trust the service during collection and exam periods.
- **Scope/flow:** Monitor → alert → triage → recover → reconcile → communicate; scheduled backup → isolated restore → evidence → retention expiry.
- **Records/outputs:** BackupManifest, RestoreDrill, Incident, JobRun, ServiceMetric; incident timeline, capacity and recovery reports without private payloads.
- **Controls/dependencies:** Deployment configuration and M33; encrypted backups, least-privilege operators, retry/dead-letter controls and verified TLS. Offline queue is a separate M08 delivery feature.
- **Acceptance/discovery:** Restore preserves receipt/mark/audit relationships within signed recovery objectives; agree RPO/RTO, support hours and exam-season escalation before a production promise.

## M35 — Integration adapters and external synchronization · Expansion; payment/message subset Core

- **Users/value:** School connects approved providers without coupling core workflows to a vendor.
- **Scope/flow:** Approve provider/contract → configure server-side credentials → sandbox → verify callbacks/events → reconcile → monitor → rotate/revoke. Later adapters may handle approved attendance hardware or GPS.
- **Records/outputs:** ProviderConnection, ExternalReference, InboundEvent, OutboxEvent, SyncCursor, Reconciliation; failed-event and provider-health queues.
- **Controls/dependencies:** M12/M17/M33/M34; provider verification, tenant-bound references, replay protection and no secrets in the browser. Government integrations require explicit access and documented contracts.
- **Acceptance/discovery:** Out-of-order/duplicate events remain safe and inactive connections cannot mutate data; establish available APIs, settlement, consent and device-data ownership first.
