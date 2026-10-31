# Proposed screen and experience design

This is an information architecture and interaction specification, not finished Figma artwork or implemented UI. Preserve EduOS's existing school routes and familiar layouts while extending them. Validate prototypes with actual operators before development.

## Shared shell

Desktop: persistent sidebar, institution/year context bar, page heading and primary action, compact filter row, aligned data workspace and optional detail panel. Clearly distinguish a filter from an action that changes records. Keep identity, school selection and academic session visible without suggesting that selecting a school grants access.

Mobile: accessible drawer navigation, sticky page context, stacked summary and task list, and a readable detail view. Large registers/marks grids retain controlled horizontal scrolling and pinned student identifiers; do not shrink critical text to fit. Core teacher/cashier tasks must work on the school's actual device sizes.

Use the repository's premium system stack with a tested Bangla fallback, no emojis, three text sizes per view, neutral surfaces, restrained green actions, 4–8px corners, faint dividers and 150ms ease-out states with reduced-motion support. Use weight/alignment for hierarchy. Tabular figures help fees/marks; visible focus, labels and semantic tables are required.

## Proposed navigation

| Group          | Destinations                                                                                      | Default audience                               |
| -------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Today          | Role dashboard, tasks, approvals, alerts                                                          | Each authorized user                           |
| Students       | Directory, admissions, enrollments, transfers, promotion, guardians, documents                    | Office/academic staff with grants              |
| Academics      | Setup, staff assignments, routine, attendance, exams, results, learning                           | Principal/teachers by scope                    |
| Finance        | Fee schedules, collection desk, student accounts, reconciliation, expenses, procurement, accounts | Finance staff; approvals by authority          |
| People         | Staff, leave, staff attendance, payroll                                                           | Principal/HR/payroll grants                    |
| Communication  | Notices, audiences, delivery, family requests                                                     | Authorized senders/reviewers                   |
| Services       | Library, assets, transport, hostel, canteen, reception, events                                    | Only entitled service duties                   |
| Reports        | Operational reports, exports, government preparation                                              | Permission-scoped users                        |
| Administration | School setup, users/access, policies, imports, audit                                              | Admin/Principal and explicit specialist grants |

The separate platform console contains customers, provisioning, entitlements, subscriptions, invoices, support metadata and service health. Never mix platform navigation into a school role's sidebar.

## Role home screens

**Principal:** today's missing registers and staff gaps, pending approvals, due/collection summaries, upcoming exams and operational alerts. Each metric shows its date basis and leads to the exact filtered records. Add trends only after the source data is complete; do not show synthetic production analytics.

**Accountant/cashier:** collection search and open till first, then pending verification, outstanding dues, approved expenses awaiting payment and closing differences. Keep collections, receivables, revenue and bank settlement visibly distinct. A daily total should never hide unresolved tenders.

**Teacher:** today's assigned classes and routine, attendance to submit, marks/homework deadlines and reviewed correction feedback. Open the assigned register directly; never require browsing the full student directory for a daily task.

**Admission Officer:** assigned follow-ups due today, inquiry intake, document/selection blockers and conversion checklist. Avoid institution-wide student/finance access simply to populate a dashboard.

**Guardian:** permitted child selector, today's attendance, payable balance, published result/notices and requests. School/child names remain visible when switching families or institutions. Sensitive details and other guardians' contact data remain hidden.

**Student:** personal routine, class materials, homework and published results; age-appropriate support/recovery guidance. Finance/self-payment visibility requires an approved policy.

## Screen inventory for all modules

| Module            | Primary screens                                                               | Main review/output                           |
| ----------------- | ----------------------------------------------------------------------------- | -------------------------------------------- |
| M01 Institution   | Setup checklist, profile, calendar, closures, policies, rooms                 | Effective-policy preview                     |
| M02 Academics     | Years, offerings/sections, subjects/groups, student subject assignment        | Academic structure and capacity review       |
| M03 Directory     | Search/import entry, student dossier, guardians, protected documents          | Duplicate/relationship review                |
| M04 Admissions    | Assigned pipeline, candidate detail/timeline, application, selection/waitlist | Admission confirmation checklist             |
| M05 Lifecycle     | Enrollment history, section transfer, withdrawal, promotion dry run           | Batch approval and year-close checklist      |
| M06 Staff         | Staff directory/detail, employment, subject/class assignments, substitutions  | Workload/assignment conflicts                |
| M07 Routine       | Config, timetable builder, conflict panel, teacher/room views                 | Publish version and print                    |
| M08 Attendance    | My classes, daily register, submission review, correction queue, history      | Missing registers and monthly report         |
| M09 Exams         | Exam setup, schedule/seating, admit cards, marks grid/import                  | Submission and missing-mark review           |
| M10 Results       | Policy editor, calculation preview, anomalies, tabulation, publication        | Marksheets, amendment comparison             |
| M11 Fees          | Heads/schedules, assessment preview, concessions, student account             | Due aging and adjustment review              |
| M12 Payments      | Collection desk, receipt, verification queue, refunds, settlement, till close | Tender reconciliation and variance           |
| M13 Accounts      | Chart/funds, journals, bank reconciliation, period close                      | Trial balance and financial statements       |
| M14 Procurement   | Requisitions, orders, goods received, vendor bills, expense requests          | Approval/evidence and payment voucher        |
| M15 HR            | Employment terms, leave request/calendar, staff attendance                    | Monthly input lock                           |
| M16 Payroll       | Structures, run preview, exception list, approve/pay, advance register        | Private payslip and salary sheet             |
| M17 Communication | Notice composer, audience/cost preview, schedule, delivery failures           | Send approval and delivery report            |
| M18 Guardian      | Child home, attendance, fees/pay, results, notices, requests                  | Relationship/access review for school office |
| M19 Student       | My day, learning, results, own documents, requests                            | Own activity/history                         |
| M20 Learning      | Teacher planner, materials, assignments, submissions, feedback                | Syllabus/homework completion                 |
| M21 Documents     | Templates, issue request, batch preview, issue register                       | Approved print/download and reissue          |
| M22 Library       | Catalog/copies, quick issue/return, reservations, stock check                 | Overdues and clearance                       |
| M23 Assets        | Items/assets, receive/issue, custody, count, textbook distribution            | Variance/disposal review                     |
| M24 Transport     | Routes/stops, vehicles/drivers, allocation, trip manifest, handover           | Capacity/incident queue                      |
| M25 Hostel        | Rooms/beds, allocation, resident detail, outpass, visitors                    | Occupancy and authorized handover            |
| M26 Canteen       | Menu/meal plan, sale desk, fulfillment, waste, close                          | Sales and stock reconciliation               |
| M27 Wellbeing     | Restricted intake, case queue, case timeline, action/referral                 | Access-controlled case closure               |
| M28 Reception     | Inquiry/tickets, appointments, visitor check-in/out                           | Host approval and request tracking           |
| M29 Community     | Events/clubs, registration/consent, awards, alumni, donations                 | Participation and consented contact          |
| M30 Reports       | Report library, saved filters, completeness, export jobs                      | Signed preparation checklist                 |
| M31 Platform      | Customers, provision, entitlements, subscriptions, invoices, support          | Renewal/offboarding review                   |
| M32 Migration     | Template/map, staging errors, duplicates, preview, reconciliation             | Signed counts/opening balances               |
| M33 Access        | Memberships, scoped duties, relationship approval, audit, recovery            | Revocation and access-review evidence        |
| M34 Operations    | Health/job queues, incident view, backup/restore evidence                     | Restricted operational sign-off              |
| M35 Integrations  | Provider setup, sandbox checks, inbound/outbound failures, reconcile          | Restricted connection approval               |

## Key screen interaction designs

### Student dossier

Header: Bangla/English name, stable student reference, active enrollment and status. Tabs: overview, enrollment history, guardians, attendance, finance, results and documents; omit inaccessible tabs. Show relevant actions next to their records, including transfer and relationship verification. A persistent person header must not overwrite year-specific information when session changes.

### Collection desk

Left: search by student reference/name/roll with class/section disambiguation; never use a phone match as proof of identity. Center: charge rows with session/month, original, concession, prior paid, outstanding and allocation input. Right/below: tender, entered amount, total allocation, unapplied balance, confirmation and receipt action.

Keyboard flow: search → choose student → allocate → choose tender → review → record. Do not issue a receipt until the server returns a durable posted receipt. Show pending verification distinctly. Refund/reverse actions live in a separate permission-controlled review, not beside the primary collection button.

### Attendance register

Sticky class/date/status header and submitted count. Each student row has explicit labeled status controls; an optional mark-all action requires clear scope and is reversible before submission. Display unmarked count and actionable errors. Draft/save and submit are separate actions.

After submission, show read-only effective marks with correction history. Offline queue entries display pending/syncing/conflict/denied status per register. Until that capability is built, explain that unsaved work can be lost and provide retry feedback without claiming durable offline storage.

### Marks and result review

Marks grid pins identity and displays subject components/maxima, explicit absence/exemption state, missing count and saved/submitted status. Paste/import performs validation before commit. Review shows calculation policy version, component failures, missing inputs, sample student calculations and publication scope.

Publication requires explicit authorized confirmation of the exact run/scope. Amendments show before/after differences and reason. Portal users see published snapshots only; preview results never leak through an export or notification.

### Promotion batch

Filter current year/class → see eligibility and blocked records → resolve exceptions → preview target placement and roll → compare counts → approve once. Every exception has a reason and approver. Reopen previous batch/history without rerunning writes.

### Message composer

Choose authorized audience → exclude unverified/restricted contacts → preview personalized Bangla/English samples → show recipients, channel segments/cost and quiet-hour handling → approve/send. Delivery view distinguishes provider acceptance, delivered, failed and unknown; avoid a misleading “sent to all” success state.

## Every screen's required states

| State                        | Expected response                                                        |
| ---------------------------- | ------------------------------------------------------------------------ |
| Empty, configured            | Explain that no records exist; offer permitted next action               |
| Missing setup                | Link the precise prerequisite and responsible role                       |
| Loading                      | Stable layout and accessible progress; no fake values                    |
| Unauthorized/disabled module | Clear access explanation; no hidden data fetched for display             |
| Validation failure           | Field/row errors, preserved input and focus on actionable issue          |
| Saving/processing            | Prevent accidental duplicate action; preserve operation identity         |
| Conflict                     | Explain newer state and offer review/reload without losing unsaved input |
| Failed network/provider      | Retry state distinguishable from committed success                       |
| Posted/published             | Durable reference, timestamp, actor and permitted correction action      |

## Prototype and browser acceptance

Before implementation, prototype admission confirmation, cashier collection/day-close, attendance correction, marks publication and guardian child switching. Use synthetic school records. Ask users to complete tasks without coaching and record failures/time-to-completion; do not infer success from positive design feedback.

For implemented screens, verify keyboard and screen-reader labels, narrow/mobile layouts, Bangla rendering, light/dark themes, reduced motion, real empty/error states and permission changes. Print actual A4/thermal receipt, marksheet, routine and certificate examples; inspect pagination and long names. Type/lint tests cannot establish print geometry.
