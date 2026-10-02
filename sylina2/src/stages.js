// Décors du film : île céleste (Skypia), domaine d'Imu (trône vide), falaise sur l'océan (final).
// Chaque décor est un groupe ; setStage() bascule la visibilité et applique une palette (ciel, brouillard, lumières).
import * as THREE from 'three';
import { S, rand, tw } from './engine.js';

const C = c => new THREE.Color(c);
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

/* ---------------- palettes ---------------- */
export const PAL = {
  shrine: { top: 0x020206, hor: 0x120a1a, glow: 0x291024, cloud: 0x1f1229, cloudA: 0.8, stars: 1, sun: 0x000000, sunDir: [0, 0.2, -1], below: 0x120a1a,
    fog: 0x0e0a18, fogD: 0.03, hemiS: 0x5060a8, hemiG: 0x180e1a, hemiI: 0.8, key: 0xc8d0ff, keyI: 2.4, keyPos: [6, 12, 8], rim: 0x9a6cff, rimI: 1.6, exp: 1.05, moon: true },
  skyDay: { top: 0x1a3c98, hor: 0xf0b080, glow: 0xff9a50, cloud: 0xf8ece4, cloudA: 0.75, stars: 0, sun: 0xffd8a0, sunDir: [-0.5, 0.18, -1], below: 0xf2e6e0,
    fog: 0x9aa8d0, fogD: 0.0022, hemiS: 0x6a88d0, hemiG: 0x806050, hemiI: 0.6, key: 0xffd8a8, keyI: 2.1, keyPos: [-8, 10, -6], rim: 0xffb070, rimI: 1.1, exp: 0.72, moon: false },
  skyStorm: { top: 0x0a0a18, hor: 0x40385a, glow: 0x6a5a30, cloud: 0x2a2838, cloudA: 1, stars: 0, sun: 0x302010, sunDir: [-0.5, 0.18, -1], below: 0x302c40,
    fog: 0x2a2638, fogD: 0.012, hemiS: 0x6070a0, hemiG: 0x2a2030, hemiI: 0.9, key: 0xd8d0ff, keyI: 1.8, keyPos: [-8, 12, -6], rim: 0xffd84a, rimI: 2.2, exp: 1.05, moon: false },
  void: { top: 0x000000, hor: 0x1a0418, glow: 0x3a0830, cloud: 0x14040f, cloudA: 1, stars: 0.35, sun: 0x000000, sunDir: [0, 0.3, -1], below: 0x0a0208,
    fog: 0x0c0310, fogD: 0.045, hemiS: 0x6a3080, hemiG: 0x0a0208, hemiI: 0.7, key: 0xd0a0ff, keyI: 1.7, keyPos: [4, 12, 6], rim: 0xff2060, rimI: 2.2, exp: 1.1, moon: false },
  cliffStorm: { top: 0x05080c, hor: 0x2a3440, glow: 0x3a4a58, cloud: 0x1c2228, cloudA: 1, stars: 0, sun: 0x000000, sunDir: [0.4, 0.1, -1], below: 0x10161c,
    fog: 0x1a2028, fogD: 0.014, hemiS: 0x6a80a0, hemiG: 0x151a20, hemiI: 0.9, key: 0xc0d0ff, keyI: 2.0, keyPos: [6, 12, 8], rim: 0x6f9bff, rimI: 2.0, exp: 1.05, moon: false },
  cliffDawn: { top: 0x1a3a7a, hor: 0xffa060, glow: 0xff7a40, cloud: 0xffc8a0, cloudA: 0.85, stars: 0, sun: 0xffe0b0, sunDir: [0.2, 0.06, -1], below: 0x305070,
    fog: 0xb07a68, fogD: 0.006, hemiS: 0x8090c0, hemiG: 0x503838, hemiI: 0.8, key: 0xffd0a0, keyI: 2.4, keyPos: [2, 6, -12], rim: 0xffa070, rimI: 1.4, exp: 0.8, moon: false },
};

export function buildStages(root, W, renderer, env) {
  const ST = { groups: {}, cur: null, u: [] };
  const toonRock = (col, flat = true) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, flatShading: flat });

  /* ======================= ÎLE CÉLESTE ======================= */
  {
    const g = new THREE.Group(); g.visible = false; root.add(g); ST.groups.sky = g;
    // mer de nuages (shader)
    const seaU = { uTime: { value: 0 }, uHor: { value: C(0xffd0b0) }, uLit: { value: C(0xfff6ee) }, uShade: { value: C(0x8a90c8) }, uStorm: { value: 0 } };
    ST.u.push(seaU);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 1, 1), new THREE.ShaderMaterial({
      uniforms: seaU, fog: false,
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: NOISE + `
        uniform float uTime, uStorm; uniform vec3 uHor, uLit, uShade; varying vec3 vW;
        void main(){
          vec2 p = vW.xz * 0.018 + vec2(uTime * 0.01, uTime * 0.004);
          float f = fbm(p) * 0.7 + fbm(p * 3.1 + 7.0) * 0.3;
          float band = smoothstep(0.35, 0.62, f);
          vec3 lit = mix(uLit, vec3(0.32, 0.3, 0.42), uStorm), sh = mix(uShade, vec3(0.1, 0.1, 0.16), uStorm);
          vec3 col = mix(sh, lit, floor(band * 3.0 + 0.5) / 3.0 * 0.7 + band * 0.3);
          float d = length(vW.xz); col = mix(col, mix(uHor, vec3(0.2, 0.2, 0.28), uStorm), smoothstep(80.0, 520.0, d));
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -9; g.add(sea);
    // bouffées de nuages
    const puff = canvasTex(256, 256, (x, w, h) => {
      for (let i = 0; i < 22; i++) { const cx = rand(60, 196), cy = rand(80, 176), r = rand(30, 70), gr = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.6, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }
      const sh = x.createLinearGradient(0, 0, 0, h); sh.addColorStop(0.4, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(120,110,160,.6)');
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = sh; x.fillRect(0, 0, w, h);
    });
    ST.puffMats = [];
    for (let i = 0; i < 46; i++) {
      const a = rand(6.28), r = rand(55, 190);
      const m = new THREE.SpriteMaterial({ map: puff, color: 0xf4eee8, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
      const s = new THREE.Sprite(m); s.position.set(Math.cos(a) * r, rand(-14, -7), Math.sin(a) * r - 10); s.scale.setScalar(rand(20, 50)); g.add(s); ST.puffMats.push(m);
    }
    // île principale
    const sand = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#6e5e4c'; x.fillRect(0, 0, w, h);
      for (let yy = 0; yy < h; yy += 64) for (let xx = 0; xx < w; xx += 64) { const v = rand(-14, 14); x.fillStyle = `rgb(${142 + v},${122 + v},${96 + v})`; x.fillRect(xx + 2, yy + 2, 60, 60); }
      for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(80,60,40,${rand(0.05, 0.2)})`; x.fillRect(rand(w), rand(h), rand(1, 3), rand(1, 3)); }
      x.strokeStyle = 'rgba(60,45,30,.5)'; x.lineWidth = 2; for (let i = 0; i < 20; i++) { x.beginPath(); let px = rand(w), py = rand(h); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += rand(-30, 30); py += rand(-30, 30); x.lineTo(px, py); } x.stroke(); }
    }, 6);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(11, 8.5, 3, 48), [new THREE.MeshStandardMaterial({ color: 0x8a7458, roughness: 0.95 }), new THREE.MeshStandardMaterial({ map: sand, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: 0x5a4a3a })]);
    top.position.y = -1.5; top.receiveShadow = true; g.add(top);
    const under = new THREE.Mesh(new THREE.ConeGeometry(8.5, 12, 14, 3), toonRock(0x6a5a4a)); under.rotation.x = Math.PI; under.position.y = -9; g.add(under);
    for (let i = 0; i < 14; i++) { const a = rand(6.28); const v = new THREE.Mesh(new THREE.ConeGeometry(rand(0.4, 1.2), rand(1.5, 4), 5), new THREE.MeshStandardMaterial({ color: 0x4a7a3a, flatShading: true })); v.position.set(Math.cos(a) * 10.6, -2.5, Math.sin(a) * 10.6); v.rotation.x = Math.PI; g.add(v); }
    // piliers en tambours (destructibles)
    const stone = new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 0.85 }), gold = new THREE.MeshStandardMaterial({ color: 0xd8a830, metalness: 0.9, roughness: 0.3, envMap: env });
    ST.pillars = [];
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.42, r = 8.6, P = new THREE.Group(); P.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      const n = i % 3 === 1 ? 2 : 5;
      for (let k = 0; k < n; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 1.2, 16), stone); d.position.y = 0.6 + k * 1.2; d.castShadow = true; P.add(d); }
      if (n === 5) { const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 1.3), stone); cap.position.y = 6.2; cap.castShadow = true; P.add(cap); const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 20), gold); band.rotation.x = Math.PI / 2; band.position.y = 5.9; P.add(band); }
      g.add(P); ST.pillars.push(P);
    }
    // porte (arche) au fond
    const arch = new THREE.Group();
    for (const x of [-2.6, 2.6]) for (let k = 0; k < 6; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 1.1), stone); d.position.set(x, 0.65 + k * 1.3, 0); d.castShadow = true; arch.add(d); }
    const lint = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.1, 1.4), stone); lint.position.y = 8.35; lint.castShadow = true; arch.add(lint);
    const sun = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 8, 32), gold); sun.position.set(0, 8.35, 0.75); arch.add(sun);
    arch.position.set(0, 0, -10.2); g.add(arch); ST.arch = arch;
    // îles flottantes + cloche d'or de Shandora
    ST.floaters = [];
    for (let i = 0; i < 9; i++) {
      const a = rand(6.28), r = rand(24, 70), s = rand(1.5, 5);
      const isl = new THREE.Group(); const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), toonRock(0x7a6a58)); rock.scale.y = 1.4; rock.position.y = -s; isl.add(rock);
      const grass = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.95, s * 0.9, 0.4, 9), new THREE.MeshStandardMaterial({ color: 0x5a9a4a, flatShading: true })); isl.add(grass);
      for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.ConeGeometry(s * 0.25, s * 0.9, 6), new THREE.MeshStandardMaterial({ color: 0x3a7a3a, flatShading: true })); t.position.set(rand(-s, s) * 0.5, s * 0.45, rand(-s, s) * 0.5); isl.add(t); }
      isl.position.set(Math.cos(a) * r, rand(-4, 14), Math.sin(a) * r - 15); isl.userData.ph = rand(6); g.add(isl); ST.floaters.push(isl);
    }
    const bellIsl = new THREE.Group(); bellIsl.position.set(-46, 10, -78);
    const bRock = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 0), toonRock(0x7a6a58)); bRock.scale.y = 1.3; bRock.position.y = -10; bellIsl.add(bRock);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 16, 8), stone); tower.position.y = 8; bellIsl.add(tower);
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.4 + 2.6 * Math.pow(t, 1.6) + (t > 0.9 ? (t - 0.9) * 4 : 0), 4 - t * 5)); }
    const bell = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ color: 0xffc040, metalness: 1, roughness: 0.25, envMap: env, side: THREE.DoubleSide }));
    bell.position.y = 18; bellIsl.add(bell); g.add(bellIsl); ST.bell = bell; ST.bellIsl = bellIsl;
    // nuage d'orage (Raigo) — caché au départ
    const raigoU = { uTime: { value: 0 }, uFlash: { value: 0 } }; ST.u.push(raigoU); ST.raigoU = raigoU;
    const raigo = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.ShaderMaterial({
      uniforms: raigoU, fog: false,
      vertexShader: NOISE + `uniform float uTime; varying vec3 vN, vP; void main(){ vec3 p = position; float d = fbm(p.xy * 2.0 + p.z * 1.7 + uTime * 0.15) - 0.5; p *= 1.0 + d * 0.35; vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: NOISE + `uniform float uTime, uFlash; varying vec3 vN, vP;
        void main(){ float f = fbm(vP.xy * 3.0 + vP.z * 2.0 + uTime * 0.2); float l = dot(vN, normalize(vec3(0.3, 0.7, 0.6))) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.05, 0.05, 0.09), vec3(0.28, 0.26, 0.36), floor((l * 0.7 + f * 0.5) * 3.0) / 3.0);
          float veins = smoothstep(0.48, 0.5, f) * smoothstep(0.52, 0.5, f);
          col += vec3(1.0, 0.9, 0.5) * (veins * 2.0 + f * 0.6) * uFlash;
          gl_FragColor = vec4(col, 1.0); }`,
    }));
    raigo.position.set(0, 42, -30); raigo.scale.setScalar(0.01); raigo.visible = false; g.add(raigo); ST.raigo = raigo;
    ST.skySea = seaU;
  }

  /* ======================= DOMAINE D'IMU ======================= */
  {
    const g = new THREE.Group(); g.visible = false; root.add(g); ST.groups.void = g;
    // sol de dalles noires (instancié) + joints lumineux
    const N = 26, sz = 1.5, tileGeo = new THREE.BoxGeometry(sz - 0.06, 0.2, sz - 0.06);
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x100a16, roughness: 0.22, metalness: 0.55, envMap: env, envMapIntensity: 0.6 });
    const tiles = new THREE.InstancedMesh(tileGeo, tileMat, N * N); tiles.receiveShadow = true;
    const m4 = new THREE.Matrix4(); ST.tiles = []; let i = 0;
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const x = (a - N / 2 + 0.5) * sz, z = (b - N / 2 + 0.5) * sz - 6; m4.makeTranslation(x, -0.1, z); tiles.setMatrixAt(i, m4); ST.tiles.push({ x, z, i, gone: false }); i++; }
    g.add(tiles); ST.tileMesh = tiles; ST.tileGeo = tileGeo; ST.tileMat = tileMat;
    const seamU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uPulse: { value: 0.4 } }]); ST.u.push(seamU); ST.seamU = seamU;
    const seam = new THREE.Mesh(new THREE.PlaneGeometry(N * sz, N * sz), new THREE.ShaderMaterial({
      uniforms: seamU, fog: true,
      vertexShader: `#include <fog_pars_vertex>\nvarying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition; \n#include <fog_vertex>\n }`,
      fragmentShader: `#include <fog_pars_fragment>\nuniform float uTime, uPulse; varying vec3 vW; void main(){ float d = length(vW.xz - vec2(0.0, -6.0)); float w = 0.5 + 0.5 * sin(d * 0.8 - uTime * 3.0);
        vec3 col = mix(vec3(0.35, 0.05, 0.6), vec3(0.9, 0.1, 0.3), 0.5 + 0.5 * sin(d * 0.2 - uTime)) * (0.25 + uPulse * w); gl_FragColor = vec4(col, 1.0); \n#include <fog_fragment>\n }`,
    }));
    seam.rotation.x = -Math.PI / 2; seam.position.set(0, -0.19, -6); g.add(seam);
    // colonnes géantes
    const colMat = new THREE.MeshStandardMaterial({ color: 0x18121e, roughness: 0.5, metalness: 0.3, envMap: env }), gold = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 1, roughness: 0.35, envMap: env });
    for (const x of [-10, 10]) for (let k = 0; k < 6; k++) {
      const z = 8 - k * 7, c = new THREE.Group();
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 46, 12), colMat); sh.position.y = 23; c.add(sh);
      for (const y of [0.4, 6, 18]) { const b = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 6, 24), gold); b.rotation.x = Math.PI / 2; b.position.y = y; c.add(b); }
      c.position.set(x, 0, z); g.add(c);
    }
    // trône vide + épées des vingt rois
    const thr = new THREE.Group(); thr.position.set(0, 0, -24);
    for (let s = 0; s < 4; s++) { const st = new THREE.Mesh(new THREE.BoxGeometry(12 - s * 2.2, 0.6, 7 - s * 1.2), colMat); st.position.y = 0.3 + s * 0.6; thr.add(st); }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.8), colMat); seat.position.y = 2.85; thr.add(seat); const trim = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 1.9), gold); trim.position.y = 3.33; thr.add(trim);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 6, 0.5), colMat); back.position.set(0, 6, -0.9); thr.add(back);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.14, 6, 5), gold); crown.position.set(0, 9.4, -0.9); thr.add(crown);
    const swordM = new THREE.MeshStandardMaterial({ color: 0xc8ccd8, metalness: 1, roughness: 0.2, envMap: env });
    for (let s = 0; s < 20; s++) { const a = (s / 20) * Math.PI - Math.PI, r = 6.5; const sw = new THREE.Group();
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 0.03), swordM); bl.position.y = 1.7; const gd = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.12), gold); gd.position.y = 3.4; const hi = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), colMat); hi.position.y = 3.8;
      sw.add(bl, gd, hi); sw.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r * 0.6 + 1.5); sw.rotation.z = rand(-0.12, 0.12); sw.rotation.y = rand(3); thr.add(sw); }
    g.add(thr);
    // sceau géant + silhouette aux yeux blancs
    const sig = canvasTex(1024, 1024, (x, w, h) => {
      x.translate(w / 2, h / 2); x.strokeStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 16;
      for (const [r, lw] of [[480, 10], [440, 4], [300, 6], [180, 3]]) { x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); }
      x.lineWidth = 6; x.beginPath(); for (let k = 0; k <= 5; k++) { const a = -Math.PI / 2 + k * 4 * Math.PI / 5; x.lineTo(Math.cos(a) * 440, Math.sin(a) * 440); } x.stroke();
      x.font = '44px serif'; x.fillStyle = '#fff'; const glyphs = '虚神天竜王冥闇滅界終空無'; for (let k = 0; k < 36; k++) { x.save(); x.rotate(k / 36 * Math.PI * 2); x.fillText(glyphs[k % glyphs.length], -22, -452); x.restore(); }
    });
    const sigMat = new THREE.MeshBasicMaterial({ map: sig, color: 0xc040ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.55 });
    const sigil = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), sigMat); sigil.position.set(0, 20, -44); g.add(sigil); ST.sigil = sigil;
    const sil = canvasTex(512, 512, (x, w, h) => {
      const gr = x.createRadialGradient(256, 300, 20, 256, 300, 250); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.7, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.beginPath(); x.ellipse(256, 170, 70, 90, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(120, 512); x.quadraticCurveTo(140, 250, 256, 240); x.quadraticCurveTo(372, 250, 392, 512); x.fill();
      for (const ex of [226, 286]) { x.shadowColor = '#fff'; x.shadowBlur = 20; x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(ex, 175, 11, 0, 7); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex, 175, 3, 0, 7); x.fill(); }
    });
    const imu = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: sil, transparent: true, depthWrite: false, fog: false, opacity: 0 }));
    imu.position.set(0, 17, -43); imu.renderOrder = -2; g.add(imu); ST.imu = imu;
    // cercle magique au sol (texture partagée avec les FX)
    ST.circleTex = canvasTex(1024, 1024, (x, w, h) => {
      x.translate(w / 2, h / 2); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 10;
      for (const [r, lw] of [[500, 8], [470, 3], [360, 5], [340, 2], [200, 4]]) { x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); }
      x.lineWidth = 4; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.beginPath(); x.moveTo(Math.cos(a) * 360, Math.sin(a) * 360); x.lineTo(Math.cos(a + 2 * Math.PI / 3) * 360, Math.sin(a + 2 * Math.PI / 3) * 360); x.stroke(); }
      x.font = 'bold 42px serif'; const gl = '神騎士闇虚冥王天滅'; for (let k = 0; k < 40; k++) { x.save(); x.rotate(k / 40 * Math.PI * 2); x.fillText(gl[k % gl.length], -20, -405); x.restore(); }
    });
  }

  /* ======================= FALAISE / OCÉAN ======================= */
  {
    const g = new THREE.Group(); g.visible = false; root.add(g); ST.groups.cliff = g;
    // plateau rocheux (prisme irrégulier)
    const sh = new THREE.Shape(); const R0 = 17;
    for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2, r = R0 * (1 + 0.12 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 7)); const px = Math.cos(a) * r, pz = Math.sin(a) * r * 0.8; k ? sh.lineTo(px, pz) : sh.moveTo(px, pz); }
    const plat = new THREE.ExtrudeGeometry(sh, { depth: 22, bevelEnabled: false, curveSegments: 4 });
    plat.rotateX(Math.PI / 2);
    const rockTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#4a4e52'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = rand(40, 110) | 0; x.fillStyle = `rgba(${v},${v + 4},${v + 8},${rand(0.1, 0.4)})`; x.fillRect(rand(w), rand(h), rand(1, 5), rand(1, 5)); }
      for (let i = 0; i < 50; i++) { x.fillStyle = `rgba(60,80,50,${rand(0.2, 0.5)})`; x.beginPath(); x.ellipse(rand(w), rand(h), rand(10, 40), rand(6, 20), rand(3), 0, 7); x.fill(); } }, 5);
    const cliff = new THREE.Mesh(plat, [new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.95 }), new THREE.MeshStandardMaterial({ color: 0x2e3236, roughness: 1, flatShading: true })]);
    cliff.position.set(0, 0, -4); cliff.receiveShadow = true; g.add(cliff); ST.cliff = cliff;
    ST.rocks = [];
    for (let k = 0; k < 26; k++) { const a = rand(6.28), r = rand(10.5, 15); const s = rand(0.3, 1.4); const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), toonRock(0x55595e)); m.position.set(Math.cos(a) * r, s * 0.4, Math.sin(a) * r * 0.75 - 4); m.rotation.set(rand(3), rand(3), rand(3)); m.castShadow = true; g.add(m); ST.rocks.push(m); }
    // pierres dressées (à renverser)
    ST.stones = [];
    for (const [x, z] of [[-9, -9], [9, -8], [-12, 2], [12, 1]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 0.9), toonRock(0x5a5e64)); m.position.set(x, 2.2, z); m.rotation.y = rand(3); m.castShadow = true; g.add(m); ST.stones.push(m); }
    // océan (vagues + écume + inclinaison)
    const oceanU = { uTime: { value: 0 }, uDeep: { value: C(0x0a1a24) }, uShal: { value: C(0x2a5a6a) }, uFoam: { value: C(0xdfe8ee) }, uSky: { value: C(0x2a3440) }, uSunDir: { value: new THREE.Vector3(0.2, 0.1, -1).normalize() }, uSun: { value: C(0x000000) }, uAmp: { value: 1.4 }, uFogCol: { value: C(0x1a2028) } };
    ST.u.push(oceanU); ST.oceanU = oceanU;
    const oceanMat = new THREE.ShaderMaterial({
      uniforms: oceanU, fog: false,
      vertexShader: NOISE + `uniform float uTime, uAmp; varying vec3 vW; varying float vH;
        float wave(vec2 p){ return sin(p.x * 0.08 + uTime * 1.1) * 1.0 + sin(p.y * 0.11 - uTime * 0.9 + p.x * 0.03) * 0.8 + sin((p.x + p.y) * 0.21 + uTime * 1.7) * 0.35 + (n2(p * 0.05 + uTime * 0.05) - 0.5) * 1.5; }
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); float hgt = wave(w.xz) * uAmp; w.y += hgt; vH = hgt / max(uAmp, 0.01); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: NOISE + `uniform float uTime; uniform vec3 uDeep, uShal, uFoam, uSky, uSunDir, uSun, uFogCol; varying vec3 vW; varying float vH;
        void main(){ vec3 col = mix(uDeep, uShal, smoothstep(-1.0, 2.2, vH));
          float fo = smoothstep(1.6, 2.4, vH + (fbm(vW.xz * 0.2 + uTime * 0.2) - 0.5) * 1.2); col = mix(col, uFoam, fo);
          vec3 v = normalize(cameraPosition - vW); float fr = pow(1.0 - max(v.y, 0.0), 3.0); col = mix(col, uSky, fr * 0.6);
          vec3 r = reflect(-v, vec3(0.0, 1.0, 0.0)); col += uSun * pow(max(dot(r, normalize(uSunDir)), 0.0), 120.0) * 2.0;
          float d = length(vW.xz - cameraPosition.xz); col = mix(col, uFogCol, smoothstep(60.0, 420.0, d));
          gl_FragColor = vec4(col, 1.0); }`,
    });
    const oceanG = new THREE.Group(); g.add(oceanG); ST.ocean = oceanG;
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 220, 220), oceanMat); ocean.rotation.x = -Math.PI / 2; oceanG.position.y = -14; oceanG.add(ocean);
    // tsunami (mur d'eau courbe)
    const wallU = { uTime: { value: 0 }, uH: { value: 0 } }; ST.u.push(wallU); ST.wallU = wallU;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(90, 90, 1, 64, 12, true, Math.PI * 0.55, Math.PI * 0.9), new THREE.ShaderMaterial({
      uniforms: wallU, side: THREE.DoubleSide, transparent: true, fog: false,
      vertexShader: NOISE + `uniform float uTime, uH; varying vec2 vUv; varying float vY; void main(){ vec3 p = position; float t = p.y + 0.5; vY = t; vUv = uv;
          float curl = pow(t, 3.0) * 14.0 * uH / 40.0; vec3 dir = normalize(vec3(p.x, 0.0, p.z)); p.xz -= dir.xz * curl; p.y = t * uH + sin(uv.x * 40.0 + uTime) * 0.8 * t;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: NOISE + `uniform float uTime, uH; varying vec2 vUv; varying float vY; void main(){ float f = fbm(vec2(vUv.x * 30.0, vY * 6.0 - uTime * 0.6));
          vec3 col = mix(vec3(0.03, 0.12, 0.16), vec3(0.2, 0.45, 0.5), vY); col = mix(col, vec3(0.9, 0.95, 1.0), smoothstep(0.82, 0.95, vY + f * 0.15));
          col += vec3(0.1, 0.25, 0.3) * f * 0.5; float a = smoothstep(0.0, 0.08, vY) * step(0.01, uH); gl_FragColor = vec4(col, a); }`,
    }));
    wall.position.set(0, -14, -20); wall.visible = false; g.add(wall); ST.wall = wall;
    // pluie
    const RN = 2600, rp = new Float32Array(RN * 6); ST.rain = { n: RN, p: rp, seeds: [] };
    for (let k = 0; k < RN; k++) ST.rain.seeds.push([rand(-30, 30), rand(0, 24), rand(-30, 20), rand(18, 26)]);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3).setUsage(THREE.DynamicDrawUsage));
    const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xa8b8d0, transparent: true, opacity: 0.35, fog: true })); rain.frustumCulled = false; g.add(rain); ST.rainMesh = rain;
  }

  /* ======================= bascule / palettes ======================= */
  const sky = W.sky.uniforms, hemi = W.hemi, key = W.moon, rim = W.rim;
  ST.pal = { ...PAL.shrine };
  const apply = p => {
    sky.uTop.value.set(p.top); sky.uHor.value.set(p.hor); sky.uGlow.value.set(p.glow); sky.uCloud.value.set(p.cloud); sky.uCloudA.value = p.cloudA; sky.uStars.value = p.stars;
    sky.uSun.value.set(p.sun); sky.uSunDir.value.set(...p.sunDir).normalize(); sky.uBelow.value.set(p.below);
    root.fog.color.set(p.fog); root.fog.density = p.fogD;
    hemi.color.set(p.hemiS); hemi.groundColor.set(p.hemiG); hemi.intensity = p.hemiI;
    key.color.set(p.key); key.intensity = p.keyI; ST.keyOff = p.keyPos; rim.color.set(p.rim); rim.intensity = p.rimI;
    renderer.toneMappingExposure = p.exp; W.moonGroup.visible = p.moon;
    if (ST.oceanU) { ST.oceanU.uSky.value.set(p.hor); ST.oceanU.uFogCol.value.set(p.fog); ST.oceanU.uSun.value.set(p.sun); ST.oceanU.uSunDir.value.set(...p.sunDir).normalize(); }
  };
  const mixPal = (a, b, t) => {
    const o = {};
    for (const k in b) {
      if (typeof b[k] === 'number' && !['fogD', 'hemiI', 'keyI', 'rimI', 'exp', 'cloudA', 'stars'].includes(k)) o[k] = C(a[k]).lerp(C(b[k]), t).getHex();
      else if (typeof b[k] === 'number') o[k] = a[k] + (b[k] - a[k]) * t;
      else if (Array.isArray(b[k])) o[k] = b[k].map((v, i) => a[k][i] + (v - a[k][i]) * t);
      else o[k] = t < 0.5 ? a[k] : b[k];
    }
    return o;
  };
  ST.set = (name, pal) => {
    for (const k in ST.groups) ST.groups[k].visible = k === name;
    W.shrine.visible = name === 'shrine';
    ST.cur = name; ST.pal = { ...PAL[pal || name] }; apply(ST.pal); W.clearCracks(); W.crackAt(0, 0);
  };
  ST.blend = (pal, dur) => { const from = { ...ST.pal }, to = PAL[pal], o = { t: 0 }; ST.blendJob = { from, to, o }; tw(o, 't', 1, dur, 'inOut', 'dir'); };
  ST.update = (dt, cam) => {
    if (ST.blendJob) { const j = ST.blendJob; ST.pal = mixPal(j.from, j.to, j.o.t); apply(ST.pal); if (j.o.t >= 1) ST.blendJob = null; }
    for (const u of ST.u) u.uTime.value = S.world;
    if (ST.cur === 'sky') { ST.floaters.forEach(f => (f.position.y += Math.sin(S.world * 0.5 + f.userData.ph) * 0.004)); ST.bellIsl.rotation.y += dt * 0.02; }
    if (ST.cur === 'void') { ST.sigil.rotation.z += dt * 0.05; }
    if (ST.cur === 'cliff' && ST.rainMesh.visible) {
      const R = ST.rain, cp = cam.position;
      for (let k = 0; k < R.n; k++) { const s = R.seeds[k]; const y = ((s[1] - S.world * s[3]) % 24 + 24) % 24; const x = cp.x + s[0], z = cp.z + s[2];
        R.p.set([x, y - 4, z, x + 0.05, y - 4 + 0.5, z], k * 6); }
      ST.rainMesh.geometry.attributes.position.needsUpdate = true;
    }
  };
  return ST;
}
