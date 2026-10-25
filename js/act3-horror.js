// =====================================================================
//  ARROZ DOURADO — ATO III · CAPÍTULO 2: survival horror na Mansão do Joá
//  câmera fixa, controle "tanque", munição contada, puzzles, sala de save
// =====================================================================

const Horror = (() => {
  const D3 = DATA3;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const $ = (s) => document.querySelector(s);
  const WALL_H = 4;

  let K, UI;
  let scene = null, cam = null, room = null, roomId = '';
  let P = null, enemies = [], items = [], doors = [], props = [], colliders = [];
  let st = null, snapshot = null;
  let running = false, mode = 'play', resolveRun = null;
  let flash = null, lampLight = null, ambient = null, rain = null, lightningT = 5, t = 0;
  let aimTarget = null, hurtT = 0, heartT = 0, groanT = 3;

  function fresh() {
    return { room: 'jardim', hp: 100, chamber: 6, ammo: 6, inv: [{ id: 'revolver', n: 1 }], flags: { casalDog: true }, killed: {}, taken: {} };
  }

  // ---------------------------------------------------------------
  // inventário
  // ---------------------------------------------------------------
  const has = (id) => st.inv.some((i) => i.id === id);
  function addItem(id, n) {
    if (id === 'ammo') { st.ammo += 6; return true; }
    const ex = st.inv.find((i) => i.id === id);
    if (ex && D3.ITEMS[id].stack) { ex.n += n || 1; return true; }
    if (st.inv.length >= 8) return false;
    st.inv.push({ id, n: n || 1 });
    return true;
  }
  function removeItem(id) { const i = st.inv.findIndex((x) => x.id === id); if (i >= 0) st.inv.splice(i, 1); }

  // ---------------------------------------------------------------
  // texturas
  // ---------------------------------------------------------------
  const texCache = {};
  function tex(kind) {
    if (texCache[kind]) return texCache[kind];
    const { canvasTex, pixels, noisy, rng } = K;
    const r = rng(kind.length * 13);
    let tx;
    if (kind === 'grass') tx = canvasTex(32, 32, (g, w, h) => pixels(g, w, h, () => noisy([34, 60, 30], 22, r)), [6, 6]);
    else if (kind === 'marble') tx = canvasTex(32, 32, (g, w, h) => { pixels(g, w, h, (x, y) => noisy(((x >> 4) + (y >> 4)) % 2 ? [150, 146, 140] : [60, 56, 54], 14, r)); g.fillStyle = 'rgba(20,10,5,0.5)'; for (let i = 0; i < 6; i++) g.fillRect(r() * 32, r() * 32, 6, 3); }, [6, 6]);
    else if (kind === 'wood') tx = canvasTex(32, 32, (g, w, h) => pixels(g, w, h, (x, y) => noisy(y % 8 === 0 ? [30, 18, 10] : [80, 50, 30], 14, r)), [5, 5]);
    else if (kind === 'tile') tx = canvasTex(32, 32, (g, w, h) => pixels(g, w, h, (x, y) => (x % 8 === 0 || y % 8 === 0 ? [90, 90, 90] : noisy([190, 190, 180], 16, r))), [5, 5]);
    else if (kind === 'pink') tx = canvasTex(32, 32, (g, w, h) => pixels(g, w, h, (x, y) => noisy((x + y) % 16 < 8 ? [190, 120, 140] : [170, 100, 120], 12, r)), [4, 4]);
    else if (kind === 'stone') tx = canvasTex(32, 32, (g, w, h) => pixels(g, w, h, (x, y) => noisy((x % 16 === 0 || y % 10 === 0) ? [30, 30, 30] : [70, 66, 62], 18, r)), [6, 6]);
    else if (kind === 'burnt') tx = canvasTex(32, 32, (g, w, h) => { pixels(g, w, h, (x, y) => { const v = 1 - y / h; let c = v < 0.3 ? noisy([60, 30, 20], 12, r) : noisy([120, 30, 30], 16, r); if (r() < 0.25 + v * 0.3) c = c.map((k) => k * 0.35); return c; }); }, [3, 1]);
    else if (kind === 'hedge') tx = canvasTex(32, 32, (g, w, h) => pixels(g, w, h, () => noisy([24, 48, 22], 26, r)), [6, 1]);
    else tx = canvasTex(16, 16, (g, w, h) => pixels(g, w, h, () => noisy([100, 90, 80], 20, r)));
    texCache[kind] = tx;
    return tx;
  }

  // ---------------------------------------------------------------
  // móveis e objetos
  // ---------------------------------------------------------------
  function prop(kind, x, z) {
    const { lam, basic, box, cyl } = K;
    const g = new THREE.Group(); g.position.set(x, 0, z);
    let col = null, interact = null;
    const add = (m, px, py, pz) => { m.position.set(px || 0, py || 0, pz || 0); g.add(m); return m; };
    const dark = lam({ color: 0x3a2418 });
    if (kind === 'fountain') { add(cyl(1.6, 1.8, 0.6, 10, lam({ color: 0x8a8a84 })), 0, 0.3); add(new THREE.Mesh(new THREE.CircleGeometry(1.4, 10), lam({ color: 0x1a3a4a })), 0, 0.62).rotation.x = -Math.PI / 2; add(cyl(0.25, 0.3, 1.8, 6, lam({ color: 0x8a8a84 })), 0, 1.2); col = [1.8, 1.8]; }
    if (kind === 'tree') { add(cyl(0.2, 0.3, 2.5, 5, lam({ color: 0x3a2a1a })), 0, 1.25); add(new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.5, 6), lam({ color: 0x102a14 })), 0, 3.6); col = [0.5, 0.5]; }
    if (kind === 'statue') { add(box(1, 1, 1, lam({ color: 0x777770 })), 0, 0.5); const s = A3.person('kwan'); s.mats.forEach((m) => { m.map = null; m.color.setHex(0x8a8a84); m.needsUpdate = true; }); s.g.scale.setScalar(0.8); s.g.position.y = 1; g.add(s.g); col = [0.7, 0.7]; }
    if (kind === 'stairs') { for (let i = 0; i < 8; i++) add(box(3.2, 0.25 * (i + 1), 0.5, lam({ map: tex('wood') })), 0, 0.125 * (i + 1), 1.5 - i * 0.5); }
    if (kind === 'portrait') { const p = add(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), lam({ map: portraitTex() })), 0, 2.3, 0.02); p.userData.wall = true; interact = 'portrait'; }
    if (kind === 'chandelier') { add(new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.6, 6, 1, true), lam({ color: 0x8a7030, side: THREE.DoubleSide })), 0, 3.3).rotation.z = 0.3; }
    if (kind === 'sofa') { add(box(2.2, 0.5, 0.9, lam({ color: 0x5a1a14 })), 0, 0.25); add(box(2.2, 0.8, 0.25, lam({ color: 0x4a1410 })), 0, 0.65, -0.35); col = [1.15, 0.5]; }
    if (kind === 'table') { add(box(4.6, 0.12, 1.8, lam({ map: tex('wood') })), 0, 1.0); [[-2.1, -0.7], [2.1, -0.7], [-2.1, 0.7], [2.1, 0.7]].forEach(([a, b]) => add(box(0.12, 1, 0.12, dark), a, 0.5, b)); for (let i = 0; i < 6; i++) { add(box(0.5, 0.06, 0.5, dark), -1.8 + (i % 3) * 1.8, 0.55, i < 3 ? -1.25 : 1.25); add(cyl(0.18, 0.18, 0.03, 8, lam({ color: 0xe8e4d8 })), -1.5 + (i % 3) * 1.5, 1.08, i < 3 ? -0.55 : 0.55); } col = [2.4, 1.0]; }
    if (kind === 'cake') { add(cyl(0.35, 0.35, 0.3, 8, lam({ color: 0x8a7a5a })), 0, 1.22); add(cyl(0.36, 0.36, 0.05, 8, lam({ color: 0x5a6a3a })), 0, 1.38); for (let i = 0; i < 6; i++) add(box(0.02, 0.15, 0.02, lam({ color: 0xd0d0d0 })), Math.cos(i) * 0.2, 1.48, Math.sin(i) * 0.2); }
    if (kind === 'cabinet') { add(box(1.6, 2.2, 0.6, dark), 0, 1.1); col = [0.9, 0.4]; }
    if (kind === 'stove') { add(box(1.6, 1, 0.9, lam({ color: 0xc8c8c0 })), 0, 0.5); for (let i = 0; i < 4; i++) add(cyl(0.15, 0.15, 0.02, 6, basic({ color: 0x220000 })), -0.4 + (i % 2) * 0.8, 1.02, -0.2 + Math.floor(i / 2) * 0.4); col = [0.9, 0.5]; }
    if (kind === 'counter') { add(box(3.5, 1, 0.9, lam({ map: tex('tile') })), 0, 0.5); col = [1.8, 0.5]; }
    if (kind === 'pot') { add(cyl(0.3, 0.25, 0.35, 8, lam({ map: K.TEX.metal })), 0, 1.2); }
    if (kind === 'window') { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), new THREE.MeshBasicMaterial({ color: 0x0a1428 })), 0, 2.2, 0.03); w.userData.window = true; add(box(1.7, 0.08, 0.06, dark), 0, 2.2, 0.05); add(box(0.08, 1.9, 0.06, dark), 0, 2.2, 0.05); }
    if (kind === 'vase') { const v = A2M.mkVase(); g.add(v); col = [0.4, 0.4]; }
    if (kind === 'bed') { add(box(1.6, 0.5, 2.4, lam({ color: 0xe0a0c0 })), 0, 0.25); add(box(1.6, 0.9, 0.12, lam({ color: 0xffffff })), 0, 0.6, -1.15); add(box(0.6, 0.15, 0.4, lam({ color: 0xffffff })), 0, 0.57, -0.8); col = [0.85, 1.25]; }
    if (kind === 'musicbox') { add(box(1, 0.9, 0.6, lam({ color: 0xf0f0f0 })), 0, 0.45); add(box(0.5, 0.25, 0.35, lam({ color: 0xd04060 })), 0, 1.03); add(box(0.5, 0.04, 0.35, lam({ color: 0xffd040 })), 0, 1.17, -0.15).rotation.x = -0.8; col = [0.55, 0.35]; interact = 'musicbox'; }
    if (kind === 'toys') { [0xff4040, 0x40a0ff, 0xffd040].forEach((c, i) => add(box(0.3, 0.3, 0.3, lam({ color: c })), i * 0.35, 0.15, (i % 2) * 0.3)); }
    if (kind === 'bigbed') { add(box(2.6, 0.55, 2.6, lam({ color: 0xd8d0c0 })), 0, 0.28); add(box(2.6, 1.2, 0.15, dark), 0, 0.6, -1.3); col = [1.35, 1.35]; }
    if (kind === 'mirror') { const m = add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2), basic({ color: 0x8a9aa8 })), 0, 1.6, 0); m.rotation.y = -Math.PI / 2; interact = 'mirror'; }
    if (kind === 'wardrobe') { add(box(1.8, 2.6, 0.7, dark), 0, 1.3); col = [1, 0.4]; }
    if (kind === 'desk') { add(box(2.4, 0.9, 1.1, dark), 0, 0.45); add(box(0.5, 0.05, 0.35, lam({ color: 0xe8e0c8 })), 0.4, 0.92); col = [1.25, 0.6]; }
    if (kind === 'safe') { add(box(1.0, 1.2, 0.8, lam({ map: K.TEX.metal, color: 0x5a5a60 })), 0, 0.6); add(cyl(0.15, 0.15, 0.05, 10, lam({ color: 0xc0a040 })), 0, 0.7, 0.42).rotation.x = Math.PI / 2; col = [0.55, 0.45]; interact = 'safe'; }
    if (kind === 'books') { add(box(3, 2.4, 0.5, dark), 0, 1.2); for (let i = 0; i < 18; i++) add(box(0.12, 0.4, 0.3, lam({ color: [0x8a2020, 0x204a8a, 0x2a6a2a, 0x8a7020][i % 4] })), -1.3 + (i % 9) * 0.3, 0.7 + Math.floor(i / 9) * 0.9, 0.12); col = [1.55, 0.3]; }
    if (kind === 'plaque') { add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), lam({ color: 0xa08040 })), 0, 1.9, 0.02); interact = 'plaque'; }
    if (kind === 'tv') { add(box(1.6, 1.3, 1.1, lam({ color: 0x2a2a2a })), 0, 1.1); const sc = add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ color: 0x111111 })), 0, 1.15, 0.56); g.userData.screen = sc; add(box(1.8, 0.5, 1.2, dark), 0, 0.25); col = [0.9, 0.6]; }
    if (kind === 'barrels') { for (let i = 0; i < 3; i++) add(cyl(0.45, 0.45, 1.2, 8, lam({ color: 0x5a3a1a })), (i - 1) * 1, 0.6); col = [1.6, 0.5]; }
    if (kind === 'lab') { add(box(2.4, 0.9, 1, lam({ map: K.TEX.metal })), 0, 0.45); for (let i = 0; i < 5; i++) { add(cyl(0.12, 0.12, 0.4, 6, new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true, opacity: 0.8 })), -0.9 + i * 0.45, 1.1); } col = [1.25, 0.55]; }
    if (kind === 'savepoint') { add(box(0.9, 0.8, 0.6, dark), 0, 0.4); add(cyl(0.25, 0.25, 0.35, 8, lam({ color: 0xf0f0f0 })), -0.15, 0.98); add(box(0.35, 0.2, 0.15, lam({ color: 0x222222 })), 0.25, 0.9); const glow = add(new THREE.PointLight(0xffd090, 0.8, 4, 2), 0, 1.4); glow.userData.save = true; col = [0.5, 0.35]; interact = 'save'; }
    scene.add(g);
    const pr = { kind, g, x, z, col, interact };
    if (col) colliders.push({ x, z, hx: col[0], hz: col[1] });
    props.push(pr);
    return pr;
  }
  function portraitTex() {
    return K.canvasTex(48, 32, (g) => {
      g.fillStyle = '#3a2010'; g.fillRect(0, 0, 48, 32); g.fillStyle = '#8a7a6a'; g.fillRect(3, 3, 42, 26);
      [[10, '#d6a57a'], [20, '#e0b090'], [30, '#f0c0a0'], [38, '#d8b896']].forEach(([x, c], i) => { g.fillStyle = c; g.fillRect(x, 8 + (i === 2 ? 5 : 0), 6, 7); g.fillStyle = '#222'; g.fillRect(x - 1, 15 + (i === 2 ? 5 : 0), 8, 12); });
      g.fillStyle = 'rgba(10,5,0,0.85)'; g.beginPath(); g.ellipse(26, 16, 18, 13, 0.3, 0, 7); g.fill();
      g.fillStyle = '#e0b090'; g.fillRect(38, 22, 6, 3); g.fillStyle = '#f0d080'; g.fillRect(36, 25, 8, 2);
    });
  }

  // ---------------------------------------------------------------
  // inimigos
  // ---------------------------------------------------------------
  function mkDog() {
    const g = new THREE.Group(), m = K.lam({ color: 0xc08a4a });
    const body = K.box(0.4, 0.4, 1.0, m); body.position.y = 0.55; g.add(body);
    const head = K.box(0.35, 0.35, 0.45, m); head.position.set(0, 0.8, 0.6); g.add(head);
    const eye = K.box(0.06, 0.06, 0.02, K.basic({ color: 0xffd040 })); eye.position.set(0.1, 0.85, 0.83); g.add(eye); const e2 = eye.clone(); e2.position.x = -0.1; g.add(e2);
    const legs = [];
    [[-0.15, 0.35], [0.15, 0.35], [-0.15, -0.35], [0.15, -0.35]].forEach(([x, z]) => { const l = K.box(0.1, 0.4, 0.1, m); l.position.set(x, 0.2, z); g.add(l); legs.push(l); });
    const tail = K.box(0.06, 0.06, 0.4, m); tail.position.set(0, 0.7, -0.6); tail.rotation.x = 0.6; g.add(tail);
    return { g, legs, mats: [m], root: g, flash: (c) => m.emissive.setHex(c) };
  }
  function spawnEnemy(def, idx) {
    const key = roomId + ':' + idx;
    if (st.killed[key]) return;
    if (def.flag && !st.flags[def.flag]) return;
    const E = D3.ENEMIES3[def.type];
    let model;
    if (def.type === 'cachorro') model = mkDog();
    else { model = A3.person('farofeiro', { scale: def.type === 'boss' ? 1.9 : 1 }); if (def.type === 'boss') { const eyes = K.box(0.3, 0.05, 0.02, K.basic({ color: 0xffc040 })); eyes.position.set(0, 0.25, 0.2); model.head.add(eyes); } }
    model.g.position.set(def.x, 0, def.z);
    scene.add(model.g);
    enemies.push({ type: def.type, E, key, model, x: def.x, z: def.z, hp: E.hp, cd: 1, stagger: 0, dead: 0, ry: 0, t: Math.random() * 5, awake: def.type === 'boss' });
  }

  // ---------------------------------------------------------------
  // montar sala
  // ---------------------------------------------------------------
  function buildRoom(id) {
    roomId = id; room = D3.ROOMS[id];
    if (scene) scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020203);
    scene.fog = new THREE.Fog(0x050608, 8, room.outside ? 26 : 22);
    enemies = []; items = []; doors = []; props = []; colliders = [];
    const { lam, box } = K;
    const W = room.w, D = room.d;
    ambient = new THREE.AmbientLight(0x8090b0, room.dark ? 0.12 : 0.28); scene.add(ambient);
    scene.add(new THREE.HemisphereLight(0x6070a0, 0x100808, 0.18));
    lampLight = new THREE.PointLight(room.outside ? 0x8090c0 : 0xffb070, room.dark ? 0.3 : 0.9, 14, 1.6); lampLight.position.set(0, 3.4, 0); scene.add(lampLight);
    flash = new THREE.PointLight(0xfff0d0, 1.3, 8, 1.6); scene.add(flash);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D, Math.ceil(W / 2), Math.ceil(D / 2)), lam({ map: tex(room.floor) }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const wallMat = lam({ map: tex(room.wall) });
    const wh = room.outside ? 2.2 : WALL_H;
    [[W, 0, -D / 2, 0], [W, 0, D / 2, Math.PI], [D, -W / 2, 0, Math.PI / 2], [D, W / 2, 0, -Math.PI / 2]].forEach(([len, x, z, ry]) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(len, wh, Math.ceil(len / 2), 2), wallMat);
      w.position.set(x, wh / 2, z); w.rotation.y = ry; scene.add(w);
    });
    if (room.outside) {
      // fachada da mansão ao norte
      const fac = box(W + 4, 9, 1, lam({ map: tex('burnt') })); fac.position.set(0, 4.5, -D / 2 - 0.6); scene.add(fac);
      for (let i = -2; i <= 2; i++) if (i) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshBasicMaterial({ color: 0x0a1020 })); w.position.set(i * 2.6, 5.5, -D / 2 - 0.09); w.userData.window = true; scene.add(w); }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(W * 0.8, 3, 4), lam({ color: 0x1a1010 })); roof.position.set(0, 10.5, -D / 2 - 3); roof.rotation.y = Math.PI / 4; scene.add(roof);
      const N = 600, geo = new THREE.BufferGeometry(), a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { a[i * 3] = (Math.random() - 0.5) * W; a[i * 3 + 1] = Math.random() * 10; a[i * 3 + 2] = (Math.random() - 0.5) * D; }
      geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
      rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8090b0, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.55 }));
      rain.frustumCulled = false; scene.add(rain);
    } else {
      rain = null;
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lam({ color: 0x1a1010 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = WALL_H; scene.add(ceil);
    }
    // portas
    room.doors.forEach((d) => {
      const g = new THREE.Group();
      const locked = d.lock && !st.flags['open:' + d.lock];
      const leaf = box(1.5, 2.6, 0.12, lam({ color: d.to === 'porao' ? 0x3a3a3a : 0x4a2a16 })); leaf.position.y = 1.3; g.add(leaf);
      const frame = box(1.8, 2.8, 0.06, lam({ color: 0x1a0e08 })); frame.position.set(0, 1.4, -0.04); g.add(frame);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), lam({ color: locked ? 0x8a2020 : 0xc0a040 })); knob.position.set(0.55, 1.2, 0.08); g.add(knob);
      const rot = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 }[d.side];
      g.position.set(d.x, 0, d.z); g.rotation.y = rot;
      if (d.side === 'n') g.position.z += 0.07; if (d.side === 's') g.position.z -= 0.07; if (d.side === 'e') g.position.x -= 0.07; if (d.side === 'w') g.position.x += 0.07;
      scene.add(g);
      doors.push(Object.assign({}, d, { g }));
    });
    // móveis
    room.props.forEach(([k, x, z]) => {
      const pr = prop(k, x, z);
      if (k === 'portrait' || k === 'plaque' || k === 'window') { if (z <= -D / 2 + 0.2) pr.g.position.z = -D / 2 + 0.02; }
      if (k === 'mirror') pr.g.position.x = W / 2 - 0.05;
    });
    if (room.save) prop('savepoint', room.save[0], room.save[1]);
    // itens
    room.items.forEach((it, i) => {
      const key = roomId + ':' + i;
      if (st.taken[key]) return;
      const g = new THREE.Group();
      const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), K.basic({ color: 0xffffff }));
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(spark); g.add(glow);
      g.position.set(it.x, it.id === 'bailarina' ? 1.6 : 0.3, it.z);
      scene.add(g);
      items.push({ id: it.id, key, x: it.x, z: it.z, g, label: it.label });
    });
    // inimigos
    room.enemies.forEach((e, i) => spawnEnemy(e, i));
    // câmera fixa
    cam = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 80);
    cam.position.set(room.cam[0], room.cam[1], room.cam[2]);
    cam.lookAt(room.look[0], room.look[1] + 0.6, room.look[2]);
    // jogador
    if (!P) P = { model: A3.person('jinlong'), x: 0, z: 0, ry: 0, aim: false, grab: 0, shootCd: 0, reload: 0, walkT: 0 };
    scene.add(P.model.g);
    A3.setView(scene, cam, update);
    showRoomName(room.name);
    const music = id === 'hall' ? 'safe' : 'horror';
    Sfx.music(music);
    snapshot = JSON.parse(JSON.stringify(st));
  }

  function placePlayerAt(fromRoom) {
    const d = doors.find((x) => x.to === fromRoom);
    if (d) {
      const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[d.side];
      P.x = d.x + inward[0] * 1.4; P.z = d.z + inward[1] * 1.4;
      P.ry = Math.atan2(inward[0], inward[1]);
    } else if (room.start) { P.x = room.start[0]; P.z = room.start[1]; P.ry = room.start[2]; }
    else { P.x = 0; P.z = 0; P.ry = 0; }
  }

  // ---------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------
  function showRoomName(n) { const z = $('#hZone'); z.textContent = n; z.classList.remove('show'); void z.offsetWidth; z.classList.add('show'); }
  function hud() {
    const hp = st.hp;
    const cond = hp > 66 ? ['BEM', '#40e070'] : hp > 33 ? ['CUIDADO', '#f0c020'] : ['PERIGO', '#ff3020'];
    $('#hCond').textContent = cond[0]; $('#hCond').style.color = cond[1];
    $('#hEcg').style.borderColor = cond[1]; $('#hEcg').style.setProperty('--ecg', cond[1]);
    $('#hEcg').style.animationDuration = hp > 66 ? '1.2s' : hp > 33 ? '0.8s' : '0.45s';
    $('#hAmmo').textContent = `🔫 ${st.chamber}/6 · 🌾 ${st.ammo}`;
  }
  function nearInteract() {
    const fx = Math.sin(P.ry), fz = Math.cos(P.ry);
    let best = null, bd = 1.9;
    const consider = (o, x, z, label, r) => {
      const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz);
      const score = o.type === 'door' ? d - 0.6 : d; // porta tem prioridade
      if (d < (r || bd) && (d < 0.9 || (dx * fx + dz * fz) / d > 0.2) && d < bd + 0.6) { if (!best || score < best.d) best = { o, d: score, label }; }
    };
    items.forEach((it) => consider({ type: 'item', it }, it.x, it.z, it.label || 'Pegar ' + D3.ITEMS[it.id].name));
    doors.forEach((d) => consider({ type: 'door', d }, d.x, d.z, d.label || 'Porta'));
    props.forEach((p) => { if (p.interact) consider({ type: 'prop', p }, p.x, p.z, { stairs: 'Escada', portrait: 'Retrato', musicbox: 'Caixinha de música', mirror: 'Espelho', safe: 'Cofre', plaque: 'Placa', save: 'Panela de arroz (salvar)', tv: 'TV' }[p.interact], 2.4); });
    return best;
  }

  // ---------------------------------------------------------------
  // update
  // ---------------------------------------------------------------
  function update(dt) {
    if (!running) return;
    t += dt;
    if (rain) { const a = rain.geometry.attributes.position.array; for (let i = 1; i < a.length; i += 3) { a[i] -= dt * 16; if (a[i] < 0) a[i] = 10; } rain.geometry.attributes.position.needsUpdate = true; }
    // relâmpago
    lightningT -= dt;
    if (lightningT <= 0) {
      lightningT = 7 + Math.random() * 12;
      ambient.intensity = 1.6;
      scene.traverse((o) => { if (o.userData.window) o.material.color.setHex(0xd0e0ff); });
      setTimeout(() => { if (ambient) ambient.intensity = room.dark ? 0.12 : 0.28; scene && scene.traverse((o) => { if (o.userData.window) o.material.color.setHex(0x0a1020); }); }, 110);
      setTimeout(() => { Sfx.raw.noiseHit(120, 0.7, 2.2, 0.5, null, null, 'lowpass'); Sfx.raw.tone(45, 1.8, 'sine', 0.3, null, null, 30); }, 400 + Math.random() * 900);
    }
    lampLight.intensity = (room.dark ? 0.3 : 0.9) * (Math.random() < 0.03 ? 0.2 : 1);
    if (mode === 'play' && !A3.busy()) playerUpdate(dt);
    else P.model.walk(0, 0);
    enemyUpdate(dt);
    items.forEach((it) => { it.g.rotation.y += dt * 2; it.g.children[1].material.opacity = 0.15 + Math.abs(Math.sin(t * 3)) * 0.25; });
    // jogador visual
    P.model.g.position.set(P.x, 0, P.z);
    P.model.g.rotation.y = P.ry;
    flash.position.set(P.x + Math.sin(P.ry) * 1.6, 1.6, P.z + Math.cos(P.ry) * 1.6);
    // coração quando a vida tá baixa
    if (st.hp < 34) { heartT -= dt; if (heartT <= 0) { heartT = 0.75; Sfx.raw.tone(55, 0.12, 'sine', 0.4, null, null, 40); Sfx.raw.tone(50, 0.12, 'sine', 0.3, null, Sfx.raw.now() + 0.18, 38); } }
    hurtT -= dt;
    const near = mode === 'play' ? nearInteract() : null;
    $('#hInteract').textContent = near ? `[E] ${near.label}` : '';
    $('#hInteract').classList.toggle('hidden', !near);
    if (mode === 'play' && !A3.busy() && A3.pressed.KeyE && near) interact(near.o);
    if (mode === 'play' && !A3.busy() && (A3.pressed.KeyI || A3.pressed.Tab)) openInv();
    hud();
  }

  function collide(o, r) {
    const hw = room.w / 2 - r, hd = room.d / 2 - r;
    o.x = Math.max(-hw, Math.min(hw, o.x)); o.z = Math.max(-hd, Math.min(hd, o.z));
    for (const c of colliders) {
      const dx = o.x - c.x, dz = o.z - c.z, ox = c.hx + r - Math.abs(dx), oz = c.hz + r - Math.abs(dz);
      if (ox > 0 && oz > 0) { if (ox < oz) o.x += Math.sign(dx) * ox; else o.z += Math.sign(dz) * oz; }
    }
  }

  function playerUpdate(dt) {
    const k = A3.keys, m = P.model;
    if (P.grab > 0) { P.grab -= dt; m.root.rotation.z = Math.sin(t * 30) * 0.08; return; }
    m.root.rotation.z = 0;
    P.aim = !!(k.KeyK || k.Mouse2);
    P.shootCd -= dt;
    if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) { const n = Math.min(6 - st.chamber, st.ammo); st.chamber += n; st.ammo -= n; } }
    const limp = st.hp < 34 ? 0.6 : 1;
    if (P.aim) {
      // mira automática no inimigo mais perto na frente
      aimTarget = null; let bd = 9;
      enemies.forEach((e) => { if (e.dead) return; const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz); const ang = Math.abs(((Math.atan2(dx, dz) - P.ry + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < bd && ang < 1.0) { bd = d; aimTarget = e; } });
      if (aimTarget) { const want = Math.atan2(aimTarget.x - P.x, aimTarget.z - P.z); P.ry += ((want - P.ry + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 10); }
      if (k.KeyA) P.ry += dt * 2.2; if (k.KeyD) P.ry -= dt * 2.2;
      m.armR.rotation.x = -1.57; m.armL.rotation.x = -1.4; m.armL.rotation.z = -0.3; m.legL.rotation.x = 0; m.legR.rotation.x = 0;
      if ((A3.pressed.KeyJ || A3.pressed.Mouse0) && P.shootCd <= 0 && P.reload <= 0) shoot();
      return;
    }
    m.armL.rotation.z = 0;
    if (k.KeyA) P.ry += dt * 2.6; if (k.KeyD) P.ry -= dt * 2.6;
    let mv = 0;
    if (k.KeyW) mv = (k.ShiftLeft || k.ShiftRight ? 4.2 : 2.0) * limp;
    if (k.KeyS) mv = -1.3 * limp;
    if (mv) {
      P.x += Math.sin(P.ry) * mv * dt; P.z += Math.cos(P.ry) * mv * dt;
      collide(P, 0.4);
      P.walkT += dt * Math.abs(mv) * 3.2;
      m.walk(P.walkT, 0.6);
      if (Math.floor(P.walkT / Math.PI) !== Math.floor((P.walkT - dt * Math.abs(mv) * 3.2) / Math.PI)) Sfx.raw.noiseHit(500, 1, 0.06, 0.08, null, null, 'lowpass');
    } else m.walk(0, 0);
  }

  function shoot() {
    if (st.chamber <= 0) {
      if (st.ammo > 0) { P.reload = 1.1; Sfx.raw.tone(400, 0.05, 'square', 0.05); Sfx.raw.tone(300, 0.05, 'square', 0.05, null, Sfx.raw.now() + 0.4); Sfx.raw.noiseHit(3000, 4, 0.06, 0.15, null, Sfx.raw.now() + 0.9); return; }
      // sem bala: hashi na mão
      P.shootCd = 0.6;
      Sfx.shoot('whiff');
      if (aimTarget && Math.hypot(aimTarget.x - P.x, aimTarget.z - P.z) < 1.6) hitEnemy(aimTarget, 8);
      return;
    }
    st.chamber--;
    P.shootCd = 0.55;
    Sfx.raw.noiseHit(1200, 0.7, 0.3, 0.6, null, null, 'lowpass'); Sfx.raw.tone(90, 0.2, 'square', 0.25, null, null, 40);
    flash.intensity = 4; setTimeout(() => { flash && (flash.intensity = 1.3); }, 60);
    const mz = V(P.x + Math.sin(P.ry) * 0.9, 1.65, P.z + Math.cos(P.ry) * 0.9);
    A2M.firework(scene, mz, [0xffe080, 0xffffff], 8, 3);
    if (aimTarget) hitEnemy(aimTarget, 25);
    if (st.chamber === 0 && st.ammo > 0) P.reload = 1.1;
  }

  function hitEnemy(e, dmg) {
    e.hp -= dmg; e.stagger = 0.4; e.awake = true;
    e.model.flash && e.model.flash(0x993311); setTimeout(() => e.model.flash && e.model.flash(0), 80);
    A2M.firework(scene, V(e.x, 1.4, e.z), [0xe8c070, 0x8a6a3a], 10, 3);
    if (e.hp <= 0 && !e.dead) {
      e.dead = 0.01;
      st.killed[e.key] = true;
      Sfx.enemyDie(e.type === 'boss');
      A2M.firework(scene, V(e.x, 1, e.z), [0xe8c070, 0xd0a050, 0xfff0c0], e.type === 'boss' ? 160 : 50, e.type === 'boss' ? 6 : 3);
    } else Sfx.enemyHurt();
  }

  function enemyUpdate(dt) {
    enemies.forEach((e) => {
      e.t += dt;
      if (e.dead) {
        e.dead += dt;
        const s = Math.max(0.01, 1 - e.dead * 1.2);
        e.model.g.scale.set(e.model.g.scale.x, s * (e.type === 'boss' ? 1.9 : 1), e.model.g.scale.z);
        if (e.dead > 1.2) e.model.g.visible = false;
        return;
      }
      const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 1;
      if (!e.awake && d < 9) e.awake = true;
      if (!e.awake || mode !== 'play') return;
      e.ry = Math.atan2(dx, dz);
      e.model.g.rotation.y = e.ry;
      if (e.stagger > 0) { e.stagger -= dt; e.model.root && (e.model.root.rotation.x = -0.3); return; }
      if (e.model.root) e.model.root.rotation.x = 0;
      const E = e.E;
      let sp = E.speed;
      if (e.type === 'boss' && e.charge > 0) { e.charge -= dt; sp = 6; }
      else if (e.type === 'boss' && Math.random() < dt * 0.35 && d > 3) { e.charge = 0.8; Sfx.roar(); }
      if (A3.busy()) return;
      if (d > E.range) {
        e.x += dx / d * sp * dt; e.z += dz / d * sp * dt;
        collide(e, 0.35);
        if (e.type === 'cachorro') e.model.legs.forEach((l, i) => { l.rotation.x = Math.sin(e.t * 18 + i * 1.6) * 0.6; });
        else { e.model.walk(e.t * 4 * sp, 0.35); e.model.armL.rotation.x = e.model.armR.rotation.x = -1.5; }
      }
      e.cd -= dt;
      if (d <= E.range && e.cd <= 0 && P.grab <= 0) {
        e.cd = E.cd;
        hurtPlayer(E.dmg, e);
      }
      groanT -= dt;
      if (groanT <= 0 && e.type !== 'cachorro') { groanT = 3 + Math.random() * 4; Sfx.raw.tone(90 + Math.random() * 40, 0.9, 'sawtooth', 0.04, null, null, 70); }
      if (e.type === 'cachorro' && Math.random() < dt * 0.3) Sfx.raw.tone(400, 0.12, 'square', 0.05, null, null, 250);
      e.model.g.position.set(e.x, 0, e.z);
    });
  }

  function hurtPlayer(dmg, e) {
    st.hp -= dmg;
    P.grab = e.type === 'cachorro' ? 0.4 : 0.7;
    Sfx.hurt();
    const f = $('#hurtFlash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    // empurra o jogador
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 1;
    P.x += dx / d * 0.8; P.z += dz / d * 0.8; collide(P, 0.4);
    if (st.hp <= 0) die();
  }

  async function die() {
    mode = 'dead';
    $('#dead2 .d-big').textContent = 'VOCÊ MORREU';
    $('#dead2 small').textContent = 'A farofa te engoliu. Clique pra voltar pra porta da sala.';
    $('#dead2').classList.remove('hidden');
    await A3.wait(1500);
    await UI.waitOrClick(8000);
    $('#dead2').classList.add('hidden');
    st = JSON.parse(JSON.stringify(snapshot));
    st.hp = Math.max(st.hp, 60);
    const from = lastFrom;
    buildRoom(st.room);
    placePlayerAt(from);
    mode = 'play';
    // morreu pro chefe: volta direto pra luta, sem repetir a fita
    if (st.room === 'porao') { st.flags.tvDone = true; porao(true); }
  }

  // ---------------------------------------------------------------
  // interações
  // ---------------------------------------------------------------
  const say = (text) => UI.dialog([['NARRADOR', text]]);
  let lastFrom = null;
  async function interact(o) {
    mode = 'text';
    if (o.type === 'item') await takeItem(o.it);
    else if (o.type === 'door') await useDoor(o.d);
    else if (o.type === 'prop') await useProp(o.p);
    if (mode === 'text') mode = 'play';
  }
  async function takeItem(it) {
    const I = D3.ITEMS[it.id];
    if (it.id === 'bailarina') await say(D3.HORROR_TEXT.cakeText);
    if (!addItem(it.id)) { await say('O inventário está cheio. Use alguma coisa primeiro.'); return; }
    st.taken[it.key] = true;
    scene.remove(it.g); items.splice(items.indexOf(it), 1);
    Sfx.pickup();
    await say(`Você pegou: ${I.icon} ${I.name}. ${I.desc}`);
    if (it.id === 'diario') await UI.dialog([['DIÁRIO DA LINA', '"12 de março. A tia Mei veio de novo hoje com pastel pra Mimi. Ela olha pro Jinlong como quem espera ser lembrada. Ele nunca lembra o nome dela. Vou falar com ele."']]);
  }
  async function useDoor(d) {
    if (d.lock && !st.flags['open:' + d.lock]) {
      if (has(d.lock)) { st.flags['open:' + d.lock] = true; removeItem(d.lock); Sfx.door(); await say(`Você usou: ${D3.ITEMS[d.lock].name}.`); }
      else { Sfx.raw.noiseHit(400, 3, 0.15, 0.3); await say(D3.HORROR_TEXT.locked); return; }
    }
    if (d.to === 'porao' && !st.flags.porao) st.flags.porao = true;
    await doorTransition();
    lastFrom = roomId;
    st.room = d.to;
    buildRoom(d.to);
    placePlayerAt(lastFrom);
    if (d.to === 'porao' && !st.flags.tvDone) await porao();
  }
  async function useProp(p) {
    const T = D3.HORROR_TEXT;
    if (p.interact === 'portrait') return say(T.portrait);
    if (p.interact === 'plaque') return say(T.plaque);
    if (p.interact === 'stairs') return say(T.stairs);
    if (p.interact === 'mirror') {
      const lina = A3.person('lina'); A3.ghost(lina, 0x203a6a); lina.g.position.set(P.x - Math.sin(P.ry) * 1.2, 0, P.z - Math.cos(P.ry) * 1.2); lina.g.rotation.y = P.ry; scene.add(lina.g);
      Sfx.raw.tone(880, 1.5, 'sine', 0.04, null, null, 440);
      await say(T.mirror);
      scene.remove(lina.g);
      return;
    }
    if (p.interact === 'save') {
      await say(T.save);
      UI.S().act3 = Object.assign(UI.S().act3 || {}, { horror: JSON.parse(JSON.stringify(st)) });
      UI.save();
      Sfx.keyGet();
      return say(T.saved);
    }
    if (p.interact === 'musicbox') {
      if (st.flags.musicDone) return say('A caixinha está em silêncio. Mas a música ainda está na sua cabeça.');
      if (!has('bailarina')) return say(T.musicboxEmpty);
      removeItem('bailarina');
      st.flags.musicDone = true;
      await say(T.musicboxOk);
      playMimiTheme();
      const mimi = A3.person('mimi'); A3.ghost(mimi, 0x6a2040); mimi.g.position.set(-2.8, 0.5, -2.2); mimi.g.rotation.y = 0.6; scene.add(mimi.g);
      await A3.wait(2200);
      await UI.dialog([['MIMI', 'Papai? Você voltou? A tia Mei disse que você ia esquecer a gente...'], ['MIMI', 'Mas você não esqueceu. Toca a minha música no ano novo, tá?']]);
      scene.remove(mimi.g);
      addItem('chave_escritorio');
      Sfx.pickup();
      st.flags.hallAmbush = true;
      return say('A gaveta da caixinha abriu sozinha. Você pegou: 🗝 Chave do Escritório.');
    }
    if (p.interact === 'safe') {
      if (st.flags.safeDone) return say('O cofre está vazio.');
      await say(T.safeAsk);
      const code = await keypad();
      if (code !== '1962') { Sfx.error(); return say(T.safeWrong); }
      st.flags.safeDone = true;
      Sfx.keyGet();
      await say(T.safeOk);
      addItem('foto1962'); addItem('chave_porao');
      await UI.dialog([
        ['NARRADOR', 'Dentro: uma foto antiga e uma chave enferrujada.'],
        ['NARRADOR', 'Na foto, dois irmãos no convés de um navio. Um menino de doze anos, sério. Uma menina de nove, sorrindo, com a mão fechada perto da boca.'],
        ['NARRADOR', 'Atrás, com a letra do seu avô: "Dashan e Mei, 1962. A Mei carregou o grão a viagem toda. Nunca contei isso pra ninguém."'],
        ['JINLONG', '...Mei. Dona Mei.'],
      ]);
      return;
    }
  }

  function playMimiTheme() {
    const now = Sfx.raw.now(), beat = 0.42;
    D3.MIMI_THEME.forEach(([b, n, d]) => {
      const f = 523.25 * Math.pow(2, n / 12);
      Sfx.raw.tone(f, d * beat * 0.9, 'triangle', 0.07, null, now + 0.1 + b * beat);
      Sfx.raw.tone(f * 2, 0.2, 'sine', 0.03, null, now + 0.1 + b * beat);
    });
  }

  function keypad() {
    return new Promise((res) => {
      const box = $('#safeBox'), disp = $('#safeDisp');
      let code = '';
      disp.textContent = '----';
      box.classList.remove('hidden');
      const done = (v) => { box.classList.add('hidden'); window.removeEventListener('keydown', onKey); box.onclick = null; res(v); };
      const push = (ch) => { if (ch === 'C') { code = ''; } else if (ch === 'OK') { return done(code); } else if (code.length < 4) code += ch; disp.textContent = (code + '----').slice(0, 4); Sfx.raw.tone(900, 0.05, 'square', 0.05); };
      const onKey = (e) => { if (/^Digit\d$/.test(e.code)) push(e.code.slice(5)); if (e.code === 'Enter') push('OK'); if (e.code === 'Backspace') push('C'); if (e.code === 'Escape') done(''); };
      window.addEventListener('keydown', onKey);
      box.onclick = (e) => { const b = e.target.closest('button'); if (b) push(b.dataset.k); };
    });
  }

  function openInv() {
    mode = 'inv';
    const box = $('#invBox');
    const render = () => {
      $('#invList').innerHTML = st.inv.map((i, idx) => { const I = D3.ITEMS[i.id]; return `<button class="inv-item" data-i="${idx}"><span class="ii">${I.icon}</span><b>${I.name}</b><small>${I.desc}</small></button>`; }).join('') + Array.from({ length: 8 - st.inv.length }, () => '<div class="inv-item empty"></div>').join('');
      $('#invCombine').classList.toggle('hidden', !(has('boldo') && has('pimenta')));
      $('#invStatus').textContent = `Condição: ${st.hp > 66 ? 'BEM' : st.hp > 33 ? 'CUIDADO' : 'PERIGO'} · 🔫 ${st.chamber}/6 · 🌾 ${st.ammo}`;
    };
    render();
    box.classList.remove('hidden');
    const close = () => { box.classList.add('hidden'); window.removeEventListener('keydown', onKey); box.onclick = null; mode = 'play'; };
    const onKey = (e) => { if (['KeyI', 'Tab', 'Escape'].includes(e.code)) { e.preventDefault(); close(); } };
    setTimeout(() => window.addEventListener('keydown', onKey), 50);
    box.onclick = (e) => {
      if (e.target.closest('#invClose')) return close();
      if (e.target.closest('#invCombine')) { removeItem('boldo'); removeItem('pimenta'); addItem('mistura'); Sfx.pickup(); UI.toast('🍵 Você misturou: Chá de Boldo com Pimenta.', 'item'); return render(); }
      const b = e.target.closest('.inv-item[data-i]');
      if (!b) return;
      const it = st.inv[+b.dataset.i], I = D3.ITEMS[it.id];
      if (I.heal) { st.hp = Math.min(100, st.hp + I.heal); removeItem(it.id); Sfx.pickup(); UI.toast(`Você usou: ${I.name}.`, 'item'); render(); }
      else UI.toast(I.desc, '', 3500);
    };
  }

  function doorTransition() {
    // a porta abrindo, igual aos clássicos
    return new Promise((res) => {
      const sc = new THREE.Scene(); sc.background = new THREE.Color(0x000000);
      const c = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 50);
      sc.add(new THREE.AmbientLight(0xffffff, 0.25));
      const l = new THREE.PointLight(0xffc080, 1.2, 8); l.position.set(0, 2, 2); sc.add(l);
      const piv = new THREE.Group(); piv.position.set(-0.8, 0, 0); sc.add(piv);
      const leaf = K.box(1.6, 3, 0.12, K.lam({ map: tex('wood'), color: 0x8a5a3a })); leaf.position.set(0.8, 1.5, 0); piv.add(leaf);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), K.lam({ color: 0xc0a040 })); knob.position.set(1.4, 1.3, 0.1); piv.add(knob);
      const fr = K.box(2.2, 3.4, 0.1, K.lam({ color: 0x1a0e08 })); fr.position.set(0, 1.6, -0.1); sc.add(fr);
      let tt = 0;
      Sfx.raw.tone(180, 1.2, 'sawtooth', 0.04, null, Sfx.raw.now() + 0.3, 120);
      Sfx.raw.noiseHit(900, 6, 0.9, 0.1, null, Sfx.raw.now() + 0.3);
      const prev = A3.render;
      A3.setView(sc, c, (dt) => {
        tt += dt;
        piv.rotation.y = -Math.min(1.5, Math.max(0, tt - 0.4) * 1.3);
        c.position.set(0, 1.6, 4 - tt * 1.6); c.lookAt(0, 1.6, -2);
        if (tt > 2) { A3.setView(scene, cam, update); res(); }
      });
      void prev;
    });
  }

  // ---------------------------------------------------------------
  // porão: a fita da Dona Mei + o Farofeiro-Mor
  // ---------------------------------------------------------------
  async function porao(skipTV) {
    if (skipTV) return poraoBoss();
    mode = 'cine';
    const tv = props.find((p) => p.kind === 'tv');
    const screenTex = K.canvasTex(64, 48, () => {});
    tv.g.userData.screen.material = new THREE.MeshBasicMaterial({ map: screenTex });
    let st2 = 0;
    const meiFace = A2M.T.faces.mei;
    const drawTV = () => {
      const g = screenTex.userData.ctx;
      g.fillStyle = '#1a1018'; g.fillRect(0, 0, 64, 48);
      if (meiFace) g.drawImage(meiFace.userData.canvas, 16, 6, 32, 32);
      for (let y = 0; y < 48; y += 2) { g.fillStyle = `rgba(0,0,0,${0.25 + Math.random() * 0.2})`; g.fillRect(0, y, 64, 1); }
      g.fillStyle = '#fff'; g.font = '6px monospace'; g.fillText('PLAY ▶', 2, 46);
      screenTex.needsUpdate = true;
    };
    const iv = setInterval(() => { st2++; drawTV(); }, 120);
    A3.camAt(V(0, 1.8, -2.2), V(0, 1.2, -5.5), cam);
    await A3.talk(D3.SCRIPT.joaTV, null, async (cue) => { if (cue === 'boss') { clearInterval(iv); Sfx.tvStatic(0.5); } });
    clearInterval(iv);
    cam.position.set(room.cam[0], room.cam[1], room.cam[2]); cam.lookAt(room.look[0], room.look[1] + 0.6, room.look[2]);
    st.flags.tvDone = true;
    snapshot = JSON.parse(JSON.stringify(st));
    return poraoBoss();
  }
  let bossRun = 0;
  async function poraoBoss() {
    const my = ++bossRun;
    // chefe
    Sfx.roar();
    spawnEnemy({ type: 'boss', x: 4, z: -3.5 }, 99);
    st.ammo += 12; UI.toast('🌾 Você acha 12 grãos de munição numa caixa caída. Vai precisar.', 'item', 4000);
    Sfx.music('fight');
    mode = 'play';
    await A3.until(() => my !== bossRun || enemies.every((e) => e.type !== 'boss' || (e.dead && e.dead > 1)));
    if (my !== bossRun) return; // morreu e a luta recomeçou
    Sfx.music(null);
    finish();
  }

  function finish() {
    running = false;
    $('#horrorHud').classList.add('hidden');
    World.setGray(0); World.setTint(1, 1, 1);
    const r = resolveRun; resolveRun = null; r && r();
  }

  // ---------------------------------------------------------------
  // API
  // ---------------------------------------------------------------
  function run(saved) {
    K = World.kit; UI = window.GameUI;
    st = saved && saved.room ? JSON.parse(JSON.stringify(saved)) : fresh();
    P = null; mode = 'play'; running = true; t = 0;
    World.setGray(0.35); World.setTint(0.9, 0.97, 1.05);
    $('#horrorHud').classList.remove('hidden');
    buildRoom(st.room);
    placePlayerAt(null);
    return new Promise((res) => { resolveRun = res; if (st.room === 'porao') porao(!!st.flags.tvDone); });
  }
  function state() { return st; }

  return { run, state, debug: () => ({ st, P, enemies, roomId, mode, doors, items, props }) };
})();
