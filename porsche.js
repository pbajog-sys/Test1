// Porsche-Serienmodelle mit ihren Generationen.
// Spalten: Name, Typ, Foto-Quellen, Stufe, Gruppe, Bauzeit, Baureihe, Motor & Leistung, Merkmal, weitere Namen.
// Foto-Quellen werden der Reihe nach probiert: 'en:'/'de:' = Wikipedia-Artikel, 'commons:' = Commons-Kategorie.
// Nur Quellen, die genau diese Generation zeigen – ein Sammelartikel über alle Generationen würde Fotos vermischen.
// Die Baureihe allein (z. B. „Cayenne“; mehrere mit / getrennt) zählt im Seepferdchen-Test voll, sonst einen halben Punkt.
// Das Merkmal darf den Namen nicht verraten. Neue Modelle bitte nur hinten anhängen (Challenge-Links).
const PORSCHE_DATEN = [
  // ---------- Klassiker ----------
  ['356', 'Typ 356', ['en:Porsche 356', 'commons:Category:Porsche 356'], 1, 'klassik', '1948–1965', '356',
    'Vierzylinder-Boxer im Heck, luftgekühlt, 40–130 PS', 'Das erste Serienauto der Marke: rundliche Form, eng verwandt mit dem VW Käfer.'],
  ['550 Spyder', 'Typ 550', ['en:Porsche 550', 'commons:Category:Porsche 550'], 2, 'klassik', '1953–1956', '550',
    'Vierzylinder-Boxer mit vier Nockenwellen in Mittellage, 110 PS', 'Kleiner, flacher, offener Rennsportwagen aus Aluminium. James Dean verunglückte 1955 in einem.'],
  ['912', 'Typ 912', ['en:Porsche 912', 'commons:Category:Porsche 912'], 3, 'klassik', '1965–1969 (und 1976)', '912',
    'Vierzylinder-Boxer im Heck, luftgekühlt, 90 PS', 'Sieht aus wie der frühe Elfer, hat aber nur vier Zylinder – die günstige Einstiegsversion.'],

  // ---------- 911 ----------
  ['911 Urmodell', 'Typ 901/911', ['de:Porsche 911 (Urmodell)', 'commons:Category:Porsche 911 (901)'], 2, 'p911', '1964–1973', '911',
    'Sechszylinder-Boxer im Heck, luftgekühlt, 110–210 PS', 'Schlanke Chrom-Stoßstangen ohne Faltenbälge, kleine Rückleuchten. Sollte zuerst eine andere Nummer tragen, die Peugeot aber für sich beanspruchte.', ['901', 'Urelfer', 'Ur-Elfer', 'F-Modell']],
  ['911 G-Modell', 'Typ 911 G-Serie', ['de:Porsche 911 G-Modell', 'de:Porsche 911 (G-Modell)', 'commons:Category:Porsche 911 G-Series'], 2, 'p911', '1973–1989', '911',
    'Sechszylinder-Boxer im Heck, luftgekühlt, 150–231 PS', 'Dicke Stoßstangen mit schwarzen Faltenbälgen wegen US-Aufprallvorschriften. Bekannt als SC und Carrera 3.2.', ['G-Modell', 'G-Serie', '911 G', '911 SC', 'Carrera 3.2']],
  ['911 Turbo (930)', 'Typ 930', ['en:Porsche 930', 'commons:Category:Porsche 930'], 2, 'p911', '1975–1989', '911',
    'Sechszylinder-Boxer mit Turbolader, 260–300 PS', 'Breit ausgestellte Kotflügel und ein riesiger Heckflügel. Berüchtigt für sein plötzlich einsetzendes Turbo.', ['930', '930 Turbo', '911 Turbo']],
  ['911 (964)', 'Typ 964', ['en:Porsche 964', 'commons:Category:Porsche 964'], 2, 'p911', '1989–1994', '911',
    'Sechszylinder-Boxer, luftgekühlt, 250–360 PS', 'Glatte, angeformte Stoßstangen statt Faltenbälgen; erstmals mit Allrad und automatisch ausfahrendem Heckspoiler.', ['964']],
  ['911 (993)', 'Typ 993', ['en:Porsche 993', 'commons:Category:Porsche 993'], 2, 'p911', '1993–1998', '911',
    'Sechszylinder-Boxer, luftgekühlt, 272–450 PS', 'Der letzte luftgekühlte Elfer: flach liegende Scheinwerfer und breite, weich geschwungene Hüften.', ['993']],
  ['911 (996)', 'Typ 996', ['en:Porsche 996', 'commons:Category:Porsche 996'], 2, 'p911', '1997–2006', '911',
    'Sechszylinder-Boxer, erstmals wassergekühlt, 300–483 PS', 'Erster wassergekühlter Elfer. Umstrittene „Spiegelei“-Scheinwerfer mit eingebauten Blinkern.', ['996']],
  ['911 (997)', 'Typ 997', ['en:Porsche 997', 'commons:Category:Porsche 997'], 2, 'p911', '2004–2012', '911',
    'Sechszylinder-Boxer, wassergekühlt, 325–620 PS', 'Wieder runde, ovale Scheinwerfer; die Blinker sitzen separat in der Frontschürze.', ['997']],
  ['911 (991)', 'Typ 991', ['en:Porsche 991', 'commons:Category:Porsche 991'], 2, 'p911', '2011–2019', '911',
    'Sechszylinder-Boxer, ab 2015 meist mit Turbo, 350–700 PS', 'Längerer Radstand, flache schmale Rückleuchten; ab 2015 auch die Grundversion mit Turbomotor.', ['991']],
  ['911 (992)', 'Typ 992', ['en:Porsche 992', 'commons:Category:Porsche 992'], 1, 'p911', 'seit 2019', '911',
    'Sechszylinder-Boxer mit Turbo, seit 2024 auch Hybrid, 385–711 PS', 'Durchgehendes Leuchtband über die ganze Heckbreite und versenkte Türgriffe.', ['992']],

  // ---------- Transaxle (Frontmotor) ----------
  ['924', 'Typ 924', ['en:Porsche 924', 'commons:Category:Porsche 924'], 1, 'transaxle', '1976–1988', '924',
    'Vierzylinder-Reihenmotor vorne, 125–177 PS', 'Ursprünglich für VW entwickelt: Frontmotor, Klappscheinwerfer und eine große gewölbte Glas-Heckklappe.'],
  ['944', 'Typ 944', ['en:Porsche 944', 'commons:Category:Porsche 944'], 1, 'transaxle', '1982–1991', '944',
    'Vierzylinder-Reihenmotor vorne, 163–250 PS', 'Wie sein schmaler Vorgänger, aber mit breit ausgestellten Kotflügeln und kräftigerem Motor.'],
  ['968', 'Typ 968', ['en:Porsche 968', 'commons:Category:Porsche 968'], 2, 'transaxle', '1991–1995', '968',
    '3,0-Liter-Vierzylinder vorne, 240–305 PS', 'Klappscheinwerfer, die auch eingeklappt sichtbar bleiben – im Look des großen V8-Bruders.'],
  ['928', 'Typ 928', ['en:Porsche 928', 'commons:Category:Porsche 928'], 1, 'transaxle', '1977–1995', '928',
    'V8 vorne, 240–350 PS', 'Großer Gran Turismo mit V8 und runden Scheinwerfern, die sich nach oben aufstellen. Sollte einst den Elfer ersetzen.'],

  // ---------- Mittelmotor ----------
  ['914', 'Typ 914', ['en:Porsche 914', 'commons:Category:Porsche 914'], 1, 'mittel', '1969–1976', '914',
    'Vier- oder Sechszylinder in Mittellage, 80–110 PS', 'Kantiger Targa mit Klappscheinwerfern und herausnehmbarem Dachteil, gemeinsam mit VW entwickelt.', ['VW-Porsche', 'VW-Porsche 914', '914/6']],
  ['Boxster (986)', 'Typ 986', ['en:Porsche Boxster (986)', 'commons:Category:Porsche Boxster (986)'], 2, 'mittel', '1996–2004', 'Boxster',
    'Sechszylinder-Boxer in Mittellage, 204–264 PS', 'Der Roadster, der die Firma in den 90ern rettete. Teilt sich die „Spiegelei“-Scheinwerfer mit dem damaligen Elfer.', ['986']],
  ['Boxster/Cayman (987)', 'Typ 987', ['en:Porsche Boxster and Cayman (987)', 'commons:Category:Porsche 987'], 3, 'mittel', '2004–2012', 'Boxster/Cayman',
    'Sechszylinder-Boxer in Mittellage, 240–330 PS', 'Ovale Scheinwerfer; zum offenen Roadster kommt erstmals ein Coupé mit großer gewölbter Heckklappe.', ['987', 'Boxster (987)', 'Cayman (987)']],
  ['Boxster/Cayman (981)', 'Typ 981', ['en:Porsche Boxster and Cayman (981)', 'commons:Category:Porsche 981'], 3, 'mittel', '2012–2016', 'Boxster/Cayman',
    'Sechszylinder-Boxer in Mittellage, 265–385 PS', 'Längerer Radstand, große Lufteinlässe vor den Hinterrädern und eine Spoilerlippe zwischen den Rückleuchten.', ['981', 'Boxster (981)', 'Cayman (981)']],
  ['718 Boxster/Cayman', 'Typ 982', ['en:Porsche Boxster and Cayman (982)', 'commons:Category:Porsche 982', 'de:Porsche 982'], 1, 'mittel', 'seit 2016', 'Boxster/Cayman',
    'Vierzylinder-Boxer mit Turbo, als GTS/GT4 Sechszylinder, 300–500 PS', 'Benannt nach einem Rennwagen der 1950er. Schwarzes Band mit Schriftzug zwischen den Rückleuchten.', ['982', '718', '718 Boxster', '718 Cayman']],

  // ---------- Supersportwagen ----------
  ['959', 'Typ 959', ['en:Porsche 959', 'commons:Category:Porsche 959'], 1, 'super', '1986–1988', '959',
    'Sechszylinder-Boxer mit zwei Turboladern, Allrad, 450 PS', 'Technik-Wunder der 80er mit Kevlar-Karosserie – damals das schnellste Serienauto der Welt.'],
  ['Carrera GT', 'Typ 980', ['en:Porsche Carrera GT', 'commons:Category:Porsche Carrera GT'], 1, 'super', '2004–2007', 'Carrera GT',
    'V10-Saugmotor in Mittellage, 612 PS', 'Carbon-Supersportwagen mit Handschaltung, Holz-Schaltknauf und abnehmbaren Dachhälften.', ['CGT', '980']],
  ['918 Spyder', 'Typ 918', ['en:Porsche 918 Spyder', 'commons:Category:Porsche 918 Spyder'], 1, 'super', '2013–2015', '918',
    'V8 in Mittellage plus zwei Elektromotoren (Plug-in-Hybrid), 887 PS', 'Streng limitierter Hybrid-Supersportwagen; die Auspuffrohre zeigen oben aus dem Heck.', ['918']],

  // ---------- SUV ----------
  ['Cayenne (9PA)', 'Typ 9PA', ['commons:Category:Porsche Cayenne (9PA)', 'de:Porsche Cayenne (9PA)', 'de:Porsche 9PA'], 3, 'suv', '2002–2010', 'Cayenne',
    'V6, V8 oder V8-Turbo, auch Diesel, 250–550 PS', 'Das erste SUV der Marke, gemeinsam mit dem VW Touareg entwickelt. Wurde zum Verkaufsschlager.', ['9PA', 'E1']],
  ['Cayenne (92A)', 'Typ 92A', ['commons:Category:Porsche Cayenne (92A)', 'de:Porsche Cayenne (92A)', 'de:Porsche 92A'], 3, 'suv', '2010–2017', 'Cayenne',
    'V6, V8, Diesel und erstmals Hybrid, 300–570 PS', 'Leichter und flacher als der Vorgänger, Scheinwerfer im Stil der großen Limousine.', ['92A', 'E2']],
  ['Cayenne (9YA)', 'Typ 9YA', ['commons:Category:Porsche Cayenne (9YA)', 'de:Porsche Cayenne (9YA)', 'de:Porsche 9YA'], 1, 'suv', 'seit 2017', 'Cayenne',
    'V6, V8 und Plug-in-Hybrid, 340–740 PS', 'Durchgehendes Leuchtband am Heck, auch als Coupé mit flach abfallendem Dach.', ['9YA', 'E3']],
  ['Macan (95B)', 'Typ 95B', ['commons:Category:Porsche Macan (95B)', 'de:Porsche Macan (95B)', 'de:Porsche 95B'], 1, 'suv', '2014–2024', 'Macan',
    'Vierzylinder oder V6 mit Turbo, 252–440 PS', 'Kompakt-SUV auf Basis des Audi Q5; die Motorhaube umschließt die Kotflügel wie eine Muschel.', ['95B']],
  ['Macan Electric', 'Typ XAB', ['commons:Category:Porsche Macan Electric', 'de:Porsche Macan Electric', 'en:Porsche Macan Electric'], 4, 'suv', 'seit 2024', 'Macan',
    'Zwei Elektromotoren, 360–639 PS', 'Elektro-SUV ohne Kühlergrill, mit flachen, geteilten Scheinwerfern.', ['Macan EV', 'Macan 4 Electric']],

  // ---------- Limousinen ----------
  ['Panamera (970)', 'Typ 970', ['commons:Category:Porsche Panamera (970)', 'de:Porsche Panamera (970)', 'de:Porsche 970'], 3, 'limo', '2009–2016', 'Panamera',
    'V6, V8, Diesel und Hybrid, 300–570 PS', 'Erste viertürige Sportlimousine der Marke – rundliches, stark abfallendes Heck mit ausfahrendem Spoiler.', ['970']],
  ['Panamera (971)', 'Typ 971', ['commons:Category:Porsche Panamera (971)', 'de:Porsche Panamera (971)', 'de:Porsche 971'], 1, 'limo', '2016–2023', 'Panamera',
    'V6, V8 und Plug-in-Hybrid, 330–700 PS', 'Flacheres, gestrecktes Heck mit Leuchtband; auch als Kombi „Sport Turismo“.', ['971']],
  ['Panamera (976)', 'Typ 976', ['commons:Category:Porsche Panamera (976)', 'de:Porsche Panamera (976)', 'de:Porsche 976'], 4, 'limo', 'seit 2023', 'Panamera',
    'V6, V8 und Plug-in-Hybrid, 353–782 PS', 'Dritte Generation der Sportlimousine; Hybridantrieb in den meisten Versionen.', ['976']],
  ['Taycan', 'Typ J1', ['en:Porsche Taycan', 'commons:Category:Porsche Taycan'], 1, 'limo', 'seit 2019', 'Taycan',
    'Zwei Elektromotoren, 800-Volt-Technik, 408–1034 PS', 'Erstes Elektroauto der Marke. Scheinwerfer mit je vier LED-Punkten.', ['J1']],
];

const PORSCHE_GRUPPEN = {
  klassik:   'Porsche – Klassiker',
  p911:      'Porsche – 911 (Heckmotor)',
  transaxle: 'Porsche – Frontmotor (Transaxle)',
  mittel:    'Porsche – Mittelmotor',
  super:     'Porsche – Supersportwagen',
  suv:       'Porsche – SUV',
  limo:      'Porsche – Limousine',
};

// Weitere Namen, die für eine Baureihe gelten
const REIHEN_NAMEN = { '911': ['Elfer', 'Neunelfer'] };

const PORSCHE = PORSCHE_DATEN.map(([name, typ, quellen, lvl, gruppe, bauzeit, reihe, motor, merkmal, auch = []]) => ({
  id: 'porsche-' + typ.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^typ-/, ''),
  welt: 'porsche', name, latin: typ, quellen, lvl, gruppe, bauzeit, motor, merkmal, auch,
  reihen: reihe.split('/').flatMap((r) => [r, ...(REIHEN_NAMEN[r] || [])]),
}));
