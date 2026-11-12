// These are local DOM test doubles, not browser or Cloudflare integration tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {DAILY_MESSAGE} from '../service.mjs';
const manifest=JSON.parse(await readFile(new URL('../passages.json',import.meta.url),'utf8'));

class Element {
  constructor(){this.children=[];this.listeners={};this.value='';this.disabled=true;this.hidden=true;this.textContent='';this.attributes={};}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  setAttribute(name,value){this.attributes[name]=value;}
}
async function loadUI({enabled=false,apiResponse,throws=false}={}) {
  const ids=['portfolio-search','portfolio-query','ai-search-button','keyword-search-button','search-status','search-empty','search-results','bot-check'];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
  const head=new Element();let scripts=0,calls=0,renderOptions;
  const config={aiEnabled:enabled,turnstileSiteKey:enabled?'public-mock-site-key':'',endpoint:'/api/search'};
  const window={PORTFOLIO_SEARCH_CONFIG:config,turnstile:{render:(_node,options)=>{renderOptions=options;return 1;},reset:()=>{}}};
  const context=vm.createContext({document:{querySelector:q=>nodes[q.slice(1)],createElement:()=>new Element(),head},window,location:{origin:'https://mjgravina.com'},URL,AbortSignal,crypto:webcrypto,console,
    fetch:async(url)=>{
      if(url==='/search-data.json')return {ok:true,json:async()=>manifest};
      assert.equal(url,'/api/search');calls++;
      if(throws)throw Error('Simulated network failure');
      return {ok:apiResponse?.ok!==false,json:async()=>apiResponse?.body||{results:[],remaining:15}};
    }
  });
  const keyword=new vm.SourceTextModule(await readFile(new URL('../../scripts/keyword-search.mjs',import.meta.url),'utf8'),{context});
  const ui=new vm.SourceTextModule(await readFile(new URL('../../scripts/site-search.mjs',import.meta.url),'utf8'),{context});
  await ui.link(()=>keyword);await ui.evaluate();
  if(enabled){scripts=head.children.length;head.children[0].onload();renderOptions.callback('valid-mock-token');}
  async function submit(mode,query){
    nodes['portfolio-query'].value=query;
    nodes['portfolio-search'].listeners.submit({preventDefault(){},submitter:nodes[mode==='ai'?'ai-search-button':'keyword-search-button']});
    // Allow the submitted async request and rendering microtasks to settle.
    for(let i=0;i<12;i++)await Promise.resolve();
  }
  return {nodes,submit,calls:()=>calls,scripts:()=>scripts};
}
test('UI default enables keywords and makes no AI or Turnstile requests',async()=>{
  const f=await loadUI();assert.equal(f.nodes['keyword-search-button'].disabled,false);assert.equal(f.nodes['ai-search-button'].disabled,true);
  await f.submit('keyword','CSS');assert.ok(f.nodes['search-results'].children.length);assert.equal(f.calls(),0);assert.equal(f.scripts(),0);
});
test('UI missing-information message matches the exact required text',async()=>{
  const f=await loadUI();await f.submit('keyword','Has Matthew lived in Japan?');
  assert.equal(f.nodes['search-empty'].hidden,false);assert.equal(f.nodes['search-empty'].textContent,'I couldn’t find that information on this website.');
});
test('UI daily exhaustion explains tomorrow and automatically shows keyword matches',async()=>{
  const f=await loadUI({enabled:true,apiResponse:{ok:false,body:{code:'daily_limit',message:DAILY_MESSAGE}}});
  await f.submit('ai','CSS');assert.equal(f.calls(),1);
  assert.ok(f.nodes['search-status'].textContent.includes(DAILY_MESSAGE));
  assert.ok(f.nodes['search-status'].textContent.includes('Showing keyword search results.'));
  assert.ok(f.nodes['search-results'].children.length);assert.equal(f.nodes['ai-search-button'].disabled,true);
});
test('UI network failure falls back locally without an automatic retry',async()=>{
  const f=await loadUI({enabled:true,throws:true});await f.submit('ai','networking');
  assert.equal(f.calls(),1);assert.ok(f.nodes['search-results'].children.length);
  assert.ok(f.nodes['search-status'].textContent.includes('manually'));
});
