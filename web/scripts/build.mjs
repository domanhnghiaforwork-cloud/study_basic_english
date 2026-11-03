import { mkdir, copyFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'app.js', 'account.js', 'state.js', 'styles.css', 'tokens.css', 'icon.svg']) {
  await copyFile(path.join(root, name), path.join(dist, name));
}
await cp(path.join(root, 'data'), path.join(dist, 'data'), { recursive: true });
console.log('Static website built in dist/');
