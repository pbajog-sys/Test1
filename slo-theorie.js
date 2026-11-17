// 📖 Grammatik-Theorie (Slowenisch): je Thema ein kleines Kapitel – lesen (Seiten mit Beispielen), verstehen
// (Fragen mit Erklärung) und danach die Übungen der Werkstatt. Dazu „warum falsch?“-Erklärungen in den Übungen.
const SLP_THEORIE = {
  praesens: {
    regel: 'Die Endung zeigt die Person: -m ich · -š du · – er/sie · -mo wir · -te ihr · -jo sie.',
    seiten: [
      ['Drei Muster', '<p>Slowenische Verben gehören zu drei Mustern. Du erkennst sie an der <b>ich-Form</b>:</p><table class="slp-tabelle"><tr><th></th><th>-am</th><th>-em</th><th>-im</th></tr><tr><th>jaz</th><td>delam</td><td>pišem</td><td>govorim</td></tr><tr><th>ti</th><td>delaš</td><td>pišeš</td><td>govoriš</td></tr><tr><th>on/ona</th><td>dela</td><td>piše</td><td>govori</td></tr><tr><th>mi</th><td>delamo</td><td>pišemo</td><td>govorimo</td></tr><tr><th>vi</th><td>delate</td><td>pišete</td><td>govorite</td></tr><tr><th>oni</th><td>delajo</td><td>pišejo</td><td>govorijo</td></tr></table>'],
      ['Ohne „ich“ und „du“', '<p>Weil die Endung die Person schon verrät, lässt man das Pronomen meist weg:</p><p class="slp-bsp"><b>Govorim slovensko.</b> – Ich spreche Slowenisch.<br><b>Kje delaš?</b> – Wo arbeitest du?</p><p>Das Pronomen nimmt man nur zur Betonung: <i>Jaz delam, ti pa spiš.</i> – <b>Ich</b> arbeite, und <b>du</b> schläfst.</p>'],
      ['Wichtige Ausnahmen', '<p>Ein paar häufige Verben sind unregelmäßig – am besten auswendig:</p><p class="slp-bsp"><b>biti</b> (sein): sem, si, je, smo, ste, so<br><b>iti</b> (gehen): grem, greš, gre, gremo, greste, gredo<br><b>jesti</b> (essen): jem, ješ, je …<br><b>vedeti</b> (wissen): vem, veš, ve …</p>'],
    ],
    fragen: [
      { f: 'Welche Endung hat „wir“ in der Gegenwart?', o: ['-mo', '-te', '-m'], r: 0, e: 'mi delamo, mi govorimo – „wir“ endet auf -mo; -te ist „ihr“, -m ist „ich“.' },
      { f: '„Govorim slovensko.“ – Wer spricht?', o: ['ich', 'du', 'er'], r: 0, e: 'Die Endung -m bedeutet „ich“, auch ohne das Wort „jaz“.' },
      { f: 'Wie heißt „du schreibst“?', o: ['pišeš', 'piše', 'pišem'], r: 0, e: 'du → -š: pišeš. piše = er/sie schreibt, pišem = ich schreibe.' },
    ],
  },
  vergangenheit: {
    regel: 'Vergangenheit = biti (sem, si, je …) + l-Form, die sich nach Geschlecht richtet: delal (m), delala (f), delalo (n).',
    seiten: [
      ['Zwei Teile', '<p>Die Vergangenheit baut man aus <b>biti</b> in der Gegenwart + der <b>l-Form</b> des Verbs:</p><p class="slp-bsp"><b>Delal sem.</b> – Ich (Mann) habe gearbeitet.<br><b>Delala sem.</b> – Ich (Frau) habe gearbeitet.</p><p>Die l-Form bildest du aus dem Infinitiv: dela<b>ti</b> → dela<b>l</b>, govori<b>ti</b> → govori<b>l</b>.</p>'],
      ['Die l-Form passt sich an', '<table class="slp-tabelle"><tr><th></th><th>männlich</th><th>weiblich</th><th>sächlich</th></tr><tr><th>Einzahl</th><td>delal</td><td>delala</td><td>delalo</td></tr><tr><th>Dual</th><td>delala</td><td>delali</td><td>delali</td></tr><tr><th>Mehrzahl</th><td>delali</td><td>delale</td><td>delala</td></tr></table><p class="slp-bsp"><b>Ona je delala.</b> · <b>Oni so delali.</b> · <b>One so delale.</b></p>'],
      ['Wortstellung & Verneinung', '<p>Die biti-Form steht gern an <b>zweiter Stelle</b> im Satz:</p><p class="slp-bsp">Včeraj <b>sem</b> delal. · Kje <b>si</b> bil?</p><p>Verneint wird mit <b>nisem, nisi, ni …</b>:</p><p class="slp-bsp"><b>Nisem</b> delal. – Ich habe nicht gearbeitet.</p>'],
    ],
    fragen: [
      { f: '„Ona ___ delala.“', o: ['je', 'sem', 'so'], r: 0, e: 'ona (sie, eine Person) → je. sem = ich, so = sie (mehrere).' },
      { f: 'Eine Frau sagt „Ich habe gearbeitet“:', o: ['Delala sem.', 'Delal sem.', 'Delalo sem.'], r: 0, e: 'Die l-Form richtet sich nach dem Geschlecht: Frau → delala.' },
      { f: 'Wie verneint man „Delal sem“?', o: ['Nisem delal.', 'Ne sem delal.', 'Delal ne sem.'], r: 0, e: 'biti verneint ist eine eigene Form: nisem, nisi, ni …' },
    ],
  },
  zukunft: {
    regel: 'Zukunft = bom, boš, bo, bomo, boste, bodo + l-Form (delal/delala …).',
    seiten: [
      ['bom + l-Form', '<p>Die Zukunft ist leicht: <b>bom</b>-Form + dieselbe l-Form wie in der Vergangenheit.</p><table class="slp-tabelle"><tr><th>jaz</th><td>bom</td><th>mi</th><td>bomo</td></tr><tr><th>ti</th><td>boš</td><th>vi</th><td>boste</td></tr><tr><th>on/ona</th><td>bo</td><th>oni</th><td>bodo</td></tr></table><p class="slp-bsp"><b>Jutri bom delal.</b> – Morgen werde ich arbeiten.</p>'],
      ['„sein“ in der Zukunft', '<p>Bei <b>biti</b> selbst reicht die bom-Form allein:</p><p class="slp-bsp"><b>Jutri bom doma.</b> – Morgen bin ich zu Hause.<br><b>Kje boš?</b> – Wo wirst du sein?</p>'],
      ['Verneinung', '<p>Einfach <b>ne</b> davor:</p><p class="slp-bsp"><b>Ne bom</b> delal. – Ich werde nicht arbeiten.<br><b>Ne bodo</b> prišli. – Sie werden nicht kommen.</p>'],
    ],
    fragen: [
      { f: '„Wir werden arbeiten“ (Männer):', o: ['Delali bomo.', 'Delali smo.', 'Delamo bomo.'], r: 0, e: 'Zukunft: bomo + l-Form Mehrzahl (delali). „smo“ wäre Vergangenheit.' },
      { f: '„Jutri ___ doma.“ (ich)', o: ['bom', 'sem', 'bo'], r: 0, e: 'Bei biti reicht in der Zukunft die bom-Form: jaz → bom.' },
      { f: 'Verneint: „Ich werde nicht kommen“', o: ['Ne bom prišel.', 'Nisem prišel.', 'Bom ne prišel.'], r: 0, e: 'Zukunft verneint: ne + bom. „nisem“ gehört zur Vergangenheit.' },
    ],
  },
  nikalnica: {
    regel: 'Verneinung: ne vor dem Verb; biti → nisem/ni …, imeti → nimam. Das Objekt steht danach im Genitiv.',
    seiten: [
      ['ne – und Sonderformen', '<p>Meist reicht <b>ne</b> vor dem Verb: <i>Ne govorim nemško.</i></p><p>Zwei häufige Verben haben eigene Formen:</p><p class="slp-bsp"><b>biti:</b> nisem, nisi, ni, nismo, niste, niso<br><b>imeti:</b> nimam, nimaš, nima …</p>'],
      ['Genitiv nach Verneinung', '<p>Das Wichtigste: Das Objekt wechselt nach der Verneinung in den <b>Genitiv</b>.</p><p class="slp-bsp">Imam <b>čas</b>. → Nimam <b>časa</b>.<br>Vidim <b>avto</b>. → Ne vidim <b>avta</b>.<br>Pijem <b>kavo</b>. → Ne pijem <b>kave</b>.</p>'],
      ['„Es gibt kein …“', '<p><b>ni</b> + Genitiv heißt „es gibt kein(e)“:</p><p class="slp-bsp">Tukaj <b>ni</b> lekarne. – Hier gibt es keine Apotheke.<br><b>Ni</b> problema. – Kein Problem.</p>'],
    ],
    fragen: [
      { f: '„Ich bin nicht zu Hause.“', o: ['Nisem doma.', 'Ne sem doma.', 'Sem ne doma.'], r: 0, e: 'biti hat eine eigene verneinte Form: nisem (nicht „ne sem“).' },
      { f: '„Nimam ___.“ (čas – Zeit)', o: ['časa', 'čas', 'času'], r: 0, e: 'Nach der Verneinung steht das Objekt im Genitiv: čas → časa.' },
      { f: 'Warum „ne pijem kave“ und nicht „kavo“?', o: ['Verneinung → Genitiv', 'kava ist männlich', 'Mehrzahl'], r: 0, e: 'Ohne Verneinung Akkusativ (kavo), mit Verneinung Genitiv (kave).' },
    ],
  },
  rodilnik: {
    regel: 'Genitiv nach brez, do, iz, od, blizu, zaradi, nach Mengen und Verneinung. Einzahl: m/n -a, f -e.',
    seiten: [
      ['Wann Genitiv?', '<p>Der Genitiv („wessen? / von was?“) kommt sehr oft vor:</p><p class="slp-bsp">nach <b>brez</b> (ohne), <b>do</b> (bis), <b>iz</b> (aus), <b>od</b> (von), <b>blizu</b> (nahe), <b>zaradi</b> (wegen)<br>nach Mengen: <b>kozarec vode</b>, <b>veliko ljudi</b><br>nach Verneinung: <b>nimam časa</b><br>Besitz: <b>hiša mojega brata</b></p>'],
      ['Endungen Einzahl', '<table class="slp-tabelle"><tr><th>männlich</th><td>brat → brat<b>a</b></td></tr><tr><th>weiblich</th><td>voda → vod<b>e</b></td></tr><tr><th>sächlich</th><td>mesto → mest<b>a</b></td></tr></table><p class="slp-bsp">kava <b>brez</b> mlek<b>a</b> · <b>iz</b> Ljubljan<b>e</b></p>'],
      ['Endungen Mehrzahl', '<table class="slp-tabelle"><tr><th>männlich</th><td>brat → brat<b>ov</b></td></tr><tr><th>weiblich</th><td>žena → žen (ohne Endung)</td></tr><tr><th>sächlich</th><td>mesto → mest (ohne Endung)</td></tr></table><p>Ab fünf zählt man mit Genitiv Mehrzahl: <b>pet bratov</b>, <b>deset evrov</b>.</p>'],
    ],
    fragen: [
      { f: '„brez ___“ (mleko – Milch)', o: ['mleka', 'mleko', 'mleku'], r: 0, e: 'brez + Genitiv; sächlich -o → -a: mleka.' },
      { f: 'Genitiv Einzahl von „voda“:', o: ['vode', 'vodo', 'vodi'], r: 0, e: 'Weiblich -a → -e im Genitiv. vodo wäre Akkusativ, vodi Dativ/Lokativ.' },
      { f: 'Warum „kozarec vode“?', o: ['Menge → Genitiv', 'Ort → Lokativ', 'mit → Instrumental'], r: 0, e: 'Nach Mengenangaben (Glas, viel, wenig) steht der Genitiv.' },
    ],
  },
  dajalnik: {
    regel: 'Dativ = wem? Einzahl: m/n -u, f -i. k/h (zu) + Dativ; h vor k und g.',
    seiten: [
      ['Wem?', '<p>Der Dativ antwortet auf „wem?“ – oft die Person, die etwas bekommt:</p><p class="slp-bsp"><b>Dam mami darilo.</b> – Ich gebe Mama ein Geschenk.<br><b>Pomagam bratu.</b> – Ich helfe dem Bruder.</p><table class="slp-tabelle"><tr><th>männlich</th><td>brat → brat<b>u</b></td></tr><tr><th>weiblich</th><td>mama → mam<b>i</b></td></tr><tr><th>sächlich</th><td>mesto → mest<b>u</b></td></tr></table>'],
      ['k/h = zu', '<p><b>k</b> (zu) + Dativ: <i>Grem k zdravniku.</i> – Ich gehe zum Arzt.</p><p>Vor <b>k</b> und <b>g</b> wird k zu <b>h</b>: <i>h kolegu, h gospe</i>.</p><p>Auch <b>proti</b> (gegen, Richtung) nimmt den Dativ: <i>proti mestu</i>.</p>'],
      ['„Gefällt mir“', '<p>Mit Dativ-Pronomen: <b>mi</b> (mir), <b>ti</b> (dir), <b>mu</b> (ihm), <b>ji</b> (ihr):</p><p class="slp-bsp"><b>Všeč mi je.</b> – Es gefällt mir.<br><b>Kako ti je ime?</b> – Wie heißt du? (wörtlich: Wie ist dir der Name?)</p>'],
    ],
    fragen: [
      { f: '„Dam darilo ___.“ (brat)', o: ['bratu', 'brata', 'bratom'], r: 0, e: 'Wem? → Dativ; männlich -u: bratu.' },
      { f: '„zu einem Kollegen“:', o: ['h kolegu', 'k kolegu', 'h kolega'], r: 0, e: 'Vor k wird k zu h; dazu Dativ -u: h kolegu.' },
      { f: '„Ich gebe Mama ein Geschenk“:', o: ['Dam mami darilo.', 'Dam mamo darilo.', 'Dam mama darilo.'], r: 0, e: 'Mama ist „wem“ → Dativ, weiblich -i: mami.' },
    ],
  },
  tozilnik: {
    regel: 'Akkusativ = wen/was? Weiblich -a → -o; sächlich und männlich-unbelebt bleiben in der Grundform; männlich-belebt bekommt -a; v/na + Akkusativ = wohin.',
    seiten: [
      ['Wen oder was?', '<p>Nach Verben wie <b>vidim</b> (ich sehe), <b>imam</b> (ich habe), <b>iščem</b> (ich suche), <b>rad bi</b> (ich hätte gern) steht der Akkusativ.</p><p>Am auffälligsten bei weiblichen Wörtern: <b>-a → -o</b></p><p class="slp-bsp">kava → <b>Eno kavo, prosim.</b><br>sestra → <b>Imam sestro.</b></p>'],
      ['Männlich: lebt es?', '<p>Bei männlichen Wörtern kommt es darauf an, ob es lebt:</p><p class="slp-bsp">unbelebt = Grundform: <b>Vidim avto.</b> · <b>Imam čas.</b><br>belebt = -a: <b>Vidim brata.</b> · <b>Imam psa.</b></p><p>Sächliche Wörter bleiben gleich: <i>Pijem mleko.</i></p>'],
      ['Wohin? → Akkusativ', '<p><b>v</b> und <b>na</b> mit Akkusativ zeigen eine Richtung (wohin?):</p><p class="slp-bsp">Grem <b>v trgovino</b>. – Ich gehe in den Laden.<br>Grem <b>na pošto</b>. – Ich gehe zur Post.</p><p>Steht man schon dort (wo?), kommt der Lokativ: <i>Sem v trgovini.</i></p>'],
    ],
    fragen: [
      { f: '„Rad bi ___.“ (kava)', o: ['kavo', 'kava', 'kave'], r: 0, e: 'wen/was → Akkusativ, weiblich -a → -o.' },
      { f: '„Vidim ___.“ (brat)', o: ['brata', 'brat', 'bratu'], r: 0, e: 'brat lebt (männlich belebt) → Akkusativ = -a.' },
      { f: '„Grem v trgovino“ – warum -o?', o: ['wohin → Akkusativ', 'wo → Lokativ', 'Mehrzahl'], r: 0, e: 'Richtung (wohin) → Akkusativ. Am Ort (wo) wäre es „v trgovini“.' },
    ],
  },
  mestnik: {
    regel: 'Lokativ = wo/worüber, nur mit v, na, o, pri, po. Einzahl: m/n -u, f -i; Mehrzahl -ih / -ah.',
    seiten: [
      ['Nur mit Präposition', '<p>Den Lokativ gibt es nur nach bestimmten Präpositionen:</p><p class="slp-bsp"><b>v</b> (in), <b>na</b> (auf, an), <b>o</b> (über – ein Thema), <b>pri</b> (bei), <b>po</b> (nach, über … hin)</p><p class="slp-bsp">Sem <b>v</b> službi. · Govoriva <b>o</b> filmu. · <b>Pri</b> zdravniku sem.</p>'],
      ['Endungen', '<table class="slp-tabelle"><tr><th></th><th>Einzahl</th><th>Mehrzahl</th></tr><tr><th>männlich</th><td>v avt<b>u</b></td><td>v avt<b>ih</b></td></tr><tr><th>weiblich</th><td>v šol<b>i</b></td><td>v šol<b>ah</b></td></tr><tr><th>sächlich</th><td>v mest<b>u</b></td><td>v mest<b>ih</b></td></tr></table>'],
      ['wo oder wohin?', '<p class="slp-bsp">Wo? → Lokativ: <b>Sem v trgovini.</b><br>Wohin? → Akkusativ: <b>Grem v trgovino.</b></p><p>Gleiche Präposition, anderer Fall – die Frage entscheidet.</p>'],
    ],
    fragen: [
      { f: '„Sem v ___.“ (šola)', o: ['šoli', 'šolo', 'šola'], r: 0, e: 'wo? → Lokativ, weiblich -i: v šoli.' },
      { f: '„Govorimo o ___.“ (brat)', o: ['bratu', 'brata', 'brat'], r: 0, e: 'o (über) + Lokativ; männlich -u: o bratu.' },
      { f: 'Welche Frage verlangt den Lokativ?', o: ['Wo?', 'Wohin?', 'Wem?'], r: 0, e: 'Wo → Lokativ, wohin → Akkusativ, wem → Dativ.' },
    ],
  },
  orodnik: {
    regel: 'Instrumental = mit wem/womit, nach z/s, pred, za, pod, nad, med. Einzahl: f -o, m/n -om/-em.',
    seiten: [
      ['z/s = mit', '<p><b>z / s</b> (mit) + Instrumental:</p><table class="slp-tabelle"><tr><th>weiblich</th><td>mama → z mam<b>o</b></td></tr><tr><th>männlich</th><td>avto → z avt<b>om</b> · prijatelj → s prijatelj<b>em</b></td></tr><tr><th>sächlich</th><td>mleko → z mlek<b>om</b></td></tr></table><p>Nach weichen Lauten (c, č, š, ž, j) wird -om zu <b>-em</b>.</p>'],
      ['z oder s?', '<p><b>s</b> steht vor stimmlosen Lauten: <b>p, t, k, c, č, s, š, f, h</b> – sonst <b>z</b>.</p><p class="slp-bsp"><b>s</b> sestro · <b>s</b> prijateljem · <b>s</b> kolegom<br><b>z</b> mamo · <b>z</b> avtom · <b>z</b> bratom</p>'],
      ['Weitere Präpositionen', '<p>Auch für Orte (wo?) mit Instrumental: <b>pred</b> (vor), <b>za</b> (hinter), <b>pod</b> (unter), <b>nad</b> (über), <b>med</b> (zwischen).</p><p class="slp-bsp">Avto je <b>pred hišo</b>. – Das Auto steht vor dem Haus.</p>'],
    ],
    fragen: [
      { f: '„mit dem Bus“:', o: ['z avtobusom', 's avtobusom', 'z avtobus'], r: 0, e: 'avtobus beginnt mit a (stimmhaft) → z; männlich -om.' },
      { f: '„mit der Schwester“:', o: ['s sestro', 'z sestro', 's sestra'], r: 0, e: 'sestra beginnt mit s (stimmlos) → s; weiblich -o.' },
      { f: 'Warum „s kolegom“ und nicht „z kolegom“?', o: ['k ist stimmlos → s', 'kolega ist weiblich', 'Mehrzahl'], r: 0, e: 'Vor stimmlosen Lauten (p, t, k, c, č, s, š, f, h) steht s.' },
    ],
  },
  dvojina: {
    regel: 'Dual für genau zwei: Verben -va/-ta (sva, sta), Nomen m -a (dva brata), f/n -i (dve sestri).',
    seiten: [
      ['Genau zwei', '<p>Slowenisch hat neben Einzahl und Mehrzahl den <b>Dual</b> – für genau zwei:</p><p class="slp-bsp"><b>midva</b> (wir zwei), <b>vidva</b> (ihr zwei), <b>onadva</b> (die zwei)</p><p>Verben enden auf <b>-va</b> (wir zwei) und <b>-ta</b> (ihr/die zwei):</p><p class="slp-bsp">midva dela<b>va</b> · vidva dela<b>ta</b> · midva <b>sva</b>, vidva <b>sta</b></p>'],
      ['Nomen im Dual', '<table class="slp-tabelle"><tr><th>männlich</th><td><b>dva</b> brat<b>a</b></td></tr><tr><th>weiblich</th><td><b>dve</b> sestr<b>i</b></td></tr><tr><th>sächlich</th><td><b>dve</b> mest<b>i</b></td></tr></table><p><b>dva</b> für männlich, <b>dve</b> für weiblich und sächlich.</p>'],
      ['Ab drei: Mehrzahl', '<p class="slp-bsp">3–4: <b>trije bratje</b>, <b>tri sestre</b> (Mehrzahl)<br>ab 5: <b>pet bratov</b>, <b>pet sester</b> (Genitiv Mehrzahl)</p>'],
    ],
    fragen: [
      { f: '„Midva ___ prijatelja.“ (biti)', o: ['sva', 'smo', 'sta'], r: 0, e: 'midva (wir zwei) → sva. smo = wir (mehrere), sta = ihr/die zwei.' },
      { f: '„zwei Schwestern“:', o: ['dve sestri', 'dva sestri', 'dve sestre'], r: 0, e: 'weiblich → dve, Dual-Endung -i: dve sestri.' },
      { f: '„zwei Brüder“:', o: ['dva brata', 'dve brata', 'dva brati'], r: 0, e: 'männlich → dva, Dual-Endung -a: dva brata.' },
    ],
  },
  stevila: {
    regel: '1: en/ena/eno + Einzahl · 2: dva/dve + Dual · 3–4: Mehrzahl · ab 5: Genitiv Mehrzahl.',
    seiten: [
      ['Eins richtet sich nach dem Geschlecht', '<p class="slp-bsp"><b>en</b> brat (m) · <b>ena</b> sestra (f) · <b>eno</b> mesto (n)</p><p>Im Akkusativ: <i>Eno kavo, prosim.</i></p>'],
      ['Zwei bis vier', '<p class="slp-bsp">2 + Dual: <b>dva</b> brata, <b>dve</b> sestri<br>3–4 + Mehrzahl: <b>trije / štirje</b> bratje (m), <b>tri / štiri</b> sestre (f, n)</p>'],
      ['Ab fünf: Genitiv', '<p>Ab fünf steht das Nomen im <b>Genitiv Mehrzahl</b>:</p><p class="slp-bsp"><b>pet evrov</b> · <b>šest let</b> · <b>deset minut</b> · <b>pet sester</b></p>'],
    ],
    fragen: [
      { f: '„pet ___“ (evro)', o: ['evrov', 'evra', 'evri'], r: 0, e: 'Ab fünf → Genitiv Mehrzahl: evrov.' },
      { f: '„tri ___“ (sestra)', o: ['sestre', 'sestri', 'sester'], r: 0, e: '3–4 → Mehrzahl (Nominativ): sestre. sestri wäre Dual, sester Genitiv.' },
      { f: 'Welche Form passt zu „mesto“ (sächlich)?', o: ['eno mesto', 'en mesto', 'ena mesto'], r: 0, e: 'Eins passt sich an: sächlich → eno.' },
    ],
  },
  pridevnik: {
    regel: 'Adjektive passen sich an Geschlecht, Zahl und Fall an: nov avto, nova hiša, novo mesto; Genitiv m/n -ega, f -e.',
    seiten: [
      ['Gleiches Geschlecht', '<p class="slp-bsp"><b>nov</b> avto (m) · <b>nova</b> hiša (f) · <b>novo</b> mesto (n)</p><p>Auch nach „ist“: <i>Avto je rdeč. Hiša je rdeča. Jabolko je rdeče.</i></p>'],
      ['Mit den Fällen', '<table class="slp-tabelle"><tr><th></th><th>männlich/sächlich</th><th>weiblich</th></tr><tr><th>Genitiv</th><td>brez nov<b>ega</b> avta</td><td>brez nov<b>e</b> hiše</td></tr><tr><th>Lokativ</th><td>o nov<b>em</b> avtu</td><td>o nov<b>i</b> hiši</td></tr><tr><th>Instrumental</th><td>z nov<b>im</b> avtom</td><td>z nov<b>o</b> hišo</td></tr></table>'],
    ],
    fragen: [
      { f: '„brez ___ avta“ (nov)', o: ['novega', 'nove', 'novim'], r: 0, e: 'brez → Genitiv; männlich -ega: novega.' },
      { f: '„Hiša je ___.“ (lep)', o: ['lepa', 'lep', 'lepo'], r: 0, e: 'hiša ist weiblich → lepa.' },
      { f: '„z ___ hišo“ (nov)', o: ['novo', 'novim', 'nova'], r: 0, e: 'z → Instrumental; weiblich -o: z novo hišo.' },
    ],
  },
  zsk: {
    regel: 'z vor stimmhaften Lauten und Vokalen, s vor p t k c č s š f h; k vor fast allem, h vor k und g.',
    seiten: [
      ['z oder s', '<p>„mit“ heißt <b>z</b> oder <b>s</b> – je nach dem nächsten Laut:</p><p class="slp-bsp"><b>s</b> vor p, t, k, c, č, s, š, f, h: <i>s prijateljem, s sestro</i><br><b>z</b> sonst: <i>z mamo, z avtom, z bratom</i></p>'],
      ['k oder h', '<p>„zu“ heißt <b>k</b> – nur vor <b>k</b> und <b>g</b> wird es zu <b>h</b>:</p><p class="slp-bsp"><b>k</b> mami · <b>k</b> zdravniku<br><b>h</b> kolegu · <b>h</b> gospe</p>'],
    ],
    fragen: [
      { f: '„___ kolegom“ (mit)', o: ['s', 'z'], r: 0, e: 'k ist stimmlos → s.' },
      { f: '„___ kolegu“ (zu)', o: ['h', 'k'], r: 0, e: 'Vor k wird k zu h.' },
      { f: '„___ mamo“ (mit)', o: ['z', 's'], r: 0, e: 'm ist stimmhaft → z.' },
    ],
  },
};
// Labels einer Form in der Wortschatz-Tabelle (Nomen: 18 Formen = 6 Fälle × 3 Zahlen; Verben: 9 Personen)
function slpFormLabels(kand, form) {
  if (!kand || !form) return [];
  const f = sloNorm(form), idx = kand.map((x, i) => (x && sloNorm(x) === f ? i : -1)).filter((i) => i >= 0);
  if (kand.length === 18) return [...new Set(idx.map((i) => SLP_KASUS[i % 6] + ' ' + SLP_ZAHL[Math.floor(i / 6)]))];
  if (kand.length === 9) return [...new Set(idx.map((i) => SLP_PERS[i] + ' (' + SLP_PERS_DE[i] + ')'))];
  return [];
}
const SLP_THEMA_FALL = { tozilnik: 'Akkusativ', rodilnik: 'Genitiv', nikalnica: 'Genitiv', dajalnik: 'Dativ', mestnik: 'Lokativ', orodnik: 'Instrumental' };
// „Warum falsch?“: was die gewählte Form ist, was gesucht war, und die Regel des Themas
function slpWarum(a, gewaehlt) {
  const teile = [], nurForm = (t) => String(t || '').trim().split(/\s+/).pop();   // „z avtom“ → „avtom“
  const L = (x) => { const l = slpFormLabels(a.kand, x); return l.length ? l : slpFormLabels(a.kand, nurForm(x)); };
  const fall = SLP_THEMA_FALL[a.thema];
  let ziel = L(a.loesung); if (fall && ziel.some((x) => x.startsWith(fall))) ziel = ziel.filter((x) => x.startsWith(fall));
  const gew = L(gewaehlt).filter((x) => !ziel.includes(x));
  if (gew.length && ziel.length) teile.push('„' + sloEsc(gewaehlt) + '“ ist <b>' + gew.slice(0, 2).join(' / ') + '</b> – gesucht ist <b>' + ziel[0] + '</b>.');
  else if (ziel.length && a.kand && a.kand.length >= 9) teile.push('Gesucht ist <b>' + ziel[0] + '</b>' + (L(gewaehlt).length ? '' : ' – „' + sloEsc(gewaehlt) + '“ ist keine Form dieses Wortes') + '.');
  const th = a.thema && SLP_THEORIE[a.thema];
  if (th) teile.push('💡 ' + th.regel);
  return teile.join(' ');
}
