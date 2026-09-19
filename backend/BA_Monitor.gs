/* BrightAce V42 — low-cost performance/security telemetry. No message bodies or secrets are logged. */
function baMonitorRecord_(action,startedAt,ok){
  try{
    const ms=Math.max(0,Date.now()-Number(startedAt||Date.now())),bucket=ms<100?'lt100':ms<500?'lt500':ms<1500?'lt1500':ms<3000?'lt3000':'gte3000',key='BA_METRIC_'+String(action||'unknown').slice(0,60)+'_'+bucket,cache=CacheService.getScriptCache(),n=Number(cache.get(key)||0)+1;cache.put(key,String(n),21600);
    if(ms>=3000)console.warn('BrightAce slow request',String(action||''),ms,ok===false?'FAIL':'OK');
  }catch(e){}
}
function baSecurityEvent_(type,details){try{const safe=String(details||'').replace(/[\r\n]+/g,' ').slice(0,500);const key='BA_SEC_'+String(type||'EVENT').slice(0,40)+'_'+Utilities.getUuid();CacheService.getScriptCache().put(key,JSON.stringify({at:new Date().toISOString(),type:String(type||''),details:safe}),21600);}catch(e){}}
