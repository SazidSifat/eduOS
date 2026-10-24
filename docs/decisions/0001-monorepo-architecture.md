# 0001: Monorepo architecture

Status: accepted. Date: 2026-10-20.

## Context

The initial product serves multiple schools with a small engineering team and must preserve historical records and isolation. This bootstrap establishes boundaries without implementing business domains.

## Decision

Use pnpm workspaces and Turborepo, two apps and purpose-specific @eduos packages with compiled ESM exports.

## Consequences

One lockfile is required for reproducible CI. Builds run in dependency order. Shared package changes currently require a rebuild during development. Browser/server boundaries remain explicit.
