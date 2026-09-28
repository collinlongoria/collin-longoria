// Prints the admin password hash for site-config.php (PBKDF2-SHA256, 600k iterations per OWASP).

import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const reader = createInterface({ input: process.stdin, output: process.stdout });
const password = await reader.question('Password (at least 10 characters): ');
reader.close();

if (password.length < 10) {
  console.error('That is too short.');
  process.exit(1);
}

const iterations = 600_000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');

console.log('\nPaste this into site-config.php:\n');
console.log(
  `'admin_password_hash' => '${['pbkdf2', iterations, salt.toString('base64'), hash.toString('base64')].join('$')}',`,
);
console.log("\nThen clear this terminal so the password isn't left on screen.");
