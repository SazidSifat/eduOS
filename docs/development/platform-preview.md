# Platform design preview

`apps/platform` is a separate React/Vite application on port 5174. It uses generated TanStack routes, shared UI/contracts/permissions, and a Better Auth session. The route guard validates `/api/v1/me` and `/api/v1/platform/access`; unauthenticated users see `/login`, while non-operators see `/access-denied`. The overview and directories read live institution metadata and operator assignments. School creation, state changes, subscriptions, messages, and their histories remain labeled in-memory previews.

```sh
pnpm dev:platform
```

Open http://localhost:5174. The command builds shared dependencies first. The school administration app remains on port 5173. The Vite dev server proxies `/api` requests to the local API, and the API trusts the exact `http://localhost:5174` origin for auth/CSRF checks. `apps/platform/.env` is generated non-destructively by `pnpm env:setup`. A provisioned active platform operator is required to enter the console.

| Route                           | Preview                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `/`                             | Live institution count/metadata, operator assignments (Owner) and role grants |
| `/institutions`                 | Search live institution names, slugs and identifiers                          |
| `/institutions/new`             | Validated school name, unique slug and synthetic contact details              |
| `/institutions/:institutionId`  | Contact/profile, freeze/deactivate/reactivate, notices, warnings and activity |
| `/subscriptions`                | Searchable plan, billing cycle, amount, state and renewal directory           |
| `/subscriptions/:institutionId` | Edit sample subscription settings for a school                                |
| `/messages`                     | Prepare school notices/warnings by email or in-app channel; preview history   |
| `/operators`                    | Live operator IDs, roles and active/inactive filters (Owner only)             |
| `/operators/:operatorId`        | Operator profile, active state and role-permission explanation                |

Owner/Manager presentation now derives from `/api/v1/platform/access`; there is no user-controlled role selector. Institution API responses contain only ID, name, slug and timezone. Operator responses contain only user ID, role and active state. The platform API rechecks permissions independently. The current screen connects operator and institution reads; school-management flows remain Owner-only preview controls and introduce no backend permissions or writes.

School creation, state changes, subscription settings, messages and activity live in React context and reset on page reload. New schools start with an unconfigured subscription. Freeze/deactivate/reactivate require a reason and preserve subscription settings; subscription edits preserve school state. Messages derive the recipient from the selected school contact and are stored only as preview entries. No email, notification, invoice or payment is sent or created. Plan names, amounts, renewal rules and the meaning of frozen/inactive access are proposed design inputs requiring product discovery before implementation.

Desktop uses a persistent 224px sidebar, compact tables, a restrained green accent and neutral surfaces. Mobile uses a native dialog for navigation and prioritizes institution names and profile links. The type scale is 12, 14 and 24px; small-screen body/controls use 16px instead of 14px. Panels use 6px radii, and controls use 4px radii. Interactions use 150ms ease-out transitions, removed under reduced motion. Light/dark preference is stored separately from the school app.

Earlier preview browser and action checks cover local school controls. They do not verify the new authenticated API integration. Do not treat those preview checks as live-auth or API verification.

School creation, state, contacts, subscriptions and messaging require deliberate contracts, policy, audited services and migrations; none are added here. The operator contract intentionally returns no names/emails. UI visibility must never become the access boundary. Add UI controls for the existing operator update API as a separate slice, with the server's last-Owner and audit guarantees preserved.
