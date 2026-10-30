// Gretchen – das Maskottchen der Dackel-Welt (Fotos mit freundlicher Erlaubnis von @chrissi_und_gretchen).
const GRETCHEN = {
  instagram: 'https://www.instagram.com/chrissi_und_gretchen/',
  avatar: 'img/gretchen/avatar.jpg',
  denkt: 'img/gretchen/avatar-denkt.jpg',
  steckbrief: ['5 Jahre jung', 'Käselover auf Diät 🧀', 'Gassi nur ohne Regen ☔️', 'Einzelprinzessin 👑', 'Teilzeit-Officedog 💼'],
  feed: [
    { src: 'img/gretchen/g01.jpg', text: 'Bereit für Halloween? 🕷️' },
    { src: 'img/gretchen/g04.jpg', text: 'Der perfekte Oktoberlook 🍂' },
    { src: 'img/gretchen/g05.jpg', text: 'Montag: gepflegt rentnern 😴' },
    { src: 'img/gretchen/g06.jpg', text: 'Sport? Nur für Leckerlis 🏋️' },
    { src: 'img/gretchen/g07.jpg', text: 'The new face of silk ✨' },
    { src: 'img/gretchen/g08.jpg', text: 'Birthday Recap 🎂' },
    { src: 'img/gretchen/g11.jpg', text: 'Impfen überlebt 💉' },
    { src: 'img/gretchen/g12.jpg', text: 'Schönes Wetter, wilde Pläne 🌾' },
  ],
  // Fotos für die Reaktion nach einer Antwort
  froh: ['g02', 'g03', 'g04', 'g07', 'g08', 'g10', 'g12'].map((n) => 'img/gretchen/' + n + '.jpg'),
  traurig: ['g05', 'g06', 'g09', 'g11'].map((n) => 'img/gretchen/' + n + '.jpg'),
  sprueche: {
    frage: ['Weißt du’s? 🐾', 'Na, das weißt du doch, oder? 🐶', 'Ich bin gespannt! 👀', 'Kleiner Tipp: Denk wie ein Dackel 🧠', 'Gretchen guckt zu… 👀', 'Für ein Leckerli? 🦴'],
    richtig: ['Wuff, genau! 🎉', 'Leckerli für dich! 🦴', 'Pfotastisch! 🐾', 'Gretchen ist stolz auf dich 💕', 'Richtig! Das gibt Käse 🧀', 'Du bist ja ein echter Dackel-Profi 👑'],
    falsch: ['Hmm, nicht ganz… 🥺', 'Da brauch ich erst mal ein Nickerchen 😴', 'Dackelblick: Nochmal? 🥺', 'Kein Leckerli diesmal… 🦴', 'Macht nix, ich hab dich trotzdem lieb 💕', 'Uff. Gassi bei Regen ist schöner als das 🌧️'],
    bestanden: ['Pfotastisch! Du hast es geschafft! 🎉', 'Prinzessinnen-Niveau erreicht 👑', 'Das feiern wir mit Käse! 🧀'],
    durchgefallen: ['Fast! Nochmal mit mir üben? 🐾', 'Kopf hoch – Dackel geben nie auf! 💪', 'Ich warte hier auf dich 🥺'],
  },
};

const zufall = (liste) => liste[Math.floor(Math.random() * liste.length)];

// ---------- Startseite ----------
function gretchenStart(an) {
  $('gretchenStart').hidden = !an;
  $('heroAvatar').hidden = !an;
  if (!an) return;
  $('heroAvatar').src = GRETCHEN.avatar;
  const sb = $('gretchenSteckbrief');
  if (!sb.children.length) {
    GRETCHEN.steckbrief.forEach((t) => { const li = document.createElement('li'); li.textContent = t; sb.appendChild(li); });
    GRETCHEN.feed.forEach((f) => {
      const fig = document.createElement('figure');
      fig.innerHTML = '<img alt="" loading="lazy"><figcaption></figcaption>';
      fig.querySelector('img').src = f.src;
      fig.querySelector('img').alt = 'Gretchen: ' + f.text;
      fig.querySelector('figcaption').textContent = f.text;
      $('gretchenFeed').appendChild(fig);
    });
    $('gretchenInsta').href = GRETCHEN.instagram;
  }
}

// ---------- Quiz ----------
function gretchenFrage() {
  $('gretchenBox').hidden = false;
  $('gretchenBox').className = 'gretchen-box';
  $('gretchenImg').src = GRETCHEN.denkt;
  $('gretchenBubble').textContent = zufall(GRETCHEN.sprueche.frage);
}
function gretchenAntwort(richtig) {
  $('gretchenBox').className = 'gretchen-box ' + (richtig ? 'froh' : 'traurig');
  $('gretchenImg').src = zufall(richtig ? GRETCHEN.froh : GRETCHEN.traurig);
  $('gretchenBubble').textContent = zufall(richtig ? GRETCHEN.sprueche.richtig : GRETCHEN.sprueche.falsch);
  if (richtig) konfetti(10);
}
function gretchenAus() { $('gretchenBox').hidden = true; }

// ---------- Ergebnis ----------
function gretchenErgebnis(an, bestanden, punkte, gesamt, stufe) {
  $('gretchenResult').hidden = !an;
  if (!an) return;
  $('gretchenResultImg').src = zufall(bestanden ? GRETCHEN.froh : GRETCHEN.traurig);
  $('gretchenResultText').textContent = zufall(bestanden ? GRETCHEN.sprueche.bestanden : GRETCHEN.sprueche.durchgefallen);
  $('storyMsg').textContent = '';
  $('storyBtn').onclick = () => storyBild({ bestanden, punkte, gesamt, stufe });
  if (bestanden) konfetti(60);
}

// ---------- Konfetti aus Pfoten, Knochen und Herzen ----------
function konfetti(anzahl) {
  const box = document.createElement('div');
  box.className = 'konfetti';
  for (let i = 0; i < anzahl; i++) {
    const s = document.createElement('span');
    s.textContent = zufall(['🐾', '🦴', '💕', '🧀', '✨', '🎀']);
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.6 + 's';
    s.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    s.style.fontSize = 16 + Math.random() * 18 + 'px';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3600);
}

// ---------- Story-Bild (1080 × 1920) zum Teilen auf Instagram ----------
function ladeBild(src) {
  return new Promise((ok, fehler) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fehler; i.src = src; });
}
function bildRund(ctx, img, x, y, r) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  const s = Math.max((2 * r) / img.width, (2 * r) / img.height);
  ctx.drawImage(img, x - (img.width * s) / 2, y - (img.height * s) / 2, img.width * s, img.height * s);
  ctx.restore();
}
function bildKachel(ctx, img, x, y, w, h, radius) {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.clip();
  const s = Math.max(w / img.width, h / img.height);
  ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
  ctx.restore();
}

async function storyBild({ bestanden, punkte, gesamt, stufe }) {
  const msg = $('storyMsg');
  msg.textContent = 'Bild wird gemalt … 🎨';
  try {
    await Promise.all([document.fonts.load('120px "Caveat"'), document.fonts.load('bold 60px "Nunito"')]).catch(() => {});
    const W = 1080, H = 1920;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fbe3ea'); g.addColorStop(1, '#f4c6d4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Pfoten-Deko
    ctx.font = '70px serif'; ctx.globalAlpha = 0.18;
    [[90, 160], [960, 260], [140, 1500], [930, 1700], [880, 1080], [120, 900]].forEach(([x, y]) => ctx.fillText('🐾', x, y));
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b3d2e';
    ctx.font = '130px "Caveat", cursive';
    ctx.fillText('Dackel-Quiz', W / 2, 230, 960);

    const [avatar, foto] = await Promise.all([ladeBild(GRETCHEN.avatar), ladeBild(zufall(bestanden ? GRETCHEN.froh : GRETCHEN.traurig))]);
    bildKachel(ctx, foto, 140, 320, 800, 760, 48);
    // Profilbild mit Instagram-Ring
    const ring = ctx.createLinearGradient(80, 960, 360, 1240);
    ring.addColorStop(0, '#f9ce34'); ring.addColorStop(0.5, '#ee2a7b'); ring.addColorStop(1, '#6228d7');
    ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(220, 1080, 128, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbe3ea'; ctx.beginPath(); ctx.arc(220, 1080, 116, 0, Math.PI * 2); ctx.fill();
    bildRund(ctx, avatar, 220, 1080, 106);

    ctx.fillStyle = '#6b3d2e';
    ctx.font = 'bold 190px "Nunito", system-ui, sans-serif';
    ctx.fillText(String(punkte).replace('.', ',') + ' / ' + gesamt, W / 2 + 80, 1290, 960);
    ctx.font = '600 58px "Nunito", system-ui, sans-serif';
    ctx.fillText(bestanden ? stufe.emoji + ' ' + stufe.name + ' der Dackelkunde' : 'Punkte im Dackel-Quiz', W / 2, 1400, 960);

    ctx.font = '84px "Caveat", cursive';
    ctx.fillStyle = '#c2577a';
    ctx.fillText(bestanden ? 'Gretchen ist stolz auf mich! 💕' : 'Gretchen sagt: Nochmal! 🐾', W / 2, 1530, 960);

    ctx.fillStyle = '#6b3d2e';
    ctx.font = '600 48px "Nunito", system-ui, sans-serif';
    ctx.fillText('Schaffst du mehr? 🐶', W / 2, 1680, 960);
    ctx.font = '44px "Nunito", system-ui, sans-serif';
    ctx.fillText('@chrissi_und_gretchen', W / 2, 1760, 960);
    ctx.font = '36px "Nunito", system-ui, sans-serif';
    ctx.fillStyle = '#9b6f6a';
    ctx.fillText(location.host + location.pathname, W / 2, 1830, 960);

    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    const datei = new File([blob], 'dackel-quiz-gretchen.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [datei] })) {
      try { await navigator.share({ files: [datei], title: 'Dackel-Quiz' }); msg.textContent = ''; return; }
      catch (e) { if (e && e.name === 'AbortError') { msg.textContent = ''; return; } }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = datei.name;
    a.click();
    msg.textContent = 'Bild gespeichert – jetzt in der Instagram-Story posten! 📸';
  } catch (e) {
    msg.textContent = 'Das Bild konnte nicht erstellt werden.';
  }
}
