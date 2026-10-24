---
name: architecture-review
description: Review EduOS module dependencies, coupling, security/performance tradeoffs and architecture decisions. Use for boundary changes or an explicit architectural review.
---

# Architecture Review

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/architecture/overview.md`.

## Workflow

1. Map changed apps/packages and import direction from manifests and public exports; inspect actual call paths before proposing abstractions.
2. Check that contracts/permissions remain persistence-free, UI remains presentation-only and browser imports cannot reach auth/server or database.
3. Trace cross-context writes, transaction ownership and tenant identity. Identify concrete coupling or isolation defects with file evidence.
4. Examine query cardinality, tenant indexes, connection budgets, caching invalidation and process failure behavior for the changed workflow.
5. Record changed decisions in a numbered ADR with context, alternatives, consequences and migration path; update architecture docs to match implemented state.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
