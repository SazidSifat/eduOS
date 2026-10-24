---
name: api-contract-design
description: Design or evolve EduOS HTTP contracts, including Zod schemas, error semantics, pagination, mutation retries and OpenAPI compatibility. Use when an endpoint's public behavior changes; use backend-module for service implementation.
---

# API Contract Design

Read root and API `AGENTS.md` instructions and `docs/architecture/backend.md`. Inspect `packages/contracts/src/index.ts`, `apps/api/src/app/openapi.ts`, `apps/api/src/app/create-app.ts`, `apps/api/src/lib/errors.ts` and the affected frontend API client before choosing a new convention. Paths are relative to the repository root.

## Define observable behavior

Write a compact endpoint table covering method/path, actor, institution selector, required permission/resource relationship, inputs, success response and expected failures. Keep application endpoints under the existing versioned API; Better Auth owns `/api/auth/*` and its framework response format.

Define Zod request and response schemas in `@eduos/contracts`, independent of Drizzle rows. Specify missing versus null fields, update semantics, accepted enum values, identifier types, timestamp formats and size/range limits where relevant. Validate path, query and body values; parse query booleans/numbers deliberately. Treat malformed JSON as invalid input and distinguish invalid client data from a server response that violates its own contract. Select writable fields explicitly so clients cannot assign ownership or privileged state through extra properties.

Return only fields needed by the consumer. Match successful runtime responses and OpenAPI to the same shared schemas. Preserve the existing application error envelope and server-generated request ID. Map expected domain failures deliberately; adding a status such as conflict also requires an accurate error mapping in the central handler, which currently maps only a limited set. Do not include database errors, private records or raw Zod inputs in responses.

## Resolve conditional semantics

- For tenant resources, preserve the documented 403 behavior for foreign institutions without revealing existence. Decide missing-resource behavior only after access is established and keep it consistent across related endpoints.
- For lists, bound page size and allowlist filters/sort fields. Choose offset or cursor pagination for the actual workload. Use a stable sort with a unique tie-breaker; scope and validate cursors with the same tenant, authorization and filters. Define behavior when records change between pages rather than promising an unimplemented snapshot.
- For mutations, define create/update/delete outcomes, duplicate submission behavior and stale-write conflicts. Do not assume HTTP method semantics alone provide persisted idempotency. If using an idempotency or version header, update CORS allow/expose headers and test the browser request path.
- Preserve trusted-origin enforcement, body limits and protected `no-store` responses. Revisit limits only for a concrete endpoint requirement.
- For compatible evolution, inspect current consumers before changing required fields, enum values, nullability, status codes or ordering. Plan coordinated changes when existing consumers would break; do not version the API for every additive field.

## Implementation and verification

Keep route handling focused on validated inputs and service delegation. Update `apps/api/src/app/openapi.ts` for parameters, bodies, security and all implemented responses. Follow backend-module for implementation and auth-security when access rules change.

Use [references/checks.md](references/checks.md) to choose contract tests. Report actual commands and outcomes under the root definition of done; a schema or OpenAPI document alone does not verify HTTP behavior.
