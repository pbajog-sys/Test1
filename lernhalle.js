// 🎮 Lernhalle – Spielhalle für Sprach-Apps (Slowenisch, Englisch). Ein Sprachpaket liefert Decks, Stimme,
// Rollenspiele und Grammatik; die Lernhalle macht daraus: Karteikarten (Spaced Repetition), 8 Spiele, Rollenspiele,
// Level/XP, Tagesziel, Serie und „Meine Fehler“. Alles offline; Spracherkennung über SprechKI.
const LH = (() => {
  const PAKETE = {};
  const INTERVALL = [0, 1, 3, 7, 14, 30, 60, 120, 240];
  const TAGESZIEL = 60;
  let P = null, el = null, lauf = 0, decks = null, spiel = null, ac = null;
  const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const misch = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const zuf = (a) => a[Math.floor(Math.random() * a.length)];
  const tagNr = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
  const tagKey = (d = new Date()) => { const x = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return x.toISOString().slice(0, 10); };
  const zahl = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const wenig = () => typeof wenigBewegung === 'function' && wenigBewegung();

  // ---------- Speicher ----------
  function store() {
    const s = loadJson(P.key), ok = s && typeof s === 'object';
    const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
    return { xp: ok && Number.isFinite(s.xp) ? s.xp : 0, best: obj(ok && s.best), tage: obj(ok && s.tage), srs: obj(ok && s.srs), falsch: obj(ok && s.falsch),
      deck: ok && typeof s.deck === 'string' ? s.deck : null, ton: ok && s.ton === false ? false : true, richtung: ok && s.richtung === 'de' ? 'de' : 'z', spiele: ok && Number.isFinite(s.spiele) ? s.spiele : 0, rollen: obj(ok && s.rollen), sprechen: ok && s.sprechen === true, plan: ok && s.plan && typeof s.plan === 'object' && s.plan.ziel ? { tage: {}, ...s.plan, tage: obj(s.plan.tage) } : null };
  }
  const speichern = (s) => saveJson(P.key, s);
  function xpDazu(n, s = store()) {
    n = Math.max(0, Math.round(n)); s.xp += n; const k = tagKey(); s.tage[k] = (s.tage[k] || 0) + n; speichern(s); return s;
  }
  const level = (xp) => { let l = 1, need = 100; while (xp >= need) { xp -= need; l++; need = 100 + (l - 1) * 50; } return { l, rest: xp, need }; };
  function serie(s) { let n = 0; const d = new Date(); if (!(s.tage[tagKey(d)] > 0)) d.setDate(d.getDate() - 1); while (s.tage[tagKey(d)] > 0) { n++; d.setDate(d.getDate() - 1); } return n; }

  // ---------- Töne ----------
  function ton(gut) {
    if (!store().ton) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, noten = gut === 'super' ? [660, 880, 1320] : gut ? [660, 990] : [196, 165];
      noten.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = gut ? 'sine' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.07); g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.07 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.18); o.connect(g); g.connect(ac.destination); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.2); });
    } catch (e) { /* ohne Ton */ }
    if (navigator.vibrate) navigator.vibrate(gut ? 10 : [30, 30, 30]);
  }

  // ---------- Decks ----------
  async function ladeDecks() {
    if (decks) return decks;
    decks = (await P.decks()).map((d) => ({ ...d, items: d.items.filter((x) => x && x.z && x.de).map((x) => ({ ...x, k: x.k || x.z })) }));
    return decks;
  }
  function aktivesDeck(s = store()) {
    const fehler = fehlerDeck(s);
    if (s.deck === 'fehler' && fehler) return fehler;
    if (s.deck === 'mix') return mixDeck();
    return decks.find((d) => d.id === s.deck) || decks[0];
  }
  function mixDeck() { return { id: 'mix', n: 'Mix', e: '🔀', items: decks.flatMap((d) => d.items) }; }
  function fehlerDeck(s) {
    const alle = new Map(decks.flatMap((d) => d.items).map((x) => [x.k, x]));
    const items = Object.entries(s.falsch).filter(([k, n]) => n > 0 && alle.has(k)).sort((a, b) => b[1] - a[1]).map(([k]) => alle.get(k));
    return items.length >= 4 ? { id: 'fehler', n: 'Meine Fehler', e: '🎯', items } : null;
  }
  const meister = (s, d) => d.items.filter((x) => s.srs[x.k] && s.srs[x.k][0] >= 3).length;
  function fehlerMerken(item, richtig) {
    const s = store(); s.falsch[item.k] = Math.max(0, (s.falsch[item.k] || 0) + (richtig ? -1 : 1)); if (!s.falsch[item.k]) delete s.falsch[item.k]; speichern(s);
  }
  // Ablenker: gleiche Wortart-Länge bevorzugt, nie gleicher Text
  function ablenker(item, feld, n, pool) {
    const schon = new Set([norm(item[feld])]), kand = misch(pool).filter((x) => { const k = norm(x[feld]); if (schon.has(k)) return false; schon.add(k); return true; });
    const L = item[feld].length;
    return kand.sort((a, b) => Math.abs(a[feld].length - L) - Math.abs(b[feld].length - L) + (Math.random() - 0.5) * 6).slice(0, n);
  }
  const norm = (t) => String(t).toLowerCase().replace(/[.,!?;:„“"«»()¿¡…–—]/g, ' ').replace(/\s+/g, ' ').trim();
  const ohneAkzent = (t) => norm(t).normalize('NFD').replace(/[̀-ͯ]/g, '');
  function lev(a, b) { const v = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let prev = v[0]; v[0] = i; for (let j = 1; j <= b.length; j++) { const t = v[j]; v[j] = Math.min(v[j] + 1, v[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return v[b.length]; }
  // Tipp-Antwort prüfen: 1 exakt · 0.8 nur Akzente · 0.6 ein Tippfehler · 0 falsch
  function tippWert(eingabe, ziel) {
    const varianten = String(ziel).split(/\s*[/;]\s*/).concat([ziel]).map((x) => x.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
    let best = 0;
    varianten.forEach((v) => {
      const a = norm(eingabe), b = norm(v);
      if (!a) return;
      if (a === b) best = Math.max(best, 1);
      else if (ohneAkzent(a) === ohneAkzent(b)) best = Math.max(best, 0.8);
      else if (b.length >= 5 && lev(ohneAkzent(a), ohneAkzent(b)) <= 1) best = Math.max(best, 0.6);
    });
    return best;
  }

  // ---------- Rahmen ----------
  function rahmen(inhalt, kopf = '') { el.classList.toggle('lh-im-spiel', !!kopf); el.innerHTML = '<div class="lh" style="--lh1:' + P.farbe1 + ';--lh2:' + P.farbe2 + '">' + kopf + inhalt + '</div>'; return el.firstChild; }
  function spielKopf(titel) {
    return '<div class="lh-spielkopf"><button type="button" class="lh-x" data-lh="raus" aria-label="Spiel beenden">×</button><b>' + titel + '</b><div class="lh-hud" data-lh="hud"></div></div>';
  }
  function bindRaus(root) { const b = root.querySelector('[data-lh="raus"]'); if (b) b.addEventListener('click', () => { lauf++; if (typeof SprechKI !== 'undefined') SprechKI.stopp(); home(); }); }
  function ring(anteil, txt, klasse = '') {
    const r = 22, u = 2 * Math.PI * r;
    return '<span class="lh-ring ' + klasse + '"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="' + r + '" class="bg"/><circle cx="26" cy="26" r="' + r + '" class="fg" style="stroke-dasharray:' + u.toFixed(1) + ';stroke-dashoffset:' + (u * (1 - Math.max(0, Math.min(1, anteil)))).toFixed(1) + '"/></svg><b>' + txt + '</b></span>';
  }
  const laut = (text) => (P.hatTon(text) ? '<button type="button" class="lh-laut" data-sprich="' + esc(text) + '" aria-label="Anhören">🔊</button>' : '');
  function bindLaut(root) { root.querySelectorAll('[data-sprich]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); P.sprich(b.dataset.sprich, b.classList.contains('langsam')); })); }

  // ---------- Startseite ----------
  async function home() {
    const meinLauf = ++lauf; spiel = null;
    rahmen('<div class="lh-laden"><i></i><p>Lade Lernhalle …</p></div>');
    try { await ladeDecks(); } catch (e) { rahmen('<div class="lh-karte"><p>Die Inhalte konnten nicht geladen werden. Einmal online öffnen, dann geht es auch offline.</p></div>'); return; }
    if (meinLauf !== lauf) return;
    const s = store(), d = aktivesDeck(s), L = level(s.xp), heuteXp = s.tage[tagKey()] || 0, fd = fehlerDeck(s);
    const faellig = d.items.filter((x) => s.srs[x.k] && s.srs[x.k][1] <= tagNr()).length, neu = d.items.filter((x) => !s.srs[x.k]).length;
    const deckListe = decks.concat([mixDeck()], fd ? [fd] : []);
    const root = rahmen(
      '<div class="lh-hero"><div class="lh-hero-l"><span class="lh-flagge">' + P.flagge + '</span><div><h2>' + esc(P.titel) + '</h2><small>Level <b>' + L.l + '</b> · ' + zahl(s.xp) + ' XP</small><div class="lh-xpbar"><i style="width:' + Math.round((L.rest / L.need) * 100) + '%"></i></div></div></div>'
      + '<div class="lh-hero-r">' + ring(heuteXp / TAGESZIEL, heuteXp >= TAGESZIEL ? '✓' : Math.round(heuteXp), heuteXp >= TAGESZIEL ? 'voll' : '') + '<span class="lh-serie">🔥 ' + serie(s) + '</span></div></div>'
      + planKarte(s)
      + '<div class="lh-decks" role="tablist">' + deckListe.map((x) => { const m = x.items.length ? meister(s, x) / x.items.length : 0; return '<button type="button" class="lh-deck' + (x.id === d.id ? ' an' : '') + '" data-deck="' + x.id + '"><span>' + x.e + '</span><b>' + esc(x.n) + '</b><small>' + x.items.length + '</small><i style="--m:' + Math.round(m * 100) + '%"></i></button>'; }).join('') + '</div>'
      + '<button type="button" class="lh-cta" data-lh="karten"><span class="lh-cta-ic">🃏</span><span><b>Karteikarten</b><small>' + (faellig ? faellig + ' fällig · ' : '') + Math.min(neu, 10) + ' neu · ' + esc(d.n) + '</small></span><span class="lh-cta-pfeil">›</span></button>'
      + '<h3 class="lh-h3">🎮 Spiele</h3><div class="lh-spiele">' + SPIELE.map((g) => {
        const geht = g.geht ? g.geht(d) : true;
        return '<button type="button" class="lh-spiel" data-spiel="' + g.id + '" style="--g1:' + g.f[0] + ';--g2:' + g.f[1] + '"' + (geht === true ? '' : ' disabled title="' + esc(geht) + '"') + '><span class="lh-sp-ic">' + g.e + '</span><b>' + g.n + '</b><small>' + (geht === true ? g.sub : geht) + '</small>' + (s.best[g.id] ? '<em>🏆 ' + zahl(s.best[g.id]) + '</em>' : '') + '</button>';
      }).join('') + '</div>'
      + (P.rollen && P.rollen.length ? '<h3 class="lh-h3">🎭 Rollenspiele</h3><div class="lh-rollen">' + P.rollen.map((r) => { const b = s.rollen[r.id] || 0; return '<button type="button" class="lh-rolle" data-rolle="' + r.id + '"><span>' + r.ic + '</span><b>' + esc(r.titel) + '</b><small>' + esc(r.stufe + ' · ' + r.ort) + '</small><em>' + '★'.repeat(b) + '<i>' + '★'.repeat(3 - b) + '</i></em></button>'; }).join('') + '</div>' : '')
      + (P.spick && P.spick.length ? '<h3 class="lh-h3">📘 Spickzettel</h3><div class="lh-spick">' + P.spick.map((x) => '<details><summary>' + esc(x[0]) + '</summary><div>' + x[1] + '</div></details>').join('') + '</div>' : '')
      + '<div class="lh-fuss"><button type="button" class="lh-klein" data-lh="sprache">🎙️ ' + esc(typeof SprechKI !== 'undefined' ? SprechKI.statusText(P.lang) : 'Spracherkennung') + '</button><button type="button" class="lh-klein" data-lh="ton">' + (s.ton ? '🔊 Töne an' : '🔈 Töne aus') + '</button><button type="button" class="lh-klein" data-lh="richtung">' + (s.richtung === 'de' ? '🇩🇪 → ' + P.flagge : P.flagge + ' → 🇩🇪') + ' Karten</button></div>');
    root.querySelectorAll('[data-deck]').forEach((b) => b.addEventListener('click', () => { const s2 = store(); s2.deck = b.dataset.deck; speichern(s2); home(); }));
    root.querySelector('[data-lh="karten"]').addEventListener('click', () => karten());
    planBinden(root);
    root.querySelectorAll('[data-spiel]').forEach((b) => b.addEventListener('click', () => starteSpiel(b.dataset.spiel)));
    root.querySelectorAll('[data-rolle]').forEach((b) => b.addEventListener('click', () => rolle(P.rollen.find((r) => r.id === b.dataset.rolle))));
    root.querySelector('[data-lh="ton"]').addEventListener('click', () => { const s2 = store(); s2.ton = !s2.ton; speichern(s2); home(); });
    root.querySelector('[data-lh="richtung"]').addEventListener('click', () => { const s2 = store(); s2.richtung = s2.richtung === 'de' ? 'z' : 'de'; speichern(s2); home(); });
    root.querySelector('[data-lh="sprache"]').addEventListener('click', () => { if (typeof SprechKI !== 'undefined') SprechKI.einrichten(() => home()); });
    if (P.nachHome) P.nachHome();
  }

  // ---------- Karteikarten ----------
  function karten() {
    const s = store(), d = aktivesDeck(s), heute = tagNr();
    const faellig = misch(d.items.filter((x) => s.srs[x.k] && s.srs[x.k][1] <= heute)).slice(0, 40);
    const neu = d.items.filter((x) => !s.srs[x.k]).slice(0, 10);
    let q = faellig.concat(neu), i = 0, offen = false, gemacht = 0;
    if (!q.length) { rahmen('<div class="lh-karte lh-mitte"><div class="lh-gross-ic">🎉</div><h3>Alles erledigt!</h3><p>In „' + esc(d.n) + '“ ist heute nichts mehr fällig.</p><button type="button" class="btn" data-lh="raus">Zur Lernhalle</button></div>'); bindRaus(el); return; }
    const zeichnen = () => {
      if (i >= q.length) {
        if (gemacht) planErledigt('karten');
        const s2 = xpDazu(gemacht * 2);
        rahmen('<div class="lh-karte lh-mitte"><div class="lh-gross-ic">🃏</div><h3>' + gemacht + ' Karten geschafft</h3><p>+' + gemacht * 2 + ' XP · Level ' + level(s2.xp).l + '</p><button type="button" class="btn" data-lh="raus">Zur Lernhalle</button></div>');
        bindRaus(el); if (typeof konfetti === 'function' && gemacht >= 10) konfetti(20, ['🃏', '⭐', '✨']); return;
      }
      const x = q[i], vorne = store().richtung === 'de' ? x.de : x.z, hinten = store().richtung === 'de' ? x.z : x.de;
      const root = rahmen('<div class="lh-kartenstapel"><div class="lh-karten-zaehler">' + (i + 1) + ' / ' + q.length + '</div><div class="lh-fk' + (offen ? ' offen' : '') + '" data-lh="karte" tabindex="0">'
        + '<div class="lh-fk-vorne"><small>' + (x.e || d.e) + '</small><b>' + esc(vorne) + '</b>' + (store().richtung !== 'de' ? laut(x.z) : '') + '<em>Tippen zum Umdrehen</em></div>'
        + '<div class="lh-fk-hinten"><b>' + esc(hinten) + '</b>' + (store().richtung === 'de' ? laut(x.z) : '') + (x.bsp ? '<p class="lh-bsp">' + esc(x.bsp) + ' ' + laut(x.bsp) + (x.bspDe ? '<i>' + esc(x.bspDe) + '</i>' : '') + '</p>' : '') + (x.info ? '<p class="lh-info">' + esc(x.info) + '</p>' : '') + '</div></div>'
        + '<div class="lh-noten"' + (offen ? '' : ' hidden') + '>' + [['0', 'Nochmal', '↺'], ['1', 'Schwer', '😬'], ['2', 'Gut', '🙂'], ['3', 'Leicht', '😎']].map(([n, t, e]) => '<button type="button" class="lh-note n' + n + '" data-note="' + n + '"><span>' + e + '</span>' + t + '</button>').join('') + '</div></div>', spielKopf('🃏 ' + esc(d.n)));
      bindRaus(root); bindLaut(root);
      const k = root.querySelector('[data-lh="karte"]');
      k.addEventListener('click', () => { if (!offen) { offen = true; k.classList.add('offen'); root.querySelector('.lh-noten').hidden = false; if (store().richtung === 'de') P.sprich(x.z); } });
      root.querySelectorAll('[data-note]').forEach((b) => b.addEventListener('click', () => {
        const n = +b.dataset.note, s2 = store(), z = s2.srs[x.k] || [0, 0];
        const stufe = n === 0 ? 0 : n === 1 ? Math.max(1, z[0]) : Math.min(INTERVALL.length - 1, z[0] + (n === 3 ? 2 : 1));
        s2.srs[x.k] = [stufe, tagNr() + (n === 0 ? 0 : INTERVALL[stufe])]; speichern(s2);
        fehlerMerken(x, n >= 2);
        if (n === 0) q.push(x); else gemacht++;
        ton(n >= 2); i++; offen = false; zeichnen();
      }));
      let x0 = null;
      k.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      k.addEventListener('touchend', (e) => { if (x0 == null || !offen) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 80) root.querySelector('[data-note="' + (dx > 0 ? 2 : 0) + '"]').click(); });
      if (!offen && store().richtung !== 'de') setTimeout(() => P.sprich(x.z), 150);
    };
    zeichnen();
  }

  // ---------- Spiele: gemeinsamer Ablauf ----------
  function starteSpiel(id) {
    const g = SPIELE.find((x) => x.id === id), d = aktivesDeck();
    spiel = { g, d, punkte: 0, combo: 0, maxCombo: 0, richtig: 0, falsch: 0, fehler: [], lauf: ++lauf, start: performance.now() };
    const root = rahmen('<div class="lh-buehne" data-lh="buehne"></div>', spielKopf(g.e + ' ' + g.n));
    bindRaus(root);
    g.start(spiel, root.querySelector('[data-lh="buehne"]'), root.querySelector('[data-lh="hud"]'));
  }
  const aktiv = (sp) => spiel === sp && sp.lauf === lauf;
  function treffer(sp, item, ok, punkte) {
    if (ok) { sp.richtig++; sp.combo++; sp.maxCombo = Math.max(sp.maxCombo, sp.combo); sp.punkte += punkte; ton(sp.combo > 0 && sp.combo % 5 === 0 ? 'super' : true); }
    else { sp.falsch++; sp.combo = 0; if (item && !sp.fehler.includes(item)) sp.fehler.push(item); ton(false); }
    if (item) fehlerMerken(item, ok);
    if (sp.hudBox && sp.zeit == null) hud(sp.hudBox, sp, sp.hudExtra);
  }
  function hud(box, sp, extra = '') { sp.hudBox = box; sp.hudExtra = extra; box.innerHTML = extra + '<span class="lh-punkte">' + zahl(sp.punkte) + '</span>' + (sp.combo >= 2 ? '<span class="lh-combo">🔥×' + sp.combo + '</span>' : ''); }
  function schwebe(box, txt, gut) { if (wenig()) return; const s = document.createElement('span'); s.className = 'lh-schwebe ' + (gut ? 'gut' : 'schlecht'); s.textContent = txt; box.appendChild(s); setTimeout(() => s.remove(), 900); }
  function ende(sp, sterneGrenzen) {
    if (!aktiv(sp)) return;
    lauf++;
    const s = store(), alt = s.best[sp.g.id] || 0, rekord = sp.punkte > alt;
    if (rekord) s.best[sp.g.id] = sp.punkte;
    s.spiele++; speichern(s); planErledigt(sp.g.id);
    const xp = Math.min(60, Math.round(sp.punkte / 10) + sp.richtig);
    const s2 = xpDazu(xp);
    const sterne = sp.punkte >= sterneGrenzen[2] ? 3 : sp.punkte >= sterneGrenzen[1] ? 2 : sp.punkte >= sterneGrenzen[0] ? 1 : 0;
    if (typeof merkeVerlauf === 'function') merkeVerlauf(P.verlauf || 'slo', Math.min(100, Math.round((sp.punkte / sterneGrenzen[2]) * 100)), 100, sp.g.n);
    const root = rahmen('<div class="lh-ende"><div class="lh-ende-ic">' + sp.g.e + '</div><h3>' + sp.g.n + '</h3><div class="lh-sterne">' + [0, 1, 2].map((i) => '<span class="' + (i < sterne ? 'an' : '') + '" style="--i:' + i + '">★</span>').join('') + '</div>'
      + '<div class="lh-ende-punkte" data-lh="zahl">0</div>' + (rekord ? '<div class="lh-rekord">🏆 Neuer Rekord!</div>' : alt ? '<div class="lh-alt">Rekord: ' + zahl(alt) + '</div>' : '')
      + '<div class="lh-stats"><span><b>' + sp.richtig + '</b>richtig</span><span><b>' + sp.falsch + '</b>falsch</span><span><b>' + sp.maxCombo + '</b>beste Serie</span><span><b>+' + xp + '</b>XP</span></div>'
      + (sp.fehler.length ? '<div class="lh-fehler"><b>Üben:</b>' + sp.fehler.slice(0, 12).map((x) => '<div><span>' + esc(x.z) + ' ' + laut(x.z) + '</span><i>' + esc(x.de) + '</i></div>').join('') + '<button type="button" class="lh-klein" data-lh="indiekarten">➕ In die Karteikarten (heute fällig)</button></div>' : '')
      + '<div class="lh-knoepfe"><button type="button" class="btn" data-lh="nochmal">🔁 Nochmal</button><button type="button" class="btn secondary" data-lh="raus">Lernhalle</button></div><p class="lh-fein">Level ' + level(s2.xp).l + ' · heute ' + (s2.tage[tagKey()] || 0) + ' / ' + TAGESZIEL + ' XP</p></div>');
    bindRaus(root); bindLaut(root);
    root.querySelector('[data-lh="nochmal"]').addEventListener('click', () => starteSpiel(sp.g.id));
    const ik = root.querySelector('[data-lh="indiekarten"]');
    if (ik) ik.addEventListener('click', () => { const s3 = store(); sp.fehler.forEach((x) => { s3.srs[x.k] = [0, tagNr()]; }); speichern(s3); ik.textContent = '✓ ' + sp.fehler.length + ' Karten sind heute fällig'; ik.disabled = true; });
    const z = root.querySelector('[data-lh="zahl"]');
    if (typeof hochzaehlen === 'function' && !wenig()) hochzaehlen(z, sp.punkte); else z.textContent = zahl(sp.punkte);
    if (rekord && sp.punkte > 0 && typeof konfetti === 'function') konfetti(28, ['🏆', '⭐', '✨', P.flagge]);
  }
  // Countdown-Uhr fürs HUD
  function uhr(sp, sekunden, hudBox, beiEnde, grenzen) {
    sp.zeit = sekunden * 1000; let letzt = performance.now();
    const tick = (t) => {
      if (!aktiv(sp)) return;
      sp.zeit -= t - letzt; letzt = t;
      hud(hudBox, sp, ring(sp.zeit / (sekunden * 1000), Math.max(0, Math.ceil(sp.zeit / 1000)), sp.zeit < 10000 ? 'knapp' : ''));
      if (sp.zeit <= 0) { if (beiEnde) beiEnde(); ende(sp, grenzen); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const richtungZ = () => Math.random() < 0.5;

  // ---------- Die Spiele ----------
  const SPIELE = [
    { id: 'blitz', e: '⚡', n: 'Blitz-Duell', sub: '60 Sekunden · Serien geben Bonus', f: ['#f59e0b', '#ef4444'], geht: (d) => (d.items.length >= 8 ? true : 'Mind. 8 Wörter nötig'),
      start(sp, box, hudBox) {
        const pool = sp.d.items;
        const runde = () => {
          if (!aktiv(sp)) return;
          const x = zuf(pool), zuDe = richtungZ(), feld = zuDe ? 'de' : 'z', opt = misch([x].concat(ablenker(x, feld, 3, pool))), t0 = performance.now();
          box.innerHTML = '<div class="lh-frage"><small>' + (zuDe ? 'Was heißt …' : 'Wie sagt man …') + '</small><b>' + esc(zuDe ? x.z : x.de) + '</b>' + (zuDe ? laut(x.z) : '') + '</div><div class="lh-optionen">' + opt.map((o, i) => '<button type="button" class="lh-opt" data-i="' + i + '">' + esc(o[feld]) + '</button>').join('') + '</div>';
          bindLaut(box);
          box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
            const o = opt[+b.dataset.i], ok = o === x, schnell = performance.now() - t0 < 2500;
            box.querySelectorAll('[data-i]').forEach((c) => { c.disabled = true; if (opt[+c.dataset.i] === x) c.classList.add('richtig'); });
            if (!ok) { b.classList.add('falsch'); sp.zeit -= 3000; }
            treffer(sp, x, ok, 10 + Math.min(sp.combo, 10) * 2 + (schnell ? 5 : 0));
            schwebe(box, ok ? '+' + (10 + Math.min(sp.combo - 1, 10) * 2 + (schnell ? 5 : 0)) : '−3 s', ok);
            setTimeout(runde, ok ? 280 : 900);
          }));
        };
        uhr(sp, 60, hudBox, null, [150, 350, 600]); runde();
      } },
    { id: 'regen', e: '🌧️', n: 'Wort-Regen', sub: 'Fang das richtige Wort, bevor es landet', f: ['#38bdf8', '#6366f1'], geht: (d) => (d.items.length >= 6 ? true : 'Mind. 6 Wörter nötig'),
      start(sp, box, hudBox) {
        const pool = sp.d.items; let leben = 3, tempo = 38, welle = 0;
        box.innerHTML = '<div class="lh-regen" data-lh="feld"></div><div class="lh-regen-boden"><small>Fang:</small><b data-lh="prompt"></b></div>';
        const feld = box.querySelector('[data-lh="feld"]'), prompt = box.querySelector('[data-lh="prompt"]');
        const zeig = () => hud(hudBox, sp, '<span class="lh-leben">' + '❤️'.repeat(leben) + '<i>' + '🤍'.repeat(3 - leben) + '</i></span>');
        const neueWelle = () => {
          if (!aktiv(sp)) return;
          welle++; tempo = Math.min(120, 38 + welle * 4);
          const x = zuf(pool), opt = misch([x].concat(ablenker(x, 'z', 2, pool))), H = feld.clientHeight || 360;
          prompt.textContent = x.de; feld.innerHTML = '';
          const tropfen = opt.map((o, i) => { const t = document.createElement('button'); t.type = 'button'; t.className = 'lh-tropfen'; t.textContent = o.z; t.style.left = (4 + i * 32) + '%'; feld.appendChild(t); return { o, t, y: -40 - Math.random() * 70, weg: false }; });
          let letzt = performance.now(), aus = false;
          const fertig = (ok, wo) => {
            if (aus) return; aus = true;
            tropfen.forEach((q) => { q.t.disabled = true; if (q.o === x) q.t.classList.add('richtig'); });
            if (!ok) { leben--; if (wo) wo.classList.add('falsch'); }
            treffer(sp, x, ok, 10 + welle * 2); zeig();
            if (leben <= 0) { setTimeout(() => ende(sp, [80, 200, 360]), 700); return; }
            setTimeout(neueWelle, ok ? 350 : 1100);
          };
          tropfen.forEach((q) => q.t.addEventListener('click', () => { if (q.o === x) { q.t.classList.add('platzt'); fertig(true); } else fertig(false, q.t); }));
          const fall = (t) => {
            if (!aktiv(sp) || aus) return;
            const dt = Math.min(0.05, (t - letzt) / 1000); letzt = t;
            tropfen.forEach((q) => { q.y += tempo * dt; q.t.style.transform = 'translateY(' + q.y.toFixed(1) + 'px)'; });
            const richtig = tropfen.find((q) => q.o === x);
            if (richtig.y > H - 44) { fertig(false, richtig.t); return; }
            requestAnimationFrame(fall);
          };
          requestAnimationFrame(fall);
        };
        zeig(); neueWelle();
      } },
    { id: 'memory', e: '🧠', n: 'Memory', sub: '6 Paare finden – so wenig Züge wie möglich', f: ['#a855f7', '#ec4899'], geht: (d) => (d.items.length >= 6 ? true : 'Mind. 6 Wörter nötig'),
      start(sp, box, hudBox) {
        const paare = misch(sp.d.items).filter((x, i, a) => a.findIndex((y) => norm(y.de) === norm(x.de) || norm(y.z) === norm(x.z)) === i).slice(0, 6);
        const karten = misch(paare.flatMap((x) => [{ x, t: x.z, s: 'z' }, { x, t: x.de, s: 'de' }]));
        let offen = [], zuege = 0, gefunden = 0, sperre = false; const t0 = performance.now();
        box.innerHTML = '<div class="lh-memory">' + karten.map((k, i) => '<button type="button" class="lh-mk ' + k.s + '" data-i="' + i + '"><span class="r">' + P.flagge + '</span><span class="v">' + esc(k.t) + '</span></button>').join('') + '</div>';
        const zeig = () => hud(hudBox, sp, '<span class="lh-zuege">' + zuege + ' Züge</span>');
        box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
          const k = karten[+b.dataset.i];
          if (sperre || b.classList.contains('auf') || b.classList.contains('weg')) return;
          b.classList.add('auf'); if (k.s === 'z') P.sprich(k.t); offen.push([k, b]);
          if (offen.length < 2) return;
          zuege++; const [[a, ba], [c, bc]] = offen; offen = [];
          if (a.x === c.x && a.s !== c.s) {
            gefunden++; sp.punkte += 50; treffer(sp, a.x, true, 0); setTimeout(() => { ba.classList.add('weg'); bc.classList.add('weg'); }, 350);
            if (gefunden === paare.length) { const sek = (performance.now() - t0) / 1000; sp.punkte = Math.max(50, Math.round(600 - Math.max(0, zuege - 6) * 20 - sek * 2)); setTimeout(() => ende(sp, [200, 380, 480]), 700); }
          } else { sperre = true; sp.combo = 0; ton(false); setTimeout(() => { ba.classList.remove('auf'); bc.classList.remove('auf'); sperre = false; }, 900); }
          zeig();
        }));
        zeig();
      } },
    { id: 'satz', e: '🧩', n: 'Satz-Sprint', sub: '90 Sekunden Sätze bauen', f: ['#10b981', '#0ea5e9'], geht: (d) => (d.items.filter((x) => x.bsp && x.bspDe).length >= 4 ? true : 'Dieses Deck hat zu wenig Beispielsätze'),
      start(sp, box, hudBox) {
        const pool = misch(sp.d.items.filter((x) => x.bsp && x.bspDe && x.bsp.split(' ').length <= 12)); let i = 0;
        const runde = () => {
          if (!aktiv(sp)) return;
          const x = pool[i++ % pool.length], teile = x.bsp.split(' '), fremd = misch(sp.d.items.filter((y) => y !== x && y.bsp).flatMap((y) => y.bsp.split(' '))).filter((w) => !teile.includes(w)).slice(0, 2);
          const bank = misch(teile.concat(fremd).map((t, k) => ({ t, k }))), gewaehlt = [];
          const zeichnen = () => {
            box.innerHTML = '<div class="lh-frage"><small>Bau auf ' + esc(P.sprache) + ':</small><b class="satz">' + esc(x.bspDe) + '</b></div><div class="lh-zeile">' + (gewaehlt.length ? gewaehlt.map((k, j) => '<button type="button" class="lh-kachel drin" data-j="' + j + '">' + esc(k.t) + '</button>').join('') : '<span class="lh-leer">Wörter antippen …</span>') + '</div>'
              + '<div class="lh-bank">' + bank.map((k, j) => '<button type="button" class="lh-kachel' + (gewaehlt.includes(k) ? ' weg' : '') + '" data-b="' + j + '">' + esc(k.t) + '</button>').join('') + '</div><div class="lh-knoepfe"><button type="button" class="btn secondary" data-lh="skip">Überspringen</button><button type="button" class="btn" data-lh="ok"' + (gewaehlt.length ? '' : ' disabled') + '>Prüfen</button></div>';
            box.querySelectorAll('[data-j]').forEach((b) => b.addEventListener('click', () => { gewaehlt.splice(+b.dataset.j, 1); zeichnen(); }));
            box.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => { const k = bank[+b.dataset.b]; if (!gewaehlt.includes(k)) { gewaehlt.push(k); zeichnen(); } }));
            box.querySelector('[data-lh="skip"]').addEventListener('click', () => { treffer(sp, x, false, 0); loesung(false); });
            box.querySelector('[data-lh="ok"]').addEventListener('click', () => { const ok = norm(gewaehlt.map((k) => k.t).join(' ')) === norm(x.bsp); treffer(sp, x, ok, 20 + teile.length * 2); loesung(ok); });
          };
          const loesung = (ok) => { box.querySelector('.lh-zeile').innerHTML = '<div class="lh-loesung ' + (ok ? 'gut' : 'schlecht') + '">' + (ok ? '✓ ' : '✗ ') + esc(x.bsp) + '</div>'; box.querySelectorAll('button').forEach((b) => { b.disabled = true; }); P.sprich(x.bsp); setTimeout(runde, ok ? 900 : 1900); };
          zeichnen();
        };
        uhr(sp, 90, hudBox, null, [100, 220, 380]); runde();
      } },
    { id: 'tippen', e: '⌨️', n: 'Tipp-Turbo', sub: 'Schreib die Übersetzung – 90 Sekunden', f: ['#f43f5e', '#f97316'], geht: (d) => (d.items.length >= 4 ? true : 'Mind. 4 Wörter nötig'),
      start(sp, box, hudBox) {
        const pool = misch(sp.d.items.filter((x) => x.z.length <= 28)); let i = 0;
        const runde = () => {
          if (!aktiv(sp)) return;
          const x = pool[i++ % pool.length];
          box.innerHTML = '<div class="lh-frage"><small>Auf ' + esc(P.sprache) + ':</small><b>' + esc(x.de) + '</b></div><form class="lh-tipp" data-lh="form"><input data-lh="ein" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="…"><button class="btn" type="submit">↵</button></form>'
            + (P.zeichen ? '<div class="lh-zeichen">' + P.zeichen.map((c) => '<button type="button" data-c="' + c + '">' + c + '</button>').join('') + '</div>' : '') + '<div class="lh-knoepfe"><button type="button" class="lh-klein" data-lh="skip">Weiß nicht</button></div><div data-lh="erg"></div>';
          const ein = box.querySelector('[data-lh="ein"]'); ein.focus({ preventScroll: true });
          box.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('mousedown', (e) => e.preventDefault()));
          box.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { const p = ein.selectionStart || ein.value.length; ein.value = ein.value.slice(0, p) + b.dataset.c + ein.value.slice(p); ein.focus(); ein.setSelectionRange(p + 1, p + 1); }));
          const fertig = (w) => {
            const ok = w >= 0.6, pk = w === 1 ? 15 : w >= 0.8 ? 10 : 8;
            treffer(sp, x, ok, pk); ein.disabled = true;
            box.querySelector('[data-lh="erg"]').innerHTML = '<div class="lh-loesung ' + (ok ? 'gut' : 'schlecht') + '">' + (w === 1 ? '✓ ' : w >= 0.8 ? '✓ Akzente: ' : w >= 0.6 ? '✓ Tippfehler: ' : '✗ ') + esc(x.z) + '</div>';
            P.sprich(x.z); setTimeout(runde, ok && w === 1 ? 700 : 1700);
          };
          box.querySelector('[data-lh="form"]').addEventListener('submit', (e) => { e.preventDefault(); if (ein.disabled || !ein.value.trim()) return; fertig(tippWert(ein.value, x.z)); });
          box.querySelector('[data-lh="skip"]').addEventListener('click', () => { if (!ein.disabled) fertig(0); });
        };
        uhr(sp, 90, hudBox, null, [90, 200, 340]); runde();
      } },
    { id: 'hoeren', e: '🎧', n: 'Hör-Jagd', sub: 'Hören und richtig schreiben erkennen', f: ['#14b8a6', '#22c55e'], geht: (d) => (!P.hatTon(d.items[0] && d.items[0].z) ? 'Auf diesem Gerät gibt es keine ' + P.sprache + '-Stimme' : d.items.length >= 6 ? true : 'Mind. 6 Wörter nötig'),
      start(sp, box, hudBox) {
        const pool = misch(sp.d.items); let r = 0;
        const runde = () => {
          if (!aktiv(sp)) return;
          if (r >= 10) { ende(sp, [60, 110, 150]); return; }
          const x = pool[r++ % pool.length], aehnlich = sp.d.items.filter((y) => y !== x && norm(y.z) !== norm(x.z)).sort((a, b) => lev(norm(a.z), norm(x.z)) - lev(norm(b.z), norm(x.z))).slice(0, 6);
          const opt = misch([x].concat(misch(aehnlich).slice(0, 3)));
          hud(hudBox, sp, '<span class="lh-zuege">' + r + ' / 10</span>');
          box.innerHTML = '<div class="lh-hoer"><button type="button" class="lh-hoer-knopf" data-lh="nochmal">🔊</button><button type="button" class="lh-klein" data-lh="langsam">🐢 langsam</button></div><div class="lh-optionen">' + opt.map((o, i) => '<button type="button" class="lh-opt" data-i="' + i + '">' + esc(o.z) + '</button>').join('') + '</div>';
          box.querySelector('[data-lh="nochmal"]').addEventListener('click', () => P.sprich(x.z));
          box.querySelector('[data-lh="langsam"]').addEventListener('click', () => P.sprich(x.z, true));
          setTimeout(() => P.sprich(x.z), 200);
          box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
            const ok = opt[+b.dataset.i] === x;
            box.querySelectorAll('[data-i]').forEach((c) => { c.disabled = true; if (opt[+c.dataset.i] === x) { c.classList.add('richtig'); c.innerHTML += ' <small>' + esc(x.de) + '</small>'; } });
            if (!ok) b.classList.add('falsch');
            treffer(sp, x, ok, 10 + Math.min(sp.combo, 5)); setTimeout(runde, ok ? 800 : 1600);
          }));
        };
        runde();
      } },
    { id: 'sprechen', e: '🎙️', n: 'Sprech-Arena', sub: 'Sag es laut – Wort für Wort geprüft', f: ['#6366f1', '#d946ef'], geht: () => (navigator.mediaDevices ? true : 'Kein Mikrofon'),
      start(sp, box, hudBox) {
        const pool = misch(sp.d.items).slice(0, 8); let r = 0;
        const runde = () => {
          if (!aktiv(sp)) return;
          if (r >= pool.length) { ende(sp, [60, 110, 140]); return; }
          const x = pool[r++], text = x.bsp && x.bsp.split(' ').length <= 9 && Math.random() < 0.5 ? x.bsp : x.z, de = text === x.bsp ? x.bspDe || x.de : x.de;
          hud(hudBox, sp, '<span class="lh-zuege">' + r + ' / ' + pool.length + '</span>');
          box.innerHTML = '<div class="lh-frage"><small>Sag laut:</small><b class="satz">' + esc(text) + '</b>' + laut(text) + '<i>' + esc(de) + '</i></div><div data-lh="ski"></div><div class="lh-knoepfe"><button type="button" class="lh-klein" data-lh="skip">Überspringen ›</button></div>';
          bindLaut(box);
          let fertig = false, geloest = false;
          const weiter = () => { if (!fertig) { fertig = true; SprechKI.stopp(); setTimeout(runde, 300); } };
          box.querySelector('[data-lh="skip"]').addEventListener('click', () => { if (!geloest) treffer(sp, x, false, 0); weiter(); });
          SprechKI.widget(box.querySelector('[data-lh="ski"]'), { lang: P.lang, ziel: text, sprich: P.hatTon(text) ? (t) => P.sprich(t) : null, onErgebnis: (e) => {
            if (fertig || !aktiv(sp)) return;
            if (e.selbst) { treffer(sp, x, e.ok, e.ok ? 5 : 0); weiter(); return; }
            if (e.ok && !geloest) { geloest = true; treffer(sp, x, true, Math.round(e.quote * 20)); box.querySelector('[data-lh="skip"]').textContent = 'Weiter ›'; setTimeout(weiter, 1800); }
            else if (!e.ok && e.versuche === 3 && !geloest) { geloest = true; treffer(sp, x, false, 0); box.querySelector('[data-lh="skip"]').textContent = 'Weiter ›'; }
          } });
        };
        runde();
      } },
    { id: 'grammatik', e: '🧬', n: 'Grammatik-Duell', sub: '12 Lücken, Zeitbonus, Erklärung', f: ['#0ea5e9', '#a855f7'], geht: () => (P.grammatik && P.grammatik.length >= 12 ? true : 'Für diese Sprache in der Grammatik-Werkstatt'),
      start(sp, box, hudBox) {
        const fragen = misch(P.grammatik).slice(0, 12); let r = 0;
        const runde = () => {
          if (!aktiv(sp)) return;
          if (r >= fragen.length) { ende(sp, [120, 240, 330]); return; }
          const f = fragen[r++], opt = misch(f.o.map((o, i) => ({ o, ok: i === f.r }))), t0 = performance.now(); let aus = false;
          box.innerHTML = '<div class="lh-frage"><small>' + esc(f.th || 'Grammatik') + ' · ' + r + ' / ' + fragen.length + '</small><b class="satz">' + esc(f.s).replace('___', '<span class="lh-loch">___</span>') + '</b>' + (f.de ? '<i>' + esc(f.de) + '</i>' : '') + '</div><div class="lh-optionen">' + opt.map((o, i) => '<button type="button" class="lh-opt" data-i="' + i + '">' + esc(o.o) + '</button>').join('') + '</div><div data-lh="erk"></div>';
          const tick = () => { if (!aktiv(sp) || aus) return; const rest = 20 - (performance.now() - t0) / 1000; hud(hudBox, sp, ring(rest / 20, Math.max(0, Math.ceil(rest)), rest < 6 ? 'knapp' : '')); if (rest <= 0) waehle(-1); else requestAnimationFrame(tick); };
          const waehle = (i) => {
            if (aus) return; aus = true;
            const ok = i >= 0 && opt[i].ok, rest = Math.max(0, 20 - (performance.now() - t0) / 1000);
            box.querySelectorAll('[data-i]').forEach((c) => { c.disabled = true; if (opt[+c.dataset.i].ok) c.classList.add('richtig'); else if (+c.dataset.i === i) c.classList.add('falsch'); });
            treffer(sp, null, ok, 15 + Math.round(rest / 2));
            box.querySelector('.lh-loch').textContent = f.o[f.r];
            box.querySelector('[data-lh="erk"]').innerHTML = '<div class="lh-erk ' + (ok ? 'gut' : 'schlecht') + '"><b>' + (ok ? '✓ Richtig' : i < 0 ? '⏰ Zeit um' : '✗ Leider nicht') + '</b> ' + esc(f.e) + '</div><button type="button" class="btn" data-lh="weiter">Weiter ›</button>';
            box.querySelector('[data-lh="weiter"]').addEventListener('click', runde);
            hud(hudBox, sp);
          };
          box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => waehle(+b.dataset.i)));
          requestAnimationFrame(tick);
        };
        runde();
      } },
    { id: 'diktat', e: '✍️', n: 'Diktat', sub: 'Hören und schreiben – jedes Wort geprüft', f: ['#475569', '#0ea5e9'],
      geht: (d) => (!P.hatTon((satzPool(d)[0] || {}).text) ? 'Auf diesem Gerät gibt es keine ' + P.sprache + '-Stimme' : satzPool(d).length >= 3 ? true : 'Zu wenig Sätze in diesem Deck'),
      start(sp, box, hudBox) {
        const pool = misch(satzPool(sp.d)).slice(0, 6); let r = 0;
        const runde = () => {
          if (!aktiv(sp)) return;
          if (r >= pool.length) { ende(sp, [90, 150, 190]); return; }
          const x = pool[r++];
          hud(hudBox, sp, '<span class="lh-zuege">' + r + ' / ' + pool.length + '</span>');
          box.innerHTML = '<div class="lh-hoer"><button type="button" class="lh-hoer-knopf" data-lh="nochmal">🔊</button><button type="button" class="lh-klein" data-lh="langsam">🐢 langsam</button></div><p class="lh-fein lh-zentriert">Schreib, was du hörst. Groß/klein und Satzzeichen zählen nicht, Rechtschreibung schon.</p>'
            + '<textarea class="lh-text" data-lh="ein" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="…"></textarea>' + zeichenLeiste() + '<div class="lh-knoepfe"><button type="button" class="btn secondary" data-lh="skip">Lösung zeigen</button><button type="button" class="btn" data-lh="ok">Prüfen</button></div><div data-lh="erg"></div>';
          const ein = box.querySelector('[data-lh="ein"]');
          bindZeichen(box, ein);
          box.querySelector('[data-lh="nochmal"]').addEventListener('click', () => P.sprich(x.text));
          box.querySelector('[data-lh="langsam"]').addEventListener('click', () => P.sprich(x.text, true));
          setTimeout(() => P.sprich(x.text), 250);
          const fertig = (aufgeben) => {
            const v = aufgeben ? { quote: 0, woerter: woerterVon(x.text).map((w) => ({ w, status: 'fehlt' })) } : diktatWert(ein.value, x.text);
            treffer(sp, x.item, v.quote >= 0.9, Math.round(v.quote * 30));
            ein.disabled = true; box.querySelectorAll('[data-lh="ok"], [data-lh="skip"]').forEach((b) => { b.disabled = true; });
            box.querySelector('[data-lh="erg"]').innerHTML = '<div class="lh-erk ' + (v.quote >= 0.9 ? 'gut' : 'schlecht') + '"><b>' + (v.quote >= 0.99 ? '✓ Fehlerfrei!' : v.quote >= 0.9 ? '✓ Fast perfekt' : '✗ ' + Math.round(v.quote * 100) + ' %') + '</b><div class="ski-woerter links">' + v.woerter.map((w) => '<span class="ski-w ' + w.status + '"' + (w.h && w.status !== 'ok' ? ' title="du: ' + esc(w.h) + '"' : '') + '>' + esc(w.w) + (w.h && w.status !== 'ok' ? ' <small>(' + esc(w.h) + ')</small>' : '') + '</span>').join(' ') + '</div><p class="lh-bsp"><b>' + esc(x.text) + '</b>' + (x.de ? '<i>' + esc(x.de) + '</i>' : '') + '</p></div><button type="button" class="btn" data-lh="weiter">Weiter ›</button>';
            box.querySelector('[data-lh="weiter"]').addEventListener('click', runde);
          };
          box.querySelector('[data-lh="ok"]').addEventListener('click', () => { if (ein.value.trim()) fertig(false); });
          box.querySelector('[data-lh="skip"]').addEventListener('click', () => fertig(true));
        };
        runde();
      } },
    { id: 'uebersetzen', e: '🔁', n: 'Übersetzung', sub: 'Sätze & Texte – mit Musterlösung', f: ['#d97706', '#65a30d'], geht: (d) => (uePool(d).length >= 3 ? true : 'Zu wenig Sätze in diesem Deck'),
      start(sp, box, hudBox) {
        const pool = misch(uePool(sp.d)), auswahl = pool.filter((x) => x.text).slice(0, 1).concat(pool.filter((x) => !x.text)).slice(0, 5); let r = 0;
        const runde = () => {
          if (!aktiv(sp)) return;
          if (r >= auswahl.length) { ende(sp, [90, 140, 180]); return; }
          const x = auswahl[r++], nachZiel = x.text || Math.random() < 0.7;
          const quelle = nachZiel ? x.de : x.z, refs = nachZiel ? [x.z].concat(x.alt || []) : [x.de].concat(x.deAlt || []), lang = nachZiel ? P.lang : 'de';
          hud(hudBox, sp, '<span class="lh-zuege">' + r + ' / ' + auswahl.length + '</span>');
          box.innerHTML = '<div class="lh-frage"><small>' + (x.text ? '📄 Text · ' : '') + (nachZiel ? 'Übersetze ins ' + esc(P.sprache) + 'e' : 'Übersetze ins Deutsche') + '</small><b class="satz' + (x.text ? ' text' : '') + '">' + esc(quelle) + '</b>' + (!nachZiel ? laut(quelle) : '') + '</div>'
            + '<textarea class="lh-text" data-lh="ein" rows="' + (x.text ? 6 : 3) + '" autocomplete="off" spellcheck="false" placeholder="Deine Übersetzung …"></textarea>' + (nachZiel ? zeichenLeiste() : '') + '<div class="lh-knoepfe"><button type="button" class="btn secondary" data-lh="skip">Musterlösung</button><button type="button" class="btn" data-lh="ok">Prüfen</button></div><div data-lh="erg"></div>';
          bindLaut(box);
          const ein = box.querySelector('[data-lh="ein"]'); bindZeichen(box, ein);
          const fertig = (aufgeben) => {
            const v = aufgeben ? { quote: 0, woerter: [], text: refs[0] } : besteRef(ein.value, refs, lang);
            const gut = v.quote >= 0.85, fast = v.quote >= 0.6;
            let punkte = Math.round(v.quote * 40);
            treffer(sp, x.item || null, gut, punkte);
            ein.disabled = true; box.querySelectorAll('[data-lh="ok"], [data-lh="skip"]').forEach((b) => { b.disabled = true; });
            const erg = box.querySelector('[data-lh="erg"]');
            erg.innerHTML = '<div class="lh-erk ' + (gut ? 'gut' : 'schlecht') + '"><b>' + (aufgeben ? '📘 Musterlösung' : gut ? '✓ Sehr gut (' + Math.round(v.quote * 100) + ' %)' : fast ? '≈ Nah dran (' + Math.round(v.quote * 100) + ' %)' : '✗ Weicht stark ab (' + Math.round(v.quote * 100) + ' %)') + '</b>'
              + (v.woerter.length ? '<div class="ski-woerter links">' + v.woerter.map((w) => '<span class="ski-w ' + w.status + '">' + esc(w.w) + '</span>').join(' ') + '</div><small class="lh-fein">Farben = Wörter der Musterlösung, die in deiner Version vorkommen.</small>' : '')
              + '<p class="lh-bsp"><b>' + esc(refs[0]) + '</b>' + (nachZiel ? laut(refs[0]) : '') + (refs.length > 1 ? '<i>Auch richtig: ' + refs.slice(1).map(esc).join(' · ') + '</i>' : '') + '</p></div>'
              + '<div class="lh-knoepfe">' + (!gut && !aufgeben && ein.value.trim() ? '<button type="button" class="btn secondary" data-lh="auch">✔ Meine Version stimmt auch</button>' : '') + '<button type="button" class="btn" data-lh="weiter">Weiter ›</button></div>';
            bindLaut(erg);
            const auch = erg.querySelector('[data-lh="auch"]');
            if (auch) auch.addEventListener('click', () => { sp.punkte += Math.max(0, 30 - punkte); sp.richtig++; sp.falsch = Math.max(0, sp.falsch - 1); if (x.item) { sp.fehler = sp.fehler.filter((y) => y !== x.item); fehlerMerken(x.item, true); fehlerMerken(x.item, true); } hud(hudBox, sp, sp.hudExtra); auch.disabled = true; auch.textContent = '✔ Als richtig gezählt'; });
            erg.querySelector('[data-lh="weiter"]').addEventListener('click', runde);
          };
          box.querySelector('[data-lh="ok"]').addEventListener('click', () => { if (ein.value.trim()) fertig(false); });
          box.querySelector('[data-lh="skip"]').addEventListener('click', () => fertig(true));
        };
        runde();
      } },
  ];
  // ---------- Hilfen für Diktat & Übersetzung ----------
  function satzPool(d) {
    return d.items.filter((x) => x.bsp && x.bsp.split(' ').length >= 3).map((x) => ({ text: x.bsp, de: x.bspDe, item: x }))
      .concat(d.items.filter((x) => !x.bsp && x.z.split(' ').length >= 3).map((x) => ({ text: x.z, de: x.de, item: x })));
  }
  function uePool(d) {
    const extra = (P.uebersetzung || []).filter((x) => d.id === 'mix' || d.id === 'fehler' || x.deck === d.id);
    const saetze = d.items.filter((x) => x.bsp && x.bspDe && x.bsp.split(' ').length >= 3).map((x) => ({ de: x.bspDe, z: x.bsp, item: x }))
      .concat(d.items.filter((x) => !x.bsp && x.z.split(' ').length >= 3).map((x) => ({ de: x.de, z: x.z, alt: x.alt, deAlt: x.deAlt, item: x })));
    const schon = new Set(extra.map((x) => norm(x.z)));
    return extra.concat(saetze.filter((x) => !schon.has(norm(x.z))));
  }
  const woerterVon = (t) => (typeof SprechKI !== 'undefined' ? SprechKI.norm(t, P.lang).split(' ').filter(Boolean) : norm(t).split(' '));
  function diktatWert(eingabe, ziel) {
    const v = SprechKI.vergleiche(eingabe, ziel, P.lang);
    const W = v.woerter.map((w) => ({ ...w, status: w.s === 1 ? 'ok' : w.s >= 0.75 ? 'fast' : 'fehlt' }));
    const roh = W.reduce((a, w) => a + (w.status === 'ok' ? 1 : w.status === 'fast' ? 0.5 : 0), 0) / Math.max(1, W.length);
    return { quote: Math.max(0, roh - v.extra * 0.05), woerter: W };
  }
  function besteRef(eingabe, refs, lang) {
    let best = null;
    refs.filter(Boolean).forEach((r) => { const v = SprechKI.vergleiche(eingabe, r, lang); if (!best || v.quote > best.quote) best = { ...v, text: r }; });
    return best;
  }
  const zeichenLeiste = () => (P.zeichen ? '<div class="lh-zeichen">' + P.zeichen.map((c) => '<button type="button" data-c="' + c + '">' + c + '</button>').join('') + '</div>' : '');
  function bindZeichen(box, ein) {
    box.querySelectorAll('[data-c]').forEach((b) => {
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => { const p = ein.selectionStart != null ? ein.selectionStart : ein.value.length; ein.value = ein.value.slice(0, p) + b.dataset.c + ein.value.slice(p); ein.focus(); ein.setSelectionRange(p + 1, p + 1); });
    });
  }

  // ---------- 🎯 Lernplan ----------
  function planErledigt(id) { const s = store(); if (!s.plan) return; const k = tagKey(); s.plan.tage[k] = { ...(s.plan.tage[k] || {}), [id]: true }; speichern(s); }
  function niveauStand(s, niv) {
    const items = decks.filter((d) => niv.decks.includes(d.id)).flatMap((d) => d.items);
    const m = items.filter((x) => s.srs[x.k] && s.srs[x.k][0] >= 3).length;
    return { m, n: items.length, q: items.length ? m / items.length : 0 };
  }
  function aktuellesNiveau(s) {
    const N = P.niveaus, zi = Math.max(0, N.findIndex((n) => n.id === s.plan.ziel));
    for (let i = Math.max(0, N.findIndex((n) => n.id === s.plan.start)); i < zi; i++) if (niveauStand(s, N[i]).q < 0.7) return N[i];
    return N[zi];
  }
  const deckVon = (id) => decks.find((d) => d.id === id);
  const spielGeht = (id, deckId) => { const g = SPIELE.find((x) => x.id === id), d = deckVon(deckId); return !!(g && d && (!g.geht || g.geht(d) === true)); };
  function planMissionen(s) {
    const niv = aktuellesNiveau(s), min = s.plan.minuten, tag = tagNr();
    const haupt = niv.decks[tag % niv.decks.length], neben = niv.decks[(tag + 1) % niv.decks.length];
    const M = [{ id: 'karten', ic: '🃏', n: 'Karteikarten', sub: deckVon(haupt).n + ' · fällige + neue', deck: haupt }];
    const schreib = (tag % 2 ? ['diktat', 'uebersetzen'] : ['uebersetzen', 'diktat']).filter((id) => spielGeht(id, neben));
    if (schreib[0]) M.push({ id: schreib[0], ic: schreib[0] === 'diktat' ? '✍️' : '🔁', n: schreib[0] === 'diktat' ? 'Diktat' : 'Übersetzung', sub: deckVon(neben).n, deck: neben });
    if (min >= 20) {
      if (schreib[1]) M.push({ id: schreib[1], ic: schreib[1] === 'diktat' ? '✍️' : '🔁', n: schreib[1] === 'diktat' ? 'Diktat' : 'Übersetzung', sub: deckVon(haupt).n, deck: spielGeht(schreib[1], haupt) ? haupt : neben });
      const rot = ['blitz', 'regen', 'satz', 'tippen', 'memory', 'hoeren'].filter((id) => spielGeht(id, haupt));
      if (rot.length) { const g = SPIELE.find((x) => x.id === rot[tag % rot.length]); M.push({ id: g.id, ic: g.e, n: g.n, sub: deckVon(haupt).n, deck: haupt }); }
    }
    if (min >= 30) {
      if (P.grammatik && P.grammatik.length >= 12) M.push({ id: 'grammatik', ic: '🧬', n: 'Grammatik-Duell', sub: '12 Lücken', deck: haupt });
      if (P.rollen && P.rollen.length) { const R = P.rollen[tag % P.rollen.length]; M.push({ id: 'rolle', ic: '🎭', n: 'Rollenspiel', sub: R.titel, rolle: R.id }); }
    }
    if (min >= 45) M.push({ id: 'sprechen', ic: '🎙️', n: 'Sprech-Arena', sub: deckVon(haupt).n, deck: haupt });
    return { niv, M };
  }
  function planKarte(s) {
    if (!P.niveaus) return '';
    if (!s.plan) return '<button type="button" class="lh-plan-neu" data-lh="plan-neu"><span>🎯</span><span><b>Lernplan erstellen</b><small>Ziel-Niveau wählen' + (P.niveaus.length ? ' (bis ' + P.niveaus[P.niveaus.length - 1].id + ')' : '') + ', Minuten pro Tag – mit Einstufungstest</small></span><span class="lh-cta-pfeil">›</span></button>';
    const { niv, M } = planMissionen(s), heute = s.plan.tage[tagKey()] || {}, N = P.niveaus, zi = N.findIndex((n) => n.id === s.plan.ziel);
    const erledigt = M.filter((m) => heute[m.id]).length;
    const woche = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const t = s.plan.tage[tagKey(d)] || {}; const n = Object.keys(t).length; return '<i class="' + (n >= M.length ? 'voll' : n ? 'halb' : '') + (i === 6 ? ' heute' : '') + '" title="' + tagKey(d) + '">' + 'MDMDFSS'[(d.getDay() + 6) % 7] + '</i>'; }).join('');
    let rest = 0; for (let i = N.findIndex((n) => n.id === niv.id); i <= zi; i++) { const st = niveauStand(s, N[i]); rest += Math.max(0, Math.ceil(st.n * 0.7) - st.m); }
    const proTag = s.plan.minuten >= 30 ? 15 : 10, wochen = Math.ceil(rest / proTag / 7);
    return '<div class="lh-plan"><div class="lh-plan-kopf"><b>🎯 Weg zu ' + esc(s.plan.ziel) + '</b><button type="button" class="lh-klein" data-lh="plan-neu">⚙︎</button></div>'
      + '<div class="lh-niveaus">' + N.slice(0, zi + 1).map((n) => { const st = niveauStand(s, n); return '<span class="' + (n.id === niv.id ? 'jetzt' : st.q >= 0.7 ? 'fertig' : '') + '"><b>' + n.id + '</b><i style="--q:' + Math.round(Math.min(1, st.q / 0.7) * 100) + '%"></i></span>'; }).join('') + '</div>'
      + '<div class="lh-plan-info"><span>Jetzt: <b>' + niv.id + '</b> · ' + s.plan.minuten + ' Min./Tag</span><span>' + (rest ? 'App-Wortschatz bis ' + esc(s.plan.ziel) + ': ≈ ' + wochen + ' Woche' + (wochen === 1 ? '' : 'n') + '*' : 'App-Wortschatz bis ' + esc(s.plan.ziel) + ' geschafft 🎉') + '</span></div>'
      + '<div class="lh-woche">' + woche + '</div>'
      + '<div class="lh-missionen">' + M.map((m, i) => '<button type="button" class="lh-mission' + (heute[m.id] ? ' fertig' : '') + '" data-mission="' + i + '"><span>' + (heute[m.id] ? '✅' : m.ic) + '</span><b>' + esc(m.n) + '</b><small>' + esc(m.sub) + '</small></button>').join('') + '</div>'
      + '<p class="lh-fein">Heute ' + erledigt + ' / ' + M.length + ' erledigt · *nur der Wortschatz dieser App (70 % je Niveau sicher). Echtes ' + esc(s.plan.ziel) + ' braucht zusätzlich viel Lesen, Hören und Sprechen – das dauert eher Monate.</p></div>';
  }
  function planBinden(root) {
    root.querySelectorAll('[data-lh="plan-neu"]').forEach((b) => b.addEventListener('click', planEinrichten));
    const s = store(); if (!s.plan || !P.niveaus) return;
    const { M } = planMissionen(s);
    root.querySelectorAll('[data-mission]').forEach((b) => b.addEventListener('click', () => {
      const m = M[+b.dataset.mission];
      if (m.rolle) { rolle(P.rollen.find((r) => r.id === m.rolle)); return; }
      const s2 = store(); s2.deck = m.deck; speichern(s2);
      if (m.id === 'karten') karten(); else starteSpiel(m.id);
    }));
  }
  function planEinrichten() {
    const s = store(), N = P.niveaus, wahl = { ziel: (s.plan && s.plan.ziel) || N[N.length - 1].id, minuten: (s.plan && s.plan.minuten) || 20, start: (s.plan && s.plan.start) || N[0].id };
    const zeichnen = () => {
      const root = rahmen('<div class="lh-karte lh-setup"><h3>🎯 Dein Lernplan</h3>'
        + '<b>Ziel</b><div class="lh-chips">' + N.map((n) => '<button type="button" class="' + (wahl.ziel === n.id ? 'an' : '') + '" data-z="' + n.id + '">' + n.id + '<small>' + esc(n.n) + '</small></button>').join('') + '</div>'
        + '<b>Zeit pro Tag</b><div class="lh-chips">' + [10, 20, 30, 45].map((m) => '<button type="button" class="' + (wahl.minuten === m ? 'an' : '') + '" data-m="' + m + '">' + m + ' Min.</button>').join('') + '</div>'
        + '<b>Start</b><div class="lh-chips">' + N.map((n) => '<button type="button" class="' + (wahl.start === n.id ? 'an' : '') + '" data-st="' + n.id + '">' + n.id + '</button>').join('') + '</div>'
        + '<button type="button" class="btn secondary" data-lh="test">🧪 Einstufungstest (≈ 2 Min.)</button>'
        + '<p class="lh-fein">' + { 10: 'Karteikarten + Diktat oder Übersetzung.', 20: '+ zweite Schreibaufgabe + ein Spiel.', 30: '+ Grammatik-Duell + Rollenspiel.', 45: '+ Sprech-Arena.' }[wahl.minuten] + ' Jeden Tag andere Decks und Spiele; wer ein Niveau zu 70 % sicher kann, steigt automatisch auf.</p>'
        + '<div class="lh-knoepfe"><button type="button" class="btn" data-lh="speichern">Plan starten</button></div></div>', spielKopf('🎯 Lernplan'));
      bindRaus(root);
      root.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { wahl.ziel = b.dataset.z; if (N.findIndex((n) => n.id === wahl.start) > N.findIndex((n) => n.id === wahl.ziel)) wahl.start = wahl.ziel; zeichnen(); }));
      root.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { wahl.minuten = +b.dataset.m; zeichnen(); }));
      root.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', () => { wahl.start = b.dataset.st; if (N.findIndex((n) => n.id === wahl.start) > N.findIndex((n) => n.id === wahl.ziel)) wahl.ziel = wahl.start; zeichnen(); }));
      root.querySelector('[data-lh="test"]').addEventListener('click', () => einstufung(wahl, zeichnen));
      root.querySelector('[data-lh="speichern"]').addEventListener('click', () => { const s2 = store(); s2.plan = { ...wahl, seit: tagKey(), tage: (s2.plan && s2.plan.tage) || {} }; speichern(s2); home(); });
    };
    zeichnen();
  }
  // Einstufung: je Niveau 5 Wörter (Bedeutung wählen); ab 4/5 gilt das Niveau als sicher
  function einstufung(wahl, zurueck) {
    const N = P.niveaus, fragen = N.flatMap((n) => { const pool = decks.filter((d) => n.decks.includes(d.id)).flatMap((d) => d.items).filter((x) => x.z.split(' ').length <= 3); return misch(pool).slice(0, 5).map((x) => ({ x, n, pool })); });
    let i = 0; const richtig = {};
    const frage = () => {
      if (i >= fragen.length) {
        let start = N[N.length - 1];
        for (const n of N) if ((richtig[n.id] || 0) < 4) { start = n; break; }
        wahl.start = start.id; if (N.findIndex((n) => n.id === wahl.ziel) < N.findIndex((n) => n.id === start.id)) wahl.ziel = start.id;
        const root = rahmen('<div class="lh-ende"><div class="lh-ende-ic">🧪</div><h3>Einstufung: ' + start.id + '</h3><div class="lh-stats">' + N.map((n) => '<span><b>' + (richtig[n.id] || 0) + '/5</b>' + n.id + '</span>').join('') + '</div><p class="lh-fein">Dein Plan startet bei ' + start.id + '. Du kannst das jederzeit ändern.</p><div class="lh-knoepfe"><button type="button" class="btn" data-lh="weiter">Weiter zum Plan</button></div></div>', spielKopf('🧪 Einstufung'));
        bindRaus(root); root.querySelector('[data-lh="weiter"]').addEventListener('click', zurueck); return;
      }
      const f = fragen[i++], opt = misch([f.x].concat(ablenker(f.x, 'de', 3, f.pool)));
      const root = rahmen('<div class="lh-frage"><small>' + i + ' / ' + fragen.length + ' · Was heißt …</small><b>' + esc(f.x.z) + '</b></div><div class="lh-optionen">' + opt.map((o, k) => '<button type="button" class="lh-opt" data-i="' + k + '">' + esc(o.de) + '</button>').join('') + '<button type="button" class="lh-opt leise" data-i="-1">🤷 Weiß ich nicht</button></div>', spielKopf('🧪 Einstufung'));
      bindRaus(root);
      root.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { if (+b.dataset.i >= 0 && opt[+b.dataset.i] === f.x) richtig[f.n.id] = (richtig[f.n.id] || 0) + 1; frage(); }));
    };
    frage();
  }

  // ---------- Rollenspiele ----------
  function rolle(R) {
    const meinLauf = ++lauf, verlauf = [], s0 = store();
    let i = 0, fehler = 0, sprechen = s0.sprechen;
    const root = rahmen('<div class="lh-chat-kopf"><span>' + R.ic + '</span><div><b>' + esc(R.titel) + '</b><small>' + esc(R.ort) + '</small></div><label class="lh-schalter"><input type="checkbox" data-lh="spr"' + (sprechen ? ' checked' : '') + '> 🎙️ laut</label></div><div class="lh-chat" data-lh="chat"></div><div class="lh-wahl" data-lh="wahl"></div>', spielKopf('🎭 Rollenspiel'));
    bindRaus(root);
    root.querySelector('[data-lh="spr"]').addEventListener('change', (e) => { sprechen = e.target.checked; const s = store(); s.sprechen = sprechen; speichern(s); });
    const chat = root.querySelector('[data-lh="chat"]'), wahl = root.querySelector('[data-lh="wahl"]');
    const blase = (wer, z, de) => {
      const b = document.createElement('div'); b.className = 'lh-blase ' + wer;
      b.innerHTML = '<p>' + esc(z) + ' ' + laut(z) + '</p><button type="button" class="lh-de">DE</button><i hidden>' + esc(de) + '</i>';
      b.querySelector('.lh-de').addEventListener('click', () => { const x = b.querySelector('i'); x.hidden = !x.hidden; });
      chat.appendChild(b); bindLaut(b); b.scrollIntoView({ block: 'end', behavior: wenig() ? 'auto' : 'smooth' });
      return b;
    };
    const weiter = () => {
      if (meinLauf !== lauf) return;
      if (i >= R.z.length) {
        const sterne = fehler === 0 ? 3 : fehler <= 2 ? 2 : 1, s = store(); s.rollen[R.id] = Math.max(s.rollen[R.id] || 0, sterne); speichern(s); xpDazu(15 + sterne * 5); planErledigt('rolle');
        wahl.innerHTML = '<div class="lh-ende klein"><div class="lh-sterne">' + [0, 1, 2].map((k) => '<span class="' + (k < sterne ? 'an' : '') + '" style="--i:' + k + '">★</span>').join('') + '</div><p>' + (fehler ? fehler + ' Fehlversuch' + (fehler > 1 ? 'e' : '') : 'Fehlerfrei!') + ' · +' + (15 + sterne * 5) + ' XP</p><div class="lh-knoepfe"><button type="button" class="btn" data-lh="nochmal">🔁 Nochmal</button><button type="button" class="btn secondary" data-lh="raus2">Lernhalle</button></div></div>';
        wahl.querySelector('[data-lh="nochmal"]').addEventListener('click', () => rolle(R));
        wahl.querySelector('[data-lh="raus2"]').addEventListener('click', home);
        if (sterne === 3 && typeof konfetti === 'function') konfetti(20, ['🎭', '⭐', P.flagge]);
        return;
      }
      const z = R.z[i++];
      if (z[0] === 'npc') { blase('npc', z[1], z[2]); P.sprich(z[1]); setTimeout(weiter, 450); return; }
      const opt = misch(z[1]);
      wahl.innerHTML = '<small>Deine Antwort:</small>' + opt.map((o, k) => '<button type="button" class="lh-antwort" data-k="' + k + '">' + esc(o[0]) + '<i>' + esc(o[1]) + '</i></button>').join('');
      wahl.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
        const o = opt[+b.dataset.k];
        if (!o[2]) { fehler++; ton(false); b.classList.add('falsch'); b.disabled = true; b.insertAdjacentHTML('beforeend', '<em>' + esc(o[3] || 'Passt hier nicht.') + '</em>'); return; }
        ton(true); blase('du', o[0], o[1]); wahl.innerHTML = '';
        if (sprechen && typeof SprechKI !== 'undefined') {
          wahl.innerHTML = '<small>Jetzt laut sagen:</small><div data-lh="ski"></div><button type="button" class="lh-klein" data-lh="weiter">Weiter ›</button>';
          wahl.querySelector('[data-lh="weiter"]').addEventListener('click', () => { SprechKI.stopp(); weiter(); });
          SprechKI.widget(wahl.querySelector('[data-lh="ski"]'), { lang: P.lang, ziel: o[0], sprich: P.hatTon(o[0]) ? (t) => P.sprich(t) : null, onErgebnis: (e) => { if (e.ok) { xpDazu(3); setTimeout(() => { if (wahl.querySelector('[data-lh="weiter"]')) weiter(); }, 1300); } } });
        } else setTimeout(weiter, 350);
      }));
    };
    weiter();
  }

  // ---------- öffentlich ----------
  return {
    paket(p) { PAKETE[p.id] = p; },
    _paket: (id) => PAKETE[id],
    start(id, container) { if (P !== PAKETE[id]) decks = null; P = PAKETE[id]; el = container; home(); },
    stop() { lauf++; spiel = null; if (typeof SprechKI !== 'undefined') SprechKI.stopp(); },
    home: () => home(),
    _intern: { tippWert, level, diktatWert: (a, b) => diktatWert(a, b), planMissionen: () => planMissionen(store()), aktuellesNiveau: () => aktuellesNiveau(store()), store: () => store(), SPIELE, aktivesDeck: () => aktivesDeck(), decks: () => decks, xpDazu: (n) => xpDazu(n), tagNr },
  };
})();
