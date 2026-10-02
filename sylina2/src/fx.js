// Effets visuels : particules GPU, éclairs, anneaux, traînées, croissants
import * as THREE from 'three';
import { S, rand, clamp } from './engine.js';

/* ---------- textures procédurales ---------- */
function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const TEX = {
  soft: canvasTex(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  }),
  smoke: canvasTex(128, (g, s) => {
    for (let i = 0; i < 26; i++) {
      const x = s / 2 + rand(-14, 14), y = s / 2 + rand(-14, 14), rr = rand(12, 30);
      const r = g.createRadialGradient(x, y, 0, x, y, rr);
      r.addColorStop(0, 'rgba(255,255,255,.22)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, s, s);
    }
  }),
  ring: canvasTex(256, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.72, 'rgba(255,255,255,.15)');
    r.addColorStop(0.9, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  }),
};

/* ---------- particules GPU (le temps du monde pilote tout) ---------- */
export class GPUParticles {
  constructor(scene, max, o = {}) {
    this.max = max; this.i = 0;
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
    const mk = n => new THREE.InstancedBufferAttribute(new Float32Array(max * n), n).setUsage(THREE.DynamicDrawUsage);
    this.aP = mk(3); this.aV = mk(3); this.aT = mk(4); this.aC = mk(4);
    g.setAttribute('aP', this.aP); g.setAttribute('aV', this.aV); g.setAttribute('aT', this.aT); g.setAttribute('aC', this.aC);
    for (let i = 0; i < max; i++) this.aT.array[i * 4] = -1e6;
    g.instanceCount = max;
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uTex: { value: o.tex || TEX.soft }, uG: { value: new THREE.Vector3(0, o.gravity ?? 0, 0) },
        uDrag: { value: o.drag ?? 0 }, uStretch: { value: o.stretch ?? 0 }, uGrow: { value: o.grow ?? 0 }, uFade: { value: o.fadeIn ?? 0.05 },
      },
      vertexShader: /* glsl */`
        attribute vec3 aP; attribute vec3 aV; attribute vec4 aT; attribute vec4 aC;
        uniform float uTime, uDrag, uStretch, uGrow, uFade; uniform vec3 uG;
        varying vec2 vUv; varying vec4 vC;
        void main(){
          float t = uTime - aT.x, life = aT.y;
          if (t < 0.0 || t > life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
          float r = t / life;
          float k = max(uDrag, 1e-4);
          vec3 p = aP + aV * (1.0 - exp(-k * t)) / k + 0.5 * uG * t * t;
          vec3 v = aV * exp(-k * t) + uG * t;
          float size = aT.z * max(0.0, 1.0 + uGrow * r);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vec2 q = position.xy * size;
          if (uStretch > 0.0) {
            vec2 vv = (modelViewMatrix * vec4(v, 0.0)).xy;
            float l = length(vv);
            vec2 d = l > 1e-4 ? vv / l : vec2(1.0, 0.0);
            vec2 n = vec2(-d.y, d.x);
            q = d * position.x * (size + l * uStretch) + n * position.y * size;
          } else {
            float a = aT.w + t * 1.5;
            q = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
          }
          mv.xy += q;
          gl_Position = projectionMatrix * mv;
          vUv = uv;
          vC = aC;
          vC.a *= smoothstep(0.0, uFade, r) * (1.0 - r);
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uTex; varying vec2 vUv; varying vec4 vC;
        void main(){ vec4 t = texture2D(uTex, vUv); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }`,
      transparent: true, depthWrite: false,
      blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = o.order ?? 5;
    scene.add(this.mesh);
    this.dirty = false;
  }
  spawn(p, v, life, size, col, alpha = 1) {
    const i = this.i; this.i = (this.i + 1) % this.max;
    this.aP.array.set([p.x, p.y, p.z], i * 3);
    this.aV.array.set([v.x, v.y, v.z], i * 3);
    this.aT.array.set([S.world, life, size, Math.random() * 6.28], i * 4);
    this.aC.array.set([col.r, col.g, col.b, alpha], i * 4);
    this.dirty = true;
  }
  update() {
    this.mat.uniforms.uTime.value = S.world;
    if (this.dirty) { this.aP.needsUpdate = this.aV.needsUpdate = this.aT.needsUpdate = this.aC.needsUpdate = true; this.dirty = false; }
  }
}

/* ---------- éclairs du haki (rubans face caméra, 3 couches) ---------- */
export class Lightning {
  constructor(scene, maxV = 24000) {
    this.bolts = []; this.maxV = maxV;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(maxV * 3); this.side = new Float32Array(maxV * 3); this.col = new Float32Array(maxV * 4); this.u = new Float32Array(maxV);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSide', new THREE.BufferAttribute(this.side, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aU', new THREE.BufferAttribute(this.u, 1).setUsage(THREE.DynamicDrawUsage));
    this.g = g;
    const mk = (scale, mode, blending, order) => {
      const m = new THREE.ShaderMaterial({
        uniforms: { uScale: { value: scale }, uMode: { value: mode } },
        vertexShader: /* glsl */`
          attribute vec3 aSide; attribute vec4 aCol; attribute float aU; uniform float uScale; varying vec4 vC; varying float vS;
          void main(){ vC = aCol; vS = aU;
            vec3 p = position + aSide * uScale; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
        fragmentShader: /* glsl */`
          uniform float uMode; varying vec4 vC; varying float vS;
          void main(){
            float f = 1.0 - abs(vS);
            if (uMode < 0.5) gl_FragColor = vec4(vC.rgb * 1.4, vC.a * 0.5 * f * f);
            else if (uMode < 1.5) gl_FragColor = vec4(mix(vC.rgb * 2.0, vec3(2.2), smoothstep(0.55, 1.0, f)), vC.a * smoothstep(0.0, 0.5, f));
            else gl_FragColor = vec4(0.0, 0.0, 0.0, vC.a * smoothstep(0.1, 0.6, f));
          }`,
        transparent: true, depthWrite: false, blending, side: THREE.DoubleSide,
      });
      const me = new THREE.Mesh(g, m); me.frustumCulled = false; me.renderOrder = order; scene.add(me); return me;
    };
    mk(9, 0, THREE.AdditiveBlending, 6);
    mk(2.2, 1, THREE.AdditiveBlending, 7);
    mk(1.3, 2, THREE.NormalBlending, 8);
  }
  add(o, dir, len, w, life, col) {
    if (this.bolts.length > 110) return;
    const paths = [];
    const build = (p0, d0, L, W, depth) => {
      const n = Math.max(4, Math.round(L / 0.09)), st = L / n, pts = [p0.clone()];
      const p = p0.clone(), d = d0.clone();
      for (let i = 0; i < n; i++) {
        d.x += rand(-0.55, 0.55); d.y += rand(-0.55, 0.55); d.z += rand(-0.55, 0.55);
        d.lerp(d0, 0.35).normalize();
        p.addScaledVector(d, st); pts.push(p.clone());
        if (depth > 0 && Math.random() < 0.18) {
          const bd = d.clone().add(new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1))).normalize();
          build(p.clone(), bd, L * rand(0.25, 0.5) * (1 - i / n), W * 0.6, depth - 1);
        }
      }
      paths.push({ pts, w: W });
    };
    build(o.clone(), dir.clone().normalize(), len, w, 2);
    this.bolts.push({ paths, life, max: life, col: new THREE.Color(col) });
  }
  update(dt, cam) {
    this.bolts = this.bolts.filter(b => (b.life -= dt) > 0);
    let v = 0;
    const cp = cam.position, t = new THREE.Vector3(), vd = new THREE.Vector3(), sd = new THREE.Vector3();
    const push = (p, s, c, a, u) => {
      if (v >= this.maxV) return;
      this.u[v] = u;
      this.pos[v * 3] = p.x; this.pos[v * 3 + 1] = p.y; this.pos[v * 3 + 2] = p.z;
      this.side[v * 3] = s.x; this.side[v * 3 + 1] = s.y; this.side[v * 3 + 2] = s.z;
      this.col[v * 4] = c.r; this.col[v * 4 + 1] = c.g; this.col[v * 4 + 2] = c.b; this.col[v * 4 + 3] = a;
      v++;
    };
    for (const b of this.bolts) {
      if (!S.frozen && Math.random() < 0.12) continue;
      const a = clamp(b.life / b.max * 1.5, 0, 1);
      for (const pth of b.paths) {
        const P = pth.pts;
        for (let i = 0; i < P.length - 1; i++) {
          if (v + 6 >= this.maxV) break;
          t.subVectors(P[i + 1], P[i]).normalize();
          const hw = pth.w * 0.5;
          vd.subVectors(cp, P[i]).normalize(); sd.crossVectors(t, vd).normalize().multiplyScalar(hw);
          const s0 = sd.clone();
          vd.subVectors(cp, P[i + 1]).normalize(); sd.crossVectors(t, vd).normalize().multiplyScalar(hw);
          const s1 = sd.clone(), n0 = s0.clone().negate(), n1 = s1.clone().negate();
          push(P[i], n0, b.col, a, -1); push(P[i], s0, b.col, a, 1); push(P[i + 1], s1, b.col, a, 1);
          push(P[i], n0, b.col, a, -1); push(P[i + 1], s1, b.col, a, 1); push(P[i + 1], n1, b.col, a, -1);
        }
      }
    }
    this.g.setDrawRange(0, v);
    this.g.attributes.position.needsUpdate = this.g.attributes.aSide.needsUpdate = this.g.attributes.aCol.needsUpdate = this.g.attributes.aU.needsUpdate = true;
  }
}

/* ---------- anneaux d'onde de choc ---------- */
export class Rings {
  constructor(scene) { this.scene = scene; this.list = []; }
  add(pos, { col = 0xffffff, size = 6, life = 0.6, flat = false, face = null, width = 1 } = {}) {
    const m = new THREE.MeshBasicMaterial({ map: TEX.ring, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const me = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
    me.position.copy(pos); me.renderOrder = 9;
    if (flat) me.rotation.x = -Math.PI / 2;
    this.scene.add(me);
    this.list.push({ me, life, max: life, size, flat, face, width });
  }
  update(dt, cam) {
    this.list = this.list.filter(r => {
      r.life -= dt;
      if (r.life <= 0) { this.scene.remove(r.me); r.me.geometry.dispose(); r.me.material.dispose(); return false; }
      const p = 1 - r.life / r.max, s = 0.2 + r.size * (1 - Math.pow(1 - p, 3));
      r.me.scale.set(s, s, s);
      if (!r.flat) { if (r.face) r.me.lookAt(r.face); else r.me.quaternion.copy(cam.quaternion); }
      r.me.material.opacity = Math.pow(1 - p, 1.4) * r.width;
      return true;
    });
  }
}

/* ---------- traînée de lame ---------- */
export class Trail {
  constructor(scene, col) {
    this.n = 18; this.samples = [];
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.n * 2 * 3); this.al = new Float32Array(this.n * 2 * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(this.al, 2).setUsage(THREE.DynamicDrawUsage));
    const idx = []; for (let i = 0; i < this.n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) } },
      vertexShader: `attribute vec2 aA; varying vec2 vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uCol; varying vec2 vA;
        void main(){ float edge = smoothstep(0.0, 1.0, vA.y); vec3 c = mix(uCol * 1.5, vec3(1.6), pow(edge, 3.0));
          gl_FragColor = vec4(c, vA.x * edge * 0.9); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 7;
    scene.add(this.mesh);
  }
  push(base, tip, dt) {
    const last = this.samples[0];
    let sp = 0;
    if (last && dt > 0) sp = tip.distanceTo(last.t) / dt;
    if (last && tip.distanceTo(last.t) > 1.4) this.samples = [];
    if (dt > 0) this.samples.unshift({ b: base.clone(), t: tip.clone(), sp, age: 0 });
    this.samples.forEach(s => (s.age += dt));
    this.samples = this.samples.filter(s => s.age < 0.14).slice(0, this.n);
    const N = this.samples.length;
    for (let i = 0; i < this.n; i++) {
      const s = this.samples[Math.min(i, N - 1)];
      if (!s) { this.al.fill(0); break; }
      this.pos.set([s.b.x, s.b.y, s.b.z], i * 6); this.pos.set([s.t.x, s.t.y, s.t.z], i * 6 + 3);
      const a = i < N ? clamp((s.sp - 6) / 10, 0, 1) * (1 - s.age / 0.14) : 0;
      this.al.set([a, 0, a, 1], i * 4);
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.aA.needsUpdate = true;
  }
  clear() { this.samples = []; this.al.fill(0); this.mesh.geometry.attributes.aA.needsUpdate = true; }
}

/* ---------- croissant (onde tranchante) ---------- */
export function crescentMesh(col) {
  const s = new THREE.Shape();
  s.absarc(0, 0, 1, -1.25, 1.25, false);
  s.absarc(-0.42, 0, 0.86, 1.1, -1.1, true);
  const geo = new THREE.ShapeGeometry(s, 32);
  const grp = new THREE.Group();
  const glow = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  glow.scale.set(1.12, 1.18, 1);
  const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  core.scale.set(0.96, 0.92, 1); core.position.z = 0.01;
  const hot = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  hot.scale.set(1.02, 0.5, 1); hot.position.set(0.12, 0, 0.02);
  glow.renderOrder = 8; core.renderOrder = 9; hot.renderOrder = 10;
  grp.add(glow, core, hot);
  grp.userData.mats = [glow.material, core.material, hot.material];
  return grp;
}
