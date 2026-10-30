/* BrightAce V58 — Resource Commerce + Secure Access.
   Resource catalog remains Google Drive-backed and USD-priced.
   This module adds thumbnails, provider-neutral payment calls, purchases/access,
   duplicate-purchase protection, refund/reconciliation state, and audit records.
*/

function getConfig_(){
  const p=PropertiesService.getScriptProperties();
  return {spreadsheetId:String(p.getProperty(CONFIG.spreadsheetIdKey)||"").trim(),recoveryMaxRowsPerSheet:Number(p.getProperty("RECOVERY_MAX_ROWS_PER_SHEET")||50000),resourceDriveFolderId:String(p.getProperty("RESOURCE_DRIVE_FOLDER_ID")||"").trim()};
}

function baResourceHeaders_(){return ["resourceId","title","category","description","priceUSD","driveFileId","fileName","thumbnailFileId","thumbnailFileName","published","accessLevel","sortOrder","createdAt","updatedAt","accessDurationDays"]}
function baPurchaseHeaders_(){return ["purchaseId","resourceId","resourceTitle","customerName","customerEmail","customerPhone","amountUSD","currency","status","provider","providerReference","authorizationUrl","createdAt","paidAt","refundedAt","refundAmountUSD","refundReference","accessRevokedAt"]}
function baAccessHeaders_(){return ["accessId","purchaseId","resourceId","customerEmail","customerPhone","accessStatus","firstGrantedAt","lastAccessAt","accessCount","lastDownloadAt","downloadCount","lastUserAgent","expiresAt"]}
function baResourceSheet_(){return ensureColumns_(getSheet_("RESOURCES",baResourceHeaders_()),baResourceHeaders_())}
function baPurchaseSheet_(){return ensureColumns_(getSheet_("RESOURCE_PURCHASES",baPurchaseHeaders_()),baPurchaseHeaders_())}
function baAccessSheet_(){return ensureColumns_(getSheet_("RESOURCE_ACCESS",baAccessHeaders_()),baAccessHeaders_())}

function baResourceRow_(r,row){return {row:row,resourceId:String(r[0]||""),title:String(r[1]||""),category:String(r[2]||""),description:String(r[3]||""),priceUSD:Number(r[4]||0),driveFileId:String(r[5]||""),fileName:String(r[6]||""),thumbnailFileId:String(r[7]||""),thumbnailFileName:String(r[8]||""),published:String(r[9]||"NO").toUpperCase()==="YES",accessLevel:String(r[10]||"PUBLIC").toUpperCase(),sortOrder:Number(r[11]||0),createdAt:r[12]||"",updatedAt:r[13]||"",accessDurationDays:Number(r[14]||0)||0}}
function baFindResource_(id){const target=String(id||"").trim();if(!target)return null;const key="BA_RESOURCE_"+target,hit=baCacheGetJson_(key);if(hit&&hit.resourceId)return hit;const sh=baResourceSheet_(),last=sh.getLastRow();if(last<2)return null;const cell=sh.getRange(2,1,last-1,1).createTextFinder(target).matchEntireCell(true).useRegularExpression(false).findNext();if(!cell)return null;const out=baResourceRow_(sh.getRange(cell.getRow(),1,1,sh.getLastColumn()).getValues()[0],cell.getRow());baCachePutJson_(key,out,120);return out}
function baResourceThumbnailUrl_(r){if(!r||!r.thumbnailFileId)return "";return "https://drive.google.com/thumbnail?id="+encodeURIComponent(r.thumbnailFileId)+"&sz=w480"}
function baResourcePublic_(r){return {resourceId:r.resourceId,title:r.title,category:r.category,description:r.description,priceUSD:Number(r.priceUSD||0),currency:"USD",fileName:r.fileName,thumbnailUrl:baResourceThumbnailUrl_(r),published:!!r.published,accessLevel:r.accessLevel,sortOrder:r.sortOrder,accessDurationDays:Number(r.accessDurationDays||0)}}
function baResourceList_(publishedOnly){return baCachedResourceList_(!!publishedOnly)}
function baValidateResource_(d){
  const title=String(d.title||"").trim(),category=String(d.category||"").trim(),description=String(d.description||"").trim(),price=Number(d.priceUSD),fileId=String(d.driveFileId||"").trim(),thumbId=String(d.thumbnailFileId||"").trim();
  if(title.length<2||title.length>160)throw new Error("Resource title must be 2–160 characters.");if(category.length>80)throw new Error("Resource category is too long.");if(description.length>2000)throw new Error("Resource description is too long.");if(!isFinite(price)||price<=0||price>100000)throw new Error("Resource price must be greater than $0 and no more than $100,000.");if(Math.abs(price*100-Math.round(price*100))>1e-7)throw new Error("Resource price must have no more than two decimal places.");
  if(!/^[A-Za-z0-9_-]{10,}$/.test(fileId))throw new Error("Enter a valid Google Drive file ID.");
  const accessDurationDays=Math.floor(Number(d.accessDurationDays||0));if(!isFinite(accessDurationDays)||accessDurationDays<0||accessDurationDays>3650)throw new Error("Access duration must be 0 (unlimited) or between 1 and 3650 days.");
  let f;try{f=DriveApp.getFileById(fileId)}catch(e){throw new Error("Google Drive resource file could not be opened with that file ID.")}
  if(thumbId){let tf;try{tf=DriveApp.getFileById(thumbId)}catch(e){throw new Error("Google Drive thumbnail file could not be opened.")}if(String(tf.getMimeType()||"").indexOf("image/")!==0)throw new Error("Thumbnail file must be an image (JPG, PNG, WEBP, GIF, etc.).")}
  return {title:title,category:category,description:description,priceUSD:Math.round(price*100)/100,driveFileId:fileId,fileName:f.getName(),thumbnailFileId:thumbId,thumbnailFileName:thumbId?DriveApp.getFileById(thumbId).getName():"",published:String(d.published||"NO").toUpperCase()==="YES",accessLevel:String(d.accessLevel||"PUBLIC").toUpperCase()==="STUDENT"?"STUDENT":"PUBLIC",sortOrder:Number(d.sortOrder||0)||0,accessDurationDays:accessDurationDays}
}
function adminListResources_(token){requireSuperAdmin_(token);return json_({ok:true,resources:baResourceList_(false).map(baResourcePublic_),generatedAt:new Date().toISOString()})}
function publicResourceCatalog_(){return json_({ok:true,resources:baResourceList_(true).map(baResourcePublic_),generatedAt:new Date().toISOString()})}
function adminSaveResource_(d){
  requireSuperAdmin_(d.adminToken);d=Object.assign({},d||{});const existing=String(d.resourceId||"").trim();
  if(existing){const prior=baFindResource_(existing);if(!prior)throw new Error("Resource not found.");if(!String(d.driveFileId||"").trim())d.driveFileId=prior.driveFileId;if(d.thumbnailFileId===undefined||d.thumbnailFileId===null||d.thumbnailFileId==="")d.thumbnailFileId=prior.thumbnailFileId;}
  const x=baValidateResource_(d),now=new Date(),sh=baResourceSheet_(),m=headerMap_(sh);if(x.published&&x.accessLevel==="PUBLIC"){try{const f=DriveApp.getFileById(x.driveFileId),folderId=String(PropertiesService.getScriptProperties().getProperty("RESOURCE_PUBLIC_FOLDER_ID")||"");let isDirectUpload=false,parents=f.getParents();while(parents.hasNext()){if(parents.next().getId()===folderId)isDirectUpload=true}if(isDirectUpload){f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);const access=f.getSharingAccess();if((access!==DriveApp.Access.ANYONE_WITH_LINK&&access!==DriveApp.Access.ANYONE)||f.getSharingPermission()!==DriveApp.Permission.VIEW)throw new Error("Drive did not confirm public viewer access.")}else{const a=f.getSharingAccess();if((a!==DriveApp.Access.ANYONE_WITH_LINK&&a!==DriveApp.Access.ANYONE)||f.getSharingPermission()!==DriveApp.Permission.VIEW)throw new Error("Existing Drive file is not already shared for public viewing. Use direct upload or explicitly configure sharing.");}}catch(e){throw new Error("Drive could not enable viewer access for this published paid resource: "+String(e.message||e))}}
  if(existing){const old=baFindResource_(existing);if(!old)throw new Error("Resource not found.");const vals={title:x.title,category:x.category,description:x.description,priceUSD:x.priceUSD,driveFileId:x.driveFileId,fileName:x.fileName,thumbnailFileId:x.thumbnailFileId,thumbnailFileName:x.thumbnailFileName,published:x.published?"YES":"NO",accessLevel:x.accessLevel,sortOrder:x.sortOrder,updatedAt:now,accessDurationDays:x.accessDurationDays};Object.keys(vals).forEach(k=>{if(m[k])sh.getRange(old.row,m[k]).setValue(vals[k])});baCacheRemove_("BA_RESOURCE_"+existing);baResourceInvalidateIndexes_();auditAdmin_(d.adminToken,"RESOURCE_UPDATED",existing);return json_({ok:true,resource:baResourcePublic_(baFindResource_(existing)||Object.assign({},old,vals))})}
  const id="BA-RES-"+Utilities.getUuid().replace(/-/g,"").slice(0,16).toUpperCase(),row=sh.getLastRow()+1,vals=[id,x.title,x.category,x.description,x.priceUSD,x.driveFileId,x.fileName,x.thumbnailFileId,x.thumbnailFileName,x.published?"YES":"NO",x.accessLevel,x.sortOrder,now,now,x.accessDurationDays];sh.getRange(row,1,1,vals.length).setValues([vals]);baResourceInvalidateIndexes_();auditAdmin_(d.adminToken,"RESOURCE_CREATED",id);return json_({ok:true,resource:baResourcePublic_(baResourceRow_(vals,row))})
}
function adminDeleteResource_(d){requireSuperAdmin_(d.adminToken);const r=baFindResource_(d.resourceId);if(!r)throw new Error("Resource not found.");const purchases=baPurchaseSheet_(),m=headerMap_(purchases),last=purchases.getLastRow();if(last>1&&m.resourceId){const vals=purchases.getRange(2,m.resourceId,last-1,1).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===r.resourceId)throw new Error("This resource has purchase records and cannot be deleted. Unpublish it instead.")}baResourceSheet_().deleteRow(r.row);baCacheRemove_("BA_RESOURCE_"+r.resourceId);baResourceInvalidateIndexes_();auditAdmin_(d.adminToken,"RESOURCE_DELETED",r.resourceId);return json_({ok:true,deleted:r.resourceId})}

/* ===================== PAYMENT PROVIDER ABSTRACTION ===================== */
function baResourcePaymentProvider_(){return String(PropertiesService.getScriptProperties().getProperty("BRIGHTACE_RESOURCE_PAYMENT_PROVIDER")||"PAYSTACK").trim().toUpperCase()||"PAYSTACK"}
function baPaymentProviderInitialize_(args){const provider=baResourcePaymentProvider_();if(provider!=="PAYSTACK")throw new Error("Resource payment provider '"+provider+"' is not configured yet. Add its integration before switching providers.");return baPaystackInitializeResourcePayment_(args)}
function baPaymentProviderVerify_(reference){const provider=baResourcePaymentProvider_();if(provider!=="PAYSTACK")throw new Error("Resource payment provider '"+provider+"' is not configured yet.");return baPaystackVerifyResourcePayment_(reference)}
function baPaymentProviderRefund_(reference,amountUSD){const provider=baResourcePaymentProvider_();if(provider!=="PAYSTACK")throw new Error("Resource payment provider '"+provider+"' is not configured yet.");return paystackRefund_(reference,amountUSD,"USD")}
function baPaystackInitializeResourcePayment_(args){
  const secret=String(PropertiesService.getScriptProperties().getProperty(CONFIG.paystackSecretKey)||"").trim();if(!secret)throw new Error("Current resource payment provider is not configured. Add PAYSTACK_SECRET_KEY in Apps Script Script Properties.");if(!/^sk_(test|live)_/.test(secret))throw new Error("Invalid Paystack secret-key format.");
  const payload={email:args.email,amount:String(toPaystackMinorUnit_(args.amountUSD,"USD")),currency:"USD",reference:args.reference,callback_url:args.callbackUrl,metadata:JSON.stringify(args.metadata||{})};
  const response=UrlFetchApp.fetch("https://api.paystack.co/transaction/initialize",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+secret},payload:JSON.stringify(payload),muteHttpExceptions:true}),data=JSON.parse(response.getContentText()||"{}");
  if(response.getResponseCode()>=300||!data.status||!data.data||!data.data.authorization_url)throw new Error("Payment initialization failed: "+String(data.message||response.getContentText()||"Unknown error"));
  return {provider:"PAYSTACK",authorizationUrl:data.data.authorization_url,reference:String(data.data.reference||args.reference),raw:data.data}
}
function baPaystackVerifyResourcePayment_(reference){
  const secret=String(PropertiesService.getScriptProperties().getProperty(CONFIG.paystackSecretKey)||"").trim();if(!secret)throw new Error("Current resource payment provider is not configured.");
  const response=UrlFetchApp.fetch("https://api.paystack.co/transaction/verify/"+encodeURIComponent(reference),{headers:{Authorization:"Bearer "+secret},muteHttpExceptions:true}),data=JSON.parse(response.getContentText()||"{}");
  if(response.getResponseCode()>=300||!data.status||!data.data)throw new Error(String(data.message||"Unable to verify payment."));return data.data
}

/* ===================== PURCHASES / ACCESS ===================== */
function baPurchaseFromRow_(v,row,m){return {row:row,purchaseId:String(v[m.purchaseId-1]||""),resourceId:String(v[m.resourceId-1]||""),resourceTitle:String(v[m.resourceTitle-1]||""),customerName:String(v[m.customerName-1]||""),customerEmail:String(v[m.customerEmail-1]||"").toLowerCase(),customerPhone:String(v[m.customerPhone-1]||""),amountUSD:Number(v[m.amountUSD-1]||0),currency:String(v[m.currency-1]||"USD").toUpperCase(),status:String(v[m.status-1]||"PENDING").toUpperCase(),provider:String(v[m.provider-1]||"PAYSTACK").toUpperCase(),reference:String(v[m.providerReference-1]||""),authorizationUrl:String(v[m.authorizationUrl-1]||""),createdAt:v[m.createdAt-1]||"",paidAt:v[m.paidAt-1]||"",refundedAt:v[m.refundedAt-1]||"",refundAmountUSD:Number(v[m.refundAmountUSD-1]||0),refundReference:String(v[m.refundReference-1]||""),accessRevokedAt:v[m.accessRevokedAt-1]||""}}
function baFindPurchaseByReference_(reference){const target=String(reference||"").trim();if(!target)return null;const sh=baPurchaseSheet_(),last=sh.getLastRow();if(last<2)return null;const m=headerMap_(sh),cell=sh.getRange(2,m.providerReference,last-1,1).createTextFinder(target).matchEntireCell(true).useRegularExpression(false).findNext();if(!cell)return null;return baPurchaseFromRow_(sh.getRange(cell.getRow(),1,1,sh.getLastColumn()).getValues()[0],cell.getRow(),m)}
function baFindPurchaseById_(purchaseId){const id=String(purchaseId||"").trim();if(!id)return null;const sh=baPurchaseSheet_(),row=baPurchaseIndex_()[id];if(!row)return null;const m=headerMap_(sh);return baPurchaseFromRow_(sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],row,m)}
function baPurchaseHasPaid_(resourceId,email,phone){const em=String(email||"").trim().toLowerCase(),ph=normalizePhone_(phone||"");const keys=baPaidKeySet_();return !!((em&&keys[String(resourceId)+"|e|"+em])||(ph&&keys[String(resourceId)+"|p|"+ph]))}
function baAccessExpiryForPurchase_(p,fromDate){const r=baFindResource_(p&&p.resourceId);const days=Number(r&&r.accessDurationDays||0);if(!(days>0))return "";const base=fromDate instanceof Date?new Date(fromDate.getTime()):new Date();return new Date(base.getTime()+days*86400000)}
function baEnsureAccess_(p){const sh=baAccessSheet_(),m=headerMap_(sh),last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,sh.getLastColumn()).getValues():[];for(let i=0;i<rows.length;i++){if(String(rows[i][m.purchaseId-1]||"")===p.purchaseId)return {row:i+2,values:rows[i]}}const id="BA-ACC-"+Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase(),now=new Date(),expiry=baAccessExpiryForPurchase_(p,now),vals=[id,p.purchaseId,p.resourceId,p.customerEmail,p.customerPhone,"ACTIVE",now,now,0,"",0,"",expiry];sh.appendRow(vals);baResourceInvalidateIndexes_();return {row:sh.getLastRow(),values:vals}}

function baFindAccessByPurchaseId_(purchaseId){const id=String(purchaseId||"").trim();if(!id)return null;const sh=baAccessSheet_(),row=baAccessIndex_()[id];if(!row)return null;return {row:row,values:sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0]};}
function baResourceAccessActive_(p){
  if(!p||p.status!=="PAID"||p.accessRevokedAt)return false;
  const a=baFindAccessByPurchaseId_(p.purchaseId);if(!a)return true;
  const m=headerMap_(baAccessSheet_()),status=String(a.values[m.accessStatus-1]||"ACTIVE").toUpperCase(),expires=m.expiresAt? a.values[m.expiresAt-1] : "";
  if(status!=="ACTIVE")return false;
  if(expires){const t=new Date(expires).getTime();if(isFinite(t)&&t<=Date.now())return false;}
  return true;
}

function baRecordAccess_(p,kind,userAgent){const a=baEnsureAccess_(p),sh=baAccessSheet_(),m=headerMap_(sh),now=new Date();setByHeader_(sh,a.row,"lastAccessAt",now);setByHeader_(sh,a.row,"accessCount",Number(getByHeader_(sh,a.row,"accessCount")||0)+1);if(kind==="DOWNLOAD"){setByHeader_(sh,a.row,"lastDownloadAt",now);setByHeader_(sh,a.row,"downloadCount",Number(getByHeader_(sh,a.row,"downloadCount")||0)+1)}if(userAgent)setByHeader_(sh,a.row,"lastUserAgent",String(userAgent).slice(0,300))}

function resourceInitializePayment_(d){
  const r=baFindResource_(d.resourceId);if(!r||!r.published)throw new Error("Resource is not available for purchase.");if(r.accessLevel!=="PUBLIC")throw new Error("This resource requires an authenticated BrightAce account and is not available through public checkout yet.");
  const name=String(d.customerName||"").trim(),email=String(d.customerEmail||"").trim().toLowerCase(),phone=normalizePhone_(d.customerPhone||"");
  if(name.length<2||name.length>120)throw new Error("Enter your name.");if(!/^\S+@\S+\.\S+$/.test(email))throw new Error("Enter a valid email address.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    if(baPurchaseHasPaid_(r.resourceId,email,phone))throw new Error("This resource is already in your BrightAce purchases.");
    const sh=baPurchaseSheet_(),m=headerMap_(sh),last=sh.getLastRow(),now=Date.now();
    if(last>1) {
      const rows=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();
      for(let i=rows.length-1;i>=0;i--) {
        const x=baPurchaseFromRow_(rows[i],i+2,m),age=now-new Date(x.createdAt||0).getTime();
        if(x.resourceId===r.resourceId&&(x.customerEmail===email||(phone&&x.customerPhone===phone))&&x.status==="PENDING"&&x.authorizationUrl&&age>=0&&age<15*60*1000)
          return json_({ok:true,purchaseId:x.purchaseId,resourceId:x.resourceId,authorizationUrl:x.authorizationUrl,reference:x.reference,amountUSD:x.amountUSD,currency:"USD",provider:x.provider,reused:true});
      }
    }
    const purchaseId="BA-RP-"+Utilities.getUuid().replace(/-/g,"").slice(0,18).toUpperCase(),reference=purchaseId+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,10),callback=PropertiesService.getScriptProperties().getProperty(CONFIG.paymentCallbackUrlKey)||"https://kamaujames64-lgtm.github.io/brightace-academy/pages/resource-checkout.html";
    const result=baPaymentProviderInitialize_({email:email,amountUSD:r.priceUSD,reference:reference,callbackUrl:callback,metadata:{resourcePurchaseId:purchaseId,resourceId:r.resourceId,resourceTitle:r.title,customerName:name,customerEmail:email,customerPhone:phone}});
    sh.appendRow([purchaseId,r.resourceId,r.title,name,email,phone,r.priceUSD,"USD","PENDING",result.provider,result.reference,result.authorizationUrl,new Date(),"","",0,"",""]);baResourceInvalidateIndexes_();
    return json_({ok:true,purchaseId:purchaseId,resourceId:r.resourceId,authorizationUrl:result.authorizationUrl,reference:result.reference,amountUSD:r.priceUSD,currency:"USD",provider:result.provider})
  } finally { lock.releaseLock(); }
}
function baVerifyAndRecordResourcePurchase_(reference){
  let p=baFindPurchaseByReference_(reference);if(!p)throw new Error("Resource purchase not found.");if(p.status==="PAID")return p;
  const tx=baPaymentProviderVerify_(reference);if(String(tx.status||"").toLowerCase()!=="success")return p;
  const r=baFindResource_(p.resourceId);if(!r)throw new Error("The purchased resource is no longer available.");
  if(Number(tx.amount)!==toPaystackMinorUnit_(p.amountUSD,"USD")||String(tx.currency||"").toUpperCase()!=="USD")throw new Error("Payment amount or currency did not match the resource price.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    p=baFindPurchaseByReference_(reference);if(!p)throw new Error("Resource purchase not found.");
    if(p.status==="PAID")return p;
    const paidAt=tx.paid_at||new Date(),sh=baPurchaseSheet_();
    setByHeader_(sh,p.row,"status","PAID");setByHeader_(sh,p.row,"paidAt",paidAt);
    const updated=Object.assign({},p,{status:"PAID",paidAt:paidAt});baEnsureAccess_(updated);baResourceInvalidateIndexes_();return updated;
  } finally { lock.releaseLock(); }
}
function resourceVerifyPayment_(reference){var purchase=baFindPurchaseByReference_(reference);if(!purchase){var q=baFindResourceRequestByPaymentReference_(reference);if(!q)throw new Error("Payment reference not found.");var request=baVerifyAndRecordResourceQuote_(reference);return json_({ok:true,status:request.quotePaymentStatus==="PAID"?"success":"pending",reference:reference,requestId:request.requestId,resourceTitle:request.topic,amountUSD:request.quoteAmountUSD,currency:"USD",quotePayment:true,paidAt:request.quotePaidAt||""})}var p=baVerifyAndRecordResourcePurchase_(reference),r=baFindResource_(p.resourceId);return json_({ok:true,status:p.status==="PAID"?"success":"pending",reference:p.reference,purchaseId:p.purchaseId,resourceId:p.resourceId,resourceTitle:p.resourceTitle,amountUSD:p.amountUSD,currency:"USD",thumbnailUrl:r?baResourceThumbnailUrl_(r):"",downloadUrl:baResourceAccessActive_(p)&&r&&r.driveFileId?DriveApp.getFileById(r.driveFileId).getUrl():"",paidAt:p.paidAt||"",provider:p.provider})}
function resourceDownloadInfo_(purchaseId,reference,userAgent){const p=reference?baFindPurchaseByReference_(reference):baFindPurchaseById_(purchaseId);if(!p||String(p.purchaseId)!==String(purchaseId||p.purchaseId))throw new Error("Purchase not found.");if(!baResourceAccessActive_(p))throw new Error("Resource access is not active.");const r=baFindResource_(p.resourceId);if(!r)throw new Error("Resource not found.");baRecordAccess_(p,"DOWNLOAD",userAgent||"");let url="";try{url=DriveApp.getFileById(r.driveFileId).getUrl()}catch(e){throw new Error("The Google Drive resource is unavailable.")}return json_({ok:true,resourceId:r.resourceId,title:r.title,thumbnailUrl:baResourceThumbnailUrl_(r),downloadUrl:url})}

function clientResourceCatalog_(d){
  const c=requireClientSession_(d.clientSessionToken,d.phone),phone=normalizePhone_(c.clientPhone||d.phone||""),email=String(c.clientEmail||c.email||"").trim().toLowerCase();
  const resources=baResourceList_(true),sh=baPurchaseSheet_(),m=headerMap_(sh),last=sh.getLastRow(),owned={};
  if(last>1){const vals=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){const p=baPurchaseFromRow_(vals[i],i+2,m);if(!p.resourceId||!((email&&p.customerEmail===email)||(phone&&normalizePhone_(p.customerPhone)===phone)))continue;if(p.status==="PAID"&&!p.accessRevokedAt)owned[p.resourceId]={purchaseId:p.purchaseId,purchasedAt:p.paidAt,accessStatus:baResourceAccessActive_(p)?"ACTIVE":"EXPIRED",expiresAt:(function(){const a=baFindAccessByPurchaseId_(p.purchaseId),am=a?headerMap_(baAccessSheet_()):null;return a&&am&&am.expiresAt?a.values[am.expiresAt-1]:""})()};else if(!owned[p.resourceId]&&p.status==="REFUNDED")owned[p.resourceId]={purchaseId:p.purchaseId,purchasedAt:p.paidAt,accessStatus:"REVOKED",expiresAt:""};}}
  return json_({ok:true,resources:resources.map(function(r){const o=owned[r.resourceId]||null;return {resourceId:r.resourceId,title:r.title,category:r.category,description:r.description,priceUSD:r.priceUSD,currency:"USD",fileName:r.fileName,thumbnailUrl:baResourceThumbnailUrl_(r),published:r.published,accessLevel:r.accessLevel,sortOrder:r.sortOrder,purchased:!!(o&&o.accessStatus==="ACTIVE"),purchaseId:o?o.purchaseId:"",purchasedAt:o?o.purchasedAt:"",accessStatus:o?o.accessStatus:"NOT_PURCHASED",expiresAt:o?o.expiresAt:""};}),generatedAt:new Date().toISOString()});
}

function clientResourceLibrary_(d){
  const c=requireClientSession_(d.clientSessionToken,d.phone),phone=normalizePhone_(c.clientPhone||d.phone||""),email=String(c.clientEmail||c.email||"").trim().toLowerCase(),sh=baPurchaseSheet_(),m=headerMap_(sh),last=sh.getLastRow(),out=[];if(last>1){const vals=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){const p=baPurchaseFromRow_(vals[i],i+2,m);if(p.status!=="PAID"||p.accessRevokedAt)continue;if(!((email&&p.customerEmail===email)||(phone&&normalizePhone_(p.customerPhone)===phone)))continue;const r=baFindResource_(p.resourceId);out.push({purchaseId:p.purchaseId,resourceId:p.resourceId,title:p.resourceTitle,category:r?r.category:"",description:r?r.description:"",priceUSD:p.amountUSD,currency:"USD",purchasedAt:p.paidAt,thumbnailUrl:r?baResourceThumbnailUrl_(r):"",fileName:r?r.fileName:"",accessStatus:"ACTIVE",expiresAt:(function(){const a=baFindAccessByPurchaseId_(p.purchaseId),am=a?headerMap_(baAccessSheet_()):null;return a&&am&&am.expiresAt?a.values[am.expiresAt-1]:""})()})}}
  out.sort((a,b)=>new Date(b.purchasedAt||0)-new Date(a.purchasedAt||0));return json_({ok:true,resources:out.slice(0,200),generatedAt:new Date().toISOString()})
}
function clientResourceAccess_(d){const c=requireClientSession_(d.clientSessionToken,d.phone),p=baFindPurchaseById_(d.purchaseId);if(!p)throw new Error("Purchase not found.");const phone=normalizePhone_(c.clientPhone||d.phone||""),email=String(c.clientEmail||c.email||"").trim().toLowerCase();if(!((email&&p.customerEmail===email)||(phone&&normalizePhone_(p.customerPhone)===phone)))throw new Error("This purchase does not belong to the verified client.");if(!baResourceAccessActive_(p))throw new Error("Resource access is not active.");const r=baFindResource_(p.resourceId);if(!r)throw new Error("Resource not found.");baRecordAccess_(p,"OPEN",String(d.userAgent||""));let url="";try{url=DriveApp.getFileById(r.driveFileId).getUrl()}catch(e){throw new Error("The Google Drive resource is unavailable.")}return json_({ok:true,purchaseId:p.purchaseId,resourceId:r.resourceId,title:r.title,thumbnailUrl:baResourceThumbnailUrl_(r),downloadUrl:url})}

function adminResourceCommerce_(token){requireSuperAdmin_(token);const psh=baPurchaseSheet_(),m=headerMap_(psh),last=psh.getLastRow(),sales=[],summary={USD:{gross:0,paid:0,refunded:0,net:0,count:0}};if(last>1){const vals=psh.getRange(2,1,last-1,psh.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){const p=baPurchaseFromRow_(vals[i],i+2,m);if(!p.purchaseId)continue;const gross=p.amountUSD,ref=p.refundAmountUSD||0;if(p.status==="PAID"||p.status==="REFUNDED"||p.status==="PARTIALLY_REFUNDED"){summary.USD.paid+=gross;summary.USD.count++}if(p.status==="REFUNDED"||ref>0)summary.USD.refunded+=ref;summary.USD.gross+=gross;summary.USD.net=summary.USD.paid-summary.USD.refunded;sales.push({purchaseId:p.purchaseId,resourceId:p.resourceId,resourceTitle:p.resourceTitle,customerName:p.customerName,customerEmail:p.customerEmail,customerPhone:p.customerPhone,amountUSD:gross,currency:p.currency,status:p.status,provider:p.provider,reference:p.reference,createdAt:p.createdAt,paidAt:p.paidAt,refundedAt:p.refundedAt,refundAmountUSD:ref,accessRevokedAt:p.accessRevokedAt})}}
  const rsh=baResourceRequestSheet_(),rm=headerMap_(rsh),rlast=rsh.getLastRow();if(rlast>1){const rvals=rsh.getRange(2,1,rlast-1,rsh.getLastColumn()).getValues();for(let i=0;i<rvals.length;i++){const q=baRequestRow_(rvals[i],rm);if(!q.requestId||q.quotePaymentStatus!=="PAID")continue;const amount=Number(q.quoteAmountUSD||0);summary.USD.paid+=amount;summary.USD.count++;summary.USD.gross+=amount;summary.USD.net=summary.USD.paid-summary.USD.refunded;sales.push({kind:"REQUEST_QUOTE",purchaseId:"QUOTE-"+q.requestId,resourceId:q.requestId,resourceTitle:"Requested resource: "+q.topic,customerName:q.clientName,customerEmail:q.clientEmail,customerPhone:q.clientPhone,amountUSD:amount,currency:q.quoteCurrency||"USD",status:"PAID",provider:baResourcePaymentProvider_(),reference:q.quotePaymentReference,createdAt:q.createdAt,paidAt:q.quotePaidAt,refundedAt:"",refundAmountUSD:0,accessRevokedAt:""})}}
  return json_({ok:true,summary:summary,sales:sales.slice(-500).reverse(),provider:baResourcePaymentProvider_(),generatedAt:new Date().toISOString()})
}
function adminRefundResource_(d){
  requireSuperAdmin_(d.adminToken);const p=baFindPurchaseById_(d.purchaseId);if(!p)throw new Error("Resource purchase not found.");if(["PAID","PARTIALLY_REFUNDED"].indexOf(p.status)<0)throw new Error("Only an active paid resource purchase can be refunded.");const remaining=Math.max(0,p.amountUSD-p.refundAmountUSD);const amount=Number(d.amountUSD||remaining);if(!(amount>0)||amount>remaining)throw new Error("Refund amount must be greater than zero and cannot exceed the purchase amount.");const ref=baPaymentProviderRefund_(p.reference,amount),sh=baPurchaseSheet_();setByHeader_(sh,p.row,"status",amount>=p.amountUSD?"REFUNDED":"PARTIALLY_REFUNDED");setByHeader_(sh,p.row,"refundedAt",new Date());setByHeader_(sh,p.row,"refundAmountUSD",amount);setByHeader_(sh,p.row,"refundReference",String(ref.id||ref.reference||""));if(amount>=p.amountUSD)setByHeader_(sh,p.row,"accessRevokedAt",new Date());auditAdmin_(d.adminToken,"RESOURCE_REFUND",p.purchaseId+" $"+amount.toFixed(2));return json_({ok:true,purchaseId:p.purchaseId,status:amount>=p.amountUSD?"REFUNDED":"PARTIALLY_REFUNDED",refundAmountUSD:amount,refundReference:String(ref.id||ref.reference||"")})
}
function baHandleResourcePaystackWebhook_(tx){const ref=String(tx&&tx.reference||"");if(!ref)return false;const p=baFindPurchaseByReference_(ref);if(p){try{baVerifyAndRecordResourcePurchase_(ref)}catch(e){console.error("Resource webhook verification failed: "+e)}return true}const q=baFindResourceRequestByPaymentReference_(ref);if(!q)return false;try{baVerifyAndRecordResourceQuote_(ref)}catch(e){console.error("Resource quotation webhook verification failed: "+e)}return true}
function adminResourceAnalytics_(token){
  requireSuperAdmin_(token);
  const resources=baResourceList_(false), resourceMap={};
  resources.forEach(function(r){resourceMap[r.resourceId]={resourceId:r.resourceId,title:r.title,category:r.category||"Uncategorized",published:!!r.published,priceUSD:Number(r.priceUSD||0),salesCount:0,paidRevenueUSD:0,refundedUSD:0,netRevenueUSD:0,accessCount:0,downloadCount:0,lastAccessAt:"",lastDownloadAt:""};});
  const psh=baPurchaseSheet_(),pm=headerMap_(psh),plast=psh.getLastRow();
  if(plast>1){const vals=psh.getRange(2,1,plast-1,psh.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){const p=baPurchaseFromRow_(vals[i],i+2,pm),x=resourceMap[p.resourceId];if(!x)continue;if(p.status==="PAID"||p.status==="REFUNDED"||p.status==="PARTIALLY_REFUNDED"){x.salesCount++;x.paidRevenueUSD+=Number(p.amountUSD||0);x.refundedUSD+=Number(p.refundAmountUSD||0);x.netRevenueUSD=x.paidRevenueUSD-x.refundedUSD;}}}
  const ash=baAccessSheet_(),am=headerMap_(ash),alast=ash.getLastRow();
  if(alast>1){const vals=ash.getRange(2,1,alast-1,ash.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){const row=vals[i],rid=String(row[am.resourceId-1]||""),x=resourceMap[rid];if(!x)continue;x.accessCount+=Number(row[am.accessCount-1]||0);x.downloadCount+=Number(row[am.downloadCount-1]||0);const la=row[am.lastAccessAt-1]||"",ld=row[am.lastDownloadAt-1]||"";if(la&&(!x.lastAccessAt||new Date(la)>new Date(x.lastAccessAt)))x.lastAccessAt=la;if(ld&&(!x.lastDownloadAt||new Date(ld)>new Date(x.lastDownloadAt)))x.lastDownloadAt=ld;}}
  const performance=Object.keys(resourceMap).map(function(k){return resourceMap[k]}).sort(function(a,b){return b.netRevenueUSD-a.netRevenueUSD||b.salesCount-a.salesCount||b.accessCount-a.accessCount||String(a.title).localeCompare(String(b.title))});
  const categories={};performance.forEach(function(x){const key=x.category||"Uncategorized";if(!categories[key])categories[key]={category:key,salesCount:0,paidRevenueUSD:0,refundedUSD:0,netRevenueUSD:0,accessCount:0,downloadCount:0,resourceCount:0};const c=categories[key];c.salesCount+=x.salesCount;c.paidRevenueUSD+=x.paidRevenueUSD;c.refundedUSD+=x.refundedUSD;c.netRevenueUSD+=x.netRevenueUSD;c.accessCount+=x.accessCount;c.downloadCount+=x.downloadCount;c.resourceCount++;});
  const categoryRows=Object.keys(categories).map(function(k){return categories[k]}).sort(function(a,b){return b.netRevenueUSD-a.netRevenueUSD||b.salesCount-a.salesCount||String(a.category).localeCompare(String(b.category))});
  const summary={resources:resources.length,published:resources.filter(function(r){return r.published}).length,salesCount:0,paidRevenueUSD:0,refundedUSD:0,netRevenueUSD:0,accessCount:0,downloadCount:0};performance.forEach(function(x){summary.salesCount+=x.salesCount;summary.paidRevenueUSD+=x.paidRevenueUSD;summary.refundedUSD+=x.refundedUSD;summary.netRevenueUSD+=x.netRevenueUSD;summary.accessCount+=x.accessCount;summary.downloadCount+=x.downloadCount;});
  return json_({ok:true,generatedAt:new Date().toISOString(),provider:baResourcePaymentProvider_(),summary:summary,resources:performance,categories:categoryRows});
}

function adminResourceAccessLookup_(token,query){
  requireSuperAdmin_(token);
  const q=String(query||"").trim().toLowerCase();
  if(q.length<2)throw new Error("Enter at least 2 characters to search resource purchases.");
  const sh=baPurchaseSheet_(),m=headerMap_(sh),last=sh.getLastRow(),out=[];
  if(last>1){const vals=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();for(let i=vals.length-1;i>=0&&out.length<200;i--){const p=baPurchaseFromRow_(vals[i],i+2,m),hay=[p.purchaseId,p.resourceId,p.resourceTitle,p.customerName,p.customerEmail,p.customerPhone,p.reference].join(" ").toLowerCase();if(hay.indexOf(q)<0)continue;const a=baFindAccessByPurchaseId_(p.purchaseId);const am=a?headerMap_(baAccessSheet_()):null;out.push({purchaseId:p.purchaseId,resourceId:p.resourceId,resourceTitle:p.resourceTitle,customerName:p.customerName,customerEmail:p.customerEmail,customerPhone:p.customerPhone,amountUSD:p.amountUSD,currency:p.currency,status:p.status,reference:p.reference,paidAt:p.paidAt,refundedAt:p.refundedAt,accessStatus:a&&am?(function(){const st=String(a.values[am.accessStatus-1]||"ACTIVE").toUpperCase(),ex=am.expiresAt?a.values[am.expiresAt-1]:"";if(st==="ACTIVE"&&ex&&new Date(ex).getTime()<=Date.now())return "EXPIRED";return st})():"ACTIVE",expiresAt:a&&am&&am.expiresAt?a.values[am.expiresAt-1]||"":"",accessCount:a&&am?Number(a.values[am.accessCount-1]||0):0,downloadCount:a&&am?Number(a.values[am.downloadCount-1]||0):0,lastAccessAt:a&&am?a.values[am.lastAccessAt-1]||"":"",lastDownloadAt:a&&am?a.values[am.lastDownloadAt-1]||"":""});}}
  return json_({ok:true,query:q,results:out,generatedAt:new Date().toISOString()});
}
function adminSetResourceAccess_(d){
  requireSuperAdmin_(d.adminToken);
  const p=baFindPurchaseById_(d.purchaseId);if(!p)throw new Error("Resource purchase not found.");
  const status=String(d.accessStatus||"").toUpperCase();if(["ACTIVE","REVOKED"].indexOf(status)<0)throw new Error("Access status must be ACTIVE or REVOKED.");
  if(p.status!=="PAID"||p.accessRevokedAt)throw new Error("Only an active paid purchase can have its access changed.");
  const sh=baAccessSheet_(),a=baEnsureAccess_(p),now=new Date();setByHeader_(sh,a.row,"accessStatus",status);
  if(status==="ACTIVE"){if(!getByHeader_(sh,a.row,"firstGrantedAt"))setByHeader_(sh,a.row,"firstGrantedAt",now);setByHeader_(sh,a.row,"expiresAt",baAccessExpiryForPurchase_(p,now));}else{setByHeader_(sh,a.row,"expiresAt",getByHeader_(sh,a.row,"expiresAt")||"");}baResourceInvalidateIndexes_();
  auditAdmin_(d.adminToken,status==="ACTIVE"?"RESOURCE_ACCESS_RESTORED":"RESOURCE_ACCESS_REVOKED",p.purchaseId);
  return json_({ok:true,purchaseId:p.purchaseId,resourceId:p.resourceId,accessStatus:status,changedAt:now.toISOString()});
}

function adminResourceReconciliation_(token){requireSuperAdmin_(token);const psh=baPurchaseSheet_(),m=headerMap_(psh),last=psh.getLastRow(),issues=[],totals={paid:0,refunded:0,net:0,purchases:0};if(last>1){const vals=psh.getRange(2,1,last-1,psh.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){const p=baPurchaseFromRow_(vals[i],i+2,m);if(!p.purchaseId)continue;totals.purchases++;if(p.status==="PAID"||p.status==="REFUNDED"||p.status==="PARTIALLY_REFUNDED")totals.paid+=p.amountUSD;totals.refunded+=p.refundAmountUSD||0;const expected=baFindResource_(p.resourceId);if(!expected)issues.push({purchaseId:p.purchaseId,type:"MISSING_RESOURCE",detail:p.resourceId});if(p.currency!=="USD")issues.push({purchaseId:p.purchaseId,type:"CURRENCY_MISMATCH",detail:p.currency});if(p.status==="REFUNDED"&&!(p.refundAmountUSD>=p.amountUSD))issues.push({purchaseId:p.purchaseId,type:"REFUND_AMOUNT_MISMATCH",detail:p.refundAmountUSD+" / "+p.amountUSD})}}const rq=baResourceRequestSheet_(),rqm=headerMap_(rq),rqlast=rq.getLastRow();totals.quotePayments=0;totals.quotePaid=0;if(rqlast>1){const qvals=rq.getRange(2,1,rqlast-1,rq.getLastColumn()).getValues();for(let i=0;i<qvals.length;i++){const q=baRequestRow_(qvals[i],rqm);if(q.quotePaymentStatus==="PAID"){totals.quotePayments++;totals.quotePaid+=Number(q.quoteAmountUSD||0);if(!(q.quoteAmountUSD>0)||q.quoteCurrency!=="USD"||!q.quotePaymentReference||q.status!=="Paid"&&q.status!=="In preparation"&&q.status!=="Delivered")issues.push({requestId:q.requestId,type:"RESOURCE_QUOTE_PAYMENT_MISMATCH",detail:"Quote amount/currency/reference/status requires review."})}}}totals.net=totals.paid-totals.refunded;return json_({ok:true,totals:totals,issues:issues.slice(0,200),provider:baResourcePaymentProvider_(),generatedAt:new Date().toISOString()})}


/* BrightAce Resources requests + public promotional catalog (V67). */

/* ===================== AUTHENTICATED DIRECT RESOURCE UPLOADS ===================== */
function baResourceVideoSignatureValid_(bytes,mime) {
  var b=bytes||[],m=String(mime||"").toLowerCase(),u=function(i){return (Number(b[i])||0)&255;};
  if(m==="video/mp4"||m==="video/quicktime")return b.length>=12&&String.fromCharCode.apply(null,b.slice(4,8).map(function(_,i){return u(i+4)}))==="ftyp";
  if(m==="video/webm")return b.length>=4&&u(0)===0x1A&&u(1)===0x45&&u(2)===0xDF&&u(3)===0xA3;
  if(m==="video/ogg")return b.length>=4&&String.fromCharCode.apply(null,b.slice(0,4).map(function(_,i){return u(i)}))==="OggS";
  return false;
}
function baResourceExtensionMatchesMime_(name,mime) {
  var ext=(String(name||"").match(/\.([^.]+)$/)||[])[1];if(!ext)return true;ext=ext.toLowerCase();mime=String(mime||"").toLowerCase();
  var map={"image/jpeg":["jpg","jpeg"],"image/png":["png"],"image/webp":["webp"],"image/gif":["gif"],"image/avif":["avif"],"image/bmp":["bmp","dib"],"image/tiff":["tif","tiff"],"image/heic":["heic"],"image/heif":["heif"],"image/x-icon":["ico"],"image/vnd.microsoft.icon":["ico"],"video/mp4":["mp4","m4v"],"video/webm":["webm"],"video/ogg":["ogv","ogg"],"video/quicktime":["mov"],"video/x-msvideo":["avi"],"video/x-matroska":["mkv"],"video/3gpp":["3gp"],"video/mpeg":["mpeg","mpg"],"audio/mpeg":["mp3"],"audio/wav":["wav"],"audio/x-wav":["wav"],"audio/ogg":["oga","ogg"],"audio/flac":["flac"],"application/zip":["zip"],"application/x-zip-compressed":["zip"],"application/x-7z-compressed":["7z"],"application/vnd.rar":["rar"],"application/x-rar-compressed":["rar"],"application/gzip":["gz"],"application/x-tar":["tar"],"application/msword":["doc"],"application/vnd.openxmlformats-officedocument.wordprocessingml.document":["docx"],"application/vnd.ms-excel":["xls"],"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":["xlsx"],"application/vnd.ms-powerpoint":["ppt"],"application/vnd.openxmlformats-officedocument.presentationml.presentation":["pptx"],"application/pdf":["pdf"],"application/rtf":["rtf"],"text/plain":["txt"],"text/csv":["csv"]};
  return !map[mime]||map[mime].indexOf(ext)>=0;
}
function baResourceUploadMimeAllowed_(mime, kind) {
  mime=String(mime||"application/octet-stream").toLowerCase().split(";")[0].trim();
  // Never accept active executable/web payload types at the MIME policy layer.
  if(/^(application\/(javascript|x-javascript|ecmascript|x-httpd-php|x-sh|x-msdownload)|text\/(html|javascript|ecmascript)|image\/svg\+xml)$/.test(mime)) return false;
  // Broad format support: accept ordinary image/video/audio and downloadable document/archive types.
  // validateUpload_ still rejects executable and active web content (including SVG/HTML/scripts).
  if(kind==="PUBLIC_THUMBNAIL") return mime.indexOf("image/")===0 && mime!=="image/svg+xml";
  if(kind==="PUBLIC_MEDIA") return /^(image|video|audio|application|text)\//.test(mime) && mime!=="image/svg+xml" && !/^(application\/(javascript|x-javascript|ecmascript|x-httpd-php|x-sh|x-msdownload|x-msdos-program)|text\/(html|javascript|ecmascript))$/.test(mime);
  // Private client deliveries support images and document-like files, not audio/video payloads.
  if(kind==="PRIVATE_DELIVERY") return /^(image|application|text)\//.test(mime) && mime!=="image/svg+xml";
  return /^(image|video|audio|application|text)\//.test(mime) || mime==="application/octet-stream";
}
function baResourceUploadFolder_(kind) {
  var props=PropertiesService.getScriptProperties(),privateUpload=kind==="PRIVATE_DELIVERY";
  var key=privateUpload?"RESOURCE_PRIVATE_FOLDER_ID":"RESOURCE_PUBLIC_FOLDER_ID";
  var id=String(props.getProperty(key)||"").trim(),folder=null;
  if(id) { try { folder=DriveApp.getFolderById(id); } catch(e) { folder=null; } }
  if(folder&&(privateUpload||kind==="PAID_RESOURCE")) {
    var access=folder.getSharingAccess();
    if(access===DriveApp.Access.ANYONE||access===DriveApp.Access.ANYONE_WITH_LINK)
      throw new Error(privateUpload?"The configured private delivery folder is publicly shared. Set RESOURCE_PRIVATE_FOLDER_ID to a private Drive folder.":"The paid-resource upload folder is publicly shared. Set RESOURCE_PUBLIC_FOLDER_ID to a private Drive folder before uploading paid resources.");
  }
  if(!folder) {
    var name=privateUpload?"BrightAce Private Client Deliveries":"BrightAce Published Resource Media";
    folder=DriveApp.createFolder(name);
    props.setProperty(key,folder.getId());
  }
  return folder;
}
function adminUploadResourceFile_(d) {
  requireSuperAdmin_(d.adminToken);
  var kind=String(d.uploadType||"").toUpperCase();
  if(["PAID_RESOURCE","PRIVATE_DELIVERY","PUBLIC_MEDIA","PUBLIC_THUMBNAIL"].indexOf(kind)<0) throw new Error("Choose a supported resource upload destination.");
  var f=d.file||{},name=String(f.name||"").trim(),mime=String(f.mimeType||"").toLowerCase(),dataUrl=String(f.dataUrl||"");
  if(!name||name.length>180) throw new Error("Choose a file with a valid filename (maximum 180 characters).");
  if(!/^data:[^;]+;base64,/i.test(dataUrl)) throw new Error("The selected file data is invalid. Please select the file again.");
  if(!baResourceUploadMimeAllowed_(mime,kind)) throw new Error("This file type is not supported for the selected resource workflow.");
  if(!baResourceExtensionMatchesMime_(name,mime)) throw new Error("The filename extension does not match the selected file type.");
  var maxBytes=kind==="PRIVATE_DELIVERY"?4*1024*1024:20*1024*1024,encoded=dataUrl.slice(dataUrl.indexOf(",")+1),bytes;
  try { bytes=Utilities.base64DecodeWebSafe(encoded); } catch(e) { try { bytes=Utilities.base64Decode(encoded); } catch(ignore) { throw new Error("The selected file could not be decoded."); } }
  if(!bytes.length) throw new Error("The selected file is empty.");
  if(bytes.length>maxBytes) throw new Error("File exceeds the "+(maxBytes/(1024*1024))+" MB limit for this upload workflow.");
  baSecureUploadCheck_(name,mime,bytes);baThreatCheckArchive_(bytes,mime,name);
  if(mime.indexOf("video/")===0&&!baResourceVideoSignatureValid_(bytes,mime))throw new Error("The video container signature does not match the declared file type.");
  if(kind==="PUBLIC_THUMBNAIL"&&mime.indexOf("image/")!==0) throw new Error("A thumbnail must be an image.");
  var idem=String(d.uploadKey||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,100);
  var cache=CacheService.getScriptCache(),cacheKey=idem?"BA_RESOURCE_UPLOAD_"+sha256Hex_(idem):"",lock=LockService.getScriptLock();
  if(cacheKey) { var cached=cache.get(cacheKey); if(cached) return json_(JSON.parse(cached)); }
  lock.waitLock(10000);
  try {
    if(cacheKey) { var again=cache.get(cacheKey); if(again) return json_(JSON.parse(again)); }
    var safeName=name.replace(/[^A-Za-z0-9._ -]/g,"_").replace(/\.\./g,"_").slice(0,160)||"resource-upload";
    var folder=baResourceUploadFolder_(kind),blob=Utilities.newBlob(bytes,mime,safeName),file=folder.createFile(blob).setName(safeName);
    if(kind==="PUBLIC_MEDIA"||kind==="PUBLIC_THUMBNAIL") {
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); }
      catch(e) { try { file.setTrashed(true); } catch(ignore){} throw new Error("Drive could not apply public viewer access. The upload was not published."); }
    }
    var verified=DriveApp.getFileById(file.getId());
    if(verified.getSize()!==bytes.length) { try { verified.setTrashed(true); } catch(ignore2){} throw new Error("Drive did not verify the complete uploaded file."); }
    var sharing=verified.getSharingAccess(),publicAccess=sharing===DriveApp.Access.ANYONE||sharing===DriveApp.Access.ANYONE_WITH_LINK;
    if((kind==="PRIVATE_DELIVERY"||kind==="PAID_RESOURCE")&&publicAccess){try{verified.setTrashed(true)}catch(ignore3){}throw new Error("Drive permissions are not private for this upload destination.");}
    if((kind==="PUBLIC_MEDIA"||kind==="PUBLIC_THUMBNAIL")&&(!publicAccess||verified.getSharingPermission()!==DriveApp.Permission.VIEW)){try{verified.setTrashed(true)}catch(ignore4){}throw new Error("Drive did not confirm public viewer access for this media.");}
    var out={ok:true,file:{fileId:verified.getId(),name:verified.getName(),mimeType:verified.getMimeType(),size:verified.getSize(),private:kind==="PRIVATE_DELIVERY"||kind==="PAID_RESOURCE",sharing:(kind==="PUBLIC_MEDIA"||kind==="PUBLIC_THUMBNAIL")?"ANYONE_WITH_LINK_VIEWER":"PRIVATE_UNTIL_PUBLISHED"}};
    if(cacheKey) cache.put(cacheKey,JSON.stringify(out),21600);
    return json_(out);
  } finally { lock.releaseLock(); }
}

function baPromoHeaders_(){return ["promoId","title","category","description","audience","educationalValue","mediaType","mediaUrl","sortOrder","published","createdAt","updatedAt","clickThroughUrl"]}
function baResourceRequestHeaders_(){return ["requestId","clientId","clientName","clientPhone","clientEmail","category","topic","objectives","details","status","adminResponse","deliveryFileId","deliveryFileName","createdAt","updatedAt","deliveredAt","lastUpdatedBy","requestKey","quoteAmountUSD","quoteCurrency","quoteStatus","quotePaymentReference","quoteAuthorizationUrl","quotePaidAt","quotePaymentStatus"]}
function baPromoSheet_(){return ensureColumns_(getSheet_("RESOURCE_PROMOTIONS",baPromoHeaders_()),baPromoHeaders_())}
function baResourceRequestSheet_(){return ensureColumns_(getSheet_("RESOURCE_REQUESTS",baResourceRequestHeaders_()),baResourceRequestHeaders_())}
function baSafeText_(v,max,label,required){var s=String(v==null?"":v).trim();if(required&&!s)throw new Error(label+" is required.");if(s.length>max)throw new Error(label+" must be no more than "+max+" characters.");return s}
function baPromoRow_(v,m){return {promoId:String(v[m.promoId-1]||""),title:String(v[m.title-1]||""),category:String(v[m.category-1]||""),description:String(v[m.description-1]||""),audience:String(v[m.audience-1]||""),educationalValue:String(v[m.educationalValue-1]||""),mediaType:String(v[m.mediaType-1]||"IMAGE"),mediaUrl:String(v[m.mediaUrl-1]||""),clickThroughUrl:m.clickThroughUrl?String(v[m.clickThroughUrl-1]||""):"",sortOrder:Number(v[m.sortOrder-1]||0),published:String(v[m.published-1]||"NO").toUpperCase()==="YES",createdAt:v[m.createdAt-1]||"",updatedAt:v[m.updatedAt-1]||""}}
function baRequestRow_(v,m){return {requestId:String(v[m.requestId-1]||""),clientId:String(v[m.clientId-1]||""),clientName:String(v[m.clientName-1]||""),clientPhone:String(v[m.clientPhone-1]||""),clientEmail:String(v[m.clientEmail-1]||""),category:String(v[m.category-1]||""),topic:String(v[m.topic-1]||""),objectives:String(v[m.objectives-1]||""),details:String(v[m.details-1]||""),status:String(v[m.status-1]||"Submitted"),adminResponse:String(v[m.adminResponse-1]||""),deliveryFileId:String(v[m.deliveryFileId-1]||""),deliveryFileName:String(v[m.deliveryFileName-1]||""),createdAt:v[m.createdAt-1]||"",updatedAt:v[m.updatedAt-1]||"",deliveredAt:v[m.deliveredAt-1]||"",lastUpdatedBy:String(v[m.lastUpdatedBy-1]||""),quoteAmountUSD:m.quoteAmountUSD?Number(v[m.quoteAmountUSD-1]||0):0,quoteCurrency:m.quoteCurrency?String(v[m.quoteCurrency-1]||"USD"):"USD",quoteStatus:m.quoteStatus?String(v[m.quoteStatus-1]||"NONE"):"NONE",quotePaymentReference:m.quotePaymentReference?String(v[m.quotePaymentReference-1]||""):"",quoteAuthorizationUrl:m.quoteAuthorizationUrl?String(v[m.quoteAuthorizationUrl-1]||""):"",quotePaidAt:m.quotePaidAt?v[m.quotePaidAt-1]||"":"",quotePaymentStatus:m.quotePaymentStatus?String(v[m.quotePaymentStatus-1]||"NONE"):"NONE"}}
function baPromoPublic_(x){var url=x.mediaUrl||"";if(url&&/^[A-Za-z0-9_-]{10,}$/.test(url)){url=x.mediaType==="IMAGE"?"https://drive.google.com/uc?export=view&id="+encodeURIComponent(url):"https://drive.google.com/file/d/"+encodeURIComponent(url)+"/preview"}return {promoId:x.promoId,title:x.title,category:x.category,description:x.description,audience:x.audience,educationalValue:x.educationalValue,mediaType:x.mediaType,mediaUrl:url,mediaFileName:"",clickThroughUrl:String(x.clickThroughUrl||""),sortOrder:x.sortOrder,published:x.published}}
function resourcePromotions_(){
  var cacheKey="BA_PUBLIC_RESOURCE_PROMOTIONS_V2",cached=baCacheGetJson_(cacheKey);
  if(cached&&Array.isArray(cached.items))return json_({ok:true,items:cached.items,generatedAt:cached.generatedAt||new Date().toISOString(),cached:true});
  var sh=baPromoSheet_(),m=headerMap_(sh),last=sh.getLastRow(),out=[];
  if(last>1){sh.getRange(2,1,last-1,sh.getLastColumn()).getValues().forEach(function(v){var x=baPromoRow_(v,m);if(x.promoId&&x.published)out.push(baPromoPublic_(x))})}
  out.sort(function(a,b){return a.sortOrder-b.sortOrder||a.title.localeCompare(b.title)});
  var generatedAt=new Date().toISOString();baCachePutJson_(cacheKey,{items:out,generatedAt:generatedAt},120);
  return json_({ok:true,items:out,generatedAt:generatedAt,cached:false})
}
function adminListResourcePromotions_(token){requireSuperAdmin_(token);var sh=baPromoSheet_(),m=headerMap_(sh),last=sh.getLastRow(),out=[];if(last>1)sh.getRange(2,1,last-1,sh.getLastColumn()).getValues().forEach(function(v){var x=baPromoRow_(v,m);if(x.promoId)out.push(x)});out.sort(function(a,b){return a.sortOrder-b.sortOrder||a.title.localeCompare(b.title)});return json_({ok:true,items:out})}
function adminSaveResourcePromotion_(d){requireSuperAdmin_(d.adminToken);var x={title:baSafeText_(d.title,160,"Title",true),category:baSafeText_(d.category,80,"Category",true),description:baSafeText_(d.description,1500,"Description",true),audience:baSafeText_(d.audience,240,"Intended audience",false),educationalValue:baSafeText_(d.educationalValue,500,"Educational value",false),mediaType:String(d.mediaType||"IMAGE").toUpperCase(),mediaUrl:baSafeText_(d.mediaUrl,1000,"Media URL",false),clickThroughUrl:baSafeText_(d.clickThroughUrl,1000,"Click-through link",false),sortOrder:Number(d.sortOrder||0),published:String(d.published||"NO").toUpperCase()==="YES"};if(x.clickThroughUrl&&!/^https:\/\//i.test(x.clickThroughUrl))throw new Error("Click-through link must start with https://.");if(["IMAGE","VIDEO","AUDIO","DOCUMENT","FILE","NONE"].indexOf(x.mediaType)<0)throw new Error("Choose a supported promotional media type.");if(x.mediaUrl&&!/^https:\/\//i.test(x.mediaUrl)){if(!/^[A-Za-z0-9_-]{10,}$/.test(x.mediaUrl))throw new Error("Enter an HTTPS media URL or a Google Drive file ID.");var mf;try{mf=DriveApp.getFileById(x.mediaUrl)}catch(e){throw new Error("Promotional Drive media could not be opened.")}var mt=String(mf.getMimeType()||"");var share=mf.getSharingAccess();if((share!==DriveApp.Access.ANYONE_WITH_LINK&&share!==DriveApp.Access.ANYONE)||mf.getSharingPermission()!==DriveApp.Permission.VIEW)throw new Error("Promotional Drive media must be shared as Anyone with the link — Viewer. Do not use private learning files.");if(x.mediaType==="IMAGE"&&mt.indexOf("image/")!==0)throw new Error("Select an image file for image media.");if(x.mediaType==="VIDEO"&&mt.indexOf("video/")!==0)throw new Error("Select a video file for video media.");if(x.mediaType==="AUDIO"&&mt.indexOf("audio/")!==0)throw new Error("Select an audio file for audio media.");if(x.mediaType==="DOCUMENT"&&!(mt.indexOf("application/")===0||mt.indexOf("text/")===0))throw new Error("Select a document or text file for document media.")}if(x.mediaType!=="NONE"&&!x.mediaUrl)throw new Error("Add an HTTPS media URL or Google Drive file ID, or choose None.");if(!isFinite(x.sortOrder))throw new Error("Display order must be a number.");var sh=baPromoSheet_(),m=headerMap_(sh),id=String(d.promoId||"").trim(),now=new Date(),row=0;if(id){var last=sh.getLastRow();if(last>1){var vals=sh.getRange(2,m.promoId,last-1,1).getValues();for(var i=0;i<vals.length;i++)if(String(vals[i][0])===id){row=i+2;break}}if(!row)throw new Error("Promotional entry not found.")}else{id="BA-PROMO-"+Utilities.getUuid().replace(/-/g,"").slice(0,14).toUpperCase();row=sh.getLastRow()+1;x.createdAt=now}var vals={promoId:id,title:x.title,category:x.category,description:x.description,audience:x.audience,educationalValue:x.educationalValue,mediaType:x.mediaType,mediaUrl:x.mediaUrl,clickThroughUrl:x.clickThroughUrl,sortOrder:x.sortOrder,published:x.published?"YES":"NO",updatedAt:now};if(!d.promoId)vals.createdAt=now;Object.keys(vals).forEach(function(k){if(m[k])sh.getRange(row,m[k]).setValue(vals[k])});baCacheRemove_("BA_PUBLIC_RESOURCE_PROMOTIONS_V2");auditAdmin_(d.adminToken,d.promoId?"RESOURCE_PROMOTION_UPDATED":"RESOURCE_PROMOTION_CREATED",id);return json_({ok:true,promoId:id})}
function adminDeleteResourcePromotion_(d){requireSuperAdmin_(d.adminToken);var sh=baPromoSheet_(),m=headerMap_(sh),last=sh.getLastRow(),id=String(d.promoId||"");if(last<2)throw new Error("Promotional entry not found.");var vals=sh.getRange(2,m.promoId,last-1,1).getValues();for(var i=0;i<vals.length;i++)if(String(vals[i][0])===id){sh.deleteRow(i+2);baCacheRemove_("BA_PUBLIC_RESOURCE_PROMOTIONS_V2");auditAdmin_(d.adminToken,"RESOURCE_PROMOTION_DELETED",id);return json_({ok:true,deleted:id})}throw new Error("Promotional entry not found.")}
function clientCreateResourceRequest_(d){var c=requireClientSession_(d.clientSessionToken,d.phone),category=baSafeText_(d.category,100,"Category",true),topic=baSafeText_(d.topic,180,"Topic",true),objectives=baSafeText_(d.objectives,1200,"Learning objectives",true),details=baSafeText_(d.details,2000,"Additional details",false);var phone=normalizePhone_(c.clientPhone||d.phone||""),email=String(c.clientEmail||c.email||c.studentEmail||"").trim().toLowerCase(),clientId=String(c.clientId||c.id||phone),key=sha256Hex_([clientId,category,topic,objectives,details].join("|"));var cache=CacheService.getScriptCache(),lock=LockService.getScriptLock();lock.waitLock(10000);try{var sh=baResourceRequestSheet_(),m=headerMap_(sh),last=sh.getLastRow();if(last>1){var rows=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();for(var i=rows.length-1;i>=Math.max(0,rows.length-30);i--){if(String(rows[i][m.requestKey-1]||"")===key&&Date.now()-new Date(rows[i][m.createdAt-1]).getTime()<60000)throw new Error("This request was just submitted. Please wait before submitting it again.")}}var id="BA-RRQ-"+Utilities.getUuid().replace(/-/g,"").slice(0,16).toUpperCase(),now=new Date(),vals={requestId:id,clientId:clientId,clientName:String(c.clientName||c.name||c.studentName||"BrightAce Client"),clientPhone:phone,clientEmail:email,category:category,topic:topic,objectives:objectives,details:details,status:"Submitted",adminResponse:"",deliveryFileId:"",deliveryFileName:"",createdAt:now,updatedAt:now,deliveredAt:"",lastUpdatedBy:"CLIENT",requestKey:key};var row=sh.getLastRow()+1;Object.keys(vals).forEach(function(k){if(m[k])sh.getRange(row,m[k]).setValue(vals[k])});return json_({ok:true,request:{requestId:id,status:"Submitted",createdAt:now}})}finally{lock.releaseLock()}}
function clientListResourceRequests_(d){var c=requireClientSession_(d.clientSessionToken,d.phone),phone=normalizePhone_(c.clientPhone||d.phone||""),email=String(c.clientEmail||c.email||c.studentEmail||"").trim().toLowerCase(),clientId=String(c.clientId||c.id||phone),sh=baResourceRequestSheet_(),m=headerMap_(sh),last=sh.getLastRow(),out=[];if(last>1){sh.getRange(2,1,last-1,sh.getLastColumn()).getValues().forEach(function(v){var x=baRequestRow_(v,m);if(x.requestId&&((x.clientId&&x.clientId===clientId)||(phone&&normalizePhone_(x.clientPhone)===phone)||(email&&x.clientEmail.toLowerCase()===email)))out.push({requestId:x.requestId,category:x.category,topic:x.topic,objectives:x.objectives,details:x.details,status:x.status,adminResponse:x.adminResponse,createdAt:x.createdAt,updatedAt:x.updatedAt,deliveredAt:x.deliveredAt,hasDelivery:!!x.deliveryFileId,clientEmail:x.clientEmail,quoteAmountUSD:x.quoteAmountUSD,quoteCurrency:x.quoteCurrency,quoteStatus:x.quoteStatus,quotePaymentStatus:x.quotePaymentStatus})})}out.sort(function(a,b){return new Date(b.createdAt||0)-new Date(a.createdAt||0)});return json_({ok:true,requests:out.slice(0,100)})}
function adminListResourceRequests_(token){requireSuperAdmin_(token);var sh=baResourceRequestSheet_(),m=headerMap_(sh),last=sh.getLastRow(),out=[];if(last>1)sh.getRange(2,1,last-1,sh.getLastColumn()).getValues().forEach(function(v){var x=baRequestRow_(v,m);if(x.requestId)out.push(x)});out.sort(function(a,b){return new Date(b.createdAt||0)-new Date(a.createdAt||0)});return json_({ok:true,requests:out.slice(0,500)})}
function baValidateResourceQuoteAmount_(value) {
  var amount=Number(value);
  if(!isFinite(amount)||amount<=0||amount>100000||Math.abs(amount*100-Math.round(amount*100))>1e-7)
    throw new Error("Quotation must be a valid amount greater than $0 and no more than $100,000, with at most two decimal places.");
  return Math.round(amount*100)/100;
}
function adminUpdateResourceRequest_(d){
  requireSuperAdmin_(d.adminToken);var id=String(d.requestId||""),sh=baResourceRequestSheet_(),m=headerMap_(sh),last=sh.getLastRow(),row=0;
  if(last>1){var ids=sh.getRange(2,m.requestId,last-1,1).getValues();for(var i=0;i<ids.length;i++)if(String(ids[i][0])===id){row=i+2;break}}
  if(!row)throw new Error("Resource request not found.");
  var x=baRequestRow_(sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],m),status=String(d.status||x.status),allowed={"Submitted":["Under review","Awaiting clarification","Approved","Awaiting payment","Declined"],"Under review":["Awaiting clarification","Approved","Awaiting payment","Declined"],"Awaiting clarification":["Under review","Approved","Awaiting payment","Declined"],"Approved":["In preparation","Awaiting payment","Declined"],"Awaiting payment":["Awaiting payment","Paid","In preparation","Declined"],"Paid":["In preparation"],"In preparation":["Delivered","Paid"],"Delivered":[],"Declined":[]};
  if(status!==x.status&&(!allowed[x.status]||allowed[x.status].indexOf(status)<0))throw new Error("Invalid status transition from "+x.status+" to "+status+".");
  if(status==="Paid"&&x.quotePaymentStatus!=="PAID")throw new Error("Payment can only be marked paid by verified backend payment confirmation.");
  var quote=x.quoteAmountUSD;
  if(d.quoteAmountUSD!==undefined&&d.quoteAmountUSD!==null&&String(d.quoteAmountUSD).trim()!==""){
    quote=baValidateResourceQuoteAmount_(d.quoteAmountUSD);
    if(Math.round(quote*100)!==Math.round(x.quoteAmountUSD*100)&&x.quotePaymentStatus==="PAID")throw new Error("A paid quotation cannot be changed.");
    if(Math.round(quote*100)!==Math.round(x.quoteAmountUSD*100)&&x.quoteStatus==="APPROVED"&&x.quotePaymentReference){const oldTx=baPaymentProviderVerify_(x.quotePaymentReference),oldStatus=String(oldTx.status||"").toLowerCase();if(oldStatus==="success"){baVerifyAndRecordResourceQuote_(x.quotePaymentReference);throw new Error("The existing quotation payment was successful and has been recorded. The quote cannot be changed.");}if(["failed","abandoned","reversed"].indexOf(oldStatus)<0)throw new Error("The existing payment is not confirmed failed or abandoned. Do not change the quote while the provider transaction is pending.");}
  }
  if(status==="Awaiting payment"&&!(quote>0))throw new Error("Set a valid quotation before moving this request to Awaiting payment.");
  var response=baSafeText_(d.adminResponse,2000,"Response",false),fileId=String(d.deliveryFileId||"").trim(),fileName="";
  if(fileId){if(!/^[A-Za-z0-9_-]{10,}$/.test(fileId))throw new Error("Invalid delivery file reference.");var f;try{f=DriveApp.getFileById(fileId);var size=f.getSize();if(size>4*1024*1024)throw new Error("Delivered files must be 4 MB or smaller for secure portal delivery.");fileName=f.getName()}catch(e){if(String(e.message||e).indexOf("4 MB")>=0)throw e;throw new Error("Google Drive delivery file could not be opened.")}}
  if(status==="In preparation"&&x.quoteAmountUSD>0&&x.quotePaymentStatus!=="PAID")throw new Error("This quoted request cannot enter fulfillment until payment is confirmed by the payment provider.");
  if(status==="Delivered"&&!fileId&&!x.deliveryFileId)throw new Error("Upload a delivery file before marking this request Delivered.");
  if(fileId){sh.getRange(row,m.deliveryFileId).setValue(fileId);sh.getRange(row,m.deliveryFileName).setValue(fileName)}
  if(m.quoteAmountUSD&&Math.round(quote*100)!==Math.round(x.quoteAmountUSD*100)){sh.getRange(row,m.quoteAmountUSD).setValue(quote);sh.getRange(row,m.quoteCurrency).setValue("USD");sh.getRange(row,m.quoteStatus).setValue("PENDING_CLIENT");sh.getRange(row,m.quotePaymentStatus).setValue("NONE");sh.getRange(row,m.quotePaymentReference).setValue("");sh.getRange(row,m.quoteAuthorizationUrl).setValue("");}
  if(status==="Awaiting payment"&&m.quoteStatus&&x.quoteStatus!=="APPROVED")sh.getRange(row,m.quoteStatus).setValue("PENDING_CLIENT");
  sh.getRange(row,m.status).setValue(status);sh.getRange(row,m.adminResponse).setValue(response);sh.getRange(row,m.updatedAt).setValue(new Date());sh.getRange(row,m.lastUpdatedBy).setValue("ADMIN");if(status==="Delivered")sh.getRange(row,m.deliveredAt).setValue(new Date());
  auditAdmin_(d.adminToken,"RESOURCE_REQUEST_UPDATED",id+" status="+status);return json_({ok:true,requestId:id,status:status,quoteAmountUSD:quote})
}
function baFindResourceRequestByPaymentReference_(reference) {
  var target=String(reference||"").trim();if(!target)return null;
  var sh=baResourceRequestSheet_(),m=headerMap_(sh),last=sh.getLastRow();if(last<2)return null;
  var vals=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();
  for(var i=0;i<vals.length;i++){var x=baRequestRow_(vals[i],m);if(x.quotePaymentReference===target)return {row:i+2,request:x,values:vals[i]};}
  return null;
}
function baRequireResourceRequestOwner_(x,c,d) {
  var phone=normalizePhone_(c.clientPhone||d.phone||""),email=String(c.clientEmail||c.email||c.studentEmail||"").trim().toLowerCase(),clientId=String(c.clientId||c.id||phone);
  if(!x||!((x.clientId&&x.clientId===clientId)||(phone&&normalizePhone_(x.clientPhone)===phone)||(email&&x.clientEmail.toLowerCase()===email)))throw new Error("This request does not belong to the verified client.");
}
function clientApproveResourceQuote_(d) {
  var c=requireClientSession_(d.clientSessionToken,d.phone),id=String(d.requestId||""),sh=baResourceRequestSheet_(),m=headerMap_(sh),last=sh.getLastRow(),found=null;
  if(last>1){var vals=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();for(var i=0;i<vals.length;i++){var x=baRequestRow_(vals[i],m);if(x.requestId===id){found={row:i+2,request:x};break}}}
  if(!found)throw new Error("Resource request not found.");var x=found.request;baRequireResourceRequestOwner_(x,c,d);
  if(x.quotePaymentStatus==="PAID"||x.status==="Paid")throw new Error("This quotation is already paid.");
  if(x.status!=="Awaiting payment"||!(x.quoteAmountUSD>0))throw new Error("There is no payable quotation for this request yet.");
  var lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    var current=baRequestRow_(sh.getRange(found.row,1,1,sh.getLastColumn()).getValues()[0],m);
    if(current.quotePaymentStatus==="PAID")throw new Error("This quotation is already paid.");
    if(current.quoteStatus==="APPROVED"&&current.quoteAuthorizationUrl&&current.quotePaymentReference)
      return json_({ok:true,authorizationUrl:current.quoteAuthorizationUrl,reference:current.quotePaymentReference,amountUSD:current.quoteAmountUSD,currency:"USD",reused:true});
    var payEmail=String(current.clientEmail||d.customerEmail||"").trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(payEmail))throw new Error("Enter a valid email address for the payment receipt.");
    var reference="BA-RQ-"+current.requestId.replace(/[^A-Za-z0-9]/g,"")+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase();
    var callback=PropertiesService.getScriptProperties().getProperty(CONFIG.paymentCallbackUrlKey)||"https://kamaujames64-lgtm.github.io/brightace-academy/pages/resource-checkout.html";
    var payment=baPaymentProviderInitialize_({email:payEmail,amountUSD:current.quoteAmountUSD,reference:reference,callbackUrl:callback,metadata:{resourceRequestId:current.requestId,clientId:current.clientId,category:current.category,topic:current.topic}});
    sh.getRange(found.row,m.quoteStatus).setValue("APPROVED");sh.getRange(found.row,m.quotePaymentReference).setValue(payment.reference);sh.getRange(found.row,m.quoteAuthorizationUrl).setValue(payment.authorizationUrl);sh.getRange(found.row,m.quotePaymentStatus).setValue("PENDING");sh.getRange(found.row,m.quoteCurrency).setValue("USD");sh.getRange(found.row,m.updatedAt).setValue(new Date());sh.getRange(found.row,m.lastUpdatedBy).setValue("CLIENT");
    return json_({ok:true,authorizationUrl:payment.authorizationUrl,reference:payment.reference,amountUSD:current.quoteAmountUSD,currency:"USD"});
  } finally {lock.releaseLock();}
}
function baVerifyAndRecordResourceQuote_(reference) {
  var found=baFindResourceRequestByPaymentReference_(reference);if(!found)throw new Error("Resource quotation payment not found.");
  if(found.request.quotePaymentStatus==="PAID")return found.request;
  var tx=baPaymentProviderVerify_(reference);if(String(tx.status||"").toLowerCase()!=="success")return found.request;
  if(Number(tx.amount)!==toPaystackMinorUnit_(found.request.quoteAmountUSD,"USD")||String(tx.currency||"").toUpperCase()!=="USD")throw new Error("Quotation payment amount or currency did not match the approved quote.");
  var lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    found=baFindResourceRequestByPaymentReference_(reference);if(!found)throw new Error("Resource quotation payment not found.");
    if(found.request.quotePaymentStatus==="PAID")return found.request;
    var sh=baResourceRequestSheet_(),m=headerMap_(sh),paidAt=tx.paid_at||new Date();
    sh.getRange(found.row,m.quotePaymentStatus).setValue("PAID");sh.getRange(found.row,m.quoteStatus).setValue("PAID");sh.getRange(found.row,m.quotePaidAt).setValue(paidAt);sh.getRange(found.row,m.status).setValue("Paid");sh.getRange(found.row,m.updatedAt).setValue(new Date());sh.getRange(found.row,m.lastUpdatedBy).setValue("PAYMENT_PROVIDER");
    return Object.assign({},found.request,{quotePaymentStatus:"PAID",quoteStatus:"PAID",quotePaidAt:paidAt,status:"Paid"});
  } finally {lock.releaseLock();}
}

function clientResourceDeliveryAccess_(d){var c=requireClientSession_(d.clientSessionToken,d.phone),id=String(d.requestId||""),phone=normalizePhone_(c.clientPhone||d.phone||""),email=String(c.clientEmail||c.email||c.studentEmail||"").trim().toLowerCase(),clientId=String(c.clientId||c.id||phone),sh=baResourceRequestSheet_(),m=headerMap_(sh),last=sh.getLastRow(),found=null;if(last>1){var rows=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();for(var i=0;i<rows.length;i++){var x=baRequestRow_(rows[i],m);if(x.requestId===id){found=x;break}}}if(!found)throw new Error("Delivered resource not found.");if(!((found.clientId&&found.clientId===clientId)||(phone&&normalizePhone_(found.clientPhone)===phone)||(email&&found.clientEmail.toLowerCase()===email)))throw new Error("This delivery does not belong to the verified client.");if(found.status!=="Delivered"||!found.deliveryFileId)throw new Error("This resource has not been delivered yet.");var f;try{f=DriveApp.getFileById(found.deliveryFileId);var blob=f.getBlob(),bytes=blob.getBytes();if(bytes.length>4*1024*1024)throw new Error("This file is too large for secure portal delivery (4 MB maximum).");return json_({ok:true,fileName:found.deliveryFileName||f.getName(),mimeType:blob.getContentType()||"application/octet-stream",data:Utilities.base64Encode(bytes)})}catch(e){if(String(e.message||e).indexOf("too large")>=0)throw e;throw new Error("The delivered file is currently unavailable.")}}
