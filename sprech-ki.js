// 🎙️ SprechKI – echte Spracherkennung für die Sprach-Apps (Slowenisch, Englisch).
// Weg 1: Whisper direkt auf dem Gerät (transformers.js + ONNX). Einmal laden (~40–80 MB von Hugging Face / jsDelivr),
//        danach offline. Die Stimme verlässt das Gerät nie. Erkennt Slowenisch und Englisch.
// Weg 2: Spracherkennung des Browsers (Web Speech API) – Safari/Chrome, je nach Gerät und Sprache.
// Weg 3: keine Erkennung → es wird NICHT „stimmt“ behauptet; man vergleicht selbst (Aufnahme ↔ Original).
// Bewertung: Wort-für-Wort-Abgleich (Levenshtein, č/c-Nähe, Zahlen, englische Kurzformen) → Farben je Wort.
const SprechKI = (() => {
  const KEY = 'walquiz.sprechki.v1';
  const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6';
  const MODELLE = {
    tiny: { id: 'onnx-community/whisper-tiny', mb: 40, n: 'Kompakt', t: '≈ 40 MB · schnell, etwas ungenauer' },
    base: { id: 'onnx-community/whisper-base', mb: 80, n: 'Genau', t: '≈ 80 MB · empfohlen' },
  };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let pipe = null, laedt = null, ladeStand = null, modellAktiv = null;
  const store = () => { const s = loadJson(KEY); return s && typeof s === 'object' ? s : {}; };
  const speichern = (s) => saveJson(KEY, s);
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---------- Text-Normalisierung ----------
  const ZAHLEN = {
    sl: ['nič', 'ena', 'dva', 'tri', 'štiri', 'pet', 'šest', 'sedem', 'osem', 'devet', 'deset', 'enajst', 'dvanajst', 'trinajst', 'štirinajst', 'petnajst', 'šestnajst', 'sedemnajst', 'osemnajst', 'devetnajst', 'dvajset'],
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  };
  const EN_KURZ = [[/\bi'm\b/g, 'i am'], [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'], [/n't\b/g, ' not'], [/'re\b/g, ' are'], [/'ve\b/g, ' have'], [/'ll\b/g, ' will'], [/'d\b/g, ' would'], [/\b(it|that|there|what|he|she|who|here|where|let)'s\b/g, '$1 is'], [/\bcan not\b/g, 'cannot'], [/\bok\b/g, 'okay']];
  function norm(t, lang) {
    let s = String(t || '').toLowerCase().replace(/[’`´]/g, "'");
    if (lang === 'en') EN_KURZ.forEach(([a, b]) => { s = s.replace(a, b); });
    s = s.replace(/[.,!?;:„“"«»()¿¡…–—\-/]/g, ' ').replace(/'/g, lang === 'en' ? '' : ' ');
    const Z = ZAHLEN[lang] || [];
    s = s.replace(/\b\d+\b/g, (d) => (Z[+d] != null ? Z[+d] : d));
    return s.replace(/\s+/g, ' ').trim();
  }
  const woerter = (t, lang) => (norm(t, lang) ? norm(t, lang).split(' ') : []);
  // Levenshtein mit „fast gleichen“ Buchstaben (č~c, š~s, ž~z kosten wenig)
  const NAH = { 'č': 'c', 'ć': 'c', 'š': 's', 'ž': 'z', 'đ': 'd' };
  const basis = (ch) => NAH[ch] || ch;
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let v = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const w = [i];
      for (let j = 1; j <= n; j++) {
        const sub = a[i - 1] === b[j - 1] ? 0 : basis(a[i - 1]) === basis(b[j - 1]) ? 0.3 : 1;
        w[j] = Math.min(v[j] + 1, w[j - 1] + 1, v[j - 1] + sub);
      }
      v = w;
    }
    return v[n];
  }
  const aehnlich = (a, b) => (a === b ? 1 : Math.max(0, 1 - lev(a, b) / Math.max(a.length, b.length)));
  // Wörter des Ziels den gehörten Wörtern zuordnen (Ausrichtung wie bei einem Diff)
  function vergleiche(gehoert, ziel, lang) {
    const T = woerter(ziel, lang), H = woerter(gehoert, lang);
    if (!T.length) return { quote: 0, woerter: [], extra: H.length, ok: false };
    const m = T.length, n = H.length, D = [], W = [];
    for (let i = 0; i <= m; i++) { D.push(new Array(n + 1).fill(0)); W.push(new Array(n + 1).fill(null)); }
    for (let i = 1; i <= m; i++) { D[i][0] = i; W[i][0] = 'del'; }
    for (let j = 1; j <= n; j++) { D[0][j] = j * 0.6; W[0][j] = 'ins'; }
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const s = aehnlich(T[i - 1], H[j - 1]), opt = [[D[i - 1][j - 1] + (1 - s), 'sub'], [D[i - 1][j] + 1, 'del'], [D[i][j - 1] + 0.6, 'ins']];
      opt.sort((x, y) => x[0] - y[0]); D[i][j] = opt[0][0]; W[i][j] = opt[0][1];
    }
    const erg = new Array(m); let i = m, j = n, extra = 0;
    while (i > 0 || j > 0) {
      const w = W[i][j];
      if (w === 'sub') { erg[i - 1] = { w: T[i - 1], h: H[j - 1], s: aehnlich(T[i - 1], H[j - 1]) }; i--; j--; }
      else if (w === 'del') { erg[i - 1] = { w: T[i - 1], h: '', s: 0 }; i--; }
      else { extra++; j--; }
    }
    // kurze Wörter (in/on, je/se …) müssen genau stimmen – sonst ist es ein anderes Wort
    erg.forEach((e) => { e.status = e.s >= 0.8 ? 'ok' : e.s >= 0.5 && Math.max(e.w.length, e.h.length) > 3 ? 'fast' : 'fehlt'; });
    const roh = erg.reduce((a, e) => a + (e.status === 'ok' ? 1 : e.status === 'fast' ? e.s * 0.8 : 0), 0) / m;
    const quote = Math.max(0, roh - Math.max(0, extra - 1) * 0.08);
    return { quote, woerter: erg, extra, ok: quote >= 0.75 };
  }
  function besteVon(alternativen, ziel, lang) {
    let best = null;
    alternativen.filter(Boolean).forEach((t) => { const v = vergleiche(t, ziel, lang); if (!best || v.quote > best.quote) best = { ...v, text: t }; });
    return best || { ...vergleiche('', ziel, lang), text: '' };
  }

  // ---------- Aufnahme (rohes PCM, Sprach-Erkennung per Pegel, Auto-Stopp nach Stille) ----------
  let laufend = null;
  async function aufnehmen({ maxMs = 9000, stilleMs = 1200, onPegel } = {}) {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) throw Object.assign(new Error('kein Mikrofon'), { code: 'kein-mikro' });
    if (typeof ftAudioVorMikrofon === 'function') ftAudioVorMikrofon();
    const strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') { try { await ac.resume(); } catch (e) { /* egal */ } }
    const quelle = ac.createMediaStreamSource(strom), proz = ac.createScriptProcessor(4096, 1, 1), stumm = ac.createGain();
    stumm.gain.value = 0; quelle.connect(proz); proz.connect(stumm); stumm.connect(ac.destination);
    const stuecke = [], rate = ac.sampleRate, t0 = performance.now();
    let rausch = null, sprach = false, letzteSprache = 0, sprachMs = 0;
    return new Promise((fertig) => {
      const ende = () => {
        if (!laufend) return; laufend = null;
        try { proz.disconnect(); quelle.disconnect(); } catch (e) { /* egal */ }
        strom.getTracks().forEach((t) => t.stop()); try { ac.close(); } catch (e) { /* egal */ }
        if (typeof ftAudioNachMikrofon === 'function') ftAudioNachMikrofon();
        const len = stuecke.reduce((a, s) => a + s.length, 0), roh = new Float32Array(len); let o = 0;
        stuecke.forEach((s) => { roh.set(s, o); o += s.length; });
        fertig({ samples: resample(roh, rate, 16000), rate: 16000, sprach, sprachMs, dauer: len / rate, url: URL.createObjectURL(wav(resample(roh, rate, 16000), 16000)) });
      };
      laufend = { stop: ende };
      proz.onaudioprocess = (e) => {
        const d = e.inputBuffer.getChannelData(0); stuecke.push(new Float32Array(d));
        let s = 0; for (let k = 0; k < d.length; k++) s += d[k] * d[k];
        const rms = Math.sqrt(s / d.length), t = performance.now() - t0;
        if (t < 300) rausch = rausch == null ? rms : Math.min(rausch, rms);
        const schwelle = Math.max(0.01, (rausch || 0.004) * 3);
        if (rms > schwelle && t > 150) { sprach = true; letzteSprache = t; sprachMs += (d.length / rate) * 1000; }
        if (onPegel) onPegel(Math.min(1, rms / 0.12));
        if ((sprach && t - letzteSprache > stilleMs) || t > maxMs) ende();
      };
    });
  }
  const stopp = () => { if (laufend) laufend.stop(); };
  function resample(x, von, nach) {
    if (von === nach) return x;
    const f = von / nach, n = Math.floor(x.length / f), y = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i * f, a = Math.floor(p), b = Math.min(x.length - 1, a + 1), w = p - a; y[i] = x[a] * (1 - w) + x[b] * w; }
    return y;
  }
  function wav(x, rate) {
    const buf = new ArrayBuffer(44 + x.length * 2), v = new DataView(buf), s = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    s(0, 'RIFF'); v.setUint32(4, 36 + x.length * 2, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, x.length * 2, true);
    for (let i = 0; i < x.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i])) * 0x7fff, true);
    return new Blob([buf], { type: 'audio/wav' });
  }

  // ---------- Whisper ----------
  const whisperInstalliert = () => !!store().modell;
  const whisperBereit = () => !!pipe;
  async function whisperLaden(modell, onFortschritt) {
    modell = MODELLE[modell] ? modell : store().modell || 'base';
    if (pipe && modellAktiv === modell) return pipe;
    if (laedt) return laedt;
    ladeStand = { geladen: 0, gesamt: MODELLE[modell].mb * 1e6, text: 'Starte …' };
    laedt = (async () => {
      const T = SprechKI._import ? await SprechKI._import() : await import(/* webpackIgnore: true */ CDN);
      T.env.allowLocalModels = false;
      const dateien = {};
      const p = await T.pipeline('automatic-speech-recognition', MODELLE[modell].id, {
        dtype: 'q8', device: 'wasm',
        progress_callback: (e) => {
          if (e && e.file && e.total) { dateien[e.file] = [e.loaded || 0, e.total]; }
          const g = Object.values(dateien).reduce((a, x) => a + x[0], 0), t = Math.max(Object.values(dateien).reduce((a, x) => a + x[1], 0), 1);
          ladeStand = { geladen: g, gesamt: t, text: e && e.status === 'ready' ? 'Fertig' : 'Lade ' + (e && e.file ? e.file.split('/').pop() : '…') };
          if (onFortschritt) onFortschritt(ladeStand);
        },
      });
      pipe = p; modellAktiv = modell;
      const s = store(); s.modell = modell; s.seit = s.seit || Date.now(); speichern(s);
      return p;
    })().finally(() => { laedt = null; });
    return laedt;
  }
  async function whisperHoeren(samples, lang) {
    const p = await whisperLaden();
    const r = await p(samples, { language: lang === 'sl' ? 'slovenian' : 'english', task: 'transcribe', return_timestamps: false });
    return String((r && r.text) || '').trim();
  }
  function whisperEntfernen() {
    const s = store(); delete s.modell; speichern(s); pipe = null; modellAktiv = null;
    if (window.caches) caches.keys().then((ks) => ks.filter((k) => /transformers|sprechki/i.test(k)).forEach((k) => caches.delete(k))).catch(() => {});
  }

  // ---------- Browser-Erkennung ----------
  const webKaputt = (lang) => !!(store().webKaputt || {})[lang];
  function webHoeren(lang) {
    return new Promise((ok, nein) => {
      let rec; try { rec = new SR(); } catch (e) { nein(Object.assign(new Error('start'), { code: 'start' })); return; }
      rec.lang = lang === 'sl' ? 'sl-SI' : 'en-GB'; rec.interimResults = false; rec.maxAlternatives = 5;
      let fertig = false;
      laufend = { stop: () => { try { rec.stop(); } catch (e) { /* egal */ } } };
      rec.onresult = (e) => { fertig = true; ok([...e.results[0]].map((x) => x.transcript)); };
      rec.onerror = (e) => {
        fertig = true;
        if (['language-not-supported', 'service-not-allowed', 'not-allowed'].includes(e.error) && e.error !== 'not-allowed') { const s = store(); s.webKaputt = { ...(s.webKaputt || {}), [lang]: e.error }; speichern(s); }
        nein(Object.assign(new Error(e.error), { code: e.error }));
      };
      rec.onend = () => { laufend = null; if (!fertig) nein(Object.assign(new Error('no-speech'), { code: 'no-speech' })); };
      try { rec.start(); } catch (e) { nein(Object.assign(new Error('start'), { code: 'start' })); }
    });
  }
  // Welcher Weg ist für diese Sprache möglich?
  function weg(lang) {
    const whisper = whisperInstalliert();
    const web = !!SR && !webKaputt(lang);
    if (lang === 'sl') return whisper ? 'whisper' : web ? 'web' : null;
    return web ? 'web' : whisper ? 'whisper' : null;
  }
  // Einmal hören: liefert {text, alternativen, quelle, url}
  async function hoeren(lang, { onPegel, onStatus } = {}) {
    const w = weg(lang);
    if (!w) throw Object.assign(new Error('keine'), { code: 'keine' });
    if (w === 'web') {
      onStatus && onStatus('Ich höre zu …');
      try { const alt = await webHoeren(lang); return { text: alt[0] || '', alternativen: alt, quelle: 'web' }; }
      catch (e) { if (whisperInstalliert() && e.code !== 'no-speech' && e.code !== 'aborted') return hoerenWhisper(lang, { onPegel, onStatus }); throw e; }
    }
    return hoerenWhisper(lang, { onPegel, onStatus });
  }
  async function hoerenWhisper(lang, { onPegel, onStatus } = {}) {
    if (!pipe) { onStatus && onStatus('Lade Spracherkennung …'); whisperLaden().catch(() => {}); }
    onStatus && onStatus('Ich höre zu …');
    const a = await aufnehmen({ onPegel });
    if (!a.sprach || a.sprachMs < 180) throw Object.assign(new Error('no-speech'), { code: 'no-speech', url: a.url });
    onStatus && onStatus(pipe ? 'Erkenne …' : 'Lade Spracherkennung …');
    const text = await (SprechKI._transkribiere ? SprechKI._transkribiere(a.samples, lang) : whisperHoeren(a.samples, lang));
    return { text, alternativen: [text], quelle: 'whisper', url: a.url };
  }

  // ---------- Oberfläche: Mikro-Knopf + Ergebnis ----------
  const FEHLER = {
    'no-speech': 'Ich habe nichts gehört – noch einmal, etwas lauter?', 'not-allowed': 'Kein Zugriff aufs Mikrofon. iPhone: Einstellungen › Safari › Mikrofon › Erlauben.',
    'audio-capture': 'Kein Mikrofon gefunden.', network: 'Die Browser-Erkennung braucht Internet.', 'kein-mikro': 'Dieses Gerät kann hier nicht aufnehmen.',
    'language-not-supported': 'Der Browser erkennt diese Sprache nicht.', 'service-not-allowed': 'Der Browser lässt seine Spracherkennung hier nicht zu.',
  };
  function wortHtml(v) {
    return '<div class="ski-woerter">' + v.woerter.map((e) => '<span class="ski-w ' + e.status + '" title="' + esc(e.h ? 'gehört: ' + e.h : 'nicht gehört') + '">' + esc(e.w) + '</span>').join(' ') + '</div>';
  }
  // box: Element · opt: {lang, ziel, sprich(text), onErgebnis(res), selbst: true → bei fehlender Erkennung selbst bewerten}
  function widget(box, opt) {
    const w = weg(opt.lang);
    if (!w) { keineErkennung(box, opt); return; }
    box.innerHTML = '<div class="ski"><button type="button" class="ski-mikro" data-ski="mikro"><span class="ski-ring"><i></i></span><b>🎙️</b><em>Tippen und sprechen</em></button>'
      + '<div class="ski-status" data-ski="status">' + (w === 'whisper' ? '🧠 Whisper auf dem Gerät' : '🌐 Browser-Erkennung') + '</div><div class="ski-erg" data-ski="erg"></div></div>';
    const knopf = box.querySelector('[data-ski="mikro"]'), status = box.querySelector('[data-ski="status"]'), erg = box.querySelector('[data-ski="erg"]');
    let versuche = 0;
    knopf.addEventListener('click', async () => {
      if (knopf.classList.contains('an')) { stopp(); return; }
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      knopf.classList.add('an'); knopf.querySelector('em').textContent = 'Fertig? Tippen zum Stoppen';
      try {
        const r = await hoeren(opt.lang, { onPegel: (p) => knopf.style.setProperty('--pegel', p.toFixed(2)), onStatus: (t) => { status.textContent = t; } });
        versuche++;
        const v = besteVon(r.alternativen, opt.ziel, opt.lang);
        const urteil = v.ok ? (v.quote >= 0.95 ? '🌟 Perfekt!' : '✅ Gut verstanden!') : v.quote >= 0.5 ? '🟡 Fast – achte auf die markierten Wörter.' : '❌ Das klang anders.';
        erg.innerHTML = wortHtml(v) + '<div class="ski-gehoert">Gehört: „' + esc(v.text || '…') + '“ <small>' + Math.round(v.quote * 100) + ' % · ' + (r.quelle === 'whisper' ? 'Whisper' : 'Browser') + '</small></div>'
          + '<div class="ski-urteil ' + (v.ok ? 'gut' : 'schlecht') + '">' + urteil + '</div>'
          + '<div class="ski-knoepfe">' + (r.url ? '<button type="button" class="ski-k" data-url="' + r.url + '">▶️ Ich</button>' : '') + (opt.sprich ? '<button type="button" class="ski-k" data-orig="1">🔊 Original</button>' : '') + '</div>';
        erg.querySelectorAll('[data-url]').forEach((b) => b.addEventListener('click', () => new Audio(b.dataset.url).play().catch(() => {})));
        erg.querySelectorAll('[data-orig]').forEach((b) => b.addEventListener('click', () => opt.sprich(opt.ziel)));
        status.textContent = r.quelle === 'whisper' ? '🧠 Whisper auf dem Gerät' : '🌐 Browser-Erkennung';
        if (opt.onErgebnis) opt.onErgebnis({ ...v, quelle: r.quelle, versuche, url: r.url });
      } catch (e) {
        status.textContent = FEHLER[e.code] || 'Das hat nicht geklappt (' + (e.code || e.message) + ').';
        if (e.code === 'keine' || (webKaputt(opt.lang) && !whisperInstalliert())) keineErkennung(box, opt);
      } finally {
        if (knopf.isConnected) { knopf.classList.remove('an'); knopf.style.setProperty('--pegel', 0); knopf.querySelector('em').textContent = versuche ? 'Noch einmal' : 'Tippen und sprechen'; }
      }
    });
  }
  // Ohne Erkennung: ehrlich sagen + Einrichten anbieten + selbst vergleichen
  function keineErkennung(box, opt) {
    box.innerHTML = '<div class="ski ski-ohne"><p class="ski-hinweis">🔒 Auf diesem Gerät gibt es für ' + (opt.lang === 'sl' ? 'Slowenisch' : 'Englisch') + ' noch keine Spracherkennung – ohne sie kann die App nicht prüfen, <b>was</b> du sagst.</p>'
      + '<button type="button" class="btn ski-einrichten" data-ski="einrichten">🧠 Echte Spracherkennung einrichten</button>'
      + (opt.selbst !== false ? '<div class="ski-selbst"><button type="button" class="ski-mikro klein" data-ski="auf"><span class="ski-ring"><i></i></span><b>🎙️</b><em>Aufnehmen & selbst vergleichen</em></button><div data-ski="vgl"></div></div>' : '') + '</div>';
    box.querySelector('[data-ski="einrichten"]').addEventListener('click', () => einrichten(() => widget(box, opt)));
    const auf = box.querySelector('[data-ski="auf"]');
    if (!auf) return;
    auf.addEventListener('click', async () => {
      if (auf.classList.contains('an')) { stopp(); return; }
      auf.classList.add('an');
      try {
        const a = await aufnehmen({ onPegel: (p) => auf.style.setProperty('--pegel', p.toFixed(2)) });
        const vgl = box.querySelector('[data-ski="vgl"]');
        if (!a.sprach) { vgl.innerHTML = '<p class="ski-hinweis">Ich habe nichts gehört – noch einmal?</p>'; return; }
        vgl.innerHTML = '<div class="ski-knoepfe"><button type="button" class="ski-k" data-x="ich">▶️ Ich</button>' + (opt.sprich ? '<button type="button" class="ski-k" data-x="orig">🔊 Original</button>' : '') + '</div>'
          + '<p class="ski-hinweis">Hör beides an. Klang es gleich?</p><div class="ski-knoepfe"><button type="button" class="btn" data-x="ja">👍 Ja, passt</button><button type="button" class="btn secondary" data-x="nein">🔁 Noch nicht</button></div>';
        vgl.querySelector('[data-x="ich"]').addEventListener('click', () => new Audio(a.url).play().catch(() => {}));
        if (opt.sprich) vgl.querySelector('[data-x="orig"]').addEventListener('click', () => opt.sprich(opt.ziel));
        vgl.querySelector('[data-x="ja"]').addEventListener('click', () => opt.onErgebnis && opt.onErgebnis({ ok: true, quote: null, selbst: true, woerter: [], url: a.url }));
        vgl.querySelector('[data-x="nein"]').addEventListener('click', () => opt.onErgebnis && opt.onErgebnis({ ok: false, quote: null, selbst: true, woerter: [], url: a.url }));
      } catch (e) { box.querySelector('[data-ski="vgl"]').innerHTML = '<p class="ski-hinweis">' + esc(FEHLER[e.code] || 'Aufnahme nicht möglich.') + '</p>'; }
      finally { if (auf.isConnected) { auf.classList.remove('an'); auf.style.setProperty('--pegel', 0); } }
    });
  }
  // Einrichtungs-Dialog: Modell wählen, laden, Fortschritt
  function einrichten(danach) {
    let d = $('skiDlg');
    if (!d) { d = document.createElement('dialog'); d.id = 'skiDlg'; d.className = 'ski-dlg'; document.body.appendChild(d); }
    const s = store();
    const zeichnen = () => {
      d.innerHTML = '<div class="ski-dlg-in"><button type="button" class="ski-zu" aria-label="Schließen">×</button><h3>🧠 Echte Spracherkennung</h3>'
        + '<p>Die App lädt <b>Whisper</b>, ein offenes Spracherkennungs-Modell (MIT-Lizenz, von OpenAI), und lässt es <b>direkt auf deinem Gerät</b> laufen. Es versteht Slowenisch und Englisch.</p>'
        + '<ul class="ski-fakten"><li>🔒 Deine Stimme verlässt das Gerät nicht.</li><li>📦 Einmaliger Download von Hugging Face (Modell) und jsDelivr (Programm) – danach offline.</li><li>💸 Kostenlos, kein Konto.</li><li>🔋 Erkennen dauert je nach Gerät 1–4 Sekunden.</li></ul>'
        + '<div class="ski-modelle">' + Object.entries(MODELLE).map(([k, m]) => '<button type="button" class="ski-modell' + ((s.modell || 'base') === k ? ' an' : '') + '" data-m="' + k + '"><b>' + m.n + '</b><small>' + m.t + '</small></button>').join('') + '</div>'
        + '<div class="ski-laden" hidden><div class="ski-balken"><i></i></div><small data-ski="ladetext"></small></div>'
        + '<div class="ski-knoepfe"><button type="button" class="btn" data-ski="los">' + (whisperInstalliert() ? 'Neu laden' : '⬇️ Laden & einrichten') + '</button>' + (whisperInstalliert() ? '<button type="button" class="btn secondary" data-ski="weg">Entfernen</button>' : '') + '</div>'
        + '<p class="ski-fein">Nur WLAN empfohlen. Alternativ nutzt die App die Erkennung deines Browsers, falls er die Sprache kann (dann geht der Ton an Apple/Google).</p></div>';
      d.querySelector('.ski-zu').addEventListener('click', () => d.close ? d.close() : d.removeAttribute('open'));
      d.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { s.modell = b.dataset.m; d.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('an', x === b)); }));
      const weg2 = d.querySelector('[data-ski="weg"]');
      if (weg2) weg2.addEventListener('click', () => { whisperEntfernen(); zeichnen(); });
      d.querySelector('[data-ski="los"]').addEventListener('click', async () => {
        const box = d.querySelector('.ski-laden'), balken = box.querySelector('i'), txt = d.querySelector('[data-ski="ladetext"]');
        box.hidden = false; d.querySelector('[data-ski="los"]').disabled = true;
        try {
          await whisperLaden(s.modell || 'base', (p) => { balken.style.width = Math.round((p.geladen / p.gesamt) * 100) + '%'; txt.textContent = p.text + ' · ' + Math.round(p.geladen / 1e6) + ' / ' + Math.round(p.gesamt / 1e6) + ' MB'; });
          balken.style.width = '100%'; txt.textContent = '✅ Bereit – offline nutzbar.';
          setTimeout(() => { if (d.close) d.close(); else d.removeAttribute('open'); if (danach) danach(); }, 700);
        } catch (e) {
          txt.textContent = '❌ Laden fehlgeschlagen (' + (e.message || e) + '). Bitte online und mit genug Speicher erneut versuchen.';
          d.querySelector('[data-ski="los"]').disabled = false;
        }
      });
    };
    zeichnen();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  // Statuszeile für Einstellungen
  function statusText(lang) {
    const w = weg(lang);
    return w === 'whisper' ? '🧠 Whisper auf dem Gerät (' + MODELLE[store().modell].n + ')' : w === 'web' ? '🌐 Browser-Erkennung' + (whisperInstalliert() ? '' : ' (Whisper nicht installiert)') : '🔒 Keine Spracherkennung eingerichtet';
  }
  return { vergleiche, besteVon, norm, widget, einrichten, weg, statusText, hoeren, aufnehmen, stopp, whisperInstalliert, whisperBereit, whisperLaden, MODELLE, _import: null, _transkribiere: null };
})();
