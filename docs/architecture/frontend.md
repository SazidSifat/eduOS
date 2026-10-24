# Frontend

React/Vite uses TanStack file-based routes rooted at `src/app`, following folder/page conventions similar to the Next.js App Router. Vite's TanStack plugin generates `src/routeTree.gen.ts` and automatically splits page components. It runs before the React plugin.

```text
src/app/
  __root.tsx              TanStack root adapter
  layout.tsx              Shared presentation layout
  page.tsx                /
  login/page.tsx          /login
  workspace/page.tsx      /workspace with session guard
  providers/              Excluded from route discovery
  router/index.tsx        Router instance, excluded from discovery
```

`tsr.config.json` sets `routesDirectory: ./src/app` and `indexToken: page`. Presentation `layout.tsx` files, providers and router utilities are ignored during discovery; `__root.tsx` explicitly attaches the shared root layout. Use `route.tsx` for a nested TanStack layout route and `page.tsx` for its index page. This is React/Vite with TanStack routing, with no Next.js server-component/runtime semantics. Create a new folder/page to add a route; do not maintain a manual route list. Run `pnpm --filter @eduos/admin routes:generate` before standalone checks after moving route files. Keep the generated tree in source control; it is excluded from Oxc formatting/linting.

`/` is a shell with a real health query, `/login` validates credentials, and `/workspace` validates a server session before rendering. It lists only active memberships and reads a selected workspace through the API.

TanStack Query owns identity, membership and workspace responses. Keys include identity and institution for tenant data; logout clears the query cache. The typed client centralizes credentialed fetches, cancellation, error contracts and Zod response validation. Better Auth's typed client exclusively handles framework-managed login/session/logout calls.

React Hook Form and Zod validate login inputs. HTTP errors use generic user-safe messages. Root router loading/error states, local query feedback and a React error boundary cover failures. Zustand persists only the theme preference; it holds no identity or tenant grants. System preference is supported until explicitly changed.

`@eduos/ui` has shadcn-style Button/Input primitives, Radix Slot composition, CVA variants and Tailwind 4 semantic CSS tokens. `components.json` configures shadcn generation with real package exports. Add generated components only when needed and review their exports. No Tailwind 3 config or TS path aliases are required. Features own API/query/form code; route components compose them. Future feature folders are created only with useful source files.

Semantic headings, a skip link, labels, descriptive errors, visible focus and light/dark modes are included. RTL tests validate the form; Playwright checks real API communication, protection and theme switching. Broader accessibility audits and device testing remain future work.
