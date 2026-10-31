# Implementation baseline and gap register

Started 31 October 2026. This records B01 verification and the first B03 finance
regressions against the current working tree. It does not approve school policies
or establish production readiness. Existing modified/untracked work is preserved.

## Verified implementation inventory

| Area                         | Source and executable evidence                                                       | Remaining work                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Identity and tenant access   | `services/identity`, `services/platform`, RBAC and platform SQL suites               | Production recovery, support operations and deployment verification                                                       |
| Admissions                   | `services/admissions`; admissions, policy and replay SQL suites                      | Selection/waitlists, document review and duplicate resolution require school discovery                                    |
| Academics and enrollment     | `schema/academics.ts`, academic-capacity SQL suite                                   | Explicit nullable dates and audit now implemented; teaching still uses the current offering teacher without dated history |
| Attendance                   | `services/attendance/attendance.service.ts`, school and attendance-replay SQL suites | Known enrollment dates now filter rosters; dated placement/teacher history, calendar policy and offline queue remain open |
| Collections                  | `services/fees`, school-fees SQL suite                                               | Cash close, concessions, refunds and provider settlement remain open; full admission/monthly reconciliation is B09        |
| Expenses                     | `services/expenses`, school SQL suite                                                | Procurement, vendor liabilities and accounting remain later slices                                                        |
| Routine                      | `services/routine`, routine policy and school SQL suites                             | Subject catalogs, substitutions and dated teaching assignments remain open                                                |
| School workspace             | Existing authenticated school routes and `e2e/school.spec.ts`                        | Browser task coverage is narrower than all proposed acceptance cases; print geometry still needs dedicated verification   |
| Exams, results and promotion | No implemented capability established by this inventory                              | B13–B15 after approved academic examples                                                                                  |
| Guardians and integrations   | No completed access workflow established by this inventory                           | B05/B16–B18; do not infer access from a phone number or a schema file                                                     |
| Imports and recovery         | Existing migrations and fixtures provide technical setup only                        | B04 signed counts/balances; B12 isolated backup restore and operational evidence                                          |

Source paths above are relative to `apps/api/src` unless marked as schema or E2E.
Schema paths are relative to `packages/database/src`.

## First regression increment

`apps/api/test/school/collection-integrity.integration.test.ts` adds:

1. Competing cashiers attempt to collect the same remaining balance at the same
   revision. Exactly one succeeds; only one payment and revision increment persist.
   Retrying at the latest revision still cannot collect the settled charge.
2. A collection includes a valid allocation and an unknown charge. The request
   fails without a payment, balance change, revision increment or saved operation.
   The caller can correct and retry the failed operation key.

These exercise existing transaction boundaries, not a new accounting policy.
They do not claim to simulate a database failure after a payment insert.

## Current verification

Commands use the existing dependency installation; no clean frozen install was
performed. The observed runtime is Node 22.23.3, below the required Node 24.
Passing checks therefore do not establish supported-runtime reproducibility.

| Command                 | Actual result                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm lint`             | Passed                                                                                            |
| `pnpm typecheck`        | Passed, including the new collection tests                                                        |
| `pnpm test`             | 149 tests passed in 14 files                                                                      |
| `pnpm build`            | Passed across 8 build tasks                                                                       |
| `pnpm test:integration` | 72 tests passed in 17 files against dedicated `eduos_test_codex`                                  |
| `pnpm test:e2e:school`  | 6 tests passed, including enrollment-date editing, clearing and audit history                     |
| `pnpm format:check`     | Failed on pre-existing `packages/database/src/schema/guardians.ts`; unrelated file left untouched |

The first browser attempt could not start its server in the sandbox. The permitted
rerun exposed a stale test locator: the UI displays `Publish version N`, while the
test expected `Publish routine`. The locator now matches the versioned button;
all four browser workflows passed. No UI behavior was changed.

Changed-file formatting passes. The full repository format check remains blocked
by the unrelated guardian schema file noted above.

## Ordered next work

1. Keep browser and integration suites serial when sharing a test database.
   An overlapping run correctly failed the RBAC existing-operator guard; the
   subsequent serial integration run passed all 65 tests.
2. B02: obtain approved academic calendar, enrollment/transfer, guardian authority
   and finance examples. No school outreach has occurred.
3. B07: implement effective-dated teaching assignments and placement transitions.
   Enrollment boundaries now have an audited API, management screen and history
   viewer; undated legacy rows remain explicit.
4. B08: complete calendar/closure rules and historical teaching/placement scope.
   Attendance now consumes known enrollment boundaries and preserves submitted rosters.
5. B09/B10: reconcile existing money paths before introducing concessions, till
   close and refunds.

R0 remains in progress: school evidence, clean Node 24 installation, recovery
rehearsal and pilot sign-off are outstanding. B03 is only partially covered.

## Dated enrollment increment — 31 October 2026

Implemented the first B07/B08 slice: nullable inclusive enrollment dates, a scoped
`enrollment-dates` school command, atomic before/after audit, dated server roster
validation and daily/monthly browser consumption. Submitted roster identities stay
fixed. Date edits cannot exclude submitted marks; modified draft rosters require
saving again. Unknown dates remain explicit, including on new admissions.

Migration `0009_enrollment_dates` was generated and reviewed. Snapshot comparison
shows only `student_enrollment` changed and `enrollment_date_change` added. Existing
rows retain identity and null dates in a real pre-migration upgrade/reapply test.
The migration was initially tested only in isolated databases, then applied to the
configured application database to resolve missing columns. Guardian work remains untouched.

Changed areas: database academics/enrollment-history schema, migration SQL/journal/
snapshot and upgrade test; shared school contracts; Student Lifecycle date service;
school command policy/dispatch and OpenAPI; attendance eligibility and school roster
projection; attendance provider, daily/classes/review/corrections/monthly screens;
API fixtures and SQL/UI/browser regressions. See [ADR 0013](../../decisions/0013-dated-enrollment-rosters.md)
and [API usage](../../development/school-workspace.md#dated-enrollment-api).

Limitations: dates do not constitute transfer or withdrawal actions, release seats
or change billing. Teaching assignment
history, calendar rules, domain discovery and recovery readiness remain open. The
existing unsupported Node 22 runtime and unverified clean install caveat still apply.

## Enrollment management increment — 31 October 2026

Academic setup now includes a student selector, optional inclusive date controls,
required reason, client validation, persisted clearing and paginated before/after
history. The new history endpoint checks current membership, permission, Academics
entitlement and enrollment ownership; teacher attendance payloads contain no audit
reasons. Academics managers can select enrollments with Attendance disabled.

Changed files: enrollment-history shared contracts/export; Student Lifecycle history
reader; school routes/service/snapshot/OpenAPI; Academic setup and its colocated
editor/history/query files; DemoAction and historical reducer typing; API and RTL
regressions; school browser test and fixture server; architecture and workflow docs.
No new migration is required. Existing migration 0009 must already be applied.

Commands: `pnpm test` (149), `pnpm test:integration` (72), `pnpm test:e2e:school` (6),
`pnpm lint`, `pnpm typecheck`, `pnpm build` pass. Full `pnpm format:check` still
fails only on the pre-existing guardian schema formatting. Initial browser runs
exposed shared sign-in throttle state; fixture sessions and a per-server synthetic
proxy identity now isolate test runs without disabling auth limits. Light/mobile/
dark editor screenshots use synthetic records. Clean Node 24 install remains unverified.
