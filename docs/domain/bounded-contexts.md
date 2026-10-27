# Bounded contexts

| Context                   | Ownership and future responsibilities                                                                | Current status                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Platform administration   | Operators, tenant provisioning, institution state, module entitlements and manual subscription terms | Audited institution/operator management; no tenant bypass         |
| Identity & access         | Users, sessions, memberships, permission decisions                                                   | Institution RBAC and audited membership changes                   |
| Institution configuration | Profile, calendars, locale, policies                                                                 | Identity, type, timezone and platform access state                |
| Academic structure        | Years, grade offerings, sections, subjects                                                           | Minimal admission class/session offerings; broader setup deferred |
| Student lifecycle         | Student/guardian identity, enrollment and transfer history                                           | Durable admitted students and session-specific enrollment         |
| Staff & teaching          | Staff profiles and effective teaching assignments                                                    | Deferred                                                          |
| Attendance                | Roster, draft/submission, correction and history                                                     | Deferred                                                          |
| Assessment & results      | Marks, policy versions and controlled publication                                                    | Deferred                                                          |
| Fees & collections        | Charges, payments, allocation and reversals                                                          | Admission/willing cash charges, collections and receipts          |
| Communication             | Audience selection, consent, delivery and portals                                                    | Timed in-app admission follow-up notifications                    |
| Reporting & audit         | Authorized projections, historical definitions and attributable change                               | Deferred                                                          |

Each API context gets a capability module with explicit application services. Cross-context writes go through the owning service; do not mutate another context's tables directly. Domain events and an outbox are future decisions when real side effects require them. Do not create empty modules or an event bus during bootstrap.

Admissions owns candidate intent, call history, assignments and school admission settings. Its first slice coordinates explicit Academic, Student Lifecycle and Fees services in shared transactions. PostgreSQL reminder processing now has a concrete timed workload; no general event bus or Redis dependency is introduced. See [ADR 0011](../decisions/0011-school-admissions.md).
