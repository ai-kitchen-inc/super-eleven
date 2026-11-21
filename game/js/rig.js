'use strict';
/* ---------- pose: one flat array of joint values, authored in anatomical terms ----------
   Hip/Shoulder Rx = flexion (+forward)   Rz = abduction (+away from midline)
   HipRy = external rotation (+toes out)  ShRy = internal rotation (+arm/forearm inward)
   Kn / El = flexion                      An = plantar flexion (+toes down)
   pel/sp/ch/hd Rx = bend forward, Ry = turn left, Rz = lean right
   root* = whole body about the feet: Rx pitch forward, Rz roll right, Ry yaw, Y lift */
const DOF = ['rootY', 'rootRx', 'rootRy', 'rootRz', 'hipY', 'hipX', 'hipZ',
  'pelRx', 'pelRy', 'pelRz', 'spRx', 'spRy', 'spRz', 'chRx', 'chRy', 'chRz', 'hdRx', 'hdRy', 'hdRz',
  'lShRx', 'lShRy', 'lShRz', 'lEl', 'rShRx', 'rShRy', 'rShRz', 'rEl',
  'lHipRx', 'lHipRy', 'lHipRz', 'lKn', 'lAn', 'rHipRx', 'rHipRy', 'rHipRz', 'rKn', 'rAn'];
const D = {}; DOF.forEach((n, i) => D[n] = i);
const ND = DOF.length;
const MIR_NEG = ['rootRy', 'rootRz', 'hipX', 'pelRy', 'pelRz', 'spRy', 'spRz', 'chRy', 'chRz', 'hdRy', 'hdRz'].map(n => D[n]);
const MIR_SWAP = DOF.filter(n => n[0] === 'l' && D['r' + n.slice(1)] !== undefined).map(n => [D[n], D['r' + n.slice(1)]]);
const newPose = () => new Float32Array(ND);
function P(o) { const p = newPose(); for (const k in o) { if (D[k] === undefined) throw new Error('bad dof ' + k); p[D[k]] = o[k]; } return p; }
function mirrorPose(p) {
  for (const i of MIR_NEG) p[i] = -p[i];
  for (const [a, b] of MIR_SWAP) { const t = p[a]; p[a] = p[b]; p[b] = t; }
  return p;
}
function mixPose(out, a, b, t) { for (let i = 0; i < ND; i++) out[i] = a[i] + (b[i] - a[i]) * t; return out; }

/* ---------- geometry shared by every player ---------- */
const RG = {};
function initRigGeo() {
  const cyl = (rt, rb, h, seg = 7) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(0, -h / 2, 0); return g; };
  const flat = (g, sz) => { g.scale(1, 1, sz); g.computeVertexNormals(); return g; };
  RG.shorts = flat(cyl(0.098, 0.09, 0.25, 8), 0.95);
  RG.thigh = cyl(0.08, 0.056, 0.44);
  RG.shin = cyl(0.06, 0.04, 0.42);
  RG.calf = new THREE.SphereGeometry(0.066, 7, 5); RG.calf.scale(0.95, 1.9, 1.05); RG.calf.translate(0, -0.14, -0.012);
  RG.foot = new THREE.BoxGeometry(0.095, 0.07, 0.26); RG.foot.translate(0, -0.03, 0.065);
  RG.pelvis = flat(new THREE.CylinderGeometry(0.15, 0.165, 0.2, 8), 0.72); RG.pelvis.translate(0, 0.03, 0);
  RG.abdomen = flat(new THREE.CylinderGeometry(0.155, 0.148, 0.2, 8), 0.66); RG.abdomen.translate(0, 0.08, 0);
  RG.chest = flat(new THREE.CylinderGeometry(0.205, 0.152, 0.31, 8), 0.62); RG.chest.translate(0, 0.155, 0);
  RG.neck = new THREE.CylinderGeometry(0.045, 0.05, 0.09, 6); RG.neck.translate(0, 0.035, 0);
  RG.head = new THREE.IcosahedronGeometry(0.112, 1); RG.head.scale(0.92, 1.08, 1); RG.head.translate(0, 0.155, 0.008);
  RG.hair = new THREE.SphereGeometry(0.12, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.52);
  RG.hair.rotateX(-0.42); RG.hair.scale(0.94, 1.06, 1.02); RG.hair.translate(0, 0.165, -0.004);
  RG.sleeve = cyl(0.068, 0.06, 0.16);
  RG.upper = cyl(0.05, 0.041, 0.27);
  RG.fore = cyl(0.042, 0.031, 0.25);
  RG.hand = new THREE.SphereGeometry(0.036, 6, 4); RG.hand.scale(0.8, 1.2, 1); RG.hand.translate(0, -0.275, 0);
  RG.glove = new THREE.SphereGeometry(0.055, 6, 4); RG.glove.scale(0.8, 1.25, 1.1); RG.glove.translate(0, -0.275, 0);
  RG.num = new THREE.PlaneGeometry(0.2, 0.2);
  RG.shadow = new THREE.PlaneGeometry(3.4, 3.4); RG.shadow.rotateX(-Math.PI / 2);
  // four soft floodlight shadows in an X
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.translate(64, 64);
  for (let i = 0; i < 4; i++) {
    x.save(); x.rotate(Math.PI / 4 + i * Math.PI / 2);
    const g = x.createLinearGradient(0, 0, 58, 0);
    g.addColorStop(0, 'rgba(0,0,0,.34)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(28, 0, 30, 6.5, 0, 0, 7); x.fill(); x.restore();
  }
  const cg = x.createRadialGradient(0, 0, 0, 0, 0, 13); cg.addColorStop(0, 'rgba(0,0,0,.4)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = cg; x.beginPath(); x.arc(0, 0, 13, 0, 7); x.fill();
  RG.shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
}
function numTexture(n, fg) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = fg; x.font = '900 46px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(n), 32, 35);
  return new THREE.CanvasTexture(c);
}
const lam = c => new THREE.MeshLambertMaterial({ color: c });

/* ---------- build one articulated player ----------
   kit: {shirt, shorts, socks, num} colours   look: {skin, hair, boots, gk}  */
function makeRig(kit, look, num) {
  const m = { shirt: lam(kit.shirt), shorts: lam(kit.shorts), socks: lam(kit.socks), skin: lam(look.skin), hair: lam(look.hair), boots: lam(look.boots) };
  const G = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const M = (parent, geo, mat) => { const o = new THREE.Mesh(geo, mat); parent.add(o); return o; };
  const root = new THREE.Group();
  const tilt = G(root, 0, 0, 0); tilt.rotation.order = 'YXZ';
  const hips = G(tilt, 0, 0.92, 0); hips.rotation.order = 'YXZ';
  M(hips, RG.pelvis, m.shorts);
  const spine = G(hips, 0, 0.1, 0); spine.rotation.order = 'YXZ'; M(spine, RG.abdomen, m.shirt);
  const chest = G(spine, 0, 0.17, 0); chest.rotation.order = 'YXZ'; M(chest, RG.chest, m.shirt);
  const nm = M(chest, RG.num, new THREE.MeshBasicMaterial({ map: numTexture(num, kit.num), transparent: true, alphaTest: 0.4 }));
  nm.position.set(0, 0.165, -0.127); nm.rotation.y = Math.PI; nm.rotation.x = 0.1;
  const head = G(chest, 0, 0.31, 0); head.rotation.order = 'YXZ';
  M(head, RG.neck, m.skin); M(head, RG.head, m.skin); M(head, RG.hair, m.hair);
  const arm = s => {
    const a = G(chest, 0.2 * s, 0.265, 0); M(a, RG.sleeve, m.shirt); M(a, RG.upper, look.gk ? m.shirt : m.skin);
    const f = G(a, 0, -0.27, 0); M(f, RG.fore, look.gk ? m.shirt : m.skin); M(f, look.gk ? RG.glove : RG.hand, look.gk ? lam(0xf2f2f2) : m.skin);
    return [a, f];
  };
  const leg = s => {
    const t = G(hips, 0.095 * s, 0, 0); M(t, RG.shorts, m.shorts); M(t, RG.thigh, m.skin);
    const sh = G(t, 0, -0.44, 0); M(sh, RG.shin, m.socks); M(sh, RG.calf, m.socks);
    const ft = G(sh, 0, -0.42, 0); M(ft, RG.foot, m.boots);
    return [t, sh, ft];
  };
  const [lArm, lFore] = arm(1), [rArm, rFore] = arm(-1);
  const [lLeg, lShin, lFoot] = leg(1), [rLeg, rShin, rFoot] = leg(-1);
  const shadow = new THREE.Mesh(RG.shadow, RG.shadowMat); shadow.renderOrder = 1;
  return { root, tilt, hips, spine, chest, head, lArm, lFore, rArm, rFore, lLeg, lShin, lFoot, rLeg, rShin, rFoot, shadow };
}

function applyPose(r, p) {
  r.tilt.position.y = p[D.rootY];
  r.tilt.rotation.set(p[D.rootRx], p[D.rootRy], p[D.rootRz]);
  const px = p[D.pelRx], pz = p[D.pelRz];
  r.hips.position.set(p[D.hipX], 0.92 + p[D.hipY], p[D.hipZ]);
  r.hips.rotation.set(px, p[D.pelRy], pz);
  r.spine.rotation.set(p[D.spRx], p[D.spRy], p[D.spRz]);
  r.chest.rotation.set(p[D.chRx], p[D.chRy], p[D.chRz]);
  r.head.rotation.set(p[D.hdRx], p[D.hdRy], p[D.hdRz]);
  r.lArm.rotation.set(-p[D.lShRx], -p[D.lShRy], p[D.lShRz]); r.lFore.rotation.x = -p[D.lEl];
  r.rArm.rotation.set(-p[D.rShRx], p[D.rShRy], -p[D.rShRz]); r.rFore.rotation.x = -p[D.rEl];
  // legs hang from the pelvis, so cancel its pitch/roll: the stride stays under the body
  r.lLeg.rotation.set(-p[D.lHipRx] - px * 0.85, p[D.lHipRy], p[D.lHipRz] - pz);
  r.rLeg.rotation.set(-p[D.rHipRx] - px * 0.85, -p[D.rHipRy], -p[D.rHipRz] - pz);
  r.lShin.rotation.x = p[D.lKn]; r.rShin.rotation.x = p[D.rKn];
  r.lFoot.rotation.x = p[D.lAn]; r.rFoot.rotation.x = p[D.rAn];
}
