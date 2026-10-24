---
name: auth-security
description: Implement or audit EduOS sessions, permissions, tenant selection and cross-tenant security tests. Use when identity or application access changes.
---

# Auth Security

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/architecture/authentication.md`.

## Workflow

1. Trace the trust boundary from browser input through Better Auth, API membership checks and SQL ownership filters; read multi-tenancy.md.
2. Keep identity in auth and role/resource policy in the application. Add explicit default-deny grants rather than plugin business roles.
3. Revalidate active membership for every selected institution and owned resource. Consider revocation, multi-membership and role changes between requests.
4. Review cookie attributes, exact origins, CSRF, rate-limit storage and trusted proxy IP behavior. Never log raw credentials or auth errors.
5. Extend real integration tests for login/session/logout and affected denial paths; use synthetic accounts in a dedicated database.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
