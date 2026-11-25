// Opens a page in headless Chromium and fails on any JavaScript error.
// Usage: node scripts/smoke.js index.html
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const LD = process.env.LEAFLET_DIR; // optional: offline Leaflet copy
  if (LD) await p.route(/leaflet.*\.(js|css)(\?.*)?$/, r => r.fulfill({ path: path.join(LD, /\.css/.test(r.request().url()) ? 'leaflet.css' : 'leaflet.js') }));
  await p.goto('file://' + path.resolve(process.argv[2] || 'index.html'));
  await p.waitForTimeout(2500);
  await b.close();
  if (errs.length) { console.error('JS errors:\n' + errs.join('\n')); process.exit(1); }
  console.log('OK, no JS errors');
})();
