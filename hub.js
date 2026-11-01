// Dashboard „Spiele“: Weiterspielen, alle Spiele als Cover-Karten, Bestenliste.
// Die Cover sind animiert (nur Bewegung und Transparenz) und pausieren, sobald sie nicht zu sehen sind.
const coverIO = 'IntersectionObserver' in window
  ? new IntersectionObserver((eintraege) => eintraege.forEach((e) => e.target.classList.toggle('sichtbar', e.isIntersecting)), { rootMargin: '40px' })
  : null;
function coverBeobachten() {
  document.querySelectorAll('.cover-bild:not([data-beobachtet]), .story-ring:not([data-beobachtet])').forEach((el) => {
    el.dataset.beobachtet = '1';
    if (coverIO) coverIO.observe(el); else el.classList.add('sichtbar');
  });
}

// ---------- Emoji-Regen und Flip (wie der Emoji-Regen im Instagram-Chat) ----------
function emojiRegen(emojis, anzahl = 18) {
  if (wenigBewegung() || !emojis || !emojis.length) return;
  const box = document.createElement('div');
  box.className = 'emoji-regen';
  document.body.appendChild(box);
  for (let i = 0; i < anzahl; i++) {
    const e = document.createElement('span');
    e.textContent = emojis[i % emojis.length];
    const groesse = 20 + Math.random() * 22;
    e.style.cssText = `left:${Math.random() * 96}vw;font-size:${groesse}px`;
    box.appendChild(e);
    const dreh = (Math.random() - 0.5) * 120;
    e.animate([
      { transform: `translate(0, -12vh) rotate(0deg)`, opacity: 0 },
      { opacity: 1, offset: 0.1 },
      { transform: `translate(${(Math.random() - 0.5) * 60}px, 108vh) rotate(${dreh}deg)`, opacity: 1 },
    ], { duration: 1100 + Math.random() * 700, delay: Math.random() * 450, easing: 'cubic-bezier(.4,.1,.7,1)', fill: 'both' });
  }
  setTimeout(() => box.remove(), 2400);
}
function flip(el) {
  if (wenigBewegung() || !el.animate) return;
  el.animate([{ transform: 'perspective(500px) rotateY(0deg) scale(1)' }, { transform: 'perspective(500px) rotateY(180deg) scale(1.08)' }, { transform: 'perspective(500px) rotateY(360deg) scale(1)' }],
    { duration: 620, easing: 'cubic-bezier(.3,.7,.3,1)' });
}
// Jede Karte mit data-regen lässt beim Antippen passende Emojis regnen
document.addEventListener('click', (e) => {
  const k = e.target.closest('[data-regen]');
  if (!k) return;
  emojiRegen(k.dataset.regen.split(','));
  const id = k.dataset.story || { hubKrimi: 'krimi', hubFarben: 'farben', hubCello: 'cello', hubToene: 'toene' }[k.id];
  if (id) storyGesehen(id);
}, true);

// ---------- Story-Kreise (Schnellstart wie Instagram-Stories) ----------
const GESEHEN_KEY = 'walquiz.gesehen.v1';
const STORIES = [
  { id: 'wale', name: 'Wale', welt: 'wale', regen: '🐋,🐳,🌊,💧' },
  { id: 'haie', name: 'Haie', welt: 'haie', regen: '🦈,🌊,💧' },
  { id: 'beide', name: 'Meer', welt: 'beide', regen: '🐋,🦈,🌊' },
  { id: 'porsche', name: 'Porsche', welt: 'porsche', regen: '🏎️,🏁,💨' },
  { id: 'dackel', name: 'Gretchen', welt: 'dackel', regen: '🐾,🦴,💕' },
  { id: 'krimi', name: 'Krimi', knopf: 'hubKrimi', regen: '🔎,🕵️,🗝️,🕯️' },
  { id: 'farben', name: 'Farben', knopf: 'hubFarben', regen: '🎨,🖌️,🌈,💧' },
  { id: 'cello', name: 'Cello', knopf: 'hubCello', regen: '🎵,🎶,🎻' },
  { id: 'toene', name: 'Töne', knopf: 'hubToene', regen: '🎧,🔊,🎵' },
];
const hubHeute = () => new Date().toISOString().slice(0, 10);   // eigene Version: farben.js lädt erst später
function storyGesehen(id) { const g = loadJson(GESEHEN_KEY); g[id] = hubHeute(); saveJson(GESEHEN_KEY, g); }
function hubStories() {
  const box = $('hubStories');
  const g = loadJson(GESEHEN_KEY), z = loadJson(ZULETZT_KEY);
  const zuletzt = z.typ === 'quiz' ? z.welt : z.typ;
  // zuletzt gespielt zuerst, dann die übrigen in fester Reihenfolge
  const liste = STORIES.slice().sort((a, b) => (b.id === zuletzt) - (a.id === zuletzt));
  box.innerHTML = '';
  liste.forEach((st) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'story' + (g[st.id] === hubHeute() ? ' gesehen' : '');
    b.innerHTML = '<span class="story-ring"><span class="story-bild"></span></span><span class="story-name"></span>';
    const bild = b.querySelector('.story-bild');
    if (st.welt) bild.appendChild(weltKachel(st.welt));
    else {
      const kopie = $(st.knopf).querySelector('.cover-bild').cloneNode(true);
      delete kopie.dataset.beobachtet;
      kopie.classList.add('sichtbar');
      bild.appendChild(kopie);
    }
    if (st.id === zuletzt) {
      const schild = document.createElement('span');
      schild.className = 'story-schild';
      schild.textContent = 'Weiter';
      b.querySelector('.story-ring').appendChild(schild);
    }
    b.querySelector('.story-name').textContent = st.name;
    b.addEventListener('click', () => {
      flip(b.querySelector('.story-ring'));
      if (st.welt) emojiRegen(st.regen.split(','));   // bei Spielen regnet es über deren Karte
      storyGesehen(st.id);
      setTimeout(() => {
        if (st.welt) { setHubTheme(); weltOeffnen(st.welt); } else $(st.knopf).click();
      }, wenigBewegung() ? 0 : 420);
    });
    box.appendChild(b);
  });
}

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
    const kopie = $(g.knopf).querySelector('.cover-bild').cloneNode(true);
    delete kopie.dataset.beobachtet;
    kopie.classList.remove('sichtbar');
    bild.replaceChildren(kopie);
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
  document.title = 'Spielekiste';
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
    b.dataset.regen = STORIES.find((x) => x.welt === k.welt).regen;
    b.dataset.story = k.welt;
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
  // Quiz-Cover: Diashow durch die Welten mit langsamem Kamera-Zoom
  if (!stapel.childElementCount) ['wale', 'haie', 'porsche', 'dackel'].forEach((w, i) => {
    const dia = weltKachel(w);
    dia.classList.add('cb-dia');
    dia.style.setProperty('--i', i);
    const name = document.createElement('span');
    name.className = 'cb-dia-name';
    name.textContent = { wale: 'Wale', haie: 'Haie', porsche: 'Porsche', dackel: 'Dackel' }[w];
    dia.appendChild(name);
    stapel.appendChild(dia);
  });
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
  hubStories();
  if (typeof coverBeobachten === 'function') coverBeobachten();
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
  // Karten gleiten nacheinander herein (einmalig beim Öffnen)
  const hub = $('screen-hub');
  hub.classList.remove('auftritt'); void hub.offsetWidth; hub.classList.add('auftritt');
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

// ---------- „Als App installieren“ ----------
// iPhone/iPad bieten das Installieren nie von selbst an → kurze Anleitung (Teilen → Zum Home-Bildschirm).
// Android/Chrome: echter Installieren-Knopf über beforeinstallprompt.
(() => {
  const KEY = 'walquiz.installhinweis.v1';
  const karte = $('installKarte');
  const installiert = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (installiert || localStorage.getItem(KEY)) return;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) {
    $('installSchritte').innerHTML = 'Tippe auf <span class="teilen-symbol" aria-label="Teilen"><svg viewBox="0 0 20 24" width="14" height="17"><path d="M10 2v13M5.5 6.5 10 2l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H3.5a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 3.5 22h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 10H14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span> „Teilen“ und dann auf <b>„Zum Home-Bildschirm“</b>.';
    karte.hidden = false;
  }
  let angebot = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    angebot = e;
    $('installSchritte').textContent = 'Mit eigenem Symbol, im Vollbild und offline spielbar.';
    $('installLos').hidden = false;
    karte.hidden = false;
  });
  $('installLos').addEventListener('click', async () => {
    if (!angebot) return;
    angebot.prompt();
    const { outcome } = await angebot.userChoice;
    angebot = null;
    if (outcome === 'accepted') { karte.hidden = true; localStorage.setItem(KEY, 'installiert'); }
  });
  $('installZu').addEventListener('click', () => { karte.hidden = true; localStorage.setItem(KEY, 'weg'); });
  window.addEventListener('appinstalled', () => { karte.hidden = true; localStorage.setItem(KEY, 'installiert'); });
})();
