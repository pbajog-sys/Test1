// Profile wie bei Netflix: „Wer spielt?“ – jeder hat seinen eigenen Fortschritt auf diesem Gerät.
// Der Stand des aktiven Profils liegt in den normalen Speicher-Schlüsseln. Beim Wechsel wird er unter
// seinem Profil abgelegt, der Stand des anderen geladen und die Seite neu geladen.
// Gemeldete und geprüfte Fotos gelten für alle Profile gemeinsam.
const PROFIL_KEY = 'walquiz.profile.v1';
const PROFIL_DATEN = [STORE_KEY, STATS_KEY, 'walquiz.farben.v1', 'walquiz.cello.v1', 'walquiz.toene.v1', 'walquiz.takt.v1', 'walquiz.punkte.v1', 'walquiz.augen.v1', 'walquiz.karte.v1', 'walquiz.krimi.v1', 'walquiz.zuletzt.v1', 'walquiz.gesehen.v1'];
const PROFIL_AVATARE = ['🐋', '🦈', '🐕', '🏎️', '🎻', '🎨', '🦄', '🐙', '🐢', '🦊', '🐼', '🦖', '🐧', '🦁', '🐸', '🚀'];
const PROFIL_FARBEN = ['#e50914', '#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#0891b2', '#db2777'];
const profilAblage = (id) => 'walquiz.profil.' + id;

function profile() { const p = loadJson(PROFIL_KEY); p.liste = p.liste || []; return p; }
function aktivesProfil() { const p = profile(); return p.liste.find((x) => x.id === p.aktiv) || null; }

function profilBild(pr, el) {
  el.className = 'pk-bild';
  el.style.background = pr.farbe;
  el.textContent = pr.avatar;
  return el;
}

// Spielstand eines Profils: das aktive steht live im Speicher, die anderen in ihrer Ablage
function datenVon(id) {
  if (id === profile().aktiv) {
    const d = {};
    PROFIL_DATEN.forEach((k) => { d[k] = loadJson(k); });
    return d;
  }
  return loadJson(profilAblage(id));
}

function wechsleZu(id) {
  const p = profile();
  if (p.aktiv === id) { schliesseWahl(); return; }
  if (p.aktiv) saveJson(profilAblage(p.aktiv), datenVon(p.aktiv));
  const d = loadJson(profilAblage(id));
  PROFIL_DATEN.forEach((k) => { if (d[k]) saveJson(k, d[k]); else try { localStorage.removeItem(k); } catch {} });
  try { localStorage.removeItem(profilAblage(id)); } catch {}   // liegt jetzt live im Speicher
  p.aktiv = id;
  saveJson(PROFIL_KEY, p);
  location.reload();
}

// Name auch in den Spielstand, damit Challenge-Links ihn mitschicken
function nameInStand(id, name) {
  if (id === profile().aktiv) { const st = loadJson(STORE_KEY); st.name = name; saveJson(STORE_KEY, st); return; }
  const d = loadJson(profilAblage(id));
  d[STORE_KEY] = { ...(d[STORE_KEY] || {}), name };
  saveJson(profilAblage(id), d);
}

// ---------- Auswahl „Wer spielt?“ ----------
let pwBearbeiten = false;
let pwEntwurf = null;   // { id?, name, avatar, farbe }

function zeigeWahl() {
  const p = profile();
  $('profilWahl').hidden = false;
  $('profilWahl').classList.toggle('bearbeiten', pwBearbeiten);
  $('pwListe').hidden = false;
  $('pwForm').hidden = true;
  $('pwZu').hidden = !p.aktiv;
  $('pwTitel').textContent = pwBearbeiten ? 'Profile verwalten' : 'Wer spielt?';
  $('pwVerwalten').textContent = pwBearbeiten ? 'Fertig' : 'Profile verwalten';
  $('pwVerwalten').hidden = !p.liste.length;
  const grid = $('pwGrid');
  grid.innerHTML = '';
  p.liste.forEach((pr) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'profil-kachel' + (pr.id === p.aktiv ? ' aktiv' : '');
    b.appendChild(profilBild(pr, document.createElement('span')));
    const n = document.createElement('span');
    n.className = 'pk-name';
    n.textContent = pr.name;
    b.appendChild(n);
    b.addEventListener('click', () => (pwBearbeiten ? zeigeForm(pr) : wechsleZu(pr.id)));
    grid.appendChild(b);
  });
  if (p.liste.length < 8) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'profil-kachel neu';
    b.innerHTML = '<span class="pk-bild">+</span><span class="pk-name">Neues Profil</span>';
    b.addEventListener('click', () => zeigeForm(null));
    grid.appendChild(b);
  }
  document.documentElement.style.overflow = 'hidden';
}

function schliesseWahl() {
  $('profilWahl').hidden = true;
  pwBearbeiten = false;
  document.documentElement.style.overflow = '';
}

function zeigeForm(pr) {
  const p = profile();
  const frei = PROFIL_AVATARE.find((a) => !p.liste.some((x) => x.avatar === a)) || PROFIL_AVATARE[0];
  pwEntwurf = pr ? { ...pr } : {
    name: p.liste.length ? '' : (loadJson(STORE_KEY).name || '').slice(0, 20),
    avatar: frei,
    farbe: PROFIL_FARBEN[p.liste.length % PROFIL_FARBEN.length],
  };
  $('pwListe').hidden = true;
  $('pwForm').hidden = false;
  $('pwFormTitel').textContent = pr ? 'Profil bearbeiten' : p.liste.length ? 'Neues Profil' : 'Wie heißt du?';
  $('pwName').value = pwEntwurf.name;
  $('pwHinweis').textContent = '';
  $('pwAbbrechen').hidden = !p.liste.length;
  $('pwLoeschen').hidden = !pr;
  $('pwAvatare').innerHTML = '';
  PROFIL_AVATARE.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = a;
    b.addEventListener('click', () => { pwEntwurf.avatar = a; formAuffrischen(); });
    $('pwAvatare').appendChild(b);
  });
  $('pwFarben').innerHTML = '';
  PROFIL_FARBEN.forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.background = f;
    b.setAttribute('aria-label', 'Farbe');
    b.addEventListener('click', () => { pwEntwurf.farbe = f; formAuffrischen(); });
    $('pwFarben').appendChild(b);
  });
  formAuffrischen();
  if (!pr) setTimeout(() => $('pwName').focus(), 50);
}

function formAuffrischen() {
  profilBild(pwEntwurf, $('pwVorschau'));
  $('pwAvatare').querySelectorAll('button').forEach((b) => b.classList.toggle('an', b.textContent === pwEntwurf.avatar));
  $('pwFarben').querySelectorAll('button').forEach((b, i) => b.classList.toggle('an', PROFIL_FARBEN[i] === pwEntwurf.farbe));
}

function profilSpeichern() {
  const name = $('pwName').value.trim().slice(0, 20);
  const p = profile();
  if (!name) { $('pwHinweis').textContent = 'Bitte einen Namen eintippen.'; return; }
  if (p.liste.some((x) => x.id !== pwEntwurf.id && x.name.toLowerCase() === name.toLowerCase())) {
    $('pwHinweis').textContent = 'Diesen Namen gibt es schon.'; return;
  }
  if (pwEntwurf.id) {   // bearbeiten
    const pr = p.liste.find((x) => x.id === pwEntwurf.id);
    Object.assign(pr, { name, avatar: pwEntwurf.avatar, farbe: pwEntwurf.farbe });
    saveJson(PROFIL_KEY, p);
    nameInStand(pr.id, name);
    profilHub();
    zeigeWahl();
    return;
  }
  const pr = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, avatar: pwEntwurf.avatar, farbe: pwEntwurf.farbe };
  p.liste.push(pr);
  if (!p.aktiv) {
    // Erstes Profil: übernimmt den bisherigen Fortschritt auf dem Gerät
    p.aktiv = pr.id;
    saveJson(PROFIL_KEY, p);
    nameInStand(pr.id, name);
    schliesseWahl();
    profilHub();
    return;
  }
  saveJson(PROFIL_KEY, p);
  saveJson(profilAblage(pr.id), { [STORE_KEY]: { name } });
  wechsleZu(pr.id);   // neues Profil startet bei null
}

function profilLoeschen() {
  const p = profile();
  const id = pwEntwurf.id;
  if (id === p.aktiv) { $('pwHinweis').textContent = 'Du spielst gerade mit diesem Profil. Wechsle erst zu einem anderen, dann kannst du es löschen.'; return; }
  const pr = p.liste.find((x) => x.id === id);
  if (!confirm('Profil „' + pr.name + '“ mit allen Abzeichen und Rekorden löschen?')) return;
  p.liste = p.liste.filter((x) => x.id !== id);
  saveJson(PROFIL_KEY, p);
  try { localStorage.removeItem(profilAblage(id)); } catch {}
  profilHub();
  zeigeWahl();
}

// ---------- Dashboard: Profil-Knopf und Bestenliste ----------
function zusammenfassung(d) {
  const st = d[STORE_KEY] || {}, cello = d['walquiz.cello.v1'] || {};
  const max = (o) => Math.max(0, ...Object.values((o && o.best) || {}));
  return {
    abzeichen: Object.values(st.badges || {}).filter(Boolean).length + Object.values(cello.badges || {}).filter(Boolean).length,
    gelernt: Object.values(d[STATS_KEY] || {}).filter((s) => s && s.fach >= SICHER_AB).length,
    farbe: max(d['walquiz.farben.v1']),
    ton: max(d['walquiz.toene.v1']),
  };
}

function profilHub() {
  const p = profile();
  const ich = aktivesProfil();
  const btn = $('profilBtn');
  btn.hidden = !ich;
  if (ich) {
    btn.innerHTML = '';
    btn.appendChild(profilBild(ich, document.createElement('span')));
    const n = document.createElement('span');
    n.className = 'pb-name';
    n.textContent = ich.name;
    btn.appendChild(n);
    btn.setAttribute('aria-label', 'Profil wechseln (' + ich.name + ')');
  }
  const box = $('hubFamilie');
  box.hidden = p.liste.length < 2;
  if (box.hidden) return;
  const liste = $('familieListe');
  liste.innerHTML = '<li class="kopf"><span></span><span title="Abzeichen">🏅</span><span title="Gelernt">📚</span><span title="Farb-Rekord">🎨</span><span title="Ton-Rekord">🎧</span></li>';
  p.liste.map((pr) => ({ pr, z: zusammenfassung(datenVon(pr.id)) }))
    .sort((a, b) => b.z.abzeichen - a.z.abzeichen || b.z.gelernt - a.z.gelernt || (b.z.farbe + b.z.ton) - (a.z.farbe + a.z.ton))
    .forEach(({ pr, z }, i) => {
      const li = document.createElement('li');
      if (pr.id === p.aktiv) li.className = 'ich';
      li.innerHTML = '<span class="fn"></span><span></span><span></span><span></span><span></span>';
      const sp = li.querySelectorAll('span');
      sp[0].textContent = (i === 0 && (z.abzeichen || z.gelernt || z.farbe || z.ton) ? '👑 ' : pr.avatar + ' ') + pr.name;
      sp[1].textContent = z.abzeichen;
      sp[2].textContent = z.gelernt;
      sp[3].textContent = z.farbe ? fmt(z.farbe) : '–';
      sp[4].textContent = z.ton ? fmt(z.ton) : '–';
      liste.appendChild(li);
    });
}

$('profilBtn').addEventListener('click', zeigeWahl);
$('pwZu').addEventListener('click', schliesseWahl);
$('pwVerwalten').addEventListener('click', () => { pwBearbeiten = !pwBearbeiten; zeigeWahl(); });
$('pwSpeichern').addEventListener('click', profilSpeichern);
$('pwName').addEventListener('keydown', (e) => { if (e.key === 'Enter') profilSpeichern(); });
$('pwAbbrechen').addEventListener('click', zeigeWahl);
$('pwLoeschen').addEventListener('click', profilLoeschen);

profilHub();
// Noch kein Profil? Gleich beim Start fragen, wer spielt.
if (!profile().aktiv) { zeigeWahl(); zeigeForm(null); }
