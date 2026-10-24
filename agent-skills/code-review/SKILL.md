---
name: code-review
description: Review an EduOS change for correctness, security, type safety, tests, performance and compatibility. Use for a requested PR/diff review rather than implementation.
---

# Code Review

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/development/conventions.md`.

## Workflow

1. Read relevant instructions/domain docs and inspect the diff plus surrounding call sites. Respect unrelated work and avoid unsolicited edits.
2. Trace changed inputs, state, errors and outputs. Check auth, permissions, tenant ownership, sensitive logging and transaction boundaries first.
3. Check strict types, runtime validation, package exports, query keys, dependency direction and deployment/migration compatibility.
4. Evaluate regression tests against the actual changed behavior. Check query shape/indexes and avoid speculative performance claims.
5. Report actionable findings ordered by severity with file/line, trigger, impact and suggested correction; separate verified findings from open questions.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
