import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { S, tw, twKill, updTw, EASE, rand, clamp, lerp, pick, at, later, runEvents, sortEvents } from './engine.js';
import { GPUParticles, Lightning, Rings, Trail, TEX, crescentMesh } from './fx.js';
import { Fighter } from './fighter.js';
import { buildWorld } from './world.js';
import { buildPost } from './post.js';
import * as AU from './audio.js';
import { buildStages, PAL } from './stages.js';
import { buildStages2 } from './stages2.js';
import { Techniques } from './fx3.js';
import { Powers } from './fx4.js';
import { addDivine } from './attach.js';
import { Divine } from './fx2.js';
import { buildScript } from './acts2.js';

const V3 = THREE.Vector3;
const $ = id => document.getElementById(id);
const QS = new URLSearchParams(location.search);

/* ======================================================================
   RENDU
   ====================================================================== */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const LQ = QS.has('lq') || matchMedia('(pointer: coarse)').matches || innerWidth < 820; window.__LQ = LQ;
renderer.setPixelRatio(Math.min(devicePixelRatio, LQ ? 1 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
$('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.05, 1200);
const pmrem = new THREE.PMREMGenerator(renderer);
const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const W = buildWorld(scene, renderer);
const ST = buildStages(scene, W, renderer, env);
buildStages2(scene, W, renderer, env, ST, PAL);
const post = buildPost(renderer, scene, camera);
const PU = post.u;
const EXTRA = [];
function resize() {
  renderer.setSize(innerWidth, innerHeight); post.composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  PU.uRes.value.set(innerWidth, innerHeight);
}
addEventListener('resize', resize); resize();

/* ======================================================================
   EFFETS
   ====================================================================== */
const C = { A: new THREE.Color(0x3f7bff), B: new THREE.Color(0x8fe8ff), ice: new THREE.Color(0xdff8ff), holy: new THREE.Color(0xffd890), Y: new THREE.Color(0xa040ff), W: new THREE.Color(0xffffff), gold: new THREE.Color(0xffc870), dark: new THREE.Color(0x000000), dust: new THREE.Color(0x6a5a70) };
class FXSys {
  constructor() {
    this.sparks = new GPUParticles(scene, 3000, { stretch: 0.03, gravity: -9, drag: 2.4, fadeIn: 0.01 });
    this.glow = new GPUParticles(scene, 5000, { gravity: 1.6, drag: 1.4, grow: -0.5 });
    this.smoke = new GPUParticles(scene, 3000, { normal: true, tex: TEX.smoke, gravity: 1.0, drag: 1.4, grow: 1.4, order: 4 });
    this.dust = new GPUParticles(scene, 2000, { normal: true, tex: TEX.smoke, gravity: 0.25, drag: 2.6, grow: 2.6, order: 3 });
    this.bolts = new Lightning(scene); this.rings = new Rings(scene);
    this.rocks = []; this.ghosts = []; this.crescents = []; this.waves = []; this.zapT = 0;
    this.rockGeo = [new THREE.DodecahedronGeometry(1, 0), new THREE.IcosahedronGeometry(1, 0)];
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4050, roughness: 0.95, flatShading: true });
    this.shardMat = new THREE.MeshStandardMaterial({ color: 0xe8eef6, metalness: 1, roughness: 0.15, envMap: env });
  }
  trail(col) { return new Trail(scene, col); }
  spark(p, n, cols = [C.W, C.gold], sp = 7) {
    for (let i = 0; i < n; i++) { const v = new V3(rand(-1, 1), rand(-0.6, 1), rand(-1, 1)).normalize().multiplyScalar(rand(0.3, 1) * sp); this.sparks.spawn(p, v, rand(0.2, 0.6), rand(0.012, 0.025), pick(cols), 1); }
  }
  dustBurst(p, n, sp = 3, col = C.dust) {
    for (let i = 0; i < n; i++) { const a = rand(6.28); const v = new V3(Math.cos(a) * rand(0.4, 1) * sp, rand(0.2, 1.2), Math.sin(a) * rand(0.4, 1) * sp * 0.6); this.dust.spawn(new V3(p.x + rand(-0.2, 0.2), (p.y > 0.4 || p.y < -0.4 ? p.y : 0) + rand(0.05, 0.3), p.z + rand(-0.2, 0.2)), v, rand(1, 2.2), rand(0.3, 0.7), col, rand(0.3, 0.55)); }
  }
  bolt(o, dir, len, w, life, col) { this.bolts.add(o, dir, len, w, life, col); }
  ring(p, o) { this.rings.add(p, o); }
  rock(p, n, sp = 6, float = false) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(pick(this.rockGeo), this.rockMat); const s = rand(0.04, 0.16); m.scale.setScalar(s); m.castShadow = true;
      m.position.set(p.x + rand(-1, 1) * (float ? 3 : 0.3), 0.05, p.z + rand(-1, 1) * (float ? 1.5 : 0.3)); scene.add(m);
      const r = { m, v: new V3(rand(-1, 1) * sp * 0.5, rand(0.4, 1) * sp, rand(-1, 1) * sp * 0.3), w: new V3(rand(-6, 6), rand(-6, 6), rand(-6, 6)), life: 4, float, ty: rand(0.3, 2.4), ph: rand(6) };
      if (float) r.v.set(0, 0, 0);
      this.rocks.push(r);
    }
  }
  blast(center, sp) { this.rocks.forEach(r => { if (!r.float) return; r.float = false; const d = r.m.position.clone().sub(center).normalize(); r.v.copy(d.multiplyScalar(rand(0.6, 1.2) * sp)).add(new V3(0, rand(1, 4), 0)); r.life = 3; }); }
  shards(p, n) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.006, rand(0.03, 0.09), 0.02), this.shardMat); m.position.copy(p).add(new V3(rand(-0.2, 0.2), rand(-0.1, 0.1), rand(-0.1, 0.1))); scene.add(m);
      this.rocks.push({ m, v: new V3(rand(-2, 2), rand(1, 3.5), rand(-1.5, 1.5)), w: new V3(rand(-20, 20), rand(-20, 20), rand(-20, 20)), life: 3, shard: true });
    }
  }
  ghost(f, col, life = 0.35) {
    if (this.ghosts.length > 10) return;
    const g = SkeletonUtils.clone(f.vrm.scene);
    const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    g.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; o.frustumCulled = false; } });
    g.position.copy(f.root.position); g.quaternion.copy(f.root.quaternion);
    scene.add(g); g.updateMatrixWorld(true);
    // fige le squelette dans la pose courante
    const src = [], dst = [];
    f.vrm.scene.traverse(o => src.push(o)); g.traverse(o => dst.push(o));
    for (let i = 0; i < Math.min(src.length, dst.length); i++) { dst[i].matrixWorld.copy(src[i].matrixWorld); dst[i].matrixAutoUpdate = false; dst[i].matrixWorldAutoUpdate = false; }
    this.ghosts.push({ g, mat, life, max: life });
  }
  teleport(f, from, to) {
    const y = 1.1;
    for (let i = 0; i < 30; i++) this.glow.spawn(new V3(from + rand(-0.3, 0.3), rand(0.2, 1.7), rand(-0.3, 0.3)), new V3(rand(-2, 2), rand(0, 2), rand(-2, 2)), rand(0.3, 0.6), rand(0.03, 0.07), f.col, 0.5);
    const n = 8;
    for (let i = 0; i <= n; i++) { const x = lerp(from, to, i / n); this.sparks.spawn(new V3(x, y + rand(-0.4, 0.5), rand(-0.1, 0.1)), new V3((to - from) * 0.8, 0, 0), rand(0.15, 0.3), 0.05, f.col, 1); }
    AU.SFX.tp();
  }
  teleport3(f, from, to, bolt = false) {
    for (let i = 0; i < 30; i++) this.glow.spawn(from.clone().add(new V3(rand(-0.3, 0.3), rand(0.2, 1.7), rand(-0.3, 0.3))), new V3(rand(-2, 2), rand(0, 2), rand(-2, 2)), rand(0.3, 0.6), rand(0.03, 0.07), f.col, 0.5);
    const a = from.clone().setY(from.y + 1.1), b = to.clone().setY(to.y + 1.1), d = b.clone().sub(a);
    if (bolt) { for (let i = 0; i < 3; i++) this.bolt(a, d, d.length(), 0.08 - i * 0.02, 0.25, f.col); AU.play('zap', { vol: 0.8, rate: 0.8 }); }
    for (let i = 0; i <= 10; i++) this.sparks.spawn(a.clone().lerp(b, i / 10).add(new V3(0, rand(-0.4, 0.5), 0)), d.clone().multiplyScalar(0.8), rand(0.15, 0.3), 0.05, f.col, 1);
    AU.SFX.tp();
  }
  crescent(p, dir, col, size, vel, life = 0.5) {
    const m = crescentMesh(col); m.position.copy(p); m.scale.setScalar(size);
    m.lookAt(p.clone().add(new V3(0, 0, 1))); m.rotateZ(Math.atan2(dir.y, dir.x));
    scene.add(m); this.crescents.push({ m, v: vel || new V3(), life, max: life, grow: 0.6 });
  }
  wave(x, vx, col) {
    const m = crescentMesh(col); m.position.set(x, 0.9, 0); m.scale.set(1.2, 1.4, 1.2); m.rotation.y = vx > 0 ? -Math.PI / 2 : Math.PI / 2; m.rotateZ(vx > 0 ? 0 : 0);
    scene.add(m); this.waves.push({ m, vx, life: 0.6, col: new THREE.Color(col) });
  }
  fighterFX(f, dt) {
    if (dt <= 0) return;
    if (f.aura > 0.05) {
      const pts = f.bodyPoints(); let k = 80 * Math.min(1.3, f.aura) * dt;
      while (k > 0) {
        if (Math.random() < k) {
          const q = pick(pts).add(new V3(rand(-0.08, 0.08), rand(-0.08, 0.08), rand(-0.08, 0.08)));
          if (Math.random() < 0.4) this.glow.spawn(q.addScaledVector(q.clone().sub(f.root.position).setY(0).normalize(), 0.12), new V3(rand(-0.3, 0.3), rand(0.8, 2.2), rand(-0.3, 0.3)), rand(0.3, 0.7), rand(0.03, 0.07), f.col, 0.22);
          else this.smoke.spawn(q, new V3(rand(-0.3, 0.3), rand(0.6, 1.8), rand(-0.3, 0.3)), rand(0.4, 0.9), rand(0.08, 0.18), C.dark, 0.6);
        }
        k -= 1;
      }
      if (f.aura > 0.7 && Math.random() < dt * 3.5 * f.aura) {
        const q = pick(pts); this.bolt(q, new V3(rand(-1, 1), rand(-0.5, 1), rand(-1, 1)), rand(0.3, 0.8) * f.aura, rand(0.012, 0.022), rand(0.1, 0.22), f.col);
        this.zap(0.18 * f.aura);
      }
    }
    if (f.arm > 0.5 && !f.sheath && Math.random() < dt * 12) {
      const t = rand(0.2, 1), q = f.swordPos.clone().lerp(f.tip, t);
      this.bolt(q, new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)), rand(0.12, 0.3), rand(0.008, 0.014), rand(0.08, 0.15), f.col);
    }
    if (f.ghost) { f.gT -= dt; if (f.gT <= 0) { f.gT = 0.06; this.ghost(f, f.col, 0.3); } }
    if (f.drag) { const t = f.tip.clone(); t.y = Math.max(0.02, t.y); for (let i = 0; i < 3; i++) this.sparks.spawn(t, new V3(rand(-2, 2) - f.vx * 0.2, rand(1, 4), rand(-1, 1)), rand(0.2, 0.5), 0.02, pick([C.W, C.gold]), 1); if (Math.random() < 0.5) this.dustBurst(new V3(f.x, 0, f.z), 1, 1); }
    if (Math.hypot(f.vx, f.vz || 0) > 5 && f.y < 0.05 && Math.random() < 0.6) this.dustBurst(new V3(f.x, 0, f.z), 1, 1.5);
  }
  zap(v) { const n = S.dir * 1000; if (n - this.zapT < 80 && n >= this.zapT) return; this.zapT = n; AU.SFX.zap(v, rand(-0.7, 0.7)); }
  update(dt) {
    [this.sparks, this.glow, this.smoke, this.dust].forEach(p => p.update());
    this.bolts.update(dt, camera); this.rings.update(dt, camera);
    const g = -9.8;
    this.rocks = this.rocks.filter(r => {
      if (r.float) { r.m.position.y += (r.ty - r.m.position.y) * (1 - Math.exp(-dt * 0.9)); r.m.position.y += Math.sin(S.world * 2 + r.ph) * 0.002; r.m.rotation.x += dt * 0.4; r.m.rotation.y += dt * 0.3; return true; }
      if (dt > 0) {
        r.v.y += g * dt; r.m.position.addScaledVector(r.v, dt);
        r.m.rotation.x += r.w.x * dt; r.m.rotation.y += r.w.y * dt;
        if (r.m.position.y < 0.03) { r.m.position.y = 0.03; r.v.y *= -0.3; r.v.x *= 0.6; r.v.z *= 0.6; r.w.multiplyScalar(0.6); }
        r.life -= dt;
      }
      if (r.life <= 0) { scene.remove(r.m); if (r.shard) r.m.geometry.dispose(); return false; }
      return true;
    });
    this.ghosts = this.ghosts.filter(gh => {
      gh.life -= dt; gh.mat.opacity = Math.max(0, gh.life / gh.max) * 0.5;
      if (gh.life <= 0) { scene.remove(gh.g); gh.mat.dispose(); return false; }
      return true;
    });
    this.crescents = this.crescents.filter(c => {
      c.life -= dt; c.m.position.addScaledVector(c.v, dt); c.m.scale.multiplyScalar(1 + c.grow * dt);
      const a = Math.max(0, c.life / c.max); c.m.userData.mats.forEach(m => (m.opacity = a));
      if (c.life <= 0) { scene.remove(c.m); return false; }
      return true;
    });
    this.waves = this.waves.filter(w => {
      w.life -= dt; w.m.position.x += w.vx * dt;
      if (dt > 0 && Math.random() < 0.9) { this.dustBurst(new V3(w.m.position.x, 0, 0), 1, 2); this.spark(new V3(w.m.position.x, 0.05, rand(-0.2, 0.2)), 2, [C.W, w.col], 5); }
      if (w.life <= 0 || w.dead) { scene.remove(w.m); return false; }
      return true;
    });
  }
}
const FX = new FXSys();
const DV = new Divine(scene, FX, env);
const TQ = new Techniques(scene, FX, camera);
const PW = new Powers(scene, FX, DV, env, camera);

/* ======================================================================
   CAMÉRA
   ====================================================================== */
const CAM = { oa: 0, or: 2.6, oh: 1.3, ocx: 0, ocy: 1.2, ocz: 0, nPrev: new V3(0, 0, 1), trk: null, tk: 5, mode: 'manual', px: 0, py: 30, pz: 30, tx: 0, ty: 20, tz: -100, fov: 35, roll: 0, shake: 0, zmul: 1, orbit: 0, h: 1.3, hand: 1 };
const camKeys = ['px', 'py', 'pz', 'tx', 'ty', 'tz', 'fov', 'roll'];
function camTo(p, t, fov, roll, dur, ease = 'inOut') { CAM.mode = 'manual'; const v = { px: p[0], py: p[1], pz: p[2], tx: t[0], ty: t[1], tz: t[2], fov, roll }; for (const k of camKeys) tw(CAM, k, v[k], dur, ease, 'dir'); }
function camCut(p, t, fov = 35, roll = 0) { CAM.mode = 'manual'; camKeys.forEach(k => twKill(CAM, k)); Object.assign(CAM, { px: p[0], py: p[1], pz: p[2], tx: t[0], ty: t[1], tz: t[2], fov, roll }); }
function camAuto(zmul = 1, orbit = 0, h = 1.3) { ['px', 'py', 'pz', 'tx', 'ty', 'tz'].forEach(k => twKill(CAM, k)); CAM.mode = 'auto'; tw(CAM, 'zmul', zmul, 0.6, 'inOut', 'dir'); tw(CAM, 'orbit', orbit, 0.8, 'inOut', 'dir'); tw(CAM, 'h', h, 0.8, 'inOut', 'dir'); tw(CAM, 'roll', 0, 0.5, 'out', 'dir'); tw(CAM, 'fov', 35, 0.6, 'inOut', 'dir'); }
function camOrbit(cx, cy, r, h, a0, a1, dur, fov = 32, roll = 0, cz = 0, ease = 'inOut') { CAM.mode = 'orbit'; camKeys.forEach(k => twKill(CAM, k)); Object.assign(CAM, { ocx: cx, ocy: cy, ocz: cz, or: r, oh: h, oa: a0, fov, roll }); tw(CAM, 'oa', a1, dur, ease, 'dir'); }
// suit un personnage : off/look dans son repère (lacet seulement)
function camTrack(F, off, look, fov = 34, k = 5, snap = false) { camKeys.forEach(k2 => twKill(CAM, k2)); CAM.mode = 'track'; CAM.trk = { F, off, look }; CAM.tk = k; tw(CAM, 'fov', fov, 0.3, 'inOut', 'dir'); if (snap) { const [p, t] = trackPos(); Object.assign(CAM, { px: p.x, py: p.y, pz: p.z, tx: t.x, ty: t.y, tz: t.z }); } }
function trackPos() {
  const { F, off, look } = CAM.trk, e = new THREE.Euler(0, F.yaw, 0), b = new V3(F.x, F.y, F.z);
  const tgt = look instanceof Object && look.root ? look.root.position.clone().add(new V3(0, 1.2, 0)) : b.clone().add(new V3(...look).applyEuler(e));
  return [b.clone().add(new V3(...off).applyEuler(e)), tgt];
}
function updateCamera(rdt) {
  if (CAM.mode === 'orbit') { CAM.px = CAM.ocx + Math.sin(CAM.oa) * CAM.or; CAM.pz = CAM.ocz + Math.cos(CAM.oa) * CAM.or; CAM.py = CAM.oh; CAM.tx = CAM.ocx; CAM.ty = CAM.ocy; CAM.tz = CAM.ocz; }
  if (CAM.mode === 'track' && CAM.trk) {
    const [p, t] = trackPos(), k = 1 - Math.exp(-rdt * CAM.tk);
    CAM.px += (p.x - CAM.px) * k; CAM.py += (p.y - CAM.py) * k; CAM.pz += (p.z - CAM.pz) * k; CAM.tx += (t.x - CAM.tx) * k; CAM.ty += (t.y - CAM.ty) * k; CAM.tz += (t.z - CAM.tz) * k;
  }
  if (CAM.mode === 'auto' && A && B) {
    const F = FOC.length ? FOC : [A, B], ys = F.map(f => f.y);
    const c = new V3(); F.forEach(f => c.add(new V3(f.x, 0, f.z))); c.multiplyScalar(1 / F.length);
    let span = 0; F.forEach(f => F.forEach(g => (span = Math.max(span, Math.hypot(f.x - g.x, f.z - g.z)))));
    const a = F.length > 1 ? new V3(F[F.length - 1].x - F[0].x, 0, F[F.length - 1].z - F[0].z) : new V3(Math.sin(F[0].yaw), 0, Math.cos(F[0].yaw));
    let n = new V3(-a.z, 0, a.x); if (n.lengthSq() < 1e-6) n.copy(CAM.nPrev); n.normalize(); if (n.dot(CAM.nPrev) < 0) n.negate(); CAM.nPrev.lerp(n, 0.2).normalize();
    n = CAM.nPrev.clone().applyAxisAngle(new V3(0, 1, 0), CAM.orbit);
    const dist = clamp(2.4 + span * 0.95, 3.2, 16) * CAM.zmul, ty = 1.05 + Math.max(...ys) * 0.6;
    const k = 1 - Math.exp(-rdt * 4);
    const tp = c.clone().addScaledVector(n, dist); tp.y = CAM.h + Math.max(...ys) * 0.5;
    CAM.px += (tp.x - CAM.px) * k; CAM.py += (tp.y - CAM.py) * k; CAM.pz += (tp.z - CAM.pz) * k;
    CAM.tx += (c.x - CAM.tx) * k; CAM.ty += (ty - CAM.ty) * k; CAM.tz += (c.z - CAM.tz) * k;
  }
  CAM.shake *= Math.pow(0.02, rdt);
  const sh = CAM.shake + (HC ? 0.05 : 0), t = S.dir, hh = 0.012 * CAM.hand;
  const n = new V3(Math.sin(t * 1.3) + Math.sin(t * 3.1) * 0.4, Math.sin(t * 1.7 + 1) + Math.sin(t * 2.3) * 0.4, 0).multiplyScalar(hh);
  camera.position.set(CAM.px + n.x + rand(-sh, sh), CAM.py + n.y + rand(-sh, sh), CAM.pz + rand(-sh, sh) * 0.5);
  camera.lookAt(CAM.tx + rand(-sh, sh) * 0.3, CAM.ty + rand(-sh, sh) * 0.3, CAM.tz);
  camera.rotateZ(CAM.roll);
  const asp = camera.aspect, f = asp < 1.6 ? Math.min(115, 2 * Math.atan(Math.tan(CAM.fov * Math.PI / 360) * 1.6 / asp) * 180 / Math.PI) : CAM.fov;
  if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); }
}
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2, (1 - p.y) / 2, p.z]; };

/* ======================================================================
   UI
   ====================================================================== */
function banner(k, f, col) {
  const b = $('banner'); b.querySelector('.k').textContent = k; b.querySelector('.f').textContent = f;
  b.style.setProperty('--c', col); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
let subT;
function say(who, txt, fr = '', dur = 2.2) {
  const s = $('sub'), col = { A: '#7fa6ff', B: '#9aeaff', Y: '#d9a8ff' }[who], nm = { A: 'AZAD', B: 'REMI', Y: 'SYLINA' }[who];
  s.innerHTML = `<b style="color:${col}">${nm}</b><span class="jp">${txt}</span><small>${fr}</small>`; s.classList.add('show');
  const id = subT = (subT || 0) + 1; later(dur, () => { if (subT === id) s.classList.remove('show'); });
}
function caption(txt, on = true) { const c = $('cap'); c.textContent = txt; c.classList.toggle('show', on); }
function sfxText(txt, pos, size = 80, col = '#fff', rot = rand(-12, 12)) {
  let x = 0.5, y = 0.35;
  if (pos instanceof V3) { const s = toScreen(pos); x = s[0]; y = s[1]; } else if (pos) { [x, y] = pos; }
  const d = document.createElement('div'); d.className = 'ono'; d.textContent = txt;
  d.style.cssText = `left:${x * 100}%;top:${y * 100}%;font-size:${size / 1080 * 100}vh;color:${col};--r:${rot}deg`;
  $('onos').appendChild(d); later(1.4, () => d.remove());
}

/* ======================================================================
   EFFETS D'ÉCRAN (pilotés par le temps réalisateur)
   ====================================================================== */
const SCR = { flash: 0, flashCol: new THREE.Color(1, 1, 1), speed: 0, impacts: [], splits: [], shock: null, ring: null, mono: 0, fade: 1, white: 0 };
function flash(v = 1, col = 0xffffff) { SCR.flash = Math.max(SCR.flash, v); SCR.flashCol.set(col); W.flashLight.intensity = Math.max(W.flashLight.intensity, 14 * v); }
function impact(big) {
  const t = S.dir;
  const seq = big ? [[0, 1, 0], [0.06, 0, 0], [0.1, 0, 1], [0.17, 1, 1], [0.24, 0, 0], [0.28, 0, 0.6], [0.36, 0, 0]] : [[0, 1, 0], [0.05, 0, 0], [0.09, 0, 0.7], [0.15, 0, 0]];
  SCR.impacts.push(...seq.map(([d, inv, hard]) => ({ t: t + d, inv, hard })));
}
function split(p, ang, dur = 0.8, col = 0xffffff, amp = 22) { SCR.splits.push({ p, ang, t0: S.dir, dur, col: new THREE.Color(col), amp }); }
function shock(pos, dur = 0.7, str = 1) { SCR.shock = { pos: pos.clone(), t0: S.dir, dur, str }; }
function decayScreen(rdt) { SCR.flash *= Math.pow(0.004, rdt); SCR.speed *= Math.pow(0.12, rdt); W.flashLight.intensity *= Math.pow(0.001, rdt); }
function updateScreen() {
  PU.uFlash.value = SCR.flash + (SCR.white || 0); PU.uFlashCol.value.copy(SCR.flashCol); if ((SCR.white || 0) > SCR.flash) PU.uFlashCol.value.set(1, 1, 1);
  PU.uSpeed.value = SCR.speed + (A && (A.ghost || B.ghost || Y.ghost) ? 0.25 : 0) + (S.rew ? 0.8 : 0);
  // images d'impact
  let inv = 0, hard = 0;
  SCR.impacts = SCR.impacts.filter(i => i.t > S.dir - 0.5);
  for (const i of SCR.impacts) if (i.t <= S.dir) { inv = i.inv; hard = i.hard; }
  PU.uInvert.value = inv; PU.uHard.value = hard;
  // écrans fendus
  SCR.splits = SCR.splits.filter(s => S.dir - s.t0 < s.dur);
  const slots = [[PU.uSplitA, PU.uGlowA, PU.uColA], [PU.uSplitB, PU.uGlowB, PU.uColB]];
  slots.forEach(([u, g, c], i) => {
    const s = SCR.splits[i];
    if (!s) { u.value.w = 0; g.value = 0; return; }
    const p = (S.dir - s.t0) / s.dur, d = p < 0.2 ? 0 : s.amp * Math.sin(Math.PI * (p - 0.2) / 0.8);
    const sp = s.p instanceof V3 ? toScreen(s.p) : s.p;
    u.value.set(sp[0], 1 - sp[1], s.ang, d * (innerHeight / 720)); g.value = p < 0.2 ? p / 0.2 : Math.max(0, 1 - (p - 0.2) / 0.8); c.value.copy(s.col);
  });
  // onde de distorsion
  if (SCR.shock) {
    const p = (S.dir - SCR.shock.t0) / SCR.shock.dur;
    if (p > 1) { SCR.shock = null; PU.uShock.value.w = 0; }
    else { const s = toScreen(SCR.shock.pos); PU.uShock.value.set(s[0], 1 - s[1], p * 1.3, (1 - p) * SCR.shock.str); }
  }
  // anneau d'arrêt du temps
  if (SCR.ring) { const p = (S.dir - SCR.ring.t0) / 0.9; PU.uRing.value.set(SCR.ring.x, 1 - SCR.ring.y, p < 1 ? EASE.out(p) * 2.2 * (p < 0.5 ? 1 : (1.3 - p * 0.6)) : 0); }
  else PU.uRing.value.z = 0;
  if (SCR.crack) {
    const p = (S.dir - SCR.crack.t0) / SCR.crack.dur, el = $('crack');
    el.style.opacity = p > 1 ? 0 : (p < 0.04 ? p / 0.04 : 1 - EASE.in2(Math.max(0, (p - 0.35) / 0.65)));
    el.style.transform = `scale(${1 + 0.04 * Math.min(1, p * 4)})`; if (p > 1) SCR.crack = null;
  }
  if (window.__K && window.__K.CRED) { const c = $('credits'), p = (S.dir - window.__K.CRED) / 14; c.style.opacity = 1; c.style.transform = `translateY(${-p * 190}vh)`; }
  $('rew').style.opacity = S.rew ? (Math.floor(S.dir * 5) % 2 ? 1 : 0.35) : 0;
  PU.uMono.value = SCR.mono; PU.uFade.value = SCR.fade; PU.uTime.value = S.dir;
  const c = A ? toScreen(A.root.position.clone().add(new V3(0, 1.1, 0))) : [0.5, 0.5];
  PU.uCenter.value.set(clamp(c[0], 0.2, 0.8), clamp(1 - c[1], 0.2, 0.8));
}

/* ======================================================================
   CHARGEMENT
   ====================================================================== */
let A = null, B = null, Y = null, HC = null, LEAF = { on: false, t: 0 }, FOC = [];
const ZAP = { B: false }, DARK = { on: false }, STORM = { on: false, x: 0 }, HIST = [], FROST = { on: false }, HOLY = { on: false }, AZD = { on: false };
const b64ToAB = b => { const s = atob(b); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.buffer; };
async function loadVRM(b64) {
  const L = new GLTFLoader(); L.register(p => new VRMLoaderPlugin(p));
  let ab = typeof b64 === 'string' ? b64ToAB(b64) : b64;
  if (new Uint8Array(ab)[0] === 0x1f) ab = await new Response(new Blob([ab]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const g = await L.parseAsync(ab, '');
  const v = g.userData.vrm; VRMUtils.rotateVRM0(v); VRMUtils.removeUnnecessaryVertices(g.scene);
  return v;
}
function tint(vrm, rules) {
  vrm.scene.traverse(o => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      for (const [re, lit, shade] of rules) if (re.test(m.name)) {
        if (m.color) m.color.set(lit);
        if (shade && m.shadeColorFactor) m.shadeColorFactor.set(shade);
      }
    });
  });
}
async function load() {
  const get = f => fetch(f).then(r => r.arrayBuffer());
  const [va, vb, vy] = await Promise.all(['Az', 'Re', 'Sy'].map(n => get('../assets/' + n + '.vrm').then(loadVRM)));
  if (!window.__SFX && window.__SFXN) { const o = {}; await Promise.all(window.__SFXN.map(n => fetch('../assets/sfx/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => (o[n] = b)).catch(() => {}))); window.__SFX = o; }
  tint(va, [[/EyeIris/, 0x5a8cff, null]]);
  tint(vb, [[/EyeIris/, 0x8fe8ff, null]]);
  tint(vy, [[/EyeIris/, 0xb070ff, null]]);
  A = new Fighter(va, { x: 0, yaw: 0, aura: 0x3f7bff, trim: 0x1c3c9a, coat: 0x141c3a, lining: 0x2a55ff, sash: 0x0e1a44 }, scene, env, FX);
  B = new Fighter(vb, { x: -4.2, yaw: Math.PI / 2, aura: 0x8fe8ff, trim: 0x2a6a9a, coat: 0xf2f6fa, lining: 0x3a9ad0, band: 0x9adfff }, scene, env, FX);
  Y = new Fighter(vy, { x: 4.2, yaw: -Math.PI / 2, aura: 0xa040ff, trim: 0x5a1a8a, coat: 0x120a18, lining: 0x7a20d0, sash: 0x3a0a5a }, scene, env, FX);
  addDivine(Y, scene);
  // occultants : objets de décor qui peuvent masquer un personnage
  [W.shrine, ...Object.values(ST.groups)].forEach(r => r.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.noOcc || o.material.isShaderMaterial || o.material.blending === THREE.AdditiveBlending || o.material.transparent) return; o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) > 12) return; TQ.occ.push(o); }));
  [va, vb, vy].forEach(v => v.scene.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(mt => { if (mt.isOutline || mt.outlineWidthFactor !== undefined) mt.outlineWidthFactor = (mt.outlineWidthFactor || 0) * 2.6; if (mt.outlineColorFactor) mt.outlineColorFactor.set(0x0a0610); }); }));
  A.set('stand'); B.set('stand'); Y.set('stand');
}
// anneau de tambours d'Ener dans le dos de Remi
function drums(F) {
  const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0x9a7424, metalness: 0.8, roughness: 0.4, envMap: env }), skin = new THREE.MeshToonMaterial({ color: 0xf4ead0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.014, 8, 48), gold); g.add(ring);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, d = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 20), gold), face = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), skin);
    body.rotation.x = Math.PI / 2; face.position.z = 0.036; d.add(body, face);
    const tomoe = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: 0x3a2a10 })); tomoe.position.z = 0.038; d.add(tomoe);
    d.scale.setScalar(0.8); d.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0); g.add(d);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
  F.acc = F.acc || []; F.acc.push({ m: g, bone: 'upperChest', off: new V3(0, 0.02, -0.26), rot: new THREE.Euler(0, 0, 0), sc: new V3(1, 1, 1) });
}

/* ======================================================================
   PANNEAUX (gros plans des regards, rendu en deux bandes)
   ====================================================================== */
const panelCam = new THREE.PerspectiveCamera(20, 1, 0.01, 50);
function renderPanels(lt) {
  const w = innerWidth, h = innerHeight, ph = Math.round(h * 0.24);
  const ex = lt > 1.45 ? EASE.in(clamp((lt - 1.45) / 0.2, 0, 1)) : 0;
  renderer.setScissorTest(false); renderer.setClearColor(0x000000); renderer.clear();
  renderer.setScissorTest(true);
  (S.panelList || [B, A, Y]).map((F, k) => [F, Math.round(h * [0.645, 0.38, 0.115][k]), k % 2 ? 1 : -1]).forEach(([F, y, dir], k) => {
    const lt2 = lt - k * 0.12, e = EASE.out(clamp(lt2 / 0.35, 0, 1));
    const off = Math.round(w * ((1 - e) + ex) * dir);
    const eyes = F.nb('leftEye') ? F.nb('leftEye').getWorldPosition(new V3()).lerp(F.nb('rightEye').getWorldPosition(new V3()), 0.5) : F.nb('head').getWorldPosition(new V3()).add(new V3(0, 0.06, 0));
    const fw = new V3(Math.sin(F.yaw), 0, Math.cos(F.yaw));
    panelCam.position.copy(eyes).addScaledVector(fw, 0.34).add(new V3(0, 0.005, 0)); panelCam.lookAt(eyes);
    panelCam.aspect = w / ph; panelCam.fov = 16 - lt * 1.6; panelCam.updateProjectionMatrix();
    renderer.setViewport(off, y, w, ph); renderer.setScissor(Math.max(0, off), y, w, ph);
    renderer.render(scene, panelCam);
  });
  renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h);
  $('panels').style.opacity = lt < 1.62 ? 1 : 0;
}

/* ======================================================================
   CHORÉGRAPHIE (secondes, temps réalisateur)
   ====================================================================== */
const AX = () => A.x, BX = () => B.x;
const head = F => F.nb('head').getWorldPosition(new V3());
const chest = F => F.nb('chest').getWorldPosition(new V3());
const aura = (F, v, d = 1) => tw(F, 'aura', v, d, 'inOut', 'world');
const slow = (v, d = 0) => tw(S, 'slow', v, d, 'inOut', 'dir');
function clashPoint(F1 = A, F2 = B) {
  // point le plus proche entre les deux lames
  const p1 = F1.swordPos, d1 = F1.tip.clone().sub(F1.swordPos), p2 = F2.swordPos, d2 = F2.tip.clone().sub(F2.swordPos);
  const r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
  let s = den > 1e-6 ? clamp((b * f - c * e) / den, 0, 1) : 0.7, t = clamp((b * s + f) / e, 0, 1);
  s = clamp((b * t - c) / a, 0, 1);
  return p1.clone().addScaledVector(d1, s).lerp(p2.clone().addScaledVector(d2, t), 0.5);
}
function clash(pw = 1, F2 = B) {
  const p = clashPoint(A, F2);
  FX.spark(p, 25 + pw * 30, [C.W, C.gold, C.W], 5 + pw * 2);
  FX.ring(p, { col: 0xffffff, size: 1.2 + pw * 0.8, life: 0.3 + 0.08 * pw });
  flash(0.1 * pw); CAM.shake += 0.02 * pw; SCR.speed = Math.max(SCR.speed, 0.22 * pw);
  sfxText(pick(['キン', 'ガキン', 'ギィン']), p.clone().add(new V3(0, 0.5, 0)), 60 + pw * 18);
  AU.SFX.clash(pw, clamp(toScreen(p)[0] * 2 - 1, -0.8, 0.8));
  if (pw >= 2) { impact(pw >= 3); shock(p, 0.6, pw / 3); for (let i = 0; i < pw * 5; i++) FX.bolt(p, new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)), rand(0.4, 1.4) * pw * 0.5, rand(0.015, 0.03), rand(0.15, 0.3), pick([C.A, F2.col])); }
  return p;
}
const S_ = (a, b) => (b === undefined ? a : rand(a, b));

function script() {
  const K = {
    get A() { return A; }, get B() { return B; }, get Y() { return Y; }, foc: a => (FOC = a), setHC: v => (HC = v), get HC() { return HC; },
    THREE, V3, C, S, tw, twKill, EASE, rand, clamp, lerp, pick, at, later, sortEvents, FX, DV, ST, W, CAM, SCR, AU, HIST, ZAP, DARK, STORM, $, TQ, PW, FROST, HOLY, AZD, post,
    camTo, camCut, camAuto, camOrbit, camTrack, flash, impact, split, shock, banner, say, caption, sfxText, crackFX, voice, head, chest, aura, slow, clash, clashPoint, toScreen, camera, EXTRA,
  };
  window.__K = K; buildScript(K);
  sortEvents();
}
function voice(n, pan = 0, vol = 1) {
  if (/grunt|inhale/.test(n)) n += '_' + (1 + ((Math.random() * 3) | 0));
  AU.play('v_' + n, { vol: vol * 1.25, pan, wet: 0.18 }); AU.duck(1.6, 0.45);
}
// fissures de l'air (Gura Gura) : verre brisé dessiné en surimpression
function crackFX(c, size = 1, dur = 2) {
  const cv = $('crack'), w = cv.width = innerWidth, h = cv.height = innerHeight, g = cv.getContext('2d'), cx = c[0] * w, cy = c[1] * h, R0 = Math.max(w, h) * 0.75 * size;
  g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
  const n = Math.round(10 + 12 * size), rays = [];
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2 + rand(-0.12, 0.12); let x = cx, y = cy, a = a0; const pts = [[x, y]];
    for (let r = 0; r < R0;) { const st = rand(0.04, 0.1) * R0; r += st; a += rand(-0.22, 0.22); x += Math.cos(a) * st; y += Math.sin(a) * st; pts.push([x, y]); }
    rays.push(pts);
  }
  const stroke = (pts, lw, col, blur) => { g.shadowColor = '#7fa6ff'; g.shadowBlur = blur; g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
  rays.forEach(p => { stroke(p, 5 * size + 1, 'rgba(160,190,255,.35)', 22); stroke(p, 1.6 * size + 0.8, '#ffffff', 6); });
  // anneaux concentriques brisés
  for (let k = 1; k <= 4; k++) {
    const rr = R0 * k * 0.16;
    for (let i = 0; i < n; i++) if (Math.random() < 0.7) { const a = rays[i], b = rays[(i + 1) % n], ia = Math.min(a.length - 1, k * 2), ib = Math.min(b.length - 1, k * 2 + (Math.random() < 0.5 ? 1 : 0)); stroke([a[ia], b[ib]], 1.2 * size + 0.6, 'rgba(255,255,255,.9)', 8); }
  }
  // éclats blancs au centre
  g.shadowBlur = 40; g.shadowColor = '#bcd0ff'; g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(cx, cy, 10 * size + 3, 0, 7); g.fill();
  SCR.crack = { t0: S.dir, dur };
}
// effets continus : foudre autour de Remi, ténèbres de Sylina, pluie d'éclairs
function fxLoops(dt) {
  if (dt <= 0) return;
  if (FROST.on) { const F = FROST.F || B; for (let i = 0; i < 3; i++) { const a = rand(6.28), r = rand(0.2, 1.2); FX.dust.spawn(new V3(F.x + Math.cos(a) * r, F.y + rand(0, 0.25), F.z + Math.sin(a) * r), new V3(Math.cos(a) * 0.6, rand(0.1, 0.6), Math.sin(a) * 0.6), rand(0.8, 1.6), rand(0.2, 0.45), C.ice, 0.35); }
    if (Math.random() < dt * 14) FX.glow.spawn(pick(F.bodyPoints()), new V3(rand(-0.3, 0.3), rand(-0.2, 0.6), rand(-0.3, 0.3)), rand(0.5, 1), rand(0.02, 0.05), C.ice, 0.6); }
  if (HOLY.on) { const F = HOLY.F || Y; if (Math.random() < dt * 30) FX.glow.spawn(pick(F.bodyPoints()).add(new V3(rand(-0.4, 0.4), rand(-0.2, 0.4), rand(-0.4, 0.4))), new V3(rand(-0.2, 0.2), rand(0.4, 1.4), rand(-0.2, 0.2)), rand(0.6, 1.2), rand(0.025, 0.06), C.holy, 0.6); }
  if (AZD.on) { const F = AZD.F || A; for (const n of ['leftHand', 'rightHand']) { const q = F.nb(n).getWorldPosition(new V3()); if (Math.random() < dt * 40) FX.smoke.spawn(q, new V3(rand(-0.3, 0.3), rand(0.5, 1.4), rand(-0.3, 0.3)), rand(0.3, 0.6), rand(0.06, 0.16), C.dark, 0.8); if (Math.random() < dt * 10) FX.glow.spawn(q, new V3(rand(-0.4, 0.4), rand(0.3, 1), rand(-0.4, 0.4)), rand(0.3, 0.6), 0.04, C.Y, 0.5); } }
  if (ZAP.B && Math.random() < dt * 9) { const q = pick(B.bodyPoints()); FX.bolt(q, new V3(rand(-1, 1), rand(-0.3, 1), rand(-1, 1)), rand(0.3, 0.8), rand(0.007, 0.013), rand(0.08, 0.15), pick([C.B, C.W])); FX.zap(0.3); }
  if (ZAP.B && Math.random() < dt * 2.2) { FX.bolt(new V3(B.x + rand(-3, 3), B.y + 14, B.z + rand(-4, 0)), new V3(rand(-0.1, 0.1), -1, 0), rand(8, 14), 0.05, 0.25, C.B); flash(0.15, 0xfff2a0); }
  if (DARK.on) {
    const D = DARK.F || Y;
    for (let i = 0; i < 6; i++) { const a = rand(6.28), r = rand(0.3, 1.4); FX.smoke.spawn(new V3(D.x + Math.cos(a) * r, rand(0, 0.3), D.z + Math.sin(a) * r * 0.6), new V3(0, rand(1.5, 3.5), 0), rand(0.6, 1.2), rand(0.15, 0.35), C.dark, 0.75); }
    if (Math.random() < dt * 20) FX.glow.spawn(new V3(D.x + rand(-1, 1), rand(0, 0.4), D.z + rand(-0.6, 0.6)), new V3(0, rand(1, 3), 0), rand(0.5, 1), rand(0.03, 0.07), C.Y, 0.4);
  }
  if (STORM.on && Math.random() < dt * 18) {
    const x = A.x + rand(-5, 5), z = A.z + rand(-5, 3), hit = new V3(x, 0.02, z);
    FX.bolt(new V3(x + rand(-0.5, 0.5), 14, z - 2), hit.clone().sub(new V3(x, 14, z - 2)).normalize(), 14.2, rand(0.05, 0.1), rand(0.12, 0.25), pick([C.B, C.W]));
    FX.spark(hit, 12, [C.W, C.B], 5); if (Math.random() < 0.4) FX.dustBurst(hit, 3, 2); flash(0.07, 0xfff2a0); CAM.shake += 0.015;
    if (Math.random() < 0.35) AU.play('zap', { vol: 0.5, rate: rand(0.7, 1.1), pan: x / 4, wet: 0.3 });
  }
  if (STORM.on && STORM.tip && Math.random() < dt * 8) { const p = A.tip.clone(); FX.bolt(new V3(p.x + rand(-0.3, 0.3), 14, p.z - 1), new V3(0, -1, 0.07), 14 - p.y, 0.09, 0.18, C.B); FX.spark(p, 20, [C.W, C.B, C.A], 6); }
}

/* ======================================================================
   BOUCLE
   ====================================================================== */
function step(rdt) {
  S.dir += rdt;
  runEvents();
  const wdt = S.frozen ? 0 : rdt * S.slow;
  S.world += wdt;
  updTw();
  if (LEAF.on) {
    if (wdt > 0) LEAF.t += wdt;
    const y = Math.max(0.03, 5.2 - 2.6 * LEAF.t);
    W.keyLeaf.position.set(0.2 + 0.4 * Math.sin(LEAF.t * 2.4), y, 0.3 + 0.2 * Math.cos(LEAF.t * 1.7));
    if (y > 0.03) W.keyLeaf.rotation.set(LEAF.t * 3, LEAF.t * 2, LEAF.t);
  }
  if (S.rew) {
    const R = S.rew, q = clamp((S.dir - R.t0) / R.dur, 0, 1), h = HIST[Math.round(lerp(R.i0, R.i1, EASE.inOut(q)))];
    if (h) h.f.forEach((st, i) => { const F = [A, B, Y][i]; Object.assign(F.p, st.p); F.x = st.x; F.y = st.y; F.z = st.z; F.rx = st.rx; F.rz = st.rz; F.yaw = st.yaw; F.sheath = st.sheath; F.arm = st.arm; F.aura = st.aura; });
  } else {
    HIST.push({ dir: S.dir, f: [A, B, Y].map(F => ({ p: { ...F.p }, x: F.x, y: F.y, z: F.z, rx: F.rx, rz: F.rz, yaw: F.yaw, sheath: F.sheath, arm: F.arm, aura: F.aura })) });
    if (HIST.length > 1500) HIST.shift();
  }
  const fdt = F => (F.clk === 'dir' && !S.rew ? rdt : wdt);
  A.update(fdt(A), A.lookT || (A.fwd > 0 ? Y : B), camera); B.update(fdt(B), B.lookT || A, camera); Y.update(fdt(Y), Y.lookT || A, camera);
  fxLoops(wdt);
  EXTRA.forEach(f => f(wdt));
  
  if (HC && wdt > 0) {
    const p = HC.p;
    if (Math.random() < 0.7) FX.bolt(p, new V3(rand(-1, 1), rand(-0.7, 1), rand(-1, 1)), rand(1.2, 4), rand(0.02, 0.045), rand(0.12, 0.3), pick([C.A, C.B, C.Y]));
    if (Math.random() < 0.5) FX.bolt(p, new V3(rand(-1, 1), rand(0.2, 1), rand(-0.3, 0.3)), rand(3, 8), rand(0.04, 0.07), rand(0.1, 0.25), pick([C.A, C.B, C.Y]));
    HC.rt -= wdt; if (HC.rt <= 0) { HC.rt = 0.35; FX.ring(p, { col: pick([0x3f7bff, 0xffd84a, 0xa040ff]), size: 14, life: 0.8 }); CAM.shake += 0.03; shock(p, 0.5, 0.8); }
    if (Math.random() < 0.4) FX.spark(p, 5, [C.W, C.A, C.B, C.Y], 6);
    FX.zap(0.5);
  }
  TQ.update(wdt); PW.update(wdt); Y._divineUpd && Y._divineUpd();
  FX.update(wdt);
  W.windMul = S.frozen ? 0 : 1;
  W.update(wdt, camera);
  const mid = (FOC.length ? FOC[0] : A).root.position.clone();
  W.moon.target.position.copy(mid); W.moon.position.copy(mid).add(new V3(...(ST.keyOff || [6, 12, 8])));
  ST.update(wdt, camera); DV.update(wdt);
  updateCamera(rdt);
  decayScreen(rdt);
  post.bloom.threshold = ST.pal.bT ?? 0.9; post.bloom.strength = ST.pal.bS ?? 0.7;
}
function render() {
  updateScreen();
  if (S.panels !== null && S.panels !== undefined && S.started) renderPanels(S.dir - S.panels);
  else { const saved = TQ.occ; TQ.occ = saved.concat(FX.rocks.map(r => r.m), DV.debris.map(d => d.m)); const hid = window.__noOcc ? [] : TQ.hideOccluders(camera, [A, B, Y]); TQ.occ = saved; post.composer.render(); hid.forEach(o => (o.visible = true)); }
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const rdt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!A) return;
  if (window.__manual) return;
  if (S.started && !S.ended) step(rdt);
  else if (!S.started) { S.world += rdt; A.update(rdt, B, camera); B.update(rdt, A, camera); Y.update(rdt, A, camera); FX.update(rdt); W.update(rdt, camera); updateCamera(rdt); }
  render();
}

/* ======================================================================
   DÉMARRAGE
   ====================================================================== */
(async () => {
  $('loadtxt').textContent = 'Chargement des personnages…';
  await load();
  S.panels = null;
  script();
  camCut([0, 7, 14], [0, 18, -60], 40);
  // pré-compilation des shaders
  A.update(0.016, B, camera); B.update(0.016, A, camera); Y.update(0.016, A, camera);
  renderer.compile(scene, camera);
  $('loading').classList.add('hide'); $('go').disabled = false;
  window.READY = true;
  requestAnimationFrame(frame);
  if (QS.has('pose')) poseViewer();
})();
$('go').addEventListener('click', async () => {
  $('start').classList.add('hide');
  $('loadtxt').textContent = '';
  try { await AU.initAudio(window.__SFX || {}); AU.resume(); } catch (e) { console.warn(e); }
  S.started = true;
});
$('again').addEventListener('click', () => location.reload());

/* ---------- outils de test ---------- */
window.__dbg = () => [A, B, Y].map(F => [F.x.toFixed(2), F.y.toFixed(2), F.yaw.toFixed(2)].join(',')).join(' | ') + ' cam ' + [CAM.mode, CAM.px, CAM.py, CAM.pz].map(v => typeof v === 'number' ? v.toFixed(2) : v).join(',');
window.__adv = t => { window.__manual = true; S.started = true; S.mute = true; $('start').style.display = 'none'; $('loading').style.display = 'none'; $('end').style.display = 'none'; while (S.dir < t - 1e-6) step(1 / 60); window.__sync(); };
window.__sync = () => { document.getAnimations().forEach(a => { if (a.__t0 === undefined) a.__t0 = S.dir; a.pause(); a.currentTime = Math.max(0, (S.dir - a.__t0) * 1000); }); };
window.__frame = t => { window.__manual = true; S.started = true; S.mute = true; $('start').style.display = 'none'; $('loading').style.display = 'none'; $('end').style.display = 'none'; const jump = t - S.dir > 1; while (S.dir < t - 1e-6) step(1 / 60); if (jump) document.getAnimations().forEach(a => { if (a.__t0 === undefined) a.__t0 = S.dir - 30; }); window.__sync(); render(); };
window.__manualRender = () => { A.update(0, B, camera); B.update(0, A, camera); Y.update(0, A, camera); updateCamera(0.001); render(); };
window.__renderAudio = async (dur = 32.5) => {
  window.__manual = true; await AU.initAudio(window.__SFX || {}, dur + 1); S.started = true; S.mute = false;
  while (S.dir < dur) step(1 / 120);
  const b = await AU.renderOffline(), L = b.getChannelData(0), R = b.getChannelData(1), n = b.length;
  const buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf), ws = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 44100 * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  window.__wav = new Uint8Array(buf); return window.__wav.length;
};
window.__wavPart = (o, n) => { const u8 = window.__wav.subarray(o, o + n); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); };
window.__skip = t => { S.started = true; S.mute = true; $('start').classList.add('hide'); while (S.dir < t) step(1 / 30); S.mute = false; render(); };
function poseViewer() {
  $('start').classList.add('hide');
  window.__pose = (a, b, view = 'side') => {
    A.x = -0.85; B.x = 0.85; A.face(1); B.face(-1); A.set(a); B.set(b || a);
    A.aura = B.aura = +(QS.get('aura') || 0); B.eyesClosed = QS.has('closed');
    for (let i = 0; i < 40; i++) { S.world += 1 / 30; updTw(); A.update(1 / 30, B, camera); B.update(1 / 30, A, camera); }
    const views = { side: [[0, 1.1, 4.2], [0, 1.0, 0]], front: [[-3.2, 1.2, 1.6], [0, 1.0, 0]], back: [[3.2, 1.3, 1.6], [0, 1.0, 0]], top: [[0, 4.5, 1.6], [0, 0.8, 0]], headB: [[1.6, 1.6, 0.9], [0.85, 1.5, 0]], headA: [[-1.6, 1.7, 0.9], [-0.85, 1.65, 0]] };
    const v = views[view]; camCut(v[0], v[1], 35); CAM.shake = 0; CAM.hand = 0; updateCamera(0.016);
    post.composer.render(); window.POSED = (window.POSED || 0) + 1;
  };
  window.POSEREADY = true;
}
