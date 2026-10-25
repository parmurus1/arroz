// =====================================================================
//  ARROZ DOURADO — gameplay, HUD e roteiro dos 3 dias
// =====================================================================

(() => {
  const D = DATA;
  const $ = (s) => document.querySelector(s);
  const SAVE_KEY = 'arrozDourado.save.v1';
  const DEBUG = /debug/.test(location.search);
  const UP = Object.fromEntries(D.UPGRADES.map((u) => [u.id, u]));
  const TOOLS = ['pinca', 'hashi', 'colher', 'peneira', 'pa'];
  const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

  let S = freshState();
  let phase = 'title'; // title | cutscene | play | night | final | ending
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function freshState() {
    return {
      day: 1, minute: D.DAY_START, grains: 0, money: 0, earned: 0, debt: D.DEBT_START,
      sack: null, sackCount: 0, owned: {}, tapes: [], heard: 0, flags: {},
      buffUntil: 0, playTime: 0, clicks: 0, blacks: 0, nextItemAt: 40, usedItems: [], paid: 0,
      pendingTape: null, acc: 0,
    };
  }

  // ---------------------------------------------------------------
  // números
  // ---------------------------------------------------------------
  function fmt(n) {
    n = Math.floor(n);
    if (n < 1e6) return n.toLocaleString('pt-BR');
    for (const [v, s] of [[1e15, ' quatri'], [1e12, ' tri'], [1e9, ' bi'], [1e6, ' mi']]) if (n >= v) return (n / v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + s;
    return String(n);
  }
  const brl = (n) => 'R$ ' + fmt(n);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------------------------------------------------------------
  // economia
  // ---------------------------------------------------------------
  const owned = (id) => S.owned[id] || 0;
  function reqMet(u) {
    const r = u.req;
    if (!r) return true;
    if (r.grains && S.grains < r.grains) return false;
    if (r.tape && S.heard < r.tape) return false;
    if (r.day && S.day < r.day) return false;
    if (r.owned) for (const k in r.owned) if (owned(k) < r.owned[k]) return false;
    return true;
  }
  const costOf = (u) => (u.type === 'helper' ? Math.ceil(u.cost * Math.pow(1.15, owned(u.id))) : u.cost);
  const buffMul = () => (S.playTime < S.buffUntil ? 2 : 1);
  function allMul() {
    let m = 1;
    for (const u of D.UPGRADES) if (u.type === 'boost' && owned(u.id) && u.effect.allMul) m *= u.effect.allMul;
    return m * buffMul();
  }
  function hMul(id) {
    let m = 1;
    for (const u of D.UPGRADES) if (u.type === 'boost' && owned(u.id) && u.effect.helperMul && u.effect.helperMul[id]) m *= u.effect.helperMul[id];
    return m;
  }
  function gps() {
    if (S.flags.finalSack) return 0;
    let g = 0;
    for (const u of D.UPGRADES) if (u.type === 'helper') g += owned(u.id) * u.gps * hMul(u.id);
    return g * allMul();
  }
  function clickPower() {
    if (S.flags.finalSack) return 1;
    let add = 1, mul = 1, cg = 0;
    for (const u of D.UPGRADES) {
      if (u.type !== 'tool' || !owned(u.id)) continue;
      const e = u.effect;
      if (e.clickAdd) add += e.clickAdd;
      if (e.clickMul) mul *= e.clickMul;
      if (e.clickGps) cg += e.clickGps;
    }
    return Math.max(1, Math.floor(add * mul * allMul() + cg * gps()));
  }

  // ---------------------------------------------------------------
  // sacos & contagem
  // ---------------------------------------------------------------
  function newSack() {
    if (S.flags.finalSack) {
      S.sack = { size: 88, left: 88, name: 'SACO SEM RÓTULO · 金', origin: 'escrito com a SUA letra', final: true };
      World.newSack(true);
    } else {
      const target = gps() * 12 + clickPower() * 22;
      let tier = D.SACKS[0];
      for (const t of D.SACKS) if (t.size <= target) tier = t;
      S.sack = { size: tier.size, left: tier.size, name: tier.name, origin: pick(D.SACK_ORIGINS) };
      World.newSack(false);
    }
    S.sackCount++;
    Sfx.sackDrop();
  }

  function count(n, manual) {
    if (!S.sack) return;
    while (n > 0) {
      const take = Math.min(n, S.sack.left);
      S.sack.left -= take; n -= take;
      S.grains += take; S.money += take; S.earned += take;
      if (S.sack.left <= 0) {
        if (S.sack.final) { goldenFound(); return; }
        newSack();
        if (n > S.sack.size * 4) { // excesso enorme: conta em lote
          const extra = n - S.sack.size;
          S.grains += extra; S.money += extra; S.earned += extra; n -= extra;
        }
      }
    }
  }

  function manualCount(x, y) {
    const p = clickPower();
    let black = false;
    if (!S.flags.finalSack && Math.random() < 0.02 * (owned('oculos') ? 5 : 1)) black = true;
    S.clicks++;
    count(p, true);
    World.countFx(p, true, black);
    Sfx.tick();
    floatText(x, y, '+' + fmt(p));
    if (black) {
      const bonus = Math.max(77, p * 77);
      S.money += bonus; S.earned += bonus; S.blacks++;
      Sfx.black();
      setTimeout(() => floatText(x, y - 30, 'GRÃO PRETO! +' + brl(bonus), 'black'), 120);
      if (S.blacks === 1) toast('⚫ GRÃO PRETO! Arroz negro vale 77× o clique. Raro pra caramba.', 'gold');
    }
    if (phase === 'final') {
      const left = S.sack ? S.sack.left : 0;
      setHint(left > 0 ? `CONTE COM AS PRÓPRIAS MÃOS · faltam ${left}` : '');
    } else if (S.clicks === 1) setHint('');
  }

  // ---------------------------------------------------------------
  // fitas
  // ---------------------------------------------------------------
  function checkTapes() {
    const i = S.tapes.length;
    if (i >= D.TAPES.length || S.pendingTape != null) return;
    if (i > 0 && !S.tapes[i - 1].heard) return;
    const T = D.TAPES[i];
    if (S.day < T.day || S.grains < T.at) return;
    S.pendingTape = S.playTime + 1.5 + Math.random() * 3;
  }
  function foundTape() {
    const i = S.tapes.length;
    S.tapes.push({ state: D.TAPES[i].cost === 0 ? 'translated' : 'found', heard: false, isNew: true });
    Sfx.tapeFound();
    World.shake(0.3);
    const msgs = [
      'Você enfia a mão no saco e sente algo duro... UMA FITA CASSETE!',
      'Mais uma fita no meio do arroz. A etiqueta tá em chinês.',
      'Outra fita. Tem uma mancha vermelha na etiqueta. Molho de tomate. Tomara.',
    ];
    toast(`📼 ${i === 0 ? msgs[0] : pick(msgs.slice(1))}`, 'gold', 5000);
    if (i === 0) setTimeout(() => toast('Clique em ▶ OUVIR na lista de fitas (ou no toca-fitas da mesa).', '', 6000), 1200);
    renderTapes();
    $('#tapesPanel').classList.remove('flash'); void $('#tapesPanel').offsetWidth; $('#tapesPanel').classList.add('flash');
    if (window.innerWidth <= 860) $('#btnTapes').classList.add('flash');
    save();
  }

  function translate(i) {
    const T = D.TAPES[i], st = S.tapes[i];
    if (st.state !== 'found') return;
    if (S.money < T.cost) { Sfx.error(); toast(`A Dona Mei cobra ${brl(T.cost)}. Você tem ${brl(S.money)}. Conta mais arroz.`, 'warn'); return; }
    S.money -= T.cost;
    st.state = 'translating';
    Sfx.buy();
    toast(`📲 Áudio enviado pra Dona Mei (Pastelaria Dragão Feliz, SAARA) · Pix de ${brl(T.cost)}`, 'mei');
    renderTapes();
    setTimeout(() => {
      st.state = 'translated';
      Sfx.whatsapp();
      toast(`💬 Dona Mei: "${T.mei}"`, 'mei', 8000);
      renderTapes();
      save();
      if (!dlg && !tapeUI && (phase === 'play')) playTape(i);
    }, 2600);
  }

  // ----- toca-fitas -----
  let tapeUI = null;
  function playTape(i) {
    if (tapeUI || dlg || phoneResolve) return;
    const T = D.TAPES[i], st = S.tapes[i];
    const special = i === D.TAPES.length - 1;
    const translated = st.state === 'translated';
    st.isNew = false;
    renderTapes();
    Sfx.stopSpeech();
    Sfx.radio(false);
    Sfx.tapeClick();
    World.setPlaying(true);
    $('#tape').classList.remove('hidden');
    $('#tape').classList.add('playing');
    $('#tapeNum').textContent = `FITA #${i + 1}`;
    $('#tapeTitle').textContent = translated && !special ? T.title.toUpperCase() : '???';
    $('#casLabel').textContent = `磁带 ${CN_NUM[i]}`;
    $('#tapeSpeaker').textContent = translated ? T.speaker : '(voz em chinês)';
    $('#tapeCn').textContent = '';
    $('#tapePt').textContent = '';
    $('#tapePt').className = 'tape-pt';
    $('#tapeHint').textContent = '';
    $('#tapeEject').textContent = '⏩ PULAR';
    const cn = Array.from(T.cn);
    const est = cn.length * 0.27 / (T.voice.rate || 1) + 1;
    tapeUI = { i, T, translated, special, t: 0, est, cn, ended: false, morph: -1 };
    if (!translated) { $('#tapePt').classList.add('locked'); $('#tapePt').textContent = `[ sem tradução · a Dona Mei traduz por ${brl(T.cost)} ]`; }
    Sfx.speakChinese(T.cn, T.voice, () => { if (tapeUI && tapeUI.i === i) endTape(); });
  }

  function endTape() {
    const u = tapeUI;
    if (!u || u.ended) return;
    u.ended = true;
    $('#tape').classList.remove('playing');
    World.setPlaying(false);
    $('#tapeCn').textContent = u.T.cn;
    if (u.special) {
      u.morph = 0; // o chinês vira português sozinho: você ENTENDE
      $('#tapeHint').textContent = '';
      $('#tapeEject').textContent = '...';
    } else if (u.translated) {
      $('#tapePt').textContent = u.T.pt;
      markHeard(u.i);
      $('#tapeEject').textContent = '⏏ EJETAR';
    } else {
      $('#tapeHint').textContent = u.T.hint;
      $('#tapeEject').textContent = '⏏ EJETAR';
    }
  }

  function updateTape(dt) {
    const u = tapeUI;
    if (!u) return;
    u.t += dt;
    if (!u.ended) {
      const k = Math.min(1, u.t / u.est);
      $('#tapeCn').textContent = u.cn.slice(0, Math.floor(u.cn.length * k)).join('');
      if (u.translated && !u.special) $('#tapePt').textContent = u.T.pt.slice(0, Math.floor(u.T.pt.length * k));
    } else if (u.morph >= 0 && u.morph < 1) {
      u.morph = Math.min(1, u.morph + dt / 5);
      const pt = u.T.pt, n = Math.floor(pt.length * u.morph);
      const glyphs = '黄金龙米王你我他的是在不了有和人这中大为上个国';
      let s = pt.slice(0, n);
      for (let j = n; j < Math.min(pt.length, n + 14); j++) s += glyphs[Math.floor(Math.random() * glyphs.length)];
      $('#tapePt').textContent = s;
      $('#tapeCn').style.opacity = String(1 - u.morph * 0.7);
      if (u.morph >= 1) {
        $('#tapePt').textContent = pt;
        $('#tapeTitle').textContent = 'VOCÊ ENTENDE.';
        $('#tapeSpeaker').textContent = 'DONA MEI';
        $('#tapeHint').textContent = 'Você não precisou de tradução. Você nunca precisou.';
        $('#tapeEject').textContent = '⏏ EJETAR';
        markHeard(u.i);
        Sfx.gong();
        World.flash(0.4); setTimeout(() => World.flash(0), 200);
      }
    }
  }

  function closeTape() {
    const u = tapeUI;
    if (!u) return;
    if (!u.ended) { Sfx.stopSpeech(); endTape(); return; } // primeiro clique: pula pro fim
    if (u.special && u.morph < 1) { u.morph = 0.999; return; }
    Sfx.stopSpeech();
    tapeUI = null;
    $('#tape').classList.add('hidden');
    $('#tapeCn').style.opacity = '1';
    World.setPlaying(false);
    if (owned('radio') && !S.flags.finalSack) Sfx.radio(true);
    const last = D.TAPES.length - 1;
    if (u.i === last && S.tapes[last] && S.tapes[last].heard && !S.flags.finalSack) startFinal();
  }

  function markHeard(i) {
    const st = S.tapes[i];
    if (st.heard) return;
    st.heard = true;
    S.heard++;
    renderTapes();
    renderMemory(true);
    if (S.heard === 1) setTimeout(() => toast('🧠 Algo se mexe na sua cabeça. Uma barra apareceu do nada: "???"', 'gold', 6000), 600);
    if (S.heard === 6) setTimeout(() => toast('Seu crachá... a letra no crachá é a SUA letra. Por que você escreveria seu próprio crachá?', 'warn', 7000), 900);
    if (S.heard === 7) World.setFlicker(0.25);
    if (dayTapesDone() && S.day < 3) setTimeout(() => toast('🌙 A fábrica tá em silêncio. Você pode dormir no quartinho dos fundos... ou continuar contando até as 22h.', '', 7000), 1500);
    save();
  }

  // ---------------------------------------------------------------
  // eventos aleatórios dos sacos
  // ---------------------------------------------------------------
  function randomItem() {
    const pool = D.SACK_ITEMS.map((it, idx) => ({ it, idx })).filter(({ it, idx }) => it.day <= S.day && !S.usedItems.includes(idx));
    if (!pool.length) { S.usedItems = []; return; }
    const { it, idx } = pick(pool);
    S.usedItems.push(idx);
    let extra = '';
    if (it.effect === 'money') { const v = Math.max(50, Math.floor(gps() * it.secs + clickPower() * 10)); S.money += v; S.earned += v; extra = ` (+${brl(v)})`; }
    if (it.effect === 'buff') S.buffUntil = S.playTime + 30;
    if (it.fake) { Sfx.fake(); World.shake(0.5); } else Sfx.itemFound();
    toast(`📦 No saco: ${it.text}${extra}`, it.fake ? 'gold' : 'item', 7000);
  }

  // ---------------------------------------------------------------
  // loja
  // ---------------------------------------------------------------
  let shopKey = '';
  function visibleUpgrades() {
    const out = [];
    let lockedShown = 0;
    for (const cat of ['tool', 'helper', 'boost']) {
      for (const u of D.UPGRADES.filter((x) => x.type === cat)) {
        if (u.type !== 'helper' && owned(u.id)) continue;
        if (reqMet(u)) out.push({ u, locked: false });
        else if (lockedShown < 2 && cat !== 'boost') { out.push({ u, locked: true }); lockedShown++; }
      }
    }
    return out;
  }
  function renderShop(force) {
    const vis = visibleUpgrades();
    const key = vis.map((v) => v.u.id + (v.locked ? 'L' : '') + owned(v.u.id)).join(',');
    if (key !== shopKey || force) {
      shopKey = key;
      const cats = { tool: '✋ FERRAMENTAS (clique)', helper: '🐦 AJUDANTES (grãos/s)', boost: '⭐ MELHORIAS' };
      let html = '', lastCat = '';
      vis.forEach(({ u, locked }) => {
        if (u.type !== lastCat) { html += `<div class="shop-cat">${cats[u.type]}</div>`; lastCat = u.type; }
        if (locked) html += `<button class="item locked" data-id="${u.id}"><div class="nm">??? ??? ???</div><div class="ds">${lockHint(u)}</div></button>`;
        else html += `<button class="item" data-id="${u.id}"><div class="nm">${u.name}</div><div class="ds">${u.desc}</div><div class="ct">${brl(costOf(u))}</div>${u.type === 'helper' && owned(u.id) ? `<div class="own">${owned(u.id)}</div>` : ''}</button>`;
      });
      $('#shopList').innerHTML = html;
    }
    $('#shopList').querySelectorAll('.item:not(.locked)').forEach((b) => {
      const u = UP[b.dataset.id];
      b.classList.toggle('poor', S.money < costOf(u));
    });
  }
  function lockHint(u) {
    const r = u.req || {};
    if (r.tape) return 'Disponível depois de ouvir mais fitas...';
    if (r.day) return 'O camelô só traz isso ' + (r.day === 2 ? 'no sábado' : 'no domingo') + '.';
    if (r.grains) return `Conte ${fmt(r.grains)} grãos pra desbloquear.`;
    return 'Continue contando.';
  }
  function buy(id) {
    const u = UP[id];
    if (!u || !reqMet(u)) return;
    if (u.type !== 'helper' && owned(id)) return;
    const c = costOf(u);
    if (S.money < c) { Sfx.error(); return; }
    S.money -= c;
    S.owned[id] = owned(id) + 1;
    Sfx.buy();
    if (u.type === 'tool') World.setTool(bestTool());
    World.setHelpers(S.owned);
    if (id === 'radio') { Sfx.radio(true); toast('📻 Rádio ligado! Pagode e notícia o dia inteiro.', 'item'); }
    if (owned(id) === 1) toast(`🛵 Motoboy entregou: ${u.name}`, 'item', 3500);
    renderShop(true);
    const b = $(`#shopList .item[data-id="${id}"]`);
    if (b) b.classList.add('fresh');
    save();
  }
  function bestTool() { let t = null; TOOLS.forEach((id) => { if (owned(id)) t = id; }); return t; }

  // ---------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------
  function renderTapes() {
    const L = $('#tapesList');
    if (!S.tapes.length) { L.innerHTML = '<div class="empty">Nenhuma fita... ainda.</div>'; return; }
    L.innerHTML = S.tapes.map((st, i) => {
      const T = D.TAPES[i];
      const name = st.state === 'translated' && i < D.TAPES.length - 1 ? T.title : '???';
      let tr = '';
      if (st.state === 'found') tr = `<button class="tr" data-tr="${i}">🈯 Traduzir ${brl(T.cost)}</button>`;
      else if (st.state === 'translating') tr = '<button disabled>💬 Dona Mei digitando...</button>';
      return `<div class="tape-item ${st.isNew ? 'new' : ''}"><div class="tape-name"><span class="cn">磁带${CN_NUM[i]}</span> #${i + 1} ${name} ${st.heard ? '✓' : ''}</div>
        <div class="tape-actions"><button data-play="${i}">▶ Ouvir</button>${tr}</div></div>`;
    }).join('');
  }

  function renderMemory(flash) {
    const p = $('#memPanel');
    if (S.heard < 1) { p.classList.add('hidden'); return; }
    p.classList.remove('hidden');
    const pct = Math.round(S.heard / D.TAPES.length * 100);
    $('#memLabel').textContent = D.MEMORY_LABELS[S.heard];
    $('#memBar').style.width = pct + '%';
    $('#memPct').textContent = pct + '%';
    $('#badgeName').textContent = D.BADGE_NAMES[S.heard];
    if (flash) { p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); }
  }

  let newsKey = '';
  function renderTicker() {
    const items = D.NEWS.filter((n) => !n.day || n.day <= S.day).map((n) => n.text);
    const key = S.day + (owned('radio') ? 'r' : 'j');
    if (key === newsKey) return;
    newsKey = key;
    $('#tickerLbl').textContent = owned('radio') ? '📻 RÁDIO TUPI AM' : '📰 JORNAL DE ONTEM';
    const t = $('#tickerText');
    // embaralha um pouco mas mantém as pistas
    const shuffled = items.slice().sort(() => Math.random() - 0.5);
    t.textContent = shuffled.join('   ✦   ');
    t.style.animationDuration = Math.max(40, shuffled.join('').length * 0.12) + 's';
  }

  function hhmm(min) { const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }

  let hudT = 0;
  function renderHud() {
    const day = D.DAYS[S.day - 1];
    $('#dayName').textContent = `${day.name} ${day.date}`;
    $('#dayTag').textContent = day.tag;
    $('#clock').textContent = hhmm(S.minute);
    $('#parcela').textContent = day.parcela ? `PARCELA ÀS 22H: ${brl(day.parcela)}` : (S.flags.finalSack ? 'A MEIA-NOITE NÃO CHEGA' : 'HOJE SÓ TEM O GRÃO');
    $('#grains').textContent = fmt(S.grains);
    $('#perClick').textContent = fmt(clickPower());
    $('#perSec').textContent = fmt(gps());
    if (S.sack) {
      $('#sackName').textContent = `SACO #${S.sackCount} · ${S.sack.name} · ${fmt(S.sack.size - S.sack.left)}/${fmt(S.sack.size)}`;
      $('#sackBar').style.width = ((1 - S.sack.left / S.sack.size) * 100).toFixed(1) + '%';
    }
    $('#money').textContent = brl(S.money);
    $('#debt').textContent = S.flags.ended ? 'R$ 0' : 'R$ ' + Math.floor(S.debt).toLocaleString('pt-BR');
    $('#sleepBtn').classList.toggle('hidden', !(phase === 'play' && S.day < 3 && dayTapesDone() && !dlg && !tapeUI));
    renderShop(false);
    renderTicker();
  }

  function dayTapesDone() { return D.TAPES.every((t, i) => t.day !== S.day || (S.tapes[i] && S.tapes[i].heard)); }

  // toasts & textos flutuantes
  function toast(text, cls, ms) {
    const el = document.createElement('div');
    el.className = 'toast ' + (cls || '');
    el.textContent = text;
    const box = $('#toasts');
    box.prepend(el);
    while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 600); }, ms || 4000);
  }
  function floatText(x, y, text, cls) {
    if (x == null) { x = window.innerWidth / 2; y = window.innerHeight * 0.55; }
    const el = document.createElement('div');
    el.className = 'float ' + (cls || '');
    el.textContent = text;
    el.style.left = (x + (Math.random() - 0.5) * 30) + 'px';
    el.style.top = (y - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  function setHint(t) { $('#hint').textContent = t; }

  // ---------------------------------------------------------------
  // diálogos, telefone, telas de história
  // ---------------------------------------------------------------
  let dlg = null;
  let phoneResolve = null;
  let skipResolve = null;

  function say(who, text) {
    return new Promise((res) => {
      dlg = { who, text, shown: 0, res };
      const box = $('#dialog');
      box.classList.remove('hidden');
      box.classList.toggle('narr', who === 'NARRADOR');
      const w = $('#dlgWho');
      w.textContent = who === 'CHEFE' ? '☎ CHEFE' : who === 'DONA MEI' ? '💬 DONA MEI' : who;
      w.className = who.split(' ')[0];
      $('#dlgText').textContent = '';
    });
  }
  async function dialog(lines) {
    for (const [who, text] of lines) {
      if (/^\* TRRRIM/.test(text)) { await answerPhone(); continue; }
      await say(who, text);
    }
  }
  function advanceDialog() {
    if (!dlg) return;
    if (dlg.shown < dlg.text.length) { dlg.shown = dlg.text.length; $('#dlgText').textContent = dlg.text; return; }
    const r = dlg.res;
    dlg = null;
    $('#dialog').classList.add('hidden');
    r();
  }
  function updateDialog(dt) {
    if (!dlg || dlg.shown >= dlg.text.length) return;
    const before = Math.floor(dlg.shown);
    dlg.shown = Math.min(dlg.text.length, dlg.shown + dt * 48);
    const now = Math.floor(dlg.shown);
    if (now !== before) {
      $('#dlgText').textContent = Array.from(dlg.text).slice(0, now).join('');
      if (dlg.text[now - 1] && dlg.text[now - 1] !== ' ') Sfx.blip(dlg.who);
    }
  }

  function answerPhone() {
    return new Promise((res) => {
      World.setRinging(true);
      Sfx.ring(true);
      setHint('☎ O TELEFONE VERMELHO TÁ TOCANDO — CLIQUE PRA ATENDER');
      phoneResolve = () => {
        phoneResolve = null;
        World.setRinging(false);
        Sfx.ring(false);
        Sfx.tapeClick();
        setHint('');
        res();
      };
    });
  }

  function waitOrClick(ms) {
    return new Promise((res) => {
      const t = setTimeout(() => { skipResolve = null; res(); }, ms);
      skipResolve = () => { clearTimeout(t); skipResolve = null; res(); };
    });
  }
  async function storyLines(lines, cls) {
    const st = $('#story');
    st.innerHTML = '';
    st.className = cls || '';
    for (const l of lines) {
      const d = document.createElement('div');
      d.className = 'line' + (/[一-鿿]/.test(l) && l.length < 20 ? ' cn' : '');
      d.textContent = l;
      st.appendChild(d);
      await waitOrClick(Math.max(1800, l.length * 70));
    }
    await waitOrClick(1500);
    st.classList.add('hidden');
    st.innerHTML = '';
  }
  async function dayCard() {
    const st = $('#story');
    const day = D.DAYS[S.day - 1];
    st.className = '';
    st.innerHTML = `<div class="daycard">DIA ${S.day}<br>${day.name} ${day.date}<small>${day.tag}</small></div>`;
    await waitOrClick(2600);
    st.classList.add('hidden');
  }
  function fade(on, white) {
    const f = $('#fade');
    f.classList.toggle('white', !!white);
    f.classList.toggle('on', on);
    return wait(1250);
  }

  // ---------------------------------------------------------------
  // fluxo do jogo
  // ---------------------------------------------------------------
  async function newGame() {
    clearSave();
    S = freshState();
    applyStateToWorld();
    $('#title').classList.add('hidden');
    phase = 'cutscene';
    $('#fade').style.transition = 'none'; $('#fade').classList.add('on'); void $('#fade').offsetWidth; $('#fade').style.transition = '';
    await storyLines(D.INTRO_CRAWL);
    newSack();
    $('#hud').classList.remove('hidden');
    await fade(false);
    await dialog(D.CALLS.intro);
    phase = 'play';
    setHint('CLIQUE NA PILHA DE ARROZ (OU ESPAÇO) PRA CONTAR');
    toast('🎯 Objetivo: ache o Grão Dourado. Pague as parcelas da Tríade às 22h.', 'gold', 7000);
    save();
  }

  function continueGame() {
    if (!load()) return newGame();
    if (S.flags.act1Done) return startAct2();
    applyStateToWorld();
    $('#title').classList.add('hidden');
    $('#hud').classList.remove('hidden');
    if (!S.sack) newSack();
    World.newSack(!!S.sack.final);
    if (owned('radio') && !S.flags.finalSack) Sfx.radio(true);
    if (S.flags.finalSack) { phase = 'final'; Sfx.drone(true); World.setFlicker(0.3); setHint(`CONTE COM AS PRÓPRIAS MÃOS · faltam ${S.sack.left}`); }
    else phase = 'play';
    toast('💾 Carregado do MEMORY CARD (PS2) no SLOT 1.', 'item');
  }

  function applyStateToWorld() {
    World.setHelpers(S.owned);
    World.setTool(bestTool());
    World.setTime(S.day, S.minute);
    World.setFlicker(S.heard >= 7 ? 0.25 : 0);
    renderTapes();
    renderMemory(false);
    shopKey = ''; newsKey = '';
    renderHud();
  }

  async function night(early) {
    phase = 'night';
    Sfx.radio(false);
    if (early) {
      await fade(true);
      S.minute = D.DAY_END;
      World.setTime(S.day, S.minute);
      $('#story').className = ''; $('#story').innerHTML = '<div class="line">Você deita no colchonete do quartinho dos fundos...</div>';
      await wait(2200);
      $('#story').classList.add('hidden');
      await fade(false);
    }
    S.minute = D.DAY_END;
    const due = D.DAYS[S.day - 1].parcela;
    await answerPhone();
    const lines = [['CHEFE', `Dez da noite, Zé. Parcela de hoje: ${brl(due)}.`]];
    if (S.money >= due) {
      S.money -= due; S.debt -= due; S.paid += due;
      lines.push(['NARRADOR', `Você faz um pix de ${brl(due)} pra uma chave aleatória com nome "K. S. Participações".`]);
      lines.push(['CHEFE', `Recebido. Faltam ${brl(S.debt)}.`]);
    } else {
      const paid = Math.floor(S.money), miss = due - paid, juros = Math.ceil(miss * 0.5);
      S.money = 0; S.debt += juros - paid; S.paid += paid;
      lines.push(['NARRADOR', `Você só tem ${brl(paid)}. Faz o pix de tudo.`]);
      lines.push(['CHEFE', `Faltou ${brl(miss)}. Juros de ${brl(juros)}. A Tríade não esquece, Zé.`]);
      lines.push(['CHEFE', '...Mas você esquece, né?']);
    }
    await dialog(lines.concat(D.CALLS['night' + S.day]));
    await fade(true);
    await storyLines(D.DREAMS[S.day], 'dream');
    S.day++;
    S.minute = D.DAY_START;
    World.setTime(S.day, S.minute);
    World.setHelpers(S.owned);
    save();
    await dayCard();
    $('#story').classList.add('hidden');
    await fade(false);
    await dialog(D.CALLS['morning' + S.day]);
    if (owned('radio')) Sfx.radio(true);
    phase = 'play';
    save();
  }

  async function startFinal() {
    phase = 'cutscene';
    Sfx.radio(false);
    Sfx.drone(true);
    World.setFlicker(1);
    World.shake(1);
    World.setStream(0);
    await wait(1200);
    S.flags.finalSack = true;
    await dialog(D.CALLS.finalMachines.slice(0, 1));
    newSack();
    World.setFlicker(0.4);
    await dialog(D.CALLS.finalMachines.slice(1));
    phase = 'final';
    setHint(`CONTE COM AS PRÓPRIAS MÃOS · faltam ${S.sack.left}`);
    save();
  }

  async function goldenFound() {
    phase = 'cutscene';
    setHint('');
    S.flags.goldFound = true;
    World.setPile(0);
    World.goldenReveal();
    Sfx.drone(false);
    Sfx.gold();
    World.flash(0.6); setTimeout(() => World.flash(0), 150);
    World.setFlicker(0);
    await wait(900);
    $('#btCn').textContent = '金米';
    $('#btPt').textContent = 'O GRÃO DOURADO';
    $('#bigText').classList.remove('hidden');
    await wait(3800);
    $('#bigText').classList.add('hidden');
    World.goldToHand();
    await wait(800);
    S.flags.ended = true;
    S.debt = 0;
    $('#badgeName').textContent = '黄金龙 · KING SIZE';
    await dialog(D.CALLS.ending);
    $('#hud').classList.add('hidden');
    World.endingTurn();
    Sfx.gong();
    await wait(5200);
    await fade(true, true);
    showEnding();
  }

  function showEnding() {
    // o ato I acabou: guarda o progresso pro ato II
    S.flags.act1Done = true;
    S.act2 = { stage: 'balsa1' };
    save();
    phase = 'ending';
    const m = Math.floor(S.playTime / 60), s = Math.floor(S.playTime % 60);
    $('#eStats').innerHTML = `Tempo de jogo: ${m}min ${String(s).padStart(2, '0')}s<br>Grãos contados: ${fmt(S.grains)}<br>Cliques: ${fmt(S.clicks)} · Grãos pretos: ${S.blacks}<br>"Pago" pra Tríade (pra você mesmo): ${brl(S.paid)}<br>Sacos abertos: ${fmt(S.sackCount)}`;
    $('#ending').classList.remove('hidden');
    $('#fade').classList.remove('on', 'white');
  }

  function startAct2() {
    Sfx.init();
    Sfx.drone(false); Sfx.radio(false); Sfx.ring(false); Sfx.rain(0);
    $('#ending').classList.add('hidden');
    $('#title').classList.add('hidden');
    $('#hud').classList.add('hidden');
    phase = 'act2';
    Act2.start(S.act2 || { stage: 'balsa1' });
  }

  // ---------------------------------------------------------------
  // save (memory card)
  // ---------------------------------------------------------------
  function save() {
    if (phase === 'title' || phase === 'ending') return;
    try {
      const copy = JSON.parse(JSON.stringify(S));
      copy.tapes.forEach((t) => { if (t.state === 'translating') t.state = 'translated'; });
      copy.pendingTape = null;
      localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
    } catch (e) { /* sem memory card, sem problema */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      S = Object.assign(freshState(), JSON.parse(raw));
      return true;
    } catch (e) { return false; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ok */ } }
  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

  // ---------------------------------------------------------------
  // entrada
  // ---------------------------------------------------------------
  let lastConsumed = 0;
  function primaryAction(x, y, pickName) {
    Sfx.init();
    if (skipResolve) { lastConsumed = performance.now(); skipResolve(); return; }
    if (phoneResolve) { lastConsumed = performance.now(); phoneResolve(); return; }
    if (dlg) { lastConsumed = performance.now(); advanceDialog(); return; }
    if (tapeUI) return;
    if (phase !== 'play' && phase !== 'final') return;
    if (pickName === 'boombox' && phase === 'play') {
      const i = S.tapes.findIndex((t) => !t.heard && t.state !== 'translating');
      if (i >= 0) { playTape(i); return; }
      if (owned('radio')) { radioToggle = !radioToggle; Sfx.radio(radioToggle); toast(radioToggle ? '📻 Pagode ligado.' : '📻 Rádio desligado.', ''); return; }
    }
    if (pickName === 'phone') { toast('☎ Tu-tu-tu-tu... Ninguém do outro lado. Só o chefe liga pra cá.', ''); return; }
    manualCount(x, y);
  }
  let radioToggle = true;

  const canvas = $('#c');
  canvas.addEventListener('pointerdown', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1, ny = -(e.clientY / window.innerHeight) * 2 + 1;
    primaryAction(e.clientX, e.clientY, World.pick(nx, ny));
  });
  window.addEventListener('pointermove', (e) => {
    World.look((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  });
  $('#dialog').addEventListener('pointerdown', () => primaryAction());
  $('#story').addEventListener('pointerdown', () => { if (skipResolve) skipResolve(); });
  $('#tapeEject').addEventListener('click', closeTape);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') { toggleMute(); return; }
    if (phase === 'title' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); (hasSave() ? continueGame : newGame)(); Sfx.init(); return; }
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      if (tapeUI && !dlg) { if (e.code === 'Enter') closeTape(); return; }
      primaryAction();
    }
    if (DEBUG) {
      if (e.code === 'KeyG') { const v = Math.max(1000, (gps() + clickPower()) * 60); S.money += v; count(Math.floor(v), false); toast('[debug] +' + fmt(v)); }
      if (e.code === 'KeyH') S.minute += 60;
      if (e.code === 'KeyN' && phase === 'play' && S.day < 3) night(true);
      if (e.code === 'KeyT' && S.pendingTape == null) S.pendingTape = S.playTime;
    }
  });

  $('#tapesList').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    Sfx.init();
    if (b.dataset.play != null) { if (phase === 'play') playTape(+b.dataset.play); }
    if (b.dataset.tr != null) translate(+b.dataset.tr);
  });
  $('#shopList').addEventListener('click', (e) => {
    const b = e.target.closest('.item');
    if (b && !b.classList.contains('locked')) { Sfx.init(); buy(b.dataset.id); }
  });
  $('#sleepBtn').addEventListener('click', () => { if (phase === 'play' && dayTapesDone()) night(true); });
  $('#btnNew').addEventListener('click', () => { Sfx.init(); newGame(); });
  $('#btnCont').addEventListener('click', () => { Sfx.init(); continueGame(); });
  $('#btnAgain').addEventListener('click', () => { clearSave(); location.reload(); });
  $('#btnAct2').addEventListener('click', startAct2);
  $('#muteBtn').addEventListener('click', toggleMute);
  $('#btnTapes').addEventListener('click', () => { $('#leftCol').classList.toggle('open'); $('#shop').classList.remove('open'); $('#btnTapes').classList.remove('flash'); });
  $('#btnShop').addEventListener('click', () => { $('#shop').classList.toggle('open'); $('#leftCol').classList.remove('open'); });
  function toggleMute() { Sfx.setMuted(!Sfx.isMuted()); $('#muteBtn').textContent = Sfx.isMuted() ? '🔇' : '🔊'; }

  // ---------------------------------------------------------------
  // loop principal
  // ---------------------------------------------------------------
  let last = performance.now();
  let saveT = 0, rainT = 0;
  function update(dt) {
    updateDialog(dt);
    updateTape(dt);

    if (phase === 'play' || phase === 'final') {
      S.playTime += dt;
      const g = gps();
      if (g > 0) {
        S.acc += g * dt;
        const n = Math.floor(S.acc);
        if (n > 0) { S.acc -= n; count(n, false); }
      }
      World.setStream(phase === 'play' ? g : 0);
      rainT += dt;
      if (rainT > 0.5) { rainT = 0; Sfx.rain(g > 30 ? Math.min(1, Math.log10(g) / 6) : 0); }

      if (phase === 'play') {
        const frozen = dlg || tapeUI || phoneResolve;
        if (!frozen) {
          S.minute += dt * D.GAME_MIN_PER_SEC;
          if (S.day === 3) S.minute = Math.min(S.minute, 1439);
        }
        if (S.day < 3 && S.minute >= D.DAY_END && !frozen) night(false);
        checkTapes();
        if (S.pendingTape != null && S.playTime >= S.pendingTape && !tapeUI) { S.pendingTape = null; foundTape(); }
        if (S.playTime >= S.nextItemAt) { S.nextItemAt = S.playTime + 45 + Math.random() * 55; if (!dlg && !tapeUI) randomItem(); }
        if (S.day === 3 && S.minute > 1260) World.setFlicker(Math.max(S.heard >= 7 ? 0.25 : 0, 0.15));
      }
      saveT += dt;
      if (saveT > 5) { saveT = 0; save(); }
    } else Sfx.rain(0);

    if (S.sack) { const f = S.sack.left / S.sack.size; World.setPile(f); World.setSackFrac(f); }
    World.setTime(S.day, S.minute);

    hudT += dt;
    if (hudT > 0.1 && phase !== 'title') { hudT = 0; renderHud(); }
  }

  function frame(t) {
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    if (Act2.isActive()) {
      updateDialog(dt);
      Act2.update(dt);
      Act2.render();
      requestAnimationFrame(frame);
      return;
    }
    update(dt);
    const tapeReady = S.tapes.some((x) => !x.heard);
    World.update(dt, { auto: phase === 'play' && gps() > 0, tapeReady });
    World.render();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------
  // boot
  // ---------------------------------------------------------------
  // ponte pro Ato II (act2.js) usar os diálogos, telas e o save do jogo
  window.GameUI = {
    dialog, storyLines, fade, toast, setHint, wait, waitOrClick, fmt, brl, save, clearSave,
    S: () => S,
    busy: () => !!(dlg || skipResolve || phoneResolve),
    consumedAt: () => lastConsumed,
    setPhase: (p) => { phase = p; },
    skip: () => { if (skipResolve) skipResolve(); },
  };

  World.init(canvas);
  if (hasSave()) {
    $('#btnCont').classList.remove('hidden');
    let act2 = false;
    try { act2 = !!JSON.parse(localStorage.getItem(SAVE_KEY)).flags.act1Done; } catch (e) { /* save antigo */ }
    $('#memCard').textContent = act2 ? 'MEMORY CARD (8MB) no SLOT 1: "ARROZ DOURADO" — ATO II' : 'MEMORY CARD (8MB) no SLOT 1: "ARROZ DOURADO" — 1 save encontrado';
  }
  requestAnimationFrame(frame);
  if (DEBUG) {
    window.__S = () => S;
    window.__A2DEBUG = true;
    // ?debug&act2=balsa1|mansion|boss1|post1|boss2|final pula direto pra uma parte do ato II
    const m = location.search.match(/act2=(\w+)/);
    if (m) { S.flags.act1Done = true; S.act2 = { stage: m[1] }; startAct2(); }
  }
})();
