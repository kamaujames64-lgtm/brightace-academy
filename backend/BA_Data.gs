/* BrightAce V42 — bounded data access helpers. These are intentionally small wrappers so future database migration can happen without changing page code. */
function baSheetValues_(sh,startRow,numRows,startCol,numCols){
  const last=sh.getLastRow();if(last<startRow||numRows<=0)return [];
  const n=Math.min(Number(numRows),last-startRow+1);return sh.getRange(startRow,startCol||1,n,numCols||sh.getLastColumn()).getValues();
}
function baLastRows_(sh,limit){const last=sh.getLastRow();if(last<2)return [];const n=Math.min(Number(limit||100),last-1);return sh.getRange(last-n+1,1,n,sh.getLastColumn()).getValues();}


/* BrightAce V43 — indexed/bounded hot-path helpers. These helpers prefer exact-column
   TextFinder lookups and short-lived per-user indexes over full-sheet reads. */
function baConversationIdsForPhone_(phone){
  const target=normalizePhone_(phone||'');
  if(!target)return [];
  const key='BA_CLIENT_CONV_IDS_'+target;
  const hit=baCacheGetJson_(key);
  if(Array.isArray(hit))return hit;
  const sh=getConversationSheet_(),last=sh.getLastRow();
  if(last<2)return [];
  const m=headerMap_(sh),cells=sh.getRange(2,m.studentPhone,last-1,1)
    .createTextFinder(target).matchEntireCell(true).useRegularExpression(false).findAll();
  const ids=[];
  cells.forEach(function(cell){
    const row=cell.getRow(),id=String(sh.getRange(row,m.conversationId).getValue()||'').trim();
    if(id && ids.indexOf(id)<0)ids.push(id);
  });
  baCachePutJson_(key,ids,30);
  return ids;
}
function baInvalidateClientConversationIndex_(phone){
  const target=normalizePhone_(phone||''); if(target)baCacheRemove_('BA_CLIENT_CONV_IDS_'+target);
}
function baRowsByConversationId_(sh,conversationColumn,conversationId){
  const last=sh.getLastRow(); if(last<2)return [];
  const cells=sh.getRange(2,conversationColumn,last-1,1)
    .createTextFinder(String(conversationId)).matchEntireCell(true).useRegularExpression(false).findAll();
  return cells.map(function(cell){
    const row=cell.getRow();
    return {row:row,values:sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0]};
  });
}
