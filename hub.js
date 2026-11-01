// Dashboard „Spiele“: Einstieg mit allen Quizzes und dem Farb-Gedächtnis als eigenem Game.
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
  document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0b0b14');
  setAmbient('hub');
}

function renderHub() {
  const store = loadJson(STORE_KEY);
  const badges = store.badges || {};
  const farben = loadJson('walquiz.farben.v1');
  const farbBest = Math.max(0, ...Object.values(farben.best || {}));
  const box = $('hubQuiz');
  box.innerHTML = '';
  HUB_KARTEN.forEach((k, i) => {
    const arten = ALLE.filter((a) => inWelt(a, k.welt));
    const n = countSicher(arten);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hub-card hc-' + k.welt;
    b.style.animationDelay = (0.08 + i * 0.07) + 's';
    b.innerHTML = '<span class="hc-deko"></span><span class="hc-emoji"></span><span class="hc-titel"></span><span class="hc-text"></span>'
      + '<span class="hc-fort"><span class="hc-bar"><i></i></span><small></small></span><span class="hc-badges"></span>';
    b.querySelector('.hc-emoji').appendChild(weltAvatar(k.welt));
    b.querySelector('.hc-titel').textContent = k.titel;
    b.querySelector('.hc-text').textContent = k.text;
    b.querySelector('.hc-bar i').style.width = (n / arten.length * 100) + '%';
    b.querySelector('small').textContent = n + ' / ' + arten.length + ' ' + (k.welt === 'dackel' ? 'Fragen' : k.welt === 'porsche' ? 'Modelle' : 'Arten');
    b.querySelector('.hc-badges').textContent = STUFEN.map((s) => (badges[badgeKey(s.lvl, k.welt)] ? s.emoji : '·')).join(' ');
    b.addEventListener('click', () => zoomZu(b, () => {
      welt = k.welt;
      const st = loadJson(STORE_KEY);
      st.welt = welt;
      saveJson(STORE_KEY, st);
      renderStart();
      show('start');
    }));
    box.appendChild(b);
  });
  // Großer Quiz-Knopf im Dashboard: Foto-Stapel aller Welten und Gesamtstand
  const stapel = $('hubQuizStapel');
  if (!stapel.childElementCount) ['wale', 'haie', 'porsche', 'dackel'].forEach((w, i) => {
    const a = weltAvatar(w);
    a.style.setProperty('--i', i);
    stapel.appendChild(a);
  });
  const abz = Object.values(badges).filter(Boolean).length;
  const gelernt = countSicher(ALLE.filter((a) => !istFrage(a)));
  $('hubQuizStand').textContent = abz || gelernt ? '🏅 ' + abz + ' Abzeichen · 📚 ' + gelernt + ' gelernt' : '5 Welten · Abzeichen 🐴 bis 🥇';
  $('hubFarbBest').textContent = farbBest ? 'Rekord ' + fmt(farbBest) + ' / 50' : 'Noch kein Rekord';
  const cello = loadJson('walquiz.cello.v1');
  // cello.js lädt erst nach dem Dashboard – darum die Abzeichen-Symbole hier direkt
  const celloAbz = ['🐴', '🥉', '🥈', '🥇'].map((e, i) => ((cello.badges || {})[i + 1] ? e : '·')).join(' ');
  $('hubCelloBest').textContent = 'Lagen-Abzeichen: ' + celloAbz;
  const tonBest = Math.max(0, ...Object.values(loadJson('walquiz.toene.v1').best || {}));
  $('hubToeneBest').textContent = tonBest ? 'Rekord ' + fmt(tonBest) + ' / 50' : 'Noch kein Rekord';
  const krimi = loadJson('walquiz.krimi.v1');
  const summe = (o) => Object.values((o && o.geloest) || {}).reduce((x, y) => x + y, 0);
  const faelle = summe(krimi) + Object.values(krimi.modi || {}).reduce((x, m) => x + summe(m), 0);
  $('hubKrimiBest').textContent = (faelle ? '🔎 ' + faelle + (faelle === 1 ? ' Rätsel' : ' Rätsel') + ' gelöst' : 'Noch nichts gelöst') + (krimi.aktenGeloest ? ' · 📁 ' + krimi.aktenGeloest + (krimi.aktenGeloest === 1 ? ' Akte' : ' Akten') : '');
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
  z.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${cs.borderRadius};`
    + `background:${cs.backgroundImage !== 'none' ? cs.backgroundImage + ',' : ''}${cs.backgroundColor}`;
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

$('hubCello').addEventListener('click', () => zoomZu($('hubCello'), () => { show('cello', '🎻 Cello-Noten'); celloIntro(); }));
$('hubFarben').addEventListener('click', () => zoomZu($('hubFarben'), () => { show('farben', '🎨 Farb-Gedächtnis'); farbenIntro(); }));

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
