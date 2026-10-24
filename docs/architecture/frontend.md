# Frontend

`apps/admin` contains the school administration app. `apps/platform` is a separate control-plane app on port 5174 with its own Better Auth sign-in, server-guarded route access and TanStack Query client. It reads access, institution metadata and operator assignments through `/api/v1/platform/*`. School creation, status changes, subscriptions and messages remain local design previews. See [platform integration](../development/platform-preview.md) and [ADR 0008](../decisions/0008-platform-design-preview.md).

React/Vite uses TanStack file-based routes rooted at `src/app`, following folder/page conventions similar to the Next.js App Router. Vite's TanStack plugin generates `src/routeTree.gen.ts` and automatically splits page components. It runs before the React plugin.

```text
src/
  app/
    __root.tsx            TanStack root adapter and skip link
    page.tsx              / redirects to /login
    login/
      page.tsx            /login, redirects signed-in users to /workspace
      _component/         Login page, form and form hook
      _api/               Better Auth client, identity query and session guards
    workspace/
      page.tsx            /workspace with session guard
      _component/         Existing institution selection and workspace UI
      _api/               Membership and workspace queries
  components/
    layout/               Shared brand, theme toggle, root layout and app shell
    providers/            Theme provider
  lib/                    Central typed API client, configuration and Query client
  stores/                 Theme preference only
  router.tsx              Router instance
```

The platform app uses the same generated route convention. `/login` is standalone; protected routes resolve `/api/v1/me` and `/api/v1/platform/access` before rendering, redirecting 401 to login and 403 to a platform-access explanation. The Vite dev server proxies `/api` to the local API so browser requests and session cookies stay on `http://localhost:5174`; the API's exact trusted-origin list includes that origin. `apps/platform/.env.example` defines the local same-origin API/auth URL; `pnpm env:setup` creates the local file without overwriting an existing one. Query data is cleared on logout. UI permission visibility is only a guide; the platform API independently resolves operator access on every request.

`tsr.config.json` sets `routesDirectory: ./src/app` and `indexToken: page`. The folder structure follows `hospital_v2/apps/sastho-marketer`: `_component/` and `_api/` are ignored, as are files other than `page`, `route` and `__root`. Shared providers, layouts and the router live outside app/. `__root.tsx` attaches the root layout; pages own their main landmark, and the workspace uses the authenticated app shell. Use `route.tsx` for a nested TanStack layout route and `page.tsx` for its index page. EduOS retains its existing route token rather than copying the reference app's layout token. This is React/Vite with TanStack routing, with no Next.js server-component/runtime semantics. Create a new folder/page to add a route; do not maintain a manual route list. Run `pnpm --filter @eduos/admin routes:generate` before standalone checks after moving route files. Keep the generated tree in source control; it is excluded from Oxc formatting/linting.

There is no landing page. `/` redirects to `/login`, which validates a server session: signed-out users see the standalone authentication screen, and signed-in users proceed to `/workspace`. The sign-in form uses the existing Better Auth email/password flow, accessible validation and a password-visibility control. Pending submissions disable the credentials and submit button; failed attempts expose generic recoverable errors. Public registration and password-reset delivery remain deferred; the page directs users to their institution administrator. Non-401 session failures remain errors rather than creating redirect loops. `/workspace` revalidates the server session before rendering, lists only active memberships and reads a selected workspace through the API. Route checks guide navigation; the API still enforces tenant authorization.

TanStack Query owns identity, membership and workspace responses. Keys include identity and institution for tenant data; logout clears the query cache. The typed client centralizes credentialed fetches, cancellation, error contracts and Zod response validation. Better Auth's typed client exclusively handles framework-managed login/session/logout calls.

React Hook Form and Zod validate login inputs. HTTP errors use generic user-safe messages. Root router loading/error states, local query feedback and a React error boundary cover failures. Zustand persists only the theme preference; it holds no identity or tenant grants. System preference is supported until explicitly changed.

`@eduos/ui` has shadcn-style Button/Input primitives, Radix Slot composition, CVA variants and Tailwind 4 semantic CSS tokens. `components.json` configures shadcn generation with real package exports. Add generated components only when needed and review their exports. No Tailwind 3 config or TS path aliases are required. Route-local helpers own API/query/form code; page components compose them. Shared code moves to components/ or lib/ when reuse is concrete. See [ADR 0007](../decisions/0007-auth-entry-and-route-colocation.md).

The auth screen uses a persistent institution-context sidebar on desktop and a single form column below the desktop breakpoint. The sign-in, session-loading and session-error states share the same shell and heading through TanStack's route components. Retrying a failed session check invalidates the route to repeat server validation. The visual system uses a premium system font stack, three sizes (12, 16 and 28px), neutral light and matte charcoal dark surfaces, restrained green actions, 6px controls, faint section dividers and 150ms ease-out interaction states. Reduced motion removes those transitions. Auth tokens are scoped to `.auth-page` to preserve the workspace palette. No emojis, illustrations, decorative gradients, signup links or inactive password-reset controls are added.

Semantic headings, a skip link, labels, descriptive errors, visible focus and light/dark modes are included. RTL tests validate the form; Playwright checks real API communication, protection and theme switching. Broader accessibility audits and device testing remain future work.
