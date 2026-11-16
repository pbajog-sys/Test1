// 📈 LernLog – Tagebuch fürs Sprachenlernen (Slowenisch, Englisch – und später eine eigene Sprach-App).
// Je Sprache und Tag: geübt (jede beantwortete Aufgabe/Karte), richtig, falsch, neue Wörter, Spiele, XP,
// aktive Minuten (Abstände < 5 Min. zwischen Aktionen zählen) und ein Schnappschuss „Wörter gekonnt“.
const LernLog = (() => {
  const KEY = 'walquiz.lernlog.v1';
  const tagKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const leer = () => ({ g: 0, r: 0, f: 0, neu: 0, spiele: 0, xp: 0, min: 0, last: 0, gekonnt: null });
  function store() {
    const s = loadJson(KEY), ok = s && typeof s === 'object' && !Array.isArray(s);
    return ok ? s : {};
  }
  function tag(s, lang) {
    const L = (s[lang] = s[lang] && typeof s[lang] === 'object' ? s[lang] : {}), k = tagKey();
    L[k] = { ...leer(), ...(L[k] || {}) };
    return L[k];
  }
  function aktiv(t) {
    const jetzt = Date.now();
    if (t.last && jetzt - t.last < 5 * 6e4) t.min = Math.round((t.min + (jetzt - t.last) / 6e4) * 10) / 10;
    t.last = jetzt;
  }
  function antwort(lang, ok) { const s = store(), t = tag(s, lang); t.g++; if (ok === true) t.r++; else if (ok === false) t.f++; aktiv(t); saveJson(KEY, s); }
  function neu(lang, n = 1) { const s = store(), t = tag(s, lang); t.neu += n; aktiv(t); saveJson(KEY, s); }
  function spiel(lang) { const s = store(), t = tag(s, lang); t.spiele++; saveJson(KEY, s); }
  function xp(lang, n) { if (!n) return; const s = store(), t = tag(s, lang); t.xp += n; saveJson(KEY, s); }
  function gekonnt(lang, n) { const s = store(), t = tag(s, lang); t.gekonnt = Math.max(t.gekonnt || 0, n); saveJson(KEY, s); }
  // letzte n Tage (ältester zuerst), fehlende Tage als 0
  function tage(lang, n = 14) {
    const L = (store()[lang]) || {}, out = [];
    for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = tagKey(d); out.push({ k, d, ...leer(), ...(L[k] || {}) }); }
    return out;
  }
  function serie(lang) { const L = store()[lang] || {}; let n = 0; const d = new Date(); if (!((L[tagKey(d)] || {}).g > 0)) d.setDate(d.getDate() - 1); while (((L[tagKey(d)] || {}).g || 0) > 0) { n++; d.setDate(d.getDate() - 1); } return n; }
  // Wörter gekonnt vor ~7 Tagen (letzter Schnappschuss davor)
  function gekonntVor(lang, tageZurueck) {
    const L = store()[lang] || {}, grenze = new Date(); grenze.setDate(grenze.getDate() - tageZurueck); const g = tagKey(grenze);
    const ks = Object.keys(L).filter((k) => k <= g && L[k].gekonnt != null).sort();
    return ks.length ? L[ks[ks.length - 1]].gekonnt : null;
  }
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const tagName = (t, i, n) => (i === n - 1 ? 'Heute' : i === n - 2 ? 'Gestern' : WT[t.d.getDay()] + ' ' + t.d.getDate() + '.' + (t.d.getMonth() + 1) + '.');
  // Kurzzeile für Startseiten
  function kurz(lang) {
    const T = tage(lang, 7), h = T[6].g, g = T[5].g, w = T.reduce((a, t) => a + t.g, 0);
    return 'Heute <b>' + h + '</b> geübt · gestern ' + g + ' · 7 Tage ' + w;
  }
  // Vollansicht: Kacheln, Balken (14 Tage), Tagesliste
  function ansicht(box, lang, opt = {}) {
    if (opt.gekonnt != null) gekonnt(lang, opt.gekonnt);
    const N = 14, T = tage(lang, N), max = Math.max(10, ...T.map((t) => t.g)), heute = T[N - 1], gestern = T[N - 2];
    const woche = T.slice(-7).reduce((a, t) => a + t.g, 0), vorwoche = T.slice(0, 7).reduce((a, t) => a + t.g, 0);
    const vor7 = gekonntVor(lang, 7), plus = opt.gekonnt != null && vor7 != null ? opt.gekonnt - vor7 : null;
    const quote = (t) => (t.r + t.f ? Math.round((t.r / (t.r + t.f)) * 100) + ' %' : '–');
    const balken = T.map((t, i) => '<button type="button" class="ll-balken' + (i === N - 1 ? ' heute' : '') + '" data-i="' + i + '" aria-label="' + tagName(t, i, N) + ': ' + t.g + ' geübt"><i style="height:' + (t.g ? Math.max(4, (t.g / max) * 100) : 0) + '%"></i><small>' + (i === N - 1 ? 'H' : WT[t.d.getDay()][0]) + '</small></button>').join('');
    box.innerHTML = '<div class="ll">'
      + '<div class="ll-kacheln">'
      + (opt.gekonnt != null ? '<div class="ll-kachel gross"><small>Wörter gekonnt</small><b>' + opt.gekonnt + '</b>' + (plus != null ? '<em>' + (plus >= 0 ? '+' : '') + plus + ' in 7 Tagen</em>' : '<em>ab heute mitgezählt</em>') + '</div>' : '')
      + '<div class="ll-kachel"><small>Heute geübt</small><b>' + heute.g + '</b><em>' + heute.neu + ' neu · ' + Math.round(heute.min) + ' Min.</em></div>'
      + '<div class="ll-kachel"><small>Gestern</small><b>' + gestern.g + '</b><em>' + gestern.neu + ' neu · ' + Math.round(gestern.min) + ' Min.</em></div>'
      + '<div class="ll-kachel"><small>Diese 7 Tage</small><b>' + woche + '</b><em>' + (vorwoche ? (woche >= vorwoche ? '▲ ' : '▼ ') + 'Vorwoche ' + vorwoche : 'Vorwoche –') + '</em></div>'
      + '<div class="ll-kachel"><small>Serie</small><b>🔥 ' + serie(lang) + '</b><em>Tage am Stück</em></div></div>'
      + '<div class="ll-chart"><div class="ll-chart-kopf"><b>Geübt pro Tag</b><span data-ll="info">Tippe auf einen Tag</span></div><div class="ll-balken-reihe">' + balken + '</div></div>'
      + '<div class="ll-liste"><b>Tag für Tag</b><table><thead><tr><th>Tag</th><th>geübt</th><th>neu</th><th>richtig</th><th>Min.</th><th>XP</th></tr></thead><tbody>'
      + T.slice().reverse().filter((t, j) => t.g || t.neu || j < 2).map((t) => { const i = T.indexOf(t); return '<tr' + (i === N - 1 ? ' class="heute"' : '') + '><td>' + tagName(t, i, N) + '</td><td>' + t.g + '</td><td>' + t.neu + '</td><td>' + quote(t) + '</td><td>' + Math.round(t.min) + '</td><td>' + t.xp + '</td></tr>'; }).join('')
      + '</tbody></table></div><p class="ll-fein">„Geübt“ = jede beantwortete Aufgabe und Karte (Reise, Karteikarten, Grammatik, Spiele, Gespräche). Minuten = aktive Lernzeit. Alles bleibt auf deinem Gerät.</p></div>';
    const info = box.querySelector('[data-ll="info"]');
    box.querySelectorAll('.ll-balken').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i, t = T[i];
      box.querySelectorAll('.ll-balken').forEach((x) => x.classList.toggle('an', x === b));
      info.innerHTML = '<b>' + tagName(t, i, N) + '</b>: ' + t.g + ' geübt · ' + t.neu + ' neu · ' + quote(t) + ' richtig';
    }));
  }
  return { antwort, neu, spiel, xp, gekonnt, tage, serie, kurz, ansicht, _key: KEY };
})();
