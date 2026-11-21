// Test helpers for driving the game without a visible frame loop. Not part of the published page.
window.sim = (n, dt = 1 / 60) => {
  let err = null;
  try {
    for (let i = 0; i < n; i++) {
      Input.poll(dt); UI.frame();
      if (!UI.paused) { if (M.state === 'replay') Replay.step(dt); else { Game.update(dt); Replay.rec(dt); } syncScene(); Cam.update(dt); }
      UI.hud();
    }
    $('fade').style.opacity = Game.fade;
  } catch (e) { err = e.stack; }
  return err;
};
window.dbg = () => {
  let d = document.getElementById('dbg');
  if (!d) { d = document.createElement('canvas'); d.id = 'dbg'; d.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; $('app').insertBefore(d, $('fade')); }
  return d;
};
window.snap = () => { const d = dbg(), c = $('cv'); d.width = c.width; d.height = c.height; World.renderer.render(World.scene, World.camera); d.getContext('2d').drawImage(c, 0, 0); return M.state; };
window.S = () => ({ st: M.state, t: +M.time.toFixed(2), ctrl: M.ctrl && M.ctrl.num, owner: M.owner && (M.owner.team.id + ':' + M.owner.num), ball: [M.ball.x, M.ball.y, M.ball.z].map(v => +v.toFixed(1)), score: M.teams.map(t => t.score).join('-'), clock: Math.round(Game.clock), msg: Game.msgT > 0 ? Game.msg : '' });
window.hold = (codes, frames) => { for (const c of codes) Input.keys[c] = true; const e = sim(frames); for (const c of codes) Input.keys[c] = false; return e; };
window.sheet = (p, n, stepFn, opt = {}) => {
  const cols = opt.cols || 4, rows = Math.ceil(n / cols), c = $('cv'), d = dbg(), R = World.renderer, W = 1200, H = 900, tw = W / cols, th = H / rows;
  d.width = W; d.height = H; const x = d.getContext('2d'), cam = World.camera;
  R.setPixelRatio(1); R.setSize(tw, th, false); cam.aspect = tw / th; cam.fov = opt.fov || 22; cam.updateProjectionMatrix();
  for (const q of M.players) if (q !== p && !opt.all) q.rig.root.visible = false;
  for (let i = 0; i < n; i++) {
    stepFn(i);
    if (!opt.all) { p.rig.root.position.set(p.pos.x, 0, p.pos.z); p.rig.root.rotation.y = p.yaw; p.rig.shadow.position.set(p.pos.x, 0.02, p.pos.z); }
    const ang = opt.ang === undefined ? 0 : opt.ang, dist = opt.dist || 7;
    cam.position.set(p.pos.x + Math.sin(ang) * dist, opt.h || 1.3, p.pos.z + Math.cos(ang) * dist); cam.lookAt(p.pos.x, opt.ly || 0.95, p.pos.z);
    R.render(World.scene, cam); x.drawImage(c, (i % cols) * tw, Math.floor(i / cols) * th, tw, th);
  }
  for (const q of M.players) q.rig.root.visible = true; World.resize();
};
window.testP = (o = {}) => {
  const p = M.players[9];
  Object.assign(p, { yaw: Math.PI / 2, speed: 0, accF: 0, accL: 0, hasBall: false, mood: null, ready: 0, lookYaw: 0, state: 'run' }, o);
  p.pos.x = 0; p.pos.z = 0; p.vel.x = p.speed; p.vel.z = 0; p.an.clip = null; M.ball.x = 30;
  World.ball.position.set(30, 0, 0); World.ballShadow.position.set(30, 0, 0); World.cursor.visible = World.ring.visible = false; return p;
};
// run a whole CPU-v-CPU match quickly and tally what happened
window.soak = (seconds, dt = 1 / 60) => {
  const tally = {}, bump = k => tally[k] = (tally[k] || 0) + 1; let last = M.state, err = null, stuck = 0, lastBall = '';
  for (let i = 0; i < seconds / dt && !err; i++) {
    err = sim(1, dt);
    if (M.state !== last) { bump(M.state + (M.state === 'cut' ? ':' + Game.cutR.type : '')); last = M.state; }
    for (const p of M.players) if (!isFinite(p.pos.x + p.pos.z + p.yaw)) err = 'NaN player ' + p.num;
    if (!isFinite(M.ball.x + M.ball.y + M.ball.z)) err = 'NaN ball';
    const b = M.ball.x.toFixed(1) + M.ball.z.toFixed(1); if (b === lastBall && M.state !== 'half' && M.state !== 'full') stuck++; else stuck = 0; lastBall = b;
    if (stuck > 60 * 12) { err = 'ball stuck 12s in state ' + M.state + ' ' + JSON.stringify(S()) + ' restart=' + (M.restart && M.restart.type) + ' frozen=' + M.players.filter(p => p.frozen).map(p => p.team.id + ':' + p.num + ':' + p.role); }
  }
  return { err, tally, end: S() };
};
window.stats = (seconds) => {
  const cnt = {}, _sk = startKick, _rt = resolveTackle; let tk = 0, tkOk = 0;
  startKick = function (p, type, o) { const r = _sk(p, type, o); if (r) cnt[type] = (cnt[type] || 0) + 1; return r; };
  resolveTackle = function (p, s) { const o0 = M.owner; const r = _rt(p, s); tk++; if (r && o0 && M.owner !== o0) tkOk++; return r; };
  let zone = [0, 0, 0, 0, 0, 0], poss = [0, 0, 0], maxOwn = 0, ownT = 0, lastO = null, ev = {}, lastS = M.state, err = null, n = seconds * 60, saves = 0, heldPrev = false;
  for (let i = 0; i < n && !err; i++) {
    err = sim(1); const b = M.ball;
    zone[Math.min(5, Math.max(0, Math.floor((b.x + FL) / (2 * FL) * 6)))]++; poss[M.owner ? M.owner.team.id : 2]++;
    if (M.owner === lastO && lastO) { ownT++; maxOwn = Math.max(maxOwn, ownT); } else { ownT = 0; lastO = M.owner; }
    if (b.held && !heldPrev && M.owner && M.owner.role === 'GK') saves++; heldPrev = b.held;
    if (M.state !== lastS) { const k = M.state === 'cut' ? Game.cutR.type : M.state; ev[k] = (ev[k] || 0) + 1; lastS = M.state; }
    for (const p of M.players) if (!isFinite(p.pos.x + p.pos.z + p.yaw)) err = 'NaN player';
  }
  startKick = _sk; resolveTackle = _rt;
  return { err, cnt, tk, tkOk, gkCatches: saves, ev, zone: zone.map(z => Math.round(z / n * 100)), poss: poss.map(z => Math.round(z / n * 100)), maxOwnSec: +(maxOwn / 60).toFixed(1), score: S().score };
};
window.loadTools = 1;
