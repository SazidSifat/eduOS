---
name: frontend-feature
description: Implement or change an EduOS admin feature using React, TanStack Router/Query, validated forms and accessible UI. Use for browser feature work, not API or schema-only changes.
---

# Frontend Feature

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/architecture/frontend.md`.

## Workflow

1. Read the relevant domain context and inspect `apps/admin/src/features/authentication` and `apps/admin/tsr.config.json`.
2. Add capability-local API/query/form/component files only as needed. Put wire schemas in contracts and use `apiGet`; Better Auth calls use its client.
3. Include user/institution in tenant query keys. Clear sensitive cached state when identity changes; never treat UI visibility as authorization.
4. Create a folder `page.tsx` under `apps/admin/src/app` with `createFileRoute`; use `pnpm --filter @eduos/admin routes:generate`. Do not add manual routes or edit routeTree.gen.ts. Handle pending, failure, empty and success states. Use UI exports and semantic labels/focus; use RHF/Zod for forms.
5. Add RTL behavior tests and a Playwright flow for important navigation or tenant transitions. Run builds before direct tests so package exports resolve.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
