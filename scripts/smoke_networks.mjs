// Visual smoke test for the large-scale brain networks feature.
// Boots the Vite dev server, drives Explore -> Networks mode, isolates the
// default-mode network, and toggles the full-brain map, capturing screenshots
// and any console errors. Run from the project root with `node scripts/smoke_networks.mjs`.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, 'scripts', '_smoke');

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('dev server did not come up');
}

const errors = [];

try {
  await waitForServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Wait for the WebGL canvas, then give the GLB (Draco) time to load.
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(8000);

  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c ? { w: c.width, h: c.height } : null;
  });
  console.log('canvas:', JSON.stringify(canvasInfo));

  // Switch to Networks mode.
  await page.getByRole('button', { name: 'networks', exact: true }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '1_networks_list.png') });

  // Isolate the default-mode network.
  await page.getByRole('button', { name: 'Default mode network' }).click();
  await page.waitForTimeout(2000);
  // Assert the network info box rendered with its rich sections.
  for (const label of ['Key structures', 'Supporting tracts', 'Function', 'Associated states', 'Experimental paradigms', 'Clinical alterations', 'References']) {
    const count = await page.getByText(label, { exact: true }).count();
    console.log(`info-box section "${label}": ${count > 0 ? 'present' : 'MISSING'}`);
    if (count === 0) errors.push(`missing info-box section: ${label}`);
  }
  await page.screenshot({ path: path.join(OUT, '2_dmn_isolate.png') });

  // Full-brain network map.
  await page.getByRole('button', { name: 'Full-brain network map' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, '3_network_map.png') });

  // Cognitive systems mode.
  await page.getByRole('button', { name: 'cognition', exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Working memory' }).click();
  await page.waitForTimeout(1500);
  for (const label of ['Recruited networks', 'Key structures', 'Function', 'Experimental paradigms', 'Clinical alterations', 'References']) {
    const count = await page.getByText(label, { exact: true }).count();
    console.log(`cognitive info-box section "${label}": ${count > 0 ? 'present' : 'MISSING'}`);
    if (count === 0) errors.push(`missing cognitive info-box section: ${label}`);
  }
  await page.screenshot({ path: path.join(OUT, '4_working_memory.png') });

  await browser.close();
  console.log('screenshots written to', OUT);
  if (errors.length) {
    console.log('CONSOLE/PAGE ERRORS:');
    for (const e of errors) console.log('  ' + e);
  } else {
    console.log('no console/page errors');
  }
} catch (e) {
  console.error('SMOKE TEST FAILED:', e.message);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
