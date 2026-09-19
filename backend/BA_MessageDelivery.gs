/* BrightAce V48 — durable message delivery queue.
   Keeps WhatsApp delivery state in Sheets instead of short-lived CacheService
   entries. The queue is idempotent by queueId and supports bounded retries.
*/
function getMessageDeliveryQueueSheet_(){
  const h=["queueId","messageId","conversationId","direction","recipient","text","attachmentsJson","senderName","status","attempts","maxAttempts","nextAttemptAt","createdAt","updatedAt","lastError","providerMessageId"];
  return ensureColumns_(getSheet_("MESSAGE_DELIVERY_QUEUE",h),h);
}
function baEnqueueMessageDelivery_(d){
  const id=String(d.queueId||("MSG-"+Utilities.getUuid().replace(/-/g,"").slice(0,14).toUpperCase())).trim();
  if(!id)throw new Error("Message delivery id is required.");
  const sh=getMessageDeliveryQueueSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(String(rows[i][m.queueId-1]||"")===id){
    return baMessageDeliveryRow_(rows[i],i+1,m);
  }
  const now=new Date(),max=Math.max(1,Math.min(8,Number(d.maxAttempts||5)));
  sh.appendRow([id,String(d.messageId||""),String(d.conversationId||""),String(d.direction||""),normalizePhone_(d.recipient||""),String(d.text||""),d.attachments?JSON.stringify(d.attachments):"",String(d.senderName||""),"QUEUED",0,max,now,now,now,"",""]);
  return {queueId:id,status:"QUEUED",attempts:0,maxAttempts:max};
}
function baMessageDeliveryRow_(r,row,m){
  return {row:row,queueId:String(r[m.queueId-1]||""),messageId:String(r[m.messageId-1]||""),conversationId:String(r[m.conversationId-1]||""),direction:String(r[m.direction-1]||""),recipient:normalizePhone_(r[m.recipient-1]||""),text:String(r[m.text-1]||""),attachments:safeJson_(r[m.attachmentsJson-1]||""),senderName:String(r[m.senderName-1]||""),status:String(r[m.status-1]||"QUEUED").toUpperCase(),attempts:Number(r[m.attempts-1]||0),maxAttempts:Number(r[m.maxAttempts-1]||5),nextAttemptAt:r[m.nextAttemptAt-1]||"",createdAt:r[m.createdAt-1]||"",updatedAt:r[m.updatedAt-1]||"",lastError:String(r[m.lastError-1]||""),providerMessageId:String(r[m.providerMessageId-1]||"")};
}
function baGetMessageDeliveryByMessageId_(messageId){
  const id=String(messageId||"").trim();if(!id)return null;const sh=getMessageDeliveryQueueSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=rows.length-1;i>=1;i--)if(String(rows[i][m.messageId-1]||"")===id)return baMessageDeliveryRow_(rows[i],i+1,m);return null;
}
function baSetTutorMessageDeliveryStatus_(messageId,status){
  const id=String(messageId||"").trim();if(!id)return;
  try{const sh=getTutorMessagesSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);for(let i=1;i<rows.length;i++)if(String(rows[i][m.messageId-1]||"")===id){setByHeader_(sh,i+1,"status",String(status||"sent"));return;}}catch(e){console.error("Tutor message status update failed: "+String(e&&e.message||e))}
}
function baProcessMessageDelivery_(queueId){
  const sh=getMessageDeliveryQueueSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),id=String(queueId||"").trim();let q=null;
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.queueId-1]||"")===id){q=baMessageDeliveryRow_(rows[i],i+1,m);break;}
  if(!q)throw new Error("Message delivery queue item not found.");
  if(q.status==="DELIVERED"||q.status==="DEAD")return q;
  const now=new Date();if(q.nextAttemptAt&&new Date(q.nextAttemptAt).getTime()>now.getTime())return q;
  const attempt=q.attempts+1;setByHeader_(sh,q.row,"attempts",attempt);setByHeader_(sh,q.row,"updatedAt",now);setByHeader_(sh,q.row,"status","SENDING");
  try{
    if(!q.recipient)throw new Error("Delivery recipient is empty.");
    let result=null;
    if(q.text)result=sendWhatsAppText_(q.recipient,q.text);
    const files=Array.isArray(q.attachments)?q.attachments:(q.attachments?[q.attachments]:[]);
    files.forEach(function(a){if(a)result=sendWhatsAppMedia_(q.recipient,a);});
    if(result&&result.skipped)throw new Error(String(result.reason||"WhatsApp delivery skipped."));
    const providerId=String(result&&result.messages&&result.messages[0]&&result.messages[0].id||result&&result.messageId||"");
    setByHeader_(sh,q.row,"status","DELIVERED");setByHeader_(sh,q.row,"updatedAt",new Date());setByHeader_(sh,q.row,"lastError","");setByHeader_(sh,q.row,"providerMessageId",providerId);
    if(q.direction==="TUTOR_TO_ADMIN")baSetTutorMessageDeliveryStatus_(q.messageId,"sent");
    return Object.assign(q,{status:"DELIVERED",attempts:attempt,providerMessageId:providerId,result:result});
  }catch(e){
    const err=String(e&&e.message||e),dead=attempt>=q.maxAttempts,next=new Date(Date.now()+Math.min(60,Math.pow(2,attempt))*60*1000);
    setByHeader_(sh,q.row,"status",dead?"DEAD":"RETRY");setByHeader_(sh,q.row,"nextAttemptAt",next);setByHeader_(sh,q.row,"updatedAt",new Date());setByHeader_(sh,q.row,"lastError",err.slice(0,500));
    if(q.direction==="TUTOR_TO_ADMIN")baSetTutorMessageDeliveryStatus_(q.messageId,dead?"failed":"retrying");
    return Object.assign(q,{status:dead?"DEAD":"RETRY",attempts:attempt,lastError:err,nextAttemptAt:next});
  }
}
function baProcessMessageDeliveryQueue_(limit){
  const max=Math.max(1,Math.min(25,Number(limit||10))),sh=getMessageDeliveryQueueSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[],now=Date.now();
  for(let i=1;i<rows.length&&out.length<max;i++){
    const q=baMessageDeliveryRow_(rows[i],i+1,m);if(["DELIVERED","DEAD"].indexOf(q.status)>=0)continue;if(q.nextAttemptAt&&new Date(q.nextAttemptAt).getTime()>now)continue;
    out.push(baProcessMessageDelivery_(q.queueId));
  }
  return json_({ok:true,processed:out.length,results:out});
}
function baInstallMessageDeliveryTrigger_(){
  const triggers=ScriptApp.getProjectTriggers();for(let i=0;i<triggers.length;i++)if(triggers[i].getHandlerFunction()==="baProcessMessageDeliveryQueueTrigger_")return "EXISTS";
  ScriptApp.newTrigger("baProcessMessageDeliveryQueueTrigger_").timeBased().everyMinutes(1).create();return "CREATED";
}
function baProcessMessageDeliveryQueueTrigger_(){
  const started=Date.now();
  try{
    const raw=baProcessMessageDeliveryQueue_(15),result=safeJson_(raw&&raw.getContent?raw.getContent():raw)||{},props=PropertiesService.getScriptProperties();
    props.setProperty("BA_DELIVERY_WORKER_LAST_RUN",new Date().toISOString());
    props.setProperty("BA_DELIVERY_WORKER_LAST_STATUS","OK");
    props.setProperty("BA_DELIVERY_WORKER_LAST_PROCESSED",String(Number(result&&result.processed||0)));
    baMonitorRecord_("messageDeliveryWorker",started,true);
  }catch(e){
    const props=PropertiesService.getScriptProperties();
    props.setProperty("BA_DELIVERY_WORKER_LAST_RUN",new Date().toISOString());
    props.setProperty("BA_DELIVERY_WORKER_LAST_STATUS","ERROR");
    props.setProperty("BA_DELIVERY_WORKER_LAST_PROCESSED","0");
    baSecurityEvent_("DELIVERY_WORKER_ERROR",String(e&&e.message||e));
    baObservabilityRecordRequest_("messageDeliveryWorker",started,false,String(e&&e.message||e),"TRIGGER");
    console.error("V53 delivery queue trigger failed: "+String(e&&e.message||e));
  }
}
