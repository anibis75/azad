// Techniques de la partie 2.
//  AZAD  — Barbe Noire : trou noir (Black Hole), Kurouzu (attraction), Liberation (rejet) · Garp : Galaxy Impact, Genkotsu Meteor
//  REMI  — Aokiji : Ice Age (gel qui se propage), Ice Time (gangue de glace), Partisan (lances de glace), Pheasant Beak (oiseau de glace), Ice Saber
//  SYLINA — Imu + Chevalier divin : lances de lumière, Domi Reversi (résurrection dans le cercle), vingt épées du jugement, flamme mère
import * as THREE from 'three';
import { S, rand, clamp, lerp, pick } from './engine.js';

const V3 = THREE.Vector3;
const add = THREE.AdditiveBlending;
const NOISE = /* glsl */`
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n2(p); p *= 2.03; a *= 0.5; } return v; }`;

export class Powers {
  constructor(scene, FX, DV, env, camera) {
    Object.assign(this, { scene, FX, DV, env, camera });
    this.list = [];
    this.iceMat = new THREE.MeshStandardMaterial({ color: 0xbfeaff, roughness: 0.06, metalness: 0.15, envMap: env, envMapIntensity: 1.6, transparent: true, opacity: 0.82, emissive: 0x1a5a7a, emissiveIntensity: 0.3, flatShading: true });
    this.iceGlow = new THREE.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.08, blending: add, depthWrite: false, side: THREE.BackSide });
    this.lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, blending: add, depthWrite: false });
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x3a3238, roughness: 0.9, flatShading: true, emissive: 0x200a04 });
    this.swordMat = new THREE.MeshStandardMaterial({ color: 0xf0f2ff, metalness: 1, roughness: 0.12, envMap: env, emissive: 0x4a3a10, emissiveIntensity: 0.5 });
    this.goldMat = new THREE.MeshStandardMaterial({ color: 0xe0b050, metalness: 1, roughness: 0.3, envMap: env });
    this.cICE = new THREE.Color(0x8fe8ff); this.cWHITE = new THREE.Color(0xffffff); this.cDARK = new THREE.Color(0x000000); this.cGOLD = new THREE.Color(0xffd890); this.cPURP = new THREE.Color(0xa040ff); this.cBLUE = new THREE.Color(0x3f7bff);
  }
  push(o) { this.list.push(o); return o; }
  rm(m) { if (m) { this.scene.remove(m); m.traverse?.(o => { if (o.geometry && o.geometry !== this._shared) o.geometry.dispose?.(); }); } }

  /* =================================== AZAD : BARBE NOIRE =================================== */
  // trou noir au sol : disque tourbillonnant + entonnoir + particules aspirées
  blackHole(center, R = 6, dur = 4, grow = 0.6) {
    const u = { uTime: { value: 0 }, uA: { value: 0 } };
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: NOISE + `uniform float uTime, uA; varying vec2 vUv; void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
        float sw = fbm(vec2(a * 2.0 + r * 6.0 - uTime * 2.5, r * 4.0 - uTime * 0.7));
        float core = smoothstep(0.75, 0.2, r); vec3 col = mix(vec3(0.0), vec3(0.18, 0.04, 0.32), smoothstep(0.3, 1.0, r) * sw);
        col += vec3(0.35, 0.12, 0.8) * smoothstep(0.08, 0.0, abs(r - 0.95 + sw * 0.08)) * 1.6;
        float al = (core + (1.0 - smoothstep(0.85, 1.0, r)) * (0.5 + sw * 0.5)) * uA; gl_FragColor = vec4(col, clamp(al, 0.0, 1.0)); }` }));
    disc.rotation.x = -Math.PI / 2; disc.position.copy(center).setY((center.y || 0) + 0.04); disc.renderOrder = 3; this.scene.add(disc);
    const fu = { uTime: { value: 0 }, uA: { value: 0 } };
    const fun = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.08, 1, 48, 12, true), new THREE.ShaderMaterial({ uniforms: fu, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: NOISE + `uniform float uTime, uA; varying vec2 vUv; void main(){ float s = fbm(vec2(vUv.x * 10.0 + vUv.y * 6.0 + uTime * 3.0, vUv.y * 3.0 - uTime));
        float band = smoothstep(0.45, 0.75, s); vec3 col = mix(vec3(0.0), vec3(0.3, 0.08, 0.55), band); gl_FragColor = vec4(col, (0.2 + band * 0.7) * uA * smoothstep(1.0, 0.6, vUv.y)); }` }));
    fun.position.copy(disc.position); fun.renderOrder = 4; this.scene.add(fun);
    return this.push({ type: 'bh', disc, fun, u, fu, c: disc.position.clone(), R, dur, t: 0, grow, suck: 1 });
  }
  // courant de ténèbres d'une cible vers une main (Kurouzu)
  darkStream(fromFn, toFn, dur = 1.2) { return this.push({ type: 'stream', fromFn, toFn, dur, t: 0 }); }
  // Liberation : rejette une gerbe de débris + ténèbres dans une direction
  liberation(p, dir, n = 40, sp = 22) {
    const d = dir.clone().normalize();
    for (let i = 0; i < n; i++) {
      const g = pick([new THREE.DodecahedronGeometry(1, 0), new THREE.IcosahedronGeometry(1, 0), new THREE.BoxGeometry(1.4, 0.4, 1)]);
      const m = new THREE.Mesh(g, i % 3 ? this.rockMat : this.DV.env ? this.goldMat : this.rockMat); m.scale.setScalar(rand(0.12, 0.45)); m.position.copy(p).add(new V3(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.4, 0.4))); m.castShadow = true; this.scene.add(m);
      const v = d.clone().multiplyScalar(sp * rand(0.5, 1.2)).add(new V3(rand(-1, 1), rand(-0.4, 1), rand(-1, 1)).multiplyScalar(sp * 0.3));
      this.DV.debris.push({ m, v, w: new V3(rand(-8, 8), rand(-8, 8), rand(-8, 8)), r: 0.3, life: 8 });
    }
    for (let i = 0; i < 60; i++) this.FX.smoke.spawn(p.clone(), d.clone().multiplyScalar(rand(4, 14)).add(new V3(rand(-2, 2), rand(-1, 2), rand(-2, 2))), rand(0.6, 1.2), rand(0.25, 0.6), this.cDARK, 0.8);
    for (let i = 0; i < 40; i++) this.FX.glow.spawn(p.clone(), d.clone().multiplyScalar(rand(6, 18)).add(new V3(rand(-3, 3), rand(-2, 3), rand(-3, 3))), rand(0.3, 0.7), rand(0.04, 0.1), this.cPURP, 0.7);
  }

  /* =================================== AZAD : GARP =================================== */
  // Galaxy Impact : disque galactique + coques d'onde de choc + étoiles
  galaxy(p, R = 40, dur = 3.2, face) {
    const u = { uTime: { value: 0 }, uA: { value: 1 }, uP: { value: 0 } };
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: add, side: THREE.DoubleSide, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: NOISE + `uniform float uTime, uA, uP; varying vec2 vUv; void main(){ vec2 p = (vUv - 0.5) * 2.0; float r = length(p); float a = atan(p.y, p.x);
        float arms = pow(0.5 + 0.5 * sin(a * 2.0 - log(r + 0.02) * 5.0 + uTime * 3.0), 3.0);
        float dust = fbm(vec2(a * 3.0 + r * 9.0 - uTime, r * 12.0)); float stars = step(0.985, h2(floor(p * 160.0))) * (0.6 + 0.4 * sin(uTime * 20.0 + p.x * 90.0));
        float fall = smoothstep(1.0, 0.1, r); vec3 col = vec3(1.0, 0.95, 0.9) * exp(-r * 7.0) * 3.0;
        col += mix(vec3(0.35, 0.5, 1.0), vec3(0.8, 0.4, 1.0), dust) * arms * fall * (0.6 + dust) ; col += vec3(1.0) * stars * fall;
        col += vec3(0.9, 0.95, 1.0) * smoothstep(0.03, 0.0, abs(r - uP)) * 1.5;
        gl_FragColor = vec4(col * uA, 1.0); }` }));
    disc.position.copy(p); disc.renderOrder = 12; this.scene.add(disc);
    if (face) disc.lookAt(p.clone().add(face)); else disc.quaternion.copy(this.camera.quaternion);
    // étoiles projetées
    for (let i = 0; i < 220; i++) { const d = new V3(rand(-1, 1), rand(-0.6, 1), rand(-1, 1)).normalize(); this.FX.glow.spawn(p.clone(), d.multiplyScalar(rand(4, 30)), rand(0.6, 1.6), rand(0.05, 0.16), pick([this.cWHITE, this.cBLUE, this.cPURP, this.cGOLD]), 0.9); }
    for (let i = 0; i < 120; i++) { const d = new V3(rand(-1, 1), rand(-0.3, 1), rand(-1, 1)).normalize(); this.FX.sparks.spawn(p.clone(), d.multiplyScalar(rand(10, 40)), rand(0.3, 0.9), rand(0.03, 0.07), pick([this.cWHITE, this.cBLUE]), 1); }
    this.DV.dome(p, 0xffffff, R * 0.25, dur * 0.35, 3); this.DV.dome(p, 0x6f9bff, R, dur * 0.7, 2); this.DV.dome(p, 0xb070ff, R * 1.3, dur, 1.6);
    return this.push({ type: 'galaxy', disc, u, R, dur, t: 0, face });
  }
  // poing haki : sphère noire crépitante autour d'un point (suivi)
  hakiFist(follow, r = 0.3, dur = 1.5) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85 }));
    const g = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshBasicMaterial({ color: 0xff2448, transparent: true, opacity: 0.5, blending: add, depthWrite: false, side: THREE.BackSide })); g.scale.setScalar(1.35); m.add(g);
    this.scene.add(m); return this.push({ type: 'fist', m, g, follow, r, dur, t: 0 });
  }
  // Genkotsu Meteor : rocher lancé en cloche, traînée de feu, explosion à l'impact
  meteor(from, to, size = 1, dur = 0.9, onHit) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 1), this.rockMat); m.position.copy(from); m.castShadow = true; this.scene.add(m);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(size * 1.25, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff6a20, transparent: true, opacity: 0.35, blending: add, depthWrite: false })); m.add(glow);
    return this.push({ type: 'meteor', m, from: from.clone(), to: to.clone(), size, dur, t: 0, onHit, arc: from.distanceTo(to) * 0.25 });
  }

  /* =================================== REMI : AOKIJI =================================== */
  // Ice Age : plaque de glace qui s'étend + couronne de pics de glace qui jaillissent sur le front
  iceAge(center, R = 18, dur = 1.6, y = 0, spikes = 70) {
    const u = { uR: { value: 0 }, uA: { value: 1 }, uTime: { value: 0 } };
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 96), new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: NOISE + `uniform float uR, uA, uTime; varying vec2 vP; void main(){ float r = length(vP); float edge = uR + (fbm(vP * 0.4) - 0.5) * 3.0; if (r > edge) discard;
        float cr = abs(fbm(vP * 0.35) - 0.5); float crack = 1.0 - smoothstep(0.0, 0.03, cr); float l = 0.55 + 0.45 * fbm(vP * 0.12 + 3.0);
        vec3 col = mix(vec3(0.22, 0.42, 0.58), vec3(0.62, 0.8, 0.92), l) + vec3(0.6, 0.9, 1.0) * crack * 0.5; col += step(0.994, h2(floor(vP * 6.0))) * 1.2;
        float rim = smoothstep(1.2, 0.0, edge - r); col += vec3(0.5, 0.8, 1.0) * rim * 0.8;
        gl_FragColor = vec4(col, uA * 0.88); }` }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(center.x, y + 0.03, center.z); disc.renderOrder = 2; this.scene.add(disc);
    const sp = [];
    for (let i = 0; i < spikes; i++) {
      const a = rand(6.28), r = Math.pow(Math.random(), 0.6) * R * 0.95, h = rand(0.6, 2.6) * (1 - r / R * 0.4);
      const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.22, h, 5), this.iceMat); m.position.set(center.x + Math.cos(a) * r, y - h, center.z + Math.sin(a) * r);
      m.rotation.set(rand(-0.5, 0.5), rand(3), rand(-0.5, 0.5)); m.castShadow = true; this.scene.add(m); sp.push({ m, h, at: r / R * dur, y });
    }
    return this.push({ type: 'iceage', disc, u, R, dur, t: 0, sp, c: center.clone(), y, hold: 1e9 });
  }
  // gangue de glace (Ice Time / Ice Ball) autour d'un point
  iceTime(p, r = 1.1, h = 2.2, dur = 0.5) {
    const g = new THREE.Group(); g.position.copy(p); this.scene.add(g);
    for (let i = 0; i < 16; i++) { const hh = rand(0.6, 1.4) * h * 0.6; const m = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), this.iceMat); m.scale.set(r * rand(0.35, 0.6), hh, r * rand(0.35, 0.6));
      const a = i / 16 * Math.PI * 2; m.position.set(Math.cos(a) * r * 0.45, rand(0.2, h * 0.75), Math.sin(a) * r * 0.45); m.rotation.set(rand(-0.4, 0.4), rand(3), rand(-0.4, 0.4)); g.add(m); }
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), this.iceGlow); shell.scale.set(r * 1.2, h * 0.7, r * 1.2); shell.position.y = h * 0.45; g.add(shell);
    g.scale.setScalar(0.01);
    for (let i = 0; i < 50; i++) this.FX.glow.spawn(p.clone().add(new V3(rand(-r, r), rand(0, h), rand(-r, r))), new V3(0, rand(0.2, 1), 0), rand(0.4, 0.9), rand(0.03, 0.07), this.cICE, 0.6);
    return this.push({ type: 'icetime', g, dur, t: 0, hold: 1e9 });
  }
  shatter(o, power = 7) {
    if (!o || !o.g) return; o.dead = true; const list = [...o.g.children];
    o.g.updateMatrixWorld(true);
    list.forEach(c => { if (c.material === this.iceGlow) { this.scene.remove(c); return; } const wp = c.getWorldPosition(new V3()), wq = c.getWorldQuaternion(new THREE.Quaternion()), ws = c.getWorldScale(new V3());
      c.removeFromParent(); this.scene.add(c); c.position.copy(wp); c.quaternion.copy(wq); c.scale.copy(ws);
      const d = wp.clone().sub(o.g.position).normalize(); this.DV.debris.push({ m: c, v: d.multiplyScalar(power * rand(0.5, 1.2)).add(new V3(0, rand(1, 4), 0)), w: new V3(rand(-6, 6), rand(-6, 6), rand(-6, 6)), r: 0.2, life: 6 }); });
    this.scene.remove(o.g);
    for (let i = 0; i < 80; i++) this.FX.sparks.spawn(o.g.position.clone().add(new V3(0, 1, 0)), new V3(rand(-1, 1), rand(-0.3, 1), rand(-1, 1)).normalize().multiplyScalar(rand(3, 10)), rand(0.3, 0.7), rand(0.02, 0.05), pick([this.cICE, this.cWHITE]), 1);
  }
  // Partisan : volée de lances de glace qui partent de derrière le lanceur
  partisan(origin, target, n = 9, spread = 2.5, speed = 34, stagger = 0.06) {
    const d = target.clone().sub(origin).normalize(), side = new V3().crossVectors(d, new V3(0, 1, 0)).normalize();
    for (let i = 0; i < n; i++) {
      const start = origin.clone().addScaledVector(side, rand(-spread, spread)).add(new V3(0, rand(0.3, spread * 0.9), 0)).addScaledVector(d, -rand(0.5, 1.5));
      const tgt = target.clone().add(new V3(rand(-1.2, 1.2), rand(-0.6, 0.6), rand(-1.2, 1.2)));
      const g = new THREE.Group(); const L = rand(1.8, 2.8);
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.12, L, 5), this.iceMat); m.rotation.x = Math.PI / 2; g.add(m);
      const gl = new THREE.Mesh(new THREE.ConeGeometry(0.22, L * 1.1, 6), this.iceGlow); gl.rotation.x = Math.PI / 2; g.add(gl);
      g.position.copy(start); g.lookAt(tgt); g.scale.setScalar(0.01); this.scene.add(g);
      this.push({ type: 'spear', g, from: start, to: tgt, delay: i * stagger, t: 0, speed, col: this.cICE, ice: true, stick: 1.2 });
    }
  }
  /* =================================== SYLINA : CHEVALIER DIVIN =================================== */
  // lances de lumière qui tombent du ciel sur une zone (ou des cibles)
  holySpears(targets, delay = 0.08, h = 26) {
    targets.forEach((tg, i) => {
      const start = tg.clone().add(new V3(rand(-3, 3), h, rand(-3, 3)));
      const g = new THREE.Group(); const L = 3.2;
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.09, L, 6), this.lightMat); core.rotation.x = Math.PI / 2; g.add(core);
      const glow = new THREE.Mesh(new THREE.ConeGeometry(0.3, L * 1.2, 8), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.35, blending: add, depthWrite: false })); glow.rotation.x = Math.PI / 2; g.add(glow);
      const guard = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 16), this.lightMat); guard.position.z = -L * 0.3; g.add(guard);
      g.position.copy(start); g.lookAt(tg); g.scale.setScalar(0.01); this.scene.add(g);
      this.push({ type: 'spear', g, from: start, to: tg.clone(), delay: i * delay, t: 0, speed: 46, col: this.cGOLD, holy: true, stick: 0.9 });
    });
  }
  // une seule lance géante (perce et cloue)
  bigSpear(from, to, col = 0xffe0a0, L = 8, speed = 60) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.28, L, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: add, depthWrite: false })); core.rotation.x = Math.PI / 2; g.add(core);
    const dark = new THREE.Mesh(new THREE.ConeGeometry(0.18, L * 0.95, 8), new THREE.MeshBasicMaterial({ color: 0x120018 })); dark.rotation.x = Math.PI / 2; g.add(dark);
    const glow = new THREE.Mesh(new THREE.ConeGeometry(0.8, L * 1.15, 10), new THREE.MeshBasicMaterial({ color: 0xa040ff, transparent: true, opacity: 0.35, blending: add, depthWrite: false })); glow.rotation.x = Math.PI / 2; g.add(glow);
    g.position.copy(from); g.lookAt(to); g.scale.setScalar(0.01); this.scene.add(g);
    return this.push({ type: 'spear', g, from: from.clone(), to: to.clone(), delay: 0, t: 0, speed, col: this.cPURP, holy: true, stick: 2.5, big: true });
  }
  // les vingt épées : apparaissent en couronne au-dessus d'un point, puis fondent sur des cibles
  swords(center, n = 20, R = 5, h = 7) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.03), this.swordMat); bl.position.y = -1.3; g.add(bl);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.3, 4), this.swordMat); tip.position.y = -2.75; tip.rotation.x = Math.PI; g.add(tip);
      const gd = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.09, 0.12), this.goldMat); g.add(gd);
      const hi = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x1a1020 })); hi.position.y = 0.33; g.add(hi);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.9, 0.1), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.3, blending: add, depthWrite: false })); glow.position.y = -1.4; g.add(glow);
      g.scale.setScalar(0.01); this.scene.add(g); list.push({ g, a: i / n * Math.PI * 2, state: 'orbit', t: 0 });
    }
    return this.push({ type: 'swords', list, c: center.clone(), R, h, t: 0, hold: 1e9 });
  }
  fireSwords(o, targetFn, every = 0.07) { o.list.forEach((s, i) => { s.fireAt = o.t + i * every; s.targetFn = targetFn; }); }

  // rayon horizontal (flamme renvoyée, souffle) entre deux points
  beam(from, to, col = 0xff3040, R = 1.2, dur = 1.0) {
    const d = to.clone().sub(from), L = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 24, 1, true), this.DV.pillarMat ? this.DV.pillarMat : new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: add, depthWrite: false, side: THREE.DoubleSide }));
    const core = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.4, R * 0.4, L, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: add, depthWrite: false }));
    m.add(core); m.position.copy(from).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.clone().normalize()); m.renderOrder = 9; this.scene.add(m);
    return this.push({ type: 'beam', m, core, dur, t: 0, R });
  }
  // rampe de glace (Aokiji glisse dessus) : tube qui pousse le long d'une courbe
  iceRamp(pts, dur = 0.6, hold = 2.5, r = 0.28) {
    const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, 80, r, 7, false);
    const m = new THREE.Mesh(geo, this.iceMat); m.geometry.setDrawRange(0, 0); m.castShadow = true; this.scene.add(m);
    return this.push({ type: 'ramp', m, geo, dur, hold, t: 0, total: geo.index.count, curve });
  }
  clearAll() {
    for (const o of this.list) { ['disc', 'fun', 'g', 'm', 'body'].forEach(k => o[k] && this.scene.remove(o[k])); (o.sp || []).forEach(s => this.scene.remove(s.m)); (o.list || []).forEach(s => this.scene.remove(s.g)); }
    this.list = [];
  }
  fade(o, d = 0.6) { if (o) { o.fadeOut = d; o.fT = d; } }

  update(dt) {
    const FX = this.FX, cam = this.camera;
    this.list = this.list.filter(o => {
      o.t += dt;
      const fo = o.fadeOut !== undefined ? clamp((o.fT -= dt) / o.fadeOut, 0, 1) : 1;
      if (o.type === 'bh') {
        const p = clamp(o.t / o.dur, 0, 1), inn = clamp(o.t / o.grow, 0, 1), out = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1, a = Math.min(inn, out) * fo;
        const r = o.R * (1 - Math.pow(1 - inn, 3)) * (0.9 + 0.1 * out); o.disc.scale.setScalar(Math.max(0.01, r)); o.u.uTime.value = S.dir; o.u.uA.value = a; o.fu.uTime.value = S.dir; o.fu.uA.value = a * 0.8;
        o.fun.scale.set(r * 0.8, r * 0.9 * a + 0.01, r * 0.8); o.fun.position.y = o.c.y + r * 0.45 * a;
        if (dt > 0) for (let i = 0; i < 8; i++) { const an = rand(6.28), rr = r * rand(0.8, 1.6), q = o.c.clone().add(new V3(Math.cos(an) * rr, rand(0, 2.5), Math.sin(an) * rr)); const v = o.c.clone().sub(q).multiplyScalar(2.2); v.add(new V3(-Math.sin(an), 0, Math.cos(an)).multiplyScalar(4));
          (i % 2 ? FX.glow : FX.smoke).spawn(q, v, rand(0.4, 0.8), i % 2 ? rand(0.03, 0.07) : rand(0.15, 0.35), i % 2 ? this.cPURP : this.cDARK, 0.7 * a); }
        // aspire débris et rochers
        if (dt > 0 && o.suck) for (const d of this.DV.debris) { const q = d.m.position, dd = o.c.clone().sub(q); const L = dd.length(); if (L < r * 2.2) { d.v.addScaledVector(dd.normalize(), dt * 40); if (L < r * 0.4) { d.m.scale.multiplyScalar(0.85); } } }
        if (p >= 1 || fo <= 0) { this.scene.remove(o.disc); this.scene.remove(o.fun); return false; }
      } else if (o.type === 'stream') {
        const a = o.fromFn(), b = o.toFn();
        if (dt > 0) for (let i = 0; i < 10; i++) { const s = Math.random(), q = a.clone().lerp(b, s).add(new V3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3)).multiplyScalar(1 - s));
          const v = b.clone().sub(a).normalize().multiplyScalar(rand(8, 16)); (i % 3 ? FX.smoke : FX.glow).spawn(q, v, rand(0.2, 0.4), i % 3 ? rand(0.1, 0.25) : 0.05, i % 3 ? this.cDARK : this.cPURP, 0.8); }
        if (o.t > o.dur) return false;
      } else if (o.type === 'galaxy') {
        const p = clamp(o.t / o.dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
        o.disc.scale.setScalar(Math.max(0.01, o.R * (0.15 + 0.85 * e))); if (!o.face) o.disc.quaternion.copy(cam.quaternion); else o.disc.rotateZ(dt * 0.6);
        o.u.uTime.value = S.dir; o.u.uP.value = 0.2 + 0.75 * e; o.u.uA.value = (p < 0.06 ? p / 0.06 : 1 - Math.pow(Math.max(0, (p - 0.35) / 0.65), 1.5)) * fo;
        if (p >= 1) { this.scene.remove(o.disc); return false; }
      } else if (o.type === 'fist') {
        const p = clamp(o.t / o.dur, 0, 1), pos = typeof o.follow === 'function' ? o.follow() : o.follow; o.m.position.copy(pos);
        const a = Math.min(1, o.t / 0.2) * (p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1) * fo; o.m.scale.setScalar(o.r * (1 + Math.sin(S.dir * 40) * 0.06) * Math.max(0.05, a)); o.m.material.opacity = 0.85 * a; o.g.material.opacity = 0.5 * a;
        if (dt > 0 && Math.random() < 0.8) FX.bolt(pos, new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)), rand(0.3, 0.9), 0.012, 0.12, pick([new THREE.Color(0xff2448), this.cDARK, this.cBLUE]));
        if (p >= 1) { this.scene.remove(o.m); return false; }
      } else if (o.type === 'meteor') {
        const p = clamp(o.t / o.dur, 0, 1), pos = o.from.clone().lerp(o.to, p); pos.y += Math.sin(p * Math.PI) * o.arc;
        o.m.position.copy(pos); o.m.rotation.x += dt * 5; o.m.rotation.z += dt * 3;
        if (dt > 0) for (let i = 0; i < 4; i++) { FX.smoke.spawn(pos.clone().add(new V3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3)).multiplyScalar(o.size)), new V3(rand(-1, 1), rand(0, 1), rand(-1, 1)), rand(0.5, 1), o.size * rand(0.4, 0.8), this.cDARK, 0.6);
          FX.glow.spawn(pos.clone(), new V3(rand(-2, 2), rand(-1, 2), rand(-2, 2)), rand(0.2, 0.4), o.size * rand(0.1, 0.25), new THREE.Color(0xff7a30), 0.7); }
        if (p >= 1) { this.scene.remove(o.m); this.DV.dome(o.to, 0xff9a50, o.size * 5, 0.6); FX.dustBurst(o.to, 24, 6); FX.spark(o.to, 40, [this.cWHITE, new THREE.Color(0xff9a50)], 8); FX.rock(o.to, 10, 7); o.onHit && o.onHit(o.to); return false; }
      } else if (o.type === 'iceage') {
        const p = clamp(o.t / o.dur, 0, 1), e = 1 - Math.pow(1 - p, 2); o.u.uR.value = o.R * e; o.u.uA.value = fo;
        for (const s of o.sp) { const k = clamp((o.t - s.at) / 0.18, 0, 1), out = 1 - fo; s.m.position.y = s.y - s.h + s.h * 0.92 * (1 - Math.pow(1 - k, 3)) - out * s.h; if (k > 0 && !s.fx && dt > 0) { s.fx = 1; FX.spark(s.m.position.clone().setY(s.y + 0.1), 3, [this.cICE, this.cWHITE], 4); } }
        if (dt > 0 && p < 1) for (let i = 0; i < 12; i++) { const an = rand(6.28), q = o.c.clone().add(new V3(Math.cos(an) * o.R * e, 0.1, Math.sin(an) * o.R * e)); q.y = o.y + 0.1; FX.dust.spawn(q, new V3(Math.cos(an) * 3, rand(0.5, 2), Math.sin(an) * 3), rand(0.6, 1.2), rand(0.3, 0.7), this.cICE, 0.5); }
        if (fo <= 0) { this.scene.remove(o.disc); o.sp.forEach(s => this.scene.remove(s.m)); return false; }
      } else if (o.type === 'icetime') {
        const k = clamp(o.t / o.dur, 0, 1); o.g.scale.setScalar(Math.max(0.01, 1 - Math.pow(1 - k, 3)));
        if (o.dead) return false;
        if (fo <= 0) { this.scene.remove(o.g); return false; }
      } else if (o.type === 'spear') {
        const t = o.t - o.delay; if (t < 0) return true;
        const L = o.from.distanceTo(o.to), T = L / o.speed, p = clamp(t / T, 0, 1);
        if (t < T) { o.g.position.lerpVectors(o.from, o.to, p); o.g.scale.setScalar(Math.min(1, t / 0.08) * (o.big ? 1 : 1));
          if (dt > 0) for (let i = 0; i < (o.big ? 6 : 2); i++) FX.glow.spawn(o.g.position.clone(), o.to.clone().sub(o.from).normalize().multiplyScalar(-rand(1, 4)), rand(0.15, 0.35), rand(0.04, 0.09) * (o.big ? 2 : 1), o.col, 0.7); }
        else if (!o.hit) { o.hit = 1; o.g.position.copy(o.to); const p0 = o.to.clone();
          FX.spark(p0, o.big ? 80 : 26, [this.cWHITE, o.col], o.big ? 10 : 6); FX.ring(p0.clone().setY(Math.max(0.05, p0.y)), { col: o.col.getHex(), size: o.big ? 8 : 3, life: 0.4, flat: p0.y < 0.3 });
          if (o.holy) this.DV.pillar(p0.clone().setY(Math.max(0, p0.y - 0.5)), 0xffe0a0, o.big ? 1.2 : 0.35, o.big ? 30 : 16, 0.5);
          if (p0.y < 0.4) FX.dustBurst(p0, o.big ? 20 : 6, 3, o.ice ? this.cICE : undefined); o.stuck = 0; }
        else { o.stuck += dt; if (o.stuck > o.stick) { const k = clamp((o.stuck - o.stick) / 0.4, 0, 1); o.g.scale.setScalar(1 - k); if (k >= 1) { this.scene.remove(o.g); return false; } } }
      } else if (o.type === 'beam') {
        const p = clamp(o.t / o.dur, 0, 1), a = (p < 0.1 ? p / 0.1 : 1 - Math.pow(Math.max(0, (p - 0.6) / 0.4), 1.5)) * fo;
        o.m.scale.set(a * (1 + Math.sin(S.dir * 60) * 0.06), 1, a * (1 + Math.sin(S.dir * 60) * 0.06)); o.m.material.opacity = a; o.core.material.opacity = a;
        if (p >= 1) { this.scene.remove(o.m); return false; }
      } else if (o.type === 'ramp') {
        const g = clamp(o.t / o.dur, 0, 1); o.m.geometry.setDrawRange(0, Math.floor(o.total * (1 - Math.pow(1 - g, 2)) / 6) * 6);
        if (dt > 0 && g < 1) { const q = o.curve.getPointAt(g); for (let i = 0; i < 4; i++) FX.glow.spawn(q.clone(), new V3(rand(-1, 1), rand(-0.5, 1), rand(-1, 1)), rand(0.3, 0.6), 0.05, this.cICE, 0.7); }
        if (o.t > o.dur + o.hold || fo <= 0) { const k = clamp((o.t - o.dur - o.hold) / 0.5, 0, 1); o.m.material = this.iceMat; o.m.scale.setScalar(1); if (k >= 1 || fo <= 0) { this.scene.remove(o.m); o.geo.dispose(); return false; } o.m.geometry.setDrawRange(Math.floor(o.total * k / 6) * 6, o.total); }
      } else if (o.type === 'swords') {
        for (const s of o.list) {
          s.t += dt;
          if (s.state === 'orbit') {
            const a = s.a + o.t * 0.8, p = o.c.clone().add(new V3(Math.cos(a) * o.R, o.h + Math.sin(o.t * 2 + s.a * 3) * 0.3, Math.sin(a) * o.R));
            s.g.position.copy(p); s.g.rotation.set(0, -a, 0); s.g.scale.setScalar(Math.min(1, s.t / 0.5) * fo + 0.001);
            if (s.fireAt !== undefined && o.t >= s.fireAt) { s.state = 'fly'; s.from = p.clone(); s.to = s.targetFn(s); s.ft = 0; }
          } else if (s.state === 'fly') {
            s.ft += dt; const k = clamp(s.ft / 0.22, 0, 1); s.g.position.lerpVectors(s.from, s.to, k * k);
            s.g.lookAt(s.to); s.g.rotateX(Math.PI / 2); s.g.rotateX(Math.PI);
            if (dt > 0) FX.glow.spawn(s.g.position.clone(), new V3(), 0.2, 0.06, this.cGOLD, 0.6);
            if (k >= 1) { s.state = 'stuck'; s.st = 0; FX.spark(s.to, 30, [this.cWHITE, this.cGOLD], 7); FX.ring(s.to.clone().setY(Math.max(0.05, s.to.y)), { col: 0xffd890, size: 3, life: 0.4 }); if (s.to.y < 0.5) FX.dustBurst(s.to, 6, 3); }
          } else if (s.state === 'stuck') { s.st += dt; if (s.st > 1.4) { const k = clamp((s.st - 1.4) / 0.5, 0, 1); s.g.scale.setScalar(1 - k); if (k >= 1) { s.state = 'gone'; this.scene.remove(s.g); } } }
        }
        if (o.list.every(s => s.state === 'gone') || fo <= 0) { o.list.forEach(s => this.scene.remove(s.g)); return false; }
      }
      return true;
    });
  }
}
