# Erzeugt karten-daten.js aus Natural-Earth-TopoJSON (world-atlas, ISC): projizierte, beschnittene, vereinfachte SVG-Pfade.
import json, math, sys
# Quelle: npm-Paket world-atlas@2.0.2 (npm pack world-atlas@2.0.2 && tar xzf …) – Pfad zum entpackten Ordner
SRC = sys.argv[2] if len(sys.argv) > 2 else 'package/'
def topo_lade(datei):
    t = json.load(open(SRC + datei))
    sc, tr = t['transform']['scale'], t['transform']['translate']
    arcs = []
    for a in t['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy
            pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
        arcs.append(pts)
    def ring(idx):
        out = []
        for i in idx:
            pts = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(pts if not out else pts[1:])
        return out
    laender = []
    for g in t['objects']['countries']['geometries']:
        if g.get('type') == 'Polygon': polys = [g['arcs']]
        elif g.get('type') == 'MultiPolygon': polys = g['arcs']
        else: continue
        laender.append((g.get('properties', {}).get('name', ''), [[ring(r) for r in p] for p in polys]))
    return laender

def clip(ring, x0, y0, x1, y1):   # Sutherland–Hodgman gegen Rechteck
    def schneide(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a): out.append(inter(a, b))
        return out
    def ix(xc):
        return lambda a, b: (xc, a[1] + (b[1] - a[1]) * (xc - a[0]) / ((b[0] - a[0]) or 1e-12))
    def iy(yc):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (yc - a[1]) / ((b[1] - a[1]) or 1e-12), yc)
    pts = ring
    for inside, inter in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)), (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not pts: break
        pts = schneide(pts, inside, inter)
    return pts

def dp(pts, tol):   # Douglas–Peucker
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        ax, ay = pts[s]; bx, by = pts[e]; dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1e-12
        best, bi = -1, -1
        for i in range(s + 1, e):
            d = abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / L
            if d > best: best, bi = d, i
        if best > tol: keep[bi] = True; stack += [(s, bi), (bi, e)]
    return [p for p, k in zip(pts, keep) if k]

KARTEN = {
  'deutschland': dict(datei='countries-10m.json', lon=(5.2, 15.8), lat=(46.9, 55.4), phi0=51.2, breite=1000, tol=0.9, heim='Germany'),
  'europa': dict(datei='countries-50m.json', lon=(-25, 45), lat=(34, 71.5), phi0=52, breite=1000, tol=0.8),
  'welt': dict(datei='countries-50m.json', lon=(-180, 180), lat=(-58, 80), phi0=0, breite=1000, tol=0.7),
}
ergebnis = {}
for name, k in KARTEN.items():
    laender = topo_lade(k['datei'])
    c = math.cos(math.radians(k['phi0']))
    skala = k['breite'] / ((k['lon'][1] - k['lon'][0]) * c)
    hoehe = (k['lat'][1] - k['lat'][0]) * skala
    P = lambda lon, lat: ((lon - k['lon'][0]) * c * skala, (k['lat'][1] - lat) * skala)
    pfade = []; heim = ''
    for lname, polys in laender:
        d = []
        for poly in polys:
            for r in poly:
                # Längengrade fortlaufend machen (Sprung bei ±180° auflösen), dann projizieren
                lr = [r[0]]; vs = 0
                for (la0, _), (la1, b1) in zip(r, r[1:]):
                    if la1 - la0 > 180: vs -= 360
                    elif la1 - la0 < -180: vs += 360
                    lr.append((la1 + vs, b1))
                pr = [P(lo, la) for lo, la in lr]
                # Ringe über die Datumsgrenze: Sprünge auflösen und den Teil jenseits des Randes zusätzlich verschoben zeichnen
                kopien = [pr]
                if name == 'welt':
                    ab = [pr[0]]; versatz = 0
                    for (xa, ya), (xb, yb) in zip(pr, pr[1:]):
                        if xb - xa > 500: versatz -= 1000
                        elif xb - xa < -500: versatz += 1000
                        ab.append((xb + versatz, yb))
                    if any(abs(x - y[0]) > 1e-9 for x, y in zip([p[0] for p in ab], pr)):
                        kopien = [ab, [(x + 1000, y) for x, y in ab], [(x - 1000, y) for x, y in ab]]
                for pr in kopien:
                  pr = clip(pr, -2, -2, k['breite'] + 2, hoehe + 2)
                  if len(pr) < 3: continue
                  mid = len(pr) // 2   # geschlossenen Ring in zwei Hälften vereinfachen
                  pr = dp(pr[:mid + 1], k['tol']) + dp(pr[mid:] + [pr[0]], k['tol'])[1:]
                  if len(pr) < 4: continue
                  xs = [p[0] for p in pr]; ys = [p[1] for p in pr]
                  if (max(xs) - min(xs)) < 1.5 and (max(ys) - min(ys)) < 1.5: continue
                  d.append('M' + 'L'.join('%g %g' % (round(x, 1), round(y, 1)) for x, y in pr[:-1]) + 'Z')
        if not d: continue
        s = ''.join(d)
        if k.get('heim') == lname: heim = s
        else: pfade.append(s)
    ergebnis[name] = dict(lon0=k['lon'][0], lat1=k['lat'][1], phi0=k['phi0'], skala=round(skala, 6), b=k['breite'], h=round(hoehe, 1), land=''.join(pfade), heim=heim)
    print(name, 'Länder', len(pfade), 'Zeichen', len(ergebnis[name]['land']) + len(heim), 'Höhe', round(hoehe), file=sys.stderr)
with open(sys.argv[1], 'w') as f:
    f.write('// Kartendaten für „Karten-Gefühl“ – erzeugt aus Natural Earth (gemeinfrei) über world-atlas (ISC, © Mike Bostock).\n')
    f.write('// Projektion: x = (lon − lon0)·cos(phi0)·skala, y = (lat1 − lat)·skala. Nicht von Hand bearbeiten.\n')
    f.write('const KARTEN_DATEN = ' + json.dumps(ergebnis, separators=(',', ':')) + ';\n')
