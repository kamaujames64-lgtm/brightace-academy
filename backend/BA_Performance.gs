/* BrightAce V63 — hot-path performance/index layer.
   Caches only lookup indexes and public catalog data. Source-of-truth remains Sheets.
   Security-sensitive access status is always read from the current row after locating it. */
const BA_V63_CACHE_TTL_=30;
function baResourceInvalidateIndexes_(){
  ['BA_V63_RESOURCES_PUBLIC','BA_V63_RESOURCES_ALL','BA_V63_PURCHASE_INDEX','BA_V63_ACCESS_INDEX','BA_V63_PAID_KEYS'].forEach(baCacheRemove_);
}
function baResourceIndex_(sheetName,idHeader,cacheKey){
  const hit=baCacheGetJson_(cacheKey); if(hit&&hit.map)return hit.map;
  const sh=sheetName==='RESOURCE_ACCESS'?baAccessSheet_():baPurchaseSheet_(),m=headerMap_(sh),last=sh.getLastRow(),map={};
  if(last>1){const col=m[idHeader]; if(col){const vals=sh.getRange(2,col,last-1,1).getValues(); for(let i=0;i<vals.length;i++){const id=String(vals[i][0]||'').trim();if(id)map[id]=i+2;}}}
  baCachePutJson_(cacheKey,{map:map},BA_V63_CACHE_TTL_); return map;
}
function baPurchaseIndex_(){return baResourceIndex_('RESOURCE_PURCHASES','purchaseId','BA_V63_PURCHASE_INDEX')}
function baAccessIndex_(){return baResourceIndex_('RESOURCE_ACCESS','purchaseId','BA_V63_ACCESS_INDEX')}
function baPaidKeySet_(){
  const hit=baCacheGetJson_('BA_V63_PAID_KEYS'); if(hit&&hit.keys)return hit.keys;
  const sh=baPurchaseSheet_(),m=headerMap_(sh),last=sh.getLastRow(),keys={};
  if(last>1){const vals=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){const p=baPurchaseFromRow_(vals[i],i+2,m);if(p.status==='PAID'&&!p.accessRevokedAt){if(p.customerEmail)keys[p.resourceId+'|e|'+p.customerEmail]=1;const ph=normalizePhone_(p.customerPhone);if(ph)keys[p.resourceId+'|p|'+ph]=1;}}}
  baCachePutJson_('BA_V63_PAID_KEYS',{keys:keys},BA_V63_CACHE_TTL_); return keys;
}
function baCachedResourceList_(publishedOnly){
  const key=publishedOnly?'BA_V63_RESOURCES_PUBLIC':'BA_V63_RESOURCES_ALL',hit=baCacheGetJson_(key);if(hit&&Array.isArray(hit.rows))return hit.rows;
  const sh=baResourceSheet_(),last=sh.getLastRow(),out=[];if(last>1){const vals=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();vals.forEach(function(v,i){const x=baResourceRow_(v,i+2);if(x.resourceId&&x.title&&(!publishedOnly||x.published))out.push(x)});}
  out.sort(function(a,b){return Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title).localeCompare(String(b.title))});baCachePutJson_(key,{rows:out},BA_V63_CACHE_TTL_);return out;
}
