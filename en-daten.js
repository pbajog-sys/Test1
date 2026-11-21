// 🇬🇧 English Pro – Inhalte für B1/B2, Business, Pharma, Phrasal Verbs, False Friends, Grammatik und Rollenspiele.
// Zeilenformat: englisch | deutsch | Beispielsatz englisch | Beispielsatz deutsch
const EN_Z = (t) => t.trim().split('\n').map((z) => z.split('|').map((x) => x.trim())).map(([z, de, bsp, bspDe]) => ({ z, de, bsp: bsp || '', bspDe: bspDe || '' }));
const EN_B1 = EN_Z(`
achieve | erreichen | She achieved her goal in just a year. | Sie hat ihr Ziel in nur einem Jahr erreicht.
advice | Rat (Ratschlag) | Can you give me some advice? | Kannst du mir einen Rat geben?
afford | sich leisten | We can't afford a new car. | Wir können uns kein neues Auto leisten.
appointment | Termin | I have a dentist appointment at three. | Ich habe um drei einen Zahnarzttermin.
appreciate | schätzen (dankbar sein) | I really appreciate your help. | Ich weiß deine Hilfe sehr zu schätzen.
argue | streiten (argumentieren) | My neighbours argue every evening. | Meine Nachbarn streiten jeden Abend.
available | verfügbar (erreichbar) | Is this room available tomorrow? | Ist dieses Zimmer morgen frei?
avoid | vermeiden | Try to avoid sugar in the evening. | Versuch, abends Zucker zu vermeiden.
borrow | (sich) ausleihen | Can I borrow your pen? | Kann ich mir deinen Stift leihen?
lend | (ver)leihen | Could you lend me ten euros? | Könntest du mir zehn Euro leihen?
career | Laufbahn (Karriere) | He started his career in a bank. | Er begann seine Laufbahn in einer Bank.
compare | vergleichen | Compare the prices before you buy. | Vergleiche die Preise, bevor du kaufst.
complain | sich beschweren | Guests complained about the noise. | Gäste beschwerten sich über den Lärm.
confident | selbstbewusst (zuversichtlich) | I'm confident that we will win. | Ich bin zuversichtlich, dass wir gewinnen.
consider | in Betracht ziehen | We are considering moving to Spain. | Wir überlegen, nach Spanien zu ziehen.
convince | überzeugen | She convinced me to stay. | Sie hat mich überzeugt zu bleiben.
decrease | abnehmen (sinken) | The number of visitors decreased. | Die Zahl der Besucher ist gesunken.
increase | steigen (erhöhen) | Prices increased by five percent. | Die Preise sind um fünf Prozent gestiegen.
deliver | liefern | The parcel will be delivered tomorrow. | Das Paket wird morgen geliefert.
depend on | abhängen von | It depends on the weather. | Es hängt vom Wetter ab.
describe | beschreiben | Can you describe the man? | Können Sie den Mann beschreiben?
develop | entwickeln | The company develops new software. | Die Firma entwickelt neue Software.
disappointed | enttäuscht | I was disappointed with the film. | Ich war von dem Film enttäuscht.
effort | Anstrengung (Mühe) | Learning a language takes effort. | Eine Sprache zu lernen, kostet Mühe.
environment | Umwelt | We must protect the environment. | Wir müssen die Umwelt schützen.
especially | besonders | I like fruit, especially apples. | Ich mag Obst, besonders Äpfel.
expect | erwarten | I didn't expect so many people. | Ich habe nicht so viele Leute erwartet.
experience | Erfahrung (Erlebnis) | Do you have any work experience? | Haben Sie Berufserfahrung?
explain | erklären | Could you explain that again? | Könnten Sie das noch einmal erklären?
familiar | vertraut (bekannt) | This song sounds familiar. | Dieses Lied kommt mir bekannt vor.
improve | verbessern | I want to improve my English. | Ich möchte mein Englisch verbessern.
include | enthalten (einschließen) | Breakfast is included in the price. | Das Frühstück ist im Preis inbegriffen.
instead | stattdessen | Let's take the train instead. | Lass uns stattdessen den Zug nehmen.
invite | einladen | They invited us to their wedding. | Sie haben uns zu ihrer Hochzeit eingeladen.
journey | Reise (Fahrt) | The journey takes three hours. | Die Fahrt dauert drei Stunden.
knowledge | Wissen | Her knowledge of history is amazing. | Ihr Geschichtswissen ist erstaunlich.
lack | Mangel | The project failed due to a lack of money. | Das Projekt scheiterte an Geldmangel.
likely | wahrscheinlich | It's likely to rain later. | Es wird später wahrscheinlich regnen.
manage | schaffen (leiten) | Did you manage to call her? | Hast du es geschafft, sie anzurufen?
mention | erwähnen | He didn't mention the problem. | Er hat das Problem nicht erwähnt.
necessary | notwendig | Is it necessary to book in advance? | Muss man im Voraus buchen?
opportunity | Gelegenheit (Chance) | This is a great opportunity for you. | Das ist eine tolle Gelegenheit für dich.
opinion | Meinung | In my opinion, the plan is too risky. | Meiner Meinung nach ist der Plan zu riskant.
patient | geduldig | Please be patient, it won't take long. | Bitte haben Sie Geduld, es dauert nicht lange.
prefer | vorziehen (lieber mögen) | I prefer tea to coffee. | Ich trinke lieber Tee als Kaffee.
prepare | vorbereiten | We need to prepare for the meeting. | Wir müssen uns auf das Meeting vorbereiten.
prevent | verhindern | Washing your hands prevents infections. | Händewaschen verhindert Infektionen.
promise | versprechen | I promise I'll be on time. | Ich verspreche, pünktlich zu sein.
provide | bereitstellen (liefern) | The hotel provides free Wi-Fi. | Das Hotel bietet kostenloses WLAN.
purpose | Zweck | What is the purpose of your visit? | Was ist der Zweck Ihres Besuchs?
recommend | empfehlen | Can you recommend a good restaurant? | Können Sie ein gutes Restaurant empfehlen?
reduce | reduzieren | We need to reduce costs. | Wir müssen die Kosten senken.
refuse | sich weigern (ablehnen) | He refused to answer. | Er weigerte sich zu antworten.
reliable | zuverlässig | She is a very reliable colleague. | Sie ist eine sehr zuverlässige Kollegin.
remind | erinnern (an etwas) | Remind me to call my mum. | Erinner mich daran, meine Mutter anzurufen.
remember | sich erinnern | I can't remember his name. | Ich kann mich nicht an seinen Namen erinnern.
require | erfordern | The job requires good English. | Die Stelle erfordert gutes Englisch.
responsible | verantwortlich | Who is responsible for this? | Wer ist dafür verantwortlich?
satisfied | zufrieden | Are you satisfied with the result? | Sind Sie mit dem Ergebnis zufrieden?
solution | Lösung | We found a solution. | Wir haben eine Lösung gefunden.
suggest | vorschlagen | I suggest we meet on Friday. | Ich schlage vor, dass wir uns am Freitag treffen.
support | unterstützen | My family always supports me. | Meine Familie unterstützt mich immer.
suppose | annehmen (vermuten) | I suppose you're right. | Ich nehme an, du hast recht.
surprised | überrascht | I was surprised by the news. | Die Nachricht hat mich überrascht.
tidy | ordentlich (aufräumen) | Keep your desk tidy. | Halte deinen Schreibtisch ordentlich.
unfortunately | leider | Unfortunately, the shop is closed. | Leider ist der Laden geschlossen.
warn | warnen | They warned us about the storm. | Sie haben uns vor dem Sturm gewarnt.
weather forecast | Wettervorhersage | The weather forecast says it will snow. | Laut Wettervorhersage wird es schneien.
worth | wert | The museum is worth a visit. | Das Museum ist einen Besuch wert.
although | obwohl | Although it was late, we went out. | Obwohl es spät war, gingen wir aus.
however | jedoch | It's cheap. However, the quality is poor. | Es ist billig. Die Qualität ist jedoch schlecht.
whereas | wohingegen | I love summer, whereas my sister prefers winter. | Ich liebe den Sommer, während meine Schwester den Winter mag.
probably | wahrscheinlich | I'll probably be late. | Ich komme wahrscheinlich zu spät.
immediately | sofort | Please call me immediately. | Bitte ruf mich sofort an.
`);
const EN_B2 = EN_Z(`
acknowledge | anerkennen (bestätigen) | He acknowledged his mistake. | Er räumte seinen Fehler ein.
adequate | angemessen (ausreichend) | The room has adequate lighting. | Der Raum ist ausreichend beleuchtet.
ambiguous | mehrdeutig | The instructions were ambiguous. | Die Anweisungen waren mehrdeutig.
anticipate | vorhersehen (erwarten) | We anticipate some delays. | Wir rechnen mit einigen Verzögerungen.
apparent | offensichtlich (scheinbar) | It became apparent that he was lying. | Es wurde offensichtlich, dass er log.
approach | Ansatz (sich nähern) | We need a new approach. | Wir brauchen einen neuen Ansatz.
assess | beurteilen (bewerten) | The damage is being assessed. | Der Schaden wird gerade begutachtet.
assume | annehmen (voraussetzen) | Don't assume everyone agrees. | Geh nicht davon aus, dass alle zustimmen.
benefit | Nutzen (profitieren) | Regular exercise has many benefits. | Regelmäßiger Sport hat viele Vorteile.
bias | Voreingenommenheit (Verzerrung) | The study shows a clear bias. | Die Studie zeigt eine deutliche Verzerrung.
challenge | Herausforderung | Climate change is a global challenge. | Der Klimawandel ist eine globale Herausforderung.
comprehensive | umfassend | We offer a comprehensive training programme. | Wir bieten ein umfassendes Schulungsprogramm.
consequence | Folge (Konsequenz) | Every decision has consequences. | Jede Entscheidung hat Folgen.
considerable | beträchtlich | It took a considerable amount of time. | Es hat beträchtlich viel Zeit gekostet.
consistent | einheitlich (beständig) | The results are consistent with earlier studies. | Die Ergebnisse stimmen mit früheren Studien überein.
contribute | beitragen | Everyone contributed to the success. | Alle haben zum Erfolg beigetragen.
controversial | umstritten | It's a controversial decision. | Es ist eine umstrittene Entscheidung.
crucial | entscheidend | Timing is crucial. | Das Timing ist entscheidend.
decline | sinken (ablehnen) | Sales declined in the third quarter. | Der Absatz ging im dritten Quartal zurück.
demanding | anspruchsvoll | It's a demanding job. | Es ist ein anspruchsvoller Job.
distinguish | unterscheiden | Can you distinguish between the two? | Kannst du die beiden unterscheiden?
emphasise | betonen | She emphasised the importance of safety. | Sie betonte die Bedeutung der Sicherheit.
enhance | verbessern (steigern) | The new design enhances usability. | Das neue Design verbessert die Bedienbarkeit.
ensure | sicherstellen | Please ensure that the door is locked. | Bitte stellen Sie sicher, dass die Tür abgeschlossen ist.
evaluate | auswerten (bewerten) | We will evaluate the results next week. | Wir werten die Ergebnisse nächste Woche aus.
evidence | Beweis (Belege) | There is no evidence for that claim. | Es gibt keine Belege für diese Behauptung.
feasible | machbar | Is the plan financially feasible? | Ist der Plan finanziell machbar?
fluctuate | schwanken | Prices fluctuate during the year. | Die Preise schwanken im Laufe des Jahres.
implement | umsetzen | The new rules will be implemented in May. | Die neuen Regeln werden im Mai umgesetzt.
imply | andeuten (bedeuten) | Are you implying that I'm wrong? | Willst du damit sagen, dass ich falschliege?
inevitable | unvermeidlich | Some changes are inevitable. | Manche Veränderungen sind unvermeidlich.
insight | Einblick (Erkenntnis) | The report gives valuable insights. | Der Bericht liefert wertvolle Erkenntnisse.
justify | rechtfertigen | Can you justify the extra cost? | Können Sie die Mehrkosten rechtfertigen?
maintain | aufrechterhalten (warten) | It's hard to maintain quality at this speed. | Es ist schwer, die Qualität bei diesem Tempo zu halten.
negotiate | verhandeln | We negotiated a better price. | Wir haben einen besseren Preis ausgehandelt.
nevertheless | dennoch | It was risky; nevertheless, we tried. | Es war riskant; trotzdem haben wir es versucht.
obvious | offensichtlich | The answer seems obvious. | Die Antwort scheint offensichtlich.
outcome | Ergebnis (Ausgang) | The outcome of the trial was positive. | Das Ergebnis der Studie war positiv.
overcome | überwinden | She overcame many difficulties. | Sie hat viele Schwierigkeiten überwunden.
persuade | überreden (überzeugen) | I persuaded him to come along. | Ich habe ihn überredet mitzukommen.
potential | Potenzial (möglich) | The market has huge potential. | Der Markt hat riesiges Potenzial.
precise | genau (präzise) | Please give me the precise figures. | Bitte nennen Sie mir die genauen Zahlen.
reluctant | widerwillig (zögerlich) | He was reluctant to sign the contract. | Er zögerte, den Vertrag zu unterschreiben.
reveal | enthüllen (zeigen) | The survey revealed some surprising facts. | Die Umfrage brachte überraschende Fakten zutage.
significant | bedeutend (signifikant) | There was a significant improvement. | Es gab eine deutliche Verbesserung.
subsequently | anschließend | The patient was subsequently discharged. | Der Patient wurde anschließend entlassen.
sufficient | ausreichend | We don't have sufficient data. | Wir haben nicht genügend Daten.
sustainable | nachhaltig | We need sustainable solutions. | Wir brauchen nachhaltige Lösungen.
thorough | gründlich | The inspection was very thorough. | Die Inspektion war sehr gründlich.
undertake | übernehmen (durchführen) | We undertook a detailed analysis. | Wir haben eine detaillierte Analyse durchgeführt.
vague | vage | His answer was rather vague. | Seine Antwort war ziemlich vage.
whereby | wodurch (wobei) | a system whereby errors are detected early | ein System, bei dem Fehler früh erkannt werden
widespread | weit verbreitet | The disease is widespread in the region. | Die Krankheit ist in der Region weit verbreitet.
take into account | berücksichtigen | We have to take the costs into account. | Wir müssen die Kosten berücksichtigen.
on the other hand | andererseits | On the other hand, it's very expensive. | Andererseits ist es sehr teuer.
as a result | infolgedessen | As a result, the meeting was cancelled. | Infolgedessen wurde das Meeting abgesagt.
in terms of | was … betrifft | In terms of price, it's the best offer. | Was den Preis angeht, ist es das beste Angebot.
`);
const EN_BUSINESS = EN_Z(`
meeting | Besprechung (Meeting) | The meeting has been moved to Thursday. | Das Meeting wurde auf Donnerstag verschoben.
deadline | Frist | The deadline is next Friday. | Die Frist endet nächsten Freitag.
agenda | Tagesordnung | Let's stick to the agenda. | Halten wir uns an die Tagesordnung.
minutes | Protokoll (einer Sitzung) | Who is taking the minutes? | Wer schreibt das Protokoll?
contract | Vertrag | The contract runs for two years. | Der Vertrag läuft zwei Jahre.
quote | Angebot (Kostenvoranschlag) | Could you send us a quote? | Könnten Sie uns ein Angebot schicken?
invoice | Rechnung | Please find the invoice attached. | Anbei finden Sie die Rechnung.
purchase order | Bestellung (Auftrag) | We need a purchase order number. | Wir brauchen eine Bestellnummer.
supplier | Lieferant | We are looking for a new supplier. | Wir suchen einen neuen Lieferanten.
customer | Kunde | The customer is always right. | Der Kunde ist König.
revenue | Umsatz (Erlöse) | Revenue grew by twelve percent. | Der Umsatz wuchs um zwölf Prozent.
profit | Gewinn | Profits were higher than expected. | Die Gewinne waren höher als erwartet.
loss | Verlust | The company made a loss last year. | Die Firma machte letztes Jahr Verlust.
budget | Budget (Etat) | We are over budget. | Wir haben das Budget überschritten.
forecast | Prognose | The sales forecast looks good. | Die Absatzprognose sieht gut aus.
growth | Wachstum | We expect strong growth in Asia. | Wir erwarten starkes Wachstum in Asien.
market share | Marktanteil | Our market share is twenty percent. | Unser Marktanteil liegt bei zwanzig Prozent.
competitor | Wettbewerber | Our main competitor lowered its prices. | Unser Hauptkonkurrent hat die Preise gesenkt.
negotiation | Verhandlung | The negotiations took three days. | Die Verhandlungen dauerten drei Tage.
discount | Rabatt | We can offer a ten percent discount. | Wir können zehn Prozent Rabatt anbieten.
terms and conditions | Geschäftsbedingungen | Please read the terms and conditions. | Bitte lesen Sie die Geschäftsbedingungen.
payment terms | Zahlungsbedingungen | Our payment terms are thirty days net. | Unsere Zahlungsbedingungen sind dreißig Tage netto.
overdue | überfällig | The payment is two weeks overdue. | Die Zahlung ist seit zwei Wochen überfällig.
reminder | Mahnung (Erinnerung) | We sent a payment reminder. | Wir haben eine Zahlungserinnerung geschickt.
stakeholder | Interessengruppe (Beteiligte) | We need to inform all stakeholders. | Wir müssen alle Beteiligten informieren.
board of directors | Vorstand | The board of directors approved the plan. | Der Vorstand hat den Plan genehmigt.
shareholder | Aktionär | Shareholders will receive a dividend. | Die Aktionäre erhalten eine Dividende.
annual report | Geschäftsbericht | The annual report is published in March. | Der Geschäftsbericht erscheint im März.
headquarters | Hauptsitz | Our headquarters are in Ljubljana. | Unser Hauptsitz ist in Ljubljana.
subsidiary | Tochtergesellschaft | We opened a subsidiary in Germany. | Wir haben eine Tochtergesellschaft in Deutschland eröffnet.
human resources | Personalabteilung | Please contact human resources. | Bitte wenden Sie sich an die Personalabteilung.
salary | Gehalt | The salary is negotiable. | Das Gehalt ist verhandelbar.
job interview | Vorstellungsgespräch | I have a job interview tomorrow. | Ich habe morgen ein Vorstellungsgespräch.
CV | Lebenslauf | Please send your CV and a cover letter. | Bitte schicken Sie Lebenslauf und Anschreiben.
cover letter | Anschreiben | Keep your cover letter short. | Halten Sie Ihr Anschreiben kurz.
colleague | Kollege (Kollegin) | My colleague will call you back. | Meine Kollegin ruft Sie zurück.
line manager | direkte(r) Vorgesetzte(r) | Ask your line manager for approval. | Frag deine Vorgesetzte nach der Freigabe.
approval | Genehmigung (Freigabe) | We are waiting for approval. | Wir warten auf die Freigabe.
to schedule | ansetzen (planen) | Let's schedule a call for Monday. | Lass uns für Montag einen Anruf ansetzen.
to postpone | verschieben | The launch has been postponed. | Die Markteinführung wurde verschoben.
to follow up | nachfassen (nachhaken) | I'll follow up with an email. | Ich hake per E-Mail nach.
to attach | anhängen (beifügen) | I've attached the slides. | Ich habe die Folien angehängt.
to reach an agreement | sich einigen | We finally reached an agreement. | Wir haben uns endlich geeinigt.
to meet a deadline | eine Frist einhalten | We will meet the deadline. | Wir halten die Frist ein.
to launch | einführen (auf den Markt bringen) | We launch the product in spring. | Wir bringen das Produkt im Frühjahr auf den Markt.
to outsource | auslagern | They outsourced their IT. | Sie haben ihre IT ausgelagert.
to hire | einstellen | We are hiring two engineers. | Wir stellen zwei Ingenieure ein.
to resign | kündigen (zurücktreten) | She resigned last month. | Sie hat letzten Monat gekündigt.
to delegate | delegieren | Learn to delegate tasks. | Lern, Aufgaben abzugeben.
key performance indicator | Kennzahl (KPI) | Customer satisfaction is a key KPI. | Kundenzufriedenheit ist eine zentrale Kennzahl.
return on investment | Kapitalrendite (ROI) | The return on investment is excellent. | Die Rendite ist hervorragend.
cash flow | Geldfluss (Cashflow) | Cash flow is tight this month. | Der Cashflow ist diesen Monat knapp.
supply chain | Lieferkette | The supply chain was disrupted. | Die Lieferkette war gestört.
Dear Ms Smith, | Sehr geehrte Frau Smith, | Dear Ms Smith, thank you for your email. | Sehr geehrte Frau Smith, danke für Ihre E-Mail.
Kind regards | Mit freundlichen Grüßen | Kind regards, Anna | Mit freundlichen Grüßen, Anna
I look forward to hearing from you. | Ich freue mich auf Ihre Antwort. | I look forward to hearing from you. | Ich freue mich auf Ihre Antwort.
Please find attached … | Anbei finden Sie … | Please find attached the updated offer. | Anbei finden Sie das aktualisierte Angebot.
Could you please confirm …? | Könnten Sie bitte … bestätigen? | Could you please confirm the date? | Könnten Sie bitte das Datum bestätigen?
I'm afraid … | Leider … (höflich) | I'm afraid we can't accept this offer. | Leider können wir dieses Angebot nicht annehmen.
`);
const EN_PHARMA = EN_Z(`
drug product | Fertigarzneimittel | The drug product is a film-coated tablet. | Das Fertigarzneimittel ist eine Filmtablette.
active substance | Wirkstoff | The active substance is ibuprofen. | Der Wirkstoff ist Ibuprofen.
excipient | Hilfsstoff | Lactose is a common excipient. | Laktose ist ein häufiger Hilfsstoff.
dosage | Dosierung | The usual dosage is one tablet daily. | Die übliche Dosierung ist eine Tablette täglich.
dose | Dosis | Do not exceed the recommended dose. | Überschreiten Sie nicht die empfohlene Dosis.
side effect | Nebenwirkung | Nausea is a common side effect. | Übelkeit ist eine häufige Nebenwirkung.
adverse event | unerwünschtes Ereignis | All adverse events must be reported. | Alle unerwünschten Ereignisse müssen gemeldet werden.
adverse drug reaction | Nebenwirkung (ADR) | The adverse drug reaction was serious. | Die Nebenwirkung war schwerwiegend.
contraindication | Gegenanzeige | Pregnancy is a contraindication. | Schwangerschaft ist eine Gegenanzeige.
indication | Anwendungsgebiet | The indication is high blood pressure. | Das Anwendungsgebiet ist Bluthochdruck.
interaction | Wechselwirkung | There is an interaction with alcohol. | Es gibt eine Wechselwirkung mit Alkohol.
overdose | Überdosis | In case of overdose, call a doctor. | Bei Überdosierung rufen Sie einen Arzt.
prescription | Rezept (Verschreibung) | This medicine is only available on prescription. | Dieses Medikament ist verschreibungspflichtig.
over-the-counter | rezeptfrei | Paracetamol is available over the counter. | Paracetamol ist rezeptfrei erhältlich.
package leaflet | Packungsbeilage | Read the package leaflet carefully. | Lesen Sie die Packungsbeilage sorgfältig.
expiry date | Verfallsdatum | Check the expiry date. | Prüfen Sie das Verfallsdatum.
batch | Charge | This batch was released yesterday. | Diese Charge wurde gestern freigegeben.
batch record | Chargenprotokoll | The batch record is incomplete. | Das Chargenprotokoll ist unvollständig.
shelf life | Haltbarkeit | The shelf life is 36 months. | Die Haltbarkeit beträgt 36 Monate.
storage conditions | Lagerbedingungen | Storage conditions: below 25 °C. | Lagerbedingungen: unter 25 °C.
clinical trial | klinische Studie | The clinical trial enrolled 500 patients. | In die klinische Studie wurden 500 Patienten aufgenommen.
informed consent | Einwilligungserklärung | Every patient signed informed consent. | Jeder Patient unterschrieb eine Einwilligungserklärung.
placebo-controlled | placebokontrolliert | a randomised, placebo-controlled trial | eine randomisierte, placebokontrollierte Studie
double-blind | doppelblind | The study was double-blind. | Die Studie war doppelblind.
endpoint | Endpunkt | The primary endpoint was met. | Der primäre Endpunkt wurde erreicht.
efficacy | Wirksamkeit | The study confirmed the efficacy of the drug. | Die Studie bestätigte die Wirksamkeit des Medikaments.
safety profile | Sicherheitsprofil | The safety profile is favourable. | Das Sicherheitsprofil ist günstig.
pharmacovigilance | Pharmakovigilanz | Pharmacovigilance monitors drug safety. | Die Pharmakovigilanz überwacht die Arzneimittelsicherheit.
marketing authorisation | Zulassung | We submitted the marketing authorisation application. | Wir haben den Zulassungsantrag eingereicht.
regulatory affairs | Zulassungsabteilung (Regulatory Affairs) | Regulatory affairs prepares the dossier. | Regulatory Affairs erstellt das Dossier.
submission | Einreichung | The submission is planned for June. | Die Einreichung ist für Juni geplant.
competent authority | zuständige Behörde | The competent authority requested more data. | Die zuständige Behörde forderte weitere Daten an.
good manufacturing practice | Gute Herstellungspraxis (GMP) | All sites must follow good manufacturing practice. | Alle Standorte müssen GMP einhalten.
quality assurance | Qualitätssicherung | Quality assurance released the batch. | Die Qualitätssicherung hat die Charge freigegeben.
quality control | Qualitätskontrolle | Quality control tested the samples. | Die Qualitätskontrolle hat die Proben geprüft.
qualified person | sachkundige Person (QP) | The qualified person certifies each batch. | Die sachkundige Person zertifiziert jede Charge.
deviation | Abweichung | The deviation was documented immediately. | Die Abweichung wurde sofort dokumentiert.
root cause | Grundursache | We are still investigating the root cause. | Wir untersuchen die Grundursache noch.
corrective and preventive action | Korrektur- und Vorbeugemaßnahme (CAPA) | The CAPA was closed on time. | Die CAPA wurde fristgerecht abgeschlossen.
standard operating procedure | Standardarbeitsanweisung (SOP) | Follow the standard operating procedure. | Befolgen Sie die Standardarbeitsanweisung.
audit | Audit | The supplier audit went well. | Das Lieferantenaudit verlief gut.
inspection | Inspektion | The inspection found no critical issues. | Die Inspektion ergab keine kritischen Mängel.
finding | Feststellung (Befund) | There were two minor findings. | Es gab zwei geringfügige Feststellungen.
validation | Validierung | Process validation is complete. | Die Prozessvalidierung ist abgeschlossen.
cleanroom | Reinraum | Gowning is required in the cleanroom. | Im Reinraum ist Umkleiden Pflicht.
sterile | steril | The solution must be sterile. | Die Lösung muss steril sein.
contamination | Kontamination (Verunreinigung) | We must prevent cross-contamination. | Wir müssen Kreuzkontamination verhindern.
specification | Spezifikation | The result is within specification. | Das Ergebnis liegt innerhalb der Spezifikation.
out of specification | außerhalb der Spezifikation (OOS) | An out-of-specification result needs an investigation. | Ein OOS-Ergebnis erfordert eine Untersuchung.
stability study | Stabilitätsstudie | The stability study runs for three years. | Die Stabilitätsstudie läuft drei Jahre.
raw material | Rohstoff | Raw materials are tested on receipt. | Rohstoffe werden bei Eingang geprüft.
active pharmaceutical ingredient | Wirkstoff (API) | The API is sourced from India. | Der Wirkstoff wird aus Indien bezogen.
generic | Generikum | Generics are cheaper than originals. | Generika sind günstiger als Originalpräparate.
biosimilar | Biosimilar | The biosimilar was approved in Europe. | Das Biosimilar wurde in Europa zugelassen.
bioavailability | Bioverfügbarkeit | Food reduces the bioavailability. | Nahrung verringert die Bioverfügbarkeit.
tablet | Tablette | Swallow the tablet whole. | Schlucken Sie die Tablette ganz.
capsule | Kapsel | Take one capsule twice a day. | Nehmen Sie zweimal täglich eine Kapsel.
injection | Injektion | The vaccine is given by injection. | Der Impfstoff wird gespritzt.
vaccine | Impfstoff | The vaccine must be kept refrigerated. | Der Impfstoff muss gekühlt werden.
on an empty stomach | auf nüchternen Magen | Take it on an empty stomach. | Nehmen Sie es auf nüchternen Magen.
`);
const EN_PHRASAL = EN_Z(`
carry out | durchführen | We carried out a survey. | Wir haben eine Umfrage durchgeführt.
find out | herausfinden | Let me find out the price. | Ich finde den Preis heraus.
look forward to | sich freuen auf | I look forward to meeting you. | Ich freue mich darauf, Sie kennenzulernen.
put off | aufschieben | Don't put it off until tomorrow. | Schieb es nicht auf morgen.
call off | absagen | They called off the meeting. | Sie haben das Meeting abgesagt.
set up | einrichten (gründen) | She set up her own company. | Sie hat ihre eigene Firma gegründet.
take over | übernehmen | Who will take over the project? | Wer übernimmt das Projekt?
run out of | ausgehen (etwas) | We've run out of paper. | Uns ist das Papier ausgegangen.
deal with | sich kümmern um | I'll deal with the complaint. | Ich kümmere mich um die Beschwerde.
come up with | sich ausdenken | She came up with a great idea. | Sie hatte eine tolle Idee.
get on with | auskommen mit | I get on well with my boss. | Ich komme gut mit meinem Chef aus.
give up | aufgeben | Never give up. | Gib niemals auf.
look into | untersuchen (prüfen) | We'll look into the problem. | Wir sehen uns das Problem an.
point out | hinweisen auf | He pointed out a mistake. | Er wies auf einen Fehler hin.
turn down | ablehnen | They turned down our offer. | Sie haben unser Angebot abgelehnt.
bring up | ansprechen (ein Thema) | Don't bring up politics. | Sprich nicht über Politik.
figure out | herausfinden (verstehen) | I can't figure out this form. | Ich verstehe dieses Formular nicht.
fill in | ausfüllen | Please fill in this form. | Bitte füllen Sie dieses Formular aus.
hand in | abgeben (einreichen) | Hand in your report by Friday. | Gib deinen Bericht bis Freitag ab.
keep up with | mithalten mit | It's hard to keep up with the news. | Es ist schwer, mit den Nachrichten Schritt zu halten.
make up for | wiedergutmachen | I'll make up for the delay. | Ich mache die Verspätung wieder gut.
sort out | klären (regeln) | We need to sort out this issue. | Wir müssen dieses Problem klären.
work out | klappen (ausrechnen) | Everything worked out fine. | Alles hat gut geklappt.
back up | sichern (unterstützen) | Always back up your files. | Sichere immer deine Dateien.
break down | eine Panne haben (aufschlüsseln) | Can you break down the costs? | Kannst du die Kosten aufschlüsseln?
catch up | aufholen (nachholen) | Let's catch up next week. | Lass uns nächste Woche reden (uns updaten).
cut down on | einschränken | I'm cutting down on sugar. | Ich reduziere Zucker.
drop by | vorbeischauen | Drop by any time. | Schau jederzeit vorbei.
go through | durchgehen (durchmachen) | Let's go through the contract. | Gehen wir den Vertrag durch.
look up | nachschlagen | Look it up in the dictionary. | Schlag es im Wörterbuch nach.
pick up | abholen (aufschnappen) | I'll pick you up at eight. | Ich hole dich um acht ab.
take on | übernehmen (einstellen) | We're taking on new staff. | Wir stellen neue Leute ein.
`);
const EN_FALSCH = EN_Z(`
actually | eigentlich (tatsächlich) – nicht „aktuell“ | Actually, I'm from Graz. | Eigentlich komme ich aus Graz.
current | aktuell | the current situation | die aktuelle Lage
become | werden – nicht „bekommen“ | She wants to become a doctor. | Sie will Ärztin werden.
get | bekommen | I got an email from HR. | Ich habe eine E-Mail von der Personalabteilung bekommen.
chef | Koch – nicht „Chef“ | The chef recommends the fish. | Der Koch empfiehlt den Fisch.
boss | Chef (Vorgesetzter) | My boss is on holiday. | Mein Chef ist im Urlaub.
eventually | schließlich – nicht „eventuell“ | Eventually, we found the hotel. | Schließlich fanden wir das Hotel.
possibly | eventuell (möglicherweise) | I will possibly come later. | Ich komme eventuell später.
gift | Geschenk – nicht „Gift“ | Thank you for the gift! | Danke für das Geschenk!
poison | Gift | This mushroom contains poison. | Dieser Pilz enthält Gift.
handy | praktisch – nicht „Handy“ | This tool is very handy. | Dieses Werkzeug ist sehr praktisch.
mobile phone | Handy | My mobile phone is broken. | Mein Handy ist kaputt.
sensible | vernünftig – nicht „sensibel“ | That's a sensible decision. | Das ist eine vernünftige Entscheidung.
sensitive | sensibel (empfindlich) | These are sensitive data. | Das sind sensible Daten.
brave | mutig – nicht „brav“ | The firefighter was very brave. | Der Feuerwehrmann war sehr mutig.
well-behaved | brav | The children were well-behaved. | Die Kinder waren brav.
also | auch – nicht „also“ | I also speak French. | Ich spreche auch Französisch.
so | also | So, let's begin. | Also, fangen wir an.
undertaker | Bestatter – nicht „Unternehmer“ | The undertaker organised the funeral. | Der Bestatter organisierte die Beerdigung.
entrepreneur | Unternehmer | She is a successful entrepreneur. | Sie ist eine erfolgreiche Unternehmerin.
control | steuern (beherrschen) – oft nicht „kontrollieren“ | Control your speed. | Behalte deine Geschwindigkeit im Griff.
check | kontrollieren (prüfen) | Please check the invoice. | Bitte prüfen Sie die Rechnung.
billion | Milliarde – nicht „Billion“ | The company is worth one billion euros. | Die Firma ist eine Milliarde Euro wert.
trillion | Billion | The debt is over one trillion dollars. | Die Schulden liegen bei über einer Billion Dollar.
public viewing | Aufbahrung – nicht „Public Viewing“ | — | —
`).filter((x) => x.bsp !== '—');
const EN_GRAMMATIK = [
  { s: 'If I ___ more time, I would learn Japanese.', o: ['had', 'have', 'would have'], r: 0, e: 'Second Conditional: if + Past Simple, would + Infinitiv.', th: 'Conditionals' },
  { s: 'If it rains tomorrow, we ___ at home.', o: ['will stay', 'would stay', 'stayed'], r: 0, e: 'First Conditional: if + Present, will + Infinitiv.', th: 'Conditionals' },
  { s: 'If you ___ me, I would have helped you.', o: ['had told', 'told', 'would tell'], r: 0, e: 'Third Conditional: if + Past Perfect, would have + Partizip.', th: 'Conditionals' },
  { s: 'If you heat ice, it ___.', o: ['melts', 'will melt', 'would melt'], r: 0, e: 'Zero Conditional (allgemeingültig): if + Present, Present.', th: 'Conditionals' },
  { s: 'I ___ in Munich since 2019.', o: ['have lived', 'live', 'am living'], r: 0, e: 'since/for + Zeitraum bis jetzt → Present Perfect (nicht Present!).', th: 'Tenses' },
  { s: 'She ___ to London last year.', o: ['moved', 'has moved', 'moves'], r: 0, e: 'Abgeschlossener Zeitpunkt (last year) → Past Simple.', th: 'Tenses' },
  { s: 'Look! It ___.', o: ['is raining', 'rains', 'rained'], r: 0, e: 'Gerade jetzt → Present Continuous.', th: 'Tenses' },
  { s: 'By the time we arrived, the film ___.', o: ['had started', 'started', 'has started'], r: 0, e: 'Vorvergangenheit → Past Perfect.', th: 'Tenses' },
  { s: 'I ___ for two hours when she finally called.', o: ['had been waiting', 'was waiting', 'have waited'], r: 0, e: 'Dauer bis zu einem Punkt in der Vergangenheit → Past Perfect Continuous.', th: 'Tenses' },
  { s: 'This time next week, I ___ on a beach.', o: ['will be lying', 'will lie', 'lie'], r: 0, e: 'Handlung, die zu einem Zeitpunkt in der Zukunft gerade läuft → Future Continuous.', th: 'Tenses' },
  { s: 'The report ___ by the end of the day.', o: ['will be finished', 'will finish', 'finishes'], r: 0, e: 'Passiv Futur: will be + Partizip.', th: 'Passive' },
  { s: 'The new plant ___ in 2021.', o: ['was opened', 'opened', 'has been opened'], r: 0, e: 'Passiv mit Zeitangabe → Past Simple Passive.', th: 'Passive' },
  { s: 'All deviations must ___ immediately.', o: ['be reported', 'report', 'reported'], r: 0, e: 'Modalverb + be + Partizip.', th: 'Passive' },
  { s: 'The samples are ___ tested at the moment.', o: ['being', 'been', 'be'], r: 0, e: 'Present Continuous Passive: am/is/are being + Partizip.', th: 'Passive' },
  { s: 'She said that she ___ tired.', o: ['was', 'is being', 'will'], r: 0, e: 'Reported Speech: Zeit rückt eine Stufe zurück (is → was).', th: 'Reported speech' },
  { s: 'He asked me where I ___.', o: ['worked', 'did work', 'do I work'], r: 0, e: 'Indirekte Frage: Aussagesatz-Wortstellung, kein „do“.', th: 'Reported speech' },
  { s: 'Could you tell me where the station ___?', o: ['is', 'is it', 'does'], r: 0, e: 'Indirekte Frage: „where the station is“ – Verb ans Ende.', th: 'Reported speech' },
  { s: 'I\'m not used to ___ up so early.', o: ['getting', 'get', 'got'], r: 0, e: 'be used to + -ing = an etwas gewöhnt sein.', th: 'Gerund / Infinitive' },
  { s: 'We decided ___ the offer.', o: ['to accept', 'accepting', 'accept'], r: 0, e: 'decide + to-Infinitiv.', th: 'Gerund / Infinitive' },
  { s: 'I\'m looking forward to ___ you.', o: ['seeing', 'see', 'have seen'], r: 0, e: 'look forward to + -ing (to ist hier Präposition!).', th: 'Gerund / Infinitive' },
  { s: 'Would you mind ___ the window?', o: ['opening', 'to open', 'open'], r: 0, e: 'mind + -ing.', th: 'Gerund / Infinitive' },
  { s: 'He stopped ___ ten years ago.', o: ['smoking', 'to smoke', 'smoke'], r: 0, e: 'stop + -ing = aufhören mit; stop + to = anhalten, um zu …', th: 'Gerund / Infinitive' },
  { s: 'You ___ wear a mask in the cleanroom. It\'s mandatory.', o: ['must', 'might', 'needn\'t'], r: 0, e: 'Pflicht → must / have to.', th: 'Modals' },
  { s: 'You ___ come if you don\'t want to.', o: ['don\'t have to', 'mustn\'t', 'can\'t'], r: 0, e: 'don\'t have to = muss nicht; mustn\'t = darf nicht!', th: 'Modals' },
  { s: 'She ___ be at home – her car is outside.', o: ['must', 'can\'t', 'should'], r: 0, e: 'Logische Schlussfolgerung: must = muss wohl.', th: 'Modals' },
  { s: 'You ___ have told me earlier!', o: ['should', 'must', 'can'], r: 0, e: 'Kritik an Vergangenem: should have + Partizip.', th: 'Modals' },
  { s: 'This is the colleague ___ helped me.', o: ['who', 'which', 'whose'], r: 0, e: 'Personen → who (oder that).', th: 'Relative clauses' },
  { s: 'The company, ___ headquarters are in Paris, is growing.', o: ['whose', 'which', 'who'], r: 0, e: 'Besitz → whose.', th: 'Relative clauses' },
  { s: 'The report ___ you sent was very useful.', o: ['that', 'who', 'what'], r: 0, e: 'Sachen → that/which (hier auch weglassbar).', th: 'Relative clauses' },
  { s: 'I have lived here ___ ten years.', o: ['for', 'since', 'during'], r: 0, e: 'for + Zeitdauer; since + Zeitpunkt.', th: 'Prepositions' },
  { s: 'The meeting is ___ Monday ___ 10 a.m.', o: ['on … at', 'at … on', 'in … at'], r: 0, e: 'on + Tag, at + Uhrzeit, in + Monat/Jahr.', th: 'Prepositions' },
  { s: 'She is responsible ___ quality control.', o: ['for', 'of', 'about'], r: 0, e: 'responsible for.', th: 'Prepositions' },
  { s: 'It depends ___ the results.', o: ['on', 'of', 'from'], r: 0, e: 'depend on (nicht „of“!).', th: 'Prepositions' },
  { s: 'I\'m interested ___ the position.', o: ['in', 'for', 'on'], r: 0, e: 'interested in.', th: 'Prepositions' },
  { s: 'Can you give me ___ information?', o: ['some', 'an', 'a few'], r: 0, e: 'information ist unzählbar: some information, nie „an information“.', th: 'Quantifiers' },
  { s: 'We don\'t have ___ time left.', o: ['much', 'many', 'a few'], r: 0, e: 'Unzählbar + Verneinung → much.', th: 'Quantifiers' },
  { s: 'There were ___ people at the meeting.', o: ['fewer', 'less', 'little'], r: 0, e: 'Zählbar → fewer (less für Unzählbares).', th: 'Quantifiers' },
  { s: 'She is ___ person I know.', o: ['the most reliable', 'the more reliable', 'most reliable'], r: 0, e: 'Superlativ mit „the“: the most + Adjektiv.', th: 'Comparison' },
  { s: 'The new version is much ___ than the old one.', o: ['faster', 'more fast', 'fastest'], r: 0, e: 'Kurze Adjektive: -er + than.', th: 'Comparison' },
  { s: 'He speaks English very ___.', o: ['well', 'good', 'goodly'], r: 0, e: 'Adverb von good ist well.', th: 'Adjective / Adverb' },
  { s: 'I wish I ___ more time.', o: ['had', 'have', 'would have'], r: 0, e: 'Wunsch Gegenwart: wish + Past Simple.', th: 'Wishes' },
  { s: 'I wish I ___ that email.', o: ['hadn\'t sent', 'didn\'t send', 'wouldn\'t send'], r: 0, e: 'Bedauern Vergangenheit: wish + Past Perfect.', th: 'Wishes' },
  { s: 'Not only ___ late, but he also forgot the documents.', o: ['was he', 'he was', 'he is'], r: 0, e: 'Inversion nach „Not only“: Hilfsverb vor Subjekt.', th: 'Inversion (B2)' },
  { s: 'Hardly ___ arrived when the meeting started.', o: ['had we', 'we had', 'we have'], r: 0, e: 'Inversion nach „Hardly … when“.', th: 'Inversion (B2)' },
  { s: 'The patient ___ to hospital yesterday.', o: ['was admitted', 'admitted', 'has admitted'], r: 0, e: 'Passiv: be admitted to hospital = ins Krankenhaus aufgenommen werden.', th: 'Passive' },
  { s: 'I ___ the documents yet.', o: ['haven\'t received', 'didn\'t receive', 'don\'t receive'], r: 0, e: 'yet (bis jetzt) → Present Perfect.', th: 'Tenses' },
  { s: 'Let\'s meet ___ the end of the week.', o: ['at', 'in', 'on'], r: 0, e: 'at the end of …', th: 'Prepositions' },
  { s: 'She made me ___ the report again.', o: ['write', 'to write', 'writing'], r: 0, e: 'make sb do sth – Infinitiv ohne to.', th: 'Gerund / Infinitive' },
];
const EN_ROLLEN = [
  { id: 'interview', ic: '💼', titel: 'Job interview', stufe: 'B1', ort: 'HR office, London', z: [
    ['npc', 'Thanks for coming in. Could you tell me a bit about yourself?', 'Danke, dass Sie gekommen sind. Erzählen Sie etwas über sich?'],
    ['du', [['Of course. I\'ve worked in quality assurance for five years.', 'Gern. Ich arbeite seit fünf Jahren in der Qualitätssicherung.', 1], ['Of course. I work in quality assurance since five years.', 'Gern. (Fehler: „since five years“)', 0, 'Seit fünf Jahren = for five years + Present Perfect: „I\'ve worked … for five years“.'], ['No, that\'s private.', 'Nein, das ist privat.', 0, 'Im Vorstellungsgespräch eher ungeschickt.']]],
    ['npc', 'Why are you interested in this position?', 'Warum interessieren Sie sich für diese Stelle?'],
    ['du', [['I\'d like to take on more responsibility and work internationally.', 'Ich möchte mehr Verantwortung übernehmen und international arbeiten.', 1], ['Because the salary is high, that\'s all.', 'Weil das Gehalt hoch ist, das ist alles.', 0, 'Zu direkt – nenne fachliche Gründe.'], ['I am interested on it.', 'Ich interessiere mich dafür. (Fehler)', 0, 'interested in, nicht „on“.']]],
    ['npc', 'What would you say is your biggest weakness?', 'Was ist Ihre größte Schwäche?'],
    ['du', [['I sometimes find it hard to delegate, but I\'m working on it.', 'Mir fällt es manchmal schwer abzugeben, aber ich arbeite daran.', 1], ['I don\'t have any weaknesses.', 'Ich habe keine Schwächen.', 0, 'Wirkt unglaubwürdig.'], ['My weakness is my boss.', 'Meine Schwäche ist mein Chef.', 0, 'Bitte nicht über den alten Chef lästern 😉']]],
    ['npc', 'Do you have any questions for us?', 'Haben Sie Fragen an uns?'],
    ['du', [['Yes – what would my first three months look like?', 'Ja – wie würden meine ersten drei Monate aussehen?', 1], ['No.', 'Nein.', 0, 'Eine gute Frage zeigt Interesse.'], ['When can I go on holiday?', 'Wann kann ich in Urlaub?', 0, 'Nicht als erste Frage.']]],
    ['npc', 'Great. We\'ll get back to you by Friday.', 'Prima. Wir melden uns bis Freitag.'],
    ['du', [['Thank you for your time. I look forward to hearing from you.', 'Danke für Ihre Zeit. Ich freue mich auf Ihre Rückmeldung.', 1], ['I look forward to hear from you.', '(Fehler: to hear)', 0, 'look forward to + -ing: „to hearing“.'], ['Bye, see you Friday!', 'Tschüss, bis Freitag!', 0, 'Zu locker.']]],
  ] },
  { id: 'call', ic: '📞', titel: 'Business call', stufe: 'B1', ort: 'Phone · supplier', z: [
    ['npc', 'Good morning, Brightline Supplies, Tom speaking.', 'Guten Morgen, Brightline Supplies, Tom am Apparat.'],
    ['du', [['Good morning, Tom. This is Anna from Vita Pharma. I\'m calling about our order.', 'Guten Morgen, Tom. Hier ist Anna von Vita Pharma. Ich rufe wegen unserer Bestellung an.', 1], ['Hello, here speaks Anna.', 'Hallo, hier spricht Anna. (Germanismus)', 0, 'Am Telefon: „This is Anna“ oder „Anna speaking“.'], ['Who are you?', 'Wer sind Sie?', 0, 'Er hat sich schon vorgestellt.']]],
    ['npc', 'Sure. Do you have the order number?', 'Klar. Haben Sie die Bestellnummer?'],
    ['du', [['Yes, it\'s PO 4471. The delivery is a week overdue.', 'Ja, Bestellung 4471. Die Lieferung ist eine Woche überfällig.', 1], ['Yes, I have it. Bye.', 'Ja, habe ich. Tschüss.', 0, 'Du musst sie auch nennen 😉'], ['The number is red.', 'Die Nummer ist rot.', 0, 'Unsinn.']]],
    ['npc', 'I\'m sorry about that. There was a problem in our warehouse.', 'Das tut mir leid. Es gab ein Problem in unserem Lager.'],
    ['du', [['I understand. When can you deliver?', 'Verstehe. Wann können Sie liefern?', 1], ['That\'s not my problem!', 'Das ist nicht mein Problem!', 0, 'Zu aggressiv – bleib lösungsorientiert.'], ['When did you deliver?', 'Wann haben Sie geliefert?', 0, 'Es wurde noch nicht geliefert.']]],
    ['npc', 'We can ship it on Wednesday.', 'Wir können am Mittwoch versenden.'],
    ['du', [['Could you please confirm that by email?', 'Könnten Sie das bitte per E-Mail bestätigen?', 1], ['Can you confirm me that?', '(Fehler)', 0, 'confirm etwas, nicht „confirm me“.'], ['Wednesday is a nice day.', 'Mittwoch ist ein schöner Tag.', 0, 'Smalltalk passt hier nicht.']]],
    ['npc', 'Of course. Anything else I can help you with?', 'Natürlich. Kann ich sonst noch helfen?'],
    ['du', [['No, that\'s all. Thanks for your help, Tom.', 'Nein, das ist alles. Danke für Ihre Hilfe, Tom.', 1], ['No. Bye.', 'Nein. Tschüss.', 0, 'Etwas kurz angebunden.'], ['Yes, a pizza please.', 'Ja, eine Pizza bitte.', 0, '😄']]],
  ] },
  { id: 'pharmacy', ic: '💊', titel: 'At the pharmacy', stufe: 'B1', ort: 'Pharmacy, Manchester', z: [
    ['npc', 'Hello, how can I help?', 'Hallo, wie kann ich helfen?'],
    ['du', [['Hi, I\'ve got a sore throat and a slight fever.', 'Hallo, ich habe Halsschmerzen und leichtes Fieber.', 1], ['Hi, I have a sore neck.', 'Hallo, ich habe einen wunden Nacken.', 0, 'Hals (innen) = throat; neck = Hals außen/Nacken.'], ['I want drugs.', 'Ich will Drogen.', 0, 'Klingt nach Drogen – besser „medicine“.']]],
    ['npc', 'Are you taking any other medication?', 'Nehmen Sie andere Medikamente?'],
    ['du', [['No, I\'m not.', 'Nein.', 1], ['No, I don\'t take.', '(unvollständig)', 0, 'Kurzantwort: „No, I\'m not.“ oder „No, I don\'t.“'], ['Yes, coffee.', 'Ja, Kaffee.', 0, 'Kaffee ist kein Medikament.']]],
    ['npc', 'These lozenges should help. Take one every three hours, no more than eight a day.', 'Diese Lutschtabletten sollten helfen. Alle drei Stunden eine, höchstens acht am Tag.'],
    ['du', [['Can I take them on an empty stomach?', 'Kann ich sie auf nüchternen Magen nehmen?', 1], ['Can I take twenty at once?', 'Kann ich zwanzig auf einmal nehmen?', 0, 'Höchstens acht am Tag!'], ['How old are you?', 'Wie alt sind Sie?', 0, 'Unpassend.']]],
    ['npc', 'Yes, that\'s fine. If it\'s not better in three days, see a doctor.', 'Ja, das geht. Wenn es in drei Tagen nicht besser ist, gehen Sie zum Arzt.'],
    ['du', [['Will do. How much is it?', 'Mach ich. Was kostet das?', 1], ['I will become better.', '(false friend!)', 0, 'become = werden; „I\'ll get better“.'], ['Three years?', 'Drei Jahre?', 0, 'Drei Tage.']]],
  ] },
  { id: 'audit', ic: '🔬', titel: 'GMP inspection', stufe: 'B2', ort: 'Manufacturing site', z: [
    ['npc', 'Good morning. Today we\'ll review your deviation management.', 'Guten Morgen. Heute prüfen wir Ihr Abweichungsmanagement.'],
    ['du', [['Welcome. Our QA lead will walk you through the process.', 'Willkommen. Unsere QA-Leitung erklärt Ihnen den Prozess.', 1], ['We don\'t have deviations.', 'Wir haben keine Abweichungen.', 0, 'Unglaubwürdig – jede Firma hat welche.'], ['Can we do this next year?', 'Können wir das nächstes Jahr machen?', 0, 'Die Inspektion ist angekündigt.']]],
    ['npc', 'How do you determine the root cause of a deviation?', 'Wie ermitteln Sie die Grundursache einer Abweichung?'],
    ['du', [['We use structured tools such as the five whys and fishbone diagrams.', 'Wir nutzen strukturierte Methoden wie die 5-Why-Methode und Ishikawa-Diagramme.', 1], ['We guess.', 'Wir raten.', 0, 'Keine gute Antwort für einen Inspektor.'], ['The root cause is always the operator.', 'Schuld ist immer der Mitarbeiter.', 0, 'Human error ist selten die echte Grundursache.']]],
    ['npc', 'And how do you make sure CAPAs are effective?', 'Und wie stellen Sie sicher, dass CAPAs wirksam sind?'],
    ['du', [['We carry out effectiveness checks after implementation.', 'Wir führen nach der Umsetzung Wirksamkeitsprüfungen durch.', 1], ['We close them as fast as possible.', 'Wir schließen sie so schnell wie möglich.', 0, 'Schnell ≠ wirksam.'], ['CAPA is a hat.', 'CAPA ist ein Hut.', 0, '😄']]],
    ['npc', 'I noticed that this batch record has a missing signature.', 'Mir ist aufgefallen, dass in diesem Chargenprotokoll eine Unterschrift fehlt.'],
    ['du', [['Thank you for pointing that out. We\'ll open a deviation and investigate.', 'Danke für den Hinweis. Wir eröffnen eine Abweichung und untersuchen das.', 1], ['I\'ll just sign it now.', 'Ich unterschreibe es einfach jetzt.', 0, 'Nachträglich unterschreiben = Datenintegrität verletzt!'], ['That\'s not important.', 'Das ist nicht wichtig.', 0, 'Für GMP sehr wichtig.']]],
    ['npc', 'Good. You\'ll receive our report within thirty days.', 'Gut. Sie erhalten unseren Bericht innerhalb von 30 Tagen.'],
    ['du', [['Thank you. We\'ll respond to any findings within the agreed timeframe.', 'Danke. Wir antworten fristgerecht auf alle Feststellungen.', 1], ['We never read reports.', 'Berichte lesen wir nie.', 0, 'Bitte nicht.'], ['Can you make it shorter?', 'Können Sie ihn kürzer machen?', 0, 'Unpassend.']]],
  ] },
  { id: 'negotiation', ic: '🤝', titel: 'Negotiating a price', stufe: 'B2', ort: 'Meeting room', z: [
    ['npc', 'To be honest, your price is above our budget.', 'Ehrlich gesagt liegt Ihr Preis über unserem Budget.'],
    ['du', [['I see. What figure did you have in mind?', 'Verstehe. Woran hatten Sie gedacht?', 1], ['Then you have a problem.', 'Dann haben Sie ein Problem.', 0, 'Zu konfrontativ.'], ['Our price is cheap.', 'Unser Preis ist billig.', 0, '„cheap“ klingt nach schlechter Qualität – besser „competitive“.']]],
    ['npc', 'We were thinking of a fifteen percent reduction.', 'Wir dachten an 15 Prozent Nachlass.'],
    ['du', [['That would be difficult. However, we could offer eight percent for a two-year contract.', 'Das wäre schwierig. Wir könnten aber acht Prozent bei zwei Jahren Laufzeit anbieten.', 1], ['OK, fifty percent.', 'OK, fünfzig Prozent.', 0, 'Damit verschenkst du deine Marge.'], ['No.', 'Nein.', 0, 'Ohne Gegenangebot endet die Verhandlung.']]],
    ['npc', 'Could you include free delivery as well?', 'Könnten Sie auch die Lieferung kostenlos machen?'],
    ['du', [['If you can commit to a minimum order, we can include free delivery.', 'Wenn Sie eine Mindestmenge zusagen, ist die Lieferung inklusive.', 1], ['Delivery is impossible.', 'Lieferung ist unmöglich.', 0, 'Dann gibt es kein Geschäft.'], ['If you will order more, we deliver free.', '(Fehler)', 0, 'Nach „if“ kein „will“: „If you order more, …“.']]],
    ['npc', 'That sounds reasonable. Let\'s put it in writing.', 'Klingt vernünftig. Lassen Sie es uns schriftlich festhalten.'],
    ['du', [['Great. I\'ll send you a draft contract by Friday.', 'Prima. Ich schicke Ihnen bis Freitag einen Vertragsentwurf.', 1], ['Writing is boring.', 'Schreiben ist langweilig.', 0, 'Bitte nicht 😉'], ['I\'ll send you a draft contract until Friday.', '(Fehler)', 0, '„bis“ (Frist) = by, nicht until.']]],
  ] },
  { id: 'smalltalk', ic: '☕', titel: 'Small talk at a conference', stufe: 'B1', ort: 'Coffee break, Vienna', z: [
    ['npc', 'Hi! Are you enjoying the conference so far?', 'Hi! Gefällt Ihnen die Konferenz bisher?'],
    ['du', [['Yes, very much. The keynote was really interesting.', 'Ja, sehr. Der Hauptvortrag war richtig interessant.', 1], ['Yes, I enjoy.', '(unvollständig)', 0, 'enjoy braucht ein Objekt: „I\'m enjoying it.“'], ['Where is the toilet?', 'Wo ist die Toilette?', 0, 'Kein guter Gesprächseinstieg.']]],
    ['npc', 'What do you do, if you don\'t mind me asking?', 'Was machen Sie beruflich, wenn ich fragen darf?'],
    ['du', [['I work in regulatory affairs for a pharma company.', 'Ich arbeite in der Zulassung bei einer Pharmafirma.', 1], ['I make my job.', '(Germanismus)', 0, '„I do my job“ – und eigentlich: „I work in …“.'], ['I mind.', 'Ich habe etwas dagegen.', 0, 'Unhöflich 😅']]],
    ['npc', 'Oh, interesting! Where are you based?', 'Oh, interessant! Wo sind Sie ansässig?'],
    ['du', [['I\'m based in Ljubljana, but I travel a lot.', 'Ich sitze in Ljubljana, reise aber viel.', 1], ['I am basing in Ljubljana.', '(Fehler)', 0, '„I\'m based in …“.'], ['On a chair.', 'Auf einem Stuhl.', 0, '😄']]],
    ['npc', 'Well, it was nice talking to you. Here\'s my card.', 'Schön, mit Ihnen zu sprechen. Hier ist meine Karte.'],
    ['du', [['Likewise. Let\'s stay in touch!', 'Ebenso. Lassen Sie uns in Kontakt bleiben!', 1], ['Thanks, I collect cards.', 'Danke, ich sammle Karten.', 0, 'Komisch 😉'], ['Bye bye forever.', 'Tschüss für immer.', 0, 'Etwas dramatisch.']]],
  ] },
];
const EN_SPICK = [
  ['Present Perfect vs. Past Simple', '<p><b>Present Perfect</b> (have + Partizip): Verbindung zur Gegenwart – <i>since, for, yet, already, ever, never, just</i>. <br><i>I\'ve worked here since 2019.</i></p><p><b>Past Simple</b>: abgeschlossener Zeitpunkt – <i>yesterday, last year, in 2020, ago</i>.<br><i>I moved here in 2019.</i></p><p>⚠️ Deutsch „Ich arbeite hier seit 5 Jahren“ = <b>I\'ve worked / been working here for 5 years</b>.</p>'],
  ['Conditionals 0 · 1 · 2 · 3', '<p><b>0</b> If you heat ice, it melts. (immer)</p><p><b>1</b> If it rains, I\'ll stay home. (realistisch)</p><p><b>2</b> If I had time, I would travel. (unwahrscheinlich)</p><p><b>3</b> If I had known, I would have come. (Vergangenheit, zu spät)</p><p>⚠️ Nie „will“ oder „would“ direkt nach <b>if</b>.</p>'],
  ['Passive', '<p>be + Partizip III: <i>The batch <b>was released</b>. Deviations <b>must be reported</b>. The samples <b>are being tested</b>.</i></p><p>Im Pharma-/Business-Englisch sehr häufig – sachlich, ohne „wer“.</p>'],
  ['Reported speech', '<p>Zeit rückt zurück: is → was, will → would, has done → had done.</p><p>Fragen ohne „do“, Aussagesatz-Wortstellung: <i>He asked where I <b>worked</b>.</i></p>'],
  ['Gerund oder Infinitiv?', '<p><b>-ing</b> nach: enjoy, avoid, mind, finish, suggest, look forward to, be used to.</p><p><b>to + Inf.</b> nach: decide, want, agree, plan, refuse, promise, manage.</p><p>Bedeutungswechsel: stop smoking (aufhören) ↔ stop to smoke (anhalten, um zu rauchen).</p>'],
  ['must / mustn\'t / don\'t have to', '<p><b>must</b> = muss · <b>mustn\'t</b> = darf nicht · <b>don\'t have to / needn\'t</b> = muss nicht.</p>'],
  ['E-Mail-Bausteine', '<p>Dear Mr/Ms … · Thank you for your email. · Please find attached … · Could you please confirm …? · I\'m afraid … · I look forward to hearing from you. · Kind regards</p>'],
  ['Typische Germanismen', '<p>❌ since 5 years → ✅ for 5 years · ❌ I become an email → ✅ I get an email · ❌ informations → ✅ information · ❌ until Friday (Frist) → ✅ by Friday · ❌ make a photo → ✅ take a photo · ❌ here speaks Anna → ✅ this is Anna</p>'],
];
// Englische Stimme suchen
let enStimme = null;
function enStimmeSuchen() { if (!('speechSynthesis' in window)) return; const v = speechSynthesis.getVoices(); enStimme = v.find((x) => /^en[-_]GB/i.test(x.lang)) || v.find((x) => /^en[-_]US/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang)) || null; }
if ('speechSynthesis' in window) { enStimmeSuchen(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', enStimmeSuchen); }
function enSprich(text, langsam) {
  if (!enStimme) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.voice = enStimme; u.lang = enStimme.lang; u.rate = langsam ? 0.65 : 0.95; spielTonSprache(u);
}
LH.paket({
  id: 'en', key: 'walquiz.lernhalle.en.v1', lang: 'en', titel: 'English Pro', sprache: 'Englisch', flagge: '🇬🇧', farbe1: '#2563eb', farbe2: '#dc2626', verlauf: 'eng',
  zeichen: null, sprich: enSprich, hatTon: () => !!enStimme,
  rollen: EN_ROLLEN, grammatik: EN_GRAMMATIK, spick: EN_SPICK,
  async decks() {
    return [
      { id: 'b1', n: 'B1', e: '📗', items: EN_B1 },
      { id: 'b2', n: 'B2', e: '📘', items: EN_B2 },
      { id: 'business', n: 'Business', e: '💼', items: EN_BUSINESS },
      { id: 'pharma', n: 'Pharma', e: '💊', items: EN_PHARMA },
      { id: 'phrasal', n: 'Phrasal Verbs', e: '🔗', items: EN_PHRASAL },
      { id: 'falsch', n: 'False Friends', e: '🎭', items: EN_FALSCH },
    ];
  },
});
// Eigener Bildschirm im Hub
$('hubEng').addEventListener('click', () => { merkeZuletzt('eng'); zoomZu($('hubEng'), () => { show('eng', '🇬🇧 English Pro'); LH.start('en', $('engInhalt')); engHubText(); }); });
$('engZurueck').addEventListener('click', () => { if ($('engInhalt').classList.contains('lh-im-spiel')) { LH.stop(); LH.home(); return; } LH.stop(); if ('speechSynthesis' in window) speechSynthesis.cancel(); zeigeHub(); engHubText(); });
function engHubText() { const el = $('hubEngBest'); if (!el) return; const s = loadJson('walquiz.lernhalle.en.v1'); el.textContent = s && s.xp ? 'Level ' + LH._intern.level(s.xp).l + ' · ' + s.xp + ' XP' : 'B1 → C2 · Lernplan · Diktat · Übersetzen · Spiele'; }
engHubText();
