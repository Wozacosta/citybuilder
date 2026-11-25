const run = require('./serve'), fs = require('fs');
const only = process.argv[2] ? process.argv[2].split(',') : null;
run('bake.html', async p => {
  const o = await p.evaluate(l => bake(l), only);
  // preview sheet: atlas over a grey ground
  await p.evaluate(() => { const c = document.createElement('canvas'); c.width = ATLAS.width; c.height = ATLAS.height; const g = c.getContext('2d'); g.fillStyle = '#6b7a5e'; g.fillRect(0, 0, c.width, c.height); g.drawImage(ATLAS, 0, 0); window.PREV = c.toDataURL('image/png'); const n = document.createElement('canvas'); n.width = c.width; n.height = c.height; const h = n.getContext('2d'); h.fillStyle = '#111'; h.fillRect(0, 0, n.width, n.height); h.drawImage(MASK, 0, 0); window.PREVM = n.toDataURL('image/png'); });
  const prev = await p.evaluate(() => PREV), prevm = await p.evaluate(() => PREVM);
  fs.writeFileSync(__dirname + '/out_preview.png', Buffer.from(prev.split(',')[1], 'base64'));
  fs.writeFileSync(__dirname + '/out_mask.png', Buffer.from(prevm.split(',')[1], 'base64'));
  fs.writeFileSync(__dirname + '/baked.json', JSON.stringify(o));
  console.log('atlas', o.size, 'webp kB', Math.round(o.atlas.length * 0.75 / 1024), 'mask kB', Math.round(o.mask.length * 0.75 / 1024));
});
