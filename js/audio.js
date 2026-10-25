// =====================================================================
//  ARROZ DOURADO — áudio 100% sintetizado (WebAudio + voz chinesa TTS)
// =====================================================================

const Sfx = (() => {
  let ctx = null, master = null, sfxBus = null, musicBus = null, radioBus = null;
  let noiseBuf = null;
  let muted = false;
  let ringTimer = null;
  let rainNode = null, rainGain = null;
  let humGain = null;
  let radioOn = false, radioTimer = null, radioStep = 0, radioNext = 0;
  let droneNodes = null;
  let speakToken = 0;
  let hissNode = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
    // rádio: som de radinho de pilha (banda estreita)
    radioBus = ctx.createGain(); radioBus.gain.value = 0.32;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    radioBus.connect(hp); hp.connect(lp); lp.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    startHum();
    startRain();
  }

  function now() { return ctx.currentTime; }
  function noiseSrc(loop) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = !!loop; return s; }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  function tone(freq, dur, type, vol, bus, when, slideTo) {
    if (!ctx) return;
    const t = when || now();
    const o = ctx.createOscillator(); o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain(); env(g, t, 0.005, vol || 0.2, dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noiseHit(freq, q, dur, vol, bus, when, type) {
    if (!ctx) return;
    const t = when || now();
    const s = noiseSrc();
    const f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); env(g, t, 0.002, vol, dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }

  // ---------------- efeitos ----------------
  let lastTick = 0;
  function tick() {
    if (!ctx) return;
    if (now() - lastTick < 0.03) return;
    lastTick = now();
    noiseHit(2500 + Math.random() * 1500, 6, 0.035, 0.12);
    tone(1400 + Math.random() * 600, 0.03, 'triangle', 0.035);
  }
  function black() { tone(220, 0.15, 'square', 0.15); tone(330, 0.2, 'square', 0.12, null, now() + 0.08); tone(660, 0.3, 'triangle', 0.12, null, now() + 0.16); }
  function buy() {
    if (!ctx) return;
    const t = now();
    noiseHit(5000, 2, 0.08, 0.3, null, t);
    tone(1318, 0.12, 'square', 0.1, null, t + 0.02);
    tone(1760, 0.35, 'square', 0.1, null, t + 0.09);
  }
  function error() { tone(140, 0.18, 'square', 0.15); tone(110, 0.25, 'square', 0.15, null, now() + 0.12); }
  function sackDrop() {
    if (!ctx) return;
    tone(90, 0.35, 'sine', 0.6, null, null, 40);
    noiseHit(400, 0.8, 0.4, 0.5, null, null, 'lowpass');
    for (let i = 0; i < 6; i++) noiseHit(4000 + Math.random() * 3000, 5, 0.05, 0.12, null, now() + 0.05 + Math.random() * 0.3);
  }
  function tapeFound() {
    if (!ctx) return;
    const t = now();
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'square', 0.08, null, t + i * 0.09));
    noiseHit(2000, 3, 0.1, 0.2, null, t);
  }
  function tapeClick() { noiseHit(1500, 4, 0.05, 0.5); noiseHit(800, 4, 0.08, 0.4, null, now() + 0.12); tone(60, 0.15, 'square', 0.1, null, now() + 0.12); }
  function whatsapp() { if (!ctx) return; tone(1400, 0.08, 'sine', 0.2); tone(1900, 0.12, 'sine', 0.2, null, now() + 0.09); }
  function itemFound() { if (!ctx) return; tone(880, 0.08, 'triangle', 0.12); tone(1174, 0.15, 'triangle', 0.12, null, now() + 0.07); }
  function fake() { if (!ctx) return; const t = now(); [392, 370, 349, 330].forEach((f, i) => tone(f, i === 3 ? 0.7 : 0.25, 'sawtooth', 0.08, null, t + i * 0.28)); }

  const blipFreq = { 'CHEFE': 110, 'VOCÊ': 220, 'NARRADOR': 330, 'DONA MEI': 440 };
  let blipT = 0;
  function blip(who) {
    if (!ctx || now() - blipT < 0.05) return;
    blipT = now();
    const f = (blipFreq[who] || 260) * (0.92 + Math.random() * 0.16);
    tone(f, 0.04, who === 'CHEFE' ? 'sawtooth' : 'square', who === 'CHEFE' ? 0.05 : 0.035);
  }

  function gold() {
    if (!ctx) return;
    const t = now();
    // arpejo pentatônico dourado
    [523, 587, 659, 784, 880, 1046, 1175, 1318, 1568, 2093].forEach((f, i) => {
      tone(f, 0.6, 'triangle', 0.1, null, t + i * 0.07);
      tone(f * 2, 0.4, 'sine', 0.04, null, t + i * 0.07 + 0.02);
    });
    // gongo
    [110, 164, 221, 293].forEach((f) => tone(f, 4, 'sine', 0.18, null, t, f * 0.97));
    noiseHit(300, 1, 2.5, 0.25, null, t, 'lowpass');
  }

  function gong() { if (!ctx) return; [98, 147, 196, 262].forEach((f) => tone(f, 5, 'sine', 0.2, null, null, f * 0.96)); noiseHit(250, 1, 3, 0.2, null, null, 'lowpass'); }

  // ---------------- telefone (toque brasileiro de fixo) ----------------
  function ring(on) {
    if (!ctx) return;
    if (ringTimer) { clearInterval(ringTimer); ringTimer = null; }
    if (!on) return;
    const once = () => {
      const t = now();
      for (let i = 0; i < 2; i++) {
        const s = t + i * 0.45;
        const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = 850;
        const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 1050;
        const am = ctx.createOscillator(); am.frequency.value = 22;
        const amG = ctx.createGain(); amG.gain.value = 0.5;
        const mod = ctx.createGain(); mod.gain.value = 0.5; // trêmulo da campainha, num nó separado
        const g = ctx.createGain(); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.06, s + 0.01); g.gain.setValueAtTime(0.06, s + 0.35); g.gain.linearRampToValueAtTime(0, s + 0.38);
        am.connect(amG); amG.connect(mod.gain);
        o1.connect(mod); o2.connect(mod); mod.connect(g); g.connect(sfxBus);
        [o1, o2, am].forEach((o) => { o.start(s); o.stop(s + 0.4); });
      }
    };
    once();
    ringTimer = setInterval(once, 2200);
  }

  // ---------------- ambiente ----------------
  function startHum() {
    // zumbido de lâmpada fluorescente (60Hz, padrão brasileiro) + ar de galpão
    humGain = ctx.createGain(); humGain.gain.value = 0.035; humGain.connect(musicBus);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
    o.connect(f); f.connect(humGain); o.start();
    const n = noiseSrc(true);
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 500;
    const ng = ctx.createGain(); ng.gain.value = 0.25;
    n.connect(nf); nf.connect(ng); ng.connect(humGain); n.start();
  }
  function startRain() {
    // "chuva de arroz" pra quando as máquinas contam muito rápido
    // (a modulação fica num nó separado; antes ela somava no volume e o chiado tocava alto o tempo todo)
    rainNode = noiseSrc(true);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.6;
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 3500;
    const mod = ctx.createGain(); mod.gain.value = 0.7;
    const am = ctx.createOscillator(); am.frequency.value = 9;
    const amG = ctx.createGain(); amG.gain.value = 0.3;
    am.connect(amG); amG.connect(mod.gain);
    rainGain = ctx.createGain(); rainGain.gain.value = 0;
    rainNode.connect(f); f.connect(soft); soft.connect(mod); mod.connect(rainGain); rainGain.connect(sfxBus);
    rainNode.start(); am.start();
  }
  function rain(level) {
    if (!rainGain) return;
    rainGain.gain.setTargetAtTime(Math.min(0.05, level * 0.05), now(), 0.3);
  }

  // ---------------- rádio de pilha: loop de pagode sintetizado ----------------
  const CHORDS = [[261.6, 329.6, 392, 440], [220, 277.2, 329.6, 392], [293.7, 349.2, 440, 523.3], [196, 246.9, 293.7, 349.2]]; // C6 A7 Dm7 G7
  const CAV = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
  const TAM = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0];
  function radio(on) {
    if (!ctx) return;
    radioOn = on;
    if (radioTimer) { clearInterval(radioTimer); radioTimer = null; }
    if (!on) return;
    radioNext = now() + 0.1;
    const step = 60 / 98 / 4;
    radioTimer = setInterval(() => {
      while (radioNext < now() + 0.2) {
        const s = radioStep % 16, bar = Math.floor(radioStep / 16) % 4, t = radioNext;
        // surdo (marcação no 2º tempo)
        if (s === 0) tone(70, 0.25, 'sine', 0.25, radioBus, t, 55);
        if (s === 8) tone(62, 0.5, 'sine', 0.5, radioBus, t, 48);
        // pandeiro / ganzá
        noiseHit(7000, 1.5, 0.04, s % 4 === 0 ? 0.25 : 0.1, radioBus, t, 'highpass');
        // tamborim
        if (TAM[s]) tone(900, 0.04, 'square', 0.07, radioBus, t);
        // cavaquinho
        if (CAV[s]) CHORDS[bar].forEach((f, i) => tone(f * 2, 0.12, 'triangle', 0.035, radioBus, t + i * 0.008));
        // baixo do violão de 7
        if (s === 0 || s === 6 || s === 10) tone(CHORDS[bar][0] / 2 * (s === 6 ? 1.5 : 1), 0.25, 'triangle', 0.12, radioBus, t);
        radioNext += step; radioStep++;
      }
    }, 40);
  }

  // ---------------- drone tenso (final) ----------------
  function drone(on) {
    if (!ctx) return;
    if (droneNodes) { droneNodes.g.gain.setTargetAtTime(0, now(), 1); const d = droneNodes; setTimeout(() => d.os.forEach((o) => o.stop()), 4000); droneNodes = null; }
    if (!on) return;
    const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus);
    g.gain.setTargetAtTime(0.18, now(), 2);
    const os = [55, 82.4, 110.5, 164.8].map((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f;
      const lf = ctx.createBiquadFilter(); lf.type = 'lowpass'; lf.frequency.value = 400;
      o.connect(lf); lf.connect(g); o.start(); return o;
    });
    droneNodes = { g, os };
  }

  // ---------------- fita cassete: voz em chinês ----------------
  function zhVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices();
    return vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); }

  function startHiss() {
    if (!ctx || hissNode) return;
    const n = noiseSrc(true);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
    const g = ctx.createGain(); g.gain.value = 0.03;
    const w = ctx.createOscillator(); w.frequency.value = 0.7; // "wow" da fita
    const wg = ctx.createGain(); wg.gain.value = 0.01;
    w.connect(wg); wg.connect(g.gain);
    n.connect(f); f.connect(g); g.connect(sfxBus); n.start(); w.start();
    hissNode = { n, w };
  }
  function stopHiss() { if (hissNode) { hissNode.n.stop(); hissNode.w.stop(); hissNode = null; } }

  // sintetiza "fala" com tons do mandarim quando não tem voz chinesa no PC
  function synthSpeech(text, voice, token, onend) {
    const base = 80 + (voice.pitch || 1) * 110;
    const chars = Array.from(text);
    const VOW = [[730, 1090], [270, 2290], [300, 870], [530, 1840], [570, 840]];
    let t = now() + 0.1;
    const sdur = 0.17 / (voice.rate || 1);
    chars.forEach((ch) => {
      if (/[，。、！？…,.!?]/.test(ch)) { t += sdur * 2.2; return; }
      if (/\s/.test(ch)) { t += sdur * 0.5; return; }
      const tn = 1 + Math.floor(Math.random() * 4);
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      const f0 = base * (0.95 + Math.random() * 0.1);
      const curve = { 1: [1.15, 1.15], 2: [0.9, 1.25], 3: [0.9, 0.75], 4: [1.3, 0.8] }[tn];
      o.frequency.setValueAtTime(f0 * curve[0], t);
      if (tn === 3) { o.frequency.linearRampToValueAtTime(f0 * 0.7, t + sdur * 0.5); o.frequency.linearRampToValueAtTime(f0 * 0.95, t + sdur); } else o.frequency.linearRampToValueAtTime(f0 * curve[1], t + sdur);
      const v = VOW[Math.floor(Math.random() * VOW.length)];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + sdur * 0.95);
      const out = ctx.createGain(); out.gain.value = 0.4;
      v.forEach((fr) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = 7; o.connect(bp); bp.connect(g); });
      // consoante
      noiseHit(3000 + Math.random() * 3000, 2, 0.03, 0.08, sfxBus, t);
      g.connect(out); out.connect(sfxBus);
      o.start(t); o.stop(t + sdur);
      t += sdur;
    });
    const total = (t - now()) * 1000;
    setTimeout(() => { if (token === speakToken) onend && onend(); }, total + 200);
  }

  function speakChinese(text, voice, onend) {
    stopSpeech();
    const token = ++speakToken;
    startHiss();
    const done = () => { if (token !== speakToken) return; stopHiss(); onend && onend(); };
    const v = zhVoice();
    if (v && !muted) {
      const chunks = text.split(/(?<=[。！？])/).filter((s) => s.trim());
      let i = 0;
      const next = () => {
        if (token !== speakToken) return;
        if (i >= chunks.length) return done();
        const u = new SpeechSynthesisUtterance(chunks[i++]);
        u.voice = v; u.lang = v.lang; u.pitch = Math.max(0.1, Math.min(2, voice.pitch || 1)); u.rate = voice.rate || 0.9; u.volume = 0.9;
        u.onend = next; u.onerror = next;
        speechSynthesis.speak(u);
      };
      next();
    } else if (ctx) {
      synthSpeech(text, voice, token, done);
    } else setTimeout(done, 3000);
  }
  function stopSpeech() {
    speakToken++;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    stopHiss();
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, now(), 0.05);
    if (m && 'speechSynthesis' in window) speechSynthesis.cancel();
  }

  return {
    init, tick, black, buy, error, sackDrop, tapeFound, tapeClick, whatsapp, itemFound, fake, blip, gold, gong,
    ring, rain, radio, drone, speakChinese, stopSpeech, setMuted, isMuted: () => muted, hasZh: () => !!zhVoice(),
  };
})();
