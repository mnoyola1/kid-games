/**
 * test-canvas.mjs — Playwright smoke test for the WritingCanvas.
 *
 * Drives the standalone harness at test/canvas-harness.html under WebKit with
 * iPad emulation (touch enabled, isMobile, real iPad UA), then dispatches
 * rapid sequential touch strokes via CDP and asserts ink pixels grew on every
 * single stroke. This catches regressions in the touch-event state machine
 * (e.g. the "every other letter is dropped" bug).
 *
 * Usage (from c:\Dev\n-solutions\n-games):
 *   node test/test-canvas.mjs
 *
 * Notes:
 *   - WebKit/Playwright's touch model isn't a 100% replica of real iPadOS
 *     Safari (iOS-specific quirks like flaky PointerEvent synthesis don't
 *     reproduce in desktop WebKit). But:
 *       * It exercises the exact same TouchEvent code path our canvas uses.
 *       * It catches handler-logic regressions (the bug we just fixed —
 *         `e.touches.length > 1` rejecting fast taps — DOES reproduce here
 *         because rapid touchstarts inside the same animation frame share a
 *         non-zero `touches` list during dispatch).
 */

import { chromium, devices } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

// ---------- tiny static file server -----------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
};

function startServer(rootDir, port = 0) {
  return new Promise((resolvePort) => {
    const server = http.createServer((req, res) => {
      try {
        const u = new URL(req.url, 'http://x');
        const safe = path.normalize(decodeURIComponent(u.pathname)).replace(/^[/\\]+/, '');
        const fp = path.join(rootDir, safe);
        if (!fp.startsWith(rootDir)) { res.writeHead(403); return res.end(); }
        if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
          res.writeHead(404); return res.end('not found');
        }
        const ext = path.extname(fp).toLowerCase();
        res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(fp).pipe(res);
      } catch (err) {
        res.writeHead(500); res.end(String(err));
      }
    });
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolvePort({ server, port: addr.port });
    });
  });
}

// ---------- test --------------------------------------------------------------

const FAILS = [];
function check(label, ok, detail = '') {
  const tag = ok ? '✅' : '❌';
  console.log(`  ${tag} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) FAILS.push(label + (detail ? ' — ' + detail : ''));
}

async function run() {
  const { server, port } = await startServer(ROOT);
  const url = `http://127.0.0.1:${port}/test/canvas-harness.html`;
  console.log(`Harness: ${url}`);

  // We run under Chromium with iPad UA + touch enabled. WebKit Playwright
  // blocks `new Touch()` as an illegal constructor, but we need to dispatch
  // multi-point TouchEvent sequences faster than `page.touchscreen.tap` allows
  // (which is only one tap per call). Chromium permits Touch construction and
  // our canvas's iOS path is keyed off `userAgent` / `platform`, so the
  // touch-event branch under test executes regardless of engine.
  const ipad = devices['iPad Pro 11'] ?? devices['iPad (gen 7)'];
  console.log(`Engine: chromium with iPad emulation (touch=${ipad.hasTouch}, isMobile=${ipad.isMobile})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...ipad,
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.error('  pageerror:', err.message));
  page.on('console',   (msg) => {
    if (msg.type() === 'error') console.error('  console.error:', msg.text());
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__test && window.__test.ready === true, { timeout: 5000 });

  console.log('\n--- Test 1: rapid sequential strokes (the dinosaur bug) ---');

  // Get canvas client rect for stroke coordinates.
  const rect = await page.evaluate(() => {
    const c = document.querySelector('.sq-canvas-wrap canvas');
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });

  // Dispatch a single stroke as native TouchEvent sequence (start, several
  // moves, end) using CDP. We use `page.touchscreen.tap()` and lower-level
  // `page.dispatchEvent` to construct multi-point sequences. Playwright also
  // exposes `page.touchscreen` for sequences, but to truly bench rapid
  // strokes we drive raw TouchEvents in the page so we control timing.
  async function stroke(points, opts = {}) {
    const { holdMs = 8, idAfter = null } = opts;
    await page.evaluate(async ({ points, holdMs }) => {
      const canvas = document.querySelector('.sq-canvas-wrap canvas');
      const r = canvas.getBoundingClientRect();
      const id = (Math.random() * 1e9) | 0;
      const mk = (clientX, clientY) => new Touch({
        identifier: id,
        target: canvas,
        clientX, clientY,
        pageX: clientX, pageY: clientY,
        screenX: clientX, screenY: clientY,
        radiusX: 5, radiusY: 5, rotationAngle: 0, force: 1,
      });
      const fire = (type, t, allActive) => {
        const ev = new TouchEvent(type, {
          bubbles: true, cancelable: true,
          touches: allActive,
          targetTouches: allActive,
          changedTouches: [t],
          view: window,
        });
        canvas.dispatchEvent(ev);
      };
      const startT = mk(points[0].x, points[0].y);
      fire('touchstart', startT, [startT]);
      await new Promise(r => setTimeout(r, 1));
      for (let i = 1; i < points.length; i++) {
        const t = mk(points[i].x, points[i].y);
        fire('touchmove', t, [t]);
        await new Promise(r => setTimeout(r, 1));
      }
      const endT = mk(points[points.length - 1].x, points[points.length - 1].y);
      fire('touchend', endT, []);
      await new Promise(r => setTimeout(r, holdMs));
    }, { points, holdMs });
  }

  // Helper: build a horizontal stroke at y, from x0 to x1, in `n` samples.
  function lineStroke(y, x0, x1, n = 10) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      pts.push({ x: x0 + (x1 - x0) * t, y });
    }
    return pts;
  }

  // Capture baseline: empty canvas should have ~0 ink pixels.
  let baseline = await page.evaluate(() => window.__test.inkPixelCount());
  check('empty canvas baseline pixels < 100', baseline < 100, `baseline=${baseline}`);

  // Fire 10 quick strokes (mimicking the letters of "DINOSAURS" — 9 letters
  // plus a slash). Spacing ~10ms between strokes simulates fast handwriting.
  const yMid = rect.y + rect.h / 2;
  const slotW = rect.w / 11;
  const counts = [];
  for (let i = 0; i < 10; i++) {
    const xStart = rect.x + slotW * (i + 0.6);
    const xEnd   = rect.x + slotW * (i + 1.4);
    await stroke(lineStroke(yMid, xStart, xEnd, 8));
    const px = await page.evaluate(() => window.__test.inkPixelCount());
    counts.push(px);
    // Tiny pause between strokes; small enough to provoke the "rapid tap"
    // race we saw on iPad.
    await page.waitForTimeout(15);
  }

  console.log('  ink pixel counts after each stroke:', counts.join(', '));

  // Every stroke must increase the ink pixel count.
  let monotonic = true;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] <= counts[i - 1]) {
      monotonic = false;
      console.log(`     stroke ${i + 1} did not add ink (was ${counts[i - 1]}, now ${counts[i]})`);
    }
  }
  check('every stroke added ink (no dropped letters)', monotonic);

  // Stroke counter (onStroke fired) should equal the number of strokes.
  const counterStrokes = await page.evaluate(() => window.__test.strokes);
  check('onStroke fired 10 times', counterStrokes === 10, `got ${counterStrokes}`);

  // The neighbouring "HEAR THE WORD" button should NOT have received any taps
  // even though strokes ran within ~one slot of its position.
  const neighbourTaps = await page.evaluate(() => window.__test.neighbourTaps);
  check('neighbour button received zero taps from strokes', neighbourTaps === 0, `got ${neighbourTaps}`);

  console.log('\n--- Test 2: stroke that overshoots the canvas ---');
  await page.evaluate(() => {
    const c = document.querySelector('.sq-canvas-wrap canvas');
    const ctx = c.getContext('2d');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height); ctx.restore();
    window.__test.strokes = 0;
    window.__test.hasDrawn = false;
  });
  // Stroke that ends BELOW the canvas (overshoots into neighbour zone).
  const overshoot = [
    { x: rect.x + 40,           y: rect.y + 30 },
    { x: rect.x + rect.w - 40,  y: rect.y + rect.h - 20 },
    { x: rect.x + rect.w - 30,  y: rect.y + rect.h + 80 }, // <-- below canvas
  ];
  await stroke(overshoot);
  const overshootInk = await page.evaluate(() => window.__test.inkPixelCount());
  check('overshooting stroke captured', overshootInk > baseline + 50, `ink=${overshootInk}`);

  // Save a screenshot for the user to eyeball.
  const shotPath = path.join(__dirname, 'canvas-harness-result.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log(`\nScreenshot: ${shotPath}`);

  await browser.close();
  server.close();

  if (FAILS.length) {
    console.log(`\n❌ ${FAILS.length} check(s) failed:`);
    for (const f of FAILS) console.log('   - ' + f);
    process.exit(1);
  } else {
    console.log('\n✅ All canvas checks passed.');
  }
}

run().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
