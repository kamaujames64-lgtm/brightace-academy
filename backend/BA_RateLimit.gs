/* BrightAce V42 — lightweight abuse throttling. Uses CacheService so the limiter is fast and fail-open on cache faults. */
const BA_RATE_LIMITS_={
  auth:{limit:8,window:600},
  verification:{limit:8,window:600},
  messageWrite:{limit:60,window:60},
  generalWrite:{limit:90,window:60},
  read:{limit:180,window:60}
};
function baRateLimitKey_(body,action){
  const d=body||{}, token=String(d.adminToken||d.tutorToken||d.clientSessionToken||'').trim();
  const phone=normalizePhone_(d.phone||d.tutorPhone||'');
  const username=String(d.username||'').trim().toLowerCase();
  const identity=token?sha256Hex_(token):phone||username||String(d.conversationId||d.reference||'public');
  return 'BA_RL_'+String(action||'unknown').slice(0,50)+'_'+sha256Hex_(identity).slice(0,32);
}
function baRateLimit_(body,action){
  const a=String(action||'');
  if(!a||a==='health'||a==='messages'&&body&&body.sessionId){}
  let bucket='read';
  if(/login/i.test(a))bucket='auth';
  else if(/verification|Verify|resend/i.test(a))bucket='verification';
  else if(/sendMessage|SendMessage|Comment|submitRefund|tutorSubmit|assignWork|AcceptWork|DeclineWork|payment|Withdrawal|SaveWallet|UpdateWork|QaWork|CreateSchedule/i.test(a))bucket='messageWrite';
  else if(/^admin|^tutor|^client/i.test(a))bucket='generalWrite';
  const cfg=BA_RATE_LIMITS_[bucket]||BA_RATE_LIMITS_.read,key=baRateLimitKey_(body,a),cache=CacheService.getScriptCache(),now=Math.floor(Date.now()/1000);
  try{
    const raw=cache.get(key),state=raw?safeJson_(raw):null;
    if(!state||now-Number(state.startedAt||0)>=cfg.window){cache.put(key,JSON.stringify({startedAt:now,count:1}),cfg.window+5);return true;}
    const count=Number(state.count||0)+1;
    if(count>cfg.limit)throw new Error('Too many requests for this BrightAce action. Please wait a moment and try again.');
    cache.put(key,JSON.stringify({startedAt:Number(state.startedAt),count:count}),Math.max(5,cfg.window-(now-Number(state.startedAt))));
  }catch(e){if(String(e&&e.message||'').indexOf('Too many requests')===0)throw e;}
  return true;
}
