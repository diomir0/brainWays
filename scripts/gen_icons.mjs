// Generates the BrainWays PWA icons (text-free brand mark) by rasterizing an
// inline SVG with sharp. Run with: node scripts/gen_icons.mjs
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'public', 'icons');

// A connected-node "pathway" motif in cyan on a dark rounded background.
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#131a26"/>
      <stop offset="1" stop-color="#0c1018"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8fd0ff"/>
      <stop offset="1" stop-color="#00e5ff"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bg)"/>

  <g stroke="url(#accent)" stroke-width="20" fill="none" stroke-linecap="round"
     stroke-linejoin="round" filter="url(#glow)">
    <path d="M128 322 C 176 210, 224 210, 256 256 C 288 302, 336 302, 384 190"/>
    <path d="M256 256 L 256 160"/>
  </g>

  <g fill="#8fd0ff" filter="url(#glow)">
    <circle cx="128" cy="322" r="26"/>
    <circle cx="384" cy="190" r="26"/>
    <circle cx="256" cy="256" r="30"/>
    <circle cx="256" cy="160" r="22"/>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });

for (const size of [192, 512]) {
  const buf = Buffer.from(svg(size));
  const out = resolve(outDir, `icon-${size}.png`);
  await sharp(buf, { density: 384 }).resize(size, size).png().toFile(out);
  console.log(`wrote ${out}`);
}
