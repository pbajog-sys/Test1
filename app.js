const TEST_LEN = 10;
const TEST_PASS = 8;           // Punkte für ein Abzeichen (mit Tipp gibt es einen halben Punkt)
const PRACTICE_CHOICES = 6;
const PHOTOS_PER_WAL = 2;
const PHOTO_CANDIDATES = 8;     // so viele Fotos werden je Art gemerkt – als Ersatz, wenn eins aussortiert wird
const SOUND_LVL = 2;           // „Wer ruft da?“ nutzt die Arten bis Bronze – von den seltenen gibt es kaum Aufnahmen
const STORE_KEY = 'walquiz.v2';
const PHOTO_KEY = 'walquiz.photos.v3';
const BLOCK_KEY = 'walquiz.fotosperre.v1';
const CHECK_KEY = 'walquiz.fotogeprueft.v1';
const SOUND_KEY = 'walquiz.sounds.v1';
const STATS_KEY = 'walquiz.stats.v1';

const $ = (id) => document.getElementById(id);
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const fmt = (n) => String(n).replace('.', ',');

// ---------- Welten: Wale, Haie, beide zusammen oder Porsche ----------
// ALLE: Wale, Haie, Porsche, Dackel-Fragen – die Reihenfolge ist Teil der Challenge-Links, darum nur hinten anhängen.
const ALLE = WALE.concat(HAIE, PORSCHE, DACKEL);
Object.assign(GRUPPEN, HAI_GRUPPEN, PORSCHE_GRUPPEN, DACKEL_GRUPPEN);
// Die Dackel-Welt ist ein Wissensquiz: Fragen mit 4 Antworten statt Fotos.
const istFrage = (a) => a.welt === 'dackel';
const WELTEN = {
  wale:  { emoji: '🐋', name: 'Wale',  title: 'Wal-Quiz',    frage: 'Welcher Wal ist das?',
           hero: 'Erkennst du die Wale an ihren Fotos? Übe in Ruhe und mach dann deine Abzeichen – vom Seepferdchen bis Gold.',
           stufen: ['Die bekanntesten Wale', 'Wale, die man oft beobachten kann', 'Fast alle Arten', 'Alle Walarten – auch die seltenen Schnabelwale'] },
  haie:  { emoji: '🦈', name: 'Haie',  title: 'Hai-Quiz',    frage: 'Welcher Hai ist das?',
           hero: 'Erkennst du die Haie an ihren Fotos? Vom Weißen Hai bis zum Koboldhai – übe und hol dir deine Abzeichen.',
           stufen: ['Die bekanntesten Haie', 'Haie, die Taucher oft sehen', 'Fast alle Arten', 'Alle Arten – auch die Tiefseehaie'] },
  beide: { emoji: '🌊', name: 'Beide', title: 'Meeres-Quiz', frage: 'Wal oder Hai – wer ist das?',
           hero: 'Wale und Haie gemischt: Erkennst du alle Riesen des Meeres? Die Abzeichen hier sind die Königsklasse.',
           stufen: ['Die bekanntesten Wale und Haie', 'Oft zu sehen', 'Fast alle Arten', 'Alle Wale und Haie'] },
  porsche: { emoji: '🏎️', name: 'Porsche', title: 'Porsche-Quiz', frage: 'Welcher Porsche ist das?',
           hero: 'Erkennst du jeden Porsche – vom 356 bis zum Taycan, vom G-Modell bis zum 992? Inoffizielles Fan-Quiz.',
           stufen: ['Die bekanntesten Modelle', 'Alle Elfer-Generationen', 'Fast alle Modelle', 'Alle Modelle und Generationen'] },
  dackel: { emoji: '🐕', name: 'Dackel', title: 'Dackel-Quiz', frage: '',
           hero: 'Hi, ich bin Gretchen! 🐾 Wie gut kennst du uns Dackel? Herkunft, Jagd, Fellfarben und Kurioses – vier Antworten, eine stimmt.',
           stufen: ['Grundwissen', 'Für Dackelfreunde', 'Für Kenner', 'Für echte Dackel-Profis'] },
};
let welt = (() => { try { const w = JSON.parse(localStorage.getItem('walquiz.v2') || '{}').welt; return WELTEN[w] ? w : 'wale'; } catch { return 'wale'; } })();
// „Beide“ heißt Wale und Haie zusammen – Porsche bleibt eine eigene Welt.
const inWelt = (a, w = welt) => (w === 'beide' ? a.welt === 'wale' || a.welt === 'haie' : a.welt === w);
const ARTEN = () => ALLE.filter((a) => inWelt(a));
const poolFor = (lvl, w = welt) => ALLE.filter((a) => a.lvl <= lvl && inWelt(a, w));
const WORT = { wale: 'Wale', haie: 'Haie', beide: 'Tiere', porsche: 'Porsche', dackel: 'Fragen' };
const KUNDE = { wale: 'Walkunde', haie: 'Haikunde', beide: 'Meereskunde', porsche: 'Porsche-Kunde', dackel: 'Dackelkunde' };
// So wird eine Art im Satz genannt („Das ist ein …“).
const artenWort = (n = 2) => (welt === 'porsche' ? (n === 1 ? 'Modell' : 'Modelle') : welt === 'dackel' ? (n === 1 ? 'Frage' : 'Fragen') : (n === 1 ? 'Art' : 'Arten'));
const artLabel = (a) => (a.welt === 'porsche' ? 'Porsche ' + a.name : a.name);
const stufeFor = (lvl) => STUFEN.find((s) => s.lvl === lvl);
const stufenText = (lvl, w = welt) => WELTEN[w].stufen[lvl - 1];
// Abzeichen je Welt; die Wale behalten ihre alten Schlüssel (1–4), damit frühere Abzeichen bleiben.
const badgeKey = (lvl, w = welt) => (w === 'wale' ? String(lvl) : w + ':' + lvl);

function loadJson(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
function saveJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function wikiApi(host, params) {
  const q = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', redirects: '1', ...params });
  return fetch('https://' + host + '/w/api.php?' + q).then((r) => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

// ---------- Fotos ----------
// Die Fotos werden direkt auf dem Gerät über die Wikipedia-Schnittstelle gesucht (Bilder aus dem
// Artikel der Art auf Wikimedia Commons) und danach im Gerät gemerkt.
// Echtheit: Bevorzugt werden Bilder mit Kameradaten (EXIF-Hersteller/-Modell). Bilder, die auf Commons
// als KI-generiert, Zeichnung, Gemälde oder 3D-Modell einsortiert sind, werden nie genommen.
// In der Prüf-Ansicht aussortierte Fotos landen in der Sperrliste dieses Geräts. Für alle Geräte gilt fotos.json:
// „sperre“ = Fotos, die nie gezeigt werden, „wahl“ = pro Art fest gewählte Commons-Fotos, die zuerst kommen.
const photoCache = loadJson(PHOTO_KEY);
const photoBlock = loadJson(BLOCK_KEY);
let FOTO_SPERRE = [];
let FOTO_WAHL = {};
const fotosBereit = fetch('fotos.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : {}))
  .catch(() => ({}))
  .then((d) => {
    FOTO_SPERRE = d.sperre || [];
    FOTO_WAHL = d.wahl || {};
    FOTO_SPERRE.forEach((n) => { photoBlock[n] = true; });
  });
// Dateinamen für URLs kodieren – auch Klammern, sonst brechen Markdown-Links in den Meldungen.
const urlName = (name) => encodeURIComponent(name).replace(/\(/g, '%28').replace(/\)/g, '%29');
// Ein Commons-Foto nur über seinen Dateinamen – ohne Suche, Commons liefert die passende Größe.
const commonsFoto = (name) => ({
  src: 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urlName(name) + '?width=960',
  page: 'https://commons.wikimedia.org/wiki/File:' + urlName(name),
  name, echt: true, fest: true,
});
const photoChecked = loadJson(CHECK_KEY);
const photoInflight = {};
const BAD_FILE = /skelet|skull|schädel|cranium|crania|\bmap|range|distribution|verbreitung|size|scale|comparison|vergleich|stamp|briefmarke|museum|model|drawing|zeichnung|illustrat|plate|painting|engrav|lithograph|whaling|harpoon|carcass|bone|jaw|teeth|baleen|fetus|foetus|embryo|logo|flag|coin|sculpt|statue|diagram|chart|book|specimen|preserved|replica|dissect|meat|fleisch|market|fossil|vertebra|anatomy|sound|spectrogram/i;
const BAD_CATEGORY = /AI-generated|artificial intelligence|Midjourney|DALL-E|Stable Diffusion|computer-generated|CGI|3D render|3D model|renders|illustrations|drawings|paintings|engravings|lithographs|scientific illustrations|clip ?art|diagrams|maps|stamps|skeletons|skulls|museum specimens/i;
const MEH_FILE = /dead|stranded|strandung|beached|necropsy|corpse|caught|fishing|landed|bycatch/i;
// Die angezeigten Fotos einer Art: fest gewählte zuerst, dann die besten noch nicht aussortierten Kandidaten
// (null = es muss erst gesucht werden).
function photosFor(w) {
  const fest = (FOTO_WAHL[w.id] || []).map(commonsFoto).filter((p) => !photoBlock[p.name]);
  if (!photoCache[w.id]) return fest.length >= PHOTOS_PER_WAL ? fest.slice(0, PHOTOS_PER_WAL) : null;
  const rest = photoCache[w.id].filter((p) => !photoBlock[p.name] && !fest.some((f) => f.name === p.name));
  return fest.concat(rest).slice(0, PHOTOS_PER_WAL);
}
const hasNoPhotos = (w) => { const p = photosFor(w); return p !== null && !p.length; };

function hasCameraData(ii) {
  return (ii.commonmetadata || []).some((m) => (m.name === 'Make' || m.name === 'Model') && String(m.value).trim());
}

// Bei Autos sind Museen, Modell-Bezeichnungen usw. normal – dafür fliegen Innenraum, Motor, Felgen, Spielzeugautos raus.
const BAD_CAR_FILE = /interior|innenraum|cockpit|dashboard|armatur|engine|motor|wheel|felge|\brim\b|badge|logo|emblem|crest|wappen|\bkey|seat|sitz|steering|lenkrad|toy|lego|scale.?model|modellauto|diecast|drawing|sketch|diagram|chart|brochure|prospekt|poster|stamp|crash|wreck|unfall|replica|nachbau/i;
const MEH_CAR_FILE = /race|rennen|racing|rally|rallye|tuning|tuned|modified|umbau|conversion|ruf_|singer|gemballa|techart|mansory|police|polizei/i;

function filePhoto(f, leadName, art) {
  const ii = f.imageinfo && f.imageinfo[0];
  const name = f.title.replace(/^[^:]+:/, '').replace(/ /g, '_');
  if (!ii || ii.mime !== 'image/jpeg' || ii.width < 500 || ii.height < 300) return null;
  const cats = (ii.extmetadata && ii.extmetadata.Categories && ii.extmetadata.Categories.value) || '';
  const auto = art.welt === 'porsche';
  if ((auto ? BAD_CAR_FILE : BAD_FILE).test(name) || BAD_CATEGORY.test(cats)) return null;
  const echt = hasCameraData(ii);
  // Reihenfolge: echte Fotos zuerst, dann keine toten/gefangenen Tiere bzw. Renn-/Tuning-Autos, dann das Hauptbild.
  const meh = (auto ? MEH_CAR_FILE : MEH_FILE).test(name);
  const rank = (echt ? 0 : 4) + (meh ? 2 : 0) + (name === leadName ? 0 : 1) + Math.random() * 0.5;
  return { src: ii.thumburl || ii.url, page: ii.descriptionurl, name, echt, rank };
}
const IMAGE_INFO = { prop: 'imageinfo', iiprop: 'url|mime|size|extmetadata|commonmetadata', iiextmetadatafilter: 'Categories', iiurlwidth: '960' };

async function articlePhotos(host, title, art) {
  const [lead, list] = await Promise.all([
    wikiApi(host, { titles: title, prop: 'pageimages', piprop: 'name' }).catch(() => null),
    wikiApi(host, { titles: title, generator: 'images', gimlimit: '50', ...IMAGE_INFO }),
  ]);
  const page = lead && lead.query && lead.query.pages && lead.query.pages[0];
  const leadName = page && page.pageimage;
  return ((list && list.query && list.query.pages) || []).map((f) => filePhoto(f, leadName, art)).filter(Boolean);
}

async function categoryPhotos(category, art) {
  const list = await wikiApi('commons.wikimedia.org', { generator: 'categorymembers', gcmtitle: category, gcmtype: 'file', gcmlimit: '50', ...IMAGE_INFO });
  return ((list && list.query && list.query.pages) || []).map((f) => filePhoto(f, null, art)).filter(Boolean);
}

// Woher die Fotos kommen: Tiere aus dem englischen, notfalls deutschen Artikel;
// Porsche aus der Quellenliste des Modells (Artikel oder Commons-Kategorie), der Reihe nach.
function photoSources(art) {
  if (art.quellen) {
    return art.quellen.map((q) => {
      const [kind, ...rest] = q.split(':');
      const title = rest.join(':');
      return kind === 'commons' ? () => categoryPhotos(title, art) : () => articlePhotos(kind + '.wikipedia.org', title, art);
    });
  }
  return [() => articlePhotos('en.wikipedia.org', art.wiki, art), () => articlePhotos('de.wikipedia.org', art.latin, art)];
}

function loadPhotos(wal) {
  if (istFrage(wal)) return Promise.resolve([]);
  return fotosBereit.then(() => photosFor(wal) || suchePhotos(wal));
}
function suchePhotos(wal) {
  if (photoInflight[wal.id]) return photoInflight[wal.id];
  photoInflight[wal.id] = (async () => {
    const found = [];
    let failed = 0;
    const sources = photoSources(wal);
    for (const source of sources) {
      if (found.filter((f) => f.echt).length >= PHOTOS_PER_WAL) break;
      // Die erste Quelle darf scheitern (dann ist man wohl offline → Fehler anzeigen); spätere werden übersprungen.
      const got = await source().catch((e) => { failed++; if (failed === sources.length) throw e; return []; });
      got.forEach((p) => { if (!found.some((f) => f.name === p.name)) found.push(p); });
    }
    found.sort((a, b) => a.rank - b.rank);
    photoCache[wal.id] = found.slice(0, PHOTO_CANDIDATES).map(({ src, page, name, echt }) => ({ src, page, name, echt }));
    saveJson(PHOTO_KEY, photoCache);
    return photosFor(wal);
  })().finally(() => { delete photoInflight[wal.id]; });
  return photoInflight[wal.id];
}

function preloadWal(wal) {
  if (!wal) return;
  loadPhotos(wal).then((p) => p.forEach((ph) => { const i = new Image(); i.src = ph.src; })).catch(() => {});
}

// ---------- Geräusche ----------
// Aufnahmen werden auf Wikimedia Commons gesucht. iPhones spielen kein Ogg, darum wird die
// MP3-Fassung genommen, die Commons zu jeder Tondatei erzeugt, sofern das Gerät sie braucht.
const soundCache = loadJson(SOUND_KEY);
const soundInflight = {};
const BAD_SOUND = /pronunc|aussprache|spoken|wikipedia|^File:(LL-|En-|De-|Fr-|Nl-|Es-|It-|Pt-|Ru-|Pl-|Sv-|Da-|Nb-|Fi-|Cs-|Ja-|Zh-)/i;
const player = new Audio();
player.preload = 'none';
const hasNoSound = (w) => Array.isArray(soundCache[w.id]) && !soundCache[w.id].length;

function playableSource(vi) {
  const candidates = [{ src: vi.url, type: vi.mime }, ...(vi.derivatives || [])]
    .filter((c) => c.src && c.type && c.type.startsWith('audio/'));
  candidates.sort((a, b) => (b.type.includes('mpeg') ? 1 : 0) - (a.type.includes('mpeg') ? 1 : 0));
  return candidates.find((c) => player.canPlayType(c.type.split(';')[0]) !== '') || null;
}

async function searchSounds(query) {
  const res = await wikiApi('commons.wikimedia.org', {
    generator: 'search', gsrsearch: query + ' filetype:audio', gsrnamespace: '6', gsrlimit: '15',
    prop: 'videoinfo', viprop: 'url|mime|size|derivatives',
  });
  const out = [];
  ((res.query && res.query.pages) || []).sort((a, b) => (a.index || 0) - (b.index || 0)).forEach((p) => {
    const vi = p.videoinfo && p.videoinfo[0];
    if (!vi || BAD_SOUND.test(p.title)) return;
    if (vi.duration && (vi.duration < 1.5 || vi.duration > 600)) return;
    const src = playableSource(vi);
    if (src) out.push({ src: src.src, page: vi.descriptionurl || 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(p.title) });
  });
  return out;
}

function loadSounds(wal) {
  if (soundCache[wal.id]) return Promise.resolve(soundCache[wal.id]);
  if (soundInflight[wal.id]) return soundInflight[wal.id];
  soundInflight[wal.id] = (async () => {
    let found = await searchSounds('"' + wal.latin + '"');
    if (!found.length) found = await searchSounds('"' + wal.wiki + '"');
    soundCache[wal.id] = found.slice(0, 3);
    saveJson(SOUND_KEY, soundCache);
    return soundCache[wal.id];
  })().finally(() => { delete soundInflight[wal.id]; });
  return soundInflight[wal.id];
}

let playingBtn = null;
function stopSound() {
  player.pause();
  if (playingBtn) playingBtn.classList.remove('playing');
  playingBtn = null;
}
function toggleSound(snd, btn) {
  if (playingBtn === btn && !player.paused) { stopSound(); return; }
  stopSound();
  player.src = snd.src;
  player.currentTime = 0;
  playingBtn = btn;
  btn.classList.add('playing');
  player.play().catch(() => { btn.classList.remove('playing'); });
}
player.addEventListener('ended', stopSound);

// Knopf „Ruf anhören“, der die Aufnahme erst beim ersten Tippen sucht.
function soundButton(wal, label = '🔊 Ruf anhören') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sound-btn';
  btn.textContent = label;
  if (hasNoSound(wal)) { btn.disabled = true; btn.textContent = '🔇 Keine Aufnahme gefunden'; }
  btn.addEventListener('click', () => {
    btn.disabled = true;
    loadSounds(wal).then((snds) => {
      if (!snds.length) { btn.textContent = '🔇 Keine Aufnahme gefunden'; return; }
      btn.disabled = false;
      toggleSound(snds[0], btn);
    }).catch(() => { btn.disabled = false; btn.textContent = '⚠️ Nicht geladen – nochmal'; });
  });
  return btn;
}

// ---------- Lernstand (Wiederholung wie im Karteikasten) ----------
// Jede Art liegt in einem Fach 0–5. Richtig ohne Tipp: ein Fach weiter. Falsch: zurück in Fach 0.
// Arten in niedrigen Fächern kommen beim Üben viel öfter dran. Ab Fach 3 gilt eine Art als „sicher“.
const stats = loadJson(STATS_KEY);
const FACH_GEWICHT = [8, 5, 3, 2, 1, 0.5];
const SICHER_AB = 3;
const fach = (w) => (stats[w.id] ? stats[w.id].fach : 0);
const isSicher = (w) => fach(w) >= SICHER_AB;
const countSicher = (list) => list.filter(isSicher).length;

function recordAnswer(wal, ergebnis) {
  const s = stats[wal.id] || { fach: 0, richtig: 0, falsch: 0 };
  if (ergebnis === 'richtig') { s.fach = Math.min(5, s.fach + 1); s.richtig++; }
  else if (ergebnis === 'falsch') { s.fach = 0; s.falsch++; }
  stats[wal.id] = s;
  saveJson(STATS_KEY, stats);
}

function pickWeighted(pool, recent, exclude) {
  let cand = pool.filter((w) => !recent.includes(w) && !exclude(w));
  if (!cand.length) cand = pool.filter((w) => !exclude(w));
  if (!cand.length) return null;
  const total = cand.reduce((sum, w) => sum + FACH_GEWICHT[fach(w)], 0);
  let r = Math.random() * total;
  for (const w of cand) { r -= FACH_GEWICHT[fach(w)]; if (r <= 0) return w; }
  return cand[cand.length - 1];
}

// ---------- Antwortprüfung für den Test ----------
function normalize(s) {
  return s.toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/ph/g, 'f')
    .replace(/[^a-z0-9]/g, '');
}
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return dp[a.length][b.length];
}
const answerNames = (w) => [w.name, ...w.auch, w.latin, w.wiki].filter(Boolean).map(normalize);
const tolerance = (n) => (n.length >= 10 ? 2 : n.length >= 5 ? 1 : 0);
// Ergebnis: 'exact' | 'typo' | 'reihe' (nur die Porsche-Baureihe, z. B. „Cayenne“) | 'wrong'
function checkAnswer(input, wal) {
  let given = normalize(input);
  if (wal.welt === 'porsche') given = given.replace(/^porsche/, '');
  if (!given) return 'wrong';
  const names = answerNames(wal);
  if (names.includes(given)) return 'exact';
  if (wal.reihen && wal.reihen.map(normalize).includes(given)) return 'reihe';
  const best = Math.min(...names.map((n) => (levenshtein(given, n) <= tolerance(n) ? levenshtein(given, n) : Infinity)));
  if (best === Infinity) return 'wrong';
  // Kleine Tippfehler sind erlaubt – aber nicht, wenn die Eingabe genauso gut zu einer anderen Art passt.
  const other = ALLE.some((w) => w !== wal && !istFrage(w) && answerNames(w).some((n) => levenshtein(given, n) <= best));
  return other ? 'wrong' : 'typo';
}

// ---------- Challenge-Links ----------
// Ein Link enthält Welt, Stufe, die 10 Arten (als Position in ALLE), Name und Punkte der Herausforderin/des Herausforderers.
function encodeChallenge(c) {
  const json = JSON.stringify({ x: c.welt, l: c.lvl, w: c.wale.map((w) => ALLE.indexOf(w)), n: c.name, p: c.points });
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeChallenge(str) {
  try {
    const json = decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
    const c = JSON.parse(json);
    const wale = (c.w || []).map((i) => ALLE[i]).filter(Boolean);
    if (!stufeFor(c.l) || !wale.length) return null;
    return { welt: WELTEN[c.x] ? c.x : 'wale', lvl: c.l, wale, name: String(c.n || 'Jemand').slice(0, 30), points: Number(c.p) || 0 };
  } catch { return null; }
}
let pendingChallenge = (() => {
  const c = new URLSearchParams(location.search).get('c');
  if (!c) return null;
  history.replaceState(null, '', location.pathname);
  return decodeChallenge(c);
})();

// ---------- Navigation ----------
const screens = ['start', 'pick', 'quiz', 'result', 'lexikon', 'pruefen'];
function show(name, title) {
  stopSound();
  screens.forEach((s) => $('screen-' + s).classList.toggle('active', s === name));
  $('homeBtn').hidden = name === 'start';
  $('headerTitle').textContent = title || WELTEN[welt].title;
  window.scrollTo(0, 0);
}
$('homeBtn').addEventListener('click', () => { renderStart(); show('start'); });
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
  const go = b.dataset.go;
  if (go === 'lexikon') { renderLexikon(); show('lexikon', WELTEN[welt].emoji + ' Lexikon'); }
  else if (go === 'sound') startQuiz('sound', SOUND_LVL);
  else renderPick(go === 'pick-test' ? 'test' : 'practice');
}));
document.querySelectorAll('[data-welt]').forEach((b) => b.addEventListener('click', () => {
  welt = b.dataset.welt;
  const store = loadJson(STORE_KEY);
  store.welt = welt;
  saveJson(STORE_KEY, store);
  renderStart();
}));

// Jede Welt hat ihr eigenes Design (stil.css) und ihre eigene Kulisse (effekte.js).
function applyTheme() {
  Object.keys(WELTEN).forEach((w) => document.body.classList.toggle('theme-' + w, w === welt));
  document.querySelector('meta[name="theme-color"]').setAttribute('content', WELT_FARBE[welt]);
  setAmbient(welt);
  requestAnimationFrame(positionPill);
}

function renderStart() {
  const store = loadJson(STORE_KEY);
  const badges = store.badges || {};
  const W = WELTEN[welt];
  const arten = ARTEN();
  document.title = W.title;
  $('headerTitle').textContent = W.title;
  $('heroTitle').textContent = W.title;
  $('heroText').textContent = W.hero;
  document.querySelectorAll('[data-welt]').forEach((b) => b.classList.toggle('on', b.dataset.welt === welt));
  applyTheme();
  $('heroLogo').hidden = welt === 'porsche' || welt === 'dackel';
  $('heroEmoji').hidden = welt !== 'porsche';
  gretchenStart(welt === 'dackel');
  $('heroEmoji').textContent = W.emoji;
  $('soundMenu').hidden = !['wale', 'beide'].includes(welt);
  $('practiceSub').textContent = welt === 'dackel' ? 'Fragen mit 4 Antworten – was du falsch hast, kommt öfter'
    : '2 Fotos ansehen, aus 6 Antworten wählen – was du falsch hast, kommt öfter';
  $('practiceEmoji').textContent = W.emoji;
  $('testSub').textContent = welt === 'dackel' ? TEST_LEN + ' Fragen – der 50:50-Joker kostet einen halben Punkt'
    : TEST_LEN + ' ' + WORT[welt] + ', Namen selbst eintippen';
  $('lexSub').textContent = 'Alle ' + arten.length + ' ' + artenWort()
    + (welt === 'dackel' ? ' mit Antwort und Erklärung' : welt === 'porsche' ? ' mit Steckbrief' : ' mit Steckbrief und Größenvergleich');
  const n = countSicher(arten);
  $('learnText').textContent = 'Gelernt: ' + n + ' von ' + arten.length + ' ' + artenWort() + ' sicher';
  $('learnBar').style.width = (n / arten.length * 100) + '%';

  const box = $('challengeBox');
  box.hidden = !pendingChallenge;
  if (pendingChallenge) {
    const c = pendingChallenge;
    $('challengeText').textContent = c.name + ' fordert dich heraus: ' + WELTEN[c.welt].title + ', ' + stufeFor(c.lvl).emoji + ' ' + stufeFor(c.lvl).name
      + ' mit ' + fmt(c.points) + ' von ' + c.wale.length + ' Punkten. Schaffst du mehr?';
  }

  $('badges').innerHTML = '';
  STUFEN.forEach((s) => {
    const d = document.createElement('div');
    d.className = 'badge' + (badges[badgeKey(s.lvl)] ? ' earned' : '');
    d.innerHTML = '<span class="b-icon"></span><span></span>';
    d.firstChild.textContent = s.emoji;
    d.lastChild.textContent = s.name;
    $('badges').appendChild(d);
  });
}
$('challengeGo').addEventListener('click', () => {
  const c = pendingChallenge;
  pendingChallenge = null;
  welt = c.welt;
  startQuiz('test', c.lvl, { deck: c.wale, challenge: c });
});
$('challengeNo').addEventListener('click', () => { pendingChallenge = null; renderStart(); });

function renderPick(mode) {
  const store = loadJson(STORE_KEY);
  const badges = store.badges || {};
  $('pickTitle').textContent = mode === 'test'
    ? 'Welches Abzeichen willst du machen? Du brauchst ' + TEST_PASS + ' von ' + TEST_LEN + ' Punkten.'
    : 'Welche Wale willst du üben? Was du oft falsch hast, kommt öfter dran.';
  const list = $('pickList');
  list.innerHTML = '';
  STUFEN.forEach((s) => {
    const pool = poolFor(s.lvl);
    const b = document.createElement('button');
    b.className = 'menu-btn' + (badges[badgeKey(s.lvl)] ? ' earned' : '');
    const best = store.best && store.best[badgeKey(s.lvl)];
    b.innerHTML = '<span class="emoji"></span><span class="txt"><strong></strong><span class="sub"></span></span><span class="right"></span>';
    b.querySelector('.emoji').textContent = s.emoji;
    b.querySelector('strong').textContent = s.name;
    b.querySelector('.sub').textContent = stufenText(s.lvl) + ' · ' + pool.length + ' ' + artenWort();
    b.querySelector('.right').textContent = mode === 'test'
      ? (badges[badgeKey(s.lvl)] ? '✅ geschafft' : best != null ? 'Bestes: ' + fmt(best) : '')
      : countSicher(pool) + '/' + pool.length + ' sicher';
    b.addEventListener('click', () => startQuiz(mode, s.lvl));
    list.appendChild(b);
  });
  show('pick', (mode === 'test' ? 'Abzeichen-Test' : 'Üben') + ' ' + WELTEN[welt].emoji);
}

// ---------- Galerie ----------
let galToken = 0;
function renderGallery(wal, onReady) {
  const token = ++galToken;
  const gal = $('gallery');
  gal.innerHTML = '';
  gal.scrollLeft = 0;
  $('dots').innerHTML = '';
  $('galMsg').hidden = true;
  $('galPrev').hidden = $('galNext').hidden = true;
  const slide = document.createElement('div');
  slide.className = 'slide';
  gal.appendChild(slide);

  loadPhotos(wal).then((photos) => {
    if (token !== galToken) return;
    gal.innerHTML = '';
    if (!photos.length) { onReady(photos); return; }
    photos.forEach((p, i) => {
      const s = document.createElement('div');
      s.className = 'slide';
      const img = document.createElement('img');
      img.alt = 'Foto ' + (i + 1) + ' von ' + photos.length;
      img.onload = () => { img.classList.add('loaded'); s.classList.add('done'); };
      img.onerror = () => { s.classList.add('done'); };
      img.src = p.src;
      s.appendChild(img);
      // ⚑ direkt im Foto: meldet genau dieses Foto mit einem Tipp
      const flag = document.createElement('button');
      flag.type = 'button';
      flag.className = 'gal-flag';
      flag.textContent = '⚑';
      flag.setAttribute('aria-label', 'Foto ' + (i + 1) + ' melden');
      flag.addEventListener('click', (e) => {
        e.stopPropagation();
        if (s.classList.contains('gemeldet')) return;
        fotoDirektMelden(wal, p, photos);
        s.classList.add('gemeldet');
        flag.textContent = '✓ Gemeldet';
      });
      s.appendChild(flag);
      gal.appendChild(s);
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Foto ' + (i + 1));
      dot.addEventListener('click', () => gal.scrollTo({ left: i * gal.clientWidth, behavior: 'smooth' }));
      $('dots').appendChild(dot);
    });
    updateDots();
    onReady(photos);
  }).catch(() => {
    if (token !== galToken) return;
    gal.innerHTML = '';
    showGalMsg('Die Fotos konnten nicht geladen werden. Bist du online?', () => renderGallery(wal, onReady));
  });
}
function showGalMsg(text, retry) {
  const msg = $('galMsg');
  msg.innerHTML = '<div></div>';
  msg.firstChild.textContent = text;
  if (retry) {
    const b = document.createElement('button');
    b.className = 'btn secondary';
    b.type = 'button';
    b.textContent = 'Nochmal versuchen';
    b.addEventListener('click', retry);
    msg.appendChild(b);
  }
  msg.hidden = false;
}
function galIndex() { const g = $('gallery'); return g.clientWidth ? Math.round(g.scrollLeft / g.clientWidth) : 0; }
function updateDots() {
  const n = $('gallery').querySelectorAll('img').length;
  const i = galIndex();
  [...$('dots').children].forEach((d, k) => d.classList.toggle('on', k === i));
  $('galPrev').hidden = n < 2 || i === 0;
  $('galNext').hidden = n < 2 || i >= n - 1;
}
$('gallery').addEventListener('scroll', () => requestAnimationFrame(updateDots), { passive: true });
$('galPrev').addEventListener('click', () => { const g = $('gallery'); g.scrollTo({ left: (galIndex() - 1) * g.clientWidth, behavior: 'smooth' }); });
$('galNext').addEventListener('click', () => { const g = $('gallery'); g.scrollTo({ left: (galIndex() + 1) * g.clientWidth, behavior: 'smooth' }); });

// ---------- Tipps ----------
function tipsFor(wal) {
  if (istFrage(wal)) return [['Erklärung', wal.erklaerung]];
  if (wal.welt === 'porsche') {
    return [
      ['Gruppe', GRUPPEN[wal.gruppe]],
      ['Bauzeit', wal.bauzeit],
      ['Motor', wal.motor],
      ['Merkmal', wal.merkmal],
    ];
  }
  return [
    ['Gruppe', GRUPPEN[wal.gruppe]],
    ['Größe', 'bis ' + wal.laenge + (wal.gewicht !== '?' ? ', bis ' + wal.gewicht : '')],
    ['Wo er lebt', wal.gebiet],
    ['Merkmal', wal.merkmal],
  ];
}
function factsList(wal, dl, count = 4) {
  dl.innerHTML = '';
  tipsFor(wal).slice(0, count).forEach(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  });
}
function updateTipBtn() {
  const joker = istFrage(currentWal());
  const used = state.tips, max = joker ? 1 : tipsFor(currentWal()).length;
  const btn = $('tipBtn');
  btn.disabled = state.locked || used >= max;
  btn.textContent = (joker ? '🎲 50:50' : '💡 Tipp ' + (used ? used + '/' + max : '')) + (state.mode === 'test' && !used ? ' (−½ Punkt)' : '');
}
$('tipBtn').addEventListener('click', () => {
  if (state.locked) return;
  const wal = currentWal();
  if (istFrage(wal)) {
    // 50:50-Joker: zwei falsche Antworten verschwinden.
    if (state.tips) return;
    state.tips = 1;
    shuffle([...$('choices').children].filter((b) => b.dataset.id !== wal.id)).slice(0, 2).forEach((b) => { b.disabled = true; b.classList.add('gone'); });
    updateTipBtn();
    return;
  }
  const tips = tipsFor(wal);
  if (state.tips >= tips.length) return;
  const [label, text] = tips[state.tips++];
  const li = document.createElement('li');
  li.innerHTML = '<b></b> ';
  li.firstChild.textContent = label + ':';
  li.appendChild(document.createTextNode(text));
  if (label === 'Größe') li.insertAdjacentHTML('beforeend', groessenSvg(wal));
  $('tips').appendChild(li);
  updateTipBtn();
});

// ---------- Quiz ----------
// Modi: 'practice' (Fotos, 6 Antworten, Karteikasten), 'test' (Fotos, Eintippen), 'sound' (Ruf, 6 Antworten)
let state = null;

function startQuiz(mode, lvl, opts = {}) {
  // Rufe gibt es nur von Walen.
  const pool = mode === 'sound' ? poolFor(lvl, 'wale') : poolFor(lvl);
  const s = { mode, lvl, pool, index: 0, points: 0, answered: 0, log: [], locked: false, tips: 0, skips: 0, spare: [], challenge: opts.challenge || null };
  if (mode === 'test') {
    const deck = opts.deck ? opts.deck.slice() : shuffle(pool);
    s.deck = deck.slice(0, TEST_LEN);
    s.spare = opts.deck ? [] : deck.slice(TEST_LEN);
  } else {
    s.deck = [];
  }
  state = s;
  applyTheme();
  if (mode !== 'test') { growDeck(); growDeck(); }
  // Im Dackel-Quiz wird auch im Test angeklickt statt getippt.
  const tippen = mode === 'test' && welt !== 'dackel';
  $('choices').hidden = tippen;
  $('answerForm').hidden = !tippen;
  $('soundBox').hidden = mode !== 'sound';
  $('questionText').textContent = mode === 'sound' ? 'Wer ruft da?' : WELTEN[welt].frage;
  const title = mode === 'sound' ? 'Wer ruft da?' : (mode === 'test' ? 'Test: ' : 'Üben: ') + stufeFor(lvl).name;
  show('quiz', state.challenge ? 'Challenge von ' + state.challenge.name : title);
  nextQuestion();
}

// Üben und Hören laufen endlos: Es wird immer eine Art im Voraus gezogen (für das Vorladen).
function growDeck() {
  const recent = state.deck.slice(-Math.min(3, state.pool.length - 1));
  const exclude = state.mode === 'sound' ? hasNoSound : hasNoPhotos;
  const w = state.mode === 'sound'
    ? (shuffle(state.pool.filter((x) => !recent.includes(x) && !exclude(x)))[0] || null)
    : pickWeighted(state.pool, recent, exclude);
  if (w) state.deck.push(w);
}

function currentWal() { return state.deck[state.index]; }

function nextQuestion() {
  if (state.mode === 'test' && state.index >= state.deck.length) return showResult();
  if (state.mode !== 'test') while (state.deck.length < state.index + 2) { const n = state.deck.length; growDeck(); if (state.deck.length === n) break; }
  const wal = currentWal();
  if (!wal) { showNothingFound(); return; }
  stopSound();
  state.locked = true;   // erst freigeben, wenn Fotos bzw. Ton da sind
  state.tips = 0;

  if (state.mode === 'test') {
    $('qCounter').textContent = 'Frage ' + (state.index + 1) + ' von ' + state.deck.length;
    $('qBar').style.width = (state.index / state.deck.length * 100) + '%';
  } else if (state.mode === 'practice') {
    const n = countSicher(state.pool);
    $('qCounter').textContent = n + ' von ' + state.pool.length + ' ' + artenWort() + ' sicher';
    $('qBar').style.width = (n / state.pool.length * 100) + '%';
  } else {
    $('qCounter').textContent = 'Hör-Runde';
    $('qBar').style.width = '0';
  }
  $('qScore').textContent = state.answered ? fmt(state.points) + ' / ' + state.answered + ' Punkte' : '';
  $('qCredit').textContent = '';   // Quelle erst nach der Antwort – der Dateiname verrät sonst die Art
  $('tips').innerHTML = '';
  $('feedback').className = 'feedback';
  $('nextRow').className = 'next-row';
  $('choices').innerHTML = '';
  $('answerInput').value = '';
  $('fbExtra').innerHTML = '';
  updateTipBtn();

  const ready = () => {
    state.skips = 0;
    state.locked = false;
    updateTipBtn();
    if (state.mode === 'test' && !istFrage(wal)) {
      $('answerInput').disabled = false;
      $('answerForm').querySelector('button').disabled = false;
      $('answerInput').focus({ preventScroll: true });
    } else renderChoices(wal);
  };

  if (istFrage(wal)) {
    $('galleryArea').hidden = true;
    $('questionText').textContent = wal.frage;
    gretchenFrage();
    ready();
  } else if (state.mode === 'sound') {
    $('galleryArea').hidden = true;
    const play = $('playBtn');
    play.disabled = true;
    play.classList.remove('playing');
    $('soundHint').textContent = 'Aufnahme wird gesucht …';
    loadSounds(wal).then((snds) => {
      if (wal !== currentWal()) return;
      if (!snds.length) return skipWal();
      play.disabled = false;
      $('soundHint').textContent = 'Tippe zum Abspielen';
      play.onclick = () => toggleSound(snds[0], play);
      ready();
    }).catch(() => {
      $('soundHint').textContent = 'Die Aufnahme konnte nicht geladen werden. Bist du online?';
      play.disabled = false;
      play.onclick = () => nextQuestion();
    });
    loadSounds(state.deck[state.index + 1] || wal).catch(() => {});
  } else {
    gretchenAus();
    $('galleryArea').hidden = false;
    renderGallery(wal, (photos) => { if (!photos.length) skipWal(); else ready(); });
    preloadWal(state.deck[state.index + 1]);
  }
}

// Für diese Art gibt es keine Fotos/Aufnahmen: im Test ersetzen, sonst überspringen.
function skipWal() {
  if (++state.skips > state.pool.length) { showNothingFound(); return; }
  if (state.mode === 'test') {
    if (state.spare.length) state.deck[state.index] = state.spare.shift();
    else state.deck.splice(state.index, 1);
  } else {
    state.deck.splice(state.index, 1);
  }
  nextQuestion();
}

function showNothingFound() {
  if (state.mode === 'sound') $('soundHint').textContent = 'Es konnten keine Aufnahmen gefunden werden. Bist du online?';
  else showGalMsg('Es konnten keine Fotos gefunden werden. Bist du online?');
}

function renderChoices(wal) {
  if (istFrage(wal)) {
    const opts = [wal, ...wal.falsch.map((t, i) => ({ id: wal.id + '-f' + i, name: t }))];
    $('choices').innerHTML = '';
    $('choices').classList.add('list');
    shuffle(opts).forEach((opt) => $('choices').appendChild(choiceButton(opt)));
    return;
  }
  $('choices').classList.remove('list');
  // Ablenker bevorzugt aus derselben Gruppe – das macht das Üben lehrreicher.
  const usable = (w) => (state.mode === 'sound' ? !hasNoSound(w) : true);
  const others = state.pool.filter((w) => w !== wal && usable(w));
  const same = shuffle(others.filter((w) => w.gruppe === wal.gruppe)).slice(0, 3);
  const rest = shuffle(others.filter((w) => !same.includes(w)));
  let picks = same.concat(rest).slice(0, PRACTICE_CHOICES - 1);
  if (picks.length < PRACTICE_CHOICES - 1) {
    picks = picks.concat(shuffle(ALLE.filter((w) => w !== wal && !picks.includes(w))).slice(0, PRACTICE_CHOICES - 1 - picks.length));
  }
  const box = $('choices');
  box.innerHTML = '';
  shuffle([wal, ...picks]).forEach((opt) => box.appendChild(choiceButton(opt)));
}
function choiceButton(opt) {
  const b = document.createElement('button');
  b.className = 'choice';
  b.type = 'button';
  b.textContent = opt.name;
  b.dataset.id = opt.id;
  b.addEventListener('click', () => answerChoice(opt, b));
  return b;
}

function answerChoice(opt, btn) {
  if (state.locked) return;
  state.locked = true;
  const wal = currentWal();
  const ok = opt === wal;
  [...$('choices').children].forEach((b) => {
    b.disabled = true;
    if (b.dataset.id === wal.id) b.classList.add('correct');
  });
  if (!ok) btn.classList.add('wrong', 'shake');
  else plusEins(btn, state.mode === 'test' && state.tips ? '+½' : '+1');
  if (state.mode !== 'sound') recordAnswer(wal, !ok ? 'falsch' : state.tips ? 'mitTipp' : 'richtig');
  // Angeklickt wird nur im Test des Dackel-Quiz: dort kostet der Joker einen halben Punkt.
  const pts = !ok ? 0 : state.mode === 'test' && state.tips ? 0.5 : 1;
  if (state.mode === 'test') state.log.push({ wal, given: opt.name, pts });
  let msg = istFrage(wal) ? (ok ? 'Richtig!' : 'Leider nicht. Richtig ist: ' + wal.name)
    : (ok ? 'Richtig! Das ist ein ' : 'Leider nicht. Das ist ein ') + artLabel(wal) + '.';
  if (pts === 0.5) msg += ' Mit Joker: ½ Punkt.';
  finishQuestion(pts, msg);
}

$('answerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (state.locked) return;
  const input = $('answerInput');
  if (!input.value.trim()) { input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); return; }
  state.locked = true;
  const wal = currentWal();
  const res = checkAnswer(input.value, wal);
  input.disabled = true;
  $('answerForm').querySelector('button').disabled = true;
  input.blur();
  // Nur die Baureihe gewusst: im Seepferdchen-Test voller Punkt, sonst ein halber. Mit Tipp höchstens ein halber.
  let pts = res === 'wrong' ? 0 : res === 'reihe' && state.lvl > 1 ? 0.5 : 1;
  if (state.tips) pts = Math.min(pts, 0.5);
  let msg;
  if (res === 'exact') msg = 'Richtig! Das ist ein ' + artLabel(wal) + '.';
  else if (res === 'typo') msg = 'Richtig (kleiner Tippfehler) – man schreibt „' + wal.name + '“.';
  else if (res === 'reihe') msg = 'Die Baureihe stimmt! Genau ist es ein ' + artLabel(wal) + '.' + (state.lvl > 1 ? ' Ohne Generation: ½ Punkt.' : '');
  else msg = 'Leider falsch. Das ist ein ' + artLabel(wal) + '.';
  if (state.tips && pts === 0.5) msg += ' Mit Tipp: ½ Punkt.';
  state.log.push({ wal, given: input.value.trim(), pts });
  if (pts) plusEins(input, pts === 1 ? '+1' : '+½');
  recordAnswer(wal, pts === 1 ? 'richtig' : pts ? 'mitTipp' : 'falsch');
  finishQuestion(pts, msg);
});

function finishQuestion(pts, msg) {
  const wal = currentWal();
  state.answered++;
  state.points += pts;
  updateTipBtn();
  $('qScore').textContent = fmt(state.points) + ' / ' + state.answered + ' Punkte';
  if (state.mode === 'practice') {
    const n = countSicher(state.pool);
    $('qCounter').textContent = n + ' von ' + state.pool.length + ' ' + artenWort() + ' sicher';
    $('qBar').style.width = (n / state.pool.length * 100) + '%';
  }
  $('fbTitle').textContent = (pts ? '✅ ' : '❌ ') + msg;
  $('fbSub').textContent = istFrage(wal) ? '' : wal.latin + (wal.auch.length ? ' · auch: ' + wal.auch.join(', ') : '');
  factsList(wal, $('fbFacts'));
  const extra = $('fbExtra');
  extra.innerHTML = wal.welt === 'porsche' || istFrage(wal) ? '' : groessenSvg(wal);
  if (istFrage(wal)) {
    // Gretchen reagiert – oben in der Sprechblase und mit einem Foto in der Erklärung.
    gretchenAntwort(pts > 0);
    extra.innerHTML = '<div class="gretchen-moment"><img alt="Gretchen"><span>Gretchen-Moment 💕</span></div>';
    extra.querySelector('img').src = $('gretchenImg').src;
  }
  if (state.mode !== 'sound' && wal.welt === 'wale') extra.appendChild(soundButton(wal));
  extra.appendChild(meldeKnopf(wal));
  $('feedback').className = 'feedback show ' + (pts ? 'ok' : 'bad');

  const credit = $('qCredit');
  const showCredit = () => {
    const photos = photosFor(wal) || [];
    const snd = state.mode === 'sound' ? (soundCache[wal.id] || [])[0] : null;
    credit.innerHTML = '';
    const add = (text, href) => { const a = document.createElement('a'); a.textContent = text; a.href = href; a.target = '_blank'; a.rel = 'noopener'; credit.append(a, ' '); };
    if (photos.length) { credit.append('Fotos: '); photos.forEach((p, i) => add(String(i + 1), p.page)); }
    if (snd) { credit.append(photos.length ? '· ' : ''); add('Ton', snd.page); }
    credit.append('(Wikimedia Commons)');
  };
  if (istFrage(wal)) credit.textContent = '';
  else if (state.mode === 'sound') {
    // Jetzt den Wal zeigen, den man gehört hat.
    $('galleryArea').hidden = false;
    renderGallery(wal, showCredit);
  } else showCredit();

  const last = state.mode === 'test' && state.index === state.deck.length - 1;
  $('nextBtn').textContent = last ? 'Zum Ergebnis' : 'Weiter';
  $('nextRow').className = 'next-row show';
  $('nextBtn').focus({ preventScroll: true });
  $('nextRow').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

$('nextBtn').addEventListener('click', () => { state.index++; nextQuestion(); });

// ---------- Ergebnis ----------
function showResult() {
  const total = state.deck.length;
  const passed = state.points >= TEST_PASS;
  const stufe = stufeFor(state.lvl);
  const store = loadJson(STORE_KEY);
  store.best = store.best || {};
  store.badges = store.badges || {};
  const key = badgeKey(state.lvl);
  store.best[key] = Math.max(store.best[key] || 0, state.points);
  if (passed && !store.badges[key]) store.badges[key] = new Date().toISOString().slice(0, 10);
  saveJson(STORE_KEY, store);

  $('resultHead').textContent = passed ? 'Bestanden! 🎉' : 'Noch nicht ganz …';
  gretchenErgebnis(welt === 'dackel', passed, state.points, total, stufe);
  hochzaehlen($('resultScore'), state.points, ' / ' + total);
  if (passed && welt !== 'dackel') setTimeout(() => konfetti(60, WELT_KONFETTI[welt]), 500);

  const vs = $('resultVs');
  vs.hidden = !state.challenge;
  if (state.challenge) {
    const c = state.challenge;
    const diff = state.points - c.points;
    vs.textContent = diff > 0 ? '🏆 Du hast ' + c.name + ' geschlagen (' + fmt(c.points) + ' Punkte)!'
      : diff < 0 ? c.name + ' war besser (' + fmt(c.points) + ' Punkte). Revanche?'
      : 'Unentschieden mit ' + c.name + ' – beide ' + fmt(c.points) + ' Punkte!';
  }

  const cert = $('resultCert');
  if (passed) {
    cert.innerHTML = '<div class="certificate"><div class="seal"></div><h3></h3><div></div></div>';
    cert.querySelector('.seal').textContent = stufe.emoji;
    cert.querySelector('h3').textContent = stufe.name + ' der ' + KUNDE[welt];
    cert.querySelector('h3 + div').textContent = 'Du kennst die ' + (welt === 'beide' ? 'Wale und Haie' : welt === 'porsche' ? 'Porsche-Modelle' : WORT[welt]) + ' der Stufe „' + stufe.name + '“!';
  } else {
    cert.innerHTML = '<p class="muted"></p>';
    cert.firstChild.textContent = 'Für das Abzeichen „' + stufe.name + '“ brauchst du mindestens ' + TEST_PASS + ' Punkte. Übe noch ein bisschen!';
  }

  const ul = $('review');
  ul.innerHTML = '';
  state.log.forEach((e) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.alt = '';
    const ph = photosFor(e.wal);
    if (ph && ph[0]) img.src = ph[0].src;
    const t = document.createElement('div');
    t.className = 'r-text';
    t.textContent = istFrage(e.wal) ? e.wal.frage : e.wal.name;
    if (e.pts < 1 || istFrage(e.wal)) {
      const s = document.createElement('small');
      const hinweis = e.pts === 0.5 ? (istFrage(e.wal) ? 'mit Joker' : 'mit Tipp') : e.pts ? '' : 'Deine Antwort: ' + (e.given || '–');
      s.textContent = istFrage(e.wal) ? 'Richtig: ' + e.wal.name + (hinweis ? ' · ' + hinweis : '') : hinweis;
      t.appendChild(s);
    }
    const m = document.createElement('span');
    m.className = 'mark';
    m.textContent = e.pts === 1 ? '✅' : e.pts ? '🟡' : '❌';
    if (istFrage(e.wal)) li.append(t, m); else li.append(img, t, m);
    ul.appendChild(li);
  });

  $('shareLabel').textContent = 'Fordere Freunde mit denselben '
    + { wale: 'Walen', haie: 'Haien', beide: 'Tieren', porsche: 'Modellen', dackel: 'Fragen' }[welt] + ' heraus:';
  $('nameInput').value = store.name || '';
  $('shareMsg').textContent = '';
  const lvl = state.lvl;
  const result = { welt, lvl, wale: state.deck.slice(), points: state.points };
  $('shareBtn').onclick = () => shareChallenge(result);
  $('againBtn').onclick = () => startQuiz('test', lvl);
  $('practiceBtn').onclick = () => startQuiz('practice', lvl);
  show('result', 'Ergebnis');
}

async function shareChallenge(result) {
  const name = $('nameInput').value.trim() || 'Jemand';
  const store = loadJson(STORE_KEY);
  store.name = name;
  saveJson(STORE_KEY, store);
  const url = location.origin + location.pathname + '?c=' + encodeChallenge({ ...result, name });
  const stufe = stufeFor(result.lvl);
  const text = name + ' hat im ' + WELTEN[result.welt].title + ' (' + stufe.emoji + ' ' + stufe.name + ') ' + fmt(result.points) + ' von ' + result.wale.length
    + ' Punkten. Dieselben ' + result.wale.length + ' ' + WORT[result.welt]
    + ' – schaffst du mehr? ' + WELTEN[result.welt].emoji;
  if (navigator.share) {
    try { await navigator.share({ title: WELTEN[result.welt].title + ' Challenge', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(text + ' ' + url);
    $('shareMsg').textContent = 'Link kopiert – füge ihn in eine Nachricht ein.';
  } catch {
    $('shareMsg').textContent = url;
  }
}

// ---------- Lexikon ----------
// Das Lexikon enthält alle Arten; angezeigt werden die der aktuellen Welt.
let lexBuilt = false;
let lexWelt = null;
const lexObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    lexObserver.unobserve(en.target);
    fillLexPhoto(en.target);
  });
}, { rootMargin: '300px' }) : null;
const artById = (id) => ALLE.find((a) => a.id === id);

function fillLexPhoto(li) {
  const art = artById(li.dataset.id);
  loadPhotos(art).then((photos) => {
    const img = li.querySelector('.pic');
    const credit = li.querySelector('.credit');
    if (!photos.length) { img.replaceWith(Object.assign(document.createElement('div'), { className: 'pic' })); credit.textContent = 'Kein Foto gefunden'; return; }
    img.src = photos[0].src;
    credit.innerHTML = 'Foto: <a target="_blank" rel="noopener">Wikimedia Commons</a>';
    credit.querySelector('a').href = photos[0].page;
  }).catch(() => {});
}

function renderLexikon() {
  if (!lexBuilt) {
    lexBuilt = true;
    const ul = $('lexList');
    ALLE.filter((w) => !istFrage(w)).sort((a, b) => a.name.localeCompare(b.name, 'de')).concat(ALLE.filter(istFrage)).forEach((w) => {
      const li = document.createElement('li');
      li.dataset.id = w.id;
      li.hidden = true;
      li.innerHTML = '<img class="pic" alt="" loading="lazy"><div class="body"><h3><span></span><span class="lvl"></span></h3>'
        + '<div class="latin"></div><dl class="facts"></dl><p class="merkmal"></p><div class="size"></div><div class="credit"></div></div>';
      if (istFrage(w)) {
        // Dackel-Fragen: Frage, Antwort und Erklärung, ohne Foto
        li.querySelector('.pic').remove();
        li.querySelector('.credit').remove();
        li.querySelector('h3 span').textContent = w.frage;
        li.querySelector('.latin').textContent = 'Antwort: ' + w.name;
        li.querySelector('.merkmal').textContent = w.erklaerung;
        li.querySelector('.body').appendChild(meldeKnopf(w, { art: 'info' }));
        li.search = normalize(w.frage + w.name);
        ul.appendChild(li);
        return;
      }
      li.querySelector('h3 span').textContent = w.name;
      li.querySelector('.latin').textContent = w.latin + (w.auch.length ? ' · auch: ' + w.auch.join(', ') : '');
      factsList(w, li.querySelector('.facts'), 3);
      li.querySelector('.merkmal').textContent = w.merkmal;
      if (w.welt !== 'porsche') li.querySelector('.size').innerHTML = groessenSvg(w);
      if (w.welt === 'wale') li.querySelector('.size').appendChild(soundButton(w));
      li.querySelector('.body').appendChild(meldeKnopf(w));
      li.search = normalize(w.name + w.auch.join('') + w.latin);
      ul.appendChild(li);
      if (lexObserver) lexObserver.observe(li); else fillLexPhoto(li);
    });
    $('lexSearch').addEventListener('input', filterLexikon);
    $('lexGroup').addEventListener('change', filterLexikon);
  }
  if (lexWelt !== welt) {
    lexWelt = welt;
    updatePruefButton();
    const sel = $('lexGroup');
    sel.innerHTML = '<option value="">Alle Gruppen</option><option value="offen">Noch nicht sicher</option>';
    const groups = new Set(ARTEN().map((a) => a.gruppe));
    Object.entries(GRUPPEN).forEach(([k, v]) => { if (groups.has(k)) sel.add(new Option(v, k)); });
  }
  filterLexikon();
}
function filterLexikon() {
  const q = normalize($('lexSearch').value);
  const g = $('lexGroup').value;
  let n = 0;
  [...$('lexList').children].forEach((li) => {
    const w = artById(li.dataset.id);
    li.querySelector('.lvl').textContent = (isSicher(w) ? '✔︎ ' : '') + stufeFor(w.lvl).emoji;
    const vis = inWelt(w) && (!q || li.search.includes(q)) && (!g || (g === 'offen' ? !isSicher(w) : w.gruppe === g));
    li.hidden = !vis;
    if (vis) n++;
  });
  $('lexCount').textContent = n + ' ' + artenWort(n);
}

// ---------- Fotos prüfen ----------
// Alle Arten der aktuellen Welt mit ihren angezeigten Fotos. ✗ sperrt ein Foto (nächster Kandidat rückt nach),
// ✓ merkt es als geprüft. Die Sperrliste lässt sich als Meldung schicken und kommt dann in fotos.json.
const pruefObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    pruefObserver.unobserve(en.target);
    fillPruefRow(en.target);
  });
}, { rootMargin: '400px' }) : null;

function fillPruefRow(li) {
  const art = artById(li.dataset.id);
  const box = li.querySelector('.fotos');
  box.innerHTML = '<div class="leer">Fotos werden gesucht …</div>';
  loadPhotos(art).then((photos) => {
    box.innerHTML = '';
    if (!photos.length) { box.innerHTML = '<div class="leer">Keine (weiteren) Fotos gefunden.</div>'; return; }
    photos.forEach((p) => {
      const d = document.createElement('div');
      d.className = 'foto' + (photoChecked[p.name] ? ' ok' : '');
      d.innerHTML = '<img alt="" loading="lazy"><div class="info"></div><div class="btns"><button type="button" class="yes">✓</button><button type="button" class="no">✗</button></div>';
      d.querySelector('img').src = p.src;
      const info = d.querySelector('.info');
      info.append(p.fest ? '📌 fest gewählt · ' : p.echt ? '📷 mit Kameradaten · ' : '⚠️ ohne Kameradaten · ');
      const a = document.createElement('a');
      a.href = p.page; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Quelle';
      info.appendChild(a);
      d.querySelector('.yes').classList.toggle('on', !!photoChecked[p.name]);
      d.querySelector('.yes').addEventListener('click', () => {
        photoChecked[p.name] = true;
        saveJson(CHECK_KEY, photoChecked);
        fillPruefRow(li);
        updatePruefCount();
      });
      d.querySelector('.no').addEventListener('click', () => {
        photoBlock[p.name] = true;
        delete photoChecked[p.name];
        saveJson(BLOCK_KEY, photoBlock);
        saveJson(CHECK_KEY, photoChecked);
        fillPruefRow(li);
        updatePruefCount();
      });
      box.appendChild(d);
    });
  }).catch(() => { box.innerHTML = '<div class="leer">Konnte nicht geladen werden. Bist du online?</div>'; });
}

const isGeprueft = (art) => { const p = photosFor(art); return p !== null && p.length > 0 && p.every((x) => photoChecked[x.name]); };

function updatePruefCount() {
  const arten = ARTEN();
  $('pruefCount').textContent = arten.filter(isGeprueft).length + ' von ' + arten.length + ' ' + artenWort() + ' geprüft';
  $('sperrCount').textContent = Object.keys(photoBlock).filter((n) => !FOTO_SPERRE.includes(n)).length;
}

function renderPruefen() {
  const ul = $('pruefList');
  ul.innerHTML = '';
  const nurOffen = $('pruefOffen').checked;
  ARTEN().slice().sort((a, b) => a.name.localeCompare(b.name, 'de')).forEach((art) => {
    if (nurOffen && isGeprueft(art)) return;
    const li = document.createElement('li');
    li.dataset.id = art.id;
    li.innerHTML = '<h3></h3><div class="latin"></div><div class="fotos"></div>';
    li.querySelector('h3').textContent = art.name;
    li.querySelector('.latin').textContent = art.latin;
    ul.appendChild(li);
    if (pruefObserver) pruefObserver.observe(li); else fillPruefRow(li);
  });
  updatePruefCount();
  $('sperrMsg').textContent = '';
}
function updatePruefButton() { $('pruefOpen').hidden = welt === 'dackel'; }
$('pruefOpen').addEventListener('click', () => { renderPruefen(); show('pruefen', '🔎 Fotos prüfen'); });
$('pruefOffen').addEventListener('change', renderPruefen);
$('sperrMelden').addEventListener('click', () => {
  const list = Object.keys(photoBlock).filter((n) => !FOTO_SPERRE.includes(n));
  if (!list.length) { $('sperrMsg').textContent = 'Noch keine Fotos aussortiert.'; return; }
  const text = ['Diese Fotos wurden in der Prüf-Ansicht aussortiert und sollen fest in die Sperrliste (`fotos.json`):', '',
    '```json', JSON.stringify(list, null, 1), '```', '', '- App-Stand: ' + APP_STAND, '- Welt: ' + WELTEN[welt].title,
    '', '<!-- walquiz-meldung ' + JSON.stringify({ typ: 'foto', sperre: list }) + ' -->'].join('\n');
  window.open(meldeUrl('[Fotos] ' + list.length + (list.length === 1 ? ' aussortiertes Foto' : ' aussortierte Fotos'), text), '_blank', 'noopener');
});
$('sperrCopy').addEventListener('click', async () => {
  const list = Object.keys(photoBlock).filter((n) => !FOTO_SPERRE.includes(n));
  const text = 'Gesperrte Fotos (' + list.length + '):\n' + JSON.stringify(list, null, 1);
  try { await navigator.clipboard.writeText(text); $('sperrMsg').textContent = 'Kopiert – füge die Liste in den Chat mit Claude ein.'; }
  catch { $('sperrMsg').textContent = text; }
});

// Seepferdchen aus der ersten Version übernehmen
(() => {
  const old = loadJson('walquiz.v1');
  const store = loadJson(STORE_KEY);
  if (old.seepferdchen && !(store.badges && store.badges[1])) {
    store.badges = Object.assign({}, store.badges, { 1: old.seepferdchen });
    saveJson(STORE_KEY, store);
  }
})();

renderStart();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
