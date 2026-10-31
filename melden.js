// Fehler und Fotos melden: öffnet auf GitHub ein vorausgefülltes Issue im Repo.
// Bewusst ohne Token in der App – die Seite ist öffentlich, ein Schlüssel wäre für jeden auslesbar.
// Wer meldet, braucht ein (kostenloses) GitHub-Konto; die Meldungen sind öffentlich sichtbar.
const MELDE_REPO = 'pbajog-sys/Test1';
const APP_STAND = 'walquiz-v13';   // gleich halten mit VERSION in sw.js

const MELDE_ARTEN = {
  foto: { label: '🖼️ Foto passt nicht', hint: 'falsche Art, Zeichnung, totes Tier, unscharf …', titel: 'Foto' },
  info: { label: '📝 Info stimmt nicht', hint: 'Steckbrief, Antwort oder Erklärung falsch', titel: 'Info' },
  bug:  { label: '🐞 Fehler in der App', hint: 'etwas funktioniert nicht oder sieht kaputt aus', titel: 'Fehler' },
  idee: { label: '💡 Idee oder Wunsch', hint: 'was die App noch können sollte', titel: 'Idee' },
};

let meldung = null;   // { art, fotos, extra }

function meldeUrl(titel, text) {
  return 'https://github.com/' + MELDE_REPO + '/issues/new?' + new URLSearchParams({ title: titel, body: text });
}

function geraet() {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'anderes';
  const app = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'als App installiert' : 'im Browser';
  return os + ', ' + app + ', ' + window.innerWidth + '×' + window.innerHeight;
}

function artZeile(art) {
  if (!art) return null;
  if (istFrage(art)) return 'Frage: „' + art.frage + '“ (Antwort: ' + art.name + ') – `' + art.id + '`';
  return (art.welt === 'porsche' ? 'Modell: Porsche ' : 'Art: ') + art.name + ' (' + art.latin + ') – `' + art.id + '`';
}

// Öffnet den Melde-Dialog. art: die betroffene Art/Frage (optional), art = null für allgemeine Meldungen.
function meldenOeffnen(art = null, opts = {}) {
  const fotos = art && !istFrage(art) ? photosFor(art) || [] : [];
  meldung = { art, fotos, extra: opts.extra || '' };
  const dlg = $('meldeDialog');
  $('meldeBetrifft').textContent = art ? (istFrage(art) ? art.frage : (art.welt === 'porsche' ? 'Porsche ' : '') + art.name) : WELTEN[welt].title + ' allgemein';

  // Art der Meldung: Foto nur, wenn es Fotos gibt
  const arten = $('meldeArten');
  arten.innerHTML = '';
  const moeglich = art ? (fotos.length ? ['foto', 'info', 'bug'] : ['info', 'bug']) : ['bug', 'idee'];
  const start = opts.art && moeglich.includes(opts.art) ? opts.art : moeglich[0];
  moeglich.forEach((k) => {
    const l = document.createElement('label');
    l.className = 'melde-art';
    l.innerHTML = '<input type="radio" name="meldeArt"><span><b></b><small></small></span>';
    l.querySelector('input').value = k;
    l.querySelector('input').checked = k === start;
    l.querySelector('b').textContent = MELDE_ARTEN[k].label;
    l.querySelector('small').textContent = MELDE_ARTEN[k].hint;
    l.querySelector('input').addEventListener('change', meldeFotosZeigen);
    arten.appendChild(l);
  });

  // Welches Foto?
  const box = $('meldeFotos');
  box.innerHTML = '';
  fotos.forEach((p, i) => {
    const l = document.createElement('label');
    l.className = 'melde-foto';
    l.innerHTML = '<input type="checkbox"><img alt=""><span></span>';
    l.querySelector('input').value = String(i);
    l.querySelector('input').checked = opts.foto === i || (opts.foto == null && fotos.length === 1);
    l.querySelector('img').src = p.src;
    l.querySelector('span').textContent = 'Foto ' + (i + 1);
    box.appendChild(l);
  });
  meldeFotosZeigen();
  $('meldeText').value = '';
  $('meldeVorschlag').value = '';
  $('meldeVorschlagHinweis').textContent = '';
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

function meldeArt() {
  const r = document.querySelector('input[name="meldeArt"]:checked');
  return r ? r.value : 'bug';
}
function meldeFotosZeigen() {
  $('meldeFotoWahl').hidden = meldeArt() !== 'foto' || !meldung.fotos.length;
}

// Baut Titel und Text der Meldung und öffnet sie auf GitHub.
// alleFotos: die angezeigten Fotos der Art (für die Nummer), fotos: die gemeldeten davon.
// Aus einem Wikimedia-Link (Commons, Wikipedia-Dateiseite oder upload.wikimedia.org) den Dateinamen holen.
// Nur Wikimedia: dort sind die Fotos frei lizenziert und haben eine Quellenseite.
function commonsDatei(link) {
  let u;
  try { u = new URL(link.trim()); } catch { return null; }
  if (!/(^|\.)(wikimedia|wikipedia)\.org$/.test(u.hostname)) return null;
  const pfad = decodeURIComponent(u.pathname + u.hash);
  let m = pfad.match(/(?:File|Datei|Image|Bild):([^/?#]+)/i)
    || (u.hostname === 'upload.wikimedia.org' && pfad.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/));
  if (!m) return null;
  const name = m[1].replace(/ /g, '_');
  return /\.(jpe?g|png|webp)$/i.test(name) ? name : null;
}

function meldungSenden({ art, kind, alleFotos = [], fotos = [], text = '', extra = '', vorschlag = null }) {
  const name = art ? (istFrage(art) ? 'Dackel-Frage ' + art.id.replace('dackel-', '') : (art.welt === 'porsche' ? 'Porsche ' : '') + art.name) : WELTEN[welt].title;
  const titel = '[' + MELDE_ARTEN[kind].titel + '] ' + name
    + (kind === 'foto' && fotos.length === 1 ? ' – Foto ' + (alleFotos.indexOf(fotos[0]) + 1) : '');
  const zeilen = [
    '### Was ist ' + (kind === 'idee' ? 'die Idee' : 'falsch') + '?',
    text || '_(bitte hier beschreiben)_',
    '',
    '### Betrifft',
    '- Welt: ' + WELTEN[welt].title,
  ];
  const az = artZeile(art);
  if (az) zeilen.push('- ' + az);
  fotos.forEach((p) => zeilen.push('- Foto ' + (alleFotos.indexOf(p) + 1) + ': [' + p.name + '](' + p.page.replace(/\(/g, '%28').replace(/\)/g, '%29') + ')' + (p.echt ? '' : ' (ohne Kameradaten)')));
  if (kind === 'foto') {
    zeilen.push('', '### Besseres Foto (Vorschlag)',
      vorschlag ? '[' + vorschlag + '](https://commons.wikimedia.org/wiki/File:' + urlName(vorschlag) + ')'
        : '_optional: Link zu einem Foto auf commons.wikimedia.org hier einfügen_');
  }
  if (extra) zeilen.push('', extra);
  zeilen.push('', '### Technik', '- App-Stand: ' + APP_STAND, '- Gerät: ' + geraet(), '- Gemeldet: ' + new Date().toLocaleString('de-DE'));
  // Gemeldete Fotos werden auch gleich auf diesem Gerät aussortiert.
  if (kind === 'foto') { fotos.forEach((p) => { photoBlock[p.name] = true; }); saveJson(BLOCK_KEY, photoBlock); }
  // Maschinenlesbar, damit Meldungen ohne Abtippen in fotos.json übernommen werden können.
  const daten = { typ: kind, art: art ? art.id : null };
  if (kind === 'foto') { daten.sperre = fotos.map((p) => p.name); daten.vorschlag = vorschlag; }
  zeilen.push('', '<!-- walquiz-meldung ' + JSON.stringify(daten) + ' -->');
  window.open(meldeUrl(titel, zeilen.join('\n')), '_blank', 'noopener');
}

function meldungAbschicken() {
  const kind = meldeArt();
  const link = $('meldeVorschlag').value.trim();
  const vorschlag = kind === 'foto' && link ? commonsDatei(link) : null;
  if (kind === 'foto' && link && !vorschlag) {
    $('meldeVorschlagHinweis').textContent = 'Bitte einen Link zu einem Foto auf commons.wikimedia.org (oder einer Wikipedia-Dateiseite) einfügen.';
    $('meldeVorschlag').focus();
    return;
  }
  const gewaehlt = [...$('meldeFotos').querySelectorAll('input:checked')].map((x) => meldung.fotos[Number(x.value)]);
  meldungSenden({
    art: meldung.art, kind, alleFotos: meldung.fotos,
    fotos: kind === 'foto' ? (gewaehlt.length ? gewaehlt : meldung.fotos) : [],
    text: $('meldeText').value.trim(), extra: meldung.extra, vorschlag,
  });
  meldenSchliessen();
}

// Ein Tipp auf ⚑ im Foto: dieses Foto sofort melden, ohne Dialog.
function fotoDirektMelden(art, foto, alleFotos) {
  meldungSenden({ art, kind: 'foto', alleFotos, fotos: [foto] });
}

function meldenSchliessen() {
  const dlg = $('meldeDialog');
  if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
}

$('meldeSenden').addEventListener('click', meldungAbschicken);
$('meldeAbbrechen').addEventListener('click', meldenSchliessen);
$('meldeAllgemein').addEventListener('click', () => meldenOeffnen(null));

// Kleiner „Melden“-Knopf, z. B. unter einer Antwort oder im Lexikon
function meldeKnopf(art, opts) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'melde-btn';
  b.textContent = '⚑ Melden';
  b.addEventListener('click', () => meldenOeffnen(art, opts));
  return b;
}
