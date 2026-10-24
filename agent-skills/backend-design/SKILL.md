---
name: backend-design
description: Design an EduOS backend capability before implementation, choosing service boundaries, invariants, transaction ownership and failure behavior. Use for new workflows or substantial backend redesigns; use backend-module for routine endpoint implementation.
---

# Backend Design

Read root and scoped `AGENTS.md` instructions. Read `docs/domain/overview.md`, the relevant context in `docs/domain/bounded-contexts.md`, and `docs/architecture/backend.md`, `database.md` and `multi-tenancy.md`. Repository paths below are relative to the repository root.

## Establish the workflow

Trace the closest existing capability from HTTP entry to SQL. Start with `apps/api/src/app/create-app.ts`, `apps/api/src/modules/identity/service.ts` and the public exports of affected packages. Distinguish implemented behavior, confirmed requirements and proposed school policy. Use the domain-modeling skill when introducing academic concepts or resolving business invariants.

Describe the requested actor, trigger, current state, permitted transition, outcome and important failure cases. Identify which institution owns each resource and which permission and resource relationship authorize the action. Do not infer future grants from the foundation's `workspace.read` permission.

## Choose the smallest useful boundary

- Put the use case in its owning capability under `apps/api/src/modules/<capability>`. Keep HTTP parsing and response mapping at the edge and business decisions in the service.
- Prefer an explicit service function and existing database utilities. Introduce repository interfaces, domain objects or additional layers only when a concrete invariant or dependency boundary needs them. Dependency injection through `createApp` already supports HTTP testing.
- Name the owner of every write and the transaction that makes related writes atomic. Cross-context changes must use the owning service; decide transaction coordination explicitly rather than hiding separate commits behind service calls.
- For concurrent actions, identify the database constraint, conditional update, lock or isolation choice that enforces the invariant. A read followed by an unconditional write is insufficient for contested state.
- Decide what a duplicate request means. Add persisted idempotency only when the operation requires it, scoped by institution, operation and request identity, with payload mismatch and replay behavior defined.
- Keep external network effects outside retryable database transactions. If durable delivery is required, design commit/delivery recovery before introducing an outbox or worker. Redis and event infrastructure remain deferred until a real workload requires them.

## Make the design reviewable

Scale the design note to the task. For a substantial workflow, include the service signature and dependencies, authorization path, owned data and constraints, transaction boundary, concurrency/retry behavior, API outcomes and test examples. Describe deployment/backfill compatibility only when persistence or a public interface changes. Record durable boundary decisions in architecture docs and an ADR when needed; do not create documents for routine implementation choices.

Use api-contract-design for wire semantics, data-access-design for SQL/concurrency decisions, and backend-module when implementing the accepted design. These skills supplement the design only where their scope applies.

## Completion

Check [references/checks.md](references/checks.md) against the proposed workflow. A design-only task ends with a concrete proposal and material unresolved policy questions; implementation requires the applicable checks in `docs/development/testing.md`. Report evidence and limitations without claiming a proposal is implemented.
