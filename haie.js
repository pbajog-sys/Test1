// Haiarten aus allen 8 Ordnungen – gleiche Spalten wie in wale.js:
// Name, wissenschaftlicher Name, englischer Wikipedia-Artikel, Stufe, Gruppe,
// Länge, Gewicht, Verbreitung, Merkmal (darf den Namen nicht verraten), weitere Namen.
// Neue Arten bitte nur hinten anhängen – Challenge-Links speichern die Position in der Liste.
const HAI_DATEN = [
  // ---------- Grauhai-Verwandte ----------
  ['Kragenhai', 'Chlamydoselachus anguineus', 'Frilled shark', 2, 'grauhai', '2 m', '?', 'Tiefsee weltweit', 'Lang und schlank wie ein Aal, sechs gekrauste Kiemenspalten und rund 300 dreizackige Zähne – ein „lebendes Fossil“.'],
  ['Sechskiemer-Grauhai', 'Hexanchus griseus', 'Bluntnose sixgill shark', 2, 'grauhai', '5,5 m', '600 kg', 'Tiefsee weltweit, auch Mittelmeer', 'Sechs Kiemenspalten statt fünf, nur eine Rückenflosse weit hinten und leuchtend grüne Augen.', ['Sechskiemerhai', 'Stumpfnasen-Sechskiemerhai', 'Grauhai']],
  ['Breitnasen-Siebenkiemerhai', 'Notorynchus cepedianus', 'Broadnose sevengill shark', 3, 'grauhai', '3 m', '110 kg', 'Kühle Küsten, z. B. Südafrika, Kalifornien', 'Sieben Kiemenspalten, breiter flacher Kopf und viele kleine dunkle Flecken.', ['Siebenkiemerhai']],
  ['Spitzkopf-Siebenkiemerhai', 'Heptranchias perlo', 'Sharpnose sevengill shark', 4, 'grauhai', '1,4 m', '?', 'Tiefsee weltweit', 'Sehr schlank mit spitzer Schnauze, sieben Kiemenspalten und großen grünen Augen.'],

  // ---------- Dornhaiartige ----------
  ['Dornhai', 'Squalus acanthias', 'Spiny dogfish', 2, 'dorn', '1,6 m', '9 kg', 'Kühle Meere weltweit, auch Nordsee', 'Vor jeder der beiden Rückenflossen sitzt ein giftiger Stachel, weiße Flecken auf dem grauen Rücken.', ['Gemeiner Dornhai']],
  ['Grönlandhai', 'Somniosus microcephalus', 'Greenland shark', 1, 'dorn', '6,4 m', '1 t', 'Nordatlantik und Arktis', 'Das langlebigste Wirbeltier der Welt – bis etwa 400 Jahre alt. Schwimmt extrem langsam.', ['Eishai']],
  ['Pazifischer Schlafhai', 'Somniosus pacificus', 'Pacific sleeper shark', 3, 'dorn', '4,4 m', '?', 'Nordpazifik, Tiefsee', 'Massig, dunkel und sehr träge. Frisst sogar Riesenkalmare.'],
  ['Zigarrenhai', 'Isistius brasiliensis', 'Cookiecutter shark', 3, 'dorn', '0,5 m', '?', 'Tropische Hochsee', 'Beißt kreisrunde Stücke aus Walen, Delfinen und Thunfischen. Sein Bauch leuchtet im Dunkeln.', ['Keksausstecherhai']],
  ['Zwerg-Laternenhai', 'Etmopterus perryi', 'Dwarf lanternshark', 4, 'dorn', '0,2 m', '?', 'Karibik, Tiefsee', 'Einer der kleinsten Haie der Welt – passt in eine Hand. Leuchtet am Bauch.'],
  ['Schokoladenhai', 'Dalatias licha', 'Kitefin shark', 3, 'dorn', '1,8 m', '?', 'Tiefsee weltweit', 'Dunkelbraun und das größte bekannte leuchtende Wirbeltier.'],
  ['Brombeerhai', 'Echinorhinus brucus', 'Bramble shark', 4, 'dorn', '3 m', '?', 'Tiefsee weltweit', 'Die Haut ist mit großen, dornigen Knubbeln besetzt wie eine Brombeerranke.'],
  ['Meersau', 'Oxynotus centrina', 'Angular roughshark', 4, 'dorn', '1,5 m', '?', 'Ostatlantik und Mittelmeer', 'Dreieckiger Körper mit zwei riesigen, segelartigen Rückenflossen.', ['Schweinshai']],
  ['Portugiesenhai', 'Centroscymnus coelolepis', 'Portuguese dogfish', 4, 'dorn', '1,2 m', '?', 'Tiefsee bis 3700 m', 'Einer der am tiefsten lebenden Haie überhaupt.', ['Portugiesischer Dornhai']],

  // ---------- Sägehaie ----------
  ['Langnasen-Sägehai', 'Pristiophorus cirratus', 'Longnose sawshark', 3, 'saege', '1,5 m', '?', 'Südaustralien', 'Lange, flache Schnauze mit Zähnen an beiden Seiten wie eine Säge – und zwei Barteln.'],
  ['Japanischer Sägehai', 'Pristiophorus japonicus', 'Japanese sawshark', 4, 'saege', '1,4 m', '?', 'Japan bis China', 'Lange Säge-Schnauze mit Barteln, lebt am Meeresgrund.'],
  ['Bahamas-Sägehai', 'Pristiophorus schroederi', 'Bahamas sawshark', 4, 'saege', '0,8 m', '?', 'Tiefe Gewässer um Kuba und die Bahamas', 'Kleiner, heller Hai mit Säge-Schnauze, lebt in großer Tiefe.'],

  // ---------- Engelhaie ----------
  ['Engelhai', 'Squatina squatina', 'Angelshark', 2, 'engel', '2,4 m', '80 kg', 'Nordostatlantik, Mittelmeer, Kanaren', 'Flach wie ein Rochen, gräbt sich im Sand ein und schnappt blitzschnell zu. Vom Aussterben bedroht.', ['Meerengel']],
  ['Pazifischer Engelhai', 'Squatina californica', 'Pacific angelshark', 3, 'engel', '1,5 m', '27 kg', 'Ostpazifik', 'Flach mit breiten Brustflossen, liegt gut getarnt im Sand.'],
  ['Atlantischer Engelhai', 'Squatina dumeril', 'Sand devil', 3, 'engel', '1,5 m', '?', 'Westatlantik', 'Flach und sandfarben, lauert eingegraben auf Beute.'],
  ['Japanischer Engelhai', 'Squatina japonica', 'Japanese angelshark', 4, 'engel', '2 m', '?', 'Nordwestpazifik', 'Flach mit dunklen Flecken und Dornen auf dem Rücken.'],

  // ---------- Stierkopfhaie ----------
  ['Port-Jackson-Stierkopfhai', 'Heterodontus portusjacksoni', 'Port Jackson shark', 2, 'stier', '1,6 m', '?', 'Südaustralien', 'Dunkles Muster wie ein Pferdegeschirr, Stacheln vor den Rückenflossen. Legt korkenzieherförmige Eier.', ['Stierkopfhai']],
  ['Hornhai', 'Heterodontus francisci', 'Horn shark', 3, 'stier', '1,2 m', '10 kg', 'Kalifornien und Mexiko', 'Knochige Wülste über den Augen, Stacheln vor den Rückenflossen, nachtaktiv.', ['Kalifornischer Stierkopfhai']],
  ['Zebra-Stierkopfhai', 'Heterodontus zebra', 'Zebra bullhead shark', 4, 'stier', '1,2 m', '?', 'Westpazifik', 'Hell mit breiten dunklen Streifen wie ein Zebra.'],
  ['Galápagos-Stierkopfhai', 'Heterodontus quoyi', 'Galapagos bullhead shark', 4, 'stier', '1 m', '?', 'Galápagos und Peru', 'Kleiner Hai mit großen dunklen Flecken und stumpfem Kopf.'],

  // ---------- Ammenhaiartige ----------
  ['Walhai', 'Rhincodon typus', 'Whale shark', 1, 'ammen', '18 m', '20 t', 'Tropische Meere weltweit', 'Der größte Fisch der Welt. Weiße Punkte und Streifen, breites Maul ganz vorne – frisst nur Plankton.'],
  ['Ammenhai', 'Ginglymostoma cirratum', 'Nurse shark', 1, 'ammen', '3 m', '110 kg', 'Warme Küsten von Atlantik und Ostpazifik', 'Zwei Barteln an der Schnauze, liegt oft träge am Boden und saugt Beute ein.', ['Atlantischer Ammenhai']],
  ['Zebrahai', 'Stegostoma tigrinum', 'Zebra shark', 2, 'ammen', '2,5 m', '30 kg', 'Indopazifische Riffe', 'Erwachsene sind gefleckt wie ein Leopard, Jungtiere gestreift. Sehr lange Schwanzflosse und Grate auf dem Körper.'],
  ['Gefleckter Wobbegong', 'Orectolobus maculatus', 'Spotted wobbegong', 2, 'ammen', '3 m', '?', 'Küsten Australiens', 'Flach und perfekt getarnt, mit Hautlappen rund um das Maul wie ein Bart.', ['Wobbegong', 'Teppichhai']],
  ['Fransen-Wobbegong', 'Eucrossorhinus dasypogon', 'Tasselled wobbegong', 3, 'ammen', '1,3 m', '?', 'Neuguinea und Nordaustralien', 'Der ganze Kopf ist von verzweigten Hautfransen umgeben – sieht aus wie ein Stück Riff.', ['Fransenteppichhai']],
  ['Epaulettenhai', 'Hemiscyllium ocellatum', 'Epaulette shark', 2, 'ammen', '1 m', '?', 'Nordaustralien und Neuguinea', 'Großer schwarzer Fleck mit weißem Rand über der Brustflosse. „Läuft“ mit den Flossen über das Riff.'],
  ['Bambushai', 'Chiloscyllium punctatum', 'Brownbanded bambooshark', 3, 'ammen', '1 m', '?', 'Südostasien', 'Schlanker Bodenhai, Jungtiere mit dunklen Querbändern. Beliebt in großen Aquarien.', ['Braungebänderter Bambushai']],
  ['Gelbbrauner Ammenhai', 'Nebrius ferrugineus', 'Tawny nurse shark', 3, 'ammen', '3,2 m', '?', 'Indopazifik', 'Einfarbig gelbbraun mit sichelförmigen Brustflossen, ruht tagsüber in Höhlen.', ['Indischer Ammenhai']],

  // ---------- Makrelenhaiartige ----------
  ['Weißer Hai', 'Carcharodon carcharias', 'Great white shark', 1, 'makrelen', '6 m', '2 t', 'Gemäßigte Küsten weltweit', 'Oben grau, unten weiß mit scharfer Grenze, kegelförmige Schnauze und schwarze Augen.', ['Weißhai', 'Großer Weißer Hai']],
  ['Kurzflossen-Mako', 'Isurus oxyrinchus', 'Shortfin mako shark', 1, 'makrelen', '4 m', '570 kg', 'Warme und gemäßigte Meere weltweit', 'Der schnellste Hai – über 60 km/h. Metallisch blau und springt meterhoch aus dem Wasser.', ['Mako', 'Makohai']],
  ['Langflossen-Mako', 'Isurus paucus', 'Longfin mako shark', 3, 'makrelen', '4,3 m', '?', 'Tropische Hochsee', 'Dunkler als sein schneller Verwandter, mit längeren Brustflossen und großen Augen.'],
  ['Heringshai', 'Lamna nasus', 'Porbeagle', 2, 'makrelen', '3,5 m', '230 kg', 'Nordatlantik (auch Nordsee) und Südhalbkugel', 'Kräftig gebaut, kann seinen Körper warm halten. Weißer Fleck am Ende der Rückenflosse.', ['Kalbfisch']],
  ['Lachshai', 'Lamna ditropis', 'Salmon shark', 3, 'makrelen', '3 m', '450 kg', 'Nordpazifik', 'Massiger Körper, hält sich im kalten Wasser warm und jagt Lachse.'],
  ['Riesenhai', 'Cetorhinus maximus', 'Basking shark', 1, 'makrelen', '10 m', '5 t', 'Gemäßigte Meere, auch vor Großbritannien', 'Der zweitgrößte Fisch. Schwimmt mit weit offenem Maul und riesigen Kiemenspalten und filtert Plankton.'],
  ['Riesenmaulhai', 'Megachasma pelagios', 'Megamouth shark', 2, 'makrelen', '5,5 m', '1,2 t', 'Warme Meere, Tiefsee', 'Riesiges Maul mit hellen, gummiartigen Lippen. Erst 1976 entdeckt und sehr selten gesehen.', ['Megamaulhai']],
  ['Fuchshai', 'Alopias vulpinus', 'Common thresher', 1, 'makrelen', '6 m', '350 kg', 'Weltweit', 'Der obere Teil der Schwanzflosse ist so lang wie der Körper – damit betäubt er Fische.', ['Drescherhai', 'Gemeiner Fuchshai']],
  ['Pelagischer Fuchshai', 'Alopias pelagicus', 'Pelagic thresher', 3, 'makrelen', '3,5 m', '?', 'Indopazifik', 'Extrem lange obere Schwanzflosse, schlanker und kleiner als seine Verwandten.'],
  ['Großaugen-Fuchshai', 'Alopias superciliosus', 'Bigeye thresher', 3, 'makrelen', '4,5 m', '?', 'Warme Meere weltweit', 'Riesige, nach oben gerichtete Augen und eine sehr lange Schwanzflosse.'],
  ['Sandtigerhai', 'Carcharias taurus', 'Sand tiger shark', 2, 'makrelen', '3,2 m', '160 kg', 'Warme Küsten weltweit', 'Die spitzen Zähne ragen auch bei geschlossenem Maul heraus. Schluckt Luft, um im Wasser zu schweben.', ['Sandtiger']],
  ['Schildzahnhai', 'Odontaspis ferox', 'Smalltooth sand tiger', 3, 'makrelen', '4,5 m', '?', 'Warme Meere, tiefere Gewässer', 'Ähnelt dem Sandtiger, hat aber größere Augen und lebt tiefer.'],
  ['Koboldhai', 'Mitsukurina owstoni', 'Goblin shark', 2, 'makrelen', '4 m', '210 kg', 'Tiefsee weltweit', 'Rosa Haut, lange flache Schnauze und ein Kiefer, der beim Zuschnappen weit nach vorne schnellt.'],
  ['Krokodilhai', 'Pseudocarcharias kamoharai', 'Crocodile shark', 4, 'makrelen', '1,1 m', '?', 'Tropische Hochsee', 'Kleiner Hochseehai mit riesigen Augen und langen, spitzen Zähnen.'],

  // ---------- Grundhaiartige ----------
  ['Tigerhai', 'Galeocerdo cuvier', 'Tiger shark', 1, 'grund', '5,5 m', '900 kg', 'Tropische und warme Meere', 'Dunkle Querstreifen (vor allem bei jungen Tieren), stumpfe Schnauze. Frisst fast alles – sogar Nummernschilder wurden im Magen gefunden.'],
  ['Bullenhai', 'Carcharhinus leucas', 'Bull shark', 1, 'grund', '3,5 m', '300 kg', 'Warme Küsten und Flüsse weltweit', 'Stämmig mit kurzer, stumpfer Schnauze. Kann auch im Süßwasser leben, z. B. im Amazonas.', ['Gemeiner Grundhai']],
  ['Blauhai', 'Prionace glauca', 'Blue shark', 1, 'grund', '3,8 m', '200 kg', 'Hochsee weltweit', 'Leuchtend blauer Rücken, sehr schlank, mit langen Brustflossen und spitzer Schnauze.'],
  ['Weißspitzen-Hochseehai', 'Carcharhinus longimanus', 'Oceanic whitetip shark', 2, 'grund', '3,5 m', '170 kg', 'Tropische Hochsee', 'Große, abgerundete Flossen mit weißen Spitzen, wie Paddel.', ['Hochseehai', 'Longimanus']],
  ['Schwarzspitzen-Riffhai', 'Carcharhinus melanopterus', 'Blacktip reef shark', 1, 'grund', '1,6 m', '14 kg', 'Riffe im Indopazifik', 'Die Rückenflosse hat eine schwarze Spitze und ragt oft aus knietiefem Wasser.'],
  ['Weißspitzen-Riffhai', 'Triaenodon obesus', 'Whitetip reef shark', 1, 'grund', '1,6 m', '18 kg', 'Riffe im Indopazifik', 'Weiße Spitzen an Rücken- und Schwanzflosse. Ruht tagsüber in Höhlen und jagt nachts.'],
  ['Grauer Riffhai', 'Carcharhinus amblyrhynchos', 'Grey reef shark', 2, 'grund', '2,5 m', '34 kg', 'Riffe im Indopazifik', 'Breiter schwarzer Saum an der Schwanzflosse. Droht mit gekrümmtem Rücken und gesenkten Flossen.'],
  ['Seidenhai', 'Carcharhinus falciformis', 'Silky shark', 2, 'grund', '3,3 m', '350 kg', 'Tropische Hochsee', 'Auffallend glatte, seidige Haut und eine eher kleine erste Rückenflosse.'],
  ['Schwarzspitzenhai', 'Carcharhinus limbatus', 'Blacktip shark', 2, 'grund', '2,5 m', '120 kg', 'Warme Küsten weltweit', 'Schwarze Flossenspitzen. Springt bei der Jagd aus dem Wasser und dreht sich dabei.'],
  ['Sandbankhai', 'Carcharhinus plumbeus', 'Sandbar shark', 2, 'grund', '2,5 m', '100 kg', 'Warme Küsten weltweit', 'Sehr hohe, dreieckige Rückenflosse, die weit vorne sitzt.', ['Braunhai']],
  ['Karibischer Riffhai', 'Carcharhinus perezi', 'Caribbean reef shark', 2, 'grund', '3 m', '70 kg', 'Karibik und Westatlantik', 'Der häufigste Riffhai in der Karibik. Kann bewegungslos in Höhlen liegen.'],
  ['Galápagoshai', 'Carcharhinus galapagensis', 'Galapagos shark', 3, 'grund', '3 m', '85 kg', 'Rund um ozeanische Inseln (z. B. Galápagos, Hawaii)', 'Grau mit hoher Rückenflosse, lebt fast nur rund um abgelegene Inseln.'],
  ['Schwarzhai', 'Carcharhinus obscurus', 'Dusky shark', 3, 'grund', '4 m', '350 kg', 'Warme Küsten weltweit', 'Groß und dunkelgrau, wächst sehr langsam und wandert weite Strecken.', ['Dunkler Hai']],
  ['Kupferhai', 'Carcharhinus brachyurus', 'Copper shark', 3, 'grund', '3,3 m', '300 kg', 'Gemäßigte Küsten, z. B. Südafrika', 'Bronzefarben schimmernder Rücken. Jagt beim „Sardine Run“ vor Südafrika.', ['Bronzehai']],
  ['Spinnerhai', 'Carcharhinus brevipinna', 'Spinner shark', 3, 'grund', '3 m', '90 kg', 'Warme Küsten weltweit', 'Spitze Schnauze, schwarze Flossenspitzen. Dreht sich beim Sprung mehrfach um sich selbst.'],
  ['Zitronenhai', 'Negaprion brevirostris', 'Lemon shark', 1, 'grund', '3,4 m', '180 kg', 'Warme Küsten von Atlantik und Ostpazifik', 'Gelblich-braune Haut und zwei fast gleich große Rückenflossen. Die Jungen wachsen in Mangroven auf.'],
  ['Großer Hammerhai', 'Sphyrna mokarran', 'Great hammerhead', 1, 'hammer', '6 m', '450 kg', 'Tropische Meere weltweit', 'Breiter Kopf mit fast gerader Vorderkante und eine sehr hohe, sichelförmige Rückenflosse.'],
  ['Bogenstirn-Hammerhai', 'Sphyrna lewini', 'Scalloped hammerhead', 2, 'hammer', '4,3 m', '150 kg', 'Tropische Meere weltweit', 'Die Vorderkante des Kopfes ist gebogen und hat in der Mitte eine Kerbe. Bildet riesige Schulen.', ['Gekerbter Hammerhai']],
  ['Glatter Hammerhai', 'Sphyrna zygaena', 'Smooth hammerhead', 3, 'hammer', '4 m', '400 kg', 'Gemäßigte Meere, auch Mittelmeer', 'Die Vorderkante des Kopfes ist gebogen, aber ohne Kerbe in der Mitte.'],
  ['Schaufelnasen-Hammerhai', 'Sphyrna tiburo', 'Bonnethead', 2, 'hammer', '1,5 m', '11 kg', 'Warme Küsten Amerikas', 'Kleiner, runder, schaufelförmiger Kopf. Frisst als einziger Hai auch Seegras.', ['Schaufelkopf-Hammerhai']],
  ['Flügelkopf-Hammerhai', 'Eusphyra blochii', 'Winghead shark', 3, 'hammer', '1,9 m', '?', 'Indopazifik', 'Extrem breiter Kopf – fast halb so breit, wie der Hai lang ist.'],
  ['Kleingefleckter Katzenhai', 'Scyliorhinus canicula', 'Small-spotted catshark', 1, 'grund', '0,8 m', '1,3 kg', 'Nordsee, Nordostatlantik, Mittelmeer', 'Der häufigste Hai in der Nordsee. Viele kleine dunkle Punkte, legt Eier in „Nixentäschchen“.', ['Katzenhai', 'Kleiner Katzenhai']],
  ['Großgefleckter Katzenhai', 'Scyliorhinus stellaris', 'Nursehound', 3, 'grund', '1,6 m', '?', 'Nordostatlantik, Mittelmeer', 'Größer und mit weniger, dafür größeren dunklen Flecken als sein häufiger Verwandter.'],
  ['Schwellhai', 'Cephaloscyllium ventriosum', 'Swellshark', 3, 'grund', '1 m', '?', 'Ostpazifik vor Kalifornien und Mexiko', 'Pumpt sich bei Gefahr mit Wasser auf das Doppelte auf und klemmt sich so in Felsspalten.', ['Ballonhai']],
  ['Pyjamahai', 'Poroderma africanum', 'Pyjama shark', 3, 'grund', '1 m', '?', 'Küsten Südafrikas', 'Dunkle Längsstreifen über den ganzen Körper – wie ein gestreifter Schlafanzug.', ['Gestreifter Katzenhai']],
  ['Hundshai', 'Galeorhinus galeus', 'School shark', 3, 'grund', '2 m', '45 kg', 'Gemäßigte Meere weltweit, auch Nordsee', 'Schlank, mit großem Endlappen an der Schwanzflosse. Kann über 50 Jahre alt werden.', ['Schulhai']],
  ['Glatthai', 'Mustelus mustelus', 'Common smooth-hound', 3, 'grund', '1,6 m', '?', 'Ostatlantik und Mittelmeer', 'Statt spitzer Zähne hat er flache Pflasterzähne, mit denen er Krebse knackt.', ['Gewöhnlicher Glatthai']],
  ['Leopardenhai', 'Triakis semifasciata', 'Leopard shark', 3, 'grund', '1,5 m', '18 kg', 'Küste Kaliforniens', 'Dunkle Sattelflecken und Punkte auf dem Rücken. Lebt in flachen Buchten.'],
  ['Schwarzmund-Katzenhai', 'Galeus melastomus', 'Blackmouth catshark', 3, 'grund', '0,9 m', '?', 'Nordostatlantik und Mittelmeer, Tiefsee', 'Das Maul ist innen ganz schwarz, der Körper mit dunklen Sattelflecken.', ['Fleckhai']],
  ['Atlantischer Scharfnasenhai', 'Rhizoprionodon terraenovae', 'Atlantic sharpnose shark', 3, 'grund', '1,1 m', '7 kg', 'Westatlantik', 'Kleiner Hai mit langer, spitzer Schnauze und kleinen weißen Flecken.', ['Scharfnasenhai']],
  ['Ganges-Hai', 'Glyphis gangeticus', 'Ganges shark', 4, 'grund', '2 m', '?', 'Ganges und Flüsse in Indien', 'Lebt im Süßwasser, hat winzige Augen und ist vom Aussterben bedroht.', ['Gangeshai']],
  ['Falscher Katzenhai', 'Pseudotriakis microdon', 'False catshark', 4, 'grund', '3 m', '?', 'Tiefsee weltweit', 'Sehr lange, niedrige Rückenflosse wie ein Kiel und weiche, schlaffe Haut.'],
];

const HAI_GRUPPEN = {
  grauhai:  'Hai – Grauhai-Verwandte (6–7 Kiemen)',
  dorn:     'Hai – Dornhaiartige',
  saege:    'Hai – Sägehai',
  engel:    'Hai – Engelhai',
  stier:    'Hai – Stierkopfhai',
  ammen:    'Hai – Ammenhaiartige',
  makrelen: 'Hai – Makrelenhaiartige',
  grund:    'Hai – Grundhaiartige',
  hammer:   'Hai – Hammerhai',
};

const HAIE = HAI_DATEN.map(([name, latin, wiki, lvl, gruppe, laenge, gewicht, gebiet, merkmal, auch = []]) => ({
  id: latin.toLowerCase().replace(/\s+/g, '-'),
  welt: 'haie', name, latin, wiki, lvl, gruppe, laenge, gewicht, gebiet, merkmal, auch,
}));
