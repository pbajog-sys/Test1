// 😡 Ragebait-Fabrik – Satire. Drei Teile:
//   • Generator: überdrehte Empörungs-Posts aus acht „Lagern“ (alle kriegen ihr Fett weg), mit Empörungsgrad 1–5.
//   • Baukasten: aus vier Bausteinen den „perfekten“ Rage-Post bauen – Punkte gibt es für die Tricks (und Kombos).
//   • Detektor: einen echten Post einfügen und sehen, welche Empörungs-Tricks drinstecken (alles offline).
// Gespottet wird über Haltungen, Phrasen und Tricks – nicht über Gruppen von Menschen.
const RB_KEY = 'walquiz.rage.v1';
// Die Tricks (Zutaten) – mit Punkten fürs Spiel und einer kurzen Erklärung
const RB_TRICKS = {
  hook: { n: 'Schock-Einstieg', e: '🪝', p: 10, t: 'Ein dramatischer erster Satz hält den Daumen an – egal, was danach kommt.' },
  quelle: { n: 'Vage Quelle', e: '🌫️', p: 15, t: '„Studien zeigen“, „ein Bekannter hat erzählt“ – klingt nach Beweis, lässt sich aber nicht prüfen.' },
  feind: { n: 'Wir gegen die', e: '🆚', p: 20, t: 'Ein klares Feindbild macht aus einer Meinung eine Stammeszugehörigkeit – und Stämme teilen.' },
  stroh: { n: 'Strohmann', e: '🎭', p: 20, t: 'Die Gegenseite wird absurd übertrieben dargestellt – gegen den Pappkameraden ist man leicht im Recht.' },
  untergang: { n: 'Untergang', e: '📉', p: 15, t: 'Kleiner Anlass, riesige Folgen: „Das ist das Ende von …“ Angst bindet Aufmerksamkeit.' },
  anekdote: { n: 'Einzelfall als Beweis', e: '🎯', p: 10, t: 'Eine Begegnung beim Bäcker steht plötzlich für „alle“.' },
  frage: { n: 'Kommentar-Köder', e: '❓', p: 15, t: '„Bin ich der Einzige …?“ – eine Frage, auf die jeder antworten will. Kommentare = Reichweite.' },
  eile: { n: 'Dringlichkeit', e: '⏳', p: 15, t: '„Teilt das, bevor es gelöscht wird!“ – Zeitdruck schaltet das Nachdenken ab.' },
  moral: { n: 'Moralische Überlegenheit', e: '😇', p: 15, t: 'Wer widerspricht, ist automatisch ein schlechter Mensch – bequemer geht Diskutieren nicht.' },
  caps: { n: 'GROSSBUCHSTABEN', e: '🔊', p: 10, t: 'Lautstärke ersetzt Argumente.' },
  sachlich: { n: 'Sachlich', e: '🧊', p: -20, t: 'Ruhig, belegt, differenziert. Leider der Tod jeder Reichweite – im echten Leben aber genau richtig.' },
};
// Kombos – die Algorithmen lieben sie
const RB_KOMBOS = [
  { a: 'feind', b: 'stroh', p: 25, n: 'Feindbild komplett' },
  { a: 'quelle', b: 'untergang', p: 20, n: 'Panik mit „Beweis“' },
  { a: 'frage', b: 'eile', p: 15, n: 'Kommentar-Magnet' },
  { a: 'moral', b: 'feind', p: 15, n: 'Gut gegen Böse' },
];
// Allgemeine Bausteine (passen zu allen Lagern)
const RB_ALLG = {
  hook: [['Ich bin fassungslos.', ['hook']], ['Ich zittere immer noch.', ['hook']], ['Mir fehlen die Worte. Fast.', ['hook']], ['Das hier MUSS jeder sehen.', ['hook', 'caps']], ['Ich hätte nie gedacht, dass ich das mal schreiben muss.', ['hook']]],
  quelle: [['Studien zeigen das übrigens längst.', ['quelle']], ['Hat mir ein Bekannter erzählt, der kennt sich aus.', ['quelle']], ['Steht überall, man muss nur suchen.', ['quelle']], ['Das sagen sogar Experten (welche, ist ja egal).', ['quelle']]],
  frage: [['Bin ich eigentlich der Einzige, dem das auffällt?', ['frage']], ['Wie seht ihr das? Ehrlich jetzt.', ['frage']], ['Sagt mir bitte, dass ich nicht verrückt bin.', ['frage']]],
  eile: [['Teilt das, bevor es gelöscht wird!', ['eile']], ['Lest das, solange ihr noch könnt.', ['eile']], ['Morgen ist es vielleicht schon zu spät.', ['eile']]],
  sachlich: [['Ich habe dazu ein paar Zahlen nachgeschlagen, Quellen unten.', ['sachlich']], ['Vielleicht übersehe ich auch etwas – was meint ihr?', ['sachlich']], ['Es gibt sicher gute Gründe auf beiden Seiten.', ['sachlich']], ['Ich habe nachgefragt, und die Erklärung war eigentlich ganz einleuchtend.', ['sachlich']]],
};
// Lager: Name, Avatar, Bausteine (Aufreger = Anekdote/Strohmann, Steigerung = Untergang/Moral/Feindbild), Hashtags, Emojis
const RB_LAGER = [
  { id: 'woke', n: 'Haltungs-Aktivist:in', e: '🌈', name: 'Kim Achtsam', handle: '@kim.reflektiert', farbe: '#a78bfa',
    auf: [['Im Café stand „Milch“ auf der Karte. Nicht „Kuhmilch“. Nicht „Milch (tierischen Ursprungs)“. Einfach MILCH. Als wäre das normal.', ['anekdote']], ['Mein Nachbar hat sein Fahrrad „Drahtesel“ genannt. Esel. Ein lebendiges Wesen. Als Fortbewegungsmittel. Ich musste mich erst mal hinsetzen.', ['anekdote']], ['Heute hat mir jemand ungefragt die Tür aufgehalten. Ich weiß, dass er es „nett gemeint“ hat. Genau DAS ist ja das Problem.', ['anekdote']], ['Im Supermarkt gibt es Bananen OHNE Hinweis, unter welchen Bedingungen sie gereist sind. Und alle kaufen sie einfach.', ['anekdote']], ['Leute, die „Hallo zusammen“ schreiben, meinen damit natürlich nur Menschen, die zusammen sind. Und die anderen?', ['stroh']]],
    stei: [['Wer das nicht problematisch findet, sollte dringend seine Privilegien checken.', ['moral']], ['Es geht um so viel mehr als um Milch. Es geht um ALLES.', ['untergang', 'caps']], ['Die Gleichgültigen sind das eigentliche Problem. Ihr wisst, wer gemeint ist.', ['feind', 'moral']], ['Schweigen ist auch eine Haltung. Eine falsche.', ['moral']], ['Ich lege mein Handy jetzt in einen Safe Space und atme.', []]],
    tags: ['#Haltung', '#CheckYourPrivilege', '#Achtsamkeit', '#Awareness', '#Toxisch', '#Mikroaggression'], emo: ['🙏', '💜', '😔', '🌱', '✊'] },
  { id: 'wut', n: 'Früher-war-alles-besser', e: '🍺', name: 'Jürgen Klartext', handle: '@juergen_sagt_was', farbe: '#f97316',
    auf: [['Beim Bäcker stand heute „Brötchen“ in drei Sprachen dran. In DREI. Ich wollte doch nur ein Brötchen.', ['anekdote']], ['Die wollen uns jetzt das Schnitzel verbieten. Hab ich gehört. Wird bestimmt bald so kommen.', ['stroh', 'quelle']], ['Mein Neffe sagt „Lebensmittelpunkt“ statt „Zuhause“. Da sieht man, wohin das alles führt.', ['anekdote']], ['Die da oben fahren E-Auto und wir sollen Fahrrad fahren. Im Winter. Bergauf. Mit Kasten Bier.', ['stroh', 'feind']], ['Heute muss man ja für jedes Wort um Erlaubnis fragen. Bald sogar fürs Atmen.', ['stroh', 'untergang']]],
    stei: [['Aber das darf man ja nicht mehr sagen.', ['feind']], ['Wenn das so weitergeht, gibt es in zehn Jahren keine Bratwurst mehr. Merkt euch meine Worte.', ['untergang']], ['Die da oben lachen sich doch kaputt über uns.', ['feind']], ['Ich sag nur: Wehret den Anfängen. Beim Brötchen fängt es an.', ['untergang']], ['Ich bin ja kein Meckerer, aber …', []]],
    tags: ['#Klartext', '#DasWirdManJaNochSagenDürfen', '#Früher', '#GesunderMenschenverstand', '#Bratwurst'], emo: ['😤', '🍺', '🤬', '👊', '🇩🇪'] },
  { id: 'boomer', n: 'Die Jugend von heute', e: '👴', name: 'Gerda Hoffmann', handle: 'Gerda Hoffmann (Facebook)', farbe: '#38bdf8',
    auf: [['Heute im Bus: Fünf junge Leute, FÜNF, und alle am Handy. Keiner hat mit mir über das Wetter geredet.', ['anekdote', 'caps']], ['Mein Enkel weiß nicht, wie man ein Telefonbuch benutzt. Wie will der später überleben?', ['anekdote', 'untergang']], ['Früher haben wir mit einem Stock und einem Reifen gespielt. Den ganzen Tag. Und wir waren glücklich.', ['anekdote']], ['Die jungen Leute wollen nur noch vier Tage arbeiten. Wir hatten nicht mal einen Tag frei. Glaube ich.', ['stroh']]],
    stei: [['Diese Generation wird die Welt nicht retten. Die findet ja nicht mal den Kirchturm ohne App.', ['feind', 'untergang']], ['Wir haben noch gelernt, was Respekt ist!!!', ['moral']], ['Ich sag ja nix. Ich sag ja nur.', []], ['Bitte teilen, wer auch noch draußen gespielt hat!!!', ['eile', 'feind']]],
    tags: ['#FrüherWarAllesBesser', '#JugendVonHeute', '#Respekt', '#BitteTeilen', '#Wahrheit'], emo: ['👍', '🙈', '😢', '🌻', '☕'] },
  { id: 'hustle', n: 'Hustle-Bro', e: '💪', name: 'Maximilian Grind', handle: '@max.grindset', farbe: '#22c55e',
    auf: [['Während du geschlafen hast, war ich schon beim Eisbaden, habe zwei Bücher gelesen und einen Podcast gegründet. Es ist 5:03 Uhr.', ['anekdote']], ['Mein Mitarbeiter wollte „Feierabend“. Ich habe ihm erklärt, dass Feierabend ein Mindset ist.', ['anekdote', 'stroh']], ['Leute, die Urlaub machen, wollen einfach nicht erfolgreich sein. So einfach ist das.', ['stroh']], ['Ein Typ im Gym hat sein Handy angeschaut. ZWISCHEN den Sätzen. Kein Wunder, dass er nicht reich ist.', ['anekdote', 'caps']]],
    stei: [['Ausreden oder Ergebnisse. Du hast die Wahl.', ['moral']], ['99 % bleiben Mittelmaß. Die anderen lesen diesen Post zu Ende.', ['feind', 'moral']], ['Wer jetzt schon beleidigt ist, ist genau gemeint.', ['feind']], ['Dein 9-to-5 ist ein Käfig. Ich habe den Schlüssel. Link in Bio.', ['untergang']]],
    tags: ['#Grindset', '#NoExcuses', '#5amClub', '#Mindset', '#Hustle', '#Erfolg'], emo: ['💪', '🔥', '📈', '🦁', '⏰'] },
  { id: 'krypto', n: 'Krypto-Prophet', e: '🚀', name: 'Lukas Moon', handle: '@lukas.to.the.moon', farbe: '#facc15',
    auf: [['Meine Bank wollte heute wissen, wofür ich Geld überweise. Das ist kein Service, das ist Überwachung.', ['anekdote', 'untergang']], ['Mein Cousin hat noch ein Sparbuch. 2026. Ich habe für ihn gebetet.', ['anekdote', 'stroh']], ['Die Banken wissen genau, was kommt. Darum reden sie nicht darüber.', ['quelle', 'feind']]],
    stei: [['Have fun staying poor. 🫡', ['moral', 'feind']], ['Wer jetzt nicht einsteigt, erklärt es in fünf Jahren seinen Kindern.', ['untergang', 'eile']], ['Das System bricht zusammen. Die Frage ist nur: Bist du vorbereitet?', ['untergang']], ['Nicht die Coins sind volatil. Dein Mindset ist volatil.', ['moral']]],
    tags: ['#ToTheMoon', '#HODL', '#WAGMI', '#Freiheit', '#BankenSindScam'], emo: ['🚀', '🌕', '💎', '🙌', '📉'] },
  { id: 'wellness', n: 'Wellness-Influencerin', e: '🌿', name: 'Luna Lichtblick', handle: '@luna.vibes', farbe: '#2dd4bf',
    auf: [['Heute hat mir eine Kassiererin „schönen Tag noch“ gewünscht. Mit DIESER Energie. Ich habe sofort gespürt, wie meine Aura dunkler wurde.', ['anekdote', 'caps']], ['Leute trinken immer noch Leitungswasser, das nicht unter Vollmond gestanden hat. Und wundern sich.', ['stroh']], ['Ich habe meinen Kühlschrank entgiftet. Er war voller Erwartungen anderer.', ['anekdote']]],
    stei: [['Toxische Menschen erkennt man daran, dass sie diesen Post nicht liken.', ['feind', 'moral']], ['Unsere Gesellschaft ist so weit weg von sich selbst wie noch nie.', ['untergang']], ['Ich ziehe Grenzen. Du darfst gehen. 💫', ['moral']], ['Studien zeigen, dass Vibes messbar sind. Ich spüre es einfach.', ['quelle']]],
    tags: ['#GoodVibesOnly', '#Selbstliebe', '#Detox', '#Energie', '#Achtsam', '#Manifestieren'], emo: ['🌿', '✨', '🧘‍♀️', '🌙', '💫'] },
  { id: 'eltern', n: 'Eltern-Polizei', e: '🍼', name: 'Mama Sandra', handle: '@sandras.mamaleben', farbe: '#fb7185',
    auf: [['Auf dem Spielplatz hat eine Mutter ihrem Kind einen Keks gegeben. Einen KEKS. Mit Zucker. Am Vormittag.', ['anekdote', 'caps']], ['Ein Vater hat im Café aufs Handy geschaut, während sein Kind GLÜCKLICH gespielt hat. Wer weiß, was es ihm später erzählt.', ['anekdote', 'untergang']], ['Manche Eltern kaufen Spielzeug aus Plastik. Ich sage nichts. Ich schreibe nur hier.', ['stroh']]],
    stei: [['Ich würde NIEMALS über andere urteilen. Aber das musste raus.', ['moral', 'caps']], ['Diese Kinder sind unsere Zukunft – und genau so sieht sie dann aus.', ['untergang']], ['Wer sein Kind liebt, teilt diesen Beitrag.', ['moral', 'eile']], ['Es gibt Eltern und es gibt Leute mit Kindern. Ihr wisst, was ich meine.', ['feind']]],
    tags: ['#Mamaleben', '#ZuckerfreiGlücklich', '#Achtsam', '#Kindheit', '#IchSagJaNur'], emo: ['🙄', '🍼', '💕', '😱', '🧸'] },
  { id: 'essen', n: 'Food-Puristin', e: '🍝', name: 'Nonna Giulia', handle: '@vera_carbonara', farbe: '#ef4444',
    auf: [['Ein Restaurant hat Carbonara mit SAHNE serviert. Ich habe den Teller fotografiert und der Polizei geschickt.', ['anekdote', 'caps']], ['Mein Kollege isst Pizza mit Ananas. Freiwillig. Bei Tageslicht.', ['anekdote', 'stroh']], ['Jemand hat Ketchup an die Bratwurst gemacht, BEVOR er probiert hat.', ['anekdote', 'caps']]],
    stei: [['Das ist keine Geschmackssache. Das ist ein Verbrechen gegen die Kultur.', ['moral', 'untergang']], ['Leute wie ihr seid der Grund, warum Italien weint.', ['feind']], ['Wenn wir das hinnehmen, essen unsere Enkel Spaghetti mit Ketchup. Ich habe es kommen sehen.', ['untergang']]],
    tags: ['#NieMitSahne', '#Tradition', '#AnanasIstKeinBelag', '#Kultur', '#Respekt'], emo: ['🍝', '😡', '🇮🇹', '🙅‍♀️', '🔪'] },
];
let rb = null;
const rbStore = () => { const s = loadJson(RB_KEY); s.best = +s.best || 0; s.runden = +s.runden || 0; return s; };
const rbZufall = (a) => a[Math.floor(Math.random() * a.length)];
const rbEsc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Empörungsgrad anwenden: Emojis, Ausrufezeichen, GROSS
function rbHochdrehen(saetze, grad, lager) {
  return saetze.map((s, i) => {
    let t = s;
    if (grad >= 3) t = t.replace(/\.$/, '!');
    if (grad >= 4 && i === 0) t = t.toUpperCase();
    if (grad >= 5) t = t.replace(/!$/, '!!!1!').replace(/\?$/, '?!?');
    if (grad >= 2 && Math.random() < 0.2 * grad) t += ' ' + rbZufall(lager.emo);
    return t;
  });
}
function rbPostBauen(lager, grad, sachlich = false) {
  const teile = [];
  const nimm = (pool) => { const x = rbZufall(pool); teile.push(x); return x; };
  if (grad >= 2) nimm(RB_ALLG.hook);
  nimm(lager.auf);
  if (grad >= 2 || Math.random() < 0.5) nimm(lager.stei);
  if (grad >= 3) nimm(RB_ALLG.quelle);
  if (sachlich) nimm(RB_ALLG.sachlich);
  if (grad >= 4) nimm(RB_ALLG.eile);
  nimm(grad >= 3 ? RB_ALLG.frage : rbZufall([RB_ALLG.frage, lager.stei]));
  const tags = [...new Set(teile.flatMap((x) => x[1]))];
  if (grad >= 4) tags.push('caps');
  const saetze = rbHochdrehen(teile.map((x) => x[0]), grad, lager);
  const hash = rbMisch(lager.tags).slice(0, Math.min(6, 1 + grad));
  return { lager, text: saetze.join(' '), hash, tags: [...new Set(tags)], wert: rbWertung([...new Set(tags)]) };
}
const rbMisch = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function rbWertung(tags) {
  let p = tags.reduce((a, t) => a + (RB_TRICKS[t] ? RB_TRICKS[t].p : 0), 0);
  const kombos = RB_KOMBOS.filter((k) => tags.includes(k.a) && tags.includes(k.b));
  p += kombos.reduce((a, k) => a + k.p, 0);
  return { punkte: Math.max(0, p), kombos };
}
// Fake-Reaktionen: wächst mit der Wut, nicht mit der Wahrheit
function rbZahlen(punkte) {
  const f = Math.max(0.02, punkte / 100), r = 0.85 + Math.random() * 0.3;
  return { likes: Math.round(320 * f ** 1.6 * 40 * r), wut: Math.round(140 * f ** 2 * 40 * r), teilen: Math.round(60 * f ** 1.8 * 40 * r), kommentare: Math.round(90 * f ** 2.1 * 40 * r) };
}
const rbK = (n) => (n >= 1e6 ? (Math.round(n / 1e5) / 10).toString().replace('.', ',') + ' Mio.' : n >= 1e4 ? Math.round(n / 1000) + ' Tsd.' : fmt(n));
function rbKarte(post, zahlen) {
  const L = post.lager;
  return '<div class="rb-post" style="--f:' + L.farbe + '"><div class="rb-post-kopf"><span class="rb-ava">' + L.e + '</span><span><b>' + rbEsc(L.name) + '</b><small>' + rbEsc(L.handle) + ' · vor ' + (1 + Math.floor(Math.random() * 59)) + ' Min. · 🌍</small></span><em class="rb-satire">SATIRE</em></div>'
    + '<p class="rb-text">' + rbEsc(post.text) + '</p><p class="rb-hash">' + post.hash.map(rbEsc).join(' ') + '</p>'
    + '<div class="rb-zahlen"><span>👍 <b data-z="' + zahlen.likes + '">0</b></span><span>😡 <b data-z="' + zahlen.wut + '">0</b></span><span>💬 <b data-z="' + zahlen.kommentare + '">0</b></span><span>🔁 <b data-z="' + zahlen.teilen + '">0</b></span></div></div>';
}
function rbZaehlen(box) {
  box.querySelectorAll('[data-z]').forEach((b) => {
    const ziel = +b.dataset.z, t0 = performance.now(), d = wenigBewegung() ? 0 : 1200;
    const schritt = (t) => { const x = d ? Math.min(1, (t - t0) / d) : 1; b.textContent = rbK(Math.round(ziel * (1 - (1 - x) ** 3))); if (x < 1) requestAnimationFrame(schritt); };
    requestAnimationFrame(schritt);
  });
}
const rbTrickChips = (tags) => tags.filter((t) => RB_TRICKS[t]).map((t) => '<span class="rb-chip' + (RB_TRICKS[t].p < 0 ? ' gut' : '') + '" title="' + rbEsc(RB_TRICKS[t].t) + '">' + RB_TRICKS[t].e + ' ' + RB_TRICKS[t].n + '</span>').join('');

// ---------- Oberfläche ----------
function rbOeffnen() { show('rage', '😡 Ragebait-Fabrik'); rb = { teil: 'start', lager: 'zufall', grad: 3 }; rbStart(); }
function rbStart() {
  const st = rbStore(); rb.teil = 'start';
  $('rbInhalt').innerHTML = '<div class="rb-held"><div class="rb-logo">😡🏭</div><h2>Ragebait-Fabrik</h2><p>Satire über die Empörungs-Maschine im Netz. Alle Lager kriegen ihr Fett weg – und du lernst nebenbei, mit welchen Tricks Wut-Posts gebaut sind.</p></div>'
    + '<div class="rb-modi">'
    + '<button type="button" class="rb-modus" data-m="gen"><span>🎰</span><b>Generator</b><small>Ein Knopf, ein Wut-Post. Lager und Empörungsgrad wählbar.</small></button>'
    + '<button type="button" class="rb-modus" data-m="bau"><span>🧱</span><b>Baukasten</b><small>Bau den perfekten Rage-Post. 3 Runden, Punkte für jeden Trick.' + (st.best ? ' Bestwert: ' + fmt(st.best) : '') + '</small></button>'
    + '<button type="button" class="rb-modus" data-m="det"><span>🔍</span><b>Detektor</b><small>Echten Post einfügen und sehen, welche Tricks drinstecken.</small></button></div>'
    + '<div class="rb-karte"><h3>Die Tricks im Überblick</h3><div class="rb-tricks">' + Object.entries(RB_TRICKS).map(([k, t]) => '<div class="rb-trick' + (t.p < 0 ? ' gut' : '') + '"><b>' + t.e + ' ' + t.n + '</b><small>' + t.t + '</small></div>').join('') + '</div></div>'
    + '<p class="rb-hinweis">Alles hier ist erfunden und überzeichnet. Kopierte Posts tragen automatisch den Vermerk „Satire“.</p>';
  $('rbInhalt').querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => ({ gen: rbGenerator, bau: rbBauStart, det: rbDetektor })[b.dataset.m]()));
}
// ---------- Generator ----------
function rbGenerator() {
  rb.teil = 'gen';
  const lagerWahl = [['zufall', '🎲', 'Zufall']].concat(RB_LAGER.map((l) => [l.id, l.e, l.n]));
  $('rbInhalt').innerHTML = '<div class="rb-karte"><h3>Lager</h3><div class="rb-chips">' + lagerWahl.map(([id, e, n]) => '<button type="button" class="rb-lchip' + (rb.lager === id ? ' an' : '') + '" data-l="' + id + '">' + e + ' ' + n + '</button>').join('') + '</div>'
    + '<h3 class="rb-h3">Empörungsgrad <b id="rbGradText"></b></h3><input type="range" id="rbGrad" min="1" max="5" step="1" value="' + rb.grad + '"></div>'
    + '<button type="button" class="btn rb-gross" id="rbNeu">😡 Neuer Rage-Post</button><div id="rbAusgabe"></div>';
  const gradText = () => { $('rbGradText').textContent = ['', '😐 leicht genervt', '😒 empört', '😠 wütend', '🤬 außer sich', '💥 Weltuntergang'][rb.grad]; };
  gradText();
  $('rbGrad').addEventListener('input', () => { rb.grad = +$('rbGrad').value; gradText(); });
  $('rbInhalt').querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => { rb.lager = b.dataset.l; $('rbInhalt').querySelectorAll('[data-l]').forEach((x) => x.classList.toggle('an', x === b)); }));
  $('rbNeu').addEventListener('click', rbErzeugen);
  rbErzeugen();
}
function rbErzeugen() {
  const lager = rb.lager === 'zufall' ? rbZufall(RB_LAGER) : RB_LAGER.find((l) => l.id === rb.lager);
  const post = rbPostBauen(lager, rb.grad), zahlen = rbZahlen(post.wert.punkte);
  rb.post = post;
  const box = $('rbAusgabe');
  box.innerHTML = rbKarte(post, zahlen)
    + '<div class="rb-karte"><h3>Eingebaute Tricks · ' + post.wert.punkte + ' Wut-Punkte</h3><div class="rb-chips">' + rbTrickChips(post.tags) + '</div>'
    + (post.wert.kombos.length ? '<p class="rb-kombo">' + post.wert.kombos.map((k) => '🔗 Kombo „' + k.n + '“ +' + k.p).join(' · ') + '</p>' : '') + '<p class="rb-klein">Tippe auf einen Trick für die Erklärung.</p></div>'
    + '<div class="rb-knoepfe"><button type="button" class="btn secondary" id="rbKopieren">📋 Kopieren (mit „Satire“)</button></div><p class="rb-klein" id="rbKopiert"></p>';
  rbZaehlen(box);
  box.querySelectorAll('.rb-chip').forEach((c) => c.addEventListener('click', () => { $('rbKopiert').textContent = c.title; }));
  $('rbKopieren').addEventListener('click', async () => {
    const t = post.text + '\n' + post.hash.join(' ') + '\n\n(Satire – aus der Ragebait-Fabrik)';
    try { await navigator.clipboard.writeText(t); $('rbKopiert').textContent = '✓ Kopiert – mit Satire-Hinweis.'; } catch (e) { $('rbKopiert').textContent = t; }
  });
  if (navigator.vibrate) navigator.vibrate(rb.grad >= 4 ? [20, 30, 20] : 12);
}
// ---------- Baukasten ----------
const RB_SLOTS = [['Einstieg', 'Wie fängt dein Post an?'], ['Aufreger', 'Was ist passiert?'], ['Steigerung', 'Und was heißt das?'], ['Schluss', 'Wie holst du die Reaktionen?']];
function rbBauStart() {
  const lager = rbMisch(RB_LAGER).slice(0, 3);
  rb = { ...rb, teil: 'bau', runde: 0, lagerListe: lager, summe: 0, verlauf: [] };
  rbBauRunde();
}
function rbBauRunde() {
  const L = rb.lagerListe[rb.runde];
  // je Platz drei Karten: zwei „gute“ (für Wut) und eine sachliche
  const opt = [
    rbMisch([rbZufall(RB_ALLG.hook), rbZufall(RB_ALLG.hook.concat(RB_ALLG.quelle)), rbZufall(RB_ALLG.sachlich)]),
    rbMisch(rbMisch(L.auf).slice(0, 2).concat([[rbZufall(['Heute war eigentlich ein ganz normaler Tag.', 'Mir ist heute etwas aufgefallen, das ich spannend fand.', 'Kleine Beobachtung aus dem Alltag:']), ['sachlich']]])),
    rbMisch(rbMisch(L.stei.filter((x) => x[1].length)).slice(0, 2).concat([rbZufall(RB_ALLG.sachlich)])),
    rbMisch([rbZufall(RB_ALLG.frage), rbZufall(RB_ALLG.eile), [rbZufall(['Danke fürs Lesen, schönen Abend euch!', 'Wer mehr wissen will: Quellen stehen in den Kommentaren.']), ['sachlich']]]),
  ];
  rb.opt = opt; rb.wahl = [null, null, null, null];
  const zeichnen = () => {
    const fertig = rb.wahl.every((x) => x != null);
    const gewaehlt = rb.wahl.map((w, s) => (w == null ? null : opt[s][w]));
    const tg = [...new Set(gewaehlt.filter(Boolean).flatMap((x) => x[1]))], wert = rbWertung(tg);
    $('rbInhalt').innerHTML = '<div class="rb-runde">Runde ' + (rb.runde + 1) + ' / 3 · du schreibst als <b>' + L.e + ' ' + L.n + '</b></div>'
      + RB_SLOTS.map(([n, f], s) => '<div class="rb-karte rb-slot"><h3>' + (s + 1) + '. ' + n + ' <small>' + f + '</small></h3>' + opt[s].map((o, i) => '<button type="button" class="rb-option' + (rb.wahl[s] === i ? ' an' : '') + '" data-s="' + s + '" data-i="' + i + '">' + rbEsc(o[0]) + '</button>').join('') + '</div>').join('')
      + '<div class="rb-vorschau"><span>⚡ Wut-Punkte bisher: <b>' + wert.punkte + '</b></span>' + (wert.kombos.length ? '<span>🔗 ' + wert.kombos.map((k) => k.n).join(', ') + '</span>' : '') + '</div>'
      + '<button type="button" class="btn rb-gross" id="rbPosten"' + (fertig ? '' : ' disabled') + '>📤 Posten!</button>';
    $('rbInhalt').querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { rb.wahl[+b.dataset.s] = +b.dataset.i; zeichnen(); }));
    $('rbPosten').addEventListener('click', rbBauPosten);
  };
  zeichnen();
}
function rbBauPosten() {
  const L = rb.lagerListe[rb.runde], teile = rb.wahl.map((w, s) => rb.opt[s][w]), tags = [...new Set(teile.flatMap((x) => x[1]))], wert = rbWertung(tags);
  const post = { lager: L, text: teile.map((x) => x[0]).join(' '), hash: rbMisch(L.tags).slice(0, 3), tags, wert }, zahlen = rbZahlen(wert.punkte);
  rb.summe += wert.punkte; rb.verlauf.push(wert.punkte);
  const sachlich = tags.includes('sachlich');
  $('rbInhalt').innerHTML = '<div class="rb-runde">Runde ' + (rb.runde + 1) + ' / 3 · <b>' + wert.punkte + ' Wut-Punkte</b></div>' + rbKarte(post, zahlen)
    + '<div class="rb-karte"><h3>Deine Tricks</h3><div class="rb-chips">' + rbTrickChips(tags) + '</div>' + (wert.kombos.length ? '<p class="rb-kombo">' + wert.kombos.map((k) => '🔗 Kombo „' + k.n + '“ +' + k.p).join(' · ') + '</p>' : '')
    + '<p class="rb-klein">' + (sachlich ? '🧊 Du hast Sachlichkeit eingebaut – der Algorithmus straft das ab. Im echten Leben: genau richtig.' : wert.punkte >= 120 ? '🏆 Ein Meisterwerk der Empörung. Das Internet ist ein kleines bisschen schlechter geworden.' : 'Solide Wut. Da geht noch mehr – Kombos bringen Extrapunkte.') + '</p></div>'
    + '<button type="button" class="btn rb-gross" id="rbWeiter">' + (rb.runde < 2 ? 'Nächste Runde' : 'Zum Ergebnis') + '</button>';
  rbZaehlen($('rbInhalt'));
  $('rbWeiter').addEventListener('click', () => { rb.runde++; if (rb.runde < 3) rbBauRunde(); else rbBauEnde(); });
}
function rbBauEnde() {
  const st = rbStore(), neu = rb.summe > st.best; st.best = Math.max(st.best, rb.summe); st.runden++; saveJson(RB_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('rage', rb.summe, 450, 'Baukasten');
  const titel = rb.summe >= 330 ? '🤬 Großmeister der Empörung' : rb.summe >= 240 ? '😠 Wut-Profi' : rb.summe >= 140 ? '😒 Gelegenheits-Aufreger' : '🧊 Viel zu vernünftig fürs Internet';
  $('rbInhalt').innerHTML = '<div class="rb-held"><div class="rb-logo">' + titel.split(' ')[0] + '</div><h2>' + rb.summe + ' Wut-Punkte</h2><p>' + titel.slice(titel.indexOf(' ') + 1) + (neu ? ' · 🏆 neuer Bestwert!' : '') + '</p></div>'
    + '<div class="rb-karte"><h3>Und jetzt im Ernst</h3><p class="rb-klein">Genau diese Tricks stecken in vielen echten Posts: Feindbild, vage Quelle, Zeitdruck, Kommentar-Köder. Wer sie kennt, fällt seltener darauf herein – und scrollt einfach weiter. Der beste Konter gegen Ragebait ist: nicht reagieren.</p></div>'
    + '<div class="rb-knoepfe"><button type="button" class="btn rb-gross" id="rbNochmal">🔁 Noch eine Partie</button><button type="button" class="btn secondary" id="rbMenue">Menü</button></div>';
  $('rbNochmal').addEventListener('click', rbBauStart); $('rbMenue').addEventListener('click', rbStart);
  if (rb.summe >= 240) konfetti(26, ['😡', '🤬', '💥', '📣']);
}
// ---------- Detektor ----------
const RB_MUSTER = [
  ['eile', /teil(t|en) (das|es|bevor)|bevor (es|das) gelöscht|solange (ihr|man) noch|verbreitet das|zu spät/i],
  ['quelle', /studien zeigen|experten sagen|hab(e)? (ich )?gehört|man hört|ein (freund|bekannter)|steht überall|wissenschaftler (sagen|haben)|angeblich/i],
  ['feind', /die da oben|leute wie (ihr|du|die)|diese (leute|menschen|typen|generation)|die (eliten?|medien|regierung|politiker)|gutmenschen|schlafschafe|ihr wisst,? wer/i],
  ['untergang', /ende (der|unserer|von)|untergang|zusammenbr|bald (gibt es|ist)|wohin das führt|wenn das so weitergeht|katastroph|wehret den/i],
  ['frage', /bin ich (der|die) einzige|wie seht ihr das|oder bin ich|sagt mir|was meint ihr\?/i],
  ['moral', /wer (das|jetzt|sein)[^.!?]{0,30}(ist|sollte|liebt)|schäm(t|en) (euch|dich)|check (deine|your)|haltung zeigen|unfassbar respektlos/i],
  ['stroh', /wollen uns|verbieten|darf man (ja )?(nicht|nichts) mehr|bald (sogar|auch)|zwangs/i],
  ['hook', /^(ich bin fassungslos|unfassbar|mir fehlen die worte|das muss jeder|skandal|eilmeldung|achtung)/i],
];
function rbAnalyse(text) {
  const funde = {}, add = (t, beleg) => { (funde[t] = funde[t] || []).push(beleg); };
  RB_MUSTER.forEach(([t, re]) => { const m = text.match(re); if (m) add(t, m[0]); });
  const buchst = text.replace(/[^A-Za-zÄÖÜäöüß]/g, ''), gross = text.replace(/[^A-ZÄÖÜ]/g, '').length;
  const capsWoerter = (text.match(/\b[A-ZÄÖÜ]{3,}\b/g) || []).filter((w) => !['EU', 'USA', 'CDU', 'SPD', 'AFD', 'FDP', 'ARD', 'ZDF'].includes(w));
  if (capsWoerter.length >= 2 || (buchst.length > 20 && gross / buchst.length > 0.35)) add('caps', capsWoerter.slice(0, 3).join(', ') || 'viel GROSS');
  const ausruf = (text.match(/!/g) || []).length; if (ausruf >= 3) add('caps', ausruf + ' Ausrufezeichen');
  const wut = (text.match(/[😡🤬😤💥🔥‼❗]/gu) || []).length; if (wut >= 2) add('hook', wut + ' Wut-Emojis');
  const absolut = (text.match(/\b(immer|nie|niemals|alle|jeder|keiner|niemand|nur noch)\b/gi) || []).length; if (absolut >= 3) add('untergang', absolut + '× „immer/nie/alle“');
  const tags = Object.keys(funde), wert = rbWertung(tags), score = Math.min(100, Math.round(wert.punkte * 0.6 + (ausruf >= 5 ? 10 : 0)));
  return { funde, tags, wert, score };
}
function rbDetektor() {
  rb.teil = 'det';
  $('rbInhalt').innerHTML = '<div class="rb-karte"><h3>🔍 Ragebait-Detektor</h3><p class="rb-klein">Füge einen Post ein (oder tippe einen ab). Der Detektor sucht typische Empörungs-Tricks – offline, nichts wird gesendet. Er ist ein grober Spiegel, kein Urteil: Auch berechtigter Ärger kann laut sein.</p>'
    + '<textarea id="rbDetText" class="rb-eingabe" rows="5" placeholder="Post hier einfügen …"></textarea><div class="rb-knoepfe"><button type="button" class="btn rb-gross" id="rbPruefen">Prüfen</button><button type="button" class="btn secondary" id="rbBeispiel">Beispiel</button></div></div><div id="rbDetErg"></div>';
  const pruefen = () => {
    const t = $('rbDetText').value.trim(); if (!t) return;
    const A = rbAnalyse(t), stufe = A.score >= 70 ? ['🤬', 'Ragebait pur'] : A.score >= 40 ? ['😠', 'Deutlich auf Wut gebaut'] : A.score >= 15 ? ['😒', 'Ein paar Tricks dabei'] : ['🧊', 'Eher sachlich'];
    $('rbDetErg').innerHTML = '<div class="rb-karte rb-score"><div class="rb-ring" style="--p:' + A.score + '%"><b>' + A.score + '</b><small>von 100</small></div><div><b>' + stufe[0] + ' ' + stufe[1] + '</b><small>' + A.tags.length + ' Tricks gefunden' + (A.wert.kombos.length ? ' · Kombo: ' + A.wert.kombos.map((k) => k.n).join(', ') : '') + '</small></div></div>'
      + (A.tags.length ? '<div class="rb-karte"><h3>Gefunden</h3>' + A.tags.map((tg) => '<div class="rb-fund"><b>' + RB_TRICKS[tg].e + ' ' + RB_TRICKS[tg].n + '</b><small>„' + rbEsc(A.funde[tg][0]) + '“ – ' + RB_TRICKS[tg].t + '</small></div>').join('') + '</div>' : '<div class="rb-karte"><p class="rb-klein">Keine typischen Tricks gefunden. 👍</p></div>');
  };
  $('rbPruefen').addEventListener('click', pruefen);
  $('rbBeispiel').addEventListener('click', () => { const p = rbPostBauen(rbZufall(RB_LAGER), 5); $('rbDetText').value = p.text + ' ' + p.hash.join(' '); pruefen(); });
}
function rbHubText() { const el = $('hubRageBest'); if (!el) return; const st = rbStore(); el.textContent = st.best ? 'Bestwert Baukasten: ' + fmt(st.best) + ' Wut-Punkte' : 'Satire – und Tricks erkennen lernen'; }
rbHubText();
$('hubRage').addEventListener('click', () => { merkeZuletzt('rage'); zoomZu($('hubRage'), rbOeffnen); });
$('rbZurueck').addEventListener('click', () => { if (rb && rb.teil !== 'start') { rbStart(); return; } rb = null; zeigeHub(); rbHubText(); });
