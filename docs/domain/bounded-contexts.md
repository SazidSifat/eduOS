# Bounded contexts

| Context                   | Ownership and future responsibilities                                            | Current status                                  |
| ------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------- |
| Platform administration   | Operators, tenant metadata; future provisioning, entitlements and support access | Operator RBAC and metadata reads                |
| Identity & access         | Users, sessions, memberships, permission decisions                               | Institution RBAC and audited membership changes |
| Institution configuration | Profile, calendars, locale, policies                                             | Institution identity/timezone only              |
| Academic structure        | Years, grade offerings, sections, subjects                                       | Deferred                                        |
| Student lifecycle         | Student/guardian identity, enrollment and transfer history                       | Deferred                                        |
| Staff & teaching          | Staff profiles and effective teaching assignments                                | Deferred                                        |
| Attendance                | Roster, draft/submission, correction and history                                 | Deferred                                        |
| Assessment & results      | Marks, policy versions and controlled publication                                | Deferred                                        |
| Fees & collections        | Charges, payments, allocation and reversals                                      | Deferred                                        |
| Communication             | Audience selection, consent, delivery and portals                                | Deferred                                        |
| Reporting & audit         | Authorized projections, historical definitions and attributable change           | Deferred                                        |

Each API context gets a capability module with explicit application services. Cross-context writes go through the owning service; do not mutate another context's tables directly. Domain events and an outbox are future decisions when real side effects require them. Do not create empty modules or an event bus during bootstrap.
