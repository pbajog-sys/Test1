# Bilder für „Wer war's?“

**Stand:** Die 10 Porträts und das Icon-Set sind eingebaut (aus den beiden generierten Sheets zugeschnitten).
Die Prompts unten sind nur noch für neue Figuren oder ein Titelbild.

Generieren (z. B. mit ChatGPT), dann hier in diesen Ordner hochladen (Branch `wal-quiz`).
Claude schneidet sie zu, verkleinert sie auf .webp und schaltet sie in `krimi-grafik.js` frei (`KRIMI_PORTRAETS`).
Bis dahin zeigt das Spiel Spielsteine mit Monogramm.

## 1. Figuren-Sheet (Pflicht)
Dateiname: `figuren.png`

```
A 3x3 character sheet of nine stylized portrait busts for a cozy murder-mystery puzzle game set in a 1920s English country villa. Same art style for all nine: flat vector illustration with subtle grain texture, film-noir mood, warm candle light from the side, limited palette of deep burgundy, cream, ochre and charcoal, clean bold shapes, friendly and slightly humorous (suitable for kids, no blood, no weapons).
Each portrait: head and shoulders, centered, facing the viewer at a slight 3/4 angle, filling about 80% of its cell, on a plain solid background in that character's signature color, so it can be cropped into a circle. Equal-sized cells, thin even gaps, no borders, no text, no letters, no numbers.
Row 1: (1) a tall, stern butler with slicked-back dark hair, black tailcoat, white bow tie – background charcoal #2a2a33. (2) a cheerful plump cook with a white chef's hat, rosy cheeks, flour on her apron – background ochre #e8a33c. (3) an elderly gardener with a straw hat, grey stubble, green overalls, a sprig of leaves behind his ear – background green #3d7f45.
Row 2: (4) a young painter woman with a beret, paint smudge on her cheek, curly red hair – background magenta #c2457a. (5) a serious doctor with round spectacles, grey moustache, stethoscope, tweed waistcoat – background teal #2f7f8f. (6) a nosy old aunt with a pearl necklace, purple feathered hat, lorgnette – background violet #7a52b3.
Row 3: (7) a weathered sea captain with a white beard, navy captain's cap with gold anchor, pea coat – background navy #2f4f8f. (8) a glamorous jazz singer woman with a 1920s finger-wave bob, sequined dress, feather headband – background crimson #a3243b. (9) a surprised elderly lord with a monocle, grey mutton chops, smoking jacket, looking shocked with wide eyes (he is the victim, comedic not scary) – background cream #f5f0e6.
High resolution, square image.
```

Reihenfolge = Butler Bruno, Köchin Klara, Gärtner Gustav, Malerin Mia, Doktor Dietrich, Tante Trude, Kapitän Hannes, Sängerin Sophie, Lord Lennart.

## 2. Titelbild (optional – sonst bleibt die gezeichnete Villa)
Dateiname: `titel.png`

```
Wide cinematic illustration for the title screen of a cozy murder-mystery puzzle game: a 1920s English country villa at night on a hill, seen from the front, full moon behind it, all windows dark except one warmly lit window on the ground floor with the silhouette of a person behind the curtain. Flat vector style with subtle grain, film-noir mood, palette of deep charcoal, burgundy, cream and warm amber light. Mysterious but friendly, suitable for kids, no blood. Lots of dark empty sky at the top. No text, no letters. Aspect ratio 16:9.
```
