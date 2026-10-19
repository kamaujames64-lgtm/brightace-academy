/* BrightAce V66 — speed layer.
 *
 * Goal: keep Sheets as the source of truth while avoiding repeated full-sheet
 * reads on the client/tutor hot paths. All indexes are disposable CacheService
 * data; writes continue to invalidate the relevant caches.
 */
const BA_SPEED_TTL_=30;

function baFastRowsForHeaderValue_(sheet,header,value,cachePrefix){
  return baFastRowsForExact_(sheet,header,String(value||'').trim(),cachePrefix);
}

function baClientSchedulesFast_(phone,conversationIds){
  const target=normalizePhone_(phone||'');
  if(!target)return [];
  const key='BA_CLIENT_SCHEDULES_FAST_'+target;
  const hit=baCacheGetJson_(key); if(Array.isArray(hit))return hit;
  const sh=getScheduleSheet_(),m=headerMap_(sh),rowSet={};
  // Hot path: schedules already carry studentPhone. One indexed lookup is much faster
  // than a TextFinder for every Work ID when a client has many jobs.
  if(m.studentPhone){
    baFastRowsForPhone_(sh,'studentPhone',target,'BA_FAST_SCHED_PHONE').forEach(function(r){rowSet[Number(r)]=1;});
  }
  // Legacy compatibility only when no phone-indexed rows exist.
  if(!Object.keys(rowSet).length){
    (conversationIds||[]).slice(0,40).forEach(function(id){
      const cid=String(id||'').trim(); if(!cid)return;
      baFastRowsForExact_(sh,'conversationId',cid,'BA_FAST_SCHED_CONV_'+cid).forEach(function(r){rowSet[Number(r)]=1;});
    });
  }
  const rows=baFastReadRows_(sh,Object.keys(rowSet).map(Number));
  const out=rows.map(function(x){try{return rowSchedule_(x.values,x.row)}catch(e){return null}}).filter(Boolean);
  out.sort(function(a,b){return new Date((a.date||'')+'T'+(a.startTime||'00:00')).getTime()-new Date((b.date||'')+'T'+(b.startTime||'00:00')).getTime();});
  baCachePutJson_(key,out,BA_SPEED_TTL_); return out;
}

function baTutorProfilesFast_(requests){
  const phones={},names={};
  (requests||[]).forEach(function(x){
    const p=normalizePhone_(x&&x.tutorPhone||''); if(p)phones[p]=1;
    const n=String(x&&x.tutor||x&&x.assignedTutor||'').trim().toLowerCase(); if(n&&n!=='unassigned'&&n!=='tutor assignment pending')names[n]=1;
  });
  const ids=Object.keys(phones).sort(),nameIds=Object.keys(names).sort();
  if(!ids.length&&!nameIds.length)return {};
  const profileVersion=PropertiesService.getScriptProperties().getProperty('BA_TUTOR_PROFILE_CACHE_VERSION')||'1';
  const key='BA_TUTOR_PROFILES_FAST_V4_'+profileVersion+'_'+ids.join(',')+'__N_'+nameIds.join(',');
  const hit=baCacheGetJson_(key); if(hit&&typeof hit==='object')return hit;
  const sh=getTutorSheet_(),m=headerMap_(sh),rowSet={};
  ids.forEach(function(ph){if(m.tutorPhone)baFastRowsForPhone_(sh,'tutorPhone',ph,'BA_FAST_TUTOR_PHONE').forEach(function(r){rowSet[r]=1;});});
  nameIds.forEach(function(n){if(m.tutorName)baFastRowsForExact_(sh,'tutorName',n,'BA_FAST_TUTOR_NAME').forEach(function(r){rowSet[r]=1;});});
  const rows=baFastReadRows_(sh,Object.keys(rowSet).map(Number)),out={};
  for(const item of rows){const r=item.values,phone=m.tutorPhone?normalizePhone_(r[m.tutorPhone-1]||''):'',name=String(m.tutorName?r[m.tutorName-1]||'':'').trim().toLowerCase();
    const profile={profilePictureUrl:tutorProfilePictureUrl_(m.profilePictureUrl?String(r[m.profilePictureUrl-1]||''):''),description:m.description?String(r[m.description-1]||''):'',professionalTitle:m.professionalTitle?String(r[m.professionalTitle-1]||''):'',adminRating:m.adminRating?Math.max(0,Math.min(5,Number(r[m.adminRating-1]||0))):0,tutorPhone:phone,tutorName:String(m.tutorName?r[m.tutorName-1]||'':'')};
    if(phone&&phones[phone])out[phone]=profile;if(name&&names[name])out['name:'+name]=profile;
  }
  baCachePutJson_(key,out,120); return out;
}

function baInvalidateClientSpeedCaches_(phone,conversationId){
  const p=normalizePhone_(phone||''); if(p){
    baCacheRemove_('BA_CLIENT_SCHEDULES_FAST_'+p);
    baCacheRemove_('BA_CLIENT_DASH_'+p);
    baCacheRemove_('BA_CLIENT_REQUEST_HISTORY_'+p);
  }
  if(conversationId)baCacheRemove_('BA_FAST_SCHED_CONV_'+String(conversationId));
}
