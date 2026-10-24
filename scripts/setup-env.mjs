import {
  chmodSync,
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
  constants,
} from 'node:fs';
import { randomBytes } from 'node:crypto';
const secret = randomBytes(48).toString('base64url');
const databasePassword = randomBytes(24).toString('hex');
for (const file of ['.env', 'apps/api/.env', 'apps/admin/.env']) {
  if (existsSync(file)) {
    console.info(`Kept existing ${file}`);
    continue;
  }
  copyFileSync(`${file}.example`, file, constants.COPYFILE_EXCL);
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replaceAll('REPLACE_WITH_GENERATED_SECRET', secret)
      .replaceAll('REPLACE_WITH_DATABASE_PASSWORD', databasePassword),
    { mode: 0o600 },
  );
  chmodSync(file, 0o600);
  console.info(`Created ${file}`);
}
