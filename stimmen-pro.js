// 🎚️ Stimmgerät Pro: Strobe-Anzeige, alle Saiten auf einmal (polyphon) und Wirbel-Anleitung.
// Polyphon: Hann-Fenster über ~0,7 s, FFT (32768), je Saite Suche ±60 Cent um den Zielton über eine gewichtete Summe
// der ersten Teiltöne (Grundton, 2., 3.), Feinsuche in 0,1-Cent-Schritten; zu schwache Saiten bleiben „–“.
function sgFFT(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const w = -2 * Math.PI / len, wr = Math.cos(w), wi = Math.sin(w);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
  }
}
// x: Samples (Länge Zweierpotenz), saiten: MIDI-Liste → [{ cent, staerke } | null] je Saite
function sgPolyAusSignal(x, rate, saiten, a4 = 440) {
  const n = x.length, re = new Float32Array(n), im = new Float32Array(n);
  let e = 0; for (let i = 0; i < n; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)); re[i] = x[i] * w; e += x[i] * x[i]; }
  if (Math.sqrt(e / n) < 0.004) return saiten.map(() => null);
  sgFFT(re, im);
  const half = n / 2, mag = new Float32Array(half); for (let k = 0; k < half; k++) mag[k] = Math.hypot(re[k], im[k]);
  const bin = rate / n, at = (f) => { const p = f / bin, i = Math.floor(p); if (i < 1 || i + 1 >= half) return 0; return mag[i] + (mag[i + 1] - mag[i]) * (p - i); };
  const sorted = Array.from(mag.subarray(Math.floor(30 / bin), Math.floor(2000 / bin))).sort((a, b) => a - b), rausch = sorted[Math.floor(sorted.length * 0.5)] || 1e-9;
  const score = (f0) => at(f0) + 0.5 * at(2 * f0) + 0.3 * at(3 * f0);
  const fz = saiten.map((m) => a4 * 2 ** ((m - 69) / 12));
  // Teiltöne, die mit Teiltönen anderer Saiten kollidieren (z. B. E2×3 ≈ H3), werden für die Feinmessung ausgelassen
  const frei = (si, h) => fz.every((g, j) => j === si || [1, 2, 3, 4].every((k) => Math.abs(1200 * Math.log2((h * fz[si]) / (k * g))) > 60));
  const spitze = (fz0) => { // Parabel-Interpolation (log. Betrag) um den höchsten Bin nahe fz0 → Frequenz, Betrag
    const p = Math.round(fz0 / bin); let k = p; for (let i = p - 2; i <= p + 2; i++) if (i > 1 && i < half - 1 && mag[i] > mag[k]) k = i;
    if (k < 2 || k >= half - 1) return null;
    const a = Math.log(mag[k - 1] + 1e-12), b = Math.log(mag[k] + 1e-12), c = Math.log(mag[k + 1] + 1e-12), d = (a - 2 * b + c) ? 0.5 * (a - c) / (a - 2 * b + c) : 0;
    return { f: (k + Math.max(-0.5, Math.min(0.5, d))) * bin, m: mag[k] };
  };
  const roh = saiten.map((m, si) => {
    const f = fz[si];
    let best = -60, bs = -1; for (let c = -60; c <= 60; c++) { const s = score(f * 2 ** (c / 1200)); if (s > bs) { bs = s; best = c; } }
    const fc = f * 2 ** (best / 1200); let hs = [1, 2, 3].filter((h) => frei(si, h)); if (!hs.length) hs = [1, 2, 3];
    let sw = 0, sc = 0; hs.forEach((h) => { const q = spitze(h * fc); if (!q) return; const c = 1200 * Math.log2(q.f / (h * f)); if (Math.abs(c - best) > 25) return; sw += q.m; sc += q.m * c; });
    const fein = sw ? sc / sw : best;
    const hk = hs.filter((h) => h < 3), staerke = Math.max(...(hk.length ? hk : hs).map((h) => at(h * f * 2 ** (fein / 1200)))) / rausch;
    return staerke > 12 && fein > -59.5 && fein < 59.5 ? { cent: Math.round(fein * 10) / 10, staerke, f: f * 2 ** (fein / 1200), hk: hk.length ? hk : hs } : null;
  });
  // Geister aussortieren: liegen alle hörbaren Teiltöne einer Saite auf Obertönen einer deutlich stärkeren Saite, war sie nicht angeschlagen
  const geist = (w, i) => w && roh.some((v, j) => j !== i && v && v.staerke > w.staerke * 1.5 && w.hk.every((h) => { const r = (h * w.f) / v.f, k = Math.round(r); return k >= 1 && k <= 4 && Math.abs(1200 * Math.log2(r / k)) < 25; }));
  return roh.map((w, i) => (!w || geist(w, i) ? null : { cent: w.cent, staerke: w.staerke }));
}
// ---------- Strobe: Streifen laufen mit der Verstimmung, stehen bei 0 Cent still ----------
function sgStrobeZeichnen(c, W, H, cent, frisch, farbe, dt) {
  sg.phase = (sg.phase || 0) + (frisch ? Math.max(-60, Math.min(60, cent)) * dt * 9 : 0);
  const reihen = [[18, 1], [36, 0.5], [72, 0.25]], hoehe = (H - 40) / reihen.length;
  c.save(); c.beginPath(); c.roundRect ? c.roundRect(16, 14, W - 32, H - 34, 18) : c.rect(16, 14, W - 32, H - 34); c.clip();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(16, 14, W - 32, H - 34);
  reihen.forEach(([breite, tempo], i) => {
    const y = 14 + i * hoehe, off = ((sg.phase * tempo) % (breite * 2) + breite * 2) % (breite * 2);
    const g = c.createLinearGradient(0, y, 0, y + hoehe); g.addColorStop(0, farbe); g.addColorStop(1, 'rgba(255,255,255,.08)');
    c.fillStyle = g; c.globalAlpha = frisch ? 0.85 : 0.25;
    for (let x = -breite * 2 + off; x < W; x += breite * 2) c.fillRect(x, y + 3, breite, hoehe - 6);
  });
  c.restore(); c.globalAlpha = 1;
  c.fillStyle = 'rgba(226,232,240,.75)'; c.font = '800 13px system-ui'; c.textAlign = 'center';
  c.fillText(!frisch ? 'Strobe – Saite anschlagen' : Math.abs(cent) < 0.5 ? 'steht still ✓' : (cent < 0 ? '◀ läuft links – zu tief' : 'läuft rechts – zu hoch ▶') + ' · ' + (cent > 0 ? '+' : '') + cent.toFixed(1).replace('.', ',') + ' Cent', W / 2, H - 6);
}
// ---------- Alle Saiten: Säulen je Saite ----------
function sgPolyZeichnen(c, W, H, werte, namen, frisch) {
  const n = namen.length, sp = (W - 32) / n, mitte = 14 + (H - 44) / 2, halb = (H - 44) / 2;
  c.strokeStyle = 'rgba(74,222,128,.5)'; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(16, mitte); c.lineTo(W - 16, mitte); c.stroke(); c.setLineDash([]);
  namen.forEach((name, i) => {
    const x = 16 + i * sp + sp / 2, w = werte && werte[i];
    c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.roundRect ? c.roundRect(x - sp * 0.32, 14, sp * 0.64, H - 44, 12) : c.rect(x - sp * 0.32, 14, sp * 0.64, H - 44); c.fill();
    if (w && frisch) {
      const ok = Math.abs(w.cent) <= 4, farbe = ok ? '#4ade80' : Math.abs(w.cent) <= 15 ? '#fde047' : '#fb7185', y = mitte - Math.max(-1, Math.min(1, w.cent / 50)) * halb * 0.92;
      c.shadowColor = farbe; c.shadowBlur = 16; c.fillStyle = farbe; c.beginPath(); c.roundRect ? c.roundRect(x - sp * 0.3, y - 6, sp * 0.6, 12, 6) : c.rect(x - sp * 0.3, y - 6, sp * 0.6, 12); c.fill(); c.shadowBlur = 0;
      c.fillStyle = farbe; c.font = '800 11px system-ui'; c.textAlign = 'center'; c.fillText(ok ? '✓' : (w.cent > 0 ? '+' : '') + Math.round(w.cent), x, w.cent > 0 ? y + 20 : y - 11);
    }
    c.fillStyle = 'rgba(226,232,240,.85)'; c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText(name, x, H - 10);
  });
}
// ---------- Wirbel-Anleitung: Kopfplatte mit markiertem Wirbel ----------
function sgKopfSvg(n, aktiv, richtung) {
  const links = Math.ceil(n / 2), rechts = n - links, hoch = Math.max(links, rechts), H = 40 + hoch * 34;
  let s = '<svg viewBox="0 0 140 ' + H + '" class="sg-kopf-bild" aria-hidden="true"><path d="M44 ' + H + ' L40 18 Q70 0 100 18 L96 ' + H + ' Z" class="sg-kopf-platte"/>';
  for (let i = 0; i < n; i++) {
    const links_ = i < links, platz = links_ ? i : n - 1 - i, y = H - 26 - platz * 34, x = links_ ? 30 : 110, sx = links_ ? 52 : 88, an = i === aktiv;
    s += '<line x1="' + sx + '" y1="' + H + '" x2="' + sx + '" y2="' + y + '" class="sg-kopf-saite' + (an ? ' an' : '') + '"/><line x1="' + sx + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" class="sg-kopf-steg"/>'
      + '<g class="sg-wirbel' + (an ? ' an ' + (richtung || '') : '') + '" transform="translate(' + x + ' ' + y + ')"><ellipse rx="11" ry="8"/>' + (an && richtung ? '<g class="sg-dreh"><path d="M-17 -6 A18 18 0 0 1 17 -6" /><path d="' + (richtung === 'spannen' ? 'M17 -6 l-6 -2 M17 -6 l1 -6' : 'M-17 -6 l6 -2 M-17 -6 l-1 -6') + '"/></g>' : '') + '</g>';
  }
  return s + '</svg>';
}
function sgKopfAnzeigen() {
  const box = $('sgKopf'); if (!box) return;
  const I = sgAktuell(), a = sg.anzeige, frisch = a && performance.now() - sg.zuletzt < 1500;
  if (!I || sg.ansicht === 'poly') { box.hidden = true; return; }
  box.hidden = false;
  const i = frisch && a.ziel.saite != null ? a.ziel.saite : sg.ziel, c = frisch ? a.cent : 0, ok = frisch && Math.abs(c) <= 5;
  const richtung = !frisch || ok ? '' : c < 0 ? 'spannen' : 'lockern';
  const name = i != null ? I.namen[i] + '-Saite' : 'Saite';
  const text = !frisch ? 'Saite anschlagen – der passende Wirbel leuchtet auf.' : ok ? '✓ ' + name + ' passt – nichts drehen.'
    : c < 0 ? '↻ ' + name + ' ist zu tief: Wirbel <b>spannen</b> (Saite fester), langsam drehen.' : '↺ ' + name + ' ist zu hoch: erst etwas <b>lockern</b>, dann von unten wieder hochstimmen – so hält die Stimmung besser.';
  const key = i + '|' + richtung + '|' + I.saiten.length;
  if (box.dataset.k !== key) { box.dataset.k = key; box.querySelector('.sg-kopf-grafik').innerHTML = sgKopfSvg(I.saiten.length, i, richtung); }
  box.querySelector('.sg-kopf-text').innerHTML = text; box.classList.toggle('ok', ok);
}
