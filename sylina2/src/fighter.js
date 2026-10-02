// Combattant : VRM + cinématique inverse + katana + fourreau + tissus + aura
import * as THREE from 'three';
import { S, tw, twKill, rand, clamp, lerp } from './engine.js';

const V3 = THREE.Vector3, Q = THREE.Quaternion;
const D2R = Math.PI / 180;
const tmpA = new V3(), tmpB = new V3(), tmpC = new V3(), tmpD = new V3();

export const DEF = {
  hx: 0, hy: 0, hz: 0, hp: 0, hyw: 0, hr: 0,
  sp: 0, sy: 0, sr: 0, np: 0, ny: 0, nr: 0,
  gx: -0.2, gy: 0.85, gz: 0.2, az: -10, el: -40, rl: 0, two: 0,
  lx: 0.22, ly: 0.85, lz: 0.02,
  flx: 0.12, flz: -0.06, fly: 0, frx: -0.12, frz: 0.08, fry: 0, fyl: 12, fyr: -8,
  epr: 0, rhx: -0.22, rhy: 0.85, rhz: 0.02, rfree: 0,
};
export const KEYS = Object.keys(DEF);
const F = (o) => ({ ...o });
export const POSES = {
  stand: F({}),
  sheathIdle: F({ sheath: 1, grip: 1, flx: 0.13, flz: -0.08, frx: -0.13, frz: 0.1 }),
  guard: F({ hy: -0.07, hp: 6, hyw: -12, sp: 4, sy: 6, gx: -0.02, gy: 1.02, gz: 0.36, az: 2, el: 34, two: 1, flx: 0.16, flz: -0.3, frx: -0.1, frz: 0.26, fyl: 35, fyr: -5 }),
  iaiReady: F({ sheath: 1, grip: 1, hy: -0.24, hp: 24, hyw: -22, sp: 12, np: -18, flx: 0.2, flz: -0.42, frx: -0.12, frz: 0.42, fyl: 40, fyr: 0 }),
  iaiDraw: F({ hy: -0.12, hp: 10, hyw: 28, sp: 8, sy: 22, gx: 0.28, gy: 1.42, gz: 0.38, az: 42, el: 52, rl: 0, two: 0, lx: 0.26, ly: 0.93, lz: -0.12, flx: 0.18, flz: -0.46, frx: -0.1, frz: 0.46, fyl: 40 }),
  dash: F({ hy: -0.26, hp: 32, sp: 14, np: -26, gx: -0.3, gy: 0.86, gz: -0.25, az: -150, el: -8, two: 0, lx: 0.3, ly: 0.86, lz: -0.2, flx: 0.12, flz: -0.55, fly: 0.12, frx: -0.12, frz: 0.45, fyl: 10 }),
  windHigh: F({ hy: -0.06, hp: -4, sp: -6, np: 6, gx: -0.02, gy: 1.72, gz: 0.08, az: 0, el: 118, two: 1, flx: 0.16, flz: -0.3, frx: -0.1, frz: 0.26, fyl: 35, fyr: -5, epr: 1 }),
  cutDown: F({ hy: -0.22, hp: 26, sp: 12, np: -10, gx: -0.02, gy: 0.98, gz: 0.56, az: 0, el: -18, two: 1, flx: 0.16, flz: -0.5, frx: -0.1, frz: 0.5, fyl: 35 }),
  windSide: F({ hy: -0.1, hyw: -35, sy: -25, gx: -0.34, gy: 1.14, gz: -0.12, az: -158, el: 12, two: 0, lx: 0.3, ly: 1.08, lz: 0.34, flx: 0.18, flz: -0.3, frx: -0.12, frz: 0.3, fyl: 35 }),
  cutSide: F({ hy: -0.16, hp: 10, hyw: 32, sy: 28, gx: 0.26, gy: 1.1, gz: 0.5, az: 62, el: 2, rl: 0, two: 0, lx: 0.3, ly: 1.0, lz: -0.28, flx: 0.18, flz: -0.46, frx: -0.1, frz: 0.46, fyl: 40 }),
  thrust: F({ hy: -0.16, hp: 12, gx: -0.05, gy: 1.16, gz: 0.72, az: 0, el: 2, rl: 90, two: 0, lx: 0.3, ly: 1.0, lz: -0.3, flx: 0.18, flz: -0.5, frx: -0.1, frz: 0.5, fyl: 40 }),
  lock: F({ hy: -0.13, hp: 12, sp: 6, np: -8, gx: -0.02, gy: 1.16, gz: 0.4, az: 12, el: 50, two: 1, flx: 0.18, flz: -0.36, frx: -0.1, frz: 0.3, fyl: 35 }),
  blockHigh: F({ hy: -0.12, gx: -0.1, gy: 1.6, gz: 0.26, az: 72, el: 6, rl: 0, two: 1, flx: 0.18, flz: -0.3, frx: -0.1, frz: 0.26, fyl: 35, epr: 1 }),
  blockBack: F({ hy: -0.08, hyw: -18, ny: -35, gx: -0.26, gy: 1.26, gz: -0.18, az: 180, el: 78, two: 0, lx: 0.25, ly: 1.0, lz: 0.2, flx: 0.16, flz: -0.25, frx: -0.12, frz: 0.25, fyl: 30 }),
  hurt: F({ hy: -0.1, hp: -24, sp: -16, np: -12, gx: -0.46, gy: 1.02, gz: 0.08, az: -85, el: 28, two: 0, lx: 0.5, ly: 1.2, lz: -0.1, flx: 0.15, flz: 0.22, frx: -0.12, frz: -0.16 }),
  slideBrake: F({ hy: -0.36, hp: 30, np: -10, gx: -0.16, gy: 0.62, gz: 0.46, az: 0, el: -55, two: 0, lx: 0.3, ly: 0.72, lz: 0.26, flx: 0.2, flz: -0.6, frx: -0.15, frz: 0.42, fyl: 30 }),
  air: F({ hp: 25, gx: 0, gy: 1.3, gz: 0.3, az: 0, el: 70, two: 1, flx: 0.12, flz: 0.1, fly: 0.45, frx: -0.12, frz: 0.2, fry: 0.35 }),
  airHigh: F({ hp: -10, sp: -10, gx: 0, gy: 1.85, gz: -0.02, az: 0, el: 128, two: 1, flx: 0.12, flz: -0.22, fly: 0.2, frx: -0.12, frz: 0.25, fry: 0.4, epr: 1 }),
  slamDown: F({ hy: -0.46, hp: 40, sp: 14, np: -12, gx: 0, gy: 0.56, gz: 0.7, az: 0, el: -46, two: 1, flx: 0.2, flz: -0.56, frx: -0.12, frz: 0.46, fyl: 35 }),
  hakiRelease: F({ hy: -0.06, hp: -8, sp: -12, np: -12, gx: -0.46, gy: 0.96, gz: 0.05, az: -100, el: -35, two: 0, lx: 0.5, ly: 1.02, lz: 0.1, flx: 0.22, flz: -0.1, frx: -0.22, frz: 0.1, fyl: 25, fyr: -25 }),
  kneel: F({ hy: -0.56, hp: 20, sp: 16, np: 28, gx: -0.2, gy: 0.56, gz: 0.36, az: 0, el: -82, two: 0, lx: 0.15, ly: 0.62, lz: 0.2, flx: 0.15, flz: -0.36, frx: -0.12, frz: 0.3 }),
  sheathDone: F({ sheath: 1, grip: 1, np: 4, flx: 0.13, flz: -0.06, frx: -0.13, frz: 0.08 }),
  // --- nouvelles poses (film)
  runA: F({ hy: -0.12, hp: 34, sp: 10, np: -26, gx: -0.26, gy: 0.9, gz: -0.36, az: 180, el: -12, two: 0, lx: 0.3, ly: 0.9, lz: -0.4, flx: 0.12, flz: 0.42, fly: 0.08, frx: -0.12, frz: -0.34, fry: 0.3, fyl: 5, fyr: -5 }),
  runB: F({ hy: -0.12, hp: 34, sp: 10, np: -26, gx: -0.26, gy: 0.9, gz: -0.36, az: 180, el: -12, two: 0, lx: 0.3, ly: 0.9, lz: -0.4, flx: 0.12, flz: -0.34, fly: 0.3, frx: -0.12, frz: 0.42, fry: 0.08, fyl: 5, fyr: -5 }),
  walkA: F({ sheath: 1, grip: 0, hy: -0.02, hp: 4, flx: 0.11, flz: 0.2, fly: 0.02, frx: -0.11, frz: -0.16, fry: 0.06, lx: 0.24, ly: 0.82, lz: -0.1, fyl: 3, fyr: -3 }),
  walkB: F({ sheath: 1, grip: 0, hy: -0.02, hp: 4, flx: 0.11, flz: -0.16, fly: 0.06, frx: -0.11, frz: 0.2, fry: 0.02, lx: 0.24, ly: 0.82, lz: 0.12, fyl: 3, fyr: -3 }),
  punchCharge: F({ hy: -0.18, hp: 8, hyw: -34, sy: -26, np: 6, gx: -0.34, gy: 0.92, gz: -0.12, az: -160, el: -30, two: 0, lx: 0.26, ly: 1.02, lz: -0.3, flx: 0.24, flz: 0.34, frx: -0.2, frz: -0.34, fyl: 30, fyr: -10 }),
  punch: F({ hy: -0.22, hp: 14, hyw: 30, sy: 22, np: -6, gx: -0.36, gy: 0.92, gz: -0.3, az: -170, el: -35, two: 0, lx: 0.02, ly: 1.34, lz: 0.72, flx: 0.2, flz: 0.5, frx: -0.18, frz: -0.46, fyl: 20, fyr: -15 }),
  kick: F({ hy: 0.0, hp: -18, sp: -8, np: 12, gx: -0.34, gy: 1.0, gz: -0.2, az: -150, el: -20, two: 0, lx: 0.4, ly: 1.2, lz: 0.1, flx: 0.12, flz: -0.08, frx: -0.04, frz: 0.62, fry: 0.95, fyr: 0 }),
  castPalm: F({ hy: -0.1, hp: 4, hyw: 20, sy: 14, gx: -0.3, gy: 0.9, gz: -0.05, az: -150, el: -45, two: 0, lx: 0.06, ly: 1.32, lz: 0.6, flx: 0.18, flz: 0.26, frx: -0.16, frz: -0.26, fyl: 20, fyr: -10 }),
  raiseSky: F({ hy: -0.04, hp: -6, sp: -10, np: -30, gx: -0.3, gy: 0.9, gz: 0.1, az: -140, el: -40, two: 0, lx: 0.18, ly: 1.98, lz: 0.08, flx: 0.2, flz: 0.02, frx: -0.2, frz: -0.02, fyl: 20, fyr: -20, epr: 1 }),
  landing: F({ hy: -0.56, hp: 36, sp: 12, np: -30, gx: -0.5, gy: 0.5, gz: -0.12, az: -120, el: -20, two: 0, lx: 0.2, ly: 0.12, lz: 0.42, flx: 0.18, flz: 0.34, frx: -0.14, frz: -0.42, fry: 0.0, fyl: 20, fyr: -10 }),
  tuck: F({ hy: -0.18, hp: 20, sp: 20, np: -10, gx: -0.1, gy: 1.0, gz: 0.3, az: 0, el: 60, two: 1, flx: 0.12, flz: 0.25, fly: 0.5, frx: -0.12, frz: 0.2, fry: 0.46 }),
  lie: F({ hy: 0, hp: 0, np: -8, gx: -0.5, gy: 1.1, gz: 0.05, az: -120, el: 30, two: 0, lx: 0.55, ly: 1.1, lz: 0.05, flx: 0.16, flz: 0.02, frx: -0.16, frz: -0.04, fyl: 20, fyr: -20 }),
  diveKick: F({ hy: 0.0, hp: 10, sp: 6, np: -10, gx: -0.3, gy: 1.3, gz: -0.2, az: 180, el: 50, two: 0, lx: 0.35, ly: 1.4, lz: -0.2, flx: 0.12, flz: -0.25, fly: 0.35, frx: -0.1, frz: 0.55, fry: 0.2 }),
  shoulder: F({ np: 4, gx: -0.22, gy: 1.4, gz: 0.1, az: 180, el: 40, rl: 90, two: 0, lx: 0.24, ly: 0.84, lz: 0.02, flx: 0.16, flz: 0.04, frx: -0.14, frz: -0.06, fyl: 18, fyr: -18 }),
  dodge: F({ hy: -0.14, hp: -30, sp: -14, np: 10, gx: -0.4, gy: 1.1, gz: -0.1, az: -120, el: 40, two: 0, lx: 0.45, ly: 1.1, lz: 0.2, flx: 0.18, flz: 0.34, frx: -0.14, frz: -0.2, fyl: 20 }),
  crouch: F({ hy: -0.42, hp: 22, np: -18, gx: -0.1, gy: 0.7, gz: 0.4, az: 20, el: 10, two: 1, flx: 0.22, flz: 0.18, frx: -0.2, frz: -0.26, fyl: 30, fyr: -20 }),
  passSlash: F({ hy: -0.36, hp: 30, sp: 10, np: -8, gx: 0.34, gy: 0.92, gz: 0.44, az: 122, el: -10, two: 0, lx: 0.35, ly: 0.82, lz: -0.34, flx: 0.2, flz: -0.52, frx: -0.12, frz: 0.46, fyl: 35 }),
  // --- partie 2 : combat à mains nues (épée au fourreau, main droite libre), coups de pied, ailes
  fistGuard: F({ sheath: 1, rfree: 1, hy: -0.1, hp: 8, hyw: -18, sy: -8, np: 4, lx: 0.12, ly: 1.36, lz: 0.32, rhx: -0.08, rhy: 1.3, rhz: 0.22, flx: 0.16, flz: 0.2, frx: -0.14, frz: -0.24, fyl: 25, fyr: -10 }),
  jabL: F({ sheath: 1, rfree: 1, hy: -0.12, hp: 10, hyw: 26, sy: 18, lx: 0.04, ly: 1.36, lz: 0.74, rhx: -0.1, rhy: 1.28, rhz: 0.2, flx: 0.16, flz: 0.32, frx: -0.14, frz: -0.26, fyl: 20, fyr: -15 }),
  hookR: F({ sheath: 1, rfree: 1, hy: -0.14, hp: 10, hyw: -36, sy: -30, lx: 0.16, ly: 1.3, lz: 0.22, rhx: 0.18, rhy: 1.34, rhz: 0.58, flx: 0.18, flz: 0.3, frx: -0.14, frz: -0.3, fyl: 30, fyr: -25 }),
  uppercut: F({ sheath: 1, rfree: 1, hy: -0.02, hp: -12, hyw: -24, sy: -14, np: -14, lx: 0.2, ly: 1.1, lz: 0.2, rhx: -0.04, rhy: 1.86, rhz: 0.44, flx: 0.14, flz: 0.34, frx: -0.12, frz: -0.2, fry: 0.0, fyl: 20, fyr: -10, epr: 1 }),
  galaxyWind: F({ sheath: 1, rfree: 1, hy: -0.32, hp: 18, hyw: 48, sy: 34, np: -10, lx: 0.3, ly: 1.24, lz: 0.62, rhx: -0.46, rhy: 1.16, rhz: -0.52, flx: 0.24, flz: 0.56, frx: -0.2, frz: -0.5, fyl: 40, fyr: -30 }),
  galaxyHit: F({ sheath: 1, rfree: 1, hy: -0.36, hp: 26, hyw: -40, sy: -30, np: -16, lx: 0.32, ly: 1.0, lz: -0.3, rhx: -0.02, rhy: 1.36, rhz: 0.92, flx: 0.24, flz: 0.62, frx: -0.18, frz: -0.58, fyl: 40, fyr: -25 }),
  throwRock: F({ sheath: 1, rfree: 1, hy: -0.08, hp: -16, sy: -16, np: -18, lx: 0.24, ly: 1.98, lz: -0.06, rhx: -0.24, rhy: 1.98, rhz: -0.06, flx: 0.18, flz: 0.32, frx: -0.16, frz: -0.3, fyl: 20, fyr: -20, epr: 1 }),
  throwDone: F({ sheath: 1, rfree: 1, hy: -0.22, hp: 30, sp: 14, np: -8, lx: 0.2, ly: 0.9, lz: 0.62, rhx: -0.2, rhy: 0.9, rhz: 0.62, flx: 0.2, flz: 0.5, frx: -0.16, frz: -0.42, fyl: 25, fyr: -20 }),
  darkPalms: F({ sheath: 1, rfree: 1, hy: -0.2, hp: 8, np: -4, lx: 0.2, ly: 1.24, lz: 0.6, rhx: -0.2, rhy: 1.24, rhz: 0.6, flx: 0.24, flz: 0.26, frx: -0.22, frz: -0.24, fyl: 30, fyr: -30 }),
  groundPalm: F({ sheath: 1, rfree: 1, hy: -0.58, hp: 42, sp: 18, np: -20, lx: 0.3, ly: 0.9, lz: 0.2, rhx: -0.12, rhy: 0.08, rhz: 0.62, flx: 0.24, flz: 0.42, frx: -0.18, frz: -0.42, fry: 0.0, fyl: 30, fyr: -10 }),
  runFA: F({ sheath: 1, rfree: 1, hy: -0.12, hp: 30, sp: 8, np: -22, lx: 0.2, ly: 1.12, lz: 0.36, rhx: -0.22, rhy: 0.92, rhz: -0.24, flx: 0.12, flz: 0.42, fly: 0.08, frx: -0.12, frz: -0.34, fry: 0.3, fyl: 5, fyr: -5 }),
  runFB: F({ sheath: 1, rfree: 1, hy: -0.12, hp: 30, sp: 8, np: -22, lx: 0.22, ly: 0.92, lz: -0.24, rhx: -0.2, rhy: 1.12, rhz: 0.36, flx: 0.12, flz: -0.34, fly: 0.3, frx: -0.12, frz: 0.42, fry: 0.08, fyl: 5, fyr: -5 }),
  airFist: F({ sheath: 1, rfree: 1, hp: 20, lx: 0.2, ly: 1.2, lz: 0.3, rhx: -0.2, rhy: 1.5, rhz: 0.2, flx: 0.12, flz: 0.12, fly: 0.45, frx: -0.12, frz: 0.2, fry: 0.35 }),
  spinKick: F({ hy: 0.04, hp: -22, hyw: 50, sp: -10, np: 16, gx: -0.34, gy: 1.0, gz: -0.2, az: -150, el: -20, two: 0, lx: 0.42, ly: 1.24, lz: 0.0, flx: 0.12, flz: -0.06, frx: 0.3, frz: 0.66, fry: 1.02, fyr: 40 }),
  sweep: F({ hy: -0.66, hp: 30, hyw: 30, sp: 10, np: -12, gx: -0.36, gy: 0.4, gz: 0.1, az: -120, el: -20, two: 0, lx: 0.4, ly: 0.12, lz: 0.2, flx: 0.24, flz: 0.1, frx: -0.62, frz: 0.42, fry: 0.0, fyl: 40, fyr: 60 }),
  knee: F({ hy: 0.02, hp: -6, np: 6, gx: -0.3, gy: 1.1, gz: 0.1, az: -150, el: 10, two: 0, lx: 0.3, ly: 1.2, lz: 0.4, flx: 0.12, flz: -0.1, frx: -0.1, frz: 0.42, fry: 0.62, fyr: 0 }),
  axeKick: F({ hy: 0.0, hp: -30, sp: -12, np: 18, gx: -0.34, gy: 1.1, gz: -0.3, az: -160, el: -10, two: 0, lx: 0.4, ly: 1.1, lz: -0.1, flx: 0.12, flz: -0.14, frx: -0.04, frz: 0.42, fry: 1.36, fyr: 0 }),
  wingSpread: F({ hy: -0.04, hp: -10, sp: -10, np: -12, gx: -0.5, gy: 1.32, gz: 0.1, az: -100, el: 10, two: 0, lx: 0.58, ly: 1.36, lz: 0.08, flx: 0.14, flz: 0.04, fly: 0.0, frx: -0.14, frz: -0.04, fyl: 15, fyr: -15, epr: 1 }),
  divineDive: F({ hy: 0.0, hp: 60, sp: 20, np: -40, gx: 0, gy: 1.22, gz: 0.62, az: 0, el: 20, two: 1, flx: 0.1, flz: -0.4, fly: 0.2, frx: -0.1, frz: -0.5, fry: 0.1, fyl: 5, fyr: -5 }),
  hover: F({ hy: 0.02, hp: 4, np: 4, gx: -0.3, gy: 0.94, gz: 0.18, az: -60, el: -50, two: 0, lx: 0.34, ly: 1.08, lz: 0.2, flx: 0.1, flz: 0.04, fly: 0.12, frx: -0.1, frz: -0.06, fry: 0.04, fyl: 8, fyr: -8 }),
  iceStance: F({ hy: -0.2, hp: 10, hyw: -20, sp: 6, gx: -0.24, gy: 1.05, gz: 0.3, az: 30, el: 10, two: 0, lx: 0.36, ly: 1.3, lz: 0.5, flx: 0.2, flz: 0.32, frx: -0.16, frz: -0.32, fyl: 30, fyr: -20 }),
  sit: F({ sheath: 1, rfree: 1, hy: -0.45, hp: -8, np: 4, flx: 0.13, flz: 0.62, fly: 0.12, frx: -0.13, frz: 0.62, fry: 0.12, fyl: 8, fyr: -8, lx: 0.2, ly: 0.64, lz: 0.36, rhx: -0.3, rhy: 0.7, rhz: 0.14 }),
  airSpin: F({ hp: 30, sp: 20, np: -20, gx: 0, gy: 1.1, gz: 0.3, az: 0, el: 30, two: 1, flx: 0.12, flz: 0.3, fly: 0.6, frx: -0.12, frz: 0.28, fry: 0.62 }),
};

/* ---------- katana procédural ---------- */
function wrapTexture(col) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, 64, 256);
  g.fillStyle = col;
  for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(32, y); g.lineTo(60, y + 16); g.lineTo(32, y + 32); g.lineTo(4, y + 16); g.closePath(); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 0; y < 256; y += 32) g.fillRect(28, y + 12, 8, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeKatana(col, env) {
  const g = new THREE.Group();
  const len = 0.72, y0 = 0.065, pts = 24;
  const sh = new THREE.Shape();
  const back = [], edge = [];
  for (let i = 0; i <= pts; i++) {
    const s = i / pts, y = y0 + s * len * 0.94, xb = -0.026 * s * s, w = lerp(0.031, 0.025, s);
    back.push([xb, y]); edge.push([xb + w, y]);
  }
  const tipY = y0 + len, tipX = -0.026 * 1.05;
  sh.moveTo(back[0][0], back[0][1]);
  back.forEach(p => sh.lineTo(p[0], p[1]));
  sh.lineTo(tipX, tipY);
  sh.quadraticCurveTo(edge[pts][0] + 0.004, edge[pts][1] + 0.02, edge[pts][0], edge[pts][1]);
  for (let i = pts; i >= 0; i--) sh.lineTo(edge[i][0], edge[i][1]);
  sh.closePath();
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.0022, bevelSize: 0.0016, bevelSegments: 2, curveSegments: 6 });
  bg.translate(0, 0, -0.0025); bg.rotateY(-Math.PI / 2); bg.computeVertexNormals();
  const steel = new THREE.MeshStandardMaterial({ color: 0xe8eef6, metalness: 1, roughness: 0.16, envMap: env, envMapIntensity: 1.4 });
  const blade = new THREE.Mesh(bg, steel); blade.castShadow = true;
  // lueur (haki de l'armement)
  const glowMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Mesh(bg, glowMat); glow.scale.set(2.6, 1.02, 1.35); glow.position.y = -0.006; glow.renderOrder = 6;
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.35, envMap: env });
  const iron = new THREE.MeshStandardMaterial({ color: 0x1b1b20, metalness: 0.8, roughness: 0.45, envMap: env });
  const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.009, 28), iron); tsuba.position.y = 0.052; tsuba.scale.z = 0.82;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.003, 6, 28), gold); rim.rotation.x = Math.PI / 2; rim.position.y = 0.052; rim.scale.y = 0.82;
  const habaki = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.02, 0.034), gold); habaki.position.set(0, 0.066, 0.002);
  const wt = wrapTexture(col); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(1, 1);
  const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0175, 0.25, 14), new THREE.MeshStandardMaterial({ map: wt, roughness: 0.8 }));
  tsuka.position.y = -0.075; tsuka.scale.x = 0.8;
  const kashira = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.02, 14), gold); kashira.position.y = -0.205; kashira.scale.x = 0.8;
  [tsuba, habaki, tsuka, kashira].forEach(m => (m.castShadow = true));
  g.add(blade, glow, tsuba, rim, habaki, tsuka, kashira);
  g.userData = { blade, glow, steel, len: y0 + len };
  return g;
}
function makeSaya(col) {
  const g = new THREE.Group();
  const lac = new THREE.MeshStandardMaterial({ color: 0x0d0a0c, metalness: 0.2, roughness: 0.25 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.017, 0.76, 14), lac);
  body.scale.x = 0.62; body.position.y = 0.38 + 0.02; body.castShadow = true;
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 14), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 }));
  mouth.scale.x = 0.62; mouth.position.y = 0.02;
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16), new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 }));
  cord.position.y = 0.12; cord.rotation.y = Math.PI / 2;
  g.add(body, mouth, cord);
  return g;
}

/* ---------- tissu (verlet) ---------- */
class Cloth {
  constructor(scene, cols, rows, w, h, colFront, colBack) {
    this.cols = cols; this.rows = rows; this.dx = w / (cols - 1); this.dy = h / (rows - 1);
    this.p = []; this.q = []; this.init = false;
    for (let i = 0; i < cols * rows; i++) { this.p.push(new V3()); this.q.push(new V3()); }
    const g = new THREE.PlaneGeometry(w, h, cols - 1, rows - 1);
    this.geo = g;
    const front = new THREE.MeshToonMaterial({ color: colFront, side: THREE.FrontSide });
    const back = new THREE.MeshToonMaterial({ color: colBack, side: THREE.BackSide });
    this.m1 = new THREE.Mesh(g, front); this.m2 = new THREE.Mesh(g, back);
    [this.m1, this.m2].forEach(m => { m.frustumCulled = false; m.castShadow = true; scene.add(m); });
  }
  idx(c, r) { return r * this.cols + c; }
  step(dt, anchors, spheres, force) {
    const { cols, rows } = this;
    if (!this.init || anchors[0].distanceTo(this.p[0]) > 1.5) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const a = anchors[c], i = this.idx(c, r);
        this.p[i].set(a.x, a.y - r * this.dy, a.z); this.q[i].copy(this.p[i]);
      }
      this.init = true;
    }
    if (dt > 0) {
      const dt2 = dt * dt;
      for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = this.idx(c, r), p = this.p[i], q = this.q[i];
        const vx = (p.x - q.x) * 0.975, vy = (p.y - q.y) * 0.975, vz = (p.z - q.z) * 0.975;
        q.copy(p);
        const fl = 0.6 + 0.4 * Math.sin(S.world * 7 + c * 0.9 + r * 0.6);
        p.x += vx + force.x * dt2 * fl; p.y += vy + force.y * dt2; p.z += vz + force.z * dt2 * fl;
      }
    }
    for (let c = 0; c < cols; c++) { const i = this.idx(c, 0); this.p[i].copy(anchors[c]); this.q[i].copy(anchors[c]); }
    for (let it = 0; it < 5; it++) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = this.idx(c, r);
        if (c < cols - 1) this.sat(i, this.idx(c + 1, r), this.dx, r === 0);
        if (r < rows - 1) this.sat(i, this.idx(c, r + 1), this.dy, r === 0);
      }
      for (let i = cols; i < this.p.length; i++) {
        const p = this.p[i];
        for (const s of spheres) {
          tmpA.subVectors(p, s.c); const d = tmpA.length();
          if (d < s.r) p.copy(s.c).addScaledVector(tmpA, s.r / (d || 1));
        }
        if (p.y < 0.02) p.y = 0.02;
      }
    }
    const pa = this.geo.attributes.position;
    for (let i = 0; i < this.p.length; i++) pa.setXYZ(i, this.p[i].x, this.p[i].y, this.p[i].z);
    pa.needsUpdate = true; this.geo.computeVertexNormals();
  }
  sat(a, b, len, pinA) {
    const pa = this.p[a], pb = this.p[b];
    tmpB.subVectors(pb, pa); const d = tmpB.length() || 1e-6, diff = (d - len) / d;
    if (pinA) pb.addScaledVector(tmpB, -diff);
    else { pa.addScaledVector(tmpB, diff * 0.5); pb.addScaledVector(tmpB, -diff * 0.5); }
  }
}
/* ruban (bandeau) */
class Ribbon {
  constructor(scene, n, seg, width, col) {
    this.n = n; this.seg = seg; this.w = width; this.p = []; this.q = []; this.init = false;
    for (let i = 0; i < n; i++) { this.p.push(new V3()); this.q.push(new V3()); }
    const g = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 2 * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx); this.geo = g;
    this.mesh = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color: col, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; this.mesh.castShadow = true; scene.add(this.mesh);
    this.free = false;
  }
  step(dt, anchor, side, force) {
    if (!this.init || (!this.free && anchor.distanceTo(this.p[0]) > 1)) {
      for (let i = 0; i < this.n; i++) { this.p[i].set(anchor.x, anchor.y - i * this.seg, anchor.z); this.q[i].copy(this.p[i]); }
      this.init = true;
    }
    const s = this.free ? 0 : 1;
    if (!this.free) { this.p[0].copy(anchor); this.q[0].copy(anchor); }
    if (dt > 0) for (let i = s; i < this.n; i++) {
      const p = this.p[i], q = this.q[i];
      const v = tmpA.subVectors(p, q).multiplyScalar(0.96); q.copy(p);
      const fl = 0.5 + Math.sin(S.world * 11 + i) * 0.5;
      p.add(v); p.x += force.x * dt * dt * fl; p.y += force.y * dt * dt; p.z += force.z * dt * dt * fl;
      if (p.y < 0.01) { p.y = 0.01; if (this.free) { p.x = q.x; p.z = q.z; } }
    }
    for (let it = 0; it < 4; it++) for (let i = 1; i < this.n; i++) {
      const a = this.p[i - 1], b = this.p[i]; tmpB.subVectors(b, a); const d = tmpB.length() || 1e-6, df = (d - this.seg) / d;
      if (i === 1 && !this.free) b.addScaledVector(tmpB, -df); else { a.addScaledVector(tmpB, df * 0.5); b.addScaledVector(tmpB, -df * 0.5); }
    }
    for (let i = 0; i < this.n; i++) {
      const w = this.w * (1 - i / this.n * 0.3) * 0.5;
      this.pos.set([this.p[i].x + side.x * w, this.p[i].y + side.y * w, this.p[i].z + side.z * w], i * 6);
      this.pos.set([this.p[i].x - side.x * w, this.p[i].y - side.y * w, this.p[i].z - side.z * w], i * 6 + 3);
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals();
  }
}

/* ======================================================================
   Fighter
   ====================================================================== */
export class Fighter {
  constructor(vrm, cfg, scene, env, fx) {
    Object.assign(this, { vrm, cfg, scene, fx });
    this.col = new THREE.Color(cfg.aura);
    this.root = new THREE.Group(); scene.add(this.root); this.root.add(vrm.scene);
    this.x = cfg.x; this.y = 0; this.z = 0; this.yaw = cfg.yaw; this.prevX = this.x;
    this.p = { ...DEF }; this.sheath = 0; this.grip = 0; this.pend = null;
    this.clk = 'world'; this.rx = 0; this.rz = 0; this.cyc = null; this.cycW = 0; this.bob = 0; this.openL = false;
    this.aura = 0; this.arm = 0; this.ghost = false; this.gT = 0; this.drag = false; this.broken = false; this.anger = 0; this.shout = 0;
    this.h = vrm.humanoid;
    this.nb = n => this.h.getNormalizedBoneNode(n);
    this.rb = n => this.h.getRawBoneNode(n);
    vrm.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    // mesures au repos (repère racine)
    this.root.position.set(0, 0, 0); this.root.quaternion.identity(); this.root.updateMatrixWorld(true);
    this.rest = {}; this.restQ = {};
    const names = ['hips', 'spine', 'chest', 'upperChest', 'neck', 'head', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand',
      'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'rightUpperLeg', 'rightLowerLeg', 'rightFoot', 'leftMiddleProximal', 'rightMiddleProximal', 'leftIndexProximal', 'rightIndexProximal', 'leftLittleProximal', 'rightLittleProximal', 'leftEye', 'rightEye'];
    for (const n of names) {
      const b = this.nb(n); if (!b) continue;
      this.rest[n] = b.getWorldPosition(new V3()); this.restQ[n] = b.getWorldQuaternion(new Q());
    }
    this.k = this.rest.hips.y / 1.147;
    this.ankleH = this.rest.leftFoot.y;
    this.hipsLocal0 = this.nb('hips').position.clone();
    // repères de main au repos
    const handBasis = side => {
      const H = this.rest[side + 'Hand'], M = this.rest[side + 'MiddleProximal'], I = this.rest[side + 'IndexProximal'], Lp = this.rest[side + 'LittleProximal'];
      const f = M.clone().sub(H).normalize();
      const i = I.clone().sub(Lp); i.addScaledVector(f, -i.dot(f)).normalize();
      let n = new V3().crossVectors(f, i); const sgn = n.y < 0 ? 1 : -1; n.multiplyScalar(sgn);
      return { f, i, n, sgn };
    };
    this.hb = { right: handBasis('right'), left: handBasis('left') };
    // doigts
    this.fingers = [];
    for (const side of ['left', 'right']) for (const fn of ['Index', 'Middle', 'Ring', 'Little']) for (const seg of ['Proximal', 'Intermediate', 'Distal']) {
      const b = this.nb(side + fn + seg); if (b) this.fingers.push({ b, side });
    }
    this.thumbs = ['left', 'right'].map(s => ({ s, p: this.nb(s + 'ThumbProximal'), m: this.nb(s + 'ThumbMetacarpal') || this.nb(s + 'ThumbIntermediate') }));
    // armes
    this.sword = makeKatana(cfg.aura, env); scene.add(this.sword);
    this.saya = makeSaya(cfg.trim); scene.add(this.saya);
    this.swordDir = new V3(); this.swordPos = new V3(); this.tip = new V3(); this.bladeBase = new V3();
    // tissus
    if (cfg.coat) this.cloth = new Cloth(scene, 9, 15, 0.46, 1.08 * this.k, cfg.coat, cfg.lining);
    if (cfg.band) {
      this.rib1 = new Ribbon(scene, 9, 0.045, 0.035, cfg.band); this.rib2 = new Ribbon(scene, 8, 0.042, 0.03, cfg.band);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.009, 8, 36), new THREE.MeshToonMaterial({ color: cfg.band }));
      band.castShadow = true; scene.add(band);
      const hl = this.rest.head, eye = this.rest.leftEye || hl;
      this.acc = this.acc || [];
      this.bandMesh = band; this.bandOff = new V3(0, eye.y - hl.y + 0.03, -0.012);
      this.acc.push({ m: band, bone: 'head', off: this.bandOff, rot: new THREE.Euler(Math.PI / 2 - 0.2, 0, 0), sc: new V3(1.02, 1.12, 1) });
    }
    if (cfg.sash) {
      const s = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 8, 36), new THREE.MeshToonMaterial({ color: cfg.sash }));
      s.castShadow = true; scene.add(s); this.acc = this.acc || [];
      this.acc.push({ m: s, bone: 'hips', off: new V3(0, 0.03, 0.005), rot: new THREE.Euler(Math.PI / 2, 0, 0), sc: new V3(this.k * 1.02, this.k * 0.8, 1) });
    }
    // lueur des yeux
    const eyeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.25, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
    this.eyeGlow = [];
    for (const s of ['leftEye', 'rightEye']) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: eyeTex, color: cfg.aura, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, opacity: 0 }));
      sp.scale.setScalar(0.05); scene.add(sp); this.eyeGlow.push({ sp, bone: s });
    }
    // lumière d'aura
    this.light = new THREE.PointLight(cfg.aura, 0, 7, 2); scene.add(this.light);
    // ressorts (cheveux) : réglages d'origine
    this.joints = vrm.springBoneManager ? [...vrm.springBoneManager.joints] : [];
    this.joints.forEach(j => (j.userData0 = { g: j.settings.gravityPower, d: j.settings.gravityDir.clone(), s: j.settings.stiffness }));
    this.trail = fx.trail(cfg.aura);
    this.look = new THREE.Object3D(); scene.add(this.look);
  }

  to(name, dur = 0.2, ease = 'out', flagAt = 0) {
    const P = { ...DEF, ...POSES[name] };
    const fl = { sheath: P.sheath ? 1 : 0, grip: P.grip ? 1 : 0 };
    if (!fl.sheath && this.sheath) this.unsheath();
    for (const k of KEYS) tw(this.p, k, P[k], dur, ease, this.clk);
    if (flagAt > 0 && dur > 0) this.pend = { at: (this.clk === 'dir' ? S.dir : S.world) + dur * flagAt, fl, clk: this.clk };
    else { Object.assign(this, fl); this.pend = null; }
    return this;
  }
  set(name) { return this.to(name, 0); }
  go(x, dur = 0.3, ease = 'out', y) { tw(this, 'x', x, dur, ease, this.clk); if (y !== undefined) tw(this, 'y', y, dur, ease, this.clk); return this; }
  face(dir) { this.yaw = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
  go3(x, z, dur = 0.3, ease = 'out', y) { tw(this, 'x', x, dur, ease, this.clk); tw(this, 'z', z, dur, ease, this.clk); if (y !== undefined) tw(this, 'y', y, dur, ease, this.clk); return this; }
  show(v) { [this.root, this.sword, this.saya, this.light, this.cloth?.m1, this.cloth?.m2, this.rib1?.mesh, this.rib2?.mesh, this.trail?.mesh, ...(this.acc || []).map(a => a.m), ...this.eyeGlow.map(e => e.sp)].forEach(o => o && (o.visible = v)); this.hidden = !v; return this; }
  yawTo(t) { if (t && t.root) t = t.root.position; const d = t.clone ? t.clone().sub(this.root.position) : t; return Math.atan2(d.x, d.z); }
  faceTo(t, dur = 0) { let a = this.yawTo(t); while (a - this.yaw > Math.PI) a -= Math.PI * 2; while (a - this.yaw < -Math.PI) a += Math.PI * 2; if (dur > 0) tw(this, 'yaw', a, dur, 'inOut', this.clk); else { twKill(this, 'yaw'); this.yaw = a; } return this; }
  run(on, a = 'runA', b = 'runB', f = 2.6) { if (on) { this.cyc = { a, b, f }; tw(this, 'cycW', 1, 0.15, 'out', this.clk); } else tw(this, 'cycW', 0, 0.15, 'out', this.clk); return this; }
  get fwd() { return Math.sin(this.yaw) >= 0 ? 1 : -1; }

  // passe les paramètres de l'épée à la position « dans le fourreau » pour une sortie fluide
  unsheath() {
    const d = this.sayaDirLocal(), m = this.sayaMouthLocal();
    const g = m.clone().addScaledVector(d, -0.13);
    const k = this.k;
    twKill(this.p, 'gx'); twKill(this.p, 'gy'); twKill(this.p, 'gz'); twKill(this.p, 'az'); twKill(this.p, 'el');
    Object.assign(this.p, { gx: g.x / k, gy: g.y / k, gz: g.z / k, az: Math.atan2(d.x, d.z) / D2R, el: Math.asin(clamp(d.y, -1, 1)) / D2R });
    this.sheath = 0;
  }
  sayaDirLocal() { return new V3(0.18, -0.42, -1).normalize(); }
  sayaMouthLocal() {
    const p = this.p, k = this.k;
    return new V3(0.16 * k + p.hx * k, this.rest.hips.y + p.hy * k - 0.02 * k, 0.1 * k + p.hz * k);
  }

  tp(x, dir) {
    const from = this.x;
    twKill(this, 'x'); this.x = x; if (dir) this.face(dir);
    this.fx.teleport(this, from, x);
    this.trail.clear();
    if (this.vrm.springBoneManager) this._resetSprings = true;
  }

  eulerQ(p, y, r) { return new Q().setFromEuler(new THREE.Euler(p * D2R, y * D2R, -r * D2R, 'YXZ')); }
  setWorldQ(bone, wq) {
    bone.parent.updateWorldMatrix(true, false);
    const pq = bone.parent.getWorldQuaternion(new Q());
    bone.quaternion.copy(pq.invert().multiply(wq));
    bone.updateMatrixWorld(true);
  }
  aim(bone, child, target) {
    const bp = bone.getWorldPosition(new V3()), cp = child.getWorldPosition(new V3());
    const cur = cp.sub(bp).normalize(), des = target.clone().sub(bp).normalize();
    const dq = new Q().setFromUnitVectors(cur, des);
    const wq = bone.getWorldQuaternion(new Q()).premultiply(dq);
    this.setWorldQ(bone, wq);
  }
  ik(b1, b2, b3, target, pole) {
    const a = b1.getWorldPosition(new V3()), b = b2.getWorldPosition(new V3()), c = b3.getWorldPosition(new V3());
    const l1 = a.distanceTo(b), l2 = b.distanceTo(c);
    const toT = target.clone().sub(a); let d = toT.length();
    d = clamp(d, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3); toT.normalize();
    const toP = pole.clone().sub(a);
    let n = new V3().crossVectors(toT, toP); if (n.lengthSq() < 1e-8) n.set(0, 0, 1); n.normalize();
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const E = a.clone().addScaledVector(toT.clone().applyAxisAngle(n, A), l1);
    this.aim(b1, b2, E);
    this.aim(b2, b3, a.clone().addScaledVector(toT, d));
  }
  handQ(side, u, d) { // oriente la main pour tenir la poignée (repère racine) -> quaternion monde
    const hb = this.hb[side];
    const n2 = new V3().crossVectors(u, d).multiplyScalar(hb.sgn);
    const m0 = new THREE.Matrix4().makeBasis(hb.f, hb.i, hb.n), m1 = new THREE.Matrix4().makeBasis(u, d, n2);
    const R = new Q().setFromRotationMatrix(m1.multiply(m0.transpose()));
    return { R, n2 };
  }

  update(dt, other, cam) {
    if (this.pend && (this.pend.clk === 'dir' ? S.dir : S.world) >= this.pend.at) { Object.assign(this, this.pend.fl); this.pend = null; }
    this.fz = S.frozen && this.clk !== 'dir';
    let p = this.p; const k = this.k, root = this.root;
    let bob = 0;
    if (this.cyc && this.cycW > 0.001) {
      const A = { ...DEF, ...POSES[this.cyc.a] }, B = { ...DEF, ...POSES[this.cyc.b] }, ph = (this.clk === 'dir' ? S.dir : S.world) * this.cyc.f, s = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2), q = {};
      for (const key of KEYS) q[key] = lerp(this.p[key], lerp(A[key], B[key], s), this.cycW);
      p = q; bob = Math.abs(Math.sin(ph * Math.PI * 2)) * 0.05 * this.cycW;
      if (A.sheath !== undefined && this.cycW > 0.5) { this.sheath = A.sheath; this.grip = A.grip ? 1 : 0; }
    }
    root.rotation.set(this.rx, this.yaw, this.rz, 'YXZ');
    const piv = new V3(0, this.rest.hips.y, 0);
    root.position.set(this.x, this.y + bob, this.z).add(piv).sub(piv.clone().applyEuler(root.rotation));
    root.updateMatrixWorld(true);
    const rq = root.quaternion.clone();
    const W = v => v.clone().applyMatrix4(root.matrixWorld);
    const WD = v => v.clone().applyQuaternion(rq);
    // ---- bassin + colonne + tête
    const hips = this.nb('hips');
    const hipsW = W(new V3(p.hx * k, this.rest.hips.y + p.hy * k, this.rest.hips.z + p.hz * k));
    hips.parent.updateWorldMatrix(true, false);
    hips.position.copy(hips.parent.worldToLocal(hipsW));
    const Eh = this.eulerQ(p.hp, p.hyw, p.hr), Es = this.eulerQ(p.sp / 3, p.sy / 3, p.sr / 3), En = this.eulerQ(p.np / 2, p.ny / 2, p.nr / 2);
    let acc = rq.clone().multiply(Eh);
    this.setWorldQ(hips, acc.clone().multiply(this.restQ.hips));
    for (const n of ['spine', 'chest', 'upperChest']) { acc.multiply(Es); const b = this.nb(n); if (b) this.setWorldQ(b, acc.clone().multiply(this.restQ[n])); }
    for (const n of ['neck', 'head']) { acc.multiply(En); this.setWorldQ(this.nb(n), acc.clone().multiply(this.restQ[n])); }
    // ---- jambes
    for (const s of ['left', 'right']) {
      const L = s === 'left';
      const fx = (L ? p.flx : p.frx) * k, fz = (L ? p.flz : p.frz) * k, fy = (L ? p.fly : p.fry) * k, yawF = (L ? p.fyl : p.fyr) * D2R;
      const target = W(new V3(fx, fy + this.ankleH, fz));
      const up = this.nb(s + 'UpperLeg'), lo = this.nb(s + 'LowerLeg'), ft = this.nb(s + 'Foot');
      const kneeDir = new V3(Math.sin(yawF) * 0.9 + (L ? 0.15 : -0.15), 0, Math.cos(yawF));
      const hipP = up.getWorldPosition(new V3());
      const pole = hipP.clone().lerp(target, 0.5).add(WD(kneeDir));
      this.ik(up, lo, ft, target, pole);
      this.setWorldQ(ft, rq.clone().multiply(this.eulerQ(0, yawF / D2R, 0)).multiply(this.restQ[s + 'Foot']));
    }
    // ---- épée
    let gp, dL;
    if (this.sheath) { dL = this.sayaDirLocal(); gp = this.sayaMouthLocal().addScaledVector(dL, -0.13); }
    else {
      gp = new V3(p.gx * k, p.gy * k, p.gz * k);
      const az = p.az * D2R, el = p.el * D2R;
      dL = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    }
    let ref = new V3(0, -1, 0); if (Math.abs(dL.y) > 0.9) ref.set(0, 0, 1);
    const uL = ref.addScaledVector(dL, -ref.dot(dL)).normalize().applyAxisAngle(dL, p.rl * D2R);
    const gW = W(gp), dW = WD(dL), uW = WD(uL);
    this.swordPos.copy(gW); this.swordDir.copy(dW);
    const xA = new V3().crossVectors(dW, uW);
    this.sword.matrixAutoUpdate = true;
    this.sword.position.copy(gW);
    this.sword.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, dW, uW));
    this.sword.updateMatrixWorld(true);
    this.tip.copy(gW).addScaledVector(dW, this.broken ? 0.2 : this.sword.userData.len);
    this.bladeBase.copy(gW).addScaledVector(dW, 0.2);
    // fourreau
    const mouth = W(this.sayaMouthLocal()), sd = WD(this.sayaDirLocal());
    const sx = new V3().crossVectors(sd, WD(new V3(0, 1, 0))).normalize(), sz = new V3().crossVectors(sx, sd);
    this.saya.position.copy(mouth); this.saya.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sx, sd, sz));
    // ---- bras
    const armPole = (L, raise) => {
      const s = this.nb(L ? 'leftUpperArm' : 'rightUpperArm').getWorldPosition(new V3());
      return s.add(WD(new V3(L ? 0.55 : -0.55, lerp(-0.6, 0.1, raise), lerp(-0.35, 0.35, raise))));
    };
    const doArm = (side, targetWrist, Rh) => {
      const L = side === 'left';
      const up = this.nb(side + 'UpperArm'), lo = this.nb(side + 'LowerArm'), hd = this.nb(side + 'Hand');
      this.ik(up, lo, hd, targetWrist, armPole(L, p.epr));
      if (Rh) this.setWorldQ(hd, rq.clone().multiply(Rh).multiply(this.restQ[side + 'Hand']));
    };
    const rH = this.handQ('right', uL, dL), hbR = this.hb.right;
    const wristR = gp.clone().addScaledVector(uL, -0.05 * k).addScaledVector(rH.n2, -0.028 * k);
    const rf = this.sheath ? clamp(p.rfree, 0, 1) : 0;
    if (rf > 0.001) doArm('right', W(wristR.clone().lerp(new V3(p.rhx * k, p.rhy * k, p.rhz * k), rf)), rf > 0.5 ? null : rH.R);
    else doArm('right', W(wristR), rH.R);
    // main gauche
    const g2 = gp.clone().addScaledVector(dL, -0.105);
    const lH = this.handQ('left', uL, dL);
    const wristL2 = g2.addScaledVector(uL, -0.05 * k).addScaledVector(lH.n2, -0.028 * k);
    let freeL = new V3(p.lx * k, p.ly * k, p.lz * k);
    if (this.sheath) freeL = this.sayaMouthLocal().add(new V3(0.02, -0.03, 0.02));
    const two = this.sheath ? 0 : p.two;
    doArm('left', W(freeL.clone().lerp(wristL2, two)), two > 0.5 ? lH.R : null);
    // doigts serrés
    for (const f of this.fingers) f.b.rotation.set(0, 0, f.side === 'right' ? -1.25 : (this.openL ? 0.12 : 1.25));
    for (const t of this.thumbs) if (t.p) t.p.rotation.set(0, t.s === 'right' ? -0.6 : 0.6, t.s === 'right' ? -0.35 : 0.35);
    // regard + expressions
    if (other) { other.nb('head').getWorldPosition(this.look.position); this.vrm.lookAt && (this.vrm.lookAt.target = this.look); }
    const em = this.vrm.expressionManager;
    if (em) {
      em.setValue('angry', clamp(this.anger, 0, 1));
      em.setValue('aa', clamp(this.shout, 0, 1));
      const bl = (S.world * 0.37 + this.cfg.x) % 3.1 < 0.12 && !S.frozen ? 1 : 0;
      em.setValue('blink', this.eyesClosed ? 1 : bl * (1 - this.aura * 0.8));
    }
    // cheveux : l'aura les soulève
    for (const j of this.joints) {
      const u = j.userData0, a = clamp(this.aura, 0, 1.5);
      j.settings.gravityPower = lerp(u.g, 0.35, Math.min(1, a));
      j.settings.gravityDir.copy(u.d).lerp(WD(new V3(rand(-0.2, 0.2), 0.8, -0.6)).normalize(), Math.min(1, a) * 0.8).normalize();
    }
    if (this._resetSprings) { this.vrm.update(0); this.vrm.springBoneManager.reset(); this._resetSprings = false; }
    this.vrm.update(this.fz ? 0 : dt);
    // bandeau + rubans
    const head = this.nb('head'); head.updateWorldMatrix(true, false);
    for (const a of this.acc || []) {
      const b = this.nb(a.bone), bq = b.getWorldQuaternion(new Q()).multiply(this.restQ[a.bone].clone().invert());
      a.m.position.copy(b.getWorldPosition(new V3())).add(a.off.clone().applyQuaternion(bq));
      a.m.quaternion.copy(bq).multiply(new Q().setFromEuler(a.rot)); a.m.scale.copy(a.sc);
    }
    // ---- dynamique (tissus, traînées, particules)
    const vel = dt > 0 ? (this.x - this.prevX) / dt : 0, velz = dt > 0 ? (this.z - (this.prevZ ?? this.z)) / dt : 0; this.prevX = this.x; this.prevZ = this.z; this.vx = vel; this.vz = velz;
    const wind = new V3(-vel * 2.5 + 1.5 * Math.sin(S.world * 0.7), -9.8 + this.aura * 6, -velz * 2.5 + 0.8 * Math.sin(S.world * 1.3));
    if (this.aura > 0.5) { wind.x += rand(-8, 8) * this.aura; wind.z += rand(-8, 8) * this.aura; }
    if (this.cloth) {
      const uc = this.nb('upperChest'); uc.updateWorldMatrix(true, false);
      const anchors = [];
      for (let c = 0; c < 9; c++) {
        const t = c / 8, xx = lerp(0.2, -0.2, t) * k, zz = (-0.1 - 0.05 * Math.sin(t * Math.PI)) * k;
        anchors.push(new V3(xx, 0.13 * k, zz).applyMatrix4(uc.matrixWorld.clone().multiply(new THREE.Matrix4().makeRotationFromQuaternion(this.restQ.upperChest.clone().invert()))));
      }
      const sph = [];
      const addS = (n, r, off = 0) => { const b = this.nb(n); if (b) sph.push({ c: b.getWorldPosition(new V3()).add(WD(new V3(0, 0, off))), r: r * k }); };
      addS('hips', 0.2, -0.02); addS('spine', 0.18); addS('chest', 0.18); addS('upperChest', 0.19);
      for (const s of ['left', 'right']) {
        const u = this.nb(s + 'UpperLeg').getWorldPosition(new V3()), l = this.nb(s + 'LowerLeg').getWorldPosition(new V3()), f = this.nb(s + 'Foot').getWorldPosition(new V3());
        sph.push({ c: u.clone().lerp(l, 0.5), r: 0.12 * k }, { c: l.clone(), r: 0.09 * k }, { c: l.clone().lerp(f, 0.5), r: 0.08 * k });
      }
      this.cloth.step(this.fz ? 0 : Math.min(dt, 1 / 30), anchors, sph, wind);
    }
    if (this.rib1) {
      const back = WD(new V3(0, 0, -1)), side = WD(new V3(1, 0, 0));
      const hq = head.getWorldQuaternion(new Q()).multiply(this.restQ.head.clone().invert());
      const knot = head.getWorldPosition(new V3()).add(this.bandOff.clone().add(new V3(0, -0.01, -0.105)).applyQuaternion(hq));
      const f = wind.clone().multiplyScalar(1).add(back.clone().multiplyScalar(3));
      this.rib1.step(this.fz ? 0 : dt, knot.clone().addScaledVector(side, 0.012), side, f);
      this.rib2.step(this.fz ? 0 : dt, knot.clone().addScaledVector(side, -0.012), side, f.clone().multiplyScalar(0.8));
    }
    // lame : haki de l'armement
    const ud = this.sword.userData;
    ud.steel.color.set(this.arm > 0.5 ? 0x08080a : this.ice ? 0xbff2ff : 0xe8eef6); ud.steel.roughness = this.arm > 0.5 ? 0.35 : 0.16;
    ud.blade.scale.x = ud.blade.scale.z = this.ice ? 1.8 : 1;
    ud.glow.material.opacity = this.arm > 0.5 ? 0.55 + 0.25 * Math.sin(S.dir * 30) : this.ice ? 0.35 + 0.1 * Math.sin(S.dir * 9) : (this.holy || 0) * (0.5 + 0.2 * Math.sin(S.dir * 20));
    ud.blade.scale.y = this.broken ? 0.22 : 1; ud.glow.scale.y = this.broken ? 0.22 : 1.02;
    // yeux lumineux
    for (const e of this.eyeGlow) {
      const b = this.nb(e.bone) || this.nb('head');
      b.getWorldPosition(e.sp.position); e.sp.position.addScaledVector(WD(new V3(0, 0, 1)), 0.045);
      e.sp.material.opacity = clamp((this.aura - 0.4) * 1.2 + (this.eyeFlash || 0), 0, 1);
      e.sp.scale.setScalar(0.03 + 0.01 * Math.min(1, this.aura));
    }
    this.light.position.copy(this.nb('chest').getWorldPosition(new V3())).add(new V3(0, 0.9, 0)).addScaledVector(WD(new V3(0, 0, -1)), 0.9);
    this.light.intensity = Math.min(1.5, this.aura) * 2.2 + (this.arm > 0.5 ? 0.6 : 0);
    // traînée
    this.trail.push(this.bladeBase, this.tip, this.fz ? 0 : dt);
    this.fx.fighterFX(this, dt);
  }
  // points du corps (pour particules d'aura)
  bodyPoints() {
    return ['hips', 'spine', 'chest', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand', 'leftLowerLeg', 'rightLowerLeg', 'leftFoot', 'rightFoot', 'leftUpperArm', 'rightUpperArm']
      .map(n => this.nb(n).getWorldPosition(new V3()));
  }
}
