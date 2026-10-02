// FX « divins » : débris physiques, dômes d'onde de choc, sphères d'énergie, colonne de foudre (El Thor),
// tentacules et pics de ténèbres (Imu), cercles magiques.
import * as THREE from 'three';
import { S, rand, clamp, lerp, pick } from './engine.js';

const V3 = THREE.Vector3;
const fresnelMat = (col, power = 2.2, alpha = 1, inner = 0) => new THREE.ShaderMaterial({
  uniforms: { uCol: { value: new THREE.Color(col) }, uA: { value: alpha }, uP: { value: power }, uIn: { value: inner }, uTime: { value: 0 } },
  vertexShader: `varying vec3 vN, vV, vP; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA, uP, uIn, uTime; varying vec3 vN, vV, vP;
    float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
    void main(){ float f = pow(1.0 - abs(dot(vN, vV)), uP); float sw = 0.5 + 0.5 * sin(atan(vP.z, vP.x) * 6.0 + vP.y * 8.0 - uTime * 14.0);
      float a = (f + uIn * (0.5 + 0.5 * sw)) * uA; gl_FragColor = vec4(uCol * (0.45 + f * 0.9), clamp(a, 0.0, 0.85)); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});

export class Divine {
  constructor(scene, FX, env) {
    this.scene = scene; this.FX = FX; this.env = env;
    this.debris = []; this.domes = []; this.orbs = []; this.pillars = []; this.tendrils = []; this.spikes = []; this.circles = [];
    this.floorY = 0;
  }
  /* ---------- débris : un groupe se brise en morceaux physiques ---------- */
  breakGroup(group, center, power = 8, up = 4) {
    const list = []; group.updateMatrixWorld(true);
    group.traverse(o => { if (o.isMesh) list.push(o); });
    for (const o of list) {
      const wp = o.getWorldPosition(new V3()), wq = o.getWorldQuaternion(new THREE.Quaternion()), ws = o.getWorldScale(new V3());
      o.removeFromParent(); this.scene.add(o); o.position.copy(wp); o.quaternion.copy(wq); o.scale.copy(ws);
      const d = wp.clone().sub(center); d.y = Math.max(0, d.y) * 0.3; const dist = Math.max(1, d.length()); d.normalize();
      const k = power / Math.sqrt(dist);
      this.debris.push({ m: o, v: d.multiplyScalar(k * rand(0.6, 1.2)).add(new V3(0, rand(0.5, 1) * up, 0)), w: new V3(rand(-4, 4), rand(-4, 4), rand(-4, 4)), r: 0.5 * Math.max(ws.x, ws.y, ws.z), life: 12 });
    }
  }
  // lance un objet unique (pierre dressée, lanterne entière…)
  launch(o, v, w) { const wp = o.getWorldPosition(new V3()); o.removeFromParent(); this.scene.add(o); o.position.copy(wp); this.debris.push({ m: o, v, w: w || new V3(rand(-3, 3), rand(-3, 3), rand(-3, 3)), r: 0.5, life: 12 }); }
  // dalles instanciées du domaine d'Imu : on les soulève dans un rayon
  breakTiles(ST, center, radius, power = 6) {
    const m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const t of ST.tiles) {
      if (t.gone) continue; const d = Math.hypot(t.x - center.x, t.z - center.z); if (d > radius) continue;
      t.gone = true; ST.tileMesh.setMatrixAt(t.i, zero);
      const m = new THREE.Mesh(ST.tileGeo, ST.tileMat); m.position.set(t.x, -0.1, t.z); m.castShadow = true; this.scene.add(m);
      const dir = new V3(t.x - center.x, 0, t.z - center.z).normalize();
      this.debris.push({ m, v: dir.multiplyScalar(power * (1 - d / radius) * rand(0.4, 1)).add(new V3(0, power * rand(0.6, 1.3) * (1 - d / radius * 0.6), 0)), w: new V3(rand(-5, 5), rand(-5, 5), rand(-5, 5)), r: 0.2, life: 10, float: ST.floatTiles ? rand(1, 5) : 0 });
    }
    ST.tileMesh.instanceMatrix.needsUpdate = true;
  }
  /* ---------- dôme d'onde de choc ---------- */
  dome(p, col, R, dur = 1.2, power = 2.4, inner = 0) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), fresnelMat(col, power, 1, inner)); m.position.copy(p); m.renderOrder = 9; this.scene.add(m);
    this.domes.push({ m, R, dur, t: 0 }); return m;
  }
  /* ---------- sphère d'énergie (suivi d'une cible) ---------- */
  orb(col, r, follow, inner = 0.5, core = 0xffffff) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), fresnelMat(col, 1.6, 1, inner));
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12), new THREE.MeshBasicMaterial({ color: core, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(shell, c); g.scale.setScalar(0.01); this.scene.add(g); g.renderOrder = 9;
    const o = { g, shell, c, r, follow, col: new THREE.Color(col), t: 0, alive: true, target: r };
    this.orbs.push(o); return o;
  }
  kill(o, fade = 0.3) { o.dying = fade; o.dT = fade; }
  /* ---------- colonne de foudre (El Thor) ---------- */
  pillar(p, col, R = 2.2, H = 60, dur = 1.6) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uA: { value: 1 }, uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uCol; uniform float uA, uTime; varying vec2 vUv; varying vec3 vN, vV;
        float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
        void main(){ float f = abs(dot(vN, vV)); float s = 0.0; for (int i = 0; i < 6; i++) { float fi = float(i); s += smoothstep(0.985, 1.0, sin(vUv.x * 60.0 + fi * 13.0 + sin(vUv.y * 20.0 + uTime * (20.0 + fi * 7.0)) * 2.0)); }
          vec3 col = mix(uCol * 1.5, vec3(2.2), pow(f, 3.0)) + vec3(1.5) * s; gl_FragColor = vec4(col, uA * (pow(f, 1.5) * 0.9 + s * 0.4)); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.8, H, 32, 1, true), mat); m.position.set(p.x, p.y + H / 2, p.z); m.renderOrder = 9; this.scene.add(m);
    this.pillars.push({ m, dur, t: 0, R }); return m;
  }
  /* ---------- tentacules de ténèbres ---------- */
  tendril(from, to, width = 0.12, dur = 0.5, hold = 1.2, col = 0x9a30ff) {
    const mid = from.clone().lerp(to, 0.5).add(new V3(rand(-2, 2), rand(1.5, 3.5), rand(-2, 2)));
    const pts = [from, from.clone().lerp(mid, 0.5).add(new V3(rand(-1, 1), rand(0, 1), rand(-1, 1))), mid, mid.clone().lerp(to, 0.5).add(new V3(rand(-0.6, 0.6), rand(-0.3, 0.6), rand(-0.6, 0.6))), to];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 64, width, 8, false);
    // effilement vers la pointe
    const pa = geo.attributes.position, uv = geo.attributes.uv; const cp = new V3();
    for (let i = 0; i < pa.count; i++) { const t = uv.getX(i); curve.getPointAt(Math.min(1, t), cp); const v = new V3(pa.getX(i), pa.getY(i), pa.getZ(i)).sub(cp).multiplyScalar(1 - t * 0.85); pa.setXYZ(i, cp.x + v.x, cp.y + v.y, cp.z + v.z); }
    const mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uA: { value: 1 } },
      vertexShader: `varying vec3 vN, vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN, vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(uCol * f * 2.2, 1.0) * uA; }`,
    });
    const m = new THREE.Mesh(geo, mat); m.geometry.setDrawRange(0, 0); this.scene.add(m); m.castShadow = true;
    const T = { m, geo, dur, hold, t: 0, total: geo.index.count, curve }; this.tendrils.push(T); return T;
  }
  /* ---------- pics noirs qui jaillissent du sol, en ligne vers une cible ---------- */
  spikeLine(from, to, n = 10, h = 2.2, col = 0x14081c) {
    const d = to.clone().sub(from); d.y = 0; const L = d.length(); d.normalize();
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.6, envMap: this.env, emissive: 0x2a0840, flatShading: true });
    for (let i = 0; i < n; i++) {
      const p = from.clone().addScaledVector(d, (i + 1) / n * L).add(new V3(rand(-0.5, 0.5), 0, rand(-0.5, 0.5)));
      const hh = h * rand(0.6, 1.3) * (0.6 + 0.6 * i / n);
      const m = new THREE.Mesh(new THREE.ConeGeometry(hh * 0.18, hh, 5), mat); m.position.set(p.x, -hh / 2, p.z); m.rotation.set(rand(-0.3, 0.3), rand(3), rand(-0.3, 0.3)); m.castShadow = true; this.scene.add(m);
      this.spikes.push({ m, h: hh, delay: i * 0.045, t: 0, life: 2.2 });
    }
  }
  /* ---------- cercle magique ---------- */
  circle(tex, p, col, size, dur = 3, vertical = null, spin = 0.6) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false }));
    m.position.copy(p); if (vertical) m.lookAt(p.clone().add(vertical)); else m.rotation.x = -Math.PI / 2; m.renderOrder = 8;
    this.scene.add(m); this.circles.push({ m, size, dur, t: 0, spin }); return m;
  }
  clearAll() {
    for (const d of this.debris) this.scene.remove(d.m); this.debris = [];
    for (const s of this.spikes) this.scene.remove(s.m); this.spikes = [];
    for (const t of this.tendrils) { this.scene.remove(t.m); t.geo.dispose(); } this.tendrils = [];
  }
  update(dt) {
    const g = -11;
    this.debris = this.debris.filter(d => {
      if (dt > 0) {
        if (d.float && d.v.y < 0.3 && d.m.position.y > d.float * 0.5) { d.v.multiplyScalar(Math.pow(0.2, dt)); d.m.position.y += Math.sin(S.world * 2 + d.r * 40) * 0.003; }
        else d.v.y += g * dt;
        d.m.position.addScaledVector(d.v, dt);
        d.m.rotation.x += d.w.x * dt; d.m.rotation.y += d.w.y * dt; d.m.rotation.z += d.w.z * dt;
        const fy = this.floorY + d.r * 0.5;
        if (d.m.position.y < fy && !this.noFloor) { d.m.position.y = fy; d.v.y *= -0.25; d.v.x *= 0.55; d.v.z *= 0.55; d.w.multiplyScalar(0.5); }
      }
      return true;
    });
    this.domes = this.domes.filter(o => {
      o.t += dt; const p = clamp(o.t / o.dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      o.m.scale.setScalar(Math.max(0.01, o.R * e)); o.m.material.uniforms.uA.value = (1 - p) * (1 - p) * 1.4; o.m.material.uniforms.uTime.value = S.dir;
      if (p >= 1) { this.scene.remove(o.m); o.m.material.dispose(); return false; }
      return true;
    });
    this.orbs = this.orbs.filter(o => {
      o.t += dt;
      if (o.follow) { const p = typeof o.follow === 'function' ? o.follow() : o.follow; o.g.position.copy(p); }
      const k = o.dying !== undefined ? Math.max(0, (o.dT -= dt) / o.dying) : 1;
      const r = o.r * Math.min(1, o.t / 0.35) * (o.dying !== undefined ? 1 + (1 - k) * 0.6 : 1) * (1 + Math.sin(S.dir * 40) * 0.04);
      o.g.scale.setScalar(Math.max(0.01, r)); o.shell.material.uniforms.uTime.value = S.dir; o.shell.material.uniforms.uA.value = k; o.c.material.opacity = k * 0.35;
      if (dt > 0 && Math.random() < 0.8) { const q = o.g.position.clone().add(new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(r * rand(1, 2.2))); this.FX.glow.spawn(q, o.g.position.clone().sub(q).multiplyScalar(2.5), rand(0.2, 0.4), rand(0.03, 0.08) * Math.max(1, r), o.col, 0.6); }
      if (o.dying !== undefined && k <= 0) { this.scene.remove(o.g); return false; }
      return true;
    });
    this.pillars = this.pillars.filter(o => {
      o.t += dt; const p = o.t / o.dur, u = o.m.material.uniforms; u.uTime.value = S.dir;
      const a = p < 0.08 ? p / 0.08 : Math.max(0, 1 - (p - 0.6) / 0.4); u.uA.value = a; o.m.scale.set(1 + (1 - a) * 0.3 + Math.sin(S.dir * 60) * 0.05, 1, 1 + (1 - a) * 0.3 + Math.sin(S.dir * 60) * 0.05);
      if (p >= 1) { this.scene.remove(o.m); return false; }
      return true;
    });
    this.tendrils = this.tendrils.filter(T => {
      T.t += dt; const grow = clamp(T.t / T.dur, 0, 1), e = 1 - Math.pow(1 - grow, 3);
      const out = T.t > T.dur + T.hold ? clamp((T.t - T.dur - T.hold) / 0.4, 0, 1) : 0;
      T.m.geometry.setDrawRange(0, Math.floor(T.total * e / 6) * 6); T.m.material.uniforms.uA.value = 1 - out;
      if (out >= 1) { this.scene.remove(T.m); T.geo.dispose(); return false; }
      return true;
    });
    this.spikes = this.spikes.filter(s => {
      s.t += dt; const t = s.t - s.delay; if (t < 0) return true;
      const up = clamp(t / 0.12, 0, 1), down = t > s.life ? clamp((t - s.life) / 0.5, 0, 1) : 0;
      s.m.position.y = -s.h / 2 + s.h * 0.9 * (up - down);
      if (t > 0 && t - dt <= 0) { this.FX.dustBurst(s.m.position.clone().setY(0), 3, 2, new THREE.Color(0x201028)); this.FX.spark(s.m.position.clone().setY(0.1), 6, [new THREE.Color(0xa040ff), new THREE.Color(0xffffff)], 4); }
      if (down >= 1) { this.scene.remove(s.m); s.m.geometry.dispose(); return false; }
      return true;
    });
    this.circles = this.circles.filter(c => {
      c.t += dt; const p = c.t / c.dur, a = p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.75) / 0.25);
      c.m.material.opacity = a; c.m.scale.setScalar(c.size * (0.6 + 0.4 * Math.min(1, p / 0.15))); c.m.rotateZ(dt * c.spin);
      if (p >= 1) { this.scene.remove(c.m); return false; }
      return true;
    });
  }
}
