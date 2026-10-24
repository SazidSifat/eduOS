# 0003: Multi tenancy strategy

Status: accepted. Date: 2026-10-20.

## Context

The initial product serves multiple schools with a small engineering team and must preserve historical records and isolation. This bootstrap establishes boundaries without implementing business domains.

## Decision

Use a shared PostgreSQL database, explicit institution ownership, membership-checked application access and relational ownership constraints. Do not enable RLS during bootstrap.

## Consequences

Every future tenant operation must scope queries and references. Integration tests cover denials and revocation. RLS requires a later ADR and tested runtime-role/pool isolation.
