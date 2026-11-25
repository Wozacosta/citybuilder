// Procedural buildings: one generator per kind, every one varied by a seed.
// Units: 1 = one tile, +Y up; the visible faces are +X and +Z. Facades are canvas textures with a
// matching night mask (white = windows, colour = neon), the way the mansion blocks work.
import * as THREE from 'three';

function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const pickr = (r, a) => a[Math.floor(r() * a.length)];
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.8, metalness: o.m ?? 0, emissive: o.e ? c : 0x000000, emissiveIntensity: o.ei ?? 0.5 });
function add(g, geo, mat, x = 0, y = 0, z = 0, glow) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (glow) m.userData.glow = glow; g.add(m); return m; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const BLACK = new THREE.MeshBasicMaterial({ color: 0 });
function rod(g, a, b, rad, mat, glow) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, d.length(), 6), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  if (glow) m.userData.glow = glow; g.add(m); return m;
}
function light(g, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); o.userData.light = true; g.add(o); }

// ---------------------------------------------------------------- palettes
const RIVIERA = ['#f3e2c0', '#f0c9a4', '#eab4ae', '#e4b96e', '#f4d9a6', '#e9a58d', '#f6ead6', '#d9c3a0', '#f2cfb8', '#e7cf87', '#f1d7c4', '#e8c3a0'];
const PASTEL = ['#bfe0d0', '#bcd3ea', '#f1c7c7', '#efe2b0', '#d7cdea', '#c9e4b8', '#f3d3b0', '#cfe3e8', '#e8e8e8', '#f4ead9', '#d9e6f2', '#f0d9e2'];
const HKWALL = ['#d8d2c4', '#cfc6b4', '#c7cfd4', '#e2d9c6', '#bfc8c0', '#d9c8b8', '#c9c2d0', '#e6e0d2'];
const GLASS = ['#6f9ac4', '#5f9e9a', '#a88c6a', '#9aa7b4', '#6c8f7a', '#3f5470', '#c7a76a', '#7f8fb0', '#4f7f96', '#8fb4c9'];
const FRAME = ['#e8e8e4', '#2d3138', '#b9bcc0', '#d8d0c0', '#5a6068'];
const SHUT = ['#3f7a5a', '#3b6fa0', '#7a8a96', '#5b8f8a', '#a0583b', '#476a8a'];
const NEON = ['#ff3d6e', '#35e0ff', '#ffd23d', '#7dff6a', '#ff7b2e', '#c46bff', '#ff4d4d', '#4d9bff'];
const CURT = ['#2f3a46', '#3d4a3f', '#4a3c34', '#26303a', '#5a6470', '#6f7f8c', '#3b3f52', '#56606c'];
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = s => Math.max(0, Math.min(255, Math.round((n >> s & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; };

// ---------------------------------------------------------------- facade textures
// style: glass | ribbon | punched | belle | deco | shop. o: colours and options. Returns day + mask textures.
const C = 8;
function facade(style, wU, hU, o, r) {
  const fh = o.fh || (style === 'belle' ? 0.11 : 0.09), cols = Math.max(2, Math.round(wU * (o.cpu || 12))), rows = Math.max(1, Math.round(hU / fh));
  const W = cols * C, H = rows * C, pod = Math.min(rows, o.pod || 0);
  const day = document.createElement('canvas'), mask = document.createElement('canvas'); day.width = mask.width = W; day.height = mask.height = H;
  const d = day.getContext('2d'), m = mask.getContext('2d');
  m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
  const win = (x, y, w, h, col) => { d.fillStyle = col; d.fillRect(x, y, w, h); m.fillStyle = '#fff'; m.fillRect(x, y, w, h); };
  const top = rows - pod;   // rows above the podium
  if (style === 'glass') {
    const g0 = o.glass;
    d.fillStyle = g0; d.fillRect(0, 0, W, H);
    for (let y = 0; y < top; y++) {
      const mech = o.band && y % o.band === o.band - 1;
      for (let x = 0; x < cols; x++) {
        if (mech) { d.fillStyle = o.frame; d.fillRect(x * C, y * C, C, C); continue; }
        const f = 0.9 + r() * 0.22 + (1 - y / rows) * 0.12 - (x / cols) * 0.06;   // sky reflection: lighter high up
        win(x * C, y * C, C, C - 1, shade(g0, f));
      }
      d.fillStyle = shade(o.frame, 0.95); d.fillRect(0, y * C + C - 1, W, 1);
    }
    d.fillStyle = shade(o.frame, 1); for (let x = 0; x <= cols; x++) d.fillRect(x * C, 0, 1, top * C);
    // a soft diagonal sheen
    const gr = d.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.08)');
    d.fillStyle = gr; d.fillRect(0, 0, W, top * C);
  } else if (style === 'ribbon') {
    d.fillStyle = o.base; d.fillRect(0, 0, W, H);
    for (let y = 0; y < top; y++) {
      win(0, y * C + 1, W, 4, shade(o.glass || '#4a5a6a', 0.95 + r() * 0.15));
      d.fillStyle = shade(o.base, 0.8); for (let x = 0; x <= cols; x++) d.fillRect(x * C, y * C + 1, 1, 4);
    }
  } else if (style === 'deco') {
    d.fillStyle = o.base; d.fillRect(0, 0, W, H);
    for (let y = 0; y < top; y++) for (let x = 0; x < cols; x++) {
      if (x % 3 === 0) { d.fillStyle = shade(o.base, 1.08); d.fillRect(x * C, y * C, 3, C); continue; }   // piers
      win(x * C + 1, y * C + 1, C - 2, C - 3, shade(o.glass || '#3d4652', 0.9 + r() * 0.2));
      d.fillStyle = shade(o.base, 0.78); d.fillRect(x * C + 1, y * C + C - 2, C - 2, 1);
    }
  } else if (style === 'belle') {
    d.fillStyle = o.base; d.fillRect(0, 0, W, H);
    for (let y = 0; y < top; y++) {
      d.fillStyle = shade(o.base, 1.1); d.fillRect(0, y * C, W, 1);   // cornice
      for (let x = 0; x < cols; x++) {
        win(x * C + 3, y * C + 2, 2, 5, CURT[(r() * 3) | 0]);
        d.fillStyle = o.shut; d.fillRect(x * C + 1, y * C + 2, 2, 5); d.fillRect(x * C + 5, y * C + 2, 2, 5);
        if (o.bal && y % 2 === 1) { d.fillStyle = '#2d2f33'; d.fillRect(x * C + 1, y * C + 6, 6, 1); }
      }
    }
    if (o.rust) { d.fillStyle = shade(o.base, 0.88); d.fillRect(0, (top - 1) * C, W, C); }
  } else {   // punched: residential windows with curtains, AC units and balcony rails
    d.fillStyle = o.base; d.fillRect(0, 0, W, H);
    for (let i = 0; i < cols * 2 * (o.grime || 0); i++) { d.fillStyle = `rgba(40,34,28,${0.04 + r() * 0.08})`; d.fillRect(r() * W, r() * H * 0.4, 1 + r() * 2, H * (0.2 + r() * 0.6)); }
    for (let y = 0; y < top; y++) for (let x = 0; x < cols; x++) {
      if (o.stripe && x % o.stripe === 0) { d.fillStyle = o.accent; d.fillRect(x * C, y * C, C, C); continue; }
      const ww = o.wide ? 6 : 4, wx = x * C + (C - ww) / 2;
      win(wx, y * C + 2, ww, 4, CURT[(r() * CURT.length) | 0]);
      if (o.shut) { d.fillStyle = o.shut; d.fillRect(wx - 1, y * C + 2, 1, 4); d.fillRect(wx + ww, y * C + 2, 1, 4); }
      if (o.bal) { d.fillStyle = o.rail || '#f2f2ee'; d.fillRect(x * C, y * C + 6, C, 1); d.fillStyle = shade(o.base, 0.7); d.fillRect(x * C, y * C + 7, C, 1); }
      if (o.ac && r() < o.ac) { d.fillStyle = '#e4e2da'; d.fillRect(wx + ww - 2, y * C + 6, 3, 2); }
      if (o.laundry && r() < o.laundry) { d.fillStyle = pickr(r, ['#e04a4a', '#3d7bd9', '#e8c547', '#f2f2f2', '#7ac47a']); d.fillRect(wx, y * C + 5, ww, 1); }
    }
  }
  if (pod) {   // shopfronts, lit at night, with signboards above
    const pt = top * C;
    d.fillStyle = o.podCol || '#4b4f57'; d.fillRect(0, pt, W, H - pt);
    for (let y = top; y < rows; y++) for (let x = 0; x < cols; x += 2) {
      win(x * C + 1, y * C + 3, C * 2 - 2, C - 3, pickr(r, ['#ffd98a', '#bfe4ff', '#ffe9c4', '#f6f2e8']));
      const sc = pickr(r, NEON); d.fillStyle = sc; d.fillRect(x * C + 1, y * C + 1, C * 2 - 2, 2); m.fillStyle = sc; m.fillRect(x * C + 1, y * C + 1, C * 2 - 2, 2);
    }
  }
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { day: tex(day), mask: tex(mask) };
}
const dayMat = (t, o = {}) => new THREE.MeshStandardMaterial({ map: t, roughness: o.r ?? 0.75, metalness: o.m ?? 0 });
const maskMat = t => new THREE.MeshBasicMaterial({ map: t });

// a box with facades on all four sides (the two we see differ from the two we don't only by width)
function fbox(g, w, h, d, x, y, z, style, o, r, roof = '#8d8b86') {
  const fx = facade(style, d, h, o, r), fz = facade(style, w, h, o, r), rm = std(roof), gl = style === 'glass' ? { r: 0.35, m: 0.25 } : {};
  const m = add(g, box(w, h, d), [dayMat(fx.day, gl), dayMat(fx.day, gl), rm, rm, dayMat(fz.day, gl), dayMat(fz.day, gl)], x, y + h / 2, z);
  m.userData.maskMat = [maskMat(fx.mask), maskMat(fx.mask), BLACK, BLACK, maskMat(fz.mask), maskMat(fz.mask)];
  return m;
}
// a prism (cylinder with n sides) wrapped in one facade; rt/rb are corner radii
function fprism(g, rt, rb, h, n, x, y, z, style, o, r, roof = '#8d8b86', rot) {
  const per = n * 2 * Math.max(rt, rb) * Math.sin(Math.PI / n), f = facade(style, per, h, o, r), rm = std(roof), gl = style === 'glass' ? { r: 0.35, m: 0.25 } : {};
  const m = add(g, new THREE.CylinderGeometry(rt, rb, h, n), [dayMat(f.day, gl), rm, rm], x, y + h / 2, z);
  m.rotation.y = rot ?? (n === 4 ? Math.PI / 4 : n === 8 ? Math.PI / 8 : 0);
  m.userData.maskMat = [maskMat(f.mask), BLACK, BLACK];
  return m;
}

// ---------------------------------------------------------------- details
const tree = (g, x, z, s = 1, y = 0) => { add(g, new THREE.CylinderGeometry(0.008 * s, 0.01 * s, 0.07 * s, 5), std('#6b5240'), x, y + 0.035 * s, z); add(g, new THREE.SphereGeometry(0.06 * s, 8, 6), std(pickr(Math.random, ['#4f8f45', '#5a9a4c', '#457f3c'])), x, y + 0.1 * s, z); };
const cypress = (g, x, z, h = 0.22, y = 0) => add(g, new THREE.ConeGeometry(0.03, h, 6), std('#3f6b3a'), x, y + h / 2, z);
function palm(g, x, z, h = 0.24, y = 0) {
  rod(g, [x, y, z], [x + 0.02, y + h, z], 0.007, std('#8a6e52'));
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; rod(g, [x + 0.02, y + h, z], [x + 0.02 + Math.cos(a) * 0.07, y + h - 0.03, z + Math.sin(a) * 0.07], 0.008, std('#4f9a4a')); }
}
function hipRoof(g, w, d, h, x, y, z, col) { const m = add(g, new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), std(col, { r: 0.9 }), x, y + h / 2, z); m.rotation.y = Math.PI / 4; m.scale.set(w, h, d); return m; }
function mansard(g, w, d, h, x, y, z, col) {   // a sloped roof cut flat on top
  const m = add(g, new THREE.CylinderGeometry(0.4 * Math.SQRT2, 0.5 * Math.SQRT2, 1, 4), std(col, { r: 0.6 }), x, y + h / 2, z);
  m.rotation.y = Math.PI / 4; m.scale.set(w, h, d); return m;
}
function rooftop(g, w, d, y, r, n = 6) {   // water tanks, AC units, huts, antennas
  const hut = std('#a39d92'), tank = std(pickr(r, ['#5c7f9a', '#8a8f96', '#b9b3a6'])), acM = std('#d6d4cc'), ant = std('#5a5f66');
  if (r() < 0.8) add(g, box(w * 0.3, 0.07, d * 0.28), hut, (r() - 0.5) * w * 0.4, y + 0.035, (r() - 0.5) * d * 0.4);
  for (let k = 0; k < n; k++) {
    const x = (r() - 0.5) * w * 0.75, z = (r() - 0.5) * d * 0.75, t = r();
    if (t < 0.35) add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.07, 10), tank, x, y + 0.035, z);
    else if (t < 0.8) add(g, box(0.05, 0.03, 0.04), acM, x, y + 0.015, z);
    else rod(g, [x, y, z], [x, y + 0.08 + r() * 0.12, z], 0.004, ant);
  }
}
function crown(g, kind, s, y, r, col) {   // the top of a tower: s = half width
  const steel = std('#c9ced6', { m: 0.6, r: 0.35 });
  if (kind === 'spire') { rod(g, [0, y, 0], [0, y + 0.5 + r() * 0.5, 0], 0.012, steel); light(g, 0, y + 0.7 + r() * 0.3, 0); }
  else if (kind === 'mast') { add(g, box(s * 0.9, 0.12, s * 0.9), std('#9aa0a8'), 0, y + 0.06, 0); rod(g, [0, y + 0.12, 0], [0, y + 0.5, 0], 0.008, steel); light(g, 0, y + 0.5, 0); }
  else if (kind === 'lantern') {   // glass box lit from inside
    add(g, box(s * 1.2, 0.2, s * 1.2), std(col, { e: 1, ei: 0.35 }), 0, y + 0.1, 0, col);
    add(g, box(s * 1.3, 0.02, s * 1.3), steel, 0, y + 0.21, 0); light(g, 0, y + 0.24, 0);
  } else if (kind === 'pyramid') {
    const p = add(g, new THREE.ConeGeometry(s * 0.95, s * 1.6, 4), std(col, { e: 1, ei: 0.3, m: 0.3, r: 0.3 }), 0, y + s * 0.8, 0, col); p.rotation.y = Math.PI / 4; light(g, 0, y + s * 1.7, 0);
  } else if (kind === 'ring') {
    const t = add(g, new THREE.TorusGeometry(s * 1.05, 0.014, 6, 32), std(col, { e: 1, ei: 0.5 }), 0, y - 0.05, 0, col); t.rotation.x = Math.PI / 2;
    rod(g, [0, y, 0], [0, y + 0.3, 0], 0.01, steel); light(g, 0, y + 0.3, 0);
  } else if (kind === 'heli') {
    add(g, new THREE.CylinderGeometry(s * 0.9, s * 0.9, 0.02, 24), std('#3d434c'), 0, y + 0.01, 0);
    const h = add(g, new THREE.TorusGeometry(s * 0.55, 0.01, 4, 24), std('#f2f2ee'), 0, y + 0.025, 0); h.rotation.x = Math.PI / 2;
    add(g, box(0.03, 0.005, s * 0.6), std('#f2f2ee'), -s * 0.18, y + 0.025, 0); add(g, box(0.03, 0.005, s * 0.6), std('#f2f2ee'), s * 0.18, y + 0.025, 0); add(g, box(s * 0.36, 0.005, 0.03), std('#f2f2ee'), 0, y + 0.025, 0);
    light(g, s * 0.8, y + 0.03, 0);
  } else if (kind === 'fins') {
    for (let k = -2; k <= 2; k++) add(g, box(0.012, 0.25 + (2 - Math.abs(k)) * 0.08, s * 1.6), steel, k * s * 0.38, y + 0.15, 0);
    light(g, 0, y + 0.45, 0);
  } else rooftop(g, s * 2, s * 2, y, r, 5);
}
function blades(g, w, d, y0, n, r) {   // vertical neon signs over the street, on the two faces we see
  for (let k = 0; k < n; k++) {
    const col = pickr(r, NEON), onX = k % 2 === 0, t = (r() - 0.5) * (onX ? d : w) * 0.8, sh = 0.12 + r() * 0.2, y = y0 + sh / 2 + r() * 0.15;
    add(g, box(onX ? 0.09 : 0.014, sh, onX ? 0.014 : 0.09), std(col, { e: 1, ei: 0.55 }), onX ? w / 2 + 0.05 : t, y, onX ? t : d / 2 + 0.05, col);
  }
}
function billboard(g, x, y, z, w, h, col, faceX) {
  add(g, box(faceX ? 0.015 : w, h, faceX ? w : 0.015), std(col, { e: 1, ei: 0.45 }), x, y + h / 2, z, col);
  rod(g, [x - (faceX ? 0.02 : w * 0.3), y - 0.05, z - (faceX ? w * 0.3 : 0.02)], [x - (faceX ? 0.02 : w * 0.3), y, z - (faceX ? w * 0.3 : 0.02)], 0.005, std('#5a5f66'));
}
function awning(g, x, z, w, y, col, faceX) { const a = add(g, box(faceX ? 0.06 : w, 0.012, faceX ? w : 0.06), std(col), x, y, z); a.rotation[faceX ? 'z' : 'x'] = faceX ? -0.35 : 0.35; }
function balconies(g, w, d, y0, y1, fh, col, cx = 0, cz = 0) {   // slab lines on the two faces we see
  const m = std(col);
  for (let y = y0 + fh; y < y1 - 0.02; y += fh) {
    add(g, box(w * 0.9, 0.008, 0.035), m, cx, y, cz + d / 2 + 0.017);
    add(g, box(0.035, 0.008, d * 0.9), m, cx + w / 2 + 0.017, y, cz);
  }
}
function pool(g, x, z, w, d) { add(g, box(w + 0.04, 0.012, d + 0.04), std('#e9e4d8'), x, 0.006, z); add(g, box(w, 0.014, d), std('#4fb6d8', { r: 0.2 }), x, 0.008, z); }
function umbrella(g, x, z, col, y = 0) { rod(g, [x, y, z], [x, y + 0.07, z], 0.003, std('#ddd')); add(g, new THREE.ConeGeometry(0.04, 0.02, 8), std(col), x, y + 0.075, z); }

// ---------------------------------------------------------------- kinds
const K = {};

// R1: Mediterranean villa, terracotta or roof terrace, pool, cypresses
K.villa = (g, r) => {
  const base = pickr(r, ['#f4efe4', '#f3e2c0', '#efd6b8', '#f2d0c4', '#f6f1e8', '#e8d4a8']), fh = 0.13, shut = pickr(r, SHUT);
  const w = 0.36 + r() * 0.12, d = 0.3 + r() * 0.1, h = fh * (1 + (r() < 0.7));
  fbox(g, w, h, d, -0.12, 0, -0.1, 'punched', { base, shut, fh, cpu: 9, wide: true }, r);
  if (r() < 0.65) hipRoof(g, w + 0.05, d + 0.05, 0.1, -0.12, h, -0.1, pickr(r, ['#c8643c', '#b85a3a', '#d07a4a']));
  else { add(g, box(w, 0.025, d), std('#f2f2ee'), -0.12, h + 0.012, -0.1); add(g, box(w * 0.4, 0.008, d * 0.5), std('#c9b28a'), -0.12 + w * 0.2, h + 0.06, -0.1); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rod(g, [-0.12 + w * 0.2 + a * w * 0.18, h, -0.1 + b * d * 0.22], [-0.12 + w * 0.2 + a * w * 0.18, h + 0.06, -0.1 + b * d * 0.22], 0.004, std('#f2f2ee')); }
  const ww = 0.18 + r() * 0.08;   // low wing
  fbox(g, ww, fh, 0.2, -0.12 + w / 2 + ww / 2 - 0.02, 0, 0.12, 'punched', { base, shut, fh, cpu: 9, wide: true }, r);
  if (r() < 0.5) hipRoof(g, ww + 0.04, 0.24, 0.07, -0.12 + w / 2 + ww / 2 - 0.02, fh, 0.12, '#c8643c');
  pool(g, 0.25, -0.26, 0.16, 0.12 + r() * 0.06);
  umbrella(g, 0.36, -0.08, pickr(r, ['#e04a4a', '#3d7bd9', '#f2f2ee']));
  for (let k = 0; k < 2 + (r() * 3 | 0); k++) cypress(g, -0.42 + k * 0.08, 0.4, 0.18 + r() * 0.1);
  if (r() < 0.6) palm(g, 0.38, 0.36); else tree(g, 0.36, 0.36, 1.2);
};
// R2: Monaco belle-epoque block with a mansard roof, shops at street level
K.belle = (g, r, o) => {
  const base = pickr(r, RIVIERA), fh = 0.11, floors = (o.floors || 5) + (r() * 2 | 0), h = floors * fh, w = 0.84, d = 0.78;
  fbox(g, w, h, d, 0, 0, 0, 'belle', { base, shut: pickr(r, SHUT), bal: true, pod: 1, fh, cpu: 11, podCol: '#5a4a3e' }, r);
  mansard(g, w, d, 0.14, 0, h, 0, pickr(r, ['#5d6470', '#6a6f78', '#4f5865']));
  for (let k = 0; k < 4; k++) add(g, box(0.05, 0.06, 0.04), std(base), -0.3 + k * 0.2, h + 0.06, d * 0.42);
  for (let k = 0; k < 3; k++) awning(g, -0.28 + k * 0.28, d / 2 + 0.03, 0.2, 0.08, pickr(r, ['#c0392b', '#2e6da4', '#2f7d5b', '#d4a017']), false);
  if (r() < 0.45) {   // corner rotunda with a dome
    const rr = 0.13; fprism(g, rr, rr, h + 0.08, 16, w / 2 - rr * 0.6, 0, d / 2 - rr * 0.6, 'belle', { base, shut: '#5b8f8a', fh, cpu: 11 }, r);
    const dm = add(g, new THREE.SphereGeometry(rr, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(pickr(r, ['#5d6470', '#7aa39a', '#b8914a']), { m: 0.3, r: 0.4 }), w / 2 - rr * 0.6, h + 0.08, d / 2 - rr * 0.6);
    rod(g, [w / 2 - rr * 0.6, h + 0.08 + rr, d / 2 - rr * 0.6], [w / 2 - rr * 0.6, h + 0.2 + rr, d / 2 - rr * 0.6], 0.006, std('#b8914a'));
  }
  for (let k = 0; k < 3; k++) add(g, box(0.04, 0.08, 0.04), std('#b8a898'), -0.3 + r() * 0.6, h + 0.12, -0.3 + r() * 0.3);
};
// R2/C1: Hong Kong tong lau shophouses with balconies, laundry and neon blades
K.tong = (g, r, o) => {
  const n = 2 + (r() < 0.4), w = 0.86 / n, d = 0.7, fh = 0.1;
  for (let k = 0; k < n; k++) {
    const floors = (o.floors || 5) + (r() * 3 | 0), h = floors * fh, x = -0.43 + w * (k + 0.5);
    fbox(g, w - 0.01, h, d, x, 0, 0, 'punched', { base: pickr(r, HKWALL.concat(PASTEL)), bal: true, ac: 0.35, laundry: 0.25, pod: 1, fh, cpu: 13, grime: 1, rail: '#cfd3d6' }, r);
    rooftop(g, w * 0.8, d * 0.8, h, r, 3);
    if (r() < 0.5) add(g, box(w * 0.7, 0.06, d * 0.4), std('#9a9286'), x, h + 0.03, -0.1);
  }
  blades(g, 0.86, d, 0.12, 3 + (r() * 3 | 0), r);
};
// R2: small riviera apartment house with shutters and terraces
K.riviera = (g, r, o) => {
  const base = pickr(r, RIVIERA.concat(PASTEL)), fh = 0.11, floors = (o.floors || 4) + (r() * 2 | 0), h = floors * fh, w = 0.7, d = 0.62;
  fbox(g, w, h, d, -0.05, 0, -0.06, 'punched', { base, shut: pickr(r, SHUT), fh, cpu: 10, wide: true }, r);
  balconies(g, w, d, 0, h, fh, '#f4f2ec', -0.05, -0.06);
  add(g, box(w, 0.03, d), std('#f2f2ee'), -0.05, h + 0.015, -0.06);
  for (let k = 0; k < 3; k++) umbrella(g, -0.3 + k * 0.2, -0.06 + (k % 2 ? 0.12 : -0.08), pickr(r, ['#e04a4a', '#f2f2ee', '#3d7bd9', '#e8c547']), h + 0.03);
  tree(g, 0.38, 0.38, 1.1); cypress(g, -0.42, 0.4, 0.2);
};
// R3: 1970s Monaco terraces stepping back, planters on every tier
K.terraces = (g, r, o) => {
  const base = pickr(r, ['#f4f1ea', '#efe6d4', '#f2e6d8', '#e9e4da']), fh = 0.1, tiers = o.tiers || 4, per = 2 + (r() < 0.5);
  let y = 0, d = 0.86;
  for (let t = 0; t < tiers; t++) {
    const h = per * fh, z = -(0.86 - d) / 2;
    fbox(g, 0.86, h, d, 0, y, z, 'ribbon', { base, glass: '#5a6a7a', fh }, r);
    add(g, box(0.86, 0.035, 0.04), std('#5f9a4f'), 0, y + h + 0.017, z + d / 2 - 0.02);   // planter hedge
    if (t && r() < 0.7) umbrella(g, -0.3 + r() * 0.6, z + d / 2 - 0.1, pickr(r, ['#e04a4a', '#f2f2ee', '#3d7bd9']), y + h);
    y += h; d -= 0.14;
  }
  rooftop(g, 0.8, d, y, r, 3);
};
// R3/R4: Hong Kong public housing on a cross (or trident) plan
K.cross = (g, r, o) => {
  const H = o.h + r() * (o.hv || 0.4), base = pickr(r, PASTEL), accent = pickr(r, ['#e06a6a', '#5a8fd9', '#e0a030', '#3aa58a', '#b05ad9']);
  const opt = { base, bal: false, ac: 0.4, laundry: 0.3, stripe: 5, accent, fh: 0.085, cpu: 13, grime: 0.6 };
  if (o.tri) {
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 + Math.PI / 4, m = fbox(g, 0.46, H, 0.2, Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2, 'punched', opt, r); m.rotation.y = a; }
    fbox(g, 0.22, H + 0.06, 0.22, 0, 0, 0, 'punched', { ...opt, stripe: 0 }, r);
  } else {
    fbox(g, 0.86, H, 0.22, 0, 0, 0, 'punched', opt, r); fbox(g, 0.22, H, 0.86, 0, 0, 0, 'punched', opt, r);
    fbox(g, 0.26, H + 0.08, 0.26, 0, 0, 0, 'punched', { ...opt, stripe: 0 }, r);
  }
  add(g, box(0.2, 0.06, 0.2), std(accent), 0, H + 0.11, 0);   // water tank with the estate colour
  rooftop(g, 0.5, 0.5, H, r, 4);
};
// R4/R5: Hong Kong pencil tower(s) on a shopping podium
K.podTower = (g, r, o) => {
  const pod = 0.16 + r() * 0.1, twin = o.twin, H = o.h + r() * (o.hv || 0.6), base = pickr(r, o.glassy ? HKWALL : PASTEL.concat(HKWALL));
  fbox(g, 0.94, pod, 0.94, 0, 0, 0, 'ribbon', { base: '#4b4f57', glass: '#ffe2b0', pod: 2, fh: pod / 2.2 }, r, '#9aa49a');
  blades(g, 0.94, 0.94, 0.02, 4, r);
  if (r() < 0.6) billboard(g, 0.47, pod, -0.1, 0.4, 0.14, pickr(r, NEON), true);
  const s = twin ? 0.34 : 0.5 + r() * 0.1, spots = twin ? [[-0.2, -0.2], [0.22, 0.22]] : [[0, 0]];
  const cr = pickr(r, ['roof', 'mast', 'lantern', 'heli', 'fins']);
  spots.forEach(([x, z], k) => {
    const h = H * (k ? 0.88 : 1);
    if (o.glassy) fbox(g, s, h, s, x, pod, z, 'glass', { glass: pickr(r, GLASS), frame: pickr(r, FRAME), band: 12, fh: 0.09, cpu: 12 }, r);
    else { fbox(g, s, h, s, x, pod, z, 'punched', { base, bal: r() < 0.6, ac: 0.3, fh: 0.085, cpu: 13, wide: r() < 0.5 }, r); }
    if (o.garden) {   // sky gardens: a recessed floor with trees every third of the way up
      for (const f of [0.38, 0.7]) { const y = pod + h * f; add(g, box(s + 0.01, 0.07, s + 0.01), std('#3e4a4f'), x, y, z); for (let q = 0; q < 3; q++) tree(g, x + s / 2 - 0.02, z - s / 3 + q * s / 3, 0.7, y - 0.035); }
    }
    const sub = new THREE.Group(); sub.position.set(x, 0, z); crown(sub, cr, s / 2, pod + h, r, pickr(r, ['#ffe9a8', '#bfe4ff', '#ffd0e0'])); g.add(sub);
  });
  if (twin && r() < 0.6) fbox(g, 0.42, 0.08, 0.12, 0, pod + H * 0.6, 0, 'glass', { glass: '#8fb4c9', frame: '#e8e8e4', fh: 0.08 }, r).rotation.y = -Math.PI / 4;
};
// C1: shop row with awnings and signs, or a street market under tarps
K.shops = (g, r, o) => {
  if (o.market) {   // market
    const tarps = ['#e04a4a', '#3d7bd9', '#e8c547', '#3aa58a', '#f2f2ee', '#ff7b2e'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = -0.33 + i * 0.22, z = -0.3 + j * 0.3; add(g, box(0.16, 0.05, 0.12), std('#b9a888'), x, 0.025, z);
      add(g, box(0.19, 0.01, 0.16), std(pickr(r, tarps)), x, 0.1, z); for (const [a, b] of [[-1, -1], [1, 1]]) rod(g, [x + a * 0.08, 0, z + b * 0.06], [x + a * 0.08, 0.1, z + b * 0.06], 0.003, std('#888'));
      if (r() < 0.4) add(g, box(0.02, 0.06, 0.02), std(pickr(r, NEON), { e: 1 }), x, 0.14, z, pickr(r, NEON));
    }
    return;
  }
  const n = 2 + (r() * 2 | 0), w = 0.84 / n;
  for (let k = 0; k < n; k++) {
    const h = 0.12 + r() * 0.12, x = -0.42 + w * (k + 0.5);
    fbox(g, w - 0.02, h, 0.5, x, 0, -0.18, 'ribbon', { base: pickr(r, RIVIERA.concat(PASTEL)), glass: '#e9dcc0', pod: 1, fh: h / (h > 0.18 ? 2 : 1) }, r);
    awning(g, x, 0.1, w - 0.06, 0.09, pickr(r, ['#c0392b', '#2e6da4', '#2f7d5b', '#d4a017', '#e06a8a']), false);
    billboard(g, x, h, -0.18, w * 0.7, 0.07, pickr(r, NEON), false);
  }
  for (let k = 0; k < 3; k++) umbrella(g, -0.3 + k * 0.3, 0.34, pickr(r, ['#e04a4a', '#f2f2ee', '#3d7bd9']));
};
// C2: department store with a giant screen, or a grand hotel with a dome
K.mall = (g, r) => {
  if (r() < 0.4) {
    const base = pickr(r, ['#f4efe4', '#f3e2c0', '#efe6d4']), h = 0.8 + r() * 0.2;
    fbox(g, 0.9, h, 0.86, 0, 0, 0, 'belle', { base, shut: '#5b8f8a', bal: true, pod: 1, fh: 0.11, cpu: 11, podCol: '#6a5a4a' }, r);
    mansard(g, 0.9, 0.86, 0.12, 0, h, 0, '#5d6470');
    add(g, new THREE.SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(pickr(r, ['#7aa39a', '#b8914a', '#5d6470']), { m: 0.35, r: 0.4 }), 0, h + 0.1, 0);
    for (const x of [-0.3, 0.3]) { rod(g, [x, h + 0.12, 0.38], [x, h + 0.32, 0.38], 0.004, std('#ccc')); add(g, box(0.06, 0.04, 0.004), std(pickr(r, ['#d9473c', '#3d7bd9', '#f2f2ee'])), x + 0.03, h + 0.3, 0.38); }
    add(g, box(0.5, 0.03, 0.1), std('#c9a54a'), 0, 0.12, 0.47);   // canopy
    return;
  }
  const h = 0.5 + r() * 0.35, glass = pickr(r, GLASS);
  fbox(g, 0.92, h, 0.9, 0, 0, 0, r() < 0.5 ? 'ribbon' : 'glass', { base: pickr(r, ['#e8e4da', '#d6dbe2', '#c4ccd6']), glass, frame: '#e8e8e4', pod: 1, fh: 0.12, band: 0 }, r);
  const sc = pickr(r, NEON);
  add(g, box(0.012, h * 0.6, 0.5), std(sc, { e: 1, ei: 0.5 }), 0.467, h * 0.55, 0.1, sc);   // giant screen
  billboard(g, 0, h, 0, 0.5, 0.12, pickr(r, NEON), false);
  fprism(g, 0.14, 0.14, h + 0.06, 16, -0.32, 0, 0.32, 'glass', { glass: '#8fb4c9', frame: '#e8e8e4', fh: 0.08 }, r);
  rooftop(g, 0.6, 0.6, h, r, 5);
};
// C3–C5: glass and stone towers in many shapes
const towerOpt = (r, o) => ({ glass: pickr(r, GLASS), frame: pickr(r, FRAME), band: pickr(r, [0, 10, 14, 18]), fh: 0.09, cpu: 12, base: pickr(r, ['#e8e4da', '#d9d2c4', '#c8c3b8', '#e4e1da', '#b9b2a6']), ...o });
K.tower = (g, r, o) => {
  const H = o.h + r() * (o.hv || 0.6), sh = o.shape || pickr(r, ['box', 'setback', 'octa', 'taper', 'cyl', 'twist', 'deco', 'blade', 'twin', 'diagrid']);
  const op = towerOpt(r, {}), style = sh === 'deco' ? 'deco' : r() < 0.15 ? 'ribbon' : 'glass', cr = o.crown || pickr(r, ['spire', 'lantern', 'pyramid', 'ring', 'heli', 'mast', 'fins', 'roof']);
  const lit = pickr(r, ['#ffe9a8', '#bfe4ff', '#ffd0e0', '#c8ffd8', '#ffffff']);
  const pod = o.podium === false ? 0 : 0.1 + r() * 0.12;
  if (pod) { fbox(g, 0.94, pod, 0.94, 0, 0, 0, 'ribbon', { base: '#3d424b', glass: '#ffe2b0', pod: 1, fh: pod }, r, '#8a948a'); for (let k = 0; k < 4; k++) tree(g, -0.4 + k * 0.27, 0.42, 0.7, pod); }
  let top = pod + H, s = 0.34;
  if (sh === 'box') { s = 0.3 + r() * 0.08; fbox(g, s * 2, H, s * 2 * (0.75 + r() * 0.25), 0, pod, 0, style, op, r); }
  else if (sh === 'setback' || sh === 'deco') {
    let y = pod, w = 0.74; const n = 3 + (r() < 0.5);
    for (let k = 0; k < n; k++) { const h = H * [0.42, 0.28, 0.18, 0.12][k] * (n === 3 ? 1.1 : 1); fbox(g, w, h, w, 0, y, 0, style, op, r); y += h; w *= 0.78; }
    top = y; s = w / 2 / 0.78;
  } else if (sh === 'octa') { s = 0.36; fprism(g, s, s, H, 8, 0, pod, 0, style, op, r); }
  else if (sh === 'taper') { s = 0.3; fprism(g, 0.22 * Math.SQRT2, 0.42 * Math.SQRT2, H, 4, 0, pod, 0, 'glass', op, r); s = 0.22; }
  else if (sh === 'cyl') {
    s = 0.33; fprism(g, s, s, H, 28, 0, pod, 0, 'glass', op, r);
    const fin = std('#e8ecef', { m: 0.3 }); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; add(g, box(0.012, H, 0.04), fin, Math.cos(a) * (s + 0.01), pod + H / 2, Math.sin(a) * (s + 0.01)).rotation.y = -a; }
  } else if (sh === 'twist') {
    const n = 18, h = H / n, w = 0.56;
    for (let k = 0; k < n; k++) { const m = fbox(g, w, h, w, 0, pod + k * h, 0, 'glass', { ...op, band: 0 }, r); m.rotation.y = k / n * Math.PI / 2 * (r() < 0.02 ? 0 : 1); }
    s = 0.28;
  } else if (sh === 'blade') {
    fbox(g, 0.82, H, 0.3, 0, pod, -0.1, style, op, r);
    fbox(g, 0.5, H * 0.7, 0.24, 0.08, pod, 0.2, style, { ...op, glass: pickr(r, GLASS) }, r); s = 0.25;
  } else if (sh === 'twin') {
    for (const [x, z, f] of [[-0.2, -0.2, 1], [0.21, 0.21, 0.92]]) { fprism(g, 0.17, 0.2, H * f, 8, x, pod, z, 'glass', op, r); const c = new THREE.Group(); c.position.set(x, 0, z); crown(c, 'spire', 0.12, pod + H * f, r, lit); g.add(c); }
    const b = fbox(g, 0.5, 0.06, 0.08, 0, pod + H * 0.5, 0, 'glass', { ...op, band: 0 }, r); b.rotation.y = -Math.PI / 4;
    return;
  } else if (sh === 'diagrid') {
    s = 0.32; fbox(g, s * 2, H, s * 2, 0, pod, 0, 'glass', { ...op, band: 0 }, r);
    const steel = std('#e8ecef', { m: 0.4, r: 0.4 }), n = Math.max(3, Math.round(H / 0.45)), step = H / n;
    for (let k = 0; k < n; k++) { const y0 = pod + k * step, y1 = y0 + step, e = s + 0.006;
      rod(g, [e, y0, -s], [e, y1, s], 0.007, steel); rod(g, [e, y0, s], [e, y1, -s], 0.007, steel);
      rod(g, [-s, y0, e], [s, y1, e], 0.007, steel); rod(g, [s, y0, e], [-s, y1, e], 0.007, steel); }
  }
  crown(g, cr, s, top, r, lit);
};
// I: data centre, logistics shed, container yard
K.works = (g, r, o) => {
  const k = o.v ?? (r() * 3 | 0);
  if (k === 0) {
    fbox(g, 0.8, 0.22, 0.6, 0, 0, -0.1, 'ribbon', { base: '#d6dbe2', glass: '#3d4a5a', fh: 0.22 }, r);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), std('#9aa0a8'), -0.28 + i * 0.19, 0.24, -0.25 + j * 0.25); }
    add(g, box(0.3, 0.14, 0.14), std('#c9ced6'), 0.2, 0.07, 0.33); light(g, -0.38, 0.3, -0.38);
  } else if (k === 1) {
    fbox(g, 0.88, 0.24, 0.56, 0, 0, -0.16, 'ribbon', { base: pickr(r, ['#c9b99a', '#b9c2c9', '#d6b877']), glass: '#5a6a7a', fh: 0.24 }, r, '#9aa0a8');
    for (let i = 0; i < 5; i++) add(g, box(0.1, 0.12, 0.01), std('#5a5f66'), -0.34 + i * 0.17, 0.06, 0.125);
    for (let i = 0; i < 2; i++) { const x = -0.2 + i * 0.4; add(g, box(0.1, 0.09, 0.26), std(pickr(r, ['#e8e4da', '#d9534f', '#3b8fd9'])), x, 0.045, 0.32); add(g, box(0.1, 0.07, 0.07), std('#3a3f47'), x, 0.035, 0.47); }
  } else {
    const cols = ['#d9534f', '#3b8fd9', '#e0a030', '#3aa58a', '#e8e4da', '#7a5cc0'];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) for (let l = 0; l < 1 + (r() * 3 | 0); l++) add(g, box(0.22, 0.07, 0.09), std(pickr(r, cols)), -0.25 + i * 0.25, 0.035 + l * 0.07, -0.33 + j * 0.2);
    const y = std('#e0a030'); rod(g, [-0.42, 0, 0.42], [-0.42, 0.32, 0.42], 0.012, y); rod(g, [0.42, 0, 0.42], [0.42, 0.32, 0.42], 0.012, y); rod(g, [-0.42, 0.32, 0.42], [0.42, 0.32, 0.42], 0.012, y);
  }
};

export function gen(o) { const r = rng(o.seed || 1), g = new THREE.Group(); K[o.kind](g, r, o); return g; }
