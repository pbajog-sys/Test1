# Slowenische Formen: nach Regeln erzeugen und gegen echte Belege prüfen (UD SSJ + UniMorph).
# Ausgabe je Wort: Formen + je Zelle eine Kennung: 'b' = im Korpus belegt, 'u' = aus UniMorph (Wiktionary),
# 'r' = sichere Regel (keine Stammveränderung), None = unsicher (wird nicht abgefragt).
import json, collections, unicodedata, re, sys

KASUS = ['Nom', 'Gen', 'Dat', 'Acc', 'Loc', 'Ins']
ZAHL = ['Sing', 'Dual', 'Plur']
UM_K = {'NOM': 'Nom', 'GEN': 'Gen', 'DAT': 'Dat', 'ACC': 'Acc', 'ESS': 'Loc', 'INS': 'Ins'}
UM_Z = {'SG': 'Sing', 'DU': 'Dual', 'PL': 'Plur'}
UM_G = {'MASC': 'Masc', 'FEM': 'Fem', 'NEUT': 'Neut'}
WEICH = ('c', 'č', 'š', 'ž', 'j')
VOKAL = set('aeiou')

def ohne_akzent(t):
    t = unicodedata.normalize('NFD', t)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn' or c in ('̌',))  # Hatschek (č š ž) bleibt
    return unicodedata.normalize('NFC', t)

def feats(s):
    return dict(x.split('=', 1) for x in s.split('|') if '=' in x)

# ---------- Daten laden ----------
UD = json.load(open('ud.json'))
UM = collections.defaultdict(dict)  # lemma -> {(pos, key): set(forms)}
for l in open('slv', encoding='utf8'):
    p = l.rstrip('\n').split('\t')
    if len(p) < 3: continue
    lem, form, tag = p[0], ohne_akzent(p[1]).lower(), p[2].split(';')
    pos = tag[0]
    if pos == 'N':
        k = next((UM_K[t] for t in tag if t in UM_K), None); z = next((UM_Z[t] for t in tag if t in UM_Z), None)
        if k and z: UM[lem].setdefault(('N', k, z), set()).add(form)
    elif pos == 'ADJ':
        k = next((UM_K[t] for t in tag if t in UM_K), None); z = next((UM_Z[t] for t in tag if t in UM_Z), None); g = next((UM_G[t] for t in tag if t in UM_G), None)
        if k and z and g and 'CMPR' not in tag and 'SPRL' not in tag:
            UM[lem].setdefault(('A', g, k, z, 'DEF' if 'DEF' in tag else ''), set()).add(form)

def belege(lem, up):
    """UD: Merkmalsbündel -> Formen (mit Anzahl)."""
    e = UD.get(lem + '|' + up)
    if not e: return []
    out = []
    for ft, fs in e['f'].items():
        for f, c in fs.items(): out.append((feats(ft), f.lower(), c))
    return out

# ---------- Nomen ----------
def fluechtig(s):
    """pes -> ps, konec -> konc, teden -> tedn, misel -> misl (Flüchtiges e/a vor dem letzten Konsonanten)."""
    m = re.match(r'^(.*[^aeiou])([ea])([^aeiou])$', s)
    return m.group(1) + m.group(3) if m else None

def nomen_formen(lem, g, stamm, belebt, ext=None):
    F = {}
    if g == 'Masc':
        w = stamm.endswith(WEICH) or stamm.endswith(('lj', 'nj'))
        o = 'e' if w else 'o'
        sp = stamm + ext if ext else stamm  # Dual/Plural-Stamm (sinov-)
        F[('Nom', 'Sing')] = lem; F[('Gen', 'Sing')] = stamm + 'a'; F[('Dat', 'Sing')] = stamm + 'u'
        F[('Acc', 'Sing')] = stamm + 'a' if belebt else lem; F[('Loc', 'Sing')] = stamm + 'u'; F[('Ins', 'Sing')] = stamm + o + 'm'
        o2 = 'o' if ext else o
        F[('Nom', 'Dual')] = sp + 'a'; F[('Gen', 'Dual')] = (stamm + 'ov' if ext else stamm + o + 'v'); F[('Dat', 'Dual')] = sp + o2 + 'ma'; F[('Acc', 'Dual')] = sp + 'a'; F[('Loc', 'Dual')] = sp + 'ih'; F[('Ins', 'Dual')] = sp + o2 + 'ma'
        F[('Nom', 'Plur')] = sp + 'i'; F[('Gen', 'Plur')] = (stamm + 'ov' if ext else stamm + o + 'v'); F[('Dat', 'Plur')] = sp + o2 + 'm'; F[('Acc', 'Plur')] = sp + 'e'; F[('Loc', 'Plur')] = sp + 'ih'; F[('Ins', 'Plur')] = sp + 'i'
    elif g == 'Fem' and lem.endswith('a'):
        F = {('Nom', 'Sing'): lem, ('Gen', 'Sing'): stamm + 'e', ('Dat', 'Sing'): stamm + 'i', ('Acc', 'Sing'): stamm + 'o', ('Loc', 'Sing'): stamm + 'i', ('Ins', 'Sing'): stamm + 'o',
             ('Nom', 'Dual'): stamm + 'i', ('Gen', 'Dual'): stamm, ('Dat', 'Dual'): stamm + 'ama', ('Acc', 'Dual'): stamm + 'i', ('Loc', 'Dual'): stamm + 'ah', ('Ins', 'Dual'): stamm + 'ama',
             ('Nom', 'Plur'): stamm + 'e', ('Gen', 'Plur'): stamm, ('Dat', 'Plur'): stamm + 'am', ('Acc', 'Plur'): stamm + 'e', ('Loc', 'Plur'): stamm + 'ah', ('Ins', 'Plur'): stamm + 'ami'}
    elif g == 'Fem':  # i-Deklination: stvar, noč, pesem
        F = {('Nom', 'Sing'): lem, ('Gen', 'Sing'): stamm + 'i', ('Dat', 'Sing'): stamm + 'i', ('Acc', 'Sing'): lem, ('Loc', 'Sing'): stamm + 'i', ('Ins', 'Sing'): stamm + ('jo' if stamm == lem else 'ijo'),
             ('Nom', 'Dual'): stamm + 'i', ('Gen', 'Dual'): stamm + 'i', ('Dat', 'Dual'): stamm + 'ema', ('Acc', 'Dual'): stamm + 'i', ('Loc', 'Dual'): stamm + 'eh', ('Ins', 'Dual'): stamm + 'ema',
             ('Nom', 'Plur'): stamm + 'i', ('Gen', 'Plur'): stamm + 'i', ('Dat', 'Plur'): stamm + 'em', ('Acc', 'Plur'): stamm + 'i', ('Loc', 'Plur'): stamm + 'eh', ('Ins', 'Plur'): stamm + 'mi'}
        if stamm != lem:  # pesem, misel, bolezen: Bindevokal i
            F.update({('Dat', 'Dual'): stamm + 'ima', ('Loc', 'Dual'): stamm + 'ih', ('Ins', 'Dual'): stamm + 'ima', ('Dat', 'Plur'): stamm + 'im', ('Loc', 'Plur'): stamm + 'ih', ('Ins', 'Plur'): stamm + 'imi'})
    elif g == 'Neut':
        w = stamm.endswith(WEICH) or stamm.endswith(('lj', 'nj'))
        o = 'e' if w else 'o'
        F = {('Nom', 'Sing'): lem, ('Gen', 'Sing'): stamm + 'a', ('Dat', 'Sing'): stamm + 'u', ('Acc', 'Sing'): lem, ('Loc', 'Sing'): stamm + 'u', ('Ins', 'Sing'): stamm + o + 'm',
             ('Nom', 'Dual'): stamm + 'i', ('Gen', 'Dual'): stamm, ('Dat', 'Dual'): stamm + o + 'ma', ('Acc', 'Dual'): stamm + 'i', ('Loc', 'Dual'): stamm + 'ih', ('Ins', 'Dual'): stamm + o + 'ma',
             ('Nom', 'Plur'): stamm + 'a', ('Gen', 'Plur'): stamm, ('Dat', 'Plur'): stamm + o + 'm', ('Acc', 'Plur'): stamm + 'a', ('Loc', 'Plur'): stamm + 'ih', ('Ins', 'Plur'): stamm + 'i'}
    return F

def nomen(lem):
    B = [(f, form, c) for f, form, c in belege(lem, 'NOUN') if f.get('Case') in KASUS and f.get('Number') in ZAHL]
    if not B: return None
    gs = collections.Counter(f.get('Gender') for f, _, _ in B)
    g = gs.most_common(1)[0][0]
    if g not in ('Masc', 'Fem', 'Neut'): return None
    if any(f.get('Number') != 'Plur' for f, _, _ in B) is False: return None  # nur Plural (vrata, usta)
    belebt = any(f.get('Animacy') == 'Anim' for f, _, _ in B)
    att = collections.defaultdict(collections.Counter)
    for f, form, c in B: att[(f['Case'], f['Number'])][form] += c
    um = {(k, z): fs for (p, k, z), fs in ((key, v) for key, v in UM.get(lem, {}).items() if key[0] == 'N')} if lem in UM else {}
    um = {}
    for key, v in UM.get(lem, {}).items():
        if key[0] == 'N': um[(key[1], key[2])] = v
    # Stammkandidaten
    basis = lem[:-1] if lem[-1] in 'aoe' and (g != 'Masc' or lem[-1] in 'oe') else lem
    kand = {basis}
    fl = fluechtig(lem if g in ('Masc',) or (g == 'Fem' and not lem.endswith('a')) else basis)
    if fl: kand.add(fl)
    if g == 'Masc': kand |= {basis + 'j'} | ({fl + 'j'} if fl else set())
    if g == 'Neut': kand |= {lem + 'n', lem + 't', basis + 'es'}
    beste = None
    for st in kand:
        for ext in ([None, 'ov', 'ev'] if g == 'Masc' else [None]):
            F = nomen_formen(lem, g, st, belebt, ext)
            treffer = sum(c for cell, fs in att.items() for form, c in fs.items() if F.get(cell) == form)
            fehler = sum(c for cell, fs in att.items() for form, c in fs.items() if F.get(cell) != form)
            um_t = sum(1 for cell, fs in um.items() if F.get(cell) in fs); um_f = sum(1 for cell, fs in um.items() if F.get(cell) not in fs)
            wert = (treffer - 3 * fehler) + 2 * (um_t - 3 * um_f)
            if not beste or wert > beste[0]: beste = (wert, st, ext, F, fehler, um_f)
    _, st, ext, F, fehler, um_f = beste
    # Zellen einzeln auflösen: Belegtes gewinnt (bratje, iger, oken, ljudje), UniMorph bestätigt, sonst Regel – wo riskant: offen
    kenn = {}; ueber = set()
    for cell in list(F):
        a = att.get(cell); regel = F[cell]
        if a:
            tot = sum(a.values()); f_a, n_a = a.most_common(1)[0]
            if n_a / tot >= 0.6 and (tot >= 2 or f_a == regel or (cell in um and f_a in um[cell])):
                if f_a != regel: ueber.add(cell[1]); F[cell] = f_a
                kenn[cell] = 'b'
            else: kenn[cell] = None
        elif cell in um and not (g == 'Masc' and cell == ('Acc', 'Sing') and belebt):
            kenn[cell] = 'u' if regel in um[cell] else None
        else:
            riskant = cell[0] == 'Gen' and cell[1] != 'Sing' and g in ('Fem', 'Neut') and len(st) > 1 and st[-1] not in VOKAL and st[-2] not in VOKAL and lem.endswith(('a', 'o', 'e'))
            kenn[cell] = None if riskant else 'r'
    # Gen. Dual = Gen. Plural (gleiche Form) – Beleg des einen gilt für den anderen
    for z1, z2 in (('Dual', 'Plur'), ('Plur', 'Dual')):
        if kenn.get(('Gen', z1)) == 'b' and kenn.get(('Gen', z2)) != 'b' and F[('Gen', z1)] != F[('Gen', z2)] and g != 'Masc':
            F[('Gen', z2)] = F[('Gen', z1)]; kenn[('Gen', z2)] = 'b'
    for cell in F:   # unregelmäßige Mehrzahl (ljudje): Ungelegtes derselben Zahl nicht abfragen
        if cell[1] in ueber and kenn[cell] == 'r': kenn[cell] = None
    regel_gen = nomen_formen(lem, g, st, belebt, ext)[('Gen', 'Sing')]
    stamm_ok = F[('Gen', 'Sing')] == regel_gen and kenn[('Gen', 'Sing')] in ('b', 'u', 'r')
    bestaetigt = sum(1 for c, k in kenn.items() if k in ('b', 'u') and c != ('Nom', 'Sing'))
    ok = stamm_ok and bestaetigt >= 2
    return {'l': lem, 'g': g, 'anim': belebt, 'stamm': st, 'ext': ext, 'F': {k[0] + '.' + k[1]: v for k, v in F.items()}, 'K': {k[0] + '.' + k[1]: v for k, v in kenn.items()}, 'ok': ok, 'konflikt': fehler}

# ---------- Adjektive ----------
def adj_formen(lem, stamm):
    def o_e(): return 'e' if stamm.endswith(WEICH) or stamm.endswith(('lj', 'nj')) else 'o'
    F = {}
    def s(g, k, z, f): F[g + '.' + k + '.' + z] = f
    s('Masc', 'Nom', 'Sing', lem); s('Masc', 'Gen', 'Sing', stamm + 'ega'); s('Masc', 'Dat', 'Sing', stamm + 'emu'); s('Masc', 'Loc', 'Sing', stamm + 'em'); s('Masc', 'Ins', 'Sing', stamm + 'im')
    s('Fem', 'Nom', 'Sing', stamm + 'a'); s('Fem', 'Gen', 'Sing', stamm + 'e'); s('Fem', 'Dat', 'Sing', stamm + 'i'); s('Fem', 'Acc', 'Sing', stamm + 'o'); s('Fem', 'Loc', 'Sing', stamm + 'i'); s('Fem', 'Ins', 'Sing', stamm + 'o')
    s('Neut', 'Nom', 'Sing', stamm + o_e()); s('Neut', 'Gen', 'Sing', stamm + 'ega'); s('Neut', 'Dat', 'Sing', stamm + 'emu'); s('Neut', 'Acc', 'Sing', stamm + o_e()); s('Neut', 'Loc', 'Sing', stamm + 'em'); s('Neut', 'Ins', 'Sing', stamm + 'im')
    for g in ('Masc', 'Fem', 'Neut'):
        s(g, 'Nom', 'Dual', stamm + ('a' if g == 'Masc' else 'i')); s(g, 'Acc', 'Dual', stamm + ('a' if g == 'Masc' else 'i'))
        s(g, 'Gen', 'Dual', stamm + 'ih'); s(g, 'Dat', 'Dual', stamm + 'ima'); s(g, 'Loc', 'Dual', stamm + 'ih'); s(g, 'Ins', 'Dual', stamm + 'ima')
        s(g, 'Nom', 'Plur', stamm + {'Masc': 'i', 'Fem': 'e', 'Neut': 'a'}[g]); s(g, 'Acc', 'Plur', stamm + {'Masc': 'e', 'Fem': 'e', 'Neut': 'a'}[g])
        s(g, 'Gen', 'Plur', stamm + 'ih'); s(g, 'Dat', 'Plur', stamm + 'im'); s(g, 'Loc', 'Plur', stamm + 'ih'); s(g, 'Ins', 'Plur', stamm + 'imi')
    return F

def adjektiv(lem):
    B = [(f, form, c) for f, form, c in belege(lem, 'ADJ') if f.get('Degree', 'Pos') == 'Pos' and f.get('Case') in KASUS and f.get('Number') in ZAHL and f.get('Gender') in ('Masc', 'Fem', 'Neut')]
    if not B: return None
    att = collections.defaultdict(collections.Counter)
    for f, form, c in B:
        if f['Gender'] == 'Masc' and f['Case'] in ('Nom', 'Acc') and f['Number'] == 'Sing': continue  # bestimmt/unbestimmt, belebt – nicht prüfen
        att[f['Gender'] + '.' + f['Case'] + '.' + f['Number']][form] += c
    um = {}
    for key, v in UM.get(lem, {}).items():
        if key[0] == 'A' and not key[4]: um[key[1] + '.' + key[2] + '.' + key[3]] = v
    kand = {lem[:-1]} if lem.endswith('i') else {lem}
    fl = fluechtig(lem)
    if fl and not lem.endswith('i'): kand.add(fl)
    beste = None
    for st in kand:
        F = adj_formen(lem, st)
        t = sum(c for cell, fs in att.items() for form, c in fs.items() if F.get(cell) == form)
        x = sum(c for cell, fs in att.items() for form, c in fs.items() if F.get(cell) != form)
        ut = sum(1 for cell, fs in um.items() if F.get(cell) in fs); ux = sum(1 for cell, fs in um.items() if F.get(cell) not in fs)
        w = t - 3 * x + 2 * (ut - 3 * ux)
        if not beste or w > beste[0]: beste = (w, st, F, x)
    _, st, F, x = beste
    K = {}
    for cell, form in F.items():
        if cell in ('Masc.Nom.Sing',): K[cell] = 'r'; continue
        a = att.get(cell, {})
        if cell in um: K[cell] = 'u' if form in um[cell] else ('b' if form in a else None)
        elif form in a: K[cell] = 'b'
        elif a: K[cell] = None
        else: K[cell] = 'r'
    bestaetigt = sum(1 for k in K.values() if k in ('b', 'u'))
    tok = sum(c for fs in att.values() for c in fs.values())
    if x: K = {c: (k if k in ('b', 'u') or c == 'Masc.Nom.Sing' else None) for c, k in K.items()}
    return {'l': lem, 'stamm': st, 'F': F, 'K': K, 'ok': bestaetigt >= 2 and x <= max(1, tok * 0.01), 'konflikt': x}

# ---------- Verben ----------
PERS = [('1', 'Sing'), ('2', 'Sing'), ('3', 'Sing'), ('1', 'Dual'), ('2', 'Dual'), ('3', 'Dual'), ('1', 'Plur'), ('2', 'Plur'), ('3', 'Plur')]
ATHEM = {'jesti': 'je', 'vedeti': 've', 'dati': 'da', 'iti': 'gre', 'povedati': 'pove'}
IRR = {
    'biti': {'praes': ['sem', 'si', 'je', 'sva', 'sta', 'sta', 'smo', 'ste', 'so'], 'lpart': ['bil', 'bila', 'bilo', 'bila', 'bili', 'bili', 'bili', 'bile', 'bila'], 'imp': 'bodi'},
    'iti': {'praes': ['grem', 'greš', 'gre', 'greva', 'gresta', 'gresta', 'gremo', 'greste', 'gredo'], 'lpart': ['šel', 'šla', 'šlo', 'šla', 'šli', 'šli', 'šli', 'šle', 'šla'], 'imp': 'pojdi'},
    'jesti': {'praes': ['jem', 'ješ', 'je', 'jeva', 'jesta', 'jesta', 'jemo', 'jeste', 'jedo'], 'lpart': ['jedel', 'jedla', 'jedlo', 'jedla', 'jedli', 'jedli', 'jedli', 'jedle', 'jedla'], 'imp': 'jej'},
    'vedeti': {'praes': ['vem', 'veš', 've', 'veva', 'vesta', 'vesta', 'vemo', 'veste', 'vedo'], 'lpart': ['vedel', 'vedela', 'vedelo', 'vedela', 'vedeli', 'vedeli', 'vedeli', 'vedele', 'vedela'], 'imp': 'vedi'},
    'dati': {'praes': ['dam', 'daš', 'da', 'dava', 'dasta', 'dasta', 'damo', 'daste', 'dajo'], 'lpart': ['dal', 'dala', 'dalo', 'dala', 'dali', 'dali', 'dali', 'dale', 'dala'], 'imp': 'daj'},
    'imeti': {'praes': ['imam', 'imaš', 'ima', 'imava', 'imata', 'imata', 'imamo', 'imate', 'imajo'], 'lpart': ['imel', 'imela', 'imelo', 'imela', 'imeli', 'imeli', 'imeli', 'imele', 'imela'], 'imp': 'imej'},
    'hoteti': {'praes': ['hočem', 'hočeš', 'hoče', 'hočeva', 'hočeta', 'hočeta', 'hočemo', 'hočete', 'hočejo'], 'lpart': ['hotel', 'hotela', 'hotelo', 'hotela', 'hoteli', 'hoteli', 'hoteli', 'hotele', 'hotela'], 'imp': None},
    'moči': {'praes': ['morem', 'moreš', 'more', 'moreva', 'moreta', 'moreta', 'moremo', 'morete', 'morejo'], 'lpart': ['mogel', 'mogla', 'moglo', 'mogla', 'mogli', 'mogli', 'mogli', 'mogle', 'mogla'], 'imp': None},
    'povedati': {'praes': ['povem', 'poveš', 'pove', 'poveva', 'povesta', 'povesta', 'povemo', 'poveste', 'povedo'], 'lpart': ['povedal', 'povedala', 'povedalo', 'povedala', 'povedali', 'povedali', 'povedali', 'povedale', 'povedala'], 'imp': 'povej'},
    'reči': {'praes': ['rečem', 'rečeš', 'reče', 'rečeva', 'rečeta', 'rečeta', 'rečemo', 'rečete', 'rečejo'], 'lpart': ['rekel', 'rekla', 'reklo', 'rekla', 'rekli', 'rekli', 'rekli', 'rekle', 'rekla'], 'imp': 'reci'},
}
LP_END = ['l', 'la', 'lo', 'la', 'li', 'li', 'li', 'le', 'la']  # m/f/n Sg · m/(f,n) Du · m/f/n Pl  (Reihenfolge s. LP_ZELLEN)
LP_ZELLEN = [('Masc', 'Sing'), ('Fem', 'Sing'), ('Neut', 'Sing'), ('Masc', 'Dual'), ('Fem', 'Dual'), ('Neut', 'Dual'), ('Masc', 'Plur'), ('Fem', 'Plur'), ('Neut', 'Plur')]

def verb(lem):
    B = belege(lem, 'VERB') + (belege(lem, 'AUX') if lem == 'biti' else [])
    att_p = collections.defaultdict(collections.Counter); att_l = collections.defaultdict(collections.Counter); att_i = collections.Counter(); asp = collections.Counter()
    for f, form, c in B:
        if f.get('Aspect'): asp[f['Aspect']] += c
        if f.get('VerbForm') == 'Fin' and f.get('Mood') == 'Ind' and f.get('Tense') == 'Pres' and f.get('Polarity', 'Pos') == 'Pos': att_p[(f.get('Person'), f.get('Number'))][form] += c
        elif f.get('VerbForm') == 'Part' and f.get('Gender') and not f.get('Case'): att_l[(f['Gender'], f['Number'])][form] += c
        elif f.get('Mood') == 'Imp' and f.get('Person') == '2' and f.get('Number') == 'Sing': att_i[form] += c
    out = {'l': lem, 'asp': ('ipf' if asp['Imp'] >= asp['Perf'] else 'pf') if asp else None}
    # Präsens
    basis = None
    for suf, irr in sorted(IRR.items(), key=lambda kv: -len(kv[0])):
        if lem == suf or (lem.endswith(suf) and suf in ATHEM and len(lem) > len(suf) and lem not in ('dajati',)):
            pre = lem[:-len(suf)]
            out['praes'] = [pre + x for x in irr['praes']]; out['lpart'] = [pre + x for x in irr['lpart']]; out['imp'] = (pre + irr['imp']) if irr['imp'] else None
            if suf == 'iti' and pre:  # priti -> pridem (thematisch!), nur 'iti' selbst ist athematisch
                out = {'l': lem, 'asp': out['asp']}; break
            basis = 'irr'; break
    if basis != 'irr':
        d3 = att_p.get(('3', 'Sing')); d1 = att_p.get(('1', 'Sing'))
        st = None
        if d3: st = d3.most_common(1)[0][0]
        elif d1: st = d1.most_common(1)[0][0][:-1]
        if st and st[-1] in 'aei':
            v = st[-1]
            P = [st + 'm', st + 'š', st, st + 'va', st + 'ta', st + 'ta', st + 'mo', st + 'te', st[:-1] + {'a': 'ajo', 'i': 'ijo', 'e': 'ejo'}[v]]
            out['praes'] = P; out['klasse'] = v
        # l-Partizip
        if lem.endswith('ti'):
            s = lem[:-2]
            if re.search(r'(pr|mr|zr|tr)eti$', lem): s = lem[:-4] + 'r'; L = [s + 'l', s + 'la', s + 'lo', s + 'la', s + 'li', s + 'li', s + 'li', s + 'le', s + 'la']
            elif out.get('praes') and out['praes'][2].endswith('de') and lem.endswith('ti') and lem[:-2].rstrip('j')[-1:] in VOKAL | set('dzs'):
                # Komposita von iti: priti -> prišel, oditi -> odšel, najti -> našel (nur wenn belegt)
                L = None
                for pre in {lem[:-2], lem[:-3], lem[:-4]}:
                    c = [pre + x for x in IRR['iti']['lpart']]
                    if c[0] in att_l.get(('Masc', 'Sing'), {}) or c[1] in att_l.get(('Fem', 'Sing'), {}): L = c; break
            elif s.endswith(('s', 'z')) or lem.endswith('iti') and len(lem) <= 5 and lem not in ('piti', 'biti', 'liti', 'viti', 'riti', 'šiti', 'kriti', 'miti', 'gniti'): L = None
            else: L = [s + e for e in LP_END]
            out['lpart'] = L
        elif lem.endswith('či'): out['lpart'] = None
        # Imperativ 2. Sg
        if out.get('klasse') == 'a': out['imp'] = out['praes'][2] + 'j'
        elif out.get('klasse') == 'i': out['imp'] = out['praes'][2]
        else: out['imp'] = None
    # Abgleich + Kennungen
    Kp = []
    for i, (pz, nz) in enumerate(PERS):
        a = att_p.get((pz, nz), {}); f = out.get('praes', [None] * 9)[i] if out.get('praes') else None
        if f is None: Kp.append(None)
        elif f in a: Kp.append('b')
        elif a: Kp.append(None)
        elif i == 8 and out.get('klasse') == 'e': Kp.append(None)   # -ejo/-o schwankt (pišejo/pišo)
        else: Kp.append('r')
    Kl = []
    for i, z in enumerate(LP_ZELLEN):
        a = att_l.get(z, {}); f = out['lpart'][i] if out.get('lpart') else None
        if f is None: Kl.append(None)
        elif f in a: Kl.append('b')
        elif a: Kl.append(None)
        else: Kl.append('r')
    Ki = None
    if out.get('imp'): Ki = 'b' if out['imp'] in att_i else (None if att_i else 'r')
    out['Kp'] = Kp; out['Kl'] = Kl; out['Ki'] = Ki
    bp = sum(1 for k in Kp if k == 'b'); bl = sum(1 for k in Kl if k == 'b')
    konflikt = sum(1 for i in range(9) if Kp[i] is None and out.get('praes') and att_p.get(PERS[i])) + sum(1 for i in range(9) if Kl[i] is None and out.get('lpart') and att_l.get(LP_ZELLEN[i]))
    kp = sum(1 for i in range(9) if Kp[i] is None and out.get('praes') and att_p.get(PERS[i]))
    out['ok'] = bool(out.get('praes')) and (bp >= 2 or basis == 'irr') and kp == 0
    out['okL'] = bool(out.get('lpart')) and (bl >= 1 or basis == 'irr') and not any(Kl[i] is None and att_l.get(LP_ZELLEN[i]) for i in range(9))
    out['konflikt'] = konflikt
    return out

if __name__ == '__main__':
    for w in sys.argv[1:]:
        if w.startswith('N:'): print(json.dumps(nomen(w[2:]), ensure_ascii=False))
        elif w.startswith('A:'): print(json.dumps(adjektiv(w[2:]), ensure_ascii=False))
        elif w.startswith('V:'): print(json.dumps(verb(w[2:]), ensure_ascii=False))
