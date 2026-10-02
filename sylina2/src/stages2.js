// Décors de la partie 2 (domaine de Sylina) : Terre sainte de Mary Geoise (esplanade de marbre, château de Pangée),
// le ciel au-dessus des nuages divins (îlots de marbre flottants), lune rouge + œil d'Imu sur le trône vide,
// mer qui gèle (Ice Age) et soleil noir. Nuages divins volumétriques (amas de billboards éclairés).
import * as THREE from 'three';
import { S, rand, tw, clamp } from './engine.js';

const V3 = THREE.Vector3, C = c => new THREE.Color(c);
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}
const NOISE = /* glsl */`
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n2(p); p *= 2.03; a *= 0.5; } return v; }`;

export const PAL2 = {
  holyDusk: { top: 0x3a5aa8, hor: 0xffc890, glow: 0xffa860, cloud: 0xfff0dc, cloudA: 0.55, stars: 0, sun: 0xfff0c0, sunDir: [-0.35, 0.16, -1], below: 0xf8e0c8,
    fog: 0xe8c8b0, fogD: 0.0035, hemiS: 0x8aa0e0, hemiG: 0x6a4a40, hemiI: 0.6, key: 0xffe0b0, keyI: 2.8, keyPos: [-7, 11, -9], rim: 0xffc070, rimI: 1.6, exp: 0.6, moon: false, bT: 2.4, bS: 0.45 },
  holyDark: { top: 0x06040c, hor: 0x40204a, glow: 0x8a2a60, cloud: 0x3a2040, cloudA: 0.9, stars: 0.2, sun: 0x401020, sunDir: [-0.35, 0.16, -1], below: 0x201020,
    fog: 0x2a1828, fogD: 0.008, hemiS: 0x8060a8, hemiG: 0x201018, hemiI: 0.8, key: 0xe0c0ff, keyI: 2.0, keyPos: [-7, 11, -9], rim: 0xc040ff, rimI: 2.2, exp: 1.0, moon: false, bT: 1.6, bS: 0.55 },
  holyDawn: { top: 0x2a4a98, hor: 0xffb878, glow: 0xff9050, cloud: 0xffe6d0, cloudA: 0.6, stars: 0, sun: 0xffe8b8, sunDir: [0.1, 0.07, -1], below: 0xf0d0b8,
    fog: 0xdcb8a0, fogD: 0.004, hemiS: 0x90a8e0, hemiG: 0x7a5a48, hemiI: 0.8, key: 0xffd8a8, keyI: 2.5, keyPos: [1, 6, -12], rim: 0xffb070, rimI: 1.4, exp: 0.66, moon: false, bT: 2.4, bS: 0.45 },
  heaven: { top: 0x1c48b0, hor: 0xffe2b0, glow: 0xffc070, cloud: 0xffffff, cloudA: 0.35, stars: 0, sun: 0xfff4d0, sunDir: [0.3, 0.22, -1], below: 0xfff0e0,
    fog: 0xf0dcc8, fogD: 0.0025, hemiS: 0xa8c0f0, hemiG: 0xd0b090, hemiI: 0.9, key: 0xfff0d0, keyI: 2.5, keyPos: [5, 12, -8], rim: 0xffd890, rimI: 1.5, exp: 0.56, moon: false, bT: 2.4, bS: 0.45 },
  heavenIce: { top: 0x10204a, hor: 0x9ad0f0, glow: 0x7ab8ff, cloud: 0xe0f4ff, cloudA: 0.5, stars: 0.1, sun: 0xe0f0ff, sunDir: [0.3, 0.22, -1], below: 0xd8eeff,
    fog: 0xa8c8e0, fogD: 0.004, hemiS: 0xa0c8ff, hemiG: 0x8aa8c0, hemiI: 1.0, key: 0xe8f4ff, keyI: 2.3, keyPos: [5, 12, -8], rim: 0x8fe8ff, rimI: 2.0, exp: 0.62, moon: false, bT: 2.0, bS: 0.5 },
  voidRed: { top: 0x000000, hor: 0x2a0408, glow: 0x6a0818, cloud: 0x1a0408, cloudA: 1, stars: 0.3, sun: 0x000000, sunDir: [0, 0.3, -1], below: 0x0a0204,
    fog: 0x0c0204, fogD: 0.04, hemiS: 0x603848, hemiG: 0x0a0204, hemiI: 0.7, key: 0xffd0d8, keyI: 1.9, keyPos: [4, 12, 6], rim: 0xff2040, rimI: 1.8, exp: 1.0, moon: false, bT: 1.6, bS: 0.55 },
  eclipse: { top: 0x020306, hor: 0x1a2a40, glow: 0x30406a, cloud: 0x10141c, cloudA: 1, stars: 0.6, sun: 0x000000, sunDir: [0, 0.35, -1], below: 0x0a1018,
    fog: 0x101824, fogD: 0.012, hemiS: 0x7090c0, hemiG: 0x101418, hemiI: 1.0, key: 0xd0e4ff, keyI: 2.2, keyPos: [-6, 12, 8], rim: 0x8fe8ff, rimI: 2.2, exp: 1.05, moon: false, bT: 1.6, bS: 0.55 },
};

/* ---------------- nuages divins : amas de billboards (texture fbm), dessus doré / dessous lavande ---------------- */
let PUFF = null;
function puffTex() {
  if (PUFF) return PUFF;
  PUFF = canvasTex(256, 256, (x, w, h) => {
    const img = x.createImageData(w, h), d = img.data;
    const hs = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    const vn = (u, v) => { const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, a = hs(i, j), b = hs(i + 1, j), c = hs(i, j + 1), e = hs(i + 1, j + 1), su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv); return a + (b - a) * su + (c - a) * sv + (a - b - c + e) * su * sv; };
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const u = xx / w - 0.5, v = y / h - 0.5, r = Math.sqrt(u * u + v * v) * 2;
      let n = 0, a = 0.5, f = 4; for (let o = 0; o < 5; o++) { n += a * vn(xx / w * f + 7, y / h * f + 3); a *= 0.5; f *= 2.1; }
      const m = Math.max(0, 1 - r * (0.85 + 0.5 * (1 - n))); const al = Math.pow(m, 0.8) * 255;
      const sh = 1 - Math.max(0, v) * 0.9;                         // dessous plus sombre (teinté par la couleur d'ombre)
      const i4 = (y * w + xx) * 4; d[i4] = 255 * sh; d[i4 + 1] = 255 * sh; d[i4 + 2] = 255 * sh; d[i4 + 3] = al;
    }
    x.putImageData(img, 0, 0);
  });
  return PUFF;
}
// matériau : couleur lumière/ombre selon la hauteur dans le sprite (via vertex colors impossibles sur Sprite -> shader dédié)
function cloudMat(lit, shade, op = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: puffTex() }, uLit: { value: C(lit) }, uShade: { value: C(shade) }, uA: { value: op }, uRim: { value: C(0xffffff) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); vec2 sc = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz)); mv.xy += position.xy * sc; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 uLit, uShade, uRim; uniform float uA; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); float l = t.r; vec3 col = mix(uShade, uLit, l); col += uRim * pow(1.0 - t.a, 3.0) * 0.25 * l; gl_FragColor = vec4(col, t.a * uA); }`,
    transparent: true, depthWrite: false, fog: false,
  });
}
export class CloudBank {
  constructor(parent) { this.g = new THREE.Group(); parent.add(this.g); this.mats = []; this.list = []; }
  // amas : n bouffées autour d'un centre, dôme arrondi par dessus
  cluster(c, R, n, lit, shade, op = 1, flat = 0.45) {
    const mat = cloudMat(lit, shade, op); this.mats.push(mat);
    for (let i = 0; i < n; i++) {
      const a = rand(6.28), r = Math.sqrt(Math.random()) * R, y = (1 - r / R) * R * flat * rand(0.5, 1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); m.position.set(c.x + Math.cos(a) * r, c.y + y, c.z + Math.sin(a) * r * 0.7);
      m.scale.setScalar(R * rand(0.45, 0.85)); m.renderOrder = -3; m.frustumCulled = false; this.g.add(m); this.list.push({ m, ph: rand(6), base: m.position.clone() });
    }
    return mat;
  }
  setCols(lit, shade, rim) { this.mats.forEach(m => { m.uniforms.uLit.value.set(lit); m.uniforms.uShade.value.set(shade); if (rim) m.uniforms.uRim.value.set(rim); }); }
  update(t) { for (const o of this.list) { o.m.position.x = o.base.x + Math.sin(t * 0.05 + o.ph) * 0.6; o.m.position.y = o.base.y + Math.sin(t * 0.13 + o.ph) * 0.25; } }
}

/* ---------------- matières ---------------- */
function marbleTex(base = '#efe9df', vein = 'rgba(120,110,130,', rep) {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { const v = rand(-10, 10) | 0; x.fillStyle = `rgba(${200 + v},${196 + v},${190 + v},.18)`; x.fillRect(rand(w), rand(h), rand(2, 8), rand(2, 8)); }
    x.filter = 'blur(1.5px)';
    for (let i = 0; i < 14; i++) { x.strokeStyle = vein + rand(0.12, 0.35) + ')'; x.lineWidth = rand(0.6, 2.4); x.beginPath(); let px = rand(w), py = rand(h); x.moveTo(px, py); for (let k = 0; k < 9; k++) { px += rand(-60, 60); py += rand(-30, 60); x.lineTo(px, py); } x.stroke(); }
    x.filter = 'none';
  }, rep);
}

export function buildStages2(root, W, renderer, env, ST, PAL) {
  Object.assign(PAL, PAL2);
  const gold = new THREE.MeshStandardMaterial({ color: 0xe0b050, metalness: 1, roughness: 0.28, envMap: env, envMapIntensity: 1.2 });
  const marbleT = marbleTex(), marble = new THREE.MeshStandardMaterial({ map: marbleT, roughness: 0.32, metalness: 0.05, envMap: env, envMapIntensity: 0.55 });
  const marbleDark = new THREE.MeshStandardMaterial({ color: 0xcfc6ba, roughness: 0.5, envMap: env, envMapIntensity: 0.3 });
  ST.tileSets = ST.tileSets || {};
  const tileField = (g, N, sz, cx, cz, mat, inside) => {
    const geo = new THREE.BoxGeometry(sz - 0.04, 0.24, sz - 0.04), list = [], m4 = new THREE.Matrix4(); let n = 0;
    const cells = []; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const x = (a - N / 2 + 0.5) * sz + cx, z = (b - N / 2 + 0.5) * sz + cz; if (!inside || inside(x, z)) cells.push([x, z]); }
    const mesh = new THREE.InstancedMesh(geo, mat, cells.length); mesh.receiveShadow = true;
    for (const [x, z] of cells) { m4.makeTranslation(x, -0.12, z); mesh.setMatrixAt(n, m4); list.push({ x, z, i: n, gone: false }); n++; }
    g.add(mesh); return { tiles: list, tileMesh: mesh, tileGeo: geo, tileMat: mat };
  };

  /* ======================= TERRE SAINTE (Mary Geoise) ======================= */
  {
    const g = new THREE.Group(); g.visible = false; root.add(g); ST.groups.holy = g;
    // esplanade circulaire de marbre (dalles cassables) + incrustations d'or
    const R = 19;
    ST.tileSets.holy = tileField(g, 28, 1.5, 0, 0, marble, (x, z) => Math.hypot(x, z) < R);
    const inlay = canvasTex(2048, 2048, (x, w, h) => {
      x.translate(w / 2, h / 2); x.strokeStyle = '#d8a84a'; x.fillStyle = '#d8a84a'; x.lineCap = 'round';
      const k = w / 2 / R;
      for (const [r, lw] of [[18.6, 10], [17.8, 4], [12, 6], [11.4, 3], [6, 6], [2.2, 5]]) { x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r * k, 0, 7); x.stroke(); }
      x.lineWidth = 5; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r1 = i % 2 ? 6 : 2.2; x.beginPath(); x.moveTo(Math.cos(a) * r1 * k, Math.sin(a) * r1 * k); x.lineTo(Math.cos(a) * 11.4 * k, Math.sin(a) * 11.4 * k); x.stroke(); }
      x.beginPath(); for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 4.2 : 6; x.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k); } x.stroke();
      x.font = `bold ${0.55 * k}px serif`; const gl = '天竜人聖地神騎士虚空'; for (let i = 0; i < 48; i++) { x.save(); x.rotate(i / 48 * Math.PI * 2); x.fillText(gl[i % gl.length], -0.25 * k, -14.6 * k); x.restore(); }
    });
    const inl = new THREE.Mesh(new THREE.CircleGeometry(R, 96), new THREE.MeshStandardMaterial({ map: inlay, transparent: true, metalness: 0.9, roughness: 0.3, envMap: env, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    inl.rotation.x = -Math.PI / 2; inl.position.y = 0.006; inl.renderOrder = 1; g.add(inl); ST.holyInlay = inl;
    // socle (falaise de la Red Line sous l'esplanade)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.4, R * 0.75, 30, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x9a5a48, roughness: 0.95, flatShading: true }));
    base.position.y = -15.2; g.add(base);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(R + 0.2, 0.35, 8, 96), marbleDark); lip.rotation.x = Math.PI / 2; lip.position.y = -0.2; g.add(lip);
    // balustrade (ouverte vers l'escalier au fond)
    const balu = new THREE.Group(); g.add(balu);
    for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) + Math.PI / 2) < 0.22) continue;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.9, 8), marbleDark); p.position.set(Math.cos(a) * (R - 0.2), 0.45, Math.sin(a) * (R - 0.2)); balu.add(p); }
    const rail = new THREE.Mesh(new THREE.TorusGeometry(R - 0.2, 0.1, 6, 120, Math.PI * 2 - 0.44), marbleDark); rail.rotation.set(Math.PI / 2, 0, -Math.PI / 2 + 0.22); rail.position.y = 0.95; balu.add(rail);
    // colonnade (12 colonnes cassables, groupes) — aux 2/3 du rayon pour encadrer sans gêner
    ST.holyCols = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + Math.PI / 12; const P = new THREE.Group(); P.position.set(Math.cos(a) * 15, 0, Math.sin(a) * 15);
      const b0 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), marbleDark); b0.position.y = 0.25; P.add(b0);
      for (let k = 0; k < 5; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 1.6, 20), marble); d.position.y = 0.5 + 0.8 + k * 1.6; d.castShadow = true; P.add(d); }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.55, 0.5, 20), gold); cap.position.y = 8.75; P.add(cap);
      const ab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 1.7), marbleDark); ab.position.y = 9.15; P.add(ab);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.05, 6, 24), gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.55; P.add(ring);
      g.add(P); ST.holyCols.push(P);
    }
    // grand escalier vers le château
    const stairs = new THREE.Group(); g.add(stairs);
    for (let k = 0; k < 26; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(9 - k * 0.08, 0.32, 1.1), k % 2 ? marble : marbleDark); st.position.set(0, -0.05 + k * 0.32, -R - 0.4 - k * 0.95); st.receiveShadow = true; stairs.add(st); }
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const lp = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.4, 10), gold); p.position.y = 1.2; lp.add(p);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); fl.position.y = 2.55; lp.add(fl);
      lp.position.set(s * 4.9, k * 1.6 * 0.32 * 3, -R - 1 - k * 2.85 * 1.6); stairs.add(lp); }
    // banderoles
    const banT = canvasTex(128, 512, (x, w, h) => { x.fillStyle = '#f4ecdc'; x.fillRect(0, 0, w, h); x.fillStyle = '#c99a3a'; x.fillRect(0, 0, w, 18); x.fillRect(0, h - 40, w, 10);
      x.strokeStyle = '#c99a3a'; x.lineWidth = 6; x.beginPath(); x.arc(64, 200, 38, 0, 7); x.stroke(); x.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; x.lineTo(64 + Math.cos(a) * 32, 200 + Math.sin(a) * 32); } x.closePath(); x.stroke(); });
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 5.5), new THREE.MeshStandardMaterial({ map: banT, side: THREE.DoubleSide, roughness: 0.8 })); b.position.set(s * 6.2, 6 + k * 2.4, -R - 6 - k * 7.5); g.add(b); }
    // château de Pangée (fond)
    const castle = new THREE.Group(); castle.position.set(0, 8, -62); g.add(castle); ST.castle = castle;
    const white = new THREE.MeshStandardMaterial({ color: 0xf6f0e6, roughness: 0.55, envMap: env, envMapIntensity: 0.4 });
    const roof = new THREE.MeshStandardMaterial({ color: 0xd8a040, metalness: 0.85, roughness: 0.3, envMap: env });
    const win = new THREE.MeshBasicMaterial({ color: 0xffe2a0 });
    const tower = (x, z, r, h, spire = 1) => {
      const t = new THREE.Group(); t.position.set(x, 0, z);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 24), white); b.position.y = h / 2; t.add(b);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.06, r * 0.06, 6, 32), roof); ring.rotation.x = Math.PI / 2; ring.position.y = h * 0.98; t.add(ring);
      const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, h * 0.55 * spire, 24), roof); c.position.y = h + h * 0.27 * spire; t.add(c);
      for (let k = 0; k < 8; k++) for (let j = 1; j < 4; j++) { const a = k / 8 * Math.PI * 2; const w = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.18, r * 0.5), win); w.position.set(Math.cos(a) * r * 1.01, h * j / 4, Math.sin(a) * r * 1.01); w.lookAt(Math.cos(a) * r * 3, h * j / 4, Math.sin(a) * r * 3); t.add(w); }
      castle.add(t); return t;
    };
    const keep = new THREE.Mesh(new THREE.BoxGeometry(34, 26, 20), white); keep.position.set(0, 13, -6); castle.add(keep);
    for (let i = 0; i < 9; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.5), win); w.position.set(-14 + i * 3.5, 15, 4.02); castle.add(w); const w2 = w.clone(); w2.position.y = 7; castle.add(w2); }
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(6, 10), new THREE.MeshBasicMaterial({ color: 0x2a1a10 })); gate.position.set(0, 5, 4.03); castle.add(gate);
    tower(0, -8, 6, 46, 1.4); tower(-17, 0, 4, 34); tower(17, 0, 4, 34); tower(-26, -12, 3.5, 28); tower(26, -12, 3.5, 28); tower(-9, -16, 3, 40, 1.2); tower(9, -16, 3, 40, 1.2);
    // le Trône vide en haut des marches (épilogue)
    const thr = new THREE.Group(); thr.position.set(0, 8.3, -R - 26); g.add(thr); ST.holyThrone = thr;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 2), white); seat.position.y = 0.5; thr.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 0.5), white); back.position.set(0, 2.5, -0.9); thr.add(back);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 6, 5), roof); crown.position.set(0, 5.6, -0.9); thr.add(crown);
    // pétales (blancs et or) qui tombent
    const PN = 420, pet = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.045), new THREE.MeshLambertMaterial({ color: 0xfff4f0, side: THREE.DoubleSide, emissive: 0x403020 }), PN);
    pet.frustumCulled = false; g.add(pet); ST.petals = { mesh: pet, d: [] };
    for (let i = 0; i < PN; i++) ST.petals.d.push({ p: new V3(rand(-20, 20), rand(0, 12), rand(-18, 12)), r: new THREE.Euler(rand(6), rand(6), rand(6)), v: rand(0.25, 0.6), ph: rand(6) });
    // nuages divins sous l'esplanade et à l'horizon
    const cb = new CloudBank(g); ST.holyClouds = cb;
    for (let i = 0; i < 20; i++) { const a = rand(6.28), r = rand(32, 90); cb.cluster(new V3(Math.cos(a) * r, rand(-14, -6), Math.sin(a) * r), rand(9, 18), 7, 0xfff2dc, 0xc8a8c8, 1, 0.5); }
    for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + rand(-1.4, 1.4), r = rand(140, 260); cb.cluster(new V3(Math.cos(a) * r, rand(-10, 30), Math.sin(a) * r), rand(30, 55), 6, 0xffe8c8, 0xb898b8, 0.9, 0.6); }
    // rayons divins (cônes additifs depuis le soleil)
    ST.rays = [];
    const rayT = canvasTex(64, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.2, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      const gx = x.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = gx; x.fillRect(0, 0, w, h); });
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(rand(5, 12), 140), new THREE.MeshBasicMaterial({ map: rayT, color: 0xffe0a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.12, fog: false, side: THREE.DoubleSide }));
      m.position.set(-40 + i * 12 + rand(-4, 4), 50, -90 + rand(-10, 10)); m.rotation.set(0, rand(-0.3, 0.3), 0.55 + rand(-0.1, 0.1)); m.renderOrder = -1; g.add(m); ST.rays.push(m); }
  }

  /* ======================= LE CIEL DIVIN (au-dessus des nuages) ======================= */
  {
    const g = new THREE.Group(); g.visible = false; root.add(g); ST.groups.heaven = g;
    const seaU = { uTime: { value: 0 }, uLit: { value: C(0xfff0dc) }, uShade: { value: C(0x9a84b8) }, uHor: { value: C(0xffe0b8) }, uSun: { value: new V3(0.3, 0.22, -1).normalize() }, uIce: { value: 0 }, uIceC: { value: new THREE.Vector2(0, 0) }, uIceR: { value: 0 } };
    ST.u.push(seaU); ST.heavenSea = seaU;
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 200, 200), new THREE.ShaderMaterial({
      uniforms: seaU, fog: false,
      vertexShader: NOISE + `uniform float uTime, uIceR; uniform vec2 uIceC; varying vec3 vW; varying float vH, vI;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec2 p = w.xz * 0.02 + vec2(uTime * 0.006, uTime * 0.003);
          float hgt = fbm(p) * 0.75 + fbm(p * 2.7 + 3.0) * 0.25; float ice = 1.0 - smoothstep(uIceR - 25.0, uIceR, length(w.xz - uIceC));
          vI = ice; vH = hgt; w.y += (hgt - 0.5) * mix(26.0, 4.0, ice); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: NOISE + `uniform float uTime, uIce; uniform vec3 uLit, uShade, uHor, uSun; varying vec3 vW; varying float vH, vI;
        void main(){ vec2 p = vW.xz * 0.02 + vec2(uTime * 0.006, uTime * 0.003);
          float e = 0.6; float hx = fbm(p + vec2(e * 0.02, 0.0)) - fbm(p - vec2(e * 0.02, 0.0)); float hz = fbm(p + vec2(0.0, e * 0.02)) - fbm(p - vec2(0.0, e * 0.02));
          vec3 n = normalize(vec3(-hx * 18.0, 1.0, -hz * 18.0)); float l = clamp(dot(n, normalize(vec3(uSun.x, 0.6, uSun.z))) * 0.6 + 0.5, 0.0, 1.0);
          float sss = smoothstep(0.3, 0.75, vH);
          vec3 col = mix(uShade, uLit, l * 0.7 + sss * 0.4);
          vec3 v = normalize(cameraPosition - vW); col += uLit * pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.25;
          // glace (Ice Age) : plaque bleutée, fissures, scintillement
          if (vI > 0.001) { float cr = abs(fbm(vW.xz * 0.15) - 0.5); float crack = 1.0 - smoothstep(0.0, 0.025, cr);
            vec3 ic = mix(vec3(0.3, 0.55, 0.75), vec3(0.75, 0.9, 1.0), l) - crack * 0.3; float sp = step(0.995, h2(floor(vW.xz * 4.0))) * (0.5 + 0.5 * sin(uTime * 4.0 + vW.x));
            ic += sp * 1.2; col = mix(col, ic, vI); }
          float d = length(vW.xz - cameraPosition.xz); col = mix(col, uHor, smoothstep(120.0, 900.0, d));
          gl_FragColor = vec4(col, 1.0); }`,
    }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -26; g.add(sea); ST.heavenSeaMesh = sea;
    // amas de nuages qui dépassent
    const cb = new CloudBank(g); ST.heavenClouds = cb;
    for (let i = 0; i < 26; i++) { const a = rand(6.28), r = rand(26, 140); cb.cluster(new V3(Math.cos(a) * r, rand(-22, -8), Math.sin(a) * r - 10), rand(10, 26), 7, 0xfff6e8, 0xc0a8d0, 1, 0.7); }
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + rand(-0.9, 0.9), r = rand(180, 300); cb.cluster(new V3(Math.cos(a) * r, rand(10, 60), Math.sin(a) * r), rand(40, 70), 6, 0xffffff, 0xd0b8d8, 0.95, 0.8); }
    // grand halo dans le ciel
    const ringM = new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const halo = new THREE.Group(); halo.position.set(30, 70, -240); g.add(halo); ST.skyHalo = halo;
    halo.add(new THREE.Mesh(new THREE.TorusGeometry(46, 1.0, 8, 128), ringM)); halo.add(new THREE.Mesh(new THREE.TorusGeometry(52, 0.35, 6, 128), ringM));
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, s = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7, 4), ringM); s.position.set(Math.cos(a) * 57, Math.sin(a) * 57, 0); s.rotation.z = a - Math.PI / 2; halo.add(s); }
    halo.lookAt(0, 0, 0);
    // îlots de marbre flottants (plateforme centrale + îlots pour les sauts)
    const isl = (x, y, z, r, cols = 0) => {
      const G = new THREE.Group(); G.position.set(x, y, z);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, 0.6, 10), marble); top.position.y = -0.3; top.receiveShadow = true; top.castShadow = true; G.add(top);
      const und = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.95, 1), new THREE.MeshStandardMaterial({ color: 0xc8b8a4, roughness: 0.95, flatShading: true })); und.scale.set(1, 1.15, 1); und.position.y = -0.55 - r * 0.95; G.add(und);
      const und2 = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.55, 0), und.material); und2.position.set(r * 0.2, -0.6 - r * 1.9, -r * 0.1); G.add(und2);
      const tr = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.07, 6, 48), gold); tr.rotation.x = Math.PI / 2; tr.position.y = 0.01; G.add(tr);
      for (let k = 0; k < cols; k++) { const a = k / cols * Math.PI * 2 + 0.3, h = rand(1.2, 4.5); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, h, 14), marble); c.position.set(Math.cos(a) * r * 0.8, h / 2, Math.sin(a) * r * 0.8); c.castShadow = true; G.add(c); }
      G.userData = { y0: y, ph: rand(6), r }; g.add(G); return G;
    };
    ST.isles = [];
    const main = isl(0, 0, 0, 9, 0); ST.mainIsle = main;
    ST.tileSets.heaven = null;
    const inl2 = new THREE.Mesh(new THREE.CircleGeometry(8.8, 64), new THREE.MeshStandardMaterial({ map: ST.holyInlay.material.map, transparent: true, metalness: 0.9, roughness: 0.3, envMap: env, depthWrite: false })); inl2.rotation.x = -Math.PI / 2; inl2.position.y = 0.01; inl2.scale.setScalar(1); main.add(inl2);
    for (const [x, y, z, r, c] of [[-13, 4, -7, 3, 2], [12, 7, -12, 3.2, 3], [0, 13, -24, 4, 4], [-9, -4, 10, 2.6, 1], [15, -1.5, 5, 2.4, 1], [-22, 9, -22, 2.8, 2], [24, 15, -30, 3.5, 3]]) ST.isles.push(isl(x, y, z, r, c));
    // colonnes brisées autour de la plateforme (cassables)
    ST.heavenCols = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.5, P = new THREE.Group(); P.position.set(Math.cos(a) * 7.6, 0, Math.sin(a) * 7.6);
      const n = 2 + (i % 3); for (let k = 0; k < n; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 1.4, 16), marble); d.position.y = 0.7 + k * 1.4; d.castShadow = true; P.add(d); }
      main.add(P); ST.heavenCols.push(P); }
  }

  /* ======================= ajouts : trône vide (lune rouge, œil d'Imu) ======================= */
  {
    const g = ST.groups.void;
    const moonT = canvasTex(512, 512, (x, w, h) => { const r = x.createRadialGradient(240, 230, 20, 256, 256, 250); r.addColorStop(0, '#ff8a70'); r.addColorStop(0.7, '#c01a20'); r.addColorStop(1, '#600408');
      x.fillStyle = r; x.beginPath(); x.arc(256, 256, 250, 0, 7); x.fill(); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(60,0,0,${rand(0.1, 0.3)})`; x.beginPath(); x.arc(rand(80, 430), rand(80, 430), rand(8, 40), 0, 7); x.fill(); } });
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ map: moonT, transparent: true, fog: false, depthWrite: false, opacity: 0 }));
    moon.position.set(-50, 60, -140); moon.lookAt(0, 0, 0); moon.renderOrder = -4; g.add(moon); ST.redMoon = moon;
    const eyeU = { uOpen: { value: 0 }, uTime: { value: 0 }, uA: { value: 0 } }; ST.u.push(eyeU); ST.eyeU = eyeU;
    const eye = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.ShaderMaterial({ uniforms: eyeU, transparent: true, depthWrite: false, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: NOISE + `uniform float uOpen, uTime, uA; varying vec2 vUv; void main(){ vec2 p = (vUv - 0.5) * vec2(2.0, 1.0); float lid = (1.0 - p.x * p.x) * 0.48 * uOpen; float inside = smoothstep(lid, lid - 0.02, abs(p.y));
        float r = length(p * vec2(1.0, 1.15)); vec3 col = vec3(0.95, 0.92, 0.9) * (0.7 + 0.3 * fbm(p * 8.0)); col = mix(col, vec3(0.02), smoothstep(0.24, 0.22, r)); col = mix(col, vec3(1.0), smoothstep(0.07, 0.05, abs(r - 0.15)) * 0.9);
        col += vec3(0.9, 0.05, 0.1) * smoothstep(0.3, 0.0, abs(r - 0.22)) * 0.3;
        float rim = smoothstep(0.035, 0.0, abs(abs(p.y) - lid)) * step(0.001, uOpen) * (1.0 - p.x * p.x);
        gl_FragColor = vec4(col * inside + vec3(1.0, 0.2, 0.3) * rim, (inside + rim * 0.8) * uA); }` }));
    eye.position.set(0, 30, -70); eye.renderOrder = -2; g.add(eye); ST.imuEye = eye;
  }

  /* ======================= ajouts : océan (gel) + soleil noir ======================= */
  {
    const g = ST.groups.cliff, u = ST.oceanU;
    u.uIce = { value: 0 }; u.uIceC = { value: new THREE.Vector2(0, -4) }; u.uIceR = { value: 0 };
    const mat = ST.ocean.children[0].material;
    mat.vertexShader = mat.vertexShader.replace('uniform float uTime, uAmp;', 'uniform float uTime, uAmp, uIceR; uniform vec2 uIceC; varying float vI;')
      .replace('float hgt = wave(w.xz) * uAmp;', 'vI = 1.0 - smoothstep(uIceR - 30.0, uIceR, length(w.xz - uIceC)); float hgt = wave(w.xz) * uAmp * (1.0 - vI * 0.85);');
    mat.fragmentShader = mat.fragmentShader.replace('varying vec3 vW; varying float vH;', 'varying vec3 vW; varying float vH; varying float vI;')
      .replace('float d = length(vW.xz - cameraPosition.xz);', `if (vI > 0.001) { float cr = abs(fbm(vW.xz * 0.12) - 0.5); float crack = 1.0 - smoothstep(0.0, 0.02, cr); float l = 0.6 + 0.4 * fbm(vW.xz * 0.05);
          vec3 ic = mix(vec3(0.16, 0.34, 0.5), vec3(0.55, 0.76, 0.9), l) - crack * 0.25 + step(0.996, h2(floor(vW.xz * 5.0))) * 1.5 * (0.5 + 0.5 * sin(uTime * 5.0 + vW.z));
          ic += uSun * pow(max(dot(reflect(-v, vec3(0.0, 1.0, 0.0)), normalize(uSunDir)), 0.0), 40.0) * 1.2; col = mix(col, ic, vI); }
        float d = length(vW.xz - cameraPosition.xz);`);
    mat.needsUpdate = true;
    // soleil noir (éclipse) : disque noir + couronne
    const cor = canvasTex(512, 512, (x, w, h) => { x.translate(256, 256); const r = x.createRadialGradient(0, 0, 90, 0, 0, 256); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.08, 'rgba(200,230,255,.9)'); r.addColorStop(0.4, 'rgba(120,160,255,.25)'); r.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = r; x.fillRect(-256, -256, 512, 512); x.strokeStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 80; i++) { const a = rand(6.28), l = rand(100, 240); x.lineWidth = rand(0.5, 2); x.beginPath(); x.moveTo(Math.cos(a) * 92, Math.sin(a) * 92); x.lineTo(Math.cos(a) * l, Math.sin(a) * l); x.stroke(); } });
    const ec = new THREE.Group(); ec.position.set(20, 70, -220); ec.lookAt(0, 0, 0); ec.visible = false; g.add(ec); ST.eclipse = ec;
    const corona = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), new THREE.MeshBasicMaterial({ map: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); corona.renderOrder = -5; ec.add(corona);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(19.5, 64), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false })); disc.position.z = 0.5; disc.renderOrder = -4; ec.add(disc);
    ST.eclipseCorona = corona;
    const eU = { uOpen: { value: 0 }, uTime: { value: 0 }, uA: { value: 0 } }; ST.u.push(eU); ST.eclEyeU = eU;
    const eye2 = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), ST.imuEye.material.clone()); eye2.material.uniforms = eU; eye2.position.z = 1; eye2.renderOrder = -3; ec.add(eye2);
  }

  /* ======================= mise à jour ======================= */
  const baseUpd = ST.update;
  ST.update = (dt, cam) => {
    baseUpd(dt, cam);
    if (ST.cur === 'holy') {
      ST.holyClouds.update(S.world);
      const P = ST.petals, m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new V3(1, 1, 1);
      P.d.forEach((l, i) => { if (dt > 0) { l.p.y -= l.v * dt; l.p.x += (0.5 + Math.sin(S.world * 0.7 + l.ph) * 0.5) * dt * (ST.petalWind || 1); l.p.z += Math.cos(S.world + l.ph) * 0.25 * dt; l.r.x += dt * 2 * l.v; l.r.y += dt * 1.4; if (l.p.y < 0.02) { l.p.y = rand(8, 12); l.p.x = rand(-22, 14); } }
        q.setFromEuler(l.r); m.compose(l.p, q, one); P.mesh.setMatrixAt(i, m); });
      P.mesh.instanceMatrix.needsUpdate = true;
      ST.rays.forEach((r, i) => (r.material.opacity = (ST.rayA ?? 0.12) * (0.75 + 0.25 * Math.sin(S.dir * 0.4 + i))));
    }
    if (ST.cur === 'heaven') {
      ST.heavenClouds.update(S.world); ST.skyHalo.rotation.z += dt * 0.02;
      ST.isles.forEach(o => (o.position.y = o.userData.y0 + Math.sin(S.world * 0.4 + o.userData.ph) * 0.35));
    }
    if (ST.cur === 'void') ST.eyeU.uTime.value = S.dir;
    if (ST.cur === 'cliff' && ST.eclipse.visible) ST.eclipseCorona.rotation.z += dt * 0.03;
  };
  // jeux de dalles : la scène courante fournit les dalles cassables
  const baseSet = ST.set;
  ST.set = (name, pal) => {
    baseSet(name, pal);
    const t = ST.tileSets[name]; if (t) Object.assign(ST, t); else if (name === 'void') Object.assign(ST, ST.voidTiles);
  };
  ST.voidTiles = { tiles: ST.tiles, tileMesh: ST.tileMesh, tileGeo: ST.tileGeo, tileMat: ST.tileMat };
  return ST;
}
