// 🎨 Grafiken für „Wer war's?“: Porträts und Icons liegen in img/krimi/ (aus den generierten Bildern
// zugeschnitten), dazu die gezeichnete Villa fürs Titelbild.
// Anmeldung der Krimi-Spiele (Reihenfolge = Reihenfolge im Menü)
const KRIMI_MODI = {};
function krimiModus(id, def) { KRIMI_MODI[id] = { id, ...def }; }

const KRIMI_BILD = (name) => 'img/krimi/' + name + '.webp';
// Möbel → Bilddatei
const KRIMI_MOEBEL_BILD = {
  sessel: 'raum-salon', sofa: 'sofa', bett: 'raum-schlafzimmer', teppich: 'teppich',
  pflanze: 'pflanze', uhr: 'uhr', schrank: 'schrank', lampe: 'lampe',
};
function krimiIcon(name, klasse = 'k-icon') {
  const img = document.createElement('img');
  img.src = KRIMI_BILD(name);
  img.alt = '';
  img.className = klasse;
  img.decoding = 'async';
  return img;
}

// Boden je Raumtyp – Grundfarbe kommt vom Raum
const KRIMI_BODEN = {
  'Küche': 'fliesen', 'Wintergarten': 'platten', 'Schlafzimmer': 'teppichboden',
  'Salon': 'parkett', 'Bibliothek': 'parkett', 'Arbeitszimmer': 'parkett',
};

// Spielfigur: rundes Porträt (Opfer mit rotem Ring und Kreide-Umriss)
function krimiFigur(person, klasse) {
  const el = document.createElement('span');
  el.className = klasse + (person.opfer ? ' opfer' : '');
  const img = document.createElement('img');
  img.src = KRIMI_BILD(person.id);
  img.alt = person.voll;
  img.onerror = () => { el.textContent = person.name[0]; };
  el.appendChild(img);
  return el;
}
