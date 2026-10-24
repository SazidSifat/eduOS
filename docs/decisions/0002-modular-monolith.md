# 0002: Modular monolith

Status: accepted. Date: 2026-10-20.

## Context

The initial product serves multiple schools with a small engineering team and must preserve historical records and isolation. This bootstrap establishes boundaries without implementing business domains.

## Decision

Use one Hono process with capability modules and application services; separate the React client. Do not create microservices or a worker without actual workload.

## Consequences

Transactions and deployment stay simple. Future extraction requires measured boundaries. Contexts cannot directly mutate each other's data.
