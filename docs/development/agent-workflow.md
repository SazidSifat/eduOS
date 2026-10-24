# Agent workflow

Read root `AGENTS.md`, scoped instructions, domain documentation and the relevant architecture page. Inspect current files/status before editing. Select a narrow local skill for a concrete task; skill names are portable YAML-frontmatter names, not unverified tool-specific metadata.

Eleven skills are maintained under `agent-skills/` while `.agents` is read-only here. Run `pnpm agents:install` from a writable checkout to copy them to `.agents/skills/` without overwriting existing skills. The script stops on a conflicting skill and reports the path. No personal/global configuration is touched. `pnpm agents:validate` validates the source inventory and references; automatic discovery depends on the agent's support for repository-local skills.

Skills: frontend-feature, backend-module, backend-design, api-contract-design, data-access-design, database-migration, auth-security, testing-quality, architecture-review, domain-modeling and code-review. Explicitly reference the source SKILL.md until installation is possible. Shared policy lives only in AGENTS.md; skills add task-specific steps and reference checklists. No agent-specific UI metadata or delegation requirement is invented.

For backend work, select by the decision being made:

| Skill                                                                  | Use                                                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [backend-design](../../agent-skills/backend-design/SKILL.md)           | Design a workflow's service boundary, invariants, transaction owner and failure behavior. |
| [api-contract-design](../../agent-skills/api-contract-design/SKILL.md) | Define HTTP inputs, responses, errors, pagination and compatibility with consumers.       |
| [data-access-design](../../agent-skills/data-access-design/SKILL.md)   | Design tenant-scoped queries, concurrency controls and measured query improvements.       |
| [backend-module](../../agent-skills/backend-module/SKILL.md)           | Implement a capability using the existing Hono app and service conventions.               |

Use domain-modeling for unresolved school rules, database-migration for schema changes, auth-security for access-policy changes and architecture-review for reviewing system boundaries. Load only the skills needed for the current task. For example, a new attendance submission workflow may need domain discovery and backend design before endpoint implementation; an existing slow list query can start with data-access-design.

Implement within scope, verify the changed behavior, update docs for changed boundaries and report commands/results/blockers. User authorization and existing work take priority over workflow convenience. Never force writes into read-only mount points.
