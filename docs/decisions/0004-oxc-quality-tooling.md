# 0004: Oxc quality tooling

Status: accepted. Date: 2026-10-20.

## Context

The user selected Oxc for repository formatting and linting during bootstrap.

## Decision

Use Oxlint with built-in TypeScript, React and accessibility rules and Oxfmt for supported source/config/document formats. The reusable config is `@eduos/oxlint-config`; the root adds import-boundary restrictions. Hooks, CI and editors call the same tools. TypeScript remains the authoritative type checker; type-aware Oxlint is not enabled and no experimental JS plugins are used.

Configuration follows the official [Oxlint configuration](https://oxc.rs/docs/guide/usage/linter/config), [built-in plugin](https://oxc.rs/docs/guide/usage/linter/plugins), [Oxfmt configuration](https://oxc.rs/docs/guide/usage/formatter/config.html) and [editor integration](https://oxc.rs/docs/guide/usage/linter/editors.html) guidance inspected during setup.

## Consequences

No separate JS lint plugin stack is required. Oxfmt does not claim to validate SQL migrations; SQL requires explicit review and database execution. Selected versions still need a clean registry install; cached diagnostic versions are listed in verification.md. Editors can use the Oxc extension or repository CLI, including Zed.
