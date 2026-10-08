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
  if(m.studentPhone){
    baFastRowsForPhone_(sh,'studentPhone',target,'BA_FAST_SCHED_PHONE').forEach(function(r){rowSet[Number(r)]=1;});
  }
  (conversationIds||[]).forEach(function(id){
    const cid=String(id||'').trim(); if(!cid)return;
    baFastRowsForExact_(sh,'conversationId',cid,'BA_FAST_SCHED_CONV_'+cid).forEach(function(r){rowSet[Number(r)]=1;});
  });
  const rows=baFastReadRows_(sh,Object.keys(rowSet).map(Number));
  const out=rows.map(function(x){try{return rowSchedule_(x.values,x.row)}catch(e){return null}}).filter(Boolean);
  out.sort(function(a,b){return new Date((a.date||'')+'T'+(a.startTime||'00:00')).getTime()-new Date((b.date||'')+'T'+(b.startTime||'00:00')).getTime();});
  baCachePutJson_(key,out,BA_SPEED_TTL_); return out;
}

function baTutorProfilesFast_(requests){
  const phones={};
  (requests||[]).forEach(function(x){const p=normalizePhone_(x&&x.tutorPhone||'');if(p)phones[p]=1;});
  const ids=Object.keys(phones); if(!ids.length)return {};
  const key='BA_TUTOR_PROFILES_FAST_'+ids.sort().join(',');
  const hit=baCacheGetJson_(key); if(hit&&typeof hit==='object')return hit;
  const sh=getTutorSheet_(),m=headerMap_(sh),out={};
  ids.forEach(function(phone){
    const rows=m.tutorPhone?baFastRowsForPhone_(sh,'tutorPhone',phone,'BA_FAST_TUTOR_PHONE'):[];
    if(rows.length){
      const batch=baFastReadRows_(sh,[rows[rows.length-1]]);
      const x=batch[0]; if(x){
        const r=x.values;out[phone]={profilePictureUrl:tutorProfilePictureUrl_(m.profilePictureUrl?String(r[m.profilePictureUrl-1]||''):''),description:m.description?String(r[m.description-1]||''):''};
      }
    }
  });
  baCachePutJson_(key,out,60); return out;
}

function baInvalidateClientSpeedCaches_(phone,conversationId){
  const p=normalizePhone_(phone||''); if(p){
    baCacheRemove_('BA_CLIENT_SCHEDULES_FAST_'+p);
    baCacheRemove_('BA_CLIENT_DASH_'+p);
    baCacheRemove_('BA_CLIENT_REQUEST_HISTORY_'+p);
  }
  if(conversationId)baCacheRemove_('BA_FAST_SCHED_CONV_'+String(conversationId));
}
