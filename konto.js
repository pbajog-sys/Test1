// Konten mit Supabase: Anmeldung per 6-stelligem E-Mail-Code, Fortschritt auf allen Geräten, Familien-Bestenliste.
// Ohne Eintrag in konto-config.js bleibt alles aus – die App funktioniert dann wie bisher nur auf dem Gerät.
// Code statt Anmelde-Link: Auf dem iPhone öffnet ein Link Safari, die Home-Bildschirm-App hat aber
// einen eigenen Speicher – man wäre dort nicht angemeldet.
const SYNC_KEYS = [STORE_KEY, STATS_KEY, 'walquiz.farben.v1', 'walquiz.cello.v1', 'walquiz.toene.v1', BLOCK_KEY, CHECK_KEY];
const kontoAktiv = () => typeof KONTO_CONFIG === 'object' && KONTO_CONFIG.url && KONTO_CONFIG.anonKey;
let sb = null;            // Supabase-Client
let nutzer = null;        // angemeldeter Nutzer
let profil = null;        // eigenes Profil (name, familie)
let syncTimer = null;
const BESITZER_KEY = 'walquiz.konto.v1';   // welchem Konto der Stand auf diesem Gerät gehört

function ladeSupabase() {
  if (window.supabase) return Promise.resolve();
  return new Promise((ok, fehler) => {
    const s = document.createElement('script');
    s.src = 'vendor/supabase/supabase.js';
    s.onload = ok; s.onerror = fehler;
    document.head.appendChild(s);
  });
}

async function kontoStart() {
  if (!kontoAktiv()) return;
  $('kontoBtn').hidden = false;
  try {
    await ladeSupabase();
    sb = window.supabase.createClient(KONTO_CONFIG.url, KONTO_CONFIG.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    const { data } = await sb.auth.getSession();
    nutzer = data.session ? data.session.user : null;
    sb.auth.onAuthStateChange((_e, session) => { nutzer = session ? session.user : null; kontoKnopf(); });
    kontoKnopf();
    if (nutzer) await synchronisieren();
  } catch (e) {
    $('kontoBtn').textContent = '👤 offline';
  }
}

function kontoKnopf() {
  const b = $('kontoBtn');
  b.textContent = nutzer ? '👤 ' + ((profil && profil.name) || 'Konto') : '👤 Anmelden';
  b.classList.toggle('an', !!nutzer);
}

// ---------- Zusammenführen: lokaler und gespeicherter Stand ----------
// Rekorde und Zähler: das Höhere gewinnt · Abzeichen: das frühere Datum · Lernstand je Art: der mit mehr Antworten
function zusammenfuehren(a, b) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if (typeof a === 'boolean' || typeof b === 'boolean') return !!a || !!b;
  if (typeof a === 'string' && typeof b === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(a) && /^\d{4}-\d{2}-\d{2}$/.test(b) ? (a < b ? a : b) : a;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    if ('fach' in a && 'fach' in b) return (a.richtig + a.falsch) >= (b.richtig + b.falsch) ? a : b;
    const out = {};
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => { out[k] = zusammenfuehren(a[k], b[k]); });
    return out;
  }
  return a;
}

function lokalerStand() {
  const d = {};
  SYNC_KEYS.forEach((k) => { d[k] = loadJson(k); });
  return d;
}
function lokalSetzen(d) {
  SYNC_KEYS.forEach((k) => saveJson(k, d[k] || {}));
  // Was die App schon im Speicher hält, gleich mit ersetzen
  [[stats, STATS_KEY], [photoBlock, BLOCK_KEY], [photoChecked, CHECK_KEY]].forEach(([o, k]) => {
    Object.keys(o).forEach((x) => delete o[x]);
    Object.assign(o, d[k] || {});
  });
}

function zusammenfassung() {
  const st = loadJson(STORE_KEY), cello = loadJson('walquiz.cello.v1');
  const max = (o) => Math.max(0, ...Object.values((o && o.best) || {}));
  return {
    abzeichen: Object.values(st.badges || {}).filter(Boolean).length + Object.values(cello.badges || {}).filter(Boolean).length,
    gelernt: countSicher(ALLE),
    farbe: max(loadJson('walquiz.farben.v1')),
    ton: max(loadJson('walquiz.toene.v1')),
  };
}

// aenderung: neue Profil-Werte (Name, Familie), die über den Stand vom Server gelegt werden
async function synchronisieren(aenderung) {
  if (!sb || !nutzer) return false;
  if (!aenderung || aenderung instanceof Event) aenderung = {};
  $('kontoSync').textContent = 'Synchronisiere …';
  try {
    const [{ data: f, error: e1 }, { data: p, error: e2 }] = await Promise.all([
      sb.from('fortschritt').select('daten').eq('id', nutzer.id).maybeSingle(),
      sb.from('profil').select('name, familie').eq('id', nutzer.id).maybeSingle(),
    ]);
    if (e1 || e2) throw e1 || e2;
    profil = { ...(p || { name: (loadJson(STORE_KEY).name || '').trim().slice(0, 30) || null, familie: null }), ...aenderung };
    // Gehört der Stand auf dem Gerät einem anderen Konto (z. B. Geschwister am selben Handy),
    // wird er nicht ins eigene Konto gemischt – dann gilt nur der Stand aus der Cloud.
    const besitzer = localStorage.getItem(BESITZER_KEY);
    const cloud = (f && f.daten) || {};
    const neu = besitzer && besitzer !== nutzer.id ? cloud : zusammenfuehren(lokalerStand(), cloud);
    localStorage.setItem(BESITZER_KEY, nutzer.id);
    lokalSetzen(neu);
    const jetzt = new Date().toISOString();
    const [{ error: e3 }, { error: e4 }] = await Promise.all([
      sb.from('fortschritt').upsert({ id: nutzer.id, daten: neu, aktualisiert: jetzt }),
      sb.from('profil').upsert({ id: nutzer.id, name: profil.name || null, familie: profil.familie || null, zusammenfassung: zusammenfassung(), aktualisiert: jetzt }),
    ]);
    if (e3 || e4) throw e3 || e4;
    $('kontoSync').textContent = '✓ Gespeichert ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    kontoKnopf();
    if (aktuellerScreen === 'hub') { renderHub(); zeigeFamilie(); }
    return true;
  } catch (e) {
    $('kontoSync').textContent = '⚠️ Nicht gespeichert – bist du online?';
    return false;
  }
}
// Nach Änderungen kurz warten und dann speichern (z. B. beim Zurück zum Dashboard)
function syncBald() {
  if (!sb || !nutzer) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(synchronisieren, 1500);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && sb && nutzer) synchronisieren(); });

// ---------- Familien-Bestenliste im Dashboard ----------
async function zeigeFamilie() {
  const box = $('hubFamilie');
  const ich = nutzer;
  if (!sb || !ich || !profil || !profil.familie) { box.hidden = true; return; }
  const { data, error } = await sb.from('profil').select('id, name, zusammenfassung').eq('familie', profil.familie);
  if (error || !data || nutzer !== ich) { box.hidden = !!(error || !data || !nutzer); return; }
  box.hidden = false;
  const liste = $('familieListe');
  liste.innerHTML = '<li class="kopf"><span></span><span>🏅</span><span>📚</span><span>🎨</span><span>🎧</span></li>';
  data.sort((a, b) => (b.zusammenfassung.abzeichen || 0) - (a.zusammenfassung.abzeichen || 0) || (b.zusammenfassung.gelernt || 0) - (a.zusammenfassung.gelernt || 0))
    .forEach((m, i) => {
      const z = m.zusammenfassung || {};
      const li = document.createElement('li');
      if (m.id === ich.id) li.className = 'ich';
      li.innerHTML = '<span class="fn"></span><span></span><span></span><span></span><span></span>';
      const sp = li.querySelectorAll('span');
      sp[0].textContent = (i === 0 ? '👑 ' : '') + (m.name || 'Ohne Namen');
      sp[1].textContent = z.abzeichen || 0;
      sp[2].textContent = z.gelernt || 0;
      sp[3].textContent = z.farbe ? fmt(z.farbe) : '–';
      sp[4].textContent = z.ton ? fmt(z.ton) : '–';
      liste.appendChild(li);
    });
}

// ---------- Konto-Dialog ----------
function kontoDialog() {
  const angemeldet = !!nutzer;
  $('kontoAus').hidden = angemeldet;
  $('kontoAn').hidden = !angemeldet;
  $('kontoMsg').textContent = '';
  if (angemeldet) {
    $('kontoEmail').textContent = nutzer.email;
    $('kontoName').value = (profil && profil.name) || '';
    const fam = profil && profil.familie;
    $('famDrin').hidden = !fam;
    $('famDraussen').hidden = !!fam;
    $('famCode').textContent = fam || '';
  } else {
    $('kontoCodeZeile').hidden = true;
  }
  const d = $('kontoDialog');
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}
const kontoMsg = (t) => { $('kontoMsg').textContent = t; };

$('kontoBtn').addEventListener('click', kontoDialog);
$('kontoSchliessen').addEventListener('click', () => { const d = $('kontoDialog'); if (d.close) d.close(); else d.removeAttribute('open'); });
$('kontoCodeSenden').addEventListener('click', async () => {
  const email = $('kontoMail').value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { kontoMsg('Bitte eine gültige E-Mail-Adresse eingeben.'); return; }
  kontoMsg('Code wird gesendet …');
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) { kontoMsg('Das hat nicht geklappt: ' + error.message); return; }
  $('kontoCodeZeile').hidden = false;
  $('kontoCode').focus();
  kontoMsg('Schau in dein Postfach und tippe den 6-stelligen Code ein.');
});
$('kontoAnmelden').addEventListener('click', async () => {
  const email = $('kontoMail').value.trim(), token = $('kontoCode').value.replace(/\D/g, '');
  if (token.length !== 6) { kontoMsg('Der Code hat 6 Ziffern.'); return; }
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
  if (error) { kontoMsg('Code falsch oder abgelaufen. Lass dir einen neuen schicken.'); return; }
  nutzer = data.user;
  await synchronisieren();
  kontoDialog();
  kontoMsg('🎉 Angemeldet – dein Fortschritt ist jetzt gesichert.');
});
$('kontoNameSpeichern').addEventListener('click', async () => {
  const name = $('kontoName').value.trim().slice(0, 30);
  if (!name) { kontoMsg('Bitte einen Namen eingeben.'); return; }
  const st = loadJson(STORE_KEY); st.name = name; saveJson(STORE_KEY, st);   // auch für Challenge-Links
  kontoMsg(await synchronisieren({ name }) ? 'Name gespeichert.' : 'Nicht gespeichert – bist du online?');
});
$('famGruenden').addEventListener('click', async () => {
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // ohne leicht verwechselbare Zeichen
  const familie = Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => zeichen[x % zeichen.length]).join('');
  const ok = await synchronisieren({ familie });
  kontoDialog();
  kontoMsg(ok ? 'Familie gegründet – gib den Code an deine Familie weiter.' : 'Hat nicht geklappt – bist du online?');
});
$('famBeitreten').addEventListener('click', async () => {
  const code = $('famEingabe').value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) { kontoMsg('Der Familien-Code hat 6 Zeichen.'); return; }
  const ok = await synchronisieren({ familie: code });
  kontoDialog();
  kontoMsg(ok ? 'Willkommen in der Familie!' : 'Hat nicht geklappt – bist du online?');
});
$('famVerlassen').addEventListener('click', async () => {
  await synchronisieren({ familie: null });
  $('hubFamilie').hidden = true;
  kontoDialog();
});
$('famTeilen').addEventListener('click', async () => {
  const text = 'Komm in meine Familie in der Spiele-App! Code: ' + profil.familie + '\n' + location.origin + location.pathname;
  if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); kontoMsg('Code kopiert.'); } catch { kontoMsg('Code: ' + profil.familie); }
});
$('kontoSyncJetzt').addEventListener('click', () => synchronisieren());
$('kontoAbmelden').addEventListener('click', async () => {
  await synchronisieren();
  await sb.auth.signOut();
  nutzer = null; profil = null;
  $('hubFamilie').hidden = true;
  kontoKnopf();
  kontoDialog();
  kontoMsg('Abgemeldet. Dein Fortschritt ist in deinem Konto gesichert.');
});
$('kontoLoeschen').addEventListener('click', async () => {
  if (!confirm('Konto wirklich löschen? Anmeldung, Profil und Fortschritt in der Cloud werden entfernt. Auf diesem Gerät bleibt alles.')) return;
  clearTimeout(syncTimer);
  const { error } = await sb.rpc('konto_loeschen');
  if (error) { kontoMsg('Löschen hat nicht geklappt – bist du online?'); return; }
  await sb.auth.signOut({ scope: 'local' });
  localStorage.removeItem(BESITZER_KEY);   // Stand auf dem Gerät gehört jetzt wieder niemandem
  nutzer = null; profil = null;
  $('hubFamilie').hidden = true;
  kontoKnopf();
  kontoDialog();
  kontoMsg('Dein Konto wurde gelöscht.');
});

kontoStart();
