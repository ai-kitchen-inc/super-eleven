'use strict';
/* ---------- clubs (all invented), squads, ball & player physics, kicks, tackles ---------- */
const CLUBS = [
  { name: 'Port Azul', short: 'AZU', shirt: 0x1f4fd1, shorts: 0xf4f4f4, socks: 0x1f4fd1, num: '#ffffff', css: '#2c5fe0' },
  { name: 'Redmoor Town', short: 'RED', shirt: 0xc8242b, shorts: 0x1a1a22, socks: 0xc8242b, num: '#ffffff', css: '#d2333a' },
  { name: 'Kumo SC', short: 'KUM', shirt: 0xf1f1ec, shorts: 0x1b2a5c, socks: 0xf1f1ec, num: '#1b2a5c', css: '#e9e9e2' },
  { name: 'Verdant Athletic', short: 'VER', shirt: 0x14a05a, shorts: 0xf2f2f2, socks: 0x0c6b3b, num: '#ffffff', css: '#18b566' },
  { name: 'Solano Gold', short: 'SOL', shirt: 0xf0b41c, shorts: 0x232a3d, socks: 0xf0b41c, num: '#161616', css: '#f0b41c' },
  { name: 'Nachtberg 09', short: 'NAC', shirt: 0x2a2a38, shorts: 0x2a2a38, socks: 0xd9d9d9, num: '#f0b41c', css: '#6b6b85' }
];
const SURNAMES = ['Aldren', 'Vasko', 'Moriya', 'Tanabe', 'Okoro', 'Lindqvist', 'Ferro', 'Castel', 'Dumont', 'Brandt', 'Kovar', 'Sorel', 'Ibarra', 'Mwangi', 'Petrov', 'Halloran', 'Nakase', 'Reyes', 'Adebayo', 'Weller', 'Kaneda', 'Marchetti', 'Osei', 'Delacroix', 'Varga', 'Fujita', 'Sandoval', 'Eriksen', 'Baptiste', 'Kowal', 'Tachi', 'Morrow', 'Zubiri', 'Lindo', 'Hartmann', 'Ogawa', 'Pires', 'Novak', 'Achebe', 'Rinaldi', 'Sato', 'Becker', 'Quiroga', 'Ishida'];
const FORM = [['GK', -50, 0, 1], ['DF', -32, -22, 2], ['DF', -35, -7.5, 5], ['DF', -35, 7.5, 4], ['DF', -32, 22, 3],
  ['MF', -12, -24, 7], ['MF', -15, -8, 8], ['MF', -15, 8, 6], ['MF', -12, 24, 11], ['FW', 8, -8, 9], ['FW', 8, 8, 10]];
const SKIN = [0xf1c9a5, 0xe0b088, 0xc68f62, 0x9a6540, 0x6b4630], HAIR = [0x1a1410, 0x2e1c10, 0x5d4020, 0xb8923f, 0x0d0d0d, 0x7a3b1c];
const M = { teams: [], players: [], ball: null, owner: null, lastTouch: null, passTarget: null, ctrl: null, userTeam: 0, state: 'menu', diff: 1 };

function buildMatch(ci, cj) {
  for (const p of M.players) { World.scene.remove(p.rig.root); World.scene.remove(p.rig.shadow); }
  M.players = []; M.teams = [];
  const names = SURNAMES.slice().sort(() => Math.random() - 0.5);
  [ci, cj].forEach((c, ti) => {
    const club = CLUBS[c], team = { id: ti, club, dir: ti === 0 ? 1 : -1, score: 0, players: [] };
    const gkKit = { shirt: ti === 0 ? 0x2fd08a : 0xe86a1f, shorts: 0x15151c, socks: ti === 0 ? 0x2fd08a : 0xe86a1f, num: '#111' };
    FORM.forEach((f, i) => {
      const gk = f[0] === 'GK';
      const look = { skin: SKIN[Math.random() * SKIN.length | 0], hair: HAIR[Math.random() * HAIR.length | 0], boots: Math.random() < 0.7 ? 0x111111 : [0xf2f2f2, 0xd9301c, 0x2a6be0][Math.random() * 3 | 0], gk };
      const rig = makeRig(gk ? gkKit : club, look, f[3]);
      World.scene.add(rig.root); World.scene.add(rig.shadow);
      const p = {
        team, idx: i, num: f[3], name: names.pop(), role: f[0], base: { x: f[1], z: f[2] },
        pos: { x: f[1] * team.dir, z: f[2] }, vel: { x: 0, z: 0 }, yaw: team.dir > 0 ? Math.PI / 2 : -Math.PI / 2, speed: 0, accF: 0, accL: 0,
        want: { x: 0, z: 0, sprint: false, face: null }, tgt: { x: 0, z: 0 },
        attr: { spd: rnd(0.94, 1.04) + (f[0] === 'FW' ? 0.02 : 0), sht: rnd(0.6, 1) + (f[0] === 'FW' ? 0.15 : 0), tck: rnd(0.7, 1) + (f[0] === 'DF' ? 0.12 : 0) },
        left: Math.random() < 0.22, an: newAnim(), rig, hasBall: false, lookYaw: 0, ready: 0, mood: null,
        lock: 0, state: 'run', stT: 0, kick: null, noBall: 0, buffer: null, frozen: false, ai: { think: rnd(0.3), jx: 0, jz: 0, jt: 0 }
      };
      team.players.push(p); M.players.push(p);
    });
    M.teams.push(team);
  });
  M.ball = { x: 0, y: BALL_R, z: 0, vx: 0, vy: 0, vz: 0, held: false, inNet: false, shot: false, rot: new THREE.Quaternion(), air: false };
  M.owner = null; M.lastTouch = null; M.passTarget = null;
}
const fwd = p => ({ x: Math.sin(p.yaw), z: Math.cos(p.yaw) });
const opp = team => M.teams[1 - team.id];
const goalX = team => team.dir * FL;            // the goal this team attacks
const isUser = p => p.team.id === M.userTeam;

/* ---------- player movement: acceleration-limited, body turns toward intent first ---------- */
function movePlayer(p, dt) {
  const w = p.want; let top = 0, wx = w.x, wz = w.z;
  const wl = hyp(wx, wz);
  if (wl > 0.05 && !p.frozen) {
    top = (w.sprint ? 7.45 : 5.5) * p.attr.spd * (p.hasBall ? 0.93 : 1) * Math.min(1, wl) * (p.kick ? 0.55 : 1) * (w.slow || 1);
    if (!isUser(p)) top *= [0.93, 0.97, 1.0][M.diff];
    wx /= wl; wz /= wl;
  }
  let ax = 0, az = 0;
  if (p.state === 'run') {
    const dvx = wx * top - p.vel.x, dvz = wz * top - p.vel.z, dv = hyp(dvx, dvz);
    const braking = top < p.speed - 0.2 || (p.vel.x * wx + p.vel.z * wz) < 0;
    const lim = (braking ? 27 : 19) * dt, k = dv > lim ? lim / dv : 1;
    ax = dvx * k / dt; az = dvz * k / dt;
    p.vel.x += dvx * k; p.vel.z += dvz * k;
  } else {                                        // sliding / down: friction only
    const s = hyp(p.vel.x, p.vel.z), ns = Math.max(0, s - (p.state === 'slide' ? 9 : p.state === 'dive' ? (p.stT > 0.75 ? 0 : 14) : 16) * dt);
    if (s > 0) { p.vel.x *= ns / s; p.vel.z *= ns / s; }
  }
  p.pos.x = clamp(p.pos.x + p.vel.x * dt, -FL - 5, FL + 5); p.pos.z = clamp(p.pos.z + p.vel.z * dt, -FW - 4, FW + 4);
  p.speed = hyp(p.vel.x, p.vel.z);
  const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
  p.accF = damp(p.accF, ax * sy + az * cy, 14, dt); p.accL = damp(p.accL, ax * cy - az * sy, 14, dt);
  if (p.state === 'run') {
    let ty = null;
    if (p.kick && p.kick.face != null) ty = p.kick.face;
    else if (w.face !== null && w.face !== undefined) ty = w.face;
    else if (wl > 0.05 && !p.frozen) ty = Math.atan2(wx, wz);
    else if (p.speed > 1) ty = Math.atan2(p.vel.x, p.vel.z);
    if (ty !== null) {
      const rate = (p.kick ? 16 : lerp(13, 7.5, clamp(p.speed / 7.4, 0, 1))) * dt;
      p.yaw = wrapPi(p.yaw + clamp(wrapPi(ty - p.yaw), -rate, rate));
    }
  }
  if (p.lock > 0) p.lock -= dt;
  if (p.noBall > 0) p.noBall -= dt;
  if (p.state !== 'run') { p.stT -= dt; if (p.stT <= 0) p.state = 'run'; }
  const B = M.ball;
  p.lookYaw = wrapPi(Math.atan2(B.x - p.pos.x, B.z - p.pos.z) - p.yaw);
  if (Math.abs(p.lookYaw) > 2.2) p.lookYaw = 0;
}
function separate() {
  const P = M.players;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const a = P[i], b = P[j], dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = hyp(dx, dz);
    if (d < 0.62 && d > 0.001 && !a.frozen && !b.frozen) { const k = (0.62 - d) / d * 0.5; a.pos.x -= dx * k; a.pos.z -= dz * k; b.pos.x += dx * k; b.pos.z += dz * k; }
  }
}

/* ---------- ball ---------- */
function giveBall(p, held = false) {
  const B = M.ball; M.owner = p; p.hasBall = true; B.held = held; B.shot = false; B.air = false;
  for (const q of M.players) if (q !== p) q.hasBall = false;
  M.lastTouch = p; M.passTarget = null; p.ai.got = M.time;
  if (isUser(p)) M.ctrl = p;
}
function looseBall() { if (M.owner) M.owner.hasBall = false; M.owner = null; M.ball.held = false; }
function spinBall(dx, dz) {
  const B = M.ball, d = hyp(dx, dz); if (d < 1e-5) return;
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(dz / d, 0, -dx / d), d / BALL_R * 0.8);
  B.rot.premultiply(q);
}
function stepBall(dt) {
  const B = M.ball, o = M.owner;
  if (o) {                                         // at feet (touch rhythm) or in hands
    const f = fwd(o), u = clamp(o.speed / 7.4, 0, 1), px = B.x, pz = B.z;
    if (B.held) {
      const over = o.mood === 'over';
      B.x = o.pos.x + f.x * (over ? -0.05 : 0.34); B.z = o.pos.z + f.z * (over ? -0.05 : 0.34);
      B.y = damp(B.y, over ? 2.08 : 1.2, 14, dt);
    } else {
      const ahead = 0.46 + 0.42 * u + 0.16 * u * Math.cos(o.an.phase * 2), side = (o.left ? 1 : -1) * 0.1;
      const tx = o.pos.x + f.x * ahead + f.z * side, tz = o.pos.z + f.z * ahead - f.x * side, r = lerp(22, 13, u);
      B.x = damp(B.x, tx, r, dt); B.z = damp(B.z, tz, r, dt); B.y = damp(B.y, BALL_R, 20, dt);
      spinBall(B.x - px, B.z - pz);
    }
    B.vx = (B.x - px) / dt; B.vz = (B.z - pz) / dt; B.vy = 0;
    return null;
  }
  const px = B.x, pz = B.z;
  if (B.y > BALL_R + 0.005 || Math.abs(B.vy) > 0.3) {
    B.vy -= GRAV * dt; const dr = 1 - 0.1 * dt; B.vx *= dr; B.vz *= dr;
    B.y += B.vy * dt;
    if (B.y < BALL_R) {
      B.y = BALL_R;
      if (B.vy < -1.6) { B.vy = -B.vy * 0.58; B.vx *= 0.8; B.vz *= 0.8; Sfx.bounce(); } else B.vy = 0;
    }
  } else {
    const s = hyp(B.vx, B.vz), ns = Math.max(0, s - (1.6 + 0.35 * s) * dt);
    if (s > 0) { B.vx *= ns / s; B.vz *= ns / s; } B.vy = 0; B.y = BALL_R;
  }
  B.x += B.vx * dt; B.z += B.vz * dt; spinBall(B.x - px, B.z - pz);
  if (B.inNet) {                                   // dies in the net
    const s = Math.sign(B.x); B.vx *= 1 - 6 * dt; B.vz *= 1 - 6 * dt;
    if (Math.abs(B.x) > FL + 1.85) { B.x = s * (FL + 1.85); B.vx *= -0.1; }
    if (Math.abs(B.z) > GOAL_HW - 0.15) { B.z = Math.sign(B.z) * (GOAL_HW - 0.15); B.vz *= -0.1; }
    if (B.y > GOAL_H - 0.15) { B.y = GOAL_H - 0.15; B.vy = -1; }
    return null;
  }
  // goal line: goal, woodwork or out
  if (Math.abs(B.x) > FL && Math.abs(px) <= FL) {
    const s = Math.sign(B.x), az = Math.abs(B.z);
    if (az < GOAL_HW - 0.08 && B.y < GOAL_H - 0.08) { B.inNet = true; return { type: 'goal', side: s }; }
    if ((Math.abs(az - GOAL_HW) < 0.2 && B.y < GOAL_H + 0.15) || (Math.abs(B.y - GOAL_H) < 0.2 && az < GOAL_HW + 0.15)) {
      B.x = s * (FL - 0.05); B.vx = -B.vx * 0.55; B.vz += rnd(-3, 3) + Math.sign(B.z) * (az > GOAL_HW ? 3 : -1); B.vy = B.y > GOAL_H - 0.3 ? Math.abs(B.vy) * 0.5 + 2 : B.vy;
      Sfx.post(); Sfx.ooh(); return null;
    }
  }
  if (Math.abs(B.x) > FL + 0.25) return { type: 'byline', side: Math.sign(B.x) };
  if (Math.abs(B.z) > FW + 0.2) return { type: 'touch', side: Math.sign(B.z) };
  return null;
}
function pickup() {
  const B = M.ball; if (M.owner || B.inNet) return;
  const bs = hyp(B.vx, B.vz); let best = null, bd = 9;
  for (const p of M.players) {
    if (p.noBall > 0 || p.state !== 'run' || (p.lock > 0 && !p.kick)) continue;
    const f = fwd(p), d = hyp(B.x - p.pos.x - f.x * 0.3, B.z - p.pos.z - f.z * 0.3);
    const reach = p === M.passTarget ? 0.95 : 0.78;
    if (p.role === 'GK' && inOwnBox(p, 0) && B.y < 2.3 && d < (bs > 14 ? 0.7 : 1.0) && bs < 21) { if (d < bd) { bd = d; best = p; } continue; }
    if (d < reach && B.y < 1.0) { if (d < bd) { bd = d; best = p; } }
    else if (d < 0.5 && B.y < 1.95) { B.vx *= 0.25; B.vz *= 0.25; B.vy = Math.min(B.vy, 0); M.lastTouch = p; }  // chest it down
  }
  if (!best) return;
  if (B.shot && bs > 21 && best.role !== 'GK') {    // blocked shot cannons off
    const a = rnd(-1, 1); B.vx = -B.vx * 0.3 + a * 3; B.vz = -B.vz * 0.3 + rnd(-3, 3); B.vy = rnd(1, 4); B.shot = false; M.lastTouch = best; best.noBall = 0.3; Sfx.kick(0.3); return;
  }
  const gk = best.role === 'GK' && inOwnBox(best, 0) && M.state === 'play';
  giveBall(best, gk);
  if (gk) { best.mood = 'hold'; best.ai.holdT = 1.3; }
  if (best.buffer && best.buffer.t > 0) { const b = best.buffer; best.buffer = null; startKick(best, b.type, b.o); }
}
function inOwnBox(p, pad) { return Math.abs(p.pos.x + p.team.dir * FL) < 16.5 + pad && Math.abs(p.pos.z) < 20.15 + pad; }

/* ---------- kicks ---------- */
function startKick(p, type, o = {}) {
  if (p.kick || p.state !== 'run') return false;
  const name = type === 'shot' ? 'shot' : type === 'throw' ? 'throwIn' : (type === 'long' || type === 'cross') ? 'loft' : 'pass';
  const c = playClip(p, name, p.left);
  p.kick = Object.assign({ type, t: c.strike, power: 0.5 }, o);
  p.lock = c.strike + 0.1;
  return true;
}
const passSpeed = d => clamp(5 + 0.95 * Math.pow(d, 0.9), 8, 25);
function releaseKick(p) {
  const k = p.kick, B = M.ball, f = fwd(p), dir = p.team.dir; p.kick = null; p.want.face = null;
  if (k.type === 'header') return releaseHeader(p, k);
  const near = hyp(B.x - p.pos.x, B.z - p.pos.z) < 1.3 && B.y < 0.9;
  if (M.owner !== p && !(M.owner === null && near && !B.inNet)) return;
  if (M.owner === p && !B.held) { B.x = p.pos.x + f.x * 0.6; B.z = p.pos.z + f.z * 0.6; B.y = BALL_R; }
  let tx, tz, sp, vy = 0; const t = k.target;
  if (k.type === 'pass' || k.type === 'through') {
    if (t) {
      const d0 = dist2(t.pos, B), tt = d0 / passSpeed(d0);
      tx = t.pos.x + t.vel.x * tt * 0.6; tz = t.pos.z + t.vel.z * tt * 0.6;
      if (k.type === 'through') { tx += dir * (5 + 0.14 * d0) + t.vel.x * 0.5; tz += t.vel.z * 0.5 - Math.sign(tz) * 1.2; }
    } else { tx = B.x + (k.dx || f.x) * 15; tz = B.z + (k.dz || f.z) * 15; }
    tx = clamp(tx, -FL + 1.5, FL - 1.5); tz = clamp(tz, -FW + 1.5, FW - 1.5);
    const d = hyp(tx - B.x, tz - B.z); sp = passSpeed(d) + (k.type === 'through' ? 1.5 : 0); vy = d > 22 ? 1.6 : 0;
  } else if (k.type === 'long' || k.type === 'cross' || k.type === 'throw') {
    if (k.pt) { tx = k.pt.x; tz = k.pt.z; }
    else if (t) { const d0 = dist2(t.pos, B), ft = 0.5 + d0 / 22; tx = t.pos.x + t.vel.x * ft * 0.8; tz = t.pos.z + t.vel.z * ft * 0.8; }
    else { tx = B.x + (k.dx || f.x) * 32; tz = B.z + (k.dz || f.z) * 32; }
    tx = clamp(tx, -FL + 2, FL - 2); tz = clamp(tz, -FW + 2, FW - 2);
    const d = Math.max(4, hyp(tx - B.x, tz - B.z)), th = k.type === 'throw' ? 0.38 : k.type === 'cross' ? 0.58 : 0.5;
    const v0 = Math.min(k.type === 'throw' ? 15 : 31, Math.sqrt(d * GRAV / Math.sin(2 * th)) * (k.type === 'throw' ? 0.93 : 1.07));
    sp = v0 * Math.cos(th); vy = v0 * Math.sin(th); B.air = true;
  } else {                                           // shot
    const gx = goalX(p.team), pw = k.power, dg = Math.abs(gx - B.x);
    const err = (0.5 + 1.5 * pw + (p.speed > 6 ? 0.5 : 0)) * (1.3 - 0.45 * p.attr.sht) * dg / 20;
    tx = gx; tz = (k.az || 0) + rndN() * err;
    if ((gx - B.x) * f.x < -0.2 * Math.abs(gx - B.x)) { tx = B.x + f.x * 20; tz = B.z + f.z * 20; }   // facing away: goes where he faces
    const el = 0.03 + 0.27 * Math.pow(pw, 1.7) + rndN() * 0.025;
    const v = 20 + 12 * pw; sp = v * Math.cos(el); vy = v * Math.sin(el); B.shot = true;
  }
  const d = hyp(tx - B.x, tz - B.z) || 1;
  looseBall();
  B.vx = (tx - B.x) / d * sp; B.vz = (tz - B.z) / d * sp; B.vy = vy;
  p.noBall = 0.4; p.mood = null; M.lastTouch = p; M.passTarget = t || null; M.kickT = M.time;
  Sfx.kick(k.type === 'shot' ? 0.5 + k.power * 0.5 : k.type === 'pass' ? 0.2 : 0.5);
  if (k.type === 'shot') Sfx.ooh();
  if (M.onKick) M.onKick(p, k);
}
function tryHeader(p, kind, o = {}) {
  const B = M.ball; if (p.kick || p.state !== 'run' || M.owner || p.lock > 0) return false;
  const T = 0.2, bx = B.x + B.vx * T, bz = B.z + B.vz * T, by = B.y + B.vy * T - 0.5 * GRAV * T * T;
  if (by < 1.25 || by > 2.75 || hyp(bx - p.pos.x, bz - p.pos.z) > 1.7) return false;
  const c = playClip(p, 'header', false, clamp(by - 1.6, 0.12, 0.8));
  p.kick = Object.assign({ type: 'header', kind, t: c.strike }, o); p.lock = 0.5;
  p.vel.x = (bx - p.pos.x) / T * 0.8; p.vel.z = (bz - p.pos.z) / T * 0.8;
  return true;
}
function releaseHeader(p, k) {
  const B = M.ball;
  if (M.owner || hyp(B.x - p.pos.x, B.z - p.pos.z) > 1.25 || B.y < 1.0 || B.y > 3.0) return;
  let tx, tz, sp, vy;
  if (k.kind === 'shot') { tx = goalX(p.team); tz = (k.az || 0) + rndN() * 1.4; sp = rnd(15, 20); vy = B.y > 2 ? -2.5 : 1; B.shot = true; }
  else if (k.target) { tx = k.target.pos.x; tz = k.target.pos.z; sp = clamp(dist2(k.target.pos, B) * 0.9, 7, 16); vy = 2.5; }
  else { const f = fwd(p); tx = B.x + f.x * 14 + p.team.dir * 6; tz = B.z + f.z * 14; sp = 13; vy = 5; }
  const d = hyp(tx - B.x, tz - B.z) || 1;
  B.vx = (tx - B.x) / d * sp; B.vz = (tz - B.z) / d * sp; B.vy = vy; B.air = true;
  p.noBall = 0.5; M.lastTouch = p; M.passTarget = k.target || null; M.kickT = M.time; Sfx.kick(0.35);
}

/* ---------- tackles ---------- */
function setState(p, st, t, clip, mir) { p.state = st; p.stT = t; p.kick = null; if (clip) playClip(p, clip, mir); }
function standTackle(p) {
  if (p.lock > 0 || p.state !== 'run' || p.kick) return;
  playClip(p, 'tackle', p.left); p.lock = 0.4; p.tackleT = 0.1;
}
function resolveTackle(p, slide) {
  const o = M.owner, B = M.ball, f = fwd(p);
  if (hyp(B.x - p.pos.x - f.x * 0.55, B.z - p.pos.z - f.z * 0.55) > (slide ? 1.05 : 0.95) || B.y > 0.8) return false;
  if (!o) { if (slide) { B.vx = f.x * 10; B.vz = f.z * 10; M.lastTouch = p; Sfx.kick(0.3); } return true; }
  if (o.team === p.team || B.held) return false;
  const of = fwd(o), dx = p.pos.x - o.pos.x, dz = p.pos.z - o.pos.z, d = hyp(dx, dz) || 1, front = (of.x * dx + of.z * dz) / d;
  let ch = (front > 0.3 ? 0.78 : front > -0.4 ? 0.6 : 0.28) * p.attr.tck + (slide ? 0.12 : 0);
  if (!isUser(p)) ch *= [0.6, 0.8, 0.95][M.diff]; else ch *= 1.08;
  const contact = d < 0.95;
  if (Math.random() < ch) {
    looseBall(); o.noBall = 0.7;
    if (!slide && Math.random() < 0.55) giveBall(p);
    else { B.vx = f.x * rnd(5, 9) + rnd(-2, 2); B.vz = f.z * rnd(5, 9) + rnd(-2, 2); M.lastTouch = p; }
    if (slide && contact) { setState(o, 'down', 1.45, 'fall'); o.lock = 1.5; } else { playClip(o, 'stumble', Math.random() < 0.5); o.lock = 0.45; }
    Sfx.kick(0.25); return true;
  }
  if (slide && contact) {                            // caught the man
    looseBall(); setState(o, 'down', 1.45, 'fall'); o.lock = 1.5; Sfx.kick(0.2);
    if (front < 0.5 && M.onFoul) M.onFoul(p, o);
    return true;
  }
  p.lock = Math.max(p.lock, 0.5); return false;
}
function startSlide(p) {
  if (p.lock > 0 || p.state !== 'run' || p.kick) return;
  const f = fwd(p), s = Math.max(p.speed, 6.8);
  p.vel.x = f.x * s; p.vel.z = f.z * s;
  setState(p, 'slide', 0.95, 'slide', p.left); p.lock = 1.15; p.slideHit = false;
}
function updateActions(p, dt) {
  if (p.kick) { p.kick.t -= dt; if (p.kick.t <= 0) releaseKick(p); }
  if (p.buffer) { p.buffer.t -= dt; if (p.buffer.t <= 0) p.buffer = null; }
  if (p.tackleT > 0) { p.tackleT -= dt; if (p.tackleT <= 0) resolveTackle(p, false); }
  if (p.state === 'slide' && !p.slideHit && p.stT < 0.85 && p.stT > 0.35) { if (resolveTackle(p, true)) p.slideHit = true; }
}
