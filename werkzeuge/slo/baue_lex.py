import paradigma as P, json, collections, sys
pos={}
for r in open('liste_uniq.txt').read().split('\n'):
    l,u=r.split(':'); pos.setdefault(l,u)
gl={}
for f in sys.argv[1:]:
    for line in open(f):
        line=line.rstrip('\n')
        if '=' in line and not line.startswith('#'):
            l,d=line.split('=',1)
            if ':' in l: l,u=l.split(':'); pos[l]=u
            gl[l]=d
st=collections.Counter(); lex=[]
for l,d in gl.items():
    u=pos.get(l,'?'); e={'l':l,'p':u,'de':d}
    if u=='NOU':
        r=P.nomen(l)
        if r: e['g']=r['g'][0].lower()
        if r and r['ok']: e['an']=1 if r['anim'] else 0; e['F']=[r['F'][(k,z)] if (k,z) in r['F'] else r['F'][k+'.'+z] for z in P.ZAHL for k in P.KASUS]; e['K']=''.join((r['K'][k+'.'+z] or '-') for z in P.ZAHL for k in P.KASUS); st['N ok']+=1
        else: st['N nein']+=1
    elif u=='ADJ':
        r=P.adjektiv(l)
        if r and r['ok']: zel=[g+'.'+k+'.'+z for g in ('Masc','Fem','Neut') for z in P.ZAHL for k in P.KASUS]; e['F']=[r['F'].get(c) for c in zel]; e['K']=''.join((r['K'].get(c) or '-') for c in zel); st['A ok']+=1
        else: st['A nein']+=1
    elif u=='VER':
        r=P.verb(l)
        if r and r['ok']: e['pr']=r['praes']; e['Kp']=''.join(k or '-' for k in r['Kp']); st['V ok']+=1
        else: st['V nein']+=1
        if r and r.get('okL'): e['lp']=r['lpart']; e['Kl']=''.join(k or '-' for k in r['Kl']); st['V lp']+=1
        if r and r.get('imp') and r.get('Ki'): e['imp']=r['imp']
        if r and r.get('asp'): e['asp']=r['asp']
    lex.append(e)
print(st, len(lex))
json.dump(lex,open('lex_roh.json','w'),ensure_ascii=False)
