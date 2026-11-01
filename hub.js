// Dashboard „Spiele“: Weiterspielen, alle Spiele als Cover-Karten, Bestenliste.
// Bewusst ohne Dauer-Animationen – Bewegung gibt es nur als Rückmeldung beim Antippen (spart Akku).
// Gesicht jeder Welt: ein echtes Foto aus dem Quiz (wie Gretchen beim Dackel-Quiz)
const HUB_GESICHT = { wale: 'Buckelwal', haie: 'Weißer Hai', beide: 'Schwertwal', porsche: '911 (993)' };

// Rundes Foto mit Story-Ring. Bis das Foto da ist (oder offline), steht das Emoji drin.
function weltAvatar(w) {
  const ring = document.createElement('span');
  ring.className = 'w-ring w-ring-' + w;
  const innen = document.createElement('span');
  innen.className = 'w-av';
  innen.textContent = WELTEN[w].emoji;
  ring.appendChild(innen);
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.onload = () => innen.replaceChildren(img);
  if (w === 'dackel') { img.src = GRETCHEN.avatar; return ring; }
  const art = ALLE.find((a) => a.name === HUB_GESICHT[w]);
  if (art) loadPhotos(art).then((p) => { if (p && p[0]) img.src = p[0].src; }).catch(() => {});
  return ring;
}

// Kachel fürs Quiz-Cover: Farbfläche der Welt, darüber das Foto, sobald es geladen ist
const WELT_KACHEL_FARBE = { wale: '#0b3a5c', haie: '#2c3a46', beide: '#5a3c74', porsche: '#2a2a2e', dackel: '#e9b8c8' };
function weltKachel(w) {
  const k = document.createElement('span');
  k.className = 'cb-kachel';
  k.style.background = WELT_KACHEL_FARBE[w];
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.onload = () => k.classList.add('geladen');
  k.appendChild(img);
  if (w === 'dackel') img.src = GRETCHEN.avatar;
  else {
    const art = ALLE.find((a) => a.name === HUB_GESICHT[w]);
    if (art) loadPhotos(art).then((p) => { if (p && p[0]) img.src = p[0].src; }).catch(() => {});
  }
  return k;
}

// Begrüßung nach Tageszeit, mit Namen des Profils
function hubGruss() {
  const h = new Date().getHours();
  const zeit = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : h < 22 ? 'Guten Abend' : 'Gute Nacht';
  const name = (typeof aktivesProfil === 'function' && aktivesProfil() && aktivesProfil().name) || loadJson(STORE_KEY).name || '';
  $('hubGruss').textContent = zeit + (name ? ', ' + name : '');
}

// ---------- Weiterspielen: das zuletzt gespielte Spiel ganz oben ----------
const ZULETZT_KEY = 'walquiz.zuletzt.v1';
function merkeZuletzt(typ, welt) { saveJson(ZULETZT_KEY, { typ, welt: welt || null, zeit: Date.now() }); }
const HUB_SPIELE = {
  farben: { titel: 'Farb-Gedächtnis', knopf: 'hubFarben', meta: () => $('hubFarbBest').textContent },
  cello: { titel: 'Cello-Noten', knopf: 'hubCello', meta: () => $('hubCelloBest').textContent },
  toene: { titel: 'Ton-Gedächtnis', knopf: 'hubToene', meta: () => $('hubToeneBest').textContent },
  krimi: { titel: 'Wer war’s?', knopf: 'hubKrimi', meta: () => {
    const st = loadJson('walquiz.krimi.v1');
    const offen = Object.values(st.akten || {}).find((a) => !a.geloest && Object.keys(a.erledigt || {}).length);
    return offen ? 'Akte ' + offen.nr + ' · ' + Object.keys(offen.erledigt).length + ' von 4 Kapiteln' : $('hubKrimiBest').textContent;
  } },
};
function hubWeiterspielen() {
  const z = loadJson(ZULETZT_KEY);
  const box = $('hubWeiter');
  if (!z.typ) { box.hidden = true; return; }
  box.hidden = false;
  const bild = $('hubWeiterBild');
  if (z.typ === 'quiz' && WELTEN[z.welt]) {
    const k = HUB_KARTEN.find((x) => x.welt === z.welt);
    const arten = ALLE.filter((a) => inWelt(a, z.welt));
    $('hubWeiterTitel').textContent = k.titel;
    $('hubWeiterMeta').textContent = countSicher(arten) + ' von ' + arten.length + (z.welt === 'dackel' ? ' Fragen' : z.welt === 'porsche' ? ' Modellen' : ' Arten') + ' sicher';
    bild.replaceChildren(weltKachel(z.welt));
  } else if (HUB_SPIELE[z.typ]) {
    const g = HUB_SPIELE[z.typ];
    $('hubWeiterTitel').textContent = g.titel;
    $('hubWeiterMeta').textContent = g.meta();
    bild.replaceChildren($(g.knopf).querySelector('.cover-bild').cloneNode(true));
  } else box.hidden = true;
}
$('hubWeiterBtn').addEventListener('click', () => {
  const z = loadJson(ZULETZT_KEY);
  if (z.typ === 'quiz') { zoomZu($('hubWeiterBtn'), () => weltOeffnen(z.welt)); return; }
  if (HUB_SPIELE[z.typ]) $(HUB_SPIELE[z.typ].knopf).click();
});
function weltOeffnen(w) {
  welt = w;
  const st = loadJson(STORE_KEY);
  st.welt = welt;
  saveJson(STORE_KEY, st);
  merkeZuletzt('quiz', w);
  renderStart();
  show('start');
}

const HUB_KARTEN = [
  { welt: 'wale', titel: 'Wal-Quiz', text: 'Tiefsee-Riesen erkennen' },
  { welt: 'haie', titel: 'Hai-Quiz', text: 'Vom Weißen Hai bis zum Koboldhai' },
  { welt: 'beide', titel: 'Meeres-Quiz', text: 'Wale und Haie gemischt – die Königsklasse' },
  { welt: 'porsche', titel: 'Porsche-Quiz', text: 'Jede Generation, vom 356 bis zum Taycan' },
  { welt: 'dackel', titel: 'Dackel-Quiz', text: 'Mit Gretchen 🐾' },
];

function setHubTheme() {
  Object.keys(WELTEN).forEach((w) => document.body.classList.remove('theme-' + w));
  document.body.classList.add('theme-hub');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', '#141210');
  setAmbient('hub');
}

function renderHub() {
  const store = loadJson(STORE_KEY);
  const badges = store.badges || {};
  const farben = loadJson('walquiz.farben.v1');
  const farbBest = Math.max(0, ...Object.values(farben.best || {}));
  const box = $('hubQuiz');
  box.innerHTML = '';
  HUB_KARTEN.forEach((k) => {
    const arten = ALLE.filter((a) => inWelt(a, k.welt));
    const n = countSicher(arten);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cover cover-welt hc-' + k.welt;
    b.dataset.zoom = WELT_KACHEL_FARBE[k.welt];
    b.innerHTML = '<span class="cover-bild"></span><span class="cover-text"><b></b><small></small>'
      + '<span class="cover-fort"><i></i></span><small class="cover-stand"></small></span>';
    const bild = b.querySelector('.cover-bild');
    bild.appendChild(weltKachel(k.welt));
    const marke = document.createElement('span');
    marke.className = 'cover-marke';
    marke.textContent = STUFEN.map((st) => (badges[badgeKey(st.lvl, k.welt)] ? st.emoji : '')).join('');
    if (marke.textContent) bild.appendChild(marke);
    b.querySelector('b').textContent = k.titel;
    b.querySelector('small').textContent = k.text;
    b.querySelector('.cover-fort i').style.width = (n / arten.length * 100) + '%';
    b.querySelector('.cover-stand').textContent = n + ' von ' + arten.length + ' ' + (k.welt === 'dackel' ? 'Fragen' : k.welt === 'porsche' ? 'Modellen' : 'Arten') + ' sicher';
    b.addEventListener('click', () => zoomZu(b, () => weltOeffnen(k.welt)));
    box.appendChild(b);
  });
  // Quiz-Cover: Fotomosaik der vier Welten (bis die Fotos da sind: Farbfläche)
  const stapel = $('hubQuizStapel');
  if (!stapel.childElementCount) ['wale', 'haie', 'porsche', 'dackel'].forEach((w) => stapel.appendChild(weltKachel(w)));
  const abz = Object.values(badges).filter(Boolean).length;
  const gelernt = countSicher(ALLE.filter((a) => !istFrage(a)));
  $('hubQuizStand').textContent = abz || gelernt ? abz + (abz === 1 ? ' Abzeichen' : ' Abzeichen') + ' · ' + gelernt + ' sicher erkannt' : '5 Welten · neu';
  $('hubFarbBest').textContent = farbBest ? 'Rekord ' + fmt(farbBest) + ' von 50' : 'Noch kein Rekord';
  const cello = loadJson('walquiz.cello.v1');
  const celloZahl = Object.values(cello.badges || {}).filter(Boolean).length;
  $('hubCelloBest').textContent = celloZahl ? celloZahl + ' von 4 Abzeichen' : 'Noch kein Abzeichen';
  const tonBest = Math.max(0, ...Object.values(loadJson('walquiz.toene.v1').best || {}));
  $('hubToeneBest').textContent = tonBest ? 'Rekord ' + fmt(tonBest) + ' von 50' : 'Noch kein Rekord';
  const krimi = loadJson('walquiz.krimi.v1');
  const summe = (o) => Object.values((o && o.geloest) || {}).reduce((x, y) => x + y, 0);
  const faelle = summe(krimi) + Object.values(krimi.modi || {}).reduce((x, m) => x + summe(m), 0);
  $('hubKrimiBest').textContent = (faelle ? faelle + ' Rätsel gelöst' : 'Noch nichts gelöst') + (krimi.aktenGeloest ? ' · ' + krimi.aktenGeloest + (krimi.aktenGeloest === 1 ? ' Akte' : ' Akten') : '');
  hubGruss();
  hubWeiterspielen();
  if (typeof profilHub === 'function') profilHub();   // profile.js lädt später
}

function zeigeQuizze() {
  setHubTheme();
  renderHub();
  show('quizze');
}
$('hubQuizzes').addEventListener('click', () => zoomZu($('hubQuizzes'), zeigeQuizze));
$('quizzeZurueck').addEventListener('click', zeigeHub);

function zeigeHub() {
  setHubTheme();
  renderHub();
  show('hub');
}

// Übergang: Die angetippte Karte wächst auf den ganzen Bildschirm, dann erscheint das Ziel.
function zoomZu(karte, weiter) {
  if (wenigBewegung() || !karte.animate) { weiter(); return; }
  const r = karte.getBoundingClientRect();
  const cs = getComputedStyle(karte);
  const z = document.createElement('div');
  z.className = 'zoom-layer';
  // Neue Karten (Cover) geben die Farbe des Spiels vor, in das es geht; alte Karten ihren Hintergrund
  const hg = karte.dataset.zoom || ((cs.backgroundImage !== 'none' ? cs.backgroundImage + ',' : '') + cs.backgroundColor);
  z.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${cs.borderRadius || '12px'};background:${hg}`;
  document.body.appendChild(z);
  const W = window.innerWidth, H = window.innerHeight;
  const anim = z.animate([
    { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: cs.borderRadius },
    { left: '0px', top: '0px', width: W + 'px', height: H + 'px', borderRadius: '0px' },
  ], { duration: 420, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
  anim.onfinish = () => {
    weiter();
    z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'forwards' }).onfinish = () => z.remove();
  };
}

$('hubCello').addEventListener('click', () => { merkeZuletzt('cello'); zoomZu($('hubCello'), () => { show('cello', '🎻 Cello-Noten'); celloIntro(); }); });
$('hubFarben').addEventListener('click', () => { merkeZuletzt('farben'); zoomZu($('hubFarben'), () => { show('farben', '🎨 Farb-Gedächtnis'); farbenIntro(); }); });

// Beim Start: Dashboard – außer ein Quiz-Challenge-Link wurde geöffnet, dann direkt in dessen Welt.
if (pendingChallenge) {
  welt = pendingChallenge.welt;
  renderStart();
  show('start');
} else {
  zeigeHub();
}

// Vollbild (Desktop und Android – das iPhone kann das im Browser nicht, dort: „Zum Home-Bildschirm“)
(() => {
  const btn = $('vollbildBtn');
  const el = document.documentElement;
  const kann = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (!kann || window.matchMedia('(display-mode: standalone)').matches) return;
  btn.hidden = false;
  const an = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const zeichnen = () => { btn.textContent = an() ? '✕' : '⛶'; btn.title = an() ? 'Vollbild beenden' : 'Vollbild'; };
  btn.addEventListener('click', () => {
    if (an()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el).catch?.(() => {});
  });
  document.addEventListener('fullscreenchange', zeichnen);
  document.addEventListener('webkitfullscreenchange', zeichnen);
})();
