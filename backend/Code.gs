/**
 * BrightAce Academy — Live Chat + WhatsApp Cloud API backend
 *
 * Data flow:
 * Student browser -> Apps Script -> Google Sheets / Drive -> WhatsApp Cloud API
 * WhatsApp tutor reply -> Meta webhook -> Apps Script -> Google Sheets -> browser polling
 *
 * IMPORTANT: keep tokens in Apps Script Script Properties. Never put secrets in GitHub Pages JS.
 */

const BRIGHTACE_BUILD="2026-09-13-PRELAUNCH-1";
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
  adminUsersKey: "ADMIN_USERS_JSON",
  adminWhatsAppKey: "ADMIN_WHATSAPP_PHONE",
  contactEmailKey: "CONTACT_EMAIL",
  defaultGraphVersion: "v24.0",
  defaultAdminWhatsAppPhone: "254787377857",
  maxFileBytes: 25 * 1024 * 1024,
  verificationTestPhoneKey: "BRIGHTACE_VERIFICATION_TEST_WHATSAPP",
  verificationTestCodeKey: "BRIGHTACE_VERIFICATION_TEST_CODE"
};

function doGet(e){
  const p=(e&&e.parameter)||{};
  if(p["hub.mode"] === "subscribe") return verifyWebhook_(p);
  const action=p.action||"health";
  if(action==="health") return json_({ok:true,service:"BrightAce Academy Live Chat",build:BRIGHTACE_BUILD,time:new Date().toISOString()});
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
    if(body.action === "sendVerification") return sendVerification_(body);
    if(body.action === "notifyAdmin") return notifyAdmin_(body);
    if(body.action === "sendContactEmail") return sendContactEmail_(body);
    if(body.action === "sendMessage") return saveWebsiteMessage_(body);
    if(body.action === "deliverMessage") return deliverWebsiteMessage_(body);
    if(body.action === "initializePayment") return initializePayment_(body.requestId);
    if(body.action === "adminLogin") return adminLogin_(body.password,body.username);
    if(body.action === "adminListConversations") return adminListConversations_(body.adminToken);
    if(body.action === "adminGetConversation") return adminGetConversation_(body.adminToken, body.conversationId);
    if(body.action === "adminSendMessage") return adminSendMessage_(body);
    if(body.action === "adminDeliverMessage") return deliverAdminMessage_(body);
    if(body.action === "adminListTutors") return adminListTutors_(body.adminToken);
    if(body.action === "adminAddTutor") return adminAddTutor_(body);
    if(body.action === "adminSetTutorStatus") return adminSetTutorStatus_(body);
    if(body.action === "adminListClients") return adminListClients_(body.adminToken);
    if(body.action === "adminAddClient") return adminAddClient_(body);
    if(body.action === "adminSetClientStatus") return adminSetClientStatus_(body);
    if(body.action === "adminListBlockedWhatsApp") return adminListBlockedWhatsApp_(body.adminToken);
    if(body.action === "adminSetWhatsAppBlock") return adminSetWhatsAppBlock_(body);
    if(body.action === "adminAssignWork") return adminAssignWork_(body);
    if(body.action === "adminClaimWork") return adminClaimWork_(body);
    if(body.action === "adminListAdmins") return adminListAdmins_(body.adminToken);
    if(body.action === "adminAddAdmin") return adminAddAdmin_(body);
    if(body.action === "adminUpdateAdmin") return adminUpdateAdmin_(body);
    if(body.action === "adminSetAdminStatus") return adminSetAdminStatus_(body);
    if(body.action === "adminListActivity") return adminListActivity_(body.adminToken);
    if(body.action === "adminListPayments") return adminListPayments_(body.adminToken);
    if(body.action === "adminDeletePaymentNotification") return adminDeletePaymentNotification_(body);
    if(body.action === "adminCreatePaymentRequest") return adminCreatePaymentRequest_(body);
    if(body.action === "deliverPaymentRequest") return deliverPaymentRequest_(body);
    if(body.action === "adminMarkWorkCompleted") return adminMarkWorkCompleted_(body);
    if(body.action === "adminRejectWork") return adminRejectWork_(body);
    if(body.action === "adminRestoreWork") return adminRestoreWork_(body);
    if(body.action === "adminListWorkAssignments") return adminListWorkAssignments_(body.adminToken);
    if(body.action === "adminListWorkHistory") return adminListWorkHistory_(body.adminToken);
    if(body.action === "adminSendTutorMessage") return adminSendTutorMessage_(body);
    if(body.action === "adminGetTutorMessages") return adminGetTutorMessages_(body);
    if(body.action === "adminTutorPortalPreview") return adminTutorPortalPreview_(body);
    if(body.action === "adminListTutorBalances") return adminListTutorBalances_(body.adminToken);
    if(body.action === "adminMarkTutorBalancePaid") return adminMarkTutorBalancePaid_(body);
    if(body.action === "submitRefundRequest") return submitRefundRequest_(body);
    if(body.action === "adminListRefundRequests") return adminListRefundRequests_(body.adminToken);
    if(body.action === "adminReviewRefundRequest") return adminReviewRefundRequest_(body);
    if(body.action === "clientDashboard") return clientDashboard_(body);
    if(body.action === "clientSubmitFeedback") return clientSubmitFeedback_(body);
    if(body.action === "clientSendComment") return clientSendComment_(body);
    if(body.action === "tutorSendVerification") return tutorSendVerification_(body);
    if(body.action === "tutorVerifyLogin") return tutorVerifyLogin_(body);
    if(body.action === "tutorUploadProfile") return tutorUploadProfile_(body);
    if(body.action === "tutorDashboard") return tutorDashboard_(body);
    if(body.action === "tutorUpdateWorkStatus") return tutorUpdateWorkStatus_(body);
    if(body.action === "tutorSubmitWork") return tutorSubmitWork_(body);
    if(body.action === "tutorAddWorkComment") return tutorAddWorkComment_(body);
    if(body.action === "tutorSaveAvailability") return tutorSaveAvailability_(body);
    if(body.action === "tutorSendAdminMessage") return tutorSendAdminMessage_(body);
    if(body.action === "tutorGetAdminMessages") return tutorGetAdminMessages_(body);
    if(body.action === "adminCheckTutorAvailability") return adminCheckTutorAvailability_(body);
    if(body.action === "adminGetTutorAvailability") return adminGetTutorAvailability_(body);
    if(body.action === "adminCreateSchedule") return adminCreateSchedule_(body);
    if(body.action === "adminListSchedules") return adminListSchedules_(body.adminToken);
    if(body.action === "adminUpdateSchedule") return adminUpdateSchedule_(body);
    if(body.action === "adminListQuality") return adminListQuality_(body.adminToken);
    if(body.action === "clientDashboardBootstrap") return clientDashboardBootstrap_(body);
    if(body.action === "adminQaWork") return adminQaWork_(body);
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
  return ["conversationId","studentName","studentPhone","startedAt","lastMessageAt","status","assignedTutor","whatsappPhone","lastMessageId","studentEmail","workDescription","studentBudget","currency","deadline","assignmentStatus","assignedTutorPhone","tutorPayout","brightAceShare","agreedAmount","agreedCurrency","completedAt","rejectedAt","rejectionReason","verificationStatus","verificationCodeHash","verificationExpiresAt","verificationAttempts","verificationResendCount","verifiedAt","assignedAdminUsername","assignedAdminName","clientAccessToken","tutorWorkStatus","tutorSubmittedAt","tutorSubmissionNote","qaStatus","qaAt","qaBy","qaNotes","clientFeedback","clientFeedbackAt"];
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
function setByHeader_(sh,row,header,value){const m=headerMap_(sh);if(m[header]){sh.getRange(row,m[header]).setValue(value);if(sh.getName()==="CONVERSATIONS"&&header!=="conversationId"){try{const id=sh.getRange(row,m.conversationId).getValue();CacheService.getScriptCache().remove("BA_CONV_"+String(id))}catch(e){}}}}
function getByHeader_(sh,row,header){const m=headerMap_(sh);return m[header]?sh.getRange(row,m[header]).getValue():""}

function getClientSheet_(){
  const h=["clientId","clientName","clientPhone","status","createdAt","notes"];
  return ensureColumns_(getSheet_("CLIENTS",h),h);
}
function getVerificationTestPhone_(){
  return normalizePhone_(PropertiesService.getScriptProperties().getProperty(CONFIG.verificationTestPhoneKey)||"");
}
function getVerificationTestCode_(){
  const raw=String(PropertiesService.getScriptProperties().getProperty(CONFIG.verificationTestCodeKey)||"").trim();
  return /^\d{6}$/.test(raw)?raw:"";
}
function isVerificationTestCodeEnabledFor_(phone){
  return isVerificationTestPhone_(phone) && !!getVerificationTestCode_();
}
function isVerificationTestPhone_(phone){
  const p=normalizePhone_(phone); const test=getVerificationTestPhone_();
  return !!p && !!test && p===test;
}
function getClientByPhone_(phone){
  const target=normalizePhone_(phone),sh=getClientSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++){
    if(normalizePhone_(rows[i][m.clientPhone-1])===target &&
       String(rows[i][m.status-1]||"ACTIVE").toUpperCase()!=="SUSPENDED" &&
       String(rows[i][m.status-1]||"ACTIVE").toUpperCase()!=="INACTIVE"){
      return {row:i+1,clientId:String(rows[i][m.clientId-1]),clientName:String(rows[i][m.clientName-1]||""),clientPhone:target,status:String(rows[i][m.status-1]||"ACTIVE")};
    }
  }
  if(isVerificationTestPhone_(target)) return {row:0,clientId:"CLIENT-TEST",clientName:"BrightAce Test Client",clientPhone:target,status:"TEST"};
  return null;
}
function adminListClients_(token){
  requireAdmin_(token); const sh=getClientSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++) if(rows[i][m.clientId-1]){
    out.push({clientId:String(rows[i][m.clientId-1]),clientName:String(rows[i][m.clientName-1]||""),clientPhone:normalizePhone_(rows[i][m.clientPhone-1]||""),status:String(rows[i][m.status-1]||"ACTIVE").toUpperCase(),createdAt:rows[i][m.createdAt-1]||"",notes:String(rows[i][m.notes-1]||"")});
  }
  const test=getVerificationTestPhone_();
  if(test&&!out.some(x=>normalizePhone_(x.clientPhone)===test)) out.push({clientId:"CLIENT-TEST",clientName:"BrightAce Test Client",clientPhone:test,status:"TEST",createdAt:"",notes:"Verification test number from Script Properties"});
  return json_({ok:true,clients:out});
}
function adminAddClient_(d){
  requireAdmin_(d.adminToken);
  const name=String(d.clientName||"").trim(),phone=normalizePhone_(d.clientPhone||""),notes=String(d.notes||"").trim();
  if(!name)throw new Error("Client name is required.");
  if(phone.length<7)throw new Error("Enter a valid WhatsApp number.");
  const sh=getClientSheet_(),existing=getClientByPhone_(phone);
  if(existing&&existing.row)throw new Error("WARNING: This WhatsApp number is already registered to client "+String(existing.clientName||"")+" . Use the existing client record or correct the number.");
  const conflicts=whatsappNameConflicts_(phone,name,"CLIENT");if(conflicts.length)throw new Error("WARNING: This WhatsApp number is registered with another different name ("+conflicts.join(", ")+"). Confirm the correct number/name before admitting this client.");
  const id="CLI-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase();
  sh.appendRow([id,name,phone,"ACTIVE",new Date(),notes]); auditAdmin_(d.adminToken,"ADD_CLIENT",name+" ("+phone+")");
  return json_({ok:true,client:{clientId:id,clientName:name,clientPhone:phone,status:"ACTIVE"}});
}
function adminSetClientStatus_(d){
  requireAdmin_(d.adminToken); const id=String(d.clientId||"").trim(),status=String(d.status||"ACTIVE").toUpperCase();
  if(!id||!["ACTIVE","INACTIVE","SUSPENDED"].includes(status))throw new Error("Invalid client status.");
  const sh=getClientSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(String(rows[i][m.clientId-1])===id){setByHeader_(sh,i+1,"status",status);auditAdmin_(d.adminToken,"CLIENT_STATUS",id+" → "+status);return json_({ok:true,status:status});}
  throw new Error("Client not found.");
}

function getBlockedWhatsAppSheet_(){
  const h=["phone","type","reason","blockedAt","blockedBy","active"];
  return ensureColumns_(getSheet_("BLOCKED_WHATSAPP",h),h);
}
function isWhatsAppBlocked_(phone){
  const target=normalizePhone_(phone);
  if(!target || isVerificationTestPhone_(target)) return false;
  const sh=getBlockedWhatsAppSheet_(), rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++){
    if(normalizePhone_(rows[i][0])===target && String(rows[i][5]||"ACTIVE").toUpperCase()!=="INACTIVE") return true;
  }
  return false;
}
function adminListBlockedWhatsApp_(token){
  requireAdmin_(token);
  const sh=getBlockedWhatsAppSheet_(), rows=sh.getDataRange().getValues(), out=[];
  for(let i=1;i<rows.length;i++) if(rows[i][0]){
    out.push({phone:normalizePhone_(rows[i][0]),type:String(rows[i][1]||"WHATSAPP"),reason:String(rows[i][2]||""),blockedAt:rows[i][3]||"",blockedBy:String(rows[i][4]||""),active:String(rows[i][5]||"ACTIVE")});
  }
  return json_({ok:true,blocked:out.reverse()});
}
function adminSetWhatsAppBlock_(d){
  requireAdmin_(d.adminToken);
  const phone=normalizePhone_(d.phone||"");
  if(!phone) throw new Error("WhatsApp number is required.");
  if(isVerificationTestPhone_(phone)) throw new Error("The designated testing WhatsApp number cannot be blocked.");
  const blocked=!!d.blocked, sh=getBlockedWhatsAppSheet_(), rows=sh.getDataRange().getValues();
  let found=0;
  for(let i=1;i<rows.length;i++){
    if(normalizePhone_(rows[i][0])===phone){
      found=i+1;
      sh.getRange(found,6).setValue(blocked?"ACTIVE":"INACTIVE");
      if(blocked){sh.getRange(found,3).setValue(String(d.reason||"Suspended by BrightAce Admin"));sh.getRange(found,4).setValue(new Date());sh.getRange(found,5).setValue(String(d.adminName||"Admin"));}
      break;
    }
  }
  if(blocked&&!found) sh.appendRow([phone,"WHATSAPP",String(d.reason||"Suspended by BrightAce Admin"),new Date(),String(d.adminName||"Admin"),"ACTIVE"]);
  return json_({ok:true,blocked:blocked,phone:phone,message:blocked?"WhatsApp number suspended.":"WhatsApp number restored."});
}
function ensureClientForChat_(phone,name){
  const existing=getClientByPhone_(phone);
  if(existing) return existing;
  const sh=getClientSheet_(),id="CLI-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase(),now=new Date();
  sh.appendRow([id,String(name||"").trim(),normalizePhone_(phone),"ACTIVE",now,"Auto-admitted through verified BrightAce client access."]);
  return getClientByPhone_(phone);
}

function requireRegisteredClient_(phone,name){
  if(isWhatsAppBlocked_(phone)) throw new Error("This WhatsApp number is not allowed here. Please contact BrightAce Admin.");
  const c=getClientByPhone_(phone);
  return c || ensureClientForChat_(phone,name);
}

function startChat_(d){
  if(!d.name||!d.phone||!d.taskDescription||!(Number(d.studentBudget)>0)) throw new Error("Name, WhatsApp number, task description and student budget are required.");
  const currency=String(d.currency||"KES").toUpperCase();
  if(["KES","USD","EUR"].indexOf(currency)<0) throw new Error("Choose KES, USD or EUR.");
  const phone=normalizePhone_(d.phone); if(phone.length<7) throw new Error("Enter a valid WhatsApp number.");
  const admittedClient=requireRegisteredClient_(phone,d.name);
  if(!isVerificationTestPhone_(phone)&&String(admittedClient.clientName||"").trim().toLowerCase()!==String(d.name||"").trim().toLowerCase())throw new Error("WARNING: This WhatsApp number is registered with another different name ("+String(admittedClient.clientName||"") +"). Please use the registered client name or contact BrightAce Admin.");
  const sh=getConversationSheet_(),now=new Date(),id=d.id||("CHAT-"+now.getTime()),existingById=/^CHAT-\d/i.test(String(id))?null:findConversation_(id);
  if(existingById)return json_({ok:true,conversationId:existingById.conversationId,verificationRequired:String(existingById.verificationStatus||"").toUpperCase()!=="VERIFIED",verified:String(existingById.verificationStatus||"").toUpperCase()==="VERIFIED"});
  const h=headerMap_(sh),row=sh.getLastRow()+1,values=new Array(sh.getLastColumn()).fill("");
  values[h.conversationId-1]=id;values[h.studentName-1]=String(admittedClient.clientName||d.name).trim();values[h.studentPhone-1]=phone;values[h.startedAt-1]=now;values[h.lastMessageAt-1]=now;values[h.status-1]="open";values[h.assignedTutor-1]="Unassigned";values[h.whatsappPhone-1]=phone;values[h.assignmentStatus-1]="PENDING_VERIFICATION";values[h.workDescription-1]=String(d.taskDescription).trim();values[h.studentBudget-1]=Number(d.studentBudget);values[h.currency-1]=currency;values[h.deadline-1]=String(d.deadline||"");values[h.agreedAmount-1]=Number(d.studentBudget);values[h.agreedCurrency-1]=currency;values[h.verificationStatus-1]="PENDING";values[h.verificationAttempts-1]=0;values[h.verificationResendCount-1]=0;if(h.assignedAdminUsername)values[h.assignedAdminUsername-1]="";if(h.assignedAdminName)values[h.assignedAdminName-1]="";
  sh.getRange(row,1,1,values.length).setValues([values]);cacheConversation_(row,values,sh,h);try{CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS")}catch(e){}
  return json_({ok:true,conversationId:id,requestStatus:"PENDING_VERIFICATION",verificationRequired:true,message:"Request received. Enter the 6-digit code sent to your WhatsApp number."});
}
function sha256Hex_(text){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8);return bytes.map(function(b){const v=(b<0?b+256:b).toString(16);return v.length===1?"0"+v:v}).join("");}
function generateVerificationCode_(phone){
  const testCode=getVerificationTestCode_();
  if(isVerificationTestPhone_(phone) && testCode)return testCode;
  return String(Math.floor(100000+Math.random()*900000));
}
function sendVerification_(d){
  const id=String(d.conversationId||"").trim();if(!id)throw new Error("Conversation ID is required.");
  const c=findConversation_(id);if(!c)throw new Error("Verification request not found.");
  if(isWhatsAppBlocked_(c.studentPhone))throw new Error("This number is not allowed here. It has been suspended by BrightAce Admin.");
  if(String(c.verificationStatus||"").toUpperCase()==="VERIFIED")return json_({ok:true,verified:true,message:"Your WhatsApp number is already verified."});
  return json_({ok:true,delivery:sendVerificationCode_(id,c.studentPhone)});
}
function sendVerificationCode_(conversationId,phone){
  const c=findConversation_(conversationId);if(!c)throw new Error("Verification request not found.");
  const target=normalizePhone_(phone||c.studentPhone||"");if(!target)throw new Error("A valid WhatsApp number is required for verification.");
  const cooldownKey="BA_OTP_COOLDOWN_"+String(conversationId);if(CacheService.getScriptCache().get(cooldownKey))throw new Error("Please wait a few seconds before requesting another code.");
  const code=generateVerificationCode_(target),expires=new Date(Date.now()+10*60*1000),sh=getConversationSheet_(),m=headerMap_(sh);
  const result=isVerificationTestCodeEnabledFor_(target)
    ? {testMode:true,skipped:true,message:"Test verification code configured; WhatsApp delivery bypassed for the designated test number."}
    : sendWhatsAppVerificationTemplate_(target,code);
  if(result&&result.skipped&&!result.testMode)throw new Error("WhatsApp verification could not be sent because the WhatsApp credentials are not configured.");
  sh.getRange(c.row,m.verificationCodeHash,1,3).setValues([[sha256Hex_(code),expires,0]]);
  CacheService.getScriptCache().put(cooldownKey,"1",20);return {sent:true,phone:target,expiresAt:expires.toISOString(),messageId:String(result.messages&&result.messages[0]&&result.messages[0].id||"")};
}
function sendWhatsAppVerificationTemplate_(to,code){
  const cfg=metaConfig_();if(!cfg.token||!cfg.phoneId)return {skipped:true,reason:"WhatsApp sender is not configured."};
  const url="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages";
  const payload={messaging_product:"whatsapp",to:normalizePhone_(to),type:"template",template:{name:"brightace_verify_code",language:{code:"en_US"},components:[{type:"body",parameters:[{type:"text",text:String(code)}]}]}};
  return graphPost_(url,payload,cfg.token);
}
function verifyChat_(d){
  const id=String(d.conversationId||"").trim(),code=String(d.code||"").trim(); if(!id||!/^[0-9]{6}$/.test(code)) throw new Error("Enter the 6-digit verification code sent to WhatsApp.");
  const c=findConversation_(id); if(!c) throw new Error("Verification request not found.");
  if(String(c.verificationStatus||"").toUpperCase()==="VERIFIED"){
    const sh=getConversationSheet_(),existing=String(getByHeader_(sh,c.row,"clientAccessToken")||"")||Utilities.getUuid()+Utilities.getUuid();
    setByHeader_(sh,c.row,"clientAccessToken",existing);
    return json_({ok:true,verified:true,clientAccessToken:existing,message:"WhatsApp is already verified. Your BrightAce live chat is connected."});
  }
  const expiry=c.row?getByHeader_(getConversationSheet_(),c.row,"verificationExpiresAt"):""; if(expiry && new Date(expiry).getTime()<Date.now()) throw new Error("That verification code has expired. Request a new code.");
  const attempts=Number(c.row?getByHeader_(getConversationSheet_(),c.row,"verificationAttempts"):0)||0; if(attempts>=3) throw new Error("Too many incorrect attempts. Request a new verification code.");
  const sh=getConversationSheet_(),stored=String(getByHeader_(sh,c.row,"verificationCodeHash")||"");
  if(stored!==sha256Hex_(code)){setByHeader_(sh,c.row,"verificationAttempts",attempts+1);throw new Error("Incorrect verification code. Please check WhatsApp and try again.");}
  const now=new Date(); const clientAccessToken=Utilities.getUuid()+Utilities.getUuid(); setByHeader_(sh,c.row,"verificationStatus","VERIFIED"); setByHeader_(sh,c.row,"verifiedAt",now); setByHeader_(sh,c.row,"assignmentStatus","NEW_REQUEST"); setByHeader_(sh,c.row,"verificationCodeHash",""); setByHeader_(sh,c.row,"verificationExpiresAt",""); setByHeader_(sh,c.row,"clientAccessToken",clientAccessToken);
  const saved=saveMessage_(id,"student",c.workDescription,"website",null);setByHeader_(sh,c.row,"lastMessageId",saved.id);setByHeader_(sh,c.row,"lastMessageAt",now);try{CacheService.getScriptCache().remove("BA_CONV_"+id)}catch(e){}
  return json_({ok:true,verified:true,clientAccessToken:clientAccessToken,message:"WhatsApp verified successfully. Your BrightAce live chat is now connected."});
}
function resendVerification_(d){
  const id=String(d.conversationId||"").trim(); if(!id) throw new Error("Conversation ID is required."); const c=findConversation_(id); if(!c) throw new Error("Verification request not found."); if(String(c.verificationStatus||"").toUpperCase()==="VERIFIED") return json_({ok:true,verified:true,message:"Your WhatsApp number is already verified."});
  const sh=getConversationSheet_(),count=Number(getByHeader_(sh,c.row,"verificationResendCount")||0)||0; if(count>=3) throw new Error("The maximum of 3 new verification codes has been reached. Please start a new request."); setByHeader_(sh,c.row,"verificationResendCount",count+1);
  const sent=sendVerificationCode_(id,c.studentPhone);try{CacheService.getScriptCache().remove("BA_CONV_"+id)}catch(e){} return json_({ok:true,message:"A new 6-digit verification code has been sent to your WhatsApp number.",remainingResends:Math.max(0,3-(count+1)),delivery:sent});
}
function sendContactEmail_(d){
  const name=String(d.name||"").trim(),email=String(d.email||"").trim(),subject=String(d.subject||"").trim(),message=String(d.message||"").trim();
  if(!name||!email||!subject||!message)throw new Error("Name, email, subject and message are required.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Enter a valid email address.");
  const props=PropertiesService.getScriptProperties(),to=String(props.getProperty(CONFIG.contactEmailKey)||props.getProperty("ADMIN_EMAIL")||"").trim();
  if(!to)throw new Error("CONTACT_EMAIL is not configured in Apps Script Script Properties.");
  MailApp.sendEmail({to:to,replyTo:email,subject:"BrightAce Contact: "+subject,body:"New BrightAce website contact message\n\nName: "+name+"\nEmail: "+email+"\nSubject: "+subject+"\n\nMessage:\n"+message});
  return json_({ok:true,sent:true});
}
function sendWhatsAppTemplate_(to,templateName,language,params){
  const cfg=metaConfig_();
  if(!cfg.token||!cfg.phoneId)return {skipped:true,reason:"WhatsApp credentials not configured"};
  const parameters=(params||[]).map(function(x){return {type:"text",text:String(x)}});
  const payload={messaging_product:"whatsapp",to:normalizePhone_(to),type:"template",template:{name:String(templateName).trim(),language:{code:String(language||"en_US").trim()},components:[{type:"body",parameters:parameters}]}};
  return graphPost_("https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages",payload,cfg.token);
}
function notifyAdminOfNewRequest_(id,name,phone,task,budget,currency,deadline){
  const props=PropertiesService.getScriptProperties(),adminPhone=normalizePhone_(props.getProperty(CONFIG.adminWhatsAppKey)||CONFIG.defaultAdminWhatsAppPhone);
  const text="🔔 New BrightAce work request\n\nWork ID: "+id+"\nStudent: "+name+"\nWhatsApp: +"+phone+"\nBudget: "+currency+" "+budget.toFixed(2)+(deadline?"\nDeadline: "+deadline:"")+"\n\nTask:\n"+task;
  if(adminPhone){try{sendWhatsAppText_(adminPhone,text)}catch(e){console.error("Admin WhatsApp notification failed: "+(e&&e.message||e))}}
}

function notifyAdmin_(d){
  const c=findConversation_(String(d.conversationId||"").trim());if(!c)throw new Error("Conversation not found.");
  try{notifyAdminOfNewRequest_(c.conversationId,c.studentName,c.studentPhone,c.workDescription,c.studentBudget,c.currency,c.deadline)}catch(e){console.error(e);return json_({ok:true,notified:false,error:String(e&&e.message||e)})}
  return json_({ok:true,notified:true});
}
function saveWebsiteMessage_(d){
  if(!d.sessionId)throw new Error("sessionId is required.");const c=findConversation_(d.sessionId);if(!c)throw new Error("Conversation not found.");
  if(String(c.verificationStatus||"").trim()&&String(c.verificationStatus||"").toUpperCase()!=="VERIFIED")throw new Error("Verify your WhatsApp number before sending chat messages.");
  let attachments=[];
  if(Array.isArray(d.attachments))attachments=saveAttachments_(d.sessionId,d.attachments);
  else if(d.attachment&&d.attachment.dataUrl)attachments=saveAttachments_(d.sessionId,[d.attachment]);
  if(!d.text&&!attachments.length)throw new Error("Message or attachment is required.");
  const storedAttachment=attachments.length===1?attachments[0]:attachments;
  const saved=saveMessage_(d.sessionId,"student",d.text||"","website",storedAttachment,c.studentName,c.studentPhone);updateConversation_(d.sessionId,new Date(),saved.id);
  CacheService.getScriptCache().put("BA_DELIVERY_"+saved.id,JSON.stringify({conversationId:d.sessionId}),120);
  return json_({ok:true,messageId:saved.id,attachment:storedAttachment,attachments:attachments,deliveryQueued:true});
}
function deliverWebsiteMessage_(d){
  const id=String(d.messageId||"").trim(),sessionId=String(d.sessionId||"").trim(),q=safeJson_(CacheService.getScriptCache().get("BA_DELIVERY_"+id)||"");
  if(!q||q.conversationId!==sessionId)return json_({ok:true,queued:false});
  const c=findConversation_(sessionId);if(!c)throw new Error("Conversation not found.");let result=null;
  try{result=sendStudentMessageToWhatsApp_(c,String(d.text||""),d.attachment||null)}catch(e){console.error(e);result={skipped:true,error:String(e&&e.message||e)}}
  CacheService.getScriptCache().remove("BA_DELIVERY_"+id);return json_({ok:true,delivered:true,whatsapp:result});
}
function messageHeaders_(){return ["messageId","conversationId","sender","text","source","timestamp","status","attachmentJson","senderName","senderPhone"]}
function hydrateAttachmentValue_(a){
  if(!a)return null;
  if(Array.isArray(a))return a.map(hydrateAttachmentValue_).filter(Boolean);
  const out=Object.assign({},a);
  if(!out.fileId)return out;
  try{const f=DriveApp.getFileById(String(out.fileId));out.name=out.name||f.getName();out.mimeType=out.mimeType||f.getMimeType();out.size=out.size||f.getSize();out.viewUrl=out.viewUrl||f.getUrl();out.downloadUrl=f.getDownloadUrl();}catch(e){
    const id=encodeURIComponent(String(out.fileId));out.viewUrl=out.viewUrl||("https://drive.google.com/uc?export=view&id="+id);out.downloadUrl=out.downloadUrl||("https://drive.google.com/uc?export=download&id="+id);
  }
  return out;
}
function hydrateAttachment_(a){return hydrateAttachmentValue_(a);}
function saveAttachments_(ownerId,items){
  if(!Array.isArray(items))return [];
  const out=[];
  items.slice(0,10).forEach(a=>{if(a&&a.dataUrl)out.push(saveAttachment_(ownerId,a));});
  return out.filter(Boolean);
}
function saveMessage_(id,sender,text,source,attachment,senderName,senderPhone){
  const sh=getSheet_("MESSAGES",messageHeaders_());ensureColumns_(sh,messageHeaders_());
  const m=headerMap_(sh),messageId=Utilities.getUuid(),now=new Date(),row=sh.getLastRow()+1;
  const values=new Array(sh.getLastColumn()).fill("");
  values[m.messageId-1]=messageId;values[m.conversationId-1]=id;values[m.sender-1]=sender;values[m.text-1]=text||"";values[m.source-1]=source;values[m.timestamp-1]=now;values[m.status-1]="received";values[m.attachmentJson-1]=attachment?JSON.stringify(attachment):"";
  if(m.senderName)values[m.senderName-1]=String(senderName||"");if(m.senderPhone)values[m.senderPhone-1]=normalizePhone_(senderPhone||"");
  sh.getRange(row,1,1,values.length).setValues([values]);
  try{CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS")}catch(e){}
  const hydrated=hydrateAttachment_(attachment);
  try{const key="BA_MSG_"+String(id),existing=safeJson_(CacheService.getScriptCache().get(key)||"")||[];existing.push({id:messageId,sessionId:String(id),sender:String(sender),text:String(text||""),source:String(source||""),timestamp:now,status:"received",attachment:hydrated||null,senderName:String(senderName||""),senderPhone:normalizePhone_(senderPhone||"")});CacheService.getScriptCache().put(key,JSON.stringify(existing.slice(-100)),300)}catch(e){}
  return {id:messageId,attachment:hydrated};
}
function readConversationMessages_(id){
  const sh=getSheet_("MESSAGES",messageHeaders_());ensureColumns_(sh,messageHeaders_());const rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  return rows.slice(1).filter(r=>String(r[m.conversationId-1])===String(id) && true).map(r=>({id:String(r[m.messageId-1]),sessionId:String(r[m.conversationId-1]),sender:String(r[m.sender-1]||""),text:String(r[m.text-1]||""),source:String(r[m.source-1]||""),timestamp:r[m.timestamp-1],status:String(r[m.status-1]||"received"),attachment:hydrateAttachment_(r[m.attachmentJson-1]?safeJson_(r[m.attachmentJson-1]):null),senderName:m.senderName?String(r[m.senderName-1]||""):"",senderPhone:m.senderPhone?String(r[m.senderPhone-1]||""):""})).slice(-100);
}
function getMessages_(id){
  if(!id)return json_({ok:false,error:"sessionId required"});const c=findConversation_(id);if(!c)return json_({ok:false,error:"Conversation not found."});
  if(String(c.verificationStatus||"").trim()&&String(c.verificationStatus||"").toUpperCase()!=="VERIFIED")return json_({ok:false,error:"WhatsApp verification is required before accessing this chat."});
  const key="BA_MSG_"+String(id);try{const cached=safeJson_(CacheService.getScriptCache().get(key)||"");if(Array.isArray(cached))return json_({ok:true,messages:cached.map(x=>Object.assign({},x,{attachment:hydrateAttachment_(x.attachment)}))})}catch(e){}
  const messages=readConversationMessages_(id);try{CacheService.getScriptCache().put(key,JSON.stringify(messages),300)}catch(e){}return json_({ok:true,messages:messages});
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
  let data=JSON.parse(response.getContentText()||"{}");
  if((response.getResponseCode()>=300 || !data.status || !data.data || !data.data.authorization_url) && /no active channel/i.test(String(data.message||""))){
    const cardPayload=Object.assign({},payload,{channels:["card"]});
    response=UrlFetchApp.fetch("https://api.paystack.co/transaction/initialize",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+secret},payload:JSON.stringify(cardPayload),muteHttpExceptions:true});
    data=JSON.parse(response.getContentText()||"{}");
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
  const data=JSON.parse(response.getContentText()||"{}");
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

function ensureTutorPayoutRecordForPaidWork_(conversationId,payment){
  const c=findConversation_(conversationId);
  if(!c || !c.assignedTutor || c.assignedTutor==="Unassigned") return null;
  const existing=findPayoutForWork_(conversationId);
  if(existing) return existing;
  const amount=Number(c.agreedAmount||payment.amount||c.studentBudget||0);
  const currency=String(c.agreedCurrency||payment.currency||c.currency||"KES").toUpperCase();
  const tutorPayout=Math.round(amount*0.60*100)/100;
  const tutors=getTutorSheet_(),rows=tutors.getDataRange().getValues(),tm=headerMap_(tutors);
  let tutorId="";
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][tm.tutorName-1]||"")===String(c.assignedTutor||"") ||
       normalizePhone_(rows[i][tm.tutorPhone-1]||"")===normalizePhone_(c.assignedTutorPhone||"")){
      tutorId=String(rows[i][tm.tutorId-1]||""); break;
    }
  }
  const sh=getTutorPayoutSheet_();
  sh.appendRow(["PAY-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),tutorId,c.assignedTutor,conversationId,payment.requestId,tutorPayout,currency,"OWED",new Date(),"","","",0,tutorPayout]);
  return findPayoutForWork_(conversationId);
}

function markPaymentPaidIfValid_(p,tx){
  const expected=toPaystackMinorUnit_(p.amount,p.currency);
  const received=Number(tx.amount);
  if(received!==expected) throw new Error("Payment amount mismatch for "+p.requestId+". Expected "+expected+", received "+received+".");
  if(String(tx.currency||"").toUpperCase()!==String(p.currency||"").toUpperCase()) throw new Error("Payment currency mismatch for "+p.requestId+".");
  const wasPaid=String(p.status||"").toUpperCase()==="PAID";
  updatePaymentFields_(p.row,{status:"PAID",paystackReference:tx.reference,paidAt:tx.paid_at||new Date()});
  try{ensureTutorPayoutRecordForPaidWork_(p.conversationId,p)}catch(e){console.error("Tutor payout record creation failed: "+e)}
  try{
    const c=findConversation_(p.conversationId),sh=getConversationSheet_();
    if(c && String(c.assignmentStatus||"").toUpperCase()==="PAYMENT_PENDING")setByHeader_(sh,c.row,"assignmentStatus","ASSIGNED");
  }catch(e){console.error("Work activation after payment failed: "+e)}
  if(!wasPaid) notifyPaymentCompleted_(p,tx);
}

function notifyPaymentCompleted_(p,tx){
  const paidAmount=Number(p.amount||0),currency=String(p.currency||tx.currency||"KES").toUpperCase();
  const msg="💳 Payment confirmed\n\nBrightAce payment request "+p.requestId+" has been paid successfully.\nAmount: "+currency+" "+paidAmount.toFixed(2)+"\nReference: "+String(tx.reference||p.paystackReference||"—")+"\n\nThe agreed academic service may now continue under BrightAce administration.";
  try{
    const saved=saveMessage_(p.conversationId,"admin",msg,"payment",null,"BrightAce Payments",String(p.studentPhone||""));
    updateConversation_(p.conversationId,new Date(),saved.id);
  }catch(e){console.error("Payment wall notification failed: "+e)}
  try{
    const adminPhone=normalizePhone_(PropertiesService.getScriptProperties().getProperty(CONFIG.adminWhatsAppKey)||CONFIG.defaultAdminWhatsAppPhone);
    if(adminPhone) sendWhatsAppText_(adminPhone,msg+"\n\nStudent: "+p.studentName+"\nWork ID: "+p.conversationId);
  }catch(e){console.error("Admin payment notification failed: "+e)}
  try{
    const tutorPhone=findConversation_(p.conversationId)?.assignedTutorPhone||"";
    if(tutorPhone) sendWhatsAppText_(normalizePhone_(tutorPhone),"💳 BrightAce payment confirmed\n\nPayment for Work ID "+p.conversationId+" has been confirmed as paid. You may continue the agreed service through BrightAce administration.");
  }catch(e){console.error("Tutor payment notification failed: "+e)}
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


function adminLogin_(password,username){
  const props=PropertiesService.getScriptProperties(),raw=String(props.getProperty(CONFIG.adminUsersKey)||"").trim(),uName=String(username||"owner").trim()||"owner";
  if(raw){let users=[];try{users=JSON.parse(raw)}catch(e){throw new Error("ADMIN_USERS_JSON is not valid JSON in Script Properties.");}
    const u=users.find(x=>String(x.username||"").trim()===uName&&String(x.password||"")===String(password||"")&&String(x.status||"ACTIVE").toUpperCase()!=="SUSPENDED");if(!u)return json_({ok:false,error:"Incorrect admin username or password."});
    const token=Utilities.getUuid()+Utilities.getUuid(),profile={username:uName,adminName:String(u.name||u.username||"Admin"),role:String(u.role||"ADMIN").toUpperCase(),whatsappPhone:normalizePhone_(u.whatsappPhone||"")};CacheService.getScriptCache().put("BA_ADMIN_"+token,JSON.stringify(profile),21600);return json_({ok:true,adminToken:token,expiresIn:21600,admin:profile});
  }
  const configured=props.getProperty(CONFIG.adminPasswordKey)||"";if(!configured)return json_({ok:false,error:"Admin access is not configured yet. Add ADMIN_PASSWORD or ADMIN_USERS_JSON in Script Properties."});
  if(String(password||"")!==configured)return json_({ok:false,error:"Incorrect admin password."});
  const token=Utilities.getUuid()+Utilities.getUuid(),profile={username:"owner",adminName:"Owner",role:"SUPER_ADMIN",whatsappPhone:CONFIG.defaultAdminWhatsAppPhone};CacheService.getScriptCache().put("BA_ADMIN_"+token,JSON.stringify(profile),21600);return json_({ok:true,adminToken:token,expiresIn:21600,admin:profile});
}
function getAdminProfile_(token){if(!token)throw new Error("Admin session expired. Please sign in again.");const raw=CacheService.getScriptCache().get("BA_ADMIN_"+token);if(!raw)throw new Error("Admin session expired. Please sign in again.");return safeJson_(raw)||{}}
function requireAdmin_(token){getAdminProfile_(token);return true}
function requireSuperAdmin_(token){const p=getAdminProfile_(token);if(String(p.role||"").toUpperCase()!=="SUPER_ADMIN")throw new Error("Super admin permission required.");return true}
function auditAdmin_(token,action,details){try{const p=getAdminProfile_(token),sh=getSheet_("ADMIN_ACTIVITY",["timestamp","adminUsername","adminName","role","action","details"]);sh.appendRow([new Date(),String(p.username||""),String(p.adminName||""),String(p.role||""),String(action||""),String(details||"").slice(0,2000)])}catch(e){console.error("Audit log failed: "+e)}}
function getAdminUsers_(){const props=PropertiesService.getScriptProperties(),raw=String(props.getProperty(CONFIG.adminUsersKey)||"").trim();if(raw){let users=[];try{users=JSON.parse(raw)}catch(e){throw new Error("ADMIN_USERS_JSON is not valid JSON in Script Properties.")}return Array.isArray(users)?users:[]}const pass=props.getProperty(CONFIG.adminPasswordKey)||"";return pass?[{username:"owner",name:"Owner",role:"SUPER_ADMIN",password:pass,whatsappPhone:CONFIG.defaultAdminWhatsAppPhone,duties:"Owner / overall administration",status:"ACTIVE"}]:[]}
function adminListAdmins_(token){requireAdmin_(token);const users=getAdminUsers_();return json_({ok:true,admins:users.map(u=>({username:String(u.username||""),name:String(u.name||u.username||"Admin"),role:String(u.role||"ADMIN").toUpperCase(),whatsappPhone:normalizePhone_(u.whatsappPhone||""),status:String(u.status||"ACTIVE").toUpperCase(),duties:String(u.duties||"")}))})}
function adminAddAdmin_(d){
  requireSuperAdmin_(d.adminToken);
  const username=String(d.username||"").trim(),name=String(d.name||"").trim(),password=String(d.password||""),role=String(d.role||"ADMIN").toUpperCase();
  if(!/^[A-Za-z0-9._-]{3,40}$/.test(username))throw new Error("Username must be 3–40 characters.");
  if(!name)throw new Error("Admin name is required.");
  if(password.length<8)throw new Error("Admin password must be at least 8 characters.");
  if(!["ADMIN","MANAGER"].includes(role))throw new Error("Invalid admin role.");
  const props=PropertiesService.getScriptProperties(),raw=String(props.getProperty(CONFIG.adminUsersKey)||"").trim();
  let users=[];
  if(raw){
    try{users=JSON.parse(raw)}catch(e){
      throw new Error("ADMIN_USERS_JSON is invalid. Open Apps Script → Project Settings → Script Properties and replace ADMIN_USERS_JSON with a valid JSON array.");
    }
    if(!Array.isArray(users))throw new Error("ADMIN_USERS_JSON must contain a JSON array of administrator objects.");
  }else{
    const ownerPass=String(props.getProperty(CONFIG.adminPasswordKey)||"");
    if(ownerPass)users=[{username:"owner",name:"Owner",role:"SUPER_ADMIN",password:ownerPass,whatsappPhone:CONFIG.defaultAdminWhatsAppPhone,duties:"Owner / overall administration",status:"ACTIVE"}];
  }
  if(users.some(u=>String(u.username||"").toLowerCase()===username.toLowerCase()))throw new Error("That admin username already exists.");
  users.push({username,name,role,password,whatsappPhone:normalizePhone_(d.whatsappPhone||""),duties:String(d.duties||"").trim(),status:"ACTIVE"});
  props.setProperty(CONFIG.adminUsersKey,JSON.stringify(users));
  auditAdmin_(d.adminToken,"ADD_ADMIN",username);
  return json_({ok:true,admin:{username,name,role,whatsappPhone:normalizePhone_(d.whatsappPhone||""),duties:String(d.duties||""),status:"ACTIVE"}});
}
function adminUpdateAdmin_(d){
  requireSuperAdmin_(d.adminToken);const username=String(d.username||"").trim();if(!username)throw new Error("Admin username is required.");const users=getAdminUsers_();const u=users.find(x=>String(x.username||"").toLowerCase()===username.toLowerCase());if(!u)throw new Error("Admin not found.");
  if(d.name!==undefined)u.name=String(d.name||"").trim()||u.name;if(d.role!==undefined){const role=String(d.role||u.role||"ADMIN").toUpperCase();if(!["ADMIN","MANAGER"].includes(role))throw new Error("Invalid admin role.");u.role=role;}if(d.whatsappPhone!==undefined)u.whatsappPhone=normalizePhone_(d.whatsappPhone||"");if(d.duties!==undefined)u.duties=String(d.duties||"").trim();if(d.password!==undefined&&String(d.password||"").trim()){if(String(d.password).length<8)throw new Error("Admin password must be at least 8 characters.");u.password=String(d.password);}
  PropertiesService.getScriptProperties().setProperty(CONFIG.adminUsersKey,JSON.stringify(users));auditAdmin_(d.adminToken,"UPDATE_ADMIN",username);return json_({ok:true,admin:{username:String(u.username),name:String(u.name||u.username),role:String(u.role||"ADMIN").toUpperCase(),whatsappPhone:normalizePhone_(u.whatsappPhone||""),duties:String(u.duties||""),status:String(u.status||"ACTIVE").toUpperCase()}});
}
function adminSetAdminStatus_(d){requireSuperAdmin_(d.adminToken);const username=String(d.username||"").trim(),status=String(d.status||"ACTIVE").toUpperCase();if(!username||!["ACTIVE","SUSPENDED"].includes(status))throw new Error("Invalid admin status request.");const users=getAdminUsers_();let found=null;users.forEach(u=>{if(String(u.username||"")===username){u.status=status;found=u}});if(!found)throw new Error("Admin not found.");PropertiesService.getScriptProperties().setProperty(CONFIG.adminUsersKey,JSON.stringify(users));auditAdmin_(d.adminToken,"ADMIN_STATUS",username+" → "+status);return json_({ok:true})}
function adminListActivity_(token){requireSuperAdmin_(token);const sh=getSheet_("ADMIN_ACTIVITY",["timestamp","adminUsername","adminName","role","action","details"]),rows=sh.getDataRange().getValues(),out=[];for(let i=rows.length-1;i>=1&&out.length<200;i--)out.push({timestamp:rows[i][0],username:String(rows[i][1]||""),name:String(rows[i][2]||""),role:String(rows[i][3]||""),action:String(rows[i][4]||""),details:String(rows[i][5]||"")});return json_({ok:true,activity:out})}
function adminClaimWork_(d){requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");const profile=getAdminProfile_(d.adminToken),u=String(d.username||profile.username||"").trim(),users=getAdminUsers_(),target=users.find(x=>String(x.username||"")===u);if(!target)throw new Error("Admin not found.");const sh=getConversationSheet_(),m=headerMap_(sh);if(m.assignedAdminUsername)sh.getRange(c.row,m.assignedAdminUsername).setValue(u);if(m.assignedAdminName)sh.getRange(c.row,m.assignedAdminName).setValue(String(target.name||u));c.assignedAdminUsername=u;c.assignedAdminName=String(target.name||u);try{CacheService.getScriptCache().put("BA_CONV_"+c.conversationId,JSON.stringify(c),300);CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS")}catch(e){}auditAdmin_(d.adminToken,"ASSIGN_ADMIN",c.conversationId+" → "+u);return json_({ok:true,assignedAdminUsername:u,assignedAdminName:c.assignedAdminName})}
function getTutorSheet_(){
  const h=["tutorId","tutorName","tutorDisplayName","tutorPhone","whatsappType","status","createdAt","loginCodeHash","loginExpiresAt","loginAttempts","lastLoginAt","profilePictureUrl","description"];
  return ensureColumns_(getSheet_("TUTORS",h),h);
}
function resolveTutorPhone_(tutorName,phone){
  const direct=normalizePhone_(phone||"");if(direct)return direct;
  const props=PropertiesService.getScriptProperties(),primaryName=String(props.getProperty("PRIMARY_TUTOR_NAME")||"").trim(),primaryPhone=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");
  if(primaryPhone&&primaryName&&String(tutorName||"").trim()===primaryName)return primaryPhone;
  return "";
}
function getTutorById_(tutorId){
  const id=String(tutorId||"").trim();if(!id)return null;
  if(id==="PRIMARY"){
    const props=PropertiesService.getScriptProperties(),p=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||""),n=String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor");
    return p?{tutorId:"PRIMARY",tutorName:n,tutorDisplayName:n,tutorPhone:p,status:"ACTIVE"}:null;
  }
  const sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.tutorId-1]||"")===id)return {tutorId:id,tutorName:String(rows[i][m.tutorName-1]||""),tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||rows[i][m.tutorName-1]||""),tutorPhone:resolveTutorPhone_(rows[i][m.tutorName-1],rows[i][m.tutorPhone-1]),status:String(rows[i][m.status-1]||"ACTIVE")};
  return null;
}

function adminListTutors_(token){requireAdmin_(token);const sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];for(let i=1;i<rows.length;i++)if(rows[i][m.tutorId-1]){const name=String(rows[i][m.tutorName-1]||""),phone=resolveTutorPhone_(name,rows[i][m.tutorPhone-1]||"");out.push({tutorId:String(rows[i][m.tutorId-1]),tutorName:name,tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||name),tutorPhone:phone,profilePictureUrl:m.profilePictureUrl?String(rows[i][m.profilePictureUrl-1]||""):"",whatsappType:String(rows[i][m.whatsappType-1]||"NONE").toUpperCase()==="NONE"&&phone?"WHATSAPP":String(rows[i][m.whatsappType-1]||"NONE").toUpperCase(),status:String(rows[i][m.status-1]||"ACTIVE"),description:m.description?String(rows[i][m.description-1]||""):""})}if(!out.length){const props=PropertiesService.getScriptProperties();const n=props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor",p=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");if(n)out.push({tutorId:"PRIMARY",tutorName:n,tutorDisplayName:n,tutorPhone:p,profilePictureUrl:tutorProfileByPhone_(p)?.profilePictureUrl||"",whatsappType:p?"WHATSAPP":"NONE",status:"ACTIVE"})}return json_({ok:true,tutors:out})}
function isVerificationTestPhone_(phone){return normalizePhone_(phone)===getVerificationTestPhone_();}
function whatsappNameConflicts_(phone,name,role){
  const target=normalizePhone_(phone),want=String(name||"").trim().toLowerCase();if(!target||isVerificationTestPhone_(target))return [];
  const conflicts=[];
  const tsh=getTutorSheet_(),tr=tsh.getDataRange().getValues(),tm=headerMap_(tsh);
  for(let i=1;i<tr.length;i++)if(normalizePhone_(tr[i][tm.tutorPhone-1])===target){
    const n=String(tr[i][tm.tutorName-1]||"").trim();if(n&&n.toLowerCase()!==want)conflicts.push("Tutor: "+n);
  }
  const csh=getClientSheet_(),cr=csh.getDataRange().getValues(),cm=headerMap_(csh);
  for(let i=1;i<cr.length;i++)if(normalizePhone_(cr[i][cm.clientPhone-1])===target){
    const n=String(cr[i][cm.clientName-1]||"").trim();if(n&&n.toLowerCase()!==want)conflicts.push("Client: "+n);
  }
  return [...new Set(conflicts)];
}
function adminAddTutor_(d){requireAdmin_(d.adminToken);if(!d.tutorName)throw new Error("Tutor name is required.");const sh=getTutorSheet_(),id="TUT-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase(),name=String(d.tutorName).trim(),display=String(d.tutorDisplayName||name).trim(),phone=normalizePhone_(d.tutorPhone||""),type=String(d.whatsappType||"NONE").toUpperCase();if(!["BUSINESS","WHATSAPP","NONE"].includes(type))throw new Error("Invalid WhatsApp type.");if(type!=="NONE"&&!phone)throw new Error("A WhatsApp number is required for the selected WhatsApp type.");const description=String(d.description||"").trim().slice(0,240);const conflicts=whatsappNameConflicts_(phone,name,"TUTOR");if(conflicts.length)throw new Error("WARNING: This WhatsApp number is registered with another different name ("+conflicts.join(", ")+"). Confirm the correct number/name before adding this tutor.");sh.appendRow([id,name,display,phone,type,"ACTIVE",new Date(),"","",0,"","",description]);auditAdmin_(d.adminToken,"ADD_TUTOR",name);return json_({ok:true,tutor:{tutorId:id,tutorName:name,tutorDisplayName:display,tutorPhone:phone,whatsappType:type,status:"ACTIVE"}})}

function adminSetTutorStatus_(d){
  requireAdmin_(d.adminToken);
  const id=String(d.tutorId||"").trim(), status=String(d.status||"ACTIVE").toUpperCase();
  if(!id || !["ACTIVE","SUSPENDED","INACTIVE"].includes(status)) throw new Error("Tutor and valid status are required.");
  if(id==="PRIMARY") throw new Error("The configured primary tutor cannot be suspended from the directory.");
  const sh=getTutorSheet_(), rows=sh.getDataRange().getValues(), m=headerMap_(sh);
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][m.tutorId-1]||"")===id){
      sh.getRange(i+1,m.status).setValue(status);
      if(status!=="ACTIVE") sh.getRange(i+1,m.loginCodeHash).setValue("");
      auditAdmin_(d.adminToken,(status==="ACTIVE"?"RESTORE_TUTOR":"SUSPEND_TUTOR"),String(rows[i][m.tutorName-1]||id));
      return json_({ok:true,tutorId:id,status:status});
    }
  }
  throw new Error("Tutor not found.");
}
function adminListConversations_(token){
  requireAdmin_(token);const ck="BA_ADMIN_CONVERSATIONS";try{const hit=CacheService.getScriptCache().get(ck);if(hit)return json_({ok:true,conversations:safeJson_(hit)||[]})}catch(e){}const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),paidMap={};
  const ps=getPaymentSheet_(),pr=ps.getDataRange().getValues();for(let i=pr.length-1;i>=1;i--){const cid=String(pr[i][1]||"");if(cid&&!paidMap[cid]&&String(pr[i][10]||"").toUpperCase()==="PAID")paidMap[cid]=true;}
  const out=[];for(let i=rows.length-1;i>=1;i--){const c=rowConversation_(rows[i],i+1,sh,m),st=String(c.assignmentStatus||"").toUpperCase();if(c.status!=="closed"&&st!=="COMPLETED"&&st!=="REJECTED"&&(!String(c.verificationStatus||"").trim()||String(c.verificationStatus||"").toUpperCase()==="VERIFIED"))out.push({...c,paymentStatus:paidMap[c.conversationId]?"PAID":"PENDING",startedAt:c.startedAt})}
  try{CacheService.getScriptCache().put(ck,JSON.stringify(out),5)}catch(e){}return json_({ok:true,conversations:out});
}
function adminGetConversation_(token,conversationId){
  const profile=getAdminProfile_(token);const c=findConversation_(conversationId);if(!c)throw new Error("Conversation not found.");
  if(String(c.verificationStatus||"").trim()&&String(c.verificationStatus||"").toUpperCase()!=="VERIFIED")throw new Error("Student WhatsApp number has not been verified yet.");
  const key="BA_MSG_"+String(conversationId);let messages=null;try{messages=safeJson_(CacheService.getScriptCache().get(key)||"")}catch(e){}
  if(!Array.isArray(messages))messages=readConversationMessages_(conversationId);
  return json_({ok:true,conversation:{...c,messages:messages.map(x=>Object.assign({},x,{attachment:hydrateAttachment_(x.attachment),viewerAdminName:String(profile.adminName||"Admin")}))}});
}

function adminSendMessage_(d){
  requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");
  const profile=getAdminProfile_(d.adminToken),adminCfg=adminMetaConfig_(d.adminToken),text=String(d.text||"").trim();let attachments=[];
  if(Array.isArray(d.attachments))attachments=saveAttachments_(c.conversationId,d.attachments);
  else if(d.attachment&&d.attachment.dataUrl)attachments=saveAttachments_(c.conversationId,[d.attachment]);
  if(!text&&!attachments.length)throw new Error("Message or attachment is required.");
  const storedAttachment=attachments.length===1?attachments[0]:attachments;
  const saved=saveMessage_(c.conversationId,"admin",text,"admin",storedAttachment,String(profile.adminName||profile.username||"Admin"),String(adminCfg.displayPhone||profile.whatsappPhone||CONFIG.defaultAdminWhatsAppPhone));updateConversation_(c.conversationId,new Date(),saved.id);
  CacheService.getScriptCache().put("BA_ADMIN_DELIVERY_"+saved.id,JSON.stringify({conversationId:c.conversationId,attachment:storedAttachment||null}),120);
  return json_({ok:true,messageId:saved.id,attachment:storedAttachment||null,attachments:attachments,deliveryQueued:true,adminName:String(profile.adminName||profile.username||"Admin"),senderPhone:String(adminCfg.displayPhone||profile.whatsappPhone||CONFIG.defaultAdminWhatsAppPhone)});
}
function deliverAdminMessage_(d){
  requireAdmin_(d.adminToken);const id=String(d.messageId||"").trim(),conversationId=String(d.conversationId||"").trim(),q=safeJson_(CacheService.getScriptCache().get("BA_ADMIN_DELIVERY_"+id)||"");
  if(!q||q.conversationId!==conversationId)return json_({ok:true,queued:false});const c=findConversation_(conversationId);if(!c)throw new Error("Conversation not found.");
  let result=null;try{result={};const cfg=adminMetaConfig_(d.adminToken);if(d.text)result.textResult=sendWhatsAppTextWithConfig_(normalizePhone_(c.studentPhone),"*BrightAce Academy*\nAdmin: "+String(getAdminProfile_(d.adminToken).adminName||"Admin")+"\n\n"+String(d.text||""),cfg);const files=Array.isArray(d.attachment)?d.attachment:(d.attachment?[d.attachment]:[]);files.forEach(a=>{if(a)result.mediaResult=(result.mediaResult||[]).concat([sendWhatsAppMediaWithConfig_(normalizePhone_(c.studentPhone),a,cfg)])})}catch(e){console.error(e);result={skipped:true,error:String(e&&e.message||e)}}
  CacheService.getScriptCache().remove("BA_ADMIN_DELIVERY_"+id);return json_({ok:true,delivered:true,whatsapp:result});
}
function adminAssignWork_(d){
  requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");const tutorName=String(d.tutorName||"").trim(),tutorPhone=resolveTutorPhone_(tutorName,d.tutorPhone||""),assignedAdminUsername=String(d.assignedAdminUsername||"").trim(),assignedAdminName=String(d.assignedAdminName||"").trim();if(!tutorName)throw new Error("Select or enter a tutor.");if(!c.studentBudget||c.studentBudget<=0)throw new Error("Student budget is missing.");const gross=Number(c.agreedAmount||c.studentBudget),tutorPayout=Math.round(gross*0.60*100)/100,brightAce=Math.round(gross*0.40*100)/100;const sh=getConversationSheet_(),hm=headerMap_(sh),updates=[["assignedTutor",tutorName],["assignedTutorPhone",tutorPhone],["tutorPayout",tutorPayout],["brightAceShare",brightAce],["assignmentStatus","ASSIGNED"],["agreedAmount",gross],["agreedCurrency",c.agreedCurrency||c.currency],["assignedAdminUsername",assignedAdminUsername],["assignedAdminName",assignedAdminName]];updates.forEach(function(u){if(hm[u[0]])sh.getRange(c.row,hm[u[0]]).setValue(u[1])});const tutorMsg="📚 BrightAce work assignment\n\nWork ID: "+c.conversationId+"\nClient: "+c.studentName+"\nDeadline: "+(c.deadline||"As agreed")+"\n\nTask:\n"+c.workDescription+"\n\nYour assigned payout: "+c.currency+" "+tutorPayout.toFixed(2)+"\n\nAll student communication remains under BrightAce Academy administration. Please do not request direct payment from the student.";
  let whatsappSent=false;
  if(tutorPhone){try{sendWhatsAppText_(tutorPhone,tutorMsg);whatsappSent=true}catch(e){console.error(e)}}
  // Never store the tutor-only payout message in the shared conversation.
  // Students must not be able to read BrightAce's 60/40 internal allocation.
  const studentMsg="📚 Your BrightAce request has been assigned to a tutor. You can continue discussing the work and any remaining details through this chat.";
  const saved=saveMessage_(c.conversationId,"admin",studentMsg,"admin",null);
  updateConversation_(c.conversationId,new Date(),saved.id);
  auditAdmin_(d.adminToken,"ASSIGN_WORK",c.conversationId+" → tutor: "+tutorName+"; admin: "+assignedAdminUsername);return json_({ok:true,assignment:{conversationId:c.conversationId,tutorName:tutorName,assignedAdminUsername:assignedAdminUsername,assignedAdminName:assignedAdminName,tutorPayout:tutorPayout,whatsappSent:whatsappSent,assignmentStatus:"ASSIGNED"}})}

/* ===================== CLIENT DASHBOARD ===================== */
function clientAuthConversation_(d){
  const id=String(d.conversationId||"").trim(), token=String(d.clientAccessToken||"").trim();
  if(!id||!token) throw new Error("Secure client dashboard access is required.");
  const c=findConversation_(id); if(!c) throw new Error("BrightAce request not found.");
  if(String(c.verificationStatus||"").toUpperCase()!=="VERIFIED") throw new Error("Verify your WhatsApp number before opening the dashboard.");
  if(String(c.clientAccessToken||"")!==token) throw new Error("Your dashboard session has expired. Please verify your WhatsApp number again.");
  return c;
}
function collectConversationAttachments_(conversationId){
  const sh=getSheet_("MESSAGES",messageHeaders_()),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++) if(String(rows[i][m.conversationId-1])===String(conversationId)){
    const a=m.attachmentJson?safeJson_(rows[i][m.attachmentJson-1]||""):null;
    if(a)(Array.isArray(a)?a:[a]).forEach(x=>{const h=hydrateAttachment_(x);if(h)out.push({messageId:String(rows[i][m.messageId-1]),sender:String(rows[i][m.sender-1]||""),timestamp:rows[i][m.timestamp-1],...h});});
  }
  return out.slice(-100);
}
function clientDashboardBootstrap_(d){
  const id=String(d.conversationId||"").trim(),phone=normalizePhone_(d.phone||"");
  if(!id||!phone)throw new Error("Verified client session information is missing.");
  const c=findConversation_(id);
  if(!c||normalizePhone_(c.studentPhone)!==phone||String(c.verificationStatus||"").toUpperCase()!=="VERIFIED")throw new Error("Your verified client session could not be restored. Please verify your WhatsApp number again.");
  const sh=getConversationSheet_(),existing=String(getByHeader_(sh,c.row,"clientAccessToken")||"");
  const token=existing||Utilities.getUuid()+Utilities.getUuid();if(!existing)setByHeader_(sh,c.row,"clientAccessToken",token);
  return json_({ok:true,clientAccessToken:token});
}
function clientDashboard_(d){
  const c=clientAuthConversation_(d),sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  const requests=[];
  for(let i=1;i<rows.length;i++){
    if(normalizePhone_(rows[i][m.studentPhone-1])===normalizePhone_(c.studentPhone) &&
       String(rows[i][m.verificationStatus-1]||"").toUpperCase()==="VERIFIED"){
      const x=rowConversation_(rows[i],i+1,sh,m);
      const tutorPhone=resolveTutorPhone_(x.assignedTutor,x.assignedTutorPhone||"");
      const tutorProfile=tutorPhone?tutorProfileByPhone_(tutorPhone):null;
      requests.push({
        conversationId:x.conversationId,studentName:x.studentName,workDescription:x.workDescription,
        assignmentStatus:x.assignmentStatus,tutorWorkStatus:x.tutorWorkStatus,tutor:x.assignedTutor,
        tutorPhone:tutorPhone,deadline:x.deadline,requestedAt:x.startedAt,completedAt:x.completedAt,
        qaStatus:x.qaStatus,feedback:x.clientFeedback,assignedAdminName:x.assignedAdminName,
        tutorProfilePictureUrl:tutorProfile&&tutorProfile.profilePictureUrl||"",tutorDescription:tutorProfile&&tutorProfile.description||""
      });
    }
  }
  const ps=getPaymentSheet_(),pr=ps.getDataRange().getValues(),payments=[];
  for(let i=1;i<pr.length;i++){const p=rowPayment_(pr[i],i+1);if(p.conversationId===c.conversationId)payments.push({requestId:p.requestId,service:p.service,amount:p.amount,currency:p.currency,status:p.status,reference:p.paystackReference,createdAt:p.createdAt,paidAt:p.paidAt,deliveryDeadline:p.deliveryDeadline,invoiceUrl:"receipt.html?request="+encodeURIComponent(p.requestId)})}
  const ss=getScheduleSheet_(),sr=ss.getDataRange().getValues(),schedules=[];
  for(let i=1;i<sr.length;i++){if(String(sr[i][1])===c.conversationId)schedules.push(rowSchedule_(sr[i],i+1))}
  const messages=readConversationMessages_(c.conversationId).map(x=>Object.assign({},x,{attachment:hydrateAttachment_(x.attachment)}));
  const docs=collectConversationAttachments_(c.conversationId);
  const submissions=messages.filter(x=>String(x.sender||"").toLowerCase()==="tutor" && x.attachment).map(x=>Object.assign({},x,{submissionType:(String(x.text||"").match(/\[([A-Z]+)\]/)||[])[1]||"WORK"}));
  return json_({ok:true,student:{name:c.studentName,phone:c.studentPhone},requests:requests,messages:messages,documents:docs,uploadedDocuments:docs.filter(x=>String(x.sender||"").toLowerCase()!=="tutor"),tutorSubmissions:submissions,payments:payments,schedules:schedules,currentRequest:rowConversation_(rows[c.row-1],c.row,sh,m),invoiceReceipts:payments.map(x=>({requestId:x.requestId,url:x.invoiceUrl,status:x.status}))});
}
function clientSendComment_(d){
  const c=clientAuthConversation_(d),text=String(d.text||"").trim();let attachments=[];
  if(Array.isArray(d.attachments)) attachments=saveAttachments_(c.conversationId,d.attachments);
  if(!text&&!attachments.length)throw new Error("Enter a comment or attach a file.");
  if(text.length>3000)throw new Error("Comment is too long.");
  const stored=attachments.length===1?attachments[0]:attachments;
  const saved=saveMessage_(c.conversationId,"student",text,"client-dashboard",stored,c.studentName,c.studentPhone);
  updateConversation_(c.conversationId,new Date(),saved.id);
  try{CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS")}catch(e){}
  return json_({ok:true,messageId:saved.id,attachment:stored||null,message:"Comment added to the BrightAce work record."});
}

function clientSubmitFeedback_(d){
  const c=clientAuthConversation_(d),feedback=String(d.feedback||"").trim();
  if(!feedback)throw new Error("Please enter your feedback.");
  if(feedback.length>2000)throw new Error("Feedback is too long.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"clientFeedback",feedback);setByHeader_(sh,c.row,"clientFeedbackAt",new Date());
  saveMessage_(c.conversationId,"student","Client feedback: "+feedback,"dashboard",null,c.studentName,c.studentPhone);
  return json_({ok:true,message:"Thank you. Your feedback has been recorded."});
}

/* ===================== TUTOR DASHBOARD ===================== */
function getTutorByPhone_(phone){
  const target=normalizePhone_(phone),sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(normalizePhone_(rows[i][m.tutorPhone-1])===target && String(rows[i][m.status-1]||"ACTIVE").toUpperCase()!=="SUSPENDED") return {row:i+1,tutorId:String(rows[i][m.tutorId-1]),tutorName:String(rows[i][m.tutorName-1]),tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||rows[i][m.tutorName-1]),tutorPhone:target};
  const props=PropertiesService.getScriptProperties(),pn=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");
  if(target&&target===pn)return {row:0,tutorId:"PRIMARY",tutorName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorDisplayName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorPhone:target};
  const test=getVerificationTestPhone_();
  if(target&&target===test)return {row:0,tutorId:"TEST-TUTOR",tutorName:"BrightAce Test Tutor",tutorDisplayName:"BrightAce Test Tutor",tutorPhone:target};
  return null;
}
function tutorSendVerification_(d){
  const phone=normalizePhone_(d.phone||""); if(phone.length<7)throw new Error("Enter a valid tutor WhatsApp number.");
  if(isWhatsAppBlocked_(phone))throw new Error("This number is not allowed here. It has been suspended by BrightAce Admin.");
  const t=getTutorByPhone_(phone);if(!t)throw new Error("This WhatsApp number is not registered to a BrightAce tutor.");
  const code=generateVerificationCode_(phone),sh=getTutorSheet_(),now=new Date();
  if(!t.row){const id=t.tutorId==="TEST-TUTOR"?"TUT-TEST":"TUT-PRIMARY",name=t.tutorName;sh.appendRow([id,name,name,phone,"WHATSAPP","ACTIVE",now,"","",0,"",""]);t=getTutorByPhone_(phone);}
  setByHeader_(sh,t.row,"loginCodeHash",sha256Hex_(code));setByHeader_(sh,t.row,"loginExpiresAt",new Date(Date.now()+10*60*1000));setByHeader_(sh,t.row,"loginAttempts",0);
  const sent=isVerificationTestCodeEnabledFor_(phone)
    ? {testMode:true,skipped:true,message:"Test verification code configured; WhatsApp delivery bypassed for the designated test number."}
    : sendWhatsAppVerificationTemplate_(phone,code);
  return json_({ok:true,message:isVerificationTestCodeEnabledFor_(phone)?"Test verification code is ready for this designated tutor number.":"A 6-digit verification code has been sent to the tutor WhatsApp number.",delivery:sent});
}
function tutorVerifyLogin_(d){
  const phone=normalizePhone_(d.phone||""),code=String(d.code||"").trim();if(!/^\d{6}$/.test(code))throw new Error("Enter the 6-digit tutor verification code.");
  const t=getTutorByPhone_(phone);if(!t||!t.row)throw new Error("Tutor account not found.");
  const sh=getTutorSheet_(),expiry=getByHeader_(sh,t.row,"loginExpiresAt"),attempts=Number(getByHeader_(sh,t.row,"loginAttempts")||0);
  if(expiry&&new Date(expiry).getTime()<Date.now())throw new Error("That tutor verification code has expired.");
  if(attempts>=3)throw new Error("Too many incorrect attempts. Request a new code.");
  if(String(getByHeader_(sh,t.row,"loginCodeHash")||"")!==sha256Hex_(code)){setByHeader_(sh,t.row,"loginAttempts",attempts+1);throw new Error("Incorrect tutor verification code.");}
  const token=Utilities.getUuid()+Utilities.getUuid(),profile={tutorId:t.tutorId,tutorName:t.tutorName,tutorDisplayName:t.tutorDisplayName,tutorPhone:t.tutorPhone},tokenExpiry=new Date(Date.now()+30*24*60*60*1000).getTime();
  profile.tokenExpiresAt=tokenExpiry;
  CacheService.getScriptCache().put("BA_TUTOR_"+token,JSON.stringify(profile),21600);
  PropertiesService.getScriptProperties().setProperty("BA_TUTOR_TOKEN_"+token,JSON.stringify(profile));
  setByHeader_(sh,t.row,"loginCodeHash","");setByHeader_(sh,t.row,"loginExpiresAt","");setByHeader_(sh,t.row,"loginAttempts",0);setByHeader_(sh,t.row,"lastLoginAt",new Date());
  return json_({ok:true,tutorToken:token,tutor:profile,expiresIn:21600});
}
function requireTutor_(token){
  token=String(token||"").trim(); if(!token)throw new Error("Tutor login is required or has expired.");
  let p=safeJson_(CacheService.getScriptCache().get("BA_TUTOR_"+token)||"");
  if(!p||!p.tutorPhone){
    p=safeJson_(PropertiesService.getScriptProperties().getProperty("BA_TUTOR_TOKEN_"+token)||"");
    if(p&&p.tutorPhone&&Number(p.tokenExpiresAt||0)>Date.now()){
      CacheService.getScriptCache().put("BA_TUTOR_"+token,JSON.stringify(p),21600);
    }
  }
  if(!p||!p.tutorPhone||Number(p.tokenExpiresAt||0)<=Date.now())throw new Error("Tutor login is required or has expired. Please verify your registered WhatsApp number again.");
  return p;
}

function tutorProfileByPhone_(phone){
  const target=normalizePhone_(phone),sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(normalizePhone_(rows[i][m.tutorPhone-1])===target){
    return {tutorId:String(rows[i][m.tutorId-1]||""),tutorName:String(rows[i][m.tutorName-1]||""),tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||rows[i][m.tutorName-1]||""),tutorPhone:target,profilePictureUrl:m.profilePictureUrl?String(rows[i][m.profilePictureUrl-1]||""):"",description:m.description?String(rows[i][m.description-1]||""):""};
  }
  const props=PropertiesService.getScriptProperties();
  if(target===normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"")) return {tutorId:"PRIMARY",tutorName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorDisplayName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorPhone:target,profilePictureUrl:""};
  if(target===getVerificationTestPhone_()) return {tutorId:"TEST-TUTOR",tutorName:"BrightAce Test Tutor",tutorDisplayName:"BrightAce Test Tutor",tutorPhone:target,profilePictureUrl:""};
  return null;
}
function ensureTutorProfileRow_(profile){
  const sh=getTutorSheet_(),found=getTutorByPhone_(profile.tutorPhone);
  if(found&&found.row)return {sh:sh,row:found.row,tutor:found};
  const id=profile.tutorId==="TEST-TUTOR"?"TUT-TEST":"TUT-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase();
  sh.appendRow([id,profile.tutorName,profile.tutorDisplayName,profile.tutorPhone,"WHATSAPP","ACTIVE",new Date(),"","",0,""]);
  return {sh:sh,row:sh.getLastRow(),tutor:getTutorByPhone_(profile.tutorPhone)};
}
function tutorUploadProfile_(d){
  const p=requireTutor_(d.tutorToken),a=d.profilePicture;
  if(!a||!a.dataUrl)throw new Error("Choose a profile picture first.");
  const mime=String(a.mimeType||"").toLowerCase();
  if(!/^image\/(jpeg|png|webp|gif)$/.test(mime))throw new Error("Profile picture must be JPG, PNG, WEBP or GIF.");
  const bytes=Utilities.base64Decode(String(a.dataUrl).split(",").pop());
  if(bytes.length>5*1024*1024)throw new Error("Profile picture must be smaller than 5 MB.");
  const blob=Utilities.newBlob(bytes,mime,String(a.name||"tutor-profile"));
  const saved=saveBlob_(blob,mime,String(a.name||"tutor-profile"),"TUTOR_PROFILE_"+p.tutorPhone);
  const rowInfo=ensureTutorProfileRow_(p),sh=rowInfo.sh;
  setByHeader_(sh,rowInfo.row,"profilePictureUrl",saved.viewUrl||saved.downloadUrl);
  return json_({ok:true,profilePictureUrl:"https://drive.google.com/thumbnail?id="+encodeURIComponent(saved.fileId)+"&sz=w512"});
}
function getTutorPaymentView_(conversationId,tutorPhone){
  const paid=findPaidPaymentForConversation_(conversationId);
  if(!paid)return {paymentStatus:"NOT_PAID",tutorPayout:null,payoutStatus:"PENDING_CLIENT_PAYMENT"};
  const sh=getConversationSheet_(),c=findConversation_(conversationId);
  const amount=Number(c&&c.agreedAmount||paid.amount||0),payout=Math.round(amount*0.60*100)/100;
  const existing=findPayoutForWork_(conversationId);
  return {paymentStatus:"PAID",tutorPayout:payout,payoutStatus:existing?"RECORDED":"PENDING_PAYOUT"};
}

function getTutorBalanceView_(profile){
  const name=String(profile.tutorName||"");
  const csh=getConversationSheet_(),rows=csh.getDataRange().getValues(),m=headerMap_(csh);
  const earnedBy={}, paidBy={};
  const ps=getTutorPayoutSheet_(),pr=ps.getDataRange().getValues();
  for(let i=1;i<pr.length;i++){
    if(String(pr[i][2]||"")!==name) continue;
    const cur=String(pr[i][6]||"KES").toUpperCase(), earned=Number(pr[i][5]||0), status=String(pr[i][7]||"OWED").toUpperCase();
    const paid=Math.min(earned,status==="PAID"?earned:Number(pr[i][12]||0));
    earnedBy[cur]=(earnedBy[cur]||0)+earned; paidBy[cur]=(paidBy[cur]||0)+paid;
  }
  // Include paid assigned work even if an older deployment/payment record has not yet created a payout row.
  for(let i=1;i<rows.length;i++){
    const c=rowConversation_(rows[i],i+1,csh,m);
    const assigned=normalizePhone_(c.assignedTutorPhone)===profile.tutorPhone ||
      (profile.tutorId==="PRIMARY"&&c.assignedTutor===profile.tutorName&&!c.assignedTutorPhone);
    if(!assigned) continue;
    const paid=findPaidPaymentForConversation_(c.conversationId); if(!paid) continue;
    const cur=String(c.agreedCurrency||paid.currency||c.currency||"KES").toUpperCase();
    const amount=Number(c.agreedAmount||paid.amount||0), payout=Math.round(amount*0.60*100)/100;
    if(!findPayoutForWork_(c.conversationId)) earnedBy[cur]=(earnedBy[cur]||0)+payout;
  }
  const currencies=new Set(Object.keys(earnedBy).concat(Object.keys(paidBy)));
  const byCurrency={}; currencies.forEach(cur=>{const earned=Math.round((earnedBy[cur]||0)*100)/100,paid=Math.round((paidBy[cur]||0)*100)/100;byCurrency[cur]={earned,paid,balance:Math.max(0,Math.round((earned-paid)*100)/100)}});
  return {byCurrency:byCurrency};
}
function tutorDashboard_(d){
  const p=requireTutor_(d.tutorToken),sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),works=[];
  for(let i=1;i<rows.length;i++){
    const c=rowConversation_(rows[i],i+1,sh,m),assigned=normalizePhone_(c.assignedTutorPhone)===p.tutorPhone ||
      (p.tutorId==="PRIMARY" && c.assignedTutor===p.tutorName && !c.assignedTutorPhone);
    if(!assigned||String(c.status).toLowerCase()==="closed")continue;
    const allMsgs=readConversationMessages_(c.conversationId).map(x=>Object.assign({},x,{attachment:hydrateAttachment_(x.attachment),submissionType:(String(x.text||"").match(/\[([A-Z]+)\]/)||[])[1]||""})); const msgs=allMsgs.filter(x=>String(x.sender).toLowerCase()==="tutor"); const adminComments=allMsgs.filter(x=>String(x.sender).toLowerCase()==="admin"); const clientTutorMessages=allMsgs.filter(x=>["student","tutor"].indexOf(String(x.sender).toLowerCase())>=0);
    const attachments=collectConversationAttachments_(c.conversationId).filter(x=>String(x.sender).toLowerCase()==="student"||String(x.sender).toLowerCase()==="admin");
    const pay=getTutorPaymentView_(c.conversationId,p.tutorPhone); const tutorProfile=tutorProfileByPhone_(p.tutorPhone)||p;
    const scheduleSheet=getScheduleSheet_(),scheduleRows=scheduleSheet.getDataRange().getValues(),schedules=[];
    for(let si=1;si<scheduleRows.length;si++) if(String(scheduleRows[si][1]||"")===c.conversationId) schedules.push(rowSchedule_(scheduleRows[si],si+1));
    works.push({...c,studentName:c.studentName,documents:attachments,submissions:msgs,adminComments:adminComments,clientTutorMessages:clientTutorMessages,paymentStatus:pay.paymentStatus,tutorPayout:pay.tutorPayout,payoutStatus:pay.payoutStatus,tutorProfilePictureUrl:tutorProfile.profilePictureUrl||"",clientFeedback:c.clientFeedback||"",clientFeedbackAt:c.clientFeedbackAt||"",schedules:schedules});
  }
  const av=getTutorAvailability_(p.tutorPhone),balance=getTutorBalanceView_(p),profile=tutorProfileByPhone_(p.tutorPhone);
  p.profilePictureUrl=(profile&&profile.profilePictureUrl)||"";
  return json_({ok:true,tutor:p,works:works,availability:av,balance:balance});
}
function tutorUpdateWorkStatus_(d){
  const p=requireTutor_(d.tutorToken),c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  if(normalizePhone_(c.assignedTutorPhone)!==p.tutorPhone && !(p.tutorId==="PRIMARY"&&c.assignedTutor===p.tutorName))throw new Error("This work is not assigned to you.");
  const status=String(d.status||"").toUpperCase();if(["RECEIVED","IN_PROGRESS","READY_FOR_QA","REVISION_REQUESTED"].indexOf(status)<0)throw new Error("Invalid tutor work status.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"tutorWorkStatus",status);if(status==="IN_PROGRESS")setByHeader_(sh,c.row,"assignmentStatus","IN_PROGRESS");
  auditTutor_(p,"STATUS_"+status,c.conversationId);return json_({ok:true,status:status});
}
function tutorSubmitWork_(d){
  const p=requireTutor_(d.tutorToken),c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  if(normalizePhone_(c.assignedTutorPhone)!==p.tutorPhone && !(p.tutorId==="PRIMARY"&&c.assignedTutor===p.tutorName))throw new Error("This work is not assigned to you.");
  let attachments=[];if(Array.isArray(d.attachments))attachments=saveAttachments_(c.conversationId,d.attachments);
  const note=String(d.note||"").trim(),submissionType=String(d.submissionType||"DRAFT").toUpperCase();if(!["DRAFT","FINAL"].includes(submissionType))throw new Error("Choose DRAFT or FINAL.");if(!note&&!attachments.length)throw new Error("Add a submission note or at least one file.");
  const stored=attachments.length===1?attachments[0]:attachments;
  const msg="📤 Tutor submission ["+submissionType+"]\n\n"+(note||"Your tutor has submitted work for BrightAce review.");
  const saved=saveMessage_(c.conversationId,"tutor",msg,"tutor",stored,p.tutorDisplayName,p.tutorPhone);
  updateConversation_(c.conversationId,new Date(),saved.id);
  const sh=getConversationSheet_();const nextStatus=submissionType==="FINAL"?"READY_FOR_QA":"IN_PROGRESS";setByHeader_(sh,c.row,"tutorWorkStatus",nextStatus);setByHeader_(sh,c.row,"tutorSubmittedAt",new Date());setByHeader_(sh,c.row,"tutorSubmissionNote",note);setByHeader_(sh,c.row,"assignmentStatus",nextStatus);
  auditTutor_(p,"SUBMIT_WORK",c.conversationId);return json_({ok:true,messageId:saved.id,status:nextStatus,submissionType:submissionType,attachments:attachments});
}
function getTutorAvailability_(phone){
  const sh=getAvailabilitySheet_(),rows=sh.getDataRange().getValues(),out=[];
  for(let i=1;i<rows.length;i++)if(normalizePhone_(rows[i][1])===normalizePhone_(phone))out.push({day:Number(rows[i][2]),start:String(rows[i][3]),end:String(rows[i][4]),active:String(rows[i][5]).toUpperCase()!=="OFF"});
  return out;
}

function tutorAddWorkComment_(d){
  const p=requireTutor_(d.tutorToken),c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  if(normalizePhone_(c.assignedTutorPhone)!==p.tutorPhone && !(p.tutorId==="PRIMARY"&&c.assignedTutor===p.tutorName))throw new Error("This work is not assigned to you.");
  const text=String(d.text||"").trim();if(!text)throw new Error("Enter a comment.");if(text.length>3000)throw new Error("Comment is too long.");
  const saved=saveMessage_(c.conversationId,"tutor",text,"work-comment",null,p.tutorDisplayName,p.tutorPhone);
  updateConversation_(c.conversationId,new Date(),saved.id);auditTutor_(p,"WORK_COMMENT",c.conversationId);
  return json_({ok:true,messageId:saved.id});
}
function tutorSaveAvailability_(d){
  const p=requireTutor_(d.tutorToken),items=Array.isArray(d.availability)?d.availability:[];if(items.length>14)throw new Error("Too many availability entries.");
  items.forEach(x=>{const day=Number(x.day),start=String(x.start||""),end=String(x.end||"");if(day<0||day>6||!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(end)||((end!=="24:00")&&start>=end))throw new Error("Invalid tutor availability.");});
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sh=getAvailabilitySheet_(),rows=sh.getDataRange().getValues();
    for(let i=rows.length-1;i>=1;i--)if(normalizePhone_(rows[i][1])===p.tutorPhone)sh.deleteRow(i+1);
    items.forEach(x=>sh.appendRow([Utilities.getUuid(),p.tutorPhone,Number(x.day),String(x.start),String(x.end),"ACTIVE",new Date()]));
    SpreadsheetApp.flush();
    return json_({ok:true,availability:getTutorAvailability_(p.tutorPhone),savedAt:new Date().toISOString()});
  }finally{lock.releaseLock();}
}
function adminGetTutorAvailability_(d){
  requireAdmin_(d.adminToken);
  const phone=normalizePhone_(d.tutorPhone||"");
  if(!phone) throw new Error("Tutor WhatsApp number is required.");
  return json_({ok:true,availability:getTutorAvailability_(phone)});
}
function adminCheckTutorAvailability_(d){
  requireAdmin_(d.adminToken);const phone=normalizePhone_(d.tutorPhone||""),date=String(d.date||"");if(!phone||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("Tutor and date are required.");
  const day=new Date(date+"T12:00:00").getDay(),start=String(d.start||""),end=String(d.end||"");if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(end)||((end!=="24:00")&&start>=end))throw new Error("Enter a valid start and end time.");
  const av=getTutorAvailability_(phone),inside=av.some(x=>x.active&&x.day===day&&start>=x.start&&end<=x.end);
  let conflict=false;
  if(inside){
    const sh=getScheduleSheet_(),rows=sh.getDataRange().getValues();
    const toMin=v=>{const q=String(v||"").split(":").map(Number);return q[0]*60+q[1]};
    const ns=toMin(start),ne=toMin(end);
    for(let i=1;i<rows.length;i++){
      if(normalizePhone_(rows[i][2])!==phone || String(rows[i][4])!==date || String(rows[i][9]).toUpperCase()==="CANCELLED")continue;
      if(ns<toMin(rows[i][6]) && ne>toMin(rows[i][5])){conflict=true;break;}
    }
  }
  const ok=inside&&!conflict;
  return json_({ok:true,available:ok,day:day,message:ok?"Tutor is available for this time.":conflict?"Tutor already has an appointment in this time range.":"Tutor is not marked available for this time."});
}
function getScheduleSheet_(){
  const h=["scheduleId","conversationId","tutorPhone","tutorName","date","startTime","endTime","timezone","zoomLink","status","studentName","notes","createdAt","confirmedAt","reminder24Sent","reminder1Sent","studentPhone"];
  return ensureColumns_(getSheet_("SCHEDULES",h),h);
}
function rowSchedule_(r,row){return {row:row,scheduleId:String(r[0]||""),conversationId:String(r[1]||""),tutorPhone:String(r[2]||""),tutorName:String(r[3]||""),date:String(r[4]||""),startTime:String(r[5]||""),endTime:String(r[6]||""),timezone:String(r[7]||"Africa/Nairobi"),zoomLink:String(r[8]||""),status:String(r[9]||"PROPOSED"),studentName:String(r[10]||""),notes:String(r[11]||""),createdAt:r[12]||"",confirmedAt:r[13]||"",studentPhone:String(r[16]||"")};}
function adminCreateSchedule_(d){
  requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");
  const chosen=getTutorById_(d.tutorId)||null;
  const tutorName=String(chosen?.tutorName||d.tutorName||c.assignedTutor||"").trim();
  const tutorPhone=normalizePhone_(chosen?.tutorPhone||d.tutorPhone||c.assignedTutorPhone||resolveTutorPhone_(tutorName,""));
  if(!tutorName)throw new Error("Select a tutor.");
  if(!tutorPhone)throw new Error("The selected tutor does not have a WhatsApp number configured.");
  const chk=adminCheckTutorAvailability_({adminToken:d.adminToken,tutorPhone:tutorPhone,date:d.date,start:d.startTime,end:d.endTime});
  if(!chk.available)throw new Error("Tutor availability check failed. Choose a time inside the tutor's available hours.");
  const sh=getScheduleSheet_(),id="SCH-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),now=new Date();
  sh.appendRow([id,c.conversationId,tutorPhone,tutorName,String(d.date),String(d.startTime),String(d.endTime),String(d.timezone||"Africa/Nairobi"),String(d.zoomLink||"").trim(),"CONFIRMED",c.studentName,String(d.notes||"").trim(),now,now,"","",c.studentPhone]);
  setByHeader_(getConversationSheet_(),c.row,"assignmentStatus",c.assignmentStatus==="COMPLETED"?"COMPLETED":"SCHEDULED");
  const msg="📅 BrightAce tutoring session confirmed\n\nDate: "+d.date+"\nTime: "+d.startTime+"–"+d.endTime+" "+String(d.timezone||"Africa/Nairobi")+(d.zoomLink?"\nZoom: "+d.zoomLink:"")+"\n\nPlease use your BrightAce dashboard for the appointment details.";
  const saved=saveMessage_(c.conversationId,"admin",msg,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(c.studentPhone,msg)}catch(e){}
  try{sendWhatsAppText_(tutorPhone,msg)}catch(e){}
  return json_({ok:true,schedule:rowSchedule_(sh.getRange(sh.getLastRow(),1,1,sh.getLastColumn()).getValues()[0],sh.getLastRow())});
}
function adminListSchedules_(token){
  requireAdmin_(token);const sh=getScheduleSheet_(),rows=sh.getDataRange().getValues(),out=[];for(let i=1;i<rows.length;i++)out.push(rowSchedule_(rows[i],i+1));return json_({ok:true,schedules:out.reverse()});
}
function adminUpdateSchedule_(d){
  requireAdmin_(d.adminToken);const sh=getScheduleSheet_(),rows=sh.getDataRange().getValues();let row=0;for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(d.scheduleId))row=i+1;if(!row)throw new Error("Schedule not found.");["date","startTime","endTime","zoomLink","status","notes"].forEach(k=>{if(d[k]!==undefined)sh.getRange(row,{date:5,startTime:6,endTime:7,zoomLink:9,status:10,notes:12}[k]).setValue(d[k])});return json_({ok:true,schedule:rowSchedule_(sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],row)});}
function getAvailabilitySheet_(){return ensureColumns_(getSheet_("TUTOR_AVAILABILITY",["availabilityId","tutorPhone","day","startTime","endTime","status","createdAt"]),["availabilityId","tutorPhone","day","startTime","endTime","status","createdAt"]);}


/* ===================== SCHEDULED REMINDERS ===================== */
function installBrightAceReminderTrigger(){
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==="sendBrightAceScheduledReminders").forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sendBrightAceScheduledReminders").timeBased().everyMinutes(15).create();
}
function sendBrightAceScheduledReminders(){
  const sh=getScheduleSheet_(),rows=sh.getDataRange().getValues(),now=Date.now(),tz=Session.getScriptTimeZone()||"Africa/Nairobi";
  for(let i=1;i<rows.length;i++){
    const r=rows[i],status=String(r[9]||"").toUpperCase();if(status!=="CONFIRMED")continue;
    const zone=String(r[7]||tz),date=String(r[4]||""),start=String(r[5]||"");if(!date||!start)continue;
    const when=new Date(Utilities.formatDate(new Date(date+"T12:00:00"),zone,"yyyy-MM-dd")+"T"+start+":00").getTime(),mins=(when-now)/60000;
    const send=mins<=1440&&mins>1425&&!r[14],send1=mins<=60&&mins>45&&!r[15];
    if(!send&&!send1)continue;
    const msg=(send1?"⏰ BrightAce reminder — your tutoring session starts in about 1 hour.":"⏰ BrightAce reminder — your tutoring session is tomorrow.")+"\n\nDate: "+date+"\nTime: "+start+"–"+String(r[6]||"")+" "+zone+(r[8]?"\nZoom: "+r[8]:"")+"\n\nWork ID: "+String(r[1]||"");
    try{if(r[16])sendWhatsAppText_(normalizePhone_(r[16]),msg);if(r[2])sendWhatsAppText_(normalizePhone_(r[2]),msg);}catch(e){console.error(e)}
    if(send)setByHeader_(sh,i+1,"reminder24Sent",new Date());if(send1)setByHeader_(sh,i+1,"reminder1Sent",new Date());
  }
}

/* ===================== QUALITY CONTROL ===================== */
function adminListQuality_(token){
  requireAdmin_(token);const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++){const c=rowConversation_(rows[i],i+1,sh,m);if(String(c.tutorWorkStatus).toUpperCase()==="READY_FOR_QA"||String(c.qaStatus).toUpperCase()==="REVISION_REQUIRED"||String(c.qaStatus).toUpperCase()==="APPROVED"||String(c.assignmentStatus).toUpperCase()==="COMPLETED")out.push({...c,documents:collectConversationAttachments_(c.conversationId)});}
  return json_({ok:true,works:out.reverse()});
}
function adminQaWork_(d){
  requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  const decision=String(d.decision||"").toUpperCase(),notes=String(d.notes||"").trim();if(["APPROVE","REVISION"].indexOf(decision)<0)throw new Error("Choose approve or revision.");if(!notes)throw new Error("Add QA notes.");
  const profile=getAdminProfile_(d.adminToken),sh=getConversationSheet_();
  setByHeader_(sh,c.row,"qaStatus",decision==="APPROVE"?"APPROVED":"REVISION_REQUIRED");setByHeader_(sh,c.row,"qaAt",new Date());setByHeader_(sh,c.row,"qaBy",profile.adminName||profile.username);setByHeader_(sh,c.row,"qaNotes",notes);
  if(decision==="APPROVE"){setByHeader_(sh,c.row,"assignmentStatus","QA_APPROVED");setByHeader_(sh,c.row,"tutorWorkStatus","READY_FOR_QA");}
  else {setByHeader_(sh,c.row,"assignmentStatus","REVISION_REQUIRED");setByHeader_(sh,c.row,"tutorWorkStatus","REVISION_REQUESTED");}
  const msg=decision==="APPROVE"?"✅ BrightAce Admin QA approved the tutor submission. Your completed work is now available in your dashboard.":"📝 BrightAce Admin QA requested a tutor revision. The team will update the work before final delivery.";
  const saved=saveMessage_(c.conversationId,"admin",msg,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(normalizePhone_(c.studentPhone),msg)}catch(e){}
  return json_({ok:true,qaStatus:decision==="APPROVE"?"APPROVED":"REVISION_REQUIRED"});
}
function auditTutor_(profile,action,detail){try{const sh=getSheet_("ACTIVITY_LOG",["timestamp","actorType","actor","action","detail"]);sh.appendRow([new Date(),"TUTOR",profile.tutorName||profile.tutorId,action,detail]);}catch(e){}}



function tutorGetAdminMessages_(d){
  const p=requireTutor_(d.tutorToken),sh=getTutorMessagesSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++){
    if(normalizePhone_(rows[i][m.tutorPhone-1])===p.tutorPhone){
      const a=m.attachmentJson?safeJson_(rows[i][m.attachmentJson-1]||""):null;
      out.push({id:String(rows[i][m.messageId-1]),tutorPhone:String(rows[i][m.tutorPhone-1]),tutorName:String(rows[i][m.tutorName-1]||""),sender:String(rows[i][m.sender-1]||""),senderName:String(rows[i][m.senderName-1]||""),text:String(rows[i][m.text-1]||""),timestamp:rows[i][m.timestamp-1],status:String(rows[i][m.status-1]||"received"),attachment:hydrateAttachmentValue_(a)});
    }
  }
  return json_({ok:true,messages:out.slice(-100)});
}

function tutorSendAdminMessage_(d){
  const p=requireTutor_(d.tutorToken),text=String(d.text||"").trim();
  if(!text)throw new Error("Enter a message for BrightAce Admin.");
  const target=normalizePhone_(PropertiesService.getScriptProperties().getProperty(CONFIG.adminWhatsAppKey)||CONFIG.defaultAdminWhatsAppPhone);
  if(!target)throw new Error("BrightAce admin WhatsApp is not configured.");
  const msg="*BrightAce Tutor Dashboard*\n"+p.tutorDisplayName+"\n\n"+text;
  const result=sendWhatsAppText_(target,msg);
  saveTutorMessage_(p.tutorPhone,p.tutorName,"tutor",p.tutorDisplayName,text,"sent",null);
  return json_({ok:true,whatsapp:result});
}
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
  if(String(c.qaStatus||"PENDING").toUpperCase()!=="APPROVED") throw new Error("Admin QA approval is required before this work can be completed.");
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

function adminListWorkAssignments_(token){
  requireAdmin_(token);
  const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),paidMap={};
  const ps=getPaymentSheet_(),pr=ps.getDataRange().getValues();
  for(let i=pr.length-1;i>=1;i--){
    const cid=String(pr[i][1]||""),status=String(pr[i][10]||"").toUpperCase();
    if(cid&&!paidMap[cid]&&status==="PAID")paidMap[cid]=true;
  }
  const out=[];
  for(let i=rows.length-1;i>=1;i--){
    const c=rowConversation_(rows[i],i+1,sh,m);
    const verification=String(c.verificationStatus||"").toUpperCase();
    const status=String(c.status||"").toLowerCase();
    const assignment=String(c.assignmentStatus||"NEW_REQUEST").toUpperCase();
    if(verification && verification!=="VERIFIED") continue;
    if(status==="closed" || assignment==="COMPLETED" || assignment==="REJECTED") continue;
    if(!c.conversationId || !c.studentName) continue;
    out.push({...c,
      assignmentStatus:assignment,
      paymentStatus:paidMap[c.conversationId]?"PAID":"PENDING",
      requestedAt:c.startedAt||"",
      isAssigned:!!(c.assignedTutor && c.assignedTutor!=="Unassigned")
    });
  }
  return json_({ok:true,works:out});
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
function getTutorMessagesSheet_(){
  return ensureColumns_(getSheet_("TUTOR_MESSAGES",["messageId","tutorPhone","tutorName","sender","senderName","text","timestamp","status","attachmentJson"]),["messageId","tutorPhone","tutorName","sender","senderName","text","timestamp","status","attachmentJson"]);
}
function saveTutorMessage_(tutorPhone,tutorName,sender,senderName,text,status,attachment){
  const sh=getTutorMessagesSheet_(),m=headerMap_(sh),id=Utilities.getUuid(),row=sh.getLastRow()+1;
  const vals=new Array(sh.getLastColumn()).fill("");
  vals[m.messageId-1]=id;vals[m.tutorPhone-1]=normalizePhone_(tutorPhone);vals[m.tutorName-1]=String(tutorName||"");vals[m.sender-1]=String(sender||"");vals[m.senderName-1]=String(senderName||"");vals[m.text-1]=String(text||"");vals[m.timestamp-1]=new Date();vals[m.status-1]=String(status||"received");if(m.attachmentJson)vals[m.attachmentJson-1]=attachment?JSON.stringify(attachment):"";
  sh.getRange(row,1,1,vals.length).setValues([vals]);return id;
}

function adminTutorPortalPreview_(d){
  requireAdmin_(d.adminToken);
  const tutorId=String(d.tutorId||"").trim(), tutorPhone=normalizePhone_(d.tutorPhone||"");
  if(!tutorId && !tutorPhone) throw new Error("Select a tutor first.");
  const tsh=getTutorSheet_(), trows=tsh.getDataRange().getValues(), tm=headerMap_(tsh);
  let tutor=null;
  for(let i=1;i<trows.length;i++){
    const id=String(trows[i][tm.tutorId-1]||"");
    const ph=normalizePhone_(trows[i][tm.tutorPhone-1]||"");
    if((tutorId&&id===tutorId)||(tutorPhone&&ph===tutorPhone)){
      tutor={tutorId:id,tutorName:String(trows[i][tm.tutorName-1]||""),tutorDisplayName:String(trows[i][tm.tutorDisplayName-1]||trows[i][tm.tutorName-1]||""),tutorPhone:ph,status:String(trows[i][tm.status-1]||"ACTIVE"),profilePictureUrl:tm.profilePictureUrl?String(trows[i][tm.profilePictureUrl-1]||""):"",description:tm.description?String(trows[i][tm.description-1]||""):""};
      break;
    }
  }
  if(!tutor){
    const p=PropertiesService.getScriptProperties(), primary=normalizePhone_(p.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");
    if(tutorId==="PRIMARY" || (tutorPhone&&tutorPhone===primary)) tutor={tutorId:"PRIMARY",tutorName:String(p.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorDisplayName:String(p.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorPhone:primary,status:"ACTIVE",profilePictureUrl:tutorProfileByPhone_(primary)?.profilePictureUrl||""};
  }
  if(!tutor) throw new Error("Tutor was not found.");
  const csh=getConversationSheet_(), rows=csh.getDataRange().getValues(), cm=headerMap_(csh), works=[];
  for(let i=1;i<rows.length;i++){
    const c=rowConversation_(rows[i],i+1,csh,cm);
    const assigned=normalizePhone_(c.assignedTutorPhone)===tutor.tutorPhone ||
      (tutor.tutorId==="PRIMARY" && c.assignedTutor===tutor.tutorName && !c.assignedTutorPhone);
    if(!assigned) continue;
    const messages=readConversationMessages_(c.conversationId).map(m=>Object.assign({},m,{attachment:hydrateAttachment_(m.attachment)}));
    const clientVisibleMessages=messages.filter(m=>["student","tutor","work-comment"].includes(String(m.sender||"").toLowerCase()) || String(m.source||"").toLowerCase()==="work-comment");
    const docs=collectConversationAttachments_(c.conversationId).map(a=>hydrateAttachment_(a));
    const pay=getTutorPaymentView_(c.conversationId,tutor.tutorPhone);
    works.push({
      conversationId:c.conversationId,studentName:c.studentName,studentPhone:c.studentPhone,
      workDescription:c.workDescription,deadline:c.deadline,assignmentStatus:c.assignmentStatus||"NEW_REQUEST",
      tutorWorkStatus:c.tutorWorkStatus||"",qaStatus:c.qaStatus||"PENDING",
      paymentStatus:pay.paymentStatus,tutorPayout:pay.tutorPayout,payoutStatus:pay.payoutStatus,
      startedAt:c.startedAt,lastMessageAt:c.lastMessageAt,documents:docs,messages:messages,clientVisibleMessages:clientVisibleMessages,
      clientFeedback:c.clientFeedback||"",clientFeedbackAt:c.clientFeedbackAt||""
    });
  }
  const tmessages=tutor.tutorPhone?getTutorMessagesForAdminPreview_(tutor.tutorPhone):[];
  const availability=getTutorAvailability_(tutor.tutorPhone);
  return json_({ok:true,tutor:tutor,works:works,tutorAdminMessages:tmessages,availability:availability});
}
function getTutorMessagesForAdminPreview_(phone){
  const sh=getTutorMessagesSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++) if(normalizePhone_(rows[i][m.tutorPhone-1])===normalizePhone_(phone)){
    const a=m.attachmentJson?safeJson_(rows[i][m.attachmentJson-1]||""):null;
    out.push({id:String(rows[i][m.messageId-1]),sender:String(rows[i][m.sender-1]||""),senderName:String(rows[i][m.senderName-1]||""),text:String(rows[i][m.text-1]||""),timestamp:rows[i][m.timestamp-1],attachment:hydrateAttachmentValue_(a)});
  }
  return out;
}
function adminGetTutorMessages_(d){
  requireAdmin_(d.adminToken);const phone=normalizePhone_(d.tutorPhone||"");
  if(!phone)throw new Error("Tutor WhatsApp number is missing. Select a tutor with a valid WhatsApp number.");
  const sh=getTutorMessagesSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=rows.length-1;i>=1&&out.length<100;i--)if(normalizePhone_(rows[i][m.tutorPhone-1])===phone){
    const a=m.attachmentJson?safeJson_(rows[i][m.attachmentJson-1]||""):null;
    out.push({id:String(rows[i][m.messageId-1]),tutorPhone:String(rows[i][m.tutorPhone-1]),tutorName:String(rows[i][m.tutorName-1]||""),sender:String(rows[i][m.sender-1]||""),senderName:String(rows[i][m.senderName-1]||""),text:String(rows[i][m.text-1]||""),timestamp:rows[i][m.timestamp-1],status:String(rows[i][m.status-1]||"received"),attachment:hydrateAttachmentValue_(a)});
  }
  return json_({ok:true,messages:out.reverse()});
}
function adminSendTutorMessage_(d){
  const profile=getAdminProfile_(d.adminToken),phone=resolveTutorPhone_(d.tutorName,d.tutorPhone||""),text=String(d.text||"").trim(),tutorName=String(d.tutorName||"Tutor").trim();
  if(!phone)throw new Error("Tutor WhatsApp number is missing. Select a tutor with a valid WhatsApp number.");
  let attachments=[];
  if(Array.isArray(d.attachments))attachments=saveAttachments_(d.tutorPhone||"",d.attachments);
  else if(d.attachment&&d.attachment.dataUrl)attachments=saveAttachments_(d.tutorPhone||"",[d.attachment]);
  if(!text&&!attachments.length)throw new Error("Message or attachment is required.");
  const cfg=adminMetaConfig_(d.adminToken),prefix="*BrightAce Academy Admin*\n"+String(profile.adminName||"Admin")+"\n\n";
  let results=[];
  try{
    if(text)results.push(sendWhatsAppTextWithConfig_(phone,prefix+text,cfg));
    attachments.forEach(a=>results.push(sendWhatsAppMediaWithConfig_(phone,a,cfg)));
  }catch(e){throw new Error("Tutor message could not be sent: "+(e&&e.message||e));}
  saveTutorMessage_(phone,tutorName,"admin",String(profile.adminName||profile.username||"Admin"),text,"sent",attachments.length?attachments:null);
  auditAdmin_(d.adminToken,"ADMIN_MESSAGE","Tutor: "+tutorName);
  return json_({ok:true,whatsapp:results,attachments:attachments});
}
function adminListTutorBalances_(token){
  requireAdmin_(token);
  // Reconcile older paid assignments so a tutor can see/receive money even when
  // the payment happened before the payout-record automation was deployed.
  try{
    const csh=getConversationSheet_(),cr=csh.getDataRange().getValues(),cm=headerMap_(csh);
    const psh=getPaymentSheet_(),pr=psh.getDataRange().getValues(),paidMap={};
    for(let i=1;i<pr.length;i++){const pp=rowPayment_(pr[i],i+1);if(pp.conversationId&&String(pp.status||"").toUpperCase()==="PAID"&&!paidMap[pp.conversationId])paidMap[pp.conversationId]=pp;}
    for(let i=1;i<cr.length;i++){
      const c=rowConversation_(cr[i],i+1,csh,cm);
      if(c.conversationId&&c.assignedTutor&&c.assignedTutor!=="Unassigned"&&paidMap[c.conversationId]&&!findPayoutForWork_(c.conversationId)) ensureTutorPayoutRecordForPaidWork_(c.conversationId,paidMap[c.conversationId]);
    }
  }catch(e){console.error("Tutor payout reconciliation failed: "+e)}
  const sh=getTutorPayoutSheet_(),rows=sh.getDataRange().getValues(),map={};
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
function adminDeletePaymentNotification_(d){
  requireAdmin_(d.adminToken);
  const requestId=String(d.requestId||"").trim();
  if(!requestId) throw new Error("Payment request ID is required.");
  auditAdmin_(d.adminToken,"DELETE_PAYMENT_NOTIFICATION",requestId);
  return json_({ok:true,deleted:true,requestId:requestId});
}

function adminListPayments_(token){requireAdmin_(token);const sh=getPaymentSheet_(),rows=sh.getDataRange().getValues(),out=[];for(let i=rows.length-1;i>=1;i--){const p=rowPayment_(rows[i],i+1);out.push({requestId:p.requestId,conversationId:p.conversationId,studentName:p.studentName,studentPhone:p.studentPhone,studentEmail:p.email,tutor:p.tutor,service:p.service,description:p.serviceDescription,amount:p.amount,currency:p.currency,deliveryDeadline:p.deliveryDeadline,status:p.status,createdAt:p.createdAt,paidAt:p.paidAt,paidAmount:String(p.status).toUpperCase()==="PAID"?p.amount:0,pendingBalance:String(p.status).toUpperCase()==="PAID"?0:p.amount,refundStatus:p.refundStatus})}return json_({ok:true,payments:out.slice(0,100)})}
function adminCreatePaymentRequest_(d){
  requireAdmin_(d.adminToken);if(!d.conversationId)throw new Error("Select a student request.");if(!d.studentEmail)throw new Error("Student email is required for Paystack checkout.");if(!d.service)throw new Error("Service is required.");if(Number(d.amount)<=0)throw new Error("Amount must be greater than zero.");const currency=String(d.currency||"KES").toUpperCase();if(["KES","USD","EUR"].indexOf(currency)<0)throw new Error("Choose KES, USD or EUR.");if(currency==="EUR")throw new Error("EUR can be recorded as a BrightAce budget, but Paystack's Kenya integration currently supports KES and USD for direct checkout. Use KES or USD for a Paystack payment request.");const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");const amount=Number(d.amount),tutorPayout=Math.round(amount*.60*100)/100,brightAce=Math.round(amount*.40*100)/100;const csh=getConversationSheet_();setByHeader_(csh,c.row,"agreedAmount",amount);setByHeader_(csh,c.row,"agreedCurrency",currency);setByHeader_(csh,c.row,"tutorPayout",tutorPayout);setByHeader_(csh,c.row,"brightAceShare",brightAce);setByHeader_(csh,c.row,"assignmentStatus",c.assignmentStatus==="ASSIGNED"?"ASSIGNED":"PAYMENT_PENDING");const sh=getPaymentSheet_(),now=new Date(),requestId="BA-REQ-"+Utilities.formatDate(now,Session.getScriptTimeZone()||"GMT","yyyyMMdd-HHmmss")+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,6).toUpperCase();sh.appendRow([requestId,c.conversationId,c.studentName,c.studentPhone,String(d.studentEmail).trim(),c.assignedTutor||"BrightAce Tutor",String(d.service).trim(),amount,currency,String(d.deliveryDeadline||c.deadline||"").trim(),"PENDING","","",now,"","NONE",0,"",String(d.description||c.workDescription||"").trim()]);const paymentUrl="https://kamaujames64-lgtm.github.io/brightace-academy/pages/payment.html?request="+encodeURIComponent(requestId);const paymentMessage="🛡️ BrightAce secure payment request\n\nService: "+String(d.service).trim()+"\nAmount: "+currency+" "+amount.toFixed(2)+(d.deliveryDeadline?"\nDelivery deadline: "+String(d.deliveryDeadline).trim():"")+"\n\nPay securely here:\n"+paymentUrl+"\n\nNever send payment directly to a tutor. This payment request is linked to your BrightAce conversation.";let whatsappSent=false;const saved=saveMessage_(c.conversationId,"admin",paymentMessage,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);if(d.sendWhatsApp===true)CacheService.getScriptCache().put("BA_PAYMENT_DELIVERY_"+requestId,JSON.stringify({conversationId:c.conversationId,phone:c.studentPhone,text:paymentMessage}),120);return json_({ok:true,paymentRequest:{requestId,conversationId:c.conversationId,studentName:c.studentName,studentPhone:c.studentPhone,studentEmail:String(d.studentEmail).trim(),tutor:c.assignedTutor||"BrightAce Tutor",service:String(d.service).trim(),description:String(d.description||c.workDescription||"").trim(),amount,currency,deliveryDeadline:String(d.deliveryDeadline||c.deadline||"").trim(),status:"PENDING",paymentUrl,whatsappSent,messageId:saved.id,whatsappQueued:d.sendWhatsApp===true,tutorPayout,brightAceShare:brightAce}})}

function deliverPaymentRequest_(d){
  requireAdmin_(d.adminToken);const id=String(d.requestId||"").trim(),q=safeJson_(CacheService.getScriptCache().get("BA_PAYMENT_DELIVERY_"+id)||"");
  if(!q)return json_({ok:true,queued:false});let result=null;try{result=sendWhatsAppText_(normalizePhone_(q.phone),q.text)}catch(e){console.error(e);result={skipped:true,error:String(e&&e.message||e)}}CacheService.getScriptCache().remove("BA_PAYMENT_DELIVERY_"+id);return json_({ok:true,delivered:true,whatsapp:result});
}
function handleWhatsAppWebhook_(payload){
  const entries=payload.entry||[];
  entries.forEach(entry=>{
    (entry.changes||[]).forEach(change=>{
      const value=change.value||{};
      const messages=value.messages||[];
      messages.forEach(msg=>processIncomingWhatsAppMessage_(msg,value.metadata||{}));
      const statuses=value.statuses||[];
      statuses.forEach(s=>updateMessageStatus_(s));
    });
  });
  return json_({ok:true,received:true});
}

function processIncomingWhatsAppMessage_(msg,metadata){
  const from=normalizePhone_(msg.from||"");
  if(!from)return;
  let c=findConversationByTutorPhone_(from);
  const senderRole=c ? "tutor" : "student";
  if(!c) c=findConversationByPhone_(from);
  const receiverPhone=normalizePhone_((metadata&&metadata.display_phone_number)||"");
  const receiverAdmin=findAdminByWhatsAppPhone_(receiverPhone);
  if(!c && receiverAdmin) c=findConversationByAssignedAdmin_(receiverAdmin.username);
  if(!c){
    const sh=getConversationSheet_();
    const now=new Date(); const id="CHAT-WA-"+now.getTime();
    const row=sh.getLastRow()+1; sh.appendRow(new Array(conversationHeaders_().length).fill(""));
    setByHeader_(sh,row,"conversationId",id); setByHeader_(sh,row,"studentName","WhatsApp student"); setByHeader_(sh,row,"studentPhone",from); setByHeader_(sh,row,"startedAt",now); setByHeader_(sh,row,"lastMessageAt",now); setByHeader_(sh,row,"status","open"); setByHeader_(sh,row,"assignedTutor","Unassigned"); setByHeader_(sh,row,"whatsappPhone",from); setByHeader_(sh,row,"assignmentStatus","NEW_REQUEST"); if(receiverAdmin){setByHeader_(sh,row,"assignedAdminUsername",receiverAdmin.username);setByHeader_(sh,row,"assignedAdminName",String(receiverAdmin.name||receiverAdmin.username));}
    c=findConversation_(id);
  }
  let text=""; let attachment=null;
  if(msg.type==="text") text=msg.text?.body||"";
  else if(["image","document","audio","video","sticker"].indexOf(msg.type)>=0){
    const media=msg[msg.type]||{};
    attachment=downloadWhatsAppMedia_(media.id,media.filename||("whatsapp-"+msg.type),media.mime_type||"");
    text=media.caption||"";
  } else text="[WhatsApp message: "+msg.type+"]";
  if(senderRole==="tutor") saveTutorMessage_(from,c.assignedTutor||"Tutor","tutor","Tutor",text,"received",attachment);
  else {
    const admin=findAdminByWhatsAppPhone_(receiverPhone);
    const saved=saveMessage_(c.conversationId,"student",text,"whatsapp",attachment,c.studentName,c.studentPhone);
    updateConversation_(c.conversationId,new Date(),saved.id);
    try{CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_CONV_"+c.conversationId);}catch(e){}
  }

}

function sendStudentMessageToWhatsApp_(conversation,text,attachment){
  const props=PropertiesService.getScriptProperties();
  let target=normalizePhone_(props.getProperty(CONFIG.adminWhatsAppKey)||CONFIG.defaultAdminWhatsAppPhone);
  if(conversation.assignedAdminUsername){const admin=getAdminUsers_().find(u=>String(u.username||"")===String(conversation.assignedAdminUsername));if(admin&&normalizePhone_(admin.whatsappPhone||""))target=normalizePhone_(admin.whatsappPhone);}
  if(!target)return {skipped:true,reason:"No BrightAce admin WhatsApp number is configured."};
  const result={sentTo:target,textSent:false,mediaSent:0};
  if(text){const r=sendWhatsAppText_(target,text);result.textSent=!(r&&r.skipped);result.textResult=r;}
  const files=Array.isArray(attachment)?attachment:(attachment?[attachment]:[]);
  files.forEach(a=>{const r=sendWhatsAppMedia_(target,a);if(!(r&&r.skipped))result.mediaSent++;});
  return result;
}

function sendWhatsAppText_(to,text){
  if(!text)return null;
  const cfg=metaConfig_();
  if(!cfg.token || !cfg.phoneId) return {skipped:true,reason:"WhatsApp credentials not configured"};
  const url="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages";
  const payload={messaging_product:"whatsapp",to:to,type:"text",text:{preview_url:false,body:String(text).slice(0,4096)}};
  return graphPost_(url,payload,cfg.token);
}

function sendWhatsAppMedia_(to,a){
  const cfg=metaConfig_();
  if(!cfg.token || !cfg.phoneId) return {skipped:true,reason:"WhatsApp credentials not configured"};
  const blob=DriveApp.getFileById(a.fileId).getBlob();
  const uploadUrl="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/media";
  const response=UrlFetchApp.fetch(uploadUrl,{method:"post",headers:{Authorization:"Bearer "+cfg.token},payload:{messaging_product:"whatsapp",file:blob},muteHttpExceptions:true});
  const out=JSON.parse(response.getContentText()||"{}");
  if(!out.id) throw new Error("WhatsApp media upload failed: "+response.getContentText());
  const mime=a.mimeType||blob.getContentType();
  let type="document";
  if(mime.indexOf("image/")===0) type="image";
  else if(mime.indexOf("video/")===0) type="video";
  else if(mime.indexOf("audio/")===0) type="audio";
  const media={id:out.id};
  if(type==="document")media.filename=a.name;
  const url="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages";
  return graphPost_(url,{messaging_product:"whatsapp",to:to,type:type,[type]:media},cfg.token);
}

function downloadWhatsAppMedia_(mediaId,filename,mimeType){
  const cfg=metaConfig_();
  if(!cfg.token || !mediaId) return null;
  const metaUrl="https://graph.facebook.com/"+cfg.version+"/"+mediaId;
  const meta=JSON.parse(UrlFetchApp.fetch(metaUrl,{headers:{Authorization:"Bearer "+cfg.token},muteHttpExceptions:true}).getContentText()||"{}");
  if(!meta.url) return null;
  const blob=UrlFetchApp.fetch(meta.url,{headers:{Authorization:"Bearer "+cfg.token}}).getBlob().setName(filename);
  return saveBlob_(blob,mimeType||blob.getContentType(),filename);
}

function saveAttachment_(sessionId,a){
  if(!a.dataUrl) return null;
  const bytes=Utilities.base64Decode(String(a.dataUrl).split(",").pop());
  if(bytes.length>CONFIG.maxFileBytes) throw new Error("Attachment is larger than 25 MB.");
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
  let downloadUrl="https://drive.google.com/uc?export=download&id="+encodeURIComponent(id);try{downloadUrl=file.getDownloadUrl()||downloadUrl}catch(e){}
  return {fileId:id,name:file.getName(),mimeType:mime||file.getMimeType(),size:file.getSize(),viewUrl:"https://drive.google.com/uc?export=view&id="+encodeURIComponent(id),downloadUrl:downloadUrl,driveUrl:file.getUrl()};
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

function adminMetaConfig_(adminToken){
  const profile=getAdminProfile_(adminToken),props=PropertiesService.getScriptProperties(),suffix=String(profile.username||"owner").replace(/[^A-Za-z0-9]/g,"_");
  const specificToken=String(props.getProperty("ADMIN_WA_TOKEN_"+suffix)||"");const specificPhoneId=String(props.getProperty("ADMIN_WA_PHONE_ID_"+suffix)||"");
  const token=specificToken||String(props.getProperty(CONFIG.metaTokenKey)||"");
  const phoneId=specificPhoneId||String(props.getProperty(CONFIG.metaPhoneIdKey)||"");
  const displayPhone=normalizePhone_(props.getProperty("ADMIN_WA_PHONE_"+suffix)||(specificPhoneId?profile.whatsappPhone:CONFIG.defaultAdminWhatsAppPhone));
  return {token:token,phoneId:phoneId,version:props.getProperty(CONFIG.graphVersionKey)||CONFIG.defaultGraphVersion,displayPhone:displayPhone};
}
function sendWhatsAppTextWithConfig_(to,text,cfg){if(!text)return null;cfg=cfg&&cfg.token&&cfg.phoneId?cfg:metaConfig_();if(!cfg.token||!cfg.phoneId)return {skipped:true,reason:"WhatsApp sender is not configured. Add META_ACCESS_TOKEN and META_PHONE_NUMBER_ID in Script Properties."};const url="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages";return graphPost_(url,{messaging_product:"whatsapp",to:to,type:"text",text:{preview_url:false,body:String(text).slice(0,4096)}},cfg.token);}
function sendWhatsAppMediaWithConfig_(to,a,cfg){cfg=cfg&&cfg.token&&cfg.phoneId?cfg:metaConfig_();if(!cfg.token||!cfg.phoneId)return {skipped:true,reason:"WhatsApp sender is not configured."};const blob=DriveApp.getFileById(a.fileId).getBlob(),uploadUrl="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/media",response=UrlFetchApp.fetch(uploadUrl,{method:"post",headers:{Authorization:"Bearer "+cfg.token},payload:{messaging_product:"whatsapp",file:blob},muteHttpExceptions:true}),out=JSON.parse(response.getContentText()||"{}");if(!out.id)throw new Error("WhatsApp media upload failed: "+response.getContentText());const mime=a.mimeType||blob.getContentType();let type="document";if(mime.indexOf("image/")===0)type="image";else if(mime.indexOf("video/")===0)type="video";else if(mime.indexOf("audio/")===0)type="audio";const media={id:out.id};if(type==="document")media.filename=a.name;return graphPost_("https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages",{messaging_product:"whatsapp",to:to,type:type,[type]:media},cfg.token);}
function findAdminByWhatsAppPhone_(phone){const p=normalizePhone_(phone);if(!p)return null;const users=getAdminUsers_();return users.find(u=>normalizePhone_(u.whatsappPhone||"")===p)||null;}
function findConversationByAssignedAdmin_(username){const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);for(let i=rows.length-1;i>=1;i--)if(String(rows[i][m.assignedAdminUsername-1]||"")===String(username||"") && String(rows[i][m.status-1]||"")!=="closed")return rowConversation_(rows[i],i+1,sh,m);return null;}
function metaConfig_(){
  const props=PropertiesService.getScriptProperties();
  return {token:props.getProperty(CONFIG.metaTokenKey)||"",phoneId:props.getProperty(CONFIG.metaPhoneIdKey)||"",version:props.getProperty(CONFIG.graphVersionKey)||CONFIG.defaultGraphVersion};
}
function graphPost_(url,payload,token){
  const r=UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+token},payload:JSON.stringify(payload),muteHttpExceptions:true});
  const raw=String(r.getContentText()||"").trim();
  let data={};
  try{data=raw?JSON.parse(raw):{};}catch(e){throw new Error("WhatsApp API returned an invalid response (HTTP "+r.getResponseCode()+").");}
  if(r.getResponseCode()>=300 || data.error){
    const detail=data.error&&data.error.message?data.error.message:raw;
    throw new Error("WhatsApp API error: "+String(detail).slice(0,700));
  }
  return data;
}
function normalizePhone_(phone){
  let p=String(phone||"").replace(/[^0-9]/g,"");
  if(p.indexOf("00")===0)p=p.slice(2);
  // Accept common Kenyan formats while preserving already-international numbers.
  if(p.indexOf("254")===0)return p;
  if(/^0[17]\d{8}$/.test(p))return "254"+p.slice(1);
  if(/^[17]\d{8}$/.test(p))return "254"+p;
  return p;
}
function safeJson_(s){try{return JSON.parse(s)}catch(e){return null}}
function cacheConversation_(row,values,sh,m){try{const obj=rowConversation_(values,row,sh,m);CacheService.getScriptCache().put("BA_CONV_"+obj.conversationId,JSON.stringify(obj),300)}catch(e){}}
function findConversation_(id){
  const key="BA_CONV_"+String(id||"");try{const cached=safeJson_(CacheService.getScriptCache().get(key)||"");if(cached&&cached.conversationId)return cached}catch(e){}
  const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.conversationId-1])===String(id)){const obj=rowConversation_(rows[i],i+1,sh,m);try{CacheService.getScriptCache().put(key,JSON.stringify(obj),300)}catch(e){}return obj}
  return null;
}
function findConversationByPhone_(phone){
  const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=rows.length-1;i>=1;i--) if(normalizePhone_(rows[i][m.studentPhone-1])===phone&&String(rows[i][m.status-1])!=="closed") return rowConversation_(rows[i],i+1,sh,m);
  return null;
}
function rowConversation_(r,row,sh,m){return {row:row,conversationId:String(r[m.conversationId-1]||""),studentName:String(r[m.studentName-1]||""),studentPhone:String(r[m.studentPhone-1]||""),startedAt:r[m.startedAt-1]||"",lastMessageAt:r[m.lastMessageAt-1]||"",status:String(r[m.status-1]||"open"),assignedTutor:String(r[m.assignedTutor-1]||"Unassigned"),whatsappPhone:String(r[m.whatsappPhone-1]||r[m.studentPhone-1]||""),studentEmail:String(m.studentEmail?r[m.studentEmail-1]||"":""),workDescription:String(r[m.workDescription-1]||""),studentBudget:Number(r[m.studentBudget-1]||0),currency:String(r[m.currency-1]||"KES").toUpperCase(),deadline:String(r[m.deadline-1]||""),assignmentStatus:String(r[m.assignmentStatus-1]||"NEW_REQUEST"),assignedTutorPhone:String(r[m.assignedTutorPhone-1]||""),tutorPayout:Number(r[m.tutorPayout-1]||0),brightAceShare:Number(r[m.brightAceShare-1]||0),agreedAmount:Number(r[m.agreedAmount-1]||r[m.studentBudget-1]||0),agreedCurrency:String(r[m.agreedCurrency-1]||r[m.currency-1]||"KES").toUpperCase(),completedAt:m.completedAt?r[m.completedAt-1]:"",rejectedAt:m.rejectedAt?r[m.rejectedAt-1]:"",rejectionReason:m.rejectionReason?String(r[m.rejectionReason-1]||""):"",verificationStatus:m.verificationStatus?String(r[m.verificationStatus-1]||"").toUpperCase():"",verificationCodeHash:m.verificationCodeHash?String(r[m.verificationCodeHash-1]||""):"",verificationExpiresAt:m.verificationExpiresAt?r[m.verificationExpiresAt-1]:"",verificationAttempts:m.verificationAttempts?Number(r[m.verificationAttempts-1]||0):0,verificationResendCount:m.verificationResendCount?Number(r[m.verificationResendCount-1]||0):0,verifiedAt:m.verifiedAt?r[m.verifiedAt-1]:"",assignedAdminUsername:m.assignedAdminUsername?String(r[m.assignedAdminUsername-1]||""):"",assignedAdminName:m.assignedAdminName?String(r[m.assignedAdminName-1]||""):"",
clientAccessToken:m.clientAccessToken?String(r[m.clientAccessToken-1]||""):"",
tutorWorkStatus:m.tutorWorkStatus?String(r[m.tutorWorkStatus-1]||"RECEIVED"):"RECEIVED",
tutorSubmittedAt:m.tutorSubmittedAt?r[m.tutorSubmittedAt-1]:"",
tutorSubmissionNote:m.tutorSubmissionNote?String(r[m.tutorSubmissionNote-1]||""):"",
qaStatus:m.qaStatus?String(r[m.qaStatus-1]||"PENDING"):"PENDING",
qaAt:m.qaAt?r[m.qaAt-1]:"",
qaBy:m.qaBy?String(r[m.qaBy-1]||""):"",
qaNotes:m.qaNotes?String(r[m.qaNotes-1]||""):"",
clientFeedback:m.clientFeedback?String(r[m.clientFeedback-1]||""):"",
clientFeedbackAt:m.clientFeedbackAt?r[m.clientFeedbackAt-1]:""};}
function findConversationByTutorPhone_(phone){
  const target=normalizePhone_(phone||"");if(!target)return null;
  const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),props=PropertiesService.getScriptProperties(),primaryName=String(props.getProperty("PRIMARY_TUTOR_NAME")||"").trim(),primaryPhone=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");
  for(let i=rows.length-1;i>=1;i--){if(String(rows[i][m.status-1]||"").toLowerCase()==="closed")continue;const assigned=normalizePhone_(rows[i][m.assignedTutorPhone-1]||"");if(assigned===target)return rowConversation_(rows[i],i+1,sh,m);const assignedName=String(rows[i][m.assignedTutor-1]||"").trim();if(!assigned&&primaryPhone&&target===primaryPhone&&primaryName&&assignedName===primaryName)return rowConversation_(rows[i],i+1,sh,m)}
  return null;
}
function updateConversation_(id,lastTime,lastMessageId){const c=findConversation_(id);if(!c)return;const sh=getConversationSheet_(),m=headerMap_(sh);sh.getRange(c.row,m.lastMessageAt,1,2).setValues([[lastTime,lastMessageId||""]]);c.lastMessageAt=lastTime;c.lastMessageId=lastMessageId||"";try{CacheService.getScriptCache().put("BA_CONV_"+String(id),JSON.stringify(c),300);CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS")}catch(e){}}

function updateMessageStatus_(s){
  if(!s.id)return;
  const sh=getSheet_("MESSAGES",messageHeaders_());ensureColumns_(sh,messageHeaders_());
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
