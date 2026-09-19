/*
 * BrightAce V47 — Complete Client Request History
 *
 * Contract:
 * - A verified client sees every conversation/request belonging to the verified
 *   WhatsApp number, regardless of current/legacy verification status.
 * - A request disappears only when the Super Admin permanently deletes it.
 * - Uses the V43 conversation index and bounded exact-column lookups.
 * - Dashboard cache is invalidated when a request is created/deleted.
 */
function baClientRequestHistory_(phone){
  const target=normalizePhone_(phone||"");
  if(!target)return [];
  const cacheKey="BA_CLIENT_REQUEST_HISTORY_"+target;
  const hit=baCacheGetJson_(cacheKey);
  if(Array.isArray(hit))return hit;

  const ids=baConversationIdsForPhone_(target);
  const out=[];
  ids.forEach(function(id){
    try{
      const c=findConversation_(id);
      if(!c) return; // permanently deleted requests naturally disappear
      if(normalizePhone_(c.studentPhone)!==target) return;
      const tutorPhone=resolveTutorPhone_(c.assignedTutor,c.assignedTutorPhone||"");
      out.push({
        conversationId:c.conversationId,
        studentName:c.studentName,
        studentPhone:c.studentPhone,
        workDescription:c.workDescription,
        assignmentStatus:c.assignmentStatus,
        tutorWorkStatus:c.tutorWorkStatus,
        tutor:c.assignedTutor,
        assignedTutor:c.assignedTutor,
        tutorPhone:tutorPhone,
        deadline:c.deadline,
        requestedAt:c.startedAt,
        lastMessageAt:c.lastMessageAt,
        completedAt:c.completedAt,
        rejectedAt:c.rejectedAt,
        rejectionReason:c.rejectionReason,
        qaStatus:c.qaStatus,
        feedback:c.clientFeedback,
        assignedAdminName:c.assignedAdminName,
        studentBudget:c.studentBudget,
        agreedAmount:c.agreedAmount,
        currency:c.currency,
        agreedCurrency:c.agreedCurrency,
        tutorPayout:c.tutorPayout,
        brightAceShare:c.brightAceShare,
        status:c.status
      });
    }catch(e){
      console.error("V47 client history row skipped: "+String(e&&e.message||e));
    }
  });
  out.sort(function(a,b){
    return new Date(b.requestedAt||0).getTime()-new Date(a.requestedAt||0).getTime();
  });
  baCachePutJson_(cacheKey,out,30);
  return out;
}

function baInvalidateClientRequestHistory_(phone){
  const target=normalizePhone_(phone||"");
  if(!target)return;
  baCacheRemove_("BA_CLIENT_REQUEST_HISTORY_"+target);
  baInvalidateClientConversationIndex_(target);
  baCacheRemove_("BA_CLIENT_DASH_"+target);
  baCacheRemove_("BA_CLIENT_MSGS_"+target);
}
