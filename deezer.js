// 🎧 Deezer im Song-Rätsel: 30-Sekunden-Hörproben direkt im Browser – ohne Anmeldung, ohne App, ohne Konto.
// Die Deezer-API sendet keine CORS-Header, deshalb JSONP (output=jsonp). Die Hörproben sind normale MP3-Adressen
// und laufen in einem <audio>-Element. Deezer erlaubt die Nutzung nur nicht-kommerziell und privat im Familienkreis
// (developers.deezer.com/termsofuse) – darauf weist das Menü hin. Der Ton wird nur abgespielt, nicht verändert.
let dzNr = 0;
function dzApi(pfad) {
  return new Promise((res, rej) => {
    const cb = 'dzAntwort' + (++dzNr) + '_' + Date.now(), s = document.createElement('script');
    const weg = () => { clearTimeout(uhr); delete window[cb]; s.remove(); };
    const uhr = setTimeout(() => { weg(); rej(new Error('Deezer antwortet nicht – Internetverbindung prüfen.')); }, 12000);
    window[cb] = (j) => { weg(); if (j && j.error) { const e = new Error(j.error.message || 'Deezer-Fehler'); e.dz = j.error; rej(e); } else res(j); };
    s.onerror = () => { weg(); rej(new Error('Deezer ist gerade nicht erreichbar.')); };
    s.src = 'https://api.deezer.com' + pfad + (pfad.includes('?') ? '&' : '?') + 'output=jsonp&callback=' + cb;
    document.head.appendChild(s);
  });
}
function dzTrack(t) {
  if (!t || !t.id || !t.preview || t.readable === false) return null;
  const a = t.artist || {}, al = t.album || {};
  return { uri: 'deezer:' + t.id, id: t.id, name: spSauber(t.title_short || t.title), kuenstler: a.name || '', erster: a.name || '', dauer: 30000, preview: t.preview, rang: t.rank || 0, albumId: al.id, jahr: null, bild: al.cover_small || '' };
}
// Kategorien → Suche nach redaktionellen Playlists (Deezer hat keinen Jahr-Filter in der Suche)
const DZ_SUCHE = { mix: 'greatest hits of all time', '70er': '70s disco hits', '80er': '80s pop hits', '90er': '90s pop hits', '00er': '2000s pop hits', '10er': '2010s pop hits', rock: 'rock classics', hiphop: 'hip hop classics', deutsch: 'deutschpop hits', schlager: 'schlager hits', film: 'movie soundtracks' };
async function dzPool(katId, hits) {
  const r = Math.random;
  let roh = [];
  if (katId === 'neu' || !DZ_SUCHE[katId]) {
    const j = await dzApi('/chart/0/tracks?limit=100');
    roh = (j.data || []).map(dzTrack);
  } else {
    const j = await dzApi('/search/playlist?limit=20&q=' + encodeURIComponent(DZ_SUCHE[katId]));
    let pl = (j.data || []).filter((p) => (p.nb_tracks || 0) >= 25);
    // Playlists der Deezer-Redaktion bevorzugen – Fan-Listen nur, wenn es zu wenige gibt
    const redaktion = pl.filter((p) => /deezer/i.test((p.user || {}).name || ''));
    pl = (redaktion.length >= 2 ? redaktion : pl).slice(0, 5).sort(() => r() - 0.5).slice(0, 3);
    if (!pl.length) throw new Error('Deezer hat für diese Kategorie keine Playlist gefunden.');
    const teile = await Promise.all(pl.map((p) => dzApi('/playlist/' + p.id + '/tracks?limit=100').then((x) => (x.data || []).map(dzTrack)).catch(() => [])));
    roh = teile.flat();
  }
  let liste = spEntdoppeln(roh.filter(Boolean));
  // Große Hits: die bekanntere Hälfte (Deezer-„rank“ = Beliebtheit)
  if (hits && liste.length > 24) liste = liste.slice().sort((a, b) => b.rang - a.rang).slice(0, Math.max(20, Math.ceil(liste.length / 2)));
  return liste.sort(() => r() - 0.5);
}
// Jahr: Erscheinungsdatum des Albums; Sampler/Best-of („compile“) werden übersprungen
async function dzJahre(liste, anzahl) {
  const out = [];
  for (let i = 0; i < liste.length && out.length < anzahl; i += 4) {
    const teil = liste.slice(i, i + 4);
    const alben = await Promise.all(teil.map((t) => (t.albumId ? dzApi('/album/' + t.albumId).catch(() => null) : null)));
    teil.forEach((t, k) => {
      const al = alben[k], j = al && al.release_date ? parseInt(al.release_date, 10) : null;
      if (j > 1900 && al.record_type !== 'compile' && !/greatest|best of|hits|collection|essential|anthology/i.test(al.title || '')) { t.jahr = j; out.push(t); }
    });
  }
  return out;
}

// ---------- Abspielen im Browser ----------
const DZ_STILL = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
let dzEl = null, dzLauf = 0;
function dzAudio() {
  if (!dzEl) { dzEl = new Audio(); dzEl.preload = 'auto'; dzEl.setAttribute('playsinline', ''); }
  return dzEl;
}
// iPhone: Ton darf nur nach einem Tipp starten – beim Tipp auf „Los“ einmal kurz „entsperren“
function dzEntsperren() { try { const a = dzAudio(); a.src = DZ_STILL; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* egal */ } }
function dzStopp() { dzLauf++; if (dzEl) try { dzEl.pause(); } catch (e) { /* schon aus */ } }
async function dzAusschnitt(T, pos, dauer, wennStart) {
  const meins = ++dzLauf, a = dzAudio();
  if (a.dataset.track !== T.preview) { a.src = T.preview; a.dataset.track = T.preview; }
  const start = Math.max(0, pos / 1000);
  try { a.currentTime = start; } catch (e) { /* noch nicht geladen */ }
  try { await a.play(); }
  catch (e) { if (e && e.name === 'NotAllowedError') { const x = new Error('blockiert'); x.blockiert = true; throw x; } throw new Error('Die Hörprobe ließ sich nicht abspielen.'); }
  if (Math.abs(a.currentTime - start) > 0.5) try { a.currentTime = start; } catch (e) { /* egal */ }
  // warten, bis es wirklich läuft, dann genau „dauer“ Millisekunden Audiozeit
  const t0 = Date.now();
  while (meins === dzLauf && (a.paused || a.currentTime < start + 0.02) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 30));
  if (meins !== dzLauf) return;
  if (wennStart) wennStart();
  const ab = a.currentTime;
  while (meins === dzLauf && !a.paused && !a.ended && a.currentTime < ab + dauer / 1000) await new Promise((r) => setTimeout(r, 25));
  if (meins === dzLauf) a.pause();
}
