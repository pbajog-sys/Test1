// 🎨 Grafiken für „Wer war's?“: selbst gezeichnete Möbel von oben (wie auf einem Grundriss),
// Spielfiguren mit Monogramm und die Villa fürs Titelbild. Alles SVG – scharf auf jedem Bildschirm.
const TINTE = '#2b1d14';
const svg = (inhalt) => '<svg viewBox="0 0 100 100" aria-hidden="true">' + inhalt + '</svg>';
const KRIMI_MOEBEL_SVG = {
  stuhl: svg(`${[[24, 24], [68, 24], [24, 74], [68, 74]].map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="8" rx="2" fill="${TINTE}"/>`).join('')}
    <path d="M20 30 Q50 12 80 30 L76 38 Q50 24 24 38 Z" fill="#7a4524" stroke="${TINTE}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="26" y="36" width="48" height="44" rx="6" fill="#b7793f" stroke="${TINTE}" stroke-width="3"/>
    <rect x="32" y="42" width="36" height="32" rx="5" fill="#8f2f3d"/>
    <path d="M36 50 H64 M36 58 H64 M36 66 H64" stroke="#a8404f" stroke-width="2"/>`),
  sofa: svg(`<rect x="6" y="20" width="88" height="20" rx="9" fill="#5e1f2b" stroke="${TINTE}" stroke-width="3"/>
    <rect x="6" y="30" width="16" height="52" rx="7" fill="#6d2533" stroke="${TINTE}" stroke-width="3"/>
    <rect x="78" y="30" width="16" height="52" rx="7" fill="#6d2533" stroke="${TINTE}" stroke-width="3"/>
    <rect x="21" y="38" width="58" height="42" rx="5" fill="#9b3446" stroke="${TINTE}" stroke-width="3"/>
    <line x1="50" y1="40" x2="50" y2="78" stroke="${TINTE}" stroke-width="2.5" opacity=".55"/>
    <circle cx="35" cy="59" r="2.4" fill="#d9a441"/><circle cx="65" cy="59" r="2.4" fill="#d9a441"/>`),
  bett: svg(`<rect x="16" y="6" width="68" height="88" rx="6" fill="#5c3a20" stroke="${TINTE}" stroke-width="3"/>
    <rect x="21" y="11" width="58" height="78" rx="4" fill="#f4ead6"/>
    <rect x="25" y="15" width="22" height="14" rx="6" fill="#fffaf0" stroke="${TINTE}" stroke-width="2"/>
    <rect x="53" y="15" width="22" height="14" rx="6" fill="#fffaf0" stroke="${TINTE}" stroke-width="2"/>
    <path d="M21 40 H79 V89 H21 Z" fill="#3f5f8f"/>
    <path d="M21 40 H79 V48 H21 Z" fill="#f4ead6" opacity=".9"/>
    <path d="M28 60 L72 60 M28 72 L72 72" stroke="#5d7fb0" stroke-width="2.5" stroke-dasharray="4 5"/>`),
  pflanze: svg(`<circle cx="50" cy="50" r="18" fill="#a8573a" stroke="${TINTE}" stroke-width="3"/>
    ${[0, 60, 120, 180, 240, 300].map((w) => `<ellipse cx="50" cy="24" rx="10" ry="22" fill="#3d7f45" stroke="${TINTE}" stroke-width="2.5" transform="rotate(${w} 50 50)"/>`).join('')}
    ${[30, 90, 150, 210, 270, 330].map((w) => `<ellipse cx="50" cy="30" rx="7" ry="16" fill="#68b06a" stroke="${TINTE}" stroke-width="2" transform="rotate(${w} 50 50)"/>`).join('')}
    <circle cx="50" cy="50" r="7" fill="#2f6b37"/>`),
  regal: svg(`<rect x="10" y="8" width="80" height="84" rx="3" fill="#6b4426" stroke="${TINTE}" stroke-width="3"/>
    <line x1="12" y1="36" x2="88" y2="36" stroke="${TINTE}" stroke-width="3"/><line x1="12" y1="64" x2="88" y2="64" stroke="${TINTE}" stroke-width="3"/>
    ${[[16, 8, '#8c2f2f', 22], [25, 7, '#2f5c8c', 18], [33, 9, '#d9a441', 24], [43, 6, '#3d7f45', 20], [50, 8, '#5e1f2b', 23], [59, 7, '#e8dcc0', 17], [67, 9, '#2f5c8c', 22], [77, 8, '#8c2f2f', 19]].map(([x, b, f, h]) => `<rect x="${x}" y="${34 - h}" width="${b}" height="${h}" fill="${f}" stroke="${TINTE}" stroke-width="1.5"/>`).join('')}
    ${[[16, 9, '#3d7f45', 20], [26, 7, '#d9a441', 23], [34, 8, '#8c2f2f', 18], [43, 9, '#e8dcc0', 22], [53, 7, '#2f5c8c', 24], [61, 8, '#5e1f2b', 17], [70, 8, '#3d7f45', 21], [79, 7, '#d9a441', 19]].map(([x, b, f, h]) => `<rect x="${x}" y="${62 - h}" width="${b}" height="${h}" fill="${f}" stroke="${TINTE}" stroke-width="1.5"/>`).join('')}
    <rect x="18" y="72" width="30" height="16" rx="2" fill="#e8dcc0" stroke="${TINTE}" stroke-width="1.5" transform="rotate(-8 33 80)"/>
    <circle cx="68" cy="80" r="7" fill="#d9a441" stroke="${TINTE}" stroke-width="1.5"/>`),
  uhr: svg(`<rect x="30" y="4" width="40" height="92" rx="5" fill="#5a3a22" stroke="${TINTE}" stroke-width="3"/>
    <path d="M30 14 Q50 0 70 14" fill="#7a4f2e" stroke="${TINTE}" stroke-width="3"/>
    <circle cx="50" cy="28" r="14" fill="#f5e6c8" stroke="#d9a441" stroke-width="3"/>
    <path d="M50 28 L50 19 M50 28 L57 31" stroke="${TINTE}" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="40" y="48" width="20" height="40" rx="3" fill="#2b1d14" stroke="#d9a441" stroke-width="2"/>
    <line x1="50" y1="50" x2="50" y2="74" stroke="#d9a441" stroke-width="2"/><circle cx="50" cy="77" r="5" fill="#d9a441"/>`),
  klavier: svg(`<path d="M22 12 H64 C88 12 92 40 80 54 C72 64 80 88 58 90 H22 Z" fill="#1d1b1f" stroke="${TINTE}" stroke-width="3"/>
    <path d="M30 18 H62 C80 18 84 40 74 50" fill="none" stroke="#4a4550" stroke-width="3" stroke-linecap="round"/>
    <rect x="8" y="12" width="15" height="78" rx="2" fill="#fffaf0" stroke="${TINTE}" stroke-width="3"/>
    ${[18, 27, 40, 49, 58, 71, 80].map((y) => `<rect x="8" y="${y}" width="9" height="5" fill="${TINTE}"/>`).join('')}`),
  teppich: svg(`<rect x="4" y="12" width="92" height="76" rx="3" fill="#8c2f2f"/>
    <rect x="11" y="19" width="78" height="62" fill="none" stroke="#d9a441" stroke-width="3"/>
    <rect x="17" y="25" width="66" height="50" fill="none" stroke="#5e1f2b" stroke-width="2"/>
    <path d="M50 31 L68 50 L50 69 L32 50 Z" fill="#d9a441" stroke="#5e1f2b" stroke-width="2"/>
    <path d="M50 40 L59 50 L50 60 L41 50 Z" fill="#5e1f2b"/>
    ${[16, 24, 32, 40, 48, 56, 64, 72, 80].map((y) => `<line x1="0" y1="${y}" x2="4" y2="${y}" stroke="#e8dcc0" stroke-width="2"/><line x1="96" y1="${y}" x2="100" y2="${y}" stroke="#e8dcc0" stroke-width="2"/>`).join('')}`),
};

// Boden je Raumtyp – Grundfarbe kommt vom Raum
const KRIMI_BODEN = {
  'Küche': 'fliesen', 'Bad': 'fliesen', 'Wintergarten': 'platten', 'Schlafzimmer': 'teppichboden',
  'Salon': 'parkett', 'Bibliothek': 'parkett', 'Speisezimmer': 'parkett', 'Arbeitszimmer': 'parkett',
};

// Spielfiguren: eigene Farbe + Monogramm; liegt ein Porträt in img/krimi/, wird es gezeigt
const KRIMI_FIGUR = {
  'Butler Bruno':    { id: 'bruno', farbe: '#2a2a33', ink: '#f5e6c8' },
  'Köchin Klara':    { id: 'klara', farbe: '#e8a33c', ink: '#2b1d14' },
  'Gärtner Gustav':  { id: 'gustav', farbe: '#3d7f45', ink: '#f5e6c8' },
  'Malerin Mia':     { id: 'mia', farbe: '#c2457a', ink: '#fff5f8' },
  'Doktor Dietrich': { id: 'dietrich', farbe: '#2f7f8f', ink: '#f0fbfc' },
  'Tante Trude':     { id: 'trude', farbe: '#7a52b3', ink: '#f6f0ff' },
  'Kapitän Hannes':  { id: 'hannes', farbe: '#2f4f8f', ink: '#f5e6c8' },
  'Sängerin Sophie': { id: 'sophie', farbe: '#a3243b', ink: '#fff0f2' },
  'Lord Lennart':    { id: 'lennart', farbe: '#f5f0e6', ink: '#8c1c1c' },
};
// Welche Porträts schon da sind (Dateien img/krimi/<id>.webp) – wird ergänzt, sobald die Bilder kommen
const KRIMI_PORTRAETS = [];

function krimiFigur(person, klasse) {
  const f = KRIMI_FIGUR[person.name] || { farbe: '#555', ink: '#fff' };
  const el = document.createElement('span');
  el.className = klasse + (person.opfer ? ' opfer' : '');
  el.style.setProperty('--figur', f.farbe);
  el.style.setProperty('--ink', f.ink);
  if (KRIMI_PORTRAETS.includes(f.id)) {
    const img = document.createElement('img');
    img.src = 'img/krimi/' + f.id + '.webp';
    img.alt = '';
    el.appendChild(img);
  } else {
    el.textContent = person.name.split(' ').pop()[0];
  }
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

// Lupe mit Fingerabdruck – Symbol fürs Dashboard und den Titel
const KRIMI_LUPE = `<svg viewBox="0 0 100 100" aria-hidden="true" class="lupe-svg">
  <circle cx="42" cy="42" r="26" fill="rgba(245,230,200,0.12)" stroke="#f5e6c8" stroke-width="7"/>
  <g fill="none" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round" opacity=".9">
    <path d="M30 50 q0 -18 12 -18 q12 0 12 14"/><path d="M34 54 q-1 -18 8 -18 q8 0 8 12"/><path d="M38 56 q-1 -14 4 -14 q4 0 4 9"/>
    <path d="M26 44 q2 -20 16 -20 q16 0 16 20"/><path d="M47 58 q4 -4 5 -10"/>
  </g>
  <path d="M61 61 L84 84" stroke="#f5e6c8" stroke-width="11" stroke-linecap="round"/>
  <path d="M63 63 L82 82" stroke="#8c5a32" stroke-width="7" stroke-linecap="round"/>
</svg>`;
