// Kulissen und kleine Animationen für jede Welt (Design in stil.css).
const WELT_FARBE = { wale: '#03203d', haie: '#101e2a', beide: '#ff9a76', porsche: '#1a1a1d', dackel: '#fdf1f4' };
const WELT_KONFETTI = {
  wale: ['🫧', '🐋', '💧', '✨', '🐳'],
  haie: ['🦈', '⚡', '🌊', '🔥'],
  beide: ['🌅', '🐋', '🦈', '🫧', '✨'],
  porsche: ['🏁', '🔥', '⚡', '🏆'],
  dackel: ['🐾', '🦴', '💕', '🧀', '✨', '🎀'],
};
const wenigBewegung = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const zufallZahl = (a, b) => a + Math.random() * (b - a);

const WELLE_SVG = (farbe) => '<svg viewBox="0 0 1200 90" preserveAspectRatio="none"><path fill="' + farbe
  + '" d="M0 45 Q 75 10 150 45 T 300 45 T 450 45 T 600 45 T 750 45 T 900 45 T 1050 45 T 1200 45 V90 H0 Z"/></svg>';
const FLOSSE_SVG = '<svg viewBox="0 0 90 60"><path fill="#1c2b38" stroke="rgba(255,255,255,0.15)" d="M10 58 C 30 50 44 22 52 2 C 58 26 70 46 88 58 Z"/></svg>';

function elem(cls, html = '') {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  return d;
}

// Baut die Kulisse der Welt in #ambient neu auf.
let ambientWelt = null;
function setAmbient(w) {
  if (ambientWelt === w) return;
  ambientWelt = w;
  const box = $('ambient');
  box.innerHTML = '';
  if (wenigBewegung()) return;

  const blasen = (n, groesse = [6, 22]) => {
    for (let i = 0; i < n; i++) {
      const b = elem('blase');
      const s = zufallZahl(...groesse);
      b.style.cssText = `left:${zufallZahl(0, 100)}vw;width:${s}px;height:${s}px;animation-duration:${zufallZahl(9, 18)}s;animation-delay:-${zufallZahl(0, 18)}s`;
      box.appendChild(b);
    }
  };

  if (w === 'wale') {
    [8, 38, 66].forEach((x, i) => {
      const r = elem('ray');
      r.style.cssText = `left:${x}vw;animation-delay:-${i * 3}s;animation-duration:${8 + i * 2}s`;
      box.appendChild(r);
    });
    blasen(16);
  } else if (w === 'haie') {
    blasen(6, [4, 10]);
    box.appendChild(elem('wasserlinie'));
    const f = elem('flosse', FLOSSE_SVG);
    box.appendChild(f);
  } else if (w === 'beide') {
    box.appendChild(elem('sun'));
    [['rgba(255,255,255,0.10)', 14, 0], ['rgba(46,63,143,0.55)', 10, 18], ['rgba(11,29,58,0.9)', 7, 34]].forEach(([farbe, dauer, unten]) => {
      const wl = elem('welle', WELLE_SVG(farbe));
      wl.style.cssText = `bottom:${-unten}px;animation-duration:${dauer}s`;
      box.appendChild(wl);
    });
    blasen(6, [4, 10]);
  } else if (w === 'porsche') {
    box.appendChild(elem('zielflagge'));
    for (let i = 0; i < 12; i++) {
      const s = elem('speed');
      s.style.cssText = `top:${zufallZahl(5, 95)}vh;width:${zufallZahl(12, 40)}vw;opacity:${zufallZahl(0.15, 0.5)};animation-duration:${zufallZahl(0.9, 2.2)}s;animation-delay:-${zufallZahl(0, 2)}s`;
      box.appendChild(s);
    }
  } else if (w === 'dackel') {
    for (let i = 0; i < 9; i++) {
      const p = elem('pfote', zufall(['🐾', '🐾', '🦴', '💕']));
      p.style.cssText = `left:${zufallZahl(0, 95)}vw;animation-duration:${zufallZahl(14, 24)}s;animation-delay:-${zufallZahl(0, 24)}s;font-size:${zufallZahl(16, 30)}px`;
      box.appendChild(p);
    }
  }
}

// Gleitende Markierung im Welt-Umschalter
function positionPill() {
  const on = document.querySelector('.welt-switch button.on');
  const pill = $('weltPill');
  if (!on || !pill || !on.offsetWidth) return;
  pill.style.left = on.offsetLeft + 'px';
  pill.style.width = on.offsetWidth + 'px';
}
window.addEventListener('resize', positionPill);

// „+1“ steigt aus einem Element auf
function plusEins(el, text = '+1') {
  if (!el || wenigBewegung()) return;
  const r = el.getBoundingClientRect();
  const s = document.createElement('div');
  s.className = 'plus';
  s.textContent = text;
  s.style.left = r.left + r.width / 2 + 'px';
  s.style.top = r.top + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1000);
}

// Zahl hochzählen, z. B. die Punkte im Ergebnis
function hochzaehlen(el, ziel, nachher = '') {
  if (wenigBewegung()) { el.textContent = fmt(ziel) + nachher; return; }
  const dauer = 900;
  const start = performance.now();
  const schritt = (t) => {
    const k = Math.min(1, (t - start) / dauer);
    const wert = Math.round(ziel * (1 - Math.pow(1 - k, 3)) * 2) / 2;   // in halben Punkten
    el.textContent = fmt(wert) + nachher;
    if (k < 1) requestAnimationFrame(schritt);
    else { el.classList.remove('zaehlt'); void el.offsetWidth; el.classList.add('zaehlt'); }
  };
  requestAnimationFrame(schritt);
}
