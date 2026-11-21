'use strict';
/* ---------- constants & math ---------- */
const FL = 52.5, FW = 34;            // pitch half-length (x) and half-width (z), metres
const GOAL_HW = 3.66, GOAL_H = 2.44; // goal half-width, height
const BALL_R = 0.11, GRAV = 11.5;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
const hyp = Math.hypot;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rndN = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2; // ~N(0,1)
const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const dist2 = (a, b) => hyp(a.x - b.x, a.z - b.z);
const $ = id => document.getElementById(id);

/* ---------- input: keyboard + gamepad + touch ---------- */
const BTN = ['pass', 'long', 'shoot', 'through', 'sprint', 'switch', 'start'];
const KEYMAP = {
  KeyX: 'pass', KeyA: 'long', KeyD: 'shoot', KeyS: 'through',
  ShiftLeft: 'sprint', ShiftRight: 'sprint', KeyE: 'sprint', Space: 'sprint',
  KeyQ: 'switch', Tab: 'switch', Enter: 'start', KeyP: 'start', Escape: 'start'
};
const Input = {
  mx: 0, mz: 0, down: {}, prev: {}, pressed: {}, released: {}, holdT: {},
  keys: {}, touch: { mx: 0, mz: 0, btn: {} }, any: false, usedTouch: false,
  init() {
    addEventListener('keydown', e => {
      if (KEYMAP[e.code] || e.code.startsWith('Arrow')) e.preventDefault();
      this.keys[e.code] = true;
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    this.initTouch();
  },
  initTouch() {
    const pad = $('stick'), nub = $('nub');
    if (!pad) return;
    let id = null, cx = 0, cy = 0;
    const move = t => {
      let dx = t.clientX - cx, dy = t.clientY - cy; const d = hyp(dx, dy), R = 46;
      if (d > R) { dx *= R / d; dy *= R / d; }
      nub.style.transform = `translate(${dx}px,${dy}px)`;
      this.touch.mx = d < 10 ? 0 : dx / R; this.touch.mz = d < 10 ? 0 : dy / R;
    };
    pad.addEventListener('touchstart', e => {
      e.preventDefault(); this.usedTouch = true; const t = e.changedTouches[0]; id = t.identifier;
      const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(t);
    }, { passive: false });
    pad.addEventListener('touchmove', e => {
      e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === id) move(t);
    }, { passive: false });
    const end = e => {
      for (const t of e.changedTouches) if (t.identifier === id) {
        id = null; this.touch.mx = this.touch.mz = 0; nub.style.transform = '';
      }
    };
    pad.addEventListener('touchend', end); pad.addEventListener('touchcancel', end);
    document.querySelectorAll('[data-btn]').forEach(el => {
      const b = el.dataset.btn;
      el.addEventListener('touchstart', e => { e.preventDefault(); this.usedTouch = true; this.touch.btn[b] = true; }, { passive: false });
      const up = e => { e.preventDefault(); this.touch.btn[b] = false; };
      el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
    });
  },
  poll(dt) {
    const k = this.keys; let mx = 0, mz = 0; const d = {};
    if (k.ArrowLeft) mx -= 1; if (k.ArrowRight) mx += 1;
    if (k.ArrowUp) mz -= 1; if (k.ArrowDown) mz += 1;
    for (const c in KEYMAP) if (k[c]) d[KEYMAP[c]] = true;
    const gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected);
    if (gp) {
      const ax = gp.axes[0] || 0, az = gp.axes[1] || 0;
      if (hyp(ax, az) > 0.25) { mx += ax; mz += az; }
      const b = i => gp.buttons[i] && gp.buttons[i].pressed;
      if (b(14)) mx -= 1; if (b(15)) mx += 1; if (b(12)) mz -= 1; if (b(13)) mz += 1;
      if (b(0)) d.pass = true; if (b(1)) d.long = true; if (b(2)) d.shoot = true; if (b(3)) d.through = true;
      if (b(5) || b(7)) d.sprint = true; if (b(4) || b(6)) d.switch = true; if (b(9)) d.start = true;
    }
    mx += this.touch.mx; mz += this.touch.mz;
    for (const b in this.touch.btn) if (this.touch.btn[b]) d[b] = true;
    const m = hyp(mx, mz);
    if (m > 1) { mx /= m; mz /= m; }
    this.mx = mx; this.mz = mz; this.any = false;
    for (const b of BTN) {
      this.pressed[b] = !!d[b] && !this.prev[b];
      this.released[b] = !d[b] && !!this.prev[b];
      this.holdT[b] = d[b] ? (this.prev[b] ? (this.holdT[b] || 0) + dt : 0) : (this.released[b] ? this.holdT[b] : 0);
      if (this.pressed[b]) this.any = true;
      this.prev[b] = !!d[b];
    }
    this.down = d;
  }
};

/* ---------- audio: everything synthesised ---------- */
const Sfx = {
  ctx: null, crowd: null, level: 0.25, on: true,
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const ctx = this.ctx = new C();
      const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.03 * (Math.random() * 2 - 1)) / 1.03; d[i] = last * 4; }
      this.noise = buf;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.5;
      const g = this.crowd = ctx.createGain(); g.gain.value = 0;
      this.master = ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(ctx.destination);
      src.connect(bp); bp.connect(g); g.connect(this.master); src.start();
    } catch (e) { this.ctx = null; }
  },
  tick(dt, excite) {
    if (!this.ctx) return;
    this.level = damp(this.level, 0.22 + excite * 0.6, excite > this.level ? 5 : 0.7, dt);
    this.crowd.gain.value = this.on ? this.level * 0.5 : 0;
  },
  burst(dur, freq, vol, q = 1) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(0, Math.random() * 2); s.stop(c.currentTime + dur);
  },
  tone(type, f0, f1, dur, vol) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, c.currentTime); o.frequency.exponentialRampToValueAtTime(f1, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + dur);
  },
  kick(power = 0.5) { this.tone('sine', 190 + power * 60, 55, 0.11, 0.5 + power * 0.4); this.burst(0.06, 1800, 0.25 + power * 0.3); },
  bounce() { this.tone('sine', 130, 60, 0.07, 0.25); },
  post() { this.tone('triangle', 880, 700, 0.35, 0.4); this.tone('sine', 220, 120, 0.2, 0.5); },
  whistle(n = 1) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx;
    for (let i = 0; i < n; i++) {
      const t = c.currentTime + i * 0.38, len = i === n - 1 && n > 1 ? 0.7 : 0.28;
      const o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain();
      o.type = 'square'; o.frequency.value = 2350; l.frequency.value = 38; lg.gain.value = 120;
      l.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11, t + 0.02);
      g.gain.setValueAtTime(0.11, t + len - 0.05); g.gain.linearRampToValueAtTime(0, t + len);
      o.connect(g); g.connect(this.master); o.start(t); l.start(t); o.stop(t + len); l.stop(t + len);
    }
  },
  roar() { this.level = 1.3; this.burst(2.4, 900, 0.9, 0.4); },
  ooh() { this.level = Math.max(this.level, 0.8); this.burst(0.9, 500, 0.45, 0.6); }
};
