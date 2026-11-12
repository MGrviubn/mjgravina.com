"""Rebuild factual search passages after editing the published portfolio.
Run from the repository root: python tools/build-search-data.py
Requires Python 3; uses only the standard library.
"""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import hashlib, json, re
BASE = Path(__file__).resolve().parents[1]
WORKER = BASE/'cloudflare-search'
# New pages are excluded until explicitly reviewed as factual portfolio content.
ALLOWED_PAGES = {'homepage.html', 'about.html', 'projects.html',
 'webdevelopment.html', 'marinebiology.html', 'networking.html',
 '3dprinting.html', 'ecen-tank.html', 'resume.html'}

class Passages(HTMLParser):
 def __init__(self):
  super().__init__();self.stack=[];self.inmain=0;self.skip=0;self.title='';self.heading='';self.pieces=[];self.out=[];self.path='';self.main_anchor='';self.n=0
 def handle_starttag(self, tag, attrs):
  a=dict(attrs);void=tag in ('img','input','br','hr','link','meta','source','wbr')
  if tag=='main':self.inmain+=1
  suppress=tag in ('script','style','nav','figure','form','button') or a.get('data-content-type','').startswith('quotation') or 'draft-notice' in a.get('class','')
  if suppress:self.skip+=1
  self.stack.append((tag,a,suppress))
  if tag in ('h1','h2','h3','p'):self.pieces=[]
  if void:self.handle_endtag(tag)
 def handle_data(self,data):
  if self.inmain and not self.skip:self.pieces.append(data)
 def handle_endtag(self,tag):
  if not any(t==tag for t,a,s in self.stack):return
  if self.inmain and not self.skip and tag in ('h1','h2','h3','p'):
   content=' '.join(''.join(self.pieces).split())
   if tag=='h1':self.title=content
   elif tag in ('h2','h3'):self.heading=content
   elif len(content)>35:
    anchors=[a['id'] for t,a,s in self.stack if 'id' in a]
    anchor=anchors[-1] if anchors else 'page-introduction'
    self.out.append({'title':self.title,'section':self.heading or self.title,'text':content,'anchor':anchor})
   self.pieces=[]
  while self.stack:
   t,a,s=self.stack.pop()
   if s:self.skip-=1
   if t=='main':self.inmain-=1
   if t==tag:break


passages=[]
for p in sorted(BASE.glob('*.html')):
 if p.name not in ALLOWED_PAGES:continue
 html=p.read_text()
 # Page-level introduction is a stable fallback; it never points into a quote.
 html=re.sub(r'(<main\b[^>]*)(>)',lambda m:m[1]+('' if ' id=' in m[1] else ' id="page-introduction"')+m[2],html,count=1)
 p.write_text(html)
 parser=Passages();parser.feed(html)
 for i,row in enumerate(parser.out):
  if len(row['text'])>1800:raise ValueError('Passage too long')
  path='/' if p.name=='homepage.html' else '/'+p.name
  row.update(id=p.stem+'-'+hashlib.sha256((row['anchor']+'\0'+row['text']).encode()).hexdigest()[:12],url=path+'#'+row['anchor'],kind='portfolio-description',draft=p.name in ['resume.html','marinebiology.html','networking.html','3dprinting.html','ecen-tank.html'])
  row['source']='https://mjgravina.com/search-content/'+row['id']+'.html'
  passages.append(row)
payload={'version':hashlib.sha256(json.dumps(passages,ensure_ascii=False,sort_keys=True).encode()).hexdigest(),'passages':passages}
(BASE/'search-data.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2))
(WORKER/'passages.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2))
public=BASE/'search-content';public.mkdir(exist_ok=True)
for row in passages:
 (public/(row['id']+'.html')).write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{escape(row["title"])} — {escape(row["section"])}</title></head><body><main><h1>{escape(row["title"])}</h1><h2>{escape(row["section"])}</h2><p>{escape(row["text"])}</p><p><a href="{escape(row["url"],quote=True)}">View the published section</a></p></main></body></html>')
expected={r['id']+'.html' for r in passages}|{'index.html'}
for old in public.glob('*.html'):
 if old.name not in expected:old.unlink()
(public/'index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Portfolio Search Sources</title></head><body><main><h1>Portfolio Search Sources</h1><ul>'+''.join(f'<li><a href="{r["id"]}.html">{escape(r["title"])} — {escape(r["section"])}</a></li>' for r in passages)+'</ul></main></body></html>')
print(json.dumps({'published_search_passages':len(passages),'version':payload['version']}))

