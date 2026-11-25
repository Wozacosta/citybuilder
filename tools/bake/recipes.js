// Tile compositions baked into sprites. Coordinates are in tiles: x -> game x (screen down-right),
// z -> game y (screen down-left); the tile spans -0.5..0.5. rot 0/1 keeps the front facing the viewer.
// key 'R1:n' -> zone R level 1, look n.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const pick = (r, a) => a[Math.floor(r() * a.length)];

// palettes: Monaco ochres and pinks, Hong Kong pastels, glassy office greys
const RIVIERA = ['#f3e2c0', '#f0c9a4', '#eab4ae', '#e4b96e', '#f4d9a6', '#e9a58d', '#f6ead6', '#d9c3a0', '#f2cfb8', '#e7cf87'];
const PASTEL = ['#bfe0d0', '#bcd3ea', '#f1c7c7', '#efe2b0', '#d7cdea', '#c9e4b8', '#f3d3b0', '#cfe3e8', '#e8e8e8', '#f4ead9'];
const OFFICE = ['#d6dbe2', '#c4ccd6', '#e4e1da', '#b9c2cc', '#d9d2c4', '#aab6c4', '#e8ecef', '#c8c3b8'];
const ROOFS = ['#9a6a58', '#7d7f86', '#8a5a4a', '#6d7480', '#a7795f', '#5f6670'];

const R = [];
const add = (key, rec) => R.push({ key, ...rec });
const trees = (r, n, spots) => { const out = []; for (let i = 0; i < n; i++) { const [x, z] = spots[i % spots.length]; out.push({ m: pick(r, ['s/tree-large', 's/tree-small']), x: x + (r() - 0.5) * 0.06, z: z + (r() - 0.5) * 0.06, fit: 0.2 + r() * 0.06 }); } return out; };

// ---- R1 villas: every suburban house, gardens with trees, planters, fences
'abcdefghijklmnopqrstu'.split('').forEach((c, i) => {
  const r = rng(100 + i), rot = i % 3 === 0 ? 1 : 0;
  add('R1:' + i, { plate: 'lawn', tint: RIVIERA[i % RIVIERA.length], tint2: ROOFS[i % ROOFS.length],
    items: [{ m: 's/building-type-' + c, x: -0.06, z: -0.06, rot, fit: 0.7 },
      ...trees(r, 1 + (i % 3), [[0.36, 0.34], [-0.36, 0.36], [0.38, -0.3]]),
      ...(i % 2 ? [{ m: 's/planter', x: 0.3, z: 0.1, fit: 0.16 }] : []),
      ...(i % 4 === 1 ? [{ m: 's/fence-1x4', x: 0, z: 0.44, fit: 0.9 }] : [])] });
});

// ---- R2 walk-up flats: small city blocks in riviera colours
const small = ['a', 'b', 'c', 'd', 'f', 'g', 'h'];
small.forEach((c, i) => [0, 1].forEach(k => {
  const r = rng(200 + i * 2 + k);
  add('R2:' + (i * 2 + k), { plate: 'pave', tint: RIVIERA[(i * 3 + k * 5) % RIVIERA.length], tint2: PASTEL[(i + k * 3) % PASTEL.length],
    items: [{ m: 'c/building-' + c, x: -0.04, z: -0.04, rot: k, fit: 0.78 }, ...trees(r, 1, [[0.38, 0.38]])] });
}));

// ---- R3 apartment blocks
['i', 'l', 'm', 'n', 'j', 'k'].forEach((c, i) => [0, 1].forEach(k => {
  add('R3:' + (i * 2 + k), { plate: 'pave', tint: PASTEL[(i * 2 + k * 3) % PASTEL.length], tint2: RIVIERA[(i + k) % RIVIERA.length],
    items: [{ m: 'c/building-' + c, rot: k, fit: 0.9, sy: c === 'k' || c === 'j' ? 1.8 : 1.25 }] });
}));

// ---- R4 residential towers: Hong Kong pencil towers
[['a', 1.5], ['c', 1.2], ['e', 1.3], ['a', 1.9], ['c', 1.5], ['e', 1.6], ['m', 1.9], ['l', 2.2]].forEach(([c, sy], i) => {
  add('R4:' + i, { plate: 'pave', tint: PASTEL[(i * 3) % PASTEL.length], tint2: PASTEL[(i * 3 + 4) % PASTEL.length],
    items: [{ m: c.length === 1 && 'ace'.includes(c) ? 'c/building-skyscraper-' + c : 'c/building-' + c, rot: i % 2, fit: 0.82, sy }] });
});

// ---- R5 supertall residences
[['b', 1.9], ['d', 1.7], ['c', 2.2], ['b', 2.3], ['d', 2.0], ['e', 2.4]].forEach(([c, sy], i) => {
  add('R5:' + i, { plate: 'plaza', tint: PASTEL[(i * 2 + 1) % PASTEL.length], tint2: OFFICE[i % OFFICE.length],
    items: [{ m: 'c/building-skyscraper-' + c, rot: i % 2, fit: 0.8, sy }] });
});

// ---- C1 shops: low blocks with awnings and café parasols
['a', 'b', 'c', 'd', 'f', 'g', 'h', 'a', 'c', 'd'].forEach((c, i) => {
  const r = rng(500 + i), rot = i % 2;
  add('C1:' + i, { plate: 'plaza', tint: RIVIERA[(i * 7) % RIVIERA.length], tint2: PASTEL[i % PASTEL.length],
    items: [{ m: 'c/building-' + c, x: -0.08, z: -0.08, rot, fit: 0.68 },
      { m: pick(r, ['c/detail-parasol-a', 'c/detail-parasol-b']), x: 0.34, z: 0.3, fit: 0.2 },
      ...(i % 2 ? [{ m: 'c/detail-parasol-a', x: 0.34, z: -0.05, fit: 0.2 }] : [{ m: 'c/detail-parasol-b', x: 0.02, z: 0.36, fit: 0.2 }])] });
});

// ---- C2 department stores: wide low blocks
['e', 'j', 'k', 'i', 'e', 'j', 'k', 'n'].forEach((c, i) => {
  add('C2:' + i, { plate: 'plaza', tint: (i < 4 ? RIVIERA : PASTEL)[(i * 3) % 10], tint2: OFFICE[i % OFFICE.length],
    items: [{ m: 'c/building-' + c, rot: i % 2, fit: 0.92, sy: 1.15 }] });
});

// ---- C3 office towers
[['l', 1.3], ['m', 1.2], ['n', 1.4], ['skyscraper-a', 1.0], ['l', 1.6], ['m', 1.5], ['skyscraper-e', 0.9], ['skyscraper-c', 0.8]].forEach(([c, sy], i) => {
  add('C3:' + i, { plate: 'plaza', tint: OFFICE[i % OFFICE.length], tint2: OFFICE[(i + 3) % OFFICE.length],
    items: [{ m: 'c/building-' + c, rot: i % 2, fit: 0.88, sy }] });
});

// ---- C4 skyscrapers
[['a', 1.4], ['b', 1.0], ['c', 1.15], ['d', 0.95], ['e', 1.2], ['a', 1.8], ['c', 1.4], ['e', 1.5]].forEach(([c, sy], i) => {
  add('C4:' + i, { plate: 'plaza', tint: OFFICE[(i * 3) % OFFICE.length], tint2: OFFICE[(i * 5 + 1) % OFFICE.length],
    items: [{ m: 'c/building-skyscraper-' + c, rot: i % 2, fit: 0.86, sy }] });
});

// ---- C5 supertall headquarters
[['d', 1.6], ['b', 1.9], ['c', 2.1], ['d', 1.9], ['b', 2.2], ['e', 2.3]].forEach(([c, sy], i) => {
  add('C5:' + i, { plate: 'plaza', tint: OFFICE[(i * 2 + 5) % OFFICE.length], tint2: OFFICE[(i + 2) % OFFICE.length],
    items: [{ m: 'c/building-skyscraper-' + c, rot: i % 2, fit: 0.84, sy }] });
});

// ---- I1 workshops: sheds, small yards with containers
['h', 'i', 'j', 'k', 'o', 'p', 's', 'g'].forEach((c, i) => {
  const r = rng(700 + i);
  add('I1:' + i, { plate: 'yard', tint: ['#e9e4da', '#d9dde3', '#eadfca', '#dfe6da'][i % 4],
    items: [{ m: 'i/building-' + c, x: -0.08, z: -0.06, rot: i % 2, fit: 0.72 },
      { m: 'i/shipping-container-' + pick(r, ['a', 'b', 'c']), x: 0.34, z: 0.28, rot: 0, fit: 0.26 },
      ...(i % 2 ? [{ m: 'i/detail-tank', x: 0.3, z: -0.32, fit: 0.22 }] : [])] });
});

// ---- I2 factories with chimneys
['a', 'b', 'e', 'g', 't', 'm', 'd', 'c'].forEach((c, i) => {
  add('I2:' + i, { plate: 'yard', tint: ['#e4e0d8', '#d4d9e0', '#e8dcc6', '#d9e0d4'][i % 4],
    items: [{ m: 'i/building-' + c, x: -0.04, z: 0, rot: i % 2, fit: 0.84 },
      { m: i % 2 ? 'i/chimney-medium' : 'i/chimney-small', x: 0.34, z: -0.34, fit: 0.14 }] });
});

// ---- I3 heavy industry: big halls, tanks, cooling stack, water tower
[['f', 'chimney-large'], ['l', 'detail-tank-large'], ['q', 'water-tower'], ['r', 'chimney-large'], ['c', 'detail-tank-large'], ['l', 'chimney-medium'], ['f', 'water-tower'], ['r', 'detail-tank-large']].forEach(([c, extra], i) => {
  add('I3:' + i, { plate: 'dark', tint: ['#dcd8d0', '#c9ced6', '#e0d2bb'][i % 3],
    items: [{ m: 'i/building-' + c, x: -0.12, z: 0.06, rot: i % 2, fit: 0.72 },
      { m: 'i/' + extra, x: 0.28, z: -0.28, fit: extra === 'chimney-medium' ? 0.16 : 0.36 },
      { m: 'i/shipping-container-' + 'abc'[i % 3], x: 0.36, z: 0.34, fit: 0.22 }] });
});

// glass colours for towers: gold, teal, bronze, silver, green, rose (undefined keeps the blue)
const GLASS = [undefined, '#e6c879', '#86cfc6', '#c79a72', '#d4dde6', undefined, '#9fd39a', '#e3b3b0', '#7fa8d8', '#e8d9a8'];
R.forEach((rec, i) => { const lv = rec.key[0] + rec.key[1]; if (/^(R[345]|C[345])$/.test(lv)) rec.glass = GLASS[(i * 7) % GLASS.length]; });
// ---- hand-modelled pieces (models.js)
[0, 1, 2].forEach(k => add('S:' + k, { plate: 'plaza', size: 2, custom: ['stadium', k], scale: 1.08 }));
[0, 1, 2, 3].forEach(k => add('V:' + k, { plate: 'plaza', custom: ['tower', k], scale: 1.4 }));
[0, 1, 2, 3, 4, 5].forEach(k => add('L:' + k, { plate: 'plaza', custom: ['monument', k] }));
[0, 1, 2, 3].forEach(k => add('R3:m' + k, { plate: 'pave', custom: ['mansion', 11 + k * 3] }));
[0, 1, 2].forEach(k => add('R4:m' + k, { plate: 'pave', custom: ['mansion', 41 + k * 5] }));
[0, 1, 2].forEach(k => add('C3:m' + k, { plate: 'pave', custom: ['mansion', 71 + k * 7] }));

// ---- procedural buildings (buildings.js): many shapes per level, each one seeded
const G = (key, o, plate = 'pave') => add(key, { plate, custom: ['gen', o] });
let sd = 1000;
const many = (lv, n, mk, plate) => { for (let k = 0; k < n; k++) G(lv + ':g' + k, { seed: ++sd, ...mk(k) }, typeof plate === 'function' ? plate(k) : plate); };
many('R1', 8, () => ({ kind: 'villa' }), 'lawn');
many('R2', 12, k => k % 3 === 0 ? { kind: 'belle', floors: 4 } : k % 3 === 1 ? { kind: 'tong', floors: 4 } : { kind: 'riviera', floors: 3 });
many('R3', 10, k => k % 3 === 0 ? { kind: 'terraces', tiers: 3 + (k % 2) } : k % 3 === 1 ? { kind: 'cross', h: 0.95, hv: 0.3, tri: k % 2 } : k % 2 ? { kind: 'belle', floors: 7 } : { kind: 'tong', floors: 7 });
many('R4', 12, k => k % 4 === 0 ? { kind: 'cross', h: 2.3, hv: 0.6, tri: k % 8 === 4 } : k % 4 === 1 ? { kind: 'podTower', h: 2.2, hv: 0.8, twin: true } : k % 4 === 2 ? { kind: 'terraces', tiers: 6 } : { kind: 'podTower', h: 2.4, hv: 0.8 });
many('R5', 10, k => k % 3 === 0 ? { kind: 'podTower', h: 3.8, hv: 1.2, garden: true } : k % 3 === 1 ? { kind: 'podTower', h: 3.4, hv: 1.0, twin: true, glassy: true } : { kind: 'tower', h: 3.8, hv: 1.0, shape: ['cyl', 'octa', 'setback', 'box'][k % 4] });
many('C1', 8, k => ({ kind: 'shops', market: k % 3 === 0 }), 'plaza');
many('C2', 9, k => k % 3 === 2 ? { kind: 'tong', floors: 6 } : { kind: 'mall' }, 'plaza');
many('C3', 12, k => ({ kind: 'tower', h: 0.85, hv: 0.45, shape: ['box', 'deco', 'octa', 'blade', 'setback', 'cyl'][k % 6] }), 'plaza');
many('C4', 14, k => ({ kind: 'tower', h: 2.2, hv: 1.0, shape: ['setback', 'octa', 'taper', 'cyl', 'twist', 'deco', 'blade', 'diagrid', 'twin', 'box'][k % 10] }), 'plaza');
many('C5', 14, k => ({ kind: 'tower', h: 4.4, hv: 2.6, shape: ['taper', 'twist', 'setback', 'cyl', 'diagrid', 'octa', 'deco', 'twin'][k % 8], crown: ['spire', 'pyramid', 'ring', 'lantern'][k % 4] }), 'plaza');
many('I1', 2, k => ({ kind: 'works', v: 1 }), 'yard');
many('I2', 3, k => ({ kind: 'works', v: k % 2 }), 'yard');
many('I3', 3, k => ({ kind: 'works', v: 2 - (k % 2) * 2 }), 'dark');
export const RECIPES = R;
