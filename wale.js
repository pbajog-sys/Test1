// Alle heute lebenden Walarten (Cetacea), inklusive Delfine und Schweinswale.
// Spalten: Name, wissenschaftlicher Name, englischer Wikipedia-Artikel (für die Fotos), Stufe, Gruppe,
//          Länge, Gewicht, Verbreitung, Merkmal, weitere Namen (zählen im Test auch als richtig).
// Stufe: 1 = Seepferdchen, 2 = Bronze, 3 = Silber, 4 = Gold.
// Wichtig: Das Merkmal darf den Namen der Art nicht verraten – es wird als Tipp gezeigt.
const WAL_DATEN = [
  // ---------- Bartenwale ----------
  ['Blauwal', 'Balaenoptera musculus', 'Blue whale', 1, 'barten', '30 m', '150 t', 'Alle Ozeane', 'Das größte Tier, das je gelebt hat. Blaugrau gesprenkelt, winzige Rückenflosse weit hinten, Blas bis 9 m hoch.'],
  ['Finnwal', 'Balaenoptera physalus', 'Fin whale', 1, 'barten', '26 m', '80 t', 'Alle Ozeane', 'Zweitgrößtes Tier der Erde, sehr schlank und schnell. Der Unterkiefer ist rechts weiß und links dunkel.'],
  ['Seiwal', 'Balaenoptera borealis', 'Sei whale', 2, 'barten', '20 m', '30 t', 'Offene Ozeane in gemäßigten Breiten', 'Dunkelgrau mit großer, sichelförmiger Rückenflosse. Taucht oft flach ab, ohne die Fluke zu zeigen.'],
  ['Brydewal', 'Balaenoptera brydei', "Bryde's whale", 2, 'barten', '15 m', '25 t', 'Warme Meere weltweit', 'Hat drei Längsgrate oben auf dem Kopf – das hat sonst kein Furchenwal.', ['Bryde-Wal', 'Brydewal']],
  ['Rice-Wal', 'Balaenoptera ricei', "Rice's whale", 3, 'barten', '12,5 m', '27 t', 'Nur im Golf von Mexiko', 'Erst 2021 als eigene Art beschrieben. Es gibt nur noch etwa 50 Tiere.', ['Golf-von-Mexiko-Wal']],
  ['Omurawal', 'Balaenoptera omurai', "Omura's whale", 3, 'barten', '12 m', '20 t', 'Tropischer Indischer Ozean und Westpazifik', 'Erst 2003 beschrieben. Asymmetrisch gefärbter Kopf wie beim Finnwal, nur viel kleiner.', ['Omura-Wal']],
  ['Zwergwal', 'Balaenoptera acutorostrata', 'Common minke whale', 1, 'barten', '10 m', '9 t', 'Nordatlantik, Nordpazifik (auch Nordsee)', 'Kleinster Furchenwal der Nordhalbkugel. Spitze Schnauze und ein weißes Band auf den Brustflossen.', ['Minkwal', 'Minke']],
  ['Südlicher Zwergwal', 'Balaenoptera bonaerensis', 'Antarctic minke whale', 2, 'barten', '10,5 m', '10 t', 'Südpolarmeer und Südhalbkugel', 'Sieht aus wie sein nördlicher Verwandter, aber ohne weißes Band auf den Brustflossen.', ['Antarktischer Zwergwal', 'Antarktischer Minkwal']],
  ['Buckelwal', 'Megaptera novaeangliae', 'Humpback whale', 1, 'barten', '17 m', '40 t', 'Alle Ozeane', 'Extrem lange Brustflossen (bis 5 m) und Knubbel auf dem Kopf. Die Unterseite der Fluke ist bei jedem Tier anders gemustert.'],
  ['Grauwal', 'Eschrichtius robustus', 'Gray whale', 1, 'barten', '15 m', '35 t', 'Nordpazifik', 'Grau gesprenkelt mit Seepocken. Statt einer Rückenflosse hat er einen Höcker mit einer „Knöchelreihe“.'],
  ['Grönlandwal', 'Balaena mysticetus', 'Bowhead whale', 1, 'barten', '18 m', '100 t', 'Arktis', 'Keine Rückenflosse, riesiger gebogener Kopf und weißes Kinn. Kann über 200 Jahre alt werden.', ['Polarwal']],
  ['Atlantischer Nordkaper', 'Eubalaena glacialis', 'North Atlantic right whale', 1, 'barten', '16 m', '70 t', 'Westlicher Nordatlantik', 'Keine Rückenflosse, helle Hornschwielen auf dem Kopf, V-förmiger Blas. Nur noch etwa 370 Tiere.', ['Nordkaper', 'Nordatlantischer Glattwal']],
  ['Pazifischer Nordkaper', 'Eubalaena japonica', 'North Pacific right whale', 3, 'barten', '18 m', '90 t', 'Nordpazifik', 'Hornschwielen auf dem Kopf, keine Rückenflosse. Einer der seltensten Großwale.', ['Nordpazifischer Glattwal']],
  ['Südkaper', 'Eubalaena australis', 'Southern right whale', 2, 'barten', '16 m', '70 t', 'Südhalbkugel', 'Hornschwielen auf dem Kopf, keine Rückenflosse. Kommt in Südafrika und Argentinien ganz nah an die Küste.', ['Südlicher Glattwal']],
  ['Zwergglattwal', 'Caperea marginata', 'Pygmy right whale', 3, 'barten', '6,5 m', '3 t', 'Südhalbkugel', 'Der kleinste Bartenwal. Wird auf See nur sehr selten gesehen.'],

  // ---------- Pottwal-Verwandte ----------
  ['Pottwal', 'Physeter macrocephalus', 'Sperm whale', 1, 'pott', '18 m', '50 t', 'Alle Ozeane, Tiefsee', 'Größter Zahnwal mit riesigem Kastenkopf und faltiger Haut. Der Blas geht schräg nach vorne links.', ['Cachalot']],
  ['Zwergpottwal', 'Kogia breviceps', 'Pygmy sperm whale', 2, 'pott', '3,5 m', '450 kg', 'Warme Ozeane weltweit', 'Sieht fast aus wie ein Hai: hinter dem Auge eine helle Zeichnung wie eine Kieme, Unterkiefer weit hinten.'],
  ['Kleinpottwal', 'Kogia sima', 'Dwarf sperm whale', 3, 'pott', '2,7 m', '270 kg', 'Warme Ozeane weltweit', 'Sehr klein, mit höherer Rückenflosse als sein naher Verwandter. Kann bei Gefahr eine rotbraune Wolke ausstoßen.', ['Kleiner Pottwal']],

  // ---------- Gründelwale ----------
  ['Weißwal', 'Delphinapterus leucas', 'Beluga whale', 1, 'gruendel', '5,5 m', '1,5 t', 'Arktis und Subarktis', 'Erwachsene sind ganz weiß, ohne Rückenflosse. Wegen seiner vielen Laute „Kanarienvogel der Meere“ genannt.', ['Beluga', 'Belugawal']],
  ['Narwal', 'Monodon monoceros', 'Narwhal', 1, 'gruendel', '5 m (plus Zahn bis 3 m)', '1,6 t', 'Arktis um Grönland und Kanada', 'Die Männchen tragen einen langen, spiralig gedrehten Stoßzahn. Haut grau gefleckt.'],

  // ---------- Schnabelwale ----------
  ['Cuvier-Schnabelwal', 'Ziphius cavirostris', "Cuvier's beaked whale", 2, 'schnabel', '7 m', '3 t', 'Alle Ozeane, Tiefsee', 'Tauch-Weltrekordler: fast 3000 m tief und fast 4 Stunden lang. Kopf wie ein Gänseschnabel, oft helle Kratznarben.', ['Cuvier-Wal', 'Gänseschnabelwal']],
  ['Baird-Wal', 'Berardius bairdii', "Baird's beaked whale", 3, 'schnabel', '12 m', '14 t', 'Nordpazifik', 'Der größte Schnabelwal. Dunkler, langer Körper mit deutlichem Schnabel und Stirnbuckel.', ['Baird-Schnabelwal', 'Nördlicher Schwarzwal']],
  ['Arnoux-Schnabelwal', 'Berardius arnuxii', "Arnoux's beaked whale", 3, 'schnabel', '10 m', '10 t', 'Südpolarmeer', 'Großer, dunkler Schnabelwal der Antarktis, oft in Gruppen nahe am Packeis.', ['Südlicher Schwarzwal', 'Arnoux-Wal']],
  ['Sato-Schnabelwal', 'Berardius minimus', "Sato's beaked whale", 4, 'schnabel', '7 m', '?', 'Nordpazifik vor Japan', 'Erst 2019 beschrieben. Ganz dunkel mit auffallend kurzem Schnabel.', ['Kurotsuchi']],
  ['Nördlicher Entenwal', 'Hyperoodon ampullatus', 'Northern bottlenose whale', 2, 'schnabel', '9 m', '7 t', 'Nordatlantik', 'Hohe, steile Stirn und kurzer Schnabel. Sehr neugierig, nähert sich manchmal Schiffen.', ['Entenwal', 'Dögling']],
  ['Südlicher Entenwal', 'Hyperoodon planifrons', 'Southern bottlenose whale', 3, 'schnabel', '7,5 m', '6 t', 'Südpolarmeer', 'Steile, runde Stirn und kurzer Schnabel – das Gegenstück zum Verwandten im Nordatlantik.'],
  ['Shepherd-Schnabelwal', 'Tasmacetus shepherdi', "Shepherd's beaked whale", 4, 'schnabel', '7 m', '?', 'Kühle Meere der Südhalbkugel', 'Der einzige Schnabelwal mit vielen Zähnen in beiden Kiefern. Kaum lebend beobachtet.', ['Tasmanischer Schnabelwal', 'Shepherd-Wal']],
  ['Longman-Schnabelwal', 'Indopacetus pacificus', "Longman's beaked whale", 4, 'schnabel', '7 m', '?', 'Tropischer Indischer Ozean und Pazifik', 'War lange nur von zwei Schädeln bekannt. Lebt in großen Gruppen, oft zusammen mit Grindwalen.', ['Indopazifischer Schnabelwal']],
  ['Sowerby-Zweizahnwal', 'Mesoplodon bidens', "Sowerby's beaked whale", 3, 'schnabel', '5,5 m', '1,3 t', 'Nordatlantik, auch Nordsee', 'Langer schlanker Schnabel. Die Männchen haben zwei Zähne in der Mitte des Unterkiefers.', ['Sowerby-Schnabelwal', 'Sowerby-Wal']],
  ['Blainville-Schnabelwal', 'Mesoplodon densirostris', "Blainville's beaked whale", 3, 'schnabel', '4,7 m', '1 t', 'Tropische und warme Meere weltweit', 'Die Männchen haben einen hoch gewölbten Unterkiefer mit zwei Zähnen wie Hörner – oft mit Seepocken drauf.', ['Blainville-Zweizahnwal']],
  ['Gervais-Zweizahnwal', 'Mesoplodon europaeus', "Gervais' beaked whale", 4, 'schnabel', '5 m', '1,2 t', 'Warmer Atlantik', 'Schlanker Schnabelwal mit kleinem Kopf; die Zähne sitzen beim Männchen weit vorne im Unterkiefer.', ['Gervais-Schnabelwal']],
  ['True-Wal', 'Mesoplodon mirus', "True's beaked whale", 4, 'schnabel', '5,3 m', '1,4 t', 'Nordatlantik und Südhalbkugel', 'Kurzer Schnabel, die zwei Zähne der Männchen ragen ganz vorne aus dem Unterkiefer.', ['True-Schnabelwal']],
  ['Ramari-Schnabelwal', 'Mesoplodon eueu', "Ramari's beaked whale", 4, 'schnabel', '5 m', '?', 'Kühle Meere der Südhalbkugel', 'Erst 2019 als eigene Art abgetrennt. Benannt nach einer Maori-Walschützerin.'],
  ['Gray-Zweizahnwal', 'Mesoplodon grayi', "Gray's beaked whale", 4, 'schnabel', '5,5 m', '1,1 t', 'Südhalbkugel', 'Auffallend langer, heller Schnabel. Hat als einziger seiner Gattung viele kleine Zähne im Oberkiefer.', ['Gray-Schnabelwal']],
  ['Hector-Schnabelwal', 'Mesoplodon hectori', "Hector's beaked whale", 4, 'schnabel', '4,5 m', '?', 'Südhalbkugel', 'Kleiner, grauer Schnabelwal mit kurzem Schnabel. Nur wenige Male lebend gesehen.'],
  ['Perrin-Schnabelwal', 'Mesoplodon perrini', "Perrin's beaked whale", 4, 'schnabel', '4,4 m', '?', 'Ostpazifik vor Kalifornien', 'Erst 2002 beschrieben, bisher nur von gestrandeten Tieren bekannt.'],
  ['Peru-Schnabelwal', 'Mesoplodon peruvianus', 'Pygmy beaked whale', 4, 'schnabel', '3,9 m', '?', 'Ostpazifik', 'Der kleinste Schnabelwal. Männchen mit hellem Band über den Rücken.', ['Zwergschnabelwal']],
  ['Ginkgozahn-Schnabelwal', 'Mesoplodon ginkgodens', 'Ginkgo-toothed beaked whale', 4, 'schnabel', '4,9 m', '1,5 t', 'Tropischer Indischer Ozean und Pazifik', 'Die Zähne der Männchen sind breit und flach geformt wie ein Ginkgoblatt.', ['Japanischer Schnabelwal']],
  ['Hubbs-Schnabelwal', 'Mesoplodon carlhubbsi', "Hubbs' beaked whale", 4, 'schnabel', '5,3 m', '1,5 t', 'Nördlicher Pazifik', 'Die Männchen haben eine weiße „Kappe“ vor dem Blasloch und einen weißen Schnabel.'],
  ['Stejneger-Schnabelwal', 'Mesoplodon stejnegeri', "Stejneger's beaked whale", 4, 'schnabel', '5,5 m', '1,5 t', 'Nordpazifik und Beringmeer', 'Lebt in kalten, tiefen Gewässern. Die Männchen haben große, nach vorn geneigte Zähne.', ['Beringmeer-Schnabelwal']],
  ['Andrews-Schnabelwal', 'Mesoplodon bowdoini', "Andrews' beaked whale", 4, 'schnabel', '4,7 m', '?', 'Südhalbkugel um Australien und Neuseeland', 'Dunkel mit hellem Schnabelende. Fast nur von gestrandeten Tieren bekannt.'],
  ['Layard-Schnabelwal', 'Mesoplodon layardii', 'Strap-toothed whale', 3, 'schnabel', '6 m', '1,3 t', 'Südhalbkugel', 'Die zwei Zähne der Männchen wachsen wie Riemen über den Oberkiefer – das Maul geht nur einen Spalt weit auf.', ['Riemenzahnwal']],
  ['Bahamonde-Schnabelwal', 'Mesoplodon traversii', 'Spade-toothed whale', 4, 'schnabel', '5,3 m', '?', 'Südpazifik', 'Der wohl seltenste Wal der Welt – lebend wurde er noch nie beobachtet.', ['Spatenzahnwal']],
  ['Deraniyagala-Schnabelwal', 'Mesoplodon hotaula', "Deraniyagala's beaked whale", 4, 'schnabel', '4,8 m', '?', 'Tropischer Indischer Ozean und Pazifik', 'Erst 2014 als eigene Art bestätigt, benannt nach einem Forscher aus Sri Lanka.'],

  // ---------- Delfine ----------
  ['Schwertwal', 'Orcinus orca', 'Orca', 1, 'delfin', '9 m', '6 t', 'Alle Ozeane, auch Nordsee', 'Schwarz-weiß mit weißem Fleck hinter dem Auge. Die Rückenflosse der Männchen wird bis 1,8 m hoch.', ['Orca', 'Killerwal', 'Mörderwal']],
  ['Kleiner Schwertwal', 'Pseudorca crassidens', 'False killer whale', 2, 'delfin', '6 m', '2 t', 'Tropische und warme Meere', 'Ganz schwarz und schlank, ohne Schnabel. Die Brustflosse hat einen Knick wie ein Ellbogen.', ['Unechter Schwertwal']],
  ['Zwergschwertwal', 'Feresa attenuata', 'Pygmy killer whale', 3, 'delfin', '2,6 m', '225 kg', 'Tropische Meere', 'Dunkel mit rundem Kopf ohne Schnabel, oft mit weißen Lippen.'],
  ['Melonenkopf', 'Peponocephala electra', 'Melon-headed whale', 3, 'delfin', '2,7 m', '275 kg', 'Tropische Meere', 'Dunkler Körper mit spitz-dreieckigem Kopf ohne Schnabel. Lebt in Gruppen von hunderten Tieren.', ['Breitschnabeldelfin']],
  ['Langflossen-Grindwal', 'Globicephala melas', 'Long-finned pilot whale', 1, 'delfin', '6,5 m', '2,5 t', 'Nordatlantik und kühle Südhalbkugel', 'Schwarz mit runder Stirn wie eine Melone, breite Rückenflosse und sehr lange Brustflossen.', ['Grindwal', 'Gewöhnlicher Grindwal', 'Pilotwal']],
  ['Kurzflossen-Grindwal', 'Globicephala macrorhynchus', 'Short-finned pilot whale', 2, 'delfin', '6 m', '3 t', 'Tropische und warme Meere', 'Schwarz mit runder Stirn und breiter Rückenflosse – die Brustflossen sind kürzer als beim nördlichen Verwandten.', ['Grindwal', 'Pilotwal']],
  ['Rundkopfdelfin', 'Grampus griseus', "Risso's dolphin", 2, 'delfin', '4 m', '500 kg', 'Alle Ozeane, auch Mittelmeer', 'Stumpfer Kopf ohne Schnabel, der Körper ist von weißen Kratznarben übersät und wird mit dem Alter fast weiß.', ['Rissodelfin', 'Rundkopfdelphin']],
  ['Großer Tümmler', 'Tursiops truncatus', 'Common bottlenose dolphin', 1, 'delfin', '4 m', '650 kg', 'Alle Ozeane, auch Nord- und Ostsee', 'Grau mit kurzem, dickem Schnabel. Der bekannteste Delfin aus Film und Fernsehen („Flipper“).', ['Tümmler', 'Flaschennasendelfin']],
  ['Indopazifischer Großer Tümmler', 'Tursiops aduncus', 'Indo-Pacific bottlenose dolphin', 3, 'delfin', '2,7 m', '230 kg', 'Indischer Ozean und Westpazifik', 'Kleiner und schlanker als sein Verwandter, mit längerem Schnabel. Erwachsene haben Flecken am Bauch.', ['Indopazifischer Tümmler']],
  ['Gemeiner Delfin', 'Delphinus delphis', 'Common dolphin', 1, 'delfin', '2,5 m', '135 kg', 'Warme und gemäßigte Meere weltweit', 'An der Seite ein Muster wie eine Sanduhr: vorne gelblich, hinten grau.', ['Gewöhnlicher Delfin', 'Delfin']],
  ['Streifendelfin', 'Stenella coeruleoalba', 'Striped dolphin', 2, 'delfin', '2,6 m', '160 kg', 'Warme Meere weltweit, auch Mittelmeer', 'Ein dunkler Streifen läuft vom Auge bis zum Schwanz, ein zweiter zur Brustflosse.'],
  ['Schlankdelfin', 'Stenella attenuata', 'Pantropical spotted dolphin', 3, 'delfin', '2,4 m', '120 kg', 'Tropische Meere', 'Je älter, desto mehr Flecken. Dunkler „Umhang“ auf dem Rücken, weiße Schnabelspitze.', ['Pantropischer Fleckendelfin']],
  ['Atlantischer Fleckendelfin', 'Stenella frontalis', 'Atlantic spotted dolphin', 2, 'delfin', '2,3 m', '140 kg', 'Warmer Atlantik, z. B. Bahamas', 'Erwachsene sind über und über mit weißen und dunklen Flecken bedeckt.', ['Fleckendelfin']],
  ['Spinnerdelfin', 'Stenella longirostris', 'Spinner dolphin', 2, 'delfin', '2,2 m', '80 kg', 'Tropische Meere', 'Macht Schraubensprünge mit bis zu 7 Drehungen in der Luft. Langer, dünner Schnabel.', ['Ostpazifischer Delfin', 'Langschnauzen-Delfin']],
  ['Clymene-Delfin', 'Stenella clymene', 'Clymene dolphin', 3, 'delfin', '2 m', '80 kg', 'Tropischer und warmer Atlantik', 'Dreifarbig mit dunklem „Schnurrbart“ auf dem Schnabel. Entstand vermutlich aus einer Kreuzung zweier Arten.', ['Kurzschnauzen-Spinnerdelfin']],
  ['Rauzahndelfin', 'Steno bredanensis', 'Rough-toothed dolphin', 3, 'delfin', '2,6 m', '150 kg', 'Tropische und warme Meere', 'Kopf wie ein langer Kegel ohne Stirnabsatz, große Augen, weiße Lippen.'],
  ['Fraser-Delfin', 'Lagenodelphis hosei', "Fraser's dolphin", 3, 'delfin', '2,7 m', '210 kg', 'Tropische Meere', 'Kräftig gebaut mit kurzem Schnabel und kleinen Flossen. Dunkles Band vom Auge bis zum Hinterleib.', ['Borneo-Delfin']],
  ['Weißschnauzendelfin', 'Lagenorhynchus albirostris', 'White-beaked dolphin', 2, 'delfin', '3 m', '350 kg', 'Nordatlantik, auch Nordsee', 'Kräftiger Delfin mit kurzem, oft weißem Schnabel und großer Rückenflosse.', ['Weißschnauzen-Delfin']],
  ['Weißseitendelfin', 'Leucopleurus acutus', 'Atlantic white-sided dolphin', 2, 'delfin', '2,8 m', '230 kg', 'Nordatlantik', 'Auf der Flanke ein langer weißer Fleck, dahinter ein gelber Streifen.', ['Atlantischer Weißseitendelfin']],
  ['Pazifischer Weißseitendelfin', 'Sagmatias obliquidens', 'Pacific white-sided dolphin', 3, 'delfin', '2,5 m', '150 kg', 'Nordpazifik', 'Zweifarbige, hakenförmige Rückenflosse und helle Streifen. Sehr verspielt und akrobatisch.'],
  ['Schwarzdelfin', 'Sagmatias obscurus', 'Dusky dolphin', 3, 'delfin', '2 m', '80 kg', 'Küsten der Südhalbkugel', 'Berühmt für hohe Sprünge und Saltos. Dunkler Rücken mit hellen Streifen an der Seite.', ['Dunkler Delfin']],
  ['Peale-Delfin', 'Sagmatias australis', "Peale's dolphin", 3, 'delfin', '2,2 m', '115 kg', 'Südspitze Südamerikas', 'Dunkles Gesicht und ein heller Streifen auf der Flanke. Lebt gern in Tangwäldern.'],
  ['Stundenglasdelfin', 'Sagmatias cruciger', 'Hourglass dolphin', 3, 'delfin', '1,9 m', '90 kg', 'Südpolarmeer', 'Schwarz mit weißem Muster an der Seite, das wie eine Sanduhr aussieht.', ['Sanduhrdelfin']],
  ['Nördlicher Glattdelfin', 'Lissodelphis borealis', 'Northern right whale dolphin', 3, 'delfin', '3 m', '115 kg', 'Nordpazifik', 'Keine Rückenflosse! Sehr schlank, fast ganz schwarz mit weißem Bauch.'],
  ['Südlicher Glattdelfin', 'Lissodelphis peronii', 'Southern right whale dolphin', 3, 'delfin', '3 m', '115 kg', 'Kühle Meere der Südhalbkugel', 'Keine Rückenflosse, schwarzer Rücken, weißes Gesicht und weißer Bauch.'],
  ['Commerson-Delfin', 'Cephalorhynchus commersonii', "Commerson's dolphin", 2, 'delfin', '1,5 m', '60 kg', 'Patagonien, Falklandinseln, Kerguelen', 'Schwarz-weiß wie ein kleiner Panda, mit runder Rückenflosse.', ['Jacobita']],
  ['Chile-Delfin', 'Cephalorhynchus eutropia', 'Chilean dolphin', 3, 'delfin', '1,7 m', '60 kg', 'Küste von Chile', 'Kleiner, dunkelgrauer Delfin mit runder Rückenflosse, scheu.', ['Chilenischer Delfin']],
  ['Heaviside-Delfin', 'Cephalorhynchus heavisidii', "Heaviside's dolphin", 3, 'delfin', '1,7 m', '75 kg', 'Westküste des südlichen Afrikas', 'Dunkler Kopf, dreieckige Rückenflosse und weiße Zeichnung am Bauch.', ['Benguela-Delfin']],
  ['Hector-Delfin', 'Cephalorhynchus hectori', "Hector's dolphin", 3, 'delfin', '1,5 m', '50 kg', 'Nur Neuseeland', 'Einer der kleinsten Delfine. Die Rückenflosse ist rund wie ein Mickymaus-Ohr.', ['Maui-Delfin']],
  ['Irawadi-Delfin', 'Orcaella brevirostris', 'Irrawaddy dolphin', 2, 'delfin', '2,6 m', '130 kg', 'Küsten und Flüsse Südostasiens (z. B. Mekong)', 'Runder Kopf ohne Schnabel, kleine Rückenflosse. Kann Wasser aus dem Maul spucken.', ['Irrawaddy-Delfin']],
  ['Australischer Stupsfinnendelfin', 'Orcaella heinsohni', 'Australian snubfin dolphin', 3, 'delfin', '2,7 m', '130 kg', 'Küste Nordaustraliens', 'Erst 2005 beschrieben. Runder Kopf ohne Schnabel und kleine, stumpfe Rückenflosse.', ['Stupsfinnendelfin']],
  ['Indopazifischer Buckeldelfin', 'Sousa chinensis', 'Indo-Pacific humpback dolphin', 3, 'delfin', '2,8 m', '230 kg', 'Südchina bis Indonesien', 'Erwachsene sind oft rosa-weiß gefärbt, zum Beispiel bei Hongkong.', ['Chinesischer Weißer Delfin', 'Rosa Delfin']],
  ['Atlantischer Buckeldelfin', 'Sousa teuszii', 'Atlantic humpback dolphin', 3, 'delfin', '2,6 m', '150 kg', 'Küste Westafrikas', 'Grau mit einem Buckel unter der Rückenflosse. Vom Aussterben bedroht.', ['Kamerun-Flussdelfin']],
  ['Indischer Buckeldelfin', 'Sousa plumbea', 'Indian Ocean humpback dolphin', 3, 'delfin', '2,8 m', '260 kg', 'Küsten von Südafrika bis Indien', 'Grau mit langem Schnabel und einem deutlichen Buckel unter der Rückenflosse.'],
  ['Australischer Buckeldelfin', 'Sousa sahulensis', 'Australian humpback dolphin', 3, 'delfin', '2,7 m', '200 kg', 'Nordaustralien und Neuguinea', 'Erst 2014 beschrieben. Langer Schnabel, flacher Buckel unter der Rückenflosse.'],
  ['Amazonas-Sotalia', 'Sotalia fluviatilis', 'Tucuxi', 3, 'delfin', '1,5 m', '50 kg', 'Amazonas', 'Kleiner grauer Delfin, der im Süßwasser lebt – oft zusammen mit dem rosa Flussdelfin.', ['Tucuxi', 'Sotalia']],
  ['Guayana-Delfin', 'Sotalia guianensis', 'Guiana dolphin', 3, 'delfin', '2,1 m', '120 kg', 'Atlantikküste Südamerikas', 'Grauer Küstendelfin mit dreieckiger Rückenflosse, lebt in Buchten und Flussmündungen.', ['Küsten-Sotalia']],

  // ---------- Flussdelfine ----------
  ['Amazonasdelfin', 'Inia geoffrensis', 'Amazon river dolphin', 2, 'fluss', '2,5 m', '185 kg', 'Amazonas und Orinoco', 'Rosa gefärbt, mit langem Schnabel und beweglichem Hals. Der größte Flussdelfin.', ['Boto', 'Inia', 'Rosa Flussdelfin']],
  ['Ganges-Delfin', 'Platanista gangetica', 'South Asian river dolphin', 3, 'fluss', '2,5 m', '85 kg', 'Ganges und Brahmaputra', 'Fast blind, mit sehr langem, dünnem Schnabel voller Zähne. Orientiert sich nur mit Echoortung.', ['Gangesdelfin', 'Susu']],
  ['Indus-Delfin', 'Platanista minor', 'Indus river dolphin', 3, 'fluss', '2,4 m', '85 kg', 'Indus in Pakistan', 'Fast blind, langer dünner Schnabel. Schwimmt oft auf der Seite.', ['Indusdelfin', 'Bhulan']],
  ['La-Plata-Delfin', 'Pontoporia blainvillei', 'La Plata dolphin', 3, 'fluss', '1,7 m', '50 kg', 'Küste von Brasilien bis Argentinien', 'Hat im Verhältnis zum Körper den längsten Schnabel aller Delfine. Lebt im Meer, nicht im Fluss.', ['Franciscana']],

  // ---------- Schweinswale ----------
  ['Schweinswal', 'Phocoena phocoena', 'Harbour porpoise', 1, 'schwein', '1,8 m', '60 kg', 'Nordsee, Ostsee, Nordatlantik, Nordpazifik', 'Der einzige Wal, der regelmäßig an deutschen Küsten lebt. Kein Schnabel, kleine dreieckige Rückenflosse.', ['Kleiner Tümmler', 'Hafenschweinswal']],
  ['Vaquita', 'Phocoena sinus', 'Vaquita', 2, 'schwein', '1,5 m', '50 kg', 'Nördlicher Golf von Kalifornien', 'Das seltenste Meeressäugetier der Welt – nur noch etwa 10 Tiere. Dunkle Ringe um die Augen.', ['Kalifornischer Schweinswal']],
  ['Burmeister-Schweinswal', 'Phocoena spinipinnis', "Burmeister's porpoise", 3, 'schwein', '1,8 m', '85 kg', 'Küsten Südamerikas', 'Dunkel gefärbt, die Rückenflosse sitzt weit hinten und ist nach hinten geneigt.'],
  ['Brillenschweinswal', 'Phocoena dioptrica', 'Spectacled porpoise', 3, 'schwein', '2,2 m', '115 kg', 'Subantarktische Meere', 'Oben schwarz, unten weiß, mit einem weißen Ring um das Auge wie eine Brille.'],
  ['Weißflankenschweinswal', 'Phocoenoides dalli', "Dall's porpoise", 2, 'schwein', '2,2 m', '200 kg', 'Nordpazifik', 'Schwarz mit großem weißen Fleck an der Flanke. Erzeugt beim schnellen Schwimmen eine Wasserfontäne wie ein Hahnenschwanz.', ['Dall-Hafenschweinswal', 'Dall-Schweinswal']],
  ['Indischer Glattschweinswal', 'Neophocaena phocaenoides', 'Indo-Pacific finless porpoise', 3, 'schwein', '1,9 m', '70 kg', 'Küsten vom Persischen Golf bis Südostasien', 'Keine Rückenflosse, runder Kopf ohne Schnabel, hellgrau.', ['Glattschweinswal', 'Indopazifischer Glattschweinswal']],
  ['Schmalrücken-Glattschweinswal', 'Neophocaena asiaeorientalis', 'Narrow-ridged finless porpoise', 3, 'schwein', '1,9 m', '70 kg', 'Ostasiatische Küsten und Jangtse', 'Keine Rückenflosse, nur ein schmaler Grat auf dem Rücken. Eine Unterart lebt im Jangtse.', ['Jangtse-Glattschweinswal', 'Glattschweinswal']],
];

const GRUPPEN = {
  barten:   'Bartenwal',
  pott:     'Zahnwal – Pottwal-Familie',
  gruendel: 'Zahnwal – Gründelwal',
  schnabel: 'Zahnwal – Schnabelwal',
  delfin:   'Zahnwal – Delfin',
  fluss:    'Zahnwal – Flussdelfin',
  schwein:  'Zahnwal – Schweinswal',
};

const STUFEN = [
  { lvl: 1, name: 'Seepferdchen', emoji: '🐴', text: 'Die bekanntesten Wale' },
  { lvl: 2, name: 'Bronze', emoji: '🥉', text: 'Wale, die man oft beobachten kann' },
  { lvl: 3, name: 'Silber', emoji: '🥈', text: 'Fast alle Arten' },
  { lvl: 4, name: 'Gold', emoji: '🥇', text: 'Alle Walarten – auch die seltenen Schnabelwale' },
];

const WALE = WAL_DATEN.map(([name, latin, wiki, lvl, gruppe, laenge, gewicht, gebiet, merkmal, auch = []]) => ({
  id: latin.toLowerCase().replace(/\s+/g, '-'),
  welt: 'wale', name, latin, wiki, lvl, gruppe, laenge, gewicht, gebiet, merkmal, auch,
}));
