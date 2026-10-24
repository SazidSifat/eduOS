---
name: frontend-feature
description: Implement or refine EduOS admin features and visual design using React, TanStack Router/Query, validated forms and accessible UI. Use for browser feature work, not API or schema-only changes.
---

# Frontend Feature

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/architecture/frontend.md`.

For interface creation or visual changes, read [references/visual-design.md](references/visual-design.md) before choosing typography, layout, tokens or interaction states. Apply it to the requested scope while preserving unrelated work and existing behavior.

Use the companion [Impeccable skill](../impeccable/SKILL.md) for visual design, critique, audit and polish. Keep EduOS architecture, authorization and the user's visual rules authoritative when applying its recommendations.

## Workflow

1. Read the relevant domain context and inspect `apps/admin/src/app/login`, `apps/admin/src/app/workspace` and `apps/admin/tsr.config.json`.
2. Follow sastho-marketer's route colocation: `_component/` for presentation/hooks and `-api/` for clients/queries beside thin `page.tsx` files. Keep shared layout/providers under components/, infrastructure under lib/, the router at src/router.tsx and theme preference under stores/. Add files only as needed. Put wire schemas in contracts and use `apiGet`; Better Auth calls use its client.
3. Include user/institution in tenant query keys. Clear sensitive cached state when identity changes; never treat UI visibility as authorization.
4. Create a folder `page.tsx` under `apps/admin/src/app` with `createFileRoute`; use `pnpm --filter @eduos/admin routes:generate`. Do not add manual routes or edit routeTree.gen.ts. Handle pending, failure, empty and success states. Use UI exports and semantic labels/focus; use RHF/Zod for forms.
5. Add RTL behavior tests and a Playwright flow for important navigation or tenant transitions. Run builds before direct tests so package exports resolve.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
