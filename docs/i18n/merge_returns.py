# -*- coding: utf-8 -*-
"""Merge ChatGPT return files (any number, any split) into translations.json, keyed by ID.
   Usage: python3 merge_returns.py            -> reads returns/*.md|*.txt, validates against gpt_manifest.json"""
import re, json, glob, pathlib, sys
here=pathlib.Path(__file__).parent
man=json.load(open(here/'gpt_manifest.json'))
EN={x['id']:x['en'] for x in man['uniq']}
for p in man['diary']:
    EN[f"D{p['n']:02d}.T"]=p['title']; EN[f"D{p['n']:02d}.X"]=p.get('excerpt','')
    for i,par in zip(p['ids'],p['paras']):
        if i: EN[i]=par.strip()
ORDER=[i for i in man['ids'] if i in EN]; ORDER=list(dict.fromkeys(ORDER))
LANGS=('SQ','FR','IT')
store={}; dup=[]; unknown=[]
for f in sorted(glob.glob(str(here/'returns/*'))):
    cur=None
    for line in open(f,encoding='utf-8'):
        line=line.rstrip('\n')
        m=re.match(r'^\s*<<(.+?)>>\s*$',line)
        if m:
            cur=m.group(1)
            if cur not in EN: unknown.append((cur,pathlib.Path(f).name)); cur=None
            elif cur in store: dup.append(cur)
            else: store[cur]={}
            continue
        m=re.match(r'^\s*(SQ|FR|IT):\s?(.*)$',line)
        if m and cur: store[cur][m.group(1)]=m.group(2).strip()
        elif line.startswith('## NOTES') or line.startswith('END OF PART'): cur=None
def fr_space(s):   # French: no-break space before ; : ! ? and inside « »
    s=re.sub(r' ([;:!?])',u' \\1',s); s=s.replace('« ',u'« ').replace(' »',u' »'); return s
issues=[]
for i,t in store.items():
    en=EN[i]
    for L in LANGS:
        v=t.get(L)
        if v is None or v=='': issues.append((i,L,'MISSING')); continue
        if v=='=': t[L]=en; v=en
        if L=='FR': t[L]=v=fr_space(v)
        if "'" in v and "'" not in en: t[L]=v=v.replace("'",'’')
        for tok in re.findall(r'\{name\}|⟦|⟧|👋|🤝',en):
            if en.count(tok)!=v.count(tok): issues.append((i,L,f'token {tok} count differs'))
        if en and en[-1] in '.?!…' and v[-1] not in '.?!…»”': issues.append((i,L,'final punctuation dropped'))
        if en and en[-1] not in '.?!…:' and v[-1]=='.' : issues.append((i,L,'final full stop added'))
        if len(en.split())<=3 and len(v)>2.2*len(en)+6: issues.append((i,L,f'long label: {len(en)}→{len(v)} chars  "{v}"'))
missing=[i for i in ORDER if i not in store]
json.dump(store,open(here/'translations.json','w'),ensure_ascii=False,indent=1)
print(f'IDs in manifest: {len(ORDER)} | received: {len(store)} | still missing: {len(missing)}')
print('unknown IDs:',unknown[:5],'| duplicate IDs:',dup[:5])
by={}
for i in missing: by[i[0] if i[0]!='D' else i[:3]]=by.get(i[0] if i[0]!='D' else i[:3],0)+1
print('missing by group:',by)
print(f'\nissues: {len(issues)}')
for x in issues: print('  ',x)
