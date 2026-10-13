// Smoke test: Study mode now lists + teaches cognitive systems (static highlight).
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5198;
const BASE = `http://localhost:${PORT}`;

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not come up');
}

const errors = [];
try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(6000);

  await page.getByRole('button', { name: 'Study', exact: true }).click();
  await page.waitForTimeout(1000);

  const hasCognitiveHeading = await page.getByText('Cognitive systems', { exact: true }).count();
  console.log('"Cognitive systems" heading:', hasCognitiveHeading > 0 ? 'present' : 'MISSING');
  if (hasCognitiveHeading === 0) errors.push('missing Cognitive systems heading');

  await page.getByRole('button', { name: 'Working memory' }).click();
  await page.waitForTimeout(1500);

  const stageLabel = await page.getByText('Stage 1 of 4', { exact: true }).count();
  console.log('lesson "Stage 1 of 4":', stageLabel > 0 ? 'present' : 'MISSING');
  if (stageLabel === 0) errors.push('missing stage counter');

  const title = await page.getByText('The workspace of the mind', { exact: true }).count();
  console.log('stage title "The workspace of the mind":', title > 0 ? 'present' : 'MISSING');
  if (title === 0) errors.push('missing stage title');

  // Advance to the final stage and expect "Test understanding" (cognitive systems now have quizzes).
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(800);

  const quizBtn = await page.getByRole('button', { name: 'Test understanding' }).count();
  console.log('"Test understanding" (should be PRESENT for cognitive):', quizBtn > 0 ? 'present (correct)' : 'MISSING');
  if (quizBtn === 0) errors.push('cognitive lesson missing Test understanding button');

  await browser.close();
  if (errors.length) { console.log('ERRORS:'); for (const e of errors) console.log('  ' + e); }
  else console.log('no console/page errors');
} catch (e) {
  console.error('SMOKE FAILED:', e.message);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
