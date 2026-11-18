// 🧮 Rechenhilfe fürs Zufalls-Gefühl: eigenes Baumdiagramm bauen (Äste, Wahrscheinlichkeiten, Treffer-Pfade)
// und ein Bruch-Rechner. Ergebnis kann als Tipp übernommen werden. Gerechnet wird exakt mit Brüchen.
// ---------- Brüche ----------
const zrGgt = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
function zrBr(n, d = 1) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  if (d < 0) { n = -n; d = -d; }
  if (!Number.isInteger(n) || !Number.isInteger(d) || Math.abs(n) > 1e12 || d > 1e12) return { n: n / d, d: 1, f: true };   // zu groß → Kommazahl
  const g = zrGgt(n, d); return { n: n / g, d: d / g };
}
const zrWert = (r) => r.n / r.d;
const zrMal = (a, b) => (a.f || b.f ? { n: zrWert(a) * zrWert(b), d: 1, f: true } : zrBr(a.n * b.n, a.d * b.d));
const zrPlus = (a, b) => (a.f || b.f ? { n: zrWert(a) + zrWert(b), d: 1, f: true } : zrBr(a.n * b.d + b.n * a.d, a.d * b.d));
const zrMinus = (a, b) => zrPlus(a, { ...b, n: -b.n });
const zrGeteilt = (a, b) => (zrWert(b) === 0 ? null : a.f || b.f ? { n: zrWert(a) / zrWert(b), d: 1, f: true } : zrBr(a.n * b.d, a.d * b.n));
function zrDezimal(t) {   // "0.25" → 1/4 (exakt)
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null;
  const k = (t.split('.')[1] || '').length; return k > 9 ? { n: Number(t), d: 1, f: true } : zrBr(Math.round(Number(t) * 10 ** k), 10 ** k);
}
const zrBruchText = (r) => (!r ? '?' : r.f || r.d > 100000 ? fmt(Math.round(zrWert(r) * 1e4) / 1e4) : r.d === 1 ? String(r.n) : r.n + '/' + r.d);
const zrProz = (r) => fmt(Math.round(zrWert(r) * 1000) / 10) + ' %';
// Eingabe eines Asts: „1/6“, „0,3“, „30 %“, „30“ (über 1 → Prozent)
function zrWsk(t) {
  t = String(t || '').trim().replace(/,/g, '.').replace(/\s+/g, '');
  if (!t) return null;
  let r;
  if (t.endsWith('%')) { const x = zrDezimal(t.slice(0, -1)); r = x && zrGeteilt(x, zrBr(100)); }
  else if (t.includes('/')) { const [a, b] = t.split('/'); const x = zrDezimal(a), y = zrDezimal(b); r = x && y && zrGeteilt(x, y); }
  else { r = zrDezimal(t); if (r && zrWert(r) > 1) r = zrGeteilt(r, zrBr(100)); }
  return r && zrWert(r) >= 0 && zrWert(r) <= 1 ? r : null;
}
// Rechner: + − × ÷ ^ ( ) % mit Brüchen
function zrRechne(text) {
  const s = String(text).replace(/,/g, '.').replace(/[×*·]/g, '×').replace(/[÷:]/g, '÷').replace(/[−–]/g, '-').replace(/\s+/g, '');
  let i = 0;
  const fehler = () => { throw new Error('x'); };
  const zahl = () => { const m = /^\d*\.?\d+|^\d+\./.exec(s.slice(i)); if (!m) fehler(); i += m[0].length; return zrDezimal(m[0]) || fehler(); };
  const atom = () => {
    let r;
    if (s[i] === '(') { i++; r = summe(); if (s[i] !== ')') fehler(); i++; }
    else if (s[i] === '-') { i++; r = atom(); return { ...r, n: -r.n }; }
    else r = zahl();
    while (s[i] === '%') { i++; r = zrGeteilt(r, zrBr(100)); }
    if (s[i] === '^') { i++; const e = atom(); if (e.f || e.d !== 1 || e.n < 0 || e.n > 60) fehler(); let p = zrBr(1); for (let k = 0; k < e.n; k++) p = zrMal(p, r); r = p; }
    return r;
  };
  const produkt = () => { let r = atom(); while (s[i] === '×' || s[i] === '÷' || s[i] === '/') { const op = s[i++]; const b = atom(); r = op === '×' ? zrMal(r, b) : zrGeteilt(r, b); if (!r) fehler(); } return r; };
  const summe = () => { let r = produkt(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const b = produkt(); r = op === '+' ? zrPlus(r, b) : zrMinus(r, b); } return r; };
  try { if (!s) return null; const r = summe(); return i === s.length && r ? r : null; } catch { return null; }
}

// ---------- Baumdiagramm ----------
let zr = { baum: null, sel: null, gegen: false, tab: 'baum', rechner: '', nr: 0, offen: false };
const zrKnoten = (name, p, kinder = []) => ({ id: ++zr.nr, name, p, kinder, treffer: false });
const zrBlaetter = (k, pfad = []) => (k.kinder.length ? k.kinder.flatMap((c) => zrBlaetter(c, pfad.concat(c))) : [{ k, pfad }]);
const zrAlle = (k) => [k].concat(...k.kinder.map(zrAlle));
const zrFinde = (id) => zrAlle(zr.baum).find((k) => k.id === id);
const zrEltern = (id) => zrAlle(zr.baum).find((k) => k.kinder.some((c) => c.id === id));
const zrKopie = (k) => zrKnoten(k.name, k.p, k.kinder.map(zrKopie));
const ZR_MAX_ENDEN = 64;
// Vorlagen
const ZR_VORLAGEN = {
  janein: { n: 'Ja / Nein', bau: () => [zrKnoten('Ja', ''), zrKnoten('Nein', '')] },
  muenze: { n: '🪙 Münze', bau: () => [zrKnoten('Kopf', '1/2'), zrKnoten('Zahl', '1/2')] },
  sechs: { n: '🎲 6 / keine 6', bau: () => [zrKnoten('6', '1/6'), zrKnoten('keine 6', '5/6')] },
  kugeln: { n: '🔴🔵 Kugeln …' },
};
function zrKugeln(r, b, zuege, mit) {
  const ast = (rr, bb, rest) => {
    if (!rest) return [];
    const n = rr + bb, out = [];
    if (rr > 0) out.push(zrKnoten('rot', rr + '/' + n, ast(mit ? rr : rr - 1, bb, rest - 1)));
    if (bb > 0) out.push(zrKnoten('blau', bb + '/' + n, ast(rr, mit ? bb : bb - 1, rest - 1)));
    return out;
  };
  return ast(r, b, zuege);
}
function zrNeu(kinder) { zr.baum = zrKnoten('Start', ''); zr.baum.kinder = kinder || []; zr.sel = null; zr.gegen = false; }
// Gleiche Äste wie die letzte Stufe an jedes Ende hängen
function zrStufeWiederholen() {
  const enden = zrBlaetter(zr.baum);
  if (!zr.baum.kinder.length) return 'Erst eine Stufe bauen.';
  const vorlage = (zrEltern(enden[0].k.id) || zr.baum).kinder;
  if (enden.length * vorlage.length > ZR_MAX_ENDEN) return 'Zu groß – höchstens ' + ZR_MAX_ENDEN + ' Enden. Tipp: Gegenteil rechnen oder Rechner nutzen.';
  enden.forEach(({ k }) => { k.kinder = vorlage.map((v) => zrKnoten(v.name, v.p)); k.treffer = false; });
  return '';
}
// Auswertung: jeder Pfad = Produkt, Treffer-Pfade addiert
function zrAuswertung() {
  const pfade = zrBlaetter(zr.baum).filter(() => zr.baum.kinder.length).map(({ k, pfad }) => {
    const ws = pfad.map((c) => zrWsk(c.p));
    const prod = ws.every(Boolean) ? ws.reduce(zrMal, zrBr(1)) : null;
    return { k, pfad, ws, prod };
  });
  const probleme = [];
  zrAlle(zr.baum).forEach((k) => {
    if (!k.kinder.length) return;
    const ws = k.kinder.map((c) => zrWsk(c.p));
    if (!ws.every(Boolean)) { probleme.push('Bei „' + k.name + '“ fehlt noch eine Wahrscheinlichkeit (z. B. 1/6, 0,5 oder 30 %).'); return; }
    const s = ws.reduce(zrPlus, zrBr(0));
    if (Math.abs(zrWert(s) - 1) > 1e-9) probleme.push('Die Äste nach „' + k.name + '“ ergeben zusammen ' + zrProz(s) + ' statt 100 %.');
  });
  const treffer = pfade.filter((x) => x.k.treffer);
  let summe = treffer.length && treffer.every((x) => x.prod) ? treffer.map((x) => x.prod).reduce(zrPlus, zrBr(0)) : null;
  if (summe && zr.gegen) summe = zrMinus(zrBr(1), summe);
  return { pfade, treffer, summe, probleme };
}
const zrPfadName = (pfad) => pfad.map((c) => c.name || '?').join(' → ');
function zrBaumSvg(A) {
  const enden = zrBlaetter(zr.baum), tiefe = Math.max(1, ...enden.map((e) => e.pfad.length));
  const ZH = 38, W = 340, rechts = 92, spalte = Math.min(120, (W - 30 - rechts) / tiefe), H = Math.max(80, enden.length * ZH + 16);
  const pos = new Map();
  let zeile = 0;
  const lege = (k, t) => {
    let y;
    if (!k.kinder.length) y = 8 + ZH / 2 + zeile++ * ZH;
    else { const ys = k.kinder.map((c) => lege(c, t + 1)); y = (ys[0] + ys[ys.length - 1]) / 2; }
    pos.set(k.id, [18 + t * spalte, y]); return y;
  };
  if (zr.baum.kinder.length) lege(zr.baum, 0); else pos.set(zr.baum.id, [18, H / 2]);
  const pz = new Map(A.pfade.map((p) => [p.k.id, p]));
  let linien = '', punkte = '';
  zrAlle(zr.baum).forEach((k) => {
    const [x, y] = pos.get(k.id);
    k.kinder.forEach((c) => {
      const [x2, y2] = pos.get(c.id), w = zrWsk(c.p), tr = A.treffer.some((t) => t.pfad.includes(c));
      linien += '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y2 + '" class="' + (tr ? 'tr' : '') + '"/>';
      const mx = (x + x2) / 2, my = (y + y2) / 2 - 4;
      punkte += '<text class="zr-p' + (w ? '' : ' fehlt') + '" x="' + mx.toFixed(1) + '" y="' + my.toFixed(1) + '" data-k="' + c.id + '">' + nsEscZ(w ? zrBruchText(w) : c.p || '?') + '</text>';
    });
    const blatt = !k.kinder.length && k !== zr.baum, sel = zr.sel === k.id;
    punkte += '<g class="zr-k' + (sel ? ' sel' : '') + (blatt && k.treffer ? ' treffer' : '') + '" data-k="' + k.id + '"><circle r="16" class="hit" cx="' + x + '" cy="' + y + '"/><circle r="' + (k === zr.baum ? 6 : 5) + '" cx="' + x + '" cy="' + y + '"/>'
      + (blatt ? '<text x="' + (x + 8) + '" y="' + (y + 4) + '" class="zr-name">' : '<text x="' + (x - 4) + '" y="' + (y - 9) + '" class="zr-name" text-anchor="' + (k === zr.baum ? 'start' : 'end') + '">') + nsEscZ(k.name) + '</text>';
    if (blatt) { const p = pz.get(k.id); punkte += '<text x="' + (W - 6) + '" y="' + (y + 4) + '" class="zr-ende" text-anchor="end">' + (k.treffer ? '✓ ' : '') + (p && p.prod ? zrProz(p.prod) : '?') + '</text>'; }
    punkte += '</g>';
  });
  return '<svg class="zr-baum" viewBox="0 0 ' + W + ' ' + H + '" style="aspect-ratio:' + W + '/' + H + '">' + linien + punkte + '</svg>';
}
const nsEscZ = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function zrLiveHtml(A) {
  return (A.probleme.length ? '<ul class="zr-probleme">' + A.probleme.slice(0, 3).map((t) => '<li>⚠️ ' + t + '</li>').join('') + '</ul>' : '')
      + '<div class="zr-summe">' + (A.treffer.length
        ? A.treffer.map((t) => '<div><span>' + nsEscZ(zrPfadName(t.pfad)) + '</span><span>' + t.pfad.map((c) => zrBruchText(zrWsk(c.p))).join(' × ') + ' = <b>' + (t.prod ? zrBruchText(t.prod) : '?') + '</b></span></div>').join('')
          + '<label class="zr-check"><input type="checkbox" id="zrGegen"' + (zr.gegen ? ' checked' : '') + '> Gegenteil: 1 − Summe</label>'
          + '<div class="zr-ergebnis">' + (A.treffer.length > 1 ? 'Summe' : 'Ergebnis') + (zr.gegen ? ' (Gegenteil)' : '') + ': <b>' + (A.summe ? zrBruchText(A.summe) + ' ≈ ' + zrProz(A.summe) : '?') + '</b></div>'
        : '<div class="zr-ergebnis leise">Noch keine Treffer markiert.</div>') + '</div>'
      + '<button type="button" class="btn zr-uebernehmen" id="zrUebernehmen"' + (A.summe ? '' : ' disabled') + '>→ ' + (A.summe ? zrProz(A.summe) + ' als Tipp' : 'als Tipp übernehmen') + '</button>';
}
let zrMeldung = '';
function zrZeichnen() {
  const box = $('zfRechen'); if (!box) return;
  if (!zr.baum) zrNeu();
  const reiter = '<div class="zr-reiter"><button type="button" data-tab="baum" class="' + (zr.tab === 'baum' ? 'an' : '') + '">🌳 Baumdiagramm</button><button type="button" data-tab="rechner" class="' + (zr.tab === 'rechner' ? 'an' : '') + '">🧮 Rechner</button></div>';
  let html = '';
  if (zr.tab === 'baum') {
    const A = zrAuswertung(), k = zr.sel && zrFinde(zr.sel), blatt = k && !k.kinder.length && k !== zr.baum;
    html = '<div class="zr-chips">' + Object.entries(ZR_VORLAGEN).map(([id, v]) => '<button type="button" data-vorlage="' + id + '">' + v.n + '</button>').join('') + '</div>'
      + (zr.kugelForm ? '<div class="zr-form"><label>rot <input id="zrRot" type="number" min="0" max="20" value="3" inputmode="numeric"></label><label>blau <input id="zrBlau" type="number" min="0" max="20" value="2" inputmode="numeric"></label><label>Züge <input id="zrZuege" type="number" min="1" max="4" value="2" inputmode="numeric"></label><label class="zr-check"><input id="zrMit" type="checkbox"> mit Zurücklegen</label><button type="button" class="btn" id="zrKugelnOk">Baum bauen</button></div>' : '')
      + (zr.baum.kinder.length ? '' : '<p class="zr-leer">Wähle oben eine Vorlage oder tippe auf <b>Start</b> und füge Äste hinzu.</p>') + '<div id="zrBaumBox">' + zrBaumSvg(A) + '</div>'
      + '<div class="zr-zeile"><button type="button" class="btn secondary" id="zrStufe">＋ Stufe wiederholen</button><button type="button" class="btn secondary" id="zrLeeren">↺ Neu</button></div>'
      + (zrMeldung ? '<p class="zr-meldung">' + zrMeldung + '</p>' : '')
      + (k ? '<div class="zr-edit"><b>' + (k === zr.baum ? 'Start' : 'Ast „' + nsEscZ(k.name || '?') + '“') + '</b>'
        + (k !== zr.baum ? '<label>Name <input id="zrName" value="' + nsEscZ(k.name) + '" maxlength="14"></label><label>Wahrscheinlichkeit <input id="zrP" value="' + nsEscZ(k.p) + '" placeholder="z. B. 1/6, 0,5, 30 %" inputmode="text"></label>' : '')
        + '<div class="zr-zeile">' + (blatt ? '<button type="button" class="btn ' + (k.treffer ? '' : 'secondary') + '" id="zrTreffer">' + (k.treffer ? '✓ Treffer' : 'Als Treffer markieren') + '</button>' : '')
        + '<button type="button" class="btn secondary" id="zrAst">＋ Ast</button>' + (k !== zr.baum ? '<button type="button" class="btn secondary" id="zrWeg">🗑</button>' : '') + '</div></div>'
        : (zr.baum.kinder.length ? '<p class="zr-hinweis">Tipp: <b>Enden</b> antippen = Treffer an/aus. <b>Brüche</b> an den Ästen antippen = Wert ändern.</p>' : ''))
      + '<div id="zrLive">' + zrLiveHtml(A) + '</div>';
  } else {
    const r = zrRechne(zr.rechner);
    const tasten = ['7', '8', '9', '÷', '(', '4', '5', '6', '×', ')', '1', '2', '3', '−', '^', '0', ',', '%', '+', '⌫'];
    html = '<input class="zr-anzeige" id="zrAusdruck" value="' + nsEscZ(zr.rechner) + '" placeholder="z. B. 1 − (5/6)^4" inputmode="none" autocomplete="off">'
      + '<div class="zr-ausgabe">' + (r ? '= <b>' + zrBruchText(r) + '</b>' + (zrWert(r) >= 0 && zrWert(r) <= 1 ? ' ≈ ' + zrProz(r) : '') : zr.rechner ? '…' : '&nbsp;') + '</div>'
      + '<div class="zr-tasten">' + tasten.map((t) => '<button type="button" data-taste="' + t + '">' + t + '</button>').join('') + '<button type="button" data-taste="1−(" class="breit">1 − (…)</button><button type="button" data-taste="C">C</button></div>'
      + '<button type="button" class="btn zr-uebernehmen" id="zrUebernehmen"' + (r && zrWert(r) >= 0 && zrWert(r) <= 1 ? '' : ' disabled') + '>→ ' + (r && zrWert(r) >= 0 && zrWert(r) <= 1 ? zrProz(r) + ' als Tipp' : 'als Tipp übernehmen') + '</button>';
  }
  box.innerHTML = reiter + html;
  zrBinden();
}
function zrUebernehmen(r) {
  const reg = $('zfRegler'); reg.value = Math.round(zrWert(r) * 100); reg.dispatchEvent(new Event('input'));
  if (typeof zf !== 'undefined' && zf) { zf.hilfe = zf.hilfe || []; zf.hilfe[zf.i] = true; }
  zrSchliessen(); $('zfWert').scrollIntoView({ block: 'center', behavior: wenigBewegung() ? 'auto' : 'smooth' });
}
function zrBinden() {
  const box = $('zfRechen');
  box.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { zr.tab = b.dataset.tab; zrZeichnen(); }));
  if (zr.tab === 'rechner') {
    const inp = $('zrAusdruck');
    inp.addEventListener('input', () => { zr.rechner = inp.value; const pos = inp.selectionStart; zrZeichnen(); const n = $('zrAusdruck'); n.focus(); n.setSelectionRange(pos, pos); });
    box.querySelectorAll('[data-taste]').forEach((b) => b.addEventListener('click', () => {
      const t = b.dataset.taste;
      zr.rechner = t === 'C' ? '' : t === '⌫' ? zr.rechner.slice(0, -1) : zr.rechner + (t === '−' ? '−' : t); zrZeichnen();
    }));
    $('zrUebernehmen').addEventListener('click', () => { const r = zrRechne(zr.rechner); if (r) zrUebernehmen(r); });
    return;
  }
  box.querySelectorAll('[data-vorlage]').forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.vorlage; zrMeldung = '';
    if (v === 'kugeln') { zr.kugelForm = !zr.kugelForm; zrZeichnen(); return; }
    zr.kugelForm = false; zrNeu(ZR_VORLAGEN[v].bau()); zrZeichnen();
  }));
  if ($('zrKugelnOk')) $('zrKugelnOk').addEventListener('click', () => {
    const r = Math.max(0, Math.min(20, +$('zrRot').value || 0)), b = Math.max(0, Math.min(20, +$('zrBlau').value || 0)), z = Math.max(1, Math.min(4, +$('zrZuege').value || 1)), mit = $('zrMit').checked;
    if (r + b < (mit ? 1 : z)) { zrMeldung = 'Zu wenige Kugeln für ' + z + ' Züge.'; zrZeichnen(); return; }
    zr.kugelForm = false; zrMeldung = ''; zrNeu(zrKugeln(r, b, z, mit)); zrZeichnen();
  });
  zrLiveBinden();
  $('zrStufe').addEventListener('click', () => { zrMeldung = zrStufeWiederholen(); zr.sel = null; zrZeichnen(); });
  $('zrLeeren').addEventListener('click', () => { zrMeldung = ''; zrNeu(); zrZeichnen(); });
  const k = zr.sel && zrFinde(zr.sel);
  if ($('zrName')) $('zrName').addEventListener('input', (e) => { k.name = e.target.value.trim(); zrLive(); });
  if ($('zrP')) $('zrP').addEventListener('input', (e) => { k.p = e.target.value.trim(); zrLive(); });
  if ($('zrTreffer')) $('zrTreffer').addEventListener('click', () => { k.treffer = !k.treffer; zrZeichnen(); });
  if ($('zrAst')) $('zrAst').addEventListener('click', () => {
    if (zrBlaetter(zr.baum).length >= ZR_MAX_ENDEN) { zrMeldung = 'Höchstens ' + ZR_MAX_ENDEN + ' Enden.'; zrZeichnen(); return; }
    const neu = zrKnoten(String.fromCharCode(65 + k.kinder.length), ''); k.kinder.push(neu); k.treffer = false; zr.sel = neu.id; zrMeldung = ''; zrZeichnen();
    const p = $('zrP'); if (p) p.focus();
  });
  if ($('zrWeg')) $('zrWeg').addEventListener('click', () => { const e = zrEltern(k.id); if (e) e.kinder = e.kinder.filter((c) => c.id !== k.id); zr.sel = e ? e.id : null; zrZeichnen(); });
}
function zrLiveBinden() {
  $('zfRechen').querySelectorAll('.zr-baum [data-k]').forEach((g) => g.addEventListener('click', (e) => {
    e.stopPropagation(); const id = +g.dataset.k, k = zrFinde(id);
    // Ende (Punkt) antippen → Treffer an/aus; Bruch am Ast antippen → bearbeiten
    if (k && !k.kinder.length && k !== zr.baum && g.tagName === 'g') k.treffer = !k.treffer;
    zr.sel = id; zrZeichnen();
  }));
  if ($('zrGegen')) $('zrGegen').addEventListener('change', (e) => { zr.gegen = e.target.checked; zrLive(); });
  $('zrUebernehmen').addEventListener('click', () => { const A = zrAuswertung(); if (A.summe) zrUebernehmen(A.summe); });
}
function zrLive() { const A = zrAuswertung(); $('zrBaumBox').innerHTML = zrBaumSvg(A); $('zrLive').innerHTML = zrLiveHtml(A); zrLiveBinden(); }
function zrOeffnen() { zr.offen = true; $('zfRechen').hidden = false; $('zfRechenBtn').setAttribute('aria-expanded', 'true'); $('zfRechenBtn').textContent = '🧮 Rechenhilfe schließen'; zrZeichnen(); }
function zrSchliessen() { zr.offen = false; $('zfRechen').hidden = true; $('zfRechenBtn').setAttribute('aria-expanded', 'false'); $('zfRechenBtn').textContent = '🧮 Rechenhilfe: Baumdiagramm & Rechner'; }
$('zfRechenBtn').addEventListener('click', () => (zr.offen ? zrSchliessen() : zrOeffnen()));
// Neue Runde → frisches Blatt, Hilfe zu
(() => {
  const alt = zfRundeZeigen;
  zfRundeZeigen = function () { alt(); zrNeu(); zr.rechner = ''; zrMeldung = ''; zr.kugelForm = false; zrSchliessen(); };
})();
