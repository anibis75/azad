// Moteur audio : échantillons CC0 + couches synthétiques (sub, risers, drones), réverbe, compresseur
import { S, rand, clamp } from './engine.js';

let ctx = null, master, comp, verb, verbSend, musicG, sfxBus, windG, buf = {};
const b64ToAB = b => { const s = atob(b); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.buffer; };

let offline = false;
export const now = () => (offline ? S.dir : ctx.currentTime);
export async function initAudio(sfx, off = 0) {
  offline = !!off;
  ctx = off ? new OfflineAudioContext(2, Math.ceil(44100 * off), 44100) : new (window.AudioContext || window.webkitAudioContext)();
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 6; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.2;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1;
  master = ctx.createGain(); master.gain.value = 0.95;
  master.connect(comp); comp.connect(lim); lim.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  // réverbe de grande salle (IR synthétique stéréo)
  const sr = ctx.sampleRate, len = sr * 3.2, ir = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (i < sr * 0.01 ? i / (sr * 0.01) : 1); }
  }
  verb = ctx.createConvolver(); verb.buffer = ir;
  verbSend = ctx.createGain(); verbSend.gain.value = 0.55; verb.connect(verbSend); verbSend.connect(master);
  musicG = ctx.createGain(); musicG.gain.value = 0.0001; musicG.connect(master);
  await Promise.all(Object.entries(sfx).map(async ([k, v]) => {
    try { buf[k] = await ctx.decodeAudioData(typeof v === 'string' ? b64ToAB(v) : v.slice(0)); } catch (e) { console.warn('audio', k, e); }
  }));
  // vent en boucle
  windG = ctx.createGain(); windG.gain.value = 0.0001; windG.connect(sfxBus);
  if (buf.wind) { const s = ctx.createBufferSource(); s.buffer = buf.wind; s.loop = true; s.connect(windG); s.start(0); }
  return ctx;
}
export const resume = () => ctx && ctx.resume();
const T = (d = 0) => now() + 0.004 + d;

function out(node, wet, pan) {
  let n = node;
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); n.connect(p); n = p; }
  n.connect(sfxBus);
  if (wet > 0) { const g = ctx.createGain(); g.gain.value = wet; n.connect(g); g.connect(verb); }
}
// joue un échantillon ; name 'clash' -> clash1..4 au hasard
export function play(name, { vol = 1, rate = 1, pan = 0, wet = 0.25, delay = 0, lp = 0, off = 0, dur } = {}) {
  if (!ctx || S.mute) return;
  let b = buf[name];
  if (!b) { const c = Object.keys(buf).filter(k => k.replace(/\d+$/, '') === name); if (!c.length) return; b = buf[c[(Math.random() * c.length) | 0]]; }
  const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vol;
  let n = s;
  if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; s.connect(f); n = f; }
  n.connect(g); out(g, wet, pan);
  s.start(T(delay), off, dur);
  return s;
}
function env(g, at, a, peak, d) { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + a + d); }
function osc(type, f, at, dur, peak, a = 0.003, wet = 0.3, f2) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur * 0.8);
  const g = ctx.createGain(); env(g, at, a, peak, dur); o.connect(g); out(g, wet); o.start(at); o.stop(at + a + dur + 0.05);
}
let noiseB = null;
function noise(at, dur, peak, type, f, q = 1, wet = 0.3, a = 0.002, f2) {
  if (!noiseB) { noiseB = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const n = ctx.createBufferSource(); n.buffer = noiseB; n.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  if (f2) { fl.frequency.setValueAtTime(f, at); fl.frequency.exponentialRampToValueAtTime(f2, at + dur); }
  const g = ctx.createGain(); env(g, at, a, peak, dur);
  n.connect(fl); fl.connect(g); out(g, wet); n.start(at); n.stop(at + a + dur + 0.05);
}
const ok = () => ctx && !S.mute;

/* ---------- sons composés (échantillons + couches) ---------- */
export const SFX = {
  clash(pw = 1, pan = 0) {
    if (!ok()) return;
    play('clash', { vol: 0.75 + 0.1 * pw, rate: rand(0.9, 1.08), pan, wet: 0.35 });
    if (pw >= 1.5) play('clash', { vol: 0.45, rate: rand(0.7, 0.8), pan: -pan, wet: 0.5, delay: 0.01 });
    osc('sine', 150, T(), 0.25 + 0.1 * pw, 0.5 * pw, 0.002, 0.1, 45);
    noise(T(), 0.05, 0.4, 'highpass', 4000, 1, 0.2, 0.001);
    if (pw >= 2) SFX.boom(0.35 * pw);
  },
  slash(v = 0.7, pan = 0) { if (!ok()) return; play(Math.random() < 0.5 ? 'slash1' : 'slash', { vol: v, rate: rand(0.9, 1.15), pan, wet: 0.15 }); },
  whoosh(v = 0.7, rate = 1) { if (!ok()) return; play('whoosh', { vol: v, rate, wet: 0.2 }); },
  tp() { if (!ok()) return; play('whoosh', { vol: 0.8, rate: 1.6, wet: 0.2 }); osc('sine', 2400, T(), 0.12, 0.12, 0.002, 0.3, 300); noise(T(), 0.04, 0.3, 'highpass', 3000, 1, 0.2, 0.001); },
  draw() { if (!ok()) return; play('draw', { vol: 0.9, wet: 0.4 }); },
  sheath() { if (!ok()) return; play('sheath', { vol: 1, wet: 0.45 }); },
  boom(s = 1) {
    if (!ok()) return;
    play(s > 0.7 ? 'boom1' : 'boom2', { vol: Math.min(1.2, 0.5 + 0.5 * s), rate: rand(0.85, 1), wet: 0.4 });
    osc('sine', 90, T(), 1.6 * s + 0.4, 0.9 * s, 0.004, 0.2, 28);
  },
  zap(v = 0.4, pan = 0) { if (!ok()) return; play('zap', { vol: v, rate: rand(0.8, 1.3), pan, wet: 0.2 }); },
  rumble(v = 0.7, dur = 4) {
    if (!ok()) return;
    const s = play('rumble', { vol: v, wet: 0.2, dur });
    osc('sine', 38, T(), dur, 0.35 * v, 0.6, 0.1, 30);
    return s;
  },
  heart(v = 1) { if (!ok()) return; if (buf.heart) play('heart', { vol: v, wet: 0.2 }); else { osc('sine', 95, T(), 0.42, v, 0.006, 0.15, 36); osc('sine', 95, T(0.2), 0.42, v * 0.55, 0.006, 0.15, 36); } },
  taiko(v = 1) { if (!ok()) return; osc('sine', 140, T(), 1, v, 0.004, 0.6, 48); noise(T(), 0.14, v * 0.6, 'lowpass', 700, 1, 0.5, 0.002); if (buf.taiko1) play('taiko1', { vol: v * 0.6, wet: 0.5 }); },
  tick() { if (!ok()) return; if (buf.tick) play('tick', { vol: 1, wet: 0.6 }); else osc('square', 2000, T(), 0.03, 0.12, 0.001, 0.7); },
  debris(v = 0.8) { if (!ok()) return; play('debris', { vol: v, rate: rand(0.85, 1.1), wet: 0.3 }); },
  shatter() { if (!ok()) return; play('shatter', { vol: 1, wet: 0.5 }); },
  riser(dur = 1) { if (!ok()) return; noise(T(), dur, 0.45, 'bandpass', 200, 1.4, 0.4, dur * 0.95, 6000); osc('sawtooth', 60, T(), dur, 0.08, dur * 0.9, 0.3, 240); },
  doon() { if (!ok()) return; osc('sine', 55, T(), 3, 0.9, 0.01, 1); osc('sine', 110, T(), 2.2, 0.25, 0.01, 1); osc('triangle', 220, T(), 2, 0.05, 0.01, 1); },
  tinnitus(dur) { if (!ok()) return; const o = ctx.createOscillator(); o.frequency.value = 2900; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, T()); g.gain.exponentialRampToValueAtTime(0.018, T(0.5)); g.gain.setValueAtTime(0.018, T(dur - 0.1)); g.gain.linearRampToValueAtTime(0.0001, T(dur)); o.connect(g); out(g, 0.4); o.start(T()); o.stop(T(dur + 0.05)); },
  drone(dur = 4, v = 0.2) {
    if (!ok()) return;
    const at = T(), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.8); g.gain.setValueAtTime(v, at + dur - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4; lp.frequency.setValueAtTime(300, at); lp.frequency.exponentialRampToValueAtTime(2000, at + dur * 0.8);
    [41.2, 41.6, 58.3, 82.4, 123.5].forEach(f => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(at); o.stop(at + dur + 0.05); });
    lp.connect(g); out(g, 0.5);
  },
  grind(dur = 1.8) {
    if (!ok()) return;
    for (let t = 0; t < dur; t += rand(0.12, 0.25)) play('clash', { vol: rand(0.12, 0.22), rate: rand(1.4, 1.9), wet: 0.3, delay: t, dur: 0.25 });
    noise(T(), dur, 0.12, 'bandpass', 3800, 9, 0.3, 0.05);
  },
};
export function wind(v, t = 1) { if (ctx) windG.gain.setTargetAtTime(Math.max(0.0001, v), now(), t / 3); }
let musicSrc = null, musicV = 0.0001;
export function music(on, v = 0.5, t = 1.5) {
  if (!ctx || !buf.music) return;
  if (on && !musicSrc) { musicSrc = ctx.createBufferSource(); musicSrc.buffer = buf.music; musicSrc.connect(musicG); musicSrc.start(T()); }
  musicV = on ? v : 0.0001; musicG.gain.setTargetAtTime(musicV, now(), t / 3);
}
export function duck(d = 1.2, lvl = 0.15) { if (!ctx) return; const g = musicG.gain, t = now(), v = musicV; g.setTargetAtTime(Math.max(0.0001, lvl * v), t, 0.03); g.setTargetAtTime(Math.max(0.0001, v), t + d * 0.6, d / 4); }

export const renderOffline = () => ctx.startRendering();
// pistes musicales successives avec fondu enchaîné
let trk = null;
export function track(name, { vol = 0.5, fade = 1.5, off = 0, fadeOut } = {}) {
  if (!ctx || S.mute) return;
  const t = now();
  if (trk) { const o = trk; o.g.gain.setTargetAtTime(0.0001, t, (fadeOut ?? fade) / 4); try { o.s.stop(t + (fadeOut ?? fade) * 2 + 0.1); } catch (e) {} trk = null; }
  if (!name || !buf[name]) return;
  if (!musicSrc) { musicV = 1; musicG.gain.setValueAtTime(1, t); musicSrc = true; }
  const s = ctx.createBufferSource(); s.buffer = buf[name]; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(vol, t, fade / 4);
  s.connect(g); g.connect(musicG); s.start(t, off); trk = { s, g, vol };
}
export function trackVol(v, t = 1) { if (!ctx || !trk) return; trk.g.gain.setTargetAtTime(Math.max(0.0001, v), now(), t / 4); }
