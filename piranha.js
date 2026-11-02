// 🐟 Piranha-Schwarm: Pixelbilder abknabbern. Oben ein bildschirmbreites Pixelbild (36×36, bis zu 13 Farben, mit Hintergrund),
// darunter der Fluss mit wenigen Warte-Buchten, unten ein Raster aus Wurzelhöhlen mit nummerierten Piranha-Schwärmen.
//  • Antippen geht nur bei Höhlen mit freiem Weg zum Fluss (vorderste Reihe oder freie Nachbarfelder).
//  • Der Schwarm schwimmt von unten ins Bild und frisst Pixel seiner Farbe, die am freien Wasser liegen (von unten erreichbar).
//  • Was er nicht fressen kann, wartet in einer Bucht und frisst automatisch weiter, sobald seine Farbe frei wird.
//  • Alle Buchten voll und ein Schwarm findet nichts → der Fluss ist verstopft (mit „Zurück“ rettbar).
// Levels entstehen rückwärts aus dem Bild (garantiert lösbar), werden dann gemischt und per Simulation geprüft.
// (Viele Piranha-Arten fressen tatsächlich auch Früchte und Samen, die ins Wasser fallen.)
const PR_KEY = 'walquiz.piranha.v1';
const PR_FARBEN = [
  { name: 'Rot', c: '#e53935' }, { name: 'Orange', c: '#fb8c00' }, { name: 'Gelb', c: '#fdd835' }, { name: 'Hellgrün', c: '#8bc34a' },
  { name: 'Dunkelgrün', c: '#2e7d32' }, { name: 'Türkis', c: '#26c6da' }, { name: 'Blau', c: '#1e88e5' }, { name: 'Dunkelblau', c: '#283593' },
  { name: 'Lila', c: '#8e24aa' }, { name: 'Rosa', c: '#f48fb1' }, { name: 'Braun', c: '#795548' }, { name: 'Weiß', c: '#f5f5f5' }, { name: 'Schwarz', c: '#263238' },
  { name: 'Grau', c: '#90a4ae' }, { name: 'Sand', c: '#e6c88a' },
];
const PR_RGB = PR_FARBEN.map((f) => [1, 3, 5].map((k) => parseInt(f.c.slice(k, k + 2), 16)));
const PB = 36;   // Bildgröße in Pixeln (quadratisch)
const PR_SPALTEN = 6;

// ---------- Motive: kleine Vektorszenen, gerastert auf 36×36 und auf die Palette gerundet ----------
const F = (i) => PR_FARBEN[i].c;
const PR_MOTIVE = [
  { name: 'Buckelwal-Fluke', emoji: '🐋', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 14);
    x.fillStyle = F(11); [[6, 5, 4], [26, 4, 5]].forEach(([a, b, r]) => { x.beginPath(); x.ellipse(a, b, r, r * 0.5, 0, 0, 7); x.fill(); });
    x.fillStyle = F(6); x.fillRect(0, 14, 36, 22);
    x.fillStyle = F(7); for (let i = 0; i < 4; i++) x.fillRect(0, 22 + i * 4, 36, 1.4);
    x.fillStyle = F(11); [[8, 26], [20, 24], [30, 30]].forEach(([a, b]) => x.fillRect(a, b, 4, 1));
    // Fluke
    x.fillStyle = F(12);
    x.beginPath(); x.moveTo(18, 26); x.lineTo(16.5, 15); x.quadraticCurveTo(10, 14, 4, 7); x.quadraticCurveTo(11, 9, 18, 11); x.quadraticCurveTo(25, 9, 32, 7); x.quadraticCurveTo(26, 14, 19.5, 15); x.lineTo(20, 26); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.moveTo(8, 9.5); x.quadraticCurveTo(13, 12, 17, 12.5); x.lineTo(16, 13.5); x.quadraticCurveTo(11, 13, 8, 9.5); x.fill();
    x.beginPath(); x.moveTo(28, 9.5); x.quadraticCurveTo(23, 12, 19, 12.5); x.lineTo(20, 13.5); x.quadraticCurveTo(25, 13, 28, 9.5); x.fill();
    x.fillStyle = F(11); [[13, 26, 3], [23, 26, 3], [18, 27, 4]].forEach(([a, b, r]) => { x.beginPath(); x.ellipse(a, b, r, 1.3, 0, 0, 7); x.fill(); });
    [[12, 23], [24, 22], [16, 21], [21, 20]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 0.9, 0, 7); x.fill(); });
  } },
  { name: 'Kugelbake in Cuxhaven', emoji: '⚓', mal(x) {
    [[1, 0, 6], [9, 6, 5], [2, 11, 4]].forEach(([c, y, h]) => { x.fillStyle = F(c); x.fillRect(0, y, 36, h); });
    x.fillStyle = F(11); x.beginPath(); x.arc(28, 10, 3, 0, 7); x.fill();
    x.fillStyle = F(6); x.fillRect(0, 15, 36, 9);
    x.fillStyle = F(1); [[22, 17, 9], [24, 20, 6]].forEach(([a, b, w]) => x.fillRect(a, b, w, 0.9));
    x.fillStyle = F(13); x.fillRect(0, 24, 36, 12);
    x.fillStyle = F(10); for (let i = 0; i < 5; i++) x.fillRect(i * 8 + 1, 27 + (i % 2) * 4, 5, 1);
    // Bake: Mast, schräge Streben, Querbalken, Kugel aus Ringen
    x.fillStyle = F(12);
    x.fillRect(13.3, 4, 1.4, 24);
    x.beginPath(); x.moveTo(14, 12); x.lineTo(8, 28); x.lineTo(9.5, 28); x.lineTo(14.5, 13); x.fill();
    x.beginPath(); x.moveTo(14, 12); x.lineTo(20, 28); x.lineTo(18.5, 28); x.lineTo(13.5, 13); x.fill();
    for (let y = 16; y < 28; y += 4) { const w = (y - 12) * 0.38; x.fillRect(14 - w, y, w * 2, 0.9); }
    x.strokeStyle = F(12); x.lineWidth = 1;
    x.beginPath(); x.arc(14, 6, 3.6, 0, 7); x.stroke();
    x.beginPath(); x.ellipse(14, 6, 1.5, 3.6, 0, 0, 7); x.stroke();
    x.fillRect(10, 5.5, 8, 0.9);
    x.fillRect(13.6, 0, 0.9, 3);
    // Möwe
    x.strokeStyle = F(11); x.lineWidth = 0.9; x.beginPath(); x.moveTo(23, 4); x.quadraticCurveTo(25, 2.5, 26.5, 4); x.quadraticCurveTo(28, 2.5, 30, 4); x.stroke();
  } },
  { name: 'Clownfisch', emoji: '🐠', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); x.fillRect(0, 26, 36, 10);
    for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? F(9) : F(8); x.beginPath(); x.ellipse(1 + i * 3.8, 31, 1.5, 5 + (i % 3), 0.25 * (i % 3 - 1), 0, 7); x.fill(); }
    x.fillStyle = F(11); [[4, 5], [7, 2], [31, 8]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 0.9, 0, 7); x.fill(); });
    // Körper mit schwarzem Rand
    const koerper = () => { x.beginPath(); x.ellipse(18, 15, 12.5, 8, 0, 0, 7); };
    x.fillStyle = F(12);
    koerper(); x.fill();
    x.beginPath(); x.moveTo(7, 15); x.lineTo(0, 7); x.lineTo(0, 23); x.fill();
    x.beginPath(); x.moveTo(11, 8.5); x.quadraticCurveTo(18, 1, 25, 8.5); x.fill();
    x.fillStyle = F(1);
    x.beginPath(); x.ellipse(18, 15, 11.3, 6.9, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(7, 15); x.lineTo(1, 9); x.lineTo(1, 21); x.fill();
    x.beginPath(); x.moveTo(12, 9); x.quadraticCurveTo(18, 3, 24, 9); x.fill();
    x.beginPath(); x.ellipse(15, 23, 3, 1.6, 0.4, 0, 7); x.fill();
    // weiße Bänder nur im Körper
    x.save(); x.beginPath(); x.ellipse(18, 15, 11.3, 6.9, 0, 0, 7); x.clip();
    [[25, 1.6], [17.5, 2], [10, 1.5]].forEach(([a, w]) => { x.fillStyle = F(12); x.fillRect(a - w - 0.9, 0, w * 2 + 1.8, 36); x.fillStyle = F(11); x.fillRect(a - w, 0, w * 2, 36); });
    x.restore();
    x.fillStyle = F(12); x.beginPath(); x.arc(27.3, 13, 1.4, 0, 7); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.arc(27.7, 12.6, 0.5, 0, 7); x.fill();
  } },
  { name: 'Leuchtturm an der Elbe', emoji: '🗼', mal(x) {
    x.fillStyle = F(7); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(11); [[3, 3], [9, 8], [30, 4], [33, 11], [5, 13]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
    x.fillStyle = F(2); x.globalAlpha = 0.9;
    x.beginPath(); x.moveTo(18, 6); x.lineTo(0, 1); x.lineTo(0, 9); x.fill();
    x.beginPath(); x.moveTo(18, 6); x.lineTo(36, 4); x.lineTo(36, 11); x.fill(); x.globalAlpha = 1;
    x.fillStyle = F(6); x.fillRect(0, 26, 36, 10);
    x.fillStyle = F(4); x.beginPath(); x.moveTo(0, 28); x.quadraticCurveTo(18, 20, 36, 28); x.lineTo(36, 30); x.lineTo(0, 30); x.fill();
    x.fillStyle = F(3); x.beginPath(); x.moveTo(4, 27); x.quadraticCurveTo(18, 21, 32, 27); x.lineTo(32, 28); x.lineTo(4, 28); x.fill();
    // Turm mit Streifen
    for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? F(11) : F(0); x.beginPath(); const y0 = 9 + i * 3, w0 = 3.2 + i * 0.35, w1 = 3.2 + (i + 1) * 0.35; x.moveTo(18 - w0, y0); x.lineTo(18 + w0, y0); x.lineTo(18 + w1, y0 + 3); x.lineTo(18 - w1, y0 + 3); x.fill(); }
    x.fillStyle = F(12); x.fillRect(13.5, 8, 9, 1.4); x.fillRect(15, 3, 6, 5);
    x.fillStyle = F(2); x.fillRect(16, 4, 4, 3);
    x.fillStyle = F(0); x.beginPath(); x.moveTo(14.5, 3); x.lineTo(18, 0); x.lineTo(21.5, 3); x.fill();
    x.fillStyle = F(12); x.fillRect(17, 20, 2, 3);
    x.fillStyle = F(11); [[5, 32], [24, 33], [30, 31]].forEach(([a, b]) => x.fillRect(a, b, 4, 0.9));
  } },
  { name: 'Orca', emoji: '🐳', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 20);
    x.fillStyle = F(11); x.beginPath(); x.ellipse(8, 5, 5, 2, 0, 0, 7); x.fill();
    x.fillStyle = F(6); x.fillRect(0, 20, 36, 16);
    x.fillStyle = F(7); for (let i = 0; i < 3; i++) x.fillRect(0, 25 + i * 4, 36, 1.4);
    x.save(); x.translate(18, 17); x.rotate(-0.45);
    x.fillStyle = F(12); x.beginPath(); x.ellipse(0, 0, 14, 5.5, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(-1, -4); x.lineTo(1, -12); x.lineTo(4, -4); x.fill();
    x.beginPath(); x.moveTo(-13, 0); x.lineTo(-18, -4); x.lineTo(-16, 0); x.lineTo(-18, 4); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(2, 3, 10, 2.2, 0, 0, 7); x.fill();
    x.beginPath(); x.ellipse(9, -2, 2.2, 1.1, 0.2, 0, 7); x.fill();
    x.fillStyle = F(13); x.beginPath(); x.ellipse(-3, -3.5, 3, 1, 0, 0, 7); x.fill();
    x.restore();
    x.fillStyle = F(11); [[9, 21, 4], [27, 21, 4], [18, 22, 3]].forEach(([a, b, r]) => { x.beginPath(); x.ellipse(a, b, r, 1.6, 0, 0, 7); x.fill(); });
  } },
  { name: 'Strandkörbe in Duhnen', emoji: '🏖️', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 12);
    x.fillStyle = F(2); x.beginPath(); x.arc(30, 4, 3, 0, 7); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(9, 5, 5, 1.8, 0, 0, 7); x.fill();
    x.fillStyle = F(6); x.fillRect(0, 12, 36, 7);
    x.fillStyle = F(11); x.fillRect(0, 18, 36, 1);
    x.fillStyle = F(14); x.fillRect(0, 19, 36, 17);
    const korb = (a, b, c) => {
      x.fillStyle = F(11); x.beginPath(); x.moveTo(a, b + 9); x.lineTo(a, b + 2); x.quadraticCurveTo(a + 4, b - 2, a + 8, b + 2); x.lineTo(a + 8, b + 9); x.fill();
      x.fillStyle = F(c); for (let i = 0; i < 4; i++) x.fillRect(a + 0.5 + i * 2, b + 1, 1, 5);
      x.fillStyle = F(10); x.fillRect(a + 1.5, b + 4, 5, 4.5);
      x.fillStyle = F(c); x.fillRect(a + 1.5, b + 7, 5, 1.5);
    };
    korb(2, 21, 6); korb(14, 23, 0); korb(26, 21, 6);
    x.fillStyle = F(10); [[11, 33], [24, 34]].forEach(([a, b]) => x.fillRect(a, b, 2, 1));
  } },
  { name: 'Seehund im Watt', emoji: '🦭', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 12);
    x.fillStyle = F(11); x.beginPath(); x.ellipse(26, 4, 5, 1.6, 0, 0, 7); x.fill();
    x.fillStyle = F(6); x.fillRect(0, 12, 36, 4);
    x.fillStyle = F(14); x.fillRect(0, 16, 36, 20);
    x.fillStyle = F(10); for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse((i * 13) % 36 + 2, 18 + (i * 7) % 16, 3, 0.5, 0, 0, 7); x.fill(); }
    x.fillStyle = F(5); [[5, 33, 4], [31, 31, 3.5]].forEach(([a, b, r]) => { x.beginPath(); x.ellipse(a, b, r, 1.2, 0, 0, 7); x.fill(); });
    // Seehund, liegend, Kopf hoch
    x.fillStyle = F(12);
    x.beginPath(); x.ellipse(19, 25, 13.5, 6.2, -0.08, 0, 7); x.fill();
    x.beginPath(); x.ellipse(9, 17, 6.2, 5.6, 0, 0, 7); x.fill();
    x.fillStyle = F(13);
    x.beginPath(); x.ellipse(19, 25, 12.6, 5.3, -0.08, 0, 7); x.fill();
    x.beginPath(); x.ellipse(9, 17.3, 5.3, 4.8, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(6, 20); x.lineTo(13, 20); x.lineTo(14, 25); x.lineTo(7, 25); x.fill();
    x.beginPath(); x.moveTo(30, 25); x.lineTo(35.5, 21); x.lineTo(35, 29); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(18, 28.5, 9, 1.8, -0.05, 0, 7); x.fill();
    x.fillStyle = F(12); [[17, 23], [22, 24], [26, 22], [13, 25], [20, 21], [24, 26]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
    x.beginPath(); x.ellipse(15, 28, 2.5, 1.1, 0.3, 0, 7); x.fill();
    x.beginPath(); x.arc(7, 16, 1.3, 0, 7); x.fill(); x.beginPath(); x.arc(11, 16, 1.3, 0, 7); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.arc(7.4, 15.6, 0.45, 0, 7); x.fill(); x.beginPath(); x.arc(11.4, 15.6, 0.45, 0, 7); x.fill();
    x.fillStyle = F(12); x.beginPath(); x.ellipse(9, 19.3, 1.4, 0.9, 0, 0, 7); x.fill();
  } },
  { name: 'Containerschiff vor Cuxhaven', emoji: '🚢', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 18);
    x.fillStyle = F(11); [[6, 4, 5], [25, 6, 6]].forEach(([a, b, r]) => { x.beginPath(); x.ellipse(a, b, r, 1.8, 0, 0, 7); x.fill(); });
    x.fillStyle = F(6); x.fillRect(0, 18, 36, 18);
    x.fillStyle = F(7); for (let i = 0; i < 4; i++) x.fillRect(0, 24 + i * 3, 36, 1);
    x.fillStyle = F(0); x.beginPath(); x.moveTo(1, 17); x.lineTo(35, 17); x.lineTo(32, 23); x.lineTo(3, 23); x.fill();
    x.fillStyle = F(12); x.fillRect(3, 21, 29, 2);
    const farben = [0, 6, 2, 4, 1, 11, 7, 3];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { x.fillStyle = F(farben[(r * 3 + c * 5) % farben.length]); x.fillRect(7 + c * 4, 14 - r * 3, 3.6, 2.7); }
    x.fillStyle = F(11); x.fillRect(29, 6, 4, 11); x.fillStyle = F(12); x.fillRect(29.5, 7, 3, 1); x.fillRect(29.5, 9, 3, 1);
    x.fillStyle = F(0); x.fillRect(30, 3, 2, 3);
    x.fillStyle = F(11); [[5, 25], [15, 27], [27, 29]].forEach(([a, b]) => x.fillRect(a, b, 5, 0.9));
  } },
  { name: 'Blauwal', emoji: '🐋', mal(x) {
    x.fillStyle = F(7); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); x.fillRect(0, 0, 36, 7);
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 2.5);
    x.fillStyle = F(6); for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(8 + i * 11, 7); x.lineTo(4 + i * 11, 36); x.lineTo(5 + i * 11, 36); x.lineTo(10 + i * 11, 7); x.fill(); }
    // Wal
    x.fillStyle = F(13); x.beginPath(); x.moveTo(1, 19); x.quadraticCurveTo(12, 9, 28, 16); x.quadraticCurveTo(31, 18, 28, 21); x.quadraticCurveTo(12, 28, 1, 19); x.fill();
    x.beginPath(); x.moveTo(27, 17); x.lineTo(35.5, 11); x.lineTo(33, 19); x.lineTo(35.5, 26); x.lineTo(27, 20); x.fill();
    x.beginPath(); x.moveTo(11, 22); x.lineTo(16, 29); x.lineTo(15, 22); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(13, 22, 9, 2, 0.1, 0, 7); x.fill();
    x.fillStyle = F(13); for (let i = 0; i < 2; i++) x.fillRect(5, 21 + i * 2, 12, 1);
    x.fillStyle = F(12); x.fillRect(6, 17, 2, 1);
    x.fillStyle = F(11); [[3, 14, 1], [4, 11, 1], [5, 8, 2]].forEach(([a, b, r]) => x.fillRect(a, b, r, r));
  } },
  { name: 'Krabbenkutter im Hafen', emoji: '🦐', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 20);
    x.fillStyle = F(2); x.beginPath(); x.arc(5, 5, 3, 0, 7); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(26, 4, 6, 1.8, 0, 0, 7); x.fill();
    x.fillStyle = F(6); x.fillRect(0, 20, 36, 16);
    x.fillStyle = F(7); for (let i = 0; i < 4; i++) x.fillRect((i * 7) % 10, 26 + i * 3, 26, 1);
    x.strokeStyle = F(12); x.lineWidth = 1.4; x.beginPath(); x.moveTo(18, 7); x.lineTo(3, 16); x.moveTo(18, 7); x.lineTo(33, 16); x.stroke();
    x.fillStyle = F(13); x.beginPath(); x.moveTo(3, 16); x.lineTo(1, 24); x.lineTo(6, 24); x.fill(); x.beginPath(); x.moveTo(33, 16); x.lineTo(30, 24); x.lineTo(35, 24); x.fill();
    x.fillStyle = F(10); x.fillRect(17, 3, 2, 16);
    x.fillStyle = F(0); x.fillRect(19, 3, 3, 2);
    x.fillStyle = F(4); x.beginPath(); x.moveTo(5, 18); x.lineTo(32, 17); x.lineTo(29, 25); x.lineTo(9, 25); x.fill();
    x.fillStyle = F(11); x.fillRect(7, 19, 23, 1);
    x.fillStyle = F(0); x.fillRect(9, 24, 20, 1);
    x.fillStyle = F(11); x.fillRect(21, 12, 7, 6);
    x.fillStyle = F(12); x.fillRect(22, 13, 2, 2); x.fillRect(25, 13, 2, 2);
    x.fillStyle = F(0); x.fillRect(20, 11, 9, 1);
    x.fillStyle = F(1); [[7, 22], [12, 22]].forEach(([a, b]) => x.fillRect(a, b, 2, 2));
    x.strokeStyle = F(11); x.lineWidth = 0.9; [[8, 10], [28, 8]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + 1.5, b - 1.5, a + 3, b); x.quadraticCurveTo(a + 4.5, b - 1.5, a + 6, b); x.stroke(); });
  } },
  { name: 'Feuerqualle', emoji: '🪼', mal(x) {
    x.fillStyle = F(7); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); x.fillRect(0, 0, 36, 6); x.fillStyle = F(5); x.fillRect(0, 0, 36, 2);
    x.lineWidth = 1.2; for (let i = 0; i < 7; i++) { x.strokeStyle = i % 2 ? F(9) : F(0); x.beginPath(); const a = 9 + i * 3; x.moveTo(a, 14); x.bezierCurveTo(a - 4, 21, a + 4, 27, a - 1 + (i % 3), 36); x.stroke(); }
    x.fillStyle = F(9); x.beginPath(); x.ellipse(18, 20, 3, 7, 0, 0, 7); x.fill();
    x.fillStyle = F(0); x.beginPath(); x.ellipse(18, 14, 12, 9, 0, Math.PI, 0); x.quadraticCurveTo(18, 18, 6, 14); x.fill();
    x.fillStyle = F(1); x.beginPath(); x.ellipse(18, 13, 8.5, 6, 0, Math.PI, 0); x.fill();
    x.fillStyle = F(2); x.beginPath(); x.ellipse(14.5, 9.5, 2.6, 1.5, -0.4, 0, 7); x.fill();
    x.fillStyle = F(9); for (let i = 0; i < 6; i++) x.fillRect(8 + i * 4, 14, 2, 1);
    x.fillStyle = F(11); [[4, 10], [5, 7], [31, 22], [30, 19], [3, 15]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
    x.fillStyle = F(2); [[3, 28], [29, 31], [5, 32]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a + 1.5, b, 1.8, 1, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(a, b); x.lineTo(a - 1.5, b - 1.2); x.lineTo(a - 1.5, b + 1.2); x.fill(); });
  } },
  { name: 'Meeresschildkröte', emoji: '🐢', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); x.fillRect(0, 24, 36, 12);
    x.fillStyle = F(14); x.beginPath(); x.moveTo(0, 32); x.quadraticCurveTo(18, 28, 36, 31); x.lineTo(36, 36); x.lineTo(0, 36); x.fill();
    x.fillStyle = F(4); for (let i = 0; i < 5; i++) { const a = 2 + i * 8; x.beginPath(); x.moveTo(a, 33); x.quadraticCurveTo(a - 2, 28, a + 1, 24 + (i % 2) * 2); x.lineTo(a + 2, 25 + (i % 2) * 2); x.quadraticCurveTo(a, 28, a + 1.5, 33); x.fill(); }
    x.fillStyle = F(3);
    [[23, 9, -0.6, 7], [23, 25, 0.6, 7], [8, 12, 0.6, 3.5], [8, 22, -0.6, 3.5]].forEach(([a, b, w, l]) => { x.beginPath(); x.ellipse(a, b, l, 2.2, w, 0, 7); x.fill(); });
    x.beginPath(); x.ellipse(29.5, 17, 4, 3, 0, 0, 7); x.fill();
    x.fillStyle = F(10); x.beginPath(); x.ellipse(17, 17, 10.5, 8, 0, 0, 7); x.fill();
    x.fillStyle = F(4); x.beginPath(); x.ellipse(17, 17, 9.5, 7, 0, 0, 7); x.fill();
    x.fillStyle = F(3); [[17, 17, 2.8, 2.2], [11.5, 14.5, 2.2, 1.7], [11.5, 19.5, 2.2, 1.7], [22.5, 14.5, 2.2, 1.7], [22.5, 19.5, 2.2, 1.7], [17, 12, 2.2, 1.4], [17, 22, 2.2, 1.4]].forEach(([a, b, rx, ry]) => { x.beginPath(); x.ellipse(a, b, rx, ry, 0, 0, 7); x.fill(); });
    x.fillStyle = F(12); x.fillRect(30, 15, 1, 1);
    x.fillStyle = F(11); [[33, 10], [34, 7], [32, 4]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
  } },
  { name: 'Korallenriff', emoji: '🪸', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); x.fillRect(0, 13, 36, 23);
    x.fillStyle = F(14); x.beginPath(); x.moveTo(0, 31); x.quadraticCurveTo(18, 29, 36, 32); x.lineTo(36, 36); x.lineTo(0, 36); x.fill();
    x.fillStyle = F(8); x.beginPath(); x.moveTo(7, 32); x.lineTo(0, 17); x.quadraticCurveTo(7, 9, 14, 17); x.fill();
    x.strokeStyle = F(9); x.lineWidth = 0.8; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(7, 31); x.lineTo(2 + i * 3.3, 15); x.stroke(); }
    x.fillStyle = F(1); x.beginPath(); x.ellipse(19, 31, 6.5, 4.5, 0, Math.PI, 0); x.fill();
    x.fillStyle = F(0); for (let i = 0; i < 3; i++) x.fillRect(14 + i * 4, 28, 2, 1);
    x.strokeStyle = F(9); x.lineWidth = 1.7; x.lineCap = 'round';
    [[30, 32, 30, 22], [30, 26, 26, 20], [30, 24, 34, 18], [26, 20, 25, 15], [30, 22, 31, 15]].forEach(([a, b, c, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); });
    x.fillStyle = F(3); for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(11 + i * 1.6, 27, 0.7, 3, (i - 2) * 0.25, 0, 7); x.fill(); }
    const fisch = (a, b, c, s) => { x.fillStyle = F(c); x.beginPath(); x.ellipse(a, b, 2.6 * s, 1.5 * s, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(a - 2 * s, b); x.lineTo(a - 3.8 * s, b - 1.4 * s); x.lineTo(a - 3.8 * s, b + 1.4 * s); x.fill(); x.fillStyle = F(12); x.fillRect(a + 1 * s, b - 0.6, 1, 1); };
    fisch(14, 6, 2, 1.3); fisch(26, 10, 2, 1.1); fisch(30, 4, 0, 1.1);
    x.fillStyle = F(11); [[6, 4], [7, 2], [33, 12]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
  } },
  { name: 'Hai', emoji: '🦈', mal(x) {
    x.fillStyle = F(7); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); x.fillRect(0, 0, 36, 13);
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 4);
    x.fillStyle = F(6); for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(6 + i * 12, 13); x.lineTo(3 + i * 12, 36); x.lineTo(4 + i * 12, 36); x.lineTo(8 + i * 12, 13); x.fill(); }
    x.fillStyle = F(13);
    x.beginPath(); x.moveTo(34, 17); x.quadraticCurveTo(27, 11, 13, 14); x.quadraticCurveTo(7, 15, 4, 17); x.quadraticCurveTo(10, 21.5, 21, 22); x.quadraticCurveTo(29, 22, 34, 17); x.fill();
    x.beginPath(); x.moveTo(6, 17); x.lineTo(0, 9); x.lineTo(2, 17); x.lineTo(0, 25); x.fill();
    x.beginPath(); x.moveTo(15, 14); x.lineTo(19, 6); x.lineTo(23, 13.5); x.fill();
    x.beginPath(); x.moveTo(20, 21); x.lineTo(16, 28); x.lineTo(25, 21.5); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.moveTo(34, 17.5); x.quadraticCurveTo(29, 21.5, 21, 21.6); x.quadraticCurveTo(12, 21.2, 7, 18.6); x.quadraticCurveTo(19, 20, 34, 17.5); x.fill();
    x.fillStyle = F(12); x.fillRect(29, 15, 1, 1); [25, 26.5, 28].forEach((a) => x.fillRect(a, 16.5, 0.8, 2.5));
    x.fillStyle = F(2); for (let i = 0; i < 14; i++) { const a = 3 + (i * 7) % 12, b = 27 + (i * 5) % 8; x.fillRect(a, b, 2, 1); }
    x.fillStyle = F(11); [[31, 8], [32, 5], [30, 2]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
  } },
  { name: 'Seestern am Strand', emoji: '⭐', mal(x) {
    x.fillStyle = F(14); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); x.fillRect(0, 0, 36, 6);
    x.fillStyle = F(5); x.beginPath(); x.moveTo(0, 5); for (let i = 0; i <= 6; i++) x.quadraticCurveTo(i * 6 + 3, 11, i * 6 + 6, 8); x.lineTo(36, 5); x.fill();
    x.fillStyle = F(11); for (let i = 0; i < 6; i++) x.fillRect(i * 6 + 1, 9 + (i % 2), 4, 1);
    x.fillStyle = F(1); x.beginPath();
    for (let k = 0; k < 10; k++) { const w = -Math.PI / 2 - 0.2 + k * Math.PI / 5, r = k % 2 ? 4.2 : 10.5; x.lineTo(16 + Math.cos(w) * r, 21 + Math.sin(w) * r); }
    x.fill();
    x.fillStyle = F(0); for (let k = 0; k < 5; k++) { const w = -Math.PI / 2 - 0.2 + k * 2 * Math.PI / 5; for (let s = 2; s < 9; s += 2.5) x.fillRect(16 + Math.cos(w) * s - 0.5, 21 + Math.sin(w) * s - 0.5, 1, 1); }
    x.fillStyle = F(9); x.beginPath(); x.ellipse(30, 30, 4, 3.4, 0, Math.PI, 0); x.fill();
    x.fillStyle = F(11); for (let i = 0; i < 4; i++) x.fillRect(27 + i * 2, 27.5, 0.8, 2.5);
    x.fillStyle = F(11); x.beginPath(); x.arc(5, 30, 2.4, 0, 7); x.fill(); x.fillStyle = F(13); x.beginPath(); x.arc(5.5, 30, 1, 0, 7); x.fill();
    x.fillStyle = F(0); x.beginPath(); x.ellipse(30, 16, 2.6, 1.8, 0, 0, 7); x.fill(); x.fillRect(26, 14, 1, 1); x.fillRect(33, 14, 1, 1);
    x.fillStyle = F(10); [[9, 33], [22, 34], [13, 12], [26, 23]].forEach(([a, b]) => x.fillRect(a, b, 2, 1));
  } },
  { name: 'Wassermelone', emoji: '🍉', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(11); for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(4 + i * 6, 4 + (i % 2) * 3, 1.3, 0, 7); x.fill(); }
    x.save(); x.translate(18, 13); x.rotate(0.25);
    x.fillStyle = F(4); x.beginPath(); x.arc(0, 0, 17, 0, Math.PI); x.fill();
    x.fillStyle = F(3); x.beginPath(); x.arc(0, 0, 15, 0, Math.PI); x.fill();
    x.fillStyle = F(0); x.beginPath(); x.arc(0, 0, 13, 0, Math.PI); x.fill();
    x.fillStyle = F(9); x.beginPath(); x.arc(-4, 2, 6, 0, Math.PI); x.fill();
    x.fillStyle = F(12); [[-8, 4], [-3, 7], [2, 5], [7, 3], [0, 10], [-6, 9], [5, 9]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 1, 1.6, 0.3, 0, 7); x.fill(); });
    x.restore();
  } },
  { name: 'Sonnenuntergang am Fluss', emoji: '🌅', mal(x) {
    [[8, 0, 7], [9, 7, 5], [1, 12, 5], [2, 17, 4]].forEach(([c, y, h]) => { x.fillStyle = F(c); x.fillRect(0, y, 36, h); });
    x.fillStyle = F(2); x.beginPath(); x.arc(18, 21, 7, Math.PI, 0); x.fill();
    x.fillStyle = F(7); x.fillRect(0, 21, 36, 15);
    x.fillStyle = F(1); [[14, 23, 8], [12, 26, 12], [15, 29, 6], [13, 32, 10]].forEach(([a, b, w]) => x.fillRect(a, b, w, 1.2));
    x.fillStyle = F(12);
    [[4, 21], [31, 21]].forEach(([px, py]) => {
      x.fillRect(px - 0.7, py - 13, 1.6, 13);
      [[-6, -2], [6, -2], [-4, 2], [4, 2], [0, -4]].forEach(([dx, dy]) => { x.beginPath(); x.moveTo(px, py - 13); x.quadraticCurveTo(px + dx * 0.6, py - 16 + dy, px + dx, py - 11 + dy); x.lineTo(px, py - 12); x.fill(); });
    });
    x.fillRect(0, 20, 36, 1.5);
  } },
  { name: 'Tukan', emoji: '🐦', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(4); [[3, 6, 6], [32, 9, 7], [5, 30, 6], [33, 31, 6]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
    x.fillStyle = F(10); x.fillRect(0, 27, 36, 3);
    x.fillStyle = F(12); x.beginPath(); x.ellipse(13, 18, 7, 10, 0.2, 0, 7); x.fill();
    x.fillStyle = F(2); x.beginPath(); x.ellipse(15, 12, 4, 4.5, 0, 0, 7); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(15, 14, 3, 2.5, 0, 0, 7); x.fill();
    x.fillStyle = F(1); x.beginPath(); x.moveTo(17, 8); x.quadraticCurveTo(31, 7, 33, 13); x.quadraticCurveTo(26, 14, 17, 13); x.fill();
    x.fillStyle = F(0); x.beginPath(); x.moveTo(29, 9); x.quadraticCurveTo(33, 10, 33, 13); x.lineTo(29, 13); x.fill();
    x.fillStyle = F(12); x.fillRect(17, 10.5, 15, 0.8);
    x.fillStyle = F(6); x.beginPath(); x.arc(14, 9, 1.8, 0, 7); x.fill(); x.fillStyle = F(12); x.beginPath(); x.arc(14.3, 9, 0.8, 0, 7); x.fill();
    x.fillStyle = F(0); x.fillRect(10, 26, 7, 1.5);
  } },
  { name: 'Frosch auf Seerose', emoji: '🐸', mal(x) {
    x.fillStyle = F(7); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); for (let i = 0; i < 5; i++) x.fillRect(0, 3 + i * 7, 36, 1.2);
    x.fillStyle = F(4); x.beginPath(); x.ellipse(18, 26, 16, 7, 0, 0.3, Math.PI * 2 - 0.1); x.lineTo(18, 26); x.fill();
    x.fillStyle = F(3); x.beginPath(); x.ellipse(18, 21, 9, 7, 0, 0, 7); x.fill();
    x.fillStyle = F(2); x.beginPath(); x.ellipse(18, 23, 6, 4, 0, 0, 7); x.fill();
    x.fillStyle = F(3); [[13, 14], [23, 14]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 3.4, 0, 7); x.fill(); });
    x.fillStyle = F(11); [[13, 14], [23, 14]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 2.2, 0, 7); x.fill(); });
    x.fillStyle = F(12); [[13.5, 14], [23.5, 14]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 1.1, 0, 7); x.fill(); });
    x.fillStyle = F(0); x.fillRect(15, 19, 6, 0.9);
    x.fillStyle = F(9); x.beginPath(); for (let k = 0; k < 6; k++) { const w = k * Math.PI / 3; x.ellipse(30 + Math.cos(w) * 2.5, 7 + Math.sin(w) * 2.5, 2.4, 1.4, w, 0, 7); } x.fill();
    x.fillStyle = F(2); x.beginPath(); x.arc(30, 7, 1.4, 0, 7); x.fill();
  } },
  { name: 'Morphofalter', emoji: '🦋', mal(x) {
    x.fillStyle = F(3); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(4); [[0, 0, 12], [36, 36, 13], [36, 0, 8], [0, 36, 9]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
    const fluegel = (s) => {
      x.fillStyle = F(12); x.beginPath(); x.ellipse(18 + s * 8, 12, 10, 9, s * 0.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(18 + s * 6, 25, 7, 7, -s * 0.4, 0, 7); x.fill();
      x.fillStyle = F(6); x.beginPath(); x.ellipse(18 + s * 7.5, 12, 8, 7, s * 0.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(18 + s * 5.5, 24.5, 5.5, 5.5, -s * 0.4, 0, 7); x.fill();
      x.fillStyle = F(5); x.beginPath(); x.ellipse(18 + s * 6, 13, 4, 3.5, s * 0.5, 0, 7); x.fill();
      x.fillStyle = F(11); [[13, 6], [15, 9], [9, 22]].forEach(([a, b]) => { x.beginPath(); x.arc(18 + s * a, b, 0.9, 0, 7); x.fill(); });
    };
    fluegel(-1); fluegel(1);
    x.fillStyle = F(12); x.beginPath(); x.ellipse(18, 18, 1.5, 10, 0, 0, 7); x.fill();
    x.strokeStyle = F(12); x.lineWidth = 0.8; x.beginPath(); x.moveTo(17.5, 9); x.lineTo(14, 3); x.moveTo(18.5, 9); x.lineTo(22, 3); x.stroke();
  } },
  { name: 'Ara', emoji: '🦜', mal(x) {
    x.fillStyle = F(2); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(1); for (let i = 0; i < 36; i += 6) { x.beginPath(); x.arc(i, 36, 5, 0, 7); x.fill(); }
    x.fillStyle = F(6); x.beginPath(); x.ellipse(22, 27, 9, 11, -0.3, 0, 7); x.fill();
    x.fillStyle = F(2); x.beginPath(); x.ellipse(24, 23, 5, 4, -0.3, 0, 7); x.fill();
    x.fillStyle = F(0); x.beginPath(); x.ellipse(15, 17, 11, 12, 0, 0, 7); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(13, 15, 5.5, 6, 0, 0, 7); x.fill();
    x.strokeStyle = F(12); x.lineWidth = 0.6; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(9.5, 13 + i * 2); x.lineTo(15, 14 + i * 2); x.stroke(); }
    x.fillStyle = F(2); x.beginPath(); x.arc(14, 13, 2.2, 0, 7); x.fill(); x.fillStyle = F(12); x.beginPath(); x.arc(14, 13, 1.1, 0, 7); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.moveTo(6, 14); x.quadraticCurveTo(-1, 16, 3, 24); x.quadraticCurveTo(6, 21, 8, 19); x.fill();
    x.fillStyle = F(12); x.beginPath(); x.moveTo(4, 20); x.quadraticCurveTo(6, 23, 3, 24); x.lineTo(7, 19); x.fill();
  } },
  { name: 'Piranha', emoji: '🐟', mal(x) {
    x.fillStyle = F(7); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(4 + i * 6, 3 + (i % 3) * 2, 0.9, 0, 7); x.fill(); }
    x.fillStyle = F(4); [[2, 36], [8, 36], [30, 36], [35, 36]].forEach(([a, b]) => x.fillRect(a, b - 10, 1.5, 10));
    x.fillStyle = F(5); x.beginPath(); x.moveTo(4, 18); x.lineTo(0, 10); x.lineTo(0, 26); x.fill();
    x.fillStyle = F(6); x.beginPath(); x.ellipse(18, 18, 14, 11, 0, 0, 7); x.fill();
    x.fillStyle = F(0); x.beginPath(); x.ellipse(19, 23, 11, 5, 0, 0, Math.PI); x.fill(); x.beginPath(); x.ellipse(19, 22, 12, 4, 0, 0, 7); x.fill();
    x.fillStyle = F(5); x.beginPath(); x.moveTo(14, 7); x.lineTo(20, 2); x.lineTo(22, 8); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.arc(25, 14, 3, 0, 7); x.fill(); x.fillStyle = F(12); x.beginPath(); x.arc(26, 14, 1.6, 0, 7); x.fill();
    x.fillStyle = F(12); x.beginPath(); x.moveTo(32, 19); x.lineTo(24, 21); x.lineTo(32, 23); x.fill();
    x.fillStyle = F(11); for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(25 + i * 2, 21); x.lineTo(26 + i * 2, 22.6); x.lineTo(27 + i * 2, 21); x.fill(); }
  } },
  { name: 'Flussdelfin', emoji: '🐬', mal(x) {
    x.fillStyle = F(5); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(6); [6, 14, 22, 30].forEach((y) => { for (let i = 0; i < 36; i += 8) x.fillRect(i + (y % 16), y, 5, 1); });
    x.fillStyle = F(10); x.fillRect(0, 31, 36, 5); x.fillStyle = F(4); [[3, 31], [12, 31], [27, 31]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 3, 4, 0, 0, 7); x.fill(); });
    x.fillStyle = F(9); x.beginPath(); x.moveTo(3, 18); x.quadraticCurveTo(14, 6, 28, 13); x.quadraticCurveTo(34, 15, 35, 17); x.quadraticCurveTo(30, 18, 27, 20); x.quadraticCurveTo(16, 27, 6, 22); x.fill();
    x.beginPath(); x.moveTo(5, 19); x.lineTo(0, 13); x.lineTo(2, 19); x.lineTo(0, 25); x.fill();
    x.beginPath(); x.moveTo(15, 11); x.lineTo(18, 7); x.lineTo(20, 11); x.fill();
    x.fillStyle = F(11); x.beginPath(); x.ellipse(18, 20, 8, 3, 0.1, 0, 7); x.fill();
    x.fillStyle = F(12); x.beginPath(); x.arc(27, 15, 1, 0, 7); x.fill();
  } },
  { name: 'Seerose bei Nacht', emoji: '🪷', mal(x) {
    x.fillStyle = F(7); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(2); x.beginPath(); x.arc(28, 7, 4.5, 0, 7); x.fill(); x.fillStyle = F(7); x.beginPath(); x.arc(30, 6, 4, 0, 7); x.fill();
    x.fillStyle = F(11); [[4, 4], [10, 9], [16, 3], [21, 11], [6, 14]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
    x.fillStyle = F(6); x.fillRect(0, 20, 36, 16);
    x.fillStyle = F(4); [[7, 29, 8], [29, 31, 7]].forEach(([a, b, r]) => { x.beginPath(); x.ellipse(a, b, r, r * 0.45, 0, 0.4, Math.PI * 2 - 0.2); x.lineTo(a, b); x.fill(); });
    for (let k = 0; k < 9; k++) {
      const w = Math.PI + (k / 8) * Math.PI;
      x.fillStyle = k % 2 ? F(11) : F(9);
      x.beginPath(); x.ellipse(18 + Math.cos(w) * 6, 23 + Math.sin(w) * 4, 5, 2.2, w, 0, 7); x.fill();
    }
    x.fillStyle = F(9); x.beginPath(); x.ellipse(18, 22, 4, 4, 0, Math.PI, 0); x.fill();
    x.fillStyle = F(2); x.beginPath(); x.arc(18, 22, 2, 0, 7); x.fill();
    x.fillStyle = F(9); x.globalAlpha = 0.6; x.fillRect(14, 27, 8, 1); x.fillRect(15, 30, 6, 1); x.globalAlpha = 1;
  } },
  { name: 'Erdbeeren', emoji: '🍓', mal(x) {
    x.fillStyle = F(11); x.fillRect(0, 0, 36, 36);
    x.fillStyle = F(9); for (let yy = 0; yy < 36; yy += 6) for (let xx = (yy / 6) % 2 * 3; xx < 36; xx += 6) x.fillRect(xx, yy, 3, 3);
    const beere = (a, b, s) => {
      x.fillStyle = F(0); x.beginPath(); x.moveTo(a - 7 * s, b - 3 * s); x.quadraticCurveTo(a, b - 8 * s, a + 7 * s, b - 3 * s); x.quadraticCurveTo(a + 5 * s, b + 7 * s, a, b + 10 * s); x.quadraticCurveTo(a - 5 * s, b + 7 * s, a - 7 * s, b - 3 * s); x.fill();
      x.fillStyle = F(2); for (let i = 0; i < 7; i++) x.fillRect(a - 4 * s + (i % 3) * 4 * s, b - 1 * s + Math.floor(i / 3) * 3.5 * s, 0.9, 0.9);
      x.fillStyle = F(4); x.beginPath(); for (let k = 0; k < 5; k++) { const w = -Math.PI / 2 + (k - 2) * 0.6; x.ellipse(a + Math.cos(w) * 3 * s, b - 5 * s + Math.sin(w) * 2 * s, 2.6 * s, 1.1 * s, w, 0, 7); } x.fill();
      x.fillStyle = F(3); x.fillRect(a - 0.6, b - 10 * s, 1.2, 4 * s);
    };
    beere(11, 13, 1); beere(25, 20, 1.15); beere(12, 27, 0.8);
  } },
];
// Motiv rastern und auf die Palette runden
function prMotivRaster(motiv) {
  const c = document.createElement('canvas'); c.width = c.height = PB;
  const x = c.getContext('2d');
  motiv.mal(x);
  const d = x.getImageData(0, 0, PB, PB).data, aus = new Int8Array(PB * PB);
  for (let i = 0; i < PB * PB; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    let best = 0, bd = 1e9;
    PR_RGB.forEach(([R, G, B], k) => { const dd = (r - R) ** 2 * 0.3 + (g - G) ** 2 * 0.59 + (b - B) ** 2 * 0.11; if (dd < bd) { bd = dd; best = k; } });
    aus[i] = best;
  }
  // Kantenreste glätten: Pixel ohne gleichfarbigen Nachbarn bekommen die häufigste Nachbarfarbe
  for (let durchgang = 0; durchgang < 2; durchgang++) {
    const neu = aus.slice();
    for (let i = 0; i < PB * PB; i++) {
      const x0 = i % PB, nb = [];
      if (x0 > 0) nb.push(aus[i - 1]); if (x0 < PB - 1) nb.push(aus[i + 1]); if (i >= PB) nb.push(aus[i - PB]); if (i < PB * (PB - 1)) nb.push(aus[i + PB]);
      if (nb.filter((c) => c === aus[i]).length >= 1) continue;
      const z = {}; nb.forEach((c) => { z[c] = (z[c] || 0) + 1; });
      neu[i] = Number(Object.entries(z).sort((a, b) => b[1] - a[1])[0][0]);
    }
    aus.set(neu);
  }
  return aus;
}

// ---------- Fressen ----------
// Bild: farbe[i] (Palette) und weg[i] (1 = gefressen). Pixel sind erreichbar, wenn sie von unten durch gefressene Felder angrenzen.
// Flut von unten: frisst bis zu n Pixel der Farbe f; liefert Liste [Zielindex, Weg (Bildindizes von unten bis Ziel)] in Fressreihenfolge.
function prFressen(farbe, weg, f, n, mitWegen) {
  const N = PB * PB, vor = new Int32Array(N).fill(-2), q = new Int32Array(N);
  let k = 0, e = 0;
  const raus = [];
  // Startrand: unterste Reihe ist vom Fluss aus erreichbar
  const pruefen = (j, von) => {
    if (vor[j] !== -2) return;
    if (weg[j]) { vor[j] = von; q[e++] = j; }
    else if (farbe[j] === f && raus.length < n) {
      vor[j] = von; weg[j] = 1; q[e++] = j;
      if (mitWegen) { const p = []; let m = j; while (m >= 0) { p.push(m); m = vor[m]; } raus.push([j, p.reverse()]); } else raus.push([j]);
    }
  };
  for (let xx = 0; xx < PB; xx++) pruefen((PB - 1) * PB + xx, -1);
  while (k < e && raus.length < n) {
    const i = q[k++], xx = i % PB;
    if (xx > 0) pruefen(i - 1, i); if (xx < PB - 1) pruefen(i + 1, i); if (i >= PB) pruefen(i - PB, i); if (i < N - PB) pruefen(i + PB, i);
  }
  return raus;
}
// Wie viele Pixel der Farbe f wären jetzt (in einem Zug, inkl. Nachrücken) erreichbar?
function prErreichbar(farbe, weg, f, grenze = 9999) { return prFressen(farbe, weg.slice(), f, grenze, false).length; }

// ---------- Höhlen-Raster ----------
// h: Array von { f, n, verborgen } oder null (leer); Raster mit PR_SPALTEN Spalten, Reihe 0 liegt am Fluss.
function prZugaenglich(h) {
  const R = Math.ceil(h.length / PR_SPALTEN), offen = new Uint8Array(h.length), q = [];
  // „frei“: leeres Feld, das mit dem Fluss verbunden ist
  const frei = new Uint8Array(h.length);
  for (let c = 0; c < PR_SPALTEN; c++) if (c < h.length && !h[c]) { frei[c] = 1; q.push(c); }
  while (q.length) {
    const i = q.pop(), r = Math.floor(i / PR_SPALTEN), c = i % PR_SPALTEN;
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
      if (rr < 0 || rr >= R || cc < 0 || cc >= PR_SPALTEN) return;
      const j = rr * PR_SPALTEN + cc;
      if (j < h.length && !h[j] && !frei[j]) { frei[j] = 1; q.push(j); }
    });
  }
  h.forEach((z, i) => {
    if (!z) return;
    const r = Math.floor(i / PR_SPALTEN), c = i % PR_SPALTEN;
    if (r === 0) { offen[i] = 1; return; }
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => { const j = rr * PR_SPALTEN + cc; if (rr >= 0 && cc >= 0 && cc < PR_SPALTEN && j < h.length && frei[j]) offen[i] = 1; });
  });
  return offen;
}

// ---------- Level ----------
function prLevelWerte(nr) {
  const s = Math.min(nr, 30);
  return { buchten: nr <= 2 ? 5 : 4, ziel: Math.min(36, 25 + Math.floor(s / 2)), verborgen: nr >= 3 ? Math.min(0.45, (nr - 2) * 0.05) : 0, mischen: 120,
    zielBuchten: nr <= 1 ? 1 : nr <= 4 ? 2 : 3, steine: nr <= 1 ? 0 : nr <= 3 ? 1 : nr <= 6 ? 2 : nr <= 10 ? 3 : 4 };
}
// ---------- Steine & Algen ----------
// Ein Stein (oder Algenbüschel) liegt auf einem Pixel-Block und sperrt ihn: nicht fressbar, kein Durchschwimmen.
// Er löst sich, sobald alle Pixel seiner Schlüsselfarbe weggefressen sind (die Farbe steht im Kreis darauf).
function prSteineWaehlen(echt, anzahl, r) {
  const steine = [], belegt = new Uint8Array(PB * PB), zahl = new Array(PR_FARBEN.length).fill(0);
  echt.forEach((c) => { zahl[c]++; });
  for (let v = 0; v < 80 && steine.length < anzahl; v++) {
    const w = 4 + Math.floor(r() * 2), h = 4, x0 = 1 + Math.floor(r() * (PB - w - 2)), y0 = 8 + Math.floor(r() * (PB - h - 10));
    let frei = true;
    for (let yy = y0 - 1; yy <= y0 + h; yy++) for (let xx = x0 - 1; xx <= x0 + w; xx++) if (belegt[yy * PB + xx]) frei = false;
    if (!frei) continue;
    const pix = [];
    for (let yy = y0; yy < y0 + h; yy++) for (let xx = x0; xx < x0 + w; xx++) pix.push(yy * PB + xx);
    const drunter = new Set(pix.map((i) => echt[i]));
    if (steine.some((st) => drunter.has(st.key))) continue;
    const kand = [];
    zahl.forEach((n, f) => { if (n >= 12 && n <= 320 && !drunter.has(f) && !steine.some((st) => st.key === f || st.pix.some((i) => echt[i] === f))) kand.push(f); });
    if (!kand.length) continue;
    pix.forEach((i) => { belegt[i] = 1; });
    steine.push({ pix, x0, y0, w, h, key: kand[Math.floor(r() * kand.length)], typ: r() < 0.5 ? 'stein' : 'alge' });
  }
  return steine;
}
function prSperrFarbe(echt, steine, offen) {
  const a = Int8Array.from(echt);
  steine.forEach((st, k) => { if (!offen || !offen[k]) st.pix.forEach((i) => { a[i] = -1; }); });
  return a;
}
// öffnet Steine, deren Schlüsselfarbe ganz weg ist; liefert die neu geöffneten
function prSteineAuf(arbeit, echt, weg, steine, offen) {
  const neu = [];
  steine.forEach((st, k) => {
    if (offen[k]) return;
    for (let i = 0; i < PB * PB; i++) if (arbeit[i] === st.key && !weg[i]) return;
    offen[k] = 1; st.pix.forEach((i) => { arbeit[i] = echt[i]; }); neu.push(k);
  });
  return neu;
}
// Spieler-Simulation mit Buchten: liefert { ok, maxBuchten }
function prSimulation(echt, h0, buchten, steine = []) {
  const weg = new Uint8Array(PB * PB), h = h0.map((z) => (z ? { ...z } : null)), bucht = [];
  const farbe = prSperrFarbe(echt, steine), offen = new Uint8Array(steine.length);
  let maxB = 0, sicher = 0;
  const futtern = () => { let lief = true; while (lief) { lief = false; for (const b of bucht) { if (b.n <= 0) continue; const r = prFressen(farbe, weg, b.f, b.n, false).length; if (r) { b.n -= r; lief = true; } } if (prSteineAuf(farbe, echt, weg, steine, offen).length) lief = true; } for (let i = bucht.length - 1; i >= 0; i--) if (bucht[i].n <= 0) bucht.splice(i, 1); };
  // Tiefe je Farbe: wie weit (in Pixeln ab unten) liegt das nächste Pixel dieser Farbe?
  while (h.some(Boolean) && sicher++ < 500) {
    const offen = prZugaenglich(h);
    let best = -1, bestWert = -1;
    h.forEach((z, i) => { if (!z || !offen[i]) return; const e = Math.min(z.n, prErreichbar(farbe, weg, z.f, z.n)); const v = e === z.n ? 1e6 + e : e; if (v > bestWert) { bestWert = v; best = i; } });
    if (best < 0) return { ok: false, maxBuchten: maxB };
    const z = h[best]; h[best] = null;
    let gefressen = prFressen(farbe, weg, z.f, z.n, false).length;
    while (gefressen < z.n && prSteineAuf(farbe, echt, weg, steine, offen).length) gefressen += prFressen(farbe, weg, z.f, z.n - gefressen, false).length;
    if (gefressen < z.n) { if (bucht.length >= buchten) return { ok: false, maxBuchten: maxB }; bucht.push({ f: z.f, n: z.n - gefressen }); }
    futtern();
    maxB = Math.max(maxB, bucht.length);
  }
  return { ok: weg.every(Boolean) && !bucht.length, maxBuchten: maxB };
}
function prErzeugen(seed, nr) {
  const motiv = PR_MOTIVE[(seed === 'piranha' ? nr - 1 : [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)) % PR_MOTIVE.length];
  const farbe = prMotivRaster(motiv), L = prLevelWerte(nr);
  for (let versuch = 0; versuch < 30; versuch++) {
    const r = zufallsGenerator(seed + '|' + nr + '|' + versuch);
    const steine = prSteineWaehlen(farbe, versuch > 20 ? Math.max(0, L.steine - 1) : L.steine, r), arbeit = prSperrFarbe(farbe, steine), offen = new Uint8Array(steine.length);
    // 1) Rückwärts aus dem Bild: in welcher Reihenfolge können Schwärme das Bild fressen?
    const weg = new Uint8Array(PB * PB), folge = [];
    let rest = PB * PB, sicher = 0;
    while (rest > 0 && sicher++ < 2000) {
      prSteineAuf(arbeit, farbe, weg, steine, offen);
      const kandidaten = [];
      for (let f = 0; f < PR_FARBEN.length; f++) { const e = prErreichbar(arbeit, weg, f, 400); if (e) kandidaten.push([f, e]); }
      if (!kandidaten.length) break;
      const gute = kandidaten.filter(([, e]) => e >= 6), wahl = gute.length ? gute : kandidaten;
      const [f, e] = wahl[Math.floor(r() * wahl.length)];
      const schnitt = PB * PB / L.ziel, groesse = Math.min(e, Math.max(8, Math.round(schnitt * (0.55 + r() * 0.9))));
      const n = prFressen(arbeit, weg, f, groesse, false).length;
      folge.push({ f, n }); rest -= n;
    }
    // kleine Reste der gleichen Farbe zusammenlegen
    for (let i = folge.length - 1; i > 0; i--) if (folge[i].f === folge[i - 1].f && folge[i].n + folge[i - 1].n <= 2.2 * PB * PB / L.ziel) { folge[i - 1].n += folge[i].n; folge.splice(i, 1); }
    if (rest > 0 || folge.length > L.ziel + 8) continue;
    // 2) ins Raster: Reihe für Reihe in Fressreihenfolge
    const R = Math.ceil(folge.length / PR_SPALTEN), h = new Array(R * PR_SPALTEN).fill(null);
    folge.forEach((z, i) => { h[i] = { ...z }; });
    for (let row = 0; row < R; row++) { const s = row * PR_SPALTEN; for (let i = PR_SPALTEN - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [h[s + i], h[s + j]] = [h[s + j], h[s + i]]; } }
    // 3) mischen: Tausche über Reihen hinweg, solange die Simulation es noch schafft
    let sim = prSimulation(farbe, h, L.buchten, steine);
    if (!sim.ok) continue;
    // Mischen mit Ziel: Das Level soll so schwer werden, dass man Schwärme parken muss (zielBuchten), aber lösbar bleiben
    const t0 = Date.now();
    for (let k = 0; k < L.mischen && sim.maxBuchten < L.zielBuchten && Date.now() - t0 < 900; k++) {
      // bevorzugt: einen Schwarm aus den hinteren Reihen nach vorn holen, dessen Farbe erst spät gebraucht wird
      const a = Math.floor(r() * Math.min(h.length, PR_SPALTEN * 2)), b = Math.min(h.length - 1, a + PR_SPALTEN * (1 + Math.floor(r() * 3)) + Math.floor(r() * 3) - 1);
      if (a === b || !h[a] || !h[b]) continue;
      [h[a], h[b]] = [h[b], h[a]];
      const s = prSimulation(farbe, h, L.buchten, steine);
      if (s.ok && s.maxBuchten >= sim.maxBuchten && s.maxBuchten <= Math.min(L.buchten - 1, L.zielBuchten + 1)) sim = s; else [h[a], h[b]] = [h[b], h[a]];
    }
    if (sim.maxBuchten < L.zielBuchten && versuch < 8) continue;
    h.forEach((z, i) => { if (z && i >= PR_SPALTEN && r() < L.verborgen) z.verborgen = true; });
    return { motiv, farbe, steine, hoehlen: h, buchten: L.buchten, sim, pixel: PB * PB, fische: folge.reduce((a, z) => a + z.n, 0) };
  }
  return null;
}

// ---------- Zustand ----------
let pr = null;
const prStore = () => loadJson(PR_KEY);
const prTeile = ['intro', 'spiel'];
const zeigePrTeil = (t) => prTeile.forEach((x) => { $('pr-' + x).hidden = x !== t; });
let prLaufNr = 0;
function prStopp() { prLaufNr++; prMeerWeg(); }

function piranhaIntro() {
  prStopp();
  const st = prStore(), level = st.level || 1;
  $('prLevelText').textContent = 'Level ' + level;
  $('prSterne').textContent = '⭐ ' + Object.values(st.sterne || {}).reduce((a, b) => a + b, 0) + ' Sterne gesammelt';
  const t = st.tag && st.tag[heute()];
  $('prTagBtn').textContent = t ? '📅 Tagesbild – heute geschafft: ' + '⭐'.repeat(t) : '📅 Tagesbild (heute für alle gleich)';
  zeigePrTeil('intro');
}
function piranhaStart(opts = {}) {
  zeigePrTeil('spiel');
  $('prKopf').textContent = '';
  $('prMeldung').textContent = '🌊 Bild wird gemalt …';
  setTimeout(() => piranhaBauen(opts), 30);
}
function piranhaBauen(opts) {
  const st = prStore();
  const nr = opts.taeglich ? 9 : opts.level || st.level || 1;
  const seed = opts.taeglich ? 'pr-' + heute() : 'piranha';
  const L = prErzeugen(seed, nr);
  if (!L) { $('prMeldung').textContent = 'Konnte kein Level bauen – bitte nochmal.'; return; }
  pr = { nr, taeglich: !!opts.taeglich, motiv: L.motiv, echt: L.farbe, farbe: prSperrFarbe(L.farbe, L.steine), steine: L.steine, steinOffen: new Uint8Array(L.steine.length), steinT: {}, weg: new Uint8Array(PB * PB), sichtbar: new Uint8Array(PB * PB).fill(1),
    hoehlen: L.hoehlen.map((z) => (z ? { ...z } : null)), start: L.hoehlen.map((z) => (z ? { ...z } : null)), buchtenMax: L.buchten, bucht: [],
    fische: [], knabber: [], untergrund: [], unten: [], zuege: 0, verlauf: [], maxBuchten: 0, fertig: false, verloren: false, wackel: {}, fischeGesamt: L.fische };
  $('prKopf').textContent = (pr.taeglich ? '📅 Tagesbild' : 'Level ' + nr) + ' · ' + L.motiv.emoji + ' ' + L.motiv.name;
  $('prMeldung').textContent = L.steine.length ? '🪨 Steine und Algen sperren Pixel – sie lösen sich erst, wenn die Farbe im Kreis ganz weggefressen ist.' : '';
  prMeerWeg(); prGroesse(); prEbeneNeu(); prStatus();
  const lauf = ++prLaufNr;
  const frame = (t) => { if (lauf !== prLaufNr || !pr) return; prUpdate(t); prZeichnen(t); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function prStatus() {
  const rest = pr.weg.reduce((a, v) => a + (v ? 0 : 1), 0);
  $('prZuege').textContent = 'noch ' + rest.toLocaleString('de-DE') + ' Pixel · Buchten ' + pr.bucht.length + '/' + pr.buchtenMax;
  $('prRueck').disabled = !pr.verlauf.length || (pr.fische.some((f) => !f.heim) && !pr.verloren);
}
const prSnapshot = () => ({ weg: pr.weg.slice(), farbe: pr.farbe.slice(), steinOffen: pr.steinOffen.slice(), hoehlen: pr.hoehlen.map((z) => (z ? { ...z } : null)), bucht: pr.bucht.map((b) => ({ ...b })), maxBuchten: pr.maxBuchten, untergrund: pr.untergrund.length });

// ---------- Geometrie ----------
let prG = { P: 9, W: 360, bx: 0, bildH: 324, flussY: 324, flussH: 64, rasterY: 388, zelleB: 60, zelleH: 48, hoehe: 700 };
function prGroesse() {
  const cv = $('prBild'), breite = Math.min(cv.parentElement.clientWidth, 560);
  const R = Math.ceil(pr.hoehlen.length / PR_SPALTEN), oben = cv.getBoundingClientRect().top + (window.scrollY || 0) - ($('pr-spiel').closest('.pr-buehne').scrollTop || 0);
  const verfuegbar = Math.max(420, window.innerHeight - Math.max(80, Math.min(140, oben)) - 118);
  const zelleB = breite / PR_SPALTEN, flussH = 52;
  // Bild möglichst bildschirmbreit; die Höhlenreihen werden dafür flacher (mindestens 30 px, gut antippbar)
  const zelleH = Math.min(50, Math.max(27, (verfuegbar - flussH - breite) / R));
  const bildH = Math.max(breite * 0.6, Math.min(breite, verfuegbar - flussH - R * zelleH));
  const P = bildH / PB;
  prG = { P, W: breite, bx: (breite - PB * P) / 2, bildH, flussY: bildH, flussH, rasterY: bildH + flussH, zelleB, zelleH, hoehe: bildH + flussH + R * zelleH + 4 };
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(breite * dpr); cv.height = Math.round(prG.hoehe * dpr);
  cv.style.width = breite + 'px'; cv.style.height = prG.hoehe + 'px';
  cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  if (pr.ebene) prEbeneNeu();
}
const prHoehlePos = (i) => [(i % PR_SPALTEN + 0.5) * prG.zelleB, prG.rasterY + (Math.floor(i / PR_SPALTEN) + 0.5) * prG.zelleH];
const prHoehleR = () => prG.flussH * 0.66;
const prBuchtRand = () => prHoehleR() * 0.95;
const prBuchtPos = (k) => [prBuchtRand() + (k + 0.5) * (prG.W - 2 * prBuchtRand()) / pr.buchtenMax, prG.flussY + prG.flussH * 0.55];
// Höhlenloch: [x, y, rx, ry]
const prLoch = (links) => { const R = prHoehleR(); return [links ? R * 0.34 : prG.W - R * 0.34, prG.flussY + prG.flussH * 0.5 + R * 0.08, R * 0.4, R * 0.52]; };
const prPixelPos = (i) => [prG.bx + (i % PB + 0.5) * prG.P, (Math.floor(i / PB) + 0.5) * prG.P];

// ---------- Eingabe ----------
function prTipp(e) {
  if (!pr || pr.fertig || pr.verloren) return;
  const r = $('prBild').getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  if (py < prG.rasterY) return;
  const i = Math.floor((py - prG.rasterY) / prG.zelleH) * PR_SPALTEN + Math.floor(px / prG.zelleB);
  const z = pr.hoehlen[i];
  if (!z) return;
  const offen = prZugaenglich(pr.hoehlen);
  if (!offen[i]) { pr.wackel[i] = performance.now(); if (navigator.vibrate) navigator.vibrate(30); $('prMeldung').textContent = 'Diese Höhle ist noch zugeschüttet – erst die davor leeren.'; return; }
  pr.verlauf.push(prSnapshot());
  pr.zuege++;
  pr.hoehlen[i] = null;
  const [sx, sy] = prHoehlePos(i);
  let ziele = prFressen(pr.farbe, pr.weg, z.f, z.n, true);
  while (ziele.length < z.n && prSteineCheck().length) ziele = ziele.concat(prFressen(pr.farbe, pr.weg, z.f, z.n - ziele.length, true));
  const jetzt = performance.now();
  ziele.forEach(([j, p], k) => prFischLos(z.f, [[sx, sy], [sx, prG.flussY + 8]], j, p, jetzt + k * 55));
  const rest = z.n - ziele.length;
  if (rest > 0) {
    if (pr.bucht.length >= pr.buchtenMax) {
      // Fluss verstopft
      pr.verloren = true;
      for (let k = 0; k < Math.min(rest, 40); k++) pr.fische.push({ f: z.f, pfad: [[sx, sy], [sx + (Math.random() - 0.5) * 60, prG.flussY + 20 + Math.random() * 30]], start: jetzt + k * 20, dauer: 1400, ziel: -1 });
      $('prMeldung').innerHTML = '🚫 <b>Der Fluss ist verstopft!</b> Alle Buchten sind voll. Nimm mit ↶ einen Zug zurück.';
      if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
    } else {
      const k = pr.bucht.length, b = { f: z.f, n: rest, ankunft: jetzt + 300 + Math.min(rest, 40) * 15 };
      pr.bucht.push(b);
      const [bx, by] = prBuchtPos(k);
      for (let m = 0; m < Math.min(rest, 30); m++) pr.fische.push({ f: z.f, pfad: [[sx, sy], [bx + (Math.random() - 0.5) * 20, by + (Math.random() - 0.5) * 12]], start: jetzt + m * 25, dauer: 1200, ziel: -1 });
      pr.maxBuchten = Math.max(pr.maxBuchten, pr.bucht.length);
    }
  }
  prBuchtenFuttern(jetzt + 200);
  if (navigator.vibrate) navigator.vibrate(12);
  prStatus();
}
// Wartende Schwärme fressen automatisch, sobald ihre Farbe frei liegt
function prBuchtenFuttern(ab) {
  let lief = true;
  while (lief) {
    lief = false;
    pr.bucht.forEach((b, k) => {
      if (b.n <= 0) return;
      const ziele = prFressen(pr.farbe, pr.weg, b.f, b.n, true);
      if (!ziele.length) return;
      b.n -= ziele.length; lief = true;
      const [bx, by] = prBuchtPos(k);
      ziele.forEach(([j, p], m) => prFischLos(b.f, [[bx, by]], j, p, ab + m * 55));
    });
    if (prSteineCheck().length) lief = true;
  }
  pr.bucht = pr.bucht.filter((b) => b.n > 0);
}
function prSteineCheck() {
  const neu = prSteineAuf(pr.farbe, pr.echt, pr.weg, pr.steine, pr.steinOffen), t = performance.now();
  neu.forEach((k) => { pr.steinT[k] = t; });
  if (neu.length) { $('prMeldung').textContent = (pr.steine[neu[0]].typ === 'stein' ? '🪨 Ein Stein bröckelt weg' : '🌿 Die Algen geben den Weg frei') + ' – dahinter geht’s weiter!'; if (navigator.vibrate) navigator.vibrate([20, 30, 20]); }
  return neu;
}
// Fisch auf den Weg schicken: Startpunkte, dann von unten durch den gefressenen Gang zum Ziel
function prFischLos(f, start, ziel, pfad, t0) {
  const punkte = start.slice(), ab = punkte.length;
  const ersterX = prG.bx + (pfad[0] % PB + 0.5) * prG.P;
  punkte.push([ersterX, prG.bildH + 4]);
  pfad.forEach((i) => punkte.push(prPixelPos(i)));
  let laenge = 0; for (let k = 1; k < punkte.length; k++) laenge += Math.hypot(punkte[k][0] - punkte[k - 1][0], punkte[k][1] - punkte[k - 1][1]);
  pr.fische.push({ f, pfad: punkte, start: t0, dauer: Math.max(1000, laenge / 0.15), ziel, rueck: punkte.slice(ab) });
}
// satter Fisch: knabbert kurz, schwimmt dann dick und gemütlich zurück und durch eine Seitenhöhle in den Untergrund
function prHeimweg(f, t) {
  const p = f.rueck.slice().reverse(), { W, flussY, flussH } = prG, ex = p[p.length - 1][0];
  const links = ex < W / 2, y = flussY + flussH * (0.35 + Math.random() * 0.4), [lx, ly] = prLoch(links), R = prHoehleR();
  p.push([ex + (links ? -1 : 1) * (12 + Math.random() * 20), y]);
  p.push([lx + (links ? 1 : -1) * R * 1.1, ly + (Math.random() - 0.5) * 6]);
  p.push([lx, ly + (Math.random() - 0.5) * 4]);
  let laenge = 0; for (let k = 1; k < p.length; k++) laenge += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]);
  pr.fische.push({ f: f.f, pfad: p, start: t + 500 + Math.random() * 250, dauer: Math.max(1200, laenge / 0.1), ziel: -2, heim: true, links });
}
function prRueckgaengig() {
  if (!pr || !pr.verlauf.length || (pr.fische.some((f) => !f.heim) && !pr.verloren)) return;
  const s = pr.verlauf.pop();
  pr.weg = s.weg; pr.hoehlen = s.hoehlen; pr.bucht = s.bucht; pr.maxBuchten = s.maxBuchten; pr.farbe = s.farbe; pr.steinOffen = s.steinOffen;
  pr.untergrund.length = Math.min(pr.untergrund.length, s.untergrund); pr.unten.length = Math.min(pr.unten.length, s.untergrund);
  pr.steine.forEach((st, k) => { if (!pr.steinOffen[k]) delete pr.steinT[k]; });
  pr.fische = []; pr.knabber = []; pr.verloren = false; pr.fertig = false; prMeerWeg();
  $('prMeldung').textContent = '↶ Zug zurückgenommen';
  pr.sichtbar = pr.weg.map((v) => (v ? 0 : 1));
  prEbeneNeu(); prStatus();
}
function prNeu() {
  if (!pr) return;
  pr.farbe = prSperrFarbe(pr.echt, pr.steine); pr.steinOffen = new Uint8Array(pr.steine.length); pr.steinT = {};
  pr.weg = new Uint8Array(PB * PB); pr.sichtbar = new Uint8Array(PB * PB).fill(1); pr.hoehlen = pr.start.map((z) => (z ? { ...z } : null));
  pr.bucht = []; pr.fische = []; pr.knabber = []; pr.untergrund = []; pr.unten = []; pr.verlauf = []; prMeerWeg(); pr.zuege = 0; pr.maxBuchten = 0; pr.fertig = false; pr.verloren = false;
  $('prMeldung').textContent = ''; prEbeneNeu(); prStatus();
}
function prTipp2() {
  if (!pr || pr.fertig || pr.verloren) return;
  // nächste zugängliche Höhle, deren Schwarm am meisten sofort frisst
  const offen = prZugaenglich(pr.hoehlen);
  let best = -1, wert = -1;
  pr.hoehlen.forEach((z, i) => { if (!z || !offen[i]) return; const e = Math.min(z.n, prErreichbar(pr.farbe, pr.weg, z.f, z.n)); const v = e === z.n ? 1e6 + e : e; if (v > wert) { wert = v; best = i; } });
  if (best < 0) return;
  pr.tipp = { i: best, bis: performance.now() + 2400 }; pr.wackel[best] = performance.now();
  $('prMeldung').textContent = wert >= 1e6 ? '💡 Dieser Schwarm findet jetzt genug zu fressen.' : '💡 Kein Schwarm passt ganz – dieser frisst am meisten (Rest geht in eine Bucht).';
}

// ---------- Animation ----------
function prUpdate(t) {
  if (pr.knabber.length) pr.knabber = pr.knabber.filter((k) => t - k.t < 600);
  if (!pr.fische.length) return;
  let geaendert = false;
  const heim = [];
  pr.fische = pr.fische.filter((f) => {
    if (t - f.start < f.dauer) return true;
    if (f.ziel >= 0) { pr.sichtbar[f.ziel] = 0; prPixelWeg(f.ziel); pr.knabber.push({ i: f.ziel, f: f.f, t }); geaendert = true; heim.push(f); }
    else if (f.heim) { pr.untergrund.push(f.f); prUntenDazu(f); }
    return false;
  });
  heim.forEach((f) => prHeimweg(f, t));
  if (geaendert) prStatus();
  if (!pr.fische.length && !pr.fertig && !pr.verloren && pr.weg.every(Boolean) && !pr.bucht.length) prGeschafft();
  else if (!pr.fische.some((f) => !f.heim) && !pr.fertig && !pr.verloren && !pr.hoehlen.some(Boolean) && pr.bucht.length) $('prMeldung').textContent = 'Die Schwärme in den Buchten kommen nicht mehr ran – nimm einen Zug zurück.';
}
function prGeschafft() {
  pr.fertig = true; pr.fertigT = performance.now();
  // fertiges Bild zum Einblenden
  pr.original = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1; pr.original.width = pr.ebene.width; pr.original.height = pr.ebene.height;
  const ox = pr.original.getContext('2d'); ox.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < PB * PB; i++) prPixelMalen(ox, i, 1);
  const sterne = pr.maxBuchten <= Math.floor(pr.buchtenMax / 2) ? 3 : pr.maxBuchten < pr.buchtenMax ? 2 : 1;
  const st = prStore();
  st.sterne = st.sterne || {}; st.tag = st.tag || {};
  if (pr.taeglich) st.tag[heute()] = Math.max(st.tag[heute()] || 0, sterne);
  else { st.sterne[pr.nr] = Math.max(st.sterne[pr.nr] || 0, sterne); st.level = Math.max(st.level || 1, pr.nr + 1); }
  saveJson(PR_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('piranha', sterne, 3, (pr.taeglich ? 'Tagesbild' : 'Level ' + pr.nr) + ' · ' + pr.motiv.name);
  if (navigator.vibrate) navigator.vibrate([30, 40, 30, 40, 60]);
  $('prMeldung').textContent = pr.motiv.emoji + ' ' + pr.motiv.name + ' komplett weggefuttert – die Schwärme kommen aus dem Untergrund!';
  // Geschafft-Karte (erscheint, wenn sich das Herz auflöst)
  const min = pr.start.filter(Boolean).length;
  $('prFSterne').textContent = '⭐'.repeat(sterne) + '☆'.repeat(3 - sterne);
  $('prFZuege').textContent = pr.zuege; $('prFMin').textContent = 'von minimal ' + min;
  $('prFBuchten').textContent = pr.maxBuchten + '/' + pr.buchtenMax;
  $('prFFische').textContent = pr.untergrund.length.toLocaleString('de-DE');
  $('prFLob').textContent = pr.zuege <= min ? (sterne === 3 ? 'Perfekt – kein Zug zu viel und kaum geparkt!' : 'Kein Zug zu viel!') : (pr.zuege - min) + ' Züge mehr als nötig (durch Zurücknehmen).';
  $('prFWeiter').hidden = pr.taeglich;
  const k = $('prFertig'); k.style.minHeight = (prG.hoehe - prG.flussY) + 'px';
  prMeerStart();
}

// ---------- Zeichnen ----------
function prEbeneNeu() {
  const dpr = window.devicePixelRatio || 1;
  pr.ebene = pr.ebene || document.createElement('canvas');
  pr.ebene.width = Math.round(prG.W * dpr); pr.ebene.height = Math.round(prG.bildH * dpr);
  const x = pr.ebene.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < PB * PB; i++) prPixelMalen(x, i, pr.sichtbar[i]);
}
function prPixelMalen(x, i, da) {
  const P = prG.P, gx = prG.bx + (i % PB) * P, gy = Math.floor(i / PB) * P;
  x.clearRect(gx - 0.5, gy - 0.5, P + 1, P + 1);
  if (!da) return;
  x.fillStyle = PR_FARBEN[pr.echt[i]].c; x.fillRect(gx, gy, P + 0.4, P + 0.4);
  x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(gx, gy, P, P * 0.22);
  x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(gx, gy + P * 0.8, P, P * 0.2);
}
function prPixelWeg(i) { if (pr.ebene) prPixelMalen(pr.ebene.getContext('2d'), i, 0); }
function prFisch(x, farbe, px, py, w, t, g, dick = 1) {
  x.save(); x.translate(px, py); x.rotate(w);
  const s = Math.sin(t / 110 + px) * 0.35, lx = 0.6 + (dick - 1) * 0.25, ly = 0.4 * dick;
  x.fillStyle = farbe;
  x.beginPath(); x.moveTo(-g * 0.5, 0); x.lineTo(-g * 0.98, -g * 0.36 + s * g * 0.3); x.lineTo(-g * 0.98, g * 0.36 + s * g * 0.3); x.fill();
  x.beginPath(); x.ellipse(0, 0, g * lx, g * ly, 0, 0, 7); x.fill();
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(g * 0.05, g * ly * 0.4, g * lx * 0.7, g * ly * 0.45, 0, 0, Math.PI); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(g * 0.3, -g * 0.1, g * 0.13, 0, 7); x.fill();
  x.fillStyle = '#111'; x.beginPath(); x.arc(g * 0.34, -g * 0.1, g * 0.06, 0, 7); x.fill();
  x.restore();
}
function prZeichnen(t) {
  const x = $('prBild').getContext('2d'), { W, bildH, flussY, flussH, rasterY, zelleB, zelleH, hoehe } = prG;
  // Wasser unter dem Bild (sichtbar, wo gefressen)
  const g = x.createLinearGradient(0, 0, 0, hoehe);
  g.addColorStop(0, '#0f3b33'); g.addColorStop(0.5, '#155447'); g.addColorStop(1, '#0b2a24');
  x.fillStyle = g; x.fillRect(0, 0, W, hoehe);
  x.strokeStyle = 'rgba(190,240,215,0.07)'; x.lineWidth = 2;
  for (let i = 0; i < 8; i++) { x.beginPath(); const y = ((i * 89 + t / 35) % (hoehe + 40)) - 20; x.moveTo(0, y); x.bezierCurveTo(W * 0.3, y - 12, W * 0.6, y + 12, W, y); x.stroke(); }
  prDekoMalen(x, t);
  // Bild (nach dem Sieg blendet das fertige Bild wieder ein)
  x.drawImage(pr.ebene, 0, 0, W, bildH);
  // Knabbern: Pixel schrumpft weg
  pr.knabber.forEach((k) => { const a = (t - k.t) / 600, [px, py] = prPixelPos(k.i), r = prG.P * 0.5 * (1 - a); x.fillStyle = PR_FARBEN[pr.echt[k.i]].c; x.globalAlpha = 1 - a * 0.5; x.fillRect(px - r, py - r, r * 2, r * 2); });
  x.globalAlpha = 1;
  prSteineMalen(x, t);
  if (pr.fertig && pr.original) { x.globalAlpha = Math.min(1, (t - pr.fertigT) / 1600); x.drawImage(pr.original, 0, 0, W, bildH); x.globalAlpha = 1; }
  // Fluss mit Buchten
  x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, flussY, W, flussH);
  for (let k = 0; k < pr.buchtenMax; k++) {
    const [bx, by] = prBuchtPos(k), b = pr.bucht[k], bw = (W - 2 * prBuchtRand()) / pr.buchtenMax - 8;
    x.fillStyle = b ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)';
    x.strokeStyle = b ? PR_FARBEN[b.f].c : 'rgba(255,255,255,.18)'; x.lineWidth = 2;
    x.beginPath(); x.roundRect(bx - bw / 2, flussY + 8, bw, flussH - 16, 14); x.fill(); x.stroke();
    if (b) {
      for (let m = 0; m < Math.min(6, Math.ceil(b.n / 8)); m++) prFisch(x, PR_FARBEN[b.f].c, bx + Math.cos(t / 400 + m * 1.1) * bw * 0.28, by + Math.sin(t / 500 + m * 1.7) * 8, t / 400 + m * 1.1 + Math.PI / 2, t, 11);
      x.font = '800 13px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(0,0,0,.7)'; x.beginPath(); x.roundRect(bx + bw / 2 - 26, flussY + 10, 24, 16, 8); x.fill();
      x.fillStyle = '#fff'; x.fillText(b.n, bx + bw / 2 - 14, flussY + 18.5);
    }
  }
  // Höhlen
  const offen = prZugaenglich(pr.hoehlen);
  pr.hoehlen.forEach((z, i) => {
    const [cx, cy] = prHoehlePos(i);
    const bx = cx - zelleB / 2 + 3, by = cy - zelleH / 2 + 3, bw = zelleB - 6, bh = zelleH - 6;
    if (!z) { x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.roundRect(bx, by, bw, bh, 10); x.fill(); return; }
    let ox = 0; if (pr.wackel[i] && t - pr.wackel[i] < 400) ox = Math.sin((t - pr.wackel[i]) / 25) * 4;
    const versteckt = z.verborgen && !offen[i], farbe = versteckt ? '#55606b' : PR_FARBEN[z.f].c;
    x.globalAlpha = offen[i] ? 1 : 0.62;
    x.fillStyle = '#3a2a1a'; x.beginPath(); x.roundRect(bx + ox, by, bw, bh, 10); x.fill();
    x.fillStyle = farbe; x.beginPath(); x.roundRect(bx + ox + 3, by + 3, bw - 6, bh - 6, 8); x.fill();
    x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.roundRect(bx + ox + 3, by + 3, bw - 6, (bh - 6) * 0.35, 8); x.fill();
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(cx + ox, cy + bh * 0.18, bw * 0.28, bh * 0.16, 0, 0, 7); x.fill();
    x.font = '800 ' + Math.round(Math.min(18, bh * 0.42)) + 'px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const hell = [2, 3, 5, 9, 11, 13, 14].includes(z.f) && !versteckt;
    x.fillStyle = hell ? '#1b1b1b' : '#fff';
    x.fillText(versteckt ? '?' : z.n, cx + ox, cy - bh * 0.06);
    x.globalAlpha = 1;
    if (pr.tipp && pr.tipp.i === i && t < pr.tipp.bis) { x.strokeStyle = '#fff'; x.lineWidth = 3; x.setLineDash([6, 5]); x.beginPath(); x.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 12); x.stroke(); x.setLineDash([]); }
  });
  // Seitenhöhlen am Fluss: Eingang in den Untergrund
  prSeitenhoehlen(x, t, false);
  // Fische
  const viele = pr.fische.length > 260;
  pr.fische.forEach((f) => {
    let a = (t - f.start) / f.dauer;
    if (a < 0) { if (!f.heim) return; a = 0; }
    const p = f.pfad, seg = p.length - 1;
    // gleichmäßig über die Punkte (einfach: nach Index)
    const s = Math.min(seg - 1e-6, a * seg), k = Math.floor(s), u = s - k;
    const [x0, y0] = p[k], [x1, y1] = p[Math.min(seg, k + 1)];
    const fx = x0 + (x1 - x0) * u + Math.sin(t / 90 + f.start) * 1.5, fy = y0 + (y1 - y0) * u + Math.cos(t / 110 + f.start) * 1.5;
    const w = Math.atan2(y1 - y0, x1 - x0), farbe = PR_FARBEN[f.f].c;
    const dick = f.heim ? 1.8 : 1, rein = f.heim && a > 0.9 ? Math.max(0.2, (1 - a) / 0.1) : 1;
    if (viele) { x.fillStyle = farbe; x.beginPath(); x.ellipse(fx, fy, 3.6 * (f.heim ? 1.25 : 1) * rein, 2.2 * dick * rein, w, 0, 7); x.fill(); }
    else prFisch(x, farbe, fx, fy, w, t, Math.max(8, prG.P * 1.2) * rein, dick);
  });
  prSeitenhoehlen(x, t, true);
  prUntenZeichnen(t);
  if (pr.meer) prMeerZeichnen(t);
}
// zwei Felsenhöhlen links und rechts am Fluss
function prSeitenhoehlen(x, t, vorn) {
  const { W, flussY, flussH } = prG, R = prHoehleR(), cy = flussY + flussH * 0.5;
  [true, false].forEach((links) => {
    const s = links ? 1 : -1, cx = links ? 0 : W, [lx, ly, rx, ry] = prLoch(links);
    if (!vorn) {
      // Felsmassiv
      x.fillStyle = '#2a1d12';
      x.beginPath(); x.ellipse(cx, cy, R * 1.12, R * 1.18, 0, 0, 7); x.fill();
      const fels = [[0.0, -1.0, 0.55], [0.45, -0.78, 0.45], [0.82, -0.3, 0.4], [0.9, 0.3, 0.42], [0.55, 0.85, 0.45], [0.05, 1.0, 0.5]];
      fels.forEach(([fx, fy, fr], i) => {
        const g = x.createRadialGradient(cx + s * fx * R - s * fr * R * 0.3, cy + fy * R - fr * R * 0.4, 1, cx + s * fx * R, cy + fy * R, fr * R);
        g.addColorStop(0, i % 2 ? '#9a8064' : '#8a735a'); g.addColorStop(1, '#4b3826');
        x.fillStyle = g; x.beginPath(); x.ellipse(cx + s * fx * R, cy + fy * R, fr * R, fr * R * 0.85, 0, 0, 7); x.fill();
      });
      // leuchtender Rand und tiefes Loch
      const puls = 0.35 + 0.2 * Math.sin(t / 420 + (links ? 0 : 2));
      const glow = x.createRadialGradient(lx, ly, rx * 0.6, lx, ly, rx * 1.9);
      glow.addColorStop(0, 'rgba(120,230,255,' + puls + ')'); glow.addColorStop(1, 'rgba(120,230,255,0)');
      x.fillStyle = glow; x.beginPath(); x.ellipse(lx, ly, rx * 1.9, ry * 1.7, 0, 0, 7); x.fill();
      const loch = x.createRadialGradient(lx - s * rx * 0.3, ly, 1, lx, ly, ry);
      loch.addColorStop(0, '#000'); loch.addColorStop(0.75, '#06121a'); loch.addColorStop(1, '#14303a');
      x.fillStyle = loch; x.beginPath(); x.ellipse(lx, ly, rx, ry, 0, 0, 7); x.fill();
      // Augenpaar im Dunkeln
      if (Math.sin(t / 1700 + (links ? 0 : 3)) > -0.6) { x.fillStyle = 'rgba(255,230,120,.85)'; x.beginPath(); x.arc(lx - s * rx * 0.15 - 2.5, ly - ry * 0.15, 1.6, 0, 7); x.arc(lx - s * rx * 0.15 + 2.5, ly - ry * 0.15, 1.6, 0, 7); x.fill(); }
      return;
    }
    // vorn: Torbogen-Steine um das Loch, Zähne oben, Seegras – darüber verschwinden die Fische
    x.lineWidth = Math.max(3, R * 0.16); x.strokeStyle = '#6b5440';
    x.beginPath(); x.ellipse(lx, ly, rx * 1.12, ry * 1.1, 0, -Math.PI * 0.95, Math.PI * 0.95, links); x.stroke();
    x.strokeStyle = '#2a1d12'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(lx, ly, rx * 1.3, ry * 1.27, 0, 0, 7); x.stroke();
    x.fillStyle = '#c9b79a';
    for (let k = -1; k <= 1; k++) { const zx = lx + k * rx * 0.45; x.beginPath(); x.moveTo(zx - rx * 0.16, ly - ry * 0.95); x.lineTo(zx, ly - ry * 0.6); x.lineTo(zx + rx * 0.16, ly - ry * 0.95); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.ellipse(lx + s * rx * 0.2, ly - ry * 1.25, rx * 0.5, ry * 0.12, 0, 0, 7); x.fill();
    x.lineCap = 'round';
    for (let j = 0; j < 4; j++) {
      const bx = cx + s * (R * 0.75 + j * 4);
      x.strokeStyle = j % 2 ? '#66bb6a' : '#2e7d32'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(bx, cy + R * 1.05); x.quadraticCurveTo(bx + Math.sin(t / 600 + j) * 5, cy + R * 0.55, bx + Math.sin(t / 500 + j * 2) * 4, cy + R * 0.1 - j * 4); x.stroke();
    }
  });
}
// dezente, durchsichtige Deko im Wasser: Seegras an den Rändern, aufsteigende Blasen
function prDekoMalen(x, t) {
  const { W, hoehe, bildH, bx } = prG;
  x.lineCap = 'round';
  const halme = [[4, hoehe, 0.5], [12, hoehe, 0.38], [W - 6, hoehe, 0.45], [W - 15, hoehe, 0.3], [W * 0.3, hoehe, 0.18], [W * 0.68, hoehe, 0.22]];
  if (bx > 18) halme.push([bx * 0.4, bildH, 0.45], [bx * 0.75, bildH, 0.3], [W - bx * 0.45, bildH, 0.5], [W - bx * 0.8, bildH, 0.32]);
  halme.forEach(([hx, hy, l], j) => {
    const h = hoehe * l * (hy === bildH ? 0.55 : 1);
    x.strokeStyle = j % 2 ? 'rgba(102,187,106,.16)' : 'rgba(46,125,50,.22)'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(hx, hy); x.bezierCurveTo(hx + Math.sin(t / 900 + j) * 12, hy - h * 0.35, hx - Math.sin(t / 700 + j) * 10, hy - h * 0.7, hx + Math.sin(t / 800 + j * 1.7) * 14, hy - h); x.stroke();
  });
  x.fillStyle = 'rgba(200,240,255,.13)';
  for (let k = 0; k < 10; k++) { const yy = hoehe - ((t / (28 + k * 3) + k * 137) % (hoehe + 20)), xx = (k * 71) % W + Math.sin(t / 500 + k) * 4; x.beginPath(); x.arc(xx, yy, 1.5 + (k % 3), 0, 7); x.fill(); }
}
// ---------- Untergrund: satte Fische schwimmen durchsichtig hinter dem Spiel herum ----------
const PR_UNTEN_MAX = 320;
function prUntenDazu(f) {
  const r = $('prBild').getBoundingClientRect(), [lx, ly] = prLoch(f.links), w = f.links ? Math.PI + (Math.random() - 0.5) : (Math.random() - 0.5), v = 0.03 + Math.random() * 0.03;
  const neu = { f: f.f, x: r.left + lx, y: r.top + ly, vx: Math.cos(w) * v, vy: Math.sin(w) * v, ph: Math.random() * 6.28, geboren: performance.now() };
  if (pr.unten.length < PR_UNTEN_MAX) pr.unten.push(neu); else pr.unten[Math.floor(Math.random() * PR_UNTEN_MAX)] = neu;
}
function prUntenZeichnen(t) {
  const cv = $('prUnten'), dpr = window.devicePixelRatio || 1, VW = window.innerWidth, VH = window.innerHeight;
  if (!cv) return;
  if (cv.width !== Math.round(VW * dpr) || cv.height !== Math.round(VH * dpr)) { cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr); }
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, VW, VH);
  if (!pr.unten.length) return;
  const dt = Math.min(50, t - (pr.untenT || t)); pr.untenT = t;
  const g = Math.max(7, prG.P * 1.25);
  pr.unten.forEach((z) => {
    const w = Math.atan2(z.vy, z.vx) + (Math.random() - 0.5) * 0.1, v = Math.hypot(z.vx, z.vy);
    z.vx = Math.cos(w) * v; z.vy = Math.sin(w) * v; z.x += z.vx * dt; z.y += z.vy * dt;
    if (z.x < -20) z.x = VW + 20; if (z.x > VW + 20) z.x = -20; if (z.y < -20) z.y = VH + 20; if (z.y > VH + 20) z.y = -20;
    x.globalAlpha = 0.32 * Math.min(1, (t - z.geboren) / 900);
    prFisch(x, PR_FARBEN[z.f].c, z.x, z.y, w, t, g, 1.6);
  });
  x.globalAlpha = 1;
}
// ---------- Sieg: Schwärme kommen aus dem Untergrund, bilden ein Herz und schwimmen dann über den ganzen Bildschirm ----------
function prMeerWeg() {
  document.querySelectorAll('.pr-meer').forEach((c) => c.remove());
  if (pr) pr.meer = null;
  const k = $('prFertig'); if (k) k.hidden = true;
}
function prMeerStart() {
  prMeerWeg();
  const cv = document.createElement('canvas'); cv.className = 'pr-meer'; document.body.appendChild(cv);
  const r = $('prBild').getBoundingClientRect(), { W, bildH, flussY, flussH } = prG;
  const farben = pr.untergrund.length ? pr.untergrund : [6], n = Math.min(wenigBewegung() ? 120 : 420, Math.max(120, farben.length));
  const s = Math.min(W, bildH) / 36, hx = r.left + W / 2, hy = r.top + bildH * 0.46, fische = [];
  for (let k = 0; k < n; k++) {
    const rand = k < n * 0.38, w = rand ? (k / (n * 0.38)) * Math.PI * 2 : k * 2.39996;
    const rr = rand ? 1 : 0.15 + 0.8 * Math.sqrt((k - n * 0.38 + 0.5) / (n * 0.62)), links = k % 2 === 0;
    const u = pr.unten[k];
    fische.push({ f: u ? u.f : farben[Math.floor(Math.random() * farben.length)], x: u ? u.x : links ? r.left - 6 : r.right + 6, y: u ? u.y : r.top + flussY + flussH / 2 + (Math.random() - 0.5) * flussH * 0.4,
      zx: hx + rr * 16 * Math.pow(Math.sin(w), 3) * s, zy: hy - rr * (13 * Math.cos(w) - 5 * Math.cos(2 * w) - 2 * Math.cos(3 * w) - Math.cos(4 * w)) * s,
      verz: (k / n) * 1800 + Math.random() * 150, vx: 0, vy: 0, ph: Math.random() * 6.28 });
  }
  pr.unten = [];
  const deko = Array.from({ length: 12 }, (_, i) => ({ x: (i + Math.random() * 0.6) / 12, h: 0.12 + Math.random() * 0.22, ph: Math.random() * 6, gruen: i % 3 }));
  const blasen = Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), r: 1.5 + Math.random() * 4, v: 0.02 + Math.random() * 0.04 }));
  pr.meer = { cv, fische, deko, blasen, t0: performance.now(), letzt: performance.now(), hx, hy, karte: false };
}
function prMeerZeichnen(t) {
  const m = pr.meer, cv = m.cv, dpr = window.devicePixelRatio || 1, VW = window.innerWidth, VH = window.innerHeight;
  if (cv.width !== Math.round(VW * dpr) || cv.height !== Math.round(VH * dpr)) { cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr); }
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, VW, VH);
  const seit = t - m.t0, dt = Math.min(50, t - m.letzt); m.letzt = t;
  const deko = Math.min(1, seit / 2500);
  // Seegras vom unteren Rand und Blasen – durchsichtig
  x.lineCap = 'round';
  m.deko.forEach((d, i) => {
    const hx = d.x * VW, h = d.h * VH;
    x.strokeStyle = ['rgba(46,125,50,', 'rgba(102,187,106,', 'rgba(27,94,32,'][d.gruen] + (0.28 * deko) + ')'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(hx, VH + 4); x.bezierCurveTo(hx + Math.sin(t / 900 + d.ph) * 18, VH - h * 0.35, hx - Math.sin(t / 700 + d.ph) * 14, VH - h * 0.7, hx + Math.sin(t / 800 + d.ph * 1.7) * 20, VH - h); x.stroke();
  });
  x.fillStyle = 'rgba(200,240,255,' + (0.22 * deko) + ')';
  m.blasen.forEach((b) => { b.y -= b.v * dt / VH * 10; if (b.y < -0.05) { b.y = 1.05; b.x = Math.random(); } x.beginPath(); x.arc(b.x * VW + Math.sin(t / 600 + b.r) * 5, b.y * VH, b.r, 0, 7); x.fill(); });
  // Phasen: 0–3,4 s Herz bilden, bis 5,6 s halten (pulsieren), danach verteilen und frei über den Bildschirm schwimmen
  const halten = seit < 5600, puls = seit > 2800 && halten ? 1 + 0.07 * Math.sin((seit - 2800) / 240) : 1;
  const alpha = halten ? 0.9 : Math.max(0.38, 0.9 - (seit - 5600) / 2400);
  const g = Math.max(6, prG.P * 1.15);
  if (!halten && !m.frei) { m.frei = true; m.fische.forEach((f) => { const w = Math.atan2(f.y - m.hy, f.x - m.hx) + (Math.random() - 0.5), v = 0.05 + Math.random() * 0.06; f.vx = Math.cos(w) * v; f.vy = Math.sin(w) * v; }); }
  x.globalAlpha = alpha;
  m.fische.forEach((f) => {
    if (seit < f.verz) return;
    if (halten) {
      const k = Math.min(1, dt * 0.0028), ax = f.x, ay = f.y, zx = m.hx + (f.zx - m.hx) * puls, zy = m.hy + (f.zy - m.hy) * puls;
      f.x += (zx - f.x) * k; f.y += (zy - f.y) * k;
      if (dt) { const vx = (f.x - ax) / dt, vy = (f.y - ay) / dt; if (Math.hypot(vx, vy) > 0.01) { f.vx = vx; f.vy = vy; } }
    } else {
      const w = Math.atan2(f.vy, f.vx) + (Math.random() - 0.5) * 0.12, v = Math.hypot(f.vx, f.vy);
      f.vx = Math.cos(w) * v; f.vy = Math.sin(w) * v; f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < -20) f.x = VW + 20; if (f.x > VW + 20) f.x = -20; if (f.y < -20) f.y = VH + 20; if (f.y > VH + 20) f.y = -20;
    }
    prFisch(x, PR_FARBEN[f.f].c, f.x + Math.sin(t / 300 + f.ph) * 0.8, f.y, Math.atan2(f.vy, f.vx) || 0, t, g, 1.35);
  });
  x.globalAlpha = 1;
  if (!m.karte && seit > 5400) { m.karte = true; $('prFertig').hidden = false; konfetti(14, ['✨', '🫧', '💚', pr.motiv.emoji]); }
}
function prSteineMalen(x, t) {
  const P = prG.P;
  pr.steine.forEach((st, k) => {
    const auf = pr.steinOffen[k], seit = auf ? t - (pr.steinT[k] || 0) : 0;
    if (auf && seit > 700) return;
    const gx = prG.bx + st.x0 * P, gy = st.y0 * P, gw = st.w * P, gh = st.h * P, cx = gx + gw / 2, cy = gy + gh / 2;
    x.save();
    if (auf) { const a = seit / 700; x.globalAlpha = 1 - a; x.translate(cx, cy + a * gh * 0.6); x.scale(1 + a * 0.4, 1 - a * 0.5); x.translate(-cx, -cy); }
    if (st.typ === 'stein') {
      const gr = x.createLinearGradient(gx, gy, gx, gy + gh); gr.addColorStop(0, '#a3adb2'); gr.addColorStop(1, '#4f5b62');
      x.fillStyle = gr; x.beginPath(); x.roundRect(gx + 1, gy + 1, gw - 2, gh - 2, P * 1.1); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 1.5; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.ellipse(gx + gw * 0.32, gy + gh * 0.24, gw * 0.2, gh * 0.1, -0.3, 0, 7); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(gx + gw * 0.78, gy + gh * 0.12); x.lineTo(gx + gw * 0.68, gy + gh * 0.42); x.lineTo(gx + gw * 0.82, gy + gh * 0.7); x.stroke();
    } else {
      x.fillStyle = '#163f24'; x.beginPath(); x.roundRect(gx + 1, gy + 1, gw - 2, gh - 2, P * 0.7); x.fill();
      x.lineCap = 'round';
      for (let j = 0; j < 6; j++) {
        x.strokeStyle = j % 2 ? '#66bb6a' : '#2e7d32'; x.lineWidth = Math.max(2, P * 0.42);
        const sx = gx + gw * (j + 0.5) / 6; x.beginPath(); x.moveTo(sx, gy + gh - 1);
        x.quadraticCurveTo(sx + Math.sin(t / 520 + j) * P, gy + gh * 0.5, sx + Math.sin(t / 430 + j * 2) * P * 0.6, gy + 2); x.stroke();
      }
    }
    // Schlüsselfarbe mit Restzahl
    let rest = 0; for (let i = 0; i < PB * PB; i++) if (pr.farbe[i] === st.key && !pr.weg[i]) rest++;
    const R = Math.max(6.5, Math.min(gw, gh) * 0.27);
    x.fillStyle = PR_FARBEN[st.key].c; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke();
    x.font = '800 ' + Math.round(R * (rest > 99 ? 0.85 : 1.05)) + 'px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = [2, 3, 5, 9, 11, 13, 14].includes(st.key) ? '#1b1b1b' : '#fff';
    x.fillText(auf ? '✓' : rest, cx, cy + 0.5);
    x.restore();
  });
}

// ---------- Knöpfe ----------
$('prBild').addEventListener('pointerdown', prTipp);
$('prLos').addEventListener('click', () => piranhaStart());
$('prTagBtn').addEventListener('click', () => piranhaStart({ taeglich: true }));
$('prRueck').addEventListener('click', prRueckgaengig);
$('prNeu').addEventListener('click', prNeu);
$('prHinweis').addEventListener('click', prTipp2);
$('prWeiterBtn').addEventListener('click', () => { $('prWeiterBtn').hidden = true; piranhaStart({ level: pr.nr + 1 }); });
$('prFWeiter').addEventListener('click', () => { prMeerWeg(); piranhaStart({ level: pr.nr + 1 }); });
$('prFNochmal').addEventListener('click', prNeu);
window.addEventListener('resize', () => { if (pr && !$('pr-spiel').hidden) prGroesse(); });
$('prZurueck').addEventListener('click', () => { if (!$('pr-spiel').hidden) { piranhaIntro(); return; } prStopp(); zeigeHub(); });
$('hubPiranha').addEventListener('click', () => { merkeZuletzt('piranha'); zoomZu($('hubPiranha'), () => { show('piranha', '🐟 Piranha-Schwarm'); piranhaIntro(); }); });
