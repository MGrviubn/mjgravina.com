import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,randomUUID} from 'node:crypto';
import {QuotaLedger,calendar,dailyAllowance,LEDGER_KEY,OBJECT_NAME} from '../quota.mjs';
import {createHandler,DAILY_MESSAGE,NO_MATCH} from '../service.mjs';
import {searchKeywords} from '../../scripts/keyword-search.mjs';
globalThis.crypto ||= webcrypto;
const manifest=JSON.parse(await readFile(new URL('../passages.json',import.meta.url),'utf8'));

class MockPersistentStorage {
  constructor(){this.values=new Map();this.queue=Promise.resolve();this.fail=false;}
  transaction(fn){
    const task=this.queue.then(async()=>{
      if(this.fail) throw Error('Simulated storage outage');
      const copy=structuredClone(this.values);
      const result=await fn({get:async k=>structuredClone(copy.get(k)),put:async(k,v)=>copy.set(k,structuredClone(v))});
      this.values=copy;return result;
    });
    this.queue=task.catch(()=>{});return task;
  }
}
function fixture(options={}) {
  const state={now:Date.parse('2026-11-12T19:00:00Z'),calls:0,botCalls:0,options};
  const storage=new MockPersistentStorage();
  let ledger=new QuotaLedger(storage,()=>state.now);
  const env={AI_ENABLED:'true',SETUP_REVIEWED:'true',TURNSTILE_SECRET:'mock-secret',CLIENT_HASH_KEY:'a-mock-only-key-with-at-least-32-characters',QUOTAS:{idFromName:name=>{assert.equal(name,OBJECT_NAME);return name;},get:()=>({admit:v=>ledger.admit(v),reserve:v=>ledger.reserve(v)})},AI_SEARCH:{search:async args=>{
    state.calls++;state.args=args;
    if(options.upstreamError) throw Error('Simulated upstream error');
    return {chunks:options.chunks||[{score:0.9,text:'Untrusted upstream text must not be displayed',item:{key:manifest.passages.find(p=>p.text.includes('CSS')).source}}]};
  }}};
  const fetcher=async(url)=>{
    if(url.includes('siteverify')) {
      state.botCalls++;
      if(options.botError) throw Error('Simulated bot service failure');
      return Response.json({success:options.botSuccess!==false,hostname:options.hostname||'mjgravina.com',action:options.action||'portfolio-search',challenge_ts:new Date(state.now-(options.tokenAge||0)).toISOString()});
    }
    assert.equal(url,'https://mjgravina.com/search-data.json');
    if(options.manifestError) throw Error('Simulated site outage');
    return Response.json({version:options.stale?'obsolete':manifest.version});
  };
  return {state,storage,env,handle:createHandler(manifest,{fetcher,now:()=>state.now}),restart:()=>{ledger=new QuotaLedger(storage,()=>state.now);},ledger:()=>ledger};
}
function request(overrides={},headers={}) {
  return new Request('https://mjgravina.com/api/search',{method:'POST',headers:{origin:'https://mjgravina.com','content-type':'application/json','CF-Connecting-IP':'192.0.2.1',...headers},body:JSON.stringify({query:'Has Matthew used CSS?',token:randomUUID(),requestId:randomUUID(),version:manifest.version,...overrides})});
}
const bodyOf=response=>response.json();

test('approved monthly budget divides exactly across every month, including leap February',()=>{
  for(const days of [28,29,30,31]) {
    const portions=Array.from({length:days},(_,i)=>dailyAllowance(500,i+1,days));
    assert.equal(portions.reduce((a,b)=>a+b,0),500);
    assert.ok(Math.max(...portions)-Math.min(...portions)<=1);
  }
});
test('daily boundary uses Mountain Time',()=>{
  assert.equal(calendar(Date.parse('2026-11-12T06:59:59Z')).key,'2026-11-11');
  assert.equal(calendar(Date.parse('2026-11-12T07:00:00Z')).key,'2026-11-12');
});
test('question wording and exact keywords return published CSS passages',()=>{
  for(const query of ['Has Matthew used CSS?','CSS','styling']) assert.ok(searchKeywords(manifest,query).some(p=>/CSS/.test(p.text)));
});
test('related networking wording finds coursework and section links',()=>{
  for(const query of ['Show references to networking','network configuration','VLANs']) {
    const results=searchKeywords(manifest,query);assert.ok(results.length,query);
    assert.ok(results.every(p=>p.url.startsWith('/')&&p.url.includes('#')));
  }
});
test('missing information has no keyword evidence and uses exact required wording',()=>{
  assert.deepEqual(searchKeywords(manifest,'Has Matthew lived in Japan?'),[]);
  assert.equal(NO_MATCH,'I couldn’t find that information on this website.');
});
test('fictional quotations and class demonstrations are excluded from the factual index',()=>{
  assert.ok(manifest.passages.every(p=>!p.url.startsWith('/quotes')&&!p.url.startsWith('/wdd130/')));
  assert.deepEqual(searchKeywords(manifest,'Were I to await perfection'),[]);
  assert.ok(manifest.passages.every(p=>!p.text.includes('my work would never be finished')));
});
test('disabled configuration makes zero bot or upstream calls',async()=>{
  const f=fixture();f.env.AI_ENABLED='false';assert.equal((await f.handle(request(),f.env)).status,503);
  assert.equal(f.state.calls,0);assert.equal(f.state.botCalls,0);
});
test('valid request reserves quota and invokes exactly one retrieval-only hybrid search',async()=>{
  const f=fixture();const response=await f.handle(request(),f.env);assert.equal(response.status,200);
  const body=await bodyOf(response);assert.ok(body.results.length);assert.equal(f.state.calls,1);
  assert.ok(body.results.every(p=>p.text!=='Untrusted upstream text must not be displayed'));
  assert.equal(f.state.args.ai_search_options.retrieval.retrieval_type,'hybrid');
  assert.equal(f.state.args.ai_search_options.query_rewrite.enabled,false);
  assert.equal(f.state.args.ai_search_options.reranking.enabled,false);
});
test('unknown source URLs and fictional quote sources cannot become results',async()=>{
  const f=fixture({chunks:[{score:1,text:'Invented biographical claim',item:{key:'https://mjgravina.com/quotes.html'}},{score:1,item:{key:'https://evil.invalid/claim'}}]});
  const body=await bodyOf(await f.handle(request(),f.env));assert.deepEqual(body.results,[]);assert.equal(body.message,NO_MATCH);
});
for(const options of [{botSuccess:false},{hostname:'attacker.invalid'},{action:'other-action'},{tokenAge:301000},{botError:true},{stale:true},{manifestError:true}]) {
  test('validation fails closed: '+JSON.stringify(options),async()=>{
    const f=fixture(options);assert.notEqual((await f.handle(request(),f.env)).status,200);assert.equal(f.state.calls,0);
  });
}
test('simultaneous reuse of one bot token admits at most one upstream call',async()=>{
  const f=fixture(),token=randomUUID();
  const responses=await Promise.all(Array.from({length:30},(_,i)=>f.handle(request({token},{'CF-Connecting-IP':'192.0.2.'+(i+1)}),f.env)));
  assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(f.state.calls,1);
});
test('reused request ID with a different bot token is rejected',async()=>{
  const f=fixture(),requestId=randomUUID();
  await f.handle(request({requestId}),f.env);
  assert.equal((await f.handle(request({requestId}),f.env)).status,409);assert.equal(f.state.calls,1);
});
test('rapid submissions are limited per client before bot validation',async()=>{
  const f=fixture();for(let i=0;i<8;i++) await f.handle(request(),f.env);
  assert.equal(f.state.calls,5);assert.equal(f.state.botCalls,5);
});
test('simultaneous clients cannot exceed the strict shared daily allowance',async()=>{
  const f=fixture();
  const responses=await Promise.all(Array.from({length:120},(_,i)=>f.handle(request({}, {'CF-Connecting-IP':`192.0.2.${i+1}`}),f.env)));
  const cal=calendar(f.state.now),expected=dailyAllowance(500,cal.day,cal.days);
  assert.equal(f.state.calls,expected);assert.equal(responses.filter(r=>r.status===200).length,expected);
  const blocked=await bodyOf(await f.handle(request({}, {'CF-Connecting-IP':'198.51.100.1'}),f.env));
  assert.equal(blocked.code,'daily_limit');assert.equal(blocked.message,DAILY_MESSAGE);
});
test('persistent quota survives a simulated deployment restart',async()=>{
  const f=fixture();await f.handle(request(),f.env);f.restart();
  const ledger=f.storage.values.get(LEDGER_KEY);assert.equal(ledger.months['2026-11'].used,1);
  await f.handle(request(),f.env);assert.equal(f.storage.values.get(LEDGER_KEY).months['2026-11'].used,2);
});
test('storage failure prevents any paid search call',async()=>{
  const f=fixture();f.storage.fail=true;
  assert.equal((await f.handle(request(),f.env)).status,503);assert.equal(f.state.calls,0);assert.equal(f.state.botCalls,0);
});
test('reservation failure after a valid bot check prevents upstream search',async()=>{
  const f=fixture();const ledger=f.ledger();ledger.reserve=async()=>{throw Error('Simulated reservation outage');};
  assert.equal((await f.handle(request(),f.env)).status,503);assert.equal(f.state.calls,0);
});
test('upstream failure burns the reservation and does not trigger retries',async()=>{
  const f=fixture({upstreamError:true});assert.equal((await f.handle(request(),f.env)).status,502);
  assert.equal(f.state.calls,1);assert.equal(f.storage.values.get(LEDGER_KEY).months['2026-11'].used,1);
});
test('daily slots do not roll over and the next day receives its own allowance',async()=>{
  const f=fixture();await f.handle(request(),f.env);
  f.state.now=Date.parse('2026-11-13T19:00:00Z');
  const body=await bodyOf(await f.handle(request(),f.env));
  assert.equal(body.remaining,dailyAllowance(500,13,30)-1);
});
test('a complete simulated month reserves exactly 500 searches and no more',async()=>{
  const storage=new MockPersistentStorage();let now;
  const ledger=new QuotaLedger(storage,()=>now);let reserved=0;
  for(let day=1;day<=30;day++) {
    now=Date.parse(`2026-11-${String(day).padStart(2,'0')}T19:00:00Z`);
    for(let i=0;i<20;i++) {
      const identity={client:`client-${day}-${i}`,token:`token-${day}-${i}`,request:`request-${day}-${i}`};
      const admit=await ledger.admit(identity);
      if(admit.ok && (await ledger.reserve(identity)).ok) reserved++;
    }
  }
  assert.equal(reserved,500);assert.equal(storage.values.get(LEDGER_KEY).months['2026-11'].used,500);
});
test('new calendar month receives a fresh budget, preserving previous month counters',async()=>{
  const f=fixture();await f.handle(request(),f.env);f.state.now=Date.parse('2026-12-01T19:00:00Z');
  await f.handle(request(),f.env);const months=f.storage.values.get(LEDGER_KEY).months;
  assert.equal(months['2026-11'].used,1);assert.equal(months['2026-12'].used,1);
});
test('oversized and malformed requests never reach the paid service',async()=>{
  for(const change of [{query:'x'.repeat(241)},{token:'x'.repeat(2049)},{messages:[{role:'user',content:'bypass'}]},{query:'hi\nthere'},{requestId:'bad-id'},{version:'obsolete'}]) {
    const f=fixture();assert.notEqual((await f.handle(request(change),f.env)).status,200);assert.equal(f.state.calls,0);
  }
  const f=fixture();assert.notEqual((await f.handle(request({token:'x'.repeat(10000)}),f.env)).status,200);assert.equal(f.state.calls,0);
});
test('alternate endpoints, methods and forged browser origins cannot bypass validation',async()=>{
  const f=fixture();
  for(const path of ['/api/search?bypass=1','/api/admin/reset','/api/quota','/search','/chat/completions']) {
    assert.notEqual((await f.handle(new Request('https://mjgravina.com'+path,{method:'POST'}),f.env)).status,200);
  }
  assert.equal((await f.handle(new Request('https://mjgravina.com/api/search'),f.env)).status,405);
  assert.equal((await f.handle(request({}, {origin:'https://attacker.invalid'}),f.env)).status,403);
  assert.equal(f.state.calls,0);
});
