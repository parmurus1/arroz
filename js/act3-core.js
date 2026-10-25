// =====================================================================
//  ARROZ DOURADO — ATO III: base compartilhada
//  entrada, câmera de cinema, personagens novos, telas de capítulo
// =====================================================================

const A3 = (() => {
  let K = null, UI = null, ready = false;
  const $ = (s) => document.querySelector(s);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---------------------------------------------------------------
  // entrada (teclas seguradas + apertadas neste quadro)
  // ---------------------------------------------------------------
  const keys = {}, pressed = {};
  let active = false;
  function bindInput() {
    window.addEventListener('keydown', (e) => {
      if (!active) return;
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!keys[e.code]) pressed[e.code] = true;
      keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    document.addEventListener('mousedown', (e) => { if (!active) return; const c = 'Mouse' + e.button; if (!keys[c]) pressed[c] = true; keys[c] = true; });
    document.addEventListener('mouseup', (e) => { keys['Mouse' + e.button] = false; });
    document.addEventListener('contextmenu', (e) => { if (active) e.preventDefault(); });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  }
  function endFrame() { for (const k in pressed) delete pressed[k]; }
  function busy() { return UI.busy() || performance.now() - UI.consumedAt() < 150; }

  // ---------------------------------------------------------------
  // tweens, esperas, câmera de cinema
  // ---------------------------------------------------------------
  const tweens = [], waiters = [];
  let lastDt = 0.016;
  function tween(dur, fn, cam) { return new Promise((res) => tweens.push({ t: 0, dur, fn, res, cam })); }
  function until(pred) { return new Promise((res) => waiters.push({ pred, res })); }
  let cineCam = null;
  function stopCam() { for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].cam) { const t = tweens.splice(i, 1)[0]; t.res(); } }
  function camAt(pos, look, cam) { cam = cam || cineCam; stopCam(); cam.position.copy(pos); cam.lookAt(look); }
  function camMove(from, to, lookFrom, lookTo, dur, cam) {
    cam = cam || cineCam; stopCam();
    const lk = new THREE.Vector3();
    return tween(dur, (k) => { const e = ease(k); cam.position.lerpVectors(from, to, e); lk.lerpVectors(lookFrom, lookTo, e); cam.lookAt(lk); }, true);
  }
  function faceShot(p, dist, side, cam) {
    const g = p.g, s = g.scale.x, ry = g.rotation.y;
    const wp = new THREE.Vector3(); g.getWorldPosition(wp);
    const head = V(wp.x, wp.y + (p.root.position.y + 2.15) * s, wp.z);
    const sd = side == null ? 0.5 : side;
    camAt(head.clone().add(V(Math.sin(ry) * dist + Math.cos(ry) * sd, 0.15, Math.cos(ry) * dist - Math.sin(ry) * sd)), head, cam);
  }
  async function talk(lines, shot, cue) {
    for (let i = 0; i < lines.length; i++) {
      const [who, text, c] = lines[i];
      if (c && cue) await cue(c);
      if (shot) shot(who, i);
      await UI.dialog([[who, text]]);
    }
  }
  function letterbox(on) { $('#letterbox').classList.toggle('on', on); }

  // ---------------------------------------------------------------
  // cena atual
  // ---------------------------------------------------------------
  let view = null;
  function setView(scene, cam, upd) { view = { scene, cam: cam || cineCam, update: upd || null }; }
  function update(dt) {
    lastDt = dt;
    for (let i = tweens.length - 1; i >= 0; i--) { const t = tweens[i]; t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k >= 1) { tweens.splice(i, 1); t.res(); } }
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].pred(dt)) { const w = waiters.splice(i, 1)[0]; w.res(); }
    if (view && view.update) view.update(dt);
    if (view) A2M.fxUpdate(view.scene, dt);
  }
  function render() {
    if (!view) return;
    const a = window.innerWidth / window.innerHeight;
    if (Math.abs(view.cam.aspect - a) > 0.001) { view.cam.aspect = a; view.cam.updateProjectionMatrix(); }
    World.renderWith(view.scene, view.cam);
  }

  // ---------------------------------------------------------------
  // personagens novos
  // ---------------------------------------------------------------
  function face(kind, draw) {
    A2M.T.faces[kind] = K.canvasTex(16, 16, (g) => {
      const px = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
      draw(px, g);
    });
  }
  function makeFaces() {
    const eyes = (px, y, c) => { px('#fff', 3, y, 3, 2); px('#fff', 10, y, 3, 2); px(c || '#222', 4, y, 2, 2); px(c || '#222', 11, y, 2, 2); };
    face('couve', (px) => { px('#8a5a3a', 0, 0, 16, 16); px('#2a9a3a', 0, 0, 16, 4); px('#1f7a2a', 0, 4, 16, 1); eyes(px, 6); px('#5a3a2a', 5, 10, 6, 1); px('#fff', 6, 12, 4, 1); px('#222', 4, 13, 8, 1); });
    face('vinagrete', (px) => { px('#e8b090', 0, 0, 16, 16); px('#5a2a10', 0, 0, 16, 3); px('#5a2a10', 0, 3, 2, 8); px('#5a2a10', 14, 3, 2, 8); eyes(px, 6, '#2a6a2a'); px('#111', 2, 5, 5, 1); px('#111', 9, 5, 5, 1); px('#d02020', 5, 12, 6, 2); });
    face('torresmo', (px) => { px('#e0a070', 0, 0, 16, 16); px('#c08040', 0, 0, 16, 2); px('#e07060', 1, 8, 3, 2); px('#e07060', 12, 8, 3, 2); px('#111', 4, 6, 2, 1); px('#111', 10, 6, 2, 1); px('#5a2a10', 2, 10, 12, 2); px('#5a2a10', 1, 11, 2, 3); px('#5a2a10', 13, 11, 2, 3); });
    face('kwanBurnt', (px) => {
      px('#d8b896', 0, 0, 16, 16); px('#3a2010', 8, 0, 8, 16); px('#5a3020', 9, 2, 5, 10);
      px('#bbb', 0, 2, 2, 6); px('#222', 3, 6, 4, 1); px('#222', 4, 7, 2, 1);
      px('#111', 9, 5, 6, 3); px('#111', 0, 5, 16, 1);
      px('#eee', 3, 11, 5, 5); px('#888', 8, 11, 4, 4); px('#5a3a2a', 5, 12, 4, 1);
    });
    face('wellington', (px) => { px('#a87050', 0, 0, 16, 16); px('#111', 0, 0, 16, 4); px('#1a3a8a', 0, 0, 16, 2); eyes(px, 6); px('#3a2010', 5, 10, 6, 1); px('#fff', 5, 12, 6, 1); px('#6a2a2a', 5, 13, 6, 1); });
    face('lina', (px) => { px('#e0b090', 0, 0, 16, 16); px('#111', 0, 0, 16, 3); px('#111', 0, 3, 3, 13); px('#111', 13, 3, 3, 13); eyes(px, 6); px('#e09090', 3, 9, 2, 1); px('#e09090', 11, 9, 2, 1); px('#c02040', 6, 12, 4, 1); });
    face('mimi', (px) => { px('#f0c0a0', 0, 0, 16, 16); px('#111', 0, 0, 16, 5); px('#111', 0, 5, 2, 6); px('#111', 14, 5, 2, 6); px('#fff', 3, 7, 4, 3); px('#fff', 9, 7, 4, 3); px('#222', 4, 7, 2, 3); px('#222', 10, 7, 2, 3); px('#f09090', 2, 11, 2, 1); px('#f09090', 12, 11, 2, 1); px('#c02040', 7, 13, 2, 1); });
    face('reporter', (px) => { px('#d6a57a', 0, 0, 16, 16); px('#c08030', 0, 0, 16, 4); eyes(px, 6); px('#c02040', 5, 12, 6, 1); });
    face('fregues', (px) => { px('#c8906a', 0, 0, 16, 16); px('#666', 0, 0, 16, 2); eyes(px, 6); px('#3a2010', 6, 12, 4, 1); px('#999', 3, 4, 3, 1); px('#999', 10, 4, 3, 1); });
    face('farofeiro', (px) => { px('#a8a890', 0, 0, 16, 16); px('#5a5a40', 0, 0, 16, 2); px('#111', 3, 6, 3, 3); px('#111', 10, 6, 3, 3); px('#e8c070', 4, 7, 1, 1); px('#e8c070', 11, 7, 1, 1); px('#3a1a10', 4, 11, 8, 3); px('#e8e0c0', 5, 11, 1, 2); px('#e8e0c0', 9, 11, 1, 2); });
    face('meiAngry', (px) => { px('#d6a57a', 0, 0, 16, 16); px('#999', 0, 0, 16, 3); px('#999', 0, 3, 2, 4); px('#999', 14, 3, 2, 4); px('#111', 3, 5, 4, 1); px('#111', 9, 5, 4, 1); px('#ffd020', 4, 7, 2, 1); px('#ffd020', 10, 7, 2, 1); px('#a01010', 5, 12, 6, 1); });
  }

  // tipo → [tipo base do Ato II, roupa, extras]
  const CAST = {
    couve: ['capanga', { suit: 0x2a8a3a, pants: 0xf0f0f0, hair: 0x2a9a3a, face: 'couve' }],
    vinagrete: ['capanga', { suit: 0xd03020, pants: 0x2a8a2a, hair: 0x5a2a10, face: 'vinagrete' }],
    torresmo: ['capanga', { suit: 0xe0a050, pants: 0x6a3a1a, hair: 0xc08040, face: 'torresmo' }],
    kwanBurnt: ['kwan', { suit: 0x2a2a30, face: 'kwanBurnt' }],
    wellington: ['capanga', { suit: 0x2050c0, pants: 0x222222, hair: 0x1a3a8a, face: 'wellington' }],
    lina: ['mei', { suit: 0xf4f0ff, pants: 0xf4f0ff, hair: 0x111111, face: 'lina', apron: false, bun: false }],
    mimi: ['mei', { suit: 0xd02030, pants: 0xd02030, hair: 0x111111, face: 'mimi', apron: false, bun: false }],
    reporter: ['host', { suit: 0x2a4a8a, face: 'reporter', mic: true }],
    fregues: ['capanga', { suit: 0xd0c060, pants: 0x3a5a8a, hair: 0x666666, face: 'fregues' }],
    farofeiro: ['capanga', { suit: 0xe0d040, pants: 0x3a7ad0, hair: 0x5a5a40, face: 'farofeiro' }],
    meiAngry: ['mei', { face: 'meiAngry' }],
  };
  function person(kind, opts) {
    opts = opts || {};
    const c = CAST[kind];
    const p = c ? A2M.mkPerson(c[0], Object.assign({}, opts, { look: Object.assign({}, c[1], opts.look || {}) })) : A2M.mkPerson(kind, opts);
    // acessórios
    const { box, lam, basic } = K;
    if (kind === 'couve') { const b = box(0.42, 0.08, 0.42, lam({ color: 0xffd020 })); b.position.y = 0.3; p.head.add(b); }
    if (kind === 'vinagrete') { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 5, 4), lam({ color: 0x8a2a8a })); bun.position.set(0, 0.5, -0.1); p.head.add(bun); }
    if (kind === 'torresmo') { const belly = box(0.75, 0.6, 0.3, lam({ color: 0xe8b060 })); belly.position.set(0, 1.25, 0.12); p.root.add(belly); for (let i = 0; i < 4; i++) { const st = box(0.76, 0.05, 0.32, lam({ color: 0xc07030 })); st.position.set(0, 1.0 + i * 0.15, 0.12); p.root.add(st); } }
    if (kind === 'kwanBurnt') { const patch = box(0.2, 0.06, 0.02, basic({ color: 0x111111 })); patch.position.set(0.05, 0.25, 0.2); patch.rotation.z = 0.4; p.head.add(patch); }
    if (kind === 'wellington') { const helm = new THREE.Mesh(new THREE.SphereGeometry(0.25, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2), lam({ color: 0xd02020 })); helm.position.y = 0.32; p.head.add(helm); }
    if (kind === 'lina' || kind === 'mimi') { const hair = box(0.4, 0.5, 0.1, lam({ color: 0x111111 })); hair.position.set(0, 0.05, -0.22); p.head.add(hair); }
    if (kind === 'mimi') p.g.scale.setScalar(0.55 * (opts.scale || 1));
    if (kind === 'farofeiro') { const cooler = box(0.5, 0.35, 0.3, lam({ color: 0xf4f4f4 })); cooler.position.set(0, -0.75, 0.15); p.armL.add(cooler); const strap = box(0.04, 0.6, 0.04, lam({ color: 0x2050c0 })); strap.position.set(0, -0.45, 0.1); p.armL.add(strap); }
    return p;
  }
  function ghost(p, color) {
    p.mats.forEach((m) => { m.transparent = true; m.opacity = 0.45; m.depthWrite = false; m.emissive && m.emissive.setHex(color || 0x2040a0); });
    p.g.traverse((o) => { if (o.material && !Array.isArray(o.material)) { o.material.transparent = true; o.material.opacity = 0.45; } });
  }

  // ---------------------------------------------------------------
  // telas de capítulo
  // ---------------------------------------------------------------
  async function chapterCard(num, title, sub, memory) {
    const c = $('#a3Card');
    $('#a3Num').textContent = num;
    $('#a3Title').textContent = title;
    $('#a3Sub').textContent = sub || '';
    $('#a3Mem').classList.toggle('hidden', memory == null);
    if (memory != null) { $('#a3MemFill').style.width = memory + '%'; $('#a3MemVal').textContent = memory + '%'; }
    c.classList.remove('hidden', 'out');
    Sfx.gong();
    await UI.waitOrClick(4200);
    c.classList.add('out');
    await wait(600);
    c.classList.add('hidden');
  }
  function hint(t) { const h = $('#a3Hint'); h.textContent = t || ''; h.classList.toggle('hidden', !t); }

  function init() {
    if (ready) return;
    K = World.kit; UI = window.GameUI;
    if (!A2M.T.cloth) A2M.init();
    makeFaces();
    cineCam = new THREE.PerspectiveCamera(55, 16 / 9, 0.05, 800);
    bindInput();
    ready = true;
  }

  return {
    init, keys, pressed, endFrame, busy, tween, until, camAt, camMove, faceShot, talk, letterbox, setView, update, render,
    person, ghost, chapterCard, hint, wait, ease, rand, V,
    setActive: (v) => { active = v; if (!v) for (const k in keys) keys[k] = false; },
    get K() { return K; }, get UI() { return UI; }, get cam() { return cineCam; }, get dt() { return lastDt; },
  };
})();
