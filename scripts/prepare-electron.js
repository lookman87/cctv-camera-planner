// Copies ../index.html into electron/ and swaps the CDN scripts for local copies,
// so the desktop app does not need the internet for Leaflet and the PDF viewer.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), el = path.join(root, 'electron'), lib = path.join(el, 'lib');
fs.mkdirSync(lib, { recursive: true });
fs.copyFileSync(path.join(el, 'node_modules/leaflet/dist/leaflet.js'), path.join(lib, 'leaflet.min.js'));
fs.copyFileSync(path.join(el, 'node_modules/pdfjs-dist/build/pdf.min.js'), path.join(lib, 'pdf.min.js'));
fs.copyFileSync(path.join(el, 'node_modules/pdfjs-dist/build/pdf.worker.min.js'), path.join(lib, 'pdf.worker.min.js'));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html
  .replace('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'lib/leaflet.min.js')
  .replace('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'lib/pdf.min.js')
  .replace('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', 'lib/pdf.worker.min.js');
if (html.includes('cdnjs.cloudflare.com')) { console.error('A CDN link is still in index.html'); process.exit(1); }
fs.writeFileSync(path.join(el, 'index.html'), html);
console.log('Prepared electron/index.html and electron/lib');
