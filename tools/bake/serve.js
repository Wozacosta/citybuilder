// puppeteer driver: serves the tools/ folder at http://bake.local/ and runs a page function
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };
module.exports = async function run(page_html, fn, opts = {}) {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=metal', '--no-sandbox'], protocolTimeout: 0 });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.setRequestInterception(true);
  page.on('request', r => {
    const u = new URL(r.url()); if (u.host !== 'bake.local') return r.abort();
    const f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { console.log('404', f); return r.respond({ status: 404, body: '' }); }
    r.respond({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await page.goto('http://bake.local/bake/' + page_html, { waitUntil: 'load' });
  await page.waitForFunction('window.READY === true', { timeout: 0 });
  const out = await fn(page);
  await browser.close();
  return out;
};
