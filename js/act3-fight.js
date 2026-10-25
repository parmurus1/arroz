// =====================================================================
//  ARROZ DOURADO — ATO III · CAPÍTULO 1: luta 2.5D estilo Street Fighter
// =====================================================================

const Fight = (() => {
  const D3 = DATA3;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const $ = (s) => document.querySelector(s);
  const STAGE_L = -7, STAGE_R = 7, MAX_GAP = 8.5;
  const GRAV = 30;

  const MOVES = {
    jab: { st: 0.05, act: 0.07, rec: 0.13, dmg: 45, range: 1.25, lvl: 'mid', hs: 0.24, bs: 0.13, push: 0.4, pose: 'punch', meter: 6 },
    kick: { st: 0.1, act: 0.09, rec: 0.2, dmg: 70, range: 1.6, lvl: 'mid', hs: 0.3, bs: 0.16, push: 0.6, pose: 'kick', meter: 8 },
    cjab: { st: 0.05, act: 0.07, rec: 0.13, dmg: 40, range: 1.2, lvl: 'low', hs: 0.22, bs: 0.12, push: 0.35, pose: 'cpunch', meter: 5, crouch: true },
    sweep: { st: 0.11, act: 0.1, rec: 0.32, dmg: 75, range: 1.65, lvl: 'low', hs: 0.3, bs: 0.18, push: 0.5, pose: 'sweep', meter: 9, crouch: true, knock: true },
    ajab: { st: 0.05, act: 0.2, rec: 0.05, dmg: 55, range: 1.2, lvl: 'over', hs: 0.3, bs: 0.15, push: 0.4, pose: 'apunch', meter: 6, air: true },
    akick: { st: 0.07, act: 0.25, rec: 0.05, dmg: 75, range: 1.5, lvl: 'over', hs: 0.34, bs: 0.18, push: 0.5, pose: 'akick', meter: 8, air: true },
    proj: { st: 0.2, act: 0.01, rec: 0.38, dmg: 0, range: 0, pose: 'proj', meter: 6, spawn: true },
    up: { st: 0.04, act: 0.26, rec: 0.38, dmg: 115, range: 1.3, lvl: 'mid', hs: 0.4, bs: 0.25, push: 0.4, pose: 'up', meter: 10, knock: true, inv: 0.14, rise: 9 },
    // super: avança acertando ~6 vezes (≈330 de dano no total)
    super: { st: 0.5, act: 0.7, rec: 0.45, dmg: 55, range: 1.6, lvl: 'mid', hs: 0.5, bs: 0.3, push: 0.15, pose: 'super', meter: 0, inv: 0.6, dash: 9, cost: 100 },
  };

  let K, UI;
  let scene = null, cam = null, F = [], projs = [], sparks = [], rain = null, crowd = null;
  let running = false, phase = 'intro', phaseT = 0, timer = 60, round = 1, hitstop = 0, slow = 1, shake = 0;
  let opts = null, resolveRun = null, tut = null, stageId = '';
  let t = 0;

  // ---------------------------------------------------------------
  // cenários
  // ---------------------------------------------------------------
  function skyTex(top, bot, stars, lights) {
    return K.canvasTex(256, 128, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, top); grd.addColorStop(1, bot); g.fillStyle = grd; g.fillRect(0, 0, w, h);
      const r = K.rng(4);
      if (stars) for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,220,${r()})`; g.fillRect(Math.floor(r() * w), Math.floor(r() * h * 0.6), 1, 1); }
      if (lights) {
        g.fillStyle = '#0a0812';
        g.beginPath(); g.moveTo(0, h); g.lineTo(0, 80); g.lineTo(40, 70); g.lineTo(90, 86); g.lineTo(140, 74); g.lineTo(200, 90); g.lineTo(256, 78); g.lineTo(256, h); g.fill();
        for (let i = 0; i < 260; i++) { const x = Math.floor(r() * w), y = 76 + Math.floor(r() * 52); g.fillStyle = r() < 0.7 ? `rgba(255,190,90,${0.4 + r() * 0.6})` : 'rgba(255,255,255,0.8)'; g.fillRect(x, y, 1, 1); }
        g.fillStyle = '#f4f0d0'; g.fillRect(200, 40, 2, 10); g.fillRect(196, 43, 10, 2);
      }
    });
  }
  function buildStage(id, wet) {
    const { lam, basic, box, cyl, canvasTex, rng } = K;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x120a14, 16, 50);
    scene.add(new THREE.AmbientLight(0xa090b0, 0.6));
    const key = new THREE.DirectionalLight(0xffe0c0, 0.75); key.position.set(3, 8, 10); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8060ff, 0.4); rim.position.set(-6, 4, -8); scene.add(rim);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), basic({ map: skyTex(id === 'selaron' ? '#1a2a5a' : '#0a0618', id === 'circo' ? '#2a0a3a' : '#3a1a3a', true, id !== 'circo'), fog: false }));
    sky.position.set(0, 14, -30); scene.add(sky);
    let floorTex;
    if (id === 'telhado') floorTex = canvasTex(32, 32, (g, w, h) => { const r = rng(5); K.pixels(g, w, h, (x, y) => K.noisy((x % 16 === 0 || y % 16 === 0) ? [70, 70, 74] : [110, 108, 104], 16, r)); }, [12, 4]);
    else if (id === 'circo') floorTex = canvasTex(32, 32, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2a1a3a' : '#3a2a4a'; g.fillRect(i * 8, j * 8, 8, 8); } }, [12, 4]);
    else floorTex = canvasTex(32, 32, (g, w, h) => { const r = rng(9); g.fillStyle = '#2a2420'; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const c = 70 + r() * 40; g.fillStyle = `rgb(${c},${c * 0.95},${c * 0.88})`; g.fillRect(x * 8 + 1 + (y % 2) * 4, y * 8 + 1, 6, 6); } }, [14, 5]);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 20, 30, 10), lam({ map: floorTex, color: wet ? 0x8090a0 : 0xffffff }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -3); scene.add(floor);

    if (id === 'telhado') {
      const tank = cyl(1.3, 1.1, 2.0, 10, lam({ color: 0x2a6ad0 })); tank.position.set(-5, 1, -4); scene.add(tank);
      const lid = cyl(1.35, 1.35, 0.15, 10, lam({ color: 0x1a4aa0 })); lid.position.set(-5, 2.05, -4); scene.add(lid);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), basic({ map: K.textCanvas(64, 16, '#1a4aa0', [{ t: 'FORTLEV', y: 8, c: '#fff', f: 'bold 10px monospace' }]) })); lab.position.set(-5, 1.2, -2.85); scene.add(lab);
      const ant = box(0.06, 4, 0.06, lam({ color: 0x999999 })); ant.position.set(5, 2, -5); scene.add(ant);
      for (let i = 0; i < 3; i++) { const a = box(1.4 - i * 0.3, 0.05, 0.05, lam({ color: 0x999999 })); a.position.set(5, 3 + i * 0.4, -5); scene.add(a); }
      const line = box(9, 0.02, 0.02, basic({ color: 0xdddddd })); line.position.set(1, 2.6, -6); scene.add(line);
      ['#e04040', '#40a0e0', '#f0d040', '#fff'].forEach((c, i) => { const cl = box(0.6, 0.8, 0.02, lam({ color: new THREE.Color(c) })); cl.position.set(-2 + i * 1.6, 2.2, -6); scene.add(cl); });
      const wall = box(40, 0.6, 0.4, lam({ color: 0x8a8070 })); wall.position.set(0, 0.3, -7); scene.add(wall);
    } else if (id === 'lapa') {
      // Arcos da Lapa (dois andares) + bondinho de Santa Teresa
      const white = lam({ color: 0xf0ece0 });
      const Z = -11;
      for (let x = -30; x <= 30; x += 4) {
        const p1 = box(1.0, 5.5, 1.6, white); p1.position.set(x, 2.75, Z); scene.add(p1);
        const p2 = box(0.8, 4.2, 1.6, white); p2.position.set(x, 7.6, Z); scene.add(p2);
        if (x < 30) {
          const a1 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.45, 4, 10, Math.PI), white); a1.position.set(x + 2, 5.1, Z); scene.add(a1);
          const a2 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.35, 4, 10, Math.PI), white); a2.position.set(x + 2, 9.3, Z); scene.add(a2);
        }
      }
      const deck1 = box(64, 0.9, 1.7, white); deck1.position.set(0, 6.0, Z); scene.add(deck1);
      const deck2 = box(64, 0.8, 1.7, white); deck2.position.set(0, 10.2, Z); scene.add(deck2);
      const tram = new THREE.Group(); tram.position.set(-8, 11.2, Z);
      const tb = box(3, 1.3, 1.3, lam({ color: 0xf0c020 })); tram.add(tb);
      for (let i = 0; i < 4; i++) { const w = box(0.5, 0.5, 1.32, basic({ color: 0xffe0a0 })); w.position.set(-1.1 + i * 0.73, 0.15, 0); tram.add(w); }
      scene.add(tram); scene.userData.tram = tram;
      // varal de lâmpadas
      for (let i = 0; i < 24; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 3), basic({ color: [0xffd040, 0xff4040, 0x40ff80][i % 3] })); b.position.set(-12 + i, 4.6 + Math.sin(i * 0.8) * 0.3, -4); scene.add(b); }
    } else if (id === 'selaron') {
      // Escadaria Selarón: degraus de azulejo colorido
      const cols = ['#d02020', '#2050c0', '#f0c020', '#20a050', '#ffffff', '#e06020'];
      for (let i = 0; i < 16; i++) {
        const tex = canvasTex(16, 16, (g) => { const r = rng(i * 7 + 1); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x * 4, y * 4, 4, 4); } });
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 1);
        const st = box(9, 0.45, 1.2, lam({ map: tex })); st.position.set(0, 0.22 + i * 0.45, -6 - i * 1.0); scene.add(st);
      }
      [-6.5, 6.5].forEach((x) => {
        const tex = canvasTex(32, 32, (g) => { const r = rng(x > 0 ? 3 : 4); for (let y = 0; y < 8; y++) for (let xx = 0; xx < 8; xx++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(xx * 4, y * 4, 4, 4); } }, [4, 2]);
        const w = box(3, 8, 20, lam({ map: tex })); w.position.set(x, 4, -14); scene.add(w);
      });
    } else if (id === 'circo') {
      // Circo Voador: lona branca em arco + holofotes
      const tent = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 40, 14, 1, true, 0, Math.PI), lam({ color: 0xe8e4f0, side: THREE.DoubleSide }));
      tent.rotation.z = Math.PI / 2; tent.rotation.y = Math.PI / 2; tent.position.set(0, 0, -6); scene.add(tent);
      for (let i = 0; i < 5; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 14, 8, 1, true), new THREE.MeshBasicMaterial({ color: [0xff60c0, 0x60c0ff, 0xffd040][i % 3], transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        const piv = new THREE.Group(); piv.position.set(-10 + i * 5, 14, -6); cone.position.y = -7; piv.add(cone); scene.add(piv);
        (scene.userData.beams = scene.userData.beams || []).push(piv);
      }
      const stageB = box(30, 1, 6, lam({ color: 0x2a1a3a })); stageB.position.set(0, 0.5, -10); scene.add(stageB);
    }
    if (id !== 'telhado') {
      crowd = A2M.mkCrowd(70, 3, 24, 1.1, [0xf0f0f0, 0xd02020, 0x2040c0, 0xf0c020, 0x20a050, 0x111111]);
      crowd.position.set(0, id === 'selaron' ? 0 : 0, -5.2); crowd.rotation.y = Math.PI; scene.add(crowd);
    } else crowd = null;
    if (wet) {
      const N = 500, geo = new THREE.BufferGeometry(), a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { a[i * 3] = (Math.random() - 0.5) * 30; a[i * 3 + 1] = Math.random() * 14; a[i * 3 + 2] = -Math.random() * 10 + 4; }
      geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
      rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xa0c0ff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6 }));
      rain.frustumCulled = false; scene.add(rain);
    } else rain = null;
    cam = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 200);
  }

  // ---------------------------------------------------------------
  // lutadores
  // ---------------------------------------------------------------
  function mkFighter(id, side, cpu, level) {
    const def = D3.FIGHTERS[id];
    const p = A3.person(def.look, { scale: def.scale });
    scene.add(p.g);
    const f = {
      id, def, p, cpu, level: level || 0, x: side * 2.4, y: 0, vy: 0, vx: 0, face: -side, hp: def.hp, shownHp: def.hp, meter: 0,
      move: null, moveT: 0, hitDone: false, stun: 0, blockStun: 0, knock: false, down: 0, inv: 0, crouch: false, blocking: false,
      buf: [], lastDir: 5, wins: 0, ai: { t: 0, hold: null, holdT: 0 }, armorHit: 0, stats: { hits: 0, blocks: 0, proj: 0, up: 0, super: 0, moved: { l: 0, r: 0, j: 0 } },
    };
    return f;
  }

  function dirOf(f, keys) {
    let h = 0, v = 0;
    if (keys.KeyA || keys.ArrowLeft) h -= 1;
    if (keys.KeyD || keys.ArrowRight) h += 1;
    if (keys.KeyW || keys.ArrowUp) v += 1;
    if (keys.KeyS || keys.ArrowDown) v -= 1;
    const fwd = h * f.face; // +1 = pra frente
    return 5 + fwd + v * 3; // numpad: 1 2 3 / 4 5 6 / 7 8 9 (6 = frente)
  }
  function motion(f, seq, win) {
    const now = t;
    let i = seq.length - 1;
    for (let j = f.buf.length - 1; j >= 0 && i >= 0; j--) {
      if (now - f.buf[j].t > win) break;
      if (f.buf[j].d === seq[i]) i--;
    }
    return i < 0;
  }

  function startMove(f, name) {
    const m = MOVES[name];
    if (!m) return;
    if (m.cost && f.meter < m.cost) return;
    if (m.cost) f.meter -= m.cost;
    f.move = name; f.moveT = 0; f.hitDone = false;
    if (m.inv) f.inv = m.inv;
    if (name === 'up') { f.stats.up++; if (f.def === D3.FIGHTERS.kwan) { // ligação a cobrar: teletransporta pras costas
        const o = other(f); f.x = Math.max(STAGE_L, Math.min(STAGE_R, o.x - o.face * 1.2)); f.face = Math.sign(o.x - f.x) || 1; Sfx.raw.tone(850, 0.15, 'square', 0.05); Sfx.raw.tone(1050, 0.15, 'square', 0.05, null, Sfx.raw.now() + 0.18); }
      else { f.vy = (f.def === D3.FIGHTERS.couve ? 5 : f.def === D3.FIGHTERS.torresmo ? 4 : m.rise); f.y = 0.01; } }
    if (name === 'super') { f.stats.super++; superFlash(f); }
    if (name === 'proj') f.stats.proj++;
    if (name === 'ajab' || name === 'akick') { /* golpe aéreo */ }
  }
  const other = (f) => (f === F[0] ? F[1] : F[0]);

  function superFlash(f) {
    hitstop = 0.45;
    Sfx.ksOn();
    World.flash(0.5); setTimeout(() => World.flash(0), 120);
    big(f.def.specials.super, 1200, f.def.color);
  }

  function playerInput(f, dt) {
    const k = A3.keys, pr = A3.pressed;
    const d = dirOf(f, k);
    if (d !== f.lastDir) { f.buf.push({ d, t }); f.lastDir = d; if (f.buf.length > 20) f.buf.shift(); }
    f.crouch = d <= 3 && f.y === 0;
    f.blocking = (d === 4 || d === 1) && f.y === 0;
    if (f.move || f.stun > 0 || f.down > 0) return;
    const P = pr.KeyJ, Kk = pr.KeyK, L = pr.KeyL;
    if ((pr.KeyI || (P && k.KeyK) || (Kk && k.KeyJ)) && f.meter >= 100 && f.y === 0) return startMove(f, 'super');
    if (f.y > 0) { if (P) startMove(f, 'ajab'); else if (Kk) startMove(f, 'akick'); }
    else if (P || L) {
      if ((P && motion(f, [6, 2, 3], 0.5)) || (L && k.KeyS)) startMove(f, 'up');
      else if ((P && motion(f, [2, 3, 6], 0.45)) || L) startMove(f, 'proj');
      else startMove(f, f.crouch ? 'cjab' : 'jab');
      if (f.move !== 'proj' && f.move !== 'up') f.stats.hitTry = (f.stats.hitTry || 0) + 1;
    } else if (Kk) startMove(f, f.crouch ? 'sweep' : 'kick');
    if (!f.move) {
      // andar e pular
      const sp = f.def.speed * (f.crouch ? 0 : 1);
      if (d === 6 || d === 4) { f.x += (d === 6 ? 1 : -1) * f.face * sp * (d === 4 ? 0.75 : 1) * dt; f.stats.moved[(d === 6 ? f.face : -f.face) > 0 ? 'r' : 'l'] += dt; }
      if (d >= 7 && f.y === 0) { f.vy = f.def.jump; f.y = 0.01; f.vx = (d === 9 ? 1 : d === 7 ? -1 : 0) * f.face * 3.4; f.stats.moved.j++; Sfx.jump(); }
    }
  }

  function aiInput(f, dt) {
    const o = other(f), ai = f.ai, A = f.def.ai || { aggro: 0.3, block: 0.2, proj: 0.1, low: 0.3, jumpIn: 0.05, up: 0.2, react: 0.45 };
    const lvl = 0.75 + f.level * 0.1;
    const dx = o.x - f.x, dist = Math.abs(dx);
    f.crouch = false; f.blocking = false;
    if (tut) { // modo treino: o filho só apanha (e às vezes ataca pra você treinar a defesa)
      f.blocking = false;
      if (tut.step === 2 && !f.move && f.stun <= 0) {
        if (dist > 1.15) f.x += Math.sign(dx) * 4.5 * dt; // vem atrás de você
        ai.t -= dt;
        if (ai.t <= 0 && dist <= 1.4) { ai.t = 1.0; startMove(f, Math.random() < 0.6 ? 'jab' : 'cjab'); }
      }
      return;
    }
    if (ai.hold) {
      ai.holdT -= dt;
      if (ai.hold === 'block') f.blocking = f.y === 0;
      if (ai.hold === 'cblock') { f.blocking = f.y === 0; f.crouch = true; }
      if (ai.hold === 'fwd') f.x += Math.sign(dx) * f.def.speed * dt;
      if (ai.hold === 'back') f.x -= Math.sign(dx) * f.def.speed * 0.7 * dt;
      if (ai.holdT <= 0) ai.hold = null;
    }
    if (f.move || f.stun > 0 || f.down > 0 || f.y > 0) {
      if (f.y > 0 && !f.move && dist < 1.8 && Math.random() < 0.08) startMove(f, 'akick');
      return;
    }
    ai.t -= dt;
    if (ai.t > 0) return;
    ai.t = A.react * (1.3 - f.level * 0.1) * (0.7 + Math.random() * 0.6);
    const threat = (o.move && MOVES[o.move].dmg && o.moveT < MOVES[o.move].st + MOVES[o.move].act) || projs.some((p) => p.owner === o && Math.abs(p.x - f.x) < 3.2);
    const r = Math.random();
    if (threat && r < A.block * lvl) { const low = o.move && MOVES[o.move].lvl === 'low'; ai.hold = low ? 'cblock' : 'block'; ai.holdT = 0.35; return; }
    if (o.y > 0.5 && dist < 2.6 && r < A.up * lvl) return startMove(f, 'up');
    if (f.meter >= 100 && dist < 2.2 && r < 0.4) return startMove(f, 'super');
    if (dist > 3.4) {
      if (r < A.proj * lvl && !projs.some((p) => p.owner === f)) return startMove(f, 'proj');
      if (r < A.proj + A.jumpIn) { f.vy = f.def.jump; f.y = 0.01; f.vx = Math.sign(dx) * 3.4; return; }
      ai.hold = 'fwd'; ai.holdT = 0.3 + Math.random() * 0.4; return;
    }
    if (dist < 1.7) {
      if (r < A.aggro * lvl) {
        const rr = Math.random();
        if (rr < A.low) startMove(f, Math.random() < 0.5 ? 'sweep' : 'cjab');
        else startMove(f, Math.random() < 0.55 ? 'jab' : 'kick');
        return;
      }
      ai.hold = Math.random() < 0.5 ? 'block' : 'back'; ai.holdT = 0.3; return;
    }
    if (r < A.aggro) { ai.hold = 'fwd'; ai.holdT = 0.25; } else if (r < A.aggro + 0.15) startMove(f, 'kick');
  }

  // ---------------------------------------------------------------
  // golpes acertando
  // ---------------------------------------------------------------
  function tryHit(f) {
    const m = MOVES[f.move], o = other(f);
    if (f.hitDone || !m.dmg) return;
    const lo = f.x + f.face * 0.1, hi = f.x + f.face * (m.range * f.def.scale + 0.1);
    const ox0 = o.x - 0.35, ox1 = o.x + 0.35;
    const xHit = Math.min(lo, hi) < ox1 && Math.max(lo, hi) > ox0;
    const yHit = Math.abs((o.y + 1) - (f.y + 1)) < 1.6;
    if (!xHit || !yHit || o.inv > 0 || o.down > 0) return;
    f.hitDone = f.move !== 'super';
    applyHit(f, o, m, m.dmg, f.move === 'super' ? 'super' : 'melee');
  }
  function applyHit(f, o, m, dmg, kind) {
    const blocked = o.blocking && !o.move && o.stun <= 0 && o.y === 0 &&
      (m.lvl === 'mid' || (m.lvl === 'low' && o.crouch) || (m.lvl === 'over' && !o.crouch)) && kind !== 'super';
    const mid = V((f.x + o.x) / 2 + f.face * 0.3, (f.y + o.y) / 2 + 1.4, 0.5);
    if (blocked) {
      o.blockStun = m.bs; o.vx = f.face * m.push * 5; o.hp -= kind === 'proj' ? dmg * 0.1 : 0;
      o.stats.blocks++;
      Sfx.raw.tone(700, 0.05, 'square', 0.06); Sfx.raw.noiseHit(3000, 3, 0.05, 0.2);
      A2M.firework(scene, mid, [0x80c0ff, 0xffffff], 8, 3);
      f.meter = Math.min(100, f.meter + m.meter * 0.4);
      return;
    }
    // armadura do Torresmo: aguenta 1 golpe durante o próprio ataque pesado
    if (o.def.armor && o.move && ['kick', 'sweep', 'up', 'super'].includes(o.move) && o.armorHit < 1 && kind !== 'super') {
      o.armorHit++; o.hp -= dmg * 0.6; o.p.flash(0x664400); setTimeout(() => o.p.flash(0), 80); Sfx.raw.tone(200, 0.1, 'square', 0.1); return;
    }
    if (tut && o.cpu) o.hp = Math.max(o.def.hp * 0.3, o.hp - dmg); else o.hp -= dmg;
    o.move = null; o.stun = m.hs; o.armorHit = 0;
    o.vx = f.face * m.push * 6;
    if (m.knock || (o.y > 0)) { o.knock = true; o.vy = 7; o.y = Math.max(o.y, 0.05); o.vx = f.face * 3.5; }
    f.meter = Math.min(100, f.meter + m.meter); o.meter = Math.min(100, o.meter + m.meter * 0.6);
    f.stats.hits++;
    hitstop = kind === 'super' ? 0.12 : 0.06; shake = kind === 'super' ? 0.6 : 0.2;
    o.p.flash(0x992222); setTimeout(() => o.p.flash(0), 70);
    Sfx.shoot('punch');
    A2M.firework(scene, mid, [0xffffff, 0xffd040, f.def.projColor], kind === 'super' ? 40 : 14, kind === 'super' ? 7 : 4);
    if (kind === 'super') { World.flash(0.3); setTimeout(() => World.flash(0), 60); }
  }

  function spawnProj(f) {
    const big = f.def === D3.FIGHTERS.kwan;
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.4 : 0.28, 7, 5), K.basic({ color: f.def.projColor }));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.7 : 0.5, 7, 5), new THREE.MeshBasicMaterial({ color: f.def.projColor, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(core); g.add(glow);
    g.position.set(f.x + f.face * 0.9, 1.45 * f.def.scale, 0.2);
    scene.add(g);
    projs.push({ owner: f, x: g.position.x, y: g.position.y, vx: f.face * (big ? 5 : 7.5), g, dmg: 85, life: 3 });
    Sfx.shoot('estilingue'); Sfx.raw.tone(300, 0.25, 'sawtooth', 0.08, null, null, 700);
    big && Sfx.raw.noiseHit(1500, 1, 0.4, 0.2);
  }

  // ---------------------------------------------------------------
  // poses
  // ---------------------------------------------------------------
  function pose(f) {
    const p = f.p, m = f.move ? MOVES[f.move] : null;
    p.root.position.set(0, 0, 0); p.root.rotation.set(0, 0, 0);
    p.head.rotation.set(0, 0, 0);
    p.armL.rotation.set(0, 0, 0); p.armR.rotation.set(0, 0, 0); p.legL.rotation.set(0, 0, 0); p.legR.rotation.set(0, 0, 0);
    const guard = () => { p.armL.rotation.x = -1.35; p.armR.rotation.x = -1.0; p.armL.rotation.z = 0.25; p.armR.rotation.z = -0.25; };
    const crouchPose = () => { p.root.position.y = -0.45; p.legL.rotation.x = -1.4; p.legR.rotation.x = -0.6; };
    if (f.hp <= 0 || f.ko) { p.root.rotation.x = -Math.PI / 2 * Math.min(1, f.koT * 3); p.root.position.y = 0.2; return; }
    if (phase === 'win' && f === winner) { p.armL.rotation.x = p.armR.rotation.x = -3; p.root.position.y = Math.abs(Math.sin(t * 6)) * 0.2; return; }
    if (f.down > 0) { p.root.rotation.x = -Math.PI / 2; p.root.position.y = 0.2; return; }
    if (f.knock) { p.root.rotation.x = -0.8; p.armL.rotation.x = p.armR.rotation.x = -2.5; return; }
    if (f.stun > 0) { p.root.rotation.x = -0.3; p.head.rotation.x = -0.4; p.armL.rotation.x = -0.4; p.armR.rotation.x = -0.2; return; }
    if (f.blockStun > 0 || (f.blocking && !f.move && isBlockingVisible(f))) {
      if (f.crouch) crouchPose();
      p.armL.rotation.x = -2.2; p.armR.rotation.x = -2.0; p.armL.rotation.z = 0.5; p.armR.rotation.z = -0.5; p.root.rotation.x = -0.12; return;
    }
    if (m) {
      const k = f.moveT < m.st ? f.moveT / m.st : f.moveT < m.st + m.act ? 1 : Math.max(0, 1 - (f.moveT - m.st - m.act) / m.rec);
      if (m.pose === 'punch') { guard(); p.armR.rotation.x = -1.57 * k - 0.0; p.armR.rotation.z = 0; p.root.rotation.y = -0.4 * k; }
      if (m.pose === 'cpunch') { crouchPose(); guard(); p.armR.rotation.x = -1.57 * k; p.armR.rotation.z = 0; }
      if (m.pose === 'kick') { guard(); p.legR.rotation.x = -1.6 * k; p.root.rotation.x = 0.25 * k; p.root.rotation.y = -0.3 * k; }
      if (m.pose === 'sweep') { crouchPose(); p.legR.rotation.x = -1.5 * k; p.legR.rotation.z = 0; p.root.rotation.y = -0.8 * k; p.armL.rotation.x = -0.6; }
      if (m.pose === 'apunch') { p.legL.rotation.x = -1; p.legR.rotation.x = -0.6; p.armR.rotation.x = -1.2 * k - 0.4; }
      if (m.pose === 'akick') { p.legL.rotation.x = -1.2; p.legR.rotation.x = -1.3 * k; p.armL.rotation.x = -1; }
      if (m.pose === 'proj') { p.armL.rotation.x = p.armR.rotation.x = -1.57 * k; p.armL.rotation.z = -0.15; p.armR.rotation.z = 0.15; p.root.rotation.x = 0.15 * k; p.legL.rotation.x = 0.3; p.legR.rotation.x = -0.4; }
      if (m.pose === 'up') {
        if (f.def === D3.FIGHTERS.couve || f.def === D3.FIGHTERS.son) { p.root.rotation.y = f.moveT * 22; p.legR.rotation.x = -1.5; p.armL.rotation.z = 1.2; p.armR.rotation.z = -1.2; }
        else { p.armR.rotation.x = -3.0 * k; p.legL.rotation.x = -1.2 * k; p.root.rotation.x = 0.2; }
      }
      if (m.pose === 'super') { p.armL.rotation.x = p.armR.rotation.x = -1.57; p.root.rotation.x = 0.3; p.legR.rotation.x = -0.8 * Math.sin(f.moveT * 30); p.legL.rotation.x = 0.8 * Math.sin(f.moveT * 30); }
      return;
    }
    if (f.y > 0) { p.legL.rotation.x = -1.0; p.legR.rotation.x = -0.5; guard(); return; }
    if (f.crouch) { crouchPose(); guard(); return; }
    guard();
    if (f.def === D3.FIGHTERS.couve) { // ginga da capoeira
      const g = Math.sin(t * 4);
      p.root.position.x = g * 0.25; p.legL.rotation.x = g * 0.7; p.legR.rotation.x = -g * 0.5; p.armL.rotation.x = -1.2 - g * 0.6; p.armR.rotation.x = -0.6 + g * 0.6;
      return;
    }
    p.root.position.y = Math.sin(t * 7 + f.x) * 0.035;
    p.legL.rotation.x = 0.3; p.legR.rotation.x = -0.3;
    if (f.walking) { const w = Math.sin(t * 12) * 0.5; p.legL.rotation.x = w; p.legR.rotation.x = -w; }
  }
  function isBlockingVisible(f) { const o = other(f); return (o.move && MOVES[o.move].dmg) || projs.some((p) => p.owner === o && Math.abs(p.x - f.x) < 3); }

  // ---------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------
  function big(text, ms, color) {
    const b = $('#fightBig'); b.textContent = text; b.style.color = color || '';
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(big.t); big.t = setTimeout(() => b.classList.remove('show'), ms || 1200);
  }
  function hud() {
    F.forEach((f, i) => {
      f.shownHp += (f.hp - f.shownHp) * 0.08;
      const s = i ? 'R' : 'L';
      $('#fh' + s).style.width = Math.max(0, f.hp / f.def.hp * 100) + '%';
      $('#fhT' + s).style.width = Math.max(0, f.shownHp / f.def.hp * 100) + '%';
      $('#fm' + s).style.width = f.meter + '%';
      $('#fm' + s).classList.toggle('full', f.meter >= 100);
      $('#fn' + s).textContent = f.def.name;
      $('#fw' + s).textContent = '●'.repeat(f.wins) + '○'.repeat(Math.max(0, 2 - f.wins));
    });
    $('#fTimer').textContent = tut ? '∞' : Math.max(0, Math.ceil(timer));
  }

  // ---------------------------------------------------------------
  // loop
  // ---------------------------------------------------------------
  let winner = null;
  function resetRound() {
    F.forEach((f, i) => {
      f.x = (i ? 1 : -1) * 2.4; f.y = 0; f.vy = 0; f.vx = 0; f.hp = f.def.hp; f.shownHp = f.hp; f.move = null; f.stun = 0; f.blockStun = 0;
      f.knock = false; f.down = 0; f.ko = false; f.koT = 0; f.inv = 0; f.face = i ? -1 : 1;
    });
    projs.forEach((p) => scene.remove(p.g)); projs = [];
    timer = 60; winner = null;
  }

  function update(dt) {
    if (!running) return;
    t += dt;
    if (hitstop > 0) { hitstop -= dt; dt = 0; }
    dt *= slow;
    phaseT += dt;
    if (scene.userData.tram) scene.userData.tram.position.x = -30 + ((t * 2) % 60);
    if (scene.userData.beams) scene.userData.beams.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.7 + i) * 0.5; });
    if (crowd) crowd.userData.update(t, phase === 'ko' || phase === 'win' || shake > 0.3);
    if (rain) { const a = rain.geometry.attributes.position.array; for (let i = 1; i < a.length; i += 3) { a[i] -= dt * 18; if (a[i] < 0) a[i] = 14; } rain.geometry.attributes.position.needsUpdate = true; }

    const fighting = phase === 'fight';
    if (fighting && !tut) { timer -= dt; if (timer <= 0) endRound(F[0].hp / F[0].def.hp >= F[1].hp / F[1].def.hp ? F[0] : F[1], true); }

    F.forEach((f) => {
      f.inv = Math.max(0, f.inv - dt);
      f.walking = false;
      const px = f.x;
      if (fighting && !A3.busy()) { if (f.cpu) aiInput(f, dt); else playerInput(f, dt); }
      f.walking = Math.abs(f.x - px) > 0.001 && f.y === 0;
      if (f.stun > 0) f.stun -= dt;
      if (f.blockStun > 0) f.blockStun -= dt;
      if (f.down > 0) { f.down -= dt; if (f.down <= 0) f.inv = 0.4; }
      if (f.move) {
        const m = MOVES[f.move];
        f.moveT += dt;
        if (m.spawn && f.moveT >= m.st && !f.hitDone) { f.hitDone = true; spawnProj(f); }
        if (m.dash && f.moveT > m.st && f.moveT < m.st + m.act) { f.x += f.face * m.dash * dt; if (Math.floor(f.moveT * 10) !== Math.floor((f.moveT - dt) * 10)) f.hitDone = false; }
        if (f.moveT >= m.st && f.moveT <= m.st + m.act) tryHit(f);
        if (f.moveT >= m.st + m.act + m.rec && !(m.air && f.y > 0)) { f.move = null; f.armorHit = 0; }
      }
      // física
      if (f.y > 0 || f.vy > 0) {
        f.vy -= GRAV * dt; f.y += f.vy * dt; f.x += f.vx * dt;
        if (f.y <= 0) {
          f.y = 0; f.vy = 0; f.vx = 0;
          if (f.knock) { f.knock = false; f.down = f.hp > 0 ? 0.6 : 0; Sfx.raw.tone(70, 0.2, 'sine', 0.4, null, null, 40); shake = Math.max(shake, 0.25); }
          if (f.move && MOVES[f.move].air) f.move = null;
        }
      } else if (Math.abs(f.vx) > 0.01) { f.x += f.vx * dt; f.vx *= Math.pow(0.0008, dt); }
      f.x = Math.max(STAGE_L, Math.min(STAGE_R, f.x));
      if (f.hp <= 0 && !f.ko && phase === 'fight') { f.ko = true; f.koT = 0; endRound(other(f)); }
      if (f.ko) f.koT += dt;
    });
    // virar de frente e separar
    const [a, b] = F;
    if (a.y === 0 && !a.move) a.face = Math.sign(b.x - a.x) || a.face;
    if (b.y === 0 && !b.move) b.face = Math.sign(a.x - b.x) || b.face;
    const gap = b.x - a.x;
    if (Math.abs(gap) < 0.75 && a.y < 1 && b.y < 1) { const push = (0.75 - Math.abs(gap)) / 2 * Math.sign(gap || 1); a.x -= push; b.x += push; }
    if (Math.abs(b.x - a.x) > MAX_GAP) { const mid = (a.x + b.x) / 2, s = Math.sign(b.x - a.x); a.x = mid - s * MAX_GAP / 2; b.x = mid + s * MAX_GAP / 2; }

    // projéteis
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i];
      p.x += p.vx * dt; p.life -= dt;
      p.g.position.x = p.x; p.g.rotation.y += dt * 8;
      let dead = p.life <= 0 || p.x < STAGE_L - 3 || p.x > STAGE_R + 3;
      const o = other(p.owner);
      if (!dead && Math.abs(p.x - o.x) < 0.5 && o.y < 1.6 && o.inv <= 0 && o.down <= 0 && !o.ko) {
        applyHit(p.owner, o, { lvl: 'mid', hs: 0.35, bs: 0.2, push: 0.6, meter: 8, knock: false }, p.dmg, 'proj'); dead = true;
      }
      for (const q of projs) if (q !== p && q.owner !== p.owner && Math.abs(q.x - p.x) < 0.5) { q.life = 0; dead = true; A2M.firework(scene, p.g.position, [0xffffff], 20, 4); }
      if (dead) { scene.remove(p.g); projs.splice(i, 1); }
    }

    F.forEach((f) => {
      pose(f);
      f.p.g.position.set(f.x, f.y, 0);
      f.p.g.rotation.y = f.face > 0 ? Math.PI / 2 : -Math.PI / 2;
    });

    // câmera
    const mid = (a.x + b.x) / 2, spread = Math.abs(b.x - a.x);
    const cx = Math.max(-3.5, Math.min(3.5, mid));
    const dist = 9.5 + Math.max(0, spread - 3) * 0.6;
    cam.position.set(cx + (Math.random() - 0.5) * shake * 0.3, 2.2 + (Math.random() - 0.5) * shake * 0.3, dist);
    cam.lookAt(cx, 1.5, 0);
    shake = Math.max(0, shake - dt * 2);

    if (tut) tutorialTick(dt);
    hud();
  }

  // ---------------------------------------------------------------
  // rounds
  // ---------------------------------------------------------------
  async function endRound(w, timeout) {
    if (phase !== 'fight') return;
    phase = 'ko';
    winner = w;
    w.wins++;
    slow = 0.25;
    Sfx.boom(1);
    big(timeout ? 'TEMPO!' : 'K.O.!', 1600, '#ff4030');
    await A3.wait(1700);
    slow = 1;
    const loserHp = other(w).hp;
    phase = 'win';
    big(w.cpu ? `${w.def.short} VENCE` : (w.hp >= w.def.hp ? 'PERFEITO!' : `${w.def.short} VENCE`), 1600, w.def.color);
    await A3.wait(1800);
    if (w.wins >= 2) { finish(!w.cpu); return; }
    round++;
    resetRound();
    await roundIntro();
    void loserHp;
  }
  async function roundIntro() {
    phase = 'intro';
    big(round === 3 ? 'ROUND FINAL' : `ROUND ${round}`, 1100);
    Sfx.raw.tone(440, 0.2, 'square', 0.08); Sfx.raw.tone(660, 0.3, 'square', 0.08, null, Sfx.raw.now() + 0.2);
    await A3.wait(1200);
    big('LUTEM!', 800, '#ffd040');
    Sfx.gong();
    phase = 'fight';
    phaseT = 0;
  }
  function finish(won) {
    running = false;
    $('#fightHud').classList.add('hidden');
    A3.hint('');
    const r = resolveRun; resolveRun = null;
    r && r({ won });
  }

  // ---------------------------------------------------------------
  // modo treino
  // ---------------------------------------------------------------
  function tutorialTick(dt) {
    const s = F[0].stats, step = D3.TUTORIAL[tut.step];
    if (!step) return;
    let ok = false;
    if (step.test === 'move') ok = s.moved.l > 0.4 && s.moved.r > 0.4 && s.moved.j > 0;
    if (step.test === 'hit') ok = s.hits >= 4;
    if (step.test === 'block') ok = s.blocks >= 3;
    if (step.test === 'proj') ok = s.proj >= 1;
    if (step.test === 'up') ok = s.up >= 1;
    if (step.test === 'super') { if (!tut.filled) { F[0].meter = 100; tut.filled = true; } ok = s.super >= 1; }
    if (ok && !tut.wait) {
      tut.wait = true;
      Sfx.keyGet();
      const mem = D3.SCRIPT.treinoMemoria[tut.step];
      UI.toast('🧠 ' + mem, 'gold', 5000);
      setTimeout(() => {
        tut.step++; tut.wait = false; s.hits = 0; s.blocks = 0;
        const nx = D3.TUTORIAL[tut.step];
        if (nx) { A3.hint(`${nx.text}  —  ${nx.tip}`); big(`LIÇÃO ${tut.step + 1}`, 900); }
        else { A3.hint(''); finish(true); }
      }, 1600);
    }
  }

  // ---------------------------------------------------------------
  // API
  // ---------------------------------------------------------------
  function run(o) {
    K = World.kit; UI = window.GameUI;
    opts = o;
    if (scene) scene.traverse((m) => { if (m.geometry) m.geometry.dispose(); });
    buildStage(o.stage, o.rain);
    F = [mkFighter(o.p1, -1, false), mkFighter(o.cpu, 1, true, o.level || 0)];
    projs = []; round = 1; t = 0; hitstop = 0; slow = 1;
    tut = o.tutorial ? { step: 0, wait: false } : null;
    resetRound();
    A3.setView(scene, cam, update);
    $('#fightHud').classList.remove('hidden');
    $('#fightTitle').textContent = o.title || '';
    running = true;
    hud();
    phase = 'intro';
    return new Promise((res) => {
      resolveRun = res;
      (async () => {
        if (o.before) await o.before({ F, cam });
        if (tut) { phase = 'fight'; A3.hint(`${D3.TUTORIAL[0].text}  —  ${D3.TUTORIAL[0].tip}`); big('TREINO', 1000); }
        else roundIntro();
      })();
    });
  }

  function stop() { running = false; $('#fightHud').classList.add('hidden'); A3.hint(''); }

  return { run, stop, debug: () => ({ F, phase, tut }) };
})();
