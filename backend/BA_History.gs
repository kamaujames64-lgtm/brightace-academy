/**
 * BrightAce Academy — V46 Admin History fast-path helpers
 *
 * Keeps the History response compact and cacheable without exposing
 * verification/session hashes or other internal conversation fields.
 */

function baHistoryRecord_(r,row,m){
  return {
    row:row,
    conversationId:String(r[m.conversationId-1]||""),
    studentName:String(r[m.studentName-1]||""),
    studentPhone:String(r[m.studentPhone-1]||""),
    studentEmail:String(m.studentEmail?r[m.studentEmail-1]||"":""),
    assignedTutor:String(r[m.assignedTutor-1]||"Unassigned"),
    assignedTutorPhone:String(m.assignedTutorPhone?r[m.assignedTutorPhone-1]||"":""),
    assignedAdminName:String(m.assignedAdminName?r[m.assignedAdminName-1]||"":""),
    workDescription:String(r[m.workDescription-1]||""),
    studentBudget:Number(r[m.studentBudget-1]||0),
    currency:String(r[m.currency-1]||"KES").toUpperCase(),
    agreedAmount:Number(r[m.agreedAmount-1]||r[m.studentBudget-1]||0),
    agreedCurrency:String(r[m.agreedCurrency-1]||r[m.currency-1]||"KES").toUpperCase(),
    tutorPayout:Number(r[m.tutorPayout-1]||0),
    brightAceShare:Number(r[m.brightAceShare-1]||0),
    deadline:m.deadline?r[m.deadline-1]:"",
    startedAt:m.startedAt?r[m.startedAt-1]:"",
    lastMessageAt:m.lastMessageAt?r[m.lastMessageAt-1]:"",
    assignmentStatus:String(r[m.assignmentStatus-1]||"NEW_REQUEST"),
    status:String(r[m.status-1]||"open"),
    completedAt:m.completedAt?r[m.completedAt-1]:"",
    rejectedAt:m.rejectedAt?r[m.rejectedAt-1]:"",
    rejectionReason:m.rejectionReason?String(r[m.rejectionReason-1]||""):""
  };
}

function baHistoryCacheGet_(){
  const cache=CacheService.getScriptCache();
  const metaRaw=cache.get("BA_ADMIN_WORK_HISTORY");
  if(!metaRaw)return null;
  const meta=safeJson_(metaRaw);
  if(!meta)return null;

  if(meta.mode==="single"){
    const works=safeJson_(meta.data||"");
    if(!Array.isArray(works))return null;
    return baHistoryBuckets_(works);
  }

  if(meta.mode==="pages"&&Number(meta.pages)>0){
    const works=[];
    for(let i=0;i<Number(meta.pages);i++){
      const page=safeJson_(cache.get("BA_ADMIN_WORK_HISTORY_P"+i)||"");
      if(!Array.isArray(page))return null;
      for(let j=0;j<page.length;j++)works.push(page[j]);
    }
    return baHistoryBuckets_(works);
  }
  return null;
}

function baHistoryBuckets_(works){
  const completed=works.filter(isHistoryCompleted_);
  const rejected=works.filter(isHistoryRejected_);
  const pending=works.filter(isHistoryPending_);
  return {works:works,pending:pending,completed:completed,rejected:rejected};
}

function baHistoryCachePut_(payload){
  const cache=CacheService.getScriptCache();
  const works=Array.isArray(payload&&payload.works)?payload.works:[];
  const serialized=JSON.stringify(works);

  // Apps Script CacheService values are limited in size. Keep a safe margin
  // below the documented limit rather than letting a large History silently
  // disappear from cache.
  if(serialized.length<=85000){
    try{
      cache.put("BA_ADMIN_WORK_HISTORY",JSON.stringify({mode:"single",data:serialized}),45);
      return;
    }catch(e){}
  }

  // Large history: split only the compact display records into cache pages.
  const PAGE=35;
  const pages=Math.ceil(works.length/PAGE);
  try{
    for(let i=0;i<pages;i++){
      cache.put("BA_ADMIN_WORK_HISTORY_P"+i,JSON.stringify(works.slice(i*PAGE,(i+1)*PAGE)),45);
    }
    cache.put("BA_ADMIN_WORK_HISTORY",JSON.stringify({mode:"pages",pages:pages}),45);
  }catch(e){
    // Cache is an optimization only. The live response remains authoritative.
    console.error("V46 History page cache write failed: "+String(e&&e.message||e));
  }
}
