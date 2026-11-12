// 👆 iPhone-Gesten für die ganze Spielekiste: vom linken Bildschirmrand nach rechts wischen = zurück (wie in iOS-Apps).
// Ein Pfeil folgt dem Finger; ab ~90 px (oder mit Schwung) wird beim Loslassen der Zurück-Knopf der aktiven Seite gedrückt.
// Im Safari-Tab (nicht vom Home-Bildschirm) gehört die Randgeste Safari selbst – dort bleibt sie aus, sonst gäbe es zwei Rückwärts-Schritte.
function skGestenAn() {
  if (window.SK_GESTEN_IMMER) return true;
  const standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return standalone || !ios;
}
(function () {
  const RAND = 24, SCHWELLE = 90;
  let x0 = null, y0 = 0, t0 = 0, dx = 0, aktiv = false, knopf = null, pfeil = null;
  function zurueckKnopf() {
    const s = document.querySelector('.screen.active');
    if (!s) return null;
    if (s.id === 'screen-hub') return window.scrollY > 20 && typeof hubNachOben === 'function' ? { click: hubNachOben, isConnected: true } : null;  // „nochmal zurück“ = nach oben
    const sichtbar = (b) => b && !b.disabled && !b.hidden && b.offsetParent !== null;
    const k = [...s.querySelectorAll('[id$="Zurueck"], .farb-kopf .icon-btn')].find(sichtbar);
    if (k) return k;
    const h = document.getElementById('homeBtn');
    return sichtbar(h) ? h : null;
  }
  function pfeilSetzen(d) {
    if (!pfeil) { pfeil = document.createElement('div'); pfeil.className = 'sk-geste-pfeil'; pfeil.setAttribute('aria-hidden', 'true'); pfeil.textContent = '‹'; document.body.appendChild(pfeil); }
    const w = Math.min(d, 140);
    pfeil.style.setProperty('--x', Math.round(w * 0.55) + 'px'); pfeil.style.setProperty('--s', (0.6 + Math.min(1, d / SCHWELLE) * 0.4).toFixed(2));
    pfeil.style.top = Math.round(y0) + 'px';
    pfeil.classList.add('an'); pfeil.classList.toggle('bereit', d >= SCHWELLE);
  }
  function pfeilWeg() { if (pfeil) pfeil.classList.remove('an', 'bereit'); }
  document.addEventListener('touchstart', (e) => {
    x0 = null;
    if (e.touches.length !== 1 || !skGestenAn()) return;
    const t = e.touches[0], ziel = e.target;
    if (t.clientX > RAND) return;
    if (ziel.closest && ziel.closest('canvas, input, textarea, select, [data-eigene-geste], dialog[open]')) return;
    const pg = ziel.closest && ziel.closest('.sc-seiten'); if (pg && pg.scrollLeft > 4) return; // dort wischt man zwischen Seiten
    knopf = zurueckKnopf(); if (!knopf) return;
    x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); dx = 0; aktiv = false;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (x0 == null) return;
    const t = e.touches[0], ddx = t.clientX - x0, ddy = t.clientY - y0;
    if (!aktiv) {
      if (Math.abs(ddy) > 14 && Math.abs(ddy) > ddx) { x0 = null; return; }
      if (ddx > 10) aktiv = true;
    }
    if (aktiv) { dx = Math.max(0, ddx); pfeilSetzen(dx); if (e.cancelable) e.preventDefault(); }
  }, { passive: false });
  const ende = () => {
    if (x0 == null) return; x0 = null;
    if (!aktiv) return; aktiv = false;
    const v = dx / Math.max(1, Date.now() - t0);
    pfeilWeg();
    if ((dx >= SCHWELLE || (v > 0.5 && dx > 45)) && knopf && knopf.isConnected) knopf.click();
  };
  document.addEventListener('touchend', ende); document.addEventListener('touchcancel', () => { x0 = null; aktiv = false; pfeilWeg(); });
})();
