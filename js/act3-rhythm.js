// =====================================================================
//  ARROZ DOURADO — ATO III · CAPÍTULO 4: o show do Réveillon (ritmo)
//  música e notas saem da mesma partitura, então estão sempre em sincronia
// =====================================================================

const Rhythm = (() => {
  const D3 = DATA3;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const $ = (s) => document.querySelector(s);
  const LANES = 4, LANE_W = 1.25, HWY_LEN = 46;
  const COLORS = [0x30d050, 0xff3030, 0xffd020, 0x3080ff];
  const KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
  const ALT = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
  const WIN = { perfect: 0.05, good: 0.09, ok: 0.135 };

  let K, UI;
  let scene, cam, hwy, frets = [], gems = [], song = null, notes = [], startT = 0, running = false, resolveRun = null;
  let score = 0, combo = 0, maxCombo = 0, hits = 0, total = 0, memory = 0.5, ks = 0, ksOn = false, ksEnd = 0;
  let attack = null, nextAttack = 0, schedNext = 0, schedStep = 0, finished = false, judgeT = 0, laneDown = [false, false, false, false];
  let band = {}, crowd = null, mei = null, frig = null, beatLen = 0.5, speed = 14, mirror = false, ghosts = null;
  let countdownShown = -1;

  // ---------------------------------------------------------------
  // partituras
  // ---------------------------------------------------------------
  const MAJ_PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const MIN_PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
  function buildChart(def) {
    const rnd = K.rng(def.id.length * 97 + def.bars);
    const out = [];
    const scale = def.style === 'metal' ? MIN_PENTA : MAJ_PENTA;
    const push = (b, semi, len, gold) => out.push({ b, semi, len: len || 0, gold: !!gold });
    if (def.style === 'final') {
      // A Canção da Mimi: o tema da caixinha, cada vez mais cheio
      const theme = D3.MIMI_THEME;
      for (let rep = 0; rep < Math.floor((def.bars - 2) / 8); rep++) {
        const off = 8 + rep * 32;
        const gold = rep === 2 || rep === 4;
        theme.forEach(([b, s, d], i) => {
          push(off + b, s, d >= 3 ? d - 0.5 : 0, gold && i < 13);
          if (rep >= 2 && d === 1 && i % 2 === 1 && rep !== 5) push(off + b + 0.5, s + (i % 4 === 1 ? 2 : -3), 0); // floreios
          if (rep >= 4 && i % 4 === 0) push(off + b, s + 7, 0); // acordes
        });
      }
    } else {
      // melodia gerada: frases de 2 compassos, densidade cresce durante a música
      let deg = 2;
      for (let bar = 2; bar < def.bars - 1; bar++) {
        const section = bar / def.bars;
        const dens = def.style === 'metal' ? (section < 0.25 ? 0.55 : section < 0.7 ? 0.8 : 0.95) : (section < 0.3 ? 0.45 : section < 0.7 ? 0.65 : 0.8);
        const gold = bar % 8 === 6 || bar % 8 === 7;
        const sub = def.style === 'metal' ? 0.5 : 0.5;
        for (let s = 0; s < 4; s += sub) {
          const onBeat = s % 1 === 0;
          if (rnd() > (onBeat ? dens + 0.15 : dens * 0.6)) continue;
          deg += Math.floor(rnd() * 5) - 2;
          deg = Math.max(0, Math.min(scale.length - 1, deg));
          const hold = onBeat && rnd() < 0.08 && s <= 2;
          push(bar * 4 + s, scale[deg], hold ? 1.5 : 0, gold);
          if (def.style === 'metal' && section > 0.5 && onBeat && rnd() < 0.18) push(bar * 4 + s, scale[Math.min(scale.length - 1, deg + 2)], 0, gold);
          if (hold) s += 1.5;
        }
      }
    }
    // pitch → pista (mantém o desenho da melodia)
    const uniq = [...new Set(out.map((n) => n.semi))].sort((a, b) => a - b);
    out.forEach((n) => { n.lane = uniq.indexOf(n.semi) % LANES; });
    // tira notas na mesma pista e mesmo tempo
    const seen = new Set();
    return out.filter((n) => { const k = n.b + ':' + n.lane; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.b - b.b);
  }

  // ---------------------------------------------------------------
  // som
  // ---------------------------------------------------------------
  const R = () => Sfx.raw;
  const PROG = { pagode: [[0, 4, 7, 9], [9, 13, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]], metal: [[2, 9, 14], [-2, 5, 10], [0, 7, 12], [-3, 4, 9]], final: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]] };
  function freq(semi, oct) { return 261.63 * Math.pow(2, (semi + (song.key || 0)) / 12) * (oct || 1); }
  function leadSound(n, when) {
    const r = R(), f = freq(n.semi, song.style === 'metal' ? 1 : 2);
    if (song.style === 'metal') {
      const ctx = r.ctx(); if (!ctx) return;
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const d = r.dist(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.07, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + beatLen * (n.len || 0.5) + 0.1);
      o.connect(d); d.connect(lp); lp.connect(g); g.connect(r.sfx()); o.start(when); o.stop(when + beatLen * (n.len || 0.5) + 0.15);
    } else if (song.style === 'final') {
      r.tone(f, beatLen * Math.max(0.9, n.len || 0), 'triangle', 0.08, null, when);
      r.tone(f * 2, 0.25, 'sine', 0.03, null, when);
    } else {
      r.tone(f, Math.max(0.18, beatLen * (n.len || 0.4)), 'triangle', 0.08, null, when);
      r.tone(f * 1.5, 0.12, 'triangle', 0.025, null, when);
    }
  }
  function missSound() { R().noiseHit(300, 2, 0.12, 0.25, null, null, 'lowpass'); R().tone(110, 0.1, 'square', 0.05); }
  function schedule() {
    const r = R(); if (!r.ctx()) return;
    const step = beatLen / 4;
    while (startT + schedStep * step < r.now() + 0.25) {
      const tt = startT + schedStep * step, s = schedStep % 16, bar = Math.floor(schedStep / 16);
      if (bar >= song.bars) break;
      const ch = PROG[song.style][bar % 4];
      const bus = null;
      if (song.style === 'pagode') {
        if (s === 0) r.tone(65, 0.25, 'sine', 0.3, bus, tt, 50);
        if (s === 8) r.tone(58, 0.45, 'sine', 0.5, bus, tt, 45);
        r.noiseHit(7000, 1.5, 0.03, s % 4 === 0 ? 0.18 : 0.07, bus, tt, 'highpass');
        if ([0, 3, 6, 10, 12].includes(s)) ch.forEach((c, i) => r.tone(freq(c, 1), 0.12, 'triangle', 0.025, bus, tt + i * 0.008));
        if ([0, 6, 10].includes(s)) r.tone(freq(ch[0], 0.25), 0.25, 'triangle', 0.12, bus, tt);
        if ([2, 5, 7, 11, 14].includes(s)) r.tone(900, 0.04, 'square', 0.035, bus, tt);
      } else if (song.style === 'metal') {
        if (s % 4 === 0 || s === 14 || (bar > song.bars * 0.5 && s % 2 === 0)) r.tone(55, 0.12, 'sine', 0.55, bus, tt, 38);
        if (s === 4 || s === 12) { r.noiseHit(1800, 0.8, 0.14, 0.3, bus, tt); r.tone(190, 0.08, 'triangle', 0.12, bus, tt, 120); }
        if (s % 2 === 0) r.noiseHit(9000, 1, 0.02, 0.06, bus, tt, 'highpass');
        if (s % 2 === 0) { const ctx = r.ctx(); [1, 1.5].forEach((k) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq(ch[0], 0.25) * k; const d = r.dist(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.045, tt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tt + step * 1.8); o.connect(d); d.connect(lp); lp.connect(g); g.connect(r.sfx()); o.start(tt); o.stop(tt + step * 2); }); }
        if (s === 0 && bar % 2 === 0) [0, 7].forEach((c) => r.tone(freq(ch[0] + c, 2), beatLen * 7, 'sawtooth', 0.012, bus, tt)); // erhu do Kwan
      } else {
        // final: caixinha → banda → o Rio inteiro cantando
        const lvl = bar < 10 ? 0 : bar < 26 ? 1 : bar < 42 ? 2 : 3;
        if (s === 0) ch.forEach((c) => r.tone(freq(c, 0.5), beatLen * 3.8, 'sine', 0.035 + lvl * 0.01, bus, tt));
        if (lvl >= 1) { if (s === 0 || s === 8) r.tone(60, 0.3, 'sine', 0.35, bus, tt, 45); if (s === 4 || s === 12) r.noiseHit(1800, 0.8, 0.12, 0.18 + lvl * 0.05, bus, tt); r.noiseHit(7000, 1.5, 0.02, 0.05, bus, tt, 'highpass'); }
        if (lvl >= 2 && [0, 3, 6, 10, 12].includes(s)) ch.forEach((c) => r.tone(freq(c, 1), 0.12, 'triangle', 0.02, bus, tt));
        if (lvl >= 2 && s % 4 === 0) r.tone(freq(ch[0], 0.25), beatLen * 0.9, 'triangle', 0.1, bus, tt);
        if (lvl >= 3 && s === 0) ch.forEach((c) => [1, 1.005].forEach((dt) => r.tone(freq(c, 1) * dt, beatLen * 4, 'sawtooth', 0.012, bus, tt))); // coro da praia
      }
      schedStep++;
    }
  }

  // ---------------------------------------------------------------
  // palco: Copacabana à meia-noite
  // ---------------------------------------------------------------
  function buildScene() {
    const { lam, basic, box, cyl, canvasTex } = K;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060f);
    scene.fog = new THREE.Fog(0x0a0a1a, 40, 220);
    scene.add(new THREE.AmbientLight(0x8090c0, 0.6));
    const key = new THREE.DirectionalLight(0xffe0c0, 0.6); key.position.set(0, 20, 20); scene.add(key);
    // mar e areia
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(800, 400, 20, 10), lam({ color: 0x0a1a3a })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1, -220); scene.add(sea);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(800, 100), lam({ color: 0xc8b890 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, -0.9, -40); scene.add(sand);
    // palco
    const stg = box(36, 2, 12, lam({ color: 0x1a1a24 })); stg.position.set(0, 0.1, -48); scene.add(stg);
    const truss = lam({ color: 0x888899 });
    [-17, 17].forEach((x) => { const p = box(0.6, 16, 0.6, truss); p.position.set(x, 8, -52); scene.add(p); });
    const top = box(35, 0.6, 0.6, truss); top.position.set(0, 16, -52); scene.add(top);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(24, 11), basic({ map: K.textCanvas(256, 128, '#100820', [{ t: 'RÉVEILLON', y: 40, c: '#ffd040', f: 'bold 34px monospace' }, { t: 'COPACABANA', y: 78, c: '#fff', f: 'bold 26px monospace' }, { t: '2026 → 2027', y: 108, c: '#ff60c0', f: 'bold 16px monospace' }]) }));
    screen.position.set(0, 9.5, -53.5); scene.add(screen);
    scene.userData.beams = [];
    for (let i = 0; i < 6; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 26, 8, 1, true), new THREE.MeshBasicMaterial({ color: [0xffd040, 0xff40a0, 0x40c0ff][i % 3], transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const piv = new THREE.Group(); piv.position.set(-15 + i * 6, 16, -52); cone.position.y = -13; piv.add(cone); scene.add(piv); scene.userData.beams.push(piv);
    }
    // a banda
    const put = (kind, x, z, ry) => { const p = A3.person(kind); p.g.position.set(x, 1.1, z); p.g.rotation.y = ry || 0; scene.add(p.g); return p; };
    band.jinlong = put('jinlong', -3, -45); band.son = put('son', 3, -45);
    band.couve = put('couve', -9, -47); band.vinagrete = put('vinagrete', 9, -47); band.torresmo = put('torresmo', -13, -49); band.kwan = put('kwanBurnt', 13, -49); band.well = put('wellington', 0, -49.5);
    band.torresmo.g.scale.setScalar(1.3);
    const guitar = (p, c) => { const g = box(0.25, 0.9, 0.08, lam({ color: c })); g.position.set(0, 1.25, 0.25); g.rotation.z = 0.9; p.root.add(g); const n = box(0.06, 0.8, 0.04, lam({ color: 0x3a2010 })); n.position.set(0.45, 1.6, 0.25); n.rotation.z = 0.9; p.root.add(n); };
    guitar(band.jinlong, 0xd02020); guitar(band.son, 0x2a8a3a);
    const drum = cyl(0.5, 0.5, 0.7, 10, lam({ color: 0xe0e0e0 })); drum.position.set(-13, 1.6, -48.2); scene.add(drum);
    // multidão de branco
    crowd = A2M.mkCrowd(150, 6, 25, 1.3, [0xffffff, 0xf4f4f4, 0xe8e8f0, 0xfff4e0]);
    crowd.position.set(0, -0.9, -36); crowd.rotation.y = Math.PI; scene.add(crowd);
    // Dona Mei na frigideira gigante sobre o mar
    // a frigideira gigante flutua no céu, acima do palco, sustentada pela farofa
    frig = new THREE.Group(); frig.position.set(0, 30, -170); frig.rotation.x = 0.25; frig.userData.baseY = 30; scene.add(frig);
    const pan = cyl(14, 11, 2.5, 16, lam({ color: 0x5a5a62, emissive: 0x1a1408, fog: false })); frig.add(pan);
    const handle = box(22, 1.5, 2, lam({ color: 0x2a2a2a, fog: false })); handle.position.set(22, 0.5, 0); frig.add(handle);
    const far = new THREE.Mesh(new THREE.CircleGeometry(12, 16), basic({ color: 0xe8b040, fog: false })); far.rotation.x = -Math.PI / 2; far.position.y = 1.3; frig.add(far);
    mei = A3.person('meiAngry'); mei.g.scale.setScalar(3); mei.g.position.y = 1.3; mei.g.rotation.y = 0.3; frig.add(mei.g);
    mei.mats.forEach((m) => m.emissive && m.emissive.setHex(0x4a3410)); // iluminada pela farofa dourada
    mei.mats.forEach((m) => (m.fog = false));
    const aura = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); aura.position.y = 4; frig.add(aura); frig.userData.aura = aura;
    frig.add(new THREE.PointLight(0xffb040, 3, 80, 1.2));
    // estrada de notas
    buildHighway();
    cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 600);
    cam.position.set(0, 4.2, 5.2); cam.lookAt(0, 0.5, -14);
  }

  function buildHighway() {
    const { lam, basic, canvasTex } = K;
    hwy = new THREE.Group(); scene.add(hwy);
    const tex = canvasTex(64, 64, (g) => {
      g.fillStyle = '#0c0a14'; g.fillRect(0, 0, 64, 64);
      for (let i = 1; i < 4; i++) { g.fillStyle = '#3a3448'; g.fillRect(i * 16 - 1, 0, 2, 64); }
      g.fillStyle = '#5a5470'; g.fillRect(0, 0, 64, 2);
      g.fillStyle = '#d0a040'; g.fillRect(0, 0, 2, 64); g.fillRect(62, 0, 2, 64);
    });
    tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, HWY_LEN / 3);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(LANES * LANE_W, HWY_LEN), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -HWY_LEN / 2 + 1.5); hwy.add(road);
    hwy.userData.tex = tex; hwy.userData.road = road;
    frets = [];
    for (let l = 0; l < LANES; l++) {
      const x = (l - 1.5) * LANE_W;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 4, 14), basic({ color: COLORS[l] })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.05, 0); hwy.add(ring);
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.4, 14), new THREE.MeshBasicMaterial({ color: COLORS[l], transparent: true, opacity: 0.15 })); pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.04, 0); hwy.add(pad);
      frets.push({ ring, pad, x });
    }
    const line = new THREE.Mesh(new THREE.BoxGeometry(LANES * LANE_W + 0.4, 0.04, 0.06), basic({ color: 0xffffff })); line.position.set(0, 0.06, 0); hwy.add(line);
    // véu de farofa (ataque)
    const dust = new THREE.Mesh(new THREE.PlaneGeometry(LANES * LANE_W + 1, HWY_LEN * 0.65), new THREE.MeshBasicMaterial({ color: 0xc8a060, transparent: true, opacity: 0, depthWrite: false }));
    dust.rotation.x = -Math.PI / 2; dust.position.set(0, 0.4, -HWY_LEN * 0.65 / 2 - 4); hwy.add(dust); hwy.userData.dust = dust;
  }

  function gemMesh(n) {
    const g = new THREE.Group();
    const col = n.gold ? 0xffffff : COLORS[n.lane];
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 12), K.basic({ color: col }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.24, 12), K.basic({ color: n.gold ? 0xffd040 : 0xffffff }));
    g.add(body); g.add(cap);
    if (n.gold) { const glow = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(glow); }
    if (n.len) { const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 1), new THREE.MeshBasicMaterial({ color: COLORS[n.lane], transparent: true, opacity: 0.8 })); tail.position.y = 0.02; g.add(tail); g.userData.tail = tail; }
    g.userData.body = body;
    hwy.add(g);
    return g;
  }

  // ---------------------------------------------------------------
  // jogo
  // ---------------------------------------------------------------
  const now = () => R().now() - startT;
  const beatOf = (tt) => tt / beatLen;
  function laneX(l) { return ((mirror ? 3 - l : l) - 1.5) * LANE_W; }

  function judge(n, dt) {
    const a = Math.abs(dt);
    const q = a < WIN.perfect ? 'PERFEITO' : a < WIN.good ? 'BOM' : 'OK';
    n.hit = true; hits++;
    combo++; maxCombo = Math.max(maxCombo, combo);
    const mult = Math.min(4, 1 + Math.floor(combo / 10)) * (ksOn ? 2 : 1);
    score += (q === 'PERFEITO' ? 60 : q === 'BOM' ? 50 : 35) * mult;
    memory = Math.min(1, memory + (q === 'PERFEITO' ? 0.016 : 0.012) * (ksOn ? 1.6 : 1));
    leadSound(n, R().now());
    const f = frets[mirror ? 3 - n.lane : n.lane];
    f.pad.material.opacity = 0.9;
    A2M.firework(scene, hwy.localToWorld(V(f.x, 0.3, 0)), [COLORS[n.lane], 0xffffff], n.gold ? 20 : 10, 3);
    if (n.mesh) { n.mesh.userData.body.visible = false; if (!n.len) { hwy.remove(n.mesh); n.mesh = null; } }
    showJudge(q);
    if (n.gold) checkGold(n);
  }
  function miss(n) {
    n.missed = true; combo = 0;
    memory = Math.max(0, memory - (song.battle ? 0.024 : 0.015));
    missSound();
    showJudge('ERROU');
    if (n.gold) n.phraseBroken = true;
    notes.forEach((m) => { if (m.gold && m.phrase === n.phrase) m.phraseBroken = true; });
  }
  function checkGold(n) {
    const ph = notes.filter((m) => m.phrase === n.phrase);
    if (ph.every((m) => m.hit) && !ph.some((m) => m.phraseBroken)) { ks = Math.min(1, ks + 0.34); R().tone(1318, 0.3, 'square', 0.06); showJudge('FRASE DE OURO!'); }
  }
  function showJudge(q) {
    const el = $('#rJudge'); el.textContent = q; el.className = 'show ' + (q === 'ERROU' ? 'bad' : q === 'PERFEITO' || q.includes('OURO') ? 'gold' : '');
    judgeT = 0.5;
  }

  function onLane(l) {
    if (mirror) l = 3 - l;
    laneDown[l] = true;
    const tt = now();
    let best = null, bd = 1;
    for (const n of notes) {
      if (n.hit || n.missed || n.lane !== l) continue;
      const d = tt - n.t;
      if (d < -WIN.ok) break;
      if (Math.abs(d) <= WIN.ok && Math.abs(d) < bd) { best = n; bd = Math.abs(d); }
    }
    if (best) judge(best, tt - best.t);
    else { combo = 0; memory = Math.max(0, memory - 0.008); R().noiseHit(500, 3, 0.05, 0.1); }
  }

  function activateKS() {
    if (ksOn || ks < 0.5) return;
    ksOn = true; ksEnd = now() + ks * 16 * beatLen;
    ks = 0;
    Sfx.ksOn();
    World.flash(0.5); setTimeout(() => World.flash(0), 120);
    $('#rKS').classList.add('on');
    if (song.battle) {
      memory = Math.min(1, memory + 0.12);
      if (attack) { attack.end = now(); UI.toast('👑 O MODO KING SIZE espantou a farofa!', 'gold', 2000); }
      A2M.firework(scene, frig.position.clone().add(V(0, 12, 0)), [0xffd040, 0xffffff], 120, 16);
      UI.toast('👑 MODO KING SIZE: o ouro atinge a frigideira da Dona Mei!', 'gold', 2200);
    }
  }

  const ATTACKS = [
    { id: 'farofa', name: 'NUVEM DE FAROFA', desc: 'a pista some lá no fundo' },
    { id: 'espelho', name: 'ESPELHO DE ÓLEO', desc: 'as pistas trocam de lado' },
    { id: 'esquecer', name: 'ESQUECIMENTO', desc: 'as cores somem' },
    { id: 'tempestade', name: 'FRITURA RÁPIDA', desc: 'as notas aceleram' },
  ];
  function updateAttacks(tt) {
    if (!song.battle) return;
    const bar = beatOf(tt) / 4;
    if (!attack && bar >= nextAttack - 1 && !attack?.warned) {
      const a = ATTACKS[Math.floor(Math.random() * ATTACKS.length)];
      attack = { a, start: (nextAttack) * 4 * beatLen, end: (nextAttack + 4) * 4 * beatLen, warned: true, on: false };
      $('#rAttack').innerHTML = `⚠ DONA MEI: <b>${a.name}</b><small>${a.desc}</small>`;
      $('#rAttack').className = 'show';
      Sfx.roar();
    }
    if (attack) {
      if (!attack.on && tt >= attack.start) { attack.on = true; if (attack.a.id === 'espelho') mirror = true; A2M.firework(scene, frig.position.clone().add(V(0, 10, 0)), [0xe8c070, 0xc8a060], 80, 10); }
      if (tt >= attack.end) { mirror = false; attack = null; $('#rAttack').className = ''; nextAttack += song.final ? 6 : 8; }
    }
    const fa = attack && attack.on && attack.a.id === 'farofa';
    hwy.userData.dust.material.opacity += ((fa ? 0.92 : 0) - hwy.userData.dust.material.opacity) * 0.1;
  }

  function update(dt) {
    if (!running) return;
    schedule();
    const tt = now();
    const b = beatOf(tt);
    // teclas
    if (!A3.busy()) {
      KEYS.forEach((k, l) => { if (A3.pressed[k]) onLane(l); laneDown[l] = !!A3.keys[k]; });
      for (const k in ALT) { if (A3.pressed[k]) onLane(ALT[k]); if (A3.keys[k]) laneDown[ALT[k]] = true; }
      if (A3.pressed.Space || A3.pressed.Enter) activateKS();
    }
    if (ksOn && tt >= ksEnd) { ksOn = false; $('#rKS').classList.remove('on'); }
    updateAttacks(tt);
    const spd = speed * (attack && attack.on && attack.a.id === 'tempestade' ? 1.6 : 1);
    const forget = attack && attack.on && attack.a.id === 'esquecer';
    // notas
    for (const n of notes) {
      const dz = (n.t - tt) * spd;
      if (dz > HWY_LEN - 2 || (n.missed && dz < -6) || (n.hit && !n.len)) { if (n.mesh && (n.missed || n.hit)) { hwy.remove(n.mesh); n.mesh = null; } continue; }
      if (!n.mesh && !n.hit) n.mesh = gemMesh(n);
      if (!n.mesh) continue;
      n.mesh.position.set(laneX(n.lane), 0.15, -dz);
      n.mesh.userData.body.material.color.setHex(forget ? 0x777777 : n.gold ? 0xffffff : COLORS[n.lane]);
      if (n.mesh.userData.tail) {
        const tl = n.len * beatLen * spd;
        const sustainLeft = n.hit ? Math.max(0, (n.t + n.len * beatLen - tt) * spd) : tl;
        n.mesh.userData.tail.scale.z = Math.max(0.01, sustainLeft);
        n.mesh.userData.tail.position.z = -sustainLeft / 2 + (n.hit ? dz : 0);
        if (n.hit && laneDown[n.lane] && sustainLeft > 0) { score += Math.round(4 * (ksOn ? 2 : 1)); if (Math.random() < 0.3) A2M.firework(scene, hwy.localToWorld(V(laneX(n.lane), 0.3, 0)), [COLORS[n.lane]], 2, 2); }
        if (n.hit && (sustainLeft <= 0 || !laneDown[n.lane])) { hwy.remove(n.mesh); n.mesh = null; }
      }
      if (!n.hit && !n.missed && tt - n.t > WIN.ok) miss(n);
    }
    // visual
    hwy.userData.tex.offset.y = (b * beatLen * spd / 3) % 1 * -1 + 0;
    hwy.userData.road.material.color.setHex(ksOn ? 0xffd890 : 0xffffff);
    frets.forEach((f, i) => { const l = mirror ? 3 - i : i; f.pad.material.opacity += ((laneDown[l] ? 0.5 : 0.15) - f.pad.material.opacity) * 0.3; f.ring.scale.setScalar(laneDown[l] ? 1.15 : 1); f.ring.material.color.setHex(forget ? 0x777777 : COLORS[l]); });
    const bt = b % 1;
    const beatPulse = Math.max(0, 1 - bt * 3);
    Object.values(band).forEach((p, i) => { p.root.position.y = Math.abs(Math.sin(b * Math.PI)) * 0.12; if (i < 2) { p.armR.rotation.x = -0.9 - beatPulse * 0.5; p.armL.rotation.x = -1.2; } else { p.armL.rotation.x = p.armR.rotation.x = -1 - beatPulse * 0.6; } });
    crowd.userData.update(b * 0.6, memory > 0.55 || (song.final && b > 40));
    scene.userData.beams.forEach((p, i) => { p.rotation.z = Math.sin(b * 0.5 + i) * 0.5; });
    frig.position.y = frig.userData.baseY + Math.sin(b * 0.5) * 0.8; frig.rotation.y += dt * 0.05;
    const narrow = window.innerWidth / window.innerHeight < 1.2;
    if (cam.fov !== (narrow ? 76 : 60)) { cam.fov = narrow ? 76 : 60; cam.updateProjectionMatrix(); }
    frig.userData.aura.scale.setScalar(1 + beatPulse * 0.15);
    mei.armL.rotation.x = -1.5 - Math.sin(b * Math.PI) * 0.6; mei.armR.rotation.x = -2 + Math.cos(b * Math.PI) * 0.6;
    if (ghosts) ghosts.forEach((g, i) => { g.g.position.y = 1.1 + Math.sin(tt * 2 + i) * 0.15; });
    if (song.battle && Math.random() < dt * 0.4) A2M.firework(scene, V(-60 + Math.random() * 120, 40 + Math.random() * 30, -160), [0xffd040, 0xff4040, 0x40c0ff][Math.floor(Math.random() * 3)], 60, 10);
    // contagem da meia-noite no final da última música
    if (song.final) {
      const left = Math.ceil((song.bars * 4 - b) / 2);
      if (left <= 10 && left >= 1 && left !== countdownShown) { countdownShown = left; const c = $('#rCount'); c.textContent = left; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show'); }
    }
    judgeT -= dt; if (judgeT <= 0) $('#rJudge').className = '';
    hud(b);
    // perdeu / acabou
    if (memory <= 0 && !finished) { finished = true; endSong(false); }
    if (b >= song.bars * 4 + 1 && !finished) { finished = true; endSong(song.battle ? memory > 0 : memory >= (song.need || 0)); }
  }

  function hud(b) {
    $('#rScore').textContent = score.toLocaleString('pt-BR');
    const mult = Math.min(4, 1 + Math.floor(combo / 10)) * (ksOn ? 2 : 1);
    $('#rMult').textContent = '×' + mult;
    $('#rCombo').textContent = combo >= 5 ? `${combo} SEGUIDAS` : '';
    $('#rMemFill').style.width = (memory * 100) + '%';
    $('#rMemFill').classList.toggle('low', memory < 0.25);
    $('#rKSFill').style.width = ((ksOn ? Math.max(0, (ksEnd - now()) / (16 * beatLen)) : ks) * 100) + '%';
    $('#rKSHint').textContent = ksOn ? 'KING SIZE!' : ks >= 0.5 ? 'ESPAÇO!' : '';
    $('#rProg').style.width = Math.min(100, b / (song.bars * 4) * 100) + '%';
  }

  async function endSong(won) {
    running = false;
    $('#rAttack').className = ''; $('#rCount').classList.remove('show');
    const acc = total ? Math.round(hits / total * 100) : 0;
    await A3.wait(600);
    const r = resolveRun; resolveRun = null;
    r && r({ won, score, acc, maxCombo });
  }

  // ---------------------------------------------------------------
  // API
  // ---------------------------------------------------------------
  function run(def, o) {
    K = World.kit; UI = window.GameUI;
    o = o || {};
    song = def;
    if (!scene) buildScene();
    // limpa notas antigas
    notes.forEach((n) => n.mesh && hwy.remove(n.mesh));
    beatLen = 60 / def.bpm;
    speed = def.style === 'metal' ? 16 : 13;
    notes = buildChart(def);
    let phrase = 0, lastGoldBar = -9;
    notes.forEach((n) => { n.t = n.b * beatLen; const bar = Math.floor(n.b / 4); if (n.gold) { if (bar > lastGoldBar + 1) phrase++; lastGoldBar = bar; n.phrase = phrase; } });
    total = notes.length;
    score = 0; combo = 0; maxCombo = 0; hits = 0; ks = o.ks || 0; ksOn = false; memory = def.battle ? 0.5 : 0.25; attack = null; mirror = false;
    nextAttack = 8; finished = false; countdownShown = -1; schedStep = 0;
    Sfx.music(null);
    startT = R().now() + 2.2;
    A3.setView(scene, cam, update);
    $('#rhythmHud').classList.remove('hidden');
    $('#rSong').innerHTML = `<b>${def.name}</b><small>${def.artist}</small>`;
    $('#rMemLbl').textContent = def.battle ? 'MEMÓRIA DO RIO vs FAROFA' : 'A PRAIA ACORDANDO';
    $('#rNeed').style.left = def.battle ? '0%' : ((def.need || 0) * 100) + '%';
    running = true;
    return new Promise((res) => { resolveRun = res; });
  }
  function hide() { $('#rhythmHud').classList.add('hidden'); }
  function showGhosts() {
    ghosts = [A3.person('mimi'), A3.person('lina')];
    ghosts.forEach((g, i) => { A3.ghost(g, i ? 0x203a6a : 0x6a2040); g.g.position.set(i ? -1 : 1, 1.1, -44); scene.add(g.g); });
    ghosts[0].g.scale.setScalar(0.65);
  }
  function getScene() { if (!scene) { K = World.kit; UI = window.GameUI; buildScene(); } return { scene, cam, frig, mei, band, crowd }; }

  return { run, hide, showGhosts, getScene, debug: () => ({ notes, memory, score, song, t: now(), mirror, running }) };
})();
