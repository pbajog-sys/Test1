// Dashboard „Spiele“: Einstieg mit allen Quizzes und dem Farb-Gedächtnis als eigenem Game.
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
  const abzeichen = Object.values(badges).filter(Boolean).length;
  const sicher = countSicher(ALLE);
  $('hubStats').innerHTML = '';
  [['🏅', abzeichen, 'Abzeichen'], ['📚', sicher, 'gelernt'], ['🎨', farbBest ? fmt(farbBest) : '–', 'Farb-Rekord']].forEach(([e, z, t]) => {
    const d = document.createElement('div');
    d.className = 'hub-stat';
    d.innerHTML = '<span class="hs-e"></span><b></b><small></small>';
    d.querySelector('.hs-e').textContent = e;
    d.querySelector('b').textContent = z;
    d.querySelector('small').textContent = t;
    $('hubStats').appendChild(d);
  });

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
    b.querySelector('.hc-emoji').textContent = WELTEN[k.welt].emoji;
    if (k.welt === 'dackel') {
      const img = document.createElement('img');
      img.src = GRETCHEN.avatar; img.alt = 'Gretchen';
      b.querySelector('.hc-emoji').replaceChildren(img);
    }
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
  $('hubFarbBest').textContent = farbBest ? 'Rekord ' + fmt(farbBest) + ' / 50' : 'Noch kein Rekord';
  const cello = loadJson('walquiz.cello.v1');
  // cello.js lädt erst nach dem Dashboard – darum die Abzeichen-Symbole hier direkt
  const celloAbz = ['🐴', '🥉', '🥈', '🥇'].map((e, i) => ((cello.badges || {})[i + 1] ? e : '·')).join(' ');
  $('hubCelloBest').textContent = 'Lagen-Abzeichen: ' + celloAbz;
}

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
