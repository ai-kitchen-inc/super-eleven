'use strict';
/* ---------- rules, restarts, match flow, and the human player's controls ---------- */
function resetPlayer(p, x, z, yaw) {
  p.pos.x = x; p.pos.z = z; p.vel.x = p.vel.z = 0; p.yaw = yaw; p.speed = 0; p.accF = p.accL = 0;
  p.state = 'run'; p.stT = 0; p.lock = 0; p.kick = null; p.frozen = false; p.mood = null; p.noBall = 0; p.buffer = null; p.hasBall = false;
  p.tackleT = 0; p.an.clip = null; p.an.lean = p.an.bank = p.an.leanV = p.an.bankV = 0; p.ai.save = null; p.want.x = p.want.z = 0; p.want.face = null;
}
const Game = {
  halfLen: 150, half: 1, clock: 0, charge: null, msg: '', msgT: 0, fade: 0, cutT: 0, cutR: null, stT: 0, tackleCd: 0, snapCam: true, scorer: null, lastOwnTeam: null,
  say(t, dur = 2) { this.msg = t; this.msgT = dur; },
  start(ci, cj, halfLen, diff, demo) {
    buildMatch(ci, cj); M.diff = diff; M.demo = !!demo; this.halfLen = halfLen; this.half = 1; this.clock = 0; M.time = 0; M.kickT = 0; M.press = false;
    M.onKick = () => { if (M.state === 'kickoff' || M.state === 'restart') { M.state = 'play'; M.restart = null; } for (const q of M.players) q.frozen = false; };
    M.onFoul = (p, o) => this.foul(p, o);
    this.kickoff(M.teams[0]); if (!demo) Sfx.whistle(1);
  },
  placeBall(x, z) { const B = M.ball; looseBall(); Object.assign(B, { x, y: BALL_R, z, vx: 0, vy: 0, vz: 0, inNet: false, held: false, shot: false, air: false }); M.passTarget = null; },
  pickCtrl() {
    let b = null, bd = 1e9;
    for (const p of M.teams[M.userTeam].players) { if (p.role === 'GK' || p === M.ctrl && false) continue; const d = dist2(p.pos, M.ball); if (d < bd) { bd = d; b = p; } }
    M.ctrl = b;
  },
  kickoff(team) {
    this.placeBall(0, 0);
    for (const p of M.players) {
      const d = p.team.dir; let x = Math.min(p.base.x, -1.5); const z = p.base.z;
      if (p.team !== team && hyp(x, z) < 10.5) x = -10.5;
      resetPlayer(p, x * d, z, d > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
    const fw = team.players.filter(p => p.role === 'FW'), d = team.dir;
    resetPlayer(fw[0], -0.55 * d, 0.05, d > 0 ? Math.PI / 2 : -Math.PI / 2); resetPlayer(fw[1], -1.4 * d, 5, 0);
    giveBall(fw[0]); fw[0].frozen = true; fw[0].ai.think = 1.3;
    M.state = 'kickoff'; M.restart = { type: 'kickoff', team }; this.snapCam = true;
    if (team.id !== M.userTeam) this.pickCtrl();
  },
  cut(r, msg) { M.state = 'cut'; this.cutT = 0; this.cutR = r; this.charge = null; this.say(msg, 1.6); },
  placeRestart(r) {
    const team = r.team, d = team.dir, gx = goalX(team), B = M.ball;
    this.placeBall(r.x, r.z); M.lastTouch = null;
    for (const p of M.players) {
      const yaw = p.team.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      if (p.role === 'GK') { resetPlayer(p, -p.team.dir * (FL - 1.5), clamp(r.z * 0.08, -2, 2), yaw); continue; }
      const f = formTarget(p, p.team === team ? 1 : -1); let fx = f.x, fz = f.z;
      if (p.team !== team) { const dx = fx - r.x, dz = fz - r.z, dd = hyp(dx, dz) || 1; if (dd < 10) { fx = r.x + dx / dd * 10; fz = r.z + dz / dd * 10; } }
      resetPlayer(p, clamp(fx, -FL + 1, FL - 1), clamp(fz, -FW + 1, FW - 1), yaw);
    }
    let taker;
    const out = team.players.filter(p => p.role !== 'GK');
    if (r.type === 'goalkick') taker = team.players[0];
    else if (r.type === 'corner') {
      taker = team.players[r.z < 0 ? 5 : 8];
      const sp = [[7, -2.5], [9.5, 2], [12, -1], [6, 3.5], [15, 5]], s = -Math.sign(r.z);
      [9, 10, 6, 7, 2].forEach((i, n) => resetPlayer(team.players[i], gx - d * sp[n][0], sp[n][1] * s, d > 0 ? Math.PI / 2 : -Math.PI / 2));
      [2, 3, 6, 7, 1].forEach((i, n) => resetPlayer(opp(team).players[i], gx - d * (sp[n][0] - 1.4), sp[n][1] * s * 0.85, d > 0 ? -Math.PI / 2 : Math.PI / 2));
    } else if (r.type === 'penalty') {
      taker = team.players[9];
      for (const p of M.players) if (p.role !== 'GK' && Math.abs(gx - p.pos.x) < 20 && Math.abs(p.pos.z) < 22) p.pos.x = gx - d * (20.5 + (p.idx % 3) * 1.5);
      const gk = opp(team).players[0]; gk.pos.x = gx - d * 0.4; gk.pos.z = 0;
    } else taker = nearestOf(out, r.x, r.z).p;
    let ax = d, az = 0;                                   // which way the taker faces
    if (r.type === 'throw') { ax = d * 0.4; az = -Math.sign(r.z); }
    else if (r.type === 'corner') { ax = -d * 0.2; az = -Math.sign(r.z); }
    const al = hyp(ax, az); ax /= al; az /= al;
    const back = r.type === 'throw' ? 0.25 : 0.55;
    resetPlayer(taker, r.x - ax * back, r.z - az * back, Math.atan2(ax, az));
    giveBall(taker, r.type === 'throw'); taker.frozen = true; taker.ai.think = rnd(1.1, 1.7);
    if (r.type === 'throw') { taker.mood = 'over'; B.y = 2.05; }
    M.restart = r; M.state = 'restart'; this.snapCam = true;
    if (team.id !== M.userTeam) this.pickCtrl();
  },
  foul(p, o) {
    if (M.state !== 'play') return;
    const t = o.team, gx = goalX(t), pen = Math.abs(gx - o.pos.x) < 16.5 && Math.abs(o.pos.z) < 20.15;
    Sfx.whistle(1);
    this.cut(pen ? { type: 'penalty', x: gx - t.dir * 11, z: 0, team: t } : { type: 'freekick', x: clamp(o.pos.x, -FL + 2, FL - 2), z: clamp(o.pos.z, -FW + 2, FW - 2), team: t }, pen ? 'PENALTY' : 'FREE KICK');
  },
  event(ev) {
    const B = M.ball, lt = M.lastTouch;
    if (ev.type === 'goal') {
      const team = M.teams.find(t => t.dir === ev.side); team.score++;
      this.scorer = lt && lt.team === team ? lt : null; this.own = lt && lt.team !== team;
      M.state = 'goal'; this.stT = 0; this.charge = null; this.goalTeam = team;
      this.say('GOAL!', 3); Sfx.roar(); Sfx.whistle(1);
      const sc = this.scorer;
      for (const p of M.players) { p.kick = null; p.frozen = false; p.mood = p.team === team ? 'cheer' : 'sad'; }
      if (sc) { sc.mood = 'plane'; this.celebZ = (sc.pos.z > 0 ? 1 : -1) * (FW - 4); }
      return;
    }
    if (ev.type === 'touch') {
      const team = lt ? opp(lt.team) : M.teams[0];
      return this.cut({ type: 'throw', x: clamp(B.x, -FL + 1, FL - 1), z: ev.side * (FW - 0.4), team }, 'THROW-IN');
    }
    const def = M.teams.find(t => t.dir === -ev.side);     // team defending that goal line
    if (lt && lt.team === def) this.cut({ type: 'corner', x: ev.side * (FL - 0.35), z: (Math.sign(B.z) || 1) * (FW - 0.35), team: opp(def) }, 'CORNER');
    else this.cut({ type: 'goalkick', x: ev.side * (FL - 5.5), z: (Math.sign(B.z) || 1) * 5, team: def }, 'GOAL KICK');
  },
  update(dt) {
    M.time += dt; if (this.msgT > 0) this.msgT -= dt;
    const st = M.state, live = st === 'play' || st === 'kickoff' || st === 'restart' || st === 'cut';
    if (st !== 'cut') this.fade = Math.max(0, this.fade - dt * 4);
    if (live) {
      M.pred = predictBall();
      if (st !== 'cut') this.userControl(dt);
      for (const t of M.teams) aiTeam(t, dt);
      for (const p of M.players) { movePlayer(p, dt); updateActions(p, dt); }
      separate();
      const ev = stepBall(dt); pickup();
      if (st === 'play') {
        this.clock += dt * 2700 / this.halfLen;
        if (ev) this.event(ev);
        else if (this.clock >= 2700 * this.half) {
          const calm = Math.abs(M.ball.x) < 26 || this.clock > 2700 * this.half + 120;
          if (calm) { this.clock = 2700 * this.half; M.state = this.half === 1 ? 'half' : 'full'; this.stT = 0; Sfx.whistle(this.half === 1 ? 2 : 3); this.charge = null; for (const p of M.players) { p.want.x = p.want.z = 0; p.kick = null; } }
        }
        const ot = M.owner ? M.owner.team : null;          // auto-switch when they win the ball
        if (ot !== this.lastOwnTeam) { this.lastOwnTeam = ot; if (ot && ot.id !== M.userTeam && !M.demo) { const b = M.teams[M.userTeam].chaser; if (b && M.ctrl && b !== M.ctrl && M.ctrl.ai.it > b.ai.it + 0.9) M.ctrl = b; } }
      } else if (st === 'cut') {
        this.cutT += dt; this.fade = sstep(0.8, 1.05, this.cutT);
        if (this.cutT >= 1.1) this.placeRestart(this.cutR);
      }
    } else if (st === 'goal') this.celebrate(dt);
    else if (st === 'half' || st === 'full') {
      this.stT += dt;
      for (const p of M.players) { p.want.x = p.want.z = 0; p.want.face = null; movePlayer(p, dt); }
      stepBall(dt);
    }
    for (const p of M.players) animate(p, dt);
  },
  celebrate(dt) {
    this.stT += dt; const sc = this.scorer, t = this.stT;
    for (const p of M.players) {
      const w = p.want; w.face = null; w.slow = 1; w.sprint = false;
      if (p === sc) {
        if (t < 2.3) { const tx = this.goalTeam.dir * (FL - 9), dx = tx - p.pos.x, dz = this.celebZ - p.pos.z, d = hyp(dx, dz) || 1; w.x = dx / d * 0.9; w.z = dz / d * 0.9; w.sprint = d > 4; }
        else { w.x = w.z = 0; if (!this.punched) { this.punched = true; p.mood = null; playClip(p, 'punch', p.left); } else if (!p.an.clip) p.mood = 'cheer'; }
      } else if (p.team === this.goalTeam && sc) { steerTo(p, sc.pos.x, sc.pos.z, 12); if (dist2(p.pos, sc.pos) < 2.6) w.x = w.z = 0; }
      else if (p.team === this.goalTeam) { w.x = w.z = 0; }
      else { steerTo(p, p.base.x * p.team.dir, p.base.z, 99); w.slow = 0.45; }
      movePlayer(p, dt);
    }
    if (t < 2.3) this.punched = false;
    separate(); stepBall(dt);
    if (t > 4.6 || (t > 1.2 && Input.any)) { if (this.onReplay && !this.skipReplay) this.onReplay(); else this.afterGoal(); }
  },
  afterGoal() { this.kickoff(opp(this.goalTeam)); Sfx.whistle(1); },
  nextHalf() {
    if (this.half === 1) { this.half = 2; for (const t of M.teams) t.dir *= -1; this.kickoff(M.teams[1]); Sfx.whistle(1); }
  },

  /* ---------- controls ---------- */
  pickTarget(c, kind) {
    const I = Input, ml = hyp(I.mx, I.mz), f = ml > 0.3 ? { x: I.mx / ml, z: I.mz / ml } : fwd(c), dir = c.team.dir;
    let best = null, bs = 9;
    for (const m of c.team.players) {
      if (m === c) continue;
      const dx = m.pos.x - c.pos.x, dz = m.pos.z - c.pos.z, d = hyp(dx, dz);
      if (kind === 'long' ? d < 13 : (d < 2.5 || d > 42)) continue;
      const ang = Math.acos(clamp((dx * f.x + dz * f.z) / d, -1, 1)); if (ang > (ml <= 0.3 ? 2.3 : kind === 'long' ? 0.85 : 1.05)) continue;
      const s = ang * (ml <= 0.3 ? 0.7 : 1.7) + (kind === 'long' ? Math.abs(d - 32) * 0.02 : d * (ml <= 0.3 ? 0.06 : 0.035)) + (m.role === 'GK' ? 0.5 : 0) + (kind === 'through' && dx * dir < 0 ? 0.6 : 0);
      if (s < bs) { bs = s; best = m; }
    }
    return { t: best, f };
  },
  doPass(c, kind) {
    const r = M.restart && M.restart.type, dir = c.team.dir, gx = goalX(c.team);
    if (r === 'penalty') return;
    const { t, f } = this.pickTarget(c, kind === 'through' ? 'through' : kind);
    const o = t ? { target: t, face: Math.atan2(t.pos.x - c.pos.x, t.pos.z - c.pos.z) } : { dx: f.x, dz: f.z, face: Math.atan2(f.x, f.z) };
    if (r === 'throw') return startKick(c, 'throw', t && dist2(t.pos, c.pos) < 24 ? o : { pt: { x: c.pos.x + f.x * 12, z: c.pos.z + f.z * 12 } });
    if (kind === 'long' && Math.abs(gx - c.pos.x) < 22 && (Math.abs(c.pos.z) > 13 || r === 'corner')) {   // cross
      const far = Input.mz * Math.sign(c.pos.z) < -0.3 ? 4 : Input.mz * Math.sign(c.pos.z) > 0.3 ? -3.5 : 0;
      const pt = { x: gx - dir * rnd(7, 10), z: -Math.sign(c.pos.z) * far + rnd(-1, 1) };
      return startKick(c, 'cross', { pt, face: Math.atan2(pt.x - c.pos.x, pt.z - c.pos.z) });
    }
    c.mood = null;
    startKick(c, kind, o);
  },
  shotOpts(c, power) {
    const gx = goalX(c.team), gk = opp(c.team).players[0];
    const az = Math.abs(Input.mz) > 0.3 ? Input.mz * 3.0 : (gk.pos.z > 0 ? -1 : 1) * 1.7;
    return { power, az, face: Math.atan2(gx - c.pos.x, az - c.pos.z) };
  },
  userControl(dt) {
    const c = M.ctrl, I = Input; if (!c || M.demo) return;
    const o = M.owner, B = M.ball, mine = o === c, ml = hyp(I.mx, I.mz), w = c.want, team = c.team;
    M.press = false; this.tackleCd -= dt;
    if (c.role === 'GK' && !mine) { this.pickCtrl(); return; }
    if (!(c.lock > 0 && c.kick)) { w.x = I.mx; w.z = I.mz; }
    w.sprint = !!I.down.sprint; w.face = null; w.slow = 1;
    if (c.frozen) w.face = ml > 0.3 ? Math.atan2(I.mx, I.mz) : null;
    if (c.role === 'GK' && mine && B.held) { w.x = w.z = 0; }
    const dBall = hyp(B.x - c.pos.x, B.z - c.pos.z), oursLoose = !o && M.lastTouch && M.lastTouch.team === team;
    // run onto a pass if the stick is idle
    if (!o && ml < 0.2 && c === M.passTarget && c.ai.ip) { steerTo(c, c.ai.ip.x, c.ai.ip.z, 2); w.sprint = true; }
    // shot gauge: hold to charge, release to strike (also arms a first-time shot)
    const pen = M.restart && M.restart.type === 'penalty', thr = M.restart && M.restart.type === 'throw';
    if (I.pressed.shoot && (mine || (!o && (oursLoose || dBall < 7))) && !thr && !(mine && c.role === 'GK' && B.held)) this.charge = { t: 0 };
    if (this.charge) {
      this.charge.t += dt;
      if (!I.down.shoot || this.charge.t >= 0.62) {
        const pw = clamp(this.charge.t / 0.6, 0.12, 1); this.charge = null;
        if (mine) { if (!c.kick) startKick(c, 'shot', this.shotOpts(c, pw)); }
        else if (!o && B.y > 1.2) tryHeader(c, 'shot', { az: this.shotOpts(c, pw).az });
        else if (!o) c.buffer = { type: 'shot', o: this.shotOpts(c, pw), t: 0.7 };
      }
    }
    if (mine) {
      if (c.kick) return;
      if (c.role === 'GK' && B.held) { if (I.pressed.pass || I.pressed.through) keeperRelease(c, 'pass'); else if (I.pressed.long || I.pressed.shoot) keeperRelease(c, 'long'); return; }
      if (pen) return;
      if (I.pressed.pass) this.doPass(c, 'pass');
      else if (I.pressed.through) this.doPass(c, 'through');
      else if (I.pressed.long) this.doPass(c, 'long');
      return;
    }
    if (I.pressed.switch) {                                // nearest team-mate to the ball
      let b = null, bt = 99; for (const p of team.players) if (p !== c && p.role !== 'GK' && p.ai.it < bt) { bt = p.ai.it; b = p; }
      if (b) M.ctrl = b; return;
    }
    if (!o && B.y > 1.2 && dBall < 2.6) {                  // aerial ball: head it on
      if (I.pressed.pass || I.pressed.through) { const { t } = this.pickTarget(c, 'short'); tryHeader(c, 'pass', t ? { target: t } : {}); }
      else if (I.pressed.long) tryHeader(c, 'pass', {});
      return;
    }
    if (oursLoose || (!o && dBall < 5)) {                  // first-time pass
      for (const k of ['pass', 'through', 'long']) if (I.pressed[k]) { const { t, f } = this.pickTarget(c, k === 'long' ? 'long' : 'short'); c.buffer = { type: k, o: t ? { target: t, face: Math.atan2(t.pos.x - c.pos.x, t.pos.z - c.pos.z) } : { dx: f.x, dz: f.z }, t: 0.6 }; }
    }
    if (o && o.team !== team) {                            // defending
      if (I.down.pass) {
        if (ml < 0.2) { const gx = -team.dir * FL, dx = gx - o.pos.x, dz = -o.pos.z, d = hyp(dx, dz) || 1; steerTo(c, o.pos.x + o.vel.x * 0.3 + dx / d * 0.6, o.pos.z + o.vel.z * 0.3 + dz / d * 0.6, 2); w.sprint = w.sprint || dBall > 4; }
        if (dBall < 1.45 && this.tackleCd <= 0) { this.tackleCd = 0.55; standTackle(c); }
      }
      if (I.pressed.long) startSlide(c);
      if (I.down.shoot || I.down.through) M.press = true;
    } else if (!o && I.pressed.long && dBall < 4 && !oursLoose) startSlide(c);
  }
};
