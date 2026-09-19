/* BrightAce V54 — Disaster Recovery + Data Protection.
   Recovery tooling is deliberately controlled and auditable.
   It never snapshots passwords, session tokens, access tokens, secrets or message bodies.
*/

function baRecoverySheetSpecs_(){
  return [
    {name:"CONVERSATIONS",critical:true},
    {name:"CLIENTS",critical:true},
    {name:"PAYMENTS",critical:true},
    {name:"REFUNDS",critical:true},
    {name:"TUTORS",critical:true},
    {name:"TUTOR_WALLET",critical:true},
    {name:"TUTOR_PAYMENT_HISTORY",critical:true},
    {name:"TUTOR_WITHDRAWALS",critical:true},
    {name:"TUTOR_PAYOUTS",critical:true},
    {name:"TUTOR_AVAILABILITY",critical:true},
    {name:"SCHEDULE",critical:true},
    {name:"ADMIN_ACTIVITY",critical:true},
    {name:"MESSAGE_DELIVERY_QUEUE",critical:true},
    {name:"RESOURCES",critical:true},
    {name:"RESOURCE_PURCHASES",critical:true},
    {name:"RESOURCE_ACCESS",critical:true}
  ];
}

function baRecoverySensitiveHeader_(h){
  const x=String(h||"");
  return /(password|passcode|secret|token|session|credential|accesskey|authorization|api[_ -]?key|message(?:body|text)?|message_content|body|content|raw[_ -]?message)/i.test(x);
}

function baRecoverySheetInfo_(name){
  const ss=SpreadsheetApp.openById(getConfig_().spreadsheetId);
  const sh=ss.getSheetByName(name);
  if(!sh)return {name:name,present:false,rows:0,columns:0,headers:[],sensitiveColumns:[]};
  const lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();
  if(!lastRow||!lastCol)return {name:name,present:true,rows:0,columns:lastCol,headers:[],sensitiveColumns:[]};
  const headers=sh.getRange(1,1,1,lastCol).getValues()[0].map(String);
  return {name:name,present:true,rows:Math.max(0,lastRow-1),columns:lastCol,headers:headers,sensitiveColumns:headers.map(function(h,i){return baRecoverySensitiveHeader_(h)?i:-1;}).filter(function(i){return i>=0;})};
}

function baRecoveryManifest_(token){
  requireSuperAdmin_(token);
  const now=new Date(), specs=baRecoverySheetSpecs_(), sheets=specs.map(function(s){return baRecoverySheetInfo_(s.name);});
  const props=PropertiesService.getScriptProperties();
  return {ok:true,generatedAt:now.toISOString(),build:BRIGHTACE_BUILD,snapshotPolicy:"sanitized-operational-and-financial-data; credentials/tokens/message-bodies excluded",sheets:sheets,previousSnapshotAt:String(props.getProperty("BA_RECOVERY_LAST_SNAPSHOT_AT")||""),previousSnapshotId:String(props.getProperty("BA_RECOVERY_LAST_SNAPSHOT_ID")||"")};
}

function baRecoverySanitizedRows_(sh,startRow,numRows,headers){
  const values=sh.getRange(startRow,1,numRows,headers.length).getValues();
  return values.map(function(row){
    const out={};
    headers.forEach(function(h,i){ if(!baRecoverySensitiveHeader_(h)) out[String(h||("column_"+(i+1)))] = row[i] instanceof Date ? row[i].toISOString() : row[i]; });
    return out;
  });
}

function baRecoverySnapshot_(token){
  requireSuperAdmin_(token);
  const ss=SpreadsheetApp.openById(getConfig_().spreadsheetId), specs=baRecoverySheetSpecs_(), maxRowsPerSheet=Number(getConfig_().recoveryMaxRowsPerSheet||50000), payload={schemaVersion:"V61-1",build:BRIGHTACE_BUILD,createdAt:new Date().toISOString(),policy:"sanitized; credentials/tokens/message-bodies excluded",sheets:{}};
  specs.forEach(function(spec){
    const sh=ss.getSheetByName(spec.name); if(!sh){payload.sheets[spec.name]={present:false};return;}
    const lastRow=sh.getLastRow(),lastCol=sh.getLastColumn(); if(!lastRow||!lastCol){payload.sheets[spec.name]={present:true,rows:0,headers:[]};return;}
    const headers=sh.getRange(1,1,1,lastCol).getValues()[0].map(String);
    const count=Math.min(Math.max(0,lastRow-1),maxRowsPerSheet);
    const chunk=500;
    const rows=[];
    for(let r=2;r<=count+1;r+=chunk){ rows.push.apply(rows,baRecoverySanitizedRows_(sh,r,Math.min(chunk,count+1-r),headers)); }
    payload.sheets[spec.name]={present:true,rows:rows.length,totalRows:lastRow-1,truncated:(lastRow-1)>rows.length,headers:headers.filter(function(h){return !baRecoverySensitiveHeader_(h);}),data:rows};
  });
  const text=JSON.stringify(payload);
  const folder=baRecoveryFolder_();
  const file=folder.createFile("BrightAce-Recovery-"+Utilities.formatDate(new Date(),Session.getScriptTimeZone()||"UTC","yyyyMMdd-HHmmss")+".json",text,MimeType.PLAIN_TEXT);
  PropertiesService.getScriptProperties().setProperties({BA_RECOVERY_LAST_SNAPSHOT_AT:new Date().toISOString(),BA_RECOVERY_LAST_SNAPSHOT_ID:file.getId()});
  auditAdmin_(token,"RECOVERY_SNAPSHOT_CREATED",file.getId());
  return json_({ok:true,snapshotId:file.getId(),snapshotName:file.getName(),createdAt:new Date().toISOString(),truncatedSheets:Object.keys(payload.sheets).filter(function(k){return payload.sheets[k].truncated;}),policy:payload.policy});
}

function baRecoveryFolder_(){
  const props=PropertiesService.getScriptProperties(),existing=String(props.getProperty("BA_RECOVERY_FOLDER_ID")||"");
  if(existing){try{return DriveApp.getFolderById(existing);}catch(e){}}
  const folder=DriveApp.createFolder("BrightAce Academy Recovery");
  props.setProperty("BA_RECOVERY_FOLDER_ID",folder.getId());
  return folder;
}

function adminRecoveryManifest_(token){return json_(baRecoveryManifest_(token));}
function adminCreateRecoverySnapshot_(d){return baRecoverySnapshot_(d.adminToken);}
