// Dashboard „Spiele“: animierte Bühne mit allen Spielen, Games als Zeilen, Bestenliste.
// Animationen nutzen nur Bewegung und Transparenz und pausieren, sobald sie nicht zu sehen sind.
const coverIO = 'IntersectionObserver' in window
  ? new IntersectionObserver((eintraege) => eintraege.forEach((e) => e.target.classList.toggle('sichtbar', e.isIntersecting)), { rootMargin: '40px' })
  : null;
function coverBeobachten() {
  document.querySelectorAll('.cover-bild:not([data-beobachtet]), .hg-av-quiz .hg-in:not([data-beobachtet]), .buehne:not([data-beobachtet])').forEach((el) => {
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
}, true);

// ---------- Bühne: alle Spiele als kleine animierte Szene, jede Figur ist ein Schnellstart ----------
const WELT_REGEN = { wale: '🐋,🐳,🌊,💧', haie: '🦈,🌊,💧', beide: '🐋,🦈,🌊', porsche: '🏎️,🏁,💨', dackel: '🐾,🦴,💕' };
$('hubBuehne').addEventListener('click', (e) => {
  const d = e.target.closest('.bu-ding');
  if (!d) return;
  flip(d);
  if (d.dataset.ziel) { setTimeout(() => $(d.dataset.ziel).click(), wenigBewegung() ? 0 : 380); return; }   // regnet über die Zeile des Spiels
  emojiRegen(WELT_REGEN[d.dataset.welt].split(','));
  setTimeout(() => weltOeffnen(d.dataset.welt), wenigBewegung() ? 0 : 380);
});

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

// Zuletzt gespielt (je Profil)
const ZULETZT_KEY = 'walquiz.zuletzt.v1';
function merkeZuletzt(typ, welt) { saveJson(ZULETZT_KEY, { typ, welt: welt || null, zeit: Date.now() }); }
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
  document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0b0b14');
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
  HUB_KARTEN.forEach((k, i) => {
    const arten = ALLE.filter((a) => inWelt(a, k.welt));
    const n = countSicher(arten);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hub-card hc-' + k.welt;
    b.style.animationDelay = (0.08 + i * 0.07) + 's';
    b.dataset.regen = WELT_REGEN[k.welt];
    b.innerHTML = '<span class="hc-deko"></span><span class="hc-emoji"></span><span class="hc-titel"></span><span class="hc-text"></span>'
      + '<span class="hc-fort"><span class="hc-bar"><i></i></span><small></small></span><span class="hc-badges"></span>';
    b.querySelector('.hc-emoji').appendChild(weltAvatar(k.welt));
    b.querySelector('.hc-titel').textContent = k.titel;
    b.querySelector('.hc-text').textContent = k.text;
    b.querySelector('.hc-bar i').style.width = (n / arten.length * 100) + '%';
    b.querySelector('small').textContent = n + ' / ' + arten.length + ' ' + (k.welt === 'dackel' ? 'Fragen' : k.welt === 'porsche' ? 'Modelle' : 'Arten');
    b.querySelector('.hc-badges').textContent = STUFEN.map((st) => (badges[badgeKey(st.lvl, k.welt)] ? st.emoji : '·')).join(' ');
    b.addEventListener('click', () => zoomZu(b, () => weltOeffnen(k.welt)));
    box.appendChild(b);
  });
  const stapel = $('hubQuizStapel');
  // Quiz-Zeile: im runden Bild wechseln die Welten mit langsamem Kamera-Zoom
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
  $('hubQuizStand').textContent = abz || gelernt ? '🏅 ' + abz + ' Abzeichen · 📚 ' + gelernt + ' gelernt' : '5 Welten · Abzeichen 🐴 bis 🥇';
  $('hubFarbBest').textContent = farbBest ? 'Rekord ' + fmt(farbBest) + ' / 50' : 'Noch kein Rekord';
  const cello = loadJson('walquiz.cello.v1');
  // cello.js lädt erst nach dem Dashboard – darum die Abzeichen-Symbole hier direkt
  const celloAbz = ['🐴', '🥉', '🥈', '🥇'].map((e, i) => ((cello.badges || {})[i + 1] ? e : '·')).join(' ');
  $('hubCelloBest').textContent = 'Lagen-Abzeichen: ' + celloAbz;
  const tonBest = Math.max(0, ...Object.values(loadJson('walquiz.toene.v1').best || {}));
  $('hubToeneBest').textContent = tonBest ? 'Rekord ' + fmt(tonBest) + ' / 50' : 'Noch kein Rekord';
  const taktSt = loadJson('walquiz.takt.v1');
  const taktBest = Math.max(0, ...Object.values(taktSt.best || {}).flatMap((m) => Object.values(m)), ...Object.values(taktSt.tag || {}));
  $('hubTaktBest').textContent = taktBest ? 'Rekord ' + fmt(taktBest) + ' / 50' : 'Noch kein Rekord';
  const pwSt = loadJson('walquiz.punkte.v1');
  const pwBest = Math.max(0, ...Object.values(pwSt.best || {}).flatMap((m) => Object.values(m)), ...Object.values(pwSt.tag || {}));
  $('hubPunkteBest').textContent = pwBest ? 'Rekord ' + fmt(pwBest) + ' / 50' : 'Noch kein Rekord';
  const rekordVon = (key, verschachtelt) => {
    const st = loadJson(key), b = Object.values(st.best || {});
    return Math.max(0, ...(verschachtelt ? b.flatMap((m) => Object.values(m)) : b), ...Object.values(st.tag || {}));
  };
  [['hubAugenBest', 'walquiz.augen.v1', false], ['hubKarteBest', 'walquiz.karte.v1', true]].forEach(([id, key, v]) => {
    const r = rekordVon(key, v);
    $(id).textContent = r ? 'Rekord ' + fmt(r) + ' / 50' : 'Noch kein Rekord';
  });
  const krimi = loadJson('walquiz.krimi.v1');
  const summe = (o) => Object.values((o && o.geloest) || {}).reduce((x, y) => x + y, 0);
  const faelle = summe(krimi) + Object.values(krimi.modi || {}).reduce((x, m) => x + summe(m), 0);
  $('hubKrimiBest').textContent = (faelle ? '🔎 ' + faelle + ' Rätsel gelöst' : 'Noch nichts gelöst') + (krimi.aktenGeloest ? ' · 📁 ' + krimi.aktenGeloest + (krimi.aktenGeloest === 1 ? ' Akte' : ' Akten') : '');
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
