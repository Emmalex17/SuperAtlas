// Screen parity check: compares a page of the Next.js app with the approved prototype inventory.
// Usage:
//   node tools/parity/extract.cjs <prototype-route> <app-url> [storageState.json]
//   e.g. node tools/parity/extract.cjs programmes/view http://localhost:3000/programmes/ab12 .auth/regulator.json
// It prints every heading, tab, table column, pill, field and button the prototype has that the app page is missing,
// and saves a 1440 px screenshot of the app page next to the reference in docs/prototype/screens/.
// Adapt the selectors in `grab` if the app's markup differs (keep the same five lists).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [route, url, state] = process.argv.slice(2);
if (!route || !url) { console.error('Usage: node tools/parity/extract.cjs <prototype-route> <app-url> [storageState.json]'); process.exit(2); }
const inv = JSON.parse(fs.readFileSync(path.join(__dirname, '../../docs/prototype/inventory.json'), 'utf8'));
const ref = inv.find(s => s.id === route);
if (!ref) { console.error(`No prototype screen called "${route}". Routes: ${inv.map(s => s.id).join(', ')}`); process.exit(2); }

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...(state ? { storageState: state } : {}) });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  const app = await p.evaluate(() => {
    const clean = e => e.innerText.replace(/\s+/g, ' ').trim();
    const main = document.querySelector('main') || document.body;
    const all = q => [...new Set([...main.querySelectorAll(q)].map(clean).filter(Boolean))];
    return {
      headings: all('h1,h2,h3,h4,[class*="h4"]'),
      tabs: all('[role=tab]'),
      tableHeaders: all('th').map(t => t.toUpperCase()),
      pills: all('[class*="pill"]'),
      fields: all('label'),
      buttons: all('button, a[role=button], a[class*="btn"]'),
      text: clean(main)
    };
  });
  const out = path.join(__dirname, '../../docs/prototype/screens-app');
  fs.mkdirSync(out, { recursive: true });
  await p.screenshot({ path: path.join(out, `${route.replace(/\//g, '_')}.png`), fullPage: true });
  await b.close();

  const norm = s => s.replace(/\s+\d+$/, '').trim().toLowerCase(); // ignore trailing counts like "Questions 17"
  let missing = 0;
  for (const key of ['headings', 'tabs', 'tableHeaders', 'pills', 'fields', 'buttons']) {
    const want = (ref[key] || []).filter(t => !(key === 'buttons' && (ref.tabs || []).includes(t)));
    const have = new Set(app[key].map(norm));
    const lost = want.filter(t => !have.has(norm(t)) && !app.text.toLowerCase().includes(norm(t)));
    if (lost.length) { missing += lost.length; console.log(`\n${key} missing (${lost.length}):\n  - ${lost.join('\n  - ')}`); }
  }
  console.log(`\n${route}: ${missing === 0 ? 'text parity OK' : missing + ' prototype items missing'}`);
  console.log(`Compare screenshots: docs/prototype/screens/${ref.screenshot}  vs  docs/prototype/screens-app/${route.replace(/\//g, '_')}.png`);
  process.exit(missing ? 1 : 0);
})();
