// =====================================================================
//  ARROZ DOURADO — ATO III: A FAROFA DE OURO (fluxo, cutscenes e final)
// =====================================================================

const Act3 = (() => {
  const D3 = DATA3;
  const $ = (s) => document.querySelector(s);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let K, UI, isActive = false, st = null;
  const STAGES = ['prologo', 'treino', 'torneio', 'joa', 'corrida', 'reveillon', 'final'];

  function save() { const S = UI.S(); S.act3 = st; UI.save(); }
  function setStage(s) { st.stage = s; save(); }

  // ---------------------------------------------------------------
  // cenários das cutscenes
  // ---------------------------------------------------------------
  function restaurant(sign) {
    const { lam, basic, box, cyl, canvasTex, textCanvas } = K;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1410);
    scene.fog = new THREE.Fog(0x1a1410, 14, 30);
    scene.add(new THREE.AmbientLight(0xfff0d8, 0.6));
    const l = new THREE.PointLight(0xfff0d0, 1.2, 20, 1.4); l.position.set(0, 3.6, 0); scene.add(l);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10, 7, 5), lam({ map: canvasTex(16, 16, (g) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#8a2020' : '#e8e0d0'; g.fillRect(i * 8, j * 8, 8, 8); } }, [7, 5]) }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const tile = canvasTex(16, 16, (g) => { g.fillStyle = '#e8f0e8'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#9ab8a0'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16); g.fillStyle = '#2a7a4a'; g.fillRect(0, 10, 16, 2); }, [8, 2]);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), lam({ map: tile })); back.position.set(0, 2.25, -5); scene.add(back);
    [-7, 7].forEach((x) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.5), lam({ map: tile })); w.position.set(x, 2.25, 0); w.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(w); });
    const signM = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), basic({ map: textCanvas(256, 40, '#b01818', [{ t: sign, y: 20, c: '#ffd040', f: `bold ${Math.min(22, Math.floor(400 / sign.length))}px monospace` }]) })); signM.position.set(0, 3.7, -4.95); scene.add(signM);
    const counter = box(6, 1.1, 1, lam({ map: K.TEX.wood })); counter.position.set(0, 0.55, -3); scene.add(counter);
    const glass = box(2, 0.6, 0.8, new THREE.MeshBasicMaterial({ color: 0x9ad0e0, transparent: true, opacity: 0.35 })); glass.position.set(-1.6, 1.4, -3); scene.add(glass);
    const pot = cyl(0.45, 0.4, 0.6, 8, lam({ map: K.TEX.metal })); pot.position.set(1.8, 1.4, -3.2); scene.add(pot);
    for (let i = 0; i < 3; i++) {
      const tb = box(1.4, 0.08, 1.4, lam({ color: 0xd02020 })); tb.position.set(-3.5 + i * 3.5, 0.9, 1.5); scene.add(tb);
      const lg = box(0.1, 0.9, 0.1, lam({ color: 0xd02020 })); lg.position.set(-3.5 + i * 3.5, 0.45, 1.5); scene.add(lg);
      [-0.9, 0.9].forEach((dz) => { const ch = box(0.6, 0.06, 0.6, lam({ color: 0xd02020 })); ch.position.set(-3.5 + i * 3.5, 0.55, 1.5 + dz); scene.add(ch); });
      const plate = cyl(0.25, 0.25, 0.03, 10, lam({ color: 0xffffff })); plate.position.set(-3.5 + i * 3.5, 0.96, 1.5); scene.add(plate);
    }
    // TV na parede
    const tvTex = canvasTex(64, 48, (g) => {
      g.fillStyle = '#1a3a8a'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#d6a57a'; g.fillRect(22, 8, 14, 16); g.fillStyle = '#c08030'; g.fillRect(22, 6, 14, 4); g.fillStyle = '#2a4a8a'; g.fillRect(18, 24, 22, 14);
      g.fillStyle = '#c01010'; g.fillRect(0, 36, 64, 12); g.fillStyle = '#fff'; g.font = 'bold 7px monospace'; g.fillText('PLANTÃO · CARIOCAS', 2, 42); g.fillText('ESQUECEM TUDO', 2, 47);
    });
    const tv = box(1.8, 1.2, 0.3, lam({ color: 0x111111 })); tv.position.set(4.8, 3.2, -4.8); scene.add(tv);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), basic({ map: tvTex })); scr.position.set(4.8, 3.2, -4.64); scene.add(scr);
    const fan = new THREE.Group(); fan.position.set(0, 4.3, 0); scene.add(fan);
    for (let i = 0; i < 3; i++) { const b = box(1.6, 0.03, 0.25, lam({ color: 0xeeeeee })); b.rotation.y = i * Math.PI / 1.5; b.position.set(Math.cos(i * 2.1) * 0.8, 0, -Math.sin(i * 2.1) * 0.8); fan.add(b); }
    const crumbs = new THREE.Group(); crumbs.position.set(3.5, 1.0, 1.5); scene.add(crumbs);
    for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.02, 0), basic({ color: 0xffd040 })); c.position.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3); crumbs.add(c); }
    return { scene, fan, tv: V(4.8, 3.2, -4.6), crumbs };
  }

  function joaGate(burning) {
    const { lam, basic, box } = K;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(burning ? 0x1a0804 : 0x03040a);
    scene.fog = new THREE.Fog(burning ? 0x1a0804 : 0x05070f, 10, 60);
    scene.add(new THREE.AmbientLight(burning ? 0xff8040 : 0x5060a0, burning ? 0.5 : 0.3));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), lam({ color: 0x1a2418 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 40), lam({ color: 0x2a2a2e })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 12); scene.add(road);
    const fac = box(26, 10, 2, lam({ color: burning ? 0x3a1a10 : 0x2a1a18 })); fac.position.set(0, 5, -16); scene.add(fac);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(18, 5, 4), lam({ color: 0x150a08 })); roof.position.set(0, 12.5, -16); roof.rotation.y = Math.PI / 4; scene.add(roof);
    for (let i = -3; i <= 3; i++) [3, 7].forEach((y) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2), basic({ color: burning ? 0xff8020 : 0x0a1020 })); w.position.set(i * 3.4, y, -14.95); scene.add(w); });
    for (let x = -10; x <= 10; x += 0.6) { if (Math.abs(x) < 2.4) continue; const b = box(0.08, 3, 0.08, lam({ color: 0x1a1a1a })); b.position.set(x, 1.5, 0); scene.add(b); }
    [-2.4, 2.4].forEach((x) => { const p = box(0.6, 3.6, 0.6, lam({ color: 0x5a5450 })); p.position.set(x, 1.8, 0); scene.add(p); });
    const gate = new THREE.Group(); gate.position.set(-2.1, 0, 0); scene.add(gate);
    for (let x = 0; x < 4.2; x += 0.35) { const b = box(0.06, 2.8, 0.06, lam({ color: 0x222222 })); b.position.set(x, 1.4, 0); gate.add(b); }
    gate.rotation.y = 0.9;
    const N = 700, geo = new THREE.BufferGeometry(), a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { a[i * 3] = (Math.random() - 0.5) * 40; a[i * 3 + 1] = Math.random() * 16; a[i * 3 + 2] = (Math.random() - 0.5) * 40; }
    geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: burning ? 0xffa040 : 0x8090b0, size: burning ? 3 : 2, sizeAttenuation: false, transparent: true, opacity: 0.6 }));
    pts.frustumCulled = false; scene.add(pts);
    const fires = [];
    if (burning) for (let i = 0; i < 5; i++) { const f = new THREE.PointLight(0xff6020, 2, 22, 1.4); f.position.set(-10 + i * 5, 4, -13); scene.add(f); fires.push(f); }
    let lt = 4;
    const amb = scene.children[0];
    const update = (dt) => {
      const arr = geo.attributes.position.array;
      for (let i = 1; i < arr.length; i += 3) { arr[i] += dt * (burning ? 3 : -15); if (arr[i] < 0) arr[i] = 16; if (arr[i] > 16) arr[i] = 0; }
      geo.attributes.position.needsUpdate = true;
      fires.forEach((f) => (f.intensity = 1.5 + Math.random() * 1.2));
      if (!burning) { lt -= dt; if (lt <= 0) { lt = 4 + Math.random() * 6; amb.intensity = 1.5; setTimeout(() => (amb.intensity = 0.3), 100); setTimeout(() => Sfx.raw.noiseHit(120, 0.7, 2, 0.4, null, null, 'lowpass'), 500); } }
    };
    return { scene, update };
  }

  function pastelaria() {
    const { lam, basic, box, textCanvas, canvasTex } = K;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0812);
    scene.add(new THREE.AmbientLight(0x8090c0, 0.5));
    const l = new THREE.PointLight(0xffe0a0, 1, 12); l.position.set(0, 4, 3); scene.add(l);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), lam({ map: K.TEX.wall })); wall.position.set(0, 3, 0); scene.add(wall);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), lam({ map: canvasTex(16, 32, (g) => { for (let y = 0; y < 32; y += 2) { g.fillStyle = y % 4 ? '#7a7a80' : '#5a5a60'; g.fillRect(0, y, 16, 2); } }) })); door.position.set(0, 1.6, 0.02); scene.add(door);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.8), basic({ map: textCanvas(256, 40, '#c01010', [{ t: 'PASTELARIA DRAGÃO FELIZ', y: 20, c: '#ffd040', f: 'bold 18px monospace' }]) })); sign.position.set(0, 4, 0.03); scene.add(sign);
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), lam({ color: 0xf4efe2 })); note.position.set(-0.8, 1.8, 0.05); note.rotation.z = 0.08; scene.add(note);
    const flyer = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), basic({ map: textCanvas(64, 96, '#ffd040', [{ t: 'TORNEIO', y: 16, c: '#b01818', f: 'bold 11px monospace' }, { t: 'DOS', y: 30, c: '#b01818', f: 'bold 10px monospace' }, { t: 'ACOMPA-', y: 44, c: '#b01818', f: 'bold 10px monospace' }, { t: 'NHAMENTOS', y: 56, c: '#b01818', f: 'bold 9px monospace' }, { t: 'LAPA 00h', y: 76, c: '#111', f: 'bold 9px monospace' }, { t: 'RATÃO', y: 88, c: '#111', f: 'bold 9px monospace' }]) }));
    flyer.position.set(0.6, 1.9, 0.05); flyer.rotation.z = -0.06; scene.add(flyer);
    return { scene };
  }

  // ---------------------------------------------------------------
  // PRÓLOGO
  // ---------------------------------------------------------------
  async function prologo() {
    await A3.chapterCard('ATO III', 'A FAROFA DE OURO', 'o desfecho', D3.MEMORY.prologo);
    const R = restaurant('PF DO KING SIZE · INAUGURAÇÃO');
    const me = A3.person('jinlong'); me.g.position.set(-1, 0, -3.9); R.scene.add(me.g);
    const apron = K.box(0.5, 0.8, 0.05, K.lam({ color: 0xf4f4f4 })); apron.position.set(0, 1.1, 0.19); me.root.add(apron);
    const son = A3.person('son'); son.g.position.set(1.8, 0, -3.9); R.scene.add(son.g);
    const well = A3.person('wellington'); well.g.position.set(-3, 0, 3); well.g.rotation.y = Math.PI * 0.8; R.scene.add(well.g);
    const freg = A3.person('fregues'); freg.sit(); freg.g.position.set(3.5, 0.6, 2.4); freg.g.rotation.y = Math.PI; R.scene.add(freg.g);
    let tt = 0;
    A3.setView(R.scene, A3.cam, (dt) => { tt += dt; R.fan.rotation.y += dt * 4; son.armR.rotation.x = -1.2 + Math.sin(tt * 5) * 0.4; });
    A3.letterbox(true);
    Sfx.music('safe');
    A3.camAt(V(0, 3.2, 6), V(0, 1.4, -3));
    await A3.UI.fade(false);
    await A3.talk(D3.SCRIPT.prologo, (who, i) => {
      if (who === 'WELLINGTON') A3.faceShot(well, 2.2, 0.4);
      else if (who === 'XIAO DOU') A3.faceShot(son, 2.4, -0.4);
      else if (who === 'JINLONG') A3.faceShot(me, 2.4, 0.5);
      else if (who === 'FREGUÊS') A3.camAt(V(3.5, 2.2, -0.2), V(3.5, 1.8, 2.4));
      else if (who === 'REPÓRTER') A3.camAt(V(3.6, 2.9, -2.2), R.tv);
      else if (i < 2) A3.camAt(V(0, 3.2, 6), V(0, 1.4, -3));
    }, async (cue) => {
      if (cue === 'tv') { A3.camAt(V(3.4, 2.8, -1.8), R.tv); Sfx.tvStatic(0.3); }
      if (cue === 'crumb') { A3.camAt(V(3.5, 1.9, 1.0), V(3.5, 1.0, 1.5)); Sfx.gold(); }
      if (cue === 'flyer') {
        await A3.UI.fade(true);
        const P2 = pastelaria();
        A3.setView(P2.scene, A3.cam);
        A3.camAt(V(0, 2, 5), V(0, 1.9, 0));
        Sfx.music('sad');
        await A3.UI.fade(false);
        A3.camMove(V(0, 2, 5), V(-0.1, 1.9, 1.8), V(0, 1.9, 0), V(-0.1, 1.85, 0), 6);
      }
    });
    await A3.UI.fade(true);
    A3.letterbox(false);
  }

  // ---------------------------------------------------------------
  // CAPÍTULO 1 — LUTA
  // ---------------------------------------------------------------
  async function treino() {
    await A3.chapterCard('CAPÍTULO 1', 'O TORNEIO DOS ACOMPANHAMENTOS', 'Lapa · sábado', D3.MEMORY.torneio);
    Sfx.music('fight');
    await Fight.run({
      p1: 'jinlong', cpu: 'son', stage: 'telhado', tutorial: true, title: 'TREINO NO TELHADO',
      before: async () => { await A3.UI.fade(false); await A3.UI.dialog(D3.SCRIPT.treinoIntro); },
    });
    await A3.UI.dialog(D3.SCRIPT.treinoFim);
    await A3.UI.fade(true);
  }

  function pickFighter(fight) {
    if (fight.forceP1) return Promise.resolve(fight.forceP1);
    return new Promise((res) => {
      const box = $('#charSelect');
      box.classList.remove('hidden');
      $('#csTitle').textContent = fight.title;
      $('#csVs').textContent = 'contra ' + D3.FIGHTERS[fight.cpu].name;
      box.onclick = (e) => { const b = e.target.closest('button[data-f]'); if (!b) return; box.classList.add('hidden'); box.onclick = null; window.removeEventListener('keydown', kh); Sfx.keyGet(); res(b.dataset.f); };
      const kh = (e) => { if (e.code === 'Digit1' || e.code === 'KeyA') $('#charSelect button[data-f="jinlong"]').click(); if (e.code === 'Digit2' || e.code === 'KeyD') $('#charSelect button[data-f="son"]').click(); };
      window.addEventListener('keydown', kh);
    });
  }

  async function torneio() {
    if (st.fightIdx == null) st.fightIdx = 0;
    if (st.fightIdx === 0) {
      // abertura do torneio com o Ratão
      const sd = A2M.buildStudio();
      const host = A2M.mkPerson('host'); host.g.position.set(0, 0.6, -4); sd.scene.add(host.g);
      sd.scene.background = new THREE.Color(0x0a0618);
      A3.setView(sd.scene, A3.cam, (dt) => sd.update(dt));
      A3.letterbox(true);
      Sfx.music('samba');
      A3.camAt(V(0, 5, 14), V(0, 2, -4));
      await A3.UI.fade(false);
      await A3.talk(D3.SCRIPT.torneioIntro, (who) => {
        if (who === 'RATÃO') A3.camAt(V(0, 2.6, -0.5), V(0, 2.5, -4));
        else if (who === 'PLATEIA') { A3.camAt(V(0, 3.2, -2), V(0, 1.4, 7)); sd.cheer(2.5); Sfx.crowd(2, true); }
        else A3.camAt(V(0, 5, 14), V(0, 2, -4));
      });
      A3.letterbox(false);
      await A3.UI.fade(true);
    }
    while (st.fightIdx < D3.FIGHTS.length) {
      const fight = D3.FIGHTS[st.fightIdx];
      Sfx.music('samba');
      await A3.UI.fade(false);
      const p1 = await pickFighter(fight);
      Sfx.music('fight');
      const res = await Fight.run({
        p1, cpu: fight.cpu, stage: fight.stage, rain: fight.rain, level: st.fightIdx, title: fight.title,
        before: async () => { await A3.UI.dialog(D3.SCRIPT.preFight[fight.cpu]); },
      });
      if (!res.won) {
        await A3.UI.dialog([['RATÃO', 'CAIU! Mas no meu programa todo mundo tem segunda chance! Levanta, King Size!']]);
        await A3.UI.fade(true);
        continue;
      }
      Sfx.crowd(2.5, true);
      await A3.UI.dialog(D3.SCRIPT.postFight[fight.cpu]);
      st.fightIdx++;
      save();
      await A3.UI.fade(true);
    }
  }

  // ---------------------------------------------------------------
  // CAPÍTULO 2 — SURVIVAL HORROR
  // ---------------------------------------------------------------
  async function joa() {
    await A3.chapterCard('CAPÍTULO 2', 'A MANSÃO DO JOÁ', '31 de dezembro · 22h40', D3.MEMORY.joa);
    if (!st.horror) {
      const G = joaGate(false);
      const me = A3.person('jinlong'); me.g.position.set(-0.8, 0, 3); me.g.rotation.y = Math.PI; G.scene.add(me.g);
      const son = A3.person('son'); son.g.position.set(0.8, 0, 3.2); son.g.rotation.y = Math.PI; G.scene.add(son.g);
      A3.setView(G.scene, A3.cam, G.update);
      A3.letterbox(true);
      Sfx.music('horror');
      A3.camAt(V(0, 3, 12), V(0, 3, -10));
      await A3.UI.fade(false);
      await A3.talk(D3.SCRIPT.joaIntro, (who, i) => {
        if (who === 'XIAO DOU') A3.camAt(V(1.5, 2.3, 1.2), V(0.8, 2.1, 3.2));
        else if (who === 'JINLONG') A3.camAt(V(-1.6, 2.3, 1.1), V(-0.8, 2.1, 3));
        else if (i === 1) A3.camMove(V(0, 3, 12), V(0, 2.4, 6), V(0, 3, -10), V(0, 4, -15), 6);
      });
      A3.letterbox(false);
      await A3.UI.fade(true);
    }
    A3.UI.fade(false);
    await Horror.run(st.horror);
    st.horror = null;
    save();
    // fuga
    const G2 = joaGate(true);
    const me = A3.person('jinlong'); me.g.position.set(-0.6, 0, 3); G2.scene.add(me.g);
    const son = A3.person('son'); son.g.position.set(0.9, 0, 3.6); son.g.rotation.y = -0.6; G2.scene.add(son.g);
    const well = A3.person('wellington'); well.g.position.set(3, 0, 10); well.g.rotation.y = Math.PI; well.g.visible = false; G2.scene.add(well.g);
    const head = new THREE.PointLight(0xfff0c0, 0, 16, 1.5); head.position.set(3, 1.5, 12); G2.scene.add(head);
    A3.setView(G2.scene, A3.cam, G2.update);
    A3.letterbox(true);
    Sfx.music('sad');
    A3.camAt(V(0, 2.6, 9), V(0, 2, 0));
    await A3.UI.fade(false);
    await A3.talk(D3.SCRIPT.joaFim, (who) => {
      if (who === 'XIAO DOU') A3.faceShot(son, 2.2, 0.4);
      else if (who === 'JINLONG') A3.camAt(V(-0.6, 2.4, 5.4), V(-0.6, 2.1, 3));
      else if (who === 'WELLINGTON') A3.faceShot(well, 2.4, 0.4);
    }, async (cue) => {
      if (cue === 'moto') { well.g.visible = true; head.intensity = 3; Sfx.raw.tone(70, 1.5, 'sawtooth', 0.15, null, null, 140); A3.camAt(V(-1, 1.6, 6), V(3, 1.5, 12)); }
    });
    A3.letterbox(false);
    await A3.UI.fade(true);
  }

  // ---------------------------------------------------------------
  // CAPÍTULO 3 — CORRIDA
  // ---------------------------------------------------------------
  async function corrida() {
    if (st.raceIdx == null) st.raceIdx = 0;
    if (st.raceIdx === 0) await A3.chapterCard('CAPÍTULO 3', 'A CORRIDA DO RÉVEILLON', 'Joá → Copacabana · 23h15', D3.MEMORY.corrida);
    while (st.raceIdx < D3.TRACKS.length) {
      const tr = D3.TRACKS[st.raceIdx];
      Sfx.music('kart');
      A3.UI.fade(false);
      if (st.raceIdx === 0) UI.toast(D3.SCRIPT.raceIntro[0], 'gold', 9000);
      const res = await Kart.run(tr);
      if (res.place > 3) {
        await A3.UI.dialog([['WELLINGTON', `${res.place}º?! Assim a gente chega em Copacabana no Carnaval! VOLTA, VOLTA!`]]);
        await A3.UI.fade(true);
        continue;
      }
      if (D3.SCRIPT.raceBetween[st.raceIdx]) await A3.UI.dialog(D3.SCRIPT.raceBetween[st.raceIdx]);
      st.raceIdx++;
      save();
      await A3.UI.fade(true);
    }
    Sfx.music(null);
  }

  // ---------------------------------------------------------------
  // CAPÍTULO 4 — RITMO
  // ---------------------------------------------------------------
  async function reveillon() {
    if (st.songIdx == null) st.songIdx = 0;
    const R = Rhythm.getScene();
    if (st.songIdx === 0) {
      await A3.chapterCard('CAPÍTULO 4', 'MEMÓRIA', 'Copacabana · 23h50', D3.MEMORY.reveillon);
      A3.setView(R.scene, A3.cam, (dt) => { R.crowd.userData.update(performance.now() / 1000, false); R.frig.position.y = R.frig.userData.baseY + Math.sin(performance.now() / 900) * 0.8; });
      A3.letterbox(true);
      A3.camAt(V(0, 6, 30), V(0, 3, -40));
      await A3.UI.fade(false);
      await A3.talk(D3.SCRIPT.raceFim, (who, i) => {
        if (i === 0) A3.camMove(V(0, 6, 30), V(0, 4, -10), V(0, 3, -40), V(0, 2, -36), 8);
        else if (who === 'DONA MEI' || i === 7) A3.camAt(R.frig.position.clone().add(V(9, 7, 26)), R.frig.position.clone().add(V(0, 6, 0)));
        else if (who === 'MESTRE COUVE') A3.faceShot(R.band.couve, 2.6, 0.5);
        else if (who === 'DAMA VINAGRETE') A3.faceShot(R.band.vinagrete, 2.6, -0.5);
        else if (who === 'TORRESMO') A3.faceShot(R.band.torresmo, 3.2, 0.5);
        else if (who === 'KWAN TOSTADO') A3.faceShot(R.band.kwan, 2.6, -0.5);
        else if (who === 'JINLONG') A3.faceShot(R.band.jinlong, 2.4, 0.5);
        else if (who === 'XIAO DOU') A3.faceShot(R.band.son, 2.4, -0.5);
        else if (who === 'WELLINGTON') A3.faceShot(R.band.well, 2.4, 0.5);
      });
      A3.letterbox(false);
    }
    while (st.songIdx < D3.SONGS.length) {
      const song = D3.SONGS[st.songIdx];
      A3.setView(R.scene, A3.cam, () => {});
      A3.camAt(V(0, 5, 10), V(0, 3, -44));
      A3.UI.fade(false);
      await A3.UI.dialog(D3.SCRIPT.songIntro[st.songIdx], undefined);
      if (st.songIdx === 2) Rhythm.showGhosts();
      UI.toast(song.intro, 'gold', 6000);
      UI.toast('Teclas D F J K (ou 1 2 3 4) · ESPAÇO = MODO KING SIZE', '', 6000);
      const res = await Rhythm.run(song, { ks: st.songIdx === 2 ? 0.5 : 0 });
      Rhythm.hide();
      if (!res.won) {
        await A3.UI.dialog([['NARRADOR', song.battle ? 'A farofa venceu. A praia esquece mais um pouco...' : 'A praia continua parada. Ninguém lembrou de nada ainda.'], ['JINLONG', 'De novo. Do começo. Um grão de cada vez.']]);
        continue;
      }
      UI.toast(`🎸 ${res.acc}% de acerto · ${res.maxCombo} seguidas · ${res.score.toLocaleString('pt-BR')} pontos`, 'gold', 5000);
      st.songIdx++;
      save();
    }
  }

  // ---------------------------------------------------------------
  // FINAL
  // ---------------------------------------------------------------
  function skyGlyph(scene, ch, x, color) {
    const tex = K.canvasTex(64, 64, (g) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 64, 64); g.fillStyle = color; g.font = 'bold 52px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 32, 34); });
    tex.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.set(34, 34, 1); s.position.set(x, 70, -170); scene.add(s);
    return s;
  }
  async function finale() {
    const R = Rhythm.getScene();
    let fw = 0, glyphs = [];
    A3.setView(R.scene, A3.cam, (dt) => {
      R.crowd.userData.update(performance.now() / 1000, true);
      if (fw > 0 && Math.random() < dt * fw) { A2M.firework(R.scene, V(-100 + Math.random() * 200, 40 + Math.random() * 50, -170 - Math.random() * 40), [[0xffd040, 0xfff0a0], [0x9a6a2a, 0xffc060], [0xff4040, 0xffffff], [0x40c0ff, 0xffd040], [0xff80c0, 0xffffff]][Math.floor(Math.random() * 5)], 140, 18); if (Math.random() < 0.3) Sfx.firework(); }
      glyphs.forEach((g) => { g.material.opacity = Math.min(1, g.material.opacity + dt * 0.4); g.position.y = 70 + Math.sin(performance.now() / 700 + g.position.x) * 2; });
    });
    A3.letterbox(true);
    A3.camAt(V(0, 3, 14), V(0, 30, -160));
    if ($('#fade').classList.contains('on')) A3.UI.fade(false);
    await A3.talk(D3.SCRIPT.final, (who, i) => {
      if (who === 'DONA MEI') A3.camAt(R.frig.position.clone().add(V(10, 14, 24)), R.frig.position.clone().add(V(0, 6, 0)));
      else if (i >= 2) A3.camAt(V(0, 3, 14), V(0, 30, -160));
    }, async (cue) => {
      if (cue === 'fogos') { fw = 6; Sfx.boom(1.5); World.flash(0.6); setTimeout(() => World.flash(0), 150); Sfx.music('sad'); }
      if (cue === 'memorias') {
        fw = 3;
        glyphs.push(skyGlyph(R.scene, '金', -50, '#ffd040')); await A3.wait(900);
        glyphs.push(skyGlyph(R.scene, '豆', 50, '#e0a060')); await A3.wait(900);
      }
    });
    glyphs.push(skyGlyph(R.scene, '梅', 0, '#ff9ac0'));
    Sfx.gold();
    await A3.wait(3500);
    $('#btCn').textContent = '金 豆 梅';
    $('#btPt').textContent = '100% · O RIO LEMBROU';
    $('#bigText').classList.remove('hidden');
    await A3.wait(3500);
    $('#bigText').classList.add('hidden');
    await A3.UI.fade(true, true);
    await epilogo();
  }

  async function epilogo() {
    await A3.chapterCard('EPÍLOGO', 'O PRATO COMPLETO', '1º de janeiro de 2027', 100);
    // amanhecer em Copacabana
    const bay = A2M.buildBay('sky');
    bay.scene.background = new THREE.Color(0xf0a080); bay.scene.fog.color.setHex(0xf0b090);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), K.lam({ color: 0xe0c898 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.3, 30); bay.scene.add(sand);
    bay.scene.children.forEach((c) => { if (c.isAmbientLight) { c.color.setHex(0xffd8c0); c.intensity = 0.8; } });
    const mei = A3.person('mei'); mei.sit(); mei.g.position.set(0.6, 0.72, 14); mei.g.rotation.y = Math.PI; bay.scene.add(mei.g);
    const me = A3.person('jinlong'); me.g.position.set(-1.4, 0.3, 15); me.g.rotation.y = Math.PI * 0.75; bay.scene.add(me.g);
    const son = A3.person('son'); son.g.position.set(-2.6, 0.3, 15.6); son.g.rotation.y = Math.PI * 0.8; bay.scene.add(son.g);
    const well = A3.person('wellington'); well.g.position.set(2.6, 0.3, 16); well.g.rotation.y = -Math.PI * 0.8; bay.scene.add(well.g);
    const marm = A2M.mkMarmita(); marm.scale.setScalar(0.6); marm.position.set(-1.2, 1.4, 14.4); marm.visible = false; bay.scene.add(marm);
    A3.setView(bay.scene, A3.cam, (dt) => bay.update(dt));
    A3.letterbox(true);
    Sfx.music('sad');
    A3.camAt(V(0, 2.5, 22), V(0, 3, -60));
    await A3.UI.fade(false, true);
    await A3.talk(D3.SCRIPT.epilogo, (who, i) => {
      if (who === 'DONA MEI') A3.camAt(V(0.2, 2.3, 11.6), V(0.6, 1.9, 14));
      else if (who === 'JINLONG') A3.camAt(V(-0.3, 2.4, 12.6), V(-1.4, 2.1, 15));
      else if (who === 'XIAO DOU') A3.camAt(V(-1.6, 2.4, 13.2), V(-2.6, 2.1, 15.6));
      else if (who === 'WELLINGTON') A3.camAt(V(1.6, 2.4, 13.6), V(2.6, 2.1, 16));
      if (i === 5) { marm.visible = true; me.armL.rotation.x = me.armR.rotation.x = -1.3; A3.camAt(V(0.2, 1.9, 12.6), V(-1.2, 1.5, 14.4)); }
    });
    Sfx.raw.tone(110, 0.2, 'square', 0.1); Sfx.raw.tone(82, 0.5, 'square', 0.1, null, Sfx.raw.now() + 0.2);
    await A3.wait(1200);
    await A3.UI.fade(true);
    // três meses depois
    const R = restaurant('PF DOURADO · ARROZ · FEIJÃO · FAROFA · 黄梅');
    const cast = [['jinlong', -1, -3.9, 0], ['son', 1.8, -3.9, 0], ['mei', 0.4, -3.9, 0], ['wellington', -4, 2.5, 2.5], ['couve', 4, 2.8, -2.5], ['vinagrete', 2.4, 3.2, -2.8], ['torresmo', -5.5, -2, 1.2], ['kwanBurnt', -2.5, 3.4, 3]];
    const people = cast.map(([k, x, z, ry]) => { const p = A3.person(k); p.g.position.set(x, 0, z); p.g.rotation.y = ry; R.scene.add(p.g); return p; });
    people[6].g.scale.setScalar(1.3);
    let tt = 0;
    A3.setView(R.scene, A3.cam, (dt) => { tt += dt; R.fan.rotation.y += dt * 4; people[7].armL.rotation.x = people[7].armR.rotation.x = -1 + Math.sin(tt * 6) * 0.2; });
    A3.camAt(V(0, 3.4, 7), V(0, 1.8, -3));
    await A3.UI.fade(false);
    await A3.talk(D3.SCRIPT.epilogo2, (who, i) => {
      if (i === 1) A3.camAt(V(0, 3.2, -1), V(0, 3.7, -5));
      if (i === 2) A3.camAt(V(3.6, 2.6, 0), V(3.2, 1.8, 3));
      if (i === 4) A3.camAt(V(-2.5, 2.4, 0.8), V(-2.5, 1.8, 3.4));
      if (i === 5) A3.camMove(V(0, 2.6, 3), V(0, 4, 9), V(0, 2, -3.9), V(0, 2, -3.9), 8);
    });
    await credits();
    endScreen();
  }

  async function credits() {
    const el = $('#credits'), roll = $('#creditsRoll');
    roll.innerHTML = D3.CREDITS.map(([t, c]) => `<div class="cr ${c}">${t || '&nbsp;'}</div>`).join('');
    el.classList.remove('hidden');
    roll.style.animation = 'none'; void roll.offsetWidth; roll.style.animation = 'roll 38s linear forwards';
    Sfx.music('sad');
    await UI.waitOrClick(38000);
    el.classList.add('hidden');
    await A3.UI.fade(true);
  }

  function endScreen() {
    A3.letterbox(false);
    Sfx.music(null);
    $('#end3').classList.remove('hidden');
    $('#fade').classList.remove('on', 'white');
    UI.clearSave();
    isActive = false;
    A3.setActive(false);
  }

  // ---------------------------------------------------------------
  // API
  // ---------------------------------------------------------------
  async function start(saved) {
    K = World.kit; UI = window.GameUI;
    A3.init();
    st = Object.assign({ stage: 'prologo' }, saved || {});
    if (!STAGES.includes(st.stage)) st.stage = 'prologo';
    isActive = true;
    A3.setActive(true);
    UI.setPhase('act3');
    save();
    $('#hud').classList.add('hidden'); $('#hud2').classList.add('hidden');
    $('#fade').classList.add('on');
    const run = async (name, fn, next) => { if (st.stage === name) { await fn(); setStage(next); } };
    await run('prologo', prologo, 'treino');
    await run('treino', treino, 'torneio');
    await run('torneio', torneio, 'joa');
    await run('joa', joa, 'corrida');
    await run('corrida', corrida, 'reveillon');
    await run('reveillon', reveillon, 'final');
    if (st.stage === 'final') await finale();
  }

  function update(dt) {
    A3.update(dt);
    A3.endFrame();
  }

  return { start, update, render: () => A3.render(), isActive: () => isActive, debug: () => st };
})();
