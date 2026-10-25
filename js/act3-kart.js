// =====================================================================
//  ARROZ DOURADO — ATO III · CAPÍTULO 3: corrida de kart pela orla do Rio
// =====================================================================

const Kart = (() => {
  const D3 = DATA3;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const $ = (s) => document.querySelector(s);
  const ROAD_W = 14, MAXV = 44;

  let K, UI;
  let scene, cam, track, racers = [], boxes = [], hazards = [], shots = [], clouds = [];
  let running = false, phase = 'count', phaseT = 0, resolveRun = null, finishOrder = [], t = 0;
  let engine = null, clockMin = 0, opts = null, fxT = 0;

  // ---------------------------------------------------------------
  // pista
  // ---------------------------------------------------------------
  function buildTrack(def) {
    const rnd = K.rng(def.seed);
    const pts = [];
    let x = 0, z = 0, h = 0;
    const seaSign = def.sea === 'left' ? -1 : 1;
    const steps = Math.round(def.len / 55);
    for (let i = 0; i <= steps; i++) {
      pts.push(V(x, 0, z));
      h += (rnd() - 0.5) * 0.9;
      h = Math.max(-1.1, Math.min(1.1, h));
      x += Math.sin(h) * 55; z -= Math.cos(h) * 55;
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const N = Math.round(def.len / 2);
    const P = curve.getSpacedPoints(N);
    const T = [], Nn = [], cum = [0];
    for (let i = 0; i <= N; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)];
      const tg = b.clone().sub(a).setY(0).normalize();
      T.push(tg);
      Nn.push(V(-tg.z, 0, tg.x)); // direita
      if (i) cum.push(cum[i - 1] + P[i].distanceTo(P[i - 1]));
    }
    return { P, T, N: Nn, cum, len: cum[N], n: N, seaSign, def };
  }

  function ribbon(trk, off0, off1, y0, y1, mat, vScale, i0, i1) {
    const n = (i1 == null ? trk.n : i1) - (i0 || 0);
    const pos = new Float32Array((n + 1) * 6), uv = new Float32Array((n + 1) * 4), idx = [];
    for (let k = 0; k <= n; k++) {
      const i = (i0 || 0) + k, p = trk.P[i], nr = trk.N[i];
      pos.set([p.x + nr.x * off0, y0, p.z + nr.z * off0, p.x + nr.x * off1, y1, p.z + nr.z * off1], k * 6);
      const v = trk.cum[i] / (vScale || 8);
      uv.set([0, v, 1, v], k * 4);
      if (k < n) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    mat.side = THREE.DoubleSide; // a faixa pode sair virada dependendo da curva
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false;
    return m;
  }

  function buildScene(def) {
    const { lam, basic, box, cyl, canvasTex, rng } = K;
    scene = new THREE.Scene();
    const theme = def.theme;
    scene.background = new THREE.Color(0x060818);
    scene.fog = new THREE.Fog(0x0a0c20, 60, 320);
    scene.add(new THREE.AmbientLight(0xa0a8d0, 0.95));
    const moon = new THREE.DirectionalLight(0xc0d0ff, 0.7); moon.position.set(-40, 80, 40); scene.add(moon);
    scene.add(new THREE.HemisphereLight(0x8090d0, 0x302820, 0.5));
    track = buildTrack(def);
    const S = track.seaSign;

    const asphalt = canvasTex(32, 64, (g, w, h) => {
      const r = rng(2); K.pixels(g, w, h, () => K.noisy([84, 82, 88], 14, r));
      g.fillStyle = '#e8e0a0'; for (let y = 0; y < h; y += 16) g.fillRect(15, y, 2, 8);
      g.fillStyle = '#ddd'; g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h);
    });
    asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
    scene.add(ribbon(track, -ROAD_W / 2, ROAD_W / 2, 0.02, 0.02, lam({ map: asphalt }), 16));
    // largada e chegada
    const chk = canvasTex(16, 16, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(i * 4, j * 4, 4, 4); } });
    [12, track.n - 3].forEach((i) => scene.add(ribbon(track, -ROAD_W / 2, ROAD_W / 2, 0.04, 0.04, lam({ map: chk }), 2, i, i + 2)));
    const arch = (i, txt) => { const p = track.P[i], nr = track.N[i]; const g = new THREE.Group(); [-1, 1].forEach((s) => { const pole = box(0.4, 7, 0.4, lam({ color: 0xdddddd })); pole.position.set(nr.x * s * (ROAD_W / 2 + 0.5), 3.5, nr.z * s * (ROAD_W / 2 + 0.5)); g.add(pole); }); const ban = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W + 1, 1.6), basic({ map: K.textCanvas(256, 32, '#c01010', [{ t: txt, y: 16, c: '#ffd040', f: 'bold 16px monospace' }]), side: THREE.DoubleSide })); ban.position.y = 6.5; ban.rotation.y = Math.atan2(nr.x, nr.z) + Math.PI / 2; g.add(ban); g.position.copy(p); scene.add(g); };
    arch(12, 'LARGADA · ' + def.name.split('·')[0].trim());
    arch(track.n - 3, '★ CHEGADA ★');

    // calçadão (lado do mar) e chão (lado da terra)
    const calc = theme === 'copa'
      ? canvasTex(32, 32, (g) => { g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#111'; for (let y = 0; y < 32; y++) { const x = 8 + Math.sin(y / 32 * Math.PI * 2) * 6; g.fillRect(Math.round(x), y, 6, 1); g.fillRect(Math.round(x) + 16, y, 6, 1); } })
      : canvasTex(16, 16, (g, w, h) => { const r = rng(6); K.pixels(g, w, h, () => K.noisy([150, 146, 140], 16, r)); });
    calc.wrapS = calc.wrapT = THREE.RepeatWrapping;
    const cliff = theme === 'cliff';
    const seaY = cliff ? -14 : -0.8;
    if (cliff) {
      // Niemeyer: penhasco e mureta do lado do mar, paredão de pedra do outro
      scene.add(ribbon(track, S * ROAD_W / 2, S * (ROAD_W / 2 + 2.5), 0.03, 0.03, lam({ map: calc }), 4));
      scene.add(ribbon(track, S * (ROAD_W / 2 + 2.5), S * (ROAD_W / 2 + 2.5), 0.03, seaY, lam({ color: 0x3a3430 }), 20));
      scene.add(ribbon(track, S * (ROAD_W / 2 + 2.3), S * (ROAD_W / 2 + 2.6), 1.0, 1.0, lam({ color: 0xd8d0c0 }), 4));
      const rockTex = canvasTex(32, 32, (g, w, h) => { const r = rng(8); K.pixels(g, w, h, (x, y) => K.noisy([90 - y, 80 - y, 70 - y], 26, r)); }, [1, 1]);
      rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
      scene.add(ribbon(track, -S * (ROAD_W / 2 + 1), -S * (ROAD_W / 2 + 8), 0.02, 28, lam({ map: rockTex }), 14));
    } else {
      scene.add(ribbon(track, S * ROAD_W / 2, S * (ROAD_W / 2 + 7), 0.05, 0.05, lam({ map: calc }), 7));
      const sand = canvasTex(16, 16, (g, w, h) => { const r = rng(9); K.pixels(g, w, h, () => K.noisy([210, 190, 140], 18, r)); });
      sand.wrapS = sand.wrapT = THREE.RepeatWrapping;
      scene.add(ribbon(track, S * (ROAD_W / 2 + 7), S * (ROAD_W / 2 + 40), 0.0, -0.9, lam({ map: sand, color: 0x9a9080 }), 10));
      scene.add(ribbon(track, -S * ROAD_W / 2, -S * (ROAD_W / 2 + 6), 0.05, 0.05, lam({ map: calc, color: 0xb0aaa0 }), 7));
      scene.add(ribbon(track, -S * (ROAD_W / 2 + 6), -S * (ROAD_W / 2 + 80), 0.0, 0.0, lam({ color: 0x302a28 }), 20));
    }
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 30, 30), lam({ color: 0x0c1c40 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(track.P[track.n >> 1].x, seaY, track.P[track.n >> 1].z); scene.add(sea);
    scene.userData.sea = sea;

    // túnel (Joá)
    if (def.tunnel) {
      const i0 = Math.round(def.tunnel[0] * track.n), i1 = Math.round(def.tunnel[1] * track.n);
      const tm = lam({ color: 0x5a5450, side: THREE.DoubleSide });
      for (let k = 0; k < 8; k++) {
        const a0 = k / 8 * Math.PI, a1 = (k + 1) / 8 * Math.PI, R = ROAD_W / 2 + 2;
        scene.add(ribbon(track, Math.cos(a0) * R, Math.cos(a1) * R, Math.sin(a0) * 9, Math.sin(a1) * 9, tm, 8, i0, i1));
      }
      for (let i = i0; i < i1; i += 6) { const p = track.P[i]; const l = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), basic({ color: 0xffb040 })); l.position.set(p.x, 8.6, p.z); scene.add(l); }
      track.tunnel = [i0, i1];
    }

    // cenário instanciado ao longo da pista
    const instance = (geo, mat, list) => { const m = new THREE.InstancedMesh(geo, mat, list.length); const mt = new THREE.Matrix4(), q = new THREE.Quaternion(); list.forEach((o, i) => { q.setFromEuler(new THREE.Euler(0, o.ry || 0, 0)); mt.compose(o.p, q, o.s || V(1, 1, 1)); m.setMatrixAt(i, mt); if (o.c != null) m.setColorAt(i, new THREE.Color(o.c)); }); scene.add(m); return m; };
    const lamps = [], lampHeads = [], palms = [], fronds = [], blds = [], kiosks = [], people = [];
    const r = rng(def.seed + 5);
    for (let i = 20; i < track.n - 5; i += 12) {
      const p = track.P[i], nr = track.N[i];
      if (!(track.tunnel && i > track.tunnel[0] && i < track.tunnel[1])) {
        [-1, 1].forEach((s) => { const q = p.clone().addScaledVector(nr, s * (ROAD_W / 2 + 0.8)); lamps.push({ p: q.clone().setY(3.5) }); lampHeads.push({ p: q.clone().setY(7) }); });
      }
      if (!cliff) {
        const q = p.clone().addScaledVector(nr, S * (ROAD_W / 2 + 4 + r() * 2));
        if (i % 24 === 0) { palms.push({ p: q.clone().setY(4) }); fronds.push({ p: q.clone().setY(8), ry: r() * 6 }); }
        if (i % 60 === 0) kiosks.push({ p: p.clone().addScaledVector(nr, S * (ROAD_W / 2 + 12)).setY(1.5), ry: r() * 6 });
        const bq = p.clone().addScaledVector(nr, -S * (ROAD_W / 2 + 14 + r() * 6));
        const h = 12 + r() * 30;
        blds.push({ p: bq.setY(h / 2), s: V(10 + r() * 6, h, 10 + r() * 6), ry: Math.atan2(nr.x, nr.z), c: [0xe8e4d8, 0xd8c8a8, 0xc8d8e8, 0xf0e0c0, 0xa8b8c8][Math.floor(r() * 5)] });
        if (theme === 'copa') for (let k = 0; k < 6; k++) people.push({ p: p.clone().addScaledVector(nr, S * (ROAD_W / 2 + 9 + r() * 25)).add(V(r() * 4, 0.7, r() * 4)), c: 0xf4f4f4 });
      }
    }
    instance(new THREE.BoxGeometry(0.25, 7, 0.25), lam({ color: 0x5a5a60 }), lamps);
    instance(new THREE.BoxGeometry(0.9, 0.3, 0.9), basic({ color: 0xffd890 }), lampHeads);
    if (palms.length) { instance(new THREE.CylinderGeometry(0.25, 0.4, 8, 5), lam({ color: 0x6a5030 }), palms); instance(new THREE.ConeGeometry(3, 1.6, 6), lam({ color: 0x1a5a2a }), fronds); }
    if (blds.length) {
      const winTex = canvasTex(16, 32, (g) => { g.fillStyle = '#ddd'; g.fillRect(0, 0, 16, 32); for (let y = 2; y < 32; y += 4) for (let x = 2; x < 16; x += 4) { g.fillStyle = Math.random() < 0.45 ? '#ffd890' : '#223'; g.fillRect(x, y, 2, 2); } }, [2, 4]);
      instance(new THREE.BoxGeometry(1, 1, 1), lam({ map: winTex }), blds);
    }
    if (kiosks.length) instance(new THREE.ConeGeometry(3, 2.2, 6), lam({ color: 0x2a8a5a }), kiosks);
    if (people.length) instance(new THREE.BoxGeometry(0.5, 1.4, 0.4), lam({ color: 0xffffff }), people);

    // montanhas e marcos no fundo
    const end = track.P[track.n], mid = track.P[track.n >> 1];
    const mtn = (x, z, rad, h, c) => { const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7), lam({ color: c || 0x101420 })); m.position.set(x, h / 2 - 2, z); scene.add(m); return m; };
    if (theme === 'cliff') { mtn(mid.x - 220, mid.z - 260, 120, 160); mtn(end.x + 200, end.z - 300, 90, 120); }
    if (theme === 'beach') { mtn(end.x - 120, end.z - 260, 70, 140); mtn(end.x - 30, end.z - 290, 60, 160); } // Dois Irmãos
    if (theme === 'copa') {
      const pao = mtn(end.x + 120, end.z - 260, 50, 190, 0x0c0e18); pao.scale.set(1, 1, 0.8);
      const palace = box(60, 22, 14, lam({ color: 0xf4f0e8 })); palace.position.copy(track.P[Math.round(track.n * 0.8)].clone().addScaledVector(track.N[Math.round(track.n * 0.8)], -S * 34).setY(11)); palace.rotation.y = Math.atan2(track.N[Math.round(track.n * 0.8)].x, track.N[Math.round(track.n * 0.8)].z); scene.add(palace);
      scene.userData.barges = [0.4, 0.6, 0.8, 0.95].map((f) => track.P[Math.round(track.n * f)].clone().addScaledVector(track.N[Math.round(track.n * f)], S * 120).setY(1));
      scene.userData.barges.forEach((b) => { const bg = box(14, 2, 6, lam({ color: 0x3a2a20 })); bg.position.copy(b); scene.add(bg); });
    }
    // estrelas
    const sg = new THREE.BufferGeometry(), sa = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 0.6 + 0.1; sa.set([Math.cos(a) * Math.cos(e) * 900 + mid.x, Math.sin(e) * 900, Math.sin(a) * Math.cos(e) * 900 + mid.z], i * 3); }
    sg.setAttribute('position', new THREE.BufferAttribute(sa, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff8e0, size: 2, sizeAttenuation: false, fog: false })); stars.frustumCulled = false; scene.add(stars);

    // caixas de item (isopor) em fileiras
    for (let i = 70; i < track.n - 40; i += 150) {
      for (let k = -2; k <= 2; k++) {
        const g = new THREE.Group();
        const bx = box(1.3, 1.0, 1.0, lam({ color: 0xf8f8f8 })); g.add(bx);
        const lid = box(1.4, 0.15, 1.1, lam({ color: 0x2a6ad0 })); lid.position.y = 0.55; g.add(lid);
        const q = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), basic({ map: K.textCanvas(16, 16, '#f8f8f8', [{ t: '?', y: 8, c: '#d02020', f: 'bold 14px monospace' }]), side: THREE.DoubleSide })); q.position.z = 0.51; g.add(q);
        const p = track.P[i].clone().addScaledVector(track.N[i], k * 2.6).setY(1.2);
        g.position.copy(p); scene.add(g);
        boxes.push({ g, p, idx: i, off: 0 });
      }
    }
    cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1200);
  }

  // ---------------------------------------------------------------
  // veículos
  // ---------------------------------------------------------------
  function mkVehicle(type, color) {
    const { lam, basic, box, cyl, textCanvas } = K;
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const wheel = (x, z, r) => { const w = cyl(r || 0.4, r || 0.4, 0.3, 8, lam({ color: 0x111111 })); w.rotation.z = Math.PI / 2; w.position.set(x, r || 0.4, z); body.add(w); return w; };
    let seat = V(0, 1.1, 0), driverScale = 0.55, stand = false;
    if (type === 'moto') {
      const b = box(0.5, 0.5, 2.0, lam({ color })); b.position.y = 0.75; body.add(b);
      wheel(0, 0.9, 0.45); wheel(0, -0.9, 0.45);
      const bag = box(0.9, 0.8, 0.8, lam({ color: 0xd02020 })); bag.position.set(0, 1.5, -0.95); body.add(bag);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), basic({ map: textCanvas(64, 32, '#d02020', [{ t: 'ZAP DO', y: 10, c: '#fff', f: 'bold 10px monospace' }, { t: 'TIO KWAN', y: 23, c: '#ffd040', f: 'bold 10px monospace' }]) })); lab.position.set(0, 1.5, -1.36); lab.rotation.y = Math.PI; body.add(lab);
      const hb = box(0.9, 0.08, 0.08, lam({ color: 0x999999 })); hb.position.set(0, 1.25, 0.8); body.add(hb);
      seat = V(0, 0.55, -0.1);
    } else if (type === 'kombi') {
      const lo = box(1.9, 0.9, 3.6, lam({ color })); lo.position.y = 0.8; body.add(lo);
      const hi = box(1.9, 0.8, 3.6, lam({ color: 0xf4f4f4 })); hi.position.y = 1.65; body.add(hi);
      const win = box(1.92, 0.5, 2.6, basic({ color: 0x8ab0d0 })); win.position.y = 1.75; body.add(win);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), basic({ map: textCanvas(64, 16, '#40c080', [{ t: 'FEIJOADA', y: 8, c: '#fff', f: 'bold 10px monospace' }]) })); lab.position.set(0.96, 0.9, 0); lab.rotation.y = Math.PI / 2; body.add(lab);
      [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]].forEach(([x, z]) => wheel(x, z));
      seat = V(0, 0.9, 0.9); driverScale = 0.5;
    } else if (type === 'foodtruck') {
      const b = box(2.4, 2.4, 4.4, lam({ color })); b.position.y = 1.6; body.add(b);
      const aw = box(2.6, 0.1, 1.2, lam({ color: 0xd02020 })); aw.position.set(0, 2.9, -2.4); body.add(aw);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), basic({ map: textCanvas(128, 32, '#c06010', [{ t: 'TORRESMO 24H', y: 16, c: '#fff', f: 'bold 14px monospace' }]) })); lab.position.set(1.21, 2.2, 0); lab.rotation.y = Math.PI / 2; body.add(lab);
      [[-1.1, 1.5], [1.1, 1.5], [-1.1, -1.5], [1.1, -1.5]].forEach(([x, z]) => wheel(x, z, 0.5));
      seat = V(0, 1.1, 1.4); driverScale = 0.6;
    } else if (type === 'patinete') {
      const deck = box(0.35, 0.1, 1.3, lam({ color: 0x222222 })); deck.position.y = 0.3; body.add(deck);
      const stem = box(0.08, 1.4, 0.08, lam({ color })); stem.position.set(0, 1.0, 0.6); body.add(stem);
      wheel(0, 0.6, 0.2); wheel(0, -0.6, 0.2);
      seat = V(0, 0.35, -0.1); driverScale = 0.6; stand = true;
    } else if (type === 'bike') {
      const fr = box(0.1, 0.1, 1.4, lam({ color })); fr.position.y = 0.9; body.add(fr);
      const fr2 = box(0.1, 0.8, 0.1, lam({ color })); fr2.position.set(0, 0.6, 0.1); body.add(fr2);
      wheel(0, 0.75, 0.45); wheel(0, -0.75, 0.45);
      seat = V(0, 0.65, -0.2); driverScale = 0.55;
    } else if (type === 'onibus') {
      const b = box(2.6, 2.8, 8, lam({ color: 0xf0f0f0 })); b.position.y = 1.8; body.add(b);
      const st = box(2.62, 0.6, 8.02, lam({ color })); st.position.y = 1.2; body.add(st);
      const win = box(2.64, 0.8, 6.5, basic({ color: 0x8ab0d0 })); win.position.y = 2.4; body.add(win);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), basic({ map: textCanvas(64, 16, '#111', [{ t: '474 ???', y: 8, c: '#ffb020', f: 'bold 11px monospace' }]) })); sign.position.set(0, 3.0, 4.01); body.add(sign);
      [[-1.2, 2.8], [1.2, 2.8], [-1.2, -2.8], [1.2, -2.8]].forEach(([x, z]) => wheel(x, z, 0.55));
      seat = V(0, 1.2, 3.2); driverScale = 0.55;
    }
    const exhaust = new THREE.Object3D(); exhaust.position.set(0, 0.5, type === 'onibus' ? -4 : -1.4); body.add(exhaust);
    return { g, body, seat, driverScale, stand, exhaust };
  }

  function mkRacer(def, i) {
    const v = mkVehicle(def.vehicle, def.color);
    const d = A3.person(def.look); d.g.scale.setScalar(v.driverScale);
    d.g.position.copy(v.seat);
    if (!v.stand) { d.sit(); d.armL.rotation.x = d.armR.rotation.x = -1.3; }
    v.body.add(d.g);
    if (def.player) {
      const w = A3.person('wellington'); w.g.scale.setScalar(0.5); w.sit(); w.g.position.set(0, 0.62, -0.75); v.body.add(w.g);
      const head = new THREE.PointLight(0xfff0c0, 1.6, 30, 1.2); head.position.set(0, 2, 6); v.g.add(head); // farol
    }
    scene.add(v.g);
    const row = Math.floor(i / 2), col = i % 2;
    const si = 6 - row * 3;
    const r = {
      def, v, driver: d, player: !!def.player, idx: si, x: 0, z: 0, h: 0, speed: 0, lat: 0, prog: 0,
      drift: 0, driftT: 0, boost: 0, spin: 0, blind: 0, shield: 0, item: null, done: false, place: 0, finishT: 0,
      ai: { lane: (col ? 1 : -1) * 3, laneT: 0, skill: 0.92 + Math.random() * 0.08, itemT: 2 + Math.random() * 4 },
    };
    const p = track.P[si].clone().addScaledVector(track.N[si], (col ? 1 : -1) * 3);
    r.x = p.x; r.z = p.z; r.h = Math.atan2(track.T[si].x, track.T[si].z);
    return r;
  }

  // ---------------------------------------------------------------
  // física
  // ---------------------------------------------------------------
  function locate(r) {
    let best = r.idx, bd = Infinity;
    for (let i = Math.max(0, r.idx - 20); i <= Math.min(track.n, r.idx + 30); i++) {
      const p = track.P[i], d = (p.x - r.x) ** 2 + (p.z - r.z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    r.idx = best;
    const p = track.P[best], dx = r.x - p.x, dz = r.z - p.z;
    r.lat = dx * track.N[best].x + dz * track.N[best].z;
    r.prog = track.cum[best] + dx * track.T[best].x + dz * track.T[best].z;
  }

  function control(r, dt) {
    if (r.done) return { thr: 0.6, steer: 0, drift: false };
    if (r.player) {
      const k = A3.keys;
      return {
        thr: (k.KeyW || k.ArrowUp) ? 1 : (k.KeyS || k.ArrowDown) ? -0.6 : 0,
        steer: ((k.KeyA || k.ArrowLeft) ? 1 : 0) - ((k.KeyD || k.ArrowRight) ? 1 : 0),
        drift: !!(k.ShiftLeft || k.ShiftRight || k.Space),
        item: A3.pressed.KeyE || A3.pressed.KeyL || A3.pressed.KeyJ,
      };
    }
    // IA: mira num ponto mais à frente na pista
    const a = r.ai;
    a.laneT -= dt;
    if (a.laneT <= 0) { a.laneT = 2 + Math.random() * 3; a.lane = (Math.random() - 0.5) * (ROAD_W - 4); }
    const ahead = Math.min(track.n, r.idx + 14);
    const tgt = track.P[ahead].clone().addScaledVector(track.N[ahead], a.lane);
    const want = Math.atan2(tgt.x - r.x, tgt.z - r.z);
    let diff = ((want - r.h + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    a.itemT -= dt;
    return { thr: 1, steer: Math.max(-1, Math.min(1, diff * 2.2)), drift: false, item: r.item && a.itemT <= 0 };
  }

  function updateRacer(r, dt, lead) {
    const c = control(r, dt);
    const player = racers.find((x) => x.player);
    let maxV = MAXV * (r.player ? 1 : r.def.speed * r.ai.skill * 0.95);
    if (!r.player && player && phase === 'race') { const gap = r.prog - player.prog; maxV *= gap > 90 ? 0.9 : gap < -70 ? 1.12 : 1; }
    if (Math.abs(r.lat) > ROAD_W / 2 + 0.5) maxV *= 0.55;
    if (r.boost > 0) { r.boost -= dt; maxV *= 1.38; }
    if (r.blind > 0) { r.blind -= dt; maxV *= 0.55; }
    if (clouds.some((cl) => Math.hypot(cl.p.x - r.x, cl.p.z - r.z) < cl.r)) { maxV *= 0.5; if (r.player) dust(0.6); }
    if (r.shield > 0) r.shield -= dt;
    if (phase !== 'race' && phase !== 'done') { maxV = 0; }
    if (r.spin > 0) {
      r.spin -= dt; r.speed *= Math.pow(0.15, dt); r.v.body.rotation.y += dt * 14;
    } else {
      r.v.body.rotation.y *= 0.8;
      const accel = c.thr > 0 ? 24 : c.thr < 0 ? 40 : 8;
      const target = c.thr > 0 ? maxV : c.thr < 0 ? -8 : 0;
      r.speed += Math.sign(target - r.speed) * Math.min(Math.abs(target - r.speed), accel * dt);
      // derrapagem com mini-turbo
      const turnRate = 1.7 * Math.min(1, Math.abs(r.speed) / 14);
      if (c.drift && c.steer && r.speed > 18 && !r.drift) { r.drift = Math.sign(c.steer); r.driftT = 0; Sfx.raw.noiseHit(1200, 2, 0.15, 0.15); }
      if (r.drift && (!c.drift || r.speed < 12)) {
        if (r.driftT > 1.6) { r.boost = 1.1; Sfx.raw.tone(400, 0.4, 'sawtooth', 0.1, null, null, 1200); }
        else if (r.driftT > 0.7) { r.boost = 0.6; Sfx.raw.tone(400, 0.3, 'sawtooth', 0.08, null, null, 900); }
        r.drift = 0;
      }
      if (r.drift) {
        r.driftT += dt;
        r.h += (r.drift * 1.15 + c.steer * 0.45) * turnRate * dt;
        r.v.body.rotation.y = r.drift * 0.4;
        if (r.player) { fxT -= dt; if (fxT <= 0) { fxT = 0.05; const ep = r.v.exhaust.getWorldPosition(V(0, 0, 0)); A2M.firework(scene, ep, [r.driftT > 1.6 ? 0xff8020 : r.driftT > 0.7 ? 0x40a0ff : 0xffffff], 3, 2); } }
      } else r.h += c.steer * turnRate * dt * Math.sign(r.speed || 1);
    }
    r.x += Math.sin(r.h) * r.speed * dt; r.z += Math.cos(r.h) * r.speed * dt;
    locate(r);
    // muretas
    const lim = ROAD_W / 2 + (track.def.theme === 'cliff' ? 2.2 : 6);
    if (Math.abs(r.lat) > lim) {
      const p = track.P[r.idx], n = track.N[r.idx], s = Math.sign(r.lat);
      r.x = p.x + n.x * s * lim; r.z = p.z + n.z * s * lim;
      r.speed *= 0.82; r.h = Math.atan2(track.T[r.idx].x, track.T[r.idx].z) - s * 0.05 * 0;
      if (r.player && Math.random() < 0.3) Sfx.raw.noiseHit(400, 1, 0.12, 0.3, null, null, 'lowpass');
    }
    // carros se empurrando
    racers.forEach((o) => { if (o === r) return; const dx = r.x - o.x, dz = r.z - o.z, d = Math.hypot(dx, dz); if (d < 2.2 && d > 0.01) { r.x += dx / d * (2.2 - d) * 0.5; r.z += dz / d * (2.2 - d) * 0.5; } });
    // caixas de item
    boxes.forEach((b) => { if (b.off > 0) return; if (Math.hypot(b.p.x - r.x, b.p.z - r.z) < 2) { b.off = 4; b.g.visible = false; if (!r.item) giveItem(r); if (r.player) Sfx.pickup(); } });
    // casca de manga
    hazards.forEach((hz) => { if (hz.dead) return; if (Math.hypot(hz.p.x - r.x, hz.p.z - r.z) < 1.6) { hz.dead = true; scene.remove(hz.m); hit(r); } });
    if (c.item && r.item) useItem(r);
    // visual
    const p = track.P[r.idx];
    r.v.g.position.set(r.x, p.y + 0.02 + (r.spin > 0 ? Math.abs(Math.sin(t * 20)) * 0.3 : 0), r.z);
    r.v.g.rotation.y = r.h;
    // chegada
    if (!r.done && r.prog >= track.len - 8) { r.done = true; finishOrder.push(r); r.place = finishOrder.length; if (r.player) playerFinished(); }
  }

  // ---------------------------------------------------------------
  // itens
  // ---------------------------------------------------------------
  function giveItem(r) {
    const order = racers.slice().sort((a, b) => b.prog - a.prog);
    const pos = order.indexOf(r);
    const pool = pos === 0 ? ['manga', 'guarda', 'farofa', 'manga'] : pos >= 4 ? ['mate', 'pombo', 'chinelo', 'mate'] : ['chinelo', 'mate', 'farofa', 'manga', 'guarda'];
    r.item = pool[Math.floor(Math.random() * pool.length)];
    r.ai.itemT = 1 + Math.random() * 4;
  }
  function hit(r) {
    if (r.shield > 0) { r.shield = 0; if (r.player) UI.toast('⛱ O guarda-sol te protegeu!', 'item', 1500); return; }
    r.spin = 1.0; r.drift = 0;
    if (r.player) { Sfx.hurt(); A3.camShake = 0.6; }
  }
  function useItem(r) {
    const it = r.item; r.item = null;
    const fwd = V(Math.sin(r.h), 0, Math.cos(r.h));
    if (r.player) Sfx.shoot('estilingue');
    if (it === 'mate') { r.boost = 1.8; if (r.player) Sfx.raw.tone(300, 0.6, 'sawtooth', 0.12, null, null, 1500); }
    if (it === 'guarda') r.shield = 8;
    if (it === 'manga') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), K.lam({ color: 0xf0a020 })); m.scale.set(1.3, 0.3, 0.9);
      const p = V(r.x, 0.2, r.z).addScaledVector(fwd, -3); m.position.copy(p); scene.add(m);
      hazards.push({ m, p });
    }
    if (it === 'chinelo') {
      const order = racers.slice().sort((a, b) => b.prog - a.prog);
      const i = order.indexOf(r);
      const target = i > 0 ? order[i - 1] : null;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 1.2), K.lam({ color: 0x2a8a3a }));
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.05), K.lam({ color: 0xffd020 })); strap.position.set(0, 0.15, 0.2); m.add(strap);
      m.position.set(r.x, 1, r.z); scene.add(m);
      shots.push({ m, x: r.x, z: r.z, h: r.h, target, life: 6, owner: r });
    }
    if (it === 'farofa') {
      const i = Math.min(track.n, r.idx + 25), p = track.P[i].clone();
      const m = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 6), new THREE.MeshBasicMaterial({ color: 0xc8a060, transparent: true, opacity: 0.45, depthWrite: false }));
      m.position.copy(p).setY(2); scene.add(m);
      clouds.push({ m, p, r: 6, life: 7 });
      A2M.firework(scene, p.clone().setY(2), [0xe8c070, 0xc8a060], 60, 6);
    }
    if (it === 'pombo') {
      const leader = racers.slice().sort((a, b) => b.prog - a.prog)[0];
      if (leader && leader !== r) {
        leader.blind = 2.5;
        if (leader.player) { const o = $('#kPombo'); o.classList.remove('hidden'); setTimeout(() => o.classList.add('hidden'), 2500); Sfx.raw.tone(1600, 0.3, 'sine', 0.05); }
        else if (r.player) UI.toast(`🐦 O pombo pousou na cara do ${leader.def.name}!`, 'item', 2000);
      }
    }
  }
  function updateItems(dt) {
    boxes.forEach((b) => { if (b.off > 0) { b.off -= dt; if (b.off <= 0) b.g.visible = true; } b.g.rotation.y += dt * 1.5; b.g.position.y = b.p.y + Math.sin(t * 3 + b.idx) * 0.2; });
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.life -= dt;
      if (s.target && !s.target.done) { const want = Math.atan2(s.target.x - s.x, s.target.z - s.z); s.h += (((want - s.h + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 4); }
      s.x += Math.sin(s.h) * 70 * dt; s.z += Math.cos(s.h) * 70 * dt;
      s.m.position.set(s.x, 1 + Math.abs(Math.sin(t * 15)) * 0.4, s.z); s.m.rotation.y = s.h + t * 10;
      const victim = racers.find((r) => r !== s.owner && Math.hypot(r.x - s.x, r.z - s.z) < 2);
      if (victim) { hit(victim); if (s.owner.player) UI.toast(`🩴 CHINELADA no ${victim.def.name}!`, 'item', 1500); }
      if (victim || s.life <= 0) { scene.remove(s.m); shots.splice(i, 1); }
    }
    for (let i = clouds.length - 1; i >= 0; i--) { const c = clouds[i]; c.life -= dt; c.m.material.opacity = Math.min(0.45, c.life * 0.2); c.m.rotation.y += dt; if (c.life <= 0) { scene.remove(c.m); clouds.splice(i, 1); } }
  }
  let dustT = 0;
  function dust(v) { dustT = Math.max(dustT, v); }

  // ---------------------------------------------------------------
  // loop
  // ---------------------------------------------------------------
  function update(dt) {
    if (!running) return;
    t += dt; phaseT += dt;
    if (phase === 'count') countdown();
    racers.forEach((r) => updateRacer(r, dt));
    updateItems(dt);
    // posições
    const order = racers.slice().sort((a, b) => (a.done && b.done ? a.place - b.place : a.done ? -1 : b.done ? 1 : b.prog - a.prog));
    order.forEach((r, i) => { if (!r.done) r.place = i + 1; });
    const me = racers.find((r) => r.player);
    // câmera
    const back = V(-Math.sin(me.h), 0, -Math.cos(me.h));
    const want = V(me.x, track.P[me.idx].y + 3.4, me.z).addScaledVector(back, 7.5);
    cam.position.lerp(want, Math.min(1, dt * 6));
    if (A3.camShake > 0) { cam.position.x += (Math.random() - 0.5) * A3.camShake; A3.camShake -= dt * 2; }
    cam.lookAt(me.x + Math.sin(me.h) * 6, 1.6, me.z + Math.cos(me.h) * 6);
    const fov = 70 + (me.boost > 0 ? 12 : 0) + Math.min(8, me.speed / 6);
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix();
    // motor
    if (engine) { engine.o.frequency.setTargetAtTime(40 + Math.abs(me.speed) * 3.2 + (me.boost > 0 ? 40 : 0), Sfx.raw.now(), 0.05); }
    // fogos (trecho de Copacabana)
    if (scene.userData.barges && Math.random() < dt * 1.2) { const b = scene.userData.barges[Math.floor(Math.random() * scene.userData.barges.length)]; A2M.firework(scene, b.clone().add(V(0, 40 + Math.random() * 30, 0)), [[0xffd040, 0xfff0a0], [0xff3030, 0xffffff], [0x40c0ff, 0xffd040]][Math.floor(Math.random() * 3)], 90, 14); }
    // relógio do jogo
    clockMin += dt / 5;
    dustT = Math.max(0, dustT - dt);
    $('#kDust').style.opacity = dustT;
    hud(me, order);
  }

  function countdown() {
    const n = 3 - Math.floor(phaseT);
    const el = $('#kCount');
    if (phaseT < 3) { if (el.dataset.n !== String(n)) { el.dataset.n = n; el.textContent = n; el.className = 'show c' + n; Sfx.raw.tone(440, 0.2, 'square', 0.1); } }
    else { phase = 'race'; el.textContent = 'JÁ!'; el.className = 'show go'; Sfx.raw.tone(880, 0.5, 'square', 0.12); setTimeout(() => (el.className = ''), 900); }
  }

  function hud(me, order) {
    $('#kPos').innerHTML = `${me.place}º<small>/${racers.length}</small>`;
    $('#kPos').className = me.place <= 3 ? 'ok' : 'bad';
    const it = me.item ? D3.KART_ITEMS[me.item] : null;
    $('#kItem').innerHTML = it ? `<span>${it.icon}</span><small>${it.name}<br>[E] usar</small>` : '<small>pegue uma caixa de isopor</small>';
    $('#kSpeed').textContent = Math.round(Math.abs(me.speed) * 3.1) + ' km/h';
    const base = opts.clock.split(':').map(Number), tot = base[0] * 60 + base[1] + Math.floor(clockMin);
    $('#kClock').textContent = `${String(Math.floor(tot / 60) % 24).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`;
    $('#kDrift').textContent = me.drift ? (me.driftT > 1.6 ? '🔥 TURBO MÁXIMO' : me.driftT > 0.7 ? '💨 TURBO' : 'DERRAPANDO') : me.boost > 0 ? '⚡ BOOST' : '';
    const bar = $('#kBar');
    if (!bar.dataset.ok) { bar.innerHTML = racers.map((r, i) => `<i data-i="${i}" style="background:#${r.def.color.toString(16).padStart(6, '0')}"></i>`).join(''); bar.dataset.ok = 1; }
    bar.querySelectorAll('i').forEach((el) => { const r = racers[+el.dataset.i]; el.style.left = Math.min(100, r.prog / track.len * 100) + '%'; el.classList.toggle('me', r.player); });
  }

  async function playerFinished() {
    phase = 'done';
    const me = racers.find((r) => r.player);
    const el = $('#kCount');
    el.textContent = me.place <= 3 ? `${me.place}º LUGAR!` : `${me.place}º... ATRASADO!`;
    el.className = 'show ' + (me.place <= 3 ? 'go' : 'c3');
    Sfx.raw.tone(me.place <= 3 ? 660 : 220, 0.6, 'square', 0.1);
    await A3.wait(3200);
    el.className = '';
    finish(me.place);
  }
  function finish(place) {
    running = false;
    if (engine) { engine.g.gain.setTargetAtTime(0, Sfx.raw.now(), 0.1); const e = engine; setTimeout(() => e.o.stop(), 500); engine = null; }
    $('#kartHud').classList.add('hidden');
    const r = resolveRun; resolveRun = null; r && r({ place });
  }

  // ---------------------------------------------------------------
  // API
  // ---------------------------------------------------------------
  function run(o) {
    K = World.kit; UI = window.GameUI;
    opts = o;
    racers = []; boxes = []; hazards = []; shots = []; clouds = []; finishOrder = [];
    buildScene(o);
    D3.RACERS.forEach((d, i) => racers.push(mkRacer(d, i)));
    racers.forEach(locate);
    phase = 'count'; phaseT = 0; t = 0; clockMin = 0;
    const me = racers.find((r) => r.player);
    cam.position.set(me.x - Math.sin(me.h) * 8, 4, me.z - Math.cos(me.h) * 8);
    A3.setView(scene, cam, update);
    $('#kartHud').classList.remove('hidden');
    $('#kTrack').textContent = o.name;
    $('#kBar').dataset.ok = '';
    $('#kCount').dataset.n = '';
    const ctx = Sfx.raw.ctx();
    if (ctx) {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 40;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
      const g = ctx.createGain(); g.gain.value = 0.04;
      osc.connect(f); f.connect(g); g.connect(Sfx.raw.sfx()); osc.start();
      engine = { o: osc, g };
    }
    running = true;
    return new Promise((res) => { resolveRun = res; });
  }

  return { run, debug: () => ({ racers, track, phase }) };
})();
