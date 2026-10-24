import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
const source = 'agent-skills';
const destination = '.agents/skills';
try {
  const names = readdirSync(source, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const name of names)
    if (existsSync(`${destination}/${name}`))
      throw new Error(`Refusing to overwrite existing ${destination}/${name}`);
  mkdirSync(destination, { recursive: true });
  for (const name of names)
    cpSync(`${source}/${name}`, `${destination}/${name}`, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  console.info(
    `Installed ${names.length} repository skills into ${destination}; no global configuration changed.`,
  );
} catch (error) {
  console.error(
    `Skill installation failed: ${error.message}. Sources remain in agent-skills/. A writable .agents directory is required.`,
  );
  process.exitCode = 1;
}
