// Der Pegel gilt für die Wiedergabe auf diesem Gerät und bleibt außerhalb des Spielstands.
const spielTonSchluessel = 'spielekiste-lautstaerke';
let spielTonPegel = 50;
try {
  const wert = localStorage.getItem(spielTonSchluessel);
  if (wert !== null && Number.isFinite(Number(wert))) spielTonPegel = Math.max(0, Math.min(100, Number(wert)));
} catch (e) { /* Speicherung kann deaktiviert sein */ }

const spielTonAusgaenge = new Map();
const spielTonMedien = new Set();

function spielTonAusgang(kontext) {
  let gain = spielTonAusgaenge.get(kontext);
  if (!gain) {
    gain = kontext.createGain();
    gain.gain.value = spielTonPegel / 100;
    gain.connect(kontext.destination);
    spielTonAusgaenge.set(kontext, gain);
    kontext.addEventListener('statechange', () => {
      if (kontext.state === 'closed') spielTonAusgaenge.delete(kontext);
    });
  }
  return gain;
}

function spielTonMedium(src) {
  const element = src === undefined ? new Audio() : new Audio(src);
  const pegelSetzen = () => {
    element.volume = spielTonPegel / 100;
    element.muted = spielTonPegel === 0;
  };
  pegelSetzen();
  element.addEventListener('play', () => {
    spielTonMedien.add(element);
    pegelSetzen();
  });
  for (const ereignis of ['pause', 'ended', 'emptied', 'error']) {
    element.addEventListener(ereignis, () => spielTonMedien.delete(element));
  }
  return element;
}

function spielTonSprache(aussage) {
  aussage.volume = spielTonPegel / 100;
  if (spielTonPegel > 0) speechSynthesis.speak(aussage);
}

const spielTonRegler = document.getElementById('spielTonRegler');
const spielTonWert = document.getElementById('spielTonWert');
const spielTonMenue = document.getElementById('spielTonMenue');
const spielTonKnopf = spielTonMenue.querySelector('summary');

function spielTonAnzeige() {
  spielTonRegler.value = spielTonPegel;
  spielTonWert.value = spielTonPegel + ' %';
  spielTonKnopf.textContent = spielTonPegel === 0 ? '🔇' : '🔉';
  spielTonKnopf.setAttribute('aria-label', 'Spiel-Lautstärke: ' + spielTonPegel + ' Prozent');
}

spielTonRegler.addEventListener('input', () => {
  spielTonPegel = Number(spielTonRegler.value);
  const linear = spielTonPegel / 100;
  for (const [kontext, gain] of spielTonAusgaenge) {
    if (kontext.state !== 'closed') gain.gain.setTargetAtTime(linear, kontext.currentTime, 0.012);
  }
  for (const element of spielTonMedien) {
    element.volume = linear;
    element.muted = spielTonPegel === 0;
  }
  spielTonAnzeige();
});
spielTonRegler.addEventListener('change', () => {
  try { localStorage.setItem(spielTonSchluessel, String(spielTonPegel)); } catch (e) { /* ohne Speicherung */ }
});
document.addEventListener('click', (e) => {
  if (!spielTonMenue.contains(e.target)) spielTonMenue.open = false;
});
spielTonMenue.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !spielTonMenue.open) return;
  e.stopPropagation();
  spielTonMenue.open = false;
  spielTonKnopf.focus();
});

function spielTonPlatzieren(name) {
  const hub = name === 'hub';
  const ziel = hub ? document.querySelector('.hub-knoepfe') : document.body;
  if (spielTonMenue.parentElement === ziel) return;
  spielTonMenue.open = false;
  spielTonMenue.classList.toggle('spiel-ton-schwebend', !hub);
  ziel.appendChild(spielTonMenue);
}

spielTonAnzeige();
