# Conventions

Packages use `@eduos/*`, explicit public exports, compiled ESM and strict TypeScript. Node relative imports end in `.js`; Vite uses extensionless local imports. Shared contracts use Zod, not database row types as API DTOs. Keep imports flowing apps → packages, auth → database, and contracts/permissions → no persistence.

Frontend routes start in `apps/admin/src/app` as directory `page.tsx` files; add them through file discovery, not manual registration. Nested TanStack route layouts use `route.tsx`; root presentation uses `layout.tsx`. Features and modules follow business capabilities; create API/query/component folders only when they hold real code. Prefer a small application service to layers of empty repositories/controllers. All server state uses Query; client preference uses Zustand only where shared use is demonstrated. UI primitives have no business behavior.

Use UUIDs and UTC instants. Monetary/timezone/business state conventions require domain decisions when those modules are implemented. Human names and student data never belong in operational logs. Review dependencies for stable version compatibility and provenance. Oxfmt and Oxlint are the editor-independent source of formatting/lint policy; VS Code settings are conveniences and Zed can use the same commands.

Schema changes carry migrations. Architecture changes carry docs/ADRs. Every PR describes resulting behavior, tests actually run, and limitations. Avoid unfinished routes, dummy analytics and speculative dependencies.
