# School admissions

Apply committed migrations with `pnpm db:migrate`, rebuild shared packages and restart the API/admin app. Migrations `0004_dear_blue_shield` and `0005_wild_adam_destine` are additive; no existing school data is reset or populated with examples.

## Open the module

1. Super Admin enables Admissions for the institution from its platform details page. Enable Fees too if staff will collect willing or admission fees.
2. Sign into the school app at `http://localhost:5173` using an institution Admin/Principal or assigned Admission Officer account.
3. Sign-in opens Admissions directly when the account has one assigned school with admission access. Accounts with multiple assigned schools choose one first; accounts without an available module see school access status. The old `/workspace` URL redirects through `/app`; it no longer renders a workspace page. The API independently resolves school access.
4. Admin/Principal saves reminder/fee configuration and adds actual class/session offerings in Admissions settings or inline on the new-record form. New record always opens the actual student form. Missing setup appears in an expandable section on that page, and student inputs remain intact while configuration is saved. Explicitly save zero fees if the school charges nothing; unsaved settings do not silently authorize free admission.
5. Create a follow-up, willing record or direct admission. Existing records open from the row details icon or student name.

Admission Officers use the existing `admission_officer` membership role. Admin/Principal can assign that role through the existing membership API for an existing institution member. New staff-account provisioning/invitations are outside this module.

## Collection and call behavior

- Follow-up requires a date and basic contact details. Record needs-time/no-answer calls with a new date; not-interested closes the record. Agreement alone does not post an admission or fee.
- Mark willing or Complete admission opens a full prefilled form. Collect date of birth, parent information, nationality, birth certificate and guardian NID. An Admin/Principal can record a missing-document exception reason.
- Willing creation and follow-up-to-willing conversion expose **Collect willing fee now**, off by default. Skipping it creates no financial obligation. When selected, the configured positive cash amount and receipt save with the record in one transaction.
- Final admission uses the candidate's original fee policy and any eligible willing credit. Staff confirm actual cash received. Payments, receipts and student enrollment commit together. Confirmed records appear in Admitted students.
- Pending follow-up reminders are cancelled when a record becomes willing, admitted or closed. Admin/Principal can change the Admission Officer through Edit details; pending reminders follow the new assignment.
- Reminder delivery runs every 30 seconds while the API is running. The browser refreshes the in-app inbox every 30 seconds. Mark read acknowledges a notification; it does not complete a call. Today/Upcoming/Overdue queues remain available independently of inbox state.
- The directory supports state, schedule, student-name/phone, class/session and Admission Officer filters. An officer cannot broaden their assigned-record scope using filters.

Cash is the only implemented collection method. Gateway settlement, receipt printing, refunds, installments, waivers, physical document uploads and college admissions are deferred. There is no automatic financial waiver on disabling Fees.

## Verification commands

Use a dedicated `eduos_test*` PostgreSQL database and inject `TEST_DATABASE_URL` privately. Never point tests at development school data. Integration fixtures migrate twice and clean only their synthetic rows.

```sh
pnpm test
pnpm test:integration
pnpm test:e2e:admissions
pnpm typecheck
pnpm lint
pnpm build
pnpm format:check
```

The dedicated browser config uses isolated API port 4311 and Vite port 5175. It exercises the actual Hono application, Better Auth and test database rather than intercepting API responses. It is excluded from the general browser command because it needs its own database-backed fixture and server ports. It uses installed Chrome where available or Playwright Chromium; `PLAYWRIGHT_CHANNEL` can override the channel. Authenticated traces are disabled; screenshots contain synthetic records only.

Read [ADR 0011](../decisions/0011-school-admissions.md) for transactions, timed delivery, fee snapshots, privacy and module boundaries. The original [plan](../domain/admissions-plan.md) describes broader discovery and proposed future features; it is not an implementation inventory.

## Verified in this workspace

- `pnpm test`: 112 tests passed across 9 files, including application-entry permissions, one-school redirects, multi-school selection and no-access handling.
- Full `vitest.integration.config.ts` run with a dedicated test database: 53 tests passed across 8 files, including 12 admissions tests. Committed migrations were applied/reapplied by the fixtures.
- Two dedicated real-browser admission flows passed. They cover direct entry after sign-in and from `/`, `/login` and legacy `/workspace`; settings persistence; follow-up/call history; willing without a fee; willing with a fee; credited admission; direct admission; and keyboard stage/switch operation. An unconfigured synthetic school verifies that New record immediately shows the form, configuration can be saved inline without losing student inputs, and the resulting candidate persists through the actual API.
- Desktop assertions verify full content width, three aligned reminder/student columns and save actions below the fields. Settings and intake screenshots were reviewed at 1440px; narrow-screen/dark-mode checks remain in the main browser flow. Shared controls include an exported shadcn/Radix Switch rather than a button impersonating a switch.
- Rendered desktop 1440px and mobile 390px captures reviewed inline: aligned directory, readable horizontally scrollable table, details, intake, light/dark contrast and no page overflow. Theme captures wait for completed transitions. No independent design reviewer or automated accessibility audit is claimed.
- Root lint, typecheck, build, format check and agent validation passed; `git diff --check` passed. The largest changed manually maintained source file is 325 lines.
- `pnpm db:migrate` applied the additive committed migrations to the configured local development database without a reset. A subsequent live API check passed health/readiness, verified the published admission routes and confirmed anonymous admission access returns 401.

Checks used installed dependencies on Node 22.23.3; the repository targets Node 24. A clean dependency installation and Node 24 verification were not performed. The dedicated admission browser check does not claim the older platform preview browser suites were rerun. External messaging, online settlement and production notification availability remain outside this verification.

Primary changed areas: `apps/admin/src/app/institutions/$institutionId/admissions/`, the school workspace entry/central API client, `apps/api/src/modules/{admissions,academics,students,fees,communication}/`, versioned route/OpenAPI registration, `packages/contracts/src/admissions.ts`, permission grants, database schema/migrations, integration fixtures and `e2e/admissions.*`.
