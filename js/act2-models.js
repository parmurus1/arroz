// =====================================================================
//  ARROZ DOURADO — ATO II: modelos low poly (gente, barca, estúdio, armas)
// =====================================================================

const A2M = (() => {
  let K = null; // World.kit
  const T = {};  // texturas do ato II

  function init() {
    K = World.kit;
    const { canvasTex, pixels, noisy, rng } = K;
    T.cloth = canvasTex(16, 16, (g, w, h) => { const r = rng(101); pixels(g, w, h, () => noisy([200, 200, 200], 40, r)); });
    T.wood = K.TEX.wood; T.metal = K.TEX.metal; T.skin = K.TEX.skin; T.burlap = K.TEX.burlap; T.gold = K.TEX.gold; T.red = K.TEX.red;
    T.faces = {};
    ['capanga', 'chef', 'ninja', 'cobra', 'son', 'jinlong', 'kwan', 'kwanEvil', 'host', 'mei'].forEach((k) => (T.faces[k] = faceTex(k)));
  }

  // ---------------------------------------------------------------
  // rostos 16x16
  // ---------------------------------------------------------------
  function faceTex(kind) {
    return K.canvasTex(16, 16, (g) => {
      const px = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
      const skin = kind === 'kwan' || kind === 'kwanEvil' ? '#d8b896' : '#d6a57a';
      px(skin, 0, 0, 16, 16);
      const eyes = (c, y) => { px('#fff', 3, y, 3, 2); px('#fff', 10, y, 3, 2); px(c || '#222', 4, y, 2, 2); px(c || '#222', 11, y, 2, 2); };
      if (kind === 'capanga') {
        px('#111', 0, 0, 16, 3); px('#0a0a0a', 2, 5, 12, 3); px('#333', 7, 6, 2, 1);
        px('#1f8a50', 0, 9, 16, 7); px('#0f5a30', 0, 11, 16, 1); px('#0f5a30', 0, 14, 16, 1);
      } else if (kind === 'chef') {
        eyes(null, 5); px('#e08080', 2, 8, 3, 2); px('#e08080', 11, 8, 3, 2);
        px('#222', 3, 10, 10, 2); px('#222', 2, 11, 2, 2); px('#222', 12, 11, 2, 2); px('#7a2a2a', 6, 13, 4, 1);
      } else if (kind === 'ninja') {
        px('#1f3a26', 0, 0, 16, 16); px(skin, 1, 5, 14, 3); px('#111', 4, 6, 2, 1); px('#111', 10, 6, 2, 1);
      } else if (kind === 'cobra') {
        px('#2a9a5a', 0, 0, 16, 16);
        for (let y = 0; y < 16; y += 3) for (let x = (y % 2) * 2; x < 16; x += 4) px('#1f7a45', x, y, 2, 2);
        px('#ffe040', 2, 5, 4, 2); px('#ffe040', 10, 5, 4, 2); px('#111', 4, 5, 1, 2); px('#111', 11, 5, 1, 2);
        px('#0a3a20', 5, 10, 6, 2); px('#fff', 5, 12, 1, 3); px('#fff', 10, 12, 1, 3);
      } else if (kind === 'son') {
        px('#111', 0, 0, 16, 4); px('#111', 0, 4, 2, 3); px('#111', 14, 4, 2, 3); px('#111', 5, 4, 3, 1);
        px('#3a2010', 3, 6, 3, 1); px('#3a2010', 10, 6, 3, 1); eyes(null, 7); px('#b07050', 7, 10, 2, 1); px('#7a2a2a', 6, 13, 4, 1);
        px('#9ab', 4, 10, 1, 2);
      } else if (kind === 'jinlong') {
        px('#111', 0, 0, 16, 3); px('#111', 0, 3, 2, 3); px('#111', 14, 3, 2, 3);
        px('#3a2010', 3, 5, 3, 1); px('#3a2010', 10, 5, 3, 1); eyes(null, 6); px('#b07050', 7, 9, 2, 2);
        for (let i = 0; i < 12; i++) px('#8a6a5a', 3 + (i * 5) % 10, 11 + (i % 3), 1, 1); px('#6a2a2a', 6, 13, 4, 1);
      } else if (kind === 'kwan' || kind === 'kwanEvil') {
        px('#bbb', 0, 2, 2, 6); px('#bbb', 14, 2, 2, 6);
        g.strokeStyle = '#222'; g.lineWidth = 1; g.strokeRect(2.5, 5.5, 4, 3); g.strokeRect(9.5, 5.5, 4, 3); px('#222', 7, 6, 2, 1);
        px(kind === 'kwanEvil' ? '#ff2020' : '#222', 4, 7, 1, 1); px(kind === 'kwanEvil' ? '#ff2020' : '#222', 11, 7, 1, 1);
        px('#eee', 3, 11, 10, 5); px('#eee', 5, 10, 6, 1); px('#5a3a2a', 6, 12, 4, 1);
      } else if (kind === 'host') {
        px('#111', 0, 0, 16, 3); px('#111', 0, 3, 3, 2); eyes(null, 6); px('#111', 3, 10, 10, 1);
        px('#fff', 4, 12, 8, 2); px('#7a1a1a', 4, 14, 8, 1);
      } else if (kind === 'mei') {
        px('#999', 0, 0, 16, 3); px('#999', 0, 3, 2, 4); px('#999', 14, 3, 2, 4);
        px('#222', 4, 7, 2, 1); px('#222', 10, 7, 2, 1); px('#e09090', 2, 9, 3, 2); px('#e09090', 11, 9, 3, 2); px('#c02020', 6, 12, 4, 1);
      }
    });
  }

  // ---------------------------------------------------------------
  // gente low poly (articulada)
  // ---------------------------------------------------------------
  const LOOKS = {
    capanga: { suit: 0x16161c, pants: 0x101014, hair: 0x111111 },
    chef: { suit: 0xeeeeee, pants: 0x555555, hair: 0x222222, hat: true },
    ninja: { suit: 0x1f3a26, pants: 0x1a2a1e, hair: 0x1f3a26 },
    cobra: { suit: 0x8a1010, pants: 0x6a0a0a, hair: 0x2a9a5a, robe: true, hood: true, face: 'cobra' },
    son: { suit: 0x8a1010, pants: 0x6a0a0a, hair: 0x111111, robe: true },
    jinlong: { suit: 0x3e4e76, pants: 0x262e48, hair: 0x111111 },
    kwan: { suit: 0x2a2a30, pants: 0x111114, hair: 0xbbbbbb, buttons: true },
    host: { suit: 0xb01818, pants: 0x222222, hair: 0x111111, mic: true },
    mei: { suit: 0xa02020, pants: 0x402020, hair: 0x999999, apron: true, bun: true },
  };

  function mkPerson(kind, opts) {
    opts = opts || {};
    const L = Object.assign({}, LOOKS[kind] || LOOKS.capanga, opts.look || {});
    const { lam, box } = K;
    const mats = [];
    const m = (o) => { const x = lam(o); mats.push(x); return x; };
    const suit = m({ map: T.cloth, color: L.suit });
    const pants = m({ map: T.cloth, color: L.pants });
    const skin = m({ map: T.skin });
    const hair = m({ color: L.hair });
    const g = new THREE.Group();
    const root = new THREE.Group(); g.add(root);

    const leg = (x) => { const p = new THREE.Group(); p.position.set(x, 0.95, 0); const b = box(0.22, 0.92, 0.24, pants); b.position.y = -0.46; p.add(b); const sh = box(0.24, 0.1, 0.32, m({ color: 0x111111 })); sh.position.set(0, -0.9, 0.04); p.add(sh); root.add(p); return p; };
    const legL = leg(-0.15), legR = leg(0.15);
    const torso = box(0.62, 0.78, 0.34, suit); torso.position.y = 1.35; root.add(torso);
    if (L.robe) { const rb = box(0.7, 0.95, 0.42, suit); rb.position.y = 0.55; root.add(rb); const trim = box(0.72, 0.08, 0.44, m({ map: T.gold })); trim.position.y = 0.1; root.add(trim); const sash = box(0.64, 0.08, 0.36, m({ map: T.gold })); sash.position.y = 1.0; root.add(sash); }
    if (L.apron) { const ap = box(0.5, 0.9, 0.05, m({ color: 0xf0f0f0 })); ap.position.set(0, 1.0, 0.19); root.add(ap); }
    if (L.buttons) for (let i = 0; i < 4; i++) { const b = box(0.05, 0.05, 0.02, m({ map: T.gold })); b.position.set(0, 1.6 - i * 0.15, 0.18); root.add(b); }
    if (kind === 'capanga' || kind === 'host') { const sh = box(0.16, 0.5, 0.02, m({ color: kind === 'host' ? 0xffffff : 0xdddddd })); sh.position.set(0, 1.48, 0.175); root.add(sh); const tie = box(0.06, 0.4, 0.02, m({ color: kind === 'host' ? 0xffd040 : 0x1f8a50 })); tie.position.set(0, 1.45, 0.19); root.add(tie); }
    const arm = (x) => { const p = new THREE.Group(); p.position.set(x, 1.68, 0); const b = box(0.17, 0.72, 0.19, suit); b.position.y = -0.34; p.add(b); const hd = box(0.15, 0.15, 0.15, skin); hd.position.y = -0.76; p.add(hd); root.add(p); return p; };
    const armL = arm(-0.41), armR = arm(0.41);
    const head = new THREE.Group(); head.position.y = 1.96; root.add(head);
    const faceKind = L.face || (kind === 'kwan' && opts.evil ? 'kwanEvil' : kind);
    const faceMat = m({ map: T.faces[faceKind] || T.faces.jinlong });
    const sideMat = kind === 'ninja' || L.face === 'cobra' ? m({ color: kind === 'ninja' ? 0x1f3a26 : 0x2a9a5a }) : skin;
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.38), [sideMat, sideMat, hair, skin, faceMat, hair]);
    hb.position.y = 0.2; head.add(hb);
    if (L.hat) { const hat = K.cyl(0.2, 0.17, 0.35, 7, m({ color: 0xffffff })); hat.position.y = 0.58; head.add(hat); const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 4), m({ color: 0xffffff })); puff.position.y = 0.78; head.add(puff); }
    if (L.hood) { const hood = box(0.8, 0.7, 0.08, m({ color: 0x2a9a5a })); hood.position.set(0, 0.25, -0.24); head.add(hood); const hi = box(0.6, 0.5, 0.02, m({ color: 0xe0d060 })); hi.position.set(0, 0.25, -0.19); head.add(hi); }
    if (L.bun) { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), hair); bun.position.set(0, 0.48, -0.1); head.add(bun); }
    if (kind === 'kwan') { const beard = box(0.2, 0.25, 0.08, m({ color: 0xeeeeee })); beard.position.set(0, -0.08, 0.2); head.add(beard); }
    if (L.mic) { const mic = K.cyl(0.03, 0.03, 0.25, 5, m({ color: 0x222222 })); mic.position.set(0, -0.85, 0.08); armR.add(mic); const mh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), m({ color: 0x999999 })); mh.position.set(0, -0.7, 0.08); armR.add(mh); }

    const s = opts.scale || 1;
    g.scale.setScalar(s);
    const P = { g, root, legL, legR, armL, armR, head, torso, mats, kind, hb, faceMat };
    P.walk = (t, amt) => {
      const a = Math.sin(t) * (amt == null ? 0.6 : amt);
      legL.rotation.x = a; legR.rotation.x = -a; armL.rotation.x = -a * 0.8; armR.rotation.x = a * 0.8;
    };
    P.sit = () => { legL.rotation.x = legR.rotation.x = -1.4; root.position.y = -0.42; armL.rotation.x = armR.rotation.x = -0.5; };
    P.flash = (c) => mats.forEach((x) => x.emissive && x.emissive.setHex(c));
    P.setFace = (k) => { faceMat.map = T.faces[k]; faceMat.needsUpdate = true; };
    return P;
  }

  // mini pessoa da plateia (instanciada)
  function mkCrowd(n, rows, cols, spacing, colors) {
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    const headGeo = new THREE.BoxGeometry(0.3, 0.32, 0.3);
    const bodies = new THREE.InstancedMesh(bodyGeo, K.lam({ map: T.cloth }), n);
    const heads = new THREE.InstancedMesh(headGeo, K.lam({ map: T.skin }), n);
    const c = new THREE.Color();
    const seats = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), col = i % cols;
      seats.push({ x: (col - cols / 2) * spacing + (Math.random() - 0.5) * 0.2, y: r * 0.5, z: r * 0.9, ph: Math.random() * 6 });
      c.setHex(colors[Math.floor(Math.random() * colors.length)]);
      bodies.setColorAt(i, c);
    }
    const g = new THREE.Group(); g.add(bodies); g.add(heads);
    const mtx = new THREE.Matrix4();
    g.userData.update = (t, excite) => {
      seats.forEach((s, i) => {
        const jump = excite ? Math.max(0, Math.sin(t * 9 + s.ph)) * 0.35 : Math.sin(t * 2 + s.ph) * 0.02;
        mtx.makeTranslation(s.x, s.y + 0.35 + jump, s.z); bodies.setMatrixAt(i, mtx);
        mtx.makeTranslation(s.x, s.y + 0.88 + jump, s.z); heads.setMatrixAt(i, mtx);
      });
      bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    };
    g.userData.update(0, false);
    return g;
  }

  // ---------------------------------------------------------------
  // Baía de Guanabara + barca Rio–Niterói
  // ---------------------------------------------------------------
  function skylineTex(dawn) {
    return K.canvasTex(512, 128, (g, w, h) => {
      const r = K.rng(dawn ? 5 : 9);
      const top = dawn ? [60, 70, 140] : [4, 6, 18], mid = dawn ? [250, 140, 90] : [16, 18, 44], bot = dawn ? [255, 200, 120] : [30, 26, 50];
      for (let y = 0; y < h; y++) {
        const k = y / h;
        const c = k < 0.6 ? K.lerpC(top, mid, k / 0.6) : K.lerpC(mid, bot, (k - 0.6) / 0.4);
        g.fillStyle = `rgb(${c})`; g.fillRect(0, y, w, 1);
      }
      if (!dawn) for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,230,${0.3 + r() * 0.7})`; g.fillRect(Math.floor(r() * w), Math.floor(r() * 70), 1, 1); }
      if (dawn) { g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(330, 100, 14, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = '#f4f0d0'; g.beginPath(); g.arc(420, 22, 7, 0, Math.PI * 2); g.fill(); }
      const mtn = dawn ? '#5a3a5a' : '#0a0c18', mtn2 = dawn ? '#3a2a4a' : '#06070f';
      // Corcovado + Cristo
      g.fillStyle = mtn;
      g.beginPath(); g.moveTo(0, 128); g.lineTo(0, 95); g.lineTo(40, 80); g.lineTo(80, 50); g.lineTo(100, 34); g.lineTo(110, 33); g.lineTo(130, 60); g.lineTo(190, 92); g.lineTo(240, 100); g.lineTo(240, 128); g.fill();
      g.fillStyle = dawn ? '#fff8e0' : '#fffbe0'; g.fillRect(104, 18, 2, 15); g.fillRect(98, 21, 14, 2);
      if (!dawn) { g.fillStyle = 'rgba(255,250,200,0.18)'; g.beginPath(); g.arc(105, 25, 14, 0, Math.PI * 2); g.fill(); }
      // Pão de Açúcar
      g.fillStyle = mtn2;
      g.beginPath(); g.moveTo(250, 128); g.lineTo(262, 96); g.lineTo(285, 88); g.lineTo(300, 98); g.lineTo(318, 98);
      g.quadraticCurveTo(326, 40, 342, 44); g.quadraticCurveTo(356, 52, 360, 100); g.lineTo(390, 108); g.lineTo(390, 128); g.fill();
      g.strokeStyle = dawn ? 'rgba(40,20,40,0.6)' : 'rgba(255,255,255,0.2)'; g.beginPath(); g.moveTo(285, 88); g.lineTo(338, 46); g.stroke();
      // cidade + favelas
      for (let i = 0; i < 500; i++) {
        const x = Math.floor(r() * w), y = 96 + Math.floor(r() * 26);
        g.fillStyle = dawn ? `rgba(255,230,180,${r() * 0.25})` : (r() < 0.75 ? `rgba(255,190,90,${0.5 + r() * 0.5})` : `rgba(255,255,255,${0.6 + r() * 0.4})`);
        g.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 220; i++) {
        const x = 20 + Math.floor(r() * 180), y = 62 + Math.floor(r() * 34);
        if (y < 128 - (x < 100 ? x * 0.5 + 40 : 140 - (x - 100) * 0.4)) continue;
        g.fillStyle = dawn ? 'rgba(255,220,180,0.2)' : `rgba(255,200,100,${0.4 + r() * 0.6})`; g.fillRect(x, y, 1, 1);
      }
      // Ponte Rio–Niterói
      g.fillStyle = dawn ? '#4a3a4a' : '#101018'; g.fillRect(392, 104, 120, 2);
      for (let x = 396; x < 512; x += 9) { g.fillRect(x, 106, 1, 8); if (!dawn) { g.fillStyle = '#ffd890'; g.fillRect(x, 103, 1, 1); g.fillStyle = '#101018'; } }
    });
  }

  function buildBay(variant) {
    // variant: 'night' | 'dawn' | 'sky' (sem barca, câmera no mar olhando o céu)
    const dawn = variant === 'dawn';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(dawn ? 0x6a5a8a : 0x05060f);
    scene.fog = new THREE.Fog(dawn ? 0xd09080 : 0x0a0c1c, 30, 170);
    scene.add(new THREE.AmbientLight(dawn ? 0xffd0b0 : 0x5060a0, dawn ? 0.75 : 0.45));
    const moon = new THREE.DirectionalLight(dawn ? 0xffb080 : 0x8090ff, dawn ? 0.9 : 0.5); moon.position.set(-20, 30, -60); scene.add(moon);

    // o Rio fica atrás da barca (+z); a câmera olha pros rostos com a cidade no fundo
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(420, 105), K.basic({ map: skylineTex(dawn), fog: false }));
    const skyZ = variant === 'sky' ? -160 : 160;
    sky.position.set(0, 38, skyZ); if (skyZ > 0) sky.rotation.y = Math.PI; scene.add(sky);
    if (variant === 'night') {
      // Niterói: o morro com a mansão do Rei Cobra iluminada de vermelho
      const hill = new THREE.Mesh(new THREE.ConeGeometry(70, 34, 7), K.lam({ color: 0x0a0c14 }));
      hill.position.set(-10, 0, -150); scene.add(hill);
      const mans = K.box(14, 6, 6, K.lam({ color: 0x1a0808 })); mans.position.set(-10, 33, -142); scene.add(mans);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 5, 4), K.lam({ color: 0x3a0a0a })); roof.position.set(-10, 38, -142); roof.rotation.y = Math.PI / 4; scene.add(roof);
      for (let i = 0; i < 9; i++) { const l = K.box(0.9, 0.9, 0.2, K.basic({ color: i % 3 ? 0xff3020 : 0xffc040, fog: false })); l.position.set(-16 + i * 1.5, 32 + (i % 2) * 2, -138.8); scene.add(l); }
      const glow = new THREE.PointLight(0xff3020, 3, 60, 1); glow.position.set(-10, 34, -130); scene.add(glow);
    }

    const seaGeo = new THREE.PlaneGeometry(400, 400, 50, 50);
    seaGeo.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(seaGeo, K.lam({ color: dawn ? 0x5a6a9a : 0x10204a }));
    scene.add(sea);
    const base = seaGeo.attributes.position.array.slice();

    const boat = new THREE.Group(); scene.add(boat);
    const actors = {};
    if (variant !== 'sky') {
      const { lam, box, cyl, textCanvas } = K;
      const white = lam({ map: T.metal, color: 0xe8e8e8 });
      const hull = box(8, 2.2, 26, lam({ map: T.metal, color: 0xd0d4d8 })); hull.position.y = -0.4; boat.add(hull);
      const stripe = box(8.05, 0.3, 26.05, lam({ color: 0x2050a0 })); stripe.position.y = 0.2; boat.add(stripe);
      const deck = box(7.6, 0.1, 25.6, lam({ map: T.wood, color: 0x9a8a7a })); deck.position.y = 0.72; boat.add(deck);
      const cabin = box(6, 2.6, 9, white); cabin.position.set(0, 2.05, 5); boat.add(cabin);
      for (let i = 0; i < 4; i++) { const wdw = box(0.05, 0.7, 1.4, K.basic({ color: 0xffd890 })); wdw.position.set(-3.03, 2.3, 1.5 + i * 2.2); boat.add(wdw); const w2 = wdw.clone(); w2.position.x = 3.03; boat.add(w2); }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.6), K.basic({ map: textCanvas(256, 32, '#2050a0', [{ t: 'BARCAS  RIO ⇄ NITERÓI', y: 16, c: '#fff', f: 'bold 16px monospace' }]) }));
      sign.position.set(0, 3.0, 0.48); boat.add(sign);
      const rail = lam({ color: 0xdddddd });
      for (let z = -12.5; z <= 12.5; z += 1.25) [-3.8, 3.8].forEach((x) => { const p = box(0.06, 1.1, 0.06, rail); p.position.set(x, 1.3, z); boat.add(p); });
      [-3.8, 3.8].forEach((x) => { const top = box(0.08, 0.08, 25.6, rail); top.position.set(x, 1.85, 0); boat.add(top); });
      const front = box(7.6, 0.08, 0.08, rail); front.position.set(0, 1.85, -12.8); boat.add(front);
      [[-3.85, 1.4, -6], [3.85, 1.4, -2]].forEach(([x, y, z]) => { const b = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 4, 8), lam({ color: 0xff6a20 })); b.position.set(x, y, z); b.rotation.y = Math.PI / 2; boat.add(b); });
      for (let i = 0; i < 3; i++) {
        const bench = box(2.6, 0.12, 0.6, lam({ map: T.wood })); bench.position.set(0, 1.25, -2 - i * 3); boat.add(bench);
        const back = box(2.6, 0.6, 0.1, lam({ map: T.wood })); back.position.set(0, 1.55, -1.7 - i * 3); boat.add(back);
        [-1.1, 1.1].forEach((x) => { const l = box(0.1, 0.5, 0.5, rail); l.position.set(x, 0.98, -2 - i * 3); boat.add(l); });
      }
      const lamp = new THREE.PointLight(dawn ? 0xfff0d0 : 0xffd890, dawn ? 0.4 : 1.2, 16, 1.6); lamp.position.set(0, 3.5, -4); boat.add(lamp);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), K.basic({ color: 0xfff0c0 })); bulb.position.copy(lamp.position); boat.add(bulb);
    }

    let tt = 0;
    function update(dt) {
      tt += dt;
      const p = seaGeo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i], z = base[i + 2];
        p[i + 1] = Math.sin(x * 0.08 + tt * 1.1) * 0.35 + Math.cos(z * 0.11 + tt * 0.8) * 0.3;
      }
      seaGeo.attributes.position.needsUpdate = true;
      seaGeo.computeVertexNormals();
      boat.rotation.z = Math.sin(tt * 0.7) * 0.025;
      boat.rotation.x = Math.sin(tt * 0.5) * 0.015;
      boat.position.y = Math.sin(tt * 0.9) * 0.12;
      sky.position.x = Math.sin(tt * 0.02) * 6;
      fireworksUpdate(scene, dt);
    }
    return { scene, boat, actors, update, sky };
  }

  // ---------------------------------------------------------------
  // fogos de artifício
  // ---------------------------------------------------------------
  const fwList = [];
  function firework(scene, pos, colors, n, speed) {
    n = n || 120;
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const vel = [];
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      arr[i * 3] = pos.x; arr[i * 3 + 1] = pos.y; arr[i * 3 + 2] = pos.z;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), s = (speed || 14) * (0.7 + Math.random() * 0.3);
      vel.push(new THREE.Vector3(Math.sin(ph) * Math.cos(th) * s, Math.cos(ph) * s, Math.sin(ph) * Math.sin(th) * s));
      c.setHex(colors[i % colors.length]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 1, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false;
    scene.add(pts);
    fwList.push({ pts, vel, life: 2.4, scene });
  }
  function fireworksUpdate(scene, dt) {
    for (let i = fwList.length - 1; i >= 0; i--) {
      const f = fwList[i];
      if (f.scene !== scene) continue;
      f.life -= dt;
      const a = f.pts.geometry.attributes.position.array;
      f.vel.forEach((v, j) => { v.y -= dt * 6; v.multiplyScalar(1 - dt * 0.8); a[j * 3] += v.x * dt; a[j * 3 + 1] += v.y * dt; a[j * 3 + 2] += v.z * dt; });
      f.pts.geometry.attributes.position.needsUpdate = true;
      f.pts.material.opacity = Math.max(0, Math.min(1, f.life));
      if (f.life <= 0) { scene.remove(f.pts); f.pts.geometry.dispose(); fwList.splice(i, 1); }
    }
  }

  // ---------------------------------------------------------------
  // estúdio do PROGRAMA DO RATÃO
  // ---------------------------------------------------------------
  function buildStudio() {
    const { lam, basic, box, canvasTex, rng } = K;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12051e);
    scene.fog = new THREE.Fog(0x12051e, 18, 45);
    scene.add(new THREE.AmbientLight(0xc0a0ff, 0.55));
    const key = new THREE.DirectionalLight(0xfff0e0, 0.8); key.position.set(0, 10, 10); scene.add(key);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 10, 10), lam({ map: canvasTex(32, 32, (g) => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#2a0a5a' : '#5a1a9a'; g.fillRect(x * 8, y * 8, 8, 8); }
      g.fillStyle = '#ffd040'; g.fillRect(15, 15, 2, 2);
    }, [10, 10]) }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const stage = box(14, 0.6, 7, lam({ color: 0x8a1a8a })); stage.position.set(0, 0.3, -4); scene.add(stage);
    const edge = box(14.1, 0.1, 0.1, basic({ color: 0xffd040 })); edge.position.set(0, 0.62, -0.5); scene.add(edge);

    const logo = canvasTex(256, 128, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#1a0a4a'); grd.addColorStop(1, '#6a0a6a'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 24; i++) { g.strokeStyle = i % 2 ? '#ffd040' : '#ff40a0'; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(i / 24 * Math.PI * 2) * 300, h / 2 + Math.sin(i / 24 * Math.PI * 2) * 300); g.stroke(); }
      g.fillStyle = 'rgba(20,0,40,0.7)'; g.fillRect(20, 22, w - 40, h - 44);
      // ratinho de desenho
      g.fillStyle = '#999'; g.beginPath(); g.arc(46, 64, 16, 0, 7); g.fill(); g.beginPath(); g.arc(34, 48, 8, 0, 7); g.arc(58, 48, 8, 0, 7); g.fill();
      g.fillStyle = '#f9a'; g.beginPath(); g.arc(46, 70, 4, 0, 7); g.fill(); g.fillStyle = '#000'; g.fillRect(40, 60, 3, 3); g.fillRect(50, 60, 3, 3);
      g.fillStyle = '#ffd040'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillText('PROGRAMA', 150, 52); g.font = 'bold 30px monospace'; g.fillText('DO RATÃO', 150, 84);
      g.fillStyle = '#fff'; g.font = 'bold 11px monospace'; g.fillText('★ TESTE DE DNA ★', 150, 102);
    });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), basic({ map: logo }));
    wall.position.set(0, 6, -8); scene.add(wall);
    const sideMat = lam({ color: 0x3a0a5a });
    [-11, 11].forEach((x) => { const s = box(0.4, 12, 20, sideMat); s.position.set(x, 6, 0); scene.add(s); });
    // letreiro DNA
    const dna = new THREE.Group(); dna.position.set(-8, 3, -6); scene.add(dna);
    for (let i = 0; i < 14; i++) {
      const a = i * 0.6;
      [0, Math.PI].forEach((o, k) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 5, 4), basic({ color: k ? 0xff40a0 : 0x40c0ff })); b.position.set(Math.cos(a + o) * 0.6, i * 0.4, Math.sin(a + o) * 0.6); dna.add(b); });
    }
    const dna2 = dna.clone(); dna2.position.x = 8; scene.add(dna2);
    // holofotes
    const beams = [];
    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 12, 8, 1, true), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe080 : 0xff80e0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const piv = new THREE.Group(); piv.position.set(-7 + i * 4.7, 12, -2); piv.add(cone); cone.position.y = -6; scene.add(piv); beams.push(piv);
    }
    // cadeiras
    [-2.2, 2.2].forEach((x) => { const seat = box(1, 0.15, 1, lam({ color: 0xffd040 })); seat.position.set(x, 1.15, -3.5); scene.add(seat); const bk = box(1, 1.1, 0.12, lam({ color: 0xffd040 })); bk.position.set(x, 1.75, -4); scene.add(bk); });
    const podium = box(1.2, 1.3, 0.8, lam({ map: T.gold })); podium.position.set(0, 1.25, -5.5); scene.add(podium);
    // plateia
    const crowd = mkCrowd(60, 4, 15, 1.0, [0xff4040, 0x40a0ff, 0xffd040, 0x40e080, 0xffffff, 0xff80c0, 0xa060ff]);
    crowd.position.set(0, 0, 4); scene.add(crowd);
    // envelope
    const env = box(0.5, 0.35, 0.02, basic({ color: 0xffd040 })); env.visible = false; scene.add(env);
    let tt = 0, excite = 0;
    function update(dt) {
      tt += dt;
      beams.forEach((b, i) => { b.rotation.z = Math.sin(tt * 0.8 + i) * 0.45; b.rotation.x = Math.cos(tt * 0.6 + i * 2) * 0.25; });
      dna.rotation.y = tt; dna2.rotation.y = -tt;
      crowd.userData.update(tt, excite > 0);
      excite = Math.max(0, excite - dt);
    }
    return { scene, update, env, cheer: (s) => { excite = s || 2.5; } };
  }

  // ---------------------------------------------------------------
  // armas na mão (viewmodels)
  // ---------------------------------------------------------------
  function mkWeapon(id) {
    const { lam, basic, box, cyl, textCanvas } = K;
    const g = new THREE.Group();
    const skin = lam({ map: T.skin });
    const sleeve = lam({ map: K.TEX.sleeve });
    const muzzle = new THREE.Object3D();
    const hand = (x, y, z) => { const h = new THREE.Group(); const p = box(0.12, 0.06, 0.14, skin); h.add(p); for (let i = 0; i < 4; i++) { const f = box(0.026, 0.03, 0.07, skin); f.position.set(-0.042 + i * 0.028, -0.02, -0.08); f.rotation.x = -0.9; h.add(f); } const a = box(0.12, 0.12, 0.4, sleeve); a.position.z = 0.25; h.add(a); h.position.set(x, y, z); g.add(h); return h; };
    if (id === 'mao') {
      const h = hand(0.28, -0.3, -0.5); h.rotation.x = -0.4;
      const grains = new THREE.Group();
      for (let i = 0; i < 9; i++) { const gr = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), basic({ color: 0xf4eedc })); gr.scale.set(1.6, 0.6, 0.6); gr.position.set((Math.random() - 0.5) * 0.08, 0.04, (Math.random() - 0.5) * 0.08); grains.add(gr); }
      h.add(grains); g.userData.grains = grains;
      muzzle.position.set(0.25, -0.2, -0.7);
    } else if (id === 'estilingue') {
      hand(0.22, -0.32, -0.45);
      const wood = lam({ map: T.wood });
      const st = box(0.03, 0.18, 0.03, wood); st.position.set(0.22, -0.18, -0.55); g.add(st);
      [-1, 1].forEach((s) => { const a = box(0.025, 0.14, 0.025, wood); a.position.set(0.22 + s * 0.045, -0.04, -0.55); a.rotation.z = -s * 0.35; g.add(a); });
      const band = box(0.12, 0.012, 0.012, lam({ color: 0x8a2a1a })); band.position.set(0.22, 0.02, -0.52); g.add(band);
      muzzle.position.set(0.22, 0.0, -0.7);
    } else if (id === 'doze') {
      const bam = lam({ color: 0xa8a050 });
      [-0.035, 0.035].forEach((x) => { const b = cyl(0.032, 0.032, 0.7, 6, bam); b.rotation.x = Math.PI / 2; b.position.set(0.2 + x, -0.2, -0.65); g.add(b); for (let i = 0; i < 3; i++) { const ring = cyl(0.036, 0.036, 0.02, 6, lam({ color: 0x6a6a20 })); ring.rotation.x = Math.PI / 2; ring.position.set(0.2 + x, -0.2, -0.45 - i * 0.2); g.add(ring); } });
      const stock = box(0.1, 0.12, 0.35, lam({ map: T.wood })); stock.position.set(0.2, -0.26, -0.2); g.add(stock);
      const pouch = box(0.12, 0.1, 0.14, lam({ map: T.burlap })); pouch.position.set(0.2, -0.3, -0.4); g.add(pouch);
      hand(0.2, -0.33, -0.32);
      muzzle.position.set(0.2, -0.2, -1.0);
    } else if (id === 'matic') {
      const body = box(0.12, 0.14, 0.5, lam({ map: T.red })); body.position.set(0.2, -0.22, -0.5); g.add(body);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.07), basic({ map: textCanvas(64, 16, '#c01010', [{ t: 'XING LING', y: 8, c: '#ffd040', f: 'bold 9px monospace' }]) })); lab.rotation.y = -Math.PI / 2; lab.position.set(0.139, -0.2, -0.5); g.add(lab);
      const barrel = cyl(0.02, 0.02, 0.3, 6, lam({ map: T.metal })); barrel.rotation.x = Math.PI / 2; barrel.position.set(0.2, -0.2, -0.88); g.add(barrel);
      const mag = box(0.08, 0.2, 0.1, lam({ map: T.burlap })); mag.position.set(0.2, -0.36, -0.45); g.add(mag);
      hand(0.2, -0.34, -0.3);
      muzzle.position.set(0.2, -0.2, -1.05);
    } else if (id === 'bazuca') {
      const tube = cyl(0.09, 0.09, 1.1, 8, lam({ color: 0x4a5a2a })); tube.rotation.x = Math.PI / 2; tube.position.set(0.24, -0.18, -0.55); g.add(tube);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), lam({ color: 0xe8d8a0 })); ball.position.set(0.24, -0.18, -1.12); g.add(ball); g.userData.ball = ball;
      const sight = box(0.03, 0.08, 0.1, lam({ map: T.metal })); sight.position.set(0.24, -0.06, -0.6); g.add(sight);
      hand(0.24, -0.3, -0.35);
      muzzle.position.set(0.24, -0.18, -1.2);
    } else if (id === 'panela') {
      const spin = new THREE.Group(); spin.position.set(0.22, -0.27, -0.75); g.add(spin);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const b = cyl(0.018, 0.018, 0.6, 5, lam({ map: T.metal })); b.rotation.x = Math.PI / 2; b.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0); spin.add(b); }
      const ring = cyl(0.08, 0.08, 0.04, 8, lam({ map: T.metal })); ring.rotation.x = Math.PI / 2; ring.position.z = -0.25; spin.add(ring);
      g.userData.spin = spin;
      const pot = cyl(0.085, 0.085, 0.11, 9, lam({ color: 0xd0d0d8, map: T.metal })); pot.position.set(0.24, -0.17, -0.62); g.add(pot);
      const lid = cyl(0.092, 0.092, 0.02, 9, lam({ color: 0x9a9aa0 })); lid.position.set(0.24, -0.105, -0.62); g.add(lid);
      const valve = cyl(0.012, 0.015, 0.04, 5, lam({ color: 0x222222 })); valve.position.set(0.24, -0.075, -0.62); g.add(valve); g.userData.valve = valve;
      [-1, 1].forEach((s) => { const hd = box(0.07, 0.016, 0.02, lam({ color: 0x111111 })); hd.position.set(0.24 + s * 0.12, -0.13, -0.62); g.add(hd); });
      hand(0.2, -0.36, -0.28);
      muzzle.position.set(0.2, -0.24, -1.05);
      const steam = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(30 * 3), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, transparent: true, opacity: 0.5 }));
      steam.frustumCulled = false; g.add(steam); g.userData.steam = steam;
    } else if (id === 'fists') {
      const goldM = basic({ color: 0xffc830 });
      [-1, 1].forEach((s) => {
        const f = new THREE.Group(); f.position.set(s * 0.3, -0.3, -0.5);
        const fist = box(0.17, 0.15, 0.17, goldM); f.add(fist);
        for (let i = 0; i < 4; i++) { const k = box(0.035, 0.035, 0.03, basic({ color: 0xfff0a0 })); k.position.set(-0.06 + i * 0.04, 0.05, -0.09); f.add(k); }
        const arm = box(0.16, 0.16, 0.5, basic({ color: 0xe0a020 })); arm.position.z = 0.3; f.add(arm);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
        f.add(glow);
        g.add(f);
        g.userData[s < 0 ? 'L' : 'R'] = f;
      });
      muzzle.position.set(0, -0.2, -1);
    }
    g.add(muzzle);
    g.userData.muzzle = muzzle;
    return g;
  }

  // ---------------------------------------------------------------
  // itens
  // ---------------------------------------------------------------
  function mkKey(color) {
    const g = new THREE.Group();
    const m = K.basic({ color });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 4, 8), m); ring.position.y = 0.3; g.add(ring);
    const shaft = K.box(0.08, 0.5, 0.06, m); shaft.position.y = -0.1; g.add(shaft);
    [-0.2, -0.32].forEach((y) => { const t = K.box(0.16, 0.06, 0.06, m); t.position.set(0.08, y, 0); g.add(t); });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(glow);
    return g;
  }
  function mkMarmita() {
    const g = new THREE.Group();
    const b = K.box(0.6, 0.25, 0.45, K.lam({ map: T.metal, color: 0xe0e0e8 })); g.add(b);
    const lid = K.box(0.64, 0.05, 0.49, K.lam({ map: T.metal, color: 0xc8c8d0 })); lid.position.y = 0.15; g.add(lid);
    const tag = K.box(0.2, 0.01, 0.12, K.basic({ color: 0xff3030 })); tag.position.y = 0.18; g.add(tag);
    return g;
  }
  function mkSack() { const s = K.box(0.6, 0.7, 0.45, K.lam({ map: T.burlap })); const g = new THREE.Group(); g.add(s); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), K.lam({ map: K.TEX.label })); l.position.z = 0.23; g.add(l); return g; }
  function mkMoney() {
    const g = new THREE.Group();
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), K.lam({ color: 0x3a8a3a })); bag.scale.y = 1.1; g.add(bag);
    const top = K.cyl(0.1, 0.18, 0.2, 6, K.lam({ color: 0x2a6a2a })); top.position.y = 0.4; g.add(top);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), K.basic({ map: K.textCanvas(32, 32, '#3a8a3a', [{ t: 'R$', y: 16, c: '#ffe060', f: 'bold 16px monospace' }]) })); sign.position.z = 0.34; g.add(sign);
    return g;
  }
  function mkVase() {
    const g = new THREE.Group();
    const tex = K.canvasTex(32, 32, (c) => { c.fillStyle = '#f0f0f4'; c.fillRect(0, 0, 32, 32); c.strokeStyle = '#2040a0'; c.lineWidth = 2; for (let y = 4; y < 32; y += 8) { c.beginPath(); for (let x = 0; x <= 32; x += 4) c.lineTo(x, y + Math.sin(x) * 2); c.stroke(); } });
    const v = K.cyl(0.35, 0.25, 1.4, 8, K.lam({ map: tex })); v.position.y = 0.7; g.add(v);
    const n = K.cyl(0.18, 0.3, 0.3, 8, K.lam({ map: tex })); n.position.y = 1.55; g.add(n);
    return g;
  }
  function mkLantern() {
    const g = new THREE.Group();
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 7, 5), K.basic({ color: 0xff3020 })); l.scale.y = 1.25; g.add(l);
    [0.45, -0.45].forEach((y) => { const c = K.cyl(0.15, 0.15, 0.08, 6, K.basic({ color: 0xffc030 })); c.position.y = y; g.add(c); });
    const cord = K.box(0.02, 0.8, 0.02, K.basic({ color: 0x111111 })); cord.position.y = 0.9; g.add(cord);
    return g;
  }
  function mkGrain(color, big) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(big ? 0.12 : 0.05, 0), K.basic({ color }));
    m.scale.set(1.7, 0.65, 0.65);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.4 : 0.2, 6, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    const g = new THREE.Group(); g.add(m); g.add(glow);
    return g;
  }

  return { init, mkPerson, mkCrowd, buildBay, buildStudio, firework, fxUpdate: fireworksUpdate, mkWeapon, mkKey, mkMarmita, mkSack, mkMoney, mkVase, mkLantern, mkGrain, T };
})();
