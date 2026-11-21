'use strict';
/* ---------- team shape, CPU decisions, goalkeepers ---------- */
function predictBall() {
  const B = M.ball, out = []; let x = B.x, y = B.y, z = B.z, vx = B.vx, vy = B.vy, vz = B.vz; const h = 0.1;
  for (let i = 0; i < 30; i++) {
    if (y > BALL_R + 0.005 || Math.abs(vy) > 0.3) {
      vy -= GRAV * h; vx *= 0.99; vz *= 0.99; y += vy * h;
      if (y < BALL_R) { y = BALL_R; if (vy < -1.6) { vy = -vy * 0.58; vx *= 0.8; vz *= 0.8; } else vy = 0; }
    } else { const s = hyp(vx, vz), ns = Math.max(0, s - (1.6 + 0.35 * s) * h); if (s > 0) { vx *= ns / s; vz *= ns / s; } }
    x += vx * h; z += vz * h; out.push({ x, y, z, t: (i + 1) * h });
  }
  return out;
}
function nearestOf(list, x, z, skip) {
  let b = null, bd = 1e9;
  for (const q of list) { if (q === skip) continue; const d = hyp(q.pos.x - x, q.pos.z - z); if (d < bd) { bd = d; b = q; } }
  return { p: b, d: bd };
}
function laneGap(ax, az, bx, bz, foes) {             // closest a defender gets to the pass line
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; let m = 99;
  for (const q of foes) {
    const t = clamp(((q.pos.x - ax) * dx + (q.pos.z - az) * dz) / l2, 0.08, 1);
    m = Math.min(m, hyp(q.pos.x - ax - dx * t, q.pos.z - az - dz * t) + (1 - t) * 0.5);
  }
  return m;
}
function formTarget(p, att) {
  const B = M.ball, d = p.team.dir, bx = B.x * d, a = p.ai;
  const cfg = { DF: [0.5, 4, -5, -45, 8], MF: [0.62, 8, -7, -36, 34], FW: [0.55, 9, -4, -18, 46] }[p.role];
  let x = p.base.x + bx * cfg[0] + (att > 0 ? cfg[1] : att < 0 ? cfg[2] : 0);
  let z = p.base.z * (att > 0 ? 1 : 0.72) + B.z * (att > 0 ? 0.25 : 0.4);
  if (att > 0) { x += a.jx; z += a.jz; }
  x = clamp(x, cfg[3], cfg[4]);
  if (p.role === 'DF' && att <= 0 && x > bx - 4) x = Math.max(-46, bx - 6);
  if (p.role === 'FW' && att > 0) {                   // hold the line of the last defender
    const xs = opp(p.team).players.filter(q => q.role !== 'GK').map(q => q.pos.x * d).sort((m, n) => n - m);
    x = Math.min(x, Math.max(xs[0] - 1, bx));
  }
  return { x: x * d, z: clamp(z, -FW + 2, FW - 2) };
}
function steerTo(p, x, z, sprintD = 9, faceBall = false) {
  const dx = x - p.pos.x, dz = z - p.pos.z, d = hyp(dx, dz), w = p.want;
  if (d < 0.35) { w.x = w.z = 0; }
  else { const k = Math.min(1, d / 1.6 + 0.15) / d; w.x = dx * k; w.z = dz * k; }
  w.sprint = d > sprintD; w.slow = 1;
  w.face = (faceBall && d < 4) ? Math.atan2(M.ball.x - p.pos.x, M.ball.z - p.pos.z) : null;
}
function aiTeam(team, dt) {
  const B = M.ball, o = M.owner, att = o ? (o.team === team ? 1 : -1) : (M.lastTouch && M.lastTouch.team === team ? 1 : -1);
  const foes = opp(team).players, restart = M.state === 'restart' || M.state === 'kickoff';
  // who goes to the ball
  let best = null, bt = 9, second = null, st = 9, pt = B;
  const pred = M.pred;
  for (const p of team.players) {
    if (p.role === 'GK' || p.state !== 'run') continue;
    let t = 9, tp = B;
    if (o) t = hyp(B.x + o.vel.x * 0.35 - p.pos.x, B.z + o.vel.z * 0.35 - p.pos.z) / 7;
    else for (const q of pred) if (q.y < 1.9 && hyp(q.x - p.pos.x, q.z - p.pos.z) / 7.2 + 0.12 <= q.t) { t = q.t; tp = q; break; }
    if (t === 9 && !o) { const q = pred[pred.length - 1]; t = 3 + hyp(q.x - p.pos.x, q.z - p.pos.z) / 7; tp = q; }
    if (p === M.passTarget) t -= 0.7;
    p.ai.it = t; p.ai.ip = tp;
    if (t < bt) { second = best; st = bt; best = p; bt = t; pt = tp; } else if (t < st) { second = p; st = t; }
  }
  team.chaser = (!o || o.team !== team) ? best : null; team.second = second;
  const user = team.id === M.userTeam && !M.demo;
  for (const p of team.players) {
    const a = p.ai;
    a.jt -= dt; if (a.jt <= 0) { a.jt = rnd(1.5, 3.5); const r = p.role === 'FW' ? 8 : 4; a.jx = rnd(-r * 0.5, r); a.jz = rnd(-r, r); }
    const dBall = hyp(B.x - p.pos.x, B.z - p.pos.z);
    p.ready = p.role === 'GK' ? (dBall < 50 ? 1 : 0.3) : (att < 0 && dBall < 14 ? 0.8 : dBall < 6 ? 0.4 : 0);
    if (p.role === 'GK') { keeper(p, dt); continue; }
    if (p.frozen) { p.want.x = p.want.z = 0; if (p === o && !(user && p === M.ctrl)) aiCarrier(p, dt); continue; }
    if (p === M.ctrl && user) continue;
    if (p === o) { aiCarrier(p, dt); continue; }
    if (p.lock > 0 && !p.kick) continue;
    if (restart) {
      const f = formTarget(p, att); let fx = f.x, fz = f.z;
      if (att < 0 || M.state === 'kickoff') {            // give ten yards
        const dx = fx - B.x, dz = fz - B.z, d = hyp(dx, dz) || 1;
        if (d < 10) { fx = B.x + dx / d * 10; fz = B.z + dz / d * 10; }
        if (M.state === 'kickoff') fx = team.dir > 0 ? Math.min(fx, -1) : Math.max(fx, 1);
      }
      steerTo(p, fx, fz, 14, true); continue;
    }
    // airborne ball near me: get a head on it
    if (!o && B.y > 1.3 && dBall < 2.2 && (!user || p !== M.ctrl)) {
      const inBox = Math.abs(goalX(team) - p.pos.x) < 17 && Math.abs(p.pos.z) < 14;
      if (inBox) tryHeader(p, 'shot', { az: rnd(-3, 3) });
      else { const m = bestPass(p, true); tryHeader(p, 'pass', m ? { target: m.t } : {}); }
    }
    if (p === team.chaser && (!user || !o || M.demo || (M.press && false))) {
      if (o) {                                           // press from the goal side
        const gx = -team.dir * FL, dx = gx - o.pos.x, dz = -o.pos.z, d = hyp(dx, dz) || 1;
        const tx = o.pos.x + o.vel.x * 0.3 + dx / d * 0.7, tz = o.pos.z + o.vel.z * 0.3 + dz / d * 0.7;
        steerTo(p, tx, tz, 2.5); p.want.sprint = dBall > 2.5;
        a.think -= dt;
        if (dBall < 1.5 && a.think <= 0) {
          a.think = [0.75, 0.5, 0.36][M.diff];
          if (Math.random() < [0.4, 0.55, 0.7][M.diff]) standTackle(p);
        } else if (dBall > 2.5 && dBall < 4.5 && a.think <= 0 && Math.random() < 0.012 * (M.diff + 1) && Math.abs(wrapPi(p.yaw - Math.atan2(B.x - p.pos.x, B.z - p.pos.z))) < 0.4) { a.think = 2; startSlide(p); }
      } else { steerTo(p, pt.x, pt.z, 1.5); p.want.sprint = true; }
      continue;
    }
    if (user && p === team.chaser && o) { /* user presses with his own player; mates hold shape unless called */ }
    if (p === team.second && o && o.team !== team && (!user || M.press)) {   // cover / second presser
      const gx = -team.dir * FL, dx = gx - o.pos.x, dz = -o.pos.z, d = hyp(dx, dz) || 1, k = user && M.press ? 1 : 6;
      steerTo(p, o.pos.x + dx / d * k, o.pos.z + dz / d * k, 5, true);
      if (user && M.press && dBall < 1.5) { a.think -= dt; if (a.think <= 0) { a.think = 0.6; standTackle(p); } }
      continue;
    }
    const f = formTarget(p, att);
    if (att < 0 && p.role !== 'FW') {                    // mark goal-side of the nearest runner in my zone
      const n = nearestOf(foes, f.x, f.z);
      if (n.p && n.d < 11 && n.p.role !== 'GK') {
        const gx = -team.dir * FL, dx = gx - n.p.pos.x, dz = -n.p.pos.z, d = hyp(dx, dz) || 1;
        f.x = lerp(f.x, n.p.pos.x + dx / d * 2, 0.6); f.z = lerp(f.z, n.p.pos.z + dz / d * 2, 0.6);
      }
    }
    if (att > 0 && o && p.role === 'MF' && dist2(p.pos, o.pos) < 16) {   // show for the ball
      const s = Math.sign(p.pos.z - o.pos.z) || 1; f.x = lerp(f.x, o.pos.x + team.dir * 3, 0.5); f.z = lerp(f.z, o.pos.z + s * 9, 0.5);
    }
    steerTo(p, f.x, f.z, att > 0 ? 10 : 7, att < 0);
  }
}
function bestPass(p, any) {
  const foes = opp(p.team).players, dir = p.team.dir; let best = null, bs = -1e9;
  for (const m of p.team.players) {
    if (m === p || m.role === 'GK' || m.state !== 'run') continue;
    const d = dist2(m.pos, p.pos); if (d < 5 || d > 44) continue;
    const lane = laneGap(p.pos.x, p.pos.z, m.pos.x, m.pos.z, foes); if (lane < 1.5 && !any && d < 26) continue;
    const open = Math.min(10, nearestOf(foes, m.pos.x, m.pos.z).d);
    const s = (m.pos.x - p.pos.x) * dir * 0.8 + open * 1.2 + Math.min(5, lane) * 2.2 - Math.abs(d - 16) * 0.1 + (m.role === 'FW' ? 2 : 0) + rnd(3);
    if (s > bs) { bs = s; best = { t: m, d, open, type: d > 27 ? 'long' : (open > 5 && m.vel.x * dir > 3 && Math.random() < 0.4) ? 'through' : 'pass', score: s }; }
  }
  return best;
}
function aiCarrier(p, dt) {
  const a = p.ai, team = p.team, dir = team.dir, gx = goalX(team), foes = opp(team).players, w = p.want;
  if (p.kick || p.lock > 0 || (M.ball.held && !p.frozen)) return;
  if (p.frozen) {                                        // restart taker
    a.think -= dt; if (a.think > 0) return;
    const m = bestPass(p, true), r = M.restart && M.restart.type;
    if (r === 'corner') startKick(p, 'cross', { pt: { x: gx - dir * rnd(6, 11), z: rnd(-5, 5) }, face: Math.atan2(gx - dir * 9 - p.pos.x, -p.pos.z) });
    else if (r === 'throw') startKick(p, 'throw', m && m.d < 22 ? { target: m.t } : { pt: { x: p.pos.x + dir * 8, z: p.pos.z * 0.7 } });
    else if (m) startKick(p, m.d > 24 || r === 'goalkick' ? 'long' : 'pass', { target: m.t, face: Math.atan2(m.t.pos.x - p.pos.x, m.t.pos.z - p.pos.z) });
    else startKick(p, 'long', { dx: dir, dz: 0 });
    return;
  }
  const dg = hyp(gx - p.pos.x, p.pos.z), n = nearestOf(foes.filter(q => q.role !== 'GK'), p.pos.x + dir * 1.2, p.pos.z);
  a.think -= dt;
  if (a.think <= 0) {
    a.think = [0.4, 0.3, 0.22][M.diff] + rnd(0.1);
    const face = Math.atan2(gx - p.pos.x, -p.pos.z);
    if (dg < 30 && (Math.abs(p.pos.z) < 16 || dg < 13) && (dg < 19 || n.d < 3 || Math.random() < 0.3)) {
      const gk = opp(team).players[0], az = (gk.pos.z > 0 ? -1 : 1) * rnd(1.6, 3.2) * (Math.random() < 0.8 ? 1 : -1);
      startKick(p, 'shot', { power: clamp(0.3 + dg / 55 + rnd(-0.12, 0.12) * (2 - M.diff), 0.2, 0.95), az, face }); return;
    }
    if (Math.abs(p.pos.z) > 17 && Math.abs(gx - p.pos.x) < 17 && Math.random() < 0.7) {
      startKick(p, 'cross', { pt: { x: gx - dir * rnd(7, 12), z: rnd(-4, 4) }, face: Math.atan2(gx - dir * 9 - p.pos.x, -p.pos.z) }); return;
    }
    const m = bestPass(p), held = M.time - (a.got || 0), wantPass = n.d < 2.4 ? 0.8 : n.d < 4 ? 0.22 : 0.05;
    if (m && (held > 0.45 || n.d < 1.8) && (Math.random() < wantPass || (m.score > 22 && Math.random() < 0.4) || (p.role === 'DF' && Math.random() < (n.d < 9 ? 0.6 : 0.12)))) {
      startKick(p, m.type, { target: m.t, face: Math.atan2(m.t.pos.x - p.pos.x, m.t.pos.z - p.pos.z) }); return;
    }
    // dribble: head for goal, bend away from whoever is closing
    let dx = gx - dir * 10 - p.pos.x, dz = (Math.abs(gx - p.pos.x) < 30 ? 0 : p.pos.z * 0.6) - p.pos.z; const l = hyp(dx, dz) || 1; dx /= l; dz /= l;
    for (const q of foes) {
      const ox = q.pos.x - p.pos.x, oz = q.pos.z - p.pos.z, d = hyp(ox, oz);
      if (d < 6 && ox * dir > -1) { const k = (6 - d) / 6 * 1.3, s = (dx * oz - dz * ox) > 0 ? 1 : -1; dx += dz * s * k; dz += -dx * s * k * 0.5; dz -= oz / d * k * 0.6; }
    }
    if (Math.abs(p.pos.z) > FW - 3) dz -= Math.sign(p.pos.z) * 0.8;
    const l2 = hyp(dx, dz) || 1; a.dx = dx / l2; a.dz = dz / l2; a.sprint = n.d > 3.5 || (n.p && (n.p.pos.x - p.pos.x) * dir < 0);
  }
  w.x = a.dx || dir; w.z = a.dz || 0; w.sprint = !!a.sprint; w.face = null; w.slow = 1;
}

/* ---------- goalkeeper ---------- */
function keeper(g, dt) {
  const B = M.ball, team = g.team, dir = team.dir, gx = -dir * FL, a = g.ai, w = g.want;
  w.face = null; w.slow = 1;
  if (g.frozen) { w.x = w.z = 0; if (M.owner === g && !(isUser(g) && !M.demo)) aiCarrier(g, dt); return; }
  if (M.owner === g) {                                   // ball in hands: pick a pass
    w.x = w.z = 0; g.mood = B.held ? 'hold' : null; w.face = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    if (!(a.holdT > -9)) a.holdT = 0.8;
    a.holdT -= dt;
    if (a.holdT <= 0 && !g.kick && (!isUser(g) || M.demo || a.holdT < -3.5)) keeperRelease(g, Math.random() < 0.45 ? 'pass' : 'long');
    return;
  }
  g.mood = null;
  if (g.state !== 'run') { if (a.save) resolveSave(g, dt); return; }
  // shot on its way?
  const toward = -B.vx * dir;
  if (!M.owner && toward > 7 && !B.inNet && a.saveId !== M.kickT && Math.abs(B.x - gx) < 45) {
    const tHit = (g.pos.x - B.x) / B.vx;
    if (tHit > 0.02 && tHit < 1.4) {
      const zp = B.z + B.vz * tHit, yp = Math.max(BALL_R, B.y + B.vy * tHit - 0.5 * GRAV * tHit * tHit);
      const tg = (gx - B.x) / B.vx, zg = B.z + B.vz * tg;
      if (Math.abs(zg) < 5.2 && yp < 3.3) {
        a.saveId = M.kickT;
        const react = isUser(g) && !M.demo ? 0.17 : [0.27, 0.2, 0.15][M.diff], dz = zp - g.pos.z, avail = tHit - react;
        const sp = hyp(B.vx, B.vz);
        let reach = Math.min(3.3, 0.7 + 5.2 * Math.max(0, avail)); if (yp > 2) reach -= 0.4;
        const skill = isUser(g) && !M.demo ? 0.82 : [0.62, 0.78, 0.9][M.diff];
        const ok = Math.abs(dz) <= reach && yp < 2.8 && avail > 0.04 && Math.random() < skill;
        a.save = { t: tHit, z: zp, y: yp, ok, delay: Math.max(0, react), sp, dz, dived: false, stand: Math.abs(dz) < 0.8 && yp < 2.3 };
      }
    }
  }
  if (a.save) { resolveSave(g, dt); if (a.save) { w.x = w.z = 0; if (a.save.stand) { w.z = clamp(a.save.dz * 2, -1, 1); w.face = dir > 0 ? Math.PI / 2 : -Math.PI / 2; } return; } }
  // positioning: on the line between ball and goal, a few steps out; sweep up loose balls
  const dbg = hyp(B.x - gx, B.z), near = 1 - clamp(dbg / 42, 0, 1);
  let tx = gx + dir * clamp(dbg * 0.11, 1.2, 5.5), tz = clamp(B.z * lerp(0.08, 0.5, near), -3.3, 3.3), sprint = false;
  const o = M.owner, foes = opp(team).players;
  if (M.state === 'play' && dbg < 19 && Math.abs(B.z) < 17) {
    const dMe = hyp(B.x - g.pos.x, B.z - g.pos.z);
    if (!o && hyp(B.vx, B.vz) < 9 && dMe + 1.5 < nearestOf(foes, B.x, B.z).d && B.y < 1.5) { tx = B.x; tz = B.z; sprint = true; }
    else if (o && o.team !== team && dbg < 15 && nearestOf(team.players, o.pos.x, o.pos.z, g).d > 3.5) {
      tx = lerp(gx, o.pos.x, 0.4); tz = lerp(0, o.pos.z, 0.4); sprint = dMe > 6;
      if (dMe < 1.5 && !a.save && Math.random() < dt * 5) {   // smother at the feet
        const leftZ = -Math.sin(g.yaw), dz = B.z - g.pos.z, ok = Math.random() < [0.45, 0.6, 0.72][M.diff];
        g.state = 'dive'; g.stT = 1.15; playClip(g, 'dive', dz * leftZ < 0, 0.08);
        g.vel.x = (B.x - g.pos.x) * 3; g.vel.z = dz * 3; g.lock = 1.2;
        if (ok) { looseBall(); o.noBall = 0.8; playClip(o, 'stumble'); o.lock = 0.5; giveBall(g, true); a.holdT = 2.2; Sfx.ooh(); }
        return;
      }
    }
  }
  steerTo(g, tx, tz, 99); w.sprint = sprint;
  if (!sprint) w.face = Math.atan2(B.x - g.pos.x, B.z - g.pos.z);
  g.mood = (dbg < 32 && !sprint) ? 'set' : null;
}
function resolveSave(g, dt) {
  const s = g.ai.save, B = M.ball; s.t -= dt; s.delay -= dt;
  if (!s.dived && s.delay <= 0) {
    s.dived = true;
    if (s.stand) { if (s.y > 1.3) playClip(g, 'catchUp', false, clamp(s.y - 1.7, 0, 0.5)); }
    else {
      const leftZ = -Math.sin(g.yaw), T = Math.max(0.16, s.t), sgn = Math.sign(s.dz);
      g.state = 'dive'; g.stT = 1.2; g.lock = 1.25; playClip(g, 'dive', s.dz * leftZ < 0, clamp(s.y - 0.45, 0.05, 1.6));
      g.an.ct = Math.max(0, 0.3 - T);                    // time the full stretch to the ball's arrival
      g.vel.x = 0; g.vel.z = sgn * Math.min(9, Math.max(0, Math.abs(s.dz) - 1.25) / T + 1.5);
    }
  }
  if (s.t <= 0) {
    g.ai.save = null;
    if (!s.ok || M.owner || B.inNet || hyp(B.x - g.pos.x, B.z - s.z) > 2.2) return;
    if (s.sp < 22 || Math.random() < 0.45) { giveBall(g, true); g.ai.holdT = s.stand ? 1.3 : 2.4; }
    else {                                               // parry away
      const dir = g.team.dir; B.vx = dir * rnd(4, 9); B.vz = (Math.sign(s.dz) || 1) * rnd(6, 11); B.vy = rnd(2, 5); B.shot = false;
      M.lastTouch = g; g.noBall = 0.6; M.kickT = M.time + Math.random(); Sfx.kick(0.4);
    }
    Sfx.ooh();
  }
}
function keeperRelease(g, type) {
  const m = bestPass(g, true); let t = m && m.t;
  if (type === 'pass') { const d = nearestOf(g.team.players.filter(q => q.role === 'DF' && nearestOf(opp(g.team).players, q.pos.x, q.pos.z).d > 7), g.pos.x, g.pos.z); if (d.p) t = d.p; else type = 'long'; }
  if (type === 'long') { const mids = g.team.players.filter(q => q.role !== 'GK' && q.role !== 'DF'); t = mids[Math.random() * mids.length | 0]; }
  g.mood = null;
  startKick(g, type, t ? { target: t, face: Math.atan2(t.pos.x - g.pos.x, t.pos.z - g.pos.z) } : { dx: g.team.dir, dz: 0 });
}
