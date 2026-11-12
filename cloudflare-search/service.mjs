import {OBJECT_NAME} from './quota.mjs';
export const NO_MATCH='I couldn’t find that information on this website.';
export const DAILY_MESSAGE='Today’s AI search limit has been reached. Please use keyword search or browse the website manually, or come back tomorrow for AI search.';
const HOST='https://mjgravina.com';
const MAX_BODY=4096;

export async function readLimited(stream, max=MAX_BODY) {
  if(!stream) throw Error('Empty body');
  const reader=stream.getReader();let size=0,parts=[];
  try {
    while(true) {
      const {done,value}=await reader.read();if(done) break;
      size+=value.byteLength;
      if(size>max) {await reader.cancel();throw Error('Body too large');}
      parts.push(value);
    }
  } finally {reader.releaseLock();}
  const data=new Uint8Array(size);let offset=0;
  for(const part of parts) {data.set(part,offset);offset+=part.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(data);
}
async function digest(text) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
}
async function clientHash(ip,keyText) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(keyText),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip))),b=>b.toString(16).padStart(2,'0')).join('');
}
function json(status,data) {
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
function deny(code,status=429) {
  const message=code==='daily_limit' ? DAILY_MESSAGE : code==='attempt_limit' ? 'Today’s AI search activity limit has been reached. Please use keyword search or browse the website manually, or come back tomorrow for AI search.' : code==='client_limit' ? 'Please wait before trying AI search again. Keyword search is still available.' : 'AI search is unavailable right now. Please use keyword search.';
  return json(status,{code,message,fallback:'keyword'});
}

export function createHandler(manifest, dependencies={}) {
  const fetcher=dependencies.fetcher || fetch;
  const now=dependencies.now || Date.now;
  const allowedSources=new Map(manifest.passages.map(p=>[p.source,p]));
  return async function handle(request,env) {
    const url=new URL(request.url);
    if(url.origin!==HOST || url.pathname!=='/api/search' || url.search) return deny('not_found',404);
    if(request.method!=='POST') return json(405,{code:'method_not_allowed',fallback:'keyword'});
    // Origin checks are supplementary. Bot validation and coordinated counters
    // apply even if an attacker forges the Origin header outside a browser.
    if(request.headers.get('origin')!==HOST) return deny('origin_rejected',403);
    if(env.AI_ENABLED!=='true' || env.SETUP_REVIEWED!=='true') return deny('disabled',503);
    if(!env.TURNSTILE_SECRET || !env.CLIENT_HASH_KEY || env.CLIENT_HASH_KEY.length<32 || !env.AI_SEARCH || !env.QUOTAS) return deny('not_configured',503);
    if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json' || request.headers.has('content-encoding')) return deny('invalid_request',400);
    const length=request.headers.get('content-length');
    if(length && (!/^\d+$/.test(length) || Number(length)>MAX_BODY)) return deny('body_too_large',413);
    let body;
    try {body=JSON.parse(await readLimited(request.body));} catch {return deny('invalid_request',400);}
    if(!body || Array.isArray(body) || typeof body!=='object' || Object.keys(body).some(k=>!['query','token','requestId','version'].includes(k))) return deny('invalid_request',400);
    if(typeof body.query!=='string' || body.query.trim().length<2 || body.query.length>240 || /[\u0000-\u001F\u007F]/.test(body.query) || typeof body.token!=='string' || !body.token || body.token.length>2048 || typeof body.requestId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)) return deny('invalid_request',400);
    if(body.version!==manifest.version) return deny('content_changed',503);
    const ip=request.headers.get('CF-Connecting-IP');
    if(!ip || ip.length>64) return deny('client_unknown',400);
    let stub,identity;
    try {
      stub=env.QUOTAS.get(env.QUOTAS.idFromName(OBJECT_NAME));
      identity={client:await clientHash(ip,env.CLIENT_HASH_KEY),token:await digest(body.token),request:await digest(body.requestId)};
      const gate=await stub.admit(identity);
      if(!gate.ok) return deny(gate.code,gate.code==='replayed_request'?409:429);
    } catch {return deny('quota_unavailable',503);}
    try {
      const check=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:body.token,remoteip:ip}),signal:AbortSignal.timeout(5000)});
      if(!check.ok) return deny('bot_validation_unavailable',503);
      const verification=JSON.parse(await readLimited(check.body,8192));
      if(verification.success!==true || verification.hostname!=='mjgravina.com' || verification.action!=='portfolio-search') return deny('bot_rejected',403);
      const issued=Date.parse(verification.challenge_ts);
      if(!Number.isFinite(issued) || issued>now()+30000 || now()-issued>300000) return deny('bot_expired',403);
      // Fail closed if the published site has moved beyond the Worker bundle.
      const live=await fetcher(HOST+'/search-data.json',{headers:{'cache-control':'no-cache'},cache:'no-store',cf:{cacheTtl:0,cacheEverything:false},signal:AbortSignal.timeout(5000)});
      if(!live.ok) return deny('content_unavailable',503);
      const published=JSON.parse(await readLimited(live.body,200000));
      if(published.version!==manifest.version) return deny('content_changed',503);
    } catch {return deny('validation_unavailable',503);}
    let reservation;
    try {reservation=await stub.reserve(identity);} catch {return deny('quota_unavailable',503);}
    if(!reservation.ok) return deny(reservation.code);
    try {
      // Exactly one upstream search invocation; no chat completion, rewriting,
      // reranking, model selection from the client, fallback request, or retry.
      const upstream=env.AI_SEARCH.search({query:body.query.trim(),ai_search_options:{retrieval:{retrieval_type:'hybrid',match_threshold:0.5,max_num_results:8,context_expansion:0,return_on_failure:false},query_rewrite:{enabled:false},reranking:{enabled:false},cache:{enabled:false}}});
      let timer;
      const result=await Promise.race([upstream,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Upstream timeout')),12000);})]).finally(()=>clearTimeout(timer));
      if(!result || !Array.isArray(result.chunks)) return deny('upstream_invalid',502);
      const seen=new Set(),results=[];
      for(const chunk of result.chunks.slice(0,50)) {
        const row=allowedSources.get(chunk.item?.key);
        // AI ranks only approved source IDs. Display the exact current public
        // passage, never generated answers or untrusted upstream text/URLs.
        if(!row || seen.has(row.id) || !Number.isFinite(chunk.score) || chunk.score<0.5) continue;
        seen.add(row.id);results.push(row);
        if(results.length===6) break;
      }
      return json(200,{results,message:results.length?'':NO_MATCH,remaining:reservation.remaining,resetTimeZone:'America/Denver'});
    } catch {return deny('upstream_failed',502);}
  };
}
