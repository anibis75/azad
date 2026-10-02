// Horloges, tweens, timeline
export const S = {
  dir: 0, world: 0, slow: 1, frozen: false, started: false, ended: false, mute: false,
};
export const clk = c => (c === 'dir' ? S.dir : S.world);

export const EASE = {
  lin: p => p,
  in: p => p * p * p,
  in2: p => p * p,
  out: p => 1 - Math.pow(1 - p, 3),
  out2: p => 1 - (1 - p) * (1 - p),
  inOut: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  sine: p => -(Math.cos(Math.PI * p) - 1) / 2,
  back: p => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2),
  expo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
};

const TW = [];
export function tw(o, k, to, dur, ease = 'inOut', c = 'world') {
  for (let i = TW.length - 1; i >= 0; i--) if (TW[i].o === o && TW[i].k === k) TW.splice(i, 1);
  if (!(dur > 0)) { o[k] = to; return; }
  TW.push({ o, k, f: o[k], to, t0: clk(c), dur, e: EASE[ease] || EASE.inOut, c });
}
export function twKill(o, k) {
  for (let i = TW.length - 1; i >= 0; i--) if (TW[i].o === o && (k === undefined || TW[i].k === k)) TW.splice(i, 1);
}
export function updTw() {
  for (let i = TW.length - 1; i >= 0; i--) {
    const w = TW[i], p = Math.min(1, Math.max(0, (clk(w.c) - w.t0) / w.dur));
    w.o[w.k] = w.f + (w.to - w.f) * w.e(p);
    if (p >= 1) TW.splice(i, 1);
  }
}

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = a => a[(Math.random() * a.length) | 0];

export const EV = [];
let EVI = 0;
export const at = (t, fn) => EV.push({ t, fn });
const LT = [];
export const later = (dt, fn) => LT.push({ t: S.dir + dt, fn });
export function runEvents() {
  while (EVI < EV.length && EV[EVI].t <= S.dir) { EV[EVI].fn(); EVI++; }
  for (let i = LT.length - 1; i >= 0; i--) if (LT[i].t <= S.dir) { const f = LT[i].fn; LT.splice(i, 1); f(); }
}
export function sortEvents() { EV.sort((a, b) => a.t - b.t); }
