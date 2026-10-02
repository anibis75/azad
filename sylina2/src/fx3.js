// Techniques du film robots : ombres animales spectrales (tigre, dragon, faucon, baleine), vagues de tranchant,
// bulle sismique sur la lame, pas éclair (téléportation), masquage des objets qui cachent les personnages.
import * as THREE from 'three';
import { S, rand, clamp, lerp } from './engine.js';

const V3 = THREE.Vector3;
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// silhouettes lumineuses : trait blanc + halo, remplissage translucide
function glowPath(g, path, fillA = 0.35) {
  g.save(); g.shadowColor = '#fff'; g.shadowBlur = 30; g.fillStyle = `rgba(255,255,255,${fillA})`; path(); g.fill();
  g.shadowBlur = 12; g.lineWidth = 7; g.strokeStyle = 'rgba(255,255,255,.95)'; path(); g.stroke(); g.restore();
}
const TIGER = () => tex(1024, 1024, (g, w, h) => {
  g.translate(w / 2, h / 2 + 40);
  const head = () => { g.beginPath(); g.moveTo(-300, -60); g.bezierCurveTo(-340, -260, -200, -330, -150, -250); g.bezierCurveTo(-80, -300, 80, -300, 150, -250); g.bezierCurveTo(200, -330, 340, -260, 300, -60);
    g.bezierCurveTo(330, 80, 250, 220, 120, 280); g.lineTo(0, 330); g.lineTo(-120, 280); g.bezierCurveTo(-250, 220, -330, 80, -300, -60); g.closePath(); };
  glowPath(g, head, 0.1);
  g.fillStyle = 'rgba(0,0,0,.55)'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 60, -300); g.lineTo(s * 30, -170); g.lineTo(s * 90, -240); g.closePath(); g.fill(); for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(s * 300, -60 + k * 60); g.lineTo(s * 170, -40 + k * 55); g.lineTo(s * 290, -20 + k * 60); g.fill(); } }
  g.shadowColor = '#fff'; g.shadowBlur = 25; g.fillStyle = '#fff';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 50, -80); g.lineTo(s * 170, -110); g.lineTo(s * 120, -40); g.closePath(); g.fill(); }
  g.beginPath(); g.moveTo(-140, 130); g.quadraticCurveTo(0, 60, 140, 130); g.quadraticCurveTo(0, 290, -140, 130); g.fillStyle = 'rgba(0,0,0,.7)'; g.fill();
  g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 100, 125); g.lineTo(s * 80, 215); g.lineTo(s * 60, 118); g.fill(); }
});
const HAWK = () => tex(1024, 512, (g, w, h) => {
  g.translate(w / 2, h / 2);
  const wing = s => () => { g.beginPath(); g.moveTo(0, -10); g.bezierCurveTo(s * 120, -120, s * 300, -170, s * 490, -110); for (let k = 0; k < 7; k++) { const x = s * (480 - k * 50), y = -100 + k * 22; g.lineTo(x, y + 60); g.lineTo(x - s * 22, y + 20); } g.bezierCurveTo(s * 200, 40, s * 90, 40, 0, 40); g.closePath(); };
  glowPath(g, wing(1), 0.3); glowPath(g, wing(-1), 0.3);
  glowPath(g, () => { g.beginPath(); g.ellipse(0, 20, 55, 110, 0, 0, 7); }, 0.35);
  glowPath(g, () => { g.beginPath(); g.moveTo(-30, -70); g.quadraticCurveTo(0, -150, 30, -70); g.lineTo(0, -40); g.closePath(); }, 0.5);
  glowPath(g, () => { g.beginPath(); g.moveTo(-50, 120); g.lineTo(0, 220); g.lineTo(50, 120); g.closePath(); }, 0.3);
  g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 20; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 14, -95, 7, 0, 7); g.fill(); }
});
const WHALE = () => tex(1024, 512, (g, w, h) => {
  g.translate(w / 2, h / 2);
  const body = () => { g.beginPath(); g.moveTo(-460, 10); g.bezierCurveTo(-460, -120, -250, -170, 0, -150); g.bezierCurveTo(200, -130, 330, -60, 380, -10); g.lineTo(470, -110); g.quadraticCurveTo(440, 0, 490, 100); g.lineTo(380, 20);
    g.bezierCurveTo(300, 90, 100, 130, -100, 120); g.bezierCurveTo(-300, 110, -460, 110, -460, 10); g.closePath(); };
  glowPath(g, body, 0.28);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-380 + k * 40, 70); g.lineTo(-200 + k * 50, 105); g.stroke(); }
  g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 20; g.beginPath(); g.arc(-330, -20, 10, 0, 7); g.fill();
  glowPath(g, () => { g.beginPath(); g.moveTo(-150, 90); g.quadraticCurveTo(-120, 200, -40, 220); g.quadraticCurveTo(-60, 150, -80, 100); g.closePath(); }, 0.3);
});
const DRAGON_HEAD = () => tex(512, 512, (g, w, h) => {
  g.translate(w / 2, h / 2);
  glowPath(g, () => { g.beginPath(); g.moveTo(-200, 40); g.lineTo(-40, -60); g.lineTo(60, -120); g.lineTo(40, -60); g.lineTo(200, -40); g.lineTo(150, 0); g.lineTo(210, 40); g.lineTo(60, 60); g.lineTo(-40, 110); g.closePath(); }, 0.3);
  g.strokeStyle = '#fff'; g.lineWidth = 6; g.shadowColor = '#fff'; g.shadowBlur = 16; g.beginPath(); g.moveTo(-30, -60); g.bezierCurveTo(-60, -160, -140, -180, -210, -150); g.stroke(); g.beginPath(); g.moveTo(-20, 100); g.bezierCurveTo(-80, 180, -160, 190, -230, 150); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(40, -40, 12, 0, 7); g.fill();
});

export class Techniques {
  constructor(scene, FX, camera) {
    this.scene = scene; this.FX = FX; this.camera = camera; this.list = []; this.tex = {};
    this.getTex = k => (this.tex[k] = this.tex[k] || { tiger: TIGER, hawk: HAWK, whale: WHALE, dragon: DRAGON_HEAD }[k]());
    this.occ = []; this.ray = new THREE.Raycaster();
  }
  /* ---------- ombre animale (panneau face caméra, trajectoire + échelle + battement) ---------- */
  beast(kind, from, to, col, size, dur = 1.4, opts = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(kind === 'tiger' ? 1 : 2, 1), new THREE.MeshBasicMaterial({ map: this.getTex(kind), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.DoubleSide, fog: false }));
    m.renderOrder = 10; this.scene.add(m);
    this.list.push({ type: 'beast', kind, m, from: from.clone(), to: to.clone(), size, dur, t: 0, flap: opts.flap ?? (kind === 'hawk' ? 7 : 0), arc: opts.arc ?? (kind === 'whale' ? 6 : 1), face: opts.face });
    return m;
  }
  // dragon : corps en tube qui s'enroule vers le haut autour d'un point, tête dessinée
  dragon(center, col, R = 2.2, H = 9, dur = 2.4) {
    const N = 90, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 2 * 3), idx = [];
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
    const alpha = new Float32Array(N * 2); for (let i = 0; i < N; i++) alpha[i * 2] = alpha[i * 2 + 1] = i / N; geo.setAttribute('aA', new THREE.BufferAttribute(alpha, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(col) }, uA: { value: 0 }, uHead: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'attribute float aA; varying float vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uA, uHead; varying float vA; void main(){ float v = smoothstep(uHead - 0.55, uHead, vA) * step(vA, uHead); gl_FragColor = vec4(uCol * (0.6 + v), v * uA); }' });
    const body = new THREE.Mesh(geo, mat); body.frustumCulled = false; body.renderOrder = 10; this.scene.add(body);
    const head = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.getTex('dragon'), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.DoubleSide, fog: false }));
    head.renderOrder = 11; this.scene.add(head);
    this.list.push({ type: 'dragon', body, head, geo, mat, N, center: center.clone(), R, H, dur, t: 0 });
  }
  // vague de tranchant qui file loin (Taka Nami, Mihawk) : croissant géant + sillon au sol
  wave(from, dir, col, size = 3, speed = 40, dur = 1.2, vertical = false) {
    const sh = new THREE.Shape(); sh.absarc(0, 0, 1, Math.PI * 0.15, Math.PI * 0.85, false); sh.absarc(0, -0.35, 0.88, Math.PI * 0.8, Math.PI * 0.2, true);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 1, fog: false }));
    const core = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.8, fog: false })); core.scale.setScalar(0.96); m.add(core);
    const d = dir.clone().normalize(); m.position.copy(from); m.lookAt(from.clone().add(d)); if (!vertical) m.rotateZ(Math.PI / 2); m.scale.setScalar(size); m.renderOrder = 9; this.scene.add(m);
    this.list.push({ type: 'wave', m, core, v: d.multiplyScalar(speed), dur, t: 0, size });
    return m;
  }
  // bulle sismique (Barbe Blanche) : sphère blanche fissurée accrochée à un point (fonction)
  bubble(follow, r = 0.45, dur = 1.5) {
    const t = tex(512, 512, (g, w, h) => { g.strokeStyle = '#fff'; g.lineWidth = 3; g.shadowColor = '#bcd0ff'; g.shadowBlur = 8;
      for (let k = 0; k < 26; k++) { let x = rand(w), y = rand(h); g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += rand(-40, 40); y += rand(-40, 40); g.lineTo(x, y); } g.stroke(); } });
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ map: t, color: 0xdfe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: 0x9ab8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.BackSide }));
    m.add(glow); glow.scale.setScalar(1.15); m.renderOrder = 9; this.scene.add(m);
    this.list.push({ type: 'bubble', m, glow, follow, r, dur, t: 0 });
    return m;
  }
  // traînée d'images rémanentes (pas éclair / soru)
  flashStep(F, from, to, col) {
    for (let i = 0; i < 4; i++) this.FX.ghost(F, col, 0.25 + i * 0.05);
    const a = from.clone().setY(from.y + 1), b = to.clone().setY(to.y + 1);
    for (let i = 0; i <= 12; i++) this.FX.sparks.spawn(a.clone().lerp(b, i / 12).add(new V3(rand(-0.2, 0.2), rand(-0.6, 0.6), rand(-0.2, 0.2))), b.clone().sub(a).multiplyScalar(0.6), rand(0.1, 0.25), 0.04, new THREE.Color(col), 1);
    this.FX.dustBurst(from, 8, 3); this.FX.dustBurst(to, 8, 3);
  }
  clearAll() { this.list.forEach(o => { this.scene.remove(o.m || o.body); if (o.head) this.scene.remove(o.head); }); this.list = []; }
  update(dt) {
    const cam = this.camera;
    this.list = this.list.filter(o => {
      o.t += dt; const p = clamp(o.t / o.dur, 0, 1);
      if (o.type === 'beast') {
        const e = 1 - Math.pow(1 - p, 2), pos = o.from.clone().lerp(o.to, e); pos.y += Math.sin(p * Math.PI) * o.arc;
        o.m.position.copy(pos); if (o.face) o.m.lookAt(pos.clone().add(o.face)); else o.m.quaternion.copy(cam.quaternion);
        const s = o.size * (0.5 + 0.7 * Math.min(1, p * 3)), fl = o.flap ? 0.75 + 0.25 * Math.sin(o.t * o.flap * 6.28) : 1;
        o.m.scale.set(s, s * (o.kind === 'tiger' ? 1 : 0.5) * fl, s);
        o.m.material.opacity = (p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.7) / 0.3)) * 0.95;
        if (dt > 0 && Math.random() < 0.7) this.FX.glow.spawn(pos.clone().add(new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(s * 0.4)), new V3(rand(-1, 1), rand(0, 2), rand(-1, 1)), rand(0.3, 0.6), rand(0.05, 0.12), o.m.material.color, 0.5);
      } else if (o.type === 'dragon') {
        const head = Math.min(1, p * 1.6), fade = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1; o.mat.uniforms.uHead.value = head; o.mat.uniforms.uA.value = fade;
        const P = u => { const a = u * Math.PI * 5 + S.dir * 2, r = o.R * (1 - u * 0.4); return new V3(o.center.x + Math.cos(a) * r, o.center.y + u * o.H, o.center.z + Math.sin(a) * r); };
        const pa = o.geo.attributes.position, cp = cam.position;
        for (let i = 0; i < o.N; i++) { const u = i / o.N, c = P(u), n = P(Math.min(1, u + 0.01)).sub(c).normalize(), v = cp.clone().sub(c).normalize(), side = new V3().crossVectors(n, v).normalize().multiplyScalar(0.35 * (0.4 + 0.6 * Math.sin(u * Math.PI)) * o.R / 2.2);
          pa.setXYZ(i * 2, c.x + side.x, c.y + side.y, c.z + side.z); pa.setXYZ(i * 2 + 1, c.x - side.x, c.y - side.y, c.z - side.z); }
        pa.needsUpdate = true;
        const hp = P(head); o.head.position.copy(hp); o.head.quaternion.copy(cam.quaternion); o.head.scale.setScalar(2.2 * o.R / 2.2); o.head.material.opacity = fade * Math.min(1, p * 5);
      } else if (o.type === 'wave') {
        o.m.position.addScaledVector(o.v, dt); const s = o.size * (1 + p * 1.5); o.m.scale.setScalar(s);
        o.m.material.opacity = 1 - p * p; o.core.material.opacity = 0.8 * (1 - p);
        if (dt > 0 && o.m.position.y < 1.5) { this.FX.dustBurst(o.m.position.clone().setY(0), 2, 3); }
      } else if (o.type === 'bubble') {
        const pos = typeof o.follow === 'function' ? o.follow() : o.follow; o.m.position.copy(pos);
        const a = p < 0.1 ? p / 0.1 : Math.max(0, 1 - (p - 0.7) / 0.3); o.m.material.opacity = a * 0.9; o.glow.material.opacity = a * 0.25;
        o.m.scale.setScalar(o.r * (1 + Math.sin(S.dir * 50) * 0.04)); o.m.rotation.y += dt * 2;
      }
      if (p >= 1) { this.scene.remove(o.m || o.body); if (o.head) this.scene.remove(o.head); return false; }
      return true;
    });
  }
  /* ---------- masquage : cache les objets du décor entre la caméra et les personnages ---------- */
  hideOccluders(cam, fighters) {
    const hidden = []; if (!this.occ.length) return hidden;
    const list = this.occ.filter(o => o.visible && o.parent && isVisibleChain(o));
    for (const F of fighters) {
      if (F.hidden) continue;
      for (const n of ['chest', 'head']) {
        const p = F.nb(n).getWorldPosition(new V3()), d = p.clone().sub(cam.position), L = d.length();
        this.ray.set(cam.position, d.normalize()); this.ray.far = L - 0.3;
        for (const h of this.ray.intersectObjects(list, false)) if (h.object.visible) { h.object.visible = false; hidden.push(h.object); }
      }
    }
    return hidden;
  }
}
function isVisibleChain(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
