// =====================================================================
//  ARROZ DOURADO — mundo 3D (Three.js r128)
//  Visual PS1/PS2: baixa resolução, vértices "tremendo" (snap),
//  texturas 64x64 sem filtro, iluminação por vértice, dithering 15-bit.
// =====================================================================

const World = (() => {
  const LOW_H = 256;
  const SNAP = '110.0, 82.0'; // grade do "vertex snapping" (quanto menor, mais treme)

  let renderer, scene, camera, rt, postScene, postCam, postMat;
  let lowW = 320;
  const clock = { t: 0 };
  const raycaster = new THREE.Raycaster();
  const pickables = [];

  // objetos
  const O = {};
  const helpers = {};
  let pigeons = [];
  let flying = [];
  let pileFrac = 1, pileShown = -1;
  let sackFrac = 1;
  let sackDrop = 0;
  let handAnim = 0;
  let toolId = null;
  let ringing = false, playing = false;
  let flicker = 0;
  let camMode = 'free', camScript = null;
  const look = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };
  const BASE_PITCH = -0.34;
  let windowMinute = -999, windowDay = 1;
  let streamRate = 0, streamAcc = 0;
  let gold = null;
  let shake = 0;

  // ---------------------------------------------------------------
  // utilidades
  // ---------------------------------------------------------------
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function psx(mat) {
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 _ps = gl_Position;
        _ps.xyz /= _ps.w;
        _ps.xy = floor(_ps.xy * vec2(${SNAP}) + 0.5) / vec2(${SNAP});
        _ps.xyz *= _ps.w;
        gl_Position = _ps;`
      );
    };
    return mat;
  }
  const lam = (opts) => psx(new THREE.MeshLambertMaterial(opts));
  const basic = (opts) => psx(new THREE.MeshBasicMaterial(opts));

  function canvasTex(w, h, draw, rep) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    t.userData = { canvas: c, ctx: g };
    return t;
  }

  function pixels(g, w, h, fn) {
    const img = g.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = fn(x, y, img.data[(y * w + x) * 4], img.data[(y * w + x) * 4 + 1], img.data[(y * w + x) * 4 + 2]);
      const i = (y * w + x) * 4;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  function noisy(base, amp, r) {
    const n = (r() - 0.5) * amp;
    return [base[0] + n, base[1] + n, base[2] + n];
  }

  function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
  function cyl(rt_, rb, h, seg, mat, open) { return new THREE.Mesh(new THREE.CylinderGeometry(rt_, rb, h, seg, 1, !!open), mat); }

  function textCanvas(w, h, bg, lines) {
    return canvasTex(w, h, (g) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      lines.forEach((l) => {
        g.fillStyle = l.c || '#fff';
        g.font = l.f || 'bold 12px monospace';
        g.textAlign = l.a || 'center';
        g.textBaseline = 'middle';
        g.fillText(l.t, l.x != null ? l.x : w / 2, l.y);
      });
    });
  }

  // UV baseado na posição no mundo (pra paredes com recorte casarem)
  function worldUV(geo, ox, oy, su, sv) {
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + ox) / su, (p.getY(i) + oy) / sv);
    uv.needsUpdate = true;
  }

  // ---------------------------------------------------------------
  // texturas procedurais
  // ---------------------------------------------------------------
  const TEX = {};
  function makeTextures() {
    TEX.wall = canvasTex(64, 64, (g, w, h) => {
      const r = rng(1);
      pixels(g, w, h, (x, y) => {
        const v = 1 - y / h; // 0 embaixo, 1 em cima
        if (v < 0.3) { // barrado verde (tinta óleo descascando)
          let c = noisy([92, 128, 98], 18, r);
          if (r() < 0.04) c = noisy([150, 140, 120], 20, r);
          return c;
        }
        if (v < 0.33) return noisy([50, 60, 45], 10, r);
        let c = noisy([170, 156, 128], 22, r);
        // escorridos de umidade
        const drip = Math.sin(x * 1.7) * Math.sin(x * 0.37 + 2);
        if (drip > 0.55 && v > 0.5) c = c.map((k) => k * 0.72);
        if (v > 0.9) c = c.map((k) => k * 0.8);
        return c;
      });
    });
    TEX.wall.wrapS = TEX.wall.wrapT = THREE.RepeatWrapping;

    TEX.floor = canvasTex(64, 64, (g, w, h) => {
      // piso de caquinho vermelho (clássico de quintal/galpão carioca)
      const r = rng(7);
      g.fillStyle = '#2a1410'; g.fillRect(0, 0, w, h);
      for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) {
        const cx = gx * 8 + 4 + (r() - 0.5) * 2, cy = gy * 8 + 4 + (r() - 0.5) * 2;
        const red = 120 + r() * 60;
        g.fillStyle = `rgb(${red},${30 + r() * 25},${25 + r() * 15})`;
        if (r() < 0.12) g.fillStyle = `rgb(${200 + r() * 30},${190 + r() * 30},${170})`;
        g.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + r();
          const rr = 2.6 + r() * 1.6;
          g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        g.fill();
      }
      const img = g.getImageData(0, 0, w, h);
      for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 20; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
      g.putImageData(img, 0, 0);
    }, [10, 8]);

    TEX.wood = canvasTex(64, 64, (g, w, h) => {
      const r = rng(3);
      pixels(g, w, h, (x, y) => {
        const plank = Math.floor(y / 16);
        const base = [[120, 78, 44], [132, 86, 48], [110, 70, 40], [126, 82, 46]][plank];
        let c = noisy(base, 14, r);
        const grain = Math.sin(x * 0.25 + Math.sin(y * 0.9 + plank) * 2);
        if (grain > 0.7) c = c.map((k) => k * 0.8);
        if (y % 16 === 0) c = [40, 24, 14];
        return c;
      });
    });

    TEX.burlap = canvasTex(32, 32, (g, w, h) => {
      const r = rng(5);
      pixels(g, w, h, (x, y) => {
        const weave = ((x + (y % 2)) % 2 === 0) ? 1.0 : 0.82;
        const c = noisy([196, 168, 118], 20, r);
        return c.map((k) => k * weave);
      });
    }, [2, 2]);

    TEX.skin = canvasTex(16, 16, (g, w, h) => {
      const r = rng(9);
      pixels(g, w, h, () => noisy([214, 168, 128], 22, r));
    });
    TEX.sleeve = canvasTex(16, 16, (g, w, h) => {
      const r = rng(11);
      pixels(g, w, h, (x, y) => (y % 5 === 0 ? [40, 52, 80] : noisy([62, 78, 118], 16, r)));
    });
    TEX.metal = canvasTex(32, 32, (g, w, h) => {
      const r = rng(13);
      pixels(g, w, h, (x, y) => noisy([120, 124, 128], 26, r));
    });
    TEX.ceiling = canvasTex(32, 32, (g, w, h) => {
      const r = rng(15);
      pixels(g, w, h, (x) => noisy(x % 8 < 4 ? [70, 66, 60] : [52, 48, 44], 10, r));
    }, [6, 6]);
    TEX.pigeon = canvasTex(16, 16, (g, w, h) => {
      const r = rng(17);
      pixels(g, w, h, (x, y) => (y < 5 ? noisy([90, 110, 120], 14, r) : noisy([120, 120, 130], 18, r)));
    });
    TEX.red = canvasTex(16, 16, (g, w, h) => {
      const r = rng(19);
      pixels(g, w, h, () => noisy([170, 28, 24], 22, r));
    });
    TEX.gold = canvasTex(16, 16, (g, w, h) => {
      const r = rng(21);
      pixels(g, w, h, () => noisy([230, 180, 50], 40, r));
    });

    TEX.label = labelTex('金龙米', 'ARROZ DRAGÃO', '#b01818', '#ffd34a');
    TEX.labelFinal = labelTex('金', '', '#e9dcc0', '#7a0f0f');

    TEX.sign = textCanvas(256, 32, '#7a0f0f', [
      { t: '金龙米  ARROZ DRAGÃO DOURADO  · DESDE 1962', y: 16, c: '#ffcf3a', f: 'bold 15px monospace' },
    ]);
    TEX.accident = textCanvas(64, 32, '#f2e7c8', [
      { t: 'DIAS SEM', y: 7, c: '#222', f: 'bold 8px monospace' },
      { t: 'ACIDENTE', y: 15, c: '#222', f: 'bold 8px monospace' },
      { t: '093', y: 25, c: '#c01010', f: 'bold 11px monospace' },
    ]);
    TEX.smoke = textCanvas(64, 32, '#f2f2f2', [
      { t: 'PROIBIDO', y: 10, c: '#c01010', f: 'bold 10px monospace' },
      { t: 'FUMAR', y: 22, c: '#c01010', f: 'bold 10px monospace' },
    ]);
    TEX.calendar = canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b01818'; g.fillRect(0, 0, w, 14);
      g.fillStyle = '#fff'; g.font = 'bold 9px monospace'; g.textAlign = 'center';
      g.fillText('NOV 2026', w / 2, 10);
      g.font = '7px monospace'; g.fillStyle = '#333';
      let d = 1;
      const first = 0; // 1/11/2026 é domingo
      for (let i = 0; i < 35 && d <= 30; i++) {
        if (i < first) continue;
        const cx = 5 + (i % 7) * 9, cy = 22 + Math.floor(i / 7) * 9;
        g.fillStyle = (d >= 20 && d <= 22) ? '#c01010' : '#333';
        g.fillText(String(d), cx, cy);
        if (d >= 20 && d <= 22) { g.strokeStyle = '#c01010'; g.strokeRect(cx - 4, cy - 7, 8, 9); }
        d++;
      }
    });
    TEX.founder = canvasTex(32, 48, (g, w, h) => {
      g.fillStyle = '#3a2a18'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c8a050'; g.fillRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#5a4630'; g.fillRect(4, 4, w - 8, h - 14);
      // rostinho pixelado de um velho (o fundador)
      g.fillStyle = '#d8b090'; g.fillRect(11, 10, 10, 13);
      g.fillStyle = '#eee'; g.fillRect(10, 8, 12, 3);
      g.fillStyle = '#222'; g.fillRect(13, 15, 2, 1); g.fillRect(17, 15, 2, 1);
      g.fillStyle = '#ccc'; g.fillRect(12, 21, 8, 4);
      g.fillStyle = '#222'; g.fillRect(9, 25, 14, 9);
      g.fillStyle = '#7a0f0f'; g.font = 'bold 8px monospace'; g.textAlign = 'center';
      g.fillText('黄大山', w / 2, h - 4);
    });
    TEX.saints = canvasTex(64, 32, (g, w, h) => {
      // São Jorge (o santo guerreiro do Rio) e Guan Yu (o deus guerreiro das tríades)
      g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2d4f8a'; g.fillRect(2, 2, 28, 28);
      g.fillStyle = '#eee'; g.fillRect(8, 14, 14, 8); // cavalo
      g.fillStyle = '#c01010'; g.fillRect(12, 7, 5, 8);
      g.fillStyle = '#3a8a3a'; g.fillRect(4, 24, 10, 4); // dragão
      g.fillStyle = '#ddd'; g.fillRect(15, 6, 1, 18); // lança
      g.fillStyle = '#8a1010'; g.fillRect(34, 2, 28, 28);
      g.fillStyle = '#c03a1a'; g.fillRect(42, 8, 12, 12); // rosto vermelho de Guan Yu
      g.fillStyle = '#111'; g.fillRect(44, 18, 8, 8); // barba
      g.fillStyle = '#2a6a2a'; g.fillRect(40, 20, 3, 10);
      g.fillStyle = '#e8c040'; g.fillRect(55, 4, 2, 24); // guandao
    });
    TEX.bichoScreen = canvasTex(64, 32, () => {});
    TEX.belt = canvasTex(32, 16, (g, w, h) => {
      pixels(g, w, h, (x, y) => ((x % 8) < 1 ? [20, 20, 20] : [48 + (y % 3) * 4, 46, 44]));
    }, [12, 1]);
    TEX.view = canvasTex(128, 64, () => {});
  }

  function labelTex(big, small, bg, fg) {
    return canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = small ? 'bold 18px serif' : 'bold 40px serif';
      g.fillText(big, w / 2, small ? 26 : 34);
      if (small) { g.font = 'bold 8px monospace'; g.fillText(small, w / 2, 46); g.fillText('TIPO 1 · 5KG', w / 2, 55); }
    });
  }

  // ---------------------------------------------------------------
  // vista da janela: céu do Rio que muda com a hora
  // ---------------------------------------------------------------
  const SKY = [
    [0, '#05060f', '#0d1024'], [300, '#05060f', '#141530'], [360, '#28305a', '#e07a4a'],
    [420, '#4a78b8', '#f0b070'], [540, '#3f8ad8', '#9cc8ef'], [960, '#3a86d4', '#a8d0f0'],
    [1050, '#4a5aa0', '#ff9a50'], [1110, '#2a2a60', '#e0506a'], [1170, '#10122a', '#3a2a5a'],
    [1260, '#05060f', '#0d1024'], [1440, '#05060f', '#0d1024'],
  ];
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function lerpC(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
  function skyAt(min) {
    min = ((min % 1440) + 1440) % 1440;
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (min >= a[0] && min <= b[0]) {
        const t = (min - a[0]) / (b[0] - a[0]);
        return { top: lerpC(hex(a[1]), hex(b[1]), t), bot: lerpC(hex(a[2]), hex(b[2]), t) };
      }
    }
    return { top: hex('#05060f'), bot: hex('#0d1024') };
  }
  function nightness(min) {
    if (min < 330) return 1; if (min < 420) return 1 - (min - 330) / 90;
    if (min < 1080) return 0; if (min < 1200) return (min - 1080) / 120; return 1;
  }

  function drawView(min, day) {
    const g = TEX.view.userData.ctx, w = 128, h = 64;
    const s = skyAt(min), n = nightness(min);
    const r = rng(42);
    for (let y = 0; y < h; y++) {
      const c = lerpC(s.top, s.bot, y / (h * 0.7));
      g.fillStyle = `rgb(${c})`; g.fillRect(0, y, w, 1);
    }
    if (n > 0.3) { // estrelas
      for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,220,${(n - 0.3) * (0.4 + r() * 0.6)})`; g.fillRect(Math.floor(r() * w), Math.floor(r() * 30), 1, 1); }
    }
    // sol / lua
    if (n < 0.6) {
      const t = (min - 360) / (1110 - 360);
      const sx = 10 + t * 108, sy = 40 - Math.sin(t * Math.PI) * 34;
      g.fillStyle = n > 0.2 ? '#ff8a40' : '#fff2b0'; g.fillRect(Math.round(sx) - 2, Math.round(sy) - 2, 5, 5);
    } else { g.fillStyle = '#f0f0d0'; g.fillRect(96, 8, 4, 4); g.fillStyle = `rgb(${s.top})`; g.fillRect(97, 8, 3, 3); }

    const mtn = lerpC([40, 60, 50], [8, 10, 18], n);
    const mtn2 = lerpC([60, 86, 70], [12, 14, 24], n);
    // Corcovado com o Cristo
    g.fillStyle = `rgb(${mtn})`;
    g.beginPath(); g.moveTo(0, 50); g.lineTo(6, 36); g.lineTo(18, 30); g.lineTo(26, 18); g.lineTo(31, 17); g.lineTo(40, 34); g.lineTo(58, 44); g.lineTo(58, 64); g.lineTo(0, 64); g.fill();
    g.fillStyle = n > 0.5 ? '#fffbe0' : `rgb(${lerpC([230, 230, 230], mtn, 0.2)})`;
    g.fillRect(28, 12, 1, 6); g.fillRect(26, 13, 5, 1);
    if (n > 0.5) { g.fillStyle = 'rgba(255,250,200,0.25)'; g.fillRect(24, 9, 9, 10); }
    // Pão de Açúcar + Morro da Urca
    g.fillStyle = `rgb(${mtn2})`;
    g.beginPath(); g.moveTo(70, 64); g.lineTo(76, 44); g.lineTo(84, 40); g.lineTo(90, 46); g.lineTo(96, 46);
    g.quadraticCurveTo(100, 18, 108, 20); g.quadraticCurveTo(114, 24, 116, 46); g.lineTo(128, 52); g.lineTo(128, 64); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.moveTo(84, 40); g.lineTo(106, 21); g.stroke(); // bondinho
    // mar
    const sea = lerpC(lerpC(s.bot, [20, 60, 90], 0.5), [5, 8, 20], n * 0.7);
    g.fillStyle = `rgb(${sea})`; g.fillRect(0, 52, 128, 12);
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(Math.floor(r() * 120), 53 + Math.floor(r() * 10), 4, 1); }
    // luzes de favela no morro + cidade
    if (n > 0.2) {
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(r() * 56), y = 34 + Math.floor(r() * 18);
        if (y > 50 - x * 0.1) continue;
        g.fillStyle = r() < 0.7 ? `rgba(255,200,90,${n})` : `rgba(255,255,255,${n * 0.8})`;
        g.fillRect(x, y, 1, 1);
      }
    }
    // guindastes e contêineres do porto (Zona Portuária)
    const fg = lerpC([30, 30, 34], [4, 4, 8], n);
    g.fillStyle = `rgb(${fg})`;
    [[14, 1], [60, 0.8], [118, 1]].forEach(([x, k]) => {
      g.fillRect(x, 26 + 10 * (1 - k), 2, 40); g.fillRect(x - 10, 28 + 10 * (1 - k), 22, 2); g.fillRect(x + 8, 30, 1, 10);
      if (n > 0.3) { g.fillStyle = '#ff2020'; g.fillRect(x, 25 + 10 * (1 - k), 1, 1); g.fillStyle = `rgb(${fg})`; }
    });
    const cols = ['#8a2a20', '#2a5a8a', '#c08a20', '#2a7a4a', '#7a7a7a'];
    for (let i = 0; i < 16; i++) {
      g.fillStyle = cols[i % 5]; g.globalAlpha = 1 - n * 0.75;
      g.fillRect(i * 8, 58 - (i % 3) * 3, 7, 3);
    }
    g.globalAlpha = 1;
    if (day === 3 && min > 1200) { // carros pretos com farol esperando lá fora
      for (let i = 0; i < 4; i++) { g.fillStyle = '#000'; g.fillRect(30 + i * 18, 60, 12, 4); g.fillStyle = '#fffbd0'; g.fillRect(30 + i * 18, 61, 1, 1); }
    }
    TEX.view.needsUpdate = true;
  }

  // ---------------------------------------------------------------
  // construção da cena
  // ---------------------------------------------------------------
  function buildRoom() {
    const wallMat = lam({ map: TEX.wall });
    const RX = 6, ZB = -6, ZF = 4, H = 5;

    function wallPiece(w, h, cx, cy, ox) {
      const geo = new THREE.PlaneGeometry(w, h, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
      worldUV(geo, cx + ox, cy, 2.4, H);
      return new THREE.Mesh(geo, wallMat);
    }
    // parede do fundo com recorte da janela (x -1.7..1.7, y 1.9..3.7)
    const WX = 1.7, WY0 = 1.9, WY1 = 3.7;
    const back = new THREE.Group();
    [[RX - WX, H, -(WX + (RX - WX) / 2), H / 2], [RX - WX, H, WX + (RX - WX) / 2, H / 2], [WX * 2, WY0, 0, WY0 / 2], [WX * 2, H - WY1, 0, WY1 + (H - WY1) / 2]]
      .forEach(([w, h, x, y]) => { const m = wallPiece(w, h, x, y, 0); m.position.set(x, y, ZB); back.add(m); });
    scene.add(back);

    const left = wallPiece(ZF - ZB, H, 0, H / 2, 0); left.rotation.y = Math.PI / 2; left.position.set(-RX, H / 2, (ZB + ZF) / 2); scene.add(left);
    const right = wallPiece(ZF - ZB, H, 0, H / 2, 0); right.rotation.y = -Math.PI / 2; right.position.set(RX, H / 2, (ZB + ZF) / 2); scene.add(right);
    const front = wallPiece(RX * 2, H, 0, H / 2, 0); front.rotation.y = Math.PI; front.position.set(0, H / 2, ZF); scene.add(front);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, ZF - ZB, 12, 10), lam({ map: TEX.floor, color: 0xa89888 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (ZB + ZF) / 2); scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, ZF - ZB, 6, 5), lam({ map: TEX.ceiling }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (ZB + ZF) / 2); scene.add(ceil);
    const beamMat = lam({ map: TEX.metal, color: 0x6a5a4a });
    for (let z = -5; z <= 3; z += 2.5) { const b = box(RX * 2, 0.25, 0.2, beamMat); b.position.set(0, H - 0.15, z); scene.add(b); }

    // janela
    const view = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.0), basic({ map: TEX.view, fog: false }));
    view.position.set(0, 2.8, ZB - 0.9); scene.add(view);
    const frameMat = lam({ color: 0x2a2620 });
    [[WX * 2 + 0.1, 0.08, 0, WY1], [WX * 2 + 0.1, 0.14, 0, WY0], [0.08, WY1 - WY0, -WX, (WY0 + WY1) / 2], [0.08, WY1 - WY0, WX, (WY0 + WY1) / 2],
      [0.05, WY1 - WY0, 0, (WY0 + WY1) / 2], [WX * 2, 0.05, 0, (WY0 + WY1) / 2]]
      .forEach(([w, h, x, y]) => { const f = box(w, h, 0.12, frameMat); f.position.set(x, y, ZB + 0.02); scene.add(f); });
    const sill = box(WX * 2 + 0.3, 0.06, 0.35, lam({ color: 0x8a8070 })); sill.position.set(0, WY0 - 0.02, ZB + 0.15); scene.add(sill);
    // grade de ferro da janela (clássico)
    for (let x = -WX + 0.3; x < WX; x += 0.34) { const b = box(0.025, WY1 - WY0, 0.025, frameMat); b.position.set(x, (WY0 + WY1) / 2, ZB - 0.1); scene.add(b); }

    // placas
    const plane = (tex, w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam({ map: tex })); m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m); return m; };
    plane(TEX.sign, 4.2, 0.52, 0, 4.25, ZB + 0.03);
    plane(TEX.accident, 0.8, 0.4, -2.6, 3.6, ZB + 0.03);
    plane(TEX.calendar, 0.6, 0.6, -2.6, 2.7, ZB + 0.03);
    plane(TEX.smoke, 0.6, 0.3, 3.4, 3.5, ZB + 0.03);
    plane(TEX.founder, 0.6, 0.9, 4.4, 2.8, ZB + 0.03);
    plane(TEX.saints, 1.0, 0.5, -RX + 0.03, 2.6, -2.6, Math.PI / 2);

    // altar com vela (São Jorge + Guan Yu)
    const shelf = box(0.4, 0.05, 1.2, lam({ map: TEX.wood })); shelf.position.set(-RX + 0.2, 2.2, -2.6); scene.add(shelf);
    const candle = cyl(0.04, 0.04, 0.16, 6, lam({ color: 0xc01010 })); candle.position.set(-RX + 0.25, 2.31, -2.3); scene.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 3), basic({ color: 0xffc040 })); flame.position.set(-RX + 0.25, 2.42, -2.3); scene.add(flame);
    O.candleLight = new THREE.PointLight(0xff7030, 0.6, 3, 2); O.candleLight.position.set(-RX + 0.5, 2.5, -2.3); scene.add(O.candleLight);
    O.flame = flame;
    for (let i = 0; i < 3; i++) { const inc = box(0.01, 0.25, 0.01, lam({ color: 0x7a3a10 })); inc.position.set(-RX + 0.25, 2.35, -2.9 + i * 0.05); inc.rotation.x = (i - 1) * 0.15; scene.add(inc); }

    // porta (lado direito) — importante pro final
    const doorPivot = new THREE.Group(); doorPivot.position.set(RX - 0.1, 0, -0.2); scene.add(doorPivot);
    const door = box(0.08, 2.6, 1.4, lam({ map: TEX.metal, color: 0x6a7a6a })); door.position.set(0, 1.3, -0.7); doorPivot.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 3), lam({ color: 0xc0a040 })); knob.position.set(-0.08, 1.2, -1.25); doorPivot.add(knob);
    O.doorPivot = doorPivot;
    O.doorLight = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
    O.doorLight.rotation.y = -Math.PI / 2; O.doorLight.position.set(RX - 0.025, 1.3, -0.9); scene.add(O.doorLight);

    // prateleiras com sacos
    const shelfMat = lam({ map: TEX.metal, color: 0x5a6a8a });
    const sackMat = lam({ map: TEX.burlap });
    const r = rng(77);
    [[-5.3, -4.5], [-5.3, 0.8], [5.3, -4.2]].forEach(([x, z]) => {
      for (let lv = 0; lv < 3; lv++) {
        const s = box(1.1, 0.06, 2.4, shelfMat); s.position.set(x, 0.4 + lv * 1.2, z); scene.add(s);
        for (let k = 0; k < 4; k++) {
          if (r() < 0.2) continue;
          const sk = box(0.7, 0.45, 0.5, sackMat); sk.position.set(x + (r() - 0.5) * 0.2, 0.66 + lv * 1.2, z - 0.85 + k * 0.58); sk.rotation.y = (r() - 0.5) * 0.4; scene.add(sk);
        }
      }
      [[-0.5, -1.2], [0.5, -1.2], [-0.5, 1.2], [0.5, 1.2]].forEach(([dx, dz]) => { const p = box(0.06, 3.0, 0.06, shelfMat); p.position.set(x + dx, 1.5, z + dz); scene.add(p); });
    });
    // pilha de sacos no chão
    for (let i = 0; i < 7; i++) { const sk = box(0.75, 0.42, 0.55, sackMat); sk.position.set(-3.6 + (i % 3) * 0.8, 0.21 + Math.floor(i / 3) * 0.42, -4.6); sk.rotation.y = (r() - 0.5) * 0.3; scene.add(sk); }

    // telefone vermelho na parede
    O.phone = new THREE.Group(); O.phone.position.set(2.5, 2.2, ZB + 0.08); scene.add(O.phone);
    O.phoneMat = lam({ map: TEX.red, emissive: 0x000000 });
    const ph = box(0.32, 0.46, 0.14, O.phoneMat); O.phone.add(ph);
    const hs = box(0.1, 0.5, 0.1, O.phoneMat); hs.position.set(-0.2, 0, 0.06); O.phone.add(hs); O.handset = hs;
    const dial = cyl(0.08, 0.08, 0.02, 8, lam({ color: 0xeeeeee })); dial.rotation.x = Math.PI / 2; dial.position.set(0.02, 0.02, 0.08); O.phone.add(dial);
    const hit = box(0.6, 0.7, 0.4, new THREE.MeshBasicMaterial({ visible: false })); hit.userData.pick = 'phone'; O.phone.add(hit); pickables.push(hit);
  }

  function buildTable() {
    const woodMat = lam({ map: TEX.wood });
    const top = box(3.4, 0.12, 1.7, woodMat); top.position.set(0, 0.94, 0); scene.add(top);
    [[-1.55, -0.75], [1.55, -0.75], [-1.55, 0.75], [1.55, 0.75]].forEach(([x, z]) => { const l = box(0.12, 0.9, 0.12, woodMat); l.position.set(x, 0.45, z); scene.add(l); });
    const TY = 1.0;

    // lâmpada pendurada
    const cord = box(0.015, 2.4, 0.015, lam({ color: 0x111111 })); cord.position.set(0, 3.8, -0.1); scene.add(cord);
    const shade = cyl(0.12, 0.45, 0.3, 8, lam({ color: 0x2a5a3a, side: THREE.DoubleSide }), true); shade.position.set(0, 2.55, -0.1); scene.add(shade);
    O.bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), basic({ color: 0xfff0c0 })); O.bulb.position.set(0, 2.42, -0.1); scene.add(O.bulb);
    O.lamp = new THREE.PointLight(0xffd8a0, 1.5, 9, 1.6); O.lamp.position.set(0, 2.3, -0.1); scene.add(O.lamp);

    // saco aberto
    O.sack = new THREE.Group(); O.sack.position.set(-1.05, TY, -0.15); scene.add(O.sack);
    const sb = new THREE.CylinderGeometry(0.34, 0.4, 0.85, 8, 4);
    const r = rng(31), p = sb.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (r() - 0.5) * 0.12; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    sb.computeVertexNormals();
    O.sackBody = new THREE.Mesh(sb, lam({ map: TEX.burlap })); O.sackBody.position.y = 0.425; O.sack.add(O.sackBody);
    O.sackRice = new THREE.Mesh(new THREE.CircleGeometry(0.33, 8), lam({ color: 0xf2ecd8 })); O.sackRice.rotation.x = -Math.PI / 2; O.sackRice.position.y = 0.84; O.sack.add(O.sackRice);
    const collar = cyl(0.42, 0.34, 0.12, 8, lam({ map: TEX.burlap, side: THREE.DoubleSide }), true); collar.position.y = 0.9; O.sack.add(collar); O.collar = collar;
    O.labelMat = lam({ map: TEX.label });
    O.label = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), O.labelMat); O.label.position.set(0.05, 0.42, 0.39); O.label.rotation.y = 0.15; O.sack.add(O.label);
    const sh = box(0.9, 1.2, 0.9, new THREE.MeshBasicMaterial({ visible: false })); sh.position.y = 0.5; sh.userData.pick = 'pile'; O.sack.add(sh); pickables.push(sh);

    // pilha de arroz (instanced)
    const N = 380;
    const grainGeo = new THREE.OctahedronGeometry(0.028, 0); grainGeo.scale(1.6, 0.6, 0.6);
    const grainMat = lam({ color: 0xf4eedc });
    O.pile = new THREE.InstancedMesh(grainGeo, grainMat, N);
    O.pile.position.set(-0.05, TY, 0.12);
    const pts = [];
    const rr = rng(55);
    for (let i = 0; i < N; i++) {
      const rad = 0.48 * Math.sqrt(rr()), a = rr() * Math.PI * 2;
      const maxH = 0.32 * Math.pow(1 - rad / 0.48, 1.3);
      pts.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad * 0.8, y: 0.015 + rr() * maxH, rx: rr() * 6, ry: rr() * 6 });
    }
    pts.sort((a, b) => a.y - b.y);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s1 = new THREE.Vector3(1, 1, 1);
    pts.forEach((pt, i) => { e.set(pt.rx, pt.ry, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(pt.x, pt.y, pt.z), q, s1); O.pile.setMatrixAt(i, m); });
    O.pilePts = pts;
    O.pileN = N;
    scene.add(O.pile);
    const base = new THREE.Mesh(new THREE.CircleGeometry(0.5, 9), lam({ color: 0xe8e0c8 })); base.rotation.x = -Math.PI / 2; base.scale.set(1, 0.8, 1); base.position.set(-0.05, TY + 0.005, 0.12); scene.add(base); O.pileBase = base;
    const ph = cyl(0.55, 0.55, 0.5, 8, new THREE.MeshBasicMaterial({ visible: false })); ph.position.set(-0.05, TY + 0.2, 0.12); ph.userData.pick = 'pile'; scene.add(ph); pickables.push(ph);

    // pote dos grãos contados
    O.pot = new THREE.Group(); O.pot.position.set(0.95, TY, 0.32); scene.add(O.pot);
    const potMat = lam({ color: 0xc8c8d0, map: TEX.metal, side: THREE.DoubleSide });
    const pot = cyl(0.26, 0.2, 0.32, 9, potMat, true); pot.position.y = 0.16; O.pot.add(pot);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.2, 9), potMat); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.01; O.pot.add(bottom);
    O.potRice = new THREE.Mesh(new THREE.CircleGeometry(0.24, 9), lam({ color: 0xf4eedc })); O.potRice.rotation.x = -Math.PI / 2; O.potRice.position.y = 0.03; O.pot.add(O.potRice);
    const potLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.1), lam({ map: textCanvas(64, 32, '#f2e7c8', [{ t: 'CONTADOS', y: 16, c: '#222', f: 'bold 11px monospace' }]) }));
    potLabel.position.set(0, 0.16, 0.24); O.pot.add(potLabel);

    // rádio / toca-fitas
    O.boombox = new THREE.Group(); O.boombox.position.set(1.05, TY, -0.48); O.boombox.rotation.y = -0.25; scene.add(O.boombox);
    const bbMat = lam({ color: 0x3a3a3e, map: TEX.metal });
    const bb = box(0.62, 0.32, 0.2, bbMat); bb.position.y = 0.16; O.boombox.add(bb);
    [-0.19, 0.19].forEach((x) => { const sp = cyl(0.1, 0.1, 0.02, 8, lam({ color: 0x111111 })); sp.rotation.x = Math.PI / 2; sp.position.set(x, 0.15, 0.1); O.boombox.add(sp); });
    const win = box(0.16, 0.09, 0.02, lam({ color: 0x223322 })); win.position.set(0, 0.18, 0.1); O.boombox.add(win);
    O.tapeLed = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: 0x330000 })); O.tapeLed.position.set(0, 0.06, 0.11); O.boombox.add(O.tapeLed);
    const handle = box(0.5, 0.03, 0.03, bbMat); handle.position.set(0, 0.38, 0); O.boombox.add(handle);
    const ant = box(0.01, 0.5, 0.01, lam({ color: 0xaaaaaa })); ant.position.set(0.26, 0.5, -0.05); ant.rotation.z = -0.4; O.boombox.add(ant);
    const bh = box(0.8, 0.6, 0.5, new THREE.MeshBasicMaterial({ visible: false })); bh.position.y = 0.2; bh.userData.pick = 'boombox'; O.boombox.add(bh); pickables.push(bh);

    O.TY = TY;
  }

  // ---------------------------------------------------------------
  // mãos do jogador (estilo Quake / PS1)
  // ---------------------------------------------------------------
  function buildHands() {
    const skin = lam({ map: TEX.skin });
    const sleeve = lam({ map: TEX.sleeve });
    function hand(side) {
      const g = new THREE.Group();
      const arm = box(0.15, 0.15, 0.55, sleeve); arm.position.set(0, -0.02, 0.3); g.add(arm);
      const cuff = box(0.16, 0.16, 0.05, lam({ color: 0xe0e0e0 })); cuff.position.set(0, -0.02, 0.03); g.add(cuff);
      const palm = box(0.15, 0.06, 0.16, skin); palm.position.set(0, 0, -0.07); g.add(palm);
      for (let i = 0; i < 4; i++) {
        const f = box(0.032, 0.035, 0.1, skin);
        f.position.set(-0.055 + i * 0.037, -0.012, -0.19);
        f.rotation.x = -0.35; g.add(f);
      }
      const th = box(0.035, 0.035, 0.09, skin); th.position.set(side * 0.09, 0, -0.08); th.rotation.y = side * 0.6; g.add(th);
      g.userData.thumb = th;
      return g;
    }
    O.handR = hand(-1); O.handR.position.set(0.42, -0.36, -0.62); O.handR.rotation.set(0.25, -0.15, 0.1); camera.add(O.handR);
    O.handL = hand(1); O.handL.position.set(-0.46, -0.4, -0.64); O.handL.rotation.set(0.3, 0.2, -0.1); camera.add(O.handL);
    O.handRBase = O.handR.position.clone();
    O.tools = {};
    const silver = lam({ color: 0xd0d0d8 });
    const t1 = new THREE.Group(); [-1, 1].forEach((s) => { const b = box(0.012, 0.012, 0.16, silver); b.position.set(s * 0.012, 0, -0.28); b.rotation.y = s * 0.06; t1.add(b); }); O.tools.pinca = t1;
    const t2 = new THREE.Group(); [-1, 1].forEach((s) => { const b = cyl(0.007, 0.01, 0.32, 4, lam({ color: 0x9a1a1a })); b.rotation.x = Math.PI / 2; b.position.set(s * 0.015, 0, -0.32); t2.add(b); }); O.tools.hashi = t2;
    const t3 = new THREE.Group(); { const h = cyl(0.012, 0.012, 0.35, 5, lam({ map: TEX.wood })); h.rotation.x = Math.PI / 2; h.position.z = -0.3; t3.add(h); const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 3), lam({ map: TEX.wood })); b.scale.set(1, 0.4, 1.3); b.position.z = -0.5; t3.add(b); } O.tools.colher = t3;
    const t4 = new THREE.Group(); { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 3, 10), lam({ map: TEX.wood })); ring.rotation.x = Math.PI / 2; ring.position.z = -0.32; t4.add(ring); const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), lam({ color: 0x888888, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })); mesh.rotation.x = -Math.PI / 2; mesh.position.z = -0.32; t4.add(mesh); } O.tools.peneira = t4;
    const t5 = new THREE.Group(); { const h = cyl(0.015, 0.015, 0.45, 5, lam({ map: TEX.wood })); h.rotation.x = Math.PI / 2; h.position.z = -0.3; t5.add(h); const b = box(0.14, 0.01, 0.16, lam({ map: TEX.metal })); b.position.z = -0.58; t5.add(b); } O.tools.pa = t5;
    Object.values(O.tools).forEach((t) => { t.visible = false; O.handR.add(t); });

    // grão dourado na mão esquerda (final)
    O.goldInHand = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), basic({ color: 0xffd040 }));
    O.goldInHand.scale.set(1.6, 0.6, 0.6); O.goldInHand.position.set(0, 0.05, -0.12); O.goldInHand.visible = false; O.handL.add(O.goldInHand);
  }

  // ---------------------------------------------------------------
  // ajudantes visuais
  // ---------------------------------------------------------------
  function mkPigeon() {
    const g = new THREE.Group();
    const mat = lam({ map: TEX.pigeon });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), mat); body.scale.set(0.9, 0.85, 1.35); body.position.y = 0.08; g.add(body);
    const head = new THREE.Group(); head.position.set(0, 0.16, -0.08); g.add(head);
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 3), lam({ color: 0x6a7a8a })); head.add(hm);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 4), lam({ color: 0xd08a30 })); beak.rotation.x = -Math.PI / 2; beak.position.z = -0.05; head.add(beak);
    const eye = box(0.012, 0.012, 0.012, basic({ color: 0xff6a00 })); eye.position.set(0.035, 0.01, -0.02); head.add(eye);
    const tail = box(0.08, 0.02, 0.1, mat); tail.position.set(0, 0.08, 0.13); tail.rotation.x = -0.3; g.add(tail);
    [-0.03, 0.03].forEach((x) => { const l = box(0.01, 0.04, 0.01, lam({ color: 0xc05050 })); l.position.set(x, 0.02, 0); g.add(l); });
    g.userData.head = head;
    g.userData.phase = Math.random() * 10;
    return g;
  }

  function buildHelpers() {
    const TY = O.TY;
    const spots = [[-1.45, TY, 0.6, 0.6], [0.45, TY, -0.72, 0], [-0.55, TY, -0.72, 0.3], [1.5, TY, 0.62, -0.5],
      [-1.2, 1.92, -5.85, 0], [-0.4, 1.92, -5.85, 0.4], [0.4, 1.92, -5.85, -0.2], [1.2, 1.92, -5.85, 0.1]];
    spots.forEach(([x, y, z, ry]) => { const p = mkPigeon(); p.position.set(x, y, z); p.rotation.y = ry + Math.PI; p.visible = false; scene.add(p); pigeons.push(p); });

    // ábaco
    const ab = new THREE.Group(); ab.position.set(0.05, TY, -0.62); ab.visible = false; scene.add(ab);
    const fm = lam({ map: TEX.wood });
    [[0.7, 0.04, 0.06, 0, 0.02], [0.7, 0.04, 0.06, 0, 0.36], [0.04, 0.38, 0.06, -0.33, 0.19], [0.04, 0.38, 0.06, 0.33, 0.19], [0.7, 0.03, 0.06, 0, 0.27]]
      .forEach(([w, h, d, x, y]) => { const b = box(w, h, d, fm); b.position.set(x, y, 0); ab.add(b); });
    ab.userData.beads = [];
    for (let rI = 0; rI < 7; rI++) {
      const x = -0.27 + rI * 0.09;
      const rod = box(0.008, 0.33, 0.008, lam({ color: 0x555555 })); rod.position.set(x, 0.19, 0); ab.add(rod);
      for (let b = 0; b < 4; b++) {
        const bead = new THREE.Mesh(new THREE.OctahedronGeometry(0.025, 0), lam({ color: b === 0 ? 0xc01818 : 0x1a1a1a }));
        bead.scale.set(1.3, 0.8, 1.3); bead.position.set(x, b === 0 ? 0.31 : 0.06 + b * 0.04, 0); ab.add(bead);
        bead.userData.base = bead.position.y; ab.userData.beads.push(bead);
      }
    }
    helpers.abaco = ab;

    // maquininha do bicho
    const bi = new THREE.Group(); bi.position.set(2.15, 0, -0.9); bi.rotation.y = -0.6; bi.visible = false; scene.add(bi);
    const bm = box(0.6, 1.2, 0.45, lam({ map: TEX.red })); bm.position.y = 0.6; bi.add(bm);
    O.bichoScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.26), new THREE.MeshBasicMaterial({ map: TEX.bichoScreen }));
    O.bichoScreen.position.set(0, 0.95, 0.23); bi.add(O.bichoScreen);
    const lever = box(0.04, 0.3, 0.04, lam({ color: 0xcccccc })); lever.position.set(0.34, 0.85, 0); bi.add(lever); bi.userData.lever = lever;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), basic({ color: 0xff2020 })); ball.position.set(0.34, 1.02, 0); bi.add(ball);
    helpers.bicho = bi;

    // balança da CEASA
    const ba = new THREE.Group(); ba.position.set(-2.2, 0, -1.0); ba.rotation.y = 0.5; ba.visible = false; scene.add(ba);
    const bmat = lam({ map: TEX.metal, color: 0x8a9aa8 });
    const b1 = box(0.7, 0.1, 0.7, bmat); b1.position.y = 0.05; ba.add(b1);
    const b2 = box(0.08, 1.1, 0.08, bmat); b2.position.set(0, 0.6, -0.3); ba.add(b2);
    const plate = cyl(0.3, 0.3, 0.04, 8, bmat); plate.position.y = 0.6; ba.add(plate);
    const pileOn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 7), lam({ color: 0xf0e8d0 })); pileOn.position.y = 0.71; ba.add(pileOn);
    const face = cyl(0.18, 0.18, 0.04, 10, lam({ color: 0xf0f0f0 })); face.rotation.x = Math.PI / 2; face.position.set(0, 1.2, -0.27); ba.add(face);
    const needle = box(0.01, 0.15, 0.01, basic({ color: 0xc00000 })); needle.position.set(0, 1.2, -0.24); ba.add(needle);
    ba.userData.needle = needle;
    helpers.balanca = ba;

    // robô xing ling
    const ro = new THREE.Group(); ro.position.set(2.5, 0, -2.3); ro.rotation.y = -0.7; ro.visible = false; scene.add(ro);
    const rm = lam({ map: TEX.metal, color: 0xb0b8c0 });
    [[-0.15, 0], [0.15, 0]].forEach(([x]) => { const l = box(0.14, 0.8, 0.16, rm); l.position.set(x, 0.4, 0); ro.add(l); });
    const torso = box(0.6, 0.7, 0.38, rm); torso.position.y = 1.15; ro.add(torso);
    const chest = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), lam({ map: textCanvas(64, 32, '#c01010', [{ t: 'XING LING', y: 16, c: '#ffd040', f: 'bold 10px monospace' }]) }));
    chest.position.set(0, 1.25, 0.2); ro.add(chest);
    const head = box(0.36, 0.3, 0.3, rm); head.position.y = 1.68; ro.add(head);
    [-0.08, 0.08].forEach((x) => { const e = box(0.06, 0.04, 0.02, basic({ color: 0xff2020 })); e.position.set(x, 1.7, 0.16); ro.add(e); });
    const antenna = box(0.02, 0.2, 0.02, rm); antenna.position.y = 1.92; ro.add(antenna);
    const armPivot = new THREE.Group(); armPivot.position.set(0.38, 1.4, 0); ro.add(armPivot);
    const arm = box(0.12, 0.6, 0.12, rm); arm.position.y = -0.28; armPivot.add(arm);
    const arm2 = box(0.12, 0.6, 0.12, rm); arm2.position.set(-0.76, 1.12, 0); ro.add(arm2);
    ro.userData.arm = armPivot;
    helpers.robo = ro;

    // esteira do porto
    const es = new THREE.Group(); es.position.set(0, 0, -2.7); es.visible = false; scene.add(es);
    const belt = box(9, 0.12, 0.8, lam({ map: TEX.belt })); belt.position.y = 0.95; es.add(belt);
    for (let x = -4; x <= 4; x += 1.6) { const l = box(0.1, 0.9, 0.7, lam({ map: TEX.metal, color: 0xd0a020 })); l.position.set(x, 0.45, 0); es.add(l); }
    es.userData.boxes = [];
    for (let i = 0; i < 6; i++) { const b = box(0.45, 0.3, 0.4, lam({ map: TEX.burlap })); b.position.set(-4 + i * 1.5, 1.16, 0); es.add(b); es.userData.boxes.push(b); }
    helpers.esteira = es;

    // dragão do ano novo chinês
    const dr = new THREE.Group(); dr.visible = false; scene.add(dr);
    const headG = new THREE.Group(); dr.add(headG);
    const hb = box(0.6, 0.45, 0.7, lam({ map: TEX.red })); headG.add(hb);
    const jaw = box(0.55, 0.12, 0.5, lam({ map: TEX.gold })); jaw.position.set(0, -0.25, -0.1); headG.add(jaw);
    [-0.2, 0.2].forEach((x) => { const h = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 4), lam({ map: TEX.gold })); h.position.set(x, 0.35, 0.15); h.rotation.x = 0.5; headG.add(h); const e = box(0.1, 0.1, 0.05, basic({ color: 0xffff60 })); e.position.set(x, 0.1, -0.36); headG.add(e); });
    dr.userData.head = headG;
    dr.userData.segs = [];
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.26 - i * 0.008, 6, 4), lam({ map: i % 2 ? TEX.gold : TEX.red }));
      dr.add(s); dr.userData.segs.push(s);
    }
    helpers.dragao = dr;
  }

  // ---------------------------------------------------------------
  // partículas & grãos voando
  // ---------------------------------------------------------------
  function buildFx() {
    const g = new THREE.OctahedronGeometry(0.028, 0); g.scale(1.6, 0.6, 0.6);
    const mat = lam({ color: 0xf4eedc });
    const blackMat = lam({ color: 0x1a1218 });
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(g, mat); m.visible = false; scene.add(m);
      flying.push({ m, t: 1, a: new THREE.Vector3(), b: new THREE.Vector3(), mat, blackMat });
    }
    // poeira
    const N = 80;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    O.dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8dcc0, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
    O.dust.userData.v = Array.from({ length: N }, () => new THREE.Vector3());
    O.dust.userData.life = 0;
    O.dust.frustumCulled = false;
    scene.add(O.dust);
    // poeira flutuando no feixe de luz
    const M = 60;
    const g2 = new THREE.BufferGeometry();
    const arr = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) { arr[i * 3] = (Math.random() - 0.5) * 3; arr[i * 3 + 1] = 1 + Math.random() * 2; arr[i * 3 + 2] = -1 + (Math.random() - 0.5) * 3; }
    g2.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    O.motes = new THREE.Points(g2, new THREE.PointsMaterial({ color: 0xfff0c0, size: 1, sizeAttenuation: false, transparent: true, opacity: 0.5 }));
    scene.add(O.motes);
    // brilhos dourados
    const K = 60;
    const g3 = new THREE.BufferGeometry();
    g3.setAttribute('position', new THREE.BufferAttribute(new Float32Array(K * 3), 3));
    O.sparks = new THREE.Points(g3, new THREE.PointsMaterial({ color: 0xffd040, size: 3, sizeAttenuation: false, transparent: true, opacity: 1 }));
    O.sparks.userData.v = Array.from({ length: K }, () => new THREE.Vector3());
    O.sparks.userData.life = 0;
    O.sparks.frustumCulled = false;
    scene.add(O.sparks);
  }

  function burst(points, origin, speed, life) {
    const pos = points.geometry.attributes.position;
    points.userData.v.forEach((v, i) => {
      pos.setXYZ(i, origin.x, origin.y, origin.z);
      v.set((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed);
    });
    pos.needsUpdate = true;
    points.userData.life = life;
    points.material.opacity = 1;
  }

  // ---------------------------------------------------------------
  // pós-processamento (dither 15-bit, vinheta, fade)
  // ---------------------------------------------------------------
  function buildPost() {
    rt = new THREE.WebGLRenderTarget(lowW, LOW_H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    postMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: rt.texture }, res: { value: new THREE.Vector2(lowW, LOW_H) }, time: { value: 0 }, fade: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, flash: { value: 0 }, gray: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec2 res; uniform float time; uniform float fade; uniform vec3 tint; uniform float flash; uniform float gray;
        varying vec2 vUv;
        float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
        float bayer(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          c *= tint;
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          c = mix(c, vec3(l), gray);
          vec2 d = vUv - 0.5;
          c *= 1.0 - dot(d, d) * 0.9;
          c += flash;
          c *= 1.0 - fade;
          float dith = (bayer(gl_FragCoord.xy) - 0.5) / 24.0;
          c = floor((c + dith) * 24.0 + 0.5) / 24.0;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    postScene = new THREE.Scene();
    postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
  }

  function resize() {
    lowW = Math.round(LOW_H * window.innerWidth / window.innerHeight);
    renderer.setSize(lowW, LOW_H, false);
    rt.setSize(lowW, LOW_H);
    postMat.uniforms.res.value.set(lowW, LOW_H);
    camera.aspect = window.innerWidth / window.innerHeight;
    // em tela estreita (celular) abre o FOV pra caber a mesa
    camera.fov = camera.aspect < 1 ? 78 : 62;
    camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------
  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0806);
    scene.fog = new THREE.Fog(0x140e0a, 5, 15);
    camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.05, 40);
    camera.position.set(0, 2.05, 2.15);
    scene.add(camera);

    O.amb = new THREE.AmbientLight(0x6a5a50, 0.55); scene.add(O.amb);
    O.hemi = new THREE.HemisphereLight(0x8090a0, 0x302018, 0.25); scene.add(O.hemi);
    O.sun = new THREE.DirectionalLight(0xffe0b0, 0.5); O.sun.position.set(0.5, 3, -8); scene.add(O.sun);

    makeTextures();
    buildRoom();
    buildTable();
    buildHands();
    buildHelpers();
    buildFx();
    buildPost();
    resize();
    window.addEventListener('resize', resize);
    drawView(7 * 60, 1);
    drawBicho('CABRA');
  }

  const BICHOS = ['AVESTRUZ', 'ÁGUIA', 'BURRO', 'BORBOLETA', 'CACHORRO', 'CABRA', 'CARNEIRO', 'CAMELO', 'COBRA', 'COELHO', 'CAVALO', 'ELEFANTE', 'GALO', 'GATO', 'JACARÉ', 'LEÃO', 'MACACO', 'PORCO', 'PAVÃO', 'PERU', 'TOURO', 'TIGRE', 'URSO', 'VEADO', 'VACA', '???DRAGÃO???'];
  function drawBicho(name) {
    const g = TEX.bichoScreen.userData.ctx;
    g.fillStyle = '#001a00'; g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#30ff60'; g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(name, 32, 11);
    g.fillText(String(Math.floor(Math.random() * 10000)).padStart(4, '0'), 32, 23);
    TEX.bichoScreen.needsUpdate = true;
  }

  function pick(nx, ny) {
    raycaster.setFromCamera({ x: nx, y: ny }, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    return hits.length ? hits[0].object.userData.pick : null;
  }

  function look_(nx, ny) {
    look.tyaw = -nx * 0.2;
    look.tpitch = ny * 0.1;
  }

  function setPile(frac) { pileFrac = Math.max(0, Math.min(1, frac)); }
  function setSackFrac(frac) { sackFrac = Math.max(0, Math.min(1, frac)); }

  function newSack(final) {
    sackDrop = 1;
    O.labelMat.map = final ? TEX.labelFinal : TEX.label;
    O.labelMat.needsUpdate = true;
  }

  function countFx(n, manual, black) {
    if (manual) handAnim = 1;
    const k = manual ? Math.min(3, Math.max(1, n)) : 1;
    for (let i = 0; i < k; i++) spawnFlying(black && i === 0);
  }

  function spawnFlying(black) {
    const f = flying.find((x) => x.t >= 1);
    if (!f) return;
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.3 * Math.max(0.3, pileFrac);
    f.a.set(-0.05 + Math.cos(a) * r, O.TY + 0.05 + 0.25 * pileFrac * Math.random(), 0.12 + Math.sin(a) * r * 0.8);
    f.b.set(0.95 + (Math.random() - 0.5) * 0.2, O.TY + 0.06 + O.potRice.position.y, 0.32 + (Math.random() - 0.5) * 0.2);
    f.t = 0;
    f.speed = 2.4 + Math.random();
    f.m.material = black ? f.blackMat : f.mat;
    f.m.visible = true;
  }

  function setStream(gps) { streamRate = Math.min(14, gps > 0 ? 2 + Math.log10(gps + 1) * 3 : 0); }

  function setTool(id) {
    toolId = id;
    Object.entries(O.tools).forEach(([k, t]) => (t.visible = k === id));
    O.handR.children.forEach((c, i) => { if (i >= 3 && i <= 6) c.rotation.x = id ? -1.1 : -0.35; });
  }

  function setHelpers(owned) {
    const p = Math.min(owned.pombo || 0, pigeons.length);
    pigeons.forEach((pg, i) => (pg.visible = i < p));
    ['abaco', 'bicho', 'balanca', 'robo', 'esteira', 'dragao'].forEach((k) => { helpers[k].visible = (owned[k] || 0) > 0; });
  }

  function setTime(day, minute) {
    if (Math.abs(minute - windowMinute) >= 8 || day !== windowDay) {
      windowMinute = minute; windowDay = day;
      drawView(minute, day);
      const n = nightness(minute);
      const s = skyAt(minute);
      O.sun.color.setRGB(s.bot[0] / 255, s.bot[1] / 255, s.bot[2] / 255);
      O.sun.intensity = 0.15 + (1 - n) * 0.55;
      O.amb.intensity = 0.32 + (1 - n) * 0.3;
    }
  }

  function setRinging(v) { ringing = v; }
  function setPlaying(v) { playing = v; }
  function setFlicker(v) { flicker = v; }
  function setFade(v) { postMat.uniforms.fade.value = v; }
  function setTint(r, g, b) { postMat.uniforms.tint.value.set(r, g, b); }
  function setGray(v) { postMat.uniforms.gray.value = v; }
  function flash(v) { postMat.uniforms.flash.value = v; }
  function shakeIt(v) { shake = Math.max(shake, v); }

  function goldenReveal() {
    // o Grão Dourado sobe da pilha e flutua na frente da câmera
    gold = new THREE.Group();
    const g = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), basic({ color: 0xffd040 }));
    g.scale.set(1.7, 0.65, 0.65); gold.add(g);
    const glowTex = canvasTex(32, 32, (c, w, h) => {
      const grd = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      grd.addColorStop(0, 'rgba(255,230,120,1)'); grd.addColorStop(0.4, 'rgba(255,190,40,0.5)'); grd.addColorStop(1, 'rgba(255,160,0,0)');
      c.fillStyle = grd; c.fillRect(0, 0, w, h);
    });
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    spr.scale.set(0.5, 0.5, 0.5); gold.add(spr);
    gold.position.set(-0.05, O.TY + 0.05, 0.12);
    gold.userData.t = 0;
    scene.add(gold);
    O.goldLight = new THREE.PointLight(0xffc040, 0, 4, 2); gold.add(O.goldLight);
    burst(O.sparks, gold.position, 1.5, 2.5);
  }
  function goldToHand() {
    if (gold) { scene.remove(gold); gold = null; }
    O.goldInHand.visible = true;
    O.handL.position.set(-0.22, -0.26, -0.5);
    O.handL.rotation.set(0.9, 0.3, -0.2);
  }

  function endingTurn() { camMode = 'script'; camScript = { t: 0 }; }

  // ---------------------------------------------------------------
  // loop
  // ---------------------------------------------------------------
  const tmpV = new THREE.Vector3();
  let bichoT = 0;
  function update(dt, info) {
    clock.t += dt;
    const t = clock.t;
    postMat.uniforms.time.value = t;

    // câmera
    if (camMode === 'free') {
      look.yaw += (look.tyaw - look.yaw) * Math.min(1, dt * 4);
      look.pitch += (look.tpitch - look.pitch) * Math.min(1, dt * 4);
      camera.rotation.set(BASE_PITCH + look.pitch + Math.sin(t * 0.7) * 0.004, look.yaw + Math.sin(t * 0.43) * 0.004, 0, 'YXZ');
    } else if (camScript) {
      camScript.t += dt;
      const k = Math.min(1, camScript.t / 3);
      const e = k * k * (3 - 2 * k);
      camera.rotation.set(BASE_PITCH * (1 - e) + 0.02 * e, look.yaw * (1 - e) - 1.18 * e, 0, 'YXZ');
      camera.position.set(0, 2.05 + e * 0.2, 2.15 - e * 0.6);
      if (camScript.t > 3.2) O.doorPivot.rotation.y = Math.min(1.6, (camScript.t - 3.2) * 0.8);
    }
    if (shake > 0) { camera.rotation.x += (Math.random() - 0.5) * shake * 0.03; camera.rotation.y += (Math.random() - 0.5) * shake * 0.03; shake = Math.max(0, shake - dt * 2); }

    // lâmpada
    let li = 1.5 + Math.sin(t * 50) * 0.02;
    if (flicker > 0 && Math.random() < flicker * 0.15) li *= Math.random() * 0.4;
    O.lamp.intensity = li;
    O.bulb.material.color.setScalar(li / 1.5);
    O.candleLight.intensity = 0.5 + Math.random() * 0.25;
    O.flame.scale.y = 1 + Math.random() * 0.4;

    // telefone tocando
    if (ringing) {
      const on = Math.sin(t * 22) > 0 && (t % 1.4) < 0.9;
      O.phoneMat.emissive.setRGB(on ? 0.6 : 0.1, 0, 0);
      O.phone.position.x = 2.5 + (on ? (Math.random() - 0.5) * 0.03 : 0);
      O.handset.position.y = on ? (Math.random() * 0.02) : 0;
    } else { O.phoneMat.emissive.setRGB(0, 0, 0); O.phone.position.x = 2.5; O.handset.position.y = 0; }

    // led do toca-fitas
    O.tapeLed.material.color.setRGB(playing ? (0.6 + Math.sin(t * 8) * 0.4) : (info && info.tapeReady ? 0.5 + Math.sin(t * 4) * 0.5 : 0.15), playing ? 0.1 : 0, 0);
    if (playing) O.boombox.scale.setScalar(1 + Math.max(0, Math.sin(t * 9)) * 0.015); else O.boombox.scale.setScalar(1);

    // pilha
    const want = Math.round(O.pileN * Math.pow(pileFrac, 0.8));
    if (want !== pileShown) { O.pile.count = want; pileShown = want; }
    O.pileBase.visible = pileFrac > 0.02;
    O.potRice.position.y = 0.03 + (1 - pileFrac) * 0.26;

    // saco
    if (sackDrop > 0) {
      sackDrop = Math.max(0, sackDrop - dt * 1.8);
      const k = sackDrop;
      O.sack.position.y = O.TY + k * k * 3.2;
      if (sackDrop === 0) { burst(O.dust, tmpV.set(-1.05, O.TY + 0.1, -0.15), 1.6, 1.2); shakeIt(0.6); }
    }
    const sy = 0.45 + 0.55 * sackFrac;
    O.sackBody.scale.y = sy; O.sackBody.position.y = 0.425 * sy;
    O.sackRice.position.y = 0.84 * sy;
    O.collar.position.y = 0.9 * sy;
    O.label.position.y = 0.42 * sy;

    // mão direita (animação de "catar" grão)
    if (handAnim > 0) {
      handAnim = Math.max(0, handAnim - dt * 7);
      const k = Math.sin(handAnim * Math.PI);
      O.handR.position.set(O.handRBase.x - k * 0.22, O.handRBase.y - k * 0.08, O.handRBase.z - k * 0.25);
      O.handR.rotation.x = 0.25 + k * 0.5;
    } else {
      O.handR.position.set(O.handRBase.x, O.handRBase.y + Math.sin(t * 1.6) * 0.008, O.handRBase.z);
      O.handR.rotation.x = 0.25;
    }
    if (!O.goldInHand.visible) O.handL.position.y = -0.4 + Math.sin(t * 1.6 + 1) * 0.006;

    // grãos voando pro pote
    if (streamRate > 0 && info && info.auto) {
      streamAcc += dt * streamRate;
      while (streamAcc >= 1) { streamAcc -= 1; spawnFlying(false); }
    }
    flying.forEach((f) => {
      if (f.t >= 1) return;
      f.t = Math.min(1, f.t + dt * f.speed);
      tmpV.lerpVectors(f.a, f.b, f.t);
      tmpV.y += Math.sin(f.t * Math.PI) * 0.35;
      f.m.position.copy(tmpV);
      f.m.rotation.set(t * 10, t * 7, 0);
      if (f.t >= 1) f.m.visible = false;
    });

    // partículas
    [O.dust, O.sparks].forEach((pts) => {
      if (pts.userData.life <= 0) { pts.visible = false; return; }
      pts.visible = true;
      pts.userData.life -= dt;
      const pos = pts.geometry.attributes.position;
      pts.userData.v.forEach((v, i) => {
        v.y -= dt * (pts === O.sparks ? 0.6 : 2.0);
        pos.setXYZ(i, pos.getX(i) + v.x * dt, Math.max(O.TY, pos.getY(i) + v.y * dt), pos.getZ(i) + v.z * dt);
      });
      pos.needsUpdate = true;
      pts.material.opacity = Math.min(1, pts.userData.life);
    });
    O.motes.rotation.y = t * 0.02;

    // ajudantes
    pigeons.forEach((p) => {
      if (!p.visible) return;
      const ph = t * 2 + p.userData.phase;
      const peck = Math.max(0, Math.sin(ph * 2.3)) ** 6;
      p.userData.head.rotation.x = peck * 1.1;
      p.userData.head.position.y = 0.16 - peck * 0.04;
      if (Math.sin(ph * 0.31) > 0.97) p.rotation.y += dt * 3;
    });
    if (helpers.abaco.visible) helpers.abaco.userData.beads.forEach((b, i) => { b.position.y = b.userData.base + Math.max(0, Math.sin(t * 6 + i * 1.7)) * 0.03; });
    if (helpers.bicho.visible) {
      bichoT += dt;
      if (bichoT > 0.35) { bichoT = 0; drawBicho(BICHOS[Math.floor(Math.random() * BICHOS.length)]); }
      helpers.bicho.userData.lever.rotation.x = Math.sin(t * 3) * 0.3;
    }
    if (helpers.balanca.visible) helpers.balanca.userData.needle.rotation.z = Math.sin(t * 2.2) * 0.8 + Math.sin(t * 13) * 0.1;
    if (helpers.robo.visible) { helpers.robo.userData.arm.rotation.x = Math.sin(t * 5) * 0.9; helpers.robo.rotation.y = -0.7 + Math.sin(t * 0.8) * 0.15; }
    if (helpers.esteira.visible) {
      TEX.belt.offset.x -= dt * 0.5;
      helpers.esteira.userData.boxes.forEach((b) => { b.position.x += dt * 0.9; if (b.position.x > 4.4) b.position.x = -4.4; });
    }
    if (helpers.dragao.visible) {
      const segs = helpers.dragao.userData.segs;
      const path = (u) => tmpV.set(Math.cos(u) * 4.2, 3.4 + Math.sin(u * 3) * 0.35, -2.2 + Math.sin(u) * 2.6);
      const u0 = t * 0.45;
      path(u0); helpers.dragao.userData.head.position.copy(tmpV);
      const ahead = path(u0 + 0.05).clone(); helpers.dragao.userData.head.lookAt(ahead); helpers.dragao.userData.head.rotateY(Math.PI);
      segs.forEach((s, i) => { path(u0 - 0.12 * (i + 1)); s.position.copy(tmpV); s.position.y += Math.sin(t * 4 - i * 0.6) * 0.12; });
    }

    // grão dourado
    if (gold) {
      gold.userData.t += dt;
      const k = Math.min(1, gold.userData.t / 2.2);
      const e = k * k * (3 - 2 * k);
      camera.getWorldPosition(tmpV);
      const target = new THREE.Vector3(0, -0.05, -0.55).applyQuaternion(camera.quaternion).add(tmpV);
      gold.position.lerpVectors(new THREE.Vector3(-0.05, O.TY + 0.05, 0.12), target, e);
      gold.children[0].rotation.y = t * 2; gold.children[0].rotation.z = t * 0.7;
      O.goldLight.intensity = e * 2.5;
      gold.children[1].scale.setScalar(0.35 + Math.sin(t * 6) * 0.05 + e * 0.15);
    }
    if (O.goldInHand.visible) O.goldInHand.rotation.y = t * 2;
  }

  function render() {
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }

  // o Ato II usa o mesmo renderizador e o mesmo pós-processamento PS2
  function renderWith(sc, cm) {
    renderer.setRenderTarget(rt);
    renderer.render(sc, cm);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }
  const kit = { lam, basic, psx, canvasTex, textCanvas, box, cyl, rng, pixels, noisy, TEX, labelTex, skyAt, lerpC, hex };

  return {
    kit, renderWith,
    init, update, render, pick, look: look_, setPile, setSackFrac, newSack, countFx, setStream, setTool, setHelpers,
    setTime, setRinging, setPlaying, setFlicker, setFade, setTint, setGray, flash, shake: shakeIt, goldenReveal, goldToHand, endingTurn,
    burstSparks: () => burst(O.sparks, new THREE.Vector3(-0.05, O.TY + 0.2, 0.12), 1.2, 1.5),
  };
})();
