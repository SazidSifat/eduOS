# Platform frontend instructions

Read root AGENTS.md, docs/architecture/frontend.md, docs/development/platform-preview.md and ADR 0009. This is the authenticated platform console, separate from the school admin app. Institution creation/settings, first Admin provisioning, subscriptions and operator assignments use live platform APIs. Never introduce sample records or client-only simulated mutations.

Use thin src/app/**/page.tsx routes with generated TanStack routing. Keep presentation in _component/ and real clients/queries in _api/. Infrastructure belongs in lib/, layout/providers in components/ and theme preference in stores/. Browser imports are limited to contracts, permissions, UI and browser-safe libraries. All platform application endpoints retain /api/v1/platform. UI permission checks guide presentation; the API remains authoritative. Respect Super Admin/Platform Manager separation and never imply school-record access.

Use the root visual rules and the frontend-feature/Impeccable guidance. Check desktop, mobile, keyboard navigation and both themes in a browser. Keep each maintained file at or below 400 lines.
