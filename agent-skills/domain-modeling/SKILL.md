---
name: domain-modeling
description: Model an EduOS school capability, invariants and historical workflows from the product specification and school discovery. Use before introducing academic business concepts.
---

# Domain Modeling

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/domain/overview.md`.

## Workflow

1. Read glossary.md, bounded-contexts.md and the linked product specification; identify confirmed facts versus proposed school policy.
2. Map actors, trigger, inputs, state transitions, outcomes and exceptions for one requested workflow. Ask only material unresolved policy questions.
3. Choose ownership/aggregate boundaries around invariants and transactions. Separate durable person identity from yearly enrollment and teaching assignments.
4. Preserve academic-year history, effective transfer dates, original attendance submissions, versioned grading rules and financial reversals as relevant.
5. Update the domain docs with decisions and open questions; derive acceptance examples including duplicate requests, corrections and cross-tenant references.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
