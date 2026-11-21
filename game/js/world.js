'use strict';
/* ---------- stadium, pitch, goals, ball: all generated, no image files ---------- */
const World = {
  retro: true,
  init(canvas) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    const sc = this.scene = new THREE.Scene();
    sc.background = new THREE.Color(0x070b18);
    sc.fog = new THREE.Fog(0x070b18, 150, 330);
    this.camera = new THREE.PerspectiveCamera(22, 16 / 9, 2, 420);
    sc.add(new THREE.HemisphereLight(0xe8eeff, 0x3d5c3d, 0.82));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.55); d1.position.set(30, 70, 60); sc.add(d1);
    const d2 = new THREE.DirectionalLight(0xdfe6ff, 0.28); d2.position.set(-40, 50, -50); sc.add(d2);
    this.pitch(); this.goals(); this.stands(); this.props();
    addEventListener('resize', () => this.resize()); this.resize();
  },
  canvasTex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
    t.anisotropy = 4; return t;
  },
  pitch() {
    const S = 16, MX = 11, MZ = 9, W = (FL + MX) * 2, H = (FW + MZ) * 2;
    const tex = this.canvasTex(W * S, H * S, (x, w, h) => {
      x.fillStyle = '#226b31'; x.fillRect(0, 0, w, h);
      const X = v => (v + FL + MX) * S, Z = v => (v + FW + MZ) * S;
      for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#2c8a3c' : '#31963f'; x.fillRect(X(-FL + i * 7.5), Z(-FW), 7.5 * S, FW * 2 * S); }
      for (let i = 0; i < 26000; i++) {            // grass grain
        x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,220,.035)' : 'rgba(0,30,0,.05)';
        x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2);
      }
      x.strokeStyle = 'rgba(255,255,255,.93)'; x.lineWidth = 2.6; x.fillStyle = 'rgba(255,255,255,.93)';
      const rect = (x0, z0, x1, z1) => x.strokeRect(X(x0), Z(z0), (x1 - x0) * S, (z1 - z0) * S);
      rect(-FL, -FW, FL, FW);
      x.beginPath(); x.moveTo(X(0), Z(-FW)); x.lineTo(X(0), Z(FW)); x.stroke();
      x.beginPath(); x.arc(X(0), Z(0), 9.15 * S, 0, 7); x.stroke();
      x.beginPath(); x.arc(X(0), Z(0), 0.3 * S, 0, 7); x.fill();
      for (const s of [-1, 1]) {
        rect(Math.min(s * FL, s * (FL - 16.5)), -20.15, Math.max(s * FL, s * (FL - 16.5)), 20.15);
        rect(Math.min(s * FL, s * (FL - 5.5)), -9.15, Math.max(s * FL, s * (FL - 5.5)), 9.15);
        x.beginPath(); x.arc(X(s * (FL - 11)), Z(0), 0.28 * S, 0, 7); x.fill();
        const a = Math.acos(5.5 / 9.15);
        x.beginPath(); x.arc(X(s * (FL - 11)), Z(0), 9.15 * S, s > 0 ? Math.PI - a : -a, s > 0 ? Math.PI + a : a); x.stroke();
        for (const t of [-1, 1]) {
          x.beginPath();
          const a0 = s > 0 ? (t > 0 ? Math.PI : Math.PI / 2) : (t > 0 ? -Math.PI / 2 : 0);
          x.arc(X(s * FL), Z(t * FW), S, a0, a0 + Math.PI / 2); x.stroke();
        }
      }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2; this.scene.add(m);
    const out = new THREE.Mesh(new THREE.PlaneGeometry(520, 420), new THREE.MeshLambertMaterial({ color: 0x1b2a22 }));
    out.rotation.x = -Math.PI / 2; out.position.y = -0.05; this.scene.add(out);
  },
  goals() {
    const white = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x555555 });
    const net = new THREE.MeshBasicMaterial({
      map: this.canvasTex(32, 32, x => { x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2; x.strokeRect(0, 0, 32, 32); }, 1, 1),
      transparent: true, side: THREE.DoubleSide, depthWrite: false
    });
    const plane = (w, h, rx, ry) => { const g = new THREE.PlaneGeometry(w, h); const mt = net.clone(); mt.map = net.map.clone(); mt.map.needsUpdate = true; mt.map.wrapS = mt.map.wrapT = THREE.RepeatWrapping; mt.map.repeat.set(rx, ry); return new THREE.Mesh(g, mt); };
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.x = s * FL; g.scale.x = s; this.scene.add(g);
      const post = z => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, GOAL_H, 8), white); p.position.set(0, GOAL_H / 2, z); g.add(p); };
      post(-GOAL_HW); post(GOAL_HW);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, GOAL_HW * 2 + 0.13, 8), white);
      bar.rotation.x = Math.PI / 2; bar.position.y = GOAL_H; g.add(bar);
      const back = plane(GOAL_HW * 2, GOAL_H, 24, 8); back.rotation.y = Math.PI / 2; back.position.set(2, GOAL_H / 2, 0); g.add(back);
      const top = plane(2, GOAL_HW * 2, 7, 24); top.rotation.x = Math.PI / 2; top.position.set(1, GOAL_H, 0); g.add(top);
      for (const t of [-1, 1]) { const sd = plane(2, GOAL_H, 7, 8); sd.position.set(1, GOAL_H / 2, t * GOAL_HW); g.add(sd); }
    }
  },
  stands() {
    const pal = ['#c9463d', '#3d6fc9', '#e8e2d0', '#2b2f3a', '#d9a441', '#7a7f8c', '#8a5a44', '#e9c7a8', '#4d8a63'];
    const crowd = this.canvasTex(512, 256, (x, w, h) => {
      x.fillStyle = '#12151f'; x.fillRect(0, 0, w, h);
      for (let y = 4; y < h; y += 7) for (let px = (y / 7 % 2) * 3; px < w; px += 6) {
        if (Math.random() < 0.08) continue;
        x.fillStyle = pal[Math.random() * pal.length | 0]; x.fillRect(px, y, 4, 4);
        x.fillStyle = '#d8b08c'; x.fillRect(px + 1, y - 2, 2, 2);
      }
    }, 6, 1);
    this.crowdMat = new THREE.MeshBasicMaterial({ map: crowd, color: 0x9a9aa8 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x0c0f1a }), roof = new THREE.MeshBasicMaterial({ color: 0x1a2033 });
    const ads = ['NORDWIND', 'TORA TYRES', 'LUMEN', 'KITE AIR', 'HALF VOLLEY', 'MIZU', 'OAKFIELD BANK', 'PIXEL COLA'];
    const cols = ['#103a8c', '#b3241c', '#f2f2f2', '#0c7a52', '#f0b400', '#1c1c24', '#6a2a8a', '#d94f14'];
    const adTex = this.canvasTex(2048, 64, (x, w, h) => {
      ads.forEach((t, i) => {
        x.fillStyle = cols[i]; x.fillRect(i * 256, 0, 256, h);
        x.fillStyle = (i === 2 || i === 4) ? '#111' : '#fff'; x.font = '900 30px Arial Black, Arial, sans-serif';
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, i * 256 + 128, 34, 236);
      });
    });
    const side = (len, off, rot) => {
      const g = new THREE.Group(); g.rotation.y = rot; this.scene.add(g);
      const depth = 30, rise = 17, slope = hyp(depth, rise);
      const st = new THREE.Mesh(new THREE.PlaneGeometry(len, slope), this.crowdMat);
      st.rotation.x = -Math.atan2(depth, rise); st.position.set(0, 1.6 + rise / 2, -off - 7 - depth / 2); g.add(st);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.7), dark); wall.position.set(0, 0.85, -off - 7); g.add(wall);
      const bk = new THREE.Mesh(new THREE.PlaneGeometry(len + 70, 34), dark); bk.position.set(0, 17, -off - 7 - depth); g.add(bk);
      if (rot !== Math.PI) { const rf = new THREE.Mesh(new THREE.BoxGeometry(len + 20, 1.2, 26), roof); rf.position.set(0, 28, -off - 7 - depth + 10); g.add(rf); }  // the camera sits above the near stand
      const at = adTex.clone(); at.needsUpdate = true; at.wrapS = THREE.RepeatWrapping; at.repeat.x = len / 110;
      const ad = new THREE.Mesh(new THREE.PlaneGeometry(len - 6, 1), new THREE.MeshBasicMaterial({ map: at }));
      ad.position.set(0, 0.5, -off - 4.2); g.add(ad);
    };
    side(140, FW, 0); side(140, FW, Math.PI); side(96, FL, Math.PI / 2); side(96, FL, -Math.PI / 2);
    const glow = new THREE.SpriteMaterial({
      map: this.canvasTex(64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,245,1)'); g.addColorStop(0.25, 'rgba(255,250,220,.55)'); g.addColorStop(1, 'rgba(255,250,220,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }),
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const s = new THREE.Sprite(glow); s.position.set(sx * 78, 38, sz * 62); s.scale.set(26, 26, 1); this.scene.add(s); }
  },
  props() {
    const sc = this.scene;
    const btex = this.canvasTex(128, 64, (x, w, h) => {
      x.fillStyle = '#f6f6f2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1c1f2b';
      for (const [u, v] of [[16, 16], [48, 44], [80, 16], [112, 44], [16, 60], [80, 60], [48, 0], [112, 0]]) { x.beginPath(); x.arc(u, v, 9, 0, 7); x.fill(); }
    });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R * 1.3, 12, 9), new THREE.MeshLambertMaterial({ map: btex, emissive: 0x333333 }));
    sc.add(this.ball);
    this.ballShadow = new THREE.Mesh(RG.shadow, RG.shadowMat); this.ballShadow.scale.setScalar(0.42); sc.add(this.ballShadow);
    const cm = new THREE.MeshBasicMaterial({ color: 0xffe14a, depthTest: false, transparent: true });
    this.cursor = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.38, 3), cm); this.cursor.rotation.x = Math.PI; this.cursor.renderOrder = 5; sc.add(this.cursor);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.52, 0.64, 20), new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.8, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.03; sc.add(this.ring);
    this.mark = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }));
    this.mark.rotation.x = -Math.PI / 2; this.mark.position.y = 0.03; this.mark.visible = false; sc.add(this.mark);
    const pole = new THREE.CylinderGeometry(0.025, 0.025, 1.5, 5), fm = new THREE.MeshBasicMaterial({ color: 0xf2d21b, side: THREE.DoubleSide });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(pole, new THREE.MeshLambertMaterial({ color: 0xffffff })); p.position.set(sx * FL, 0.75, sz * FW); sc.add(p);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), fm); f.position.set(sx * FL - sx * 0.2, 1.35, sz * FW); sc.add(f);
    }
  },
  resize() {
    const c = this.renderer.domElement, w = c.clientWidth || innerWidth, h = c.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2), scale = this.retro ? Math.min(1, 480 / h) : dpr;
    this.renderer.setPixelRatio(scale); this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
};
