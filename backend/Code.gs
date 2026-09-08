/**
 * BrightAce Academy — Live Chat + WhatsApp Cloud API backend
 *
 * Data flow:
 * Student browser -> Apps Script -> Google Sheets / Drive -> WhatsApp Cloud API
 * WhatsApp tutor reply -> Meta webhook -> Apps Script -> Google Sheets -> browser polling
 *
 * IMPORTANT: keep tokens in Apps Script Script Properties. Never put secrets in GitHub Pages JS.
 */

const CONFIG = {
  spreadsheetIdKey: "SPREADSHEET_ID",
  driveFolderIdKey: "CHAT_DRIVE_FOLDER_ID",
  metaTokenKey: "META_ACCESS_TOKEN",
  metaPhoneIdKey: "META_PHONE_NUMBER_ID",
  verifyTokenKey: "META_VERIFY_TOKEN",
  graphVersionKey: "META_GRAPH_VERSION",
  paystackSecretKey: "PAYSTACK_SECRET_KEY",
  paymentCallbackUrlKey: "PAYMENT_CALLBACK_URL",
  adminPasswordKey: "ADMIN_PASSWORD",
  adminWhatsAppKey: "ADMIN_WHATSAPP_PHONE",
  contactEmailKey: "CONTACT_EMAIL",
  otpTemplateNameKey: "META_OTP_TEMPLATE_NAME",
  otpTemplateLanguageKey: "META_OTP_TEMPLATE_LANGUAGE",
  defaultGraphVersion: "v24.0",
  maxFileBytes: 10 * 1024 * 1024
};

function doGet(e){
  const p=(e&&e.parameter)||{};
  if(p["hub.mode"] === "subscribe") return verifyWebhook_(p);
  const action=p.action||"health";
  if(action==="health") return json_({ok:true,service:"BrightAce Academy Live Chat",time:new Date().toISOString()});
  if(action==="messages") return getMessages_(p.sessionId);
  if(action==="paymentRequest") return getPaymentRequest_(p.requestId);
  if(action==="verifyPayment") return verifyPayment_(p.reference);
  if(action==="adminListWorkHistory") return adminListWorkHistory_(p.adminToken);
  return json_({ok:false,error:"Unknown GET action"});
}
function doPost(e){
  try{
    const body=parseBody_(e);
    if(body.object === "whatsapp_business_account") return handleWhatsAppWebhook_(body);
    if(body.event && body.data) return handlePaystackWebhook_(body);
    if(body.action === "startChat") return startChat_(body);
    if(body.action === "verifyChat") return verifyChat_(body);
    if(body.action === "resendVerification") return resendVerification_(body);
    if(body.action === "sendContactEmail") return sendContactEmail_(body);
    if(body.action === "sendMessage") return saveWebsiteMessage_(body);
    if(body.action === "initializePayment") return initializePayment_(body.requestId);
    if(body.action === "adminLogin") return adminLogin_(body.password);
    if(body.action === "adminListConversations") return adminListConversations_(body.adminToken);
    if(body.action === "adminGetConversation") return adminGetConversation_(body.adminToken, body.conversationId);
    if(body.action === "adminSendMessage") return adminSendMessage_(body);
    if(body.action === "adminListTutors") return adminListTutors_(body.adminToken);
    if(body.action === "adminAddTutor") return adminAddTutor_(body);
    if(body.action === "adminAssignWork") return adminAssignWork_(body);
    if(body.action === "adminListPayments") return adminListPayments_(body.adminToken);
    if(body.action === "adminCreatePaymentRequest") return adminCreatePaymentRequest_(body);
    if(body.action === "adminMarkWorkCompleted") return adminMarkWorkCompleted_(body);
    if(body.action === "adminRejectWork") return adminRejectWork_(body);
    if(body.action === "adminRestoreWork") return adminRestoreWork_(body);
    if(body.action === "adminListWorkHistory") return adminListWorkHistory_(body.adminToken);
    if(body.action === "adminSendTutorMessage") return adminSendTutorMessage_(body);
    if(body.action === "adminListTutorBalances") return adminListTutorBalances_(body.adminToken);
    if(body.action === "adminMarkTutorBalancePaid") return adminMarkTutorBalancePaid_(body);
    if(body.action === "submitRefundRequest") return submitRefundRequest_(body);
    if(body.action === "adminListRefundRequests") return adminListRefundRequests_(body.adminToken);
    if(body.action === "adminReviewRefundRequest") return adminReviewRefundRequest_(body);
    return json_({ok:false,error:"Unknown POST action"});
  }catch(err){
    console.error(err && err.stack ? err.stack : err);
    return json_({ok:false,error:String(err && err.message || err)});
  }
}

function parseBody_(e){
  if(e && e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  if(e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  return {};
}

function conversationHeaders_(){
  return ["conversationId","studentName","studentPhone","startedAt","lastMessageAt","status","assignedTutor","whatsappPhone","lastMessageId","studentEmail","workDescription","studentBudget","currency","deadline","assignmentStatus","assignedTutorPhone","tutorPayout","brightAceShare","agreedAmount","agreedCurrency","completedAt","rejectedAt","rejectionReason","verificationStatus","verificationCodeHash","verificationExpiresAt","verificationAttempts","verificationResendCount","verifiedAt"];
}
function ensureColumns_(sh,headers){
  const last=Math.max(sh.getLastColumn(),1);
  let current=sh.getRange(1,1,1,last).getValues()[0].map(String);
  if(sh.getLastRow()===0 || !current.some(Boolean)){
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    return sh;
  }
  headers.forEach(h=>{if(current.indexOf(h)<0){sh.getRange(1,sh.getLastColumn()+1).setValue(h);current.push(h)}});
  return sh;
}
function getConversationSheet_(){return ensureColumns_(getSheet_("CONVERSATIONS",conversationHeaders_()),conversationHeaders_())}
function headerMap_(sh){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String),m={};h.forEach((x,i)=>{if(x)m[x]=i+1});return m}
function setByHeader_(sh,row,header,value){const m=headerMap_(sh);if(m[header])sh.getRange(row,m[header]).setValue(value)}
function getByHeader_(sh,row,header){const m=headerMap_(sh);return m[header]?sh.getRange(row,m[header]).getValue():""}
function startChat_(d){
  if(!d.name||!d.phone||!d.taskDescription||!(Number(d.studentBudget)>0)) throw new Error("Name, WhatsApp number, task description and student budget are required.");
  const currency=String(d.currency||"KES").toUpperCase();
  if(["KES","USD","EUR"].indexOf(currency)<0) throw new Error("Choose KES, USD or EUR.");
  const phone=normalizePhone_(d.phone);
  if(phone.length<7) throw new Error("Enter a valid WhatsApp number.");
  const sh=getConversationSheet_(),now=new Date(),id=d.id||("CHAT-"+now.getTime());
  const existingById=findConversation_(id);
  if(existingById) return json_({ok:true,conversationId:existingById.conversationId,verificationRequired:String(existingById.verificationStatus||"").toUpperCase()!=="VERIFIED",verified:String(existingById.verificationStatus||"").toUpperCase()==="VERIFIED"});
  const row=sh.getLastRow()+1; sh.appendRow(new Array(conversationHeaders_().length).fill(""));
  setByHeader_(sh,row,"conversationId",id); setByHeader_(sh,row,"studentName",String(d.name).trim()); setByHeader_(sh,row,"studentPhone",phone); setByHeader_(sh,row,"startedAt",now); setByHeader_(sh,row,"lastMessageAt",now); setByHeader_(sh,row,"status","open"); setByHeader_(sh,row,"assignedTutor","Unassigned"); setByHeader_(sh,row,"whatsappPhone",phone); setByHeader_(sh,row,"assignmentStatus","PENDING_VERIFICATION"); setByHeader_(sh,row,"workDescription",String(d.taskDescription).trim()); setByHeader_(sh,row,"studentBudget",Number(d.studentBudget)); setByHeader_(sh,row,"currency",currency); setByHeader_(sh,row,"deadline",String(d.deadline||"")); setByHeader_(sh,row,"agreedAmount",Number(d.studentBudget)); setByHeader_(sh,row,"agreedCurrency",currency); setByHeader_(sh,row,"verificationStatus","PENDING"); setByHeader_(sh,row,"verificationAttempts",0); setByHeader_(sh,row,"verificationResendCount",0);
  const sent=sendVerificationCode_(id,phone);
  return json_({ok:true,conversationId:id,requestStatus:"PENDING_VERIFICATION",verificationRequired:true,message:"A 6-digit verification code has been sent to your WhatsApp number. Enter it to securely initiate the BrightAce live chat.",delivery:sent});
}
function sha256Hex_(text){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8);return bytes.map(function(b){const v=(b<0?b+256:b).toString(16);return v.length===1?"0"+v:v}).join("");}
function generateVerificationCode_(){return String(Math.floor(100000+Math.random()*900000));}
function sendVerificationCode_(conversationId,phone){
  const c=findConversation_(conversationId); if(!c) throw new Error("Verification request not found.");
  const code=generateVerificationCode_(),expires=new Date(Date.now()+10*60*1000),sh=getConversationSheet_();
  setByHeader_(sh,c.row,"verificationCodeHash",sha256Hex_(code)); setByHeader_(sh,c.row,"verificationExpiresAt",expires); setByHeader_(sh,c.row,"verificationAttempts",0);
  const props=PropertiesService.getScriptProperties(),template=String(props.getProperty(CONFIG.otpTemplateNameKey)||"").trim(),language=String(props.getProperty(CONFIG.otpTemplateLanguageKey)||"en_US").trim();
  let result;
  if(template){result=sendWhatsAppTemplate_(phone,template,language,[code]);}
  else {result=sendWhatsAppText_(phone,"Your BrightAce Academy verification code is: "+code+"\\n\\nThis code expires in 10 minutes. Do not share this code with anyone.");}
  if(result&&result.skipped) throw new Error("WhatsApp verification could not be sent because the WhatsApp credentials are not configured. Complete the BrightAce WhatsApp setup first.");
  return {sent:true,expiresAt:expires.toISOString()};
}
function verifyChat_(d){
  const id=String(d.conversationId||"").trim(),code=String(d.code||"").trim(); if(!id||!/^[0-9]{6}$/.test(code)) throw new Error("Enter the 6-digit verification code sent to WhatsApp.");
  const c=findConversation_(id); if(!c) throw new Error("Verification request not found.");
  if(String(c.verificationStatus||"").toUpperCase()==="VERIFIED") return json_({ok:true,verified:true,message:"WhatsApp is already verified. Your BrightAce live chat is connected."});
  const expiry=c.row?getByHeader_(getConversationSheet_(),c.row,"verificationExpiresAt"):""; if(expiry && new Date(expiry).getTime()<Date.now()) throw new Error("That verification code has expired. Request a new code.");
  const attempts=Number(c.row?getByHeader_(getConversationSheet_(),c.row,"verificationAttempts"):0)||0; if(attempts>=3) throw new Error("Too many incorrect attempts. Request a new verification code.");
  const sh=getConversationSheet_(),stored=String(getByHeader_(sh,c.row,"verificationCodeHash")||"");
  if(stored!==sha256Hex_(code)){setByHeader_(sh,c.row,"verificationAttempts",attempts+1);throw new Error("Incorrect verification code. Please check WhatsApp and try again.");}
  const now=new Date(); setByHeader_(sh,c.row,"verificationStatus","VERIFIED"); setByHeader_(sh,c.row,"verifiedAt",now); setByHeader_(sh,c.row,"assignmentStatus","NEW_REQUEST"); setByHeader_(sh,c.row,"verificationCodeHash",""); setByHeader_(sh,c.row,"verificationExpiresAt","");
  const saved=saveMessage_(id,"student",c.workDescription,"website",null); setByHeader_(sh,c.row,"lastMessageId",saved.id); setByHeader_(sh,c.row,"lastMessageAt",now);
  try{notifyAdminOfNewRequest_(id,c.studentName,c.studentPhone,c.workDescription,c.studentBudget,c.currency,c.deadline)}catch(e){console.error(e)}
  return json_({ok:true,verified:true,message:"WhatsApp verified successfully. Your BrightAce live chat is now connected."});
}
function resendVerification_(d){
  const id=String(d.conversationId||"").trim(); if(!id) throw new Error("Conversation ID is required."); const c=findConversation_(id); if(!c) throw new Error("Verification request not found."); if(String(c.verificationStatus||"").toUpperCase()==="VERIFIED") return json_({ok:true,verified:true,message:"Your WhatsApp number is already verified."});
  const sh=getConversationSheet_(),count=Number(getByHeader_(sh,c.row,"verificationResendCount")||0)||0; if(count>=3) throw new Error("The maximum of 3 new verification codes has been reached. Please start a new request."); setByHeader_(sh,c.row,"verificationResendCount",count+1);
  const sent=sendVerificationCode_(id,c.studentPhone); return json_({ok:true,message:"A new 6-digit verification code has been sent to your WhatsApp number.",remainingResends:Math.max(0,3-(count+1)),delivery:sent});
}
function sendContactEmail_(d){
  const name=String(d.name||"").trim(),email=String(d.email||"").trim(),subject=String(d.subject||"").trim(),message=String(d.message||"").trim();
  if(!name||!email||!subject||!message) throw new Error("Name, email, subject and message are required.");
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const props=PropertiesService.getScriptProperties(),to=String(props.getProperty(CONFIG.contactEmailKey)||props.getProperty("ADMIN_EMAIL")||Session.getEffectiveUser().getEmail()||"").trim(); if(!to) throw new Error("CONTACT_EMAIL is not configured in Apps Script Script Properties.");
  MailApp.sendEmail({to:to,replyTo:email,subject:"BrightAce Contact: "+subject,body:"New BrightAce website contact message\\n\\nName: "+name+"\\nEmail: "+email+"\\nSubject: "+subject+"\\n\\nMessage:\\n"+message});
  return json_({ok:true,sent:true});
}
function sendWhatsAppText_(to,text){
  const target=normalizePhone_(to), body=String(text||"").trim();
  if(!target) throw new Error("WhatsApp recipient number is missing.");
  if(!body) return null;
  const cfg=metaConfig_();
  if(!cfg.token || !cfg.phoneId) return {skipped:true,reason:"WhatsApp credentials not configured"};
  const url="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages";
  const payload={messaging_product:"whatsapp",to:target,type:"text",text:{preview_url:false,body:body.slice(0,4096)}};
  return graphPost_(url,payload,cfg.token);
}

function sendWhatsAppMedia_(to,a){
  const target=normalizePhone_(to);
  if(!target) throw new Error("WhatsApp recipient number is missing.");
  if(!a || !a.fileId) throw new Error("Attachment file is missing.");
  const cfg=metaConfig_();
  if(!cfg.token || !cfg.phoneId) return {skipped:true,reason:"WhatsApp credentials not configured"};
  const blob=DriveApp.getFileById(a.fileId).getBlob();
  const uploadUrl="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/media";
  const response=UrlFetchApp.fetch(uploadUrl,{
    method:"post",
    headers:{Authorization:"Bearer "+cfg.token},
    payload:{messaging_product:"whatsapp",file:blob},
    muteHttpExceptions:true
  });
  const raw=String(response.getContentText()||"");
  const out=safeJson_(raw);
  if(response.getResponseCode()>=300 || !out || !out.id){
    throw new Error("WhatsApp media upload failed (HTTP "+response.getResponseCode()+"): "+raw.slice(0,500));
  }
  const mime=String(a.mimeType||blob.getContentType()||"application/octet-stream").toLowerCase();
  let type="document";
  if(mime.indexOf("image/")===0) type="image";
  else if(mime.indexOf("video/")===0) type="video";
  else if(mime.indexOf("audio/")===0) type="audio";
  const media={id:out.id};
  if(type==="document") media.filename=String(a.name||blob.getName()||"attachment");
  const url="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages";
  return graphPost_(url,{messaging_product:"whatsapp",to:target,type:type,[type]:media},cfg.token);
}

function downloadWhatsAppMedia_(mediaId,filename,mimeType){
  const cfg=metaConfig_();
  if(!cfg.token || !mediaId) return null;
  const metaResponse=UrlFetchApp.fetch(
    "https://graph.facebook.com/"+cfg.version+"/"+mediaId,
    {headers:{Authorization:"Bearer "+cfg.token},muteHttpExceptions:true}
  );
  const metaRaw=String(metaResponse.getContentText()||"");
  const meta=safeJson_(metaRaw);
  if(metaResponse.getResponseCode()>=300 || !meta || !meta.url){
    throw new Error("Could not retrieve WhatsApp media.");
  }
  const mediaResponse=UrlFetchApp.fetch(
    meta.url,
    {headers:{Authorization:"Bearer "+cfg.token},muteHttpExceptions:true}
  );
  if(mediaResponse.getResponseCode()>=300){
    throw new Error("Could not download WhatsApp media.");
  }
  const blob=mediaResponse.getBlob().setName(filename||"whatsapp-attachment");
  return saveBlob_(blob,mimeType||blob.getContentType(),filename||"whatsapp-attachment");
}

function sendWhatsAppTemplate_(to,templateName,language,params){
  const cfg=metaConfig_(); if(!cfg.token||!cfg.phoneId)return {skipped:true,reason:"WhatsApp credentials not configured"};
  const parameters=(params||[]).map(function(x){return {type:"text",text:String(x)}});
  const payload={messaging_product:"whatsapp",to:to,type:"template",template:{name:templateName,language:{code:language},components:[{type:"body",parameters:parameters}]}};
  return graphPost_("https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages",payload,cfg.token);
}
function notifyAdminOfNewRequest_(id,name,phone,task,budget,currency,deadline){
  const props=PropertiesService.getScriptProperties(),adminPhone=normalizePhone_(props.getProperty(CONFIG.adminWhatsAppKey)||"");
  const text="🔔 New BrightAce work request\n\nWork ID: "+id+"\nStudent: "+name+"\nWhatsApp: +"+phone+"\nBudget: "+currency+" "+budget.toFixed(2)+(deadline?"\nDeadline: "+deadline:"")+"\n\nTask:\n"+task;
  if(adminPhone){try{sendWhatsAppText_(adminPhone,text)}catch(e){console.error("Admin WhatsApp notification failed: "+(e&&e.message||e))}}
}

function saveWebsiteMessage_(d){
  if(!d.sessionId) throw new Error("Session ID is required.");
  const c=findConversation_(d.sessionId); if(!c) throw new Error("Conversation not found.");
  if(String(c.verificationStatus||"").trim() && String(c.verificationStatus||"").toUpperCase()!=="VERIFIED") throw new Error("Verify your WhatsApp number before sending chat messages.");
  const raw=Array.isArray(d.attachments)?d.attachments:(d.attachment?[d.attachment]:[]),attachments=[];
  if(raw.length>5) throw new Error("You can attach up to 5 files per message.");
  let total=0;
  raw.forEach(a=>{if(!a||!a.dataUrl)return; total+=Number(a.size||0); if(total>30*1024*1024) throw new Error("Combined attachments are too large. Please send 30 MB or less at a time."); attachments.push(saveAttachment_(d.sessionId,a));});
  if(!String(d.text||"").trim()&&!attachments.length) throw new Error("Message or attachment is required.");
  const saved=saveMessage_(d.sessionId,"student",String(d.text||""),"website",attachments);
  updateConversation_(d.sessionId,new Date(),saved.id);
  let whatsapp=null; try{whatsapp=sendStudentMessageToWhatsApp_(c,String(d.text||""),attachments);}catch(err){console.error("WhatsApp delivery failed after message was saved: "+(err&&err.stack?err.stack:err));whatsapp={skipped:true,error:String(err&&err.message||err)}}
  return json_({ok:true,messageId:saved.id,attachment:attachments,attachments:attachments,whatsapp:whatsapp});
}

function saveMessage_(id,sender,text,source,attachment){
  const sh=getSheet_("MESSAGES",["messageId","conversationId","sender","text","source","timestamp","status","attachmentJson"]);
  const messageId=Utilities.getUuid();
  sh.appendRow([messageId,id,sender,text||"",source,new Date(),"received",attachment&&((Array.isArray(attachment)&&attachment.length)||!Array.isArray(attachment))?JSON.stringify(attachment):""]);
  return {id:messageId};
}

function getMessages_(id){
  if(!id) return json_({ok:false,error:"sessionId required"});
  const c=findConversation_(id); if(!c) return json_({ok:false,error:"Conversation not found."});
  if(String(c.verificationStatus||"").trim() && String(c.verificationStatus||"").toUpperCase()!=="VERIFIED") return json_({ok:false,error:"WhatsApp verification is required before accessing this chat."});
  const sh=getSheet_("MESSAGES",["messageId","conversationId","sender","text","source","timestamp","status","attachmentJson"]),rows=sh.getDataRange().getValues();
  if(rows.length<2) return json_({ok:true,messages:[]});
  const messages=rows.slice(1).filter(r=>String(r[1])===String(id)).map(r=>({id:String(r[0]),sessionId:String(r[1]),sender:String(r[2]),text:String(r[3]||""),source:String(r[4]),timestamp:r[5],status:String(r[6]||"received"),attachment:r[7]?safeJson_(r[7]):null}));
  return json_({ok:true,messages:messages});
}

function getPaymentRequest_(requestId){
  if(!requestId) return json_({ok:false,error:"Payment request ID is required."});
  const p=findPaymentRequest_(requestId);
  if(!p) return json_({ok:false,error:"Payment request not found."});
  return json_({ok:true,request:{
    requestId:p.requestId,
    service:p.service,
    amount:Number(p.amount),
    currency:p.currency,
    studentName:p.studentName,
    tutor:p.tutor,
    deliveryDeadline:p.deliveryDeadline,
    status:p.status,
    description:p.description
  }});
}

function initializePayment_(requestId){
  if(!requestId) throw new Error("Payment request ID is required.");
  const p=findPaymentRequest_(requestId);
  if(!p) throw new Error("Payment request not found.");
  if(String(p.status).toUpperCase()==="PAID") throw new Error("This payment request has already been paid.");
  if(String(p.status).toUpperCase()==="CANCELLED") throw new Error("This payment request has been cancelled.");
  const secret=String(PropertiesService.getScriptProperties().getProperty(CONFIG.paystackSecretKey)||"").trim();
  if(!secret) throw new Error("Paystack is not configured yet. Add PAYSTACK_SECRET_KEY in Script Properties.");
  if(!/^sk_(test|live)_/.test(secret)) throw new Error("Invalid Paystack secret-key format. PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_. Do not use the public pk_ key.");
  const amountMinor=toPaystackMinorUnit_(p.amount,p.currency);
  const reference="BA-"+String(requestId).replace(/[^A-Za-z0-9.=-]/g,"")+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,12);
  const callback=PropertiesService.getScriptProperties().getProperty(CONFIG.paymentCallbackUrlKey)||"https://kamaujames64-lgtm.github.io/brightace-academy/pages/payment.html";
  const payload={email:p.email,amount:String(amountMinor),currency:p.currency,reference:reference,callback_url:callback,metadata:JSON.stringify({paymentRequestId:p.requestId,conversationId:p.conversationId,service:p.service,description:p.description||""})};
  let response=UrlFetchApp.fetch("https://api.paystack.co/transaction/initialize",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+secret},payload:JSON.stringify(payload),muteHttpExceptions:true});
  let data=safeJson_(response.getContentText()||"")||{};
  if((response.getResponseCode()>=300 || !data.status || !data.data || !data.data.authorization_url) && /no active channel/i.test(String(data.message||""))){
    const cardPayload=Object.assign({},payload,{channels:["card"]});
    response=UrlFetchApp.fetch("https://api.paystack.co/transaction/initialize",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+secret},payload:JSON.stringify(cardPayload),muteHttpExceptions:true});
    data=safeJson_(response.getContentText()||"")||{};
  }
  if(response.getResponseCode()>=300 || !data.status || !data.data || !data.data.authorization_url){
    const msg=String(data.message||response.getContentText()||"Unknown Paystack error");
    if(/no active channel/i.test(msg)){
      throw new Error("Paystack initialization failed: No active payment channel is enabled for this Paystack account/currency. In Paystack Test Mode, make sure Card is enabled under Payment Channels and that the selected currency is enabled for the business. Paystack response: "+msg);
    }
    throw new Error("Paystack initialization failed: "+msg);
  }
  updatePaymentFields_(p.row,{status:"PENDING",paystackReference:reference,authorizationUrl:data.data.authorization_url});
  return json_({ok:true,authorizationUrl:data.data.authorization_url,reference:reference});
}

function verifyPayment_(reference){
  if(!reference) return json_({ok:false,error:"Payment reference is required."});
  const secret=PropertiesService.getScriptProperties().getProperty(CONFIG.paystackSecretKey)||"";
  if(!secret) return json_({ok:false,error:"Paystack is not configured yet."});
  const response=UrlFetchApp.fetch("https://api.paystack.co/transaction/verify/"+encodeURIComponent(reference),{headers:{Authorization:"Bearer "+secret},muteHttpExceptions:true});
  const data=safeJson_(response.getContentText()||"")||{};
  if(response.getResponseCode()>=300 || !data.status || !data.data) return json_({ok:false,error:data.message||"Unable to verify payment."});
  const tx=data.data;
  const p=findPaymentByReference_(reference);
  if(p && tx.status==="success") markPaymentPaidIfValid_(p,tx);
  return json_({ok:true,status:tx.status,reference:tx.reference,amount:tx.amount,currency:tx.currency,paidAt:tx.paid_at||"",paymentRequestId:p?p.requestId:""});
}

function handlePaystackWebhook_(payload){
  const event=String(payload.event||"");
  if(event!=="charge.success") return json_({ok:true,ignored:event});
  const tx=payload.data||{};
  if(!tx.reference) return json_({ok:true,ignored:"missing reference"});
  const p=findPaymentByReference_(tx.reference);
  if(!p) return json_({ok:true,ignored:"unknown reference"});
  try{
    verifyAndRecordPaystackReference_(p,tx.reference);
  }catch(err){
    console.error(err && err.stack ? err.stack : err);
  }
  return json_({ok:true,received:true});
}

function verifyAndRecordPaystackReference_(p,reference){
  const secret=PropertiesService.getScriptProperties().getProperty(CONFIG.paystackSecretKey)||"";
  if(!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  const response=UrlFetchApp.fetch("https://api.paystack.co/transaction/verify/"+encodeURIComponent(reference),{headers:{Authorization:"Bearer "+secret},muteHttpExceptions:true});
  const data=JSON.parse(response.getContentText()||"{}");
  if(response.getResponseCode()>=300 || !data.status || !data.data) throw new Error("Paystack verification failed.");
  const tx=data.data;
  if(tx.status!=="success") return tx;
  markPaymentPaidIfValid_(p,tx);
  return tx;
}

function markPaymentPaidIfValid_(p,tx){
  const expected=toPaystackMinorUnit_(p.amount,p.currency);
  const received=Number(tx.amount);
  if(received!==expected) throw new Error("Payment amount mismatch for "+p.requestId+". Expected "+expected+", received "+received+".");
  if(String(tx.currency||"").toUpperCase()!==String(p.currency||"").toUpperCase()) throw new Error("Payment currency mismatch for "+p.requestId+".");
  updatePaymentFields_(p.row,{status:"PAID",paystackReference:tx.reference,paidAt:tx.paid_at||new Date()});
}

function getPaymentSheet_(){
  const headers=["paymentRequestId","conversationId","studentName","studentPhone","studentEmail","tutor","service","amount","currency","deliveryDeadline","status","paystackReference","authorizationUrl","createdAt","paidAt","refundStatus","refundAmount","refundReason","serviceDescription"];
  const sh=getSheet_("PAYMENTS",headers);
  if(sh.getLastColumn()<headers.length) sh.getRange(1,headers.length).setValue(headers[headers.length-1]);
  return sh;
}

function findPaymentRequest_(requestId){
  const sh=getPaymentSheet_(); const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][0])===String(requestId)) return rowPayment_(rows[i],i+1);
  return null;
}

function findPaymentByReference_(reference){
  const sh=getPaymentSheet_(); const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][11])===String(reference)) return rowPayment_(rows[i],i+1);
  return null;
}

function rowPayment_(r,row){
  return {row:row,requestId:String(r[0]),conversationId:String(r[1]||""),studentName:String(r[2]||""),studentPhone:String(r[3]||""),email:String(r[4]||""),tutor:String(r[5]||"BrightAce Tutor"),service:String(r[6]||"Academic support"),amount:Number(r[7]||0),currency:String(r[8]||"KES").toUpperCase(),deliveryDeadline:r[9]||"",status:String(r[10]||"PENDING").toUpperCase(),paystackReference:String(r[11]||""),authorizationUrl:String(r[12]||""),createdAt:r[13]||"",paidAt:r[14]||"",refundStatus:String(r[15]||"NONE"),refundAmount:Number(r[16]||0),refundReason:String(r[17]||""),serviceDescription:String(r[18]||"")};
}

function updatePaymentFields_(row,fields){
  const sh=getPaymentSheet_();
  const map={status:11,paystackReference:12,authorizationUrl:13,paidAt:15,refundStatus:16,refundAmount:17,refundReason:18,serviceDescription:19};
  Object.keys(fields).forEach(k=>{if(map[k]) sh.getRange(row,map[k]).setValue(fields[k]);});
}

function toPaystackMinorUnit_(amount,currency){
  const n=Number(amount);
  if(!isFinite(n) || n<=0) throw new Error("Payment amount must be greater than zero.");
  // Paystack expects the currency's subunit. KES, NGN, GHS, ZAR and USD are represented in cents/cents-like subunits.
  return Math.round(n*100);
}


function adminLogin_(password){
  const configured=PropertiesService.getScriptProperties().getProperty(CONFIG.adminPasswordKey)||"";
  if(!configured)return json_({ok:false,error:"Admin access is not configured yet. Add ADMIN_PASSWORD in Apps Script Script Properties."});
  if(String(password||"")!==configured)return json_({ok:false,error:"Incorrect admin password."});
  const token=Utilities.getUuid()+Utilities.getUuid(); CacheService.getScriptCache().put("BA_ADMIN_"+token,"OWNER",21600); return json_({ok:true,adminToken:token,expiresIn:21600});
}
function requireAdmin_(token){if(!token||CacheService.getScriptCache().get("BA_ADMIN_"+token)!=="OWNER")throw new Error("Admin session expired. Please sign in again.");return true}
function getTutorSheet_(){return ensureColumns_(getSheet_("TUTORS",["tutorId","tutorName","tutorDisplayName","tutorPhone","whatsappType","status","createdAt"]),["tutorId","tutorName","tutorDisplayName","tutorPhone","whatsappType","status","createdAt"])}
function adminListTutors_(token){requireAdmin_(token);const sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];for(let i=1;i<rows.length;i++)if(rows[i][m.tutorId-1])out.push({tutorId:String(rows[i][m.tutorId-1]),tutorName:String(rows[i][m.tutorName-1]||""),tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||rows[i][m.tutorName-1]||""),tutorPhone:String(rows[i][m.tutorPhone-1]||""),whatsappType:String(rows[i][m.whatsappType-1]||"NONE").toUpperCase(),status:String(rows[i][m.status-1]||"ACTIVE")});if(!out.length){const props=PropertiesService.getScriptProperties();const n=props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor",p=props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"";if(n)out.push({tutorId:"PRIMARY",tutorName:n,tutorDisplayName:n,tutorPhone:p,whatsappType:p?"WHATSAPP":"NONE",status:"ACTIVE"})}return json_({ok:true,tutors:out})}
function adminAddTutor_(d){requireAdmin_(d.adminToken);if(!d.tutorName)throw new Error("Tutor name is required.");const sh=getTutorSheet_(),id="TUT-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase(),name=String(d.tutorName).trim(),display=String(d.tutorDisplayName||name).trim(),phone=normalizePhone_(d.tutorPhone||""),type=String(d.whatsappType||"NONE").toUpperCase();if(!["BUSINESS","WHATSAPP","NONE"].includes(type))throw new Error("Invalid WhatsApp type.");if(type!=="NONE"&&!phone)throw new Error("A WhatsApp number is required for the selected WhatsApp type.");sh.appendRow([id,name,display,phone,type,"ACTIVE",new Date()]);return json_({ok:true,tutor:{tutorId:id,tutorName:name,tutorDisplayName:display,tutorPhone:phone,whatsappType:type,status:"ACTIVE"}})}
function adminListConversations_(token){requireAdmin_(token);const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];for(let i=rows.length-1;i>=1;i--){const c=rowConversation_(rows[i],i+1,sh,m);const st=String(c.assignmentStatus||"").toUpperCase();if(c.status!=="closed" && st!=="COMPLETED" && st!=="REJECTED" && (!String(c.verificationStatus||"").trim() || String(c.verificationStatus||"").toUpperCase()==="VERIFIED")){const paid=findPaidPaymentForConversation_(c.conversationId);out.push({...c,paymentStatus:paid?paid.status:"PENDING",startedAt:c.startedAt})}}return json_({ok:true,conversations:out})}
function adminGetConversation_(token,conversationId){requireAdmin_(token);const c=findConversation_(conversationId);if(!c)throw new Error("Conversation not found.");if(String(c.verificationStatus||"").trim() && String(c.verificationStatus||"").toUpperCase()!=="VERIFIED")throw new Error("Student WhatsApp number has not been verified yet.");const sh=getSheet_("MESSAGES",["messageId","conversationId","sender","text","source","timestamp","status","attachmentJson"]),rows=sh.getDataRange().getValues(),messages=[];for(let i=1;i<rows.length;i++)if(String(rows[i][1])===String(conversationId))messages.push({id:String(rows[i][0]),sender:String(rows[i][2]||""),text:String(rows[i][3]||""),source:String(rows[i][4]||""),timestamp:rows[i][5],status:String(rows[i][6]||""),attachment:rows[i][7]?safeJson_(rows[i][7]):null});return json_({ok:true,conversation:{...c,messages:messages.slice(-100)}})}

function adminSendMessage_(d){
  requireAdmin_(d.adminToken); const c=findConversation_(d.conversationId); if(!c) throw new Error("Student request not found.");
  const text=String(d.text||"").trim(),raw=Array.isArray(d.attachments)?d.attachments:(d.attachment?[d.attachment]:[]),attachments=[];
  if(raw.length>5) throw new Error("You can attach up to 5 files per message.");
  let total=0; raw.forEach(a=>{if(!a||!a.dataUrl)return;total+=Number(a.size||0);if(total>30*1024*1024)throw new Error("Combined attachments are too large. Please send 30 MB or less at a time.");attachments.push(saveAttachment_(c.conversationId,a));});
  if(!text&&!attachments.length) throw new Error("Message or attachment is required.");
  const saved=saveMessage_(c.conversationId,"admin",text,"admin",attachments); updateConversation_(c.conversationId,new Date(),saved.id);
  let whatsapp={sent:false}; const target=normalizePhone_(c.studentPhone);
  try{if(text)whatsapp.text=sendWhatsAppText_(target,"BrightAce Admin:\n\n"+text); if(attachments.length)whatsapp.media=attachments.map(a=>sendWhatsAppMedia_(target,a)); whatsapp.sent=true;}catch(err){whatsapp={skipped:true,error:String(err&&err.message||err)}}
  return json_({ok:true,messageId:saved.id,attachment:attachments,attachments:attachments,whatsapp:whatsapp});
}
function adminAssignWork_(d){
  requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");const tutorName=String(d.tutorName||"").trim(),tutorPhone=normalizePhone_(d.tutorPhone||"");if(!tutorName)throw new Error("Select or enter a tutor.");if(!c.studentBudget||c.studentBudget<=0)throw new Error("Student budget is missing.");const gross=Number(c.agreedAmount||c.studentBudget),tutorPayout=Math.round(gross*0.60*100)/100,brightAce=Math.round(gross*0.40*100)/100;const sh=getConversationSheet_();setByHeader_(sh,c.row,"assignedTutor",tutorName);setByHeader_(sh,c.row,"assignedTutorPhone",tutorPhone);setByHeader_(sh,c.row,"tutorPayout",tutorPayout);setByHeader_(sh,c.row,"brightAceShare",brightAce);setByHeader_(sh,c.row,"assignmentStatus","ASSIGNED");setByHeader_(sh,c.row,"agreedAmount",gross);setByHeader_(sh,c.row,"agreedCurrency",c.agreedCurrency||c.currency);const tutorMsg="📚 BrightAce work assignment\n\nWork ID: "+c.conversationId+"\nClient: "+c.studentName+"\nDeadline: "+(c.deadline||"As agreed")+"\n\nTask:\n"+c.workDescription+"\n\nYour assigned payout: "+c.currency+" "+tutorPayout.toFixed(2)+"\n\nContinue discussing the assignment with the student through BrightAce.";
  let whatsappSent=false;
  if(tutorPhone){try{sendWhatsAppText_(tutorPhone,tutorMsg);whatsappSent=true}catch(e){console.error(e)}}
  // Never store the tutor-only payout message in the shared conversation.
  // Students must not be able to read BrightAce's 60/40 internal allocation.
  const studentMsg="📚 Your BrightAce request has been assigned to a tutor. You can continue discussing the work and any remaining details through this chat.";
  const saved=saveMessage_(c.conversationId,"admin",studentMsg,"admin",null);
  updateConversation_(c.conversationId,new Date(),saved.id);
  return json_({ok:true,assignment:{conversationId:c.conversationId,tutorName:tutorName,tutorPayout:tutorPayout,whatsappSent:whatsappSent,assignmentStatus:"ASSIGNED"}})}
function getTutorPayoutSheet_(){
  return ensureColumns_(getSheet_("TUTOR_PAYOUTS",["payoutId","tutorId","tutorName","workId","paymentRequestId","amount","currency","status","createdAt","paidAt","paymentReference","note","paidAmount","remainingAmount"]),["payoutId","tutorId","tutorName","workId","paymentRequestId","amount","currency","status","createdAt","paidAt","paymentReference","note","paidAmount","remainingAmount"]);
}
function findPaidPaymentForConversation_(conversationId){
  const sh=getPaymentSheet_(),rows=sh.getDataRange().getValues();
  for(let i=rows.length-1;i>=1;i--){
    const p=rowPayment_(rows[i],i+1);
    if(p.conversationId===String(conversationId) && p.status==="PAID") return p;
  }
  return null;
}
function findPayoutForWork_(workId){
  const sh=getTutorPayoutSheet_(),rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][3]||"")===String(workId)) return {row:i+1,values:rows[i]};
  return null;
}
function adminMarkWorkCompleted_(d){
  requireAdmin_(d.adminToken);
  const c=findConversation_(d.conversationId); if(!c) throw new Error("Student request not found.");
  if(!c.assignedTutor || c.assignedTutor==="Unassigned") throw new Error("Assign the work to a tutor first.");
  const paid=findPaidPaymentForConversation_(c.conversationId); if(!paid) throw new Error("The student payment must be confirmed as PAID before this work can be completed.");
  if(String(c.assignmentStatus).toUpperCase()==="COMPLETED") return json_({ok:true,workId:c.conversationId,status:"COMPLETED",tutor:c.assignedTutor,tutorPayout:Number(c.tutorPayout||0),currency:c.agreedCurrency||c.currency,alreadyCompleted:true});
  if(String(c.assignmentStatus).toUpperCase()==="REJECTED") throw new Error("Rejected work cannot be completed.");
  const amount=Number(c.agreedAmount||paid.amount||c.studentBudget||0),currency=String(c.agreedCurrency||paid.currency||c.currency||"KES").toUpperCase(),tutorPayout=Math.round(amount*0.60*100)/100;
  const existing=findPayoutForWork_(c.conversationId);
  if(!existing){
    const tutors=getTutorSheet_(),rows=tutors.getDataRange().getValues(); let tutorId="";
    for(let i=1;i<rows.length;i++) if(String(rows[i][1]||"")===String(c.assignedTutor)) tutorId=String(rows[i][0]||"");
    getTutorPayoutSheet_().appendRow(["PAY-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),tutorId,c.assignedTutor,c.conversationId,paid.requestId,tutorPayout,currency,"OWED",new Date(),"","",""]);
  }
  const csh=getConversationSheet_();setByHeader_(csh,c.row,"assignmentStatus","COMPLETED");setByHeader_(csh,c.row,"status","closed");setByHeader_(csh,c.row,"completedAt",new Date());
  return json_({ok:true,workId:c.conversationId,status:"COMPLETED",tutor:c.assignedTutor,tutorPayout:tutorPayout,currency:currency});
}
function adminRejectWork_(d){
  requireAdmin_(d.adminToken); const c=findConversation_(d.conversationId); if(!c) throw new Error("Student request not found.");
  const reason=String(d.reason||"").trim(); if(!reason) throw new Error("Please provide a rejection reason.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"assignmentStatus","REJECTED");setByHeader_(sh,c.row,"status","closed");setByHeader_(sh,c.row,"rejectedAt",new Date());setByHeader_(sh,c.row,"rejectionReason",reason);
  const msg="We’re sorry, but BrightAce cannot take this request forward at this time. Reason: "+reason;
  const saved=saveMessage_(c.conversationId,"admin",msg,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(normalizePhone_(c.studentPhone),"BrightAce Admin:\n\n"+msg)}catch(e){console.error(e)}
  return json_({ok:true,workId:c.conversationId,status:"REJECTED",reason:reason});
}
function adminRestoreWork_(d){
  requireAdmin_(d.adminToken); const c=findConversation_(d.conversationId); if(!c) throw new Error("Student request not found.");
  const sh=getConversationSheet_(); setByHeader_(sh,c.row,"status","open"); setByHeader_(sh,c.row,"assignmentStatus","NEW_REQUEST"); setByHeader_(sh,c.row,"completedAt",""); setByHeader_(sh,c.row,"rejectedAt",""); setByHeader_(sh,c.row,"rejectionReason","");
  const saved=saveMessage_(c.conversationId,"admin","This BrightAce request has been restored to the active work queue.","admin",null); updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(normalizePhone_(c.studentPhone),"BrightAce Admin:\\n\\nYour BrightAce request has been restored to the active work queue. Admin will review the next step with you.")}catch(e){console.error(e)}
  return json_({ok:true,workId:c.conversationId,status:"NEW_REQUEST"});
}
function adminListWorkHistory_(token){
  requireAdmin_(token); const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=rows.length-1;i>=1;i--){
    const c=rowConversation_(rows[i],i+1,sh,m),st=String(c.assignmentStatus||"NEW_REQUEST").toUpperCase();
    const closed=String(c.status||"").toLowerCase()==="closed";
    // History contains every lifecycle state. Completed/rejected are closed;
    // pending/assigned requests remain visible here as an audit trail.
    out.push({...c,assignmentStatus:st,requestedAt:c.startedAt||"",completedAt:m.completedAt?rows[i][m.completedAt-1]:"",rejectedAt:m.rejectedAt?rows[i][m.rejectedAt-1]:"",rejectionReason:m.rejectionReason?String(rows[i][m.rejectionReason-1]||""):"",isClosed:closed});
  }
  return json_({ok:true,works:out});
}
function adminSendTutorMessage_(d){
  requireAdmin_(d.adminToken); const phone=normalizePhone_(d.tutorPhone||""); const text=String(d.text||"").trim();
  if(!phone) throw new Error("Tutor WhatsApp number is missing."); if(!text) throw new Error("Message cannot be empty.");
  let result=null; try{result=sendWhatsAppText_(phone,"BrightAce Admin:\n\n"+text)}catch(e){throw new Error("Tutor message could not be sent: "+(e&&e.message||e));}
  return json_({ok:true,whatsapp:result});
}
function adminListTutorBalances_(token){
  requireAdmin_(token); const sh=getTutorPayoutSheet_(),rows=sh.getDataRange().getValues(),map={};
  for(let i=1;i<rows.length;i++){
    if(!rows[i][0]) continue; const name=String(rows[i][2]||""),currency=String(rows[i][6]||"KES").toUpperCase(),status=String(rows[i][7]||"OWED").toUpperCase(),earned=Number(rows[i][5]||0),legacyPaid=status==="PAID"?earned:0,rawPaid=rows[i][12],paidCol=(rawPaid===""||rawPaid===null||rawPaid===undefined)?legacyPaid:Number(rawPaid),paid=Math.min(earned,paidCol),remaining=Math.max(0,earned-paid),key=name+"|"+currency;
    if(!map[key])map[key]={tutorName:name,tutorId:String(rows[i][1]||""),currency,works:0,totalEarned:0,totalPaid:0,balance:0};
    map[key].works++;map[key].totalEarned+=earned;map[key].totalPaid+=paid;map[key].balance+=remaining;
  }
  return json_({ok:true,balances:Object.values(map).map(x=>({...x,totalEarned:Math.round(x.totalEarned*100)/100,totalPaid:Math.round(x.totalPaid*100)/100,balance:Math.round(x.balance*100)/100}))});
}
function adminMarkTutorBalancePaid_(d){
  requireAdmin_(d.adminToken); const tutorName=String(d.tutorName||"").trim(),currency=String(d.currency||"KES").toUpperCase(),reference=String(d.paymentReference||"").trim(),note=String(d.note||"").trim();
  const requested=Number(d.amount); if(!tutorName)throw new Error("Tutor is required."); if(!reference)throw new Error("Payment reference is required.");
  const sh=getTutorPayoutSheet_();ensureColumns_(sh,["payoutId","tutorId","tutorName","workId","paymentRequestId","amount","currency","status","createdAt","paidAt","paymentReference","note","paidAmount","remainingAmount"]);const rows=sh.getDataRange().getValues();let outstanding=0;
  for(let i=1;i<rows.length;i++)if(String(rows[i][2]||"")===tutorName&&String(rows[i][6]||"").toUpperCase()===currency){const earned=Number(rows[i][5]||0),status=String(rows[i][7]||"OWED").toUpperCase(),paid=status==="PAID"?earned:Number(rows[i][12]||0);outstanding+=Math.max(0,earned-paid)}
  outstanding=Math.round(outstanding*100)/100;if(outstanding<=0)throw new Error("This tutor has no outstanding balance in "+currency+".");
  let toPay=isFinite(requested)&&requested>0?Math.min(requested,outstanding):outstanding;toPay=Math.round(toPay*100)/100;let left=toPay;
  for(let i=1;i<rows.length&&left>0;i++)if(String(rows[i][2]||"")===tutorName&&String(rows[i][6]||"").toUpperCase()===currency){const earned=Number(rows[i][5]||0),status=String(rows[i][7]||"OWED").toUpperCase(),already=Math.min(earned,status==="PAID"?earned:Number(rows[i][12]||0)),remaining=Math.max(0,earned-already);if(remaining<=0)continue;const pay=Math.min(remaining,left),newPaid=already+pay,newRemaining=earned-newPaid;sh.getRange(i+1,8).setValue(newRemaining<=0?"PAID":"PARTIALLY_PAID");sh.getRange(i+1,10).setValue(newRemaining<=0?new Date():rows[i][9]||"");sh.getRange(i+1,11).setValue(reference);sh.getRange(i+1,12).setValue(note);sh.getRange(i+1,13).setValue(newPaid);sh.getRange(i+1,14).setValue(newRemaining);left=Math.round((left-pay)*100)/100;}
  const newBalance=Math.round((outstanding-toPay)*100)/100;return json_({ok:true,tutorName,currency,paidAmount:toPay,balance:newBalance,paymentReference:reference});
}
function getRefundSheet_(){
  return ensureColumns_(getSheet_("REFUND_REQUESTS",["refundId","conversationId","paymentRequestId","studentName","studentPhone","studentEmail","requestedAmount","currency","reason","status","createdAt","reviewedAt","approvedAmount","adminNote","paystackRefundId"]),["refundId","conversationId","paymentRequestId","studentName","studentPhone","studentEmail","requestedAmount","currency","reason","status","createdAt","reviewedAt","approvedAmount","adminNote","paystackRefundId"]);
}
function submitRefundRequest_(d){
  const c=findConversation_(d.conversationId);
  if(!c) throw new Error("Conversation not found.");
  const reason=String(d.reason||"").trim();
  if(!reason) throw new Error("Please provide a reason for the refund request.");
  const amount=Number(d.amount||0);
  if(amount<0) throw new Error("Refund amount cannot be negative.");
  const currency=String(d.currency||c.agreedCurrency||c.currency||"KES").toUpperCase();
  const sh=getRefundSheet_();
  const id="REF-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase();
  sh.appendRow([id,c.conversationId,String(d.paymentRequestId||""),c.studentName,c.studentPhone,String(d.studentEmail||""),amount,currency,reason,"PENDING",new Date(),"",0,"",""]);
  const msg="💳 Refund request received. BrightAce Admin will review your request and the reason provided. You will be contacted through this chat/WhatsApp with the outcome.";
  const saved=saveMessage_(c.conversationId,"admin",msg,"refund",null); updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(normalizePhone_(c.studentPhone),"BrightAce Refund Team:\n\n"+msg)}catch(e){console.error(e)}
  const adminPhone=normalizePhone_(PropertiesService.getScriptProperties().getProperty(CONFIG.adminWhatsAppKey)||"");
  if(adminPhone){try{sendWhatsAppText_(adminPhone,"💳 New refund request\n\nRefund ID: "+id+"\nWork ID: "+c.conversationId+"\nStudent: "+c.studentName+"\nAmount requested: "+currency+" "+amount.toFixed(2)+"\n\nReason:\n"+reason)}catch(e){console.error(e)}}
  return json_({ok:true,refund:{refundId:id,status:"PENDING"}});
}
function adminListRefundRequests_(token){
  requireAdmin_(token); const sh=getRefundSheet_(),rows=sh.getDataRange().getValues(),out=[];
  for(let i=rows.length-1;i>=1;i--){ if(!rows[i][0]) continue; out.push({row:i+1,refundId:String(rows[i][0]),conversationId:String(rows[i][1]||""),paymentRequestId:String(rows[i][2]||""),studentName:String(rows[i][3]||""),studentPhone:String(rows[i][4]||""),studentEmail:String(rows[i][5]||""),requestedAmount:Number(rows[i][6]||0),currency:String(rows[i][7]||"KES"),reason:String(rows[i][8]||""),status:String(rows[i][9]||"PENDING").toUpperCase(),createdAt:rows[i][10]||"",reviewedAt:rows[i][11]||"",approvedAmount:Number(rows[i][12]||0),adminNote:String(rows[i][13]||""),paystackRefundId:String(rows[i][14]||"")}); }
  return json_({ok:true,refunds:out.slice(0,100)});
}
function paystackRefund_(reference,amount,currency){
  const secret=String(PropertiesService.getScriptProperties().getProperty(CONFIG.paystackSecretKey)||"").trim();
  if(!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  if(!reference) throw new Error("No Paystack transaction reference is available for this refund.");
  const payload={transaction:reference};
  if(amount>0) payload.amount=Math.round(amount*100);
  const r=UrlFetchApp.fetch("https://api.paystack.co/refund",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+secret},payload:JSON.stringify(payload),muteHttpExceptions:true});
  const data=JSON.parse(r.getContentText()||"{}");
  if(r.getResponseCode()>=300 || !data.status) throw new Error("Paystack refund failed: "+(data.message||r.getContentText()));
  return data.data||{};
}
function adminReviewRefundRequest_(d){
  requireAdmin_(d.adminToken); const id=String(d.refundId||"").trim(),decision=String(d.decision||"").toUpperCase(),note=String(d.adminNote||"").trim();
  if(!id) throw new Error("Refund ID is required.");
  if(["APPROVE","REJECT"].indexOf(decision)<0) throw new Error("Choose approve or reject.");
  const sh=getRefundSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh); let row=-1,obj=null;
  for(let i=1;i<rows.length;i++) if(String(rows[i][m.refundId-1])===id){row=i+1;obj={conversationId:String(rows[i][m.conversationId-1]||""),paymentRequestId:String(rows[i][m.paymentRequestId-1]||""),studentPhone:String(rows[i][m.studentPhone-1]||""),requestedAmount:Number(rows[i][m.requestedAmount-1]||0),currency:String(rows[i][m.currency-1]||"KES").toUpperCase()};break;}
  if(row<0) throw new Error("Refund request not found.");
  if(decision==="REJECT"){setByHeader_(sh,row,"status","REJECTED");setByHeader_(sh,row,"reviewedAt",new Date());setByHeader_(sh,row,"adminNote",note||"Refund request rejected after review.");const msg="Your BrightAce refund request has been reviewed and was not approved at this time."+(note?" Reason: "+note:"");const saved=saveMessage_(obj.conversationId,"admin",msg,"refund",null);updateConversation_(obj.conversationId,new Date(),saved.id);try{sendWhatsAppText_(normalizePhone_(obj.studentPhone),"BrightAce Refund Team:\n\n"+msg)}catch(e){}return json_({ok:true,status:"REJECTED"});}
  const amount=Number(d.approvedAmount||obj.requestedAmount||0); if(!(amount>0)) throw new Error("Approved refund amount must be greater than 0.");
  if(obj.currency!=="KES" && obj.currency!=="USD") throw new Error("Paystack refunds in this BrightAce setup are available for KES or USD. Review EUR refunds manually.");
  const p=findPaymentRequest_(obj.paymentRequestId); if(!p || !p.paystackReference) throw new Error("No verified Paystack transaction reference is linked to this refund request.");
  const ref=paystackRefund_(p.paystackReference,amount,obj.currency);
  setByHeader_(sh,row,"status","APPROVED");setByHeader_(sh,row,"reviewedAt",new Date());setByHeader_(sh,row,"approvedAmount",amount);setByHeader_(sh,row,"adminNote",note||"Refund approved.");setByHeader_(sh,row,"paystackRefundId",String(ref.id||ref.reference||""));
  const msg="Your BrightAce refund request has been approved for "+obj.currency+" "+amount.toFixed(2)+". The refund has been submitted through the payment processor.";const saved=saveMessage_(obj.conversationId,"admin",msg,"refund",null);updateConversation_(obj.conversationId,new Date(),saved.id);try{sendWhatsAppText_(normalizePhone_(obj.studentPhone),"BrightAce Refund Team:\n\n"+msg)}catch(e){}
  return json_({ok:true,status:"APPROVED",approvedAmount:amount,currency:obj.currency,paystackRefundId:String(ref.id||ref.reference||"")});
}
function adminListPayments_(token){requireAdmin_(token);const sh=getPaymentSheet_(),rows=sh.getDataRange().getValues(),out=[];for(let i=rows.length-1;i>=1;i--){const p=rowPayment_(rows[i],i+1);out.push({requestId:p.requestId,conversationId:p.conversationId,studentName:p.studentName,studentPhone:p.studentPhone,studentEmail:p.email,tutor:p.tutor,service:p.service,description:p.serviceDescription,amount:p.amount,currency:p.currency,deliveryDeadline:p.deliveryDeadline,status:p.status,createdAt:p.createdAt,paidAt:p.paidAt,refundStatus:p.refundStatus})}return json_({ok:true,payments:out.slice(0,100)})}
function adminCreatePaymentRequest_(d){
  requireAdmin_(d.adminToken);if(!d.conversationId)throw new Error("Select a student request.");if(!d.studentEmail)throw new Error("Student email is required for Paystack checkout.");if(!d.service)throw new Error("Service is required.");if(Number(d.amount)<=0)throw new Error("Amount must be greater than zero.");const currency=String(d.currency||"KES").toUpperCase();if(["KES","USD","EUR"].indexOf(currency)<0)throw new Error("Choose KES, USD or EUR.");if(currency==="EUR")throw new Error("EUR can be recorded as a BrightAce budget, but Paystack's Kenya integration currently supports KES and USD for direct checkout. Use KES or USD for a Paystack payment request.");const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");const amount=Number(d.amount),tutorPayout=Math.round(amount*.60*100)/100,brightAce=Math.round(amount*.40*100)/100;const csh=getConversationSheet_();setByHeader_(csh,c.row,"agreedAmount",amount);setByHeader_(csh,c.row,"agreedCurrency",currency);setByHeader_(csh,c.row,"tutorPayout",tutorPayout);setByHeader_(csh,c.row,"brightAceShare",brightAce);setByHeader_(csh,c.row,"assignmentStatus",c.assignmentStatus==="ASSIGNED"?"ASSIGNED":"PAYMENT_PENDING");const sh=getPaymentSheet_(),now=new Date(),requestId="BA-REQ-"+Utilities.formatDate(now,Session.getScriptTimeZone()||"GMT","yyyyMMdd-HHmmss")+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,6).toUpperCase();sh.appendRow([requestId,c.conversationId,c.studentName,c.studentPhone,String(d.studentEmail).trim(),c.assignedTutor||"BrightAce Tutor",String(d.service).trim(),amount,currency,String(d.deliveryDeadline||c.deadline||"").trim(),"PENDING","","",now,"","NONE",0,"",String(d.description||c.workDescription||"").trim()]);const paymentUrl="https://kamaujames64-lgtm.github.io/brightace-academy/pages/payment.html?request="+encodeURIComponent(requestId);const paymentMessage="🛡️ BrightAce secure payment request\n\nService: "+String(d.service).trim()+"\nAmount: "+currency+" "+amount.toFixed(2)+(d.deliveryDeadline?"\nDelivery deadline: "+String(d.deliveryDeadline).trim():"")+"\n\nPay securely here:\n"+paymentUrl+"\n\nNever send payment directly to a tutor. This payment request is linked to your BrightAce conversation.";let whatsappSent=false;if(d.sendWhatsApp===true){try{const result=sendWhatsAppText_(normalizePhone_(c.studentPhone),paymentMessage);whatsappSent=!result?.skipped}catch(e){console.error(e)}}const saved=saveMessage_(c.conversationId,"tutor",paymentMessage,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);return json_({ok:true,paymentRequest:{requestId,conversationId:c.conversationId,studentName:c.studentName,studentPhone:c.studentPhone,studentEmail:String(d.studentEmail).trim(),tutor:c.assignedTutor||"BrightAce Tutor",service:String(d.service).trim(),description:String(d.description||c.workDescription||"").trim(),amount,currency,deliveryDeadline:String(d.deliveryDeadline||c.deadline||"").trim(),status:"PENDING",paymentUrl,whatsappSent,messageId:saved.id,tutorPayout,brightAceShare:brightAce}})}

function handleWhatsAppWebhook_(payload){
  const entries=payload.entry||[];
  entries.forEach(entry=>{
    (entry.changes||[]).forEach(change=>{
      const value=change.value||{};
      const messages=value.messages||[];
      messages.forEach(msg=>processIncomingWhatsAppMessage_(msg));
      const statuses=value.statuses||[];
      statuses.forEach(s=>updateMessageStatus_(s));
    });
  });
  return json_({ok:true,received:true});
}

function processIncomingWhatsAppMessage_(msg){
  const from=normalizePhone_(msg.from||"");
  if(!from)return;
  let c=findConversationByTutorPhone_(from);
  const senderRole=c ? "tutor" : "student";
  if(!c) c=findConversationByPhone_(from);
  if(!c){
    const sh=getConversationSheet_();
    const now=new Date(); const id="CHAT-WA-"+now.getTime();
    const row=sh.getLastRow()+1; sh.appendRow(new Array(conversationHeaders_().length).fill(""));
    setByHeader_(sh,row,"conversationId",id); setByHeader_(sh,row,"studentName","WhatsApp student"); setByHeader_(sh,row,"studentPhone",from); setByHeader_(sh,row,"startedAt",now); setByHeader_(sh,row,"lastMessageAt",now); setByHeader_(sh,row,"status","open"); setByHeader_(sh,row,"assignedTutor","Unassigned"); setByHeader_(sh,row,"whatsappPhone",from); setByHeader_(sh,row,"assignmentStatus","NEW_REQUEST");
    c=findConversation_(id);
  }
  let text=""; let attachment=null;
  if(msg.type==="text") text=msg.text?.body||"";
  else if(["image","document","audio","video","sticker"].indexOf(msg.type)>=0){
    const media=msg[msg.type]||{};
    attachment=downloadWhatsAppMedia_(media.id,media.filename||("whatsapp-"+msg.type),media.mime_type||"");
    text=media.caption||"";
  } else text="[WhatsApp message: "+msg.type+"]";
  const saved=saveMessage_(c.conversationId,senderRole,text,"whatsapp",attachment);
  updateConversation_(c.conversationId,new Date(),saved.id);
}

function sendStudentMessageToWhatsApp_(c,text,attachments){
  const target=normalizePhone_(c.studentPhone); let result={sentTo:target};
  if(text) result.text=sendWhatsAppText_(target,text);
  const list=Array.isArray(attachments)?attachments:(attachments?[attachments]:[]);
  if(list.length) result.media=list.map(a=>sendWhatsAppMedia_(target,a));
  return result;
}

function saveAttachment_(sessionId,a){
  if(!a.dataUrl) return null;
  const bytes=Utilities.base64Decode(String(a.dataUrl).split(",").pop());
  if(bytes.length>CONFIG.maxFileBytes) throw new Error("Attachment is larger than 10 MB.");
  const mime=a.mimeType||"application/octet-stream";
  const blob=Utilities.newBlob(bytes,mime,a.name||"attachment");
  return saveBlob_(blob,mime,a.name||"attachment",sessionId);
}

function saveBlob_(blob,mime,name,sessionId){
  const folder=getDriveFolder_();
  const file=folder.createFile(blob).setName(name||"attachment");
  // Chat recipients need to be able to open an attachment without a Google account.
  // Do not use this mode for highly sensitive documents; replace with authenticated
  // file serving before production if private records will be shared.
  try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW)}catch(e){}
  const id=file.getId();
  return {fileId:id,name:file.getName(),mimeType:mime||file.getMimeType(),size:file.getSize(),viewUrl:"https://drive.google.com/uc?export=view&id="+id,downloadUrl:"https://drive.google.com/uc?export=download&id="+id,driveUrl:file.getUrl()};
}

function getDriveFolder_(){
  const id=PropertiesService.getScriptProperties().getProperty(CONFIG.driveFolderIdKey);
  if(id) return DriveApp.getFolderById(id);
  const folder=DriveApp.createFolder("BrightAce Chat Attachments");
  PropertiesService.getScriptProperties().setProperty(CONFIG.driveFolderIdKey,folder.getId());
  return folder;
}

function verifyWebhook_(p){
  const token=PropertiesService.getScriptProperties().getProperty(CONFIG.verifyTokenKey)||"";
  if(p["hub.verify_token"]===token) return ContentService.createTextOutput(p["hub.challenge"]||"");
  return ContentService.createTextOutput("Verification failed");
}

function metaConfig_(){
  const props=PropertiesService.getScriptProperties();
  return {token:props.getProperty(CONFIG.metaTokenKey)||"",phoneId:props.getProperty(CONFIG.metaPhoneIdKey)||"",version:props.getProperty(CONFIG.graphVersionKey)||CONFIG.defaultGraphVersion};
}
function graphPost_(url,payload,token){
  const r=UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+token},payload:JSON.stringify(payload),muteHttpExceptions:true});
  const raw=String(r.getContentText()||"");
  let data=null;
  try{data=JSON.parse(raw)}catch(e){
    throw new Error("WhatsApp API returned an invalid response (HTTP "+r.getResponseCode()+").");
  }
  if(r.getResponseCode()>=300 || data.error) throw new Error("WhatsApp API error: "+raw);
  return data;
}
function normalizePhone_(phone){return String(phone||"").replace(/[^0-9]/g,"");}
function safeJson_(s){try{return JSON.parse(s)}catch(e){return null}}
function findConversation_(id){
  const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(String(rows[i][m.conversationId-1])===String(id)) return rowConversation_(rows[i],i+1,sh,m);
  return null;
}
function findConversationByPhone_(phone){
  const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=rows.length-1;i>=1;i--) if(normalizePhone_(rows[i][m.studentPhone-1])===phone&&String(rows[i][m.status-1])!=="closed") return rowConversation_(rows[i],i+1,sh,m);
  return null;
}
function rowConversation_(r,row,sh,m){return {row:row,conversationId:String(r[m.conversationId-1]||""),studentName:String(r[m.studentName-1]||""),studentPhone:String(r[m.studentPhone-1]||""),startedAt:r[m.startedAt-1]||"",lastMessageAt:r[m.lastMessageAt-1]||"",status:String(r[m.status-1]||"open"),assignedTutor:String(r[m.assignedTutor-1]||"Unassigned"),whatsappPhone:String(r[m.whatsappPhone-1]||r[m.studentPhone-1]||""),studentEmail:String(m.studentEmail?r[m.studentEmail-1]||"":""),workDescription:String(r[m.workDescription-1]||""),studentBudget:Number(r[m.studentBudget-1]||0),currency:String(r[m.currency-1]||"KES").toUpperCase(),deadline:String(r[m.deadline-1]||""),assignmentStatus:String(r[m.assignmentStatus-1]||"NEW_REQUEST"),assignedTutorPhone:String(r[m.assignedTutorPhone-1]||""),tutorPayout:Number(r[m.tutorPayout-1]||0),brightAceShare:Number(r[m.brightAceShare-1]||0),agreedAmount:Number(r[m.agreedAmount-1]||r[m.studentBudget-1]||0),agreedCurrency:String(r[m.agreedCurrency-1]||r[m.currency-1]||"KES").toUpperCase(),completedAt:m.completedAt?r[m.completedAt-1]:"",rejectedAt:m.rejectedAt?r[m.rejectedAt-1]:"",rejectionReason:m.rejectionReason?String(r[m.rejectionReason-1]||""):"",verificationStatus:m.verificationStatus?String(r[m.verificationStatus-1]||"").toUpperCase():"",verificationCodeHash:m.verificationCodeHash?String(r[m.verificationCodeHash-1]||""):"",verificationExpiresAt:m.verificationExpiresAt?r[m.verificationExpiresAt-1]:"",verificationAttempts:m.verificationAttempts?Number(r[m.verificationAttempts-1]||0):0,verificationResendCount:m.verificationResendCount?Number(r[m.verificationResendCount-1]||0):0,verifiedAt:m.verifiedAt?r[m.verifiedAt-1]:""};}
function findConversationByTutorPhone_(phone){const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);for(let i=rows.length-1;i>=1;i--) if(normalizePhone_(rows[i][m.assignedTutorPhone-1])===phone && String(rows[i][m.status-1])!=="closed") return rowConversation_(rows[i],i+1,sh,m);return null;}
function updateConversation_(id,lastTime,lastMessageId){const c=findConversation_(id);if(!c)return;const sh=getConversationSheet_();setByHeader_(sh,c.row,"lastMessageAt",lastTime);setByHeader_(sh,c.row,"lastMessageId",lastMessageId||"")}

function updateMessageStatus_(s){
  if(!s.id)return;
  const sh=getSheet_("MESSAGES",["messageId","conversationId","sender","text","source","timestamp","status","attachmentJson"]);
  const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][0])===String(s.id)){sh.getRange(i+1,7).setValue(s.status||"sent");break;}
  }
}
function getSheet_(name,headers){
  const id=PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetIdKey);
  if(!id) throw new Error("Set SPREADSHEET_ID in Apps Script Script Properties.");
  const ss=SpreadsheetApp.openById(id); let sh=ss.getSheetByName(name);
  if(!sh)sh=ss.insertSheet(name); if(sh.getLastRow()===0)sh.appendRow(headers); return sh;
}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
