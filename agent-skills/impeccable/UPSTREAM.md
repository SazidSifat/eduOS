# Impeccable integration

- Repository: https://github.com/pbakaus/impeccable
- Revision: `936867543ac2576920d663cc9803597f6044f3ac`
- Source directory: `.agents/skills/impeccable`
- Skill version: `4.7.1`; launcher engine version: `0.1.17`.
- License: Apache-2.0; see LICENSE and NOTICE.md. Provider metadata, agent definitions, command references, browser helpers and launcher files are preserved from upstream.
- `upstream.json` records provenance and the SHA-256 of the original upstream SKILL.md before adaptation.

Local adaptation: SKILL.md adds an EduOS integration section before the original skill body. It makes the user's visual constraints and repository boundaries authoritative, connects frontend-feature and documents the canonical source location. Other upstream files are vendored without local formatting or lint rewrites. These imported files are not manually maintained EduOS source.

The skill sources are available for explicit reading at `agent-skills/impeccable/SKILL.md`. Automatic discovery remains pending while this checkout's `.agents` mount is read-only. Run `pnpm agents:install` in a writable checkout to copy the repository skills without overwriting existing skills; then select `$impeccable` in a supporting harness.

Adding these sources does not install the engine, hooks or global configuration. The included launcher looks for an installed engine and otherwise downloads its pinned engine into a user cache on first use. Runtime setup needs network and cache write permission. Do not bypass sandbox or read-only mount restrictions. Runtime commands have not been verified by source installation; use the upstream launcher-unavailable fallback when setup cannot run.

To update, review a new pinned revision, preserve its license/notices and bundled resources, reapply the clearly marked EduOS integration section, update upstream.json and the expected metadata version in scripts/validate-agents.mjs, then run skill validation, lint, formatting and diff checks. Review changes to executable helpers before running them.
