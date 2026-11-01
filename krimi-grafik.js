// 🎨 Grafiken für „Wer war's?“: Porträts und Icons liegen in img/krimi/ (aus den generierten Bildern
// zugeschnitten), dazu die gezeichnete Villa fürs Titelbild.
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

// Titelbild: Villa bei Nacht mit einem einzigen erleuchteten Fenster
const KRIMI_VILLA = `<svg viewBox="0 0 320 190" aria-hidden="true" class="villa-svg">
  <defs>
    <radialGradient id="mond" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6d8"/><stop offset=".6" stop-color="#f5e6c8" stop-opacity=".35"/><stop offset="1" stop-color="#f5e6c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="licht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9d3a"/></linearGradient>
  </defs>
  <circle cx="252" cy="44" r="46" fill="url(#mond)"/><circle cx="252" cy="44" r="17" fill="#fff3cf"/>
  <circle cx="246" cy="40" r="3" fill="#e9d9ad"/><circle cx="257" cy="50" r="2.4" fill="#e9d9ad"/>
  ${[[30, 30], [70, 18], [120, 36], [180, 14], [205, 60], [296, 92], [12, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#f5e6c8" opacity=".8"/>`).join('')}
  <path d="M0 176 Q80 160 160 168 T320 164 V190 H0 Z" fill="#0b0807"/>
  <g fill="#241914" stroke="#6a4c36" stroke-width="2">
    <rect x="70" y="86" width="180" height="84"/>
    <path d="M60 88 L160 40 L260 88 Z"/>
    <rect x="132" y="58" width="56" height="44"/>
    <path d="M126 60 L160 36 L194 60 Z"/>
    <rect x="214" y="44" width="14" height="30"/>
  </g>
  <g fill="#3a2a20" stroke="#6a4c36" stroke-width="1">${[[86, 104], [86, 136], [118, 136], [190, 104], [222, 104], [222, 136], [148, 70]].map(([x, y]) => `<rect x="${x}" y="${y}" width="${x === 148 ? 24 : 16}" height="${x === 148 ? 22 : 20}"/>`).join('')}</g>
  <rect x="190" y="136" width="16" height="20" fill="url(#licht)" class="villa-fenster"/>
  <path d="M190 136 h16 v20 h-16 z M198 136 v20 M190 146 h16" fill="none" stroke="#3a2a20" stroke-width="1.5"/>
  <path d="M196 141 q3 -4 6 0 v8 h-6 z" fill="#1b1310" class="villa-schatten"/>
  <path d="M150 170 v-24 q10 -10 20 0 v24" fill="#2a1e18" stroke="#3a2a20" stroke-width="2"/>
  <path d="M206 156 L238 186 L182 186 Z" fill="#ffb347" opacity=".12"/>
</svg>`;

