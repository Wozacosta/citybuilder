// Hand-modelled pieces (three.js primitives) baked alongside the Kenney kits:
// stadiums, TV / communication towers, monuments and Chungking-style mansion blocks.
// Units: 1 = one tile, +Y up. Meshes may carry userData.glow = '#rrggbb' (lit at night)
// and userData.maskMat (material used for the night-light pass). Light markers: userData.light.
import * as THREE from 'three';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.8, metalness: o.m ?? 0, emissive: o.e ? c : 0x000000, emissiveIntensity: o.ei ?? 0.5, side: o.ds ? THREE.DoubleSide : THREE.FrontSide });
function add(g, geo, mat, x = 0, y = 0, z = 0, glow) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (glow) m.userData.glow = glow; g.add(m); return m; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open);
function rod(g, a, b, r, mat, glow) {   // a cylinder between two points
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), m = new THREE.Mesh(cyl(r, r, d.length(), 6), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  if (glow) m.userData.glow = glow; g.add(m); return m;
}
function light(g, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); o.userData.light = true; g.add(o); }
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------------------------------------------------------------- stadiums (2x2)
function bowl(g, seatCols, roofCol, sx, sz) {
  const seats = canvasTex(64, 64, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = seatCols[i % seatCols.length]; x.fillRect(0, i * 4, w, 3); x.fillStyle = '#3a3d44'; x.fillRect(0, i * 4 + 3, w, 1); } });
  const prof = [[0.56, 0.03], [0.58, 0.05], [0.77, 0.2], [0.78, 0.22], [0.8, 0.22], [0.8, 0.0]].map(([a, b]) => new THREE.Vector2(a, b));
  const st = add(g, new THREE.LatheGeometry(prof, 64), new THREE.MeshStandardMaterial({ map: seats, roughness: 0.9, side: THREE.DoubleSide }));
  st.scale.set(sx, 1, sz);
  // outer facade with lit ribbon
  const fac = add(g, cyl(0.81, 0.83, 0.22, 64, true), std('#e9e6df', { ds: 1 }), 0, 0.11, 0); fac.scale.set(sx, 1, sz);
  const band = add(g, cyl(0.835, 0.835, 0.05, 64, true), std('#9fd0ff', { e: 1, ei: 0.3 }), 0, 0.15, 0, '#ffe7b0'); band.scale.set(sx, 1, sz);
  // roof canopy ring on masts
  const rp = [[0.68, 0.36], [0.86, 0.31], [0.86, 0.29], [0.68, 0.34]].map(([a, b]) => new THREE.Vector2(a, b));
  const roof = add(g, new THREE.LatheGeometry(rp, 64), new THREE.MeshStandardMaterial({ color: roofCol, roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide })); roof.scale.set(sx, 1, sz);
  const mm = std('#d9dde3', { m: 0.4, r: 0.4 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, x = Math.cos(a) * 0.86 * sx, z = Math.sin(a) * 0.86 * sz; rod(g, [x, 0, z], [x * 0.93, 0.35, z * 0.93], 0.012, mm); }
}
function floodlights(g, sx, sz) {
  const mm = std('#c9ced6', { m: 0.5, r: 0.4 });
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const x = a * 0.78 * sx, z = b * 0.78 * sz;
    rod(g, [x, 0, z], [x, 0.85, z], 0.018, mm);
    add(g, box(0.16, 0.1, 0.03), std('#f6f7f2', { e: 1, ei: 0.4 }), x, 0.88, z, '#fff6d8').lookAt(0, 0.6, 0);
  }
}
function pitch(g, w, d, kind) {
  const t = canvasTex(256, 160, (x, W, H) => {
    if (kind === 'track') { x.fillStyle = '#c2553f'; x.fillRect(0, 0, W, H); x.fillStyle = '#5aa346'; x.beginPath(); x.roundRect(30, 26, W - 60, H - 52, 52); x.fill(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; for (let i = 1; i < 5; i++) { x.beginPath(); x.roundRect(30 - i * 6, 26 - i * 5, W - 60 + i * 12, H - 52 + i * 10, 52 + i * 6); x.stroke(); } return; }
    for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#4f9a3f' : '#5ba849'; x.fillRect(i * W / 10, 0, W / 10, H); }
    x.strokeStyle = '#f4f4ee'; x.lineWidth = 2; x.strokeRect(10, 10, W - 20, H - 20); x.beginPath(); x.moveTo(W / 2, 10); x.lineTo(W / 2, H - 10); x.stroke();
    x.beginPath(); x.arc(W / 2, H / 2, 20, 0, 7); x.stroke(); x.strokeRect(10, H / 2 - 30, 30, 60); x.strokeRect(W - 40, H / 2 - 30, 30, 60);
  });
  const m = add(g, new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }), 0, 0.035, 0); m.rotation.x = -Math.PI / 2;
}
export function stadium(kind) {
  const g = new THREE.Group();
  if (kind === 2) {   // domed arena
    add(g, cyl(0.78, 0.8, 0.26, 64), std('#e4e1da'), 0, 0.13, 0);
    add(g, cyl(0.805, 0.805, 0.06, 64), std('#8fc4ff', { e: 1, ei: 0.3 }), 0, 0.2, 0, '#bfe0ff');
    const dome = add(g, new THREE.SphereGeometry(0.78, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), std('#f2f2ee', { r: 0.35, m: 0.1 }), 0, 0.26, 0); dome.scale.y = 0.42;
    const rib = std('#b9bec7', { m: 0.4 });
    for (let k = 0; k < 16; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.781, 0.008, 4, 48, Math.PI), rib); t.position.y = 0.26; t.rotation.y = k / 16 * Math.PI; t.scale.y = 0.42; g.add(t); }
    add(g, cyl(0.14, 0.14, 0.03, 32), std('#cfe7ff', { e: 1, ei: 0.4 }), 0, 0.6, 0, '#e8f4ff');
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; add(g, box(0.18, 0.12, 0.05), std('#2b3442'), Math.cos(a) * 0.8, 0.06, Math.sin(a) * 0.8).lookAt(0, 0.06, 0); }
    return g;
  }
  const sx = 1.12, sz = 0.86;
  pitch(g, kind ? 1.1 : 0.95, kind ? 0.8 : 0.6, kind ? 'track' : 'football');
  bowl(g, kind ? ['#2f6fd6', '#2a5fb8', '#f2f2f2', '#2f6fd6'] : ['#d63a3a', '#b82f2f', '#f2f2f2', '#d63a3a'], kind ? '#eef2f6' : '#f4f4f0', sx, sz);
  floodlights(g, sx, sz);
  return g;
}

// ---------------------------------------------------------------- TV / communication towers
export function tower(kind) {
  const g = new THREE.Group(), conc = std('#d8d4cc', { r: 0.7 }), glass = std('#8fb9df', { r: 0.2, m: 0.3 }), red = std('#d9473c'), white = std('#f4f2ec');
  const antenna = (y0, h, r = 0.02) => { const n = 6; for (let k = 0; k < n; k++) add(g, cyl(r * (1 - k / n * 0.6), r * (1 - (k - 1) / n * 0.6), h / n, 8), k % 2 ? white : red, 0, y0 + (k + 0.5) * h / n, 0); light(g, 0, y0 + h + 0.02, 0); };
  if (kind === 0) {   // concrete needle with a donut pod
    add(g, cyl(0.075, 0.13, 6.2, 24), conc, 0, 3.1, 0);
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3, m = add(g, box(0.06, 1.1, 0.42), conc, Math.cos(a) * 0.16, 0.55, Math.sin(a) * 0.16); m.rotation.y = -a; }
    const prof = [[0.07, 0], [0.3, 0.16], [0.36, 0.26], [0.36, 0.34], [0.28, 0.44], [0.07, 0.48]].map(([a, b]) => new THREE.Vector2(a, b));
    add(g, new THREE.LatheGeometry(prof, 48), conc, 0, 4.3, 0);
    add(g, cyl(0.365, 0.365, 0.07, 48), glass, 0, 4.6, 0, '#ffe2a0');
    add(g, cyl(0.15, 0.15, 0.14, 24), conc, 0, 5.5, 0); add(g, cyl(0.155, 0.155, 0.05, 24), glass, 0, 5.52, 0, '#ffe2a0');
    antenna(6.2, 2.2, 0.035);
    light(g, 0.36, 4.72, 0); light(g, -0.2, 4.72, 0.3);
  } else if (kind === 1) {   // red and white lattice tower
    const secs = [[0, 0.9, 0.42, 0.33], [0.9, 1.9, 0.33, 0.24], [1.9, 3.0, 0.24, 0.16], [3.0, 4.2, 0.16, 0.1], [4.2, 5.4, 0.1, 0.06]];
    secs.forEach(([y0, y1, a, b], i) => {
      const m = i % 2 ? white : red, C = (s, y) => [[s, y, s], [s, y, -s], [-s, y, -s], [-s, y, s]];
      const lo = C(a, y0), hi = C(b, y1);
      for (let k = 0; k < 4; k++) { rod(g, lo[k], hi[k], 0.022, m); const n = (k + 1) % 4; rod(g, lo[k], hi[n], 0.008, m); rod(g, lo[n], hi[k], 0.008, m); rod(g, hi[k], hi[n], 0.01, m); }
    });
    add(g, box(0.46, 0.16, 0.46), std('#f1efe8'), 0, 1.5, 0); add(g, box(0.47, 0.06, 0.47), glass, 0, 1.52, 0, '#ffe2a0');
    add(g, box(0.26, 0.12, 0.26), std('#f1efe8'), 0, 3.6, 0); add(g, box(0.27, 0.05, 0.27), glass, 0, 3.6, 0, '#ffe2a0');
    antenna(5.4, 1.3, 0.025);
    for (const [x, z] of [[0.42, 0.42], [-0.42, 0.42], [0.42, -0.42]]) add(g, box(0.12, 0.08, 0.12), conc, x, 0.04, z);
  } else if (kind === 2) {   // sphere tower
    add(g, cyl(0.07, 0.11, 5.2, 24), conc, 0, 2.6, 0);
    add(g, cyl(0.24, 0.28, 0.5, 24), conc, 0, 0.25, 0);
    add(g, new THREE.SphereGeometry(0.36, 48, 32), std('#c3cad2', { m: 0.5, r: 0.35 }), 0, 4.5, 0);
    add(g, cyl(0.362, 0.362, 0.1, 48), glass, 0, 4.5, 0, '#ffe2a0');
    antenna(4.86, 2.6, 0.04);
    light(g, 0.36, 4.6, 0);
  } else {   // telecom tower with dish clusters
    add(g, cyl(0.16, 0.2, 4.6, 32), std('#cfd3d8', { r: 0.5 }), 0, 2.3, 0);
    for (let k = 0; k < 8; k++) add(g, cyl(0.165, 0.165, 0.05, 32), glass, 0, 0.6 + k * 0.42, 0, k % 2 ? '#ffe2a0' : undefined);
    const dish = std('#f2f2ee', { r: 0.6 });
    for (const y of [3.1, 3.5, 3.9]) for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + y, d = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), dish);
      d.material.side = THREE.DoubleSide; d.position.set(Math.cos(a) * 0.24, y, Math.sin(a) * 0.24); d.lookAt(Math.cos(a) * 2, y, Math.sin(a) * 2); d.rotateX(-Math.PI / 2); g.add(d);
    }
    add(g, cyl(0.22, 0.22, 0.3, 32), std('#bfc5cc'), 0, 4.45, 0); add(g, cyl(0.225, 0.225, 0.08, 32), glass, 0, 4.45, 0, '#ffe2a0');
    antenna(4.6, 1.6, 0.03);
    add(g, box(0.5, 0.25, 0.36), std('#d9d4ca'), 0.1, 0.125, 0.18);
  }
  return g;
}

// ---------------------------------------------------------------- monuments
export function monument(kind) {
  const g = new THREE.Group();
  if (kind === 0) {   // five-storey pagoda
    const wall = std('#c8453b'), roof = std('#2f5d57', { r: 0.6 }), trim = std('#e8c46a', { m: 0.4, r: 0.4 });
    add(g, box(0.56, 0.08, 0.56), std('#d8d0c0'), 0, 0.04, 0);
    for (let k = 0; k < 5; k++) {
      const s = 0.36 - k * 0.045, y = 0.08 + k * 0.27;
      add(g, box(s, 0.17, s), wall, 0, y + 0.085, 0);
      add(g, box(s + 0.01, 0.05, s + 0.01), std('#ffd27a', { e: 1, ei: 0.2 }), 0, y + 0.1, 0, '#ffc870');
      const r = add(g, new THREE.ConeGeometry((s + 0.2) * 0.72, 0.12, 4), roof, 0, y + 0.23, 0); r.rotation.y = Math.PI / 4;
    }
    add(g, cyl(0.012, 0.02, 0.4, 8), trim, 0, 1.6, 0);
    for (let k = 0; k < 6; k++) add(g, new THREE.TorusGeometry(0.03, 0.006, 6, 16), trim, 0, 1.48 + k * 0.045, 0).rotation.x = Math.PI / 2;
    light(g, 0, 1.82, 0);
  } else if (kind === 1) {   // opera house with sail shells
    add(g, box(0.86, 0.12, 0.66), std('#d7c3a5'), 0, 0.06, 0);
    add(g, box(0.5, 0.06, 0.2), std('#cbb593'), 0.1, 0.03, 0.4);
    const shell = std('#f7f5ef', { r: 0.35 }), glass = std('#7fa4c4', { r: 0.2, m: 0.3 });
    const sails = [[-0.22, 0.42, 0.34, 0], [0.0, 0.5, 0.36, 0], [0.2, 0.38, 0.3, 0], [0.32, 0.26, 0.22, Math.PI], [-0.05, 0.3, 0.24, Math.PI]];
    sails.forEach(([x, h, r, rot]) => {
      const s = add(g, new THREE.SphereGeometry(r, 32, 16, 0, Math.PI, 0, Math.PI / 2), shell, x, 0.12, 0.08); s.material.side = THREE.DoubleSide;
      s.scale.set(0.7, h / r, 1); s.rotation.y = Math.PI / 2 + rot; s.rotation.z = 0.25;
      add(g, box(0.02, h * 0.55, r * 1.3), glass, x + (rot ? 0.1 : -0.1) * 0.7, 0.12 + h * 0.27, 0.08, '#ffe2a0');
    });
  } else if (kind === 2) {   // great seated statue on a lotus plinth
    const bronze = std('#8a6a3a', { m: 0.7, r: 0.35 }), stone = std('#cfc6b4');
    for (let k = 0; k < 3; k++) add(g, box(0.8 - k * 0.14, 0.07, 0.8 - k * 0.14), stone, 0, 0.035 + k * 0.07, 0);
    add(g, cyl(0.26, 0.2, 0.12, 24), std('#c99a52', { m: 0.5, r: 0.4 }), 0, 0.27, 0);
    const legs = add(g, new THREE.SphereGeometry(0.24, 24, 16), bronze, 0, 0.38, 0.02); legs.scale.set(1.1, 0.4, 0.8);
    const body = add(g, new THREE.SphereGeometry(0.17, 24, 16), bronze, 0, 0.56, -0.02); body.scale.set(1, 1.25, 0.8);
    add(g, new THREE.SphereGeometry(0.085, 24, 16), bronze, 0, 0.83, 0);
    add(g, new THREE.SphereGeometry(0.035, 12, 8), bronze, 0, 0.92, 0);
    const halo = add(g, new THREE.TorusGeometry(0.15, 0.012, 8, 32), std('#e8c46a', { m: 0.6, e: 1, ei: 0.15 }), 0, 0.82, -0.08, '#ffd27a');
    for (const s of [-1, 1]) add(g, new THREE.SphereGeometry(0.055, 12, 8), bronze, s * 0.14, 0.5, 0.06).scale.set(0.7, 1.6, 0.7);
    for (const [x, z] of [[0.36, 0.36], [-0.36, 0.36]]) { add(g, cyl(0.025, 0.03, 0.18, 8), stone, x, 0.29, z); add(g, new THREE.SphereGeometry(0.035, 10, 8), std('#ffe2a0', { e: 1, ei: 0.5 }), x, 0.4, z, '#ffd27a'); }
  } else if (kind === 3) {   // steel globe in a fountain
    add(g, cyl(0.44, 0.46, 0.06, 48), std('#cfc8b8'), 0, 0.03, 0);
    add(g, cyl(0.4, 0.4, 0.02, 48), std('#4aa8d8', { r: 0.15, m: 0.2 }), 0, 0.065, 0);
    add(g, cyl(0.05, 0.09, 0.25, 16), std('#9aa3ad', { m: 0.6 }), 0, 0.18, 0);
    const steel = std('#b9c2cc', { m: 0.8, r: 0.3 }), y = 0.58;
    for (let k = 0; k < 8; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.008, 6, 48), steel); t.position.y = y; t.rotation.y = k / 8 * Math.PI; g.add(t); }
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) { const r = 0.28 * Math.cos(a), t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 48), steel); t.position.y = y + 0.28 * Math.sin(a); t.rotation.x = Math.PI / 2; g.add(t); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.012, 6, 64), std('#e8c46a', { m: 0.6, e: 1, ei: 0.2 })); ring.position.y = y; ring.rotation.set(1.2, 0, 0.4); ring.userData.glow = '#ffd27a'; g.add(ring);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; rod(g, [Math.cos(a) * 0.36, 0.07, Math.sin(a) * 0.36], [Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3], 0.006, std('#dff3ff', { e: 1, ei: 0.4 }), '#cfeaff'); }
  } else if (kind === 4) {   // twin-spired cathedral
    const st = std('#d9cdb4'), roof = std('#5f6d7a', { r: 0.6 });
    add(g, box(0.34, 0.36, 0.7), st, 0, 0.18, -0.02);
    const sh = new THREE.Shape(); sh.moveTo(-0.18, 0); sh.lineTo(0.18, 0); sh.lineTo(0, 0.2); sh.closePath();
    const gab = add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: false }), roof, 0, 0.36, -0.37);
    add(g, box(0.6, 0.3, 0.2), st, 0, 0.15, -0.12); add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false }), roof, 0, 0.3, -0.22).scale.x = 1.7;
    for (const x of [-0.13, 0.13]) {
      add(g, box(0.15, 0.78, 0.15), st, x, 0.39, 0.3);
      const sp = add(g, new THREE.ConeGeometry(0.11, 0.42, 4), roof, x, 0.99, 0.3); sp.rotation.y = Math.PI / 4;
      add(g, box(0.152, 0.12, 0.1), std('#ffd890', { e: 1, ei: 0.2 }), x, 0.6, 0.33, '#ffc870');
    }
    const rose = add(g, new THREE.CircleGeometry(0.07, 24), std('#d65a7a', { e: 1, ei: 0.35 }), 0, 0.34, 0.33, '#ff9ab8');
    add(g, box(0.1, 0.16, 0.02), std('#3a2a20'), 0, 0.08, 0.34);
  } else {   // glass pyramid with fountains
    add(g, box(0.9, 0.04, 0.9), std('#e2dccd'), 0, 0.02, 0);
    for (const [x, z] of [[0.33, 0.33], [-0.33, 0.33], [0.33, -0.33]]) { const p = add(g, new THREE.ConeGeometry(0.12, 0.1, 3), std('#4aa8d8', { r: 0.1, m: 0.3 }), x, 0.06, z); p.rotation.y = 0.5; }
    const gl = new THREE.MeshStandardMaterial({ color: '#a9cde6', roughness: 0.08, metalness: 0.6, emissive: '#2a4a66', emissiveIntensity: 0.3 });
    const py = add(g, new THREE.ConeGeometry(0.38, 0.5, 4), gl, 0, 0.29, 0, '#ffe7b8'); py.rotation.y = Math.PI / 4;
    const frame = new THREE.Mesh(new THREE.ConeGeometry(0.382, 0.502, 4, 4, true), new THREE.MeshBasicMaterial({ color: '#40505f', wireframe: true })); frame.position.y = 0.29; frame.rotation.y = Math.PI / 4; g.add(frame);
    for (const [x, z] of [[-0.3, -0.3], [0.3, 0.3]]) add(g, new THREE.ConeGeometry(0.07, 0.1, 4), gl, x, 0.09, z).rotation.y = Math.PI / 4;
  }
  return g;
}

// ---------------------------------------------------------------- Chungking-style mansions
const MANSION = ['#cdbf9f', '#c9a9a0', '#a9b3a0', '#c2b9a8', '#a8b2bd', '#d1c3a3', '#b8a58c', '#bfc4b2'];
function facade(cols, rows, base, r, podium) {
  const cw = 6, ch = 6, W = cols * cw, H = rows * ch;
  const day = document.createElement('canvas'), mask = document.createElement('canvas'); day.width = mask.width = W; day.height = mask.height = H;
  const d = day.getContext('2d'), m = mask.getContext('2d');
  d.fillStyle = base; d.fillRect(0, 0, W, H); m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
  for (let i = 0; i < cols * 3; i++) { d.fillStyle = `rgba(40,34,28,${0.05 + r() * 0.12})`; d.fillRect(r() * W, r() * H * 0.3, 1 + r() * 2, H * (0.3 + r() * 0.7)); }   // grime streaks
  const curt = ['#2f3a46', '#3d4a3f', '#4a3c34', '#26303a', '#5a6470', '#7a8a96', '#3b3f52'];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const px = x * cw + 1, py = y * ch + 1, pod = y >= rows - podium;
    if (pod) continue;
    d.fillStyle = curt[(r() * curt.length) | 0]; d.fillRect(px, py, 4, 3);
    if (r() < 0.25) { d.fillStyle = '#d9d6cc'; d.fillRect(px - 1, py + 3, 6, 1); }            // window bars
    if (r() < 0.12) { d.fillStyle = ['#e04a4a', '#3d7bd9', '#e8c547', '#f2f2f2'][(r() * 4) | 0]; d.fillRect(px, py + 3, 4, 2); }   // laundry
    m.fillStyle = '#fff'; m.fillRect(px, py, 4, 3);
  }
  // podium: shopfronts and signs
  const pt = (rows - podium) * ch;
  d.fillStyle = '#4b4f57'; d.fillRect(0, pt, W, H - pt);
  for (let x = 0; x < cols; x += 2) { d.fillStyle = ['#ffcf6b', '#9fd8ff', '#ffe2b0'][(r() * 3) | 0]; d.fillRect(x * cw + 1, H - ch * 2 + 2, cw * 2 - 2, ch * 2 - 3); m.fillStyle = '#fff'; m.fillRect(x * cw + 1, H - ch * 2 + 2, cw * 2 - 2, ch * 2 - 3); }
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { day: tex(day), mask: tex(mask) };
}
export function mansion(seed) {
  const r = rng(seed), g = new THREE.Group(), base = MANSION[seed % MANSION.length];
  const w = 0.82, d = 0.62 + r() * 0.16, h = 2.0 + r() * 1.4, rows = Math.round(h * 11), podium = 3;
  const fx = facade(Math.round(d * 12), rows, base, r, podium), fz = facade(Math.round(w * 12), rows, base, r, podium);
  const roofM = std('#7d786e'), mk = t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  const mats = [mk(fx.day), mk(fx.day), roofM, roofM, mk(fz.day), mk(fz.day)];
  const black = new THREE.MeshBasicMaterial({ color: 0 }), mm = t => new THREE.MeshBasicMaterial({ map: t });
  const slab = add(g, box(w, h, d), mats, 0, h / 2, 0); slab.userData.maskMat = [mm(fx.mask), mm(fx.mask), black, black, mm(fz.mask), mm(fz.mask)];
  // air conditioners on the two faces we see
  const ac = std('#d6d4cc'), acD = std('#9a978e');
  for (let k = 0; k < 70; k++) {
    const onX = r() < 0.5, y = 0.35 + r() * (h - 0.45), t = (r() - 0.5) * (onX ? d : w) * 0.92;
    const u = add(g, box(onX ? 0.03 : 0.045, 0.028, onX ? 0.045 : 0.03), r() < 0.7 ? ac : acD, onX ? w / 2 + 0.015 : t, y, onX ? t : d / 2 + 0.015);
  }
  // vertical neon signs over the street
  const NEON = ['#ff3d6e', '#35e0ff', '#ffd23d', '#7dff6a', '#ff7b2e', '#c46bff'];
  for (let k = 0; k < 5; k++) {
    const col = NEON[(r() * NEON.length) | 0], onX = k % 2 === 0, t = (r() - 0.5) * (onX ? d : w) * 0.8, sh = 0.18 + r() * 0.25, y = 0.16 + sh / 2 + r() * 0.2;
    add(g, box(onX ? 0.11 : 0.016, sh, onX ? 0.016 : 0.11), std(col, { e: 1, ei: 0.55 }), onX ? w / 2 + 0.06 : t, y, onX ? t : d / 2 + 0.06, col);
  }
  // rooftop clutter: water tanks, huts, antennas
  const tank = std('#5c7f9a'), hut = std('#9a9286');
  add(g, box(w * 0.3, 0.1, d * 0.3), hut, -w * 0.2, h + 0.05, -d * 0.15);
  for (let k = 0; k < 3; k++) add(g, cyl(0.045, 0.045, 0.08, 12), tank, (r() - 0.3) * w * 0.6, h + 0.04, (r() - 0.3) * d * 0.6);
  const ant = std('#5a5f66');
  for (let k = 0; k < 4; k++) { const x = (r() - 0.5) * w * 0.8, z = (r() - 0.5) * d * 0.8; rod(g, [x, h, z], [x, h + 0.12 + r() * 0.18, z], 0.004, ant); }
  return g;
}
export { gen } from './buildings.js';
