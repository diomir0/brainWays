// Copies the Draco WASM decoder into `public/draco/` so the GLB can be
// decompressed offline (no CDN dependency).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco');
const dst = path.join(root, 'public', 'draco');

if (!fs.existsSync(src)) {
  console.warn('[copy_draco] three draco source not found — run `npm install` first.');
  process.exit(0);
}

fs.mkdirSync(dst, { recursive: true });
for (const f of fs.readdirSync(src)) {
  if (f.endsWith('.js') || f.endsWith('.wasm')) {
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
    console.log('[copy_draco] copied', f);
  }
}
