// 虚神ノ逆襲 — PARTIE II : la revanche de Sylina (≈ 5 min). Azad, Remi et Sylina, mêmes personnages, nouveaux pouvoirs.
//  AZAD : Barbe Noire (ténèbres, trou noir, Kurouzu, Liberation) + Garp (Galaxy Impact, Genkotsu Meteor), se bat aux poings
//  REMI : Aokiji (Ice Age, Ice Time, Partisan, Pheasant Beak, sabre de glace)
//  SYLINA : Imu + Chevalier divin (ailes, auréole, lances sacrées, Domi Reversi, vingt épées, flamme mère) — elle gagne.
// I. Terre sainte (0 → 66) · II. Au-dessus des nuages divins (66 → 110) · III. Trône vide, lune rouge (110 → 170)
// IV. Soleil noir, océan gelé (172 → 240) · V. Épilogue sur le Trône vide, titre, générique (240 → 300)
export function buildScript(K) {
  const { at, later, V3, THREE, S, tw, twKill, rand, pick, FX, DV, ST, W, AU, C, $, TQ, PW } = K;
  const A = () => K.A, B = () => K.B, Y = () => K.Y;
  const T = (t, fn) => at(t, fn);
  const v = (x, y, z) => new V3(x, y, z);
  const pos = F => new V3(F.x, F.y, F.z);
  const hd = F => K.head(F), ch = F => K.chest(F);
  const hand = (F, s = 'right') => F.nb(s + 'Hand').getWorldPosition(new V3());
  const line = (t, who, id, jp, fr, dur, pan = 0) => T(t, () => { K.voice(id, pan); K.say(who, jp, fr, dur); });
  const cut = (p, t, fov = 34, roll = 0) => K.camCut(p, t, fov, roll);
  const move = (p, t, fov, roll, d, e = 'inOut') => K.camTo(p, t, fov, roll, d, e);
  const card = (id, on) => $(id).classList.toggle('show', on);
  const banner = (k, f, c) => K.banner(k, f, c);
  // caméra dans le repère d'un perso : s = vers sa droite, h = hauteur (au-dessus de ses pieds), d = devant lui
  const rel = (F, s, h, d, ls = 0, lh = 1.4, ld = 0, fov = 32, roll = 0) => () => {
    const f = F(), a = f.yaw, fw = v(Math.sin(a), 0, Math.cos(a)), r = v(-Math.cos(a), 0, Math.sin(a));
    const p = pos(f).addScaledVector(r, s).addScaledVector(fw, d); p.y = f.y + h;
    const t = pos(f).addScaledVector(r, ls).addScaledVector(fw, ld); t.y = f.y + lh;
    return [[p.x, p.y, p.z], [t.x, t.y, t.z], fov, roll];
  };
  const shot = sh => cut(...(typeof sh === 'function' ? sh() : sh));
  const guardOf = F => (F === K.A ? 'fistGuard' : F === K.B ? 'iceStance' : 'guard');
  const grunt = (F, vol = 0.9) => K.voice(F === K.A ? 'azad_grunt' : F === K.B ? 'remi_grunt' : 'sylina_grunt', 0, vol);
  const place = (F, x, z, yaw, pose = null, y = 0) => {
    ['x', 'z', 'y', 'yaw', 'rx', 'rz'].forEach(k => twKill(F, k)); F.x = x; F.z = z; F.y = y; F.yaw = yaw; F.rx = 0; F.rz = 0; F.cyc = null; F.cycW = 0; F.ghost = false;
    F.set(pose || guardOf(F)); F.prevX = x; F.prevZ = z; F.trail.clear(); F._resetSprings = true; if (F.cloth) F.cloth.init = false;
  };
  const face = (F, G, d = 0) => F.faceTo(G, d);
  const steps = (F, d, per) => { for (let t = per * 0.5; t < d; t += per) later(t, () => { if (F.y < 0.1) FX.dustBurst(pos(F), 2, 1.2); AU.SFX.taiko(0.12); }); };
  function runTo(F, x, z, d, f = 3.0) { F.faceTo(v(x, 0, z)); const fist = F === K.A; F.run(true, fist ? 'runFA' : 'runA', fist ? 'runFB' : 'runB', f); F.go3(x, z, d, 'lin'); steps(F, d, 0.5 / f * 1.4); later(d, () => { F.run(false); F.to(guardOf(F), 0.15); }); }
  function walkTo(F, x, z, d, y) { F.faceTo(v(x, 0, z)); F.run(true, 'walkA', 'walkB', 0.95); F.go3(x, z, d, 'lin', y); later(d, () => F.run(false)); }
  function dash(F, x, z, d = 0.2, pose) { F.faceTo(v(x, 0, z)); F.to(pose || (F === K.A ? 'runFA' : 'dash'), 0.06); F.go3(x, z, d, 'in'); F.ghost = true; later(d, () => (F.ghost = false)); AU.SFX.whoosh(0.8, 1.1); FX.dustBurst(pos(F), 6, 2); }
  function blink(F, x, z, look, y = 0) {
    const from = pos(F); ['x', 'z', 'y'].forEach(k => twKill(F, k)); F.x = x; F.z = z; F.y = y; F.prevX = x; F.prevZ = z; F.trail.clear(); F._resetSprings = true; if (F.cloth) F.cloth.init = false;
    TQ.flashStep(F, from, v(x, y, z), F.col.getHex()); if (look) F.faceTo(look); AU.SFX.tp();
  }
  // saut : accroupi -> envol (flip optionnel) -> réception
  function leap(F, x, z, h, d, o = {}) {
    const y0 = F.y, y1 = o.y1 ?? 0;
    if (o.look !== false) F.faceTo(v(x, 0, z));
    F.to('crouch', 0.06);
    later(0.08, () => {
      F.to(o.pose || 'airSpin', 0.14); FX.dustBurst(pos(F), 14, 4); AU.SFX.whoosh(1, 0.7); if (y0 < 0.2) FX.ring(pos(F).setY(y0 + 0.05), { col: F.col.getHex(), size: 3, life: 0.35, flat: true });
      tw(F, 'x', x, d, 'lin', 'world'); tw(F, 'z', z, d, 'lin', 'world'); tw(F, 'y', Math.max(y0, y1) + h, d * 0.5, 'out', 'world');
      later(d * 0.5, () => tw(F, 'y', y1, d * 0.5, 'in', 'world'));
      if (o.flip) { tw(F, 'rx', o.flip * Math.PI * 2, d * 0.9, 'inOut', 'world'); later(d * 0.93, () => { twKill(F, 'rx'); F.rx = 0; }); }
    });
    later(0.08 + d, () => {
      F.to(o.land || 'landing', 0.05); FX.dustBurst(pos(F), 16, 4); FX.ring(pos(F).setY(y1 + 0.05), { col: F.col.getHex(), size: 5, life: 0.45, flat: true }); AU.SFX.boom(0.5); K.CAM.shake += 0.04;
      if (o.after !== null) later(0.3, () => F.to(o.after || guardOf(F), 0.25)); o.onLand && o.onLand();
    });
  }
  function roll(F, x, z, d = 0.5) { F.faceTo(v(x, 0, z)); F.to('tuck', 0.06); F.go3(x, z, d, 'out'); tw(F, 'rx', Math.PI * 2, d, 'inOut', 'world'); tw(F, 'y', 0.3, d * 0.5, 'out', 'world'); later(d * 0.5, () => tw(F, 'y', 0, d * 0.5, 'in', 'world')); later(d, () => { twKill(F, 'rx'); F.rx = 0; F.to(guardOf(F), 0.15); }); FX.dustBurst(pos(F), 10, 3); AU.SFX.whoosh(0.7, 1.3); }
  function fly(F, x, y, z, d, pose = 'hover', e = 'inOut') { F.faceTo(v(x, 0, z)); F.to(pose, 0.25); F.flap = 1; tw(F, 'wing', 1, 0.3, 'out', 'dir'); tw(F, 'x', x, d, e, 'world'); tw(F, 'y', y, d, e, 'world'); tw(F, 'z', z, d, e, 'world'); later(d, () => (F.flap = 0.2)); AU.SFX.whoosh(0.9, 0.6); FX.dustBurst(pos(F), 10, 3); }
  function knock(F, from, dist = 3, lift = 0.5, d = 0.45) {
    const dd = pos(F).sub(from).setY(0).normalize(); F.faceTo(from); F.to('hurt', 0.06);
    const y0 = F.y; F.go3(F.x + dd.x * dist, F.z + dd.z * dist, d, 'out', y0 + lift); later(d, () => tw(F, 'y', y0, 0.2, 'in', 'world'));
    grunt(F); F.drag = F !== K.A; later(d + 0.1, () => (F.drag = false));
  }
  function hit(F1, F2, pw = 1.2, p) {
    p = p || ch(F2).lerp(ch(F1), 0.3).add(v(0, 0.1, 0));
    FX.spark(p, 20 + pw * 25, [C.W, F1.col, C.gold], 5 + pw * 2); FX.ring(p, { col: F1.col.getHex(), size: 1 + pw * 0.8, life: 0.3 });
    K.flash(0.08 * pw); K.CAM.shake += 0.025 * pw; K.SCR.speed = Math.max(K.SCR.speed, 0.22 * pw); AU.SFX.boom(0.3 + 0.2 * pw); AU.SFX.clash(pw * 0.6, 0);
    K.sfxText(pick(['ドッ', 'バキッ', 'ガッ', 'ドガッ']), p.clone().add(v(0, 0.45, 0)), 60 + pw * 16);
    if (pw >= 2) { K.impact(pw >= 3); K.shock(p, 0.6, pw / 3); }
    return p;
  }
  function clashS(F1, F2, pw = 1.2) {
    const p = (F1 === K.A || F2 === K.A) ? (F1 === K.A ? hand(F1) : hand(F2)).lerp(ch(F1 === K.A ? F2 : F1), 0.15) : K.clashPoint(F1, F2);
    FX.spark(p, 25 + pw * 30, [C.W, C.gold, C.W], 5 + pw * 2); FX.ring(p, { col: 0xffffff, size: 1.2 + pw * 0.8, life: 0.3 + 0.08 * pw });
    K.flash(0.1 * pw); K.CAM.shake += 0.02 * pw; K.SCR.speed = Math.max(K.SCR.speed, 0.22 * pw);
    K.sfxText(pick(['キン', 'ガキン', 'ギィン']), p.clone().add(v(0, 0.5, 0)), 60 + pw * 18); AU.SFX.clash(pw, 0);
    if (pw >= 2) { K.impact(pw >= 3); K.shock(p, 0.6, pw / 3); for (let i = 0; i < pw * 5; i++) FX.bolt(p, new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)), rand(0.4, 1.4) * pw * 0.5, rand(0.015, 0.03), rand(0.15, 0.3), pick([F1.col, F2.col])); }
    return p;
  }
  // échange : att attaque, def pare. kind épée : side/high/thrust/spin ; poings/pieds : jab/hook/upper/kick/spinK/knee/axe
  const ATK = {
    side: ['windSide', 'cutSide'], high: ['windHigh', 'cutDown'], thrust: ['guard', 'thrust'], spin: ['windSide', 'passSlash'],
    jab: ['fistGuard', 'jabL'], hook: ['fistGuard', 'hookR'], upper: ['crouch', 'uppercut'], kick: [null, 'kick'], spinK: [null, 'spinKick'], knee: [null, 'knee'], axe: [null, 'axeKick'],
  };
  const BODY = ['kick', 'spinK', 'knee', 'axe', 'jab', 'hook', 'upper'];
  function exch(t, att, def, kind = 'side', pw = 1.3, sh) {
    T(t, () => { const a = att(), d = def(); face(a, d); face(d, a); const pr = ATK[kind][0]; if (pr) a.to(pr, 0.07); const hi = kind === 'high' || kind === 'axe';
      d.to(d === K.A ? 'fistGuard' : hi ? 'blockHigh' : 'guard', 0.07); AU.SFX.slash(0.7); });
    T(t + 0.08, () => { att().to(ATK[kind][1], 0.05); });
    T(t + 0.13, () => { const a = att(), d = def(); if (a !== K.A && d !== K.A && !BODY.includes(kind)) clashS(a, d, pw); else if (!BODY.includes(kind)) clashS(a, d, pw); else hit(a, d, pw); if (sh) shot(sh); });
  }
  const breakCol = (list, i, from) => { const P = list[i]; if (!P || P.userData.broken) return; P.userData.broken = true; DV.breakGroup(P, from, 7, 3); AU.SFX.debris(0.9); AU.SFX.boom(0.5); FX.dustBurst(P.getWorldPosition(new V3()), 14, 4); };
  const nearCols = (list, p, n) => list.map((P, i) => [i, P.getWorldPosition(new V3()).distanceTo(p)]).filter(([i]) => !list[i].userData.broken).sort((a, b) => a[1] - b[1]).slice(0, n).map(a => a[0]);
  // dissolution / reformation (Domi Reversi)
  function dissolve(F) { const p = ch(F); for (let i = 0; i < 140; i++) { const q = p.clone().add(v(rand(-0.4, 0.4), rand(-0.9, 0.6), rand(-0.4, 0.4))); FX.smoke.spawn(q, v(rand(-1, 1), rand(0.5, 3), rand(-1, 1)), rand(0.6, 1.4), rand(0.06, 0.2), C.dark, 0.8); if (i % 2) FX.glow.spawn(q, v(rand(-1.5, 1.5), rand(0.5, 3), rand(-1.5, 1.5)), rand(0.6, 1.2), rand(0.03, 0.07), pick([C.Y, C.holy]), 0.7); } F.show(false); AU.play('imu_dark', { vol: 0.9, rate: 1.3 }); }
  function reform(F, x, z, y = 0, yaw = 0) { place(F, x, z, yaw, 'wingSpread', y); F.show(true); F.wing = 1; F.wingA = 1; F.haloA = 1; F.flap = 1; later(1, () => (F.flap = 0.2)); const p = v(x, y + 1.1, z);
    for (let i = 0; i < 160; i++) { const d = v(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(2, 4)); FX.glow.spawn(p.clone().add(d), d.clone().multiplyScalar(-2.4), 0.45, rand(0.04, 0.09), pick([C.Y, C.holy, C.W]), 0.9); }
    for (let i = 0; i < 4; i++) FX.ghost(F, i % 2 ? 0xffd890 : 0xa040ff, 0.4 + i * 0.1); K.flash(0.8, 0xffe8c0); DV.dome(p, 0xffd890, 9, 0.9); AU.play('imu_seal', { vol: 1 }); AU.SFX.boom(1); }
  const heartBeats = (t, n, gap = 1.2) => { for (let i = 0; i < n; i++) T(t + i * gap, () => AU.SFX.heart(1.1 + i * 0.1)); };
  const fade = (to, d) => tw(K.SCR, 'fade', to, d, 'inOut', 'dir');
  const white = (to, d) => tw(K.SCR, 'white', to, d, to > 0.5 ? 'in' : 'out', 'dir');
  const resetAll = () => { FX.rocks.forEach(r => r.m.removeFromParent()); FX.rocks.length = 0; DV.clearAll(); TQ.clearAll(); PW.clearAll(); K.setHC(null); K.DARK.on = false; S.panels = null; S.lock = false; [A(), B(), Y()].forEach(F => { F.ghost = false; F.drag = false; F.rx = 0; F.rz = 0; F.openL = false; }); };

  /* =========================================================================================== ACTE I — TERRE SAINTE */
  {
    const O = 0, t = x => O + x;
    T(t(0), () => {
      ST.set('holy', 'holyDusk'); K.SCR.fade = 1; fade(0, 3); K.foc([]);
      A().fist = true; B().ice = true; Y().holy = 0.4;
      place(Y(), 0, -40, 0, 'walkA', 7.05); Y().haloA = 1; Y().wingA = 1; Y().wing = 0; K.HOLY.on = true; K.HOLY.F = Y();
      place(A(), 3.5, 3, Math.PI, 'fistGuard', -2.2); A().show(false); place(B(), -14, 14, 2.4, 'slideBrake', 10); B().show(false);
      cut([-34, 16, 70], [0, 16, -60], 50); move([-5, 9, 30], [0, 8, -40], 44, 0, 7.5);
      AU.track('m_chant', { vol: 0.55, fade: 2 }); AU.wind(0.3, 2);
      K.caption('第二部 ・ 虚神ノ逆襲  —  Partie II · La revanche de Sylina');
    });
    T(t(4.2), () => K.caption('', false));
    T(t(4.8), () => K.caption('第一幕 ・ 聖地  —  Acte I · La Terre sainte'));
    T(t(7.8), () => K.caption('', false));
    // Sylina descend le grand escalier de Pangée
    T(t(3.0), () => { Y().faceTo(v(0, 0, 0)); Y().run(true, 'walkA', 'walkB', 0.95); tw(Y(), 'z', -19.4, 7.6, 'lin', 'world'); tw(Y(), 'y', 0.11, 7.6, 'lin', 'world'); });
    T(t(10.6), () => { tw(Y(), 'y', 0, 0.3, 'lin', 'world'); tw(Y(), 'z', -15.5, 2.6, 'lin', 'world'); });
    T(t(13.2), () => Y().run(false));
    T(t(7.6), () => { K.camTrack(Y(), [0.55, 0.55, 3.4], [0, 1.75, 0], 36, 3, true); });
    T(t(9.8), () => { K.camTrack(Y(), [-0.45, 1.6, 1.15], [0, 1.52, 0], 26, 4, true); card('nY', true); });
    line(t(10.3), 'Y', 'y_kutsujoku', 'あの日の屈辱…忘れてないわ。', '« L\'humiliation de ce jour-là… je ne l\'ai pas oubliée. »', 4.3, 0.2);
    T(t(13.4), () => { card('nY', false); K.camTrack(Y(), [0.8, 1.75, -2.3], [0, 1.2, 6], 38, 3, true); Y().set('stand'); });
    // Remi : glissade sur une rampe de glace
    T(t(14.6), () => {
      B().show(true); K.FROST.on = true; K.FROST.F = B(); PW.iceRamp([v(-16, 13, 16), v(-11, 6, 11), v(-6.5, 1.2, 6), v(-3.5, 0.1, 3)], 0.5, 2.5);
      B().faceTo(v(-3.5, 0, 3)); tw(B(), 'x', -3.5, 1.1, 'in', 'world'); tw(B(), 'z', 3, 1.1, 'in', 'world'); tw(B(), 'y', 0, 1.1, 'in', 'world'); AU.SFX.whoosh(1, 0.6); AU.play('shatter', { vol: 0.5, rate: 1.4 });
      cut([-11, 1.0, 9], [-6, 3.5, 7], 40, 0.05); move([-7, 0.9, 6.5], [-3.5, 1.2, 3], 32, 0.02, 1.4);
    });
    T(t(15.7), () => { B().to('iceStance', 0.1); PW.iceAge(v(-3.5, 0, 3), 4.5, 0.6, 0, 22); FX.spark(v(-3.5, 0.2, 3), 40, [C.ice, C.W], 6); AU.SFX.boom(0.6); K.CAM.shake += 0.05; B().faceTo(Y()); });
    T(t(16.2), () => { card('nB', true); shot(rel(B, -0.5, 1.55, 1.5, 0, 1.5, 0, 28, 0.03)); });
    line(t(16.5), 'B', 'r_kooraseru', '凍らせてやる。', '« Je vais te geler. »', 2, -0.3);
    // Azad : surgit d'un trou de ténèbres
    T(t(18.4), () => {
      card('nB', false); A().show(true); K.AZD.on = true; K.AZD.F = A(); PW.blackHole(v(3.5, 0, 3), 1.9, 3.2, 0.4); AU.play('imu_dark', { vol: 0.8, rate: 0.7 });
      tw(A(), 'y', 0, 1.3, 'out', 'world'); A().faceTo(Y()); cut([8, 0.5, 8.5], [3.5, 1.0, 3], 36, -0.04); move([6.4, 1.1, 6.6], [3.5, 1.5, 3], 30, -0.01, 2.2);
    });
    T(t(19.6), () => { card('nA', true); });
    line(t(20.0), 'A', 'a_mata', 'また負けに来たのかよ。', '« Tu reviens perdre encore ? »', 2.4);
    T(t(22.2), () => { card('nA', false); cut([0, 1.7, 10], [0, 1.3, -14], 36); move([0, 1.45, 7.2], [0, 1.4, -14], 32, 0, 3); });
    T(t(23.6), () => { shot(rel(Y, 0.4, 1.5, 2.8, 0, 1.45, 0, 30, 0)); });
    line(t(23.8), 'Y', 'y_sabaku', '今度は…私が裁く番よ。', '« Cette fois… c\'est moi qui juge. »', 4.2, 0.2);
    // éveil du Chevalier divin
    T(t(27.6), () => {
      tw(Y(), 'wing', 1, 1.1, 'out', 'dir'); Y().flap = 1; Y().to('wingSpread', 0.4); Y().haloA = 1.4; tw(Y(), 'haloA', 1, 1.5, 'out', 'dir'); Y().eyeFlash = 1; tw(Y(), 'eyeFlash', 0, 1, 'out', 'dir');
      DV.dome(ch(Y()), 0xffd890, 14, 1.1); K.flash(0.55, 0xffe0a0); AU.play('haki_conqueror', { vol: 0.8 }); AU.SFX.boom(1); K.CAM.shake += 0.12; ST.blend('holyDark', 3.5); ST.petalWind = 6;
      cut([-4.5, 0.35, -8.5], [0, 2.6, -15.5], 46, 0.06); move([-3.6, 0.5, -9.5], [0, 2.4, -15.5], 42, 0.03, 2.4);
      for (const F of [A(), B()]) { F.to('hurt', 0.1); later(0.5, () => F.to(guardOf(F), 0.3)); }
    });
    T(t(28.4), () => { banner('神の騎士 ・ 降臨', 'LE CHEVALIER DIVIN DESCEND', '#ffd890'); Y().flap = 0.2; });
    T(t(30.2), () => { Y().to('guard', 0.3); AU.SFX.draw(); AU.track('m_rock', { vol: 0.6, fade: 0.4 }); K.foc([B(), A(), Y()]); ST.petalWind = 2; });
    // assaut à deux
    T(t(30.6), () => { runTo(A(), 0.85, -13.8, 1.1, 3.2); runTo(B(), -0.85, -13.6, 1.15, 3.2); K.camTrack(A(), [-2.4, 1.0, 0.6], [0, 1.2, 1.8], 38, 6, true); AU.SFX.whoosh(0.8, 0.9); });
    exch(t(31.75), A, Y, 'hook', 1.6, rel(Y, 2.2, 1.2, 2.4, 0, 1.3, 0, 32, 0.06));
    exch(t(32.1), B, Y, 'side', 1.6, rel(Y, -2.4, 1.5, 1.8, 0, 1.3, 0, 32, -0.06));
    exch(t(32.45), A, Y, 'jab', 1.3, rel(A, 1.6, 1.0, -1.2, 0, 1.4, 2, 32, 0.08));
    exch(t(32.8), Y, B, 'spinK', 1.5, rel(Y, 0, 0.6, 3, 0, 1.2, 0, 40, 0.1));
    T(t(32.95), () => knock(B(), pos(Y()), 3));
    exch(t(33.2), A, Y, 'upper', 1.4);
    T(t(33.3), () => { leap(Y(), 0, -17.4, 1.7, 0.6, { flip: -1, look: false, pose: 'tuck' }); shot(rel(A, 2.4, 0.3, 1.0, 0, 1.9, 2, 42, 0.12)); });
    // Partisan
    line(t(34.1), 'B', 'r_partisan', '両棘矛（パルチザン）！', '« Partisan ! »', 1.6, -0.3);
    T(t(34.3), () => { B().faceTo(Y()); B().to('windHigh', 0.1); shot(rel(B, -0.9, 1.7, -2.8, 0, 1.4, 7, 38, 0)); });
    T(t(34.55), () => { B().to('cutDown', 0.06); PW.partisan(ch(B()).add(v(0, 0.6, 0)), ch(Y()), 12, 2.6, 34, 0.05); AU.SFX.whoosh(1.2, 0.8); AU.play('shatter', { vol: 0.4, rate: 1.6 }); });
    T(t(34.85), () => { fly(Y(), 0.6, 4.6, -18.8, 0.6, 'hover', 'out'); cut([2.2, 0.35, -13.5], [0, 4, -18], 50, 0.08); });
    T(t(35.7), () => { Y().to('divineDive', 0.1); Y().ghost = true; tw(Y(), 'x', B().x, 0.38, 'in', 'world'); tw(Y(), 'z', B().z - 1.0, 0.38, 'in', 'world'); tw(Y(), 'y', 0, 0.38, 'in', 'world'); AU.SFX.whoosh(1.2, 1.1); B().to('blockHigh', 0.1); });
    T(t(36.1), () => { Y().ghost = false; Y().to('cutDown', 0.05); clashS(Y(), B(), 2.2); knock(B(), pos(Y()), 3.5); shot(rel(Y, 2.6, 1.0, 1.6, 0, 1.2, 1.2, 34, 0.06)); });
    // Kurouzu + Gura
    line(t(36.7), 'A', 'a_kurouzu', '闇水（くろうず）！', '« Kurouzu ! »', 1.5);
    T(t(36.8), () => { A().faceTo(Y()); A().to('darkPalms', 0.1); PW.darkStream(() => ch(Y()), () => hand(A(), 'left'), 0.9); AU.play('imu_dark', { vol: 0.8, rate: 1.5 }); shot(rel(A, -1.5, 1.5, -1.6, 0, 1.3, 3, 34, 0.04)); });
    T(t(37.1), () => { const a = pos(A()), d = pos(Y()).sub(a).setY(0).normalize(); Y().to('hurt', 0.08); Y().go3(a.x + d.x * 0.95, a.z + d.z * 0.95, 0.5, 'in'); Y().wing = 0.3; });
    T(t(37.6), () => { A().to('hookR', 0.05); K.crackFX([0.5, 0.42], 0.6, 1.2); K.flash(0.4, 0xcfe0ff); K.impact(true); K.shock(ch(Y()), 0.7, 1.2); AU.play('gura_crack', { vol: 0.9 }); AU.SFX.boom(1); K.CAM.shake += 0.12; K.sfxText('グラッ', [0.45, 0.3], 120, '#cfe0ff');
      const i = nearCols(ST.holyCols, pos(Y()), 1)[0], P = ST.holyCols[i].position; Y().faceTo(A()); Y().go3(P.x * 0.93, P.z * 0.93, 0.5, 'out', 0.8); grunt(Y()); later(0.45, () => { breakCol(ST.holyCols, i, pos(A())); Y().go3(Y().x, Y().z, 0.2, 'in', 0); Y().to('crouch', 0.1); });
      cut([-3.5, 1.3, -6.5], [P.x * 0.6, 1.3, P.z * 0.6], 42, -0.04); });
    // Taille de l'aile céleste
    T(t(39.0), () => { Y().eyeFlash = 1; tw(Y(), 'eyeFlash', 0, 0.8, 'out', 'dir'); Y().faceTo(v((A().x + B().x) / 2, 0, (A().z + B().z) / 2)); Y().to('guard', 0.2); tw(Y(), 'wing', 1, 0.3, 'out', 'dir'); shot(rel(Y, 0.7, 0.8, 1.7, 0, 1.6, 0, 28, 0.05)); });
    line(t(39.4), 'Y', 'y_tenyoku', '天翼斬！', '« Taille de l\'aile céleste ! »', 1.9, 0.2);
    T(t(39.6), () => { Y().to('windSide', 0.12); Y().flap = 1; });
    T(t(39.9), () => {
      Y().to('cutSide', 0.05); const m = v((A().x + B().x) / 2, 1.2, (A().z + B().z) / 2), d = m.clone().sub(ch(Y())).setY(0).normalize();
      TQ.wave(ch(Y()).add(v(0, 0.2, 0)), d, 0xffe0a0, 4.6, 30, 1.3); TQ.wave(ch(Y()).add(v(0, 0.9, 0)), d, 0xd890ff, 3.4, 26, 1.3);
      AU.SFX.slash(1.2); AU.play('whoosh', { vol: 1.2, rate: 0.6 }); banner('天翼斬', 'TAILLE DE L\'AILE CÉLESTE', '#ffd890');
      leap(A(), A().x - d.z * 1.5, A().z + d.x * 1.5, 3.4, 0.95, { flip: 1, pose: 'airFist' }); leap(B(), B().x + d.z * 1.5, B().z - d.x * 1.5, 3.2, 0.95, { flip: 1 });
      cut([Y().x + d.x * -2.5, 0.3, Y().z + d.z * -2.5], [m.x, 2.4, m.z], 50, 0); Y().flap = 0.2;
    });
    T(t(40.5), () => { cut([A().x + 2, 7.5, A().z + 3], [A().x, 1.5, A().z - 1], 60, 0.35); });
    T(t(40.9), () => { nearCols(ST.holyCols, v(0, 0, 14), 2).forEach(i => breakCol(ST.holyCols, i, v(0, 1, 0))); });
    // Ice Age sur l'esplanade
    line(t(41.6), 'B', 'r_iceage', 'アイス・エイジ。', '« Ice Age. »', 1.8, -0.3);
    T(t(41.8), () => { B().faceTo(Y()); B().to('slamDown', 0.12); cut([0, 21, 6], [0, 0, -5], 52, 0); move([0, 24, 10], [0, 0, -6], 54, 0, 1.8); });
    T(t(42.0), () => { PW.iceAge(pos(B()), 19, 1.6, 0, 100); AU.play('shatter', { vol: 0.9, rate: 0.7 }); AU.SFX.rumble(0.6, 2); banner('アイス・エイジ', 'ICE AGE — L\'ÈRE GLACIAIRE', '#9aeaff'); K.flash(0.3, 0xcff4ff); });
    T(t(42.9), () => { K.ICE1 = PW.iceTime(pos(Y()), 0.9, 1.1, 0.3); Y().to('guard', 0.1); });
    T(t(43.7), () => { runTo(A(), Y().x + 0.9, Y().z + 0.95, 0.8, 3.4); K.camTrack(A(), [0.3, 1.3, -2.6], [0, 1.2, 3], 40, 6, true); });
    T(t(44.5), () => {
      for (let i = 0; i < 8; i++) DV.tendril(v(Y().x + rand(-1.5, 1.5), 0, Y().z + rand(-1.5, 1.5)), ch(A()).add(v(rand(-0.4, 0.4), rand(-0.5, 0.3), rand(-0.3, 0.3))), 0.08, 0.3, 0.8);
      DV.spikeLine(pos(Y()), pos(A()), 10, 2.4); PW.shatter(K.ICE1); K.flash(0.5, 0x9a40ff); AU.play('imu_dark', { vol: 1 }); grunt(Y(), 0.7);
      leap(A(), A().x + 2.5, A().z + 3.2, 2.2, 0.7, { flip: -1, look: false, pose: 'tuck' }); shot(rel(Y, -2.6, 1.0, 2.6, 0, 1.3, 0, 36, -0.05));
    });
    // Lances sacrées — pluie céleste
    T(t(45.8), () => { Y().to('raiseSky', 0.3); Y().flap = 1; ST.rayA = 0.45; cut([1.4, 0.4, Y().z + 3], [Y().x, 2.8, Y().z], 40, 0.06); });
    line(t(45.9), 'Y', 'y_seisou', '聖槍・天の雨！', '« Lances sacrées — Pluie céleste ! »', 2.6, 0.2);
    T(t(46.9), () => {
      const tg = []; for (let i = 0; i < 46; i++) { const F = i % 2 ? A() : B(); tg.push(v(F.x + rand(-4, 4), 0, F.z + rand(-4, 4))); }
      PW.holySpears(tg, 0.05); banner('聖槍・天ノ雨', 'LANCES SACRÉES — PLUIE CÉLESTE', '#ffd890'); AU.play('whoosh', { vol: 1, rate: 0.5 });
      cut([12, 25, 18], [0, 0, -2], 52, 0.05); Y().flap = 0.2;
    });
    T(t(47.5), () => { roll(B(), B().x - 2.6, B().z + 1.2); });
    T(t(47.7), () => { shot(rel(B, 2.3, 0.4, 2.4, 0, 2.6, 0, 48, 0.09)); });
    T(t(48.1), () => { K.WALL = PW.iceTime(pos(B()).add(pos(Y()).sub(pos(B())).setY(0).normalize().multiplyScalar(1.1)), 1.5, 2.8, 0.25); AU.play('shatter', { vol: 0.5, rate: 1.2 }); });
    line(t(48.2), 'A', 'a_blackhole', 'ブラックホール！', '« Black Hole ! »', 1.5);
    T(t(48.4), () => { A().to('groundPalm', 0.1); PW.blackHole(pos(A()), 4.6, 3.4, 0.5); AU.play('imu_dark', { vol: 1.1, rate: 0.6 }); AU.SFX.rumble(0.8, 3); cut([A().x + 4.5, 2.6, A().z + 5], [A().x, 0.5, A().z], 44, 0.04); });
    // Liberation
    line(t(50.0), 'A', 'a_liberation', '解放（リベレイション）！', '« Libération ! »', 1.4);
    T(t(50.1), () => { A().faceTo(Y()); A().to('darkPalms', 0.1); shot(rel(A, 0.9, 1.4, -2.2, 0, 1.3, 5, 36, 0.03)); });
    T(t(50.35), () => { const p = ch(A()).add(v(Math.sin(A().yaw), 0, Math.cos(A().yaw)).multiplyScalar(0.6)); PW.liberation(p, ch(Y()).sub(p), 55, 26); AU.SFX.boom(1); AU.play('impact_big', { vol: 0.8 }); K.CAM.shake += 0.1; });
    T(t(50.75), () => { Y().wing = 0.15; hit(A(), Y(), 2.4, ch(Y())); knock(Y(), pos(A()), 4); Y().to('slideBrake', 0.1); DV.breakTiles(ST, pos(Y()), 2.5, 4); PW.shatter(K.WALL, 5); cut([Y().x + 4, 1, Y().z + 2], [Y().x, 1, Y().z], 38, -0.05); });
    // Pheasant Beak -> gangue de glace -> Azad écrase
    line(t(51.6), 'B', 'r_pheasant', '暴雉嘴（フェザントベック）！', '« Pheasant Beak ! »', 1.9, -0.3);
    T(t(51.8), () => { B().faceTo(Y()); B().to('windSide', 0.1); shot(rel(B, -1.8, 2.2, -4.6, 0, 2.4, 8, 46, 0.04)); });
    T(t(52.0), () => { B().to('cutSide', 0.06); TQ.beast('hawk', ch(B()).add(v(0, 1.2, 0)), ch(Y()), 0x9ae8ff, 9, 1.0, { flap: 6, arc: 1.5 }); banner('暴雉嘴', 'PHEASANT BEAK', '#9aeaff'); AU.play('whoosh', { vol: 1.2, rate: 0.5 }); });
    T(t(52.9), () => { K.ICE2 = PW.iceTime(pos(Y()), 1.25, 2.6, 0.3); K.flash(0.45, 0xcff4ff); K.impact(false); FX.spark(ch(Y()), 80, [C.ice, C.W], 9); AU.play('shatter', { vol: 0.9 }); Y().to('guard', 0.1); shot(rel(Y, 2.6, 1.3, 3.4, 0, 1.4, 0, 32, 0.03)); });
    T(t(53.5), () => { leap(A(), Y().x, Y().z + 0.35, 7.5, 1.25, { pose: 'airFist', land: 'groundPalm', after: null }); A().arm = 1; K.aura(A(), 1.8, 0.4); AU.play('gura_charge', { vol: 0.9 }); });
    T(t(54.0), () => { const a = ch(A()); cut([Y().x + 1.6, 0.4, Y().z + 3.2], [a.x, a.y, a.z], 62, 0.25); });
    T(t(54.83), () => {
      PW.shatter(K.ICE2, 9); K.crackFX([0.5, 0.55], 0.9, 1.8); K.flash(1, 0xdfe8ff); K.impact(true); K.shock(pos(Y()), 1, 1.6); AU.play('gura_crack', { vol: 1.2 }); AU.SFX.boom(1.5); AU.SFX.debris(1); K.CAM.shake += 0.3;
      DV.breakTiles(ST, pos(Y()), 4.5, 7); W.crackAt(Y().x, Y().z); for (const a of [0, 1.2, 2.4, 3.6, 4.8]) W.crack(Y().x, Y().z, a, rand(4, 6), '#6f9bff'); FX.rock(pos(Y()), 22, 8); DV.dome(pos(Y()), 0x9ab8ff, 12, 1);
      Y().rx = -1.45; Y().y = -0.62; Y().set('lie'); Y().wing = 0; banner('震震・墜撃', 'GURA GURA — LA CHUTE', '#8fb4ff'); K.aura(A(), 0.6, 1);
      cut([Y().x + 7, 4, Y().z + 8], [Y().x, 0.5, Y().z], 44, 0.05); move([Y().x + 5.5, 3, Y().z + 6.5], [Y().x, 0.4, Y().z], 40, 0.02, 2);
    });
    T(t(55.6), () => { A().to('fistGuard', 0.4); AU.trackVol(0.12, 1); });
    heartBeats(t(56.2), 2, 0.9);
    T(t(56.4), () => { K.camOrbit(Y().x, 0.5, 4.6, 2.2, 0.5, 1.5, 2.4, 36, 0.02, Y().z); });
    T(t(57.2), () => { dissolve(Y()); K.HOLY.on = false; });
    line(t(57.5), 'A', 'a_bakana', '馬鹿な…！', '« Impossible… ! »', 1.2);
    // Domi Reversi
    T(t(58.0), () => { DV.circle(ST.circleTex, v(0, 0.06, -6), 0xd890ff, 34, 7, null, 0.4); DV.circle(ST.circleTex, v(0, 0.07, -6), 0xffd890, 26, 7, null, -0.6); AU.play('imu_seal', { vol: 1.1 }); AU.SFX.drone(4, 0.2); cut([0, 34, 12], [0, 0, -6], 56, 0); });
    line(t(58.4), 'Y', 'y_domi', 'ドミ・リバーシ。', '« Domi Reversi. »', 2.3, 0.2);
    T(t(58.8), () => banner('ドミ・リバーシ', 'DOMI REVERSI — LA RÉSURRECTION', '#d9a8ff'));
    T(t(59.6), () => { reform(Y(), 0, -6, 0, 0); K.HOLY.on = true; AU.trackVol(0.6, 0.5); cut([0, 0.5, -2.2], [0, 1.9, -6], 42, 0.04); move([0, 0.9, -3.4], [0, 1.6, -6], 34, 0, 1.6); });
    // « Inutile. » — puis elle les sépare
    T(t(61.4), () => { shot(rel(Y, 0.25, 1.62, 1.05, 0, 1.56, 0, 24, 0)); Y().eyeFlash = 1; tw(Y(), 'eyeFlash', 0.2, 1, 'out', 'dir'); });
    line(t(61.6), 'Y', 'y_muda', '無駄よ。', '« Inutile. »', 1.7, 0.2);
    T(t(63.2), () => {
      Y().to('castPalm', 0.2); Y().openL = true; Y().faceTo(v(0, 0, 4));
      for (const F of [A(), B()]) for (let i = 0; i < 5; i++) DV.tendril(v(rand(-9, 9), 0, -6 + rand(-9, 9)), ch(F).add(v(rand(-0.3, 0.3), rand(-0.4, 0.3), rand(-0.3, 0.3))), 0.08, 0.3, 2.2);
      AU.play('imu_dark', { vol: 1.1 }); [A(), B()].forEach(F => { F.to('hurt', 0.1); tw(F, 'y', 1.1, 0.5, 'out', 'world'); grunt(F, 0.7); }); cut([0, 1.6, 12], [0, 1.6, -4], 40, 0);
    });
    T(t(64.6), () => {
      B().go3(B().x, B().z, 1.0, 'in', 40); B().rx = 0.8; PW.blackHole(pos(A()).setY(0), 2.6, 2.5, 0.3); tw(A(), 'y', -3.2, 0.9, 'in', 'world');
      fly(Y(), 0, 40, -6, 1.3, 'divineDive', 'in'); Y().rx = -1.2; AU.SFX.whoosh(1.3, 0.5); AU.SFX.boom(1); cut([0.8, 0.3, -2.2], [0, 14, -6], 64, 0.12);
    });
    T(t(65.5), () => { white(1, 0.45); });
  }

  /* =========================================================================================== ACTE II — AU-DESSUS DES NUAGES (66 → 110) */
  {
    const O = 66, t = x => O + x;
    T(t(0), () => {
      resetAll(); ST.set('heaven', 'heaven'); A().show(false); K.AZD.on = false; K.FROST.on = true; K.FROST.F = B(); K.HOLY.on = true;
      place(B(), 0.5, 1, 0, 'tuck', 24); tw(B(), 'rx', Math.PI * 4, 1.2, 'inOut', 'world'); B().go3(0.5, 1, 1.2, 'in', 0);
      place(Y(), 0, -6, 0, 'hover', 22); Y().wing = 1; Y().wingA = 1; Y().haloA = 1;
      white(0, 1); AU.track('m_battle', { vol: 0.55, fade: 1 }); AU.wind(0.45, 1); K.caption('第二幕 ・ 天上  —  Acte II · Au-dessus des nuages divins');
      cut([34, 6, 44], [0, 8, -10], 50); move([18, 3, 24], [0, 3, 0], 44, 0, 2.5);
    });
    T(t(1.2), () => { twKill(B(), 'rx'); B().rx = 0; B().to('landing', 0.05); PW.iceAge(v(0.5, 0, 1), 3.6, 0.5, 0, 16); FX.ring(v(0.5, 0.05, 1), { col: 0x9ae8ff, size: 7, life: 0.5, flat: true }); AU.SFX.boom(1); K.CAM.shake += 0.12; K.impact(false); });
    T(t(2.6), () => { B().to('iceStance', 0.5); B().faceTo(v(0, 0, -6)); fly(Y(), 0, 3.2, -6, 3.4, 'hover', 'out'); cut([B().x + 0.9, 0.4, B().z + 3.6], [0, 8, -6], 48, 0.04); move([B().x + 0.7, 0.6, B().z + 3.2], [0, 4.2, -6], 40, 0, 3.2); });
    T(t(4.0), () => K.caption('', false));
    T(t(6.2), () => { B().to('iceStance', 0.2); FX.spark(B().tip.clone(), 40, [C.ice, C.W], 4); AU.SFX.draw(); shot(rel(B, -0.75, 1.3, 1.2, 0, 1.2, 0.5, 28, 0.05)); Y().faceTo(B()); });
    // Remi s'élance sur un pilier de glace
    T(t(7.1), () => { PW.iceAge(pos(B()), 2.2, 0.3, 0, 12); leap(B(), 0, -4.2, 3.6, 0.55, { y1: 2.8, pose: 'windHigh', land: 'cutDown', after: null }); AU.play('shatter', { vol: 0.6, rate: 1.3 }); cut([1.6, 0.3, -0.5], [0, 3.6, -5], 56, 0.12); });
    T(t(7.62), () => { clashS(B(), Y(), 2.2); Y().to('blockHigh', 0.05); cut([4.2, 3.1, -3.4], [0, 3.0, -5], 34, 0.05); });
    T(t(7.9), () => { tw(B(), 'y', 0, 0.45, 'in', 'world'); B().to('air', 0.1); later(0.45, () => { B().to('landing', 0.05); FX.dustBurst(pos(B()), 12, 3); }); fly(Y(), 0, 5, -7.5, 0.5, 'hover', 'out'); });
    // piqué de Sylina + échanges au sol
    T(t(8.8), () => { Y().to('divineDive', 0.08); Y().ghost = true; tw(Y(), 'x', B().x + 0.4, 0.4, 'in', 'world'); tw(Y(), 'z', B().z - 1.0, 0.4, 'in', 'world'); tw(Y(), 'y', 0, 0.4, 'in', 'world'); B().to('blockHigh', 0.1); AU.SFX.whoosh(1.2, 1.2); cut([B().x - 4, 6, B().z + 3], [B().x, 1.5, B().z - 1], 52, -0.15); });
    T(t(9.25), () => { Y().ghost = false; Y().to('cutDown', 0.05); clashS(Y(), B(), 2.6); DV.dome(ch(B()), 0xffd890, 5, 0.5); shot(rel(B, 2.4, 1.0, 1.4, 0, 1.4, -0.8, 34, 0.06)); });
    exch(t(9.7), B, Y, 'side', 1.5, rel(Y, -2.2, 1.4, 1.8, 0, 1.3, 0, 32, -0.06));
    exch(t(10.05), Y, B, 'high', 1.6, rel(B, 2.0, 0.8, 1.8, 0, 1.5, 0, 34, 0.08));
    exch(t(10.4), B, Y, 'thrust', 1.5);
    exch(t(10.75), Y, B, 'kick', 1.4, rel(Y, 0.3, 0.5, 2.6, 0, 1.2, 0, 40, 0.1));
    T(t(10.9), () => roll(B(), B().x + 2, B().z + 1.5, 0.45));
    exch(t(11.5), Y, B, 'spin', 1.7, rel(Y, -2.6, 1.2, 1.2, 0, 1.3, 0.6, 36, -0.08));
    exch(t(11.85), B, Y, 'spinK', 1.6);
    T(t(12.0), () => { Y().to('hurt', 0.06); Y().go3(Y().x - 1.4, Y().z - 1.4, 0.3, 'out'); });
    // chacun sur un îlot
    T(t(12.8), () => { const I = ST.isles[1]; leap(B(), I.position.x, I.position.z, 4.5, 1.15, { y1: I.position.y, flip: 1 }); const J = ST.isles[0]; fly(Y(), J.position.x, J.position.y, J.position.z, 1.1, 'hover', 'inOut'); cut([0, 6, 18], [0, 5, -8], 52, 0.02); move([-4, 9, 16], [0, 6, -9], 50, 0.04, 1.3); });
    T(t(14.2), () => { B().faceTo(Y()); Y().faceTo(B()); Y().to('guard', 0.2); B().to('windHigh', 0.15); shot(rel(B, -0.9, 1.8, -2.8, 0, 1.4, 9, 40, 0.03)); });
    T(t(14.5), () => { B().to('cutDown', 0.06); PW.partisan(ch(B()).add(v(0, 0.6, 0)), ch(Y()), 14, 3, 32, 0.05); AU.SFX.whoosh(1.2, 0.8); });
    T(t(14.75), () => { shot(rel(Y, 1.4, 1.2, 3.2, 0, 1.4, 0, 40, 0.05)); Y().to('cutSide', 0.06); const d = ch(B()).sub(ch(Y())).normalize(); TQ.wave(ch(Y()), d, 0xffe0a0, 2.2, 30, 0.7); later(0.18, () => { Y().to('cutDown', 0.06); TQ.wave(ch(Y()), d, 0xffe0a0, 2.2, 30, 0.7, true); }); AU.SFX.slash(1); });
    T(t(15.3), () => { for (let i = 0; i < 6; i++) FX.spark(ch(Y()).add(v(rand(-1.5, 1.5), rand(-0.5, 1.2), rand(0.5, 1.5))), 20, [C.ice, C.W], 6); AU.play('shatter', { vol: 0.6, rate: 1.5 }); });
    T(t(15.8), () => { const I = ST.isles[2]; blink(Y(), I.position.x, I.position.z, B(), I.position.y); cut([-6, 24, -6], [0, 8, -16], 56, 0.45); });
    T(t(16.8), () => {
      const I = ST.isles[1]; Y().to('divineDive', 0.08); Y().ghost = true; tw(Y(), 'x', I.position.x - 0.4, 0.55, 'in', 'world'); tw(Y(), 'z', I.position.z + 0.8, 0.55, 'in', 'world'); tw(Y(), 'y', I.position.y, 0.55, 'in', 'world');
      AU.SFX.whoosh(1.3, 0.8); cut([I.position.x - 2, I.position.y + 14, I.position.z + 4], [I.position.x, I.position.y, I.position.z], 56, 0.6); B().to('blockHigh', 0.1);
    });
    T(t(17.4), () => {
      Y().ghost = false; Y().to('cutDown', 0.05); clashS(Y(), B(), 3); K.split(ch(B()), 0.6, 0.8, 0xffd890, 18);
      B().to('hurt', 0.06); B().rx = 0; tw(B(), 'rx', -Math.PI * 2, 0.9, 'inOut', 'world'); B().go3(3.5, -2.5, 0.9, 'in', 0); grunt(B());
      cut([B().x - 3, B().y + 3, B().z + 6], [3, 2, -3], 50, 0.15);
    });
    T(t(18.35), () => { twKill(B(), 'rx'); B().rx = 0; B().to('crouch', 0.05); FX.dustBurst(pos(B()), 16, 4); AU.SFX.boom(0.8); K.CAM.shake += 0.08; later(0.3, () => B().to('iceStance', 0.2)); });
    // Pheasant Beak géant vs coupe verticale
    line(t(19.2), 'B', 'r_pheasant', '暴雉嘴（フェザントベック）！', '« Pheasant Beak ! »', 1.9, -0.3);
    T(t(19.4), () => { B().faceTo(Y()); B().to('windSide', 0.1); shot(rel(B, -2.2, 1.0, -3.8, 0, 3.5, 10, 50, 0.06)); });
    T(t(19.65), () => { B().to('cutSide', 0.06); TQ.beast('hawk', ch(B()).add(v(0, 1.5, 0)), ch(Y()), 0x9ae8ff, 16, 1.25, { flap: 5, arc: 2 }); AU.play('whoosh', { vol: 1.3, rate: 0.4 }); banner('暴雉嘴・極', 'PHEASANT BEAK — SUPRÊME', '#9aeaff'); });
    T(t(20.3), () => { shot(rel(Y, 0.5, 1.4, 6, 0, 1.7, 0, 52, 0)); Y().to('windHigh', 0.12); Y().flap = 1; });
    T(t(20.75), () => {
      Y().to('cutDown', 0.05); K.split([0.5, 0.5], Math.PI / 2, 0.8, 0xffd890, 26); TQ.clearAll(); TQ.wave(ch(Y()).add(v(0, 0.5, 0)), ch(B()).sub(ch(Y())), 0xffe6b0, 5, 36, 1, true); K.flash(0.8, 0xfff0d0); K.impact(true);
      for (let i = 0; i < 6; i++) FX.spark(ch(Y()).add(ch(B()).sub(ch(Y())).normalize().multiplyScalar(3)).add(v(rand(-3, 3), rand(-2, 2), rand(-1, 1))), 40, [C.ice, C.W], 10);
      AU.play('shatter', { vol: 1.1, rate: 0.8 }); AU.SFX.slash(1.4); K.sfxText('斬', [0.5, 0.35], 170, '#ffe6b0', 0);
    });
    // retour sur la plateforme : rafale
    T(t(21.8), () => { fly(Y(), 1.0, 0, -2.4, 0.7, 'divineDive', 'in'); B().faceTo(v(1, 0, -2.4)); });
    T(t(22.5), () => { Y().to('landing', 0.05); FX.dustBurst(pos(Y()), 14, 4); K.foc([B(), Y()]); K.camAuto(1.0, 0.35, 1.3); });
    T(t(22.6), () => dash(B(), Y().x + 0.9, Y().z + 0.6, 0.2));
    [[22.9, B, Y, 'side'], [23.2, Y, B, 'high'], [23.5, B, Y, 'spinK'], [23.8, Y, B, 'thrust'], [24.1, B, Y, 'high'], [24.4, Y, B, 'knee']].forEach(([tt, a, d, k], i) => {
      exch(t(tt), a, d, k, 1.3 + (i % 3) * 0.2, i % 2 ? rel(d, 2.2 * (i % 4 ? 1 : -1), 1.0 + i * 0.1, 2.2, 0, 1.3, 0, 32, 0.07 * (i % 2 ? 1 : -1)) : null);
      if (a === B) T(t(tt + 0.1), () => PW.iceAge(pos(B()), 1.6, 0.25, 0, 8));
    });
    // Ice Time : les ailes gelées
    T(t(25.2), () => { blink(B(), Y().x - Math.sin(Y().yaw) * 0.8, Y().z - Math.cos(Y().yaw) * 0.8, Y()); B().to('castPalm', 0.08); B().openL = true; shot(rel(Y, -1.0, 1.3, -1.8, 0, 1.4, 0, 30, -0.05)); });
    line(t(25.3), 'B', 'r_icetime', 'アイス・タイム。', '« Ice Time. »', 1.7, -0.3);
    T(t(25.7), () => { K.ICE3 = PW.iceTime(ch(Y()).add(v(-Math.sin(Y().yaw) * 0.35, -0.6, -Math.cos(Y().yaw) * 0.35)), 1.1, 1.6, 0.25); tw(Y(), 'wing', 0.35, 0.3, 'out', 'dir'); Y().to('kneel', 0.3); grunt(Y(), 0.8); AU.play('shatter', { vol: 0.8 }); K.flash(0.3, 0xcff4ff); });
    // la mer de nuages gèle
    line(t(26.8), 'B', 'r_iceage', 'アイス・エイジ。', '« Ice Age. »', 1.8, -0.3);
    T(t(27.0), () => { B().openL = false; B().to('slamDown', 0.15); shot(rel(B, 1.2, 0.5, 1.6, 0, 0.8, 1, 36, 0.06)); });
    T(t(27.4), () => {
      PW.iceAge(v(0, 0, 0), 9, 1.1, 0, 70); tw(ST.heavenSea.uIceR, 'value', 1400, 5.5, 'in', 'dir'); ST.blend('heavenIce', 4); ST.heavenClouds.setCols(0xeaf8ff, 0x8aaed0);
      banner('氷河時代', 'ICE AGE — LA MER DE NUAGES GELÉE', '#9aeaff'); AU.play('shatter', { vol: 1, rate: 0.5 }); AU.SFX.rumble(1, 5); K.CAM.shake += 0.1;
      cut([60, 14, 70], [0, -16, 0], 50, 0.03); move([75, 26, 95], [0, -18, -30], 54, 0.02, 5);
    });
    T(t(32.6), () => { cut([B().x + 2.4, 1.3, B().z + 3], [Y().x, 1, Y().z], 34, 0.03); walkTo(B(), Y().x + Math.sin(Y().yaw) * 1.3, Y().z + Math.cos(Y().yaw) * 1.3, 1.4); });
    T(t(34.0), () => { B().faceTo(Y()); B().to('guard', 0.15); });
    T(t(34.2), () => { B().to('thrust', 0.1); shot(rel(Y, 0.4, 1.2, 1.3, 0, 1.4, 0, 26, 0)); });
    T(t(34.4), () => {
      PW.shatter(K.ICE3, 7); Y().to('guard', 0.08); tw(Y(), 'wing', 1, 0.25, 'out', 'dir'); Y().flap = 1; K.flash(0.6, 0x9a40ff); DV.dome(ch(Y()), 0xa040ff, 7, 0.6); AU.play('imu_dark', { vol: 1.1 });
      for (let i = 0; i < 6; i++) DV.tendril(v(Y().x + rand(-2, 2), 0, Y().z + rand(-2, 2)), ch(B()).add(v(rand(-0.3, 0.3), rand(-0.5, 0.3), 0)), 0.08, 0.25, 0.7); knock(B(), pos(Y()), 3.2, 0.6);
    });
    line(t(34.8), 'Y', 'sylina_2', '闇よ、喰らえ。', '« Ténèbres… dévorez-le. »', 2.9, 0.2);
    // la lance noire
    T(t(36.4), () => { Y().to('castPalm', 0.15); Y().openL = true; Y().faceTo(B()); shot(rel(Y, -1.2, 1.7, -2.4, 0, 1.6, 6, 40, 0.04)); });
    T(t(36.6), () => { K.WALL2 = PW.iceTime(pos(B()).add(pos(Y()).sub(pos(B())).setY(0).normalize().multiplyScalar(1.0)), 1.6, 3, 0.25); B().to('blockHigh', 0.1); });
    T(t(36.9), () => { PW.bigSpear(v(Y().x - 7, 15, Y().z - 7), ch(B()), 0xffe0a0, 9, 55); banner('黒き聖槍', 'LA LANCE SACRÉE NOIRE', '#d9a8ff'); AU.play('whoosh', { vol: 1.3, rate: 0.4 }); cut([B().x + 3, 1.0, B().z + 4], [B().x, 3, B().z - 2], 50, 0.05); });
    T(t(37.27), () => {
      PW.shatter(K.WALL2, 10); K.flash(1, 0xffe8ff); K.impact(true); K.shock(ch(B()), 0.8, 1.6); AU.SFX.boom(1.5); AU.play('impact_big', { vol: 1 }); grunt(B(), 1);
      const d = pos(B()).sub(pos(Y())).setY(0).normalize(); B().to('hurt', 0.05); B().go3(B().x + d.x * 18, B().z + d.z * 18, 1.6, 'out', 6); later(1.6, () => B().go3(B().x + d.x * 4, B().z + d.z * 4, 1.5, 'in', -26)); tw(B(), 'rx', -1.3, 2.5, 'inOut', 'world');
    });
    T(t(37.9), () => { cut([Y().x + 2, 3, Y().z + 2], [B().x, B().y, B().z], 42, 0.1); });
    T(t(39.0), () => { cut([B().x, B().y + 9, B().z + 1.5], [B().x + 2, -26, B().z + 3], 66, 0.5); });
    T(t(40.6), () => { const p = pos(B()); DV.dome(p.clone().setY(-25.5), 0x9ae8ff, 10, 0.8); FX.spark(p.clone().setY(-25.4), 80, [C.ice, C.W], 10); FX.ring(p.clone().setY(-25.4), { col: 0x9ae8ff, size: 12, life: 0.6, flat: true }); AU.SFX.boom(1.4); AU.play('shatter', { vol: 1 }); B().rx = -1.45; B().set('lie'); B().y = -26.6;
      cut([p.x + 9, -18, p.z + 11], [p.x, -26, p.z], 46, 0.05); });
    T(t(42.0), () => { fly(Y(), Y().x, 6, Y().z, 1.2, 'hover', 'out'); });
    T(t(42.6), () => { const p = pos(B()); cut([p.x + 0.5, -25.6, p.z + 0.6], [Y().x, Y().y + 1.5, Y().z], 52, 0.1); });
    T(t(43.2), () => { DV.circle(ST.circleTex, v(Y().x, Y().y + 1.2, Y().z - 2), 0xa040ff, 7, 2.5, v(0, 0, 1), 1.4); Y().to('divineDive', 0.2); tw(Y(), 'z', Y().z - 3, 0.6, 'in', 'world'); AU.play('imu_dark', { vol: 0.9 }); });
    T(t(43.5), () => { fade(1, 0.4); });
  }

  /* =========================================================================================== ACTE III — TRÔNE VIDE, LUNE ROUGE (110 → 170) */
  {
    const O = 110, t = x => O + x;
    const sitY = F => 3.47 - F.rest.hips.y + 0.45 * F.k;
    T(t(0), () => {
      resetAll(); ST.set('void', 'voidRed'); ST.imu.material.opacity = 0; ST.redMoon.material.opacity = 0; tw(ST.redMoon.material, 'opacity', 1, 4, 'inOut', 'dir'); ST.eyeU.uOpen.value = 0; ST.eyeU.uA.value = 1;
      B().show(false); A().show(true); K.FROST.on = false; K.HOLY.on = false; K.AZD.on = true; K.AZD.F = A(); A().arm = 0; K.aura(A(), 0.4, 0.1);
      place(A(), 0, 2, Math.PI, 'airFist', 7); A().go3(0, 2, 0.9, 'in', 0);
      place(Y(), 0, -23.42, 0, 'sit', sitY(Y())); Y().wing = 0; Y().wingA = 1; Y().haloA = 1;
      fade(0, 1.2); AU.track('m_dark', { vol: 0.6, fade: 1.2 }); K.caption('第三幕 ・ 虚の玉座  —  Acte III · Le trône vide sous la lune rouge');
      cut([0, 9, 13], [0, 2, -8], 50); move([0, 5, 10], [0, 4, -16], 46, 0, 5);
    });
    T(t(0.9), () => { A().to('landing', 0.05); FX.dustBurst(pos(A()), 20, 4, new THREE.Color(0x200810)); AU.SFX.boom(0.9); K.CAM.shake += 0.1; DV.breakTiles(ST, v(0, 0, 2), 1.3, 3); });
    T(t(2.2), () => { A().to('fistGuard', 0.5); A().faceTo(v(0, 0, -24)); });
    T(t(3.2), () => { tw(ST.eyeU.uOpen, 'value', 1, 3, 'inOut', 'dir'); AU.SFX.drone(5, 0.2); cut([2.5, 0.4, 1], [0, 24, -60], 56, 0.05); move([2, 0.6, 1.5], [0, 20, -60], 52, 0.03, 3); });
    T(t(4.2), () => K.caption('', false));
    T(t(6.4), () => { cut([1.2, 3.75, -20.4], [0, 3.95, -24], 30, 0.03); move([0.9, 3.8, -21.2], [0, 4.0, -24], 26, 0.02, 2.4); Y().eyeFlash = 1; tw(Y(), 'eyeFlash', 0, 1.2, 'out', 'dir'); });
    T(t(7.4), () => { card('nY', true); });
    line(t(7.6), 'Y', 's_hiza', '跪きなさい。', '« À genoux. »', 2, 0.2);
    T(t(8.6), () => { card('nY', false); DV.circle(ST.circleTex, v(0, 0.03, 2), 0xff3050, 9, 4); A().to('crouch', 0.25); K.sfxText('ズンッ', [0.5, 0.3], 130, '#ff8090'); AU.play('imu_seal', { vol: 1.1 }); AU.SFX.boom(1); K.CAM.shake += 0.12; DV.breakTiles(ST, v(0, 0, 2), 2.4, 1.5); cut([0, 9, 2.4], [0, 0, 2], 44, 0.4); });
    T(t(9.6), () => { A().to('groundPalm', 0.3); grunt(A()); cut([0.6, 0.6, 0.6], [0, 1, 2], 30, 0.06); });
    line(t(10.6), 'A', 'a_mada', 'まだだ…！', '« Pas encore… ! »', 1.8);
    T(t(11.6), () => { A().to('fistGuard', 0.2); K.aura(A(), 1.8, 0.2); A().arm = 1; K.flash(0.5, 0x9ab8ff); DV.dome(ch(A()), 0x6f9bff, 8, 0.8); AU.play('haki_conqueror', { vol: 0.9 }); K.impact(false); K.CAM.shake += 0.1; });
    T(t(12.0), () => { runTo(A(), 0, -14.6, 1.5, 3.4); K.camTrack(A(), [-2.2, 1.0, 0.8], [0, 1.2, 2.2], 38, 6, true); });
    T(t(12.6), () => { blink(Y(), 0, -16, A()); Y().set('guard'); Y().wing = 0.6; });
    T(t(13.5), () => { K.foc([A(), Y()]); });
    // corps à corps : poings contre sabre
    const duel = [[13.6, A, Y, 'jab'], [13.9, Y, A, 'side'], [14.2, A, Y, 'hook'], [14.5, Y, A, 'high'], [14.8, A, Y, 'knee'], [15.1, Y, A, 'thrust'], [15.4, A, Y, 'upper']];
    duel.forEach(([tt, a, d, k], i) => exch(t(tt), a, d, k, 1.3 + (i % 3) * 0.25, i % 2 ? rel(d, 2.0 * (i % 4 ? 1 : -1), 1.1 + i * 0.08, 2.0, 0, 1.35, 0, 32, 0.07) : rel(a, -1.8, 1.2, -1.4, 0, 1.4, 2.5, 34, -0.06)));
    T(t(15.55), () => { leap(Y(), Y().x, Y().z - 3, 1.8, 0.55, { flip: -1, look: false, pose: 'tuck' }); });
    T(t(16.3), () => { Y().faceTo(A()); Y().to('cutSide', 0.05); TQ.wave(ch(Y()), ch(A()).sub(ch(Y())).setY(0), 0xd890ff, 2.8, 28, 0.9); AU.SFX.slash(1); });
    T(t(16.4), () => { leap(A(), A().x, A().z - 2.6, 2.8, 0.75, { flip: 1, pose: 'airFist', land: 'groundPalm' }); K.camTrack(A(), [-2.6, 0.5, 0.8], [0, 1.6, 0], 50, 8, true); });
    T(t(17.25), () => { DV.breakTiles(ST, pos(A()), 2, 4); hit(A(), Y(), 1.8); knock(Y(), pos(A()), 2.5); AU.play('gura_crack', { vol: 0.7, rate: 1.2 }); K.crackFX([0.5, 0.6], 0.4, 0.8); });
    const duel2 = [[18.0, Y, A, 'side'], [18.3, A, Y, 'hook'], [18.6, Y, A, 'spin'], [18.9, A, Y, 'spinK'], [19.2, Y, A, 'high'], [19.5, A, Y, 'jab']];
    T(t(17.8), () => dash(Y(), A().x, A().z - 1.0, 0.18));
    duel2.forEach(([tt, a, d, k], i) => exch(t(tt), a, d, k, 1.4 + (i % 2) * 0.3, rel(i % 2 ? a : d, 2.2 * (i % 3 ? -1 : 1), 0.9 + i * 0.12, 2.3, 0, 1.3, 0, 34, 0.08 * (i % 2 ? 1 : -1))));
    exch(t(19.9), Y, A, 'kick', 2);
    T(t(20.05), () => { knock(A(), pos(Y()), 5.5, 0.3, 0.6); A().drag = true; cut([3.5, 1.2, A().z + 2], [A().x, 1.0, A().z + 4], 40, 0.05); });
    // Genkotsu Meteor
    T(t(21.0), () => { A().to('throwRock', 0.25); FX.rock(pos(A()), 18, 0, true); DV.breakTiles(ST, pos(A()).add(v(0, 0, 1.5)), 3, 6); AU.SFX.rumble(0.8, 3); shot(rel(A, 0.8, 0.4, 2.4, 0, 2.2, 0, 44, 0.05)); });
    line(t(21.3), 'A', 'a_genkotsu', '拳骨…流星群！', '« Poing… pluie de météores ! »', 2.4);
    for (let i = 0; i < 6; i++) T(t(22.8 + i * 0.42), () => {
      A().to(i % 2 ? 'throwDone' : 'throwRock', 0.08); const from = hand(A(), i % 2 ? 'left' : 'right').add(v(0, 0.6, 0)), y = Y(), last = i === 5;
      const to = last ? ch(y) : ch(y).add(v(Math.sin(y.yaw) * 1.6, rand(-0.3, 0.6), Math.cos(y.yaw) * 1.6));
      PW.meteor(from, to, rand(0.45, 0.7), 0.45, last ? () => { hit(A(), Y(), 3, ch(Y())); knock(Y(), pos(A()), 4.5, 0.8, 0.5); } : () => { Y().to(i % 2 ? 'cutSide' : 'cutDown', 0.05); AU.SFX.slash(1); });
      if (!last) later(0.3, () => Y().to(i % 2 ? 'windHigh' : 'windSide', 0.08)); AU.SFX.whoosh(1.1, 0.7);
      if (i === 0) banner('拳骨流星群', 'GENKOTSU METEOR — LA PLUIE DE POINGS', '#8fb4ff');
      if (i === 1) shot(rel(Y, 1.8, 1.0, 4.5, 0, 1.6, 0, 44, 0.04)); if (i === 3) cut([10, 3, -6], [0, 1.8, -10], 46, 0.03); if (i === 5) shot(rel(A, -1.2, 1.6, -2.6, 0, 1.3, 7, 40, 0));
    });
    // ténèbres d'Imu : poursuite
    T(t(26.4), () => { Y().to('guard', 0.3); Y().eyeFlash = 1; tw(Y(), 'eyeFlash', 0, 1, 'out', 'dir'); tw(ST.eyeU.uOpen, 'value', 1.15, 0.4, 'out', 'dir'); shot(rel(Y, 0.5, 1.0, 1.8, 0, 1.6, 0, 30, 0.05)); });
    line(t(26.7), 'Y', 'sylina_2', '闇よ、喰らえ。', '« Ténèbres… dévorez-le. »', 2.9, 0.2);
    T(t(27.4), () => { Y().to('castPalm', 0.15); Y().openL = true; DV.spikeLine(pos(Y()), pos(A()), 14, 2.6); AU.play('imu_dark', { vol: 1, rate: 1.3 }); runTo(A(), A().x + 5, A().z - 1, 1.0, 3.6); K.camTrack(A(), [0.4, 1.2, -3.0], [0, 1, 2], 40, 6, true); });
    T(t(28.4), () => { DV.spikeLine(pos(Y()), pos(A()), 12, 2.8); runTo(A(), A().x - 3, A().z - 5, 0.9, 3.6); for (let i = 0; i < 3; i++) DV.tendril(v(A().x + rand(-2, 2), 0, A().z + rand(-2, 2)), ch(A()), 0.08, 0.35, 0.5); });
    T(t(29.3), () => { leap(A(), A().x - 3.5, A().z + 1, 2.4, 0.6, { flip: 1, pose: 'airFist' }); DV.spikeLine(pos(Y()), pos(A()), 10, 3); cut([A().x - 6, 0.5, A().z + 5], [A().x - 2, 2.4, A().z], 48, 0.1); });
    T(t(30.2), () => { for (let i = 0; i < 7; i++) later(i * 0.06, () => DV.tendril(v(A().x + rand(-3, 3), 0, A().z + rand(-3, 3)), ch(A()).add(v(rand(-0.3, 0.3), rand(-0.4, 0.3), rand(-0.2, 0.2))), 0.08, 0.3, 4)); A().to('hurt', 0.1); tw(A(), 'y', 1.4, 0.8, 'out', 'world'); grunt(A()); });
    // Flamme mère
    T(t(30.9), () => { cut([0, 0.4, 6], [0, 18, -60], 56, 0.04); tw(ST.eyeU.uOpen, 'value', 1.3, 2, 'inOut', 'dir'); });
    line(t(31.0), 'Y', 'y_haha', '母なる炎よ…焼き尽くせ。', '« Flamme mère… consume tout. »', 4.9, 0.2);
    T(t(32.6), () => { shot(rel(Y, 0.3, 1.6, 1.4, 0, 1.55, 0, 26, 0)); });
    T(t(34.4), () => { DV.circle(ST.circleTex, pos(A()).setY(0.04), 0xff3040, 8, 3); AU.SFX.rumble(1, 3); cut([A().x + 10, 1, A().z + 10], [A().x, 6, A().z], 56, 0.06); });
    T(t(35.6), () => {
      DV.pillar(pos(A()).setY(0), 0xff3040, 3.4, 90, 2.2); K.flash(0.6, 0xffa0a0); K.impact(true); K.shock(ch(A()), 1, 2); AU.play('goro_bolt', { vol: 1.2, rate: 0.6 }); AU.play('impact_big', { vol: 1.2 }); AU.SFX.boom(1.6); K.CAM.shake += 0.3;
      banner('母なる炎', 'MOTHER FLAME — LA FLAMME MÈRE', '#ff8090'); DV.breakTiles(ST, pos(A()), 4, 6); DV.dome(pos(A()), 0xff3040, 16, 1.2);
    });
    line(t(36.4), 'A', 'a_blackhole', 'ブラックホール！', '« Black Hole ! »', 1.5);
    T(t(36.5), () => { A().to('darkPalms', 0.1); PW.blackHole(pos(A()).setY(0), 5.5, 3.4, 0.3); K.flash(0.3, 0x6020a0); cut([A().x + 4, 1.4, A().z + 4.5], [A().x, 1.6, A().z], 36, 0.05); AU.play('imu_dark', { vol: 1.2, rate: 0.5 }); });
    T(t(37.4), () => { tw(A(), 'y', 0, 0.4, 'in', 'world'); A().to('fistGuard', 0.2); DV.tendrils.forEach(tt => (tt.t = Math.max(tt.t, tt.dur + tt.hold))); });
    line(t(38.4), 'A', 'a_liberation', '解放（リベレイション）！', '« Libération ! »', 1.4);
    T(t(38.5), () => { A().faceTo(Y()); A().to('darkPalms', 0.1); shot(rel(A, 1.0, 1.3, -2.4, 0, 1.4, 6, 38, 0.03)); });
    T(t(38.8), () => { const p = ch(A()).add(v(Math.sin(A().yaw), 0, Math.cos(A().yaw)).multiplyScalar(0.7)); PW.beam(p, ch(Y()), 0xff3040, 1.1, 1.1); PW.liberation(p, ch(Y()).sub(p), 50, 30); AU.SFX.boom(1.4); AU.play('impact_big', { vol: 1 }); K.flash(0.8, 0xff8080); cut([12, 2, A().z - 6], [0, 1.4, (A().z + Y().z) / 2], 50, 0.04); });
    T(t(39.2), () => { hit(A(), Y(), 3, ch(Y())); K.impact(true); DV.dome(ch(Y()), 0xff3040, 10, 0.9); const d = pos(Y()).sub(pos(A())).setY(0).normalize(); Y().to('hurt', 0.05); Y().go3(Y().x + d.x * 6, Y().z + d.z * 6, 0.7, 'out', 1.4); grunt(Y(), 1); Y().wing = 0.2; });
    T(t(39.9), () => { tw(Y(), 'y', -0.62, 0.25, 'in', 'world'); tw(Y(), 'rx', -1.45, 0.25, 'in', 'world'); Y().to('lie', 0.2); DV.breakTiles(ST, pos(Y()), 2.5, 5); FX.dustBurst(pos(Y()), 20, 4, new THREE.Color(0x200810)); AU.SFX.boom(1); cut([Y().x + 3.5, 1.8, Y().z + 4], [Y().x, 0.3, Y().z], 40, 0.05); });
    T(t(41.4), () => { walkTo(A(), Y().x + 0.4, Y().z + 3, 2.4); K.camTrack(A(), [0.6, 1.4, 2.6], [0, 1.3, 0], 34, 3, true); });
    // les vingt épées du trône
    T(t(43.6), () => { A().faceTo(Y()); A().to('galaxyWind', 0.3); A().arm = 1; K.aura(A(), 2, 0.3); AU.play('gura_charge', { vol: 1 }); });
    T(t(44.0), () => { Y().eyeFlash = 1; tw(Y(), 'eyeFlash', 0, 1, 'out', 'dir'); K.SW = PW.swords(v(0, 0, -24), 20, 6.5, 8); AU.play('imu_dark', { vol: 1, rate: 0.8 }); K.sfxText('ゴゴゴ', [0.7, 0.3], 100, '#ffd890'); cut([0, 1.4, -13], [0, 7, -24], 48, 0.03); move([0, 2.2, -11], [0, 8, -24], 50, 0, 1.4); });
    T(t(44.8), () => banner('二十の王剣', 'LES VINGT ÉPÉES DES ROIS', '#ffd890'));
    T(t(45.6), () => {
      tw(Y(), 'rx', 0, 0.5, 'inOut', 'world'); tw(Y(), 'y', 0, 0.5, 'inOut', 'world'); Y().to('castPalm', 0.4); Y().openL = true;
      PW.fireSwords(K.SW, s => { const i = K.SW.list.indexOf(s); const a = A(); return i < 19 ? v(a.x + Math.cos(i * 2.4) * rand(0.9, 1.6), rand(0, 0.4), a.z + Math.sin(i * 2.4) * rand(0.9, 1.6)) : ch(a); }, 0.11);
      runTo(A(), A().x + 4, A().z + 1, 0.8, 3.6); K.camTrack(A(), [-2.6, 1.3, 0.6], [0, 1.2, 1.5], 42, 6, true);
    });
    T(t(46.4), () => { roll(A(), A().x - 1, A().z + 3, 0.5); });
    T(t(47.0), () => { leap(A(), A().x - 3, A().z + 1, 2.2, 0.6, { flip: 1, pose: 'airFist' }); cut([A().x + 1, 0.3, A().z + 3], [A().x - 2, 2.5, A().z], 56, 0.18); });
    T(t(47.8), () => { runTo(A(), A().x + 2, A().z - 3, 0.6, 3.6); });
    T(t(48.1), () => { cut([A().x + 6, 7, A().z + 6], [A().x, 0.5, A().z], 46, 0.1); });
    T(t(48.65), () => { hit(Y(), A(), 2.6, ch(A())); A().to('hurt', 0.05); grunt(A(), 1); K.flash(0.6, 0xffe0a0); });
    T(t(49.2), () => { A().to('kneel', 0.3); A().arm = 0; K.aura(A(), 0.5, 0.5); cut([A().x + 2.2, 0.8, A().z + 2.6], [A().x, 0.9, A().z], 34, 0.04); move([A().x + 1.8, 0.9, A().z + 2.1], [A().x, 1.0, A().z], 30, 0.02, 2); });
    T(t(50.8), () => { Y().openL = false; walkTo(Y(), A().x + 0.4, A().z - 1.6, 2.2); });
    // Remi traverse le domaine sur une rampe de glace
    T(t(53.2), () => { Y().faceTo(A()); Y().to('windHigh', 0.4); shot(rel(A, 0.6, 0.3, 1.4, 0, 2.2, 0, 44, 0.06)); });
    T(t(53.9), () => {
      B().show(true); K.FROST.on = true; K.FROST.F = B(); const a = pos(A());
      PW.iceRamp([v(a.x - 14, 18, a.z + 10), v(a.x - 8, 8, a.z + 6), v(a.x - 3, 1.5, a.z + 2), v(a.x - 1.1, 0.1, a.z + 0.5)], 0.35, 2);
      place(B(), a.x - 14, a.z + 10, 1.4, 'slideBrake', 18); tw(B(), 'x', a.x - 1.1, 0.75, 'in', 'world'); tw(B(), 'z', a.z + 0.5, 0.75, 'in', 'world'); tw(B(), 'y', 0, 0.75, 'in', 'world');
      AU.play('shatter', { vol: 0.8, rate: 1.4 }); AU.SFX.whoosh(1.2, 0.8); cut([a.x + 4, 1.2, a.z + 6], [a.x - 4, 5, a.z + 3], 46, 0.06);
    });
    T(t(54.7), () => { B().faceTo(Y()); B().to('blockHigh', 0.05); Y().to('cutDown', 0.05); clashS(Y(), B(), 2.4); PW.iceTime(pos(A()), 1.4, 2.2, 0.25); later(0.6, () => (K.SW.list.forEach(s => { if (s.state === 'stuck') s.st = 1.4; }))); cut([A().x + 5.5, 2.4, A().z + 6], [A().x - 0.4, 1.2, A().z], 40, 0.05); });
    T(t(55.3), () => { PW.iceAge(pos(B()), 7, 0.6, 0, 30); knock(Y(), pos(B()), 3, 0.5); });
    line(t(56.2), 'Y', 'y_ochinasai', '落ちなさい。', '« Tombez. »', 1.8, 0.2);
    T(t(56.4), () => { Y().to('castPalm', 0.2); Y().openL = true; PW.blackHole(v((A().x + B().x) / 2, 0, (A().z + B().z) / 2), 5, 3, 0.5); DV.circle(ST.circleTex, v((A().x + B().x) / 2, 0.05, (A().z + B().z) / 2), 0xa040ff, 12, 3); AU.play('imu_seal', { vol: 1 }); cut([0, 12, A().z + 8], [A().x, 0, A().z], 52, 0.1); });
    T(t(57.6), () => { [A(), B()].forEach(F => { F.to('air', 0.2); tw(F, 'y', -6, 1.2, 'in', 'world'); }); AU.SFX.whoosh(1.3, 0.4); });
    T(t(59.4), () => fade(1, 0.8));
  }

  /* =========================================================================================== ACTE IV — SOLEIL NOIR, OCÉAN GELÉ (172 → 240) */
  {
    const O = 172, t = x => O + x;
    T(t(0), () => {
      resetAll(); ST.set('cliff', 'eclipse'); ST.rainMesh.visible = false; ST.eclipse.visible = true; ST.wall.visible = false; ST.oceanU.uAmp.value = 1.6; ST.oceanU.uIceR.value = 0; ST.eclEyeU.uA.value = 0; ST.eclEyeU.uOpen.value = 0;
      [A(), B(), Y()].forEach(F => F.show(true)); A().arm = 0; K.AZD.on = true; K.FROST.on = true; K.HOLY.on = true;
      place(A(), -1.6, 3.2, Math.PI, 'fistGuard'); place(B(), 1.6, 3.6, Math.PI, 'iceStance'); place(Y(), 0, -9, 0, 'hover', 7); Y().wing = 1; Y().haloA = 1; Y().wingA = 1;
      fade(0, 1.5); AU.track('m_climax', { vol: 0.55, off: 4, fade: 1.2 }); AU.wind(0.6, 1); K.caption('第四幕 ・ 黒い太陽  —  Acte IV · Sous le soleil noir');
      cut([34, -8, 44], [0, 10, -30], 50); move([18, 2, 26], [0, 5, -14], 46, 0, 4);
    });
    T(t(4.0), () => { K.caption('', false); B().faceTo(Y()); A().faceTo(Y()); shot(rel(B, -0.5, 1.5, 1.6, 0, 1.5, 0, 30, 0.03)); });
    line(t(4.3), 'B', 'r_iceage', 'アイス・エイジ。', '« Ice Age. »', 1.8, -0.3);
    T(t(4.8), () => {
      B().to('slamDown', 0.15); PW.iceAge(pos(B()), 16, 1.3, 0, 90); tw(ST.oceanU.uIceR, 'value', 900, 6, 'in', 'dir'); tw(ST.oceanU.uAmp, 'value', 0.7, 4, 'inOut', 'dir');
      banner('氷河時代・大海', 'ICE AGE — L\'OCÉAN ENTIER GELÉ', '#9aeaff'); AU.play('shatter', { vol: 1, rate: 0.5 }); AU.SFX.rumble(1, 6); K.CAM.shake += 0.1;
      cut([70, -4, 70], [0, -14, -40], 52, 0.03); move([80, 6, 90], [0, -14, -60], 54, 0.02, 5);
    });
    T(t(10.2), () => { fly(Y(), 0, 0, -5.5, 1.6, 'hover', 'inOut'); cut([0, 1.0, 6], [0, 2.5, -6], 40, 0); move([0, 1.2, 4.5], [0, 1.6, -6], 36, 0, 1.6); });
    T(t(11.9), () => { Y().to('guard', 0.2); K.foc([A(), Y(), B()]); K.camAuto(1, 0.3, 1.4); });
    // combat à deux contre une
    T(t(12.4), () => { runTo(A(), -0.9, -4.6, 0.9, 3.4); runTo(B(), 0.9, -4.4, 0.95, 3.4); });
    [[13.4, A, Y, 'hook'], [13.7, B, Y, 'side'], [14.0, A, Y, 'upper'], [14.3, Y, B, 'high'], [14.6, A, Y, 'spinK'], [14.9, Y, A, 'side'], [15.2, B, Y, 'thrust']].forEach(([tt, a, d, k], i) =>
      exch(t(tt), a, d, k, 1.4 + (i % 3) * 0.2, i % 2 ? rel(d, 2.2 * (i % 4 ? 1 : -1), 1.0 + i * 0.1, 2.2, 0, 1.3, 0, 32, 0.07) : rel(a, -1.6, 1.3, -1.4, 0, 1.4, 2.4, 34, -0.06)));
    exch(t(15.6), Y, A, 'spinK', 2);
    T(t(15.75), () => { knock(A(), pos(Y()), 3); knock(B(), pos(Y()), 3); K.camAuto(1.2, -0.3, 1.4); });
    line(t(16.6), 'A', 'a_kurouzu', '闇水（くろうず）！', '« Kurouzu ! »', 1.5);
    T(t(16.7), () => { A().faceTo(Y()); A().to('darkPalms', 0.1); PW.darkStream(() => ch(Y()), () => hand(A(), 'left'), 0.9); shot(rel(Y, 1.6, 1.0, -2.4, 0, 1.3, 4, 40, 0.05)); });
    T(t(17.0), () => { const a = pos(A()), d = pos(Y()).sub(a).setY(0).normalize(); Y().to('hurt', 0.08); Y().go3(a.x + d.x * 1.6, a.z + d.z * 1.6, 0.6, 'in'); B().faceTo(v(a.x + d.x * 1.6, 0, a.z + d.z * 1.6)); B().to('windHigh', 0.1); });
    T(t(17.4), () => { B().to('cutDown', 0.06); PW.partisan(ch(B()).add(v(0, 0.6, 0)), ch(Y()), 10, 2, 34, 0.04); });
    T(t(17.7), () => { Y().to('wingSpread', 0.05); tw(Y(), 'wing', 0.15, 0.12, 'out', 'dir'); for (let i = 0; i < 8; i++) later(i * 0.05, () => FX.spark(ch(Y()).add(v(rand(-0.6, 0.6), rand(-0.4, 0.8), rand(-0.6, 0.6))), 20, [C.ice, C.holy, C.W], 6)); AU.play('shatter', { vol: 0.7, rate: 1.4 }); shot(rel(Y, -2.0, 1.2, 2.4, 0, 1.4, 0, 34, -0.05)); });
    T(t(18.4), () => { tw(Y(), 'wing', 1, 0.2, 'out', 'dir'); fly(Y(), Y().x - 1, 5.5, Y().z - 2.5, 0.5, 'hover', 'out'); K.flash(0.4, 0xffe0a0); DV.dome(ch(Y()), 0xffd890, 6, 0.5); });
    T(t(19.0), () => { Y().to('divineDive', 0.08); Y().ghost = true; tw(Y(), 'x', B().x - 0.6, 0.45, 'in', 'world'); tw(Y(), 'z', B().z + 0.8, 0.45, 'in', 'world'); tw(Y(), 'y', 0, 0.45, 'in', 'world'); B().to('blockHigh', 0.1); cut([B().x - 5, 7, B().z + 6], [B().x, 1, B().z], 52, -0.2); });
    T(t(19.45), () => { Y().ghost = false; Y().to('cutDown', 0.05); clashS(Y(), B(), 2.4); PW.iceAge(pos(B()), 2.4, 0.3, 0, 10); K.SCR.speed = 0.6; });
    // Remi patine sur la glace
    T(t(19.9), () => { const p = pos(B()); B().faceTo(v(p.x + 6, 0, p.z - 3)); B().to('slideBrake', 0.1); B().go3(p.x + 6, p.z - 3, 0.8, 'out'); PW.iceRamp([p.clone().setY(0.05), p.clone().add(v(3, 0.05, -1.5)), p.clone().add(v(6, 0.05, -3))], 0.5, 1.5, 0.18); K.camTrack(B(), [-1.5, 0.8, 2.2], [0, 1, -1], 40, 6, true); });
    T(t(20.8), () => { leap(A(), Y().x, Y().z + 0.4, 6.5, 1.1, { pose: 'airFist', land: 'groundPalm' }); A().arm = 1; });
    T(t(21.3), () => { cut([Y().x + 1, 0.4, Y().z + 2.2], [Y().x, 6.5, Y().z], 64, 0.3); Y().to('blockHigh', 0.1); });
    T(t(22.0), () => { hit(A(), Y(), 2.6, hand(A())); K.crackFX([0.5, 0.5], 0.6, 1); W.crackAt(Y().x, Y().z); for (const a of [0, 2, 4]) W.crack(Y().x, Y().z, a, 4, '#6f9bff'); FX.rock(pos(Y()), 14, 6); AU.play('gura_crack', { vol: 0.8 }); Y().to('crouch', 0.05); cut([Y().x + 6, 3.5, Y().z + 6], [Y().x, 0.6, Y().z], 44, 0.05); });
    const fight = [[22.8, Y, A, 'side'], [23.1, A, Y, 'jab'], [23.4, Y, A, 'high'], [23.7, A, Y, 'hook'], [24.0, Y, A, 'spin'], [24.3, A, Y, 'knee']];
    fight.forEach(([tt, a, d, k], i) => exch(t(tt), a, d, k, 1.5 + (i % 2) * 0.3, rel(i % 2 ? a : d, 2.0 * (i % 3 ? 1 : -1), 0.9 + i * 0.1, 2.2, 0, 1.35, 0, 32, 0.06 * (i % 2 ? 1 : -1))));
    // verrouillage à trois
    T(t(24.9), () => { dash(B(), Y().x - Math.sin(Y().yaw) * 0.9, Y().z - Math.cos(Y().yaw) * 0.9, 0.2); });
    T(t(25.15), () => { Y().to('blockBack', 0.06); B().faceTo(Y()); B().to('cutDown', 0.06); A().to('hookR', 0.06); clashS(B(), Y(), 2); hit(A(), Y(), 1.6, hand(A())); S.lock = true; AU.SFX.grind(2); K.setHC({ p: ch(Y()).add(v(0, 0.3, 0)), rt: 0 }); K.camOrbit(Y().x, 1.3, 3.8, 1.5, 0, 2.6, 2.4, 36, 0.04, Y().z); });
    T(t(27.6), () => {
      K.setHC(null); S.lock = false; Y().to('wingSpread', 0.1); tw(Y(), 'wing', 1, 0.15, 'out', 'dir'); K.aura(Y(), 2, 0.2); K.flash(0.8, 0xc080ff); DV.dome(ch(Y()), 0xa040ff, 12, 0.8); DV.dome(ch(Y()), 0xffd890, 9, 0.6); AU.play('haki_conqueror', { vol: 1.1 }); K.impact(true);
      knock(A(), pos(Y()), 4.5, 0.5, 0.6); knock(B(), pos(Y()), 4.5, 0.5, 0.6); cut([0, 1.2, Y().z + 7], [Y().x, 1.8, Y().z], 44, 0); later(1, () => K.aura(Y(), 1, 1));
    });
    T(t(28.6), () => { A().to('fistGuard', 0.3); B().to('iceStance', 0.3); A().faceTo(Y()); B().faceTo(Y()); });
    // regards
    T(t(29.4), () => { S.panels = S.dir; S.panelList = [B(), A(), Y()]; AU.SFX.heart(1.2); AU.trackVol(0.15, 0.5); });
    T(t(30.8), () => { [A(), B(), Y()].forEach(F => { F.eyeFlash = 1; tw(F, 'eyeFlash', 0, 0.9, 'out', 'dir'); }); AU.SFX.draw(); });
    T(t(31.0), () => { S.panels = null; $('panels').style.opacity = 0; AU.trackVol(0.6, 0.3); });
    // Ice Time + GALAXY IMPACT
    line(t(31.1), 'B', 'r_imada', 'アザド、今だっ！', '« Azad, maintenant ! »', 2);
    T(t(31.3), () => { blink(B(), Y().x + Math.sin(Y().yaw) * 0.9, Y().z + Math.cos(Y().yaw) * 0.9, Y()); B().to('castPalm', 0.06); B().openL = true; });
    T(t(31.6), () => { K.ICE4 = PW.iceTime(pos(Y()), 1.35, 2.8, 0.35); PW.iceAge(pos(Y()), 5, 0.5, 0, 30); Y().to('guard', 0.05); K.flash(0.4, 0xcff4ff); AU.play('shatter', { vol: 1 }); shot(rel(Y, 2.8, 1.3, 3.6, 0, 1.4, 0, 32, 0.03)); later(0.5, () => { B().openL = false; roll(B(), B().x + 2.5, B().z + 1.5); }); });
    T(t(32.4), () => { A().faceTo(Y()); A().to('galaxyWind', 0.4); A().arm = 1; K.aura(A(), 2.6, 0.4); K.GF = PW.hakiFist(() => hand(A()), 0.32, 4.4); AU.play('gura_charge', { vol: 1.2 }); AU.SFX.rumble(1, 4); shot(rel(A, 0.7, 0.55, 2.3, 0, 1.45, 0, 34, 0.05)); });
    line(t(32.7), 'A', 'a_galaxy', 'ギャラクシー…インパクト！', '« Galaxy… Impact ! »', 3.3);
    T(t(33.8), () => { for (let i = 0; i < 14; i++) FX.bolt(ch(A()), v(rand(-1, 1), rand(-0.3, 1), rand(-1, 1)), rand(1.5, 4), 0.04, 0.4, pick([C.dark, C.A, new THREE.Color(0xff2448)])); W.crackAt(A().x, A().z); for (const a of [0, 1.5, 3, 4.5]) W.crack(A().x, A().z, a, 3, '#ff2448'); K.CAM.shake += 0.1; cut([A().x + 6, 1.0, A().z - 2], [(A().x + Y().x) / 2, 1.4, (A().z + Y().z) / 2], 40, 0.04); });
    T(t(34.6), () => { shot(rel(A, -0.35, 1.35, 0.9, -0.3, 1.3, 0, 26, 0)); });
    T(t(35.6), () => { const y = Y(), d = pos(y).sub(pos(A())).setY(0).normalize(); A().to('runFA', 0.04); A().go3(y.x - d.x * 1.0, y.z - d.z * 1.0, 0.16, 'in'); A().ghost = true; AU.SFX.whoosh(1.4, 0.9); });
    T(t(35.78), () => {
      A().ghost = false; A().to('galaxyHit', 0.04); const p = ch(Y()); PW.shatter(K.ICE4, 14); PW.galaxy(p, 48, 3.6); K.flash(0.75, 0xffffff); K.impact(true); K.crackFX([0.5, 0.48], 1.4, 2.6); K.shock(p, 1.3, 2.4); K.slow(0.25, 0.05);
      AU.play('gura_crack', { vol: 1.4 }); AU.play('impact_big', { vol: 1.3 }); AU.SFX.boom(1.8); AU.SFX.rumble(1, 6); K.CAM.shake += 0.4; banner('銀河インパクト', 'GALAXY IMPACT', '#c8d8ff');
      const d = pos(Y()).sub(pos(A())).setY(0).normalize(); Y().to('hurt', 0.05); Y().go3(Y().x + d.x * 28, Y().z + d.z * 28, 1.6, 'out', 3); tw(Y(), 'rx', -1.2, 1.6, 'inOut', 'world'); Y().wing = 0.1;
      ST.stones.forEach(s => s.parent && DV.launch(s, v(d.x * 20 + rand(-4, 4), rand(6, 12), d.z * 20 + rand(-4, 4))));
      K.split([0.5, 0.5], 0.4, 1, 0x9ab8ff, 30); cut([A().x - d.z * 9, 2.2, A().z + d.x * 9], [p.x, p.y, p.z], 44, 0.05);
    });
    T(t(36.5), () => { cut([38, 4, 40], [0, 4, -24], 58, 0.04); });
    T(t(37.4), () => { K.slow(1, 0.3); });
    T(t(37.8), () => { const p = pos(Y()); tw(Y(), 'y', -13.6, 0.4, 'in', 'world'); later(0.4, () => { DV.dome(p.clone().setY(-13.6), 0x9ae8ff, 14, 1); FX.spark(p.clone().setY(-13.5), 90, [C.ice, C.W], 12); AU.SFX.boom(1.3); AU.play('shatter', { vol: 1 }); Y().rx = -1.45; Y().set('lie'); }); });
    T(t(38.6), () => { AU.trackVol(0.1, 1); A().to('kneel', 0.5); A().arm = 0; K.aura(A(), 0.6, 1); cut([A().x - 1.5, 1.4, A().z + 3.8], [0, -4, -30], 44, 0.02); move([A().x - 1.2, 1.5, A().z + 3.2], [0, -6, -30], 42, 0, 3); });
    heartBeats(t(39.2), 3, 1.0);
    // Domi Reversi sur la mer gelée
    T(t(42.0), () => { const p = pos(Y()); DV.circle(ST.circleTex, v(p.x, -13.55, p.z), 0xffd890, 30, 8, null, 0.4); DV.circle(ST.circleTex, v(p.x, -13.5, p.z), 0xa040ff, 22, 8, null, -0.6); AU.play('imu_seal', { vol: 1.1 }); cut([p.x + 8, 10, p.z + 16], [p.x, -13, p.z], 50, 0.03); });
    line(t(42.4), 'Y', 'y_domi', 'ドミ・リバーシ。', '« Domi Reversi. »', 2.3, 0.2);
    T(t(43.6), () => { dissolve(Y()); });
    T(t(44.6), () => { reform(Y(), 0, -11, 9, 0); K.aura(Y(), 1.6, 0.4); Y().haloA = 1.6; tw(ST.eclEyeU.uA, 'value', 1, 1, 'out', 'dir'); tw(ST.eclEyeU.uOpen, 'value', 1, 2, 'inOut', 'dir'); AU.trackVol(0.6, 0.5); cut([0, 0.5, 4.5], [0, 10, -11], 54, 0.05); move([0, 0.8, 3.5], [0, 9.6, -11], 50, 0.02, 2.4); });
    T(t(46.5), () => { cut([0.9, 10.4, -9.2], [0, 10.55, -11], 26, 0); });
    line(t(46.6), 'Y', 'y_muda', '無駄よ。', '« Inutile. »', 1.7, 0.2);
    T(t(48.3), () => { A().faceTo(Y()); A().to('fistGuard', 0.2); B().to('iceStance', 0.2); shot(rel(A, 0.4, 1.55, 1.3, 0, 1.5, 0, 28, 0.03)); });
    line(t(48.4), 'A', 'a_bakana', '馬鹿な…！', '« Impossible… ! »', 1.2);
    // LE JUGEMENT CÉLESTE
    T(t(49.6), () => { Y().to('windHigh', 0.4); Y().flap = 1; K.flash(0.4, 0xffe0a0); cut([0, 0.7, 8], [0, 10, -11], 60, 0); });
    line(t(49.8), 'Y', 'y_shinpan', '天の…審判！', '« Le Jugement… céleste ! »', 2.8, 0.2);
    T(t(50.4), () => { K.SW2 = PW.swords(v(0, 0, -11), 24, 9, 11); AU.play('imu_dark', { vol: 1, rate: 0.7 }); AU.SFX.drone(6, 0.25); });
    T(t(51.2), () => { banner('天ノ審判', 'LE JUGEMENT CÉLESTE', '#ffe6a8'); cut([18, 4, 16], [0, 8, -8], 56, 0.04); });
    T(t(52.0), () => {
      const tg = []; for (let i = 0; i < 50; i++) { const F = i % 2 ? A() : B(); tg.push(v(F.x + rand(-3.5, 3.5), 0, F.z + rand(-3.5, 3.5))); } PW.holySpears(tg, 0.035, 30);
      PW.fireSwords(K.SW2, s => { const i = K.SW2.list.indexOf(s), F = i % 2 ? A() : B(); return v(F.x + Math.cos(i) * rand(0.8, 1.6), 0.1, F.z + Math.sin(i) * rand(0.8, 1.6)); }, 0.08);
      cut([3, 0.5, 9], [0, 3, 0], 54, 0.06);
    });
    T(t(52.6), () => { A().to('groundPalm', 0.1); PW.blackHole(pos(A()), 3.5, 2.5, 0.3); B().to('blockHigh', 0.1); K.W3 = PW.iceTime(pos(B()).add(v(0, 0, -1.1)), 1.5, 2.8, 0.25); });
    T(t(53.6), () => { DV.pillar(v(0, 0, 3), 0xff3040, 3, 140, 2.2); K.flash(0.6, 0xffb0b0); K.impact(true); K.shock(v(0, 1, 3), 1, 2); AU.play('goro_bolt', { vol: 1.2, rate: 0.6 }); AU.SFX.boom(1.6); K.CAM.shake += 0.3; PW.shatter(K.W3, 8);
      [A(), B()].forEach(F => { F.to('hurt', 0.06); grunt(F, 1); }); cut([0, 4, 22], [0, 20, -20], 60, 0.03); });
    T(t(54.6), () => { cut([Y().x, Y().y + 3.2, Y().z + 0.6], [0, 0, 2.5], 72, 0); Y().to('divineDive', 0.15); Y().flap = 1; });
    T(t(55.0), () => { Y().ghost = true; tw(Y(), 'x', 0, 0.55, 'in', 'world'); tw(Y(), 'y', 0, 0.55, 'in', 'world'); tw(Y(), 'z', 6.5, 0.55, 'in', 'world'); AU.SFX.whoosh(1.5, 0.6); });
    T(t(55.25), () => { cut([0.4, 0.25, 9], [0, 4, -2], 66, 0.15); });
    T(t(55.55), () => {
      Y().ghost = false; Y().to('passSlash', 0.04); K.split([0.5, 0.5], 0.8, 1.1, 0xffd890, 30); K.split([0.5, 0.5], -0.8, 1.1, 0xa040ff, 30); K.flash(1, 0xffffff); K.impact(true); K.slow(0.25, 0.05);
      DV.dome(v(0, 1, 4), 0xffffff, 24, 1.2); DV.dome(v(0, 1, 4), 0xffd890, 30, 1.4); K.crackFX([0.5, 0.5], 1.3, 2.2); AU.SFX.boom(1.8); AU.play('impact_big', { vol: 1.3 }); AU.SFX.slash(1.5); K.CAM.shake += 0.35; K.sfxText('十字斬', [0.5, 0.3], 160, '#fff');
      [A(), B()].forEach(F => { F.to('hurt', 0.05); F.go3(F.x * 1.6, F.z + 2, 1.4, 'out', 1.4); });
      cut([7, 2.4, 12], [0, 1.2, 5], 42, 0.06);
    });
    T(t(57.0), () => { K.slow(1, 0.3); Y().to('guard', 0.3); Y().faceTo(v(0, 0, 20)); });
    T(t(57.6), () => { [A(), B()].forEach(F => { tw(F, 'y', -0.62, 0.3, 'in', 'world'); tw(F, 'rx', -1.45, 0.3, 'in', 'world'); F.to('lie', 0.2); }); FX.dustBurst(v(0, 0, 8), 30, 4); AU.SFX.boom(0.9); });
    // elle rengaine : explosion retardée
    T(t(58.4), () => { shot(rel(Y, 0.9, 1.2, 2.6, 0, 1.3, 0, 32, 0.03)); Y().to('sheathDone', 1.1, 'inOut', 1); AU.SFX.draw(); AU.trackVol(0.15, 0.6); });
    T(t(59.7), () => { AU.SFX.sheath(); K.flash(1, 0xffe8c0); DV.dome(v(0, 1, 8), 0xffd890, 30, 1.4); AU.SFX.boom(1.6); AU.play('impact_big', { vol: 1 }); K.CAM.shake += 0.25; cut([4, 8, 22], [0, 0, 6], 50, 0.05); });
    T(t(61.5), () => { K.camOrbit(Y().x, 1.5, 5.5, 1.9, Math.PI + 0.9, Math.PI - 0.6, 5, 40, 0.02, Y().z); });
    T(t(66.5), () => { white(1, 1.2); AU.track(null, { fade: 1.2 }); });
  }

  /* =========================================================================================== ACTE V — LE TRÔNE VIDE (240 → 300) */
  {
    const O = 240, t = x => O + x;
    const sitY = F => 9.47 - F.rest.hips.y + 0.45 * F.k;
    T(t(0), () => {
      resetAll(); ST.set('holy', 'holyDawn'); ST.petalWind = 1; ST.rayA = 0.3; K.AZD.on = false; K.FROST.on = false; K.HOLY.on = true;
      place(A(), -2.2, -4, 0.6, 'lie', -0.62); A().rx = -1.45; place(B(), 2.6, -3, -0.5, 'lie', -0.62); B().rx = -1.45; A().arm = 0; K.aura(A(), 0, 0.1); K.aura(B(), 0, 0.1); K.aura(Y(), 0.2, 0.1);
      place(Y(), 0, -12, Math.PI, 'stand'); Y().wing = 0.25; Y().wingA = 1; Y().haloA = 1;
      K.SCR.white = 1; white(0, 3); AU.track('m_end2', { vol: 0.55, fade: 3 }); AU.wind(0.25, 3); K.caption('第五幕 ・ 夜明け  —  Acte V · L\'aube sur la Terre sainte');
      cut([0, 14, 18], [0, 1, -6], 46); move([5, 3.5, 6], [0, 1, -5], 40, 0, 6);
    });
    T(t(4.5), () => K.caption('', false));
    T(t(6.2), () => { const h = hd(A()); cut([h.x + 0.8, h.y + 0.5, h.z + 0.6], [h.x, h.y, h.z], 30, 0.05); });
    line(t(6.5), 'A', 'a_tsuee', '…強ぇな、お前。', '« …T\'es forte, toi. »', 3.1);
    T(t(9.8), () => { const h = hd(B()); cut([h.x - 0.8, h.y + 0.5, h.z + 0.6], [h.x, h.y, h.z], 30, -0.05); });
    line(t(10.1), 'B', 'r_kanpai', '…完敗だ。', '« …Défaite totale. »', 1.8, -0.3);
    T(t(12.4), () => { Y().faceTo(v(0, 0, -4)); shot(rel(Y, 0.3, 1.6, 1.3, 0, 1.55, 0, 26, 0)); });
    line(t(12.8), 'Y', 'y_fukushu', 'これが…私の復讐。', '« Voici… ma revanche. »', 3.7, 0.2);
    // elle gravit les marches et s'assoit sur le Trône vide
    T(t(16.8), () => { Y().faceTo(v(0, 0, -40)); Y().run(true, 'walkA', 'walkB', 0.95); tw(Y(), 'z', -19.4, 2.4, 'lin', 'world'); later(2.4, () => { tw(Y(), 'z', -43.6, 8.4, 'lin', 'world'); tw(Y(), 'y', 8.3, 8.4, 'lin', 'world'); });
      K.camTrack(Y(), [0.9, 1.4, -2.6], [0, 1.4, 4], 38, 2, true); });
    T(t(21.0), () => { cut([0, 2, -6], [0, 6, -40], 40, 0); move([0, 3.5, -12], [0, 8, -40], 38, 0, 6); });
    T(t(27.6), () => { Y().run(false); place(Y(), 0, -44.32, 0, 'sit', sitY(Y())); Y().wing = 0.2; cut([0, 10, -36], [0, 10.3, -45.5], 30, 0); move([0, 10.2, -38.5], [0, 10.5, -45.5], 26, 0, 3); K.flash(0.2, 0xffe8c0); });
    T(t(31.0), () => { Y().eyeFlash = 1; tw(Y(), 'eyeFlash', 0, 1.5, 'out', 'dir'); cut([0, 6, -10], [0, 9, -45], 36, 0); move([0, 12, 24], [0, 10, -60], 46, 0, 8); });
    // titre + générique
    T(t(36.0), () => { K.flash(1); AU.play('boom_title', { vol: 1.1, wet: 0.5 }); $('title').classList.add('show'); });
    T(t(42.5), () => { fade(0.85, 1.5); });
    T(t(43.6), () => { $('title').classList.remove('show'); $('title').style.opacity = 0; K.CRED = S.dir; });
    T(t(57.0), () => { fade(1, 2); AU.track(null, { fade: 3 }); AU.wind(0.0001, 2); });
    T(t(60.0), () => { S.ended = true; });
  }
}
