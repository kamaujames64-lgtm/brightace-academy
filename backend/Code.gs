
/**
 * BrightAce Academy backend starter.
 * Deploy as a Web App. Store secrets in Script Properties.
 */
function doGet(e){
  const action=(e&&e.parameter&&e.parameter.action)||"health";
  if(action==="health")return json_({ok:true,service:"BrightAce Academy",time:new Date().toISOString()});
  if(action==="messages")return getMessages_(e.parameter.sessionId);
  return json_({ok:false,error:"Unknown GET action"});
}
function doPost(e){
  try{
    const b=JSON.parse(e.postData.contents||"{}");
    if(b.action==="startChat")return startChat_(b);
    if(b.action==="sendMessage")return saveWebsiteMessage_(b);
    if(b.object==="whatsapp_business_account")return handleWhatsAppWebhook_(b);
    return json_({ok:false,error:"Unknown POST action"});
  }catch(err){return json_({ok:false,error:String(err)})}
}
function startChat_(d){
  const sh=getSheet_("CONVERSATIONS",["conversationId","studentName","studentPhone","startedAt","lastMessageAt","status"]);
  const now=new Date(), id=d.id||("CHAT-"+now.getTime());
  sh.appendRow([id,d.name||"",d.phone||"",now,now,"open"]);
  if(d.firstMessage)saveMessage_(id,"student",d.firstMessage,"website");
  return json_({ok:true,conversationId:id});
}
function saveWebsiteMessage_(d){saveMessage_(d.sessionId,"student",d.text||"","website");return json_({ok:true})}
function saveMessage_(id,sender,text,source){
  const sh=getSheet_("MESSAGES",["messageId","conversationId","sender","text","source","timestamp","status"]);
  sh.appendRow([Utilities.getUuid(),id,sender,text,source,new Date(),"received"]);
}
function getMessages_(id){
  if(!id)return json_({ok:false,error:"sessionId required"});
  const sh=getSheet_("MESSAGES",["messageId","conversationId","sender","text","source","timestamp","status"]);
  const rows=sh.getDataRange().getValues();rows.shift();
  const messages=rows.filter(r=>String(r[1])===String(id)).map(r=>({id:r[0],sessionId:r[1],sender:r[2],text:r[3],source:r[4],timestamp:r[5],status:r[6]}));
  return json_({ok:true,messages:messages});
}
function handleWhatsAppWebhook_(payload){
  // TODO: parse Meta webhook events, map WhatsApp number to conversation,
  // save tutor messages, and expose them through getMessages_().
  return json_({ok:true,received:true});
}
function getSheet_(name,headers){
  const id=PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if(!id)throw new Error("Set SPREADSHEET_ID in Script Properties.");
  const ss=SpreadsheetApp.openById(id);let sh=ss.getSheetByName(name);
  if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(headers);return sh;
}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
