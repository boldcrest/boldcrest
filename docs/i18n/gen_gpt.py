# -*- coding: utf-8 -*-
import re, json, pathlib
ls = pathlib.Path('it_work.md').read_text(encoding='utf-8').split('\n')
KEEP='— keep as written'
def bounds(n):
    s=[i for i,l in enumerate(ls) if l.startswith(f'## {n}.')][0]
    e=[i for i,l in enumerate(ls) if l.startswith('## ') and i>s][0]
    return s,e

items=[]      # dict(id, en, ctx, group)
def add(group, en, ctx=''):
    en=re.sub(r'\s+',' ',en).strip()
    if en: items.append({'g':group,'en':en,'ctx':ctx})

# ---------- §7 CTAs + §14 UI (inline EN/IT pairs)
for sec,group in (('7','C'),('14','U')):
    s,e=bounds(sec); sub=''
    for i in range(s,e):
        if ls[i].startswith('### '): sub=ls[i][4:]
        m=re.match(r'^- (?:\*\*(.+?)\*\* — )?EN: `?(.*?)`?(?:\s*\*\*\(fragment\)\*\*)?\s*$', ls[i])
        if m and i+1<e:
            it=re.sub(r'^\s*\*\*IT:\*\*\s*','',ls[i+1])
            if it.strip()==KEEP: continue
            lab=(m.group(1)+' · ' if m.group(1) else '')
            add(group, m.group(2), f'{lab}{sub}')

# ---------- §11 / §12 labelled single-line fields
for sec in ('11','12'):
    s,e=bounds(sec); sub='Services main page' if sec=='11' else ''
    i=s
    while i<e:
        if ls[i].startswith('### '): sub=ls[i][4:]
        m=re.match(r'^\*\*(.+?) \(EN\):\*\*\s*(.*)$', ls[i])
        if m:
            en=[m.group(2)]; j=i+1
            while j<e and not re.match(r'^\*\*.+ \(IT\):\*\*',ls[j]): en.append(ls[j]); j+=1
            it=re.sub(r'^\*\*.+ \(IT\):\*\*\s*','',ls[j]) if j<e else ''
            if it.strip()!=KEEP: add('S', ' '.join(en), f'{m.group(1)} · {sub}')
            i=j
        i+=1

# ---------- §13 job titles
s,e=bounds('13')
for i in range(s,e):
    c=[x.strip() for x in ls[i].strip('|').split('|')]
    if ls[i].startswith('|') and len(c)==2 and c[0] not in('Job title (EN)','---') and not c[0].startswith('-'):
        add('J', c[0], 'Team job title, shown under a staff headshot')

# ---------- §10 diary : keep order, never dedupe
diary=[]
s,e=bounds('10'); post=None
i=s
while i<e:
    m=re.match(r'^### (\d+)\. (.*)$', ls[i])
    if m: post={'n':int(m.group(1)),'title':m.group(2),'paras':[]}; diary.append(post)
    m=re.match(r'^\*\*(Title|Excerpt) \(EN\):\*\*\s*(.*?)\s*$', ls[i])
    if m and post is not None: post[m.group(1).lower()]=m.group(2)
    if ls[i]=='**Body (EN):**':
        j=i+1
        while j<e and not ls[j].startswith('**Body (IT)'):
            if ls[j].startswith('> ') and ls[j][2:].strip(): post['paras'].append(ls[j][2:])
            j+=1
        i=j
    i+=1
for p in diary:                       # cut the bibliography
    if 'Sources' in p['paras']: p['paras']=p['paras'][:p['paras'].index('Sources')]

# ---------- NEW strings no earlier brief contained
N=lambda en,ctx: add('N',en,ctx)
hero='Homepage hero headline. Animated word by word, so give the COMPLETE line; I rebuild the animation.'
N('Build identities and shape perceptions.', hero)
N('Go bold or go unseen.', hero+' Also the loading screen. It is the company motto.')
N('identities', 'The word standing for "identities" INSIDE your translation of the hero line above (it gets its own hover effect). Give exactly the word you used.')
N('perceptions','Same: the word for "perceptions" as used in your hero line.')
N('bold','Same: the word for "bold" as used in your motto line.')
N('unseen','Same: the word for "unseen" as used in your motto line.')
N('We do many ⟦View All Work⟧ things very well.','Homepage. ⟦…⟧ is a BUTTON sitting inside the sentence. Keep the ⟦ ⟧ markers around the button words and place the button wherever it reads naturally.')
N('No egos, just ⟦The Team⟧ behind the bold.','Homepage statement. ⟦The Team⟧ is a button inside the sentence. Keep the markers.')
N('No egos, just the team behind the bold.','Mobile version of the same statement, no button.')
N("Let's have ⟦A Coffee⟧ together.",'Homepage closing line. ⟦A Coffee⟧ is a button linking to Contact. Keep the markers.')
N('Two earthquakes, a pandemic, and a decision.','People page headline: BoldCrest was founded in Tirana in 2019 between two earthquakes and the pandemic.')
N('The equation was simple, but powerful. Creative vision on one side. Business understanding on the other. Together, they became the foundation for what BoldCrest would grow into. We were 22, building our first team from the same university halls we were still walking through, driven by clear instinct, strong work ethic, and the belief that the market was ready for something sharper.','People page, about the two founders.')
N("The work we're most proud of, most people will never know we made.",'People page, large statement.')
N("That's not false modesty. That's the goal. When a brand becomes so real, so lived-in, so theirs; when people carry it, wear it, post it, and believe in it without a second thought; the agency behind it disappears. And it should.",'People page, follows the statement above.')
N("If you've read this far, we hope you felt something.",'People page, closing statement.')
N('Something broke on our end.','Error page headline (500).')
N('An unexpected error occurred.','Error page.')
N('Try again, or head back to the homepage if it keeps happening.','Error page.')
N('Try Again','Error page button.')
N("Let's get you back home.",'404 page headline.')
N('More Diary','Heading above related articles.')
N('Next Project','Label above the next portfolio project.')
N('Home','Breadcrumb.')
N('Questions We Hear Most','FAQ heading on the services page.')
N('FAQ','Short section label.'); N('Outcomes','Short section label.'); N('Process','Short section label.'); N('Why Us','Short section label.')
N('Explore','Short eyebrow label.'); N('Explore Our Other Services','Heading.')
N('Animation','Service name in a list.')
N('Clear filter','Button in the portfolio filters.'); N('Grid view','Toggle, accessibility label.'); N('List view','Toggle, accessibility label.')
N('Previous logos','Carousel arrow, accessibility label.'); N('Next logos','Carousel arrow, accessibility label.')
N('Project media','Accessibility label.')
for w in ['Branding','Strategy','Motion','Identity','Digital','Advertising','Packaging']:
    N(w,'One of several single words that fall down the screen in a decorative animation. One word if possible.')
chat='Start-a-Project chat. "Megi" is the account manager greeting the visitor. Warm, short, human.'
for g in ['Hi there 👋','Hey there 👋','Hello 👋','Hi 👋','Hey 👋']: N(g, chat+' Opening wave, five interchangeable variants. Keep the emoji.')
for g in ['Nice to meet you, Megi!','Hey Megi, great to meet you!','Lovely to meet you, Megi!','Good to meet you, Megi!','Pleasure to meet you, Megi!']: N(g, chat+' The VISITOR replying, five variants.')
for g in ['The pleasure is mine, {name}.','Great to have you here, {name}.','Wonderful to meet you, {name}.','Lovely to have you, {name}.','Brilliant, thanks {name}.']: N(g, chat+' Keep {name} exactly.')
for g in ['How can we help?','So, how can we help?','What can we do for you?','Where can we jump in?']: N(g, chat)
for g in ['Talk soon, {name} 🤝','Speak soon, {name} 🤝','Chat soon, {name} 🤝','Catch you soon, {name} 🤝','Until next time, {name} 🤝']: N(g, chat+' Sign-off. Keep {name} and the emoji.')
N('Thanks {name}.', chat+' Keep {name}.')
N('My name is', chat+' Label followed by the visitor typing their name.')
N("I'm a", chat+' Label followed by a job title the visitor types, e.g. "I\'m a Founder". If your language needs gender or an article here, choose the most neutral wording.')
N('at', chat+' Label followed by a company name: "at Acme Co."')
N('Founder', chat+' Greyed-out example inside the job-title field.')
N("Build a brand that doesn't fade with the trend cycle.", chat+' Greyed-out example answer inside the field that follows "I want to…". It must continue that stem grammatically.')
N('You', chat+' Fallback name above the visitor\'s messages before they type their name.')
N('Website', chat+' Service option.'); N('Other', chat+' Service option.')
N('€5,000 – €15,000', chat+' Budget option. Use local number formatting.'); N('€15,000 – €50,000', chat+' Budget option.'); N('€50,000+', chat+' Budget option.')
N("Not sure yet, let's figure it out.", chat+' Budget option.')
N("I've been following BoldCrest for a while", chat+' Option answering "I found you through".')
rep=chat+' Megi\'s reply is built as: OPENER + ", " + CLAUSE. Any opener can meet any clause, so every clause must start lowercase and follow a comma naturally.'
for o in ['Perfect','Love that','Great','Got it','Nice']: N(o, rep+' This is an OPENER. No final punctuation.')
for c in ['an identity people actually remember is our happy place.','shelf presence is where we have the most fun.','we will make sure it looks every bit the part.','motion is one of our favourite ways to tell a story.','big screen, bigger ideas, count us in.','we will keep your feed worth the follow.','a site that works as hard as it looks, done.','tell us a little more and we will shape it together.','we like momentum just as much as you do.','that gives us room to start it right.','a healthy runway to do this properly.','good work rarely likes being rushed.','tight but very doable, we like the pace.','plenty of space to get it right.','room to be properly ambitious.','our favourite kind of brief.','we will make every euro pull its weight.','a solid base to build something sharp.','now we have room to get ambitious.','this is where we do our best work.','no problem, we will shape it around the work.','always the best kind of introduction.','good people talk, and we appreciate it.','glad the search sent you our way.','glad the feed did its job.','that genuinely means a lot.','however you found us, we are glad you did.','sounds good, let us keep going.']:
    N(c, rep+' This is a CLAUSE.')
N('Start a new project', 'Chat panel title.'); N('Start a new conversation','Chat panel button, accessibility label.'); N('Close','Button.')
seo='SEO. Shown in Google results and browser tabs, never on the page. Keep "BoldCrest" and the "|" or "—" separators.'
for t in ['Work — BoldCrest','People — BoldCrest','Diary — BoldCrest','Contact — BoldCrest','Careers — BoldCrest','Page Not Found','Creative Agency Services | BoldCrest','Brand Development Agency | Visual Identity, Logo & Packaging Design | BoldCrest','Social Media & Communication Agency | Strategy, Content & Campaigns | BoldCrest','Photography, Video & Animation Production | Still & Motion | BoldCrest']:
    N(t, seo+' Page TITLE: aim for 60 characters or fewer.')
for t in ['We build identities and shape perceptions. Go bold or go unseen.','Bold brand identities, packaging, photography, video, and campaigns for ambitious brands.','BoldCrest is a creative agency in Tirana, Albania, building bold brand identities, packaging, photography, video, and campaigns for ambitious brands. Go bold or go unseen.','Our creations, skillfully forged through the years.',"It's not about us, it's about you. Meet the team behind BoldCrest.","Let's talk. Get in touch with BoldCrest to start your next project.",'Join the BoldCrest team. Tell us about yourself and apply. It goes straight to our team.','BoldCrest is a Tirana-based creative agency offering brand development, photography, video, animation, and communication. 300+ projects, 30+ brands, 7+ years.','Strategic brand development. Logo design, visual identity systems, brand guidelines, packaging design, and creative advertising.','Full-service social media management, digital marketing, PR, and campaign management. 22+ active brands managed.','In-house photography, videography, animation, motion graphics, and post-production. 22+ active brands.']:
    N(t, seo+' Page DESCRIPTION: aim for 155 characters or fewer.')

# ---------- dedupe everything except diary
seen={}; uniq=[]
for it in items:
    k=it['en']
    if k in seen:
        if it['ctx'] and it['ctx'] not in seen[k]['ctxs']: seen[k]['ctxs'].append(it['ctx'])
        continue
    it['ctxs']=[it['ctx']] if it['ctx'] else []; seen[k]=it; uniq.append(it)
GN={'N':'A','C':'B','U':'C','S':'E','J':'F'}
cnt={}
for it in uniq:
    g=GN[it['g']]; cnt[g]=cnt.get(g,0)+1; it['id']=f'{g}{cnt[g]:03d}'

import os
SKIP1 = bool(os.environ.get('SKIP1'))
ALL_UNIQ = uniq
if SKIP1: uniq = [x for x in uniq if x['id'][0] in 'CEF']
# ---------- diary ids + sentence chains
def is_anchor(p): 
    t=p.strip(); return len(t.split())<=8 and t[:1].islower() and not re.search(r'[.!?:]$',t) and not re.match(r'^(or|and|oppure)$',t)
did=[]
for p in diary:
    ids=[]
    for k,par in enumerate(p['paras'],1):
        if re.fullmatch(r'\s*[.,;:]+\s*',par): ids.append(None)     # pure punctuation: I re-attach it myself
        else: ids.append(f"D{p['n']:02d}.{k:02d}")
    p['ids']=ids
    p['anchor']=[is_anchor(x) for x in p['paras']]

out=[]; w=out.append
total=len(uniq)+sum(1 for p in diary for x in p['ids'] if x)+2*len(diary)
w('# BoldCrest — Albanian, French + Italian translation, final round'); w('')
w('You are translating the remaining copy of a creative agency website (BoldCrest, Tirana) into **Albanian (SQ)**, **French (FR)** and **Italian (IT)**. The portfolio and menus are already translated; this file is everything that is still in English. It is one job, returned in the exact format described below, because the result is loaded into the website by a script.'); w('')
w(f'**There are {total} items.** Every item has an ID such as `<<A014>>`.'); w('')
w('---'); w(''); w('## 1. What to return — read this first'); w('')
w('Return **only IDs and translations**. Do not repeat the English, the context notes or these instructions.'); w('')
w('```'); w('<<A014>>'); w('SQ: …Albanian…'); w('FR: …French…'); w('IT: …Italian…'); w(''); w('<<A015>>'); w('SQ: …'); w('FR: …'); w('IT: …'); w('```'); w('')
w('- **One block per ID, every ID, in order.** Never skip, merge, renumber or invent IDs.')
w('- Each translation sits on **one line**. No line breaks inside a translation.')
w('- If an item should stay exactly as the English (rare), write `=` as the translation.')
w('- No commentary between blocks. Put any notes at the very end under a heading `## NOTES`, each one starting with the ID it refers to.')
w('- Always all three languages per block, in the order SQ, FR, IT.')
w('- **Do not stop to ask me questions.** If something is ambiguous, make the best choice and explain it in NOTES.'); w('')
w('### The files to give back'); w('')
w('This does not fit in one reply, so the job is cut into **5 fixed parts**. Produce them one at a time, in this order, each as a **downloadable Markdown file with exactly this name**:'); w('')
w('| Part | File name | Contains | First ID | Last ID | Items |'); w('|---|---|---|---|---|---|')
def _ids(pred): return sorted([x['id'] for x in uniq if pred(x['id'])])
def _d(lo,hi):
    o=[]
    for p_ in diary:
        if lo<=p_['n']<=hi: o+=[f"D{p_['n']:02d}.T", f"D{p_['n']:02d}.X"]+[i_ for i_ in p_['ids'] if i_]
    return o
PARTS=[('1','Groups A + B',_ids(lambda i_:i_[0] in 'AB')),('2','Group C',_ids(lambda i_:i_[0]=='C')),('3','Groups E + F',_ids(lambda i_:i_[0] in 'EF')),('4','Diary articles 1–5',_d(1,5)),('5','Diary articles 6–10',_d(6,10))]
PARTS=[x for x in PARTS if x[2]]
for n_,what,ids_ in PARTS:
    w(f'| {n_} | `BoldCrest-translations-part{n_}.md` | {what} | `<<{ids_[0]}>>` | `<<{ids_[-1]}>>` | {len(ids_)} |')
assert sum(len(x[2]) for x in PARTS)==total, (sum(len(x[2]) for x in PARTS), total)
w('')
w('Rules for the files:'); w('')
w('- **Line 1 of every file** is a header in this form: `# PART 2 — <<C001>> to <<C142>> — 142 items`.')
w('- Then the blocks, and nothing else, until an optional `## NOTES` section at the end.')
w('- **The last line of every file** is: `END OF PART 2`.')
w('- After delivering a part, say only which part is done and how many blocks it contains, then wait. When I write **"next"**, produce the following part.')
w('- If a part is too long for one file, split it into `part3a`, `part3b`… at any ID boundary. **Never shorten, summarise or drop items to make it fit.**')
w('- If you cannot create files, put the whole part inside **one** code block instead, with the same header and last line.')
w('- Before delivering each part, count your blocks against the table above. If the count is short, find and add the missing IDs first.'); w('')
w('---'); w(''); w('## 2. Voice'); w('')
w('BoldCrest’s English is confident, plain and unfussy: short sentences, concrete nouns, no marketing inflation. It never says "leverage", "seamless", "unlock" or "empower". The translation should sound like the same people talking, not like a translated brochure. Prefer verbs to abstract nouns and keep sentences short. Do not make it more formal, longer or more ornate than the English.'); w('')
w('- **Albanian: address the reader as "ti"**, informal singular, and speak as "ne". Standard literary Albanian, with every **ë** and **ç** in place. This matches the pages already live ("Le të flasim. Pavarësisht sa i madh është biznesi yt…").')
w('- **Italian: address the reader as "tu"**, and speak as "noi"; "Lei" would make it corporate in a way the brand is not. Never use an adjective that forces a gender on the reader: write "Vuoi costruire…?", not "Pronto a costruire…?". Resist ornate agency Italian (*eccellenza*, *sinergia*, *percorso di valorizzazione*). Italian borrows *brand*, *packaging* and *design*: that is correct here, see the table. Italian clients (ACIES, SIBEG Coca-Cola, Tomarchio) read this version, so it must sound native.')
w('- **French: address the reader as "vous"**, and speak as "nous". This matches the pages already live ("Quelle que soit la taille de votre entreprise…"). French typography: a non-breaking space before `: ; ! ?` and inside « ».'); w('')
w('---'); w(''); w('## 3. Words already decided — reuse them exactly'); w('')
w('These are already used across the translated portfolio and menus. Do not re-translate them differently.'); w('')
w('| English | Albanian | French | Italian |'); w('|---|---|---|---|')
for a,b,c,d in [('Work (menu)','Projekte','Projets','Lavori'),('Services','Shërbime','Services','Servizi'),('People (menu)','Ekipi','Équipe','Persone'),('Diary','Ditari','Journal','Diario'),('Contact','Kontakt','Contact','Contatti'),('Start a Project','Nis një Projekt','Lancer un Projet','Inizia un progetto'),('Overview / Challenge / Solution','Përmbledhje / Sfida / Zgjidhja','Aperçu / Défi / Solution','Panoramica / Sfida / Soluzione'),('More Work','Projekte të Tjera','Autres Projets','Altri lavori'),('Careers','Karriera','Carrières','Lavora con noi'),('Send','Dërgo','Envoyer','Invia'),
 ('brand','markë','marque','brand'),('brand identity','identitet i markës','identité de marque','brand identity'),('visual identity','identitet vizual','identité visuelle','identità visiva'),('branding','ndërtim i markës','création de marque','branding'),('packaging','ambalazh','packaging','packaging'),('logo / logotype','logo / logotip','logo / logotype','logo / logotipo'),('typography','tipografi','typographie','tipografia'),('campaign','fushatë','campagne','campagna'),('case study','studim rasti','étude de cas','case study'),('scope','shtrirja e punës','périmètre','perimetro di lavoro'),('timeline','afatet','calendrier','tempistiche'),('touchpoint','pikë kontakti','point de contact','touchpoint'),('shelf presence','prani në raft','visibilité en rayon','presenza a scaffale'),('brand book','manual i markës','charte de marque','brand book'),('brand system','sistem i markës','système de marque','sistema di brand'),('art direction','drejtim artistik','direction artistique','art direction'),('copywriting','shkrim reklamues','rédaction publicitaire','copywriting'),('social media management','menaxhim i rrjeteve sociale','gestion des réseaux sociaux','social media management'),('creative advertising','reklamë krijuese','publicité créative','advertising creativo'),('photography','fotografi','photographie','fotografia'),('videography','videografi','production vidéo','video'),
 ('Brand Development (service name)','Zhvillim i Markës','Développement de Marque','Brand Development (stays English)'),('Still & Motion (service name)','Fotografi dhe Video','Photo et Vidéo','Still & Motion (stays English)'),('Communication (service name)','Komunikim','Communication','Comunicazione')]:
    w(f'| {a} | {b} | {c} | {d} |')
if SKIP1:
    for a,b,c,d in [('Go bold or go unseen (company motto)','Guxo ose mbetu në hije','Osez ou restez invisibles','Osa o resta invisibile'),
      ('Build identities and shape perceptions','Ndërto identitete dhe formëso perceptime','Créez des identités et façonnez les perceptions','Crea identità e plasma percezioni'),
      ('Home (breadcrumb)','Kryefaqja','Accueil','Home'),('FAQ','Pyetje të shpeshta','FAQ','FAQ'),('Next Project','Projekti i radhës','Projet suivant','Progetto successivo'),
      ('Animation','Animacion','Animation','Animazione'),('Website','Faqe interneti','Site web','Sito web'),('Try Again','Provo sërish','Réessayer','Riprova'),
      ('Tell us… (CTA opening verb)','Na trego…','Dites-nous…','Raccontaci…'),
      ('We’ll come back with a clear scope, a timeline and a price.','Do të të propozojmë një shtrirje të qartë të punës, afatet dhe çmimin.','Nous vous proposerons un périmètre clair, un calendrier et un prix.','Ti proporremo un perimetro di lavoro chiaro, tempistiche e un prezzo.'),
      ('No obligation.','Pa detyrim.','Sans engagement.','Senza impegno.'),('the team','ekipi','l’équipe','il team'),('brief','brief','brief','brief')]:
        w(f'| {a} | {b} | {c} | {d} |')
w('')
w('---'); w(''); w('## 4. Rules'); w('')
w('1. **Never translate:** BoldCrest, client and brand names (Magniflex, Tepelene, Hako, Coca-Cola, Nike, Accenture…), people’s names (Megi, Xhulio, Aldo, researchers), platform names (Instagram, TikTok, Meta, Google), file formats, `info@boldcrest.com`, and the package names **Scout, Alpinist, Priority, Rush, Emergency, Batch Shoot**.')
w('2. **Placeholders and markers stay exactly as written:** `{name}`, and the button markers `⟦ ⟧`. Emoji stay.')
w('3. **Capitalisation:** normal sentence capitalisation for your language. Headings and buttons in the English are often Title Case; do **not** copy that. Exception: the three service names in the table above keep their capitals.')
w('4. **Punctuation:** keep the final punctuation of the English. If the English heading has no full stop, add none. Use typographic apostrophes (’), never the straight one (\').')
w('5. **Buttons, menu items and labels must stay short.** If the natural translation is much longer than the English, choose the shortest clear option and mention it in NOTES.')
w('6. **Identical English = identical translation.** Duplicates were already removed, so each ID is a distinct string.')
w('7. **Do not translate for the search engine.** SEO titles should read naturally and stay near the stated length.')
w('8. **Wordplay:** recreate the effect, not the words. If you had to choose between meaning and tone, take tone and say so in NOTES.'); w('')
w('### Sentences that are split in pieces (Diary only)'); w('')
w('In the articles, some sentences are split around a clickable link. They are marked **⛓ ONE SENTENCE** and the pieces are listed in order, with the link piece tagged `[LINK]`. Translate them so that the pieces, **joined in order, read as one correct sentence**. You may move words from one piece to a neighbouring piece to get natural word order, but the `[LINK]` piece must contain only the words that should be clickable, in the right grammatical form for that sentence (in Albanian: the right case and definiteness; in French and Italian: the right article and agreement). Do not add spaces at the start or end of a piece; I re-insert spacing and the final full stop myself.'); w('')
w('---'); w('')

def block(it):
    w(f"<<{it['id']}>>")
    w(f"EN: {it['en']}")
    if it['ctxs']: w('CONTEXT: '+' ‖ '.join(it['ctxs'][:3]))
    w('')
titles={'A':'Group A — New strings: home, people, chat dialogue, error pages, SEO','B':'Group B — Calls to action','C':'Group C — Page and interface copy','E':'Group E — Services pages','F':'Group F — Team job titles'}
for g in 'ABCEF':
    grp=[x for x in uniq if x['id'].startswith(g)]
    if not grp: continue
    w(f"## {titles[g]} ({len(grp)} items)"); w('')
    if g=='F': w('Use the title a person would actually put on LinkedIn in that language. Where your language forces a gendered form, prefer a neutral wording. In Italian, agency job titles normally stay in English (Account Manager, Graphic Designer, Head of Operations): write `=` for those. `Worm Analyst` and `Woof Specialist` belong to the two office mascots, a turtle and a dog: keep them playful.'); w('')
    if g=='E': w('Many items here read `Title — description`. Translate both halves and keep the ` — ` between them.'); w('')
    for it in grp: block(it)
    w('---'); w('')
w('## Group D — Diary articles (10)'); w('')
w('Long-form editorial. Translate for readability; you may re-break sentences **inside** an item, but never merge or split items. Short items without a full stop are sub-headings. Research terms: keep the published English term in quotes on first use where the article does ("revenue premium", "True Gen"), then explain naturally. The five brand-personality dimensions must be translated identically every time they appear: **sincerity, excitement, competence, sophistication, ruggedness**. Amounts in dollars stay in dollars.'); w('')
for p in diary:
    n=p['n']; w(f"### Article {n}: {p['title']}"); w('')
    w(f"<<D{n:02d}.T>>"); w(f"EN: {p['title']}"); w('CONTEXT: Article title.'); w('')
    w(f"<<D{n:02d}.X>>"); w(f"EN: {p.get('excerpt','')}"); w('CONTEXT: Summary shown on the article card and in Google. About 155 characters.'); w('')
    k=0; P=p['paras']; ids=p['ids']; A=p['anchor']
    while k<len(P):
        # chain start: next is anchor
        if k+1<len(P) and A[k+1] and not A[k]:
            j=k+1
            while j<len(P) and (A[j] or (j+1<len(P) and A[j+1]) or (j>0 and A[j-1])):
                j+=1
                if j<len(P) and not A[j] and not (j+1<len(P) and A[j+1]): j+=1; break
            chain=list(range(k,min(j,len(P))))
            joined=re.sub(r'\s+([.,;:])',r'\1',' '.join(P[c].strip() for c in chain))
            w('**⛓ ONE SENTENCE, split around link text. Joined it reads:**'); w(f'> {joined}'); w('')
            for pos,c in enumerate(chain):
                if ids[c] is None: continue
                w(f"<<{ids[c]}>>"); w(f"EN: {'[LINK] ' if pos%2==1 else ''}{P[c].strip()}"); w('')
            w('**⛓ end**'); w('')
            k=chain[-1]+1; continue
        if ids[k]:
            w(f"<<{ids[k]}>>"); w(f"EN: {P[k].strip()}"); w('')
        k+=1
    w('---'); w('')
w('## Final check before you send'); w('')
w(f'- Across the 5 parts, all **{total}** IDs present, each with one `SQ:`, one `FR:` and one `IT:` line.')
w('- No English repeated, no commentary between blocks.')
w('- `{name}`, `⟦ ⟧` and emoji intact.')
w('- Albanian uses "ti" and has all its ë and ç. French uses "vous" with correct spacing before `: ; ! ?`. Italian uses "tu", correct accents (perché, è, più) and no gendered adjectives aimed at the reader.')
w('- Terms from the table in section 3 used consistently.')
w('- Each ⛓ sentence reads correctly when its pieces are joined in order.')
txt='\n'.join(out)
if SKIP1:
    txt=txt.replace('# BoldCrest — Albanian, French + Italian translation, final round','# BoldCrest — Albanian, French + Italian translation, final round (Parts 2–5)')
    txt=txt.replace('It is one job, returned in the exact format','**Part 1 (Groups A and B) has already been translated by someone else. This file contains Parts 2 to 5 only, so the IDs start at `<<C001>>` and the part numbers start at 2. Begin with Part 2.** It is one job, returned in the exact format')
    txt=txt.replace('cut into **5 fixed parts**','cut into **4 fixed parts** (numbered 2 to 5, because Part 1 is already done)')
    txt=txt.replace('Across the 5 parts, all','Across Parts 2 to 5, all')
    txt=txt.replace('<<A014>>','<<C014>>').replace('<<A015>>','<<C015>>')
    txt=txt.replace('These are already used across the translated portfolio and menus.','These are already used across the translated portfolio, the menus and the finished Part 1.')
pathlib.Path('BoldCrest-ChatGPT-PARTS-2-5.md' if SKIP1 else 'BoldCrest-ChatGPT-SQ-FR-IT.md').write_text(txt,encoding='utf-8')
allids=re.findall(r'^<<(.+?)>>$',txt,re.M)
if not SKIP1: json.dump({'ids':allids,'uniq':uniq,'diary':diary},open('gpt_manifest.json','w'),ensure_ascii=False)
print('items:',total,'| ids in file:',len(allids)-2,'(minus 2 example ids) | unique:',len(set(allids)))
print({g:sum(1 for x in uniq if x['id'].startswith(g)) for g in 'ABCEF'}, 'diary ids:',sum(1 for p in diary for x in p['ids'] if x)+2*len(diary))
print(len(txt)//1024,'KB |',len(txt.split()),'words | EN words to translate ~',sum(len(x['en'].split()) for x in uniq)+sum(len(q.split()) for p in diary for q in p['paras'])) 
print('chains:',txt.count('⛓ ONE SENTENCE'))
