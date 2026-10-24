# Workspace instructions

Read the root instructions and `docs/architecture/frontend.md`. Use capability features, central typed API calls and Query keys scoped to identity/institution. Clear cached server state after logout. Use file-based routes rooted at src/app: page.tsx, login/page.tsx and workspace/page.tsx. \_\_root.tsx connects the shared layout.tsx. Keep routeTree.gen.ts generated; tsr.config.json excludes providers/router and presentation layouts from route discovery. Use route.tsx for nested TanStack route layouts. The Vite plugin handles code splitting; keep accessible loading/error/empty states. UI-only checks never authorize access. Test validation and affected browser flows.

Route files should export Route; keep their page component functions local so the Vite plugin can split each page into its own chunk.
