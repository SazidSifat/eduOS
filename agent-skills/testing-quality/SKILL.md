---
name: testing-quality
description: Add or diagnose EduOS Vitest, PostgreSQL integration and Playwright regression coverage with isolated synthetic fixtures. Use for test strategy, failures and quality verification.
---

# Testing Quality

Use when the task matches the description. Read repository `AGENTS.md` and the nearest scoped instructions first; they own shared policy. Project reference: `docs/development/testing.md`.

## Workflow

1. Identify the invariant and the layer that can demonstrate it. Prefer policy units, HTTP contracts, real SQL transactions or real browser behavior accordingly.
2. Inspect existing fixtures before adding helpers. Use unique synthetic IDs; introduce a shared factory only when several tests reuse meaningful setup.
3. Require TEST_DATABASE_URL with an eduos_test database name for SQL tests. Never truncate shared data; clean up only owned fixtures.
4. Build dependencies, run the focused test, then applicable root checks. Browser smoke starts actual applications and must observe real API responses.
5. Separate missing infrastructure, dependency/setup failures and assertions. Report commands and output summaries without secrets.

## Completion checks

Read [references/checks.md](references/checks.md) for task-specific acceptance checks. Report implementation/review evidence and unresolved prerequisites under the root definition of done.
