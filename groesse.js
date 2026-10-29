// Größenvergleich: Wal-Silhouette neben einem Menschen (1,8 m) und – bei großen Walen – einem Bus (12 m).
// Alle Maße im SVG sind in Metern; die Umrisse sind auf 100 Einheiten Länge gezeichnet (Kopf links).
const UMRISSE = {
  // schlanker Furchenwal mit kleiner Finne weit hinten
  furchen: { h: 22, d: 'M0,14 C4,9 18,7 35,7 C50,7 62,8 70,10 L74,6 L77,10.5 C83,12 88,13 92,14 L99,8 L97,14.5 L100,20 L92,16 C80,19 60,22 40,21 C22,20 8,19 2,16 Z' },
  // massiger Glattwal ohne Rückenflosse
  glatt:   { h: 27, d: 'M0,12 C2,6 12,3 25,5 C40,7 55,7 70,10 C80,12 87,14 92,15 L99,8 L97,15.5 L100,22 L92,17 C80,22 55,27 35,26 C18,25 6,22 1,17 Z' },
  // Pottwal mit Kastenkopf
  pott:    { h: 23, d: 'M0,6 L28,5 C40,5 55,7 68,10 L71,8 L74,11 C82,13 88,14 92,15 L99,9 L97,15.5 L100,21 L92,17 C78,20 55,23 30,22 L4,21 C1,19 0,16 0,12 Z' },
  // Delfin mit Schnabel und hoher Finne
  delfin:  { h: 22, d: 'M0,15 L6,14 C9,10 14,8 22,8 C35,7 45,7 52,8 L60,0 L62,9 C72,10 82,12 90,14 L98,8 L96,14.5 L99,21 L90,16 C78,19 60,22 40,22 C25,22 14,20 8,17 L1,16.5 Z' },
  // runder Kopf ohne Schnabel (Orca, Grindwal, Schweinswal …)
  rund:    { h: 22, d: 'M0,14 C0,8 6,6 16,6 C30,6 42,6 50,8 L56,1 L60,9 C72,10 82,12 90,14 L98,8 L96,14.5 L99,21 L90,16 C78,19 60,22 40,22 C22,22 8,21 3,19 C1,18 0,16 0,14 Z' },
  // Schnabelwal: kleine Finne weit hinten
  schnabel:{ h: 22, d: 'M0,15 L7,14 C10,10 16,8 25,8 C40,8 55,9 66,11 L70,6 L72,12 C80,13 86,14 91,15 L98,9 L96,15.5 L99,21 L91,17 C78,20 60,22 40,22 C25,22 14,20 9,17 L1,16 Z' },
  // ohne Rückenflosse (Weißwal, Narwal, Glattdelfine, Glattschweinswale)
  ohne:    { h: 22, d: 'M0,14 C0,8 6,6 16,6 C35,6 60,7 75,10 C82,12 87,13 90,14 L98,8 L96,14.5 L99,21 L90,16 C78,19 60,22 40,22 C22,22 8,21 3,19 C1,18 0,16 0,14 Z' },
};

function umrissFuer(wal) {
  const g = wal.latin.split(' ')[0];
  if (['Eubalaena', 'Balaena', 'Caperea', 'Eschrichtius'].includes(g)) return UMRISSE.glatt;
  if (wal.gruppe === 'barten') return UMRISSE.furchen;
  if (g === 'Physeter') return UMRISSE.pott;
  if (['Delphinapterus', 'Monodon', 'Lissodelphis', 'Neophocaena'].includes(g)) return UMRISSE.ohne;
  if (wal.gruppe === 'schnabel') return UMRISSE.schnabel;
  if (['Kogia', 'Orcinus', 'Pseudorca', 'Feresa', 'Peponocephala', 'Globicephala', 'Grampus', 'Orcaella'].includes(g) || wal.gruppe === 'schwein') return UMRISSE.rund;
  return UMRISSE.delfin;
}

function laengeInMetern(wal) {
  return parseFloat(wal.laenge.replace(',', '.')) || 2;
}

function groessenSvg(wal) {
  const len = laengeInMetern(wal);
  const u = umrissFuer(wal);
  const s = len / 100;                 // Umriss-Einheiten -> Meter
  const whaleH = u.h * s;
  const bus = len >= 10;
  const gap = Math.max(0.6, len * 0.06);
  const xWal = 0.7 + gap;
  const xBus = xWal + len + gap;
  const width = (bus ? xBus + 12 : xWal + len) + 0.3;
  const height = Math.max(1.8, whaleH, bus ? 3.2 : 0);
  const fs = Math.max(0.28, width * 0.032);
  const top = fs * 1.6;                // Platz für die Beschriftung oben (Mensch, Bus)
  const H = top + height + fs * 1.7;   // und unten (Wal)
  const y0 = top + height;             // Grundlinie
  const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

  const mensch = `<g transform="translate(0.1 ${y0 - 1.8}) scale(0.018)" fill="var(--muted)">
      <circle cx="17" cy="9" r="9"/><path d="M5,22 h24 a5,5 0 0 1 5,5 v34 h-7 v39 h-8 v-39 h-4 v39 h-8 v-39 h-7 v-34 a5,5 0 0 1 5,-5 z"/></g>`;
  const busSvg = bus ? `<g transform="translate(${xBus} ${y0 - 3.2})" fill="var(--muted)" opacity="0.8">
      <rect width="12" height="2.8" rx="0.4"/>
      <g fill="var(--bg2)">${[0.5, 2.6, 4.7, 6.8, 8.9].map((x) => `<rect x="${x}" y="0.4" width="1.7" height="1" rx="0.15"/>`).join('')}</g>
      <circle cx="2.4" cy="2.8" r="0.45" fill="var(--text)"/><circle cx="9.6" cy="2.8" r="0.45" fill="var(--text)"/></g>` : '';
  const walSvg = `<path transform="translate(${xWal} ${y0 - whaleH}) scale(${s})" d="${u.d}" fill="var(--accent)"/>`;
  const label = (x, y, text, anchor = 'start', color = 'var(--muted)') => `<text x="${x}" y="${y}" font-size="${fs}" fill="${color}" text-anchor="${anchor}">${text}</text>`;

  return `<svg class="size-svg" viewBox="0 0 ${width} ${H}" role="img" aria-label="Größenvergleich: bis ${fmt(len)} m">
    <line x1="0" x2="${width}" y1="${y0}" y2="${y0}" stroke="var(--card-strong)" stroke-width="${fs * 0.1}"/>
    ${mensch}${walSvg}${busSvg}
    ${label(0.1, fs * 1.1, 'Mensch 1,8 m')}
    ${label(Math.max(xWal + len / 2, fs * 2.2), y0 + fs * 1.3, 'Wal bis ' + fmt(len) + ' m', 'middle', 'var(--accent)')}
    ${bus ? label(xBus + 6, fs * 1.1, 'Bus 12 m', 'middle') : ''}
  </svg>`;
}
