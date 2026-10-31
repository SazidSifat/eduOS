# Frontend

`apps/admin` contains the school administration app. `apps/platform` is a separate control-plane app on port 5174 with Better Auth sign-in, server-guarded routes and TanStack Query. Its institution creation/settings, first Admin provisioning, manual subscriptions and operator assignments call `/api/v1/platform/*`. There are no seeded preview records. School communications and automated billing remain deferred. See [platform integration](../development/platform-preview.md) and [ADR 0009](../decisions/0009-platform-institution-management.md).

React/Vite uses TanStack file-based routes rooted at `src/app`, following folder/page conventions similar to the Next.js App Router. Vite's TanStack plugin generates `src/routeTree.gen.ts` and automatically splits page components. It runs before the React plugin.

```text
src/
  app/
    __root.tsx            TanStack root adapter and skip link
    page.tsx              / redirects to /login
    login/
      page.tsx            /login, redirects signed-in users to /app
      _component/         Login page, form and form hook
      _api/               Better Auth client, identity query and session guards
    app/
      page.tsx            /app resolves assigned schools and opens the application
      _component/         School chooser for multiple memberships / access status
      _api/               Verified application entry
    institutions/$institutionId/
      page.tsx            Opens the first available school module
      _api/               Membership, access and workspace queries
      admissions/         Admission routes, forms and queries
      settings/           School module settings, including admissions configuration
    workspace/
      page.tsx            Compatibility redirect to /app; no workspace screen
  components/
    layout/               Shared brand, theme toggle, root layout and app shell
    providers/            Theme provider
  lib/                    Central typed API client, configuration and Query client
  stores/                 Theme preference only
  router.tsx              Router instance
```

The platform app uses the same generated route convention. `/login` is standalone; protected routes resolve `/api/v1/me` and `/api/v1/platform/access` before rendering, redirecting 401 to login and 403 to a platform-access explanation. The Vite dev server proxies `/api` to the local API so browser requests and session cookies stay on `http://localhost:5174`; the API's exact trusted-origin list includes that origin. `apps/platform/.env.example` defines the local same-origin API/auth URL; `pnpm env:setup` creates the local file without overwriting an existing one. Query data is cleared on logout. UI permission visibility is only a guide; the platform API independently resolves operator access on every request.

`tsr.config.json` sets `routesDirectory: ./src/app` and `indexToken: page`. The folder structure follows `hospital_v2/apps/sastho-marketer`: `_component/` and `_api/` are ignored, as are files other than `page`, `route` and `__root`. Shared providers, layouts and the router live outside app/. `__root.tsx` attaches the root layout; pages own their main landmark, and the workspace uses the authenticated app shell. Use `route.tsx` for a nested TanStack layout route and `page.tsx` for its index page. EduOS retains its existing route token rather than copying the reference app's layout token. This is React/Vite with TanStack routing, with no Next.js server-component/runtime semantics. Create a new folder/page to add a route; do not maintain a manual route list. Run `pnpm --filter @eduos/admin routes:generate` before standalone checks after moving route files. Keep the generated tree in source control; it is excluded from Oxc formatting/linting.

There is no landing page. `/` redirects to `/login`, which validates a server session: signed-out users see the standalone authentication screen, and signed-in users proceed through `/app` directly to their only assigned school application. The sign-in form uses the existing Better Auth email/password flow, accessible validation and a password-visibility control. Pending submissions disable the credentials and submit button; failed attempts expose generic recoverable errors. Public registration and password-reset delivery remain deferred; the page directs users to their institution administrator. Non-401 session failures remain errors rather than creating redirect loops. `/app` verifies identity and active assigned memberships. A single school opens directly, multiple schools render a chooser, and no assigned role renders an access explanation. School entry checks current permission and module entitlement before opening Admissions. `/workspace` is a compatibility redirect with no UI. Route checks guide navigation; the API still enforces tenant authorization.

TanStack Query owns identity, membership and workspace responses. Keys include identity and institution for tenant data; logout clears the query cache. The typed client centralizes credentialed fetches, cancellation, error contracts and Zod response validation. Better Auth's typed client exclusively handles framework-managed login/session/logout calls.

React Hook Form and Zod validate login inputs. HTTP errors use generic user-safe messages. Root router loading/error states, local query feedback and a React error boundary cover failures. Zustand persists only the theme preference; it holds no identity or tenant grants. System preference is supported until explicitly changed.

`@eduos/ui` has shadcn-style Button/Input primitives, Radix Slot composition, CVA variants and Tailwind 4 semantic CSS tokens. `components.json` configures shadcn generation with real package exports. Add generated components only when needed and review their exports. No Tailwind 3 config or TS path aliases are required. Route-local helpers own API/query/form code; page components compose them. Shared code moves to components/ or lib/ when reuse is concrete. See [ADR 0007](../decisions/0007-auth-entry-and-route-colocation.md).

The auth screen uses a persistent institution-context sidebar on desktop and a single form column below the desktop breakpoint. The sign-in, session-loading and session-error states share the same shell and heading through TanStack's route components. Retrying a failed session check invalidates the route to repeat server validation. The visual system uses a premium system font stack, three sizes (12, 16 and 28px), neutral light and matte charcoal dark surfaces, restrained green actions, 6px controls, faint section dividers and 150ms ease-out interaction states. Reduced motion removes those transitions. Auth tokens are scoped to `.auth-page` to preserve the workspace palette. No emojis, illustrations, decorative gradients, signup links or inactive password-reset controls are added.

Semantic headings, a skip link, labels, descriptive errors, visible focus and light/dark modes are included. RTL tests validate the form; Playwright checks real API communication, protection and theme switching. Broader accessibility audits and device testing remain future work.

The school app has a shared institution shell and grouped navigation: Admissions contains follow-ups, willing students, admitted students and closed records; Settings contains authorized module configuration. The protected Admissions layout under `/institutions/$institutionId/admissions` owns directory, new-record and candidate-detail routes. Admission configuration lives under `/institutions/$institutionId/settings/admissions`; the former `/admissions/settings` URL redirects there. Settings uses the shared school shell and loads admission setup only for its admission configuration page. Colocated `_api/` and `_component/` files own the feature; server data stays in identity/institution-scoped Query caches. It uses real API records, shared shadcn controls and collapsible navigation groups on desktop and phones. See [the admissions guide](../development/admissions.md).

Admission settings and intake forms fill the available content width and use three field columns on desktop, two on tablets and one on phones. Save actions remain below the fields; the settings save action is last on its page. New record always renders the form, with missing configuration editable inline. Shared shadcn Input, Select, Textarea, Label, Button and Radix Switch controls preserve keyboard and focus behavior.

The `_school` pathless layout now owns 38 live school pages at the former demo URLs. Its guard resolves the authenticated identity and assigned `institutionId` selector; search middleware retains the selector across links. The shared provider reads a validated identity/institution-keyed TanStack Query snapshot and posts commands through colocated `_api` clients. The synthetic reducer/fixtures are retained only for historical unit tests and are excluded from production imports. Server success precedes navigation and success feedback. Attendance selections and an unposted payment allocation remain local form state. Unauthorized refetches hide cached protected data. See [live school workspace](../development/school-workspace.md). Institution-prefixed admission pages remain compatible; primary sign-in entry opens `/admissions`, `/attendance` for Teachers or `/fees` for Accountants.

Academic setup includes enrollment date editing and paginated history. Its history queries are keyed by identity, institution, enrollment and page; a committed update invalidates the matching history. Existing RHF/Zod forms preserve failed input and send cleared dates as null.
