/* BrightAce V53 — production reliability + observability.
   No message bodies, secrets, access tokens, phone numbers, or payment credentials
   are written to the operational event log. Persistent writes are reserved for
   failures and explicit operational events; normal request counts stay in cache.
*/
function baObservabilitySheet_(){
  const h=["timestamp","build","action","severity","category","message","durationMs","source"];
  return ensureColumns_(getSheet_("OPERATIONAL_EVENTS",h),h);
}
function baObservabilityCategory_(message){
  const m=String(message||"").toLowerCase();
  if(/session|login|verification|token|expired|authentication|authorized/.test(m))return "AUTH_ERROR";
  if(/rate|too many|blocked|suspend/.test(m))return "RATE_LIMIT";
  if(/payment|paystack|refund|payout|withdraw/.test(m))return "PAYMENT_ERROR";
  if(/whatsapp|delivery|provider|graph.facebook/.test(m))return "DELIVERY_ERROR";
  if(/spreadsheet|sheet|drive|storage|service unavailable/.test(m))return "DATA_ERROR";
  if(/timeout|timed out|time limit/.test(m))return "TIMEOUT";
  return "SERVER_ERROR";
}
function baObservabilitySafeMessage_(message){
  let s=String(message||"").replace(/https?:\/\/[^\s]+/gi,"[url]");
  s=s.replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g,"[phone]");
  s=s.replace(/(?:token|secret|password|accessToken|sessionToken|adminToken)\s*[:=]\s*[^\s,;]+/gi,"$1=[redacted]");
  return s.replace(/[\r\n]+/g," ").slice(0,500);
}
function baObservabilityRecordRequest_(action,startedAt,ok,errorMessage,source){
  try{
    const duration=Math.max(0,Date.now()-Number(startedAt||Date.now())),name=String(action||"unknown").slice(0,80),day=new Date().toISOString().slice(0,10),cache=CacheService.getScriptCache();
    const countKey="BA_OBS_REQ_"+day+"_"+name;
    cache.put(countKey,String(Number(cache.get(countKey)||0)+1),21600);
    if(ok===false){
      const category=baObservabilityCategory_(errorMessage),safe=baObservabilitySafeMessage_(errorMessage);
      const errorKey="BA_OBS_ERR_"+day+"_"+category;
      cache.put(errorKey,String(Number(cache.get(errorKey)||0)+1),21600);
      const sh=baObservabilitySheet_();
      sh.appendRow([new Date(),BRIGHTACE_BUILD,name,"ERROR",category,safe,duration,String(source||"API")]);
      PropertiesService.getScriptProperties().setProperty("BA_LAST_ERROR_AT",new Date().toISOString());
      PropertiesService.getScriptProperties().setProperty("BA_LAST_ERROR_CATEGORY",category);
    }
    baMonitorRecord_(name,startedAt,ok);
  }catch(e){console.error("V53 observability recorder failed: "+String(e&&e.message||e));}
}
function baObservabilityHealth_(){
  const props=PropertiesService.getScriptProperties();
  return {
    build:BRIGHTACE_BUILD,
    api:"brightace-json-v53",
    lastErrorAt:props.getProperty("BA_LAST_ERROR_AT")||"",
    lastErrorCategory:props.getProperty("BA_LAST_ERROR_CATEGORY")||"",
    deliveryWorkerLastRun:props.getProperty("BA_DELIVERY_WORKER_LAST_RUN")||"",
    deliveryWorkerLastStatus:props.getProperty("BA_DELIVERY_WORKER_LAST_STATUS")||"UNKNOWN",
    deliveryWorkerLastProcessed:Number(props.getProperty("BA_DELIVERY_WORKER_LAST_PROCESSED")||0),
    checkedAt:new Date().toISOString()
  };
}
function baObservabilityQueueSummary_(){
  const sh=getMessageDeliveryQueueSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out={total:0,queued:0,sending:0,retry:0,delivered:0,dead:0};
  for(let i=1;i<rows.length;i++){
    const s=String(rows[i][m.status-1]||"QUEUED").toUpperCase();out.total++;
    if(s==="QUEUED")out.queued++;else if(s==="SENDING")out.sending++;else if(s==="RETRY")out.retry++;else if(s==="DELIVERED")out.delivered++;else if(s==="DEAD")out.dead++;
  }
  return out;
}
function baObservabilityRecentErrors_(limit){
  const max=Math.max(1,Math.min(100,Number(limit||30))),sh=baObservabilitySheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=rows.length-1;i>=1&&out.length<max;i--)out.push({timestamp:rows[i][m.timestamp-1],build:String(rows[i][m.build-1]||""),action:String(rows[i][m.action-1]||""),severity:String(rows[i][m.severity-1]||""),category:String(rows[i][m.category-1]||""),message:String(rows[i][m.message-1]||""),durationMs:Number(rows[i][m.durationMs-1]||0),source:String(rows[i][m.source-1]||"")});
  return out;
}
function adminObservability_(token){
  requireAdmin_(token);
  const q=baObservabilityQueueSummary_();
  return json_({ok:true,health:baObservabilityHealth_(),queue:q,recentErrors:baObservabilityRecentErrors_(30),generatedAt:new Date().toISOString()});
}
