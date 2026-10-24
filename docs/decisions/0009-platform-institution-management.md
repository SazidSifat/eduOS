# Platform institution management

Status: Accepted, 24 October 2026. Extends ADR 0006 and supersedes the institution-management preview portions of ADR 0008.

## Decision

Super Admin manages institution creation, access state, module availability and manual subscription terms through the separate `/api/v1/platform` route group. Platform Manager retains read-only institution metadata access. Platform roles do not receive school memberships or tenant-data access.

New institutions require a type: `kindergarten`, `high_school` or `coaching_center`. Creation also requires a new first Admin's name, email and initial password. An explicit identity provisioning service creates the Better Auth credential and active school Admin membership inside the platform creation transaction. Institution, credentials, membership, module grants and creation audit either commit together or roll back. An existing email is rejected; this workflow never resets credentials or grants a membership to an existing identity. Only the password hash is persisted. Responses, audit rows and logs exclude the password.

Institution access state is independent of subscriptions. Both `frozen` and `inactive` block school workspace, access and membership operations on subsequent requests, while retaining records and memberships. They require a reason of at least five characters. `active` restores access according to the existing memberships and school role grants. Global identity sessions remain valid because a person can belong to other institutions. A request already authorized before a state change commits can finish.

Module availability is an institution entitlement, separate from school role permissions. The initial catalog is academic setup, admissions, attendance, assessment/results and fees/collections. Missing grants deny module access. Creation does not accept module settings. Every module starts off and is configured afterward from the institution details page. Tenant access/workspace contracts expose the enabled keys, and `requireTenantModule` checks both an operation permission and the selected institution's grant. Business module endpoints remain deferred and must repeat these checks at their data boundary when implemented; a toggle does not implement a school business workflow.

The subscription editor lives on the institution details page alongside access and module settings. The subscription directory links into this same page; there is no separate edit route. Subscription records hold an owner-entered plan name, trial/active/past-due/cancelled status, monthly/annual cycle, whole-taka BDT amount and optional period end date. They do not define a fixed plan catalog, collect payment, issue invoices, auto-renew or automatically suspend an institution. Those billing policies require a separate workflow. Subscription cancellation therefore preserves institution access until Super Admin explicitly changes its access state.

## Transactions and history

Management writes recheck the active operator and explicit permission under a shared operator-row lock, then lock the institution before writing settings. Membership reads/writes lock the institution before membership rows. State, module and subscription changes append an attributable `platform_institution_change` row in the same transaction. Repeating the same desired state does not update timestamps or append another event. Concurrent changes serialize and use the last committed desired state; this API has no optimistic-version guarantee.

The additive `0002` migration creates configuration/audit tables and institution columns. Existing institutions remain active, keep an unclassified nullable type, and receive no fabricated subscription or module grants. No identity, membership or school record is deleted or promoted by migration. Deploy migrations before the API/client changes. Audit foreign keys restrict deletion of referenced institutions and operators; retention and erasure need a deliberate future workflow.
