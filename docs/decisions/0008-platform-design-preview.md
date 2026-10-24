# 0008: Separate platform design preview

Status: accepted. Date: 2026-10-24. Extends ADRs 0006 and 0007.

## Context

The user prioritizes the super-admin/platform interface and explicitly chooses a clickable design preview before API integration. EduOS already separates Platform Owner/Manager operators from institution memberships; no school role grants platform access.

## Decision

Create `apps/platform`, a separate React/Vite frontend on port 5174, following generated TanStack page routes and route-local `_component/` and `_api/` structure. Use `@eduos/ui`, contracts and permission definitions. The first design phase used synthetic data; the connected phase adds Better Auth sign-in, a session/access route guard, and live read-only institution/operator directories using existing platform contracts.

The sign-in screen has no public registration. Owner/Manager presentation derives from the server access response, never browser selection. The platform API enforces permissions on every call. Do not present sample billing, school status, messages or operational analytics as live data. Configure the exact trusted origin for local platform development.

The requested school-management design includes creation, freeze/deactivate/reactivate with reasons, notice/warning composition and subscription settings. Implement these as validated in-memory Owner preview actions, with school state independent of subscription state, a preview activity history and explicit non-delivery messaging. Refresh resets changes. Sample plan names and prices are illustrative, and school-access/billing/notification policies require discovery before backend implementation. These proposed controls do not extend existing platform grants or create communication/payment infrastructure.

## Consequences

The platform control plane has live read-only access, while the proposed school-management workflows remain non-persistent previews. Existing backend authorization and tenant boundaries remain authoritative. Shared primitives and permissions keep the two frontends separate while sharing contracts. Operator responses expose IDs and grants only, without personal names/emails.

The earlier preview browser checks do not verify authenticated platform API behavior. A frontend build does not prove live credentials, origin configuration, revocation behavior or production readiness.
