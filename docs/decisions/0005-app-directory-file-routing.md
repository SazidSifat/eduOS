# 0005: App directory file-based routing

Status: accepted. Date: 2026-10-20.

## Context

The user requires frontend routes to start from the app folder with a Next.js-like file-based structure.

## Decision

Keep React/Vite and TanStack Router. Discover routes in src/app with page.tsx as the index token; folders define URL segments. \_\_root.tsx attaches the shared layout.tsx presentation component. Non-route providers/router/layout components are excluded. Nested route configuration/layouts use TanStack's route.tsx convention. The generated route tree is committed and managed by the CLI/Vite plugin; automatic code splitting is enabled.

Configuration follows [TanStack file routing](https://tanstack.com/router/latest/docs/api/file-based-routing) and the [Vite plugin installation](https://tanstack.com/router/latest/docs/installation/with-vite). This choice provides app-directory navigation conventions without adding Next.js runtime behavior.

## Consequences

Adding a page does not require editing a manual route registry. Typechecking generates the route tree first. Future route guards belong in file route hooks; feature logic stays in features/services. Exclude generated output from lint/format and review it with page changes.
