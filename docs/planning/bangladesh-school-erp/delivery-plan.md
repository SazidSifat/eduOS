# Delivery, validation and commercial plan

All dates, staffing, prices and targets below are planning assumptions. No release, deployment, purchase or school policy is authorized by this document. Re-estimate after discovery and current-code verification.

## Current EduOS baseline

Observed from local domain/architecture/development documents and module/schema inventory on 31 October 2026. Many files are already modified/untracked by existing work; they were not changed for this plan. These are implementation signals, not claims of production readiness or newly executed test passes.

| Area                        | Observed local coverage                                                                           | Remaining product gap                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Platform/identity           | Better Auth, school roles, platform operators, memberships, entitlements, manual subscriptions    | Production provisioning/recovery, commercial invoices, safe offboarding and stronger privileged-access operations |
| Academic/student foundation | Session/class/section capacity, class teacher, admitted students and annual enrollment            | Rich guardian authority, subjects/groups, effective placements, transfers, promotion/year close                   |
| Admissions                  | Assigned follow-ups, willing/admission charges/collections, admission confirmation and reminders  | Validated selection/waitlist policies, document/duplicate workflows and external selection evidence               |
| Attendance                  | Persistent class daily registers and reviewed corrections                                         | Calendar/historical-roster policy audit, persistent offline queue and absence delivery                            |
| Finance                     | Admission/willing receipts, recurring monthly charges, partial collection and supported reversals | Unified ledger reconciliation, concessions, verified gateways, cash close, refunds and full accounting            |
| Expenses                    | Reviewed requests, protected evidence and vouchers                                                | Vendors, orders, partial goods receipt, liabilities and purchasing controls                                       |
| Routine                     | Draft/published class routines with teacher/room conflict checks                                  | Subject/assignment evolution, substitutions and seasonal calendar variants                                        |
| Assessment/portals          | Broader exams/results and guardian/student portals deferred in domain docs                        | Full M09/M10/M18/M19 workflows                                                                                    |
| Communication               | In-app admission follow-up reminders                                                              | Consent-aware external delivery, budgets, outbox/retry and family requests                                        |
| Operational services        | Full HR/payroll/library/transport/boarding/canteen not established by inspected inventory         | Implement only after their own validated policies and permissions                                                 |

Evidence: [domain overview](../../domain/overview.md), [bounded contexts](../../domain/bounded-contexts.md), [school workspace](../../development/school-workspace.md), [backend](../../architecture/backend.md), [database](../../architecture/database.md) and [authentication](../../architecture/authentication.md). Some older documents describe a platform preview while newer frontend/authentication documents describe live APIs; use source/tests and explicit verification to resolve discrepancies. Do not base a rebuild on an outdated bootstrap summary.

## Release roadmap

Assumption: four dedicated engineers covering backend/frontend, one product/domain lead, one designer and one QA/automation engineer; part-time deployment/security and school finance/academic reviewers. Phases overlap where dependencies allow. Relative weeks start after staffing and discovery access are available. Estimates have low confidence; retain 30–50% contingency until the first two releases are measured. Staffing does not imply delegation has occurred in this research task.

| Release                              | Indicative window | Scope                                                                                                                                 | Exit evidence                                                                                          |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| R0 — Validate and reconcile          | Weeks 1–4         | School interviews; source/test inventory; policy register; migration/restore rehearsal; design prototypes                             | Five-school evidence pack, verified current gaps and signed first-release scope                        |
| R1 — Reliable school operation pilot | Weeks 5–12        | Complete M01/M03–M08 existing slices; M11/M12 cash ledger and close; M14 expense slice; M21 essential prints; M30/M32–M34 foundations | Reconciled imports/opening balances, daily attendance and cash close; authorization/recovery gates     |
| R2 — Academic completion             | Weeks 13–22       | M02 subject rules, M06 assignment history, M09/M10 exams/results, M05 promotion and M21 marksheets/TC                                 | School-approved sample calculations, one exam cycle and year-transition rehearsal                      |
| R3 — Connected family product        | Weeks 23–32       | M17/M18, M12 verified online payment, M35 payment/message adapters; harden M30                                                        | Relationship denial tests, verified payment/settlement, controlled message delivery; paid core renewal |
| R4 — Institutional finance           | Weeks 33–44       | M13 GL/funds, M14 procurement/vendor liabilities, M15 HR/leave and M31 commercial billing                                             | Accountant-approved statements, purchasing controls and payroll-ready inputs                           |
| R5 — Staff and service expansion     | Weeks 45–64       | M16 payroll; M19/M20 learning/self-service; M22/M23 library/assets; M28 reception                                                     | Validated salary runs, circulation/stock reconciliation and service permissions                        |
| R6 — Full service portfolio          | Weeks 65–80+      | M24–M27 transport/hostel/canteen/wellbeing; M29 community; remaining M35 adapters; campus study                                       | Service-specific pilot sign-offs, safeguarding controls and sustainable support costs                  |

The first complete core product is a proposed 6–9 month outcome with this team, conditional on discovery and existing-code health. The full optional portfolio is approximately 15–24+ months, with demand gates and substantial uncertainty. Do not promise every service pack on one date. A one/two-engineer team should ship fewer releases/modules rather than reuse these dates.

M31–M35 are ongoing capabilities, not one-time completion boxes. R1 needs operational foundations before children or money depend on the service; automated commercial billing and additional adapters can arrive later. Add early SMS or a library pack ahead of the table only when a paying pilot's need and dependency readiness justify reprioritization.

## First implementation backlog

Sizes are rough team effort bands: S = 2–5 engineer-days, M = 1–2 engineer-weeks, L = 3–5 engineer-weeks, XL = split after discovery. These are not calibrated estimates or guaranteed sprint capacity.

| ID  | Work package                                | Modules / dependency  | Acceptance and accountable reviewer                                                                             | Size |
| --- | ------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------- | ---- |
| B01 | Current-flow verification and gap register  | Existing app          | Product/QA records actual persistence, policy, source/test coverage and unresolved defects                      | M    |
| B02 | School evidence and decision register       | All / B01             | Product lead obtains approved policy examples from five contrasting schools                                     | M    |
| B03 | Golden datasets and negative access suite   | M33 / B02             | QA/security verifies tenant, assignment, revocation and rollback examples                                       | M    |
| B04 | Import staging and reconciliation           | M32/M03 / B02         | School operator signs counts, duplicates and opening-balance comparison                                         | L    |
| B05 | Guardian identity and relationship model    | M03/M33 / B02         | Principal approves verification, revocation, shared phone and restricted relationship cases                     | L    |
| B06 | Calendar and academic subject/section model | M01/M02 / B02         | Academic reviewer signs session, shift, elective/group and closure examples                                     | L    |
| B07 | Enrollment and teaching history             | M05/M06 / B06         | Academic reviewer verifies transfers, substitutes and historical roster                                         | L    |
| B08 | Attendance completion and correction review | M08 / B07             | Class teacher and reviewer demonstrate daily submission and audited amendment                                   | M    |
| B09 | Unified student finance reconciliation      | M11/M12 / B01/B04     | Accountant reconciles admission, willing, recurring charge and supported reversal paths without double counting | L    |
| B10 | Concessions, till close and refund controls | M11/M12 / B09         | Finance reviewer verifies partial/overpayment, cash variance, reversal versus refund                            | L    |
| B11 | Essential print/document templates          | M21 / B04/B09         | Office verifies actual Bangla/A4/thermal samples and serial history                                             | M    |
| B12 | Restore, monitoring and privileged recovery | M33/M34 / B01         | Operations/security signs isolated restore, sanitized telemetry and recovery access                             | L    |
| B13 | Exam/component and marks workflow           | M09 / B06/B07         | Exam committee verifies subject scope, validation/import and locking                                            | L    |
| B14 | Versioned calculation and publication       | M10 / B13             | Academic reviewer signs all golden cases, privacy and amendment evidence                                        | XL   |
| B15 | Promotion and year transition               | M05 / B07/B14         | Principal signs dry-run counts, exceptions and repeat-safe next-year creation                                   | L    |
| B16 | Guardian account provisioning/portal        | M18 / B05/B08/B14     | Guardian testers complete child switching; QA verifies unauthorized downloads denied                            | L    |
| B17 | Messaging provider/outbox/consent           | M17/M35 / B05/B12     | School approver checks actual recipient/cost preview and replay-safe delivery                                   | L    |
| B18 | Payment provider and settlement             | M12/M35 / B10/B12     | Provider sandbox, finance and QA verify duplicate, missing and unmatched settlements                            | L    |
| B19 | Connectivity-tolerant attendance            | M08 / B08/B12         | Teacher/QA verifies persisted queue, stale conflict, expiry and revocation                                      | L    |
| B20 | Pilot reporting and renewal evidence        | M30/M31 / B04/B08/B10 | Product lead compares baseline outcomes and records paid renewal decisions                                      | M    |

B19 is not a prerequisite for online attendance if pilot schools accept the limitation; it is a prerequisite to an offline-ready product claim. A provider agreement is an external dependency for B17/B18. Do not let a missing agreement block unrelated academic work.

## Cost and capacity model

Estimate engineering effort per validated ticket, then add product/design/QA, deployment/security, school onboarding/support and contingency. The roadmap is not a vendor quote.

`release cost = engineer-months × loaded engineering rate + product/design/QA months × their loaded rates + infrastructure/providers + migration/training/travel + contingency`

For example, 4 engineers × 8 months = 32 engineer-months for an 8-month core planning scenario before holidays, overhead, support and non-engineering roles. Multiply by the team's actual loaded rate; this plan does not assert Bangladesh salary benchmarks. Track unplanned support work and reforecast every two-week cycle. Reserve exam/collection-season stabilization time.

Milestone owners: product lead accepts scope/policy; academic reviewer accepts assessment/progression; school accountant accepts finance; technical lead accepts boundaries/migrations; QA accepts regression evidence; operations accepts recovery; Principal accepts pilot readiness. One person may cover several duties, but approvals must remain attributable.

## School discovery schedule

| Period | Activity                                                                           | Required output                                                                   |
| ------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Week 1 | Observe admission, teacher attendance and cashier close at two contrasting schools | Process maps, actors, actual devices, baseline timings and anonymized samples     |
| Week 2 | Three further schools plus guardian interviews                                     | Segment differences, switching barriers and preliminary willingness to pay        |
| Week 3 | Prototype core tasks; validate finance and assessment examples                     | Task failure notes, corrected flows, signed calculation/receipt samples           |
| Week 4 | Review permission matrix, migration and commercial proposal                        | Decision register, initial acceptance set, pilot agreements and estimated backlog |

### Questions that block implementation policy

| Topic                | Decisions to record                                                                                     | Decision owner                         |
| -------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Academic scope       | Curriculum/medium/version, class groups, shifts, term/year dates, roll uniqueness                       | Principal/academic lead                |
| Admission            | Central selection applicability, eligibility, seat hold, duplicate matching, refunds                    | Principal/admissions lead              |
| Guardians            | Verification, legal/custody restrictions, shared-phone recovery, permitted child data                   | Principal/designated authority         |
| Attendance           | Statuses, closures, cutoff, late enrollment, substitutes, correction authority, alerts                  | Academic lead                          |
| Exams/results        | Components, pass rules, weights, optional subjects, rounding, ranks, retakes and descriptive assessment | Exam committee/Principal               |
| Fees                 | Proration, arrears, fines, allocation, concessions, overpayment, refunds and cash custody               | Accountant/Principal                   |
| Accounting/payroll   | Basis, funds, opening balances, salary components, MPO separation and applicable deductions             | Qualified accountant/school management |
| Privacy/safeguarding | Collection purpose, sensitive-case access, retention, public verification, incident handling            | School authority with qualified review |
| Operations           | Service availability, custody, bed/bus limits, procurement approvals and emergency procedures           | Responsible service lead               |
| Commercial           | Payer, annual budget, support hours, switching cost, cancellation/export and grace                      | Owner/committee                        |

Record decision ID, evidence/sample, institution/session applicability, approver/date, version and acceptance example. Unsupported assumptions remain visibly open. Do not implement legal or academic rules from a vendor's marketing page.

## Pricing and packaging hypotheses

The [market research](research.md) contains observed competitor prices and caveats. The following are proposed experiments, not final EduOS prices or evidence of willingness to pay.

| Offer hypothesis                | Proposed monthly subscription                            | Intended test                                                                                                        |
| ------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Core, up to 300 active students | ৳2,000–৳3,000                                            | Can small schools cover support cost while getting records, attendance, fees, results and essential guardian access? |
| Core, 301–1,000                 | ৳4,000–৳6,000                                            | Does reliable reconciliation and assisted adoption justify the contract versus low-price bundles?                    |
| Larger/complex school           | Quoted after workload/support review                     | Avoid unlimited commitments without capacity and support economics                                                   |
| Operational packs               | Quote by validated scope and service burden              | Payroll, procurement, transport/hostel require additional training and controls                                      |
| Assisted onboarding             | Test ৳5,000–৳15,000 for defined standard import/training | Waive/discount only when delivery costs and conversion justify it                                                    |

Do not charge separately for security, backups, audit, basic export or fixes to financial correctness. Keep the initial core offer understandable; compare a complete 12-month bill against competitor quotes. Charge SMS, payment processing, hardware, unusual migration and onsite travel transparently under agreed terms. Approve tax treatment before issuing offers.

Define “active student” contractually; exclude old archives and reviewed withdrawn enrollments, and prevent accidental annual double billing. Keep institution subscription money separate from school fee collections and merchant settlement. Use a school-owned merchant arrangement where provider terms support it; no pooled customer-money design is assumed.

Measure gross contribution per school: collected subscription and service revenue minus hosting/storage, messages, provider costs, onboarding amortization and support labor. Acquisition cost includes sales visits and demonstrations. Track renewal/churn reasons and payback using actual cohorts before setting a growth budget.

## Go-to-market and onboarding

1. Recruit five design partners through permitted school relationships; this plan authorizes no outreach messages. Use a time-bounded pilot with clear support and export terms.
2. Demo the school's tasks: find a student, collect part of a bill, reconcile close, correct attendance and publish an approved result. Use synthetic data during sales.
3. Start one academic year and verified opening balances. Import older history only when the source can be reconciled and scoped.
4. Run a short parallel register/finance period with school approval; designate one authoritative source at cutover to prevent double collection/mark entry.
5. Train Admin/Principal, cashier/operator and teachers separately. Provide short Bangla task guides and named escalation contacts.
6. Review adoption weekly for the first month; track missing registers, unresolved balances, failed messages, support time and task blockers.
7. Offer paid renewal after 60–90 days with measured outcomes. Expand to a defined local segment only after product reliability and support economics hold.

Onboarding checklist: contract/processing responsibilities → school authority → policy versions → accounts/permissions → academic setup → source import/sign-off → finance opening balance → printed examples → staff training → backup/restore evidence → cutover owner/date → first close review.

Offboarding checklist: verify requesting authority → agree export scope → export data/documents/history with manifest → school confirms receipt → revoke relationships/provider connections → settle subscription → follow approved retention/deletion schedule. Preserve required financial/audit history under reviewed obligations; do not retain everything indefinitely by default.

## Release quality gates

- **Domain:** school-approved examples and policy version; no open ambiguity affecting money, publication, custody or access.
- **Data:** reviewed additive migrations, constraints/indexes, rollback/forward recovery and historical preservation. Never reset shared databases or edit applied migrations.
- **Authorization:** cross-tenant IDs, revoked memberships/relationships, ended assignments, privilege escalation, exports and replay denial tested.
- **Finance:** duplicates/concurrency, partial allocation, reversal/refund, settlement reconciliation and unexplained variance cases tested.
- **Academic:** incomplete marks, absence versus zero, rule versions, amendments and year-transition cases tested.
- **UI/print:** actual browser tasks, keyboard/mobile/Bangla, errors/conflicts and printed geometry verified using synthetic records.
- **Operations:** sanitized logs, monitored failures, verified recovery/provisioning, private exports and agreed recovery/support targets.
- **Commercial:** named school sponsor, onboarding sign-off, complete pricing and cancellation/export terms.

Use applicable commands from [getting started](../../development/getting-started.md): `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and focused integration/browser suites. Integration tests use a dedicated `eduos_test*` database. A documentation plan does not require application migration, data mutation or deployment. Do not report historical test results as current passes.

## Risk register

| Risk                               | Indicator                                  | Mitigation / owner                                                      |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| Scope overwhelms core quality      | Many started modules; broken daily tasks   | Product lead gates optional packs on core outcomes                      |
| Policy varies by school/session    | Conflicting fee/grade examples             | Domain lead versions approved institution policies                      |
| Existing work is assumed complete  | Docs and source disagree                   | Technical lead runs B01 and records actual evidence                     |
| Migration corrupts trust           | Count/balance differences                  | Operator/accountant sign reconciliation before cutover                  |
| Money counted twice                | Unmatched or duplicate transactions        | Finance lead enforces source uniqueness and day/settlement close        |
| Unauthorized family/staff access   | Shared phones, stale grants, broad exports | Security lead reviews relationship/assignment denial cases              |
| Provider approval/delivery delayed | Sandbox/merchant contracts unavailable     | Product keeps cash/in-app flows usable; no false integration claims     |
| Offline overwrites correct records | Silent replay conflicts                    | Technical lead uses visible versioned queue and reauthorization         |
| Peak exam load or outage           | Slow exports/results/collection            | Operations measures load, limits jobs and rehearses recovery            |
| Low-price plan loses money         | High support/onboarding per school         | Commercial lead measures contribution and narrows service scope         |
| Sensitive case mishandled          | Broad admin access to health/custody notes | School authority approves specialist safeguarding procedures before M27 |
| Premature campus/global expansion  | Conflicting ownership and permissions      | Architecture review before changing tenant boundary                     |

## Completion of this planning task

Deliverables are the research, module catalog, screen specification, logical workflows/data design and this delivery plan. They are proposed designs, not implemented ERP modules. Next authorization should select a release or capability for validated implementation; it should not require redoing the full market analysis. Refresh prices, circulars and provider terms before commercial or academic commitments.
