const puppeteer = require('puppeteer-core');
(async () => {
  const [url, out, w = 1600, h = 1000, wait = 2500, js = ''] = process.argv.slice(2);
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage(); await p.setViewport({ width: +w, height: +h });
  p.on('pageerror', e => console.log('[pageerror]', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
  await p.goto(url); await new Promise(r => setTimeout(r, +wait));
  if (js) { console.log('eval:', JSON.stringify(await p.evaluate(js))); await new Promise(r => setTimeout(r, 1500)); }
  await p.screenshot({ path: out }); await b.close();
})();
