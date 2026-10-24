import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
if (existsSync('.git/HEAD') && !process.env.CI && process.env.HUSKY !== '0') {
  const result = spawnSync('husky', [], { stdio: 'inherit', shell: process.platform === 'win32' });
  process.exit(result.status ?? 1);
} else {
  console.info(
    'Git hooks require a writable Git checkout; CI and source archives skip hook installation.',
  );
}
