import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { parse } from 'yaml';
const names = [
  'frontend-feature',
  'backend-module',
  'backend-design',
  'api-contract-design',
  'data-access-design',
  'database-migration',
  'auth-security',
  'testing-quality',
  'architecture-review',
  'domain-modeling',
  'code-review',
];
for (const file of [
  'AGENTS.md',
  'CLAUDE.md',
  'apps/admin/AGENTS.md',
  'apps/api/AGENTS.md',
  'packages/database/AGENTS.md',
  'packages/ui/AGENTS.md',
])
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
function validate(base) {
  const actual = readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  if (JSON.stringify(actual) !== JSON.stringify([...names].sort()))
    throw new Error(`Unexpected skill inventory at ${base}`);
  for (const name of names) {
    const file = join(base, name, 'SKILL.md');
    const body = readFileSync(file, 'utf8');
    const frontmatter = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/.exec(body);
    if (!frontmatter) throw new Error(`Invalid frontmatter: ${file}`);
    const data = parse(frontmatter[1]);
    if (data.name !== name || typeof data.description !== 'string' || data.description.length < 30)
      throw new Error(`Invalid metadata: ${file}`);
    if (Object.keys(data).some((k) => !['name', 'description'].includes(k)))
      throw new Error(`Unverified metadata field: ${file}`);
    for (const match of body.matchAll(/\]\((references\/[^)]+)\)/g)) {
      const target = resolve(dirname(file), match[1]);
      if (!target.startsWith(resolve(dirname(file)) + '/') || !existsSync(target))
        throw new Error(`Missing or unsafe reference: ${file}`);
    }
    if (/TODO|PLACEHOLDER|TBD/.test(body)) throw new Error(`Unfinished skill: ${file}`);
  }
}
validate('agent-skills');
if (existsSync('.agents/skills')) validate('.agents/skills');
console.info(
  `Validated ${names.length} skill sources and six instruction files. Discovery installation: ${existsSync('.agents/skills') ? 'present' : 'pending (sources under agent-skills)'}.`,
);
