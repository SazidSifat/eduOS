# ADR 0014: MVC API file layout

Status: Accepted

## Context

The API previously grouped services under capability modules and later separated HTTP routers to follow the hospital mobile API layout. The requested convention is now MVC with an explicit service layer.

## Decision

Use `src/route/<capability>/<capability>.routes.ts` for HTTP method and URL registration, `src/controllers/<capability>.controller.ts` for typed validation/authorization handler chains and response mapping, and `src/services/<capability>/` for business rules and transactions. Keep focused persistence helpers in `src/models` and canonical Drizzle schema models in `packages/database`. React browser applications provide the views; the API renders JSON rather than server templates.

Controllers use Hono's typed handler factory so Zod validator outputs reach handlers without unchecked casts. Existing session, membership, permission and ownership checks retain their order and service-boundary revalidation. Capability services continue to coordinate cross-capability writes explicitly in the existing transactions. Integration tests reside under `apps/api/test/<capability>`.

## Consequences

Each transport concern has an explicit layer while business services remain grouped by capability. The old `src/modules` directory is removed. No endpoints, wire contracts, schema definitions, migrations or authorization policies change. Models do not duplicate the shared database schema or introduce speculative repository abstractions.
