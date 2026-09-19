/**
 * BrightAce Academy — Live Chat + WhatsApp Cloud API backend
 *
 * Data flow:
 * Student browser -> Apps Script -> Google Sheets / Drive -> WhatsApp Cloud API
 * WhatsApp tutor reply -> Meta webhook -> Apps Script -> Google Sheets -> browser polling
 *
 * IMPORTANT: keep tokens in Apps Script Script Properties. Never put secrets in GitHub Pages JS.
 */

const BRIGHTACE_BUILD="2026-09-19-V63-PRODUCTION-HARDENING-SECURITY-QA";
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
  adminPasswordHashKey: "ADMIN_PASSWORD_SHA256",
  adminUsersKey: "ADMIN_USERS_JSON",
  adminWhatsAppKey: "ADMIN_WHATSAPP_PHONE",
  contactEmailKey: "CONTACT_EMAIL",
  defaultGraphVersion: "v24.0",
  defaultAdminWhatsAppPhone: "254787377857",
  maxFileBytes: 25 * 1024 * 1024,
  verificationTestPhoneKey: "BRIGHTACE_VERIFICATION_TEST_WHATSAPP",
  verificationTestCodeKey: "BRIGHTACE_VERIFICATION_TEST_CODE",
  tutorVerificationTestPhoneKey: "BRIGHTACE_TUTOR_TEST_WHATSAPP",
  tutorVerificationTestCodeKey: "BRIGHTACE_TUTOR_TEST_CODE",
  clientSessionTokenPrefix: "BA_CLIENT_SESSION_"
};

function requireActionPermission_(body){
  const action=String(body&&body.action||"");if(!/^admin/i.test(action)||action==="adminLogin")return true;
  const profile=getAdminProfile_(body.adminToken);if(String(profile.role||"").toUpperCase()==="SUPER_ADMIN")return true;
  // Read-only tutor finance workspace actions are available to every authenticated admin;
  // the financial mutation actions remain protected by the existing permission map.
  const readOnlyTutorFinance=["adminSessionProfile","adminListTutorBalances","adminListTutorEarningsDetails","adminListTutorWallets","adminListTutorWithdrawals","adminListWorkHistory"];
  if(readOnlyTutorFinance.indexOf(action)>=0)return true;
  const users=getAdminUsers_(),u=users.find(x=>String(x.username||"")===String(profile.username||""));
  const perms=Array.isArray(u&&u.permissions)?u.permissions:[];
  if(!perms.length)return true; // backwards-compatible for older admins until permissions are explicitly set
  const map={CLIENTS:["adminListClients","adminAddClient","adminSetClientStatus","adminListBlockedWhatsApp","adminSetWhatsAppBlock","adminGetRequestIntakeStatus","adminSetRequestIntake"],TUTORS:["adminListTutors","adminAddTutor","adminSetTutorStatus","adminGetTutorAvailability","adminCheckTutorAvailability","adminTutorPortalPreview","adminGetTutorMessages","adminSendTutorMessage"],ASSIGNMENTS:["adminListConversations","adminGetConversation","adminSendMessage","adminDeliverMessage","adminAssignWork","adminClaimWork","adminListWorkAssignments","adminListWorkHistory","adminRestoreWork","adminRejectWork"],PAYMENTS:["adminListPayments","adminCreatePaymentRequest","deliverPaymentRequest","adminDeletePaymentNotification","adminListRefundRequests","adminReviewRefundRequest","adminListTutorWallets","adminListTutorWithdrawals","adminPayTutorWithdrawal","adminListTutorBalances","adminMarkTutorBalancePaid","adminRecordTutorPayment","adminFinancialIntegrity"],SCHEDULING:["adminCreateSchedule","adminListSchedules","adminUpdateSchedule"],QUALITY:["adminListQuality","adminQaWork","adminMarkWorkCompleted"],REPORTS:["adminListActivity","adminDeleteWorkHistory","adminSessionProfile","adminStatement","adminObservability"],RESOURCES:["adminListResources","adminSaveResource","adminDeleteResource","adminResourceCommerce","adminResourceReconciliation","adminResourceAnalytics","adminRefundResource","adminResourceAccessLookup","adminSetResourceAccess"]};
  for(const key in map)if(perms.indexOf(key)>=0&&map[key].indexOf(action)>=0)return true;
  throw new Error("Your administrator account is not authorized for this task.");
}

function doGet(e){
  const __baStarted=Date.now(); let __baAction="health",__baOk=true,__baError="";
  // BrightAce API GET endpoint.
  // Keep webhook verification as plain text because Meta requires the challenge value.
  // Every normal API/health/error response is JSON so the frontend never receives an
  // Apps Script exception page as its expected API payload.
  try{
    baThreatCheckRawRequest_(e);
    const p=(e&&e.parameter)||{};
    if(p["hub.mode"] === "subscribe") return verifyWebhook_(p);
    const action=String(p.action||"health"); __baAction=action;
    baSecurityGateGet_(p);
    if(action==="health") return json_({ok:true,service:"BrightAce Academy Live Chat",build:BRIGHTACE_BUILD,api:"brightace-json-v63",time:new Date().toISOString(),observability:baObservabilityHealth_()});
    if(action==="version") return json_(baDeploymentInfo_());
    if(action==="messages") return getMessages_(p.sessionId,p.clientSessionToken,p.phone,p.afterMessageId,p.clientAccessToken);
    if(action==="paymentRequest") return getPaymentRequest_(p.requestId,p.clientSessionToken,p.phone);
    if(action==="verifyPayment") return verifyPayment_(p.reference);
    if(action==="clientStatement") return clientStatement_(p.clientSessionToken,p.phone);
    if(action==="tutorStatement") return tutorStatement_(p.tutorToken);
    if(action==="adminStatement") return adminStatement_(p.adminToken,p.from,p.to);
    if(action==="verifyStatement") return verifyStatement_(p.reference);
    if(action==="tutorSessionProfile") return tutorSessionProfile_(p.tutorToken);
    if(action==="tutorDashboard") return tutorDashboard_({tutorToken:p.tutorToken});
    if(action==="tutorGetWallet") return tutorGetWallet_({tutorToken:p.tutorToken});
    if(action==="tutorListWithdrawals") return tutorListWithdrawals_({tutorToken:p.tutorToken});
    if(action==="tutorGetAdminMessages") return tutorGetAdminMessages_({tutorToken:p.tutorToken});
    if(action==="adminSessionProfile"){ const ap=getAdminProfile_(p.adminToken); return json_({ok:true,admin:{username:String(ap.username||""),name:String(ap.adminName||ap.username||"Admin"),role:String(ap.role||"ADMIN").toUpperCase()}}); }
    if(action==="adminListConversations") return adminListConversations_(p.adminToken,true);
    if(action==="adminListWorkAssignments") return adminListWorkAssignments_(p.adminToken,true);
    if(action==="adminListClients") return adminListClients_(p.adminToken);
    if(action==="adminListTutors") return adminListTutors_(p.adminToken);
    if(action==="adminListQuality") return adminListQuality_(p.adminToken);
    if(action==="adminListActivity") return adminListActivity_(p.adminToken);
    if(action==="adminListTutorBalances") return adminListTutorBalances_(p.adminToken);
    if(action==="adminListTutorWallets") return adminListTutorWallets_(p.adminToken);
    if(action==="adminListTutorWithdrawals") return adminListTutorWithdrawals_(p.adminToken);
    // Read-only GET aliases are kept for older/proxy callers that use a
    // different history action name. They all resolve to the same server
    // implementation and therefore do not create a second history source.
    if(action==="adminListWorkHistory" || action==="adminHistory" || action==="adminWorkHistory" || action==="adminListHistory" || action==="history"){
      return adminListWorkHistory_(p.adminToken,true);
    }
    // Tutor Earnings has a GET fallback in the frontend as well.
    if(action==="adminListTutorEarningsDetails") return adminListTutorEarningsDetails_(p.adminToken);
    if(action==="adminFinancialIntegrity") return baFinancialIntegrity_(p.adminToken);
    if(action==="adminObservability") return adminObservability_(p.adminToken);
    if(action==="adminRecoveryManifest") return adminRecoveryManifest_(p.adminToken);
    if(action==="adminProductionQa") return adminProductionQa_(p.adminToken);
    if(action==="adminProductionReadiness") return adminProductionReadiness_(p.adminToken);
    if(action==="resources") return publicResourceCatalog_();
    if(action==="resourceVerifyPayment") return resourceVerifyPayment_(p.reference);
    if(action==="resourceDownload") return resourceDownloadInfo_(p.purchaseId,p.reference,p.userAgent);
    if(action==="clientResourceLibrary") return clientResourceLibrary_(p);
    if(action==="clientResourceCatalog") return clientResourceCatalog_(p);
    if(action==="clientResourceAccess") return clientResourceAccess_(p);
    if(action==="adminResourceCommerce") return adminResourceCommerce_(p.adminToken);
    if(action==="adminResourceAnalytics") return adminResourceAnalytics_(p.adminToken);
    if(action==="adminResourceAccessLookup") return adminResourceAccessLookup_(p.adminToken,p.query);
    if(action==="adminSetResourceAccess") return adminSetResourceAccess_(p);
    if(action==="adminResourceReconciliation") return adminResourceReconciliation_(p.adminToken);
    if(action==="adminListResources") return adminListResources_(p.adminToken);
    return json_({ok:false,error:"Unknown GET action",action:action});
  }catch(err){
    __baOk=false;__baError=String(err&&err.message||err);
    console.error(err&&err.stack?err.stack:err);
    baSecurityEvent_("API_ERROR",__baAction+": "+String(err&&err.message||err));
    return json_({ok:false,error:String(err&&err.message||err),source:"BrightAce doGet"});
  }finally{
    baObservabilityRecordRequest_(__baAction,__baStarted,__baOk,__baError,"GET");
  }
}
function doPost(e){
  const __baStarted=Date.now(); let __baAction="webhook",__baOk=true,__baError="";
  try{
    baThreatCheckRawRequest_(e);
    const body=parseBody_(e);baThreatCheckObject_(body);
    __baAction=String(body&&body.action||body&&body.event||body&&body.object||"unknown");
    baSecurityGatePost_(body);
    requireActionPermission_(body);
    if(body.object === "whatsapp_business_account") return handleWhatsAppWebhook_(body);
    if(body.event && body.data) return handlePaystackWebhook_(body);
    if(body.action === "startChat") return startChat_(body);
    if(body.action === "returningClientSendVerification") return returningClientSendVerification_(body);
    if(body.action === "returningClientVerify") return returningClientVerify_(body);
    if(body.action === "verifyChat") return verifyChat_(body);
    if(body.action === "resendVerification") return resendVerification_(body);
    if(body.action === "sendVerification") return sendVerification_(body);
    if(body.action === "notifyAdmin") return notifyAdmin_(body);
    if(body.action === "sendContactEmail") return sendContactEmail_(body);
    if(body.action === "sendMessage") return saveWebsiteMessage_(body);
    if(body.action === "deliverMessage") return deliverWebsiteMessage_(body);
    if(body.action === "initializePayment") return initializePayment_(body.requestId,body.clientSessionToken,body.phone);
    if(body.action === "adminLogin") return adminLogin_(body.password,body.username);
    if(body.action === "adminSessionProfile") { const p=getAdminProfile_(body.adminToken); return json_({ok:true,admin:{username:String(p.username||""),name:String(p.adminName||p.username||"Admin"),role:String(p.role||"ADMIN").toUpperCase()}}); }
    if(body.action === "adminListConversations") return adminListConversations_(body.adminToken,body.fresh===true);
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
    if(body.action === "adminGetRequestIntakeStatus") return adminGetRequestIntakeStatus_(body.adminToken);
    if(body.action === "adminSetRequestIntake") return adminSetRequestIntake_(body);
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
    if(body.action === "adminListWorkAssignments") return adminListWorkAssignments_(body.adminToken,body.fresh===true);
    if(body.action === "adminListWorkHistory") return adminListWorkHistory_(body.adminToken,body.fresh===true);
    if(body.action === "adminSendTutorMessage") return adminSendTutorMessage_(body);
    if(body.action === "adminGetTutorMessages") return adminGetTutorMessages_(body);
    if(body.action === "adminTutorPortalPreview") return adminTutorPortalPreview_(body);
    if(body.action === "adminListTutorBalances") return adminListTutorBalances_(body.adminToken);
    if(body.action === "adminListTutorEarningsDetails") return adminListTutorEarningsDetails_(body.adminToken);
    if(body.action === "adminFinancialIntegrity") return baFinancialIntegrity_(body.adminToken);
    if(body.action === "adminObservability") return adminObservability_(body.adminToken);
    if(body.action === "adminRecoveryManifest") return adminRecoveryManifest_(body.adminToken);
    if(body.action === "adminProductionQa") return adminProductionQa_(body.adminToken);
    if(body.action === "adminProductionReadiness") return adminProductionReadiness_(body.adminToken);
    if(body.action === "adminCreateRecoverySnapshot") return adminCreateRecoverySnapshot_(body);
    if(body.action === "adminMarkTutorBalancePaid") return adminMarkTutorBalancePaid_(body);
    if(body.action === "adminRecordTutorPayment") return adminRecordTutorPayment_(body);
    if(body.action === "submitRefundRequest") return submitRefundRequest_(body);
    if(body.action === "adminListRefundRequests") return adminListRefundRequests_(body.adminToken);
    if(body.action === "adminReviewRefundRequest") return adminReviewRefundRequest_(body);
    if(body.action === "clientDashboard") return clientDashboard_(body);
    if(body.action === "clientSubmitFeedback") return clientSubmitFeedback_(body);
    if(body.action === "clientSendComment") return clientSendComment_(body);
    if(body.action === "tutorSendVerification") return tutorSendVerification_(body);
    if(body.action === "tutorVerifyLogin") return tutorVerifyLogin_(body);
    if(body.action === "tutorSessionProfile") return tutorSessionProfile_(body.tutorToken);
    if(body.action === "tutorUploadProfile") return tutorUploadProfile_(body); if(body.action === "tutorRemoveProfile") return tutorRemoveProfile_(body);
    if(body.action === "tutorDashboard") return tutorDashboard_(body);
    if(body.action === "tutorUpdateWorkStatus") return tutorUpdateWorkStatus_(body);
    if(body.action === "tutorSubmitWork") return tutorSubmitWork_(body);
    if(body.action === "tutorAddWorkComment") return tutorAddWorkComment_(body);
    if(body.action === "tutorSaveAvailability") throw new Error("Tutor availability scheduling has been removed. Agree appointment times through BrightAce messaging with Admin; Admin creates the appointment and Zoom link.");
    if(body.action === "tutorSendAdminMessage") return tutorSendAdminMessage_(body);
    if(body.action === "tutorGetAdminMessages") return tutorGetAdminMessages_(body);
    if(body.action === "tutorGetWallet") return tutorGetWallet_(body);
    if(body.action === "tutorSaveWallet") return tutorSaveWallet_(body);
    if(body.action === "adminListTutorWallets") return adminListTutorWallets_(body);
    if(body.action === "tutorRequestWithdrawal") return tutorRequestWithdrawal_(body);
    if(body.action === "tutorListWithdrawals") return tutorListWithdrawals_(body);
    if(body.action === "adminListTutorWithdrawals") return adminListTutorWithdrawals_(body);
    if(body.action === "adminPayTutorWithdrawal") return adminPayTutorWithdrawal_(body);
    if(body.action === "adminCheckTutorAvailability") return adminCheckTutorAvailability_(body);
    if(body.action === "adminGetTutorAvailability") return adminGetTutorAvailability_(body);
    if(body.action === "adminCreateSchedule") return adminCreateSchedule_(body);
    if(body.action === "adminListSchedules") return adminListSchedules_(body.adminToken);
    if(body.action === "adminUpdateSchedule") return adminUpdateSchedule_(body);
    if(body.action === "adminListQuality") return adminListQuality_(body.adminToken);
    if(body.action === "clientDashboardBootstrap") return clientDashboardBootstrap_(body);
    if(body.action === "clientTouchSession") return clientTouchSession_(body);
    if(body.action === "clientEndSession") return clientEndSession_(body);
    if(body.action === "clientGetRequest") return clientGetRequest_(body);
    if(body.action === "adminDeleteWorkHistory") return adminDeleteWorkHistory_(body);
    if(body.action === "tutorAcceptWork") return tutorAcceptWork_(body);
    if(body.action === "tutorDeclineWork") return tutorDeclineWork_(body);
    if(body.action === "adminQaWork") return adminQaWork_(body);
    if(body.action === "resourceInitializePayment") return resourceInitializePayment_(body);
    if(body.action === "resourceDownload") return resourceDownloadInfo_(body.purchaseId,body.reference,body.userAgent);
    if(body.action === "clientResourceLibrary") return clientResourceLibrary_(body);
    if(body.action === "clientResourceCatalog") return clientResourceCatalog_(body);
    if(body.action === "clientResourceAccess") return clientResourceAccess_(body);
    if(body.action === "adminListResources") return adminListResources_(body.adminToken);
    if(body.action === "adminSaveResource") return adminSaveResource_(body);
    if(body.action === "adminDeleteResource") return adminDeleteResource_(body);
    if(body.action === "adminResourceCommerce") return adminResourceCommerce_(body.adminToken);
    if(body.action === "adminResourceAnalytics") return adminResourceAnalytics_(body.adminToken);
    if(body.action === "adminResourceAccessLookup") return adminResourceAccessLookup_(body.adminToken,body.query);
    if(body.action === "adminSetResourceAccess") return adminSetResourceAccess_(body);
    if(body.action === "adminResourceReconciliation") return adminResourceReconciliation_(body.adminToken);
    if(body.action === "adminRefundResource") return adminRefundResource_(body);
    if(body.action === "registerStatement") return registerStatement_(body);
    return json_({ok:false,error:"Unknown POST action"});
  }catch(err){
    __baOk=false;__baError=String(err&&err.message||err);
    console.error(err && err.stack ? err.stack : err);
    baSecurityEvent_("API_ERROR",__baAction+": "+String(err && err.message || err));
    return json_({ok:false,error:String(err && err.message || err)});
  }finally{
    baObservabilityRecordRequest_(__baAction,__baStarted,__baOk,__baError,"POST");
  }
}

function doOptions(e){
  // Apps Script web apps normally receive BrightAce POSTs as simple
  // application/x-www-form-urlencoded requests, so browsers do not need a
  // CORS preflight. Keep an explicit JSON response available for diagnostics
  // and future callers without changing the existing API contract.
  return json_({ok:true,service:"BrightAce Academy Live Chat",method:"OPTIONS",build:BRIGHTACE_BUILD});
}

function parseBody_(e){
  if(e && e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  if(e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  return {};
}

function conversationHeaders_(){
  return ["conversationId","studentName","studentPhone","startedAt","lastMessageAt","status","assignedTutor","whatsappPhone","lastMessageId","studentEmail","workDescription","studentBudget","currency","deadline","assignmentStatus","assignedTutorPhone","tutorPayout","brightAceShare","agreedAmount","agreedCurrency","completedAt","rejectedAt","rejectionReason","verificationStatus","verificationCodeHash","verificationExpiresAt","verificationAttempts","verificationResendCount","verifiedAt","assignedAdminUsername","assignedAdminName","clientAccessToken","tutorWorkStatus","tutorSubmittedAt","tutorSubmissionNote","qaStatus","qaAt","qaBy","qaNotes","clientFeedback","clientFeedbackAt"];
}
function headerCacheKey_(sh){return "BA_HEADERS_"+sh.getSheetId()}
function clearHeaderMapCache_(sh){try{CacheService.getScriptCache().remove(headerCacheKey_(sh))}catch(e){}}
function ensureColumns_(sh,headers){
  const last=Math.max(sh.getLastColumn(),1);
  let current=sh.getRange(1,1,1,last).getValues()[0].map(String),changed=false;
  if(sh.getLastRow()===0 || !current.some(Boolean)){
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    clearHeaderMapCache_(sh);
    return sh;
  }
  headers.forEach(h=>{if(current.indexOf(h)<0){sh.getRange(1,sh.getLastColumn()+1).setValue(h);current.push(h);changed=true}});
  if(changed)clearHeaderMapCache_(sh);
  return sh;
}
function getConversationSheet_(){return ensureColumns_(getSheet_("CONVERSATIONS",conversationHeaders_()),conversationHeaders_())}
function headerMap_(sh){
  const key=headerCacheKey_(sh),cache=CacheService.getScriptCache();
  try{const cached=cache.get(key);if(cached)return JSON.parse(cached)}catch(e){}
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String),m={};
  h.forEach((x,i)=>{if(x)m[x]=i+1});
  try{cache.put(key,JSON.stringify(m),21600)}catch(e){}
  return m;
}
function setByHeader_(sh,row,header,value){const m=headerMap_(sh);if(m[header]){sh.getRange(row,m[header]).setValue(value);if(sh.getName()==="CONVERSATIONS"&&header!=="conversationId"){try{const id=sh.getRange(row,m.conversationId).getValue();CacheService.getScriptCache().remove("BA_CONV_"+String(id))}catch(e){}}}}
function getByHeader_(sh,row,header){const m=headerMap_(sh);return m[header]?sh.getRange(row,m[header]).getValue():""}

function getClientSheet_(){
  const h=["clientId","clientName","clientPhone","status","createdAt","notes","membershipTier","discountPercent","sessionTokenHash","sessionExpiresAt","lastActivityAt"];
  return ensureColumns_(getSheet_("CLIENTS",h),h);
}
function getVerificationTestPhone_(){
  return normalizePhone_(PropertiesService.getScriptProperties().getProperty(CONFIG.verificationTestPhoneKey)||"254725010628");
}
function getVerificationTestCode_(){
  const raw=String(PropertiesService.getScriptProperties().getProperty(CONFIG.verificationTestCodeKey)||"121212").trim();
  return /^\d{6}$/.test(raw)?raw:"121212";
}
function isVerificationTestCodeEnabledFor_(phone){
  return isVerificationTestPhone_(phone) && !!getVerificationTestCode_();
}
function isVerificationTestPhone_(phone){
  const p=normalizePhone_(phone); const test=getVerificationTestPhone_();
  return !!p && !!test && p===test;
}
function findAnyClientByPhone_(phone){
  const target=normalizePhone_(phone);if(!target)return null;
  const key="BA_CLIENT_BY_PHONE_"+target;
  try{const cached=safeJson_(CacheService.getScriptCache().get(key)||"");if(cached&&cached.clientPhone===target)return cached;}catch(e){}
  const sh=getClientSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(normalizePhone_(rows[i][m.clientPhone-1])===target){
    const out={row:i+1,clientId:String(rows[i][m.clientId-1]),clientName:String(rows[i][m.clientName-1]||""),clientPhone:target,status:String(rows[i][m.status-1]||"ACTIVE").toUpperCase()};
    try{CacheService.getScriptCache().put(key,JSON.stringify(out),60)}catch(e){}
    return out;
  }
  try{CacheService.getScriptCache().put(key,JSON.stringify({notFound:true,clientPhone:target}),30)}catch(e){}
  return null;
}
function getClientByPhone_(phone){
  const target=normalizePhone_(phone),existing=findAnyClientByPhone_(target);
  if(existing && existing.status!=="SUSPENDED") return existing;
  if(isVerificationTestPhone_(target)) return {row:existing?.row||0,clientId:existing?.clientId||"CLIENT-TEST",clientName:existing?.clientName||"BrightAce Test Client",clientPhone:target,status:"TEST"};
  return null;
}
function adminListClients_(token){
  requireAdmin_(token); const sh=getClientSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++) if(rows[i][m.clientId-1]){
    out.push({clientId:String(rows[i][m.clientId-1]),clientName:String(rows[i][m.clientName-1]||""),clientPhone:normalizePhone_(rows[i][m.clientPhone-1]||""),status:String(rows[i][m.status-1]||"ACTIVE").toUpperCase(),createdAt:rows[i][m.createdAt-1]||"",notes:String(rows[i][m.notes-1]||""),membershipTier:m.membershipTier?String(rows[i][m.membershipTier-1]||"STANDARD"):"STANDARD",discountPercent:m.discountPercent?Number(rows[i][m.discountPercent-1]||0):0});
  }
  const test=getVerificationTestPhone_();
  if(test&&!out.some(x=>normalizePhone_(x.clientPhone)===test)) out.push({clientId:"CLIENT-TEST",clientName:"BrightAce Test Client",clientPhone:test,status:"TEST",createdAt:"",notes:"Verification test number from Script Properties"});
  return json_({ok:true,clients:out});
}
function adminAddClient_(d){
  requireAdmin_(d.adminToken);
  const name=String(d.clientName||"").trim(),phone=normalizePhone_(d.clientPhone||""),notes=String(d.notes||"").trim(),tier=String(d.membershipTier||"STANDARD").toUpperCase(),discount=Math.max(0,Math.min(100,Number(d.discountPercent||0)));
  if(!name)throw new Error("Client name is required.");
  if(phone.length<7)throw new Error("Enter a valid WhatsApp number.");
  const sh=getClientSheet_(),existing=getClientByPhone_(phone);
  if(existing&&existing.row)throw new Error("WARNING: This WhatsApp number is already registered to client "+String(existing.clientName||"")+" . Use the existing client record or correct the number.");
  const conflicts=whatsappNameConflicts_(phone,name,"CLIENT");if(conflicts.length)throw new Error("WARNING: This WhatsApp number is registered with another different name ("+conflicts.join(", ")+"). Confirm the correct number/name before admitting this client.");
  const id="CLI-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase();
  sh.appendRow([id,name,phone,"ACTIVE",new Date(),notes,tier,discount,"","",""]);try{CacheService.getScriptCache().remove("BA_CLIENT_BY_PHONE_"+phone)}catch(e){} auditAdmin_(d.adminToken,"ADD_CLIENT",name+" ("+phone+")");
  return json_({ok:true,client:{clientId:id,clientName:name,clientPhone:phone,status:"ACTIVE"}});
}
function adminSetClientStatus_(d){
  requireAdmin_(d.adminToken); const id=String(d.clientId||"").trim(),status=String(d.status||"ACTIVE").toUpperCase();
  if(!id||!["ACTIVE","INACTIVE","SUSPENDED"].includes(status))throw new Error("Invalid client status.");
  const sh=getClientSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(String(rows[i][m.clientId-1])===id){
    const phone=normalizePhone_(rows[i][m.clientPhone-1]||"");
    if(status==="SUSPENDED" && isVerificationTestPhone_(phone)) throw new Error("The designated client testing number cannot be suspended.");
    setByHeader_(sh,i+1,"status",status);try{CacheService.getScriptCache().remove("BA_CLIENT_BY_PHONE_"+phone)}catch(e){}
    if(status==="SUSPENDED" && phone) adminSetWhatsAppBlock_({adminToken:d.adminToken,phone:phone,blocked:true,reason:"Client suspended by BrightAce Admin.",adminName:"Admin"});
    if(status==="ACTIVE" && phone) try{adminSetWhatsAppBlock_({adminToken:d.adminToken,phone:phone,blocked:false,reason:"Client restored by BrightAce Admin.",adminName:"Admin"});}catch(e){}
    auditAdmin_(d.adminToken,"CLIENT_STATUS",id+" → "+status);return json_({ok:true,status:status});
  }
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
function isNewRequestIntakeEnabled_(){
  const raw=PropertiesService.getScriptProperties().getProperty(CONFIG.newRequestIntakeKey);
  return String(raw===null||raw===""?"true":raw).toLowerCase()!=="false";
}
function adminGetRequestIntakeStatus_(token){
  requireAdmin_(token);
  return json_({ok:true,enabled:isNewRequestIntakeEnabled_(),message:isNewRequestIntakeEnabled_()?"New client requests are OPEN.":"New client requests are PAUSED. Existing client numbers may still verify and request support."});
}
function adminSetRequestIntake_(d){
  requireAdmin_(d.adminToken);
  const enabled=!!d.enabled;
  PropertiesService.getScriptProperties().setProperty(CONFIG.newRequestIntakeKey,enabled?"true":"false");
  auditAdmin_(d.adminToken,"REQUEST_INTAKE",enabled?"NEW CLIENT REQUESTS OPENED":"NEW CLIENT REQUESTS PAUSED");
  return json_({ok:true,enabled:enabled,message:enabled?"New client requests are now OPEN.":"New client requests are now PAUSED. Existing client numbers may still verify and request support."});
}
function ensureClientForChat_(phone,name){
  const normalized=normalizePhone_(phone);
  if(isWhatsAppBlocked_(normalized)) throw new Error("Sorry, this WhatsApp number is blocked from using BrightAce services. Please contact BrightAce Admin.");
  const lock=LockService.getScriptLock();lock.waitLock(5000);
  try{
    const existing=findAnyClientByPhone_(normalized);
    if(existing) return existing;
    const sh=getClientSheet_(),id="CLI-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase(),now=new Date();
    sh.appendRow([id,String(name||"").trim(),normalized,"ACTIVE",now,"Auto-created on first BrightAce client request."]);
    return findAnyClientByPhone_(normalized);
  }finally{lock.releaseLock();}
}

function getClientRecordByPhone_(phone){
  const target=normalizePhone_(phone),sh=getClientSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(normalizePhone_(rows[i][m.clientPhone-1])===target) return {row:i+1,clientId:String(rows[i][m.clientId-1]||""),clientName:String(rows[i][m.clientName-1]||""),clientPhone:target,status:String(rows[i][m.status-1]||"ACTIVE").toUpperCase()};
  return null;
}
function requireRegisteredClient_(phone,name){
  if(isWhatsAppBlocked_(phone)) throw new Error("Sorry, this WhatsApp number is blocked from using BrightAce services. Please contact BrightAce Admin.");
  const raw=getClientRecordByPhone_(phone);
  if(raw && ["SUSPENDED","INACTIVE"].includes(raw.status)) throw new Error("Sorry, this client account is suspended from using BrightAce services. Please contact BrightAce Admin.");
  const c=getClientByPhone_(phone);
  return c || ensureClientForChat_(phone,name);
}

function startChat_(d){
  if(!d.name||!d.phone) throw new Error("Name and WhatsApp number are required.");
  const currency=String(d.currency||"KES").toUpperCase();
  if(["KES","USD","EUR"].indexOf(currency)<0) throw new Error("Choose KES, USD or EUR.");
  const phone=normalizePhone_(d.phone);
  if(phone.length<7) throw new Error("Enter a valid WhatsApp number.");
  if(isWhatsAppBlocked_(phone)) throw new Error("Sorry, this WhatsApp number is blocked from using BrightAce services. Please contact BrightAce Admin.");
  let client=findAnyClientByPhone_(phone);
  if(!isNewRequestIntakeEnabled_() && !client) throw new Error("We are not taking in new requests right now. Please check again in the next 24 hours.");
  if(client && client.status==="SUSPENDED") throw new Error("Sorry, this WhatsApp number is blocked from using BrightAce services. Please contact BrightAce Admin.");
  if(!client) client=ensureClientForChat_(phone,d.name);
  if(client && String(client.clientName||"").trim() &&
     String(client.clientName||"").trim().toLowerCase()!==String(d.name||"").trim().toLowerCase())
    throw new Error("WARNING: This WhatsApp number is already registered to another client. One WhatsApp number can belong to only one BrightAce client.");
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw new Error("BrightAce is handling many requests at once. Please try again in a few seconds.");
  try{
  const sh=getConversationSheet_(),now=new Date(),id=d.id||("CHAT-"+now.getTime()+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,6).toUpperCase());
  const h=headerMap_(sh),row=sh.getLastRow()+1,values=new Array(sh.getLastColumn()).fill("");
  values[h.conversationId-1]=id;values[h.studentName-1]=String(client.clientName||d.name).trim();values[h.studentPhone-1]=phone;values[h.startedAt-1]=now;values[h.lastMessageAt-1]=now;values[h.status-1]="open";values[h.assignedTutor-1]="Unassigned";values[h.whatsappPhone-1]=phone;values[h.assignmentStatus-1]="PENDING_VERIFICATION";values[h.workDescription-1]=String(d.taskDescription||"General BrightAce support request").trim();values[h.studentBudget-1]=Math.max(0,Number(d.studentBudget||0));values[h.currency-1]=currency;values[h.deadline-1]=String(d.deadline||"");values[h.agreedAmount-1]=Number(d.studentBudget);values[h.agreedCurrency-1]=currency;values[h.verificationStatus-1]="PENDING";values[h.verificationAttempts-1]=0;values[h.verificationResendCount-1]=0;
  sh.getRange(row,1,1,values.length).setValues([values]);cacheConversation_(row,values,sh,h);
  try{
    CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");
    CacheService.getScriptCache().remove("BA_ADMIN_WORK_ASSIGNMENTS");
    CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");
    CacheService.getScriptCache().remove("BA_ADMIN_QUALITY");
    CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+phone);
    CacheService.getScriptCache().remove("BA_CLIENT_MSGS_"+phone);
    baInvalidateClientRequestHistory_(phone);
  }catch(e){}
  return json_({ok:true,conversationId:id,requestStatus:"PENDING_VERIFICATION",verificationRequired:true,message:"Request received. A fresh 6-digit verification code is required to open this live-chat session."});
  }finally{try{lock.releaseLock()}catch(e){}}
}
function sendVerificationCode_(conversationId,phone){
  const id=String(conversationId||"").trim(), target=normalizePhone_(phone||"");
  if(!id||!target)throw new Error("Verification request and WhatsApp number are required.");
  const c=findConversation_(id);
  if(!c)throw new Error("Verification request not found.");
  if(normalizePhone_(c.studentPhone)!==target)throw new Error("The WhatsApp number does not match this request.");
  if(isWhatsAppBlocked_(target))throw new Error("Sorry, this WhatsApp number is blocked from using BrightAce services. Please contact BrightAce Admin.");
  const code=isVerificationTestCodeEnabledFor_(target)?getVerificationTestCode_():generateVerificationCode_(target);
  const sh=getConversationSheet_();
  setByHeader_(sh,c.row,"verificationCodeHash",sha256Hex_(code));
  setByHeader_(sh,c.row,"verificationExpiresAt",new Date(Date.now()+10*60*1000));
  setByHeader_(sh,c.row,"verificationAttempts",0);
  const sent=isVerificationTestCodeEnabledFor_(target)
    ? {testMode:true,skipped:true,message:"Test verification code configured; WhatsApp delivery bypassed for the designated client number."}
    : sendWhatsAppVerificationTemplate_(target,code);
  return sent;
}
function sendVerification_(d){
  const id=String(d.conversationId||"").trim();
  if(!id) throw new Error("Conversation ID is required.");
  const c=findConversation_(id);
  if(!c) throw new Error("Verification request not found.");
  if(String(c.verificationStatus||"").toUpperCase()==="VERIFIED"){
    return json_({ok:true,verified:true,message:"Your WhatsApp number is already verified."});
  }
  const sent=sendVerificationCode_(id,c.studentPhone);
  try{CacheService.getScriptCache().remove("BA_CONV_"+id)}catch(e){}
  return json_({ok:true,message:"A 6-digit verification code has been sent to your WhatsApp number.",delivery:sent});
}
function returningClientSendVerification_(d){
  const name=String(d.name||"").trim();
  const phone=normalizePhone_(d.phone||"");
  if(!name)throw new Error("Enter the name used on your BrightAce request.");
  if(phone.length<7)throw new Error("Enter a valid WhatsApp number.");
  if(isWhatsAppBlocked_(phone))throw new Error("Sorry, this WhatsApp number is blocked from using BrightAce services. Please contact BrightAce Admin.");
  const client=getClientByPhone_(phone);
  if(!client)throw new Error("No BrightAce client record was found for this WhatsApp number. If this is your first request, please use Start your support request.");
  if(String(client.status||"").toUpperCase()==="SUSPENDED"||String(client.status||"").toUpperCase()==="INACTIVE")throw new Error("This client account is not active. Please contact BrightAce Admin.");
  const normalizeName=function(v){return String(v||"").trim().replace(/\\s+/g," ").toLowerCase();};
  const registeredName=normalizeName(client.clientName||"");
  if(registeredName && registeredName!==normalizeName(name))
    throw new Error("The name and WhatsApp number do not match the BrightAce client record. Please check your details and try again.");
  const c=findConversationByPhone_(phone);
  if(!c)throw new Error("No existing BrightAce request was found for this WhatsApp number. Please use Start your support request.");
  const conversationName=normalizeName(c.studentName||"");
  if(conversationName && conversationName!==normalizeName(name))
    throw new Error("The name and WhatsApp number do not match the existing BrightAce request. Please check your details and try again.");
  const sh=getConversationSheet_(),code=isVerificationTestCodeEnabledFor_(phone)?getVerificationTestCode_():generateVerificationCode_(phone),now=new Date();
  setByHeader_(sh,c.row,"verificationCodeHash",sha256Hex_(code));
  setByHeader_(sh,c.row,"verificationExpiresAt",new Date(Date.now()+10*60*1000));
  setByHeader_(sh,c.row,"verificationAttempts",0);
  setByHeader_(sh,c.row,"verificationStatus","PENDING");
  try{CacheService.getScriptCache().remove("BA_CONV_"+c.conversationId)}catch(e){}
  const sent=isVerificationTestCodeEnabledFor_(phone)?{testMode:true,skipped:true,message:"Test verification code configured; WhatsApp delivery bypassed for the designated client number."}:sendWhatsAppVerificationTemplate_(phone,code);
  return json_({ok:true,conversationId:c.conversationId,clientName:c.studentName||client.clientName,message:isVerificationTestCodeEnabledFor_(phone)?"Test verification code is ready for this designated client number.":"A 6-digit verification code has been sent to your WhatsApp number.",delivery:sent});
}
function returningClientVerify_(d){
  const id=String(d.conversationId||"").trim(),code=String(d.code||"").trim();
  if(!id||!/^[0-9]{6}$/.test(code))throw new Error("Enter the 6-digit verification code sent to WhatsApp.");
  const c=findConversation_(id);if(!c)throw new Error("Existing BrightAce request could not be found.");
  const phone=normalizePhone_(c.studentPhone),client=getClientByPhone_(phone);
  if(!client)throw new Error("Client record not found. Please start a new verified request.");
  if(String(client.status||"").toUpperCase()==="SUSPENDED"||String(client.status||"").toUpperCase()==="INACTIVE")throw new Error("This client account is not active. Please contact BrightAce Admin.");
  const sh=getConversationSheet_(),expiry=getByHeader_(sh,c.row,"verificationExpiresAt"),attempts=Number(getByHeader_(sh,c.row,"verificationAttempts")||0);
  if(expiry&&new Date(expiry).getTime()<Date.now())throw new Error("That verification code has expired. Request a new code.");
  if(attempts>=3)throw new Error("Too many incorrect attempts. Request a new verification code.");
  const stored=String(getByHeader_(sh,c.row,"verificationCodeHash")||"");
  if(stored!==sha256Hex_(code)){setByHeader_(sh,c.row,"verificationAttempts",attempts+1);throw new Error("Incorrect verification code. Please check WhatsApp and try again.");}
  const now=new Date(),existing=String(getByHeader_(sh,c.row,"clientAccessToken")||"")||Utilities.getUuid()+Utilities.getUuid(),clientSession=issueClientSession_(client,phone);
  setByHeader_(sh,c.row,"verificationStatus","VERIFIED");setByHeader_(sh,c.row,"verifiedAt",now);setByHeader_(sh,c.row,"verificationCodeHash","");setByHeader_(sh,c.row,"verificationExpiresAt","");setByHeader_(sh,c.row,"verificationAttempts",0);setByHeader_(sh,c.row,"clientAccessToken",existing);setByHeader_(sh,c.row,"lastMessageAt",now);
  try{CacheService.getScriptCache().remove("BA_CONV_"+id);CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+phone);CacheService.getScriptCache().remove("BA_CLIENT_MSGS_"+phone)}catch(e){}
  return json_({ok:true,verified:true,conversationId:id,clientName:client.clientName,clientAccessToken:existing,clientSessionToken:clientSession.clientSessionToken,clientSessionExpiresAt:clientSession.expiresAt,message:"WhatsApp verified successfully. Your existing BrightAce request is now open."});
}

function verifyChat_(d){
  const id=String(d.conversationId||"").trim(),code=String(d.code||"").trim(); if(!id||!/^[0-9]{6}$/.test(code)) throw new Error("Enter the 6-digit verification code sent to WhatsApp.");
  const c=findConversation_(id); if(!c) throw new Error("Verification request not found.");
  if(String(c.verificationStatus||"").toUpperCase()==="VERIFIED"){
    const sh=getConversationSheet_(),existing=String(getByHeader_(sh,c.row,"clientAccessToken")||"")||Utilities.getUuid()+Utilities.getUuid();
    setByHeader_(sh,c.row,"clientAccessToken",existing);
    const client=getClientByPhone_(c.studentPhone),clientSession=issueClientSession_(client,c.studentPhone);
    // A fresh verification is treated as a fresh live-chat access session.
    return json_({ok:true,verified:true,clientAccessToken:existing,clientSessionToken:clientSession.clientSessionToken,clientSessionExpiresAt:clientSession.expiresAt,message:"WhatsApp verified successfully. Your BrightAce live chat is connected."});
  }
  const expiry=c.row?getByHeader_(getConversationSheet_(),c.row,"verificationExpiresAt"):""; if(expiry && new Date(expiry).getTime()<Date.now()) throw new Error("That verification code has expired. Request a new code.");
  const attempts=Number(c.row?getByHeader_(getConversationSheet_(),c.row,"verificationAttempts"):0)||0; if(attempts>=3) throw new Error("Too many incorrect attempts. Request a new verification code.");
  const sh=getConversationSheet_(),stored=String(getByHeader_(sh,c.row,"verificationCodeHash")||"");
  if(stored!==sha256Hex_(code)){setByHeader_(sh,c.row,"verificationAttempts",attempts+1);throw new Error("Incorrect verification code. Please check WhatsApp and try again.");}
  const now=new Date(); const clientAccessToken=Utilities.getUuid()+Utilities.getUuid(); const client= getClientByPhone_(c.studentPhone); const clientSession=issueClientSession_(client,c.studentPhone); setByHeader_(sh,c.row,"verificationStatus","VERIFIED"); setByHeader_(sh,c.row,"verifiedAt",now); setByHeader_(sh,c.row,"assignmentStatus","NEW_REQUEST"); setByHeader_(sh,c.row,"verificationCodeHash",""); setByHeader_(sh,c.row,"verificationExpiresAt",""); setByHeader_(sh,c.row,"clientAccessToken",clientAccessToken);
  const saved=saveMessage_(id,"student",c.workDescription,"website",null);setByHeader_(sh,c.row,"lastMessageId",saved.id);setByHeader_(sh,c.row,"lastMessageAt",now);try{
    CacheService.getScriptCache().remove("BA_CONV_"+id);
    CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+normalizePhone_(c.studentPhone));
    CacheService.getScriptCache().remove("BA_CLIENT_MSGS_"+normalizePhone_(c.studentPhone));
  }catch(e){}
  return json_({ok:true,verified:true,clientAccessToken:clientAccessToken,clientSessionToken:clientSession.clientSessionToken,clientSessionExpiresAt:clientSession.expiresAt,message:"WhatsApp verified successfully. Your BrightAce live chat is now connected."});
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
  if(!d.sessionId)throw new Error("sessionId is required.");
  const c=clientConversationFromSession_({conversationId:d.sessionId,clientSessionToken:d.clientSessionToken,phone:d.phone});
  if(String(c.verificationStatus||"").trim()&&String(c.verificationStatus||"").toUpperCase()!=="VERIFIED")throw new Error("Verify your WhatsApp number before sending chat messages.");
  const requestId=String(d.clientRequestId||"").trim();if(requestId.length>120)throw new Error("Invalid message request ID.");
  const idemKey=requestId?"BA_IDEMP_SEND_"+sha256Hex_(d.sessionId+"|"+requestId):"";
  if(idemKey){const prior=baCacheGetJson_(idemKey);if(prior&&prior.ok)return json_(prior);}
  let attachments=[];
  if(Array.isArray(d.attachments))attachments=saveAttachments_(d.sessionId,d.attachments);
  else if(d.attachment&&d.attachment.dataUrl)attachments=saveAttachments_(d.sessionId,[d.attachment]);
  if(!d.text&&!attachments.length)throw new Error("Message or attachment is required.");
  const storedAttachment=attachments.length===1?attachments[0]:attachments;
  const saved=saveMessage_(d.sessionId,"student",d.text||"","website",storedAttachment,c.studentName,c.studentPhone);updateConversation_(d.sessionId,new Date(),saved.id);
  CacheService.getScriptCache().put("BA_DELIVERY_"+saved.id,JSON.stringify({conversationId:d.sessionId}),120);
  const response={ok:true,messageId:saved.id,attachment:storedAttachment,attachments:attachments,deliveryQueued:true};if(idemKey)baCachePutJson_(idemKey,response,300);
  return json_(response);
}
function deliverWebsiteMessage_(d){
  const id=String(d.messageId||"").trim(),sessionId=String(d.sessionId||"").trim(),q=safeJson_(CacheService.getScriptCache().get("BA_DELIVERY_"+id)||"");
  if(!q||q.conversationId!==sessionId)return json_({ok:true,queued:false});
  const c=clientConversationFromSession_({conversationId:sessionId,clientSessionToken:d.clientSessionToken,phone:d.phone});let result=null;
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
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw new Error("BrightAce is handling many messages at once. Please try again in a few seconds.");
  try{
  const sh=getSheet_("MESSAGES",messageHeaders_());ensureColumns_(sh,messageHeaders_());
  const m=headerMap_(sh),messageId=Utilities.getUuid(),now=new Date(),row=sh.getLastRow()+1;
  const values=new Array(sh.getLastColumn()).fill("");
  values[m.messageId-1]=messageId;values[m.conversationId-1]=id;values[m.sender-1]=sender;values[m.text-1]=text||"";values[m.source-1]=source;values[m.timestamp-1]=now;values[m.status-1]="received";values[m.attachmentJson-1]=attachment?JSON.stringify(attachment):"";
  if(m.senderName)values[m.senderName-1]=String(senderName||"");if(m.senderPhone)values[m.senderPhone-1]=normalizePhone_(senderPhone||"");
  sh.getRange(row,1,1,values.length).setValues([values]);
  try{CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_ASSIGNMENTS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");CacheService.getScriptCache().remove("BA_ADMIN_QUALITY")}catch(e){}
  const hydrated=hydrateAttachment_(attachment);
  try{const key="BA_MSG_"+String(id),existing=safeJson_(CacheService.getScriptCache().get(key)||"")||[];existing.push({id:messageId,sessionId:String(id),sender:String(sender),text:String(text||""),source:String(source||""),timestamp:now,status:"received",attachment:hydrated||null,senderName:String(senderName||""),senderPhone:normalizePhone_(senderPhone||"")});CacheService.getScriptCache().put(key,JSON.stringify(existing.slice(-100)),300)}catch(e){}
  return {id:messageId,attachment:hydrated};
  }finally{try{lock.releaseLock()}catch(e){}}
}
function readConversationMessages_(id){
  const key=baMessageCacheKey_(id),cached=baCacheGetJson_(key);
  if(Array.isArray(cached))return cached.slice(-100);
  const sh=getSheet_("MESSAGES",messageHeaders_());ensureColumns_(sh,messageHeaders_()),last=sh.getLastRow();if(last<2)return [];
  const m=headerMap_(sh),rows=baLastRows_(sh,Math.min(2000,last-1)),out=[];
  for(let i=0;i<rows.length;i++){const r=rows[i];if(String(r[m.conversationId-1])!==String(id))continue;out.push({id:String(r[m.messageId-1]),sessionId:String(r[m.conversationId-1]),sender:String(r[m.sender-1]||""),text:String(r[m.text-1]||""),source:String(r[m.source-1]||""),timestamp:r[m.timestamp-1],status:String(r[m.status-1]||"received"),attachment:hydrateAttachment_(r[m.attachmentJson-1]?safeJson_(r[m.attachmentJson-1]):null),senderName:m.senderName?String(r[m.senderName-1]||""):"",senderPhone:m.senderPhone?String(r[m.senderPhone-1]||""):""});}
  out.sort(function(a,b){return new Date(a.timestamp||0).getTime()-new Date(b.timestamp||0).getTime()});const result=out.slice(-100);baCachePutJson_(key,result,300);return result;
}
function getMessages_(id,clientSessionToken,phone,afterMessageId,clientAccessToken){
  if(!id)return json_({ok:false,error:"sessionId required"});
  let auth=clientConversationFromSessionOrAccess_({conversationId:id,clientSessionToken:clientSessionToken,phone:phone,clientAccessToken:clientAccessToken});
  const c=auth.conversation||auth;
  const key=baMessageCacheKey_(id);
  let cached=baCacheGetJson_(key);
  if(!Array.isArray(cached)){cached=readConversationMessages_(c.conversationId);baCachePutJson_(key,cached,300);}
  const sync=baSyncResponse_(cached,afterMessageId);
  const out={ok:true,messages:sync.messages.map(x=>Object.assign({},x,{attachment:hydrateAttachment_(x.attachment)})),syncCursor:sync.syncCursor};
  if(auth.clientSessionToken)out.clientSessionToken=auth.clientSessionToken;
  return json_(out);
}
function getPaymentRequest_(requestId,clientSessionToken,phone){
  if(!requestId) return json_({ok:false,error:"Payment request ID is required."});
  const p=findPaymentRequest_(requestId);
  if(!p) return json_({ok:false,error:"Payment request not found."});
  const c=clientConversationFromSession_({conversationId:p.conversationId,clientSessionToken:clientSessionToken,phone:phone});
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

function initializePayment_(requestId,clientSessionToken,phone){
  if(!requestId) throw new Error("Payment request ID is required.");
  const p=findPaymentRequest_(requestId);
  if(!p) throw new Error("Payment request not found.");
  clientConversationFromSession_({conversationId:p.conversationId,clientSessionToken:clientSessionToken,phone:phone});
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
  if(!p){ if(baHandleResourcePaystackWebhook_(tx)) return json_({ok:true,received:true,resource:true}); return json_({ok:true,ignored:"unknown reference"}); }
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
  const tutorPayout=Math.round(amount*0.50*100)/100;
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
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  let shouldNotify=false,paidRecord=null;
  try{
    // Re-read the payment inside the lock. Webhooks and browser verification can
    // arrive together; only the first successful transition may create the payout.
    const fresh=findPaymentByReference_(p.paystackReference||"")||p;
    const sh=getPaymentSheet_(),row=sh.getRange(p.row,1,1,sh.getLastColumn()).getValues()[0],fm=headerMap_(sh);
    const currentStatus=String(fm.status?row[fm.status-1]:p.status||"").toUpperCase();
    const currentRef=String(fm.paystackReference?row[fm.paystackReference-1]:p.paystackReference||"").trim();
    if(currentStatus==="PAID"){
      // Idempotent duplicate verification: never create another payout or notification.
      return;
    }
    updatePaymentFields_(p.row,{status:"PAID",paystackReference:tx.reference,paidAt:tx.paid_at||new Date()});
    // The payout is always exactly 50% of the confirmed client payment amount.
    // Use the verified payment amount, not a stale client-budget value.
    const payoutPayment=Object.assign({},p,{amount:Number(p.amount),currency:String(p.currency||tx.currency||"KES").toUpperCase()});
    try{paidRecord=ensureTutorPayoutRecordForPaidWork_(p.conversationId,payoutPayment)}catch(e){console.error("Tutor payout record creation failed: "+e)}
    try{
      const c=findConversation_(p.conversationId),csh=getConversationSheet_();
      if(c){
        const confirmedAmount=Number(p.amount||0),confirmedCurrency=String(p.currency||tx.currency||c.currency||"KES").toUpperCase();
        if(c.agreedAmount!==confirmedAmount)setByHeader_(csh,c.row,"agreedAmount",confirmedAmount);
        if(String(c.agreedCurrency||"").toUpperCase()!==confirmedCurrency)setByHeader_(csh,c.row,"agreedCurrency",confirmedCurrency);
        setByHeader_(csh,c.row,"tutorPayout",Math.round(confirmedAmount*.50*100)/100);
        if(String(c.assignmentStatus||"").toUpperCase()==="PAYMENT_PENDING")setByHeader_(csh,c.row,"assignmentStatus","ASSIGNED");
        invalidateWorkCaches_(c.conversationId,c.assignedTutorPhone,c.assignedTutorPhone,c.studentPhone);
      }
    }catch(e){console.error("Work activation after payment failed: "+e)}
    shouldNotify=true;
  }finally{lock.releaseLock();}
  if(shouldNotify) notifyPaymentCompleted_(p,tx);
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
  const id=String(requestId||'').trim(); if(!id)return null;
  const key='BA_PAYMENT_'+id,hit=baCacheGetJson_(key); if(hit&&hit.requestId)return hit;
  const sh=getPaymentSheet_(),last=sh.getLastRow(); if(last<2)return null;
  const cell=sh.getRange(2,1,last-1,1).createTextFinder(id).matchEntireCell(true).useRegularExpression(false).findNext();
  if(!cell)return null;
  const row=cell.getRow(),p=rowPayment_(sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],row);
  baCachePutJson_(key,p,60); return p;
}

function findPaymentByReference_(reference){
  const sh=getPaymentSheet_(),lastRow=sh.getLastRow();
  if(lastRow<2)return null;
  const cell=sh.getRange(2,12,lastRow-1,1).createTextFinder(String(reference))
    .matchEntireCell(true).useRegularExpression(false).findNext();
  if(!cell)return null;
  const row=cell.getRow();
  return rowPayment_(sh.getRange(row,1,1,19).getValues()[0],row);
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
  const rateKey="BA_ADMIN_LOGIN_FAIL_"+String(username||"owner").trim().toLowerCase();const rate=Number(CacheService.getScriptCache().get(rateKey)||0);if(rate>=8)throw new Error("Too many failed admin sign-in attempts. Please wait 10 minutes and try again.");
  const props=PropertiesService.getScriptProperties(),raw=String(props.getProperty(CONFIG.adminUsersKey)||"").trim(),uName=String(username||"owner").trim()||"owner";
  if(raw){let users=[];try{users=JSON.parse(raw)}catch(e){throw new Error("ADMIN_USERS_JSON is not valid JSON in Script Properties.");}
    const suppliedHash=sha256Hex_(String(password||""));
    const u=users.find(x=>String(x.username||"").trim()===uName&&((x.passwordHash&&String(x.passwordHash).toLowerCase()===suppliedHash)||(x.password&&String(x.password)===String(password||"")))&&String(x.status||"ACTIVE").toUpperCase()!=="SUSPENDED");if(!u){CacheService.getScriptCache().put(rateKey,String(rate+1),600);return json_({ok:false,error:"Incorrect admin username or password."});}
    // The primary owner account is ALWAYS SUPER_ADMIN. This remains true even if
    // ADMIN_USERS_JSON contains an older/misconfigured role for the owner.
    // Keep the username "owner" stable so the account can later display the
    // owner's real name (for example MugoKamau) without losing owner privileges.
    const isPrimaryOwner=String(uName).trim().toLowerCase()==="owner";
    const token=(isPrimaryOwner?"OWNER_":"ADMIN_")+Utilities.getUuid()+Utilities.getUuid(),profile={username:uName,adminName:String(u.name||u.username||"Admin"),role:isPrimaryOwner?"SUPER_ADMIN":String(u.role||"ADMIN").toUpperCase(),whatsappPhone:normalizePhone_(u.whatsappPhone||""),tokenIssuedAt:Date.now(),lastSeenAt:Date.now(),tokenExpiresAt:Date.now()+(isPrimaryOwner?10*365*24*60*60*1000:30*24*60*60*1000)};CacheService.getScriptCache().remove(rateKey);CacheService.getScriptCache().put("BA_ADMIN_"+token,JSON.stringify(profile),21600);PropertiesService.getScriptProperties().setProperty("BA_ADMIN_TOKEN_"+token,JSON.stringify(profile));return json_({ok:true,adminToken:token,expiresIn:30*24*60*60,tokenIssuedAt:profile.tokenIssuedAt,admin:{username:profile.username,name:profile.adminName,role:profile.role}});
  }
  const configuredHash=String(props.getProperty(CONFIG.adminPasswordHashKey)||"").trim().toLowerCase(),configured=props.getProperty(CONFIG.adminPasswordKey)||"";if(!configuredHash&&!configured)return json_({ok:false,error:"Admin access is not configured yet. Add ADMIN_PASSWORD_SHA256 (preferred) or ADMIN_PASSWORD in Script Properties."});
  if((configuredHash&&sha256Hex_(String(password||""))!==configuredHash)||(!configuredHash&&String(password||"")!==configured)){CacheService.getScriptCache().put(rateKey,String(rate+1),600);return json_({ok:false,error:"Incorrect admin password."});}
  const token="OWNER_"+Utilities.getUuid()+Utilities.getUuid(),profile={username:"owner",adminName:"Owner",role:"SUPER_ADMIN",whatsappPhone:CONFIG.defaultAdminWhatsAppPhone,tokenIssuedAt:Date.now(),lastSeenAt:Date.now(),tokenExpiresAt:Date.now()+10*365*24*60*60*1000};CacheService.getScriptCache().remove(rateKey);CacheService.getScriptCache().put("BA_ADMIN_"+token,JSON.stringify(profile),21600);PropertiesService.getScriptProperties().setProperty("BA_ADMIN_TOKEN_"+token,JSON.stringify(profile));return json_({ok:true,adminToken:token,expiresIn:30*24*60*60,tokenIssuedAt:profile.tokenIssuedAt,admin:{username:profile.username,name:profile.adminName,role:profile.role}});
}
function getAdminProfile_(token){
  token=String(token||"").trim();
  if(!token)throw new Error("Admin login is required or has expired. Please sign in again.");
  const now=Date.now(),ownerSessionLifetime=10*365*24*60*60*1000,adminSessionLifetime=30*24*60*60*1000,renewInterval=5*60*1000,key="BA_ADMIN_TOKEN_"+token;
  // The persistent Script Properties record is authoritative. A cache entry can
  // legitimately be older than the persistent record after another admin request
  // renews the same session. Never let a stale cache entry delete a valid session.
  let cacheProfile=null,persistedProfile=null;
  try{cacheProfile=safeJson_(CacheService.getScriptCache().get("BA_ADMIN_"+token)||"")}catch(e){}
  try{persistedProfile=safeJson_(PropertiesService.getScriptProperties().getProperty(key)||"")}catch(e){}
  let p=persistedProfile||cacheProfile;
  // Owner tokens are explicitly prefixed at issuance. If Google Apps Script cache or
  // Script Properties temporarily loses the record, recover the owner profile from
  // the bearer token itself instead of forcing the owner back to Admin Sign In.
  if(!p && token.indexOf("OWNER_")===0){
    p={username:"owner",adminName:"Owner",role:"SUPER_ADMIN",whatsappPhone:CONFIG.defaultAdminWhatsAppPhone,tokenIssuedAt:now,lastSeenAt:now,tokenExpiresAt:now+ownerSessionLifetime};
    try{PropertiesService.getScriptProperties().setProperty(key,JSON.stringify(p))}catch(e){}
    try{CacheService.getScriptCache().put("BA_ADMIN_"+token,JSON.stringify(p),21600)}catch(e){}
  }
  if(cacheProfile&&persistedProfile){
    p=(Number(persistedProfile.lastSeenAt||0)>=Number(cacheProfile.lastSeenAt||0))?persistedProfile:cacheProfile;
  }
  if(!p||Number(p.tokenExpiresAt||0)<=now){
    // A cache record may be stale/expired while persistent storage is still valid.
    if(persistedProfile&&Number(persistedProfile.tokenExpiresAt||0)>now)p=persistedProfile;
    else{
      try{PropertiesService.getScriptProperties().deleteProperty(key)}catch(e){}
      throw new Error("Admin login is required or has expired. Please sign in again.");
    }
  }
  const lastSeen=Number(p.lastSeenAt||0);
  const isPrimaryOwner=String(p.username||"").trim().toLowerCase()==="owner";
  const sessionLifetime=isPrimaryOwner?ownerSessionLifetime:adminSessionLifetime;
  if(!lastSeen || now-lastSeen>=renewInterval || Number(p.tokenExpiresAt)-now<7*24*60*60*1000){
    p.lastSeenAt=now;
    p.tokenExpiresAt=now+sessionLifetime;
    try{PropertiesService.getScriptProperties().setProperty(key,JSON.stringify(p))}catch(e){}
  }
  try{CacheService.getScriptCache().put("BA_ADMIN_"+token,JSON.stringify(p),21600)}catch(e){}
  return p;
}
function requireAdmin_(token){getAdminProfile_(token);return true}
function requireSuperAdmin_(token){const p=getAdminProfile_(token);if(String(p.role||"").toUpperCase()!=="SUPER_ADMIN")throw new Error("Super admin permission required.");return true}
function auditAdmin_(token,action,details){try{const p=getAdminProfile_(token),sh=getSheet_("ADMIN_ACTIVITY",["timestamp","adminUsername","adminName","role","action","details"]);sh.appendRow([new Date(),String(p.username||""),String(p.adminName||""),String(p.role||""),String(action||""),String(details||"").slice(0,2000)])}catch(e){console.error("Audit log failed: "+e)}}
function getAdminUsers_(){const props=PropertiesService.getScriptProperties(),raw=String(props.getProperty(CONFIG.adminUsersKey)||"").trim();if(raw){let users=[];try{users=JSON.parse(raw)}catch(e){throw new Error("ADMIN_USERS_JSON is not valid JSON in Script Properties.")}if(!Array.isArray(users))return [];return users.map(u=>{const x=Object.assign({},u);if(String(x.username||"").trim().toLowerCase()==="owner")x.role="SUPER_ADMIN";return x;});}const pass=props.getProperty(CONFIG.adminPasswordKey)||props.getProperty(CONFIG.adminPasswordHashKey)||"";return pass?[{username:"owner",name:"Owner",role:"SUPER_ADMIN",password:pass,whatsappPhone:CONFIG.defaultAdminWhatsAppPhone,duties:"Owner / overall administration",permissions:["CLIENTS","TUTORS","ASSIGNMENTS","PAYMENTS","SCHEDULING","QUALITY","REPORTS"],status:"ACTIVE"}]:[]}
function adminListAdmins_(token){requireAdmin_(token);const users=getAdminUsers_();return json_({ok:true,admins:users.map(u=>({username:String(u.username||""),name:String(u.name||u.username||"Admin"),role:String(u.role||"ADMIN").toUpperCase(),whatsappPhone:normalizePhone_(u.whatsappPhone||""),status:String(u.status||"ACTIVE").toUpperCase(),duties:String(u.duties||""),permissions:Array.isArray(u.permissions)?u.permissions:[]}))})}
function adminAddAdmin_(d){
  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try{
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
    if(ownerPass)users=[{username:"owner",name:"Owner",role:"SUPER_ADMIN",password:ownerPass,whatsappPhone:CONFIG.defaultAdminWhatsAppPhone,duties:"Owner / overall administration",permissions:["CLIENTS","TUTORS","ASSIGNMENTS","PAYMENTS","SCHEDULING","QUALITY","REPORTS"],status:"ACTIVE"}];
  }
  if(users.some(u=>String(u.username||"").toLowerCase()===username.toLowerCase()))throw new Error("That admin username already exists.");
  users.push({username,name,role,password,whatsappPhone:normalizePhone_(d.whatsappPhone||""),duties:String(d.duties||"").trim(),permissions:Array.isArray(d.permissions)?d.permissions.slice(0,20):[],status:"ACTIVE"});
  props.setProperty(CONFIG.adminUsersKey,JSON.stringify(users));
  auditAdmin_(d.adminToken,"ADD_ADMIN",username);
  return json_({ok:true,admin:{username,name,role,whatsappPhone:normalizePhone_(d.whatsappPhone||""),duties:String(d.duties||""),permissions:Array.isArray(d.permissions)?d.permissions.slice(0,20):[],status:"ACTIVE"}});

  }finally{try{lock.releaseLock()}catch(e){}}
}
function adminUpdateAdmin_(d){
  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try{
  requireSuperAdmin_(d.adminToken);const username=String(d.username||"").trim();if(!username)throw new Error("Admin username is required.");const users=getAdminUsers_();const u=users.find(x=>String(x.username||"").toLowerCase()===username.toLowerCase());if(!u)throw new Error("Admin not found.");
  if(d.name!==undefined)u.name=String(d.name||"").trim()||u.name;if(d.role!==undefined){const role=String(d.role||u.role||"ADMIN").toUpperCase();if(!["ADMIN","MANAGER"].includes(role))throw new Error("Invalid admin role.");u.role=role;}if(d.whatsappPhone!==undefined)u.whatsappPhone=normalizePhone_(d.whatsappPhone||"");if(d.duties!==undefined)u.duties=String(d.duties||"").trim();if(d.permissions!==undefined&&Array.isArray(d.permissions))u.permissions=d.permissions.slice(0,20);if(d.password!==undefined&&String(d.password||"").trim()){if(String(d.password).length<8)throw new Error("Admin password must be at least 8 characters.");u.password=String(d.password);}
  PropertiesService.getScriptProperties().setProperty(CONFIG.adminUsersKey,JSON.stringify(users));auditAdmin_(d.adminToken,"UPDATE_ADMIN",username);return json_({ok:true,admin:{username:String(u.username),name:String(u.name||u.username),role:String(u.role||"ADMIN").toUpperCase(),whatsappPhone:normalizePhone_(u.whatsappPhone||""),duties:String(u.duties||""),permissions:Array.isArray(u.permissions)?u.permissions:[],status:String(u.status||"ACTIVE").toUpperCase()}});

  }finally{try{lock.releaseLock()}catch(e){}}
}
function adminSetAdminStatus_(d){
  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try{requireSuperAdmin_(d.adminToken);const username=String(d.username||"").trim(),status=String(d.status||"ACTIVE").toUpperCase();if(!username||!["ACTIVE","SUSPENDED"].includes(status))throw new Error("Invalid admin status request.");const users=getAdminUsers_();let found=null;users.forEach(u=>{if(String(u.username||"")===username){u.status=status;found=u}});if(!found)throw new Error("Admin not found.");PropertiesService.getScriptProperties().setProperty(CONFIG.adminUsersKey,JSON.stringify(users));auditAdmin_(d.adminToken,"ADMIN_STATUS",username+" → "+status);return json_({ok:true})
  }finally{try{lock.releaseLock()}catch(e){}}
}
function adminListActivity_(token){requireSuperAdmin_(token);const sh=getSheet_("ADMIN_ACTIVITY",["timestamp","adminUsername","adminName","role","action","details"]),rows=sh.getDataRange().getValues(),out=[];for(let i=rows.length-1;i>=1&&out.length<200;i--)out.push({timestamp:rows[i][0],username:String(rows[i][1]||""),name:String(rows[i][2]||""),role:String(rows[i][3]||""),action:String(rows[i][4]||""),details:String(rows[i][5]||"")});return json_({ok:true,activity:out})}
function adminClaimWork_(d){requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");const profile=getAdminProfile_(d.adminToken),u=String(d.username||profile.username||"").trim(),users=getAdminUsers_(),target=users.find(x=>String(x.username||"")===u);if(!target)throw new Error("Admin not found.");const sh=getConversationSheet_(),m=headerMap_(sh);if(m.assignedAdminUsername)sh.getRange(c.row,m.assignedAdminUsername).setValue(u);if(m.assignedAdminName)sh.getRange(c.row,m.assignedAdminName).setValue(String(target.name||u));c.assignedAdminUsername=u;c.assignedAdminName=String(target.name||u);try{CacheService.getScriptCache().put("BA_CONV_"+c.conversationId,JSON.stringify(c),300);CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_ASSIGNMENTS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");CacheService.getScriptCache().remove("BA_ADMIN_QUALITY")}catch(e){}auditAdmin_(d.adminToken,"ASSIGN_ADMIN",c.conversationId+" → "+u);return json_({ok:true,assignedAdminUsername:u,assignedAdminName:c.assignedAdminName})}
function getTutorSheet_(){
  const h=["tutorId","tutorName","tutorDisplayName","tutorPhone","whatsappType","status","createdAt","loginCodeHash","loginExpiresAt","loginAttempts","lastLoginAt","profilePictureUrl","description","tutorEmail","profilePictureFileId"];
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
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.tutorId-1]||"")===id)return {tutorId:id,tutorName:String(rows[i][m.tutorName-1]||""),tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||rows[i][m.tutorName-1]||""),tutorPhone:resolveTutorPhone_(rows[i][m.tutorName-1],rows[i][m.tutorPhone-1]),tutorEmail:m.tutorEmail?String(rows[i][m.tutorEmail-1]||""):"",status:String(rows[i][m.status-1]||"ACTIVE")};
  return null;
}

function adminListTutors_(token){requireAdmin_(token);const ck="BA_ADMIN_TUTORS";try{const hit=CacheService.getScriptCache().get(ck);if(hit)return json_({ok:true,tutors:safeJson_(hit)||[]})}catch(e){}const sh=getTutorSheet_(),last=Math.max(sh.getLastRow(),1),width=Math.max(sh.getLastColumn(),13),rows=sh.getRange(1,1,last,width).getValues(),m=headerMap_(sh),out=[];for(let i=1;i<rows.length;i++)if(rows[i][m.tutorId-1]){const name=String(rows[i][m.tutorName-1]||""),phone=resolveTutorPhone_(name,rows[i][m.tutorPhone-1]||"");out.push({tutorId:String(rows[i][m.tutorId-1]),tutorName:name,tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||name),tutorPhone:phone,profilePictureUrl:tutorProfilePictureUrl_(m.profilePictureUrl?String(rows[i][m.profilePictureUrl-1]||""):""),whatsappType:String(rows[i][m.whatsappType-1]||"NONE").toUpperCase()==="NONE"&&phone?"WHATSAPP":String(rows[i][m.whatsappType-1]||"NONE").toUpperCase(),status:String(rows[i][m.status-1]||"ACTIVE"),description:m.description?String(rows[i][m.description-1]||""):"",tutorEmail:m.tutorEmail?String(rows[i][m.tutorEmail-1]||""):""})}if(!out.length){const props=PropertiesService.getScriptProperties();const n=props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor",p=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");if(n)out.push({tutorId:"PRIMARY",tutorName:n,tutorDisplayName:n,tutorPhone:p,profilePictureUrl:tutorProfileByPhone_(p)?.profilePictureUrl||"",whatsappType:p?"WHATSAPP":"NONE",status:"ACTIVE",tutorEmail:""})}try{CacheService.getScriptCache().put(ck,JSON.stringify(out),15)}catch(e){}return json_({ok:true,tutors:out})}
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
function adminAddTutor_(d){requireAdmin_(d.adminToken);if(!d.tutorName)throw new Error("Tutor name is required.");const sh=getTutorSheet_(),id="TUT-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase(),name=String(d.tutorName).trim(),display=String(d.tutorDisplayName||name).trim(),phone=normalizePhone_(d.tutorPhone||""),type=String(d.whatsappType||"NONE").toUpperCase();if(!["BUSINESS","WHATSAPP","NONE"].includes(type))throw new Error("Invalid WhatsApp type.");if(type!=="NONE"&&!phone)throw new Error("A WhatsApp number is required for the selected WhatsApp type.");const description=String(d.description||"").trim().slice(0,240),email=String(d.tutorEmail||"").trim();if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw new Error("Enter a valid tutor email.");const conflicts=whatsappNameConflicts_(phone,name,"TUTOR");if(conflicts.length)throw new Error("WARNING: This WhatsApp number is registered with another different name ("+conflicts.join(", ")+"). Confirm the correct number/name before adding this tutor.");sh.appendRow([id,name,display,phone,type,"ACTIVE",new Date(),"","",0,"","",description,email]);try{CacheService.getScriptCache().remove("BA_ADMIN_TUTORS")}catch(e){}auditAdmin_(d.adminToken,"ADD_TUTOR",name);return json_({ok:true,tutor:{tutorId:id,tutorName:name,tutorDisplayName:display,tutorPhone:phone,whatsappType:type,status:"ACTIVE",description:description,tutorEmail:email}})}

function adminSetTutorStatus_(d){
  requireAdmin_(d.adminToken);
  const id=String(d.tutorId||"").trim(), status=String(d.status||"ACTIVE").toUpperCase();
  if(!id || !["ACTIVE","SUSPENDED","INACTIVE"].includes(status)) throw new Error("Tutor and valid status are required.");
  if(id==="PRIMARY") throw new Error("The configured primary tutor cannot be suspended from the directory.");
  const sh=getTutorSheet_(), rows=sh.getDataRange().getValues(), m=headerMap_(sh);
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][m.tutorId-1]||"")===id){
      const tutorPhone=normalizePhone_(rows[i][m.tutorPhone-1]||"");
      sh.getRange(i+1,m.status).setValue(status);
      if(status!=="ACTIVE") sh.getRange(i+1,m.loginCodeHash).setValue("");
      if(status==="SUSPENDED" && tutorPhone) try{adminSetWhatsAppBlock_({adminToken:d.adminToken,phone:tutorPhone,blocked:true,reason:"Tutor permanently suspended by BrightAce Admin.",adminName:"Admin"});}catch(e){}
      auditAdmin_(d.adminToken,(status==="ACTIVE"?"RESTORE_TUTOR":"SUSPEND_TUTOR"),String(rows[i][m.tutorName-1]||id));
      return json_({ok:true,tutorId:id,status:status});
    }
  }
  throw new Error("Tutor not found.");
}
function adminListConversations_(token,fresh){
  requireAdmin_(token);const ck="BA_ADMIN_CONVERSATIONS";fresh=fresh===true;try{const hit=CacheService.getScriptCache().get(ck);if(!fresh&&hit)return json_({ok:true,conversations:safeJson_(hit)||[]})}catch(e){}const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),paidMap={};
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
  const delivery=baEnqueueMessageDelivery_({
    queueId:"ADM-"+saved.id, messageId:saved.id, conversationId:c.conversationId,
    direction:"ADMIN_TO_CLIENT", recipient:normalizePhone_(c.studentPhone),
    text:text, attachments:storedAttachment||null, senderName:String(profile.adminName||profile.username||"Admin"),
    maxAttempts:5
  });
  return json_({ok:true,messageId:saved.id,attachment:storedAttachment||null,attachments:attachments,deliveryQueued:true,deliveryId:delivery.queueId,deliveryStatus:delivery.status,adminName:String(profile.adminName||profile.username||"Admin"),senderPhone:String(adminCfg.displayPhone||profile.whatsappPhone||CONFIG.defaultAdminWhatsAppPhone)});
}
function deliverAdminMessage_(d){
  requireAdmin_(d.adminToken);
  const id=String(d.messageId||"").trim(),conversationId=String(d.conversationId||"").trim();
  const q=baGetMessageDeliveryByMessageId_(id);
  if(!q||String(q.conversationId)!==conversationId)return json_({ok:true,queued:false});
  const result=baProcessMessageDelivery_(q.queueId);
  return json_({ok:true,delivered:result.status==="DELIVERED",delivery:result,whatsapp:result.result||null});
}
function invalidateWorkCaches_(conversationId,oldTutorPhone,newTutorPhone,studentPhone){
  try{
    ["BA_ADMIN_CONVERSATIONS","BA_ADMIN_WORK_ASSIGNMENTS","BA_ADMIN_WORK_HISTORY","BA_ADMIN_QUALITY"].forEach(function(k){CacheService.getScriptCache().remove(k)});
    const id=String(conversationId||"");
    CacheService.getScriptCache().remove("BA_CONV_"+id);
    const clientPhone=normalizePhone_(studentPhone||"");
    if(clientPhone){
      CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+clientPhone);
      CacheService.getScriptCache().remove("BA_CLIENT_MSGS_"+clientPhone);
      baCacheRemove_("BA_CLIENT_REQUEST_HISTORY_"+clientPhone);
    }
    [oldTutorPhone,newTutorPhone].map(normalizePhone_).filter(Boolean).forEach(function(phone){
      CacheService.getScriptCache().remove("BA_TUTOR_DASH_"+phone);
    });
  }catch(e){console.error("Work cache invalidation failed: "+e)}
}
function adminAssignWork_(d){
  requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");
  const oldTutorPhone=normalizePhone_(c.assignedTutorPhone||"");
  const tutorName=String(d.tutorName||"").trim(),tutorPhone=resolveTutorPhone_(tutorName,d.tutorPhone||""),assignedAdminUsername=String(d.assignedAdminUsername||"").trim(),assignedAdminName=String(d.assignedAdminName||"").trim();
  if(!tutorName)throw new Error("Select or enter a tutor.");if(!c.studentBudget||c.studentBudget<=0)throw new Error("Student budget is missing.");
  const chosenTutor=getTutorByPhone_(tutorPhone);if(chosenTutor&&String(chosenTutor.status||"ACTIVE").toUpperCase()==="SUSPENDED")throw new Error("This tutor is suspended and cannot receive new work.");
  const gross=Number(c.agreedAmount||c.studentBudget),tutorPayout=Math.round(gross*0.50*100)/100,brightAce=Math.round(gross*0.50*100)/100;
  const sh=getConversationSheet_(),hm=headerMap_(sh),updates=[["assignedTutor",tutorName],["assignedTutorPhone",tutorPhone],["tutorPayout",tutorPayout],["brightAceShare",brightAce],["assignmentStatus","ASSIGNED"],["agreedAmount",gross],["agreedCurrency",c.agreedCurrency||c.currency],["assignedAdminUsername",assignedAdminUsername],["assignedAdminName",assignedAdminName]];updates.forEach(u=>{if(hm[u[0]])sh.getRange(c.row,hm[u[0]]).setValue(u[1])});
  let assignmentAttachments=[];if(Array.isArray(d.attachments)&&d.attachments.length)assignmentAttachments=saveAttachments_(c.conversationId,d.attachments);
  const tutorMsg="📚 BrightAce work assignment\n\nWork ID: "+c.conversationId+"\nClient: "+c.studentName+"\nDeadline: "+(c.deadline||"As agreed")+"\n\nTask:\n"+c.workDescription+"\n\nYour assigned payout: "+c.currency+" "+tutorPayout.toFixed(2)+"\n\nAssigned documents are available in your BrightAce Tutor Dashboard. All student communication remains under BrightAce Academy administration. Please do not request direct payment from the student.";
  let whatsappSent=false;if(tutorPhone){try{sendWhatsAppText_(tutorPhone,tutorMsg);whatsappSent=true}catch(e){console.error(e)}}
  const studentMsg="📚 Your BrightAce request has been assigned to a tutor. You can continue discussing the work and any remaining details through this chat.";const saved=saveMessage_(c.conversationId,"admin",studentMsg,"admin",assignmentAttachments.length?assignmentAttachments:null);updateConversation_(c.conversationId,new Date(),saved.id);
  invalidateWorkCaches_(c.conversationId,oldTutorPhone,tutorPhone,c.studentPhone);
  auditAdmin_(d.adminToken,"ASSIGN_WORK",c.conversationId+" → tutor: "+tutorName+"; admin: "+assignedAdminUsername);return json_({ok:true,assignment:{conversationId:c.conversationId,tutorName:tutorName,tutorPhone:tutorPhone,assignedAdminUsername:assignedAdminUsername,assignedAdminName:assignedAdminName,tutorPayout:tutorPayout,whatsappSent:whatsappSent,assignmentStatus:"ASSIGNED",attachments:assignmentAttachments}});
}

/* ===================== CLIENT DASHBOARD ===================== */
/* ===================== CLIENT SESSION FOUNDATION ===================== */
function issueClientSession_(client,phone){
  const token=Utilities.getUuid()+Utilities.getUuid(),hash=sha256Hex_(token),expires=new Date(Date.now()+30*60*1000),sh=getClientSheet_(),now=new Date();
  if(client&&client.row){setByHeader_(sh,client.row,"sessionTokenHash",hash);setByHeader_(sh,client.row,"sessionExpiresAt",expires);setByHeader_(sh,client.row,"lastActivityAt",now);}
  else CacheService.getScriptCache().put(CONFIG.clientSessionTokenPrefix+hash,JSON.stringify({phone:normalizePhone_(phone),expiresAt:expires.getTime(),lastActivityAt:now.getTime()}),1800);
  return {clientSessionToken:token,expiresAt:expires.toISOString()};
}
function requireClientSession_(token,phone){
  const target=normalizePhone_(phone||""); if(!token||!target)throw new Error("Your client session has expired. Please verify your WhatsApp number again.");
  if(isWhatsAppBlocked_(target))throw new Error("Sorry, this WhatsApp number is blocked from using BrightAce services. Please contact BrightAce Admin.");
  const c=getClientByPhone_(target); if(!c)throw new Error("Client record not found. Please start a new verified chat.");
  const hash=sha256Hex_(String(token)),now=Date.now(),maxIdle=30*60*1000;
  if(c.row){
    const sh=getClientSheet_(),stored=String(getByHeader_(sh,c.row,"sessionTokenHash")||""),lastRaw=getByHeader_(sh,c.row,"lastActivityAt"),last=lastRaw?new Date(lastRaw).getTime():0;
    if(!stored||stored!==hash||!last||now-last>maxIdle)throw new Error("Your client session has expired after inactivity. Please verify your WhatsApp number again.");
    const exp=new Date(now+maxIdle);setByHeader_(sh,c.row,"sessionExpiresAt",exp);
  } else {
    const raw=CacheService.getScriptCache().get(CONFIG.clientSessionTokenPrefix+hash),cached=safeJson_(raw||""),last=Number(cached.lastActivityAt||cached.expiresAt-maxIdle||0);
    if(!cached||cached.phone!==target||!last||now-last>maxIdle)throw new Error("Your client session has expired after inactivity. Please verify your WhatsApp number again.");
    cached.lastActivityAt=now;cached.expiresAt=now+maxIdle;CacheService.getScriptCache().put(CONFIG.clientSessionTokenPrefix+hash,JSON.stringify(cached),1800);
  }
  return c;
}
function clientConversationFromSession_(d){
  const client=requireClientSession_(d.clientSessionToken,d.phone),id=String(d.conversationId||"").trim();if(!id)throw new Error("Request ID is required.");
  const c=findConversation_(id);if(!c||normalizePhone_(c.studentPhone)!==client.clientPhone)throw new Error("This request does not belong to the verified client.");
  // V47: the verified client session is the authorization boundary. Historical
  // requests may have legacy/missing verificationStatus values and remain
  // accessible to their verified owner. Permanent deletion is the only removal.
  return c;
}
function clientGetRequest_(d){
  const c=clientConversationFromSession_(d),cid=String(c.conversationId),messages=readConversationMessages_(cid).map(x=>Object.assign({},x,{attachment:hydrateAttachment_(x.attachment)})),docs=collectConversationAttachments_(cid);
  const scheduleKey='BA_SCHEDULES_'+cid,paymentKey='BA_PAYMENTS_'+cid;
  let schedules=baCacheGetJson_(scheduleKey),payments=baCacheGetJson_(paymentKey);
  if(!Array.isArray(schedules)){
    const ss=getScheduleSheet_(),m=headerMap_(ss),rows=baRowsByConversationId_(ss,m.conversationId,cid);
    schedules=rows.map(function(x){return rowSchedule_(x.values,x.row)}); baCachePutJson_(scheduleKey,schedules,30);
  }
  if(!Array.isArray(payments)){
    const ps=getPaymentSheet_(),m=headerMap_(ps),rows=baRowsByConversationId_(ps,m.conversationId,cid);
    payments=rows.map(function(x){const p=rowPayment_(x.values,x.row);return {requestId:p.requestId,service:p.service,amount:p.amount,currency:p.currency,status:p.status,reference:p.paystackReference,createdAt:p.createdAt,paidAt:p.paidAt,deliveryDeadline:p.deliveryDeadline,invoiceUrl:'receipt.html?request='+encodeURIComponent(p.requestId)}});
    baCachePutJson_(paymentKey,payments,30);
  }
  const tutor=tutorProfileByPhone_(resolveTutorPhone_(c.assignedTutor,c.assignedTutorPhone||''));
  return json_({ok:true,request:Object.assign({},c,{messages,documents:docs,schedules:schedules,payments:payments,tutorProfile:tutor||null})});
}

function clientTouchSession_(d){const c=requireClientSession_(d.clientSessionToken,d.phone),exp=new Date(Date.now()+30*60*1000);setByHeader_(getClientSheet_(),c.row,"sessionExpiresAt",exp);return json_({ok:true,clientId:c.clientId,expiresAt:exp.toISOString()});}
function clientEndSession_(d){const phone=normalizePhone_(d.phone||""),token=String(d.clientSessionToken||"");const c=phone?getClientByPhone_(phone):null;if(c&&c.row){setByHeader_(getClientSheet_(),c.row,"sessionTokenHash","");setByHeader_(getClientSheet_(),c.row,"sessionExpiresAt","");}if(token)try{CacheService.getScriptCache().remove(CONFIG.clientSessionTokenPrefix+sha256Hex_(token))}catch(e){}return json_({ok:true,signedOut:true});}

function clientAuthConversation_(d){
  const id=String(d.conversationId||"").trim(), token=String(d.clientAccessToken||"").trim(), phone=normalizePhone_(d.phone||"").trim();
  if(!id||!token) throw new Error("Secure client dashboard access is required.");
  const c=findConversation_(id); if(!c) throw new Error("BrightAce request not found.");
  if(phone && normalizePhone_(c.studentPhone)!==phone) throw new Error("This request does not belong to the verified client.");
  // V50: the per-request access token is itself the post-verification credential.
  // Do not use legacy verificationStatus as the authorization boundary.
  if(String(c.clientAccessToken||"")!==token) throw new Error("Your dashboard session has expired. Please verify your WhatsApp number again.");
  const profile=getClientByPhone_(normalizePhone_(c.studentPhone));
  if(!profile) throw new Error("Client record not found. Please start a new verified chat.");
  const sh=getClientSheet_(),last=profile.row?new Date(getByHeader_(sh,profile.row,"lastActivityAt")||0).getTime():0,verifiedAt=new Date(c.verifiedAt||0).getTime(),activityAt=last||verifiedAt;
  if(!activityAt||Date.now()-activityAt>30*60*1000) throw new Error("Your client session has expired after 30 minutes of inactivity. Please verify your WhatsApp number again.");
  return c;
}
function clientConversationFromSessionOrAccess_(d){
  const id=String(d.conversationId||"").trim(),phone=normalizePhone_(d.phone||"").trim(),accessToken=String(d.clientAccessToken||"").trim();
  if(d.clientSessionToken){
    try{return clientConversationFromSession_(d)}catch(sessionErr){
      if(!id||!accessToken) throw sessionErr;
      const c=clientAuthConversation_({conversationId:id,phone:phone,clientAccessToken:accessToken});
      const profile=getClientByPhone_(phone||c.studentPhone);
      if(!profile)throw sessionErr;
      const issued=issueClientSession_(profile,phone||c.studentPhone);
      return {conversation:c,clientSessionToken:issued.clientSessionToken};
    }
  }
  const c=clientAuthConversation_({conversationId:id,phone:phone,clientAccessToken:accessToken});
  const profile=getClientByPhone_(phone||c.studentPhone);
  if(!profile)throw new Error("Client record not found. Please start a new verified chat.");
  const issued=issueClientSession_(profile,phone||c.studentPhone);
  return {conversation:c,clientSessionToken:issued.clientSessionToken};
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
  const id=String(d.conversationId||"").trim(),phone=normalizePhone_(d.phone||"").trim(),sessionToken=String(d.clientSessionToken||"").trim(),accessToken=String(d.clientAccessToken||"").trim();
  if(!id||!phone)throw new Error("Your client session could not be restored. Please return to Live Chat and verify your WhatsApp number again.");
  const c=findConversation_(id);
  if(!c||normalizePhone_(c.studentPhone)!==phone)throw new Error("Your verified client session could not be restored. Please verify your WhatsApp number again.");

  // V49: verificationStatus on an individual request is NOT the session boundary.
  // Older requests can legitimately have legacy/missing verificationStatus values.
  // The secure recovery order is: valid client session token first, then the
  // per-request clientAccessToken issued after WhatsApp verification. The latter
  // can recover a fresh client session when a browser loses/rotates its session token.
  let client=null,activeToken="";
  if(sessionToken){
    try{client=requireClientSession_(sessionToken,phone);activeToken=sessionToken}catch(e){client=null}
  }

  if(!client && accessToken && String(c.clientAccessToken||"")===accessToken){
    const candidate=getClientByPhone_(phone);
    if(!candidate)throw new Error("Your verified client session could not be restored. Please verify your WhatsApp number again.");
    const clientSheet=getClientSheet_();
    const last=candidate.row?new Date(getByHeader_(clientSheet,candidate.row,"lastActivityAt")||0).getTime():0;
    const verifiedAt=new Date(c.verifiedAt||0).getTime();
    const activityAt=last||verifiedAt;
    if(!activityAt || Date.now()-activityAt>30*60*1000)throw new Error("Your client session has expired after 30 minutes of inactivity. Please verify your WhatsApp number again.");
    const issued=issueClientSession_(candidate,phone);
    client=candidate;activeToken=issued.clientSessionToken;
  }

  if(!client)throw new Error("Your verified client session could not be restored. Please verify your WhatsApp number again.");
  const sh=getConversationSheet_(),existing=String(getByHeader_(sh,c.row,"clientAccessToken")||"");
  const token=existing||accessToken||Utilities.getUuid()+Utilities.getUuid();
  if(!existing)setByHeader_(sh,c.row,"clientAccessToken",token);
  const exp=new Date(Date.now()+30*60*1000);
  if(client.row){setByHeader_(getClientSheet_(),client.row,"lastActivityAt",new Date());setByHeader_(getClientSheet_(),client.row,"sessionExpiresAt",exp);}
  return json_({ok:true,clientAccessToken:token,clientSessionToken:activeToken,clientSessionExpiresAt:exp.toISOString()});
}
function clientAllMessages_(phone){
  const target=normalizePhone_(phone),ck='BA_CLIENT_MSGS_'+target;
  const hit=baCacheGetJson_(ck); if(Array.isArray(hit))return hit;
  const ids=baConversationIdsForPhone_(target),out=[];
  ids.forEach(function(id){ const list=readConversationMessages_(id); if(Array.isArray(list))out.push.apply(out,list); });
  out.sort(function(a,b){return new Date(a.timestamp||0).getTime()-new Date(b.timestamp||0).getTime()});
  const result=out.slice(-200); baCachePutJson_(ck,result,10); return result;
}
function clientDashboard_(d){
  const clientSessionToken=String(d.clientSessionToken||"").trim(), phone=normalizePhone_(d.phone||""), accessToken=String(d.clientAccessToken||"").trim();
  let c;
  if(clientSessionToken){
    try{
      c=requireClientSession_(clientSessionToken,phone);
    }catch(sessionErr){
      // V49 recovery: a valid per-request access token can re-establish the
      // short-lived client session without forcing WhatsApp verification again.
      const id=String(d.conversationId||"").trim(),candidate=id?findConversation_(id):null;
      if(!candidate||normalizePhone_(candidate.studentPhone)!==phone||!accessToken||String(candidate.clientAccessToken||"")!==accessToken)throw sessionErr;
      const profile=getClientByPhone_(phone);
      if(!profile)throw sessionErr;
      const last=profile.row?new Date(getByHeader_(getClientSheet_(),profile.row,"lastActivityAt")||0).getTime():0;
      const verifiedAt=new Date(candidate.verifiedAt||0).getTime(),activityAt=last||verifiedAt;
      if(!activityAt||Date.now()-activityAt>30*60*1000)throw sessionErr;
      const issued=issueClientSession_(profile,phone);
      c=candidate;
      d.clientSessionToken=issued.clientSessionToken;
    }
  }else{
    c=clientAuthConversation_(d);
    const profile=getClientByPhone_(phone||c.studentPhone);
    if(profile){
      const issued=issueClientSession_(profile,phone||c.studentPhone);
      d.clientSessionToken=issued.clientSessionToken;
    }
  }

  const dashKey="BA_CLIENT_DASH_"+c.clientPhone;
  try{
    const hit=CacheService.getScriptCache().get(dashKey);
    if(hit){
      const cached=safeJson_(hit);
      if(cached&&Array.isArray(cached.requests))return json_(Object.assign({ok:true,clientSessionToken:String(d.clientSessionToken||"")},cached));
    }
  }catch(e){}

  /*
   * V47 CONTRACT:
   * Every request ever created for this verified WhatsApp number is returned.
   * We do not filter by verificationStatus, assignment status, open/closed state,
   * or age. The only way a request disappears is permanent Super Admin deletion.
   */
  const requests=baClientRequestHistory_(c.studentPhone);

  const tsh=getTutorSheet_(),tr=tsh.getDataRange().getValues(),tm=headerMap_(tsh),profiles={};
  for(let i=1;i<tr.length;i++){
    const tp=normalizePhone_(tr[i][tm.tutorPhone-1]||"");
    if(tp)profiles[tp]={
      profilePictureUrl:tutorProfilePictureUrl_(tm.profilePictureUrl?String(tr[i][tm.profilePictureUrl-1]||""):""),
      description:tm.description?String(tr[i][tm.description-1]||""):""
    };
  }
  requests.forEach(function(x){
    const p=profiles[normalizePhone_(x.tutorPhone)]||null;
    x.tutorProfilePictureUrl=p&&p.profilePictureUrl||"";
    x.tutorDescription=p&&p.description||"";
  });

  /*
   * Payments remain bounded to the client's phone and schedules to the client's
   * conversation IDs. This keeps the historical request list authoritative while
   * avoiding a full dashboard reconstruction from the Conversations matrix.
   */
  const payments=[], paymentSheet=getPaymentSheet_(),pm=headerMap_(paymentSheet);
  if(pm.studentPhone){
    const pCells=paymentSheet.getRange(2,pm.studentPhone,Math.max(0,paymentSheet.getLastRow()-1),1)
      .createTextFinder(normalizePhone_(c.studentPhone)).matchEntireCell(true).useRegularExpression(false).findAll();
    pCells.forEach(function(cell){
      try{
        const row=cell.getRow(),p=rowPayment_(paymentSheet.getRange(row,1,1,paymentSheet.getLastColumn()).getValues()[0],row);
        payments.push({requestId:p.requestId,service:p.service,amount:p.amount,currency:p.currency,status:p.status,reference:p.paystackReference,createdAt:p.createdAt,paidAt:p.paidAt,deliveryDeadline:p.deliveryDeadline,invoiceUrl:"receipt.html?request="+encodeURIComponent(p.requestId)});
      }catch(e){}
    });
  }

  const schedules=[], scheduleSheet=getScheduleSheet_(),sm=headerMap_(scheduleSheet);
  const requestIds={};requests.forEach(x=>{requestIds[String(x.conversationId)]=true});
  if(scheduleSheet.getLastRow()>1){
    const sRows=scheduleSheet.getDataRange().getValues();
    for(let i=1;i<sRows.length;i++){
      const sid=String(sRows[i][sm.conversationId-1]||"");
      const sp=normalizePhone_(sm.studentPhone?sRows[i][sm.studentPhone-1]:"");
      if((sid&&requestIds[sid])||(sp&&sp===normalizePhone_(c.studentPhone))){
        try{schedules.push(rowSchedule_(sRows[i],i+1));}catch(e){}
      }
    }
  }

  const allClientMessages=clientAllMessages_(c.studentPhone);
  const currentRequest=requests[0]||null;
  const messages=(currentRequest?allClientMessages.filter(x=>x.sessionId===currentRequest.conversationId):[]).slice(-100);
  const docs=allClientMessages.filter(x=>x.attachment).flatMap(x=>
    (Array.isArray(x.attachment)?x.attachment:[x.attachment]).map(a=>Object.assign({messageId:x.id,sender:x.sender,timestamp:x.timestamp},a))
  ).slice(-100);
  const submissions=allClientMessages
    .filter(x=>String(x.sender||"").toLowerCase()==="tutor"&&x.attachment)
    .map(x=>Object.assign({},x,{submissionType:(String(x.text||"").match(/\[([A-Z]+)\]/)||[])[1]||"WORK"}));

  const response={
    student:{name:c.clientName||c.studentName,phone:c.clientPhone||c.studentPhone},
    requests:requests,
    messages:messages,
    documents:docs,
    uploadedDocuments:docs.filter(x=>String(x.sender||"").toLowerCase()!=="tutor"),
    tutorSubmissions:submissions,
    payments:payments,
    schedules:schedules,
    currentRequest:currentRequest,
    invoiceReceipts:payments.map(x=>({requestId:x.requestId,url:x.invoiceUrl,status:x.status}))
  };
  try{CacheService.getScriptCache().put(dashKey,JSON.stringify(response),15)}catch(e){}
  return json_(Object.assign({ok:true,clientSessionToken:String(d.clientSessionToken||"")},response));
}

function clientSendComment_(d){
  const c=d.clientSessionToken?clientConversationFromSession_(d):clientAuthConversation_(d),text=String(d.text||"").trim();let attachments=[];
  if(Array.isArray(d.attachments)) attachments=saveAttachments_(c.conversationId,d.attachments);
  if(!text&&!attachments.length)throw new Error("Enter a comment or attach a file.");
  if(text.length>3000)throw new Error("Comment is too long.");
  const stored=attachments.length===1?attachments[0]:attachments;
  const saved=saveMessage_(c.conversationId,"student",text,"client-dashboard",stored,c.studentName,c.studentPhone);
  updateConversation_(c.conversationId,new Date(),saved.id);
  try{CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_ASSIGNMENTS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");CacheService.getScriptCache().remove("BA_ADMIN_QUALITY")}catch(e){}
  return json_({ok:true,messageId:saved.id,attachment:stored||null,message:"Comment added to the BrightAce work record."});
}

function clientSubmitFeedback_(d){
  const c=d.clientSessionToken?clientConversationFromSession_(d):clientAuthConversation_(d),feedback=String(d.feedback||"").trim(),rating=Number(d.rating||0);
  if(!feedback)throw new Error("Please enter your feedback.");
  if(rating && (rating<1||rating>5||Math.floor(rating)!==rating))throw new Error("Rating must be between 1 and 5 stars.");
  if(feedback.length>2000)throw new Error("Feedback is too long.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"clientFeedback",feedback);setByHeader_(sh,c.row,"clientFeedbackAt",new Date());if(rating)setByHeader_(sh,c.row,"clientRating",rating);try{CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+normalizePhone_(c.studentPhone));CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");}catch(e){}
  saveMessage_(c.conversationId,"student","Client feedback: "+feedback,"dashboard",null,c.studentName,c.studentPhone);
  return json_({ok:true,message:"Thank you. Your feedback has been recorded."});
}

function statementDateKey_(v){
  if(!v)return "";
  const d=new Date(v);
  if(isNaN(d.getTime()))return String(v).slice(0,10);
  return Utilities.formatDate(d,Session.getScriptTimeZone()||"GMT","yyyy-MM-dd");
}
function statementRange_(from,to){
  from=String(from||"").trim();to=String(to||"").trim();
  if(from&&!/^\d{4}-\d{2}-\d{2}$/.test(from))throw new Error("Statement start date is invalid.");
  if(to&&!/^\d{4}-\d{2}-\d{2}$/.test(to))throw new Error("Statement end date is invalid.");
  if(from&&to&&from>to)throw new Error("Statement start date cannot be after the end date.");
  return {from:from,to:to};
}
function inStatementRange_(v,range){
  const k=statementDateKey_(v);if(!k)return !range.from&&!range.to;
  return (!range.from||k>=range.from)&&(!range.to||k<=range.to);
}
function getTutorContact_(tutorId){
  const id=String(tutorId||"").trim();
  if(id==="PRIMARY"){
    const props=PropertiesService.getScriptProperties();
    return {tutorId:"PRIMARY",name:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),email:"",phone:normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"")};
  }
  const sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.tutorId-1]||"")===id){
    const name=String(rows[i][m.tutorName-1]||""),email=m.tutorEmail?String(rows[i][m.tutorEmail-1]||""):"";
    return {tutorId:id,name:name,email:email,phone:resolveTutorPhone_(name,rows[i][m.tutorPhone-1]||"")};
  }
  return {tutorId:id,name:"Tutor",email:"",phone:""};
}
function buildClientStatement_(token,phone,from,to){
  const c=requireClientSession_(token,phone),range=statementRange_(from,to),ps=getPaymentSheet_(),rows=ps.getDataRange().getValues(),out=[];let email=String(c.studentEmail||"");
  for(let i=1;i<rows.length;i++){
    const p=rowPayment_(rows[i],i+1);if(normalizePhone_(p.studentPhone)!==c.clientPhone)continue;
    if(!email&&p.email)email=String(p.email);
    if(inStatementRange_(p.paidAt||p.createdAt,range))out.push({requestId:p.requestId,service:p.service,amount:p.amount,currency:p.currency,status:p.status,reference:p.paystackReference||"",createdAt:p.createdAt,paidAt:p.paidAt});
  }
  out.sort((a,b)=>new Date(b.paidAt||b.createdAt||0)-new Date(a.paidAt||a.createdAt||0));
  return {type:"CLIENT",party:{id:c.clientId,name:c.clientName||"Client",email:email,phone:c.clientPhone},transactions:out,range:range};
}
function buildTutorStatement_(token,from,to){
  const p=requireTutor_(token),range=statementRange_(from,to),ps=getTutorPaymentHistorySheet_(),rows=ps.getDataRange().getValues(),m=headerMap_(ps),out=[];
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.tutorId-1]||"")===String(p.tutorId||"")){
    const paidAt=rows[i][m.paidAt-1]||"";if(inStatementRange_(paidAt,range))out.push({paymentId:String(rows[i][m.paymentId-1]||""),amount:Number(rows[i][m.amount-1]||0),currency:String(rows[i][m.currency-1]||"KES"),method:String(rows[i][m.method-1]||""),recipient:String(rows[i][m.recipient-1]||""),reference:String(rows[i][m.paymentReference-1]||""),paidAt:paidAt,note:String(rows[i][m.note-1]||""),type:"TUTOR PAYMENT"});
  }
  const ws=getTutorWithdrawalSheet_(),wr=ws.getDataRange().getValues(),wm=headerMap_(ws);
  for(let i=1;i<wr.length;i++)if(String(wr[i][wm.tutorId-1]||"")===String(p.tutorId||"")){
    const paidAt=wr[i][wm.reviewedAt-1]||wr[i][wm.requestedAt-1]||"";if(inStatementRange_(paidAt,range))out.push({paymentId:String(wr[i][wm.withdrawalId-1]||""),amount:Number(wr[i][wm.amount-1]||0),currency:String(wr[i][wm.currency-1]||"KES"),method:String(wr[i][wm.method-1]||""),recipient:String(wr[i][wm.recipient-1]||""),reference:String(wr[i][wm.paymentReference-1]||""),paidAt:paidAt,note:"Withdrawal "+String(wr[i][wm.status-1]||"PENDING"),type:"TUTOR WITHDRAWAL"});
  }
  out.sort((a,b)=>new Date(b.paidAt||0)-new Date(a.paidAt||0));
  const contact=getTutorContact_(p.tutorId);
  return {type:"TUTOR",party:contact,transactions:out,range:range};
}
function buildAdminStatement_(token,from,to){
  const profile=getAdminProfile_(token);if(String(profile.role||"").toUpperCase()!=="SUPER_ADMIN")throw new Error("Owner / main admin authorization is required for the transaction statement.");
  const range=statementRange_(from,to),transactions=[],seenOutgoing={};
  // Incoming client payments. Every paid/recorded client transaction is included.
  const ps=getPaymentSheet_(),pr=ps.getDataRange().getValues();
  for(let i=1;i<pr.length;i++){
    const p=rowPayment_(pr[i],i+1),date=p.paidAt||p.createdAt;if(!inStatementRange_(date,range))continue;
    transactions.push({date:date,type:"CLIENT PAYMENT",direction:"IN",reference:p.paystackReference||p.requestId,details:(p.studentName||"Client")+" - "+(p.service||"BrightAce service")+" - "+p.status,amount:p.amount,currency:p.currency,status:p.status,sourceId:p.requestId||""});
  }
  // Approved client refunds are actual outgoing money to a client. Rejected/pending requests are not cash transactions.
  const rf=getRefundSheet_(),rr=rf.getDataRange().getValues(),rm=headerMap_(rf);
  for(let i=1;i<rr.length;i++){
    const status=String(rr[i][rm.status-1]||"").toUpperCase();
    const amount=Number(rr[i][rm.approvedAmount-1]||0);
    const date=rr[i][rm.reviewedAt-1]||"";
    if(status!=="APPROVED"||!(amount>0)||!inStatementRange_(date,range))continue;
    const reference=String(rr[i][rm.paystackRefundId-1]||rr[i][rm.refundId-1]||"").trim();
    transactions.push({date:date,type:"CLIENT REFUND",direction:"OUT",reference:reference,details:String(rr[i][rm.studentName-1]||"Client")+" - Refund for "+String(rr[i][rm.paymentRequestId-1]||"payment request"),amount:amount,currency:String(rr[i][rm.currency-1]||"KES").toUpperCase(),status:"APPROVED",sourceId:String(rr[i][rm.refundId-1]||"")});
    if(reference)seenOutgoing[reference]=true;
  }
  // Tutor payment history is the canonical record of money actually paid to a tutor.
  // Do not also count the originating PAID withdrawal row when both share the same payment reference.
  const tph=getTutorPaymentHistorySheet_(),tr=tph.getDataRange().getValues(),tm=headerMap_(tph);
  for(let i=1;i<tr.length;i++){
    const date=tr[i][tm.paidAt-1]||"",reference=String(tr[i][tm.paymentReference-1]||tr[i][tm.paymentId-1]||"").trim();
    if(!inStatementRange_(date,range))continue;
    transactions.push({date:date,type:"TUTOR PAYMENT",direction:"OUT",reference:reference,details:String(tr[i][tm.tutorName-1]||"Tutor")+" - "+String(tr[i][tm.method-1]||""),amount:Number(tr[i][tm.amount-1]||0),currency:String(tr[i][tm.currency-1]||"KES").toUpperCase(),status:"PAID",sourceId:String(tr[i][tm.paymentId-1]||"")});
    if(reference)seenOutgoing[reference]=true;
  }
  // Include paid withdrawals that do not have a corresponding payment-history record, preventing duplicates.
  const tw=getTutorWithdrawalSheet_(),wr=tw.getDataRange().getValues(),wm=headerMap_(tw);
  for(let i=1;i<wr.length;i++){
    const status=String(wr[i][wm.status-1]||"PENDING").toUpperCase(),reference=String(wr[i][wm.paymentReference-1]||wr[i][wm.withdrawalId-1]||"").trim();
    const date=wr[i][wm.reviewedAt-1]||wr[i][wm.requestedAt-1]||"";if(status!=="PAID"||!inStatementRange_(date,range))continue;
    const paymentReference=String(wr[i][wm.paymentReference-1]||"").trim();
    if(paymentReference&&seenOutgoing[paymentReference])continue;
    transactions.push({date:date,type:"TUTOR PAYMENT",direction:"OUT",reference:reference,details:String(wr[i][wm.tutorName-1]||"Tutor")+" - "+String(wr[i][wm.method-1]||"")+" - withdrawal",amount:Number(wr[i][wm.amount-1]||0),currency:String(wr[i][wm.currency-1]||"KES").toUpperCase(),status:"PAID",sourceId:String(wr[i][wm.withdrawalId-1]||"")});
  }
  transactions.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  return {type:"OWNER",party:{id:String(profile.username||"owner"),name:"BrightAce Academy",email:String(PropertiesService.getScriptProperties().getProperty(CONFIG.contactEmailKey)||""),phone:normalizePhone_(profile.whatsappPhone||CONFIG.defaultAdminWhatsAppPhone),administrator:String(profile.adminName||profile.username||"Owner")},transactions:transactions,range:range};
}
function registerStatement_(d){
  const type=String(d.statementType||"").toUpperCase(),from=d.from,to=d.to;let built;
  if(type==="CLIENT")built=buildClientStatement_(d.clientSessionToken,d.phone,from,to);
  else if(type==="TUTOR")built=buildTutorStatement_(d.tutorToken,from,to);
  else if(type==="OWNER")built=buildAdminStatement_(d.adminToken,from,to);
  else throw new Error("Invalid statement type.");
  const now=new Date(),stamp=Utilities.formatDate(now,Session.getScriptTimeZone()||"GMT","yyyyMMdd-HHmmss"),ref="BA-STMT-"+stamp+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase();
  const canonical=JSON.stringify({reference:ref,type:built.type,party:built.party,range:built.range,transactions:built.transactions});
  const hash=sha256Hex_(canonical),sh=getSheet_("STATEMENT_REGISTRY",["statementReference","statementType","partyName","partyId","email","phone","fromDate","toDate","generatedAt","transactionCount","integrityHash","status"]);
  sh.appendRow([ref,built.type,String(built.party.name||""),String(built.party.id||""),String(built.party.email||""),String(built.party.phone||""),built.range.from,built.range.to,now,built.transactions.length,hash,"VALID"]);
  const verifyUrl="https://kamaujames64-lgtm.github.io/brightace-academy/pages/verify-statement.html?ref="+encodeURIComponent(ref);
  return json_({ok:true,statementReference:ref,integrityHash:hash,verificationUrl:verifyUrl,generatedAt:now,party:built.party,transactions:built.transactions,range:built.range,type:built.type});
}
function verifyStatement_(reference){
  const ref=String(reference||"").trim();if(!ref)return json_({ok:false,error:"Statement reference is required."});
  const sh=getSheet_("STATEMENT_REGISTRY",["statementReference","statementType","partyName","partyId","email","phone","fromDate","toDate","generatedAt","transactionCount","integrityHash","status"]),rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++)if(String(rows[i][0]||"")===ref)return json_({ok:true,verified:String(rows[i][11]||"VALID").toUpperCase()==="VALID",statement:{reference:ref,type:String(rows[i][1]||""),name:String(rows[i][2]||""),id:String(rows[i][3]||""),email:String(rows[i][4]||""),phone:String(rows[i][5]||""),fromDate:String(rows[i][6]||""),toDate:String(rows[i][7]||""),generatedAt:rows[i][8]||"",transactionCount:Number(rows[i][9]||0),integrityHash:String(rows[i][10]||""),status:String(rows[i][11]||"VALID").toUpperCase()}});
  return json_({ok:false,error:"Statement reference not found."});
}
function clientStatement_(token,phone,from,to){const built=buildClientStatement_(token,phone,from,to);return json_({ok:true,client:built.party,transactions:built.transactions,range:built.range});}
function tutorStatement_(token,from,to){const built=buildTutorStatement_(token,from,to);return json_({ok:true,tutor:built.party,transactions:built.transactions,range:built.range});}
function adminStatement_(token,from,to){const built=buildAdminStatement_(token,from,to);return json_({ok:true,admin:built.party,transactions:built.transactions,range:built.range});}

function tutorAcceptWork_(d){
  const p=requireTutor_(d.tutorToken),c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  if(normalizePhone_(c.assignedTutorPhone)!==p.tutorPhone && !(p.tutorId==="PRIMARY"&&c.assignedTutor===p.tutorName))throw new Error("This work is not assigned to you.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"tutorWorkStatus","ACCEPTED");setByHeader_(sh,c.row,"assignmentStatus","ASSIGNED");
  invalidateWorkCaches_(c.conversationId,p.tutorPhone,p.tutorPhone,c.studentPhone);
  const msg=String(d.note||"Tutor accepted the assigned work.").trim();saveMessage_(c.conversationId,"tutor","✅ Work accepted by tutor. "+msg,"work-comment",null,p.tutorDisplayName,p.tutorPhone);
  invalidateWorkCaches_(c.conversationId,p.tutorPhone,p.tutorPhone,c.studentPhone);
  auditTutor_(p,"ACCEPT_WORK",c.conversationId);return json_({ok:true,status:"ACCEPTED",tutorWorkStatus:"ACCEPTED",assignmentStatus:"ASSIGNED",message:"Work accepted successfully."});
}
function tutorDeclineWork_(d){
  const p=requireTutor_(d.tutorToken),c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  if(normalizePhone_(c.assignedTutorPhone)!==p.tutorPhone && !(p.tutorId==="PRIMARY"&&c.assignedTutor===p.tutorName))throw new Error("This work is not assigned to you.");
  const reason=String(d.reason||"").trim();if(!reason)throw new Error("A reason is required when declining work.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"tutorWorkStatus","DECLINED");setByHeader_(sh,c.row,"assignmentStatus","NEW_REQUEST");setByHeader_(sh,c.row,"rejectionReason",reason);
  saveMessage_(c.conversationId,"tutor","❌ Tutor declined this assignment. Reason: "+reason,"work-comment",null,p.tutorDisplayName,p.tutorPhone);auditTutor_(p,"DECLINE_WORK",c.conversationId+" — "+reason);return json_({ok:true,status:"DECLINED",message:"Work declined and returned to the admin work queue."});
}

/* ===================== TUTOR DASHBOARD ===================== */
function generateVerificationCode_(phone){ return String(Math.floor(100000+Math.random()*900000)); }
function getTutorVerificationTestPhone_(){
  const configured=normalizePhone_(PropertiesService.getScriptProperties().getProperty(CONFIG.tutorVerificationTestPhoneKey)||"0725010628");
  return configured||"254725010628";
}
function getTutorVerificationTestCode_(){
  const raw=String(PropertiesService.getScriptProperties().getProperty(CONFIG.tutorVerificationTestCodeKey)||"121212").trim();
  return /^\d{6}$/.test(raw)?raw:"121212";
}
function isTutorVerificationTestPhone_(phone){return normalizePhone_(phone)===getTutorVerificationTestPhone_();}
function isTutorVerificationTestCodeEnabledFor_(phone){return isTutorVerificationTestPhone_(phone);}

function getTutorByPhone_(phone){
  const target=normalizePhone_(phone);if(!target)return null;
  const cacheKey="BA_TUTOR_LOOKUP_"+target;
  try{const hit=safeJson_(CacheService.getScriptCache().get(cacheKey)||"");if(hit&&hit.tutorPhone)return hit}catch(e){}
  const sh=getTutorSheet_(),m=headerMap_(sh);let found=null;
  try{
    if(m.tutorPhone){
      const last=sh.getLastRow();
      if(last>1){
        const cell=sh.getRange(2,m.tutorPhone,last-1,1).createTextFinder(target).matchEntireCell(true).useRegularExpression(false).findNext();
        if(cell){
          const row=cell.getRow(),vals=sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
          if(String(vals[m.status-1]||"ACTIVE").toUpperCase()!=="SUSPENDED")found={row:row,tutorId:String(vals[m.tutorId-1]||""),tutorName:String(vals[m.tutorName-1]||""),tutorDisplayName:String(vals[m.tutorDisplayName-1]||vals[m.tutorName-1]||""),tutorPhone:target};
        }
      }
    }
  }catch(e){}
  if(!found){
    const props=PropertiesService.getScriptProperties(),pn=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");
    if(target===pn)found={row:0,tutorId:"PRIMARY",tutorName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorDisplayName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorPhone:target};
    else {const test=getTutorVerificationTestPhone_();if(target===test)found={row:0,tutorId:"TEST-TUTOR",tutorName:"BrightAce Test Tutor",tutorDisplayName:"BrightAce Test Tutor",tutorPhone:target};}
  }
  if(found){try{CacheService.getScriptCache().put(cacheKey,JSON.stringify(found),60)}catch(e){}}
  return found;
}
function tutorSendVerification_(d){
  const phone=normalizePhone_(d.phone||""); if(phone.length<7)throw new Error("Enter a valid tutor WhatsApp number.");
  if(isWhatsAppBlocked_(phone))throw new Error("This number is not allowed here. It has been suspended by BrightAce Admin.");
  const t=getTutorByPhone_(phone);if(!t)throw new Error("This WhatsApp number is not registered to a BrightAce tutor.");
  const code=isTutorVerificationTestCodeEnabledFor_(phone)?getTutorVerificationTestCode_():generateVerificationCode_(phone),sh=getTutorSheet_(),now=new Date();
  if(!t.row){const id=t.tutorId==="TEST-TUTOR"?"TUT-TEST":"TUT-PRIMARY",name=t.tutorName;sh.appendRow([id,name,name,phone,"WHATSAPP","ACTIVE",now,"","",0,"",""]);t=getTutorByPhone_(phone);}
  setByHeader_(sh,t.row,"loginCodeHash",sha256Hex_(code));setByHeader_(sh,t.row,"loginExpiresAt",new Date(Date.now()+10*60*1000));setByHeader_(sh,t.row,"loginAttempts",0);
  const sent=isVerificationTestCodeEnabledFor_(phone)
    ? {testMode:true,skipped:true,message:"Test verification code configured; WhatsApp delivery bypassed for the designated test number."}
    : sendWhatsAppVerificationTemplate_(phone,code);
  return json_({ok:true,message:isTutorVerificationTestCodeEnabledFor_(phone)?"Test verification code 121212 is ready for this designated tutor number.":"A 6-digit verification code has been sent to the tutor WhatsApp number.",delivery:sent});
}
function tutorSessionProfile_(token){
  const p=requireTutor_(token);
  return json_({ok:true,tutor:{tutorId:p.tutorId,tutorName:p.tutorName,tutorDisplayName:p.tutorDisplayName,tutorPhone:p.tutorPhone,tokenExpiresAt:p.tokenExpiresAt}});
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
  token=String(token||"").trim();if(!token)throw new Error("Tutor login is required or has expired. Please verify your registered WhatsApp number again.");
  let p=safeJson_(CacheService.getScriptCache().get("BA_TUTOR_"+token)||"");
  if(!p||!p.tutorPhone){p=safeJson_(PropertiesService.getScriptProperties().getProperty("BA_TUTOR_TOKEN_"+token)||"");if(p&&p.tutorPhone&&Number(p.tokenExpiresAt||0)>Date.now())CacheService.getScriptCache().put("BA_TUTOR_"+token,JSON.stringify(p),21600)}
  if(!p||!p.tutorPhone||Number(p.tokenExpiresAt||0)<=Date.now())throw new Error("Tutor login is required or has expired. Please verify your registered WhatsApp number again.");
  const live=getTutorByPhone_(p.tutorPhone);if(!live)throw new Error("This tutor account is no longer active. Please contact BrightAce Admin.");
  p.tutorId=live.tutorId;p.tutorName=live.tutorName;p.tutorDisplayName=live.tutorDisplayName;p.tutorPhone=live.tutorPhone;return p;
}

function tutorProfilePictureUrl_(url){
  const raw=String(url||"").trim();
  if(!raw)return "";
  const match=raw.match(/[?&]id=([^&#]+)/)||raw.match(/\/d\/([^/]+)/);
  if(match&&match[1])return "https://drive.google.com/thumbnail?id="+encodeURIComponent(match[1])+"&sz=w512";
  return raw;
}
function tutorProfilePictureFileId_(url){
  const raw=String(url||"").trim(),match=raw.match(/[?&]id=([^&#]+)/)||raw.match(/\/d\/([^/]+)/);
  return match&&match[1]?decodeURIComponent(match[1]):"";
}
function tutorProfileByPhone_(phone){
  const target=normalizePhone_(phone),sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++) if(normalizePhone_(rows[i][m.tutorPhone-1])===target){
    return {tutorId:String(rows[i][m.tutorId-1]||""),tutorName:String(rows[i][m.tutorName-1]||""),tutorDisplayName:String(rows[i][m.tutorDisplayName-1]||rows[i][m.tutorName-1]||""),tutorPhone:target,profilePictureUrl:tutorProfilePictureUrl_(m.profilePictureUrl?String(rows[i][m.profilePictureUrl-1]||""):""),description:m.description?String(rows[i][m.description-1]||""):""};
  }
  const props=PropertiesService.getScriptProperties();
  if(target===normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"")) return {tutorId:"PRIMARY",tutorName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorDisplayName:String(props.getProperty("PRIMARY_TUTOR_NAME")||"BrightAce Tutor"),tutorPhone:target,profilePictureUrl:""};
  if(target===getTutorVerificationTestPhone_()) return {tutorId:"TEST-TUTOR",tutorName:"BrightAce Test Tutor",tutorDisplayName:"BrightAce Test Tutor",tutorPhone:target,profilePictureUrl:""};
  return null;
}
function ensureTutorProfileRow_(profile){
  const sh=getTutorSheet_(),found=getTutorByPhone_(profile.tutorPhone);
  if(found&&found.row)return {sh:sh,row:found.row,tutor:found};
  const id=profile.tutorId==="TEST-TUTOR"?"TUT-TEST":"TUT-"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase();
  sh.appendRow([id,profile.tutorName,profile.tutorDisplayName,profile.tutorPhone,"WHATSAPP","ACTIVE",new Date(),"","",0,""]);
  return {sh:sh,row:sh.getLastRow(),tutor:getTutorByPhone_(profile.tutorPhone)};
}
function tutorImageSignatureValid_(bytes,mime){
  const m=String(mime||"").toLowerCase(),b=bytes||[];
  if(m==="image/jpeg")return b.length>=3&&b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF;
  if(m==="image/png")return b.length>=8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4E&&b[3]===0x47&&b[4]===0x0D&&b[5]===0x0A&&b[6]===0x1A&&b[7]===0x0A;
  if(m==="image/gif"){const sig=String.fromCharCode.apply(null,b.slice(0,6));return b.length>=6&&(sig==="GIF89a"||sig==="GIF87a");}
  if(m==="image/webp")return b.length>=12&&String.fromCharCode.apply(null,b.slice(0,4))==="RIFF"&&String.fromCharCode.apply(null,b.slice(8,12))==="WEBP";
  return false;
}
function tutorProfileFileName_(phone,mime){
  const ext={ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"}[String(mime||"").toLowerCase()]||"img";
  return "TUTOR_PROFILE_"+normalizePhone_(phone)+"_"+Utilities.getUuid().replace(/-/g,"")+"."+ext;
}
function tutorTrashProfileFile_(fileId){
  const id=String(fileId||"").trim();if(!id)return;
  try{
    const file=DriveApp.getFileById(id),folder=getDriveFolder_(),parents=file.getParents(),folderId=folder.getId(),owned=(()=>{while(parents.hasNext())if(parents.next().getId()===folderId)return true;return false;})();
    if(owned)file.setTrashed(true);
  }catch(e){console.error("Tutor profile cleanup failed: "+e);}
}
function invalidateTutorProfileCaches_(phone){
  const target=normalizePhone_(phone);
  try{
    CacheService.getScriptCache().remove("BA_ADMIN_TUTORS");
    if(target){
      CacheService.getScriptCache().remove("BA_TUTOR_DASH_"+target);
      CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+target);
      CacheService.getScriptCache().remove("BA_CLIENT_MSGS_"+target);
    }
    const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),phones={};
    for(let i=1;i<rows.length;i++)if(normalizePhone_(rows[i][m.assignedTutorPhone-1]||"")===target&&rows[i][m.studentPhone-1])phones[normalizePhone_(rows[i][m.studentPhone-1])]=true;
    Object.keys(phones).forEach(ph=>CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+ph));
  }catch(e){console.error("Tutor profile cache invalidation failed: "+e);}
}
function tutorUploadProfile_(d){
  const p=requireTutor_(d.tutorToken),a=d.profilePicture;
  if(!a||!a.dataUrl)throw new Error("Choose a profile picture first.");
  const mime=String(a.mimeType||"").toLowerCase(),dataUrl=String(a.dataUrl||"");
  if(!/^image\/(jpeg|png|webp|gif)$/.test(mime))throw new Error("Profile picture must be JPG, PNG, WEBP or GIF.");
  if(!new RegExp("^data:"+mime.replace("/","\\/")+";base64,","i").test(dataUrl))throw new Error("Invalid profile picture data.");
  const raw=dataUrl.split(",").pop();
  let bytes;try{bytes=Utilities.base64Decode(raw)}catch(e){throw new Error("Invalid profile picture data.");}
  if(bytes.length>5*1024*1024)throw new Error("Profile picture must be smaller than 5 MB.");
  if(!tutorImageSignatureValid_(bytes,mime))throw new Error("The selected file is not a valid "+mime.replace("image/","").toUpperCase()+" image.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const rowInfo=ensureTutorProfileRow_(p),sh=rowInfo.sh,oldUrl=String(getByHeader_(sh,rowInfo.row,"profilePictureUrl")||""),oldId=String(getByHeader_(sh,rowInfo.row,"profilePictureFileId")||"")||tutorProfilePictureFileId_(oldUrl);
    const blob=Utilities.newBlob(bytes,mime,tutorProfileFileName_(p.tutorPhone,mime));
    const saved=saveBlob_(blob,mime,blob.getName(),"TUTOR_PROFILE_"+p.tutorPhone);
    const thumb="https://drive.google.com/thumbnail?id="+encodeURIComponent(saved.fileId)+"&sz=w512";
    setByHeader_(sh,rowInfo.row,"profilePictureUrl",thumb);
    setByHeader_(sh,rowInfo.row,"profilePictureFileId",saved.fileId);
    tutorTrashProfileFile_(oldId);
    invalidateTutorProfileCaches_(p.tutorPhone);
    return json_({ok:true,profilePictureUrl:thumb});
  }finally{lock.releaseLock();}
}
function tutorRemoveProfile_(d){
  const p=requireTutor_(d.tutorToken),lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const rowInfo=ensureTutorProfileRow_(p),sh=rowInfo.sh,oldUrl=String(getByHeader_(sh,rowInfo.row,"profilePictureUrl")||""),oldId=String(getByHeader_(sh,rowInfo.row,"profilePictureFileId")||"")||tutorProfilePictureFileId_(oldUrl);
    if(oldId)tutorTrashProfileFile_(oldId);
    setByHeader_(sh,rowInfo.row,"profilePictureUrl","");
    setByHeader_(sh,rowInfo.row,"profilePictureFileId","");
    invalidateTutorProfileCaches_(p.tutorPhone);
    return json_({ok:true,profilePictureUrl:""});
  }finally{lock.releaseLock();}
}
function getTutorPaymentView_(conversationId,tutorPhone){
  const paid=findPaidPaymentForConversation_(conversationId);
  if(!paid)return {paymentStatus:"NOT_PAID",tutorPayout:null,payoutStatus:"PENDING_CLIENT_PAYMENT"};
  const sh=getConversationSheet_(),c=findConversation_(conversationId);
  const amount=Number(c&&c.agreedAmount||paid.amount||0),payout=Math.round(amount*0.50*100)/100;
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
    const amount=Number(c.agreedAmount||paid.amount||0), payout=Math.round(amount*0.50*100)/100;
    if(!findPayoutForWork_(c.conversationId)) earnedBy[cur]=(earnedBy[cur]||0)+payout;
  }
  const currencies=new Set(Object.keys(earnedBy).concat(Object.keys(paidBy)));
  const byCurrency={}; currencies.forEach(cur=>{const earned=Math.round((earnedBy[cur]||0)*100)/100,paid=Math.round((paidBy[cur]||0)*100)/100;byCurrency[cur]={earned,paid,balance:Math.max(0,Math.round((earned-paid)*100)/100)}});
  return {byCurrency:byCurrency};
}
function tutorDashboard_(d){
  const p=requireTutor_(d.tutorToken),dashKey="BA_TUTOR_DASH_"+p.tutorPhone;try{const hit=CacheService.getScriptCache().get(dashKey);if(hit)return json_(Object.assign({ok:true},safeJson_(hit)||{}))}catch(e){}const csh=getConversationSheet_(),rows=csh.getDataRange().getValues(),cm=headerMap_(csh),works=[];
  const msgSh=getSheet_("MESSAGES",messageHeaders_()),msgRows=msgSh.getDataRange().getValues(),mm=headerMap_(msgSh),msgMap={},attachmentsByConversation={};
  for(let i=1;i<msgRows.length;i++){const id=String(msgRows[i][mm.conversationId-1]||"");if(!id)continue;const a=mm.attachmentJson?safeJson_(msgRows[i][mm.attachmentJson-1]||""):null,item={id:String(msgRows[i][mm.messageId-1]||""),sessionId:id,sender:String(msgRows[i][mm.sender-1]||""),text:String(msgRows[i][mm.text-1]||""),source:String(msgRows[i][mm.source-1]||""),timestamp:msgRows[i][mm.timestamp-1],status:String(msgRows[i][mm.status-1]||"received"),attachment:a,senderName:mm.senderName?String(msgRows[i][mm.senderName-1]||""):"",senderPhone:mm.senderPhone?String(msgRows[i][mm.senderPhone-1]||""):""};(msgMap[id]||(msgMap[id]=[])).push(item);const sender=item.sender.toLowerCase();if((sender==="student"||sender==="admin")&&a)(attachmentsByConversation[id]||(attachmentsByConversation[id]=[])).push(...(Array.isArray(a)?a:[a]).map(x=>{const h=hydrateAttachment_(x);return h?{messageId:item.id,sender:item.sender,timestamp:item.timestamp,...h}:null}).filter(Boolean));}
  const ss=getScheduleSheet_(),sr=ss.getDataRange().getValues(),scheduleMap={};for(let i=1;i<sr.length;i++){const id=String(sr[i][1]||"");if(id)(scheduleMap[id]||(scheduleMap[id]=[])).push(rowSchedule_(sr[i],i+1));}
  const ps=getPaymentSheet_(),pr=ps.getDataRange().getValues(),paymentMap={};for(let i=1;i<pr.length;i++){const pp=rowPayment_(pr[i],i+1);if(pp.conversationId&&String(pp.status||"").toUpperCase()==="PAID")paymentMap[pp.conversationId]=pp;}
  const payoutSh=getTutorPayoutSheet_(),payoutRows=payoutSh.getDataRange().getValues(),payoutMap={};for(let i=1;i<payoutRows.length;i++){const wid=String(payoutRows[i][3]||"");if(wid)payoutMap[wid]=payoutRows[i];}
  const tutorProfile=tutorProfileByPhone_(p.tutorPhone)||p;
  for(let i=1;i<rows.length;i++){const c=rowConversation_(rows[i],i+1,csh,cm),assigned=normalizePhone_(c.assignedTutorPhone)===p.tutorPhone||(p.tutorId==="PRIMARY"&&c.assignedTutor===p.tutorName&&!c.assignedTutorPhone);if(!assigned||String(c.status).toLowerCase()==="closed")continue;
    const allMsgs=(msgMap[c.conversationId]||[]).map(x=>Object.assign({},x,{attachment:hydrateAttachment_(x.attachment),submissionType:(String(x.text||"").match(/\[([A-Z]+)\]/)||[])[1]||""})),msgs=allMsgs.filter(x=>x.sender.toLowerCase()==="tutor"),adminComments=allMsgs.filter(x=>x.sender.toLowerCase()==="admin"),clientTutorMessages=allMsgs.filter(x=>["student","tutor"].indexOf(x.sender.toLowerCase())>=0),attachments=(attachmentsByConversation[c.conversationId]||[]).slice(-100),pay=paymentMap[c.conversationId],amount=Number(c.agreedAmount||(pay&&pay.amount)||0),currency=String(c.agreedCurrency||(pay&&pay.currency)||c.currency||"KES").toUpperCase(),payout=(c.tutorPayout>0?Number(c.tutorPayout):(pay?Math.round(amount*.50*100)/100:null)),existing=payoutMap[c.conversationId];
    const safeWork=Object.assign({},c);["studentBudget","agreedAmount","brightAceShare","clientAccessToken","verificationCodeHash","verificationExpiresAt","verificationAttempts","verificationResendCount","whatsappPhone","studentEmail"].forEach(k=>delete safeWork[k]);works.push(Object.assign(safeWork,{studentName:c.studentName,documents:attachments,submissions:msgs,clientTutorMessages:clientTutorMessages,paymentStatus:pay?"PAID":"NOT_PAID",tutorPayout:payout,payoutStatus:existing?String(existing[7]||"OWED").toUpperCase():(pay?"RECORDED":"PENDING_CLIENT_PAYMENT"),tutorProfilePictureUrl:tutorProfile.profilePictureUrl||"",clientFeedback:c.clientFeedback||"",clientFeedbackAt:c.clientFeedbackAt||"",schedules:scheduleMap[c.conversationId]||[]}));
  }
  const av=getTutorAvailability_(p.tutorPhone),balance=getTutorBalanceView_(p),profile=tutorProfileByPhone_(p.tutorPhone),wallet=findTutorWallet_(p.tutorId,p.tutorPhone);p.profilePictureUrl=(profile&&profile.profilePictureUrl)||"";
  const response={tutor:p,works:works,availability:av,balance:balance,wallet:wallet||null};try{CacheService.getScriptCache().put(dashKey,JSON.stringify(response),8)}catch(e){}return json_(Object.assign({ok:true},response));
}
function tutorUpdateWorkStatus_(d){
  const p=requireTutor_(d.tutorToken),c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  if(normalizePhone_(c.assignedTutorPhone)!==p.tutorPhone && !(p.tutorId==="PRIMARY"&&c.assignedTutor===p.tutorName))throw new Error("This work is not assigned to you.");
  const status=String(d.status||"").toUpperCase();if(["RECEIVED","IN_PROGRESS","READY_FOR_QA","REVISION_REQUESTED"].indexOf(status)<0)throw new Error("Invalid tutor work status.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"tutorWorkStatus",status);if(status==="IN_PROGRESS")setByHeader_(sh,c.row,"assignmentStatus","IN_PROGRESS");
  invalidateWorkCaches_(c.conversationId,p.tutorPhone,p.tutorPhone,c.studentPhone);
  auditTutor_(p,"STATUS_"+status,c.conversationId);return json_({ok:true,status:status,assignmentStatus:status==="IN_PROGRESS"?"IN_PROGRESS":c.assignmentStatus||"ASSIGNED"});
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
  invalidateWorkCaches_(c.conversationId,p.tutorPhone,p.tutorPhone,c.studentPhone);
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
  const text=String(d.text||"").trim();let attachments=[];if(Array.isArray(d.attachments))attachments=saveAttachments_(c.conversationId,d.attachments);if(!text&&!attachments.length)throw new Error("Enter a comment or attach a file.");if(text.length>3000)throw new Error("Comment is too long.");
  const stored=attachments.length===1?attachments[0]:attachments;const saved=saveMessage_(c.conversationId,"tutor",text,"work-comment",stored,p.tutorDisplayName,p.tutorPhone);
  updateConversation_(c.conversationId,new Date(),saved.id);auditTutor_(p,"WORK_COMMENT",c.conversationId);
  return json_({ok:true,messageId:saved.id,attachments:attachments});
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
  const chosen=getTutorById_(d.tutorId)||null;if(chosen&&String(chosen.status||"ACTIVE").toUpperCase()==="SUSPENDED")throw new Error("This tutor is suspended and cannot receive new work.");
  const tutorName=String(chosen?.tutorName||d.tutorName||c.assignedTutor||"").trim();
  const tutorPhone=normalizePhone_(chosen?.tutorPhone||d.tutorPhone||c.assignedTutorPhone||resolveTutorPhone_(tutorName,""));
  if(!tutorName)throw new Error("Select a tutor.");
  if(!tutorPhone)throw new Error("The selected tutor does not have a WhatsApp number configured.");
  // Admin appointments are authoritative. Tutor availability is advisory only; the appointment is still sent.
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
  requireAdmin_(token);const ck="BA_ADMIN_QUALITY";try{const hit=CacheService.getScriptCache().get(ck);if(hit)return json_({ok:true,quality:safeJson_(hit)||[]})}catch(e){}const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++){const c=rowConversation_(rows[i],i+1,sh,m);if(String(c.tutorWorkStatus).toUpperCase()==="READY_FOR_QA"||String(c.qaStatus).toUpperCase()==="REVISION_REQUIRED"||String(c.qaStatus).toUpperCase()==="APPROVED"||String(c.assignmentStatus).toUpperCase()==="COMPLETED")out.push({...c,documents:collectConversationAttachments_(c.conversationId)});}
  return json_({ok:true,works:out.reverse()});
}
function adminQaWork_(d){
  requireAdmin_(d.adminToken);const c=findConversation_(d.conversationId);if(!c)throw new Error("Work not found.");
  const decision=String(d.decision||"").toUpperCase(),notes=String(d.notes||"").trim();if(["APPROVE","REVISION"].indexOf(decision)<0)throw new Error("Choose approve or revision.");if(!notes)throw new Error("Add QA notes.");
  const profile=getAdminProfile_(d.adminToken),sh=getConversationSheet_();
  setByHeader_(sh,c.row,"qaStatus",decision==="APPROVE"?"APPROVED":"REVISION_REQUIRED");setByHeader_(sh,c.row,"qaAt",new Date());setByHeader_(sh,c.row,"qaBy",profile.adminName||profile.username);setByHeader_(sh,c.row,"qaNotes",notes);
  if(decision==="APPROVE"){setByHeader_(sh,c.row,"assignmentStatus","QA_APPROVED");setByHeader_(sh,c.row,"tutorWorkStatus","QA_APPROVED");}
  else {setByHeader_(sh,c.row,"assignmentStatus","REVISION_REQUIRED");setByHeader_(sh,c.row,"tutorWorkStatus","REVISION_REQUESTED");}
  const msg=decision==="APPROVE"?"✅ BrightAce Admin QA approved the tutor submission. Your completed work is now available in your dashboard.":"📝 BrightAce Admin QA requested a tutor revision. The team will update the work before final delivery.";
  const saved=saveMessage_(c.conversationId,"admin",msg,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(normalizePhone_(c.studentPhone),msg)}catch(e){}
  invalidateWorkCaches_(c.conversationId,c.assignedTutorPhone,c.assignedTutorPhone,c.studentPhone);
  return json_({ok:true,qaStatus:decision==="APPROVE"?"APPROVED":"REVISION_REQUIRED",assignmentStatus:decision==="APPROVE"?"QA_APPROVED":"REVISION_REQUIRED",tutorWorkStatus:decision==="APPROVE"?"QA_APPROVED":"REVISION_REQUESTED"});
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
  const savedId=saveTutorMessage_(p.tutorPhone,p.tutorName,"tutor",p.tutorDisplayName,text,"queued",null);
  const delivery=baEnqueueMessageDelivery_({
    queueId:"TUT-"+savedId, messageId:savedId, direction:"TUTOR_TO_ADMIN", recipient:target,
    text:msg, attachments:null, senderName:p.tutorDisplayName, maxAttempts:5
  });
  const result=baProcessMessageDelivery_(delivery.queueId);
  return json_({ok:true,messageId:savedId,deliveryId:delivery.queueId,deliveryStatus:result.status,whatsapp:result.result||null});
}

function getTutorWalletSheet_(){
  const h=["walletId","tutorId","tutorName","mobileProvider","mobileNumber","paypalEmail","payoneerEmail","bankName","accountName","accountNumber","branchCode","swiftCode","preferredMethod","updatedAt","status"];
  return ensureColumns_(getSheet_("TUTOR_WALLETS",h),h);
}
function getTutorPaymentHistorySheet_(){
  const h=["paymentId","tutorId","tutorName","amount","currency","method","recipient","paymentReference","paidAt","note","adminUsername"];
  return ensureColumns_(getSheet_("TUTOR_PAYMENT_HISTORY",h),h);
}
function walletRowToObject_(r,m,row){
  return {row:row,walletId:String(r[m.walletId-1]||""),tutorId:String(r[m.tutorId-1]||""),tutorName:String(r[m.tutorName-1]||""),
    mobileProvider:String(r[m.mobileProvider-1]||""),mobileNumber:String(r[m.mobileNumber-1]||""),
    paypalEmail:String(r[m.paypalEmail-1]||""),payoneerEmail:String(r[m.payoneerEmail-1]||""),
    bankName:String(r[m.bankName-1]||""),accountName:String(r[m.accountName-1]||""),
    accountNumber:String(r[m.accountNumber-1]||""),branchCode:String(r[m.branchCode-1]||""),
    swiftCode:String(r[m.swiftCode-1]||""),preferredMethod:String(r[m.preferredMethod-1]||""),
    updatedAt:r[m.updatedAt-1]||"",status:String(r[m.status-1]||"ACTIVE")};
}
function findTutorWallet_(tutorId,tutorPhone){
  const sh=getTutorWalletSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),id=String(tutorId||"").trim(),phone=normalizePhone_(tutorPhone||"");
  for(let i=1;i<rows.length;i++) if((id&&String(rows[i][m.tutorId-1]||"")===id)) return walletRowToObject_(rows[i],m,i+1);
  return null;
}
function findTutorPhoneById_(tutorId){
  const id=String(tutorId||"").trim();if(!id)return "";const sh=getTutorSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.tutorId-1]||"")===id)return normalizePhone_(rows[i][m.tutorPhone-1]||"");
  return "";
}
function validateWallet_(d){
  const method=String(d.preferredMethod||"").toUpperCase();
  if(method && ["MOBILE","PAYPAL","PAYONEER","BANK"].indexOf(method)<0) throw new Error("Select a valid preferred payment method.");
  const mobile=normalizePhone_(d.mobileNumber||""),paypal=String(d.paypalEmail||"").trim(),payoneer=String(d.payoneerEmail||"").trim();
  if(paypal && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paypal)) throw new Error("Enter a valid PayPal email.");
  if(payoneer && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payoneer)) throw new Error("Enter a valid Payoneer email.");
  if(method==="MOBILE"&&!mobile) throw new Error("Mobile payment method requires a mobile number.");
  if(method==="PAYPAL"&&!paypal) throw new Error("PayPal payment method requires a PayPal email.");
  if(method==="PAYONEER"&&!payoneer) throw new Error("Payoneer payment method requires a Payoneer email.");
  if(method==="BANK"&&(!String(d.bankName||"").trim()||!String(d.accountName||"").trim()||!String(d.accountNumber||"").trim())) throw new Error("Bank payment requires bank name, account name and account number.");
}
function tutorGetWallet_(d){
  const p=requireTutor_(d.tutorToken),w=findTutorWallet_(p.tutorId,p.tutorPhone),sh=getTutorPaymentHistorySheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),history=[];
  for(let i=rows.length-1;i>=1&&history.length<50;i--) if(String(rows[i][m.tutorId-1]||"")===String(p.tutorId||"")) history.push({paymentId:String(rows[i][m.paymentId-1]||""),amount:Number(rows[i][m.amount-1]||0),currency:String(rows[i][m.currency-1]||"KES"),method:String(rows[i][m.method-1]||""),paymentReference:String(rows[i][m.paymentReference-1]||""),paidAt:rows[i][m.paidAt-1]||"",note:String(rows[i][m.note-1]||"")});
  return json_({ok:true,wallet:w||null,paymentHistory:history});
}
function tutorSaveWallet_(d){
  const p=requireTutor_(d.tutorToken);validateWallet_(d);const sh=getTutorWalletSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);let row=0;
  for(let i=1;i<rows.length;i++)if(String(rows[i][m.tutorId-1]||"")===String(p.tutorId||"")){row=i+1;break;}
  const arr=[row?String(rows[row-1][m.walletId-1]||"WAL-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase()):"WAL-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),p.tutorId,p.tutorName,String(d.mobileProvider||"").trim(),normalizePhone_(d.mobileNumber||""),String(d.paypalEmail||"").trim(),String(d.payoneerEmail||"").trim(),String(d.bankName||"").trim(),String(d.accountName||"").trim(),String(d.accountNumber||"").trim(),String(d.branchCode||"").trim(),String(d.swiftCode||"").trim(),String(d.preferredMethod||"").toUpperCase(),new Date(),"ACTIVE"];
  if(!row)sh.appendRow(arr);else sh.getRange(row,1,1,arr.length).setValues([arr]);
  return json_({ok:true,wallet:walletRowToObject_(arr,m,row||sh.getLastRow())});
}
function adminListTutorWallets_(token){
  requireAdmin_(token);const sh=getTutorWalletSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=1;i<rows.length;i++)if(rows[i][m.tutorId-1])out.push(walletRowToObject_(rows[i],m,i+1));
  return json_({ok:true,wallets:out});
}


function getTutorWithdrawalSheet_(){
  const h=["withdrawalId","tutorId","tutorName","amount","currency","method","recipient","status","requestedAt","reviewedAt","paymentReference","adminUsername","adminNote"];
  return ensureColumns_(getSheet_("TUTOR_WITHDRAWALS",h),h);
}
function moneyCents_(value){
  const n=Number(value||0);
  if(!isFinite(n)) return 0;
  return Math.round(n*100);
}
function centsMoney_(cents){ return Math.max(0,Math.round(Number(cents||0)))/100; }
function tutorAvailableBalance_(tutorId,currency){
  const cur=String(currency||"KES").toUpperCase(),sh=getTutorPayoutSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh);
  let outstandingCents=0;
  for(let i=1;i<rows.length;i++) if(String(rows[i][m.tutorId-1]||"")===String(tutorId||"")&&String(rows[i][m.currency-1]||"KES").toUpperCase()===cur){
    const earnedCents=moneyCents_(rows[i][m.amount-1]),status=String(rows[i][m.status-1]||"OWED").toUpperCase();
    const paidCents=Math.min(earnedCents,status==="PAID"?earnedCents:moneyCents_(rows[i][m.paidAmount-1]));
    outstandingCents+=Math.max(0,earnedCents-paidCents);
  }
  const wsh=getTutorWithdrawalSheet_(),wr=wsh.getDataRange().getValues(),wm=headerMap_(wsh); let pendingCents=0;
  for(let i=1;i<wr.length;i++) if(String(wr[i][wm.tutorId-1]||"")===String(tutorId||"")&&String(wr[i][wm.currency-1]||"KES").toUpperCase()===cur&&String(wr[i][wm.status-1]||"").toUpperCase()==="PENDING"){
    pendingCents+=moneyCents_(wr[i][wm.amount-1]);
  }
  return centsMoney_(Math.max(0,outstandingCents-pendingCents));
}
function tutorWalletRecipient_(w,method){
  const m=String(method||w?.preferredMethod||"").toUpperCase();
  if(m==="MOBILE") return String(w?.mobileNumber||""); if(m==="PAYPAL") return String(w?.paypalEmail||""); if(m==="PAYONEER") return String(w?.payoneerEmail||""); if(m==="BANK") return String(w?.accountNumber||""); return "";
}
function tutorRequestWithdrawal_(d){
  const p=requireTutor_(d.tutorToken),amountCents=moneyCents_(d.amount),currency=String(d.currency||"KES").toUpperCase();
  if(amountCents<200000) throw new Error("Minimum tutor withdrawal is KSh 2,000.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const w=findTutorWallet_(p.tutorId,p.tutorPhone),method=String(d.method||w?.preferredMethod||"").toUpperCase(),recipient=tutorWalletRecipient_(w,method);
    if(!w||!method||!recipient) throw new Error("Complete your payment wallet details before requesting a withdrawal.");
    validateWallet_({preferredMethod:method,mobileProvider:w.mobileProvider,mobileNumber:w.mobileNumber,paypalEmail:w.paypalEmail,payoneerEmail:w.payoneerEmail,bankName:w.bankName,accountName:w.accountName,accountNumber:w.accountNumber,branchCode:w.branchCode,swiftCode:w.swiftCode});
    // Recalculate while holding the same lock used to create the request. This prevents
    // two simultaneous withdrawal requests from consuming the same eligible balance.
    const availableCents=moneyCents_(tutorAvailableBalance_(p.tutorId,currency));
    if(availableCents<200000) throw new Error("Your eligible balance is below the KSh 2,000 minimum withdrawal.");
    if(amountCents>availableCents) throw new Error("Withdrawal amount exceeds your eligible balance of KSh "+centsMoney_(availableCents).toFixed(2)+".");
    const sh=getTutorWithdrawalSheet_(),id="WD-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase();
    sh.appendRow([id,p.tutorId,p.tutorName,centsMoney_(amountCents),currency,method,recipient,"PENDING",new Date(),"","","",""]);
    const remaining=tutorAvailableBalance_(p.tutorId,currency);
    return json_({ok:true,withdrawalId:id,amount:centsMoney_(amountCents),currency,method,status:"PENDING",availableBalance:remaining,message:"Request sent successfully. Please wait up to 24 hours; your money will reflect in your added wallet."});
  }finally{lock.releaseLock();}
}
function tutorListWithdrawals_(d){
  const p=requireTutor_(d.tutorToken),sh=getTutorWithdrawalSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=rows.length-1;i>=1&&out.length<50;i--) if(String(rows[i][m.tutorId-1]||"")===String(p.tutorId||"")) out.push({withdrawalId:String(rows[i][m.withdrawalId-1]||""),amount:Number(rows[i][m.amount-1]||0),currency:String(rows[i][m.currency-1]||"KES"),method:String(rows[i][m.method-1]||""),status:String(rows[i][m.status-1]||"PENDING"),requestedAt:rows[i][m.requestedAt-1]||"",reviewedAt:rows[i][m.reviewedAt-1]||"",paymentReference:String(rows[i][m.paymentReference-1]||""),adminNote:String(rows[i][m.adminNote-1]||"")});
  return json_({ok:true,withdrawals:out,availableBalance:tutorAvailableBalance_(p.tutorId,"KES"),minimumWithdrawal:2000});
}
function adminListTutorWithdrawals_(token){
  requireAdmin_(token); const sh=getTutorWithdrawalSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),out=[];
  for(let i=rows.length-1;i>=1&&out.length<200;i--) if(rows[i][m.withdrawalId-1]){
    const tutorId=String(rows[i][m.tutorId-1]||""),tutorName=String(rows[i][m.tutorName-1]||""),wallet=findTutorWallet_(tutorId,"");
    out.push({row:i+1,withdrawalId:String(rows[i][m.withdrawalId-1]),tutorId:tutorId,tutorName:tutorName,amount:Number(rows[i][m.amount-1]||0),currency:String(rows[i][m.currency-1]||"KES"),method:String(rows[i][m.method-1]||""),recipient:String(rows[i][m.recipient-1]||""),status:String(rows[i][m.status-1]||"PENDING").toUpperCase(),requestedAt:rows[i][m.requestedAt-1]||"",reviewedAt:rows[i][m.reviewedAt-1]||"",paymentReference:String(rows[i][m.paymentReference-1]||""),adminUsername:String(rows[i][m.adminUsername-1]||""),adminNote:String(rows[i][m.adminNote-1]||""),wallet:wallet||null});
  }
  return json_({ok:true,withdrawals:out});
}
function adminPayTutorWithdrawal_(d){
  requireAdmin_(d.adminToken); const profile=getAdminProfile_(d.adminToken),id=String(d.withdrawalId||"").trim(),reference=String(d.paymentReference||"").trim(); if(!id||!reference) throw new Error("Withdrawal and payment reference are required.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sh=getTutorWithdrawalSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh); let row=-1,obj=null;
    for(let i=1;i<rows.length;i++) if(String(rows[i][m.withdrawalId-1]||"")===id){row=i+1;obj={tutorId:String(rows[i][m.tutorId-1]||""),tutorName:String(rows[i][m.tutorName-1]||""),amount:Number(rows[i][m.amount-1]||0),currency:String(rows[i][m.currency-1]||"KES"),method:String(rows[i][m.method-1]||""),recipient:String(rows[i][m.recipient-1]||""),status:String(rows[i][m.status-1]||"PENDING").toUpperCase()};break;}
    if(row<0)throw new Error("Withdrawal request not found.");
    if(obj.status!=="PENDING"){
      if(obj.status==="PAID") return json_({ok:true,withdrawalId:id,status:"PAID",amount:obj.amount,currency:obj.currency,tutorName:obj.tutorName,remainingBalance:tutorAvailableBalance_(obj.tutorId,obj.currency),alreadyPaid:true});
      throw new Error("This withdrawal is already "+obj.status+".");
    }
    // A payment reference may only settle one withdrawal. This makes retries safe.
    const ph=getTutorPaymentHistorySheet_(),prh=ph.getDataRange().getValues(),phm=headerMap_(ph);
    for(let i=1;i<prh.length;i++) if(String(prh[i][phm.paymentReference-1]||"").trim()===reference) throw new Error("This payment reference has already been recorded. Use a unique reference.");
    const existingPayoutRows=getTutorPayoutSheet_().getDataRange().getValues();for(let i=1;i<existingPayoutRows.length;i++) if(String(existingPayoutRows[i][10]||"").trim()===reference) throw new Error("This payment reference has already been recorded in a tutor payout. Use a unique reference.");
    const available=tutorAvailableBalance_(obj.tutorId,obj.currency)+obj.amount; if(obj.amount>available)throw new Error("This withdrawal can no longer be paid because the tutor's available balance is insufficient.");
    setByHeader_(sh,row,"status","PAID");setByHeader_(sh,row,"reviewedAt",new Date());setByHeader_(sh,row,"paymentReference",reference);try{baCacheRemove_('BA_PAYMENT_'+String(p.requestId));baCacheRemove_('BA_PAYMENTS_'+String(p.conversationId));}catch(e){}setByHeader_(sh,row,"adminUsername",String(profile.username||""));setByHeader_(sh,row,"adminNote",String(d.adminNote||"Paid manually by Admin."));
    const ps=getTutorPayoutSheet_(),pr=ps.getDataRange().getValues(); let left=obj.amount;
    for(let i=1;i<pr.length&&left>0;i++) if(String(pr[i][1]||"")===obj.tutorId&&String(pr[i][6]||"KES").toUpperCase()===obj.currency){const earned=Number(pr[i][5]||0),status=String(pr[i][7]||"OWED").toUpperCase(),already=Math.min(earned,status==="PAID"?earned:Number(pr[i][12]||0)),remaining=Math.max(0,earned-already);if(remaining<=0)continue;const pay=Math.min(remaining,left),newPaid=already+pay,newRemaining=earned-newPaid;ps.getRange(i+1,8).setValue(newRemaining<=0?"PAID":"PARTIALLY_PAID");ps.getRange(i+1,10).setValue(newRemaining<=0?new Date():pr[i][9]||"");ps.getRange(i+1,11).setValue(reference);ps.getRange(i+1,12).setValue("Withdrawal "+id);ps.getRange(i+1,13).setValue(newPaid);ps.getRange(i+1,14).setValue(newRemaining);left=Math.round((left-pay)*100)/100;}
    ph.appendRow(["TP-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),obj.tutorId,obj.tutorName,obj.amount,obj.currency,obj.method,obj.recipient,reference,new Date(),"Tutor withdrawal "+id,String(profile.username||"")]);
    const tutorPhone=normalizePhone_(findTutorPhoneById_(obj.tutorId)||""); if(tutorPhone) try{CacheService.getScriptCache().remove("BA_TUTOR_DASH_"+tutorPhone)}catch(e){}
    return json_({ok:true,withdrawalId:id,status:"PAID",amount:obj.amount,currency:obj.currency,tutorName:obj.tutorName,remainingBalance:tutorAvailableBalance_(obj.tutorId,obj.currency)});
  }finally{lock.releaseLock();}
}
function getTutorPayoutSheet_(){
  return ensureColumns_(getSheet_("TUTOR_PAYOUTS",["payoutId","tutorId","tutorName","workId","paymentRequestId","amount","currency","status","createdAt","paidAt","paymentReference","note","paidAmount","remainingAmount"]),["payoutId","tutorId","tutorName","workId","paymentRequestId","amount","currency","status","createdAt","paidAt","paymentReference","note","paidAmount","remainingAmount"]);
}
function findPaidPaymentForConversation_(conversationId){
  const sh=getPaymentSheet_(),last=sh.getLastRow();if(last<2)return null;const m=headerMap_(sh),cells=sh.getRange(2,m.conversationId,last-1,1).createTextFinder(String(conversationId)).matchEntireCell(true).useRegularExpression(false).findAll();
  for(let i=cells.length-1;i>=0;i--){const row=cells[i].getRow(),p=rowPayment_(sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],row);if(String(p.status||"").toUpperCase()==="PAID")return p;}return null;
}

function findPayoutForWork_(workId){
  const sh=getTutorPayoutSheet_(),last=sh.getLastRow();if(last<2)return null;const cell=sh.getRange(2,4,last-1,1).createTextFinder(String(workId)).matchEntireCell(true).useRegularExpression(false).findNext();if(!cell)return null;return {row:cell.getRow(),values:sh.getRange(cell.getRow(),1,1,sh.getLastColumn()).getValues()[0]};
}

function adminMarkWorkCompleted_(d){
  requireAdmin_(d.adminToken);
  const c=findConversation_(d.conversationId); if(!c) throw new Error("Student request not found.");
  if(!c.assignedTutor || c.assignedTutor==="Unassigned") throw new Error("Assign the work to a tutor first.");
  if(String(c.qaStatus||"PENDING").toUpperCase()!=="APPROVED") throw new Error("Admin QA approval is required before this work can be completed.");
  if(!String(c.clientFeedback||"").trim()) throw new Error("Client satisfaction/feedback is required before final completion.");
  const paid=findPaidPaymentForConversation_(c.conversationId); if(!paid) throw new Error("The student payment must be confirmed as PAID before this work can be completed.");
  if(String(c.assignmentStatus).toUpperCase()==="COMPLETED") return json_({ok:true,workId:c.conversationId,status:"COMPLETED",tutor:c.assignedTutor,tutorPayout:Number(c.tutorPayout||0),currency:c.agreedCurrency||c.currency,alreadyCompleted:true});
  if(String(c.assignmentStatus).toUpperCase()==="REJECTED") throw new Error("Rejected work cannot be completed.");
  const amount=Number(c.agreedAmount||paid.amount||c.studentBudget||0),currency=String(c.agreedCurrency||paid.currency||c.currency||"KES").toUpperCase(),tutorPayout=Math.round(amount*0.50*100)/100;
  const existing=findPayoutForWork_(c.conversationId);
  if(!existing){
    const tutors=getTutorSheet_(),rows=tutors.getDataRange().getValues(); let tutorId="";
    for(let i=1;i<rows.length;i++) if(String(rows[i][1]||"")===String(c.assignedTutor)) tutorId=String(rows[i][0]||"");
    getTutorPayoutSheet_().appendRow(["PAY-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),tutorId,c.assignedTutor,c.conversationId,paid.requestId,tutorPayout,currency,"OWED",new Date(),"","",""]);
  }
  const csh=getConversationSheet_();setByHeader_(csh,c.row,"assignmentStatus","COMPLETED");setByHeader_(csh,c.row,"status","closed");setByHeader_(csh,c.row,"completedAt",new Date());
  invalidateWorkCaches_(c.conversationId,c.assignedTutorPhone,c.assignedTutorPhone,c.studentPhone);
  return json_({ok:true,workId:c.conversationId,status:"COMPLETED",tutor:c.assignedTutor,tutorPayout:tutorPayout,currency:currency});
}
function adminRejectWork_(d){
  requireAdmin_(d.adminToken); const c=findConversation_(d.conversationId); if(!c) throw new Error("Student request not found.");
  const reason=String(d.reason||"").trim(); if(!reason) throw new Error("Please provide a rejection reason.");
  const sh=getConversationSheet_();setByHeader_(sh,c.row,"assignmentStatus","REJECTED");setByHeader_(sh,c.row,"status","closed");setByHeader_(sh,c.row,"rejectedAt",new Date());setByHeader_(sh,c.row,"rejectionReason",reason);
  const msg="We’re sorry, but BrightAce cannot take this request forward at this time. Reason: "+reason;
  const saved=saveMessage_(c.conversationId,"admin",msg,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(normalizePhone_(c.studentPhone),"BrightAce Admin:\n\n"+msg)}catch(e){console.error(e)}
  invalidateWorkCaches_(c.conversationId,c.assignedTutorPhone,c.assignedTutorPhone,c.studentPhone);
  return json_({ok:true,workId:c.conversationId,status:"REJECTED",reason:reason});
}
function adminRestoreWork_(d){
  requireAdmin_(d.adminToken); const c=findConversation_(d.conversationId); if(!c) throw new Error("Student request not found.");
  const sh=getConversationSheet_(); setByHeader_(sh,c.row,"status","open"); setByHeader_(sh,c.row,"assignmentStatus","NEW_REQUEST"); setByHeader_(sh,c.row,"completedAt",""); setByHeader_(sh,c.row,"rejectedAt",""); setByHeader_(sh,c.row,"rejectionReason","");
  const saved=saveMessage_(c.conversationId,"admin","This BrightAce request has been restored to the active work queue.","admin",null); updateConversation_(c.conversationId,new Date(),saved.id);
  try{sendWhatsAppText_(normalizePhone_(c.studentPhone),"BrightAce Admin:\\n\\nYour BrightAce request has been restored to the active work queue. Admin will review the next step with you.")}catch(e){console.error(e)}
  invalidateWorkCaches_(c.conversationId,c.assignedTutorPhone,c.assignedTutorPhone,c.studentPhone);
  return json_({ok:true,workId:c.conversationId,status:"NEW_REQUEST"});
}

function adminListWorkAssignments_(token,fresh){
  requireAdmin_(token);const ck="BA_ADMIN_WORK_ASSIGNMENTS";fresh=fresh===true;try{const hit=CacheService.getScriptCache().get(ck);if(!fresh&&hit)return json_({ok:true,works:safeJson_(hit)||[]})}catch(e){}
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

function adminDeleteWorkHistory_(d){
  requireSuperAdmin_(d.adminToken);
  const id=String(d.conversationId||"").trim();
  if(!id)throw new Error("Work ID is required.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const csh=getConversationSheet_(),rows=csh.getDataRange().getValues(),m=headerMap_(csh);let row=0;
    for(let i=1;i<rows.length;i++)if(String(rows[i][m.conversationId-1]||"")===id){row=i+1;break;}
    if(!row)throw new Error("Request not found.");
    const deletedClientPhone=normalizePhone_(rows[row-1][m.studentPhone-1]||"");
    const status=m.assignmentStatus?String(rows[row-1][m.assignmentStatus-1]||"").toUpperCase():"";
    if(status!=="COMPLETED"&&status!=="REJECTED")throw new Error("Only completed or rejected history can be permanently deleted from Admin History.");
    // Preserve financial records; remove the request and its chat history only.
    const msh=getSheet_("MESSAGES",messageHeaders_()),mr=msh.getDataRange().getValues(),mm=headerMap_(msh);
    for(let i=mr.length-1;i>=1;i--)if(String(mr[i][mm.conversationId-1]||"")===id){const a=mm.attachmentJson?safeJson_(mr[i][mm.attachmentJson-1]||""):null;try{(Array.isArray(a)?a:(a?[a]:[])).forEach(x=>{if(x&&x.fileId)DriveApp.getFileById(String(x.fileId)).setTrashed(true)})}catch(e){}msh.deleteRow(i+1);}
    const ssh=getScheduleSheet_(),sr=ssh.getDataRange().getValues();for(let i=sr.length-1;i>=1;i--)if(String(sr[i][1]||"")===id)ssh.deleteRow(i+1);
    csh.deleteRow(row);
    baInvalidateClientRequestHistory_(deletedClientPhone);
    try{CacheService.getScriptCache().remove("BA_CONV_"+id);CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_ASSIGNMENTS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");CacheService.getScriptCache().remove("BA_ADMIN_QUALITY")}catch(e){}
    auditAdmin_(d.adminToken,"DELETE_WORK_HISTORY",id);
    return json_({ok:true,deleted:true,conversationId:id});
  }finally{try{lock.releaseLock()}catch(e){}}
}
function adminListWorkHistory_(token,fresh){
  requireAdmin_(token);
  fresh=fresh===true;

  /*
   * V46 HISTORY FAST PATH
   * - Do not use TextFinder/findAll() to discover the last row.
   * - Do not return rowConversation_() because it contains verification/session
   *   fields that History never needs.
   * - Prefer a compact short-lived cache on normal page loads.
   * - A manual Refresh can request fresh=true.
   * - Read CONVERSATIONS in bounded chunks so a malformed/oversized sheet does
   *   not create one giant Apps Script matrix.
   */
  const ck="BA_ADMIN_WORK_HISTORY_V46";
  if(!fresh){
    try{
      const cached=baHistoryCacheGet_();
      if(cached&&Array.isArray(cached.works)){
        return json_({ok:true,works:cached.works,pending:cached.pending,completed:cached.completed,rejected:cached.rejected,total:cached.works.length,cached:true,build:BRIGHTACE_BUILD});
      }
    }catch(e){console.error("History cache read failed: "+String(e&&e.message||e));}
  }

  const sh=getConversationSheet_();
  const m=headerMap_(sh);
  if(!m.conversationId) throw new Error("CONVERSATIONS is missing the conversationId column.");

  const lastRow=Math.max(1,sh.getLastRow());
  if(lastRow<2){
    const empty={works:[],pending:[],completed:[],rejected:[]};
    baHistoryCachePut_(empty);
    return json_({ok:true,...empty,total:0,scannedRows:0,cached:false,build:BRIGHTACE_BUILD});
  }

  const lastCol=Math.max(1,sh.getLastColumn());
  const out=[];
  const CHUNK=400;

  for(let chunkStart=2;chunkStart<=lastRow;chunkStart+=CHUNK){
    const chunkRows=Math.min(CHUNK,lastRow-chunkStart+1);
    const values=sh.getRange(chunkStart,1,chunkRows,lastCol).getValues();

    for(let j=0;j<values.length;j++){
      const sheetRow=chunkStart+j;
      try{
        const r=values[j];
        const id=String(r[m.conversationId-1]||"").trim();
        if(!id) continue;

        const c=baHistoryRecord_(r,sheetRow,m);

        /*
         * History classification deliberately recognizes legacy spellings and
         * audit timestamps. This prevents old records from disappearing just
         * because their assignmentStatus was written differently.
         */
        const rawAssignment=String(c.assignmentStatus||"").trim().toUpperCase().replace(/[\s-]+/g,"_");
        const rawStatus=String(c.status||"").trim().toUpperCase().replace(/[\s-]+/g,"_");

        let st=rawAssignment;
        if(["REJECTED","DECLINED","CANCELLED","CANCELED","FAILED"].indexOf(st)>=0 || c.rejectedAt || c.rejectionReason){
          st="REJECTED";
        }else if(["COMPLETED","DONE","FINISHED","COMPLETE","DELIVERED"].indexOf(st)>=0 || c.completedAt){
          st="COMPLETED";
        }else if(!st){
          st=rawStatus==="CLOSED" ? "CLOSED" : "NEW_REQUEST";
        }

        c.assignmentStatus=st;
        c.requestedAt=c.startedAt||"";
        c.isClosed=rawStatus==="CLOSED" || st==="COMPLETED" || st==="REJECTED";
        out.push(c);
      }catch(rowErr){
        console.error("V46 History skipped CONVERSATIONS row "+sheetRow+": "+String(rowErr&&rowErr.message||rowErr));
      }
    }
  }

  // Newest records first, matching the rest of the Admin workspace.
  out.sort(function(a,b){
    const ta=new Date(a.lastMessageAt||a.completedAt||a.rejectedAt||a.startedAt||0).getTime();
    const tb=new Date(b.lastMessageAt||b.completedAt||b.rejectedAt||b.startedAt||0).getTime();
    return (isFinite(tb)?tb:0)-(isFinite(ta)?ta:0);
  });

  const completed=out.filter(isHistoryCompleted_);
  const rejected=out.filter(isHistoryRejected_);
  const pending=out.filter(isHistoryPending_);

  const payload={works:out,pending:pending,completed:completed,rejected:rejected};
  baHistoryCachePut_(payload);

  return json_({
    ok:true,
    works:out,
    pending:pending,
    completed:completed,
    rejected:rejected,
    total:out.length,
    scannedRows:lastRow-1,
    cached:false,
    build:BRIGHTACE_BUILD
  });
}

function historyState_(x){
  return String(x&&x.assignmentStatus||x&&x.status||"").toUpperCase().replace(/[\s-]+/g,"_");
}
function isHistoryCompleted_(x){
  return ["COMPLETED","DONE","FINISHED","COMPLETE","DELIVERED"].indexOf(historyState_(x))>=0;
}
function isHistoryRejected_(x){
  return ["REJECTED","DECLINED","CANCELLED","CANCELED","FAILED"].indexOf(historyState_(x))>=0;
}
function isHistoryPending_(x){
  const st=historyState_(x);
  return !isHistoryCompleted_(x) && !isHistoryRejected_(x) && String(x&&x.status||"").toLowerCase()!=="closed";
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
  const csh=getConversationSheet_(),cm=headerMap_(csh),works=[],assignedIds=new Set(),assignedRows=[];
  const tutorCol=cm.assignedTutorPhone, tutorNameCol=cm.assignedTutor;
  if(tutorCol){
    const last=csh.getLastRow();
    if(last>1)csh.getRange(2,tutorCol,last-1,1).createTextFinder(String(tutor.tutorPhone)).matchEntireCell(true).useRegularExpression(false).findAll().forEach(cell=>assignedRows.push(cell.getRow()));
  }
  if(tutor.tutorId==="PRIMARY" && tutorNameCol){
    const last=csh.getLastRow();
    if(last>1)csh.getRange(2,tutorNameCol,last-1,1).createTextFinder(String(tutor.tutorName)).matchEntireCell(true).useRegularExpression(false).findAll().forEach(cell=>assignedRows.push(cell.getRow()));
  }
  const uniqueRows=[...new Set(assignedRows)].sort((a,b)=>a-b),rows=uniqueRows.length?uniqueRows.map(r=>({r,values:csh.getRange(r,1,1,csh.getLastColumn()).getValues()[0]})):[];
  rows.forEach(x=>{const c=rowConversation_(x.values,x.r,csh,cm);const assigned=normalizePhone_(c.assignedTutorPhone)===tutor.tutorPhone || (tutor.tutorId==="PRIMARY" && c.assignedTutor===tutor.tutorName && !c.assignedTutorPhone);if(assigned)assignedIds.add(c.conversationId);});
  const msh=getSheet_("MESSAGES",messageHeaders_()),mm=headerMap_(msh),msgMap={},docMap={},messageCidCol=mm.conversationId;
  if(msh.getLastRow()>1 && messageCidCol){
    const allMsgRows=msh.getRange(2,1,msh.getLastRow()-1,msh.getLastColumn()).getValues();
    allMsgRows.forEach(row=>{
      const cid=String(row[messageCidCol-1]||"");if(!assignedIds.has(cid))return;
      const a=mm.attachmentJson?safeJson_(row[mm.attachmentJson-1]||""):null;
      const item={id:String(row[mm.messageId-1]||""),sessionId:cid,sender:String(row[mm.sender-1]||""),text:String(row[mm.text-1]||""),source:String(row[mm.source-1]||""),timestamp:row[mm.timestamp-1],status:String(row[mm.status-1]||"received"),attachment:a?hydrateAttachment_(a):null,senderName:mm.senderName?String(row[mm.senderName-1]||""):"",senderPhone:mm.senderPhone?String(row[mm.senderPhone-1]||""):""};
      (msgMap[cid]||(msgMap[cid]=[])).push(item);
      if(a)(Array.isArray(a)?a:[a]).forEach(x=>{const h=hydrateAttachment_(x);if(h)(docMap[cid]||(docMap[cid]=[])).push(Object.assign({messageId:item.id,sender:item.sender,timestamp:item.timestamp},h))});
    });
  }
  for(let i=0;i<rows.length;i++){
    const c=rowConversation_(rows[i].values,rows[i].r,csh,cm);if(!assignedIds.has(c.conversationId))continue;
    const messages=(msgMap[c.conversationId]||[]).slice(-100),clientVisibleMessages=messages.filter(m=>["student","tutor"].includes(String(m.sender||"").toLowerCase()) && String(m.source||"").toLowerCase()!=="admin" && String(m.source||"").toLowerCase()!=="whatsapp"),adminClientMessages=messages.filter(m=>["admin","student"].includes(String(m.sender||"").toLowerCase()) && String(m.source||"").toLowerCase()!=="work-comment" && String(m.source||"").toLowerCase()!=="whatsapp"),docs=(docMap[c.conversationId]||[]).slice(-100),pay=getTutorPaymentView_(c.conversationId,tutor.tutorPhone);
    works.push({
      conversationId:c.conversationId,studentName:c.studentName,studentPhone:c.studentPhone,
      workDescription:c.workDescription,deadline:c.deadline,assignmentStatus:c.assignmentStatus||"NEW_REQUEST",
      tutorWorkStatus:c.tutorWorkStatus||"",qaStatus:c.qaStatus||"PENDING",
      paymentStatus:pay.paymentStatus,tutorPayout:pay.tutorPayout,payoutStatus:pay.payoutStatus,
      startedAt:c.startedAt,lastMessageAt:c.lastMessageAt,documents:docs,messages:messages,clientVisibleMessages:clientVisibleMessages,adminClientMessages:adminClientMessages,
      clientFeedback:c.clientFeedback||"",clientFeedbackAt:c.clientFeedbackAt||""
    });
  }
  tutor=Object.assign({profilePictureUrl:"",description:"",tutorDisplayName:tutor.tutorName||"Tutor",tutorName:"Tutor",tutorPhone:"",status:"ACTIVE"},tutor);
  const tmessages=tutor.tutorPhone?getTutorMessagesForAdminPreview_(tutor.tutorPhone):[];
  const availability=getTutorAvailability_(tutor.tutorPhone);
  const wallet=findTutorWallet_(tutor.tutorId,tutor.tutorPhone);
  const wsh=getTutorWithdrawalSheet_(),wr=wsh.getDataRange().getValues(),wm=headerMap_(wsh),withdrawals=[];
  for(let i=wr.length-1;i>=1&&withdrawals.length<20;i--) if(String(wr[i][wm.tutorId-1]||"")===String(tutor.tutorId||"")) withdrawals.push({withdrawalId:String(wr[i][wm.withdrawalId-1]||""),amount:Number(wr[i][wm.amount-1]||0),currency:String(wr[i][wm.currency-1]||"KES"),method:String(wr[i][wm.method-1]||""),status:String(wr[i][wm.status-1]||"PENDING"),requestedAt:wr[i][wm.requestedAt-1]||"",paymentReference:String(wr[i][wm.paymentReference-1]||"")});
  return json_({ok:true,tutor:tutor,works:works,tutorAdminMessages:tmessages,wallet:wallet,availableBalance:tutorAvailableBalance_(tutor.tutorId,"KES"),withdrawals:withdrawals});
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
function adminListTutorEarningsDetails_(token){
  requireAdmin_(token);
  // Reconcile legacy paid work first so the Admin earnings page reflects every
  // qualifying completed/paid assignment, including records created before the
  // tutor payout automation was installed.
  try{
    const csh=getConversationSheet_(),cr=csh.getDataRange().getValues(),cm=headerMap_(csh);
    const psh=getPaymentSheet_(),pr=psh.getDataRange().getValues(),paidMap={};
    for(let i=1;i<pr.length;i++){
      const pp=rowPayment_(pr[i],i+1);
      if(pp.conversationId&&String(pp.status||"").toUpperCase()==="PAID"&&!paidMap[pp.conversationId]) paidMap[pp.conversationId]=pp;
    }
    for(let i=1;i<cr.length;i++){
      const c=rowConversation_(cr[i],i+1,csh,cm);
      if(c.conversationId&&c.assignedTutor&&c.assignedTutor!=="Unassigned"&&paidMap[c.conversationId]&&!findPayoutForWork_(c.conversationId)) ensureTutorPayoutRecordForPaidWork_(c.conversationId,paidMap[c.conversationId]);
    }
  }catch(e){console.error("Tutor earnings detail reconciliation failed: "+e)}

  const payoutSh=getTutorPayoutSheet_(), payoutRows=payoutSh.getDataRange().getValues(), payoutMap=headerMap_(payoutSh);
  const historySh=getTutorPaymentHistorySheet_(), historyRows=historySh.getDataRange().getValues(), historyMap=headerMap_(historySh);
  const withdrawalSh=getTutorWithdrawalSheet_(), withdrawalRows=withdrawalSh.getDataRange().getValues(), withdrawalMap=headerMap_(withdrawalSh);
  const conversationSh=getConversationSheet_(), conversationRows=conversationSh.getDataRange().getValues(), conversationMap=headerMap_(conversationSh);
  const paymentSh=getPaymentSheet_(), paymentRows=paymentSh.getDataRange().getValues();
  const walletsSh=getTutorWalletSheet_(), walletRows=walletsSh.getDataRange().getValues(), walletMap=headerMap_(walletsSh);

  const paymentsByRequest={};
  for(let i=1;i<paymentRows.length;i++){
    const pp=rowPayment_(paymentRows[i],i+1);
    if(pp.requestId) paymentsByRequest[String(pp.requestId)]={requestId:pp.requestId,status:String(pp.status||"").toUpperCase(),amount:Number(pp.amount||0),currency:String(pp.currency||"KES").toUpperCase(),createdAt:pp.createdAt||"",paidAt:pp.paidAt||""};
  }
  const conversationsById={};
  for(let i=1;i<conversationRows.length;i++){
    const c=rowConversation_(conversationRows[i],i+1,conversationSh,conversationMap);
    if(c.conversationId) conversationsById[c.conversationId]=c;
  }
  const walletsByTutor={};
  for(let i=1;i<walletRows.length;i++) if(walletRows[i][walletMap.tutorId-1]) walletsByTutor[String(walletRows[i][walletMap.tutorId-1])]=walletRowToObject_(walletRows[i],walletMap,i+1);

  const payouts=[],balances={};
  for(let i=payoutRows.length-1;i>=1;i--){
    const r=payoutRows[i],tutorId=String(r[payoutMap.tutorId-1]||""),name=String(r[payoutMap.tutorName-1]||""),currency=String(r[payoutMap.currency-1]||"KES").toUpperCase();
    if(!r[payoutMap.payoutId-1]) continue;
    const earned=Number(r[payoutMap.amount-1]||0),status=String(r[payoutMap.status-1]||"OWED").toUpperCase(),paid=status==="PAID"?earned:Number(r[payoutMap.paidAmount-1]||0),remaining=Math.max(0,earned-paid),workId=String(r[payoutMap.workId-1]||""),req=String(r[payoutMap.paymentRequestId-1]||"");
    const c=conversationsById[workId]||{};
    payouts.push({payoutId:String(r[payoutMap.payoutId-1]||""),tutorId,tutorName:name,workId,paymentRequestId:req,amount:earned,currency,status,createdAt:r[payoutMap.createdAt-1]||"",paidAt:r[payoutMap.paidAt-1]||"",paymentReference:String(r[payoutMap.paymentReference-1]||""),note:String(r[payoutMap.note-1]||""),paidAmount:Math.min(earned,paid),remainingAmount:remaining,work:{studentName:String(c.studentName||""),description:String(c.workDescription||""),assignmentStatus:String(c.assignmentStatus||""),completedAt:c.completedAt||"",agreedAmount:Number(c.agreedAmount||0),agreedCurrency:String(c.agreedCurrency||currency).toUpperCase()}});
    const key=name+"|"+currency;
    if(!balances[key]) balances[key]={tutorId,tutorName:name,currency,works:0,totalEarned:0,totalPaid:0,balance:0};
    balances[key].works++;balances[key].totalEarned+=earned;balances[key].totalPaid+=Math.min(earned,paid);balances[key].balance+=remaining;
  }
  const paymentHistory=[];
  for(let i=historyRows.length-1;i>=1&&paymentHistory.length<500;i--){
    const r=historyRows[i]; if(!r[historyMap.paymentId-1]) continue;
    paymentHistory.push({paymentId:String(r[historyMap.paymentId-1]||""),tutorId:String(r[historyMap.tutorId-1]||""),tutorName:String(r[historyMap.tutorName-1]||""),amount:Number(r[historyMap.amount-1]||0),currency:String(r[historyMap.currency-1]||"KES").toUpperCase(),method:String(r[historyMap.method-1]||""),recipient:String(r[historyMap.recipient-1]||""),paymentReference:String(r[historyMap.paymentReference-1]||""),paidAt:r[historyMap.paidAt-1]||"",note:String(r[historyMap.note-1]||""),adminUsername:String(r[historyMap.adminUsername-1]||"")});
  }
  const withdrawals=[];
  for(let i=withdrawalRows.length-1;i>=1&&withdrawals.length<500;i--){
    const r=withdrawalRows[i]; if(!r[withdrawalMap.withdrawalId-1]) continue;
    const tutorId=String(r[withdrawalMap.tutorId-1]||"");
    withdrawals.push({row:i+1,withdrawalId:String(r[withdrawalMap.withdrawalId-1]||""),tutorId,tutorName:String(r[withdrawalMap.tutorName-1]||""),amount:Number(r[withdrawalMap.amount-1]||0),currency:String(r[withdrawalMap.currency-1]||"KES").toUpperCase(),method:String(r[withdrawalMap.method-1]||""),recipient:String(r[withdrawalMap.recipient-1]||""),status:String(r[withdrawalMap.status-1]||"PENDING").toUpperCase(),requestedAt:r[withdrawalMap.requestedAt-1]||"",reviewedAt:r[withdrawalMap.reviewedAt-1]||"",paymentReference:String(r[withdrawalMap.paymentReference-1]||""),adminUsername:String(r[withdrawalMap.adminUsername-1]||""),adminNote:String(r[withdrawalMap.adminNote-1]||""),wallet:walletsByTutor[tutorId]||null});
  }
  Object.keys(balances).forEach(k=>{const x=balances[k];x.totalEarned=Math.round(x.totalEarned*100)/100;x.totalPaid=Math.round(x.totalPaid*100)/100;x.balance=Math.round(x.balance*100)/100});
  return json_({ok:true,balances:Object.values(balances),payouts,paymentHistory,withdrawals,wallets:Object.values(walletsByTutor),generatedAt:new Date().toISOString()});
}
function adminMarkTutorBalancePaid_(d){
  requireAdmin_(d.adminToken); const tutorName=String(d.tutorName||"").trim(),currency=String(d.currency||"KES").toUpperCase(),reference=String(d.paymentReference||"").trim(),note=String(d.note||"").trim();
  const requested=Number(d.amount); if(!tutorName)throw new Error("Tutor is required."); if(!reference)throw new Error("Payment reference is required.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
  const ph=getTutorPaymentHistorySheet_(),phr=ph.getDataRange().getValues(),phm=headerMap_(ph);
  for(let i=1;i<phr.length;i++)if(String(phr[i][phm.paymentReference-1]||"").trim()===reference)throw new Error("This payment reference has already been recorded. Use a unique reference.");
  const existingPayoutRows=getTutorPayoutSheet_().getDataRange().getValues();
  for(let i=1;i<existingPayoutRows.length;i++)if(String(existingPayoutRows[i][10]||"").trim()===reference)throw new Error("This payment reference has already been recorded in a tutor payout. Use a unique reference.");
  const sh=getTutorPayoutSheet_();ensureColumns_(sh,["payoutId","tutorId","tutorName","workId","paymentRequestId","amount","currency","status","createdAt","paidAt","paymentReference","note","paidAmount","remainingAmount"]);const rows=sh.getDataRange().getValues();let outstanding=0;
  for(let i=1;i<rows.length;i++)if(String(rows[i][2]||"")===tutorName&&String(rows[i][6]||"").toUpperCase()===currency){const earned=Number(rows[i][5]||0),status=String(rows[i][7]||"OWED").toUpperCase(),paid=status==="PAID"?earned:Number(rows[i][12]||0);outstanding+=Math.max(0,earned-paid)}
  outstanding=Math.round(outstanding*100)/100;if(outstanding<=0)throw new Error("This tutor has no outstanding balance in "+currency+".");
  let toPay=isFinite(requested)&&requested>0?Math.min(requested,outstanding):outstanding;toPay=Math.round(toPay*100)/100;let left=toPay;
  for(let i=1;i<rows.length&&left>0;i++)if(String(rows[i][2]||"")===tutorName&&String(rows[i][6]||"").toUpperCase()===currency){const earned=Number(rows[i][5]||0),status=String(rows[i][7]||"OWED").toUpperCase(),already=Math.min(earned,status==="PAID"?earned:Number(rows[i][12]||0)),remaining=Math.max(0,earned-already);if(remaining<=0)continue;const pay=Math.min(remaining,left),newPaid=already+pay,newRemaining=earned-newPaid;sh.getRange(i+1,8).setValue(newRemaining<=0?"PAID":"PARTIALLY_PAID");sh.getRange(i+1,10).setValue(newRemaining<=0?new Date():rows[i][9]||"");sh.getRange(i+1,11).setValue(reference);sh.getRange(i+1,12).setValue(note);sh.getRange(i+1,13).setValue(newPaid);sh.getRange(i+1,14).setValue(newRemaining);left=Math.round((left-pay)*100)/100;}
  const newBalance=Math.round((outstanding-toPay)*100)/100;
  const tutors=getTutorSheet_(),tr=tutors.getDataRange().getValues(),tm=headerMap_(tutors);let tutorId="";
  for(let i=1;i<tr.length;i++)if(String(tr[i][tm.tutorName-1]||"")===tutorName){tutorId=String(tr[i][tm.tutorId-1]||"");break;}
  const wallet=findTutorWallet_(tutorId,""),method=String(d.method||wallet?.preferredMethod||"OTHER").toUpperCase(),recipient=method==="MOBILE"?String(wallet?.mobileNumber||""):method==="PAYPAL"?String(wallet?.paypalEmail||""):method==="PAYONEER"?String(wallet?.payoneerEmail||""):method==="BANK"?String(wallet?.accountNumber||""):"";
  ph.appendRow(["TP-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),tutorId,tutorName,toPay,currency,method,recipient,reference,new Date(),note,String(getAdminProfile_(d.adminToken).username||"")]);
  const tutorPhone=normalizePhone_(findTutorPhoneById_(tutorId)||""); if(tutorPhone) try{CacheService.getScriptCache().remove("BA_TUTOR_DASH_"+tutorPhone)}catch(e){}
  return json_({ok:true,tutorName,currency,paidAmount:toPay,balance:newBalance,paymentReference:reference,method:method});
  }finally{lock.releaseLock();}
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
  requireAdmin_(d.adminToken);if(!d.conversationId)throw new Error("Select a student request.");if(!d.studentEmail)throw new Error("Student email is required for Paystack checkout.");if(!d.service)throw new Error("Service is required.");if(Number(d.amount)<=0)throw new Error("Amount must be greater than zero.");const currency=String(d.currency||"KES").toUpperCase();if(["KES","USD","EUR"].indexOf(currency)<0)throw new Error("Choose KES, USD or EUR.");if(currency==="EUR")throw new Error("EUR can be recorded as a BrightAce budget, but Paystack's Kenya integration currently supports KES and USD for direct checkout. Use KES or USD for a Paystack payment request.");const c=findConversation_(d.conversationId);if(!c)throw new Error("Student request not found.");const amount=Number(d.amount),tutorPayout=Math.round(amount*.50*100)/100,brightAce=Math.round(amount*.50*100)/100;const csh=getConversationSheet_();setByHeader_(csh,c.row,"agreedAmount",amount);setByHeader_(csh,c.row,"agreedCurrency",currency);setByHeader_(csh,c.row,"tutorPayout",tutorPayout);setByHeader_(csh,c.row,"brightAceShare",brightAce);setByHeader_(csh,c.row,"assignmentStatus",c.assignmentStatus==="ASSIGNED"?"ASSIGNED":"PAYMENT_PENDING");const sh=getPaymentSheet_(),now=new Date(),requestId="BA-REQ-"+Utilities.formatDate(now,Session.getScriptTimeZone()||"GMT","yyyyMMdd-HHmmss")+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,6).toUpperCase();sh.appendRow([requestId,c.conversationId,c.studentName,c.studentPhone,String(d.studentEmail).trim(),c.assignedTutor||"BrightAce Tutor",String(d.service).trim(),amount,currency,String(d.deliveryDeadline||c.deadline||"").trim(),"PENDING","","",now,"","NONE",0,"",String(d.description||c.workDescription||"").trim()]);const paymentUrl="https://kamaujames64-lgtm.github.io/brightace-academy/pages/payment.html?request="+encodeURIComponent(requestId);const paymentMessage="🛡️ BrightAce secure payment request\n\nService: "+String(d.service).trim()+"\nAmount: "+currency+" "+amount.toFixed(2)+(d.deliveryDeadline?"\nDelivery deadline: "+String(d.deliveryDeadline).trim():"")+"\n\nPay securely here:\n"+paymentUrl+"\n\nNever send payment directly to a tutor. This payment request is linked to your BrightAce conversation.";let whatsappSent=false;const saved=saveMessage_(c.conversationId,"admin",paymentMessage,"admin",null);updateConversation_(c.conversationId,new Date(),saved.id);if(d.sendWhatsApp===true)CacheService.getScriptCache().put("BA_PAYMENT_DELIVERY_"+requestId,JSON.stringify({conversationId:c.conversationId,phone:c.studentPhone,text:paymentMessage}),120);return json_({ok:true,paymentRequest:{requestId,conversationId:c.conversationId,studentName:c.studentName,studentPhone:c.studentPhone,studentEmail:String(d.studentEmail).trim(),tutor:c.assignedTutor||"BrightAce Tutor",service:String(d.service).trim(),description:String(d.description||c.workDescription||"").trim(),amount,currency,deliveryDeadline:String(d.deliveryDeadline||c.deadline||"").trim(),status:"PENDING",paymentUrl,whatsappSent,messageId:saved.id,whatsappQueued:d.sendWhatsApp===true,tutorPayout,brightAceShare:brightAce}})}

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
    baInvalidateClientRequestHistory_(from);
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
    try{CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_ASSIGNMENTS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");CacheService.getScriptCache().remove("BA_ADMIN_QUALITY");CacheService.getScriptCache().remove("BA_CONV_"+c.conversationId);}catch(e){}
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

function sendWhatsAppVerificationTemplate_(to,code){
  const cfg=metaConfig_();
  if(!cfg.token||!cfg.phoneId)return {skipped:true,reason:"WhatsApp credentials not configured"};
  // Keep verification delivery fast and compatible with the existing Meta setup.
  // If a configured verification template name exists, use it; otherwise use the existing text path.
  const props=PropertiesService.getScriptProperties(),templateName=String(props.getProperty("META_VERIFICATION_TEMPLATE_NAME")||"").trim();
  if(templateName){
    const url="https://graph.facebook.com/"+cfg.version+"/"+cfg.phoneId+"/messages";
    return graphPost_(url,{messaging_product:"whatsapp",to:to,type:"template",template:{name:templateName,language:{code:String(props.getProperty("META_VERIFICATION_TEMPLATE_LANGUAGE")||"en_US")},components:[{type:"body",parameters:[{type:"text",text:String(code)}]}]}},cfg.token);
  }
  return sendWhatsAppText_(to,"BrightAce Academy verification code: "+String(code)+". This code expires in 10 minutes.");
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

function validateUpload_(name,mime,size){
  const n=String(name||"").toLowerCase(),m=String(mime||"").toLowerCase(),blocked=/\.(exe|msi|bat|cmd|com|scr|js|mjs|cjs|html?|php|phtml|sh|bash|ps1|vbs|jar|apk|dmg|iso|dll|svg)$/i;
  if(blocked.test(n)||["application/javascript","text/javascript","application/x-msdownload","application/x-msdos-program","application/x-sh","text/html","image/svg+xml"].includes(m))throw new Error("This file type is not allowed for security reasons. Upload a PDF, Office document, image, audio or video instead.");
  if(Number(size||0)>CONFIG.maxFileBytes)throw new Error("Attachment is larger than 25 MB.");
}

function saveAttachment_(sessionId,a){
  if(!a.dataUrl) return null;
  const raw=String(a.dataUrl),parts=raw.split(","),header=String(parts[0]||""),encoded=String(parts.slice(1).join(",")||"");
  if(!/^data:[^;]+;base64$/i.test(header)||!encoded)throw new Error("Invalid attachment data.");
  const bytes=Utilities.base64Decode(encoded);
  if(bytes.length>CONFIG.maxFileBytes) throw new Error("Attachment is larger than 25 MB.");
  const mime=String(a.mimeType||header.slice(5,-7)||"application/octet-stream").toLowerCase();
  baThreatSecureUploadCheck_(a.name,mime,bytes);
  const safeName=String(a.name||"attachment").replace(/[^A-Za-z0-9._ -]/g,"_").slice(0,160)||"attachment";
  const blob=Utilities.newBlob(bytes,mime,safeName);
  return saveBlob_(blob,mime,safeName,sessionId);
}

function saveBlob_(blob,mime,name,sessionId){
  const folder=getDriveFolder_();
  const safeName=String(name||"attachment").replace(/[^A-Za-z0-9._ -]/g,"_").slice(0,160)||"attachment";
  const file=folder.createFile(blob).setName(safeName);
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
function sha256Hex_(value){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value||''),Utilities.Charset.UTF_8);
  return bytes.map(b=>{const n=b<0?b+256:b;return ('0'+n.toString(16)).slice(-2)}).join('');
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
  const sh=getConversationSheet_(),last=sh.getLastRow();if(last<2)return null;const m=headerMap_(sh),cell=sh.getRange(2,m.conversationId,last-1,1).createTextFinder(String(id)).matchEntireCell(true).useRegularExpression(false).findNext();
  if(!cell)return null;const row=cell.getRow(),obj=rowConversation_(sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],row,sh,m);try{CacheService.getScriptCache().put(key,JSON.stringify(obj),300)}catch(e){}return obj;
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
clientFeedbackAt:m.clientFeedbackAt?r[m.clientFeedbackAt-1]:"",clientRating:m.clientRating?Number(r[m.clientRating-1]||0):0};}
function findConversationByTutorPhone_(phone){
  const target=normalizePhone_(phone||"");if(!target)return null;
  const sh=getConversationSheet_(),rows=sh.getDataRange().getValues(),m=headerMap_(sh),props=PropertiesService.getScriptProperties(),primaryName=String(props.getProperty("PRIMARY_TUTOR_NAME")||"").trim(),primaryPhone=normalizePhone_(props.getProperty("PRIMARY_TUTOR_WHATSAPP")||"");
  for(let i=rows.length-1;i>=1;i--){if(String(rows[i][m.status-1]||"").toLowerCase()==="closed")continue;const assigned=normalizePhone_(rows[i][m.assignedTutorPhone-1]||"");if(assigned===target)return rowConversation_(rows[i],i+1,sh,m);const assignedName=String(rows[i][m.assignedTutor-1]||"").trim();if(!assigned&&primaryPhone&&target===primaryPhone&&primaryName&&assignedName===primaryName)return rowConversation_(rows[i],i+1,sh,m)}
  return null;
}
function updateConversation_(id,lastTime,lastMessageId){const c=findConversation_(id);if(!c)return;try{const phone=normalizePhone_(c.studentPhone);CacheService.getScriptCache().remove("BA_CLIENT_DASH_"+phone);CacheService.getScriptCache().remove("BA_CLIENT_MSGS_"+phone);baCacheRemove_('BA_SCHEDULES_'+String(id));baCacheRemove_('BA_PAYMENTS_'+String(id));if(c.assignedTutorPhone)CacheService.getScriptCache().remove("BA_TUTOR_DASH_"+normalizePhone_(c.assignedTutorPhone));}catch(e){}const sh=getConversationSheet_(),m=headerMap_(sh);sh.getRange(c.row,m.lastMessageAt,1,2).setValues([[lastTime,lastMessageId||""]]);c.lastMessageAt=lastTime;c.lastMessageId=lastMessageId||"";try{CacheService.getScriptCache().put("BA_CONV_"+String(id),JSON.stringify(c),300);CacheService.getScriptCache().remove("BA_ADMIN_CONVERSATIONS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_ASSIGNMENTS");CacheService.getScriptCache().remove("BA_ADMIN_WORK_HISTORY");CacheService.getScriptCache().remove("BA_ADMIN_QUALITY")}catch(e){}}

function updateMessageStatus_(s){
  if(!s.id)return;
  const sh=getSheet_("MESSAGES",messageHeaders_()),last=sh.getLastRow();if(last<2)return;
  const cell=sh.getRange(2,1,last-1,1).createTextFinder(String(s.id)).matchEntireCell(true).useRegularExpression(false).findNext();
  if(cell)sh.getRange(cell.getRow(),7).setValue(s.status||"sent");
}

function getSheet_(name,headers){
  const id=PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetIdKey);
  if(!id) throw new Error("Set SPREADSHEET_ID in Apps Script Script Properties.");
  const ss=SpreadsheetApp.openById(id); let sh=ss.getSheetByName(name);
  if(!sh)sh=ss.insertSheet(name); if(sh.getLastRow()===0)sh.appendRow(headers); return sh;
}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
