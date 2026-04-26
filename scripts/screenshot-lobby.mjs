/**
 * Screenshot the live Cipher Heist lobby for visual validation.
 *
 * Reuses n-learn's playwright install + bundled Chromium so we don't
 * have to add 400MB of deps to n-games.
 *
 * Usage:
 *   node scripts/screenshot-lobby.mjs                 # default: live URL @ desktop
 *   node scripts/screenshot-lobby.mjs --out path.png  # custom output
 *   node scripts/screenshot-lobby.mjs --url ...       # custom URL
 *   node scripts/screenshot-lobby.mjs --width 1280 --height 900
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repo = resolve(__dirname, '..');

// Reuse n-learn's playwright (avoids reinstalling Chromium for each project)
const nLearnRequire = createRequire(resolve(repo, '..', 'n-learn', 'package.json'));
const { chromium } = nLearnRequire('playwright');

function parseArgs(argv) {
  const out = {
    url: 'https://kid-games-one.vercel.app/cipher-heist/',
    width: 1280,
    height: 900,
    output: null,
    fullPage: false,
    waitMs: 2000,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--url') { out.url = next; i++; }
    else if (a === '--out' || a === '--output') { out.output = next; i++; }
    else if (a === '--width') { out.width = Number(next); i++; }
    else if (a === '--height') { out.height = Number(next); i++; }
    else if (a === '--full-page') { out.fullPage = true; }
    else if (a === '--wait') { out.waitMs = Number(next); i++; }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.output) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    args.output = resolve(repo, 'assets', 'screenshots', 'cipher-heist', `lobby-live-${stamp}.png`);
  }

  mkdirSync(dirname(args.output), { recursive: true });

  console.log(`[*] Launching Chromium`);
  console.log(`    url   = ${args.url}`);
  console.log(`    size  = ${args.width}x${args.height}`);
  console.log(`    out   = ${args.output}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: args.width, height: args.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Pre-seed a Lumina profile in localStorage so the "Logged in as ..."
  // line renders (otherwise headless visits start with no profile).
  await context.addInitScript(() => {
    const STORAGE_KEY = 'lumina_game_data';
    const profile = {
      id: 'mario',
      name: 'Mario',
      level: 3,
      xp: 240,
      currency: 50,
      avatar: '/assets/avatars/mario_step_profile.png',
      createdAt: Date.now(),
    };
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentPlayer: 'mario', profiles: { mario: profile } })
      );
    } catch (_) { /* ignore */ }
  });

  page.on('pageerror', (err) => console.warn(`[browser pageerror] ${err.message}`));
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.warn(`[browser ${type}] ${msg.text()}`);
    }
  });

  console.log(`[*] Navigating...`);
  const resp = await page.goto(args.url, { waitUntil: 'networkidle', timeout: 30000 });
  if (!resp || !resp.ok()) {
    console.error(`[ERROR] Navigation failed: ${resp ? resp.status() : 'no response'}`);
    await browser.close();
    process.exit(1);
  }

  // Wait for React/Babel to render the lobby title (proves the screen is up)
  try {
    await page.waitForSelector('.lobby-title', { timeout: 15000 });
  } catch (e) {
    console.warn(`[WARN] .lobby-title not found within 15s — taking screenshot anyway`);
  }

  // Let images decode + the body film-grain animation settle
  await page.waitForTimeout(args.waitMs);

  console.log(`[*] Capturing...`);
  await page.screenshot({ path: args.output, fullPage: args.fullPage });
  console.log(`[OK] Saved ${args.output}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
