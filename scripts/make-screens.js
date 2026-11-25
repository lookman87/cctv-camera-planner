// Builds a demo project and takes the README screenshots.
// Usage: node scripts/make-screens.js [path-to-index.html] [out-dir]
// Needs: npm i playwright, python3 with Pillow (to draw the demo floor plan).
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path = require('path'), fs = require('fs');
const page_ = path.resolve(process.argv[2] || 'index.html');
const out = path.resolve(process.argv[3] || 'docs');
const png = path.join(out, '_lot.png');
fs.mkdirSync(out, { recursive: true });
execSync(`python3 -c "
from PIL import Image, ImageDraw
W,H=2400,1500;im=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(im)
d.rectangle([60,60,W-60,H-60],outline='#222',width=6)
d.rectangle([130,130,W-130,H-130],outline='#555',width=3)
for y in (300,560,820,1080):
  for x in range(260,W-260,70): d.line([x,y,x+36,y+110],fill='#9aa0a6',width=3)
d.rectangle([180,1130,640,1290],outline='#222',width=5);d.rectangle([700,1130,1100,1290],outline='#222',width=5)
d.text((200,1150),'OFFICE / SHOP',fill='#222');d.text((720,1150),'TRUCK REPAIR',fill='#222')
d.line([130,700,W-130,700],fill='#bbb',width=2)
im.save('${png}')"`);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  // offline helper: serve Leaflet from a local copy if LEAFLET_DIR is set (CDN may be unreachable)
  const LD = process.env.LEAFLET_DIR;
  if (LD) await p.route(/leaflet.*\.(js|css)(\?.*)?$/, r => { const u = r.request().url(); const f = path.join(LD, /\.css/.test(u) ? 'leaflet.css' : 'leaflet.js'); r.fulfill({ path: f }); });
  await p.goto('file://' + page_); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(out, 'start.png') });          // start screen
  await p.click('#homex'); await p.waitForTimeout(200);
  const url = 'data:image/png;base64,' + fs.readFileSync(png).toString('base64');
  await p.evaluate(async (url) => {
    document.getElementById('vnp').click();
    await new Promise(r => { const i = new Image(); i.onload = () => { setPlanImage(url, i.width, i.height, false); r() }; i.src = url });
    plan.wm = 400 / FTM; plan.hm = 250 / FTM; plan.cal = true; showPlan(); map.fitBounds(planBounds(), { animate: false });
    const ft = 1 / 364567, C = PCEN;
    const P = (x, y) => ({ lat: C.lat + y * ft, lng: C.lng + x * ft / Math.cos(C.lat * Math.PI / 180) });
    const mkPole = (x, y) => { const q = P(x, y), o = { id: nid++, lat: q.lat, lng: q.lng, e: 0 }; poles.push(o); return o };
    const idf = (x, y, n) => { const q = P(x, y), o = { id: uid++, lat: q.lat, lng: q.lng, name: n }; cabs.push(o); return o };
    const sr = P(-170, -105); srvs.push({ id: uid++, lat: sr.lat, lng: sr.lng, name: 'Server Room 1' });
    const o = P(-160, -95); office = { lat: o.lat, lng: o.lng, rot: 0 };
    const i1 = idf(-60, -20, 'IDF 1'), i2 = idf(100, 20, 'IDF 2');
    const poleRows = [[70, 'a'], [-70, 'a']]; let n = 0;
    poleRows.forEach(([y]) => { for (let x = -160; x <= 160; x += 80) { const pl = mkPole(x, y);
      [0].forEach(h => { const c = newCam(n % 7 === 3 ? 'l' : 'a', pl.id, pl.lat, pl.lng); c.h = y > 0 ? 180 : 0; c.r = (c.t === 'l' ? 22 : 13); cams.push(c); n++ });
      cables.push({ id: cid++, a: pl.id, b: 'c' + (x < 20 ? i1.id : i2.id), t: 'c' }) } });
    refresh(); window.__ok = [poles.length, cams.length];
  }, url);
  await p.evaluate(() => { try { doriOn = true } catch (e) {} refresh() });
  await p.waitForTimeout(500); await p.evaluate(() => document.querySelectorAll('.toast,#toast').forEach(e => e.style.display = 'none')); await p.screenshot({ path: path.join(out, 'map.png') });
  await p.evaluate(() => { sel = { t: 'a', id: cams[3].id }; refresh() }); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'select.png') });
  await b.close(); fs.unlinkSync(png);
})();
