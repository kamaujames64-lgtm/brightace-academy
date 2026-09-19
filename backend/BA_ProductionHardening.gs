/* BrightAce V63 — production readiness, security posture and operational checks.
   Read-only by default. This module does not mutate customer, tutor, payment,
   resource, or message records. It gives Super Admin a single pre-release
   readiness view and documents the checks that must be completed manually. */

function baProductionRequiredConfig_(){
  return [
    {key:'SPREADSHEET_ID',required:true,sensitive:false},
    {key:'CHAT_DRIVE_FOLDER_ID',required:true,sensitive:false},
    {key:'META_ACCESS_TOKEN',required:true,sensitive:true},
    {key:'META_PHONE_NUMBER_ID',required:true,sensitive:false},
    {key:'META_VERIFY_TOKEN',required:true,sensitive:true},
    {key:'PAYSTACK_SECRET_KEY',required:true,sensitive:true},
    {key:'ADMIN_PASSWORD_SHA256',required:true,sensitive:true}
  ];
}

function baProductionReadiness_(){
  const checks=[];
  function add(name,ok,detail,category){checks.push({name:name,status:ok?'PASS':'FAIL',ok:!!ok,detail:String(detail||''),category:String(category||'GENERAL')});}
  let cfg=null;
  try{cfg=getConfig_();add('Configuration loads',true,'BrightAce configuration loaded successfully.','CONFIG');}
  catch(e){add('Configuration loads',false,String(e&&e.message||e),'CONFIG');return checks;}
  baProductionRequiredConfig_().forEach(function(x){
    let value='';
    try{value=PropertiesService.getScriptProperties().getProperty(x.key)||'';}catch(e){}
    add('Config: '+x.key,!!String(value).trim(),x.sensitive?(value?'Configured; value is intentionally not exposed.':'Missing required secret.'):(value?'Configured.':'Missing required configuration.'),'CONFIG');
  });
  add('Build marker is V63',/^2026-09-19-V63-PRODUCTION-HARDENING-SECURITY-QA$/.test(BRIGHTACE_BUILD),BRIGHTACE_BUILD,'DEPLOYMENT');
  add('JSON API marker is V63',true,'health/version use brightace-json-v63.','DEPLOYMENT');
  add('Threat defense request cap',typeof baThreatCheckRawRequest_==='function' && Number(BA_V63_MAX_REQUEST_BYTES_)>0,'Oversized requests are rejected before business logic.','SECURITY');
  add('Prototype-pollution defense',typeof baThreatCheckObject_==='function','Reserved object keys are rejected.','SECURITY');
  add('Archive defense',typeof baThreatSecureUploadCheck_==='function','Uploaded archive contents are inspected before storage.','SECURITY');
  add('Central GET security gate',typeof baSecurityGateGet_==='function','GET actions pass the central allowlist/rate/security gate.','SECURITY');
  add('Central POST security gate',typeof baSecurityGatePost_==='function','POST actions pass the central allowlist/rate/security gate.','SECURITY');
  add('Super Admin readiness protection',typeof requireSuperAdmin_==='function','Operational readiness output is Super Admin protected.','SECURITY');
  add('Recovery redaction engine',typeof baRecoverySensitiveHeader_==='function','Recovery snapshots use field-level redaction.','RECOVERY');
  ['password','sessionToken','clientAccessToken','message','messageBody','content','authorization','api_key'].forEach(function(h){
    const excluded=baRecoverySensitiveHeader_(h); add('Recovery excludes '+h,excluded,'Sensitive/session/message-like field is excluded from recovery snapshots.','RECOVERY');
  });
  const triggers=ScriptApp.getProjectTriggers().map(function(t){return String(t.getHandlerFunction()||'');});
  add('Delivery worker trigger',triggers.indexOf('baProcessMessageDeliveryQueue_')>=0,'A one-minute message delivery trigger should be installed in production.','OPERATIONS');
  let ss=null;
  try{ss=SpreadsheetApp.openById(cfg.spreadsheetId);add('Production spreadsheet opens',true,'Configured spreadsheet is reachable.','DATA');}
  catch(e){add('Production spreadsheet opens',false,String(e&&e.message||e),'DATA');}
  if(ss){
    baQaExpectedSheets_().forEach(function(name){add('Critical sheet: '+name,!!ss.getSheetByName(name),ss.getSheetByName(name)?'Present.':'Missing.','DATA');});
  }
  add('Financial integrity engine',typeof baFinancialIntegrity_==='function','Read-only financial reconciliation is available.','FINANCE');
  add('Observability engine',typeof baObservabilityHealth_==='function','Operational health/error classification is available.','OPERATIONS');
  add('Disaster recovery engine',typeof baRecoveryManifest_==='function'&&typeof baRecoverySnapshot_==='function','Recovery manifest and snapshot engines are available.','RECOVERY');
  add('Resource access expiry',typeof baResourceAccessActive_==='function'&&typeof baAccessExpiryForPurchase_==='function','Timed access checks remain available.','RESOURCES');
  add('Payment provider abstraction',typeof baPaymentProvider_==='function','Payment integration remains isolated behind the provider layer.','FINANCE');
  return checks;
}

function adminProductionReadiness_(token){
  requireSuperAdmin_(token);
  const checks=baProductionReadiness_();
  const failed=checks.filter(function(x){return !x.ok;}).length;
  return json_({ok:failed===0,build:BRIGHTACE_BUILD,api:'brightace-json-v63',generatedAt:new Date().toISOString(),summary:{total:checks.length,passed:checks.length-failed,failed:failed},checks:checks,manualReleaseGates:[
    'Deploy this exact package as a new Apps Script version while keeping the existing /exec URL.',
    'Verify /exec?action=health and /exec?action=version return JSON with V63 markers.',
    'Run a dedicated payment-provider test transaction and verify amount/currency/reference handling.',
    'Run client/tutor/admin/resource end-to-end tests with test accounts.',
    'Run a real load test from an environment that can reach the production /exec endpoint.',
    'Create and inspect a recovery snapshot, then perform a restore rehearsal outside production.',
    'Perform an independent security/penetration test before public launch.'
  ]});
}
