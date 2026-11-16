// 🇸🇮 Slowenisch für Beruf: Pharma 💊 und Business 💼 – Wörter mit Beispielsätzen, Rollenspiele, Grammatik-Duell.
// Zeilenformat: slowenisch | deutsch | Beispielsatz slowenisch | Beispielsatz deutsch
const SLF_ZEILEN = (t) => t.trim().split('\n').map((z) => z.split('|').map((x) => x.trim())).map(([z, de, bsp, bspDe]) => ({ z, de, bsp: bsp || '', bspDe: bspDe || '' }));
const SLF_PHARMA = SLF_ZEILEN(`
zdravilo | Arzneimittel | To zdravilo jemljite dvakrat na dan. | Nehmen Sie dieses Arzneimittel zweimal täglich ein.
tableta | Tablette | Tableto pogoltnite s kozarcem vode. | Schlucken Sie die Tablette mit einem Glas Wasser.
kapsula | Kapsel | Vzemite eno kapsulo zjutraj. | Nehmen Sie morgens eine Kapsel.
sirup | Sirup (Saft) | Otrok dobi sirup proti kašlju. | Das Kind bekommt Hustensaft.
mazilo | Salbe | Mazilo nanesite na kožo. | Tragen Sie die Salbe auf die Haut auf.
kapljice | Tropfen | Kapljice za oči so v hladilniku. | Die Augentropfen sind im Kühlschrank.
injekcija | Injektion (Spritze) | Medicinska sestra mi je dala injekcijo. | Die Krankenschwester hat mir eine Spritze gegeben.
cepivo | Impfstoff | Cepivo je treba hraniti v hladilniku. | Der Impfstoff muss im Kühlschrank gelagert werden.
recept | Rezept (ärztlich) | Za to zdravilo potrebujete recept. | Für dieses Arzneimittel brauchen Sie ein Rezept.
lekarna | Apotheke | Lekarna je odprta do osmih. | Die Apotheke hat bis acht Uhr geöffnet.
farmacevt | Apotheker | Farmacevt mi je razložil odmerek. | Der Apotheker hat mir die Dosis erklärt.
zdravnik | Arzt | Zdravnik mi je predpisal antibiotik. | Der Arzt hat mir ein Antibiotikum verschrieben.
bolnik | Patient | Bolnik prejema zdravilo vsak dan. | Der Patient erhält das Arzneimittel täglich.
odmerek | Dosis | Ne presezite priporočenega odmerka. | Überschreiten Sie nicht die empfohlene Dosis.
neželeni učinek | Nebenwirkung | Pogost neželeni učinek je glavobol. | Eine häufige Nebenwirkung ist Kopfschmerz.
učinkovina | Wirkstoff | Učinkovina je paracetamol. | Der Wirkstoff ist Paracetamol.
pomožna snov | Hilfsstoff | Laktoza je pomožna snov. | Laktose ist ein Hilfsstoff.
navodilo za uporabo | Packungsbeilage | Pred uporabo preberite navodilo za uporabo. | Lesen Sie vor der Anwendung die Packungsbeilage.
rok uporabnosti | Verfallsdatum | Rok uporabnosti je potekel. | Das Verfallsdatum ist abgelaufen.
serija | Charge | Številka serije je na škatli. | Die Chargennummer steht auf der Schachtel.
škatla | Schachtel | Škatla je poškodovana. | Die Schachtel ist beschädigt.
ovojnina | Verpackung | Ovojnina ščiti zdravilo pred svetlobo. | Die Verpackung schützt das Arzneimittel vor Licht.
shranjevanje | Lagerung | Shranjevanje pri temperaturi do 25 stopinj. | Lagerung bei Temperaturen bis 25 Grad.
hladilnik | Kühlschrank | Inzulin hranite v hladilniku. | Bewahren Sie das Insulin im Kühlschrank auf.
alergija | Allergie | Ali imate alergijo na penicilin? | Haben Sie eine Allergie gegen Penicillin?
nosečnost | Schwangerschaft | Zdravilo ni primerno v nosečnosti. | Das Arzneimittel ist in der Schwangerschaft nicht geeignet.
dojenje | Stillen (Stillzeit) | Med dojenjem se posvetujte z zdravnikom. | Fragen Sie in der Stillzeit Ihren Arzt.
kontraindikacija | Gegenanzeige | Kontraindikacije so navedene v navodilu. | Die Gegenanzeigen stehen in der Packungsbeilage.
indikacija | Anwendungsgebiet (Indikation) | Indikacija je visok krvni tlak. | Das Anwendungsgebiet ist Bluthochdruck.
medsebojno delovanje | Wechselwirkung | Medsebojno delovanje z alkoholom ni znano. | Eine Wechselwirkung mit Alkohol ist nicht bekannt.
preveliko odmerjanje | Überdosierung | Pri prevelikem odmerjanju takoj pokličite zdravnika. | Rufen Sie bei einer Überdosierung sofort einen Arzt.
zdravljenje | Behandlung | Zdravljenje traja deset dni. | Die Behandlung dauert zehn Tage.
diagnoza | Diagnose | Diagnoza še ni znana. | Die Diagnose ist noch nicht bekannt.
bolečina | Schmerz | Imam hude bolečine v hrbtu. | Ich habe starke Rückenschmerzen.
vročina | Fieber | Otrok ima vročino. | Das Kind hat Fieber.
glavobol | Kopfschmerzen | Imam glavobol. | Ich habe Kopfschmerzen.
kašelj | Husten | Kašelj traja že en teden. | Der Husten dauert schon eine Woche.
prehlad | Erkältung | Imam prehlad. | Ich bin erkältet.
krvni tlak | Blutdruck | Izmerili so mi krvni tlak. | Man hat mir den Blutdruck gemessen.
sladkorna bolezen | Diabetes | Moj oče ima sladkorno bolezen. | Mein Vater hat Diabetes.
zdravilo proti bolečinam | Schmerzmittel | Ali imate zdravilo proti bolečinam? | Haben Sie ein Schmerzmittel?
antibiotik | Antibiotikum | Antibiotik jemljite do konca. | Nehmen Sie das Antibiotikum bis zum Ende.
na tešče | auf nüchternen Magen | Zdravilo vzemite na tešče. | Nehmen Sie das Arzneimittel auf nüchternen Magen.
po jedi | nach dem Essen | Tableto vzemite po jedi. | Nehmen Sie die Tablette nach dem Essen.
klinično preskušanje | klinische Prüfung (Studie) | Klinično preskušanje ima več faz. | Die klinische Prüfung hat mehrere Phasen.
udeleženec študije | Studienteilnehmer | Vsak udeleženec študije podpiše soglasje. | Jeder Studienteilnehmer unterschreibt eine Einwilligung.
placebo | Placebo | Polovica bolnikov je dobila placebo. | Die Hälfte der Patienten hat ein Placebo bekommen.
učinkovitost | Wirksamkeit | Študija je potrdila učinkovitost zdravila. | Die Studie hat die Wirksamkeit des Arzneimittels bestätigt.
varnost | Sicherheit | Varnost bolnikov je na prvem mestu. | Die Sicherheit der Patienten steht an erster Stelle.
farmakovigilanca | Pharmakovigilanz | Farmakovigilanca spremlja varnost zdravil. | Die Pharmakovigilanz überwacht die Arzneimittelsicherheit.
dovoljenje za promet | Zulassung | Zdravilo je dobilo dovoljenje za promet. | Das Arzneimittel hat die Zulassung erhalten.
regulativni organ | Zulassungsbehörde | Regulativni organ je zahteval dodatne podatke. | Die Behörde hat zusätzliche Daten angefordert.
proizvodnja | Herstellung | Proizvodnja poteka v čistih prostorih. | Die Herstellung findet in Reinräumen statt.
čisti prostor | Reinraum | V čisti prostor vstopimo v zaščitni obleki. | Den Reinraum betreten wir in Schutzkleidung.
dobra proizvodna praksa | Gute Herstellungspraxis (GMP) | Dobra proizvodna praksa je obvezna. | Die Gute Herstellungspraxis ist Pflicht.
kakovost | Qualität | Kakovost preverjamo na vsakem koraku. | Die Qualität prüfen wir bei jedem Schritt.
zagotavljanje kakovosti | Qualitätssicherung (QA) | Zagotavljanje kakovosti odobri serijo. | Die Qualitätssicherung gibt die Charge frei.
kontrola kakovosti | Qualitätskontrolle (QC) | Kontrola kakovosti analizira vzorce. | Die Qualitätskontrolle analysiert die Proben.
validacija | Validierung | Validacija procesa je zaključena. | Die Prozessvalidierung ist abgeschlossen.
odstopanje | Abweichung | Odstopanje moramo dokumentirati. | Wir müssen die Abweichung dokumentieren.
korektivni ukrep | Korrekturmaßnahme | Določili smo korektivni ukrep. | Wir haben eine Korrekturmaßnahme festgelegt.
preventivni ukrep | Vorbeugemaßnahme | Preventivni ukrep prepreči ponovitev napake. | Eine Vorbeugemaßnahme verhindert, dass der Fehler wieder auftritt.
presoja | Audit | Prihodnji teden imamo presojo. | Nächste Woche haben wir ein Audit.
inšpekcija | Inspektion | Inšpekcija je minila brez ugotovitev. | Die Inspektion verlief ohne Beanstandungen.
standardni operativni postopek | Standardarbeitsanweisung (SOP) | Delamo po standardnem operativnem postopku. | Wir arbeiten nach der Standardarbeitsanweisung.
specifikacija | Spezifikation | Rezultat je v mejah specifikacije. | Das Ergebnis liegt innerhalb der Spezifikation.
vzorec | Probe | Vzorec smo poslali v laboratorij. | Wir haben die Probe ins Labor geschickt.
laboratorij | Labor | Laboratorij dela tudi ob sobotah. | Das Labor arbeitet auch samstags.
analiza | Analyse | Analiza bo končana jutri. | Die Analyse ist morgen fertig.
rezultat | Ergebnis | Rezultati so dobri. | Die Ergebnisse sind gut.
sterilen | steril | Raztopina mora biti sterilna. | Die Lösung muss steril sein.
surovina | Rohstoff | Surovine preverimo ob prevzemu. | Die Rohstoffe prüfen wir bei der Annahme.
generično zdravilo | Generikum | Krka proizvaja generična zdravila. | Krka stellt Generika her.
biološko zdravilo | Biologikum | Biološko zdravilo se daje z injekcijo. | Ein Biologikum wird gespritzt.
patent | Patent | Patent poteče naslednje leto. | Das Patent läuft nächstes Jahr aus.
raziskave in razvoj | Forschung und Entwicklung | Podjetje vlaga v raziskave in razvoj. | Das Unternehmen investiert in Forschung und Entwicklung.
farmacevtska industrija | Pharmaindustrie | Farmacevtska industrija je pomembna za Slovenijo. | Die Pharmaindustrie ist wichtig für Slowenien.
medicinski pripomoček | Medizinprodukt | Merilnik tlaka je medicinski pripomoček. | Ein Blutdruckmessgerät ist ein Medizinprodukt.
`);
const SLF_BUSINESS = SLF_ZEILEN(`
sestanek | Besprechung (Meeting) | Sestanek je ob desetih. | Das Meeting ist um zehn.
rok | Frist (Deadline) | Rok za oddajo je petek. | Die Abgabefrist ist Freitag.
pogodba | Vertrag | Pogodbo bomo podpisali jutri. | Wir unterschreiben den Vertrag morgen.
ponudba | Angebot | Pošljite nam ponudbo, prosim. | Schicken Sie uns bitte ein Angebot.
račun | Rechnung | Račun plačajte v tridesetih dneh. | Zahlen Sie die Rechnung innerhalb von dreißig Tagen.
naročilo | Bestellung (Auftrag) | Naročilo smo že poslali. | Wir haben die Bestellung schon abgeschickt.
stranka | Kunde (Kundin) | Stranka je zelo zadovoljna. | Die Kundin ist sehr zufrieden.
dobavitelj | Lieferant | Iščemo novega dobavitelja. | Wir suchen einen neuen Lieferanten.
dobava | Lieferung | Dobava bo v ponedeljek. | Die Lieferung kommt am Montag.
podjetje | Unternehmen (Firma) | Podjetje ima sto zaposlenih. | Das Unternehmen hat hundert Mitarbeiter.
vodja | Leiter (Leiterin) | Moja vodja je na dopustu. | Meine Chefin ist im Urlaub.
direktor | Geschäftsführer | Direktor bo odgovoril jutri. | Der Geschäftsführer antwortet morgen.
sodelavec | Kollege | To je moj sodelavec Marko. | Das ist mein Kollege Marko.
sodelavka | Kollegin | Sodelavka vodi projekt. | Die Kollegin leitet das Projekt.
zaposleni | Mitarbeiter | Vsi zaposleni so na sestanku. | Alle Mitarbeiter sind im Meeting.
plača | Gehalt | Plača je izplačana do petnajstega. | Das Gehalt wird bis zum Fünfzehnten ausgezahlt.
dopust | Urlaub | Naslednji teden sem na dopustu. | Nächste Woche bin ich im Urlaub.
poročilo | Bericht | Poročilo bo pripravljeno do petka. | Der Bericht ist bis Freitag fertig.
predstavitev | Präsentation | Predstavitev traja dvajset minut. | Die Präsentation dauert zwanzig Minuten.
pogajanja | Verhandlungen | Pogajanja so bila težka. | Die Verhandlungen waren schwierig.
dogovor | Vereinbarung | Dogovor velja do konca leta. | Die Vereinbarung gilt bis Jahresende.
proračun | Budget | Proračun za projekt je omejen. | Das Budget für das Projekt ist begrenzt.
stroški | Kosten | Stroški so višji od načrtovanih. | Die Kosten sind höher als geplant.
prihodki | Umsatz (Erlöse) | Prihodki so letos zrasli. | Der Umsatz ist dieses Jahr gestiegen.
dobiček | Gewinn | Dobiček je večji kot lani. | Der Gewinn ist höher als letztes Jahr.
izguba | Verlust | Podjetje je imelo izgubo. | Das Unternehmen hatte einen Verlust.
cena | Preis | Cena je previsoka. | Der Preis ist zu hoch.
popust | Rabatt | Ali nam lahko date popust? | Können Sie uns einen Rabatt geben?
plačilo | Zahlung | Plačilo je prispelo včeraj. | Die Zahlung ist gestern eingegangen.
DDV | Mehrwertsteuer | Cena ne vključuje DDV. | Der Preis enthält keine Mehrwertsteuer.
davek | Steuer | Davek plačamo vsak mesec. | Die Steuer zahlen wir jeden Monat.
trg | Markt | Vstopamo na nemški trg. | Wir treten in den deutschen Markt ein.
konkurenca | Konkurrenz | Konkurenca je močna. | Die Konkurrenz ist stark.
rast | Wachstum | Rast je bila deset odstotkov. | Das Wachstum betrug zehn Prozent.
strategija | Strategie | Nova strategija velja od januarja. | Die neue Strategie gilt ab Januar.
cilj | Ziel | Naš cilj je rast. | Unser Ziel ist Wachstum.
projekt | Projekt | Projekt je v zamudi. | Das Projekt ist im Verzug.
naloga | Aufgabe | To je nujna naloga. | Das ist eine dringende Aufgabe.
odgovornost | Verantwortung | Za projekt nosim odgovornost. | Ich trage die Verantwortung für das Projekt.
termin | Termin | Ali vam ustreza termin v sredo? | Passt Ihnen ein Termin am Mittwoch?
videokonferenca | Videokonferenz | Videokonferenca se začne ob devetih. | Die Videokonferenz beginnt um neun.
e-pošta | E-Mail | Odgovoril vam bom po e-pošti. | Ich antworte Ihnen per E-Mail.
priloga | Anhang | V prilogi vam pošiljam ponudbo. | Im Anhang sende ich Ihnen das Angebot.
Spoštovani | Sehr geehrte(r) | Spoštovani gospod Novak, | Sehr geehrter Herr Novak,
Lep pozdrav | Mit freundlichen Grüßen | Hvala in lep pozdrav. | Danke und freundliche Grüße.
prosim za potrditev | ich bitte um Bestätigung | Prosim za potrditev do jutri. | Ich bitte um Bestätigung bis morgen.
uprava | Vorstand | Uprava je sprejela odločitev. | Der Vorstand hat die Entscheidung getroffen.
nadzorni svet | Aufsichtsrat | Nadzorni svet se sestane štirikrat na leto. | Der Aufsichtsrat tagt viermal im Jahr.
delnica | Aktie | Cena delnice je zrasla. | Der Aktienkurs ist gestiegen.
letno poročilo | Jahresbericht | Letno poročilo je objavljeno. | Der Jahresbericht ist veröffentlicht.
računovodstvo | Buchhaltung | Račun pošljite v računovodstvo. | Schicken Sie die Rechnung an die Buchhaltung.
kadrovska služba | Personalabteilung | Kadrovska služba išče nove sodelavce. | Die Personalabteilung sucht neue Mitarbeiter.
prodaja | Vertrieb (Verkauf) | Prodaja je letos rekordna. | Der Verkauf ist dieses Jahr auf Rekordniveau.
nabava | Einkauf | Nabava je naročila surovine. | Der Einkauf hat die Rohstoffe bestellt.
izvoz | Export | Večina prihodkov prihaja iz izvoza. | Der Großteil des Umsatzes kommt aus dem Export.
uvoz | Import | Uvoz iz Azije se je zmanjšal. | Der Import aus Asien ist zurückgegangen.
zamuda | Verspätung (Verzug) | Opravičujemo se za zamudo. | Wir entschuldigen uns für die Verspätung.
opomin | Mahnung | Dobili smo opomin. | Wir haben eine Mahnung bekommen.
reklamacija | Reklamation | Reklamacijo bomo rešili v enem tednu. | Die Reklamation lösen wir innerhalb einer Woche.
razgovor za službo | Vorstellungsgespräch | Jutri imam razgovor za službo. | Morgen habe ich ein Vorstellungsgespräch.
življenjepis | Lebenslauf | Življenjepis sem poslal včeraj. | Den Lebenslauf habe ich gestern geschickt.
izkušnje | Erfahrung | Imam pet let izkušenj. | Ich habe fünf Jahre Erfahrung.
pogoji | Bedingungen | Pogoji plačila so trideset dni. | Die Zahlungsbedingungen sind dreißig Tage.
odločitev | Entscheidung | Odločitev bomo sprejeli do konca meseca. | Wir treffen die Entscheidung bis Monatsende.
predlog | Vorschlag | Imam predlog. | Ich habe einen Vorschlag.
soglasje | Zustimmung (Einwilligung) | Potrebujemo soglasje uprave. | Wir brauchen die Zustimmung des Vorstands.
`);
const SLF_ROLLEN = [
  { id: 'lekarna', ic: '💊', titel: 'In der Apotheke', stufe: 'A2', ort: 'Lekarna, Ljubljana', z: [
    ['npc', 'Dober dan, kako vam lahko pomagam?', 'Guten Tag, wie kann ich Ihnen helfen?'],
    ['du', [['Imam glavobol. Ali imate kaj proti bolečinam?', 'Ich habe Kopfschmerzen. Haben Sie etwas gegen Schmerzen?', 1], ['Imam glavobol. Ali imate kruh?', 'Ich habe Kopfschmerzen. Haben Sie Brot?', 0, 'Brot hilft nicht gegen Kopfschmerzen 😉'], ['Glavobol je lep.', 'Kopfschmerz ist schön.', 0, 'Das passt nicht.']]],
    ['npc', 'Ali jemljete še kakšno drugo zdravilo?', 'Nehmen Sie noch ein anderes Arzneimittel?'],
    ['du', [['Ne, nobenega.', 'Nein, keines.', 1], ['Da, jemljem kavo.', 'Ja, ich nehme Kaffee.', 0, 'Kaffee ist kein Arzneimittel.'], ['Ne, hvala za kosilo.', 'Nein, danke fürs Mittagessen.', 0, 'Beantwortet die Frage nicht.']]],
    ['npc', 'Priporočam paracetamol. Vzemite eno tableto vsakih šest ur, največ štiri na dan.', 'Ich empfehle Paracetamol. Nehmen Sie alle sechs Stunden eine Tablette, höchstens vier am Tag.'],
    ['du', [['Ali ga lahko vzamem na tešče?', 'Kann ich es auf nüchternen Magen nehmen?', 1], ['Koliko je ura?', 'Wie spät ist es?', 0, 'Das ist die Frage nach der Uhrzeit.'], ['Vzamem deset tablet naenkrat.', 'Ich nehme zehn Tabletten auf einmal.', 0, 'Gefährlich – höchstens vier am Tag!']]],
    ['npc', 'Da, lahko. Želite še kaj?', 'Ja, das geht. Möchten Sie noch etwas?'],
    ['du', [['Ne, hvala. Koliko stane?', 'Nein, danke. Was kostet das?', 1], ['Da, recept za pico.', 'Ja, ein Rezept für Pizza.', 0, '„recept“ ist hier das ärztliche Rezept.'], ['Nasvidenje, paracetamol.', 'Auf Wiedersehen, Paracetamol.', 0, 'Zum Abschied ist es noch zu früh.']]],
    ['npc', 'Štiri evre petdeset, prosim.', 'Vier Euro fünfzig, bitte.'],
    ['du', [['Izvolite. Hvala in lep dan!', 'Bitte schön. Danke und einen schönen Tag!', 1], ['Imam pet let.', 'Ich bin fünf Jahre alt.', 0, 'Das ist eine Altersangabe.'], ['Ne plačam.', 'Ich zahle nicht.', 0, 'Unhöflich.']]],
  ] },
  { id: 'zdravnik', ic: '🩺', titel: 'Beim Arzt', stufe: 'A2', ort: 'Zdravstveni dom', z: [
    ['npc', 'Kaj vas boli?', 'Was tut Ihnen weh?'],
    ['du', [['Boli me grlo in imam vročino.', 'Mir tut der Hals weh und ich habe Fieber.', 1], ['Boli me avto.', 'Mir tut das Auto weh.', 0, 'Autos tun nicht weh 😉'], ['Imam se lepo.', 'Ich habe es schön.', 0, 'Dann wären Sie nicht beim Arzt.']]],
    ['npc', 'Odkdaj imate vročino?', 'Seit wann haben Sie Fieber?'],
    ['du', [['Od včeraj zvečer.', 'Seit gestern Abend.', 1], ['Ob osmih.', 'Um acht.', 0, '„Odkdaj“ fragt, seit wann.'], ['Vročina je rdeča.', 'Das Fieber ist rot.', 0, 'Passt nicht.']]],
    ['npc', 'Ali ste alergični na kakšno zdravilo?', 'Sind Sie gegen ein Arzneimittel allergisch?'],
    ['du', [['Da, na penicilin.', 'Ja, gegen Penicillin.', 1], ['Da, na ponedeljek.', 'Ja, gegen Montag.', 0, 'Witzig – aber keine Allergie.'], ['Ne vem, kje sem.', 'Ich weiß nicht, wo ich bin.', 0, 'Beantwortet die Frage nicht.']]],
    ['npc', 'Predpisal vam bom antibiotik brez penicilina. Jemljite ga sedem dni.', 'Ich verschreibe Ihnen ein Antibiotikum ohne Penicillin. Nehmen Sie es sieben Tage lang.'],
    ['du', [['Ali ga moram jemati po jedi?', 'Muss ich es nach dem Essen nehmen?', 1], ['En dan je dovolj.', 'Ein Tag reicht.', 0, 'Antibiotika immer bis zum Ende nehmen!'], ['Kje je moj recept za torto?', 'Wo ist mein Tortenrezept?', 0, 'Falsches Rezept 😄']]],
    ['npc', 'Da, po jedi. Če ne bo bolje, se vrnite čez tri dni.', 'Ja, nach dem Essen. Wenn es nicht besser wird, kommen Sie in drei Tagen wieder.'],
    ['du', [['Razumem. Hvala, gospa doktorica.', 'Verstanden. Danke, Frau Doktor.', 1], ['Dober tek!', 'Guten Appetit!', 0, 'Passt nicht zum Abschied.'], ['Čez tri leta.', 'In drei Jahren.', 0, 'Drei Tage, nicht Jahre.']]],
  ] },
  { id: 'sestanek', ic: '📅', titel: 'Meeting vereinbaren', stufe: 'B1', ort: 'Telefon · Kundin', z: [
    ['npc', 'Pozdravljeni, Ana Kovač iz podjetja Lipa. Kdaj vam ustreza sestanek?', 'Hallo, Ana Kovač von der Firma Lipa. Wann passt Ihnen ein Meeting?'],
    ['du', [['Ustreza mi v sredo ob desetih.', 'Mittwoch um zehn passt mir.', 1], ['Sestanek je moja mama.', 'Das Meeting ist meine Mama.', 0, 'Unsinn.'], ['Ne vem, kje je pošta.', 'Ich weiß nicht, wo die Post ist.', 0, 'Thema verfehlt.']]],
    ['npc', 'Odlično. Bomo imeli videokonferenco ali se dobimo v pisarni?', 'Super. Machen wir eine Videokonferenz oder treffen wir uns im Büro?'],
    ['du', [['Raje videokonferenco. Poslal bom povezavo.', 'Lieber eine Videokonferenz. Ich schicke den Link.', 1], ['Raje pivo.', 'Lieber ein Bier.', 0, 'Nicht im Geschäftsgespräch 😉'], ['V pisarni je hladilnik.', 'Im Büro ist ein Kühlschrank.', 0, 'Beantwortet die Frage nicht.']]],
    ['npc', 'Prosim, pošljite mi pred sestankom tudi ponudbo.', 'Bitte schicken Sie mir vor dem Meeting auch das Angebot.'],
    ['du', [['Seveda, ponudbo vam pošljem danes.', 'Natürlich, ich schicke Ihnen das Angebot heute.', 1], ['Ponudba je zelena.', 'Das Angebot ist grün.', 0, 'Passt nicht.'], ['Ne, nimam časa.', 'Nein, ich habe keine Zeit.', 0, 'Unhöflich gegenüber einer Kundin.']]],
    ['npc', 'Hvala. Se slišimo v sredo!', 'Danke. Wir hören uns am Mittwoch!'],
    ['du', [['Hvala vam. Lep pozdrav!', 'Danke Ihnen. Viele Grüße!', 1], ['Lahko noč, sestanek.', 'Gute Nacht, Meeting.', 0, 'Passt nicht.'], ['Kdo ste vi?', 'Wer sind Sie?', 0, 'Sie hat sich schon vorgestellt.']]],
  ] },
  { id: 'pogajanja', ic: '🤝', titel: 'Preisverhandlung', stufe: 'B2', ort: 'Besprechungsraum', z: [
    ['npc', 'Vaša cena je za nas previsoka.', 'Ihr Preis ist für uns zu hoch.'],
    ['du', [['Razumem. Pri večjem naročilu vam lahko ponudimo popust.', 'Verstehe. Bei einer größeren Bestellung können wir Ihnen einen Rabatt anbieten.', 1], ['Potem kupite drugje.', 'Dann kaufen Sie woanders.', 0, 'Zu schroff – die Verhandlung wäre vorbei.'], ['Cena je modra.', 'Der Preis ist blau.', 0, 'Unsinn.']]],
    ['npc', 'Kakšen popust predlagate?', 'Welchen Rabatt schlagen Sie vor?'],
    ['du', [['Pet odstotkov pri naročilu nad tisoč kosov.', 'Fünf Prozent bei einer Bestellung über tausend Stück.', 1], ['Sto odstotkov.', 'Hundert Prozent.', 0, 'Dann verschenken Sie die Ware.'], ['Ne vem, vprašajte mamo.', 'Ich weiß nicht, fragen Sie Mama.', 0, 'Unprofessionell.']]],
    ['npc', 'Kakšen je rok dobave?', 'Wie lang ist die Lieferfrist?'],
    ['du', [['Dobava je možna v treh tednih.', 'Lieferung ist in drei Wochen möglich.', 1], ['Dobava ni mogoča nikoli.', 'Lieferung ist nie möglich.', 0, 'Dann gibt es kein Geschäft.'], ['Rok je dober film.', 'Rok ist ein guter Film.', 0, 'Hier heißt rok „Frist“.']]],
    ['npc', 'Dobro. Pošljite nam pogodbo v pregled.', 'Gut. Schicken Sie uns den Vertrag zur Prüfung.'],
    ['du', [['Pogodbo vam pošljem do petka. Hvala za zaupanje.', 'Den Vertrag schicke ich Ihnen bis Freitag. Danke für das Vertrauen.', 1], ['Pogodbe ne pošiljamo.', 'Verträge verschicken wir nicht.', 0, 'So kommt kein Geschäft zustande.'], ['Na zdravje!', 'Prost!', 0, 'Anstoßen erst nach der Unterschrift 😉']]],
  ] },
  { id: 'presoja', ic: '🔬', titel: 'GMP-Audit', stufe: 'B2', ort: 'Pharma-Werk, Novo mesto', z: [
    ['npc', 'Dobro jutro. Danes bomo pregledali proizvodnjo in dokumentacijo.', 'Guten Morgen. Heute prüfen wir die Herstellung und die Dokumentation.'],
    ['du', [['Dobrodošli. Najprej vam pokažem čiste prostore.', 'Willkommen. Zuerst zeige ich Ihnen die Reinräume.', 1], ['Dobrodošli. Dokumentacija je v smeteh.', 'Willkommen. Die Dokumentation ist im Müll.', 0, 'Lieber nicht beim Audit 😅'], ['Danes ne delamo.', 'Heute arbeiten wir nicht.', 0, 'Das Audit ist angekündigt.']]],
    ['npc', 'Kako ravnate z odstopanji?', 'Wie gehen Sie mit Abweichungen um?'],
    ['du', [['Vsako odstopanje dokumentiramo in določimo korektivne ukrepe.', 'Jede Abweichung dokumentieren wir und legen Korrekturmaßnahmen fest.', 1], ['Odstopanja ignoriramo.', 'Abweichungen ignorieren wir.', 0, 'GMP verlangt Dokumentation.'], ['Odstopanje je lepo vreme.', 'Eine Abweichung ist schönes Wetter.', 0, 'Unsinn.']]],
    ['npc', 'Ali je bil proces validiran?', 'Wurde der Prozess validiert?'],
    ['du', [['Da, validacija je bila zaključena lani.', 'Ja, die Validierung wurde letztes Jahr abgeschlossen.', 1], ['Ne vem, kaj je proces.', 'Ich weiß nicht, was ein Prozess ist.', 0, 'Kein guter Eindruck.'], ['Da, validiral ga je moj pes.', 'Ja, mein Hund hat ihn validiert.', 0, '😄']]],
    ['npc', 'Pokažite mi, prosim, standardni operativni postopek za čiščenje.', 'Zeigen Sie mir bitte die Standardarbeitsanweisung für die Reinigung.'],
    ['du', [['Izvolite, to je zadnja veljavna verzija.', 'Bitte, das ist die letzte gültige Version.', 1], ['Čiščenje ni potrebno.', 'Reinigung ist nicht nötig.', 0, 'Im Reinraum unverzichtbar!'], ['Postopek je na dopustu.', 'Die Anweisung ist im Urlaub.', 0, 'Unsinn.']]],
    ['npc', 'Hvala. Ugotovitve vam bomo poslali v poročilu.', 'Danke. Die Feststellungen schicken wir Ihnen im Bericht.'],
    ['du', [['Hvala za presojo. Na ugotovitve bomo odgovorili v roku.', 'Danke für das Audit. Wir antworten fristgerecht auf die Feststellungen.', 1], ['Poročil ne beremo.', 'Berichte lesen wir nicht.', 0, 'Das wäre ein schwerer Fehler.'], ['Se vidimo na kavi.', 'Wir sehen uns beim Kaffee.', 0, 'Zu locker für ein Audit.']]],
  ] },
];
const SLF_GRAMMATIK = [
  { s: 'Jaz ___ iz Nemčije.', de: 'Ich bin aus Deutschland.', o: ['sem', 'si', 'je'], r: 0, e: 'biti: jaz sem · ti si · on/ona je.', th: 'biti (sein)' },
  { s: 'Oni ___ v službi.', de: 'Sie sind auf der Arbeit.', o: ['so', 'ste', 'smo'], r: 0, e: 'oni so · vi ste · mi smo.', th: 'biti (sein)' },
  { s: 'Midva ___ prijatelja.', de: 'Wir zwei sind Freunde.', o: ['sva', 'smo', 'sta'], r: 0, e: 'Dual: midva sva · vidva/onadva sta.', th: 'Dual' },
  { s: 'Imam dve ___.', de: 'Ich habe zwei Schwestern.', o: ['sestri', 'sestre', 'sestra'], r: 0, e: 'Dual weiblich auf -i: dve sestri.', th: 'Dual' },
  { s: 'Imam dva ___.', de: 'Ich habe zwei Brüder.', o: ['brata', 'brate', 'bratov'], r: 0, e: 'Dual männlich auf -a: dva brata.', th: 'Dual' },
  { s: 'To stane pet ___.', de: 'Das kostet fünf Euro.', o: ['evrov', 'evra', 'evri'], r: 0, e: 'Ab fünf folgt der Genitiv Plural: pet evrov.', th: 'Zahlen' },
  { s: 'Rada bi ___, prosim.', de: 'Ich hätte gern einen Kaffee, bitte.', o: ['kavo', 'kava', 'kave'], r: 0, e: 'Akkusativ weiblich: -a wird zu -o.', th: 'Akkusativ' },
  { s: 'Nimam ___.', de: 'Ich habe keine Zeit.', o: ['časa', 'čas', 'času'], r: 0, e: 'Nach Verneinung steht der Genitiv: nimam časa.', th: 'Verneinung' },
  { s: 'Tukaj ni ___.', de: 'Hier gibt es keine Apotheke.', o: ['lekarne', 'lekarna', 'lekarno'], r: 0, e: '„ni“ + Genitiv: ni lekarne.', th: 'Verneinung' },
  { s: 'Grem v ___.', de: 'Ich gehe in den Laden.', o: ['trgovino', 'trgovini', 'trgovina'], r: 0, e: 'v + Akkusativ = wohin.', th: 'Präpositionen' },
  { s: 'Sem v ___.', de: 'Ich bin im Laden.', o: ['trgovini', 'trgovino', 'trgovina'], r: 0, e: 'v + Lokativ = wo.', th: 'Präpositionen' },
  { s: 'Grem z ___.', de: 'Ich fahre mit dem Bus.', o: ['avtobusom', 'avtobus', 'avtobusu'], r: 0, e: 'z/s + Instrumental: z avtobusom.', th: 'Instrumental' },
  { s: 'Dam ___ darilo.', de: 'Ich gebe Mama ein Geschenk.', o: ['mami', 'mamo', 'mama'], r: 0, e: 'Wem? → Dativ: mami.', th: 'Dativ' },
  { s: 'To je avto mojega ___.', de: 'Das ist das Auto meines Bruders.', o: ['brata', 'brat', 'bratu'], r: 0, e: 'Wessen? → Genitiv: brata.', th: 'Genitiv' },
  { s: 'Včeraj ___ bil v Ljubljani.', de: 'Gestern war ich in Ljubljana.', o: ['sem', 'bom', 'bi'], r: 0, e: 'Vergangenheit: sem + l-Partizip (bil).', th: 'Zeiten' },
  { s: 'Jutri ___ šla v kino.', de: 'Morgen gehe ich (Frau) ins Kino.', o: ['bom', 'sem', 'bi'], r: 0, e: 'Zukunft: bom + l-Partizip (šla).', th: 'Zeiten' },
  { s: 'Avto je ___.', de: 'Das Auto ist rot.', o: ['rdeč', 'rdeča', 'rdeče'], r: 0, e: 'avto ist männlich → rdeč.', th: 'Adjektive' },
  { s: 'Jabolko je ___.', de: 'Der Apfel ist rot.', o: ['rdeče', 'rdeč', 'rdeča'], r: 0, e: 'jabolko ist sächlich → rdeče.', th: 'Adjektive' },
  { s: 'Ali ___ slovensko?', de: 'Sprechen Sie Slowenisch?', o: ['govorite', 'govorim', 'govori'], r: 0, e: 'vi (Sie) → -te: govorite.', th: 'Verben' },
  { s: 'Zdravilo jemljite ___ na dan.', de: 'Nehmen Sie das Arzneimittel zweimal täglich.', o: ['dvakrat', 'dva', 'drugič'], r: 0, e: '-krat = -mal: enkrat, dvakrat, trikrat.', th: 'Zahlen' },
  { s: 'Sestanek je ___ desetih.', de: 'Das Meeting ist um zehn.', o: ['ob', 'v', 'na'], r: 0, e: 'Uhrzeit: ob + Lokativ (ob desetih).', th: 'Präpositionen' },
  { s: 'Pridem ___ ponedeljek.', de: 'Ich komme am Montag.', o: ['v', 'ob', 'na'], r: 0, e: 'Wochentage: v ponedeljek, v torek …', th: 'Präpositionen' },
  { s: 'Pošta je ___ levi.', de: 'Die Post ist links.', o: ['na', 'v', 'ob'], r: 0, e: 'na levi / na desni = links / rechts.', th: 'Präpositionen' },
  { s: 'Prosim za ___.', de: 'Ich bitte um Bestätigung.', o: ['potrditev', 'potrditve', 'potrditvi'], r: 0, e: 'za + Akkusativ; potrditev bleibt im Akkusativ gleich.', th: 'Akkusativ' },
  { s: 'Antibiotik jemljite ___ konca.', de: 'Nehmen Sie das Antibiotikum bis zum Ende.', o: ['do', 'od', 'za'], r: 0, e: 'do + Genitiv = bis.', th: 'Präpositionen' },
  { s: 'Ne presezite priporočenega ___.', de: 'Überschreiten Sie nicht die empfohlene Dosis.', o: ['odmerka', 'odmerek', 'odmerku'], r: 0, e: 'Verneinter Satz → Genitiv: odmerka.', th: 'Verneinung' },
];
// Paket für die Lernhalle
LH.paket({
  id: 'slo', key: 'walquiz.lernhalle.slo.v1', lang: 'sl', titel: 'Slovenščina · Spielhalle', sprache: 'Slowenisch', flagge: '🇸🇮', farbe1: '#22c55e', farbe2: '#0ea5e9', verlauf: 'slo',
  zeichen: ['č', 'š', 'ž'],
  sprich: (t, langsam) => sloSprich(t, langsam), hatTon: (t) => !!t && sloHatTon(t),
  // schon gelernt: Reise-Lektionen (Wortstärke) oder Wortschatz-Karteikarten
  bekannt: (z) => (sloStore().wort[z] || 0) > 0 || !!(typeof slpStore === 'function' && slpStore().srs[z]),
  leichtDeck: 'alltag',
  grammatikOffen: (g) => typeof slpGramOffen !== 'function' || slpGramOffen(g.th),
  rollen: SLF_ROLLEN, grammatik: SLF_GRAMMATIK,
  async decks() {
    const alltag = SLO_EINHEITEN.flatMap((u) => u.W.map((w) => ({ z: w.sl, de: w.de, e: w.e })).concat(u.S.map((x) => ({ z: x.sl, de: x.de, bsp: x.sl, bspDe: x.de, alt: x.slAlt, deAlt: x.deAlt }))));
    const lex = await slpLaden().catch(() => []);
    const stufe = (n) => lex.filter((w) => w.n === n && w.de && w.sl.length > 1).sort((a, b) => a.r - b.r).map((w) => ({ z: w.sl, de: w.de, info: w.b ? 'Beleg: ' + w.b : '' }));
    return [
      { id: 'alltag', n: 'Alltag', e: '🐉', items: alltag },
      { id: 'a1', n: 'A1', e: '🌱', items: stufe(1) },
      { id: 'a2', n: 'A2', e: '🌿', items: stufe(2) },
      { id: 'b1', n: 'B1', e: '🌳', items: stufe(3) },
      { id: 'b2', n: 'B2', e: '🏔️', items: stufe(4) },
      { id: 'business', n: 'Business', e: '💼', items: SLF_BUSINESS },
      { id: 'pharma', n: 'Pharma', e: '💊', items: SLF_PHARMA },
    ];
  },
  niveaus: [
    { id: 'A1', n: 'Einstieg', decks: ['alltag', 'a1'] },
    { id: 'A2', n: 'Grundlagen', decks: ['a2'] },
    { id: 'B1', n: 'Selbstständig', decks: ['b1', 'business'] },
    { id: 'B2', n: 'Fließend im Beruf', decks: ['b2', 'pharma'] },
  ],
  // Übersetzen: Reise-Sätze mit allen erlaubten Varianten (Deck „Alltag“)
  get uebersetzung() { return SLO_EINHEITEN.flatMap((u) => u.S.map((x) => ({ de: x.de, z: x.sl, alt: x.slAlt, deAlt: x.deAlt, deck: 'alltag' }))); },
});
