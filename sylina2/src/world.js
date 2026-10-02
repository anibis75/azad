// Décor : ciel nocturne, lune, montagnes, sanctuaire (torii, lanternes), herbe, feuilles, fissures
import * as THREE from 'three';
import { S, rand } from './engine.js';

export function buildWorld(root, renderer) {
  const W = {}; const scene = new THREE.Group(); root.add(scene); W.shrine = scene; const top = root;
  W.root = root;
  top.fog = new THREE.FogExp2(0x0e0a18, 0.03);

  /* ---------- ciel ---------- */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uSplit: { value: 0 }, uSeam: { value: 0 }, uTop: { value: new THREE.Color(0.008, 0.007, 0.025) }, uHor: { value: new THREE.Color(0.07, 0.035, 0.1) }, uGlow: { value: new THREE.Color(0.16, 0.05, 0.14) }, uCloud: { value: new THREE.Color(0.12, 0.07, 0.16) }, uCloudA: { value: 0.8 }, uStars: { value: 1 }, uSunDir: { value: new THREE.Vector3(0, 0.2, -1).normalize() }, uSun: { value: new THREE.Color(0, 0, 0) }, uBelow: { value: new THREE.Color(0.07, 0.035, 0.1) } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vD; uniform float uTime, uSplit, uSeam, uCloudA, uStars; uniform vec3 uTop, uHor, uGlow, uCloud, uSunDir, uSun, uBelow;
      float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        vec3 col = mix(uHor, uTop, smoothstep(-0.05, 0.5, y));
        col = mix(col, uBelow, smoothstep(0.0, -0.25, y));
        col += uGlow * exp(-abs(y) * 12.0) * 0.5;
        float sd = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSun * (pow(sd, 900.0) * 6.0 + pow(sd, 60.0) * 0.6 + pow(sd, 6.0) * 0.25);
        // nuages
        float c = n3(d * 4.0 + vec3(uTime * 0.01, 0, 0)) * 0.6 + n3(d * 9.0) * 0.4;
        col = mix(col, uCloud + uSun * pow(sd, 4.0) * 0.4, smoothstep(0.55, 0.85, c) * smoothstep(0.02, 0.25, y) * uCloudA);
        // étoiles
        vec3 g = floor(d * 380.0); float s = h(g);
        float star = step(0.9965, s) * (0.6 + 0.4 * sin(uTime * 3.0 + s * 90.0)) * smoothstep(0.05, 0.3, y);
        col += vec3(star) * 0.9 * uStars;
        // ciel fendu par les deux haki
        if (uSplit > 0.0) {
          float seam = d.x + (n3(vec3(d.y * 12.0, uTime * 3.0, 0.0)) - 0.5) * 0.06;
          vec3 red = vec3(1.0, 0.78, 0.18), blue = vec3(0.62, 0.16, 1.0);
          vec3 tint = seam < 0.0 ? red : blue;
          tint = mix(vec3(0.25, 0.45, 1.0), tint, smoothstep(0.0, 0.12, abs(seam)));
          col = mix(col, col * 0.3 + tint * (0.35 + 0.5 * smoothstep(0.0, 0.7, y)), uSplit * 0.85);
          float line = exp(-abs(seam) * 90.0);
          col = mix(col, vec3(0.0), line * uSplit);
          col += vec3(1.0, 0.9, 1.0) * exp(-abs(seam) * 900.0) * uSplit;
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), skyMat); sky.renderOrder = -10; top.add(sky); W.skyMesh = sky;
  W.sky = skyMat;

  /* ---------- lune (coupable) ---------- */
  const mc = document.createElement('canvas'); mc.width = mc.height = 512;
  { const g = mc.getContext('2d'); const r = g.createRadialGradient(230, 230, 20, 256, 256, 250);
    r.addColorStop(0, '#fff8f0'); r.addColorStop(0.8, '#ece0d6'); r.addColorStop(1, '#cbb8b0');
    g.fillStyle = r; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
    for (let i = 0; i < 40; i++) { const x = rand(60, 450), y = rand(60, 450), rr = rand(8, 46); if ((x - 256) ** 2 + (y - 256) ** 2 > 200 ** 2) continue; g.fillStyle = `rgba(150,130,140,${rand(0.08, 0.25)})`; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); } }
  const moonTex = new THREE.CanvasTexture(mc); moonTex.colorSpace = THREE.SRGBColorSpace;
  const moonPos = new THREE.Vector3(55, 62, -220);
  W.moonPlanes = [];
  W.moonGroup = new THREE.Group(); W.moonGroup.position.copy(moonPos); W.moonGroup.lookAt(0, 1, 0); top.add(W.moonGroup);
  for (let i = 0; i < 2; i++) {
    const plane = new THREE.Plane();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(38, 38), new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, fog: false, clippingPlanes: [plane], depthWrite: false, color: 0xffffff }));
    m.renderOrder = -9; W.moonGroup.add(m); W.moonPlanes.push({ m, plane, side: i ? -1 : 1 });
  }
  const halo = document.createElement('canvas'); halo.width = halo.height = 256;
  { const g = halo.getContext('2d'); const r = g.createRadialGradient(128, 128, 30, 128, 128, 128); r.addColorStop(0, 'rgba(255,230,230,.55)'); r.addColorStop(0.4, 'rgba(200,170,255,.18)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); }
  const haloM = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(halo), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  haloM.position.z = -1; haloM.renderOrder = -9.5; W.moonGroup.add(haloM);
  W.moonCut = null;

  /* ---------- montagnes (silhouettes en couches, style décor d'anime) ---------- */
  const ridge = (x0, x1, base, amp, seed, step = 6) => {
    const s = new THREE.Shape(); s.moveTo(x0, -40);
    for (let x = x0; x <= x1; x += step) {
      const y = base + amp * (0.55 * Math.sin(x * 0.013 + seed) + 0.3 * Math.sin(x * 0.037 + seed * 2.1) + 0.15 * Math.sin(x * 0.091 + seed * 3.3));
      s.lineTo(x, Math.max(2, y));
    }
    s.lineTo(x1, -40); s.closePath(); return new THREE.ShapeGeometry(s);
  };
  [[-340, 0x2a1f3e, 30, 22, 1], [-290, 0x1f172f, 22, 18, 2.7], [-240, 0x150f22, 14, 12, 4.1]].forEach(([z, col, base, amp, seed]) => {
    const m = new THREE.Mesh(ridge(-700, 700, base, amp, seed), new THREE.MeshBasicMaterial({ color: col, fog: false }));
    m.position.set(0, -2, z); m.renderOrder = -8; scene.add(m);
  });
  // pic héroïque (tranché plus tard)
  const pks = new THREE.Shape();
  const peakPts = [[-70, -30], [-58, 8], [-44, 18], [-30, 34], [-19, 47], [-9, 60], [-3, 57], [3, 64], [11, 52], [22, 40], [34, 27], [48, 15], [62, 4], [72, -30]];
  pks.moveTo(...peakPts[0]); peakPts.slice(1).forEach(p => pks.lineTo(...p)); pks.closePath();
  const heroGeo = new THREE.ShapeGeometry(pks);
  const snow = new THREE.Shape(); [[-19, 47], [-9, 60], [-3, 57], [3, 64], [11, 52], [6, 49], [0, 52], [-6, 50], [-12, 45]].forEach((p, i) => (i ? snow.lineTo(...p) : snow.moveTo(...p))); snow.closePath();
  const snowGeo = new THREE.ShapeGeometry(snow);
  const heroLo = new THREE.Plane(), heroHi = new THREE.Plane();
  W.hero = { pos: new THREE.Vector3(-60, -2, -200), lo: null, hi: null, planeLo: heroLo, planeHi: heroHi, cut: null };
  const mkHero = plane => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(heroGeo, new THREE.MeshBasicMaterial({ color: 0x1d1530, fog: false, clippingPlanes: [plane] }));
    const c = new THREE.Mesh(snowGeo, new THREE.MeshBasicMaterial({ color: 0x8a82a8, fog: false, clippingPlanes: [plane] })); c.position.z = 0.1;
    m.renderOrder = -7; c.renderOrder = -7;
    g.add(m, c); g.position.copy(W.hero.pos); scene.add(g); return g;
  };
  W.hero.lo = mkHero(heroLo); W.hero.hi = mkHero(heroHi);
  const cutN = new THREE.Vector3(-0.35, 1, 0).normalize(), cutP = W.hero.pos.clone().add(new THREE.Vector3(0, 38, 0));
  heroLo.setFromNormalAndCoplanarPoint(cutN.clone().negate(), cutP);
  heroHi.setFromNormalAndCoplanarPoint(cutN, cutP);
  W.hero.cutN = cutN; W.hero.cutP = cutP;
  W.hero.line = new THREE.Mesh(new THREE.PlaneGeometry(200, 1.2), new THREE.MeshBasicMaterial({ color: 0xff4060, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, fog: false, depthWrite: false }));
  W.hero.line.position.copy(cutP).add(new THREE.Vector3(0, 0, 0.5)); W.hero.line.rotation.z = Math.atan2(cutN.x, cutN.y) * -1; W.hero.line.renderOrder = -6; scene.add(W.hero.line);

  /* ---------- sol ---------- */
  const gc = document.createElement('canvas'); gc.width = gc.height = 512;
  { const g = gc.getContext('2d'); g.fillStyle = '#2a2230'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { const v = rand(20, 70) | 0; g.fillStyle = `rgba(${v + 10},${v},${v + 14},${rand(0.1, 0.5)})`; g.fillRect(rand(512), rand(512), rand(1, 4), rand(1, 4)); }
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(20,16,24,${rand(0.2, 0.5)})`; g.beginPath(); g.ellipse(rand(512), rand(512), rand(6, 26), rand(4, 14), rand(3), 0, 7); g.fill(); } }
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(60, 60); gt.colorSpace = THREE.SRGBColorSpace; gt.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.95, color: 0x6a5e74 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // dalles de pierre de l'arène
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2e2834, roughness: 0.8 });
  for (let x = -9; x <= 9; x += 1.2) for (let z = -2.4; z <= 2.4; z += 1.2) {
    if (Math.random() < 0.12) continue;
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.06, 1.12), stoneMat); s.position.set(x + rand(-0.03, 0.03), 0.01, z + rand(-0.03, 0.03)); s.rotation.y = rand(-0.03, 0.03); s.receiveShadow = true; scene.add(s);
  }
  /* herbe instanciée */
  const blade = new THREE.PlaneGeometry(0.05, 0.38, 1, 4); blade.translate(0, 0.19, 0);
  { const p = blade.attributes.position; for (let i = 0; i < p.count; i++) { const t = p.getY(i) / 0.38; p.setX(i, p.getX(i) * (1 - t)); } }
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x3a4a52, side: THREE.DoubleSide });
  grassMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = { value: 0 }; W.grassU = sh.uniforms;
    sh.vertexShader = 'uniform float uTime;\nvarying float vH;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vH = position.y / 0.38;
      vec4 wp = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
      float t = position.y / 0.38;
      transformed.x += (sin(uTime * 1.7 + wp.x * 0.6 + wp.z * 0.4) * 0.08 + 0.05) * t * t;
      transformed.z += cos(uTime * 1.3 + wp.x * 0.3) * 0.04 * t * t;`);
    sh.fragmentShader = 'varying float vH;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= 0.45 + 0.55 * vH;');
  };
  const N = window.__LQ ? 6000 : 16000, grass = new THREE.InstancedMesh(blade, grassMat, N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  let n = 0;
  while (n < N) {
    const x = rand(-40, 40), z = rand(-30, 12);
    if (Math.abs(z) < 3.2 && Math.abs(x) < 10) continue;
    ps.set(x, 0, z); q.setFromEuler(new THREE.Euler(0, rand(6.28), rand(-0.2, 0.2))); const s = rand(0.6, 1.5); sc.set(s, s * rand(0.7, 1.3), s);
    m4.compose(ps, q, sc); grass.setMatrixAt(n++, m4);
  }
  grass.receiveShadow = true; scene.add(grass);

  /* ---------- sanctuaire : torii + lanternes ---------- */
  const red = new THREE.MeshStandardMaterial({ color: 0x9a1a14, roughness: 0.55 });
  const blk = new THREE.MeshStandardMaterial({ color: 0x141014, roughness: 0.6 });
  const torii = new THREE.Group();
  const post = (x) => { for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28 + 0.02 * (2 - i), 0.3 + 0.02 * (2 - i), 7 / 3, 18), red); c.position.set(x, 7 / 6 + i * 7 / 3, 0); c.castShadow = true; torii.add(c); } const b = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.5, 18), blk); b.position.set(x, 0.25, 0); torii.add(b); };
  post(-3.4); post(3.4);
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.38, 0.28), red); nuki.position.y = 5.4; torii.add(nuki);
  const kasagiShape = new THREE.Shape(); kasagiShape.moveTo(-5.4, 0.3); kasagiShape.quadraticCurveTo(0, -0.1, 5.4, 0.3); kasagiShape.lineTo(5.2, 0.75); kasagiShape.quadraticCurveTo(0, 0.4, -5.2, 0.75); kasagiShape.closePath();
  const kasagi = new THREE.Mesh(new THREE.ExtrudeGeometry(kasagiShape, { depth: 0.5, bevelEnabled: false }), blk); kasagi.position.set(0, 6.6, -0.25); kasagi.castShadow = true;
  const shimaki = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.4, 0.42), red); shimaki.position.y = 6.75;
  const gaku = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.1), blk); gaku.position.set(0, 6.0, 0.15);
  torii.add(kasagi, shimaki, gaku);
  torii.position.set(0, 0, -13); scene.add(torii); W.torii = torii; W.lanternGroups = [];
  W.lanterns = [];
  const stone = new THREE.MeshStandardMaterial({ color: 0x5a5560, roughness: 0.9 });
  for (const [x, z] of [[-6.5, -7], [6.5, -7], [-11, -3.5], [11, -3.5]]) {
    const l = new THREE.Group();
    const parts = [[new THREE.CylinderGeometry(0.4, 0.5, 0.25, 6), 0.12], [new THREE.CylinderGeometry(0.12, 0.16, 1.0, 8), 0.75], [new THREE.CylinderGeometry(0.45, 0.35, 0.18, 6), 1.33],
      [new THREE.BoxGeometry(0.5, 0.45, 0.5), 1.64], [new THREE.ConeGeometry(0.62, 0.45, 6), 2.08], [new THREE.SphereGeometry(0.1, 8, 6), 2.38]];
    parts.forEach(([g, y]) => { const m = new THREE.Mesh(g, stone); m.position.y = y; m.castShadow = true; l.add(m); });
    const fire = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.52), new THREE.MeshBasicMaterial({ color: 0xffb060 })); fire.position.y = 1.64; l.add(fire);
    const fire2 = fire.clone(); fire2.rotation.y = Math.PI / 2; l.add(fire2);
    const pl = new THREE.PointLight(0xff9a50, 4, 9, 1.6); pl.position.y = 1.7; l.add(pl);
    l.position.set(x, 0, z); scene.add(l); W.lanterns.push(pl); W.lanternGroups.push(l);
  }

  /* ---------- lumières ---------- */
  W.hemi = new THREE.HemisphereLight(0x5060a8, 0x180e1a, 0.8); top.add(W.hemi);
  const moon = new THREE.DirectionalLight(0xc8d0ff, 2.4);
  moon.position.set(6, 12, 8); moon.castShadow = true;
  moon.shadow.mapSize.set(window.__LQ ? 1024 : 2048, window.__LQ ? 1024 : 2048); moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.02;
  const sc2 = moon.shadow.camera; sc2.left = -9; sc2.right = 9; sc2.top = 9; sc2.bottom = -9; sc2.near = 1; sc2.far = 40;
  top.add(moon); top.add(moon.target); W.moon = moon;
  const rim = new THREE.DirectionalLight(0x9a6cff, 1.6); rim.position.set(-4, 5, -10); top.add(rim); W.rim = rim;
  W.flashLight = new THREE.PointLight(0xffffff, 0, 30, 1.5); W.flashLight.position.set(0, 2, 0); top.add(W.flashLight);

  /* ---------- feuilles d'érable ---------- */
  const leafGeo = new THREE.PlaneGeometry(0.07, 0.06);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0xc0283a, side: THREE.DoubleSide });
  const LN = 260, leaves = new THREE.InstancedMesh(leafGeo, leafMat, LN);
  W.leafData = [];
  for (let i = 0; i < LN; i++) W.leafData.push({ p: new THREE.Vector3(rand(-14, 14), rand(0, 9), rand(-8, 5)), r: new THREE.Euler(rand(6), rand(6), rand(6)), v: rand(0.3, 0.7), ph: rand(6) });
  leaves.frustumCulled = false; scene.add(leaves); W.leaves = leaves;
  // la feuille du duel
  const key = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2a40, side: THREE.DoubleSide, fog: false }));
  key.visible = false; top.add(key); W.keyLeaf = key;

  /* ---------- fissures au sol (décalques dessinés) ---------- */
  const cs = 2048, span = 28;
  const crackC = document.createElement('canvas'); crackC.width = crackC.height = cs;
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = cs;
  const crackT = new THREE.CanvasTexture(crackC), glowT = new THREE.CanvasTexture(glowC);
  const dec = (tex, blending, order, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(span, span), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending, fog: false })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = order; top.add(m); return m; };
  const crackDec = dec(crackT, THREE.NormalBlending, 1, 0.045);
  const glowDec = dec(glowT, THREE.AdditiveBlending, 2, 0.05); W.crackDec = [crackDec, glowDec];
  W.crackOrigin = [0, 0]; const w2c = (x, z) => [((x - W.crackOrigin[0]) / span + 0.5) * cs, ((z - W.crackOrigin[1]) / span + 0.5) * cs];
  W.crack = (x, z, dir, len, col) => {
    const g = crackC.getContext('2d'), gg = glowC.getContext('2d');
    const drawLine = (sx, sz, a, L, w, depth) => {
      const pts = [[sx, sz]]; let px = sx, pz = sz, an = a;
      while (Math.hypot(px - sx, pz - sz) < L) { an += rand(-0.5, 0.5); an = a + Math.max(-0.6, Math.min(0.6, an - a)); px += Math.cos(an) * rand(0.15, 0.35); pz += Math.sin(an) * rand(0.15, 0.35); pts.push([px, pz]);
        if (depth > 0 && Math.random() < 0.15) drawLine(px, pz, an + rand(-1.2, 1.2), L * 0.35, w * 0.6, depth - 1); }
      const path = ctx => { ctx.beginPath(); pts.forEach(([a, b], i) => { const [u, v] = w2c(a, b); i ? ctx.lineTo(u, v) : ctx.moveTo(u, v); }); };
      g.strokeStyle = 'rgba(0,0,0,.95)'; g.lineWidth = w * 4; g.lineJoin = 'miter'; path(g); g.stroke();
      gg.strokeStyle = col; gg.lineWidth = w * 9; gg.filter = 'blur(6px)'; path(gg); gg.stroke(); gg.filter = 'none'; gg.strokeStyle = '#fff'; gg.lineWidth = w * 1.5; path(gg); gg.stroke();
    };
    drawLine(x, z, dir, len, 2.2, 2);
    crackT.needsUpdate = glowT.needsUpdate = true; W.glowA = 1;
  };
  W.glowA = 0; W.glowDec = glowDec;
  W.clearCracks = () => { crackC.getContext('2d').clearRect(0, 0, cs, cs); glowC.getContext('2d').clearRect(0, 0, cs, cs); crackT.needsUpdate = glowT.needsUpdate = true; W.glowA = 0; };
  W.crackAt = (cx, cz) => { W.crackDec.forEach(m => m.position.set(cx, m.position.y, cz)); W.crackOrigin = [cx, cz]; };

  W.update = (dt, cam) => {
    skyMat.uniforms.uTime.value = S.dir;
    if (W.grassU) W.grassU.uTime.value = S.world;
    W.glowA = Math.max(0, W.glowA - dt * 0.25); glowDec.material.opacity = W.glowA;
    // feuilles
    const m = new THREE.Matrix4(), q2 = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    W.leafData.forEach((l, i) => {
      if (dt > 0) {
        l.p.y -= l.v * dt; l.p.x += (0.6 + Math.sin(S.world * 0.8 + l.ph) * 0.6) * dt * (W.windMul ?? 1); l.p.z += Math.cos(S.world + l.ph) * 0.2 * dt;
        l.r.x += dt * 2 * l.v; l.r.y += dt * 1.3;
        if (l.p.y < 0.02) { l.p.y = rand(6, 9); l.p.x = rand(-16, 10); }
      }
      q2.setFromEuler(l.r); m.compose(l.p, q2, one); W.leaves.setMatrixAt(i, m);
    });
    W.leaves.instanceMatrix.needsUpdate = true;
    // lanternes vacillantes
    W.lanterns.forEach((l, i) => (l.intensity = 3.5 + Math.sin(S.dir * 13 + i) * 0.4 + Math.sin(S.dir * 7.3 + i * 2) * 0.3));
    // coupe de la montagne
    const h = W.hero;
    if (h.cut) {
      const p = Math.min(1, (S.dir - h.cut) / 3.2), e = p * p * (3 - 2 * p);
      const slide = new THREE.Vector3(1, 0, 0).projectOnPlane(h.cutN).normalize().multiplyScalar(-e * 26);
      h.hi.position.copy(h.pos).add(slide).add(new THREE.Vector3(0, -e * e * 14, 0));
      h.hi.rotation.z = e * 0.12; h.line.material.opacity = Math.max(0, 1 - (S.dir - h.cut) / 1.2) * 2;
      h.planeHi.setFromNormalAndCoplanarPoint(h.cutN, h.cutP.clone().add(slide).add(new THREE.Vector3(0, -e * e * 14, 0)));
    }
    // coupe de la lune
    if (W.moonCut !== null) {
      const p = Math.min(1, (S.dir - W.moonCut) / 3), e = 1 - Math.pow(1 - p, 3);
      W.moonPlanes.forEach(({ m, plane, side }) => {
        const n = new THREE.Vector3(Math.cos(0.5), Math.sin(0.5), 0).multiplyScalar(side);
        const off = new THREE.Vector3(-Math.sin(0.5), Math.cos(0.5), 0).multiplyScalar(side * e * 3.5);
        m.position.copy(off);
        const nw = n.clone().transformDirection(W.moonGroup.matrixWorld);
        const pw = off.clone().applyMatrix4(W.moonGroup.matrixWorld);
        plane.setFromNormalAndCoplanarPoint(nw, pw);
      });
    } else {
      W.moonPlanes.forEach(({ plane }) => plane.set(new THREE.Vector3(0, 1, 0), 1e5));
    }
  };
  return W;
}
