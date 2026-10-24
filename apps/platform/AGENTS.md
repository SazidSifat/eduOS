# Platform frontend instructions

Read root AGENTS.md and docs/architecture/frontend.md. This app is currently a design preview using explicitly labeled synthetic institutions and people. Keep it separate from the school admin app. Do not connect APIs, alter authentication, bootstrap operators or write to a database as part of preview interactions.

Use thin src/app/**/page.tsx routes with generated TanStack routing. Keep route presentation in _component/ and add _api/ only when real clients exist. Shared preview data and utilities belong in lib/, layout/providers in components/ and theme preference in stores/. Browser imports are limited to contracts, permissions, UI and browser-safe libraries. Preview role controls simulate presentation; server authorization remains a separate future integration. Respect the existing Platform Owner/Manager permissions and never imply school-record access.

Use the root visual rules and the frontend-feature/Impeccable guidance. Check desktop, mobile, keyboard navigation and both themes in a browser. Keep each maintained file at or below 400 lines.
