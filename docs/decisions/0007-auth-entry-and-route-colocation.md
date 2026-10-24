# 0007: Authentication entry and route colocation

Status: accepted. Date: 2026-10-24. Updates the organization described in ADR 0005.

## Context

The user requires an authentication entry without a landing page and asks EduOS to follow the folder structure in `hospital_v2/apps/sastho-marketer`. That application uses thin file routes with route-local `_component/` and `-api/` folders, a source-root router and shared layout, library and store directories.

## Decision

Keep React/Vite, generated TanStack routing and EduOS's existing page/route tokens. Colocate route presentation, hooks and tests under `_component/`, and typed client/query helpers under `_api/` (the user-requested adaptation of the reference app’s `-api/`). Exclude helper directories and non-route files from route discovery. Move shared layout/providers to components/, Query infrastructure to lib/, the router to src/router.tsx and the existing theme preference to stores/. Do not copy the reference application's authentication store, hospital APIs, mobile features or branding.

The root route redirects to /login. The login guard checks the server identity and redirects an authenticated user to /workspace. A 401 allows sign-in; other errors stay visible and recoverable. The workspace independently validates identity and continues using institution-scoped API checks. Keep Better Auth identity, Zod contracts, React Hook Form validation, Query-owned server state, cache cancellation/clearing on identity transitions and the existing HttpOnly cookie flow.

## Consequences

Routes remain thin and generated; moving a helper cannot accidentally add a URL. Authentication gets its own full-height screen without the landing navigation/footer. There is no public signup, password-reset delivery, new institution provisioning or platform UI. Authentication UI and folder organization change; API authorization, schema and migrations do not.

Tests cover invalid input, password visibility, pending and failed submissions, cache clearing, signed-in redirects, revoked sessions and non-session failures. Browser checks cover entry navigation, direct workspace protection, themes, keyboard focus and narrow-screen layout. Test execution and environmental limits are reported separately from this decision.
