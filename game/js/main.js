'use strict';
/* ---------- camera, replay, HUD, menu, main loop ---------- */
const Cam = {
  x: 0, z: 0, fov: 22, look: new THREE.Vector3(), pos: new THREE.Vector3(0, 30, 62),
  update(dt) {
    const B = M.ball, cam = World.camera, snap = Game.snapCam; Game.snapCam = false;
    const wide = clamp(22 * Math.pow(1.78 / cam.aspect, 0.62), 20, 50);
    let fx = clamp(B.x + B.vx * 0.35, -FL + 13, FL - 13), fz = clamp(B.z, -FW, FW) * 0.6, fov = wide, px, py, pz, ly = 0;
    if (M.state === 'replay') {
      const s = Replay.side;
      px = s * (FL - 24); py = 3.4; pz = 33; fx = B.x; fz = B.z; ly = Math.max(1, B.y * 0.8); fov = wide * 0.62;
    } else if (M.state === 'goal' && Game.scorer) {
      const sc = Game.scorer; fx = sc.pos.x; fz = sc.pos.z; ly = 1; fov = wide * 0.6; px = fx * 0.94; py = 22; pz = fz + 56;
    } else { px = fx * 0.93; py = 30; pz = fz + 62; }
    const r = snap ? 1 : 1 - Math.exp(-(M.state === 'replay' ? 6 : 3.4) * dt);
    this.x += (fx - this.x) * r; this.z += (fz - this.z) * r;
    if (M.state === 'replay') this.pos.set(px, py, pz); else this.pos.set(px + (this.x - fx) * 0.93, py, pz + (this.z - fz));
    if (snap) cam.position.copy(this.pos); else cam.position.lerp(this.pos, 1 - Math.exp(-5 * dt));
    this.fov = snap ? fov : damp(this.fov, fov, 3, dt);
    if (Math.abs(cam.fov - this.fov) > 0.01) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
    this.look.set(this.x, ly, this.z - (M.state === 'replay' ? 0 : 2)); cam.lookAt(this.look);
  }
};

const Replay = {
  N: 420, per: 22 * (3 + ND) + 7, buf: [], dts: new Float32Array(420), head: 0, count: 0, acc: 0, t: 0, order: [], times: [], total: 0, side: 1, el: 0,
  init() { for (let i = 0; i < this.N; i++) this.buf.push(new Float32Array(this.per)); },
  clear() { this.count = 0; this.head = 0; this.acc = 0; },
  rec(dt) {
    if (!(M.state === 'play' || (M.state === 'goal' && Game.stT < 1.4))) return;
    this.acc += dt; if (this.acc < 1 / 61) return;
    const f = this.buf[this.head]; let o = 0;
    for (const p of M.players) { f[o] = p.pos.x; f[o + 1] = p.pos.z; f[o + 2] = p.yaw; f.set(p.an.pose, o + 3); o += 3 + ND; }
    const B = M.ball; f[o] = B.x; f[o + 1] = B.y; f[o + 2] = B.z; f[o + 3] = B.rot.x; f[o + 4] = B.rot.y; f[o + 5] = B.rot.z; f[o + 6] = B.rot.w;
    this.dts[this.head] = this.acc; this.acc = 0; this.head = (this.head + 1) % this.N; this.count = Math.min(this.N, this.count + 1);
  },
  begin() {
    if (this.count < 60) return Game.afterGoal();
    this.order = []; this.times = []; let t = 0;
    for (let i = 0; i < this.count; i++) { const k = (this.head - this.count + i + this.N * 2) % this.N; t += this.dts[k]; this.order.push(k); this.times.push(t); }
    this.total = t; this.t = Math.max(0, t - 6.2); this.i = 0; this.el = 0; this.side = Game.goalTeam.dir; this.tmp = newPose();
    M.state = 'replay'; Game.snapCam = true; Game.fade = 1;
  },
  step(dt) {
    this.t += dt * 0.5; this.el += dt; Game.fade = Math.max(0, Game.fade - dt * 4);
    if (this.t >= this.total || (this.el > 0.6 && Input.any)) { Game.fade = 1; return Game.afterGoal(); }
    while (this.i < this.times.length - 2 && this.times[this.i + 1] < this.t) this.i++;
    const a = this.buf[this.order[this.i]], b = this.buf[this.order[this.i + 1]], t0 = this.times[this.i], t1 = this.times[this.i + 1];
    const k = clamp((this.t - t0) / (t1 - t0 || 1), 0, 1); let o = 0;
    for (const p of M.players) {
      const r = p.rig, x = lerp(a[o], b[o], k), z = lerp(a[o + 1], b[o + 1], k);
      r.root.position.set(x, 0, z); r.root.rotation.y = a[o + 2] + wrapPi(b[o + 2] - a[o + 2]) * k; r.shadow.position.set(x, 0.02, z);
      for (let j = 0; j < ND; j++) this.tmp[j] = a[o + 3 + j] + (b[o + 3 + j] - a[o + 3 + j]) * k;
      applyPose(r, this.tmp); o += 3 + ND;
    }
    const B = M.ball; B.x = lerp(a[o], b[o], k); B.y = lerp(a[o + 1], b[o + 1], k); B.z = lerp(a[o + 2], b[o + 2], k); B.vx = 0;
    B.rot.set(a[o + 3], a[o + 4], a[o + 5], a[o + 6]);
  }
};

function syncScene() {
  if (M.state !== 'replay') for (const p of M.players) {
    p.rig.root.position.set(p.pos.x, 0, p.pos.z); p.rig.root.rotation.y = p.yaw; p.rig.shadow.position.set(p.pos.x, 0.02, p.pos.z);
  }
  const B = M.ball, W = World;
  W.ball.position.set(B.x, B.y - BALL_R + BALL_R * 1.3, B.z); W.ball.quaternion.copy(B.rot);
  W.ballShadow.position.set(B.x, 0.025, B.z); W.ballShadow.scale.setScalar(0.42 + B.y * 0.05);
  const c = M.ctrl, show = c && !M.demo && (M.state === 'play' || M.state === 'restart' || M.state === 'kickoff' || M.state === 'cut');
  W.cursor.visible = W.ring.visible = !!show;
  if (show) { W.cursor.position.set(c.pos.x, 2.25 + c.an.pose[D.rootY] + Math.sin(M.time * 6) * 0.05, c.pos.z); W.ring.position.set(c.pos.x, 0.03, c.pos.z); }
  const pt = M.passTarget; W.mark.visible = !!(show && pt && pt.team.id === M.userTeam && !M.owner);
  if (W.mark.visible) { W.mark.position.set(pt.pos.x, 0.03, pt.pos.z); W.mark.rotation.z = M.time * 3; }
}

const UI = {
  mode: 'menu', you: 0, foe: 1, mins: 3, diff: 1, paused: false, last: {},
  set(id, v) { if (this.last[id] !== v) { this.last[id] = v; $(id).textContent = v; } },
  init() {
    const chips = (host, key) => {
      CLUBS.forEach((c, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.id = host + '-' + i;
        b.innerHTML = `<i style="background:${c.css}"></i>${c.name}`;
        b.addEventListener('click', () => { this[key] = i; if (this.you === this.foe) this[key === 'you' ? 'foe' : 'you'] = (i + 1) % CLUBS.length; this.paint(); this.demo(); });
        $(host).appendChild(b);
      });
    };
    chips('pick-you', 'you'); chips('pick-foe', 'foe');
    document.querySelectorAll('[data-mins]').forEach(b => b.addEventListener('click', () => { this.mins = +b.dataset.mins; this.paint(); }));
    document.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => { this.diff = +b.dataset.diff; this.paint(); }));
    $('go').addEventListener('click', () => this.startMatch());
    $('panel-go').addEventListener('click', () => this.panelGo());
    $('quit').addEventListener('click', () => this.toMenu());
    $('snd').addEventListener('click', () => { Sfx.on = !Sfx.on; $('snd').textContent = Sfx.on ? 'Sound on' : 'Sound off'; });
    $('res').addEventListener('click', () => { World.retro = !World.retro; World.resize(); $('res').textContent = World.retro ? '480-line picture' : 'Sharp picture'; });
    this.paint(); this.demo();
  },
  paint() {
    CLUBS.forEach((c, i) => { $('pick-you-' + i).setAttribute('aria-pressed', i === this.you); $('pick-foe-' + i).setAttribute('aria-pressed', i === this.foe); });
    document.querySelectorAll('[data-mins]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.mins === this.mins));
    document.querySelectorAll('[data-diff]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.diff === this.diff));
  },
  demo() { Replay.clear(); Game.skipReplay = true; Game.start(this.you, this.foe, 99999, 2, true); },
  startMatch() {
    Sfx.start(); this.mode = 'match'; this.paused = false; M.userTeam = 0; Replay.clear();
    Game.skipReplay = false; Game.onReplay = () => Replay.begin();
    Game.start(this.you, this.foe, this.mins * 60, this.diff, false);
    $('menu').hidden = true; $('hud').hidden = false; $('panel').hidden = true;
    $('touch').hidden = !('ontouchstart' in window);
    const a = M.teams[0].club, b = M.teams[1].club;
    $('tA').textContent = a.short; $('tB').textContent = b.short; $('cA').style.background = a.css; $('cB').style.background = b.css;
    $('cv').focus();
  },
  toMenu() { this.mode = 'menu'; this.paused = false; $('menu').hidden = false; $('hud').hidden = true; $('panel').hidden = true; $('touch').hidden = true; this.demo(); },
  panel(title, sub, btn, quit) { $('panel-title').textContent = title; $('panel-sub').textContent = sub; $('panel-go').textContent = btn; $('quit').hidden = !quit; $('panel').hidden = false; },
  panelGo() {
    $('panel').hidden = true;
    if (this.paused) { this.paused = false; return; }
    if (M.state === 'half') Game.nextHalf(); else if (M.state === 'full') this.toMenu();
  },
  frame() {
    if (this.mode !== 'match') { if (Input.pressed.start && !$('menu').hidden) this.startMatch(); return; }
    const st = M.state, T = M.teams, sc = `${T[0].score} \u2013 ${T[1].score}`;
    if ((st === 'half' || st === 'full') && Game.stT > 1) {
      if ($('panel').hidden && !this.shown) { this.shown = true; this.panel(st === 'half' ? 'Half time' : 'Full time', `${T[0].club.name} ${sc} ${T[1].club.name}`, st === 'half' ? 'Second half' : 'Back to menu', false); }
      if (Game.stT > 1.6 && (Input.pressed.start || Input.pressed.pass)) { this.shown = false; this.panelGo(); }
      return;
    }
    this.shown = false;
    if (Input.pressed.start) {
      if (this.paused) { this.paused = false; $('panel').hidden = true; }
      else if (st !== 'replay') { this.paused = true; this.panel('Paused', `${T[0].club.name} ${sc} ${T[1].club.name}`, 'Resume', true); }
    }
  },
  hud() {
    if (this.mode !== 'match') return;
    const T = M.teams, c = M.ctrl, m = Math.min(Game.clock, 2700 * Game.half) / 60;
    this.set('sA', T[0].score); this.set('sB', T[1].score);
    this.set('clock', String(Math.floor(m)).padStart(2, '0') + ':' + String(Math.floor(m * 60 % 60)).padStart(2, '0'));
    this.set('half', Game.half === 1 ? '1st' : '2nd');
    this.set('who', c ? `${c.num}  ${c.name}` : '');
    const g = Game.charge ? clamp(Game.charge.t / 0.6, 0, 1) : 0;
    if (this.last.g !== g) { this.last.g = g; $('gauge').style.opacity = g > 0 ? 1 : 0; $('gauge-fill').style.width = (g * 100) + '%'; }
    let msg = Game.msgT > 0 ? Game.msg : '';
    if (M.state === 'goal' && Game.stT > 0.9 && Game.msgT > 0) msg = Game.own ? 'Own goal' : Game.scorer ? `${Game.scorer.num} ${Game.scorer.name}` : 'GOAL!';
    if (M.state === 'kickoff' && M.restart && M.restart.team.id === M.userTeam) msg = 'Press X to kick off';
    this.set('msg', msg);
    $('rtag').hidden = M.state !== 'replay';
    this.radar();
  },
  radar() {
    const cv = $('radar'), x = cv.getContext('2d'), w = cv.width, h = cv.height, X = v => (v + FL) / (2 * FL) * (w - 8) + 4, Z = v => (v + FW) / (2 * FW) * (h - 8) + 4;
    x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(12,40,22,.62)'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(243,241,231,.5)'; x.lineWidth = 1; x.strokeRect(4.5, 4.5, w - 9, h - 9);
    x.beginPath(); x.moveTo(w / 2, 4); x.lineTo(w / 2, h - 4); x.stroke(); x.beginPath(); x.arc(w / 2, h / 2, 9, 0, 7); x.stroke();
    for (const p of M.players) {
      x.fillStyle = p === M.ctrl ? '#ffe14a' : p.team.club.css; x.beginPath(); x.arc(X(p.pos.x), Z(p.pos.z), p === M.ctrl ? 3.4 : 2.6, 0, 7); x.fill();
      if (p.team.id === 1) { x.strokeStyle = 'rgba(0,0,0,.6)'; x.stroke(); }
    }
    x.fillStyle = '#fff'; x.beginPath(); x.arc(X(M.ball.x), Z(M.ball.z), 2, 0, 7); x.fill();
  }
};

let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.034, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
  Input.poll(dt); UI.frame();
  if (!UI.paused) {
    if (M.state === 'replay') Replay.step(dt); else { Game.update(dt); Replay.rec(dt); }
    syncScene(); Cam.update(dt);
  }
  UI.hud();
  $('fade').style.opacity = Game.fade;
  const B = M.ball;
  Sfx.tick(dt, UI.mode === 'match' ? clamp(1 - (FL - Math.abs(B.x)) / 30, 0, 1) * 0.5 + (M.state === 'goal' ? 1 : 0) : 0);
  World.renderer.render(World.scene, World.camera);
}
function boot() {
  if (!window.THREE) { $('menu').innerHTML = '<p class="err">The 3D library did not load. Check your connection and reload.</p>'; return; }
  try {
    initRigGeo(); World.init($('cv')); Replay.init(); Input.init(); UI.init();
    requestAnimationFrame(frame);
  } catch (e) { console.error(e); $('menu').innerHTML = '<p class="err">This browser could not start WebGL, which the game needs.</p>'; }
}
boot();
