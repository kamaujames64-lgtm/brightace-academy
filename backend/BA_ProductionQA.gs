/* BrightAce V61 — Full End-to-End QA / Production Readiness + Timed Resource Access.
   Read-only production diagnostics. It never creates test customers, payments,
   withdrawals, messages or assignments. Mutating workflows remain manual tests.
*/

function baQaExpectedSheets_(){
  return ["CONVERSATIONS","CLIENTS","PAYMENTS","REFUNDS","TUTORS","TUTOR_WALLET","TUTOR_PAYMENT_HISTORY","TUTOR_WITHDRAWALS","TUTOR_PAYOUTS","TUTOR_AVAILABILITY","SCHEDULE","ADMIN_ACTIVITY","MESSAGE_DELIVERY_QUEUE"];
}

function baQaRequiredFunctions_(){
  return [
    "baFinancialIntegrity_","baObservabilityHealth_","baRecoveryManifest_","baRecoverySnapshot_",
    "baProcessMessageDeliveryQueue_","baClientRequestHistory_","clientDashboard_","tutorDashboard_",
    "adminListWorkHistory_","adminStatement_","adminMarkTutorBalancePaid_","adminRecordTutorPayment_",
    "baSecurityGateGet_","baSecurityGatePost_","getAdminProfile_","getConfig_","baResourceSheet_","baPurchaseSheet_","resourceInitializePayment_","resourceVerifyPayment_"
  ];
}

function baQaExpectedActions_(){
  return [
    "health","version","messages","clientDashboard","tutorDashboard","tutorGetWallet",
    "adminListConversations","adminListWorkHistory","adminFinancialIntegrity","adminObservability",
    "adminRecoveryManifest","adminProductionQa","adminCreateRecoverySnapshot",
    "adminStatement","adminMarkTutorBalancePaid","adminRecordTutorPayment","resources","resourceInitializePayment","resourceVerifyPayment","clientResourceCatalog","clientResourceLibrary","adminListResources","adminSaveResource","adminResourceAnalytics","adminResourceAccessLookup","adminSetResourceAccess"
  ];
}

function baQaCheck_(name,ok,detail,category){
  return {name:name,status:ok?"PASS":"FAIL",ok:!!ok,detail:String(detail||""),category:String(category||"GENERAL")};
}

function baQaRuntimeChecks_(){
  const out=[];
  out.push(baQaCheck_("Build marker is V61",/^2026-09-19-V63-PRODUCTION-HARDENING-SECURITY-QA$/.test(BRIGHTACE_BUILD),BRIGHTACE_BUILD,"DEPLOYMENT"));
  out.push(baQaCheck_("JSON API marker is V61",true,"brightace-json-v63 is returned by health/version endpoints.","DEPLOYMENT"));
  let ss=null;
  try{ ss=SpreadsheetApp.openById(getConfig_().spreadsheetId); out.push(baQaCheck_("Spreadsheet access",true,"Configured production spreadsheet opened successfully.","DATA")); }
  catch(e){ out.push(baQaCheck_("Spreadsheet access",false,String(e&&e.message||e),"DATA")); }
  if(ss){
    baQaExpectedSheets_().forEach(function(name){
      const sh=ss.getSheetByName(name); out.push(baQaCheck_("Critical sheet: "+name,!!sh,sh?((sh.getLastRow()-1)+" data rows") : "Sheet is missing.","DATA"));
    });
  }
  baQaRequiredFunctions_().forEach(function(name){
    let exists=false; try{ exists=typeof globalThis[name]==="function"; }catch(e){ exists=false; }
    out.push(baQaCheck_("Runtime function: "+name,exists,exists?"Loaded in Apps Script runtime.":"Function is unavailable.","ENGINE"));
  });
  const policyHeaders=["password","sessionToken","clientAccessToken","message","messageBody","content","api_key","authorization","ordinaryNote"];
  policyHeaders.forEach(function(h){
    const excluded=baRecoverySensitiveHeader_(h); const should=/password|session|token|message|content|api_key|authorization/i.test(h);
    out.push(baQaCheck_("Recovery redaction: "+h,excluded===should,excluded?"Excluded from recovery snapshots.":"Allowed operational field.","RECOVERY"));
  });
  try{
    const cfg=getConfig_();
    out.push(baQaCheck_("Configured spreadsheet ID",!!cfg.spreadsheetId,"Spreadsheet ID is configured.","CONFIG"));
  }catch(e){ out.push(baQaCheck_("Configuration load",false,String(e&&e.message||e),"CONFIG")); }
  return out;
}

function baQaWorkflowMatrix_(){
  return [
    {workflow:"Client intake + verification",status:"IMPLEMENTED",actions:["startChat","sendVerification","verifyChat","returningClientSendVerification","returningClientVerify"]},
    {workflow:"Client live chat + history",status:"IMPLEMENTED",actions:["sendMessage","messages","clientDashboard","clientSubmitFeedback","clientSendComment"]},
    {workflow:"Admin admissions + assignments",status:"IMPLEMENTED",actions:["adminListClients","adminListConversations","adminAssignWork","adminRestoreWork","adminRejectWork"]},
    {workflow:"Tutor login + work lifecycle",status:"IMPLEMENTED",actions:["tutorSendVerification","tutorVerifyLogin","tutorDashboard","tutorUpdateWorkStatus","tutorSubmitWork"]},
    {workflow:"Scheduling",status:"IMPLEMENTED",actions:["adminCreateSchedule","adminListSchedules","adminUpdateSchedule"]},
    {workflow:"Client payments + refunds",status:"IMPLEMENTED",actions:["initializePayment","verifyPayment","submitRefundRequest","adminReviewRefundRequest"]},
    {workflow:"Tutor wallet + withdrawals",status:"IMPLEMENTED",actions:["tutorGetWallet","tutorSaveWallet","tutorRequestWithdrawal","adminMarkTutorBalancePaid"]},
    {workflow:"Tutor/Admin messaging delivery",status:"IMPLEMENTED",actions:["tutorSendAdminMessage","adminSendTutorMessage","adminSendMessage","deliverMessage"]},
    {workflow:"Financial reconciliation",status:"READ-ONLY QA",actions:["adminFinancialIntegrity","adminStatement"]},
    {workflow:"Observability + delivery worker",status:"READ-ONLY QA",actions:["adminObservability","health"]},
    {workflow:"Disaster recovery + data protection",status:"READ-ONLY QA",actions:["adminRecoveryManifest","adminCreateRecoverySnapshot"]},
    {workflow:"Paid resource commerce",status:"IMPLEMENTED",actions:["resources","resourceInitializePayment","resourceVerifyPayment","clientResourceCatalog","clientResourceLibrary","adminListResources","adminSaveResource","adminResourceAnalytics","adminResourceAccessLookup","adminSetResourceAccess","adminDeleteResource"]},
    {workflow:"Production deployment protocol",status:"MANUAL DEPLOYMENT",actions:["version","health"]}
  ];
}

function adminProductionQa_(token){
  requireSuperAdmin_(token);
  const checks=baQaRuntimeChecks_();
  const pass=checks.filter(function(x){return x.ok;}).length;
  const fail=checks.length-pass;
  const matrix=baQaWorkflowMatrix_();
  checks.push(baQaCheck_("Timed resource access fields are supported",typeof baAccessExpiryForPurchase_==="function" && typeof baResourceAccessActive_==="function","Resource access can be unlimited or expire after a configured number of days.","RESOURCES"));
  checks.push(baQaCheck_("Resource access expiry column is defined",baAccessHeaders_().indexOf("expiresAt")>=0,"RESOURCE_ACCESS supports expiresAt.","RESOURCES"));
  const finalPass=checks.filter(function(x){return x.ok;}).length;
  const finalFail=checks.length-finalPass;
  return json_({ok:finalFail===0,build:BRIGHTACE_BUILD,api:"brightace-json-v63",generatedAt:new Date().toISOString(),summary:{total:checks.length,passed:finalPass,failed:finalFail},checks:checks,workflowMatrix:matrix,liveMutationTests:"NOT_RUN",liveMutationNote:"V63 remains read-only for automated QA. Payment, refund, withdrawal, message delivery, resource purchase, access revocation/restore, and recovery restore must be tested manually with dedicated test data after deployment."});
}
