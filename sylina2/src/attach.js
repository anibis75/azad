// Attributs divins de Sylina : auréole d'or et ailes de lumière (s'ouvrent, battent, se replient).
import * as THREE from 'three';
import { S, clamp, lerp } from './engine.js';

const V3 = THREE.Vector3;
function featherTex() {
  // y = 0 : base attachée (tuyau étroit) ; y = 256 : pointe libre arrondie
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#fff6e2'); gr.addColorStop(1, '#ffd98a');
  g.fillStyle = gr; g.beginPath(); g.moveTo(28, 0); g.lineTo(36, 0); g.bezierCurveTo(62, 70, 64, 200, 40, 252); g.quadraticCurveTo(32, 258, 24, 252); g.bezierCurveTo(0, 200, 2, 70, 28, 0); g.fill();
  g.strokeStyle = 'rgba(200,170,110,.8)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(32, 2); g.lineTo(32, 240); g.stroke();
  g.strokeStyle = 'rgba(190,160,120,.35)'; g.lineWidth = 1; for (let y = 24; y < 240; y += 8) { g.beginPath(); g.moveTo(32, y); g.lineTo(6, y + 16); g.moveTo(32, y); g.lineTo(58, y + 16); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,230,170,.5)'); r.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

export function addDivine(F, scene) {
  const k = F.k;
  /* ---------- auréole ---------- */
  const halo = new THREE.Group();
  const gold = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.011, 8, 64), gold); halo.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.004, 6, 64), gold); halo.add(ring2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, sp = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 4), gold); sp.position.set(Math.cos(a) * 0.29, Math.sin(a) * 0.29, 0); sp.rotation.z = a - Math.PI / 2; halo.add(sp); }
  const hg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe0a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 })); hg.scale.setScalar(0.9); halo.add(hg);
  halo.renderOrder = 7; scene.add(halo);
  F.acc = F.acc || [];
  F.acc.push({ m: halo, bone: 'head', off: new V3(0, 0.1, -0.17), rot: new THREE.Euler(0.15, 0, 0), sc: new V3(1, 1, 1) });
  F.halo = halo; F.haloA = 0;
  /* ---------- ailes : plumes réparties le long d'un « bras » d'aile (rémiges au bout, couvertures près de l'épaule) ---------- */
  const ft = featherTex(), wings = new THREE.Group(), sides = [];
  const fmat = new THREE.MeshStandardMaterial({ map: ft, color: 0xffffff, emissive: 0xffd890, emissiveIntensity: 0.35, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, roughness: 0.6, depthWrite: true });
  const gmat = new THREE.MeshBasicMaterial({ map: ft, color: 0xffd890, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0 });
  const rows = [{ n: 14, L0: 0.55, L1: 1.15, w: 0.3 }, { n: 11, L0: 0.36, L1: 0.6, w: 0.26 }, { n: 8, L0: 0.2, L1: 0.32, w: 0.22 }];
  for (const s of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(0.06 * s, 0, 0); wings.add(piv);
    const fe = [];
    rows.forEach((R, ri) => { for (let i = 0; i < R.n; i++) {
      const t = i / (R.n - 1), L = lerp(R.L0, R.L1, Math.pow(t, 1.3));
      const g = new THREE.PlaneGeometry(R.w, L); g.translate(0, -L / 2, 0);
      const m = new THREE.Mesh(g, fmat); m.castShadow = false; m.renderOrder = 6 - ri; piv.add(m);
      const gl = new THREE.Mesh(g, gmat); gl.scale.set(1.25, 1.05, 1); m.add(gl);
      fe.push({ m, t, ri, L });
    } });
    sides.push({ piv, s, fe });
  }
  scene.add(wings);
  F.acc.push({ m: wings, bone: 'upperChest', off: new V3(0, 0.06, -0.14), rot: new THREE.Euler(0, 0, 0), sc: new V3(1, 1, 1) });
  F.wings = { g: wings, sides, mat: fmat }; F.wing = 0; F.wingA = 0; F.flap = 0;
  // bras d'aile : courbe de l'épaule (0) vers la pointe (1) dans le plan du dos ; ouvert = horizontal-haut, replié = le long du dos
  const armPt = (t, sp, s) => { const ang = lerp(-1.25, 0.55, sp) + t * lerp(0.1, 0.2, sp), r = t * lerp(0.42, 0.95, sp); return new V3(s * Math.cos(ang) * r, Math.sin(ang) * r + 0.05, -t * lerp(0.05, 0.12, sp)); };
  F._divineUpd = () => {
    halo.visible = F.haloA > 0.01 && !F.hidden; gold.opacity = F.haloA; hg.material.opacity = 0.55 * F.haloA;
    ring2.rotation.z = S.dir * 0.6; halo.children.slice(2, 14).forEach((c, i) => (c.scale.y = 1 + 0.25 * Math.sin(S.dir * 3 + i)));
    const sp = clamp(F.wing, 0, 1); fmat.opacity = F.wingA * 0.9; wings.visible = F.wingA > 0.01 && !F.hidden;
    const fl = Math.sin(S.world * (F.flap > 0 ? 7 : 2)) * (0.08 + 0.3 * F.flap) * sp;
    gmat.opacity = 0.35 * F.wingA * sp;
    for (const sd of sides) {
      sd.piv.rotation.set(lerp(0.35, 0.12, sp), sd.s * lerp(-0.7, -0.15, sp), sd.s * fl);
      for (const f of sd.fe) {
        const R = rows[f.ri], tb = f.t * (1 - f.ri * 0.18) + f.ri * 0.02, b = armPt(tb, sp, sd.s);
        f.m.position.copy(b).add(new V3(0, 0, -0.01 * f.ri));
        // direction de la plume : vers le bas près de l'épaule, vers l'extérieur-bas à la pointe
        const dirA = lerp(lerp(0.1, 0.25, sp), lerp(0.2, 0.95, sp), Math.pow(f.t, 1.1)) + f.ri * 0.05;
        f.m.rotation.set(0, 0, sd.s * dirA);
        f.m.scale.setScalar(lerp(0.6, 1.0, sp) * k * 1.1);
      }
    }
  };
}
