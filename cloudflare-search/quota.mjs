export const MONTHLY_LIMIT = 500;
export const TIME_ZONE = 'America/Denver';
export const LEDGER_KEY = 'portfolio-quota-ledger-v1';
export const OBJECT_NAME = 'portfolio-ai-global-v1';
const dayFormat = new Intl.DateTimeFormat('en-CA', {timeZone: TIME_ZONE, year:'numeric', month:'2-digit', day:'2-digit'});

export function calendar(now) {
  const parts = Object.fromEntries(dayFormat.formatToParts(new Date(now)).map(p => [p.type,p.value]));
  const year=Number(parts.year), month=Number(parts.month), day=Number(parts.day);
  return {key:`${parts.year}-${parts.month}-${parts.day}`, month:`${parts.year}-${parts.month}`, day, days:new Date(Date.UTC(year,month,0)).getUTCDate()};
}
export function dailyAllowance(limit, day, days) {
  return Math.floor(day*limit/days)-Math.floor((day-1)*limit/days);
}

// All check-and-write operations use the same persistent transaction and the
// same globally named Durable Object. No external calls occur in transactions.
export class QuotaLedger {
  constructor(storage, now=Date.now) { this.storage=storage; this.now=now; }
  async update(operation) {
    const now=this.now(), cal=calendar(now);
    return this.storage.transaction(async tx => {
      let state=await tx.get(LEDGER_KEY);
      if (state===undefined) state={schema:1,months:{},clients:{},tokens:{},requests:{}};
      if (state.schema!==1 || !state.months || !state.clients || !state.tokens || !state.requests) throw Error('Invalid quota ledger');
      for (const collection of ['clients','tokens','requests']) {
        for (const [key,value] of Object.entries(state[collection])) if(value.expires<=now) delete state[collection][key];
      }
      // Preserve counters across deployments; retain the current and previous
      // calendar month. The clock moving backward never resets an existing key.
      const monthKeys=Object.keys(state.months).sort();
      for (const key of monthKeys.slice(0,-2)) if(key<cal.month) delete state.months[key];
      const month=state.months[cal.month] ||= {limit:MONTHLY_LIMIT,used:0,days:{},attempts:{},zone:TIME_ZONE};
      if (month.limit!==MONTHLY_LIMIT || month.zone!==TIME_ZONE || !Number.isSafeInteger(month.used) || month.used<0 || !month.days || !month.attempts) throw Error('Quota policy mismatch');
      const dayUsed=month.days[cal.key] || 0;
      if (!Number.isSafeInteger(dayUsed) || dayUsed<0) throw Error('Invalid daily counter');
      const allowance=dailyAllowance(month.limit,cal.day,cal.days);
      const result=operation({state,month,cal,now,allowance,dayUsed});
      await tx.put(LEDGER_KEY,state);
      return result;
    });
  }
  admit({client,token,request}) {
    return this.update(({state,month,cal,now,allowance,dayUsed}) => {
      if(dayUsed>=allowance || month.used>=month.limit) return {ok:false,code:'daily_limit'};
      if(state.requests[request] || state.tokens[token]) return {ok:false,code:'replayed_request'};
      if((month.attempts[cal.key]||0)>=200) return {ok:false,code:'attempt_limit'};
      const minute=Math.floor(now/60000);
      const prior=state.clients[client];
      const recent=prior && prior.minute===minute ? prior.count : 0;
      const today=prior && prior.day===cal.key ? prior.dayCount : 0;
      if(recent>=5 || today>=20) return {ok:false,code:'client_limit'};
      state.clients[client]={minute,count:recent+1,day:cal.key,dayCount:today+1,expires:now+26*3600000};
      month.attempts[cal.key]=(month.attempts[cal.key]||0)+1;
      state.tokens[token]={client,request,expires:now+10*60000};
      state.requests[request]={status:'admitted',expires:now+26*3600000};
      return {ok:true};
    });
  }
  reserve({client,token,request}) {
    return this.update(({state,month,cal,now,allowance,dayUsed}) => {
      const admission=state.tokens[token];
      if(!admission || admission.expires<=now || admission.client!==client || admission.request!==request || state.requests[request]?.status!=='admitted') return {ok:false,code:'replayed_request'};
      if(dayUsed>=allowance || month.used>=month.limit) return {ok:false,code:'daily_limit'};
      month.used+=1;
      month.days[cal.key]=dayUsed+1;
      state.requests[request].status='reserved';
      // Never refund ambiguous errors or timeouts: a reserved slot may already
      // have reached the upstream service. A new user attempt is a new slot.
      return {ok:true,dayLimit:allowance,remaining:allowance-dayUsed-1,monthRemaining:month.limit-month.used};
    });
  }
}
