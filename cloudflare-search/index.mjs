import {DurableObject} from 'cloudflare:workers';
import manifest from './passages.json';
import {QuotaLedger} from './quota.mjs';
import {createHandler} from './service.mjs';

export class SearchQuota extends DurableObject {
  constructor(ctx,env) {super(ctx,env);this.ledger=new QuotaLedger(ctx.storage);}
  admit(identity) {return this.ledger.admit(identity);}
  reserve(identity) {return this.ledger.reserve(identity);}
}
export default {fetch:createHandler(manifest)};
