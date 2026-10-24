---
name: backend-module
description: Create or extend an EduOS Hono capability module with contracts, application services and tested authorization boundaries. Use for API behavior, not frontend-only changes.
---

# Backend Module

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/architecture/backend.md`.

## Workflow

1. Read the bounded context; inspect `create-app.ts`, middleware and `modules/identity/service.ts`.
2. Define Zod input/output contracts and API status semantics before adding handlers. Keep Better Auth routes outside application versioning.
3. Add a capability service accepting required dependencies; keep handlers limited to validation, session/tenant checks and delegation.
4. Scope data access by verified user/institution and ownership. Keep sensitive values out of structured logs and error envelopes.
5. Register the endpoint, update OpenAPI and add HTTP plus real database integration cases for important rules.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
