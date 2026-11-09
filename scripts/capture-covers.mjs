#!/usr/bin/env node
// Takes screenshots of live demos that have no screenshots in their README.
// Run by hand when a demo changes:  node scripts/capture-covers.mjs
// Output goes to public/covers/<slug>.jpg and is committed.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'covers');

const SHOTS = [
  { slug: 'become-millionaire', url: 'https://patyat-kam-miliona.web.app/' },
  { slug: 'terminal-game', url: 'https://krumqnkata.github.io/terminal-game/' },
  { slug: 'daniela-krumova-website', url: 'https://logopedkrumova.com/' },
  { slug: 'daniela-krumova-website-mobile', url: 'https://logopedkrumova.com/', mobile: true },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const shot of SHOTS) {
  const context = await browser.newContext(
    shot.mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 },
  );
  const page = await context.newPage();
  try {
    await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500);
    const file = join(OUT, `${shot.slug}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
    console.log(`✓ ${shot.slug}`);
  } catch (error) {
    console.warn(`✗ ${shot.slug}: ${error.message}`);
  }
  await context.close();
}
await browser.close();
