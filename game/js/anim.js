'use strict';
/* ---------- hand-keyed clips (authored right-footed; mirrored for the left) ----------
   Each key: [time, pose, ease]. ease: 'in' whips into the pose, 'out' snaps then settles. */
function legDrop(p) {
  const e = (f, k, ab) => (0.44 * Math.cos(f) + 0.42 * Math.cos(k - f)) * Math.cos(ab);
  return Math.max(e(p[D.lHipRx], p[D.lKn], p[D.lHipRz]), e(p[D.rHipRx], p[D.rKn], p[D.rHipRz])) - 0.86;
}
const PG = o => { const p = P(o); p[D.hipY] += legDrop(p); return p; };
const SQUAT = { lHipRx: 1.25, lKn: 1.95, rHipRx: 1.25, rKn: 1.95, pelRx: 0.4, spRx: 0.15, lShRx: 0.5, rShRx: 0.5, lEl: 0.5, rEl: 0.5, lShRz: 0.25, rShRz: 0.25 };
const CLIPS = {
  pass: { strike: 0.10, dur: 0.36, keys: [
    [0.05, PG({ rHipRx: -0.4, rKn: 0.75, rHipRy: 0.75, lHipRx: 0.3, lKn: 0.35, pelRy: -0.22, spRy: 0.1, chRy: 0.22, chRx: 0.05, lShRz: 0.6, lShRx: -0.25, lEl: 0.5, rShRx: 0.3, rShRz: 0.3, rEl: 0.6, hdRx: 0.2 }), 'out'],
    [0.10, PG({ rHipRx: 0.5, rKn: 0.18, rHipRy: 0.85, rAn: -0.3, lHipRx: -0.05, lKn: 0.3, pelRy: 0.15, chRy: -0.18, spRx: -0.05, chRx: -0.05, lShRz: 0.75, lShRx: 0.25, lEl: 0.4, rShRx: -0.35, rShRz: 0.35, rEl: 0.5, hdRx: 0.15 }), 'in'],
    [0.20, PG({ rHipRx: 0.75, rKn: 0.3, rHipRy: 0.7, lHipRx: -0.15, lKn: 0.22, pelRy: 0.25, chRy: -0.25, lShRz: 0.55, lShRx: 0.4, rShRx: -0.4, rShRz: 0.3, lEl: 0.5, rEl: 0.5 }), 'out']] },
  shot: { strike: 0.19, dur: 0.68, keys: [
    [0.08, PG({ lHipRx: 0.45, lKn: 0.5, rHipRx: -0.85, rKn: 1.8, rAn: 0.5, pelRy: -0.5, pelRz: -0.16, pelRx: -0.05, spRx: -0.14, chRx: -0.22, spRy: 0.35, chRy: 0.3, lShRz: 1.35, lShRy: -0.45, lEl: 0.25, rShRx: 0.45, rShRz: 0.3, rEl: 0.9, hdRx: 0.28 }), 'out'],
    [0.19, PG({ lHipRx: 0.1, lKn: 0.4, rHipRx: 0.62, rKn: 0.3, rAn: 0.6, pelRy: 0.28, pelRz: -0.22, pelRx: 0.05, spRx: 0.1, chRx: 0.2, spRy: -0.3, chRy: -0.32, lShRz: 0.9, lShRy: 0.5, lShRx: 0.3, lEl: 0.5, rShRx: -0.75, rShRz: 0.55, rEl: 0.5, hdRx: 0.3 }), 'in'],
    [0.31, P({ rootY: 0.1, lHipRx: -0.3, lKn: 0.35, lAn: 0.5, rHipRx: 1.4, rKn: 0.35, rHipRz: -0.2, pelRy: 0.5, pelRz: -0.1, spRx: 0.18, chRx: 0.3, spRy: -0.35, chRy: -0.35, lShRz: 0.5, lShRy: 0.9, lShRx: 0.7, lEl: 0.9, rShRx: -1.0, rShRz: 0.7, rEl: 0.3, hdRx: 0.1 }), 'out'],
    [0.47, PG({ rHipRx: 0.5, rKn: 0.55, lHipRx: -0.45, lKn: 0.9, pelRy: 0.2, chRy: -0.15, chRx: 0.15, lShRx: 0.3, rShRx: -0.3, lEl: 0.7, rEl: 0.7, lShRz: 0.3, rShRz: 0.3 })]] },
  loft: { strike: 0.17, dur: 0.6, keys: [
    [0.07, PG({ lHipRx: 0.4, lKn: 0.45, rHipRx: -0.7, rKn: 1.5, rAn: 0.5, pelRy: -0.42, pelRz: -0.2, spRx: -0.1, chRx: -0.15, spRy: 0.3, chRy: 0.25, lShRz: 1.3, lShRy: -0.35, lEl: 0.25, rShRx: 0.4, rShRz: 0.3, rEl: 0.8, hdRx: 0.28 }), 'out'],
    [0.17, PG({ lHipRx: 0.05, lKn: 0.35, rHipRx: 0.7, rKn: 0.2, rAn: 0.45, rHipRy: 0.3, pelRy: 0.25, pelRz: -0.3, pelRx: -0.12, spRx: -0.15, chRx: -0.12, spRy: -0.2, chRy: -0.2, lShRz: 1.2, lShRy: 0.1, lEl: 0.3, rShRx: -0.6, rShRz: 0.6, rEl: 0.4, hdRx: 0.2 }), 'in'],
    [0.30, PG({ lHipRx: -0.1, lKn: 0.3, rHipRx: 1.25, rKn: 0.2, rHipRz: -0.3, pelRy: 0.45, pelRx: -0.15, pelRz: -0.18, chRx: -0.05, spRy: -0.3, chRy: -0.25, lShRz: 1.0, lShRy: 0.6, lEl: 0.4, rShRx: -0.9, rShRz: 0.8, rEl: 0.3 }), 'out']] },
  header: { strike: 0.2, dur: 0.62, jump: [0.07, 0.46, 0.6], keys: [
    [0.07, PG({ lHipRx: 0.7, lKn: 1.2, rHipRx: 0.7, rKn: 1.2, pelRx: 0.25, spRx: 0.15, lShRx: -0.7, rShRx: -0.7, lEl: 0.6, rEl: 0.6, lShRz: 0.2, rShRz: 0.2 }), 'out'],
    [0.15, P({ lHipRx: -0.25, lKn: 0.9, rHipRx: -0.1, rKn: 0.7, pelRx: -0.12, spRx: -0.28, chRx: -0.3, hdRx: -0.3, lShRx: -0.5, rShRx: -0.3, lShRz: 1.1, rShRz: 1.0, lEl: 0.7, rEl: 0.8, lAn: 0.6, rAn: 0.6 }), 'out'],
    [0.20, P({ lHipRx: 0.5, lKn: 0.5, rHipRx: 0.4, rKn: 0.6, pelRx: 0.1, spRx: 0.28, chRx: 0.38, hdRx: 0.4, lShRx: 0.4, rShRx: 0.5, lShRz: 0.7, rShRz: 0.7, lEl: 1.0, rEl: 1.0 }), 'in'],
    [0.34, P({ lHipRx: 0.2, lKn: 0.3, rHipRx: 0.3, rKn: 0.4, chRx: 0.15, lShRz: 0.5, rShRz: 0.5, lEl: 0.6, rEl: 0.6 })],
    [0.48, PG({ lHipRx: 0.5, lKn: 0.9, rHipRx: 0.5, rKn: 0.9, pelRx: 0.2, lShRz: 0.4, rShRz: 0.4, lEl: 0.5, rEl: 0.5 })]] },
  tackle: { strike: 0.1, dur: 0.44, keys: [
    [0.10, PG({ rHipRx: 1.0, rKn: 0.1, rAn: -0.2, lHipRx: -0.35, lKn: 0.85, pelRy: 0.35, spRy: -0.3, chRy: -0.2, pelRx: -0.1, chRx: 0.05, lShRz: 0.8, lShRx: -0.5, rShRz: 0.7, rShRx: 0.5, lEl: 0.5, rEl: 0.4 }), 'out'],
    [0.26, PG({ rHipRx: 0.9, rKn: 0.2, lHipRx: -0.3, lKn: 0.8, pelRy: 0.3, spRy: -0.25, chRy: -0.15, lShRz: 0.7, lShRx: -0.4, rShRz: 0.6, rShRx: 0.4, lEl: 0.5, rEl: 0.4 })]] },
  slide: { strike: 0.18, dur: 1.2, in: 0.1, out: 0.22, keys: [
    [0.14, P({ rootRx: -0.8, rHipRx: 0.5, rKn: 0.1, lHipRx: 0.8, lKn: 1.4, pelRy: 0.2, spRx: 0.3, chRx: 0.3, lShRx: -0.5, lShRz: 0.5, lEl: 0.3, rShRx: 0.6, rShRz: 0.8, rEl: 0.5 }), 'out'],
    [0.28, P({ rootRx: -1.36, rHipRx: 0.14, rKn: 0.05, rAn: -0.4, lHipRx: 0.9, lKn: 1.9, lHipRz: 0.3, pelRy: 0.3, pelRz: 0.25, spRx: 0.45, chRx: 0.5, spRy: -0.2, hdRx: 0.3, lShRx: -0.6, lShRz: 0.5, lEl: 0.2, rShRx: 0.9, rShRz: 0.8, rEl: 0.5 }), 'out'],
    [0.66, P({ rootRx: -1.3, rHipRx: 0.2, rKn: 0.2, rAn: -0.3, lHipRx: 0.9, lKn: 1.8, lHipRz: 0.3, pelRy: 0.2, pelRz: 0.2, spRx: 0.5, chRx: 0.55, hdRx: 0.3, lShRx: -0.5, lShRz: 0.5, lEl: 0.3, rShRx: 0.6, rShRz: 0.6, rEl: 0.6 })],
    [0.94, PG(SQUAT)]] },
  fall: { dur: 1.55, in: 0.1, out: 0.25, keys: [
    [0.2, P({ rootRx: 0.9, lHipRx: 0.5, lKn: 0.9, rHipRx: -0.2, rKn: 0.6, lShRx: 1.6, rShRx: 1.4, lEl: 0.5, rEl: 0.6, lShRz: 0.4, rShRz: 0.4, hdRx: -0.3, chRx: 0.1 }), 'in'],
    [0.38, P({ rootRx: 1.45, rootY: 0.07, lShRx: 2.6, rShRx: 2.4, lEl: 0.6, rEl: 0.8, lShRz: 0.3, rShRz: 0.4, hdRx: -0.4, lKn: 0.3, rKn: 0.5 }), 'out'],
    [0.95, P({ rootRx: 1.45, rootY: 0.07, lShRx: 2.5, rShRx: 2.2, lEl: 0.9, rEl: 1.0, lShRz: 0.4, rShRz: 0.5, hdRx: -0.3, lKn: 0.2, rKn: 0.7 })],
    [1.28, PG({ rootRx: 0.3, lHipRx: 1.3, lKn: 2.0, rHipRx: 0.6, rKn: 1.6, pelRx: 0.3, lShRx: 0.8, rShRx: 0.8, lEl: 0.3, rEl: 0.3 })]] },
  stumble: { dur: 0.52, keys: [
    [0.12, PG({ pelRx: 0.35, spRx: 0.2, chRx: 0.2, lShRx: 0.9, rShRx: -0.5, lShRz: 0.7, rShRz: 0.8, lEl: 0.5, rEl: 0.5, hdRx: -0.2, lHipRx: 0.9, lKn: 1.0, rHipRx: -0.4, rKn: 0.5 }), 'out'],
    [0.30, PG({ pelRx: 0.2, chRx: 0.1, rHipRx: 0.7, rKn: 0.8, lHipRx: -0.2, lKn: 0.4, lShRx: -0.4, rShRx: 0.7, lShRz: 0.6, rShRz: 0.6, lEl: 0.6, rEl: 0.6 })]] },
  dive: { strike: 0.3, dur: 1.3, in: 0.06, out: 0.25, jump: [0.08, 0.5, 0.35], keys: [   // dives to the player's left
    [0.10, PG({ rootRz: -0.5, lHipRx: 0.3, lKn: 0.6, lHipRz: 0.3, rHipRx: 0.2, rKn: 0.9, lShRz: 1.6, rShRz: 0.4, rShRx: 0.9, rShRy: 0.8, lEl: 0.4, rEl: 0.6, spRz: -0.2, chRz: -0.2 }), 'out'],
    [0.30, P({ rootRz: -1.38, lShRz: 2.9, lEl: 0.05, rShRz: 2.7, rEl: 0.1, lHipRx: 0.1, lKn: 0.25, rHipRx: 0.7, rKn: 1.2, spRz: -0.15, chRz: -0.12, hdRz: -0.2 }), 'out'],
    [0.55, P({ rootRz: -1.5, rootY: 0.1, lShRz: 2.6, rShRz: 2.2, rShRx: 0.5, lEl: 0.3, rEl: 0.5, lKn: 0.4, rHipRx: 0.5, rKn: 0.9 })],
    [0.80, P({ rootRz: -1.5, rootY: 0.1, lShRz: 2.2, rShRz: 1.6, rShRx: 0.7, lEl: 0.6, rEl: 0.8, lKn: 0.5, rHipRx: 0.7, rKn: 1.1 })],
    [1.05, PG(Object.assign({ rootRz: -0.15 }, SQUAT))]] },
  catchUp: { strike: 0.16, dur: 0.5, jump: [0.05, 0.42, 0.3], keys: [
    [0.16, P({ lShRx: 2.7, rShRx: 2.7, lEl: 0.25, rEl: 0.25, lShRy: 0.2, rShRy: 0.2, chRx: -0.12, hdRx: -0.25, lKn: 0.4, rKn: 0.7, rHipRx: 0.5 }), 'out'],
    [0.36, P({ lShRx: 1.2, rShRx: 1.2, lEl: 1.5, rEl: 1.5, lShRy: 0.5, rShRy: 0.5, chRx: 0.15, lKn: 0.3, rKn: 0.3 })]] },
  throwIn: { strike: 0.3, dur: 0.62, in: 0.05, keys: [
    [0.16, PG({ spRx: -0.3, chRx: -0.32, pelRx: -0.1, lShRx: 3.2, rShRx: 3.2, lEl: 1.3, rEl: 1.3, lHipRx: 0.3, lKn: 0.3, rHipRx: -0.3, rKn: 0.3 }), 'out'],
    [0.30, PG({ spRx: 0.25, chRx: 0.35, pelRx: 0.1, lShRx: 2.0, rShRx: 2.0, lEl: 0.15, rEl: 0.15, lHipRx: 0.35, lKn: 0.35, rHipRx: -0.35, rKn: 0.2, rAn: 0.5 }), 'in'],
    [0.44, PG({ chRx: 0.3, spRx: 0.15, lShRx: 1.0, rShRx: 1.0, lEl: 0.3, rEl: 0.3, lHipRx: 0.3, lKn: 0.35, rHipRx: -0.2, rKn: 0.3 })]] },
  punch: { dur: 1.05, jump: [0.2, 0.8, 0.55], keys: [
    [0.17, PG({ lHipRx: 0.8, lKn: 1.3, rHipRx: 0.8, rKn: 1.3, pelRx: 0.3, lShRx: -0.6, rShRx: -0.6, lEl: 0.9, rEl: 0.9 }), 'out'],
    [0.42, P({ lHipRx: -0.2, lKn: 1.3, rHipRx: 0.3, rKn: 1.5, spRx: -0.2, chRx: -0.2, hdRx: -0.25, rShRx: 2.9, rEl: 0.3, lShRx: -0.3, lShRz: 0.4, lEl: 1.6, chRy: -0.3, pelRy: 0.2 }), 'out'],
    [0.62, P({ lHipRx: 0.1, lKn: 0.8, rHipRx: 0.3, rKn: 0.9, chRx: -0.1, rShRx: 2.6, rEl: 0.7, lShRx: -0.2, lShRz: 0.4, lEl: 1.4, chRy: -0.2 })],
    [0.84, PG({ lHipRx: 0.6, lKn: 1.0, rHipRx: 0.6, rKn: 1.0, pelRx: 0.2, rShRx: 1.2, rEl: 1.4, lShRz: 0.4, lEl: 1.0 })]] }
};
const ZERO = newPose();
function sampleClip(c, t, out) {
  const k = c.keys; let i = 0;
  while (i < k.length && k[i][0] <= t) i++;
  const a = i === 0 ? ZERO : k[i - 1][1], t0 = i === 0 ? 0 : k[i - 1][0];
  if (i >= k.length) { out.set(a); return out; }
  let x = (t - t0) / (k[i][0] - t0); const e = k[i][2];
  x = e === 'in' ? x * x : e === 'out' ? 1 - (1 - x) * (1 - x) * (1 - x) : x * x * (3 - 2 * x);
  return mixPose(out, a, k[i][1], x);
}
function newAnim() {
  return { phase: rnd(6.28), t: rnd(10), clip: null, ct: 0, mir: false, jumpH: 0, lean: 0, leanV: 0, bank: 0, bankV: 0, look: 0, crouch: 0, arms: 0, loco: newPose(), tmp: newPose(), pose: newPose() };
}
function playClip(p, name, mir = false, jumpH) {
  const a = p.an, c = CLIPS[name];
  a.clip = c; a.clipName = name; a.ct = 0; a.mir = mir; a.jumpH = jumpH !== undefined ? jumpH : (c.jump ? c.jump[2] : 0);
  return c;
}

/* ---------- procedural locomotion: the torso does the talking ----------
   Hips twist with the stride, shoulders counter-twist against them, the head stays quiet,
   and the whole body leans along its own acceleration (into cuts, back on the brakes). */
function locoPose(o, p, dt) {
  const a = p.an, sp = p.speed, u = clamp(sp / 7.4, 0, 1.1), w = sstep(0.15, 1.4, sp);
  const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
  let fz = 1, fx = 0;
  if (sp > 0.3) { fz = (p.vel.x * sy + p.vel.z * cy) / sp; fx = (p.vel.x * cy - p.vel.z * sy) / sp; }
  const ball = p.hasBall ? 1 : 0;
  const step = lerp(0.5, 1.55, u) * (1 - 0.14 * ball) * (0.6 + 0.4 * Math.abs(fz));
  a.phase = (a.phase + sp * dt * Math.PI / step) % (Math.PI * 2);
  a.t += dt;
  const ph = a.phase, s = Math.sin(ph), c = Math.cos(ph), dir = fz < -0.25 ? -1 : 1;
  o.fill(0);
  // legs
  const A = lerp(0.3, 0.95, u) * w, bias = (0.08 + 0.24 * u) * w, K = (0.5 + 1.3 * u) * (0.45 + 0.55 * Math.abs(fz)) * w;
  const rc = Math.cos(ph - 0.4) * dir, recR = Math.pow(Math.max(0, rc), 1.2), recL = Math.pow(Math.max(0, -rc), 1.2);
  o[D.rHipRx] = bias + A * s * fz; o[D.lHipRx] = bias - A * s * fz;
  o[D.rHipRz] = 0.05 - 0.5 * A * s * fx; o[D.lHipRz] = 0.05 - 0.5 * A * s * fx;
  o[D.rKn] = 0.2 * w + recR * K; o[D.lKn] = 0.2 * w + recL * K;
  o[D.rAn] = (0.1 + 0.6 * recR - 0.25 * Math.max(0, s * fz)) * w; o[D.lAn] = (0.1 + 0.6 * recL - 0.25 * Math.max(0, -s * fz)) * w;
  // pelvis: twist with the leading leg, drop on the swing side, bob twice per stride
  const pelRy = (0.1 + 0.13 * u) * s * fz * w, pelRz = (0.05 + 0.035 * u) * c * w;
  o[D.pelRy] = pelRy; o[D.pelRz] = pelRz;
  o[D.hipX] = 0.02 * c * w;
  const runY = -(0.025 + 0.035 * u) * Math.cos(2 * ph) - 0.025 * u;
  // shoulders against hips
  const tw = (0.17 + 0.22 * u) * s * fz * w;
  o[D.spRy] = -pelRy - tw * 0.45; o[D.chRy] = -tw * 0.55; o[D.hdRy] = tw * 0.85;
  o[D.spRz] = -pelRz * 0.6; o[D.chRz] = -pelRz * 0.9; o[D.hdRz] = pelRz * 0.5;
  o[D.chRx] = 0.025 * Math.sin(2 * ph + 0.6) * w * u;
  // arms opposite the legs, forearm crossing the chest on the way up
  const armA = (0.35 + 0.62 * u) * w, eb = lerp(0.28, 1.4, w * (0.5 + 0.5 * u)) - 0.3 * ball * w;
  o[D.lShRx] = armA * s * fz + 0.04; o[D.rShRx] = -armA * s * fz + 0.04;
  o[D.lEl] = eb + 0.35 * s * w; o[D.rEl] = eb - 0.35 * s * w;
  o[D.lShRz] = o[D.rShRz] = 0.11 + 0.08 * u + 0.24 * ball * w;
  o[D.lShRy] = 0.12 + 0.32 * Math.max(0, s) * w; o[D.rShRy] = 0.12 + 0.32 * Math.max(0, -s) * w;
  // lean = posture for the speed + spring driven by real acceleration (overshoots a touch, like weight)
  const tl = clamp(p.accF * 0.017, -0.3, 0.3), tb = clamp(-p.accL * 0.021, -0.42, 0.42);
  a.leanV += ((tl - a.lean) * 95 - a.leanV * 13) * dt; a.lean += a.leanV * dt;
  a.bankV += ((tb - a.bank) * 95 - a.bankV * 13) * dt; a.bank += a.bankV * dt;
  // crouch: ready stance when the ball is close, keeper set position
  a.crouch = damp(a.crouch, p.ready || 0, 6, dt);
  const q = a.crouch * (1 - w * 0.75);
  const L = (0.05 + 0.2 * u * u) * w * Math.max(0, fz) + a.lean + 0.08 * ball * w + 0.2 * q;
  o[D.pelRx] = 0.45 * L; o[D.spRx] = 0.3 * L; o[D.chRx] += 0.25 * L; o[D.hdRx] = -0.45 * L + 0.24 * ball;
  o[D.rootRz] = a.bank;
  // idle layer: breathing, slow weight shift
  const iw = 1 - w, br = Math.sin(a.t * 1.7), sway = Math.sin(a.t * 0.6);
  o[D.chRx] += 0.02 * br * iw; o[D.pelRz] += 0.025 * sway * iw; o[D.hipX] += 0.015 * sway * iw;
  o[D.lHipRz] += 0.05 * iw + 0.16 * q; o[D.rHipRz] += 0.05 * iw + 0.16 * q;
  o[D.lHipRx] += 0.07 * iw + 0.42 * q; o[D.rHipRx] += 0.07 * iw + 0.42 * q;
  o[D.lKn] += 0.14 * iw + 0.6 * q; o[D.rKn] += 0.14 * iw + 0.6 * q;
  o[D.lAn] -= 0.18 * q; o[D.rAn] -= 0.18 * q;
  o[D.lShRz] += 0.28 * q; o[D.rShRz] += 0.28 * q; o[D.lEl] += 0.45 * q; o[D.rEl] += 0.45 * q;
  o[D.lShRx] += 0.2 * q; o[D.rShRx] += 0.2 * q;
  o[D.hipY] = lerp(legDrop(o) + 0.012 * Math.abs(Math.sin(a.t * 5.5)) * q, runY, w);
  // eyes on the ball: head leads, chest follows a little
  a.look = damp(a.look, clamp(p.lookYaw || 0, -1.15, 1.15), 9, dt);
  o[D.hdRy] += 0.62 * a.look; o[D.chRy] += 0.2 * a.look; o[D.spRy] += 0.08 * a.look;
  // moods
  const m = p.mood; a.arms = damp(a.arms, m ? 1 : 0, 8, dt);
  if (a.arms > 0.01 && (m || a.lastMood)) {
    const k = a.arms, mm = m || a.lastMood; a.lastMood = mm;
    const set = (n, v) => { o[D[n]] = lerp(o[D[n]], v, k); };
    if (mm === 'plane') { for (const sd of 'lr') { set(sd + 'ShRz', 1.45); set(sd + 'ShRx', 0); set(sd + 'El', 0.1); set(sd + 'ShRy', 0); } o[D.chRx] -= 0.12 * k; o[D.hdRx] -= 0.15 * k; }
    else if (mm === 'cheer') { const pu = 0.25 * Math.sin(a.t * 9); for (const sd of 'lr') { set(sd + 'ShRx', 2.6 + pu); set(sd + 'El', 0.5 - pu); set(sd + 'ShRz', 0.3); } o[D.hdRx] -= 0.15 * k; }
    else if (mm === 'sad') { for (const sd of 'lr') { set(sd + 'ShRz', 0.55 * iw + 0.1); set(sd + 'El', 1.5 * iw + 0.3); set(sd + 'ShRy', 0.9 * iw); } o[D.hdRx] += 0.45 * k; o[D.chRx] += 0.14 * k; }
    else if (mm === 'hold') { for (const sd of 'lr') { set(sd + 'ShRx', 0.75); set(sd + 'El', 1.5); set(sd + 'ShRy', 0.55); set(sd + 'ShRz', 0.15); } }
    else if (mm === 'over') { for (const sd of 'lr') { set(sd + 'ShRx', 2.9); set(sd + 'El', 0.9); set(sd + 'ShRy', 0.3); set(sd + 'ShRz', 0.1); } o[D.spRx] -= 0.1 * k; o[D.chRx] -= 0.12 * k; }
    else if (mm === 'set') { for (const sd of 'lr') { set(sd + 'ShRx', 0.5); set(sd + 'ShRz', 0.6); set(sd + 'El', 0.75); } }
  }
  return o;
}

function animate(p, dt) {
  const a = p.an;
  locoPose(a.loco, p, dt);
  const c = a.clip;
  if (c) {
    a.ct += dt;
    if (a.ct >= c.dur) { a.clip = null; a.pose.set(a.loco); }
    else {
      sampleClip(c, a.ct, a.tmp);
      if (c.jump) { const x = clamp((a.ct - c.jump[0]) / (c.jump[1] - c.jump[0]), 0, 1); a.tmp[D.rootY] += a.jumpH * 4 * x * (1 - x); }
      if (a.mir) mirrorPose(a.tmp);
      const wi = sstep(0, c.in || 0.07, a.ct), wo = 1 - sstep(c.dur - (c.out || 0.18), c.dur, a.ct);
      mixPose(a.pose, a.loco, a.tmp, Math.min(wi, wo));
    }
  } else a.pose.set(a.loco);
  applyPose(p.rig, a.pose);
}
