import {searchKeywords,NO_MATCH} from './keyword-search.mjs';
const config=window.PORTFOLIO_SEARCH_CONFIG||{};
const form=document.querySelector('#portfolio-search');
const input=document.querySelector('#portfolio-query');
const aiButton=document.querySelector('#ai-search-button');
const keywordButton=document.querySelector('#keyword-search-button');
const status=document.querySelector('#search-status');
const empty=document.querySelector('#search-empty');
const list=document.querySelector('#search-results');
const bot=document.querySelector('#bot-check');
let manifest,token='',widget,busy=false,capped=false;

function controls() {
  keywordButton.disabled=busy||!manifest;
  aiButton.disabled=busy||!manifest||!config.aiEnabled||!token||capped;
}
function display(rows) {
  list.replaceChildren();
  for(const row of rows) {
    const url=new URL(row.url,location.origin);
    if(url.origin!==location.origin) continue;
    const item=document.createElement('li');
    const article=document.createElement('article');article.className='search-result';
    const heading=document.createElement('h2');
    const link=document.createElement('a');link.href=row.url;link.textContent=row.title+' — '+row.section;
    heading.append(link);
    const passage=document.createElement('p');passage.textContent=row.text;
    article.append(heading,passage);
    if(row.draft) {const note=document.createElement('p');note.className='search-result-note';note.textContent='Draft page';article.append(note);}
    item.append(article);list.append(item);
  }
  empty.textContent=NO_MATCH;
  empty.hidden=list.children.length!==0;
}
function keywords(message='Keyword search results') {
  const results=searchKeywords(manifest,input.value);
  display(results);status.textContent=message;
}

async function runAI() {
  if(!config.aiEnabled||!token||busy||capped) return;
  const submittedToken=token;token='';busy=true;controls();
  status.textContent='Searching published portfolio passages…';
  try {
    const response=await fetch(config.endpoint,{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify({query:input.value.trim(),token:submittedToken,requestId:crypto.randomUUID(),version:manifest.version}),signal:AbortSignal.timeout(20000)});
    const result=await response.json();
    if(!response.ok) {
      if(result.code==='daily_limit') capped=true;
      keywords((result.message||'AI search is unavailable right now.')+' Showing keyword search results.');
      return;
    }
    const approved=new Map(manifest.passages.map(p=>[p.id,p]));
    const merged=new Map();
    for(const row of result.results||[]) if(approved.has(row.id)) merged.set(row.id,approved.get(row.id));
    for(const row of searchKeywords(manifest,input.value)) if(!merged.has(row.id)) merged.set(row.id,row);
    display([...merged.values()].slice(0,12));
    if(result.remaining===0) capped=true;
    status.textContent='AI Search, powered by Cloudflare, with keyword matches. Results are published passages, not generated answers.'+(capped ? ' Today’s AI search limit has been reached. Please use keyword search or browse the website manually, or come back tomorrow for AI search.' : '');
  } catch {
    keywords('AI search could not complete. Showing keyword search results. You can try AI search again manually.');
  } finally {
    busy=false;
    if(widget!==undefined && window.turnstile) window.turnstile.reset(widget);
    controls();
  }
}

form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!manifest||busy) return;
  const query=input.value.trim();
  if(query.length<2||query.length>240) {status.textContent='Enter a search between 2 and 240 characters.';return;}
  if(event.submitter===aiButton) runAI();else keywords();
});

try {
  const response=await fetch('/search-data.json',{cache:'no-cache'});
  if(!response.ok) throw Error('Search data unavailable');
  manifest=await response.json();
  if(!Array.isArray(manifest.passages)||typeof manifest.version!=='string') throw Error('Invalid search data');
  controls();
  if(config.aiEnabled && config.turnstileSiteKey) {
    status.textContent='Keyword search is ready. Complete the bot check to use AI search.';
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    script.onload=()=>{
      bot.hidden=false;
      widget=window.turnstile.render(bot,{sitekey:config.turnstileSiteKey,action:'portfolio-search',callback:value=>{token=value;controls();},'expired-callback':()=>{token='';controls();},'error-callback':()=>{token='';controls();status.textContent='The bot check could not complete. Keyword search is available.';}});
    };
    script.onerror=()=>{status.textContent='The bot check could not load. Keyword search is available.';};
    document.head.append(script);
  } else {
    status.textContent='Keyword search is available. AI search has not been activated.';
  }
} catch {
  status.textContent='Search data could not load. Please browse Projects & Courses or About Me.';
}
