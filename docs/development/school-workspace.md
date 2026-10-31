# Live school workspace

The 38 former demo pages now load persistent, authorized data. The URLs `/admissions`, `/attendance`, `/fees`, `/expenses`, `/routine` and `/settings` keep their existing child routes. They require sign-in and an active assigned school role. `/app` selects a school when the account has multiple memberships; links preserve `?institutionId=<uuid>`. The institution selector never grants access.

## Setup

1. Build shared packages with `pnpm exec turbo run build --filter="./packages/*"`.
2. Apply committed migrations with `pnpm db:migrate`, including 0007 and 0008. Restart the API afterward.
3. A Platform Owner enables the school's actual modules. Admissions uses Admissions, attendance uses Attendance, routine/academic configuration uses Academics, and student fees/expenses use Fees. School staff cannot enable entitlements themselves.
4. An Admin/Principal configures the school profile, session/class sections, capacities and actual class teachers under Settings. Configure admissions reminders, willing fees, admission fee items and any expense categories before their respective workflows. No sample records are loaded automatically.
5. Create intake records and confirm admission through the existing admission services. The resulting real enrollment becomes the attendance roster. Optional willing collection is recorded on creation/conversion, with actual cash confirmation. Recurring billing dates cannot begin in the past.

Admin/Principal manage school settings, membership and review operations. Admission Officers manage their assigned intake records and permitted admission collections. Accountants read/collect school fees and record/pay approved expenses. Teachers mark only their assigned classes and read published teaching assignments. A school with no permitted enabled module displays an access explanation.

Attendance marks remain local until Save draft or Submit succeeds. All enrolled students need a mark before submission. After submission, use a correction request; the original is retained. There is no persistent offline queue: keep an unsaved screen open and retry after reconnecting. Leaving or reloading an unsaved draft can discard its local selections.

Collections allocate cash to actual open monthly charges. Partial payment is supported. The collection API returns the durable receipt ID before the client opens its page. Only authorized school finance managers reverse supported school receipts, with a reason. Existing admission/willing receipts keep their original policy. Stopping a monthly schedule preserves posted charges and receipts.

Expense evidence is uploaded before submission and remains available through an authenticated download. All submitted expenses need review, and paid/approved requests are immutable. Principal-only review is enforced according to the configured threshold. Recording an expense payment creates a durable voucher with the actual actor and date.

Class routine configuration starts empty. Choose actual class/section, teaching days, effective date and periods, then assign active Teachers and rooms. Complete every slot and resolve actual conflicts before publication. Published versions remain in history. School staff names, institution labels, receipts and dates come from live data.

## API

| Method | Path suffix under `/api/v1/institutions/:institutionId/school` | Result                                                            |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| GET    | `/`                                                            | Role/module/assignment-filtered school snapshot                   |
| POST   | `/commands`                                                    | Validated command with operation key and expected school revision |
| POST   | `/evidence`                                                    | Size/signature-validated PDF/PNG/JPEG upload, at most 5 MB        |
| GET    | `/evidence/:evidenceId`                                        | Authenticated attachment download                                 |

OpenAPI describes all endpoints and command variants. Every tenant operation revalidates the current membership, institution state, permission, entitlement and relevant ownership. Concurrent/stale commands return 409; unauthorized operations return 403; malformed input returns 400.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
# Inject a private TEST_DATABASE_URL naming a dedicated eduos_test* database:
pnpm test:integration
pnpm test:e2e:school
pnpm test:e2e:admissions
```

The school browser suite starts its own API fixture on port 4321 and admin app on 5176. It checks authentication, every static former demo page, actual intake and attendance saves/reloads, responsive navigation, evidence uploads and expense approval/payment persistence. Traces are disabled to avoid retaining credentials. Existing admission browser tests cover the compatible institution-prefixed forms. See [ADR 0012](../decisions/0012-live-school-workspace.md) for boundaries and operational limits.

## Dated enrollment API

Apply migration `0009_enrollment_dates` before the updated API/client. School
snapshots include `enrollmentId`, nullable `startsOn` and nullable `endsOn` for each
roster entry. Null means unknown; existing rows and new admissions are not assigned
invented dates. An Admin/Principal with Academics enabled can submit this action
through the existing revision/operation-key command endpoint:

```json
{
  "type": "enrollment-dates",
  "enrollmentId": "11111111-1111-4111-8111-111111111111",
  "startsOn": "2026-01-15",
  "endsOn": null,
  "reason": "Start date verified against the school register"
}
```

Both boundaries must be present, using null for an unknown date. They are inclusive.
Changes preserve before/after audit history; dates that exclude a submitted mark
return 409. Daily attendance uses the selected date, and submitted registers retain
their recorded roster. Monthly reports include the applicable month roster. Open Settings → Academic setup → Enrollment dates to choose an enrollment,
record or clear dates, provide a reason and inspect before/after history. Only
Academics managers with the module enabled can use this editor or its history API. See [ADR 0013](../decisions/0013-dated-enrollment-rosters.md).

History reads use `GET /school/enrollments/:enrollmentId/history?limit=20&offset=0`
under the existing institution-scoped base path. Limits are 1–100 and offsets
0–100000. The server rechecks access on every page and returns `hasMore`. No new
migration is required for the editor/history reader; migration 0009 remains required.
