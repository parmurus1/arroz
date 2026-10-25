// =====================================================================
//  ARROZ DOURADO — ATO II: A VINGANÇA DO REI COBRA
//  FPS estilo DOOM na mansão do Rei Cobra + cutscenes + final
// =====================================================================

const Act2 = (() => {
  const D2 = DATA2;
  const TILE = 4, WH = 5;
  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const rand = (a, b) => a + Math.random() * (b - a);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  let K, UI;
  let built = false, isActive = false;
  let view = null;         // { scene, cam, update }
  let st = null;           // estado salvo do ato II
  let M = null;            // mansão (runtime)
  let mode = 'cine';       // 'cine' | 'fps' | 'dead'
  let fpsCam, cineCam;
  const tweens = [], waiters = [];
  let shakeAmt = 0;

  function tween(dur, fn) { return new Promise((res) => tweens.push({ t: 0, dur, fn, res })); }
  function until(pred) { return new Promise((res) => waiters.push({ pred, res })); }

  // ---------------------------------------------------------------
  // estado
  // ---------------------------------------------------------------
  function fresh() {
    return { stage: 'balsa1', keys: [], owned: 1, cur: 0, money: 300, ammo: 60, maxAmmo: 150, maxHp: 100, hp: 100, up: {}, speedMul: 1, dmgMul: 1, checkpoint: null, kills: 0, time: 0 };
  }
  function save() { const S = UI.S(); S.act2 = st; UI.save(); }

  // ---------------------------------------------------------------
  // entrada
  // ---------------------------------------------------------------
  const keys = {};
  let firing = false, locked = false, wantPause = false, shopOpen = false, lockEverWorked = false;
  function consumed() { return UI.busy() || performance.now() - UI.consumedAt() < 120; }
  function bindInput() {
    const canvas = $('#c');
    window.addEventListener('keydown', (e) => {
      if (!isActive) return;
      keys[e.code] = true;
      if (mode !== 'fps' || consumed()) return;
      if (e.code === 'Space') { e.preventDefault(); if (P.onGround) { P.vy = 8; P.onGround = false; Sfx.jump(); } }
      if (e.code === 'KeyF') activateKS();
      if (e.code === 'KeyB' || e.code === 'Tab') { e.preventDefault(); toggleShop(); }
      if (/^Digit[1-6]$/.test(e.code)) selectWeapon(+e.code.slice(5) - 1);
      if (e.code === 'KeyQ') cycleWeapon(-1);
      if (e.code === 'KeyE') cycleWeapon(1);
      if (window.__A2DEBUG && e.code === 'KeyK') { st.money += 9999; st.owned = D2.WEAPONS.length; st.ammo = st.maxAmmo; [1, 2, 3].forEach((k) => { if (!st.keys.includes(k)) st.keys.push(k); }); P.ks = 1; UI.toast('[debug] grana, armas, chaves e KS'); }
      if (window.__A2DEBUG && e.code === 'KeyL' && M && M.boss && M.boss.active) { M.boss.hp = 0; M.boss.active = false; M.boss.defeated = true; }
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    document.addEventListener('mousedown', (e) => {
      if (!isActive || mode !== 'fps' || shopOpen) return;
      if (e.target.closest && e.target.closest('#shop2, #pause2, #dialog')) return;
      if (consumed()) return;
      if (e.button === 2) { activateKS(); return; }
      if (e.button === 0) firing = true;
      if (!locked && canvas.requestPointerLock) {
        try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (err) { /* sem pointer lock: segue com o mouse normal */ }
      }
    });
    document.addEventListener('mouseup', (e) => { if (e.button === 0) firing = false; });
    document.addEventListener('contextmenu', (e) => { if (isActive) e.preventDefault(); });
    document.addEventListener('pointerlockchange', () => {
      const was = locked;
      locked = document.pointerLockElement === canvas;
      if (locked) lockEverWorked = true;
      if (was && !locked && mode === 'fps' && !shopOpen && !UI.busy()) { wantPause = true; $('#pause2').classList.remove('hidden'); }
      if (locked) { wantPause = false; $('#pause2').classList.add('hidden'); }
    });
    document.addEventListener('mousemove', (e) => {
      if (!isActive || mode !== 'fps' || shopOpen || wantPause) return;
      if (!locked && lockEverWorked) return;
      P.yaw -= (e.movementX || 0) * 0.0022;
      P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch - (e.movementY || 0) * 0.0022));
    });
    document.addEventListener('wheel', (e) => { if (isActive && mode === 'fps' && !shopOpen) cycleWeapon(e.deltaY > 0 ? 1 : -1); });
    $('#pause2').addEventListener('click', () => { wantPause = false; $('#pause2').classList.add('hidden'); try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (err) { /* ok */ } });
    $('#shop2Close').addEventListener('click', () => toggleShop(false));
    $('#shop2List').addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (b) buy(b.dataset.id); });
    document.addEventListener('mousedown', () => { if (mashOn) mashHit(); });
    $('#credits').addEventListener('click', () => UI.skip());
    $('#dead2').addEventListener('click', () => UI.skip());
    $('#btnAgain2').addEventListener('click', () => { UI.clearSave(); location.reload(); });
  }

  // ---------------------------------------------------------------
  // mapa
  // ---------------------------------------------------------------
  let grid = [], mapW = 0, mapH = 0;
  const solidCh = '#%&@';
  function tileAt(x, z) { const cx = Math.floor(x / TILE), cy = Math.floor(z / TILE); return (grid[cy] || [])[cx]; }
  function solidTile(cx, cy) {
    const c = (grid[cy] || [])[cx];
    if (c == null) return true;
    if (solidCh.includes(c)) return true;
    if (c === 'D') return !M.doorOpen;
    return false;
  }
  function solidAt(x, z) { return solidTile(Math.floor(x / TILE), Math.floor(z / TILE)); }
  function moveCircle(o, dx, dz, r) {
    let hit = false;
    const nx = o.x + dx;
    if (!solidAt(nx + Math.sign(dx) * r, o.z - r * 0.9) && !solidAt(nx + Math.sign(dx) * r, o.z + r * 0.9)) o.x = nx; else hit = true;
    const nz = o.z + dz;
    if (!solidAt(o.x - r * 0.9, nz + Math.sign(dz) * r) && !solidAt(o.x + r * 0.9, nz + Math.sign(dz) * r)) o.z = nz; else hit = true;
    return hit;
  }
  function los(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.6);
    for (let i = 1; i < n; i++) { const k = i / n; if (solidAt(ax + (bx - ax) * k, az + (bz - az) * k)) return false; }
    return true;
  }
  function zoneAt(x, z) {
    const cx = Math.floor(x / TILE), cy = Math.floor(z / TILE);
    return D2.ZONES.find((zn) => cx >= zn.x0 && cx <= zn.x1 && cy >= zn.y0 && cy <= zn.y1);
  }
  const W2 = (cx, cy) => ({ x: cx * TILE + TILE / 2, z: cy * TILE + TILE / 2 });

  // fluxo (BFS) pros inimigos acharem o caminho até você
  let flow = null, flowT = 0;
  function computeFlow() {
    flow = new Int16Array(mapW * mapH).fill(-1);
    const px = Math.floor(P.x / TILE), py = Math.floor(P.z / TILE);
    if (solidTile(px, py)) return;
    const q = [px + py * mapW]; flow[q[0]] = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % mapW, y = (i / mapW) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy, j = nx + ny * mapW;
        if (nx < 0 || ny < 0 || nx >= mapW || ny >= mapH || flow[j] >= 0 || solidTile(nx, ny)) return;
        flow[j] = flow[i] + 1; q.push(j);
      });
    }
  }

  // ---------------------------------------------------------------
  // texturas da mansão
  // ---------------------------------------------------------------
  function wallTex(kind) {
    return K.canvasTex(32, 32, (g, w, h) => {
      const r = K.rng(kind.charCodeAt(0) * 7);
      const px = (c, x, y, ww, hh) => { g.fillStyle = c; g.fillRect(x, y, ww || 1, hh || 1); };
      if (kind === '#') {
        K.pixels(g, w, h, (x, y) => (y > 23 ? K.noisy([70, 36, 20], 16, r) : K.noisy([130, 18, 20], 18, r)));
        for (let y = 2; y < 22; y += 8) for (let x = (y % 16 === 2 ? 0 : 4); x < 32; x += 8) { px('#d8a030', x + 3, y, 2, 1); px('#d8a030', x + 2, y + 1, 4, 1); px('#d8a030', x + 3, y + 2, 2, 1); }
        px('#e0b040', 0, 22, 32, 1); px('#2a1208', 0, 31, 32, 1);
      } else if (kind === '%') {
        g.fillStyle = '#f0f0f4'; g.fillRect(0, 0, w, h);
        for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
          const ox = tx * 8, oy = ty * 8;
          g.strokeStyle = '#2050b0'; g.strokeRect(ox + 0.5, oy + 0.5, 7, 7);
          px('#2050b0', ox + 3, oy + 2, 2, 4); px('#2050b0', ox + 2, oy + 3, 4, 2); px('#f0c040', ox + 3, oy + 3, 2, 2);
        }
        px('#1a3a8a', 0, 26, 32, 6);
      } else if (kind === '&') {
        K.pixels(g, w, h, (x, y) => K.noisy(x % 8 === 0 ? [30, 18, 10] : [70, 42, 24], 14, r));
        px('#1f7a50', 4, 6, 24, 14); px('#2a9a6a', 6, 8, 20, 10); px('#e0b040', 15, 12, 2, 2);
      } else {
        K.pixels(g, w, h, (x, y) => K.noisy([24, 22, 26], 14, r));
        g.strokeStyle = '#c8a040'; g.beginPath(); g.moveTo(0, 10); g.lineTo(10, 16); g.lineTo(20, 8); g.lineTo(32, 18); g.stroke();
        px('#e0b040', 0, 0, 32, 2); px('#e0b040', 0, 30, 32, 2);
      }
    });
  }
  function floorTex() {
    const S = 16;
    return K.canvasTex(mapW * S, mapH * S, (g) => {
      const r = K.rng(3);
      for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) {
        const c = grid[y][x], ox = x * S, oy = y * S;
        const zn = (D2.ZONES.find((zz) => x >= zz.x0 && x <= zz.x1 && y >= zz.y0 && y <= zz.y1) || {}).name || '';
        const px = (col, a, b, w, h) => { g.fillStyle = col; g.fillRect(ox + a, oy + b, w, h); };
        if (c === '~') { px('#1a6aa0', 0, 0, S, S); for (let i = 0; i < 4; i++) px('#5ab0e0', Math.floor(r() * 12), Math.floor(r() * 14), 4, 1); continue; }
        if (zn.includes('TRONO')) { px('#141216', 0, 0, S, S); px('#c8a040', 0, 0, S, 1); px('#c8a040', 0, 0, 1, S); px('#3a2a10', 4, 4, 8, 8); }
        else if (zn.includes('COZINHA')) { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) px((i + j) % 2 ? '#111' : '#ddd', i * 4, j * 4, 4, 4); }
        else if (zn.includes('MAHJONG')) { px('#1f5a3a', 0, 0, S, S); for (let i = 0; i < 6; i++) px('#164a2e', Math.floor(r() * 15), Math.floor(r() * 15), 2, 1); }
        else if (zn.includes('HALL')) { px('#7a1010', 0, 0, S, S); px('#c8a040', 1, 1, 14, 1); px('#c8a040', 1, 14, 14, 1); px('#9a2020', 6, 6, 4, 4); }
        else if (zn.includes('PISCINA')) { px('#b8b0a0', 0, 0, S, S); px('#8a8478', 0, 0, S, 1); px('#8a8478', 0, 0, 1, S); }
        else if (zn.includes('ENTRADA')) { px('#6a6460', 0, 0, S, S); for (let i = 0; i < 5; i++) px('#5a5450', Math.floor(r() * 14), Math.floor(r() * 14), 3, 2); }
        else { for (let i = 0; i < 4; i++) px(i % 2 ? '#6a4020' : '#7a4a28', 0, i * 4, S, 4); px('#3a2010', 8, 0, 1, S); }
      }
    });
  }

  // ---------------------------------------------------------------
  // jogador
  // ---------------------------------------------------------------
  const P = { x: 0, z: 0, y: 0, vy: 0, yaw: 0, pitch: 0, onGround: true, cool: 0, ks: 0, ksT: 0, ksPerm: false, bob: 0, recoil: 0, hurtT: 0, faceT: 0, punchSide: 1 };
  let weaponView = null, weaponViewId = null;
  function setWeaponView(id) {
    if (weaponViewId === id) return;
    if (weaponView) fpsCam.remove(weaponView);
    weaponView = A2M.mkWeapon(id);
    weaponViewId = id;
    fpsCam.add(weaponView);
  }
  function curWeaponId() { return P.ksT > 0 || P.ksPerm ? 'fists' : D2.WEAPONS[st.cur].id; }
  function selectWeapon(i) { if (i < st.owned && i !== st.cur) { st.cur = i; Sfx.pickup(); if (P.ksT <= 0 && !P.ksPerm) setWeaponView(curWeaponId()); } }
  function cycleWeapon(d) { selectWeapon((st.cur + d + st.owned) % st.owned); }

  // ---------------------------------------------------------------
  // construção da mansão
  // ---------------------------------------------------------------
  function buildMansion() {
    grid = D2.MAP.map((r) => r.split(''));
    mapH = grid.length; mapW = grid[0].length;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070304);
    scene.fog = new THREE.Fog(0x0a0405, 10, 46);
    M = { scene, enemies: [], pickups: [], projs: [], fx: [], doorOpen: false, doorY: 0, boss: null, zone: '', lanterns: [] };

    // paredes (instanciadas por tipo)
    const geo = new THREE.BoxGeometry(TILE, WH, TILE, 2, 2, 2);
    for (const ch of solidCh) {
      const tiles = [];
      for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) {
        if (grid[y][x] !== ch) continue;
        const hidden = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => { const c = (grid[y + dy] || [])[x + dx]; return c == null || solidCh.includes(c); });
        if (!hidden) tiles.push([x, y]);
      }
      if (!tiles.length) continue;
      const mesh = new THREE.InstancedMesh(geo, K.lam({ map: wallTex(ch) }), tiles.length);
      const m = new THREE.Matrix4();
      tiles.forEach(([x, y], i) => { m.makeTranslation(x * TILE + TILE / 2, WH / 2, y * TILE + TILE / 2); mesh.setMatrixAt(i, m); });
      scene.add(mesh);
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(mapW * TILE, mapH * TILE, mapW, mapH), K.lam({ map: floorTex() }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(mapW * TILE / 2, 0, mapH * TILE / 2); scene.add(floor);
    const ceilTex = K.canvasTex(32, 32, (g, w, h) => { const r = K.rng(8); K.pixels(g, w, h, (x, y) => K.noisy(x % 16 < 2 || y % 16 < 2 ? [60, 30, 14] : [28, 12, 10], 8, r)); }, [mapW, mapH]);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(mapW * TILE, mapH * TILE, mapW / 2, mapH / 2), K.lam({ map: ceilTex }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(mapW * TILE / 2, WH, mapH * TILE / 2); scene.add(ceil);

    // luz
    scene.add(new THREE.AmbientLight(0x8a6050, 0.5));
    scene.add(new THREE.HemisphereLight(0xffc0a0, 0x200808, 0.3));
    [[15, 3, 0xffc060, 1.6], [4, 7, 0xd0e0ff, 1.2], [26, 7, 0x60ff90, 1.1], [15, 11, 0xff4020, 1.4], [15, 18, 0xffa060, 1.0], [15, 24, 0x60c0ff, 1.1], [4, 24, 0x60c0ff, 0.8], [26, 24, 0x60c0ff, 0.8], [15, 28, 0xffd0a0, 1.0]]
      .forEach(([x, y, c, i]) => { const l = new THREE.PointLight(c, i, 26, 1.4); const w = W2(x, y); l.position.set(w.x, WH - 0.8, w.z); scene.add(l); });
    M.playerLight = new THREE.PointLight(0xffe0c0, 0.7, 14, 1.5);
    M.boomLight = new THREE.PointLight(0xffa040, 0, 18, 1.5); scene.add(M.boomLight);

    // decoração
    for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) {
      const c = grid[y][x], w = W2(x, y), zn = (zoneAt(w.x, w.z) || {}).name || '';
      if (c === 'o') { const v = A2M.mkVase(); v.position.set(w.x, 0, w.z); scene.add(v); }
      if (!solidCh.includes(c) && c !== 'D' && (zn.includes('HALL') || zn.includes('CORREDOR') || (zn.includes('TRONO') && (x === 10 || x === 20))) && (x * 3 + y * 5) % 7 === 0) {
        const l = A2M.mkLantern(); l.position.set(w.x, WH - 1.3, w.z); scene.add(l); M.lanterns.push(l);
      }
      if (zn.includes('COZINHA') && c === '.' && (x + y * 3) % 9 === 0) {
        const pot = K.cyl(0.7, 0.6, 0.9, 8, K.lam({ map: K.TEX.metal, color: 0x9a9aa0 })); pot.position.set(w.x + 1, 0.45, w.z + 1); scene.add(pot);
        const fj = new THREE.Mesh(new THREE.CircleGeometry(0.65, 8), K.lam({ color: 0x2a1410 })); fj.rotation.x = -Math.PI / 2; fj.position.set(w.x + 1, 0.86, w.z + 1); scene.add(fj);
      }
      if (zn.includes('MAHJONG') && c === '.' && (x * 2 + y) % 7 === 0) {
        const t = K.box(1.6, 0.1, 1.6, K.lam({ color: 0x1f6a40 })); t.position.set(w.x, 0.9, w.z); scene.add(t);
        const leg = K.box(0.2, 0.85, 0.2, K.lam({ map: K.TEX.wood })); leg.position.set(w.x, 0.43, w.z); scene.add(leg);
        for (let i = 0; i < 6; i++) { const tile = K.box(0.12, 0.16, 0.08, K.lam({ color: 0xf0ead0 })); tile.position.set(w.x - 0.4 + i * 0.16, 1.03, w.z - 0.6); scene.add(tile); }
      }
    }

    // porta do trono
    const dTex = K.canvasTex(32, 32, (g) => {
      g.fillStyle = '#8a0a0a'; g.fillRect(0, 0, 32, 32);
      g.strokeStyle = '#e0b040'; g.lineWidth = 2; g.beginPath(); g.arc(16, 13, 8, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#2a9a5a'; g.beginPath(); g.arc(16, 13, 5, 0, Math.PI * 2); g.fill();
      ['#30c070', '#f0ead0', '#c07030'].forEach((c, i) => { g.fillStyle = c; g.fillRect(8 + i * 7, 25, 3, 4); });
    });
    for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) if (grid[y][x] === 'D') {
      const w = W2(x, y);
      M.door = K.box(TILE, WH, 0.8, K.lam({ map: dTex })); M.door.position.set(w.x, WH / 2, w.z); scene.add(M.door);
      M.doorPos = w; M.doorTile = { x, y };
    }

    // itens, inimigos, início
    for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) {
      const c = grid[y][x], w = W2(x, y);
      if (c === 'P') M.start = { x: w.x, z: w.z, yaw: 0 };
      if (c === 'B') M.bossSpawn = w;
      if ('123'.includes(c)) addPickup('key', w, +c);
      if (c === '+') addPickup('hp', w);
      if (c === 'r') addPickup('ammo', w);
      if (c === '$') addPickup('money', w);
      if ('gcn'.includes(c)) spawnEnemy(c, w.x, w.z);
    }
    fpsCam = new THREE.PerspectiveCamera(74, 16 / 9, 0.05, 120);
    fpsCam.add(M.playerLight);
    scene.add(fpsCam);
    // modelo do jogador pras cutscenes
    M.me = A2M.mkPerson('jinlong'); M.me.g.visible = false; scene.add(M.me.g);
  }

  function addPickup(type, w, id) {
    if (type === 'key' && st.keys.includes(id)) return;
    let mesh;
    if (type === 'key') mesh = A2M.mkKey(D2.KEYS[id].color);
    else if (type === 'hp') mesh = A2M.mkMarmita();
    else if (type === 'ammo') mesh = A2M.mkSack();
    else mesh = A2M.mkMoney();
    mesh.position.set(w.x, 0.7, w.z);
    M.scene.add(mesh);
    M.pickups.push({ type, id, x: w.x, z: w.z, mesh, taken: false, ph: Math.random() * 6 });
  }

  // ---------------------------------------------------------------
  // inimigos
  // ---------------------------------------------------------------
  function spawnEnemy(type, x, z) {
    const def = D2.ENEMIES[type];
    const model = A2M.mkPerson(def.look, { scale: def.scale || 1 });
    model.g.position.set(x, 0, z);
    M.scene.add(model.g);
    const e = { type, def, x, z, y: 0, hp: def.hp, model, state: 'idle', cd: rand(0.5, def.cd), t: Math.random() * 10, vx: 0, vy: 0, vz: 0, flashT: 0, strafe: Math.random() < 0.5 ? 1 : -1, dead: 0, scale: def.scale || 1 };
    M.enemies.push(e);
    return e;
  }
  function spawnAmbush(n) {
    const spots = [];
    for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) {
      if (solidTile(x, y) || grid[y][x] === 'D') continue;
      const w = W2(x, y), d = Math.hypot(w.x - P.x, w.z - P.z);
      const zn = zoneAt(w.x, w.z);
      if (zn && zn.name.includes('TRONO')) continue;
      if (d > 14 && d < 36 && !los(P.x, P.z, w.x, w.z)) spots.push(w);
    }
    for (let i = 0; i < n && spots.length; i++) {
      const w = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
      const e = spawnEnemy(['g', 'g', 'n', 'c', 'n'][i % 5], w.x, w.z);
      e.state = 'chase';
    }
  }

  function hurtEnemy(e, dmg, kind) {
    if (e.state === 'dead' || e.state === 'fly') return;
    e.hp -= dmg * st.dmgMul;
    e.flashT = 0.08; e.model.flash(0x991111);
    e.state = 'chase';
    if (e.hp <= 0) killEnemy(e, kind); else Sfx.enemyHurt();
  }
  function killEnemy(e, kind) {
    st.kills++;
    const money = Math.round(rand(e.def.drop[0], e.def.drop[1]) * (P.ksT > 0 ? 2 : 1));
    st.money += money;
    if (Math.random() < 0.5) st.ammo = Math.min(st.maxAmmo, st.ammo + 12);
    floatMsg(`+R$ ${money}`);
    if (P.ksT <= 0 && !P.ksPerm) {
      const was = P.ks;
      P.ks = Math.min(1, P.ks + e.def.ks / 100);
      if (was < 1 && P.ks >= 1) { UI.toast('👑 KING SIZE PRONTO! Aperte F (ou botão direito).', 'gold', 4000); Sfx.keyGet(); }
    }
    if (kind === 'punch') { e.state = 'fly'; Sfx.enemyDie(true); }
    else { e.state = 'dead'; e.dead = 0; Sfx.enemyDie(e.type === 'c'); }
  }

  function enemyShoot(e) {
    const s = e.def.shot;
    const ox = e.x, oz = e.z, oy = 1.4 * e.scale;
    const tx = P.x, tz = P.z, ty = P.y + 1.2;
    const d = Math.hypot(tx - ox, tz - oz);
    for (let i = 0; i < s.n; i++) {
      const ang = Math.atan2(tx - ox, tz - oz) + (s.n > 1 ? (i / (s.n - 1) - 0.5) * s.spread * 2 : 0) + rand(-0.03, 0.03);
      let vy = (ty - oy) / d * s.speed;
      let grav = 0;
      if (s.lob) { const t = d / s.speed; grav = 9; vy = (ty - oy + 0.5 * grav * t * t) / t; }
      spawnProj('bean', V(ox, oy, oz), V(Math.sin(ang) * s.speed, vy, Math.cos(ang) * s.speed), { owner: 'e', dmg: s.dmg, grav });
    }
  }

  function updateEnemies(dt) {
    flowT -= dt;
    if (flowT <= 0) { flowT = 0.4; computeFlow(); }
    for (let i = M.enemies.length - 1; i >= 0; i--) {
      const e = M.enemies[i];
      e.t += dt;
      if (e.flashT > 0) { e.flashT -= dt; if (e.flashT <= 0) e.model.flash(0); }
      if (e.state === 'dead') {
        e.dead += dt;
        const k = Math.min(1, e.dead / 0.35);
        e.model.root.rotation.x = -k * Math.PI / 2;
        e.model.root.position.y = 0.25 * k;
        continue;
      }
      if (e.state === 'fly') {
        e.vy -= 26 * dt;
        const hit = moveCircle(e, e.vx * dt, e.vz * dt, 0.4);
        e.y += e.vy * dt;
        e.model.g.rotation.x += dt * 14; e.model.g.rotation.z += dt * 9;
        e.model.g.position.set(e.x, e.y, e.z);
        if (hit || (e.y <= 0 && e.vy < 0)) {
          explosion(V(e.x, Math.max(0.5, e.y), e.z), 4, 60, 'p');
          M.scene.remove(e.model.g); M.enemies.splice(i, 1);
        }
        continue;
      }
      const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz);
      if (d > 50) continue;
      const see = d < 30 && los(e.x, e.z, P.x, P.z);
      if (e.state === 'idle') { if (see && d < 24) { e.state = 'chase'; e.cd = Math.max(e.cd, 1.1); } else { e.model.walk(0, 0); continue; } }
      const face = Math.atan2(dx, dz);
      e.model.g.rotation.y = face;
      let mx = 0, mz = 0;
      const melee = !!e.def.melee;
      if (melee) {
        if (d > e.def.range * 0.8) { const dir = pathDir(e, see, d); mx = dir.x; mz = dir.z; }
      } else if (!see || d > 9) { const dir = pathDir(e, see, d); mx = dir.x; mz = dir.z; }
      else if (d < 5) { mx = -dx / d; mz = -dz / d; }
      else { mx = Math.cos(face) * e.strafe * 0.6; mz = -Math.sin(face) * e.strafe * 0.6; if (Math.random() < dt * 0.4) e.strafe *= -1; }
      for (const o of M.enemies) { if (o === e || o.state === 'dead') continue; const ox = e.x - o.x, oz = e.z - o.z, od = Math.hypot(ox, oz); if (od < 1.1 && od > 0.001) { mx += ox / od * 0.8; mz += oz / od * 0.8; } }
      const sp = e.def.speed;
      moveCircle(e, mx * sp * dt, mz * sp * dt, 0.45);
      e.model.g.position.set(e.x, 0, e.z);
      e.model.walk(e.t * sp * 2.2, mx || mz ? 0.6 : 0);
      e.cd -= dt;
      if (e.cd <= 0 && see) {
        if (melee && d < e.def.range) { e.cd = e.def.cd; hurtPlayer(e.def.melee); e.model.armR.rotation.x = -2; }
        else if (!melee && d < e.def.range) { e.cd = e.def.cd * rand(0.8, 1.2); enemyShoot(e); e.model.armR.rotation.x = -1.5; }
      }
    }
  }
  function pathDir(e, see, d) {
    if (see && d < 14) { const dx = P.x - e.x, dz = P.z - e.z; return { x: dx / d, z: dz / d }; }
    const cx = Math.floor(e.x / TILE), cy = Math.floor(e.z / TILE);
    if (!flow) return { x: 0, z: 0 };
    let best = flow[cx + cy * mapW], bx = cx, by = cy;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ox, oy]) => {
      const v = flow[(cx + ox) + (cy + oy) * mapW];
      if (v >= 0 && (best < 0 || v < best)) { best = v; bx = cx + ox; by = cy + oy; }
    });
    const w = W2(bx, by), tx = w.x - e.x, tz = w.z - e.z, td = Math.hypot(tx, tz) || 1;
    return { x: tx / td, z: tz / td };
  }

  // ---------------------------------------------------------------
  // projéteis & explosões
  // ---------------------------------------------------------------
  const projGeo = {};
  function projMesh(kind) {
    if (!projGeo.rice) {
      projGeo.rice = new THREE.OctahedronGeometry(0.05, 0); projGeo.rice.scale(1.7, 0.6, 0.6);
      projGeo.bean = new THREE.SphereGeometry(0.1, 5, 4); projGeo.bean.scale(1.4, 0.8, 0.8);
      projGeo.big = new THREE.SphereGeometry(0.3, 6, 5); projGeo.big.scale(1.4, 0.85, 0.85);
      projGeo.ball = new THREE.SphereGeometry(0.16, 6, 5);
    }
    const mat = { rice: 0xf8f2e0, bean: 0x6a3a1a, black: 0x221418, big: 0x8a4a20, ball: 0xe8d8a0 }[kind];
    return new THREE.Mesh(projGeo[kind === 'black' ? 'bean' : kind], K.basic({ color: mat }));
  }
  function spawnProj(kind, pos, vel, o) {
    let p = M.projs.find((q) => !q.alive && q.kind === kind);
    if (!p) { p = { kind, m: projMesh(kind) }; M.scene.add(p.m); M.projs.push(p); }
    p.alive = true; p.m.visible = true;
    p.pos = pos; p.vel = vel; p.owner = o.owner; p.dmg = o.dmg; p.grav = o.grav || 0; p.explode = o.explode || null; p.life = o.life || 3; p.r = o.r || 0.1;
    p.m.position.copy(pos);
    return p;
  }
  const tmpA = new THREE.Vector3();
  function updateProjs(dt) {
    for (const p of M.projs) {
      if (!p.alive) continue;
      p.life -= dt;
      const steps = Math.max(1, Math.ceil(p.vel.length() * dt / 0.45));
      const h = dt / steps;
      let dead = false;
      for (let s = 0; s < steps && !dead; s++) {
        p.vel.y -= p.grav * h;
        p.pos.addScaledVector(p.vel, h);
        if (p.life <= 0 || p.pos.y < 0.03 || p.pos.y > WH || solidAt(p.pos.x, p.pos.z)) { dead = true; break; }
        if (p.owner === 'p') {
          for (const e of M.enemies) {
            if (e.state === 'dead' || e.state === 'fly') continue;
            if (Math.hypot(p.pos.x - e.x, p.pos.z - e.z) < 0.55 * e.scale + p.r && p.pos.y < 2.2 * e.scale) { hurtEnemy(e, p.dmg, 'shot'); dead = true; break; }
          }
          const b = M.boss;
          if (!dead && b && b.active && Math.hypot(p.pos.x - b.x, p.pos.z - b.z) < 0.9 + p.r && p.pos.y < b.y + 2.8) { hurtBoss(p.dmg, false); dead = true; }
        } else if (Math.hypot(p.pos.x - P.x, p.pos.z - P.z) < 0.5 + p.r && p.pos.y > P.y - 0.2 && p.pos.y < P.y + 2) { hurtPlayer(p.dmg); dead = true; }
      }
      p.m.position.copy(p.pos);
      p.m.rotation.x += dt * 12; p.m.rotation.y += dt * 9;
      if (dead) {
        p.alive = false; p.m.visible = false;
        if (p.explode) explosion(p.pos.clone(), p.explode.r, p.explode.dmg, p.owner);
        else if (Math.random() < 0.25) A2M.firework(M.scene, p.pos, [p.owner === 'p' ? 0xffffff : 0x8a5a2a], 6, 2);
      }
    }
  }
  function explosion(pos, r, dmg, owner) {
    Sfx.boom(r > 3 ? 1 : 0.5);
    A2M.firework(M.scene, pos, [0xffd040, 0xff7020, 0xff3010, 0xffffff], r > 3 ? 70 : 25, r > 3 ? 9 : 5);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    ball.position.copy(pos); M.scene.add(ball);
    M.fx.push({ m: ball, t: 0, dur: 0.35, r });
    M.boomLight.position.copy(pos); M.boomLight.intensity = 3;
    const pd = Math.hypot(pos.x - P.x, pos.z - P.z);
    if (pd < 12) shakeAmt = Math.max(shakeAmt, (1 - pd / 12) * (r > 3 ? 1 : 0.4));
    if (owner === 'p') {
      for (const e of M.enemies) {
        if (e.state === 'dead' || e.state === 'fly') continue;
        const d = Math.hypot(e.x - pos.x, e.z - pos.z);
        if (d < r) hurtEnemy(e, dmg * (1 - d / r * 0.6), 'boom');
      }
      if (M.boss && M.boss.active && Math.hypot(M.boss.x - pos.x, M.boss.z - pos.z) < r) hurtBoss(dmg * 0.5, false);
    } else if (pd < r) hurtPlayer(dmg * (1 - pd / r * 0.6));
  }

  // ---------------------------------------------------------------
  // armas
  // ---------------------------------------------------------------
  let emptyMsgT = 0;
  const tmpDir = new THREE.Vector3();
  function tryFire(dt) {
    P.cool -= dt;
    const wid = curWeaponId();
    Sfx.whistle(wid === 'panela' && firing && st.ammo >= 0.5);
    if (!firing || P.cool > 0) return;
    if (wid === 'fists') return punch();
    const w = D2.WEAPONS[st.cur];
    if (w.ammo > 0 && st.ammo < w.ammo) {
      emptyMsgT -= dt;
      if (emptyMsgT <= 0) { UI.toast('SEM ARROZ! Ache sacos de arroz ou compre munição (B).', 'warn', 2500); emptyMsgT = 3; }
      selectWeapon(1 < st.owned ? 1 : 0);
      return;
    }
    st.ammo -= w.ammo;
    P.cool = 1 / w.rate;
    P.recoil = 1;
    Sfx.shoot(w.id);
    fpsCam.updateMatrixWorld();
    const muzzle = weaponView.userData.muzzle.getWorldPosition(new THREE.Vector3());
    fpsCam.getWorldDirection(tmpDir);
    const aim = fpsCam.position.clone().addScaledVector(tmpDir, 30);
    for (let i = 0; i < w.pellets; i++) {
      const d = aim.clone().sub(muzzle).normalize();
      d.x += rand(-w.spread, w.spread); d.y += rand(-w.spread, w.spread) * 0.7; d.z += rand(-w.spread, w.spread);
      d.normalize();
      spawnProj(w.id === 'bazuca' ? 'ball' : 'rice', muzzle.clone(), d.multiplyScalar(w.speed * rand(0.92, 1.05)), { owner: 'p', dmg: w.dmg, grav: w.grav || 0, explode: w.explode, r: w.id === 'bazuca' ? 0.2 : 0.12 });
    }
    M.boomLight.position.copy(muzzle); M.boomLight.intensity = Math.max(M.boomLight.intensity, 0.8);
  }

  function punch() {
    P.cool = 0.3;
    P.recoil = 1;
    P.punchSide *= -1;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    let hit = false;
    for (const e of M.enemies) {
      if (e.state === 'dead' || e.state === 'fly') continue;
      const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
      if (d < 3.4 && (dx * fx + dz * fz) / (d || 1) > 0.55) {
        e.vx = fx * 24 + dx / (d || 1) * 4; e.vz = fz * 24 + dz / (d || 1) * 4; e.vy = 9; e.y = 0.2;
        hurtEnemy(e, 999, 'punch');
        hit = true;
      }
    }
    const b = M.boss;
    if (b && b.active) {
      const dx = b.x - P.x, dz = b.z - P.z, d = Math.hypot(dx, dz);
      if (d < 3.8 && (dx * fx + dz * fz) / (d || 1) > 0.45) {
        b.kx = fx * (b.phase === 2 ? 22 : 12); b.kz = fz * (b.phase === 2 ? 22 : 12); b.knock = 0.45;
        hurtBoss(b.phase === 2 ? 70 : 90, true);
        hit = true;
      }
    }
    Sfx.shoot(hit ? 'punch' : 'whiff');
    if (hit) { shakeAmt = Math.max(shakeAmt, 0.5); World.flash(0.15); setTimeout(() => World.flash(0), 60); }
  }

  function activateKS() {
    if (mode !== 'fps' || P.ksPerm || P.ksT > 0) return;
    if (P.ks < 1) { UI.toast(`A raiva ainda não encheu (${Math.round(P.ks * 100)}%). Derrube mais capangas.`, '', 2000); return; }
    P.ks = 0; P.ksT = 12;
    Sfx.ksOn();
    World.flash(0.7); setTimeout(() => World.flash(0), 120);
    shakeAmt = 1;
    bigText('金', 'MODO KING SIZE', 1600);
    setWeaponView('fists');
    $('#ksAura').classList.add('on');
  }

  // ---------------------------------------------------------------
  // dano no jogador
  // ---------------------------------------------------------------
  function hurtPlayer(dmg) {
    if (mode !== 'fps') return;
    if (P.ksT > 0 || P.ksPerm) dmg *= P.ksPerm ? 0.6 : 0.25;
    st.hp -= dmg;
    P.hurtT = 0.25; P.faceT = 0.5;
    Sfx.hurt();
    const f = $('#hurtFlash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    if (st.hp <= 0) die();
  }
  async function die() {
    st.hp = 0; mode = 'dead'; firing = false; Sfx.whistle(false);
    $('#dead2').classList.remove('hidden');
    Sfx.enemyDie(true);
    await wait(2200);
    await UI.waitOrClick(6000);
    $('#dead2').classList.add('hidden');
    respawn();
    mode = 'fps';
  }
  function respawn() {
    st.hp = st.maxHp;
    const cp = st.checkpoint || M.start;
    P.x = cp.x; P.z = cp.z; P.yaw = cp.yaw || 0; P.pitch = 0; P.y = 0; P.vy = 0;
    M.projs.forEach((p) => { p.alive = false; p.m.visible = false; });
    if (M.boss && M.boss.active) resetBoss();
    if (P.ksPerm) st.hp = st.maxHp = 220;
  }
  function checkpoint() { st.checkpoint = { x: P.x, z: P.z, yaw: P.yaw }; save(); }

  // ---------------------------------------------------------------
  // loja (Zap do Tio Kwan)
  // ---------------------------------------------------------------
  function toggleShop(force) {
    shopOpen = force == null ? !shopOpen : force;
    $('#shop2').classList.toggle('hidden', !shopOpen);
    firing = false;
    if (shopOpen) { if (document.exitPointerLock) document.exitPointerLock(); renderShop(); Sfx.whatsapp(); }
    else if (mode === 'fps') { try { const p = $('#c').requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ok */ } }
  }
  function renderShop() {
    let html = `<div class="s2-money">Grana: <b>R$ ${st.money}</b> · Munição: ${Math.floor(st.ammo)}/${st.maxAmmo}</div><div class="s2-cat">🔫 ARMAS DE ARROZ</div>`;
    D2.WEAPONS.forEach((w, i) => {
      if (i === 0) return;
      const owned = i < st.owned, next = i === st.owned;
      if (!owned && !next) { html += `<button class="s2-item locked" disabled><b>??? ??? ???</b><small>Compre a arma anterior primeiro.</small></button>`; return; }
      html += `<button class="s2-item ${owned ? 'owned' : ''} ${!owned && st.money < w.cost ? 'poor' : ''}" data-id="w${i}" ${owned ? 'disabled' : ''}><b>${i + 1}. ${w.name}</b><small>${w.desc}</small><span>${owned ? 'COMPRADA ✓' : 'R$ ' + w.cost}</span></button>`;
    });
    html += '<div class="s2-cat">🛵 OUTRAS ENTREGAS</div>';
    D2.SHOP.forEach((it) => {
      const done = !it.repeat && st.up[it.id];
      html += `<button class="s2-item ${done ? 'owned' : ''} ${!done && st.money < it.cost ? 'poor' : ''}" data-id="${it.id}" ${done ? 'disabled' : ''}><b>${it.name}</b><small>${it.desc}</small><span>${done ? 'COMPRADO ✓' : 'R$ ' + it.cost}</span></button>`;
    });
    $('#shop2List').innerHTML = html;
  }
  function buy(id) {
    let cost, apply;
    if (id[0] === 'w') {
      const i = +id.slice(1), w = D2.WEAPONS[i];
      if (i !== st.owned) return;
      cost = w.cost; apply = () => { st.owned = i + 1; st.cur = i; st.ammo = Math.max(st.ammo, Math.min(st.maxAmmo, 80)); if (P.ksT <= 0 && !P.ksPerm) setWeaponView(curWeaponId()); UI.toast(`🛵 Motoboy entregou: ${w.name}`, 'gold', 3000); };
    } else {
      const it = D2.SHOP.find((x) => x.id === id);
      if (!it || (!it.repeat && st.up[id])) return;
      cost = it.cost;
      apply = () => {
        st.up[id] = (st.up[id] || 0) + 1;
        if (id === 'marmita') st.hp = Math.min(st.maxHp, st.hp + 50);
        if (id === 'municao') st.ammo = Math.min(st.maxAmmo, st.ammo + 100);
        if (id === 'saco') { st.maxAmmo += 150; st.ammo = st.maxAmmo; }
        if (id === 'havaianas') st.speedMul = 1.2;
        if (id === 'colete') { st.maxHp += 50; st.hp += 50; }
        if (id === 'tempero') st.dmgMul = 1.3;
      };
    }
    if (st.money < cost) { Sfx.error(); return; }
    st.money -= cost; apply(); Sfx.buy(); renderShop(); save();
  }

  // ---------------------------------------------------------------
  // HUD do ato II (barra de status estilo DOOM)
  // ---------------------------------------------------------------
  let hudT = 0, faceKey = '';
  function renderHud2(dt) {
    hudT -= dt;
    if (hudT > 0) return;
    hudT = 0.08;
    const w = D2.WEAPONS[st.cur];
    $('#hpVal').textContent = Math.max(0, Math.ceil(st.hp)) + '%';
    $('#hpVal').classList.toggle('low', st.hp < 30);
    const ks = P.ksT > 0 || P.ksPerm;
    $('#wName').textContent = ks ? 'PUNHOS DE OURO' : w.name;
    $('#ammoVal').textContent = ks ? '∞' : w.ammo ? Math.floor(st.ammo) : '∞';
    $('#ksFill').style.width = (ks ? (P.ksPerm ? 100 : P.ksT / 12 * 100) : P.ks * 100) + '%';
    $('#ksFill').classList.toggle('full', P.ks >= 1 || ks);
    $('#ksHint').textContent = P.ksPerm ? 'PERMANENTE' : ks ? 'ATIVO!' : P.ks >= 1 ? 'APERTE F' : Math.round(P.ks * 100) + '%';
    $('#moneyVal').textContent = 'R$ ' + st.money;
    [1, 2, 3].forEach((k) => $('#key' + k).classList.toggle('got', st.keys.includes(k)));
    const b = M.boss;
    $('#bossBar').classList.toggle('hidden', !(b && b.active));
    if (b && b.active) { $('#bossName').textContent = b.name; $('#bossFill').style.width = Math.max(0, b.hp / b.max * 100) + '%'; }
    const fk = (ks ? 'k' : '') + (P.faceT > 0 ? 'o' : '') + (st.hp < 30 ? 2 : st.hp < 60 ? 1 : 0);
    if (fk !== faceKey) { faceKey = fk; drawFace(ks, P.faceT > 0, st.hp); }
  }
  function drawFace(ks, ouch, hp) {
    const g = $('#face').getContext('2d');
    const px = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
    px(ks ? '#3a2a00' : '#1a1010', 0, 0, 32, 32);
    if (ks) { g.fillStyle = 'rgba(255,200,40,0.5)'; g.beginPath(); g.arc(16, 17, 15, 0, 7); g.fill(); }
    px('#d6a57a', 8, 6, 16, 20); px('#111', 7, 3, 18, 6); px('#111', 7, 9, 2, 6); px('#111', 23, 9, 2, 6);
    if (ouch) { px('#111', 10, 13, 4, 1); px('#111', 18, 13, 4, 1); }
    else { px('#fff', 10, 12, 4, 3); px('#fff', 18, 12, 4, 3); px(ks ? '#ffd020' : '#222', 11, 12, 2, 3); px(ks ? '#ffd020' : '#222', 19, 12, 2, 3); }
    px('#b07050', 15, 16, 2, 3);
    if (ouch) { px('#5a1010', 13, 21, 6, 3); } else if (ks) { px('#fff', 12, 21, 8, 2); } else px('#6a2a2a', 12, 22, 8, 1);
    if (hp < 60) { px('#8a3040', 9, 17, 3, 3); }
    if (hp < 30) { px('#b01010', 20, 6, 2, 8); px('#b01010', 12, 24, 2, 4); }
    for (let i = 0; i < 10; i++) px('#8a6a5a', 10 + (i * 7) % 12, 20 + (i % 3), 1, 1);
  }
  function floatMsg(t) {
    const el = document.createElement('div'); el.className = 'float'; el.textContent = t;
    el.style.left = (window.innerWidth / 2 + rand(-40, 40)) + 'px'; el.style.top = (window.innerHeight / 2 - 30) + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 950);
  }
  function bigText(cn, pt, ms) {
    $('#btCn').textContent = cn; $('#btPt').textContent = pt;
    const b = $('#bigText'); b.classList.remove('hidden');
    clearTimeout(bigText.t); bigText.t = setTimeout(() => b.classList.add('hidden'), ms || 2000);
  }
  function showZone(name) {
    const z = $('#zoneName'); z.textContent = name; z.classList.remove('show'); void z.offsetWidth; z.classList.add('show');
  }

  // ---------------------------------------------------------------
  // update do FPS
  // ---------------------------------------------------------------
  const tmpV = new THREE.Vector3();
  let doorMsgT = 0;
  function updateFPS(dt) {
    if (wantPause || shopOpen) return;
    const busy = UI.busy();
    st.time += dt;
    const ks = P.ksT > 0 || P.ksPerm;
    // olhar pelo teclado (quando não tem pointer lock)
    if (keys.ArrowLeft) P.yaw += dt * 2.4;
    if (keys.ArrowRight) P.yaw -= dt * 2.4;
    if (keys.ArrowUp && !keys.KeyW) P.pitch = Math.min(1.2, P.pitch + dt * 1.5);
    if (keys.ArrowDown && !keys.KeyS) P.pitch = Math.max(-1.2, P.pitch - dt * 1.5);
    // movimento
    let f = 0, s = 0;
    if (!busy) {
      if (keys.KeyW) f += 1; if (keys.KeyS) f -= 1; if (keys.KeyD) s += 1; if (keys.KeyA) s -= 1;
    }
    const len = Math.hypot(f, s) || 1;
    const sp = 7.5 * st.speedMul * (ks ? 1.35 : 1) * (keys.ShiftLeft ? 1.25 : 1);
    const mx = (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) / len * sp * dt;
    const mz = (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) / len * sp * dt;
    moveCircle(P, mx, mz, 0.45);
    P.vy -= 24 * dt; P.y += P.vy * dt;
    if (P.y <= 0) { P.y = 0; P.vy = 0; P.onGround = true; }
    if (f || s) P.bob += dt * 11;
    fpsCam.position.set(P.x, P.y + 1.7 + Math.sin(P.bob) * 0.05, P.z);
    fpsCam.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
    if (shakeAmt > 0) { fpsCam.rotation.x += rand(-1, 1) * shakeAmt * 0.04; fpsCam.rotation.y += rand(-1, 1) * shakeAmt * 0.04; shakeAmt = Math.max(0, shakeAmt - dt * 2.5); }

    // arma
    if (!busy) tryFire(dt); else Sfx.whistle(false);
    P.recoil = Math.max(0, P.recoil - dt * 8);
    if (weaponView) {
      weaponView.position.set(Math.sin(P.bob * 0.5) * 0.015, Math.abs(Math.cos(P.bob * 0.5)) * 0.015 - P.recoil * 0.03, P.recoil * 0.08);
      weaponView.rotation.x = P.recoil * 0.15;
      const u = weaponView.userData;
      if (u.spin) u.spin.rotation.z += dt * (firing ? 30 : 2);
      if (u.valve) u.valve.rotation.y += dt * (firing ? 25 : 1);
      if (u.ball) u.ball.visible = P.cool <= 0.2;
      if (u.L) { const k = P.recoil; u.R.position.z = -0.5 - (P.punchSide > 0 ? k * 0.35 : 0); u.L.position.z = -0.5 - (P.punchSide < 0 ? k * 0.35 : 0); }
      if (u.steam) {
        const a = u.steam.geometry.attributes.position.array;
        for (let i = 0; i < a.length; i += 3) { a[i + 1] += dt * 0.4; if (a[i + 1] > 0.15 || Math.random() < dt * (firing ? 6 : 0.5)) { a[i] = 0.24 + rand(-0.01, 0.01); a[i + 1] = -0.06; a[i + 2] = -0.62 + rand(-0.01, 0.01); } }
        u.steam.geometry.attributes.position.needsUpdate = true;
      }
    }
    // king size
    if (P.ksT > 0) {
      P.ksT -= dt;
      if (P.ksT <= 0) { P.ksT = 0; setWeaponView(curWeaponId()); $('#ksAura').classList.remove('on'); UI.toast('O ouro esfria. Por enquanto.', '', 2000); }
    }
    World.setTint(ks ? 1.18 : 1, ks ? 1.06 : 1, ks ? 0.7 : 1);
    P.hurtT -= dt; P.faceT -= dt;

    // itens
    for (const it of M.pickups) {
      if (it.taken) continue;
      it.ph += dt;
      it.mesh.position.y = 0.7 + Math.sin(it.ph * 2) * 0.12;
      it.mesh.rotation.y += dt * 1.5;
      if (Math.hypot(it.x - P.x, it.z - P.z) < 1.4) takePickup(it);
    }
    // porta do trono
    if (M.door) {
      const dd = Math.hypot(M.doorPos.x - P.x, M.doorPos.z + TILE / 2 - P.z);
      doorMsgT -= dt;
      if (!M.doorOpen && !M.doorLockedForever && dd < 5) {
        if (st.keys.length >= 3) { M.doorOpen = true; Sfx.door(); UI.toast('🔓 As três fechaduras giram. A porta do trono se abre.', 'gold', 4000); shakeAmt = 0.6; }
        else if (doorMsgT <= 0) { UI.toast(`🔒 ${D2.SCRIPT.doorLocked} (${st.keys.length}/3)`, 'warn', 3500); doorMsgT = 5; }
      }
      M.doorY += ((M.doorOpen ? WH - 0.3 : 0) - M.doorY) * Math.min(1, dt * 2);
      M.door.position.y = WH / 2 + M.doorY;
    }
    // zona
    const zn = zoneAt(P.x, P.z);
    if (zn && zn.name !== M.zone) { M.zone = zn.name; showZone(zn.name); }

    updateEnemies(dt);
    updateBoss(dt);
    updateProjs(dt);
    renderHud2(dt);
  }

  function takePickup(it) {
    if (it.type === 'hp') { if (st.hp >= st.maxHp) return; st.hp = Math.min(st.maxHp, st.hp + 35); UI.toast('🍱 Marmita da Dona Mei! +35 de vida', 'item', 2000); }
    if (it.type === 'ammo') { st.ammo = Math.min(st.maxAmmo, st.ammo + 60); UI.toast('🌾 Saco de arroz! +60 de munição', 'item', 2000); }
    if (it.type === 'money') { st.money += 400; UI.toast('💰 Maleta de dinheiro do Rei Cobra! +R$ 400', 'item', 2000); }
    it.taken = true; M.scene.remove(it.mesh);
    Sfx.pickup();
    if (it.type === 'key') {
      st.keys.push(it.id);
      Sfx.keyGet();
      bigText('钥匙', `${D2.KEYS[it.id].name} (${st.keys.length}/3)`, 2500);
      checkpoint();
      setTimeout(() => { if (mode === 'fps') { UI.toast('⚠ Os capangas ouviram! EMBOSCADA!', 'warn', 3000); spawnAmbush(st.keys.length === 3 ? 7 : 5); } }, 1200);
      if (st.keys.length === 3) setTimeout(() => UI.toast('As três chaves! Volte pro Hall das Serpentes: a porta do trono fica no norte.', 'gold', 6000), 4000);
    }
  }

  // ---------------------------------------------------------------
  // CHEFÕES
  // ---------------------------------------------------------------
  function makeBoss(phase) {
    if (M.boss && M.boss.model) M.scene.remove(M.boss.model.g);
    const model = A2M.mkPerson(phase === 1 ? 'cobra' : 'son', { scale: 1.35 });
    M.scene.add(model.g);
    const b = { phase, model, x: M.bossSpawn.x, z: M.bossSpawn.z, y: 0, vy: 0, hp: phase === 1 ? 2400 : 3400, max: phase === 1 ? 2400 : 3400, name: phase === 1 ? 'REI COBRA · 蛇王' : 'KING SIZE FALSO · 小豆', active: false, state: 'move', t: 0, timer: 2, kx: 0, kz: 0, knock: 0, stun: 0, summoned: 0, flashT: 0, ang: 0, wave: 0 };
    if (phase === 2) {
      const aura = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7a3aa0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
      aura.position.y = 1.4; model.g.add(aura); b.aura = aura;
      const l = new THREE.PointLight(0xa050ff, 1.5, 12, 1.5); l.position.y = 2; model.g.add(l);
      b.marks = [];
    }
    model.g.position.set(b.x, 0, b.z);
    M.boss = b;
    return b;
  }
  function resetBoss() {
    const b = M.boss;
    b.hp = b.max; b.x = M.bossSpawn.x; b.z = M.bossSpawn.z; b.y = 0; b.state = 'move'; b.timer = 2; b.summoned = 0; b.stun = 0;
    M.enemies.filter((e) => e.state !== 'dead').forEach((e) => { M.scene.remove(e.model.g); });
    M.enemies = M.enemies.filter((e) => e.state === 'dead');
  }
  function hurtBoss(dmg, punched) {
    const b = M.boss;
    if (!b || !b.active) return;
    let d = dmg * (punched ? 1 : st.dmgMul);
    if (b.stun > 0) d *= 1.5;
    b.hp -= d;
    b.flashT = 0.08; b.model.flash(0x991111);
    if (Math.random() < 0.3) Sfx.enemyHurt();
    if (b.hp <= 0) { b.hp = 0; b.active = false; b.defeated = true; }
  }
  function bossShootFan(n, spread, speed, kind, dmg) {
    const b = M.boss, a0 = Math.atan2(P.x - b.x, P.z - b.z);
    for (let i = 0; i < n; i++) {
      const a = a0 + (n > 1 ? (i / (n - 1) - 0.5) * spread * 2 : 0);
      spawnProj(kind, V(b.x, 1.8 + b.y, b.z), V(Math.sin(a) * speed, (P.y + 1.2 - 1.8 - b.y) / 12 * speed * 0.6, Math.cos(a) * speed), { owner: 'e', dmg, r: kind === 'big' ? 0.3 : 0.12 });
    }
  }
  function updateBoss(dt) {
    const b = M.boss;
    if (!b || !b.active) return;
    b.t += dt; b.timer -= dt;
    if (b.flashT > 0) { b.flashT -= dt; if (b.flashT <= 0) b.model.flash(0); }
    const dx = P.x - b.x, dz = P.z - b.z, d = Math.hypot(dx, dz) || 1;
    // empurrão do soco
    if (b.knock > 0) {
      b.knock -= dt;
      const hit = moveCircle(b, b.kx * dt, b.kz * dt, 0.8);
      if (hit && b.phase === 2 && b.stun <= 0) { b.stun = 1.6; hurtBoss(120, true); Sfx.boom(1); shakeAmt = 1; UI.toast('💥 BATEU NA PAREDE!', 'gold', 1200); A2M.firework(M.scene, V(b.x, 1.5, b.z), [0xffd040, 0x8a4a20], 40, 6); }
      b.model.g.position.set(b.x, b.y, b.z);
      return;
    }
    if (b.stun > 0) { b.stun -= dt; b.model.g.rotation.z = Math.sin(b.t * 20) * 0.1; b.model.walk(0, 0); return; }
    b.model.g.rotation.z = 0;
    b.model.g.rotation.y = Math.atan2(dx, dz);
    if (b.aura) { b.aura.scale.setScalar(1 + Math.sin(b.t * 8) * 0.12); }
    // invocar capangas (fase 1)
    if (b.phase === 1 && b.summoned < 2 && b.hp < b.max * (b.summoned === 0 ? 0.66 : 0.33)) {
      b.summoned++;
      Sfx.roar(); UI.toast('🐍 "CAPANGAS! AQUI!"', 'warn', 2000);
      [[10, 2], [20, 2], [10, 5], [20, 5]].slice(0, 3 + b.summoned - 1).forEach(([x, y], i) => { const w = W2(x, y); const e = spawnEnemy(i % 2 ? 'n' : 'g', w.x, w.z); e.state = 'chase'; });
    }
    const pick = (opts) => opts[Math.floor(Math.random() * opts.length)];
    if (b.state === 'move') {
      const sp = b.phase === 1 ? 4 : 7;
      const tx = Math.cos(b.t * 0.7) * dx / d - Math.sin(b.t * 0.7) * dz / d * 0.5;
      const keep = d > 9 ? 1 : d < 6 ? -1 : 0;
      moveCircle(b, (dx / d * keep + (-dz / d) * Math.sign(Math.sin(b.t * 0.5))) * sp * dt, (dz / d * keep + (dx / d) * Math.sign(Math.sin(b.t * 0.5))) * sp * dt, 0.8);
      b.model.walk(b.t * 8, 0.5 + tx * 0);
      if (b.timer <= 0) {
        b.state = b.phase === 1 ? pick(['spread', 'spread', 'spiral', 'dash']) : pick(['dash', 'ring', 'slam', 'rain', 'dash']);
        b.timer = { spread: 1.5, spiral: 3, dash: 1.2, ring: 1.6, slam: 2.2, rain: 1.5 }[b.state];
        b.sub = 0; b.ang = Math.atan2(dx, dz);
        if (b.state === 'dash') { Sfx.roar(); b.model.flash(0x664400); }
      }
    } else if (b.state === 'spread') {
      b.sub -= dt;
      if (b.sub <= 0) { b.sub = 0.45; bossShootFan(9, 0.55, 15, 'black', 7); b.model.armR.rotation.x = -1.6; Sfx.shoot('estilingue'); }
      if (b.timer <= 0) { b.state = 'move'; b.timer = rand(1.2, 2.2); }
    } else if (b.state === 'spiral') {
      b.sub -= dt;
      if (b.sub <= 0) {
        b.sub = 0.075; b.ang += 0.32;
        [0, Math.PI].forEach((o) => spawnProj('black', V(b.x, 1.6, b.z), V(Math.sin(b.ang + o) * 11, 0, Math.cos(b.ang + o) * 11), { owner: 'e', dmg: 6 }));
      }
      b.model.g.rotation.y = b.ang;
      if (b.timer <= 0) { b.state = 'move'; b.timer = rand(1.2, 2); }
    } else if (b.state === 'dash') {
      if (b.timer > 0.6) { b.model.g.position.x = b.x + rand(-0.05, 0.05); b.ang = Math.atan2(dx, dz); }
      else {
        b.model.flash(0);
        const sp = b.phase === 1 ? 18 : 26;
        moveCircle(b, Math.sin(b.ang) * sp * dt, Math.cos(b.ang) * sp * dt, 0.8);
        b.model.walk(b.t * 20, 1);
        if (d < 1.9 && !b.hitThisDash) { b.hitThisDash = true; hurtPlayer(b.phase === 1 ? 18 : 24); const kx = dx / d * 2.5, kz = dz / d * 2.5; moveCircle(P, kx, kz, 0.45); shakeAmt = 1; }
      }
      if (b.timer <= 0) { b.state = 'move'; b.timer = rand(1, 1.8); b.hitThisDash = false; }
    } else if (b.state === 'ring') {
      b.sub -= dt;
      if (b.sub <= 0 && b.wave < 2) {
        b.sub = 0.7; b.wave++;
        for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + b.wave * 0.14; spawnProj('big', V(b.x, 1.3, b.z), V(Math.sin(a) * 10, 0, Math.cos(a) * 10), { owner: 'e', dmg: 12, r: 0.3 }); }
        Sfx.roar();
      }
      if (b.timer <= 0) { b.state = 'move'; b.timer = rand(1, 1.6); b.wave = 0; }
    } else if (b.state === 'slam') {
      const k = 2.2 - b.timer;
      if (k < 0.7) { b.y = Math.sin(k / 0.7 * Math.PI / 2) * 4.5; const tx = P.x - b.x, tz = P.z - b.z; moveCircle(b, tx * dt * 1.2, tz * dt * 1.2, 0.8); }
      else if (b.y > 0) { b.y = Math.max(0, b.y - dt * 22); if (b.y === 0) { Sfx.boom(1.3); shakeAmt = 1.2; M.shock = { x: b.x, z: b.z, r: 0.5, hit: false }; UI.toast('⬆ PULA (ESPAÇO)!', 'warn', 900); } }
      b.model.g.position.y = b.y;
      if (b.timer <= 0) { b.state = 'move'; b.timer = rand(1, 1.6); b.y = 0; }
    } else if (b.state === 'rain') {
      b.sub -= dt;
      if (b.sub <= 0) {
        b.sub = 0.12;
        const x = P.x + rand(-6, 6), z = P.z + rand(-6, 6);
        if (!solidAt(x, z)) spawnProj('big', V(x, WH - 0.2, z), V(0, -4, 0), { owner: 'e', dmg: 10, grav: 14, r: 0.35 });
      }
      if (b.timer <= 0) { b.state = 'move'; b.timer = rand(1, 1.6); }
    }
    b.model.g.position.set(b.x + (b.state === 'dash' && b.timer > 0.6 ? rand(-0.05, 0.05) : 0), b.y, b.z);
    // onda de choque do pisão
    if (M.shock) {
      const s = M.shock;
      s.r += dt * 15;
      if (!s.mesh) { s.mesh = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({ color: 0xa060ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); s.mesh.rotation.x = -Math.PI / 2; s.mesh.position.set(s.x, 0.15, s.z); M.scene.add(s.mesh); }
      s.mesh.scale.setScalar(s.r);
      const pd = Math.hypot(P.x - s.x, P.z - s.z);
      if (!s.hit && Math.abs(pd - s.r) < 0.9 && P.y < 0.6) { s.hit = true; hurtPlayer(20); }
      if (s.r > 26) { M.scene.remove(s.mesh); M.shock = null; }
    }
  }

  // ---------------------------------------------------------------
  // câmera de cinema
  // ---------------------------------------------------------------
  function stopCamTweens() {
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].cam) { const t = tweens.splice(i, 1)[0]; t.res(); }
  }
  function camAt(pos, look) { stopCamTweens(); cineCam.position.copy(pos); cineCam.lookAt(look); }
  function camMove(from, to, lookFrom, lookTo, dur) {
    stopCamTweens();
    const lk = new THREE.Vector3();
    const p = tween(dur, (k) => { const e = ease(k); cineCam.position.lerpVectors(from, to, e); lk.lerpVectors(lookFrom, lookTo, e); cineCam.lookAt(lk); });
    tweens[tweens.length - 1].cam = true;
    return p;
  }
  // close no rosto de um personagem, onde quer que ele esteja
  function faceShot(p, dist, side) {
    const g = p.g, s = g.scale.x, ry = g.rotation.y;
    const head = V(g.position.x, g.position.y + (p.root.position.y + 2.15) * s, g.position.z);
    const cam = head.clone().add(V(Math.sin(ry) * dist + Math.cos(ry) * (side || 0.5), 0.2, Math.cos(ry) * dist - Math.sin(ry) * (side || 0.5)));
    camAt(cam, head);
  }
  function letterbox(on) { $('#letterbox').classList.toggle('on', on); }
  async function talk(lines, shot, cue) {
    for (let i = 0; i < lines.length; i++) {
      const [who, text, c] = lines[i];
      if (c && cue) await cue(c);
      if (shot) shot(who, i);
      await UI.dialog([[who, text]]);
    }
  }
  function setView(scene, cam, upd) { view = { scene, cam, update: upd || (() => {}) }; }
  function tvStatic(ms) {
    Sfx.tvStatic(ms / 1000);
    const t = $('#tvStatic'); t.classList.remove('hidden');
    return wait(ms).then(() => t.classList.add('hidden'));
  }

  // ---------------------------------------------------------------
  // CENAS
  // ---------------------------------------------------------------
  async function scBalsa1() {
    UI.setPhase('act2');
    const bay = A2M.buildBay('night');
    const kwan = A2M.mkPerson('kwan'); kwan.sit(); kwan.g.position.set(0.7, 0.8, -2); kwan.g.rotation.y = Math.PI; bay.boat.add(kwan.g);
    const me = A2M.mkPerson('jinlong'); me.sit(); me.g.position.set(-0.7, 0.8, -2); me.g.rotation.y = Math.PI; bay.boat.add(me.g);
    const sack = A2M.mkSack(); sack.position.set(1.6, 1.65, -2); sack.scale.setScalar(0.6); bay.boat.add(sack);
    const grain = A2M.mkGrain(0xffd040); grain.visible = false; grain.position.set(-0.75, 2.0, -2.6); bay.boat.add(grain);
    setView(bay.scene, cineCam, (dt) => { bay.update(dt); grain.rotation.y += dt * 3; });
    letterbox(true);
    Sfx.music('sea');
    camAt(V(18, 7, -30), V(0, 1, -4));
    await UI.fade(false);
    camMove(V(18, 7, -30), V(9, 4, -14), V(0, 1, -4), V(0, 1.8, -2), 7);
    const shots = {
      'TIO KWAN': () => camAt(V(-0.2, 2.6, -4.6), V(0.7, 2.3, -2)),
      'JINLONG': () => camAt(V(0.6, 2.6, -4.6), V(-0.7, 2.3, -2)),
    };
    await talk(D2.SCRIPT.balsa1, (who, i) => {
      if (i < 2) return;
      if (i === 12) { grain.visible = true; camAt(V(-0.4, 2.5, -3.6), V(-0.75, 2.0, -2.6)); return; }
      if (i === D2.SCRIPT.balsa1.length - 1) { camAt(V(6, 5, -26), V(0, 3, -60)); return; }
      (shots[who] || (() => camAt(V(4, 3.5, -8), V(0, 1.8, -2))))();
    });
    await UI.fade(true);
    letterbox(false);
  }

  async function enterMansion(fromSave) {
    if (!M) buildMansion();
    mode = 'fps';
    setView(M.scene, fpsCam, (dt) => {});
    const cp = st.checkpoint || M.start;
    P.x = cp.x; P.z = cp.z; P.yaw = cp.yaw || 0; P.pitch = 0; P.y = 0;
    st.hp = Math.max(st.hp, 1);
    setWeaponView(curWeaponId());
    $('#hud2').classList.remove('hidden');
    Sfx.music('metal');
    await UI.fade(false);
    if (!fromSave) {
      await UI.dialog(D2.SCRIPT.mansionIntro);
      UI.toast('WASD anda · MOUSE mira · CLIQUE taca arroz · ESPAÇO pula · Q/E ou 1-6 troca de arma', 'gold', 9000);
      setTimeout(() => UI.toast('B abre o Zap do Tio Kwan (loja) · F ativa o KING SIZE quando a barra encher', 'gold', 9000), 2500);
      setTimeout(() => UI.toast('Clique na tela pra travar o mouse. Ache as 3 chaves!', '', 7000), 5000);
      checkpoint();
    }
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) UI.toast('O Ato II precisa de teclado e mouse.', 'warn', 8000);
    // espera entrar na sala do trono
    await until(() => mode === 'fps' && P.z < 6 * TILE && P.x > 9 * TILE && P.x < 22 * TILE);
  }

  async function boss1() {
    st.stage = 'boss1';
    // fecha a porta atrás de você
    M.doorOpen = false; M.doorLockedForever = true;
    M.enemies.filter((e) => e.state !== 'dead').forEach((e) => { const zn = zoneAt(e.x, e.z); if (!zn || !zn.name.includes('TRONO')) { e.state = 'idle'; } });
    if (!st.checkpoint || st.checkpoint.z > 6 * TILE) { st.checkpoint = { x: M.doorPos.x, z: M.doorPos.z - TILE * 1.2, yaw: 0 }; }
    save();
    firing = false; Sfx.whistle(false);
    makeBoss(1);
    Sfx.door();
    Sfx.music(null);
    await UI.dialog(D2.SCRIPT.boss1Intro);
    Sfx.roar();
    Sfx.music('boss');
    M.boss.active = true;
    await until(() => M.boss.defeated);
    Sfx.music(null);
    st.stage = 'post1'; save();
  }

  function cineMansionSetup(sonKind) {
    mode = 'cine'; firing = false; Sfx.whistle(false);
    $('#hud2').classList.add('hidden'); $('#ksAura').classList.remove('on'); World.setTint(1, 1, 1);
    if (document.exitPointerLock) document.exitPointerLock();
    M.projs.forEach((p) => { p.alive = false; p.m.visible = false; });
    M.enemies.filter((e) => e.state !== 'dead').forEach((e) => M.scene.remove(e.model.g));
    M.enemies = M.enemies.filter((e) => e.state === 'dead');
    const c = M.bossSpawn;
    if (!M.boss || !M.boss.model) makeBoss(sonKind === 'cobra' ? 1 : 2);
    const b = M.boss; b.active = false;
    b.x = c.x; b.z = c.z + 2; b.y = 0; b.model.g.position.set(b.x, 0, b.z); b.model.g.rotation.set(0, 0, 0);
    M.me.g.visible = true; M.me.g.position.set(c.x, 0, c.z + 7); M.me.g.rotation.y = Math.PI; M.me.walk(0, 0);
    setView(M.scene, cineCam, () => {});
    letterbox(true);
    // vindo de um save, a tela ainda está preta
    if ($('#fade').classList.contains('on')) UI.fade(false);
    return { b, c };
  }

  async function post1() {
    const { b, c } = cineMansionSetup('cobra');
    b.model.root.position.y = -0.5; b.model.legL.rotation.x = b.model.legR.rotation.x = -1.5;
    camAt(V(c.x + 5, 3, c.z + 6), V(c.x, 1.8, c.z + 2));
    await talk(D2.SCRIPT.boss1Defeat, (who) => {
      if (who === 'JINLONG') camAt(V(c.x - 1.5, 3.4, c.z + 1), V(c.x, 2.8, c.z + 7));
      else if (who === 'REI COBRA') camAt(V(c.x + 0.8, 2.6, c.z + 5.5), V(c.x, 2.2, c.z + 2));
    }, async (cue) => {
      if (cue === 'unmask') { await wait(400); World.flash(0.5); Sfx.gong(); b.model.setFace('son'); b.model.hb.material[2].color.setHex(0x111111); b.model.hb.material[0] = b.model.hb.material[1] = b.model.mats[2]; await wait(300); World.flash(0); camAt(V(c.x, 2.3, c.z + 4.6), V(c.x, 2.2, c.z + 2)); }
    });
    // "Ah, mas você não é meu filho" → corta pro programa do Ratão
    await tvStatic(700);
    await scRatao(b);
    await tvStatic(500);
    await scBalsa2();
    st.stage = 'boss2'; save();
  }

  async function scRatao() {
    const sd = A2M.buildStudio();
    const host = A2M.mkPerson('host'); host.g.position.set(0, 0.6, -5.9); sd.scene.add(host.g);
    const me = A2M.mkPerson('jinlong'); me.sit(); me.g.position.set(-2.2, 0.85, -3.5); me.g.rotation.y = 0.3; sd.scene.add(me.g);
    const son = A2M.mkPerson('son'); son.sit(); son.g.position.set(2.2, 0.85, -3.5); son.g.rotation.y = -0.3; sd.scene.add(son.g);
    const kwan = A2M.mkPerson('kwan'); kwan.sit(); kwan.g.position.set(-5, 0.42, 3.2); kwan.g.rotation.y = Math.PI; sd.scene.add(kwan.g);
    const mei = A2M.mkPerson('mei'); mei.sit(); mei.g.position.set(-3.8, 0.42, 3.2); mei.g.rotation.y = Math.PI; sd.scene.add(mei.g);
    const phone = K.box(0.1, 0.18, 0.02, K.basic({ color: 0x111111 })); phone.position.set(0.05, -0.75, 0.15); mei.armR.add(phone); mei.armR.rotation.x = -1.7;
    const popcorn = K.cyl(0.12, 0.09, 0.2, 6, K.lam({ color: 0xd02020 })); popcorn.position.set(0, -0.8, 0.1); kwan.armL.add(popcorn); kwan.armL.rotation.x = -1.2;
    let tt = 0;
    setView(sd.scene, cineCam, (dt) => { tt += dt; sd.update(dt); host.armR.rotation.x = -1.2 + Math.sin(tt * 3) * 0.25; host.armL.rotation.z = Math.sin(tt * 2) * 0.3; kwan.armR.rotation.x = -1.4 + Math.max(0, Math.sin(tt * 4)) * 0.5; });
    letterbox(false);
    $('#tvOverlay').classList.remove('hidden');
    const lower = (t) => { $('#tvLower').textContent = t; };
    lower('TESTE DE DNA: "O CHEFÃO DO ARROZ DIZ QUE NÃO É O PAI"');
    Sfx.music('jingle');
    const shots = {
      'RATÃO': () => camAt(V(0, 2.6, -2.2), V(0, 2.5, -5.9)),
      'JINLONG': () => camAt(V(-0.6, 2.2, 0.2), V(-2.2, 2.0, -3.5)),
      'REI COBRA': () => camAt(V(0.6, 2.2, 0.2), V(2.2, 2.0, -3.5)),
      'XIAO DOU': () => camAt(V(0.6, 2.2, 0.2), V(2.2, 2.0, -3.5)),
      'PLATEIA': () => { camAt(V(0, 3.2, -3), V(0, 1.4, 7)); sd.cheer(2.5); Sfx.crowd(2, true); },
      'NARRADOR': () => camAt(V(0, 6, 15), V(0, 2, -4)),
    };
    camAt(V(0, 6, 15), V(0, 2, -4));
    await wait(600);
    Sfx.music(null);
    await talk(D2.SCRIPT.ratao, (who, i) => {
      if (i === 10) { camAt(V(-4.4, 2.4, 0.6), V(-4.4, 1.8, 3.2)); return; }
      (shots[who] || (() => {}))();
    }, async (cue) => {
      if (cue === 'drum') { lower('O RESULTADO DO DNA...'); camAt(V(0, 2.3, -3.2), V(0, 2.3, -5.9)); Sfx.drumroll(2.2); await camMove(V(0, 2.3, -3.2), V(0, 2.5, -4.6), V(0, 2.3, -5.9), V(0, 2.5, -5.9), 2.4); }
      if (cue === 'reveal') { lower('99,9% — É O PAI!!!'); World.flash(0.6); setTimeout(() => World.flash(0), 100); sd.cheer(6); Sfx.crowd(4, true); Sfx.music('jingle'); A2M.firework(sd.scene, V(0, 6, -4), [0xffd040, 0xff40a0, 0x40c0ff, 0xffffff], 160, 8); setTimeout(() => A2M.firework(sd.scene, V(-5, 7, -5), [0xffd040, 0xff4040], 100, 7), 400); }
      if (cue === 'hug') { me.g.position.set(-0.45, 0.6, -2.8); son.g.position.set(0.45, 0.6, -2.8); [me, son].forEach((p) => { p.root.position.y = 0; p.legL.rotation.x = p.legR.rotation.x = 0; p.armL.rotation.x = p.armR.rotation.x = -1.4; }); me.g.rotation.y = Math.PI / 2; son.g.rotation.y = -Math.PI / 2; camAt(V(0, 2.4, 1.5), V(0, 2, -2.8)); sd.cheer(5); Sfx.crowd(3, true); }
    });
    await wait(500);
    Sfx.music(null);
    $('#tvOverlay').classList.add('hidden');
  }

  async function scBalsa2() {
    const bay = A2M.buildBay('night');
    const me = A2M.mkPerson('jinlong'); me.sit(); me.g.position.set(-0.9, 0.8, -2); me.g.rotation.y = Math.PI; bay.boat.add(me.g);
    const kwan = A2M.mkPerson('kwan'); kwan.sit(); kwan.g.position.set(0, 0.8, -2); kwan.g.rotation.y = Math.PI; bay.boat.add(kwan.g);
    const son = A2M.mkPerson('son'); son.sit(); son.g.position.set(0.9, 0.8, -2); son.g.rotation.y = Math.PI; bay.boat.add(son.g);
    setView(bay.scene, cineCam, (dt) => bay.update(dt));
    letterbox(true);
    Sfx.music('sea');
    camAt(V(0, 2.4, -6.5), V(0, 2.1, -2));
    await talk(D2.SCRIPT.balsa2, (who, i) => {
      if (i === 1) { camAt(V(0, 2.4, -6.5), V(0, 2.1, -2)); return; }
      if (who === 'JINLONG') camAt(V(0.2, 2.5, -4.3), V(-0.9, 2.3, -2));
      else if (who === 'REI COBRA' || who === 'XIAO DOU') camAt(V(-0.2, 2.5, -4.3), V(0.9, 2.3, -2));
      else if (who === 'TIO KWAN') camAt(V(0, 2.4, -3.8), V(0, 2.3, -2));
      else if (who === 'OS DOIS') camAt(V(0, 2.6, -5.2), V(0, 2.2, -2));
    }, async () => {});
    await UI.fade(true);
  }

  async function boss2() {
    if (!M) buildMansion();
    const { b, c } = cineMansionSetup('son');
    if (b.phase !== 2) makeBoss(2);
    const B = M.boss; B.active = false; B.x = c.x; B.z = c.z + 2; B.model.g.position.set(B.x, 0, B.z);
    B.aura.visible = false;
    const bean = A2M.mkGrain(0x8a5a20); bean.visible = false; bean.position.set(0, -0.85, 0.15); B.model.armR.add(bean);
    await UI.fade(false);
    camAt(V(c.x + 4, 3, c.z + 9), V(c.x, 2, c.z + 3));
    await talk(D2.SCRIPT.boss2Intro, (who) => {
      if (who === 'XIAO DOU') camAt(V(c.x + 0.7, 2.7, c.z + 5.6), V(c.x, 2.6, c.z + 2));
      else if (who === 'JINLONG') camAt(V(c.x - 0.8, 3.0, c.z + 3.5), V(c.x, 2.4, c.z + 7));
    }, async (cue) => {
      if (cue === 'bean') { bean.visible = true; B.model.armR.rotation.x = -1.5; camAt(V(c.x + 1.8, 2.7, c.z + 5.8), V(c.x + 0.55, 2.2, c.z + 3.4)); }
      if (cue === 'fakeKS') { bean.visible = false; B.model.armR.rotation.x = 0; B.aura.visible = true; Sfx.roar(); World.flash(0.5); setTimeout(() => World.flash(0), 150); camAt(V(c.x, 2, c.z + 8), V(c.x, 2.5, c.z + 2)); await tween(1.2, (k) => { cineCam.position.x = c.x + Math.sin(k * 40) * 0.08 * (1 - k); }); }
      if (cue === 'ks') { Sfx.ksOn(); World.flash(0.8); setTimeout(() => World.flash(0), 200); M.me.mats.forEach((m) => m.emissive && m.emissive.setHex(0x664400)); camAt(V(c.x + 1.5, 2.2, c.z + 11), V(c.x, 2.2, c.z + 7)); await wait(800); }
    });
    // luta: KING SIZE contra KING SIZE
    M.me.g.visible = false;
    letterbox(false);
    P.ksPerm = true; st.maxHp = 220; st.hp = 220;
    st.checkpoint = { x: c.x, z: c.z + 8, yaw: 0 };
    P.x = c.x; P.z = c.z + 8; P.yaw = 0; P.pitch = 0;
    setWeaponView('fists');
    $('#ksAura').classList.add('on');
    $('#hud2').classList.remove('hidden');
    mode = 'fps';
    setView(M.scene, fpsCam);
    bigText('金 VS 豆', 'KING SIZE CONTRA KING SIZE', 2500);
    UI.toast('Soque ele contra a PAREDE pra atordoar. PULE as ondas de choque.', 'gold', 7000);
    Sfx.music('boss');
    B.active = true;
    await until(() => M.boss.defeated);
    Sfx.music(null);
    st.stage = 'final'; save();
  }

  // ---------------------------------------------------------------
  // O FINAL (cinema)
  // ---------------------------------------------------------------
  let mashV = 0, mashOn = false;
  function mashHit() { if (!mashOn) return; mashV = Math.min(1, mashV + 0.07); Sfx.shoot('punch'); shakeAmt = 0.3; }
  async function qte(onTick) {
    mashV = 0.25; mashOn = true;
    $('#mash').classList.remove('hidden');
    const kh = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) mashHit(); } };
    window.addEventListener('keydown', kh);
    await until(() => {
      const done = mashV >= 1;
      mashV = Math.max(0.05, mashV - lastDt * 0.22);
      $('#mashFill').style.width = (done ? 100 : mashV * 100) + '%';
      onTick(mashV);
      return done;
    });
    window.removeEventListener('keydown', kh);
    mashOn = false;
    $('#mash').classList.add('hidden');
  }

  async function finale() {
    if (!M) buildMansion();
    if (!M.boss || M.boss.phase !== 2) makeBoss(2);
    const { b, c } = cineMansionSetup('son');
    P.ksPerm = false;
    const son = b.model;
    son.root.position.y = -0.5; son.legL.rotation.x = son.legR.rotation.x = -1.5;
    if (b.aura) b.aura.visible = false;
    M.me.mats.forEach((m) => m.emissive && m.emissive.setHex(0));
    M.me.g.position.set(c.x, 0, c.z + 5);
    const gRice = A2M.mkGrain(0xffd040, true), gBean = A2M.mkGrain(0x9a6a2a, true);
    gRice.visible = gBean.visible = false; M.scene.add(gRice); M.scene.add(gBean);
    const kwan = A2M.mkPerson('kwan', { evil: true }); kwan.g.visible = false; M.scene.add(kwan.g);
    const hashi = K.box(0.02, 0.02, 0.5, K.basic({ color: 0xdddddd })); hashi.position.set(0, -0.8, 0.25); kwan.armR.add(hashi);
    let tt = 0, kwanAura = null;
    setView(M.scene, cineCam, (dt) => {
      tt += dt;
      if (gRice.visible) { gRice.rotation.y += dt * 3; gBean.rotation.y -= dt * 3; }
      if (kwanAura) kwanAura.scale.setScalar(1 + Math.sin(tt * 6) * 0.1);
    });
    Sfx.music('sad');
    camAt(V(c.x + 4, 2.5, c.z + 8), V(c.x, 1.6, c.z + 3));
    await talk(D2.SCRIPT.boss2Defeat, (who, i) => {
      if (who === 'XIAO DOU') faceShot(son, 2.4, 0.6);
      else if (who === 'JINLONG') faceShot(M.me, 2.0, -0.5);
      else if (who === 'TIO KWAN' && kwan.g.visible) {
        if (kwan.g.scale.x > 1.5) camAt(V(c.x + 2, 1.6, c.z + 4), V(c.x, 4, c.z + 9));
        else camAt(V(c.x + 1, 2.4, c.z + 6.4), V(c.x, 2.2, c.z + 9));
      }
    }, async (cue) => {
      if (cue === 'grains') {
        gRice.position.set(c.x - 0.6, 2.4, c.z + 3.5); gBean.position.set(c.x + 0.6, 2.4, c.z + 3.5); gRice.visible = gBean.visible = true;
        Sfx.gold(); camAt(V(c.x, 2.6, c.z + 6.5), V(c.x, 2.3, c.z + 3.5));
      }
      if (cue === 'clap') { Sfx.music(null); for (let i = 0; i < 3; i++) setTimeout(() => Sfx.shoot('estilingue'), i * 650); await wait(2000); }
      if (cue === 'kwan') {
        kwan.g.visible = true; kwan.g.position.set(c.x, 0, c.z + 12); kwan.g.rotation.y = Math.PI;
        camAt(V(c.x - 2, 2, c.z + 6), V(c.x, 1.8, c.z + 12));
        Sfx.drone(true);
        await tween(2.5, (k) => { kwan.g.position.z = c.z + 12 - k * 3; kwan.walk(k * 14, 0.4); });
        kwan.walk(0, 0);
      }
      if (cue === 'swallow') {
        camAt(V(c.x + 3, 2.6, c.z + 6), V(c.x, 2.2, c.z + 6.5));
        const from1 = gRice.position.clone(), from2 = gBean.position.clone(), to = V(c.x, 2.0, c.z + 8.8);
        await tween(1.4, (k) => { gRice.position.lerpVectors(from1, to, ease(k)); gBean.position.lerpVectors(from2, to, ease(k)); });
        gRice.visible = gBean.visible = false;
        Sfx.boom(0.5);
      }
      if (cue === 'grow') {
        Sfx.roar(); Sfx.drone(false);
        kwanAura = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
        kwanAura.position.y = 1.3; kwan.g.add(kwanAura);
        kwan.g.add(new THREE.PointLight(0xffa040, 2, 20, 1.2));
        camAt(V(c.x, 1.2, c.z + 3), V(c.x, 3, c.z + 9));
        await tween(2.5, (k) => { const s = 1 + ease(k) * 1.15; kwan.g.scale.setScalar(s); cineCam.position.x = c.x + Math.sin(k * 60) * 0.06; if (Math.random() < 0.1) World.flash(0.3); else World.flash(0); });
        World.flash(0);
        Sfx.music('boss');
      }
      if (cue === 'glow') {
        son.root.position.y = 0; son.legL.rotation.x = son.legR.rotation.x = 0;
        son.g.position.set(c.x + 1.2, 0, c.z + 5); son.g.rotation.y = 0;
        M.me.g.position.set(c.x - 1.2, 0, c.z + 5); M.me.g.rotation.y = 0;
        M.me.mats.forEach((m) => m.emissive && m.emissive.setHex(0x664400));
        son.mats.forEach((m) => m.emissive && m.emissive.setHex(0x4a2a10));
        Sfx.ksOn(); World.flash(0.5); setTimeout(() => World.flash(0), 150);
        camAt(V(c.x, 1.6, c.z + 1.5), V(c.x, 2.2, c.z + 6));
      }
    });
    // QTE: soco duplo
    camAt(V(c.x - 3, 2.2, c.z + 1), V(c.x, 3.5, c.z + 9));
    letterbox(false);
    await qte((v) => {
      M.me.armR.rotation.x = son.armL.rotation.x = -1.4 - v * 0.2;
      const back = 1 - v;
      kwan.g.position.z = c.z + 9 + back * 0.2 * Math.sin(tt * 20);
    });
    letterbox(true);
    // câmera lenta + o soco
    Sfx.music(null);
    camAt(V(c.x + 3.5, 1.5, c.z + 3.5), V(c.x, 2.5, c.z + 8));
    await tween(1.6, (k) => {
      M.me.g.position.z = c.z + 5 + ease(k) * 2.2; son.g.position.z = c.z + 5 + ease(k) * 2.2;
      M.me.armR.rotation.x = son.armL.rotation.x = -1.6 + k * 0.1;
      cineCam.position.z = c.z + 3.5 + k * 1.2;
    });
    World.flash(1); Sfx.boom(1.5); Sfx.ksOn();
    await wait(250);
    World.flash(0);
    camAt(V(c.x - 5, 2, c.z + 4), V(c.x, 6, c.z + 9));
    await tween(1.4, (k) => { kwan.g.position.y = ease(k) * 30; kwan.g.rotation.x += 0.3; kwan.g.rotation.z += 0.2; cineCam.lookAt(c.x, 3 + k * 12, c.z + 9); });
    await UI.fade(true, true);
    await scLaunch();
    await scDawn();
    await credits();
    await scStinger();
    endScreen();
  }

  async function scLaunch() {
    const bay = A2M.buildBay('sky');
    const kwanStar = A2M.mkGrain(0xffc040, true); kwanStar.scale.setScalar(3); bay.scene.add(kwanStar);
    setView(bay.scene, cineCam, (dt) => bay.update(dt));
    camAt(V(0, 4, 40), V(0, 30, -120));
    letterbox(true);
    await UI.fade(false, true);
    Sfx.music('sea');
    const from = V(-140, 5, -60), to = V(30, 85, -150);
    await tween(3.2, (k) => {
      kwanStar.position.lerpVectors(from, to, k); kwanStar.position.y += Math.sin(k * Math.PI) * 25;
      kwanStar.rotation.z += 0.3;
      if (Math.random() < 0.6) A2M.firework(bay.scene, kwanStar.position.clone(), [0xffd040, 0xff8020], 4, 2);
    });
    kwanStar.visible = false;
    Sfx.boom(1.6);
    World.flash(0.6); setTimeout(() => World.flash(0), 150);
    const colors = [[0xffd040, 0xfff0a0], [0x9a5a2a, 0xffb060], [0xff3030, 0xffffff], [0x40c0ff, 0xffd040]];
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        A2M.firework(bay.scene, V(to.x + rand(-60, 60), to.y + rand(-20, 25), to.z + rand(-20, 20)), colors[i % 4], 140, rand(12, 20));
        Sfx.firework();
      }, i * 380);
    }
    await wait(1500);
    await UI.dialog(D2.SCRIPT.launch);
    await wait(2500);
    await UI.fade(true);
  }

  async function scDawn() {
    const bay = A2M.buildBay('dawn');
    const me = A2M.mkPerson('jinlong'); me.sit(); me.g.position.set(-0.9, 0.8, -2); me.g.rotation.y = Math.PI; bay.boat.add(me.g);
    const son = A2M.mkPerson('son'); son.sit(); son.g.position.set(0.1, 0.8, -2); son.g.rotation.y = Math.PI; bay.boat.add(son.g);
    const mei = A2M.mkPerson('mei'); mei.sit(); mei.g.position.set(1.1, 0.8, -2); mei.g.rotation.y = Math.PI; bay.boat.add(mei.g);
    [me, son].forEach((p, i) => { const m = A2M.mkMarmita(); m.scale.setScalar(0.6); m.position.set([-0.9, 0.1][i], 1.75, -2.45); bay.boat.add(m); p.armL.rotation.x = p.armR.rotation.x = -0.9; });
    setView(bay.scene, cineCam, (dt) => bay.update(dt));
    letterbox(true);
    Sfx.music('sad');
    camAt(V(5, 3, -14), V(0, 2, -2));
    await UI.fade(false);
    await talk(D2.SCRIPT.dawn, (who, i) => {
      if (who === 'DONA MEI') camAt(V(0.4, 2.5, -4.6), V(1.1, 2.3, -2));
      else if (who === 'XIAO DOU') camAt(V(-0.5, 2.5, -4.5), V(0.1, 2.3, -2));
      else if (who === 'JINLONG') camAt(V(0, 2.5, -4.4), V(-0.9, 2.3, -2));
      else if (i === 4) camAt(V(-0.9, 3.2, -3.3), V(-0.9, 1.75, -2.45));
    });
    $('#endTitle').classList.remove('hidden');
    await camMove(V(0, 2.5, -4.4), V(25, 30, -45), V(-0.9, 2.3, -2), V(0, 0, -2), 7);
    await wait(1500);
    $('#endTitle').classList.add('hidden');
  }

  async function credits() {
    const el = $('#credits'), roll = $('#creditsRoll');
    roll.innerHTML = D2.CREDITS.map(([t, c]) => `<div class="cr ${c}">${t || '&nbsp;'}</div>`).join('');
    el.classList.remove('hidden');
    roll.style.animation = 'none'; void roll.offsetWidth; roll.style.animation = '';
    await UI.waitOrClick(30000);
    el.classList.add('hidden');
    await UI.fade(true);
  }

  async function scStinger() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050302);
    scene.add(new THREE.AmbientLight(0x6080a0, 0.5));
    const l = new THREE.PointLight(0xd0e0ff, 1.2, 12, 1.5); l.position.set(0, 3.5, 1); scene.add(l);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), K.lam({ map: K.TEX.wall })); back.position.set(0, 2.5, -2); scene.add(back);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.5), K.basic({ map: K.textCanvas(256, 32, '#c01010', [{ t: 'PASTELARIA DRAGÃO FELIZ', y: 16, c: '#ffd040', f: 'bold 15px monospace' }]) })); sign.position.set(0, 3.9, -1.98); scene.add(sign);
    const counter = K.box(5, 1.1, 1, K.lam({ map: K.TEX.wood })); counter.position.set(0, 0.55, 0.4); scene.add(counter);
    const reg = K.box(0.7, 0.45, 0.5, K.lam({ map: K.TEX.metal, color: 0x8a8a90 })); reg.position.set(0.6, 1.33, 0.3); scene.add(reg);
    const drawer = K.box(0.6, 0.15, 0.5, K.lam({ map: K.TEX.metal, color: 0x6a6a70 })); drawer.position.set(0.6, 1.05, 0.3); scene.add(drawer);
    const mei = A2M.mkPerson('mei'); mei.g.position.set(0, 0, -0.8); scene.add(mei.g);
    const farofa = A2M.mkGrain(0xffe080); farofa.scale.setScalar(0.5); farofa.position.set(0.6, 1.1, 0.75); farofa.visible = false; scene.add(farofa);
    const glow = new THREE.PointLight(0xffd040, 0, 3, 2); glow.position.set(0.6, 1.4, 0.8); scene.add(glow);
    setView(scene, cineCam, (dt) => { farofa.rotation.y += dt * 4; });
    letterbox(true);
    camAt(V(-1.5, 2.4, 4.5), V(0, 1.8, -0.5));
    Sfx.music(null);
    await UI.fade(false);
    await talk(D2.SCRIPT.stinger, (who, i) => {
      if (i === 1) { tween(1, (k) => { drawer.position.z = 0.3 + k * 0.45; }); farofa.visible = true; glow.intensity = 2; camAt(V(0.9, 2.0, 2.2), V(0.6, 1.1, 0.75)); }
      if (who === 'DONA MEI') camAt(V(0.3, 2.6, 1.6), V(0, 2.4, -0.8));
      if (i === 3) { camAt(V(0.7, 1.5, 1.4), V(0.6, 1.1, 0.75)); Sfx.gold(); }
    });
    bigText('', 'ARROZ DOURADO 3: A FAROFA DE OURO', 3500);
    await wait(3600);
    await UI.fade(true);
  }

  function endScreen() {
    letterbox(false);
    Sfx.music(null);
    const m = Math.floor(st.time / 60), s = Math.floor(st.time % 60);
    $('#e2Stats').innerHTML = `Tempo na mansão: ${m}min ${String(s).padStart(2, '0')}s<br>Capangas derrubados: ${st.kills}<br>Arma final: ${D2.WEAPONS[st.owned - 1].name}`;
    $('#end2').classList.remove('hidden');
    $('#fade').classList.remove('on', 'white');
    // o ato II acabou: o save passa a apontar pro ato III
    const S = UI.S();
    S.flags.act2Done = true;
    S.act3 = { stage: 'prologo' };
    UI.save();
    isActive = false;
  }

  // ---------------------------------------------------------------
  // API
  // ---------------------------------------------------------------
  async function start(saved) {
    K = World.kit; UI = window.GameUI;
    if (!built) { A2M.init(); cineCam = new THREE.PerspectiveCamera(55, 16 / 9, 0.05, 600); bindInput(); built = true; }
    st = Object.assign(fresh(), saved || {});
    if (!saved || !saved.stage) st = fresh();
    isActive = true;
    UI.setPhase('act2');
    save();
    $('#hud').classList.add('hidden');
    $('#fade').classList.add('on');
    if (st.stage === 'balsa1') { await scBalsa1(); st.stage = 'mansion'; st.checkpoint = null; save(); }
    if (st.stage === 'mansion') { await enterMansion(!!st.checkpoint && st.time > 0); await boss1(); }
    else if (st.stage === 'boss1') {
      buildMansion(); M.doorOpen = true;
      if (!st.checkpoint) st.checkpoint = { x: M.doorPos.x, z: M.doorPos.z - TILE * 1.2, yaw: 0 };
      await enterMansion(true); await boss1();
    }
    if (st.stage === 'post1') { if (!M) buildMansion(); if (!M.boss) makeBoss(1); await post1(); }
    if (st.stage === 'boss2') await boss2();
    if (st.stage === 'final') await finale();
  }

  let lastDt = 0.016;
  function update(dt) {
    lastDt = dt;
    for (let i = tweens.length - 1; i >= 0; i--) { const t = tweens[i]; t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k >= 1) { tweens.splice(i, 1); t.res(); } }
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].pred()) { const w = waiters.splice(i, 1)[0]; w.res(); }
    if (mode === 'fps' && M) updateFPS(dt);
    if (M) {
      M.boomLight.intensity = Math.max(0, M.boomLight.intensity - dt * 10);
      for (let i = M.fx.length - 1; i >= 0; i--) { const f = M.fx[i]; f.t += dt; const k = f.t / f.dur; f.m.scale.setScalar(0.5 + k * f.r); f.m.material.opacity = 0.85 * (1 - k); if (k >= 1) { M.scene.remove(f.m); M.fx.splice(i, 1); } }
      if (view && view.scene === M.scene) A2M.fxUpdate(M.scene, dt);
      M.lanterns.forEach((l, i) => { l.rotation.z = Math.sin(performance.now() / 900 + i) * 0.05; });
    }
    if (view) view.update(dt);
  }
  function render() {
    if (!view) return;
    const a = window.innerWidth / window.innerHeight;
    if (Math.abs(view.cam.aspect - a) > 0.001) { view.cam.aspect = a; view.cam.updateProjectionMatrix(); }
    World.renderWith(view.scene, view.cam);
  }

  return { start, update, render, isActive: () => isActive, debug: () => ({ st, P, M, mode }) };
})();
