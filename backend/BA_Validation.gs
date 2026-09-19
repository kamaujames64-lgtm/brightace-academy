/* BrightAce V42 — centralized request validation. Keep business rules in Code.gs; this layer blocks malformed/oversized input before business logic. */
const BA_ACTION_LIMITS_={
  startChat:{name:160,task:12000},
  sendMessage:{text:12000},
  adminSendMessage:{text:12000},
  tutorAddWorkComment:{text:12000},
  tutorSendAdminMessage:{text:12000},
  clientSendComment:{text:12000},
  submitRefundRequest:{reason:5000},
  returningClientSendVerification:{name:160},
  adminAddClient:{clientName:160,notes:4000},
  adminAddTutor:{tutorName:160},
  adminCreatePaymentRequest:{service:500,description:6000},
  adminAssignWork:{assignedAdminName:160,tutorName:160},
  adminRejectWork:{reason:5000},
  tutorDeclineWork:{reason:5000}
};
function baLimitString_(value,max,label,required){const s=String(value==null?'':value);if(required&&s.trim()==='')throw new Error(label+' is required.');if(s.length>max)throw new Error(label+' is too long.');return s;}
function baValidateActionInput_(body){
  const d=body||{},a=String(d.action||'');
  if(!a)return;
  const cfg=BA_ACTION_LIMITS_[a];if(cfg)Object.keys(cfg).forEach(k=>{if(Object.prototype.hasOwnProperty.call(d,k))baLimitString_(d[k],cfg[k],k.replace(/([A-Z])/g,' $1'),false)});
  if(d.conversationId!=null)baLimitString_(d.conversationId,180,'Conversation ID',false);
  if(d.requestId!=null)baLimitString_(d.requestId,180,'Request ID',false);
  if(d.phone!=null){const p=normalizePhone_(d.phone);if(p && (p.length<7||p.length>18))throw new Error('Enter a valid WhatsApp number.');}
  if(d.code!=null && !/^\d{0,6}$/.test(String(d.code)))throw new Error('Verification code must contain digits only.');
  if(Array.isArray(d.attachments))baValidateAttachmentList_(d.attachments);
  if(d.attachment&&typeof d.attachment==='object')baValidateAttachmentList_([d.attachment]);
  if(d.profilePicture&&typeof d.profilePicture==='object')baValidateAttachmentList_([d.profilePicture],5*1024*1024);
  return true;
}
function baValidateAttachmentList_(items,maxBytes){
  if(!Array.isArray(items)||!items.length)return true;
  if(items.length>10)throw new Error('A maximum of 10 attachments is allowed.');
  let total=0;
  items.forEach(function(a){if(!a||!a.dataUrl)return;const size=Number(a.size||0);if(size<0||size>(maxBytes||25*1024*1024))throw new Error('One of the selected files is too large.');total+=size;baValidateFilename_(a.name);});
  if(total>50*1024*1024)throw new Error('The combined attachment size is too large.');
  return true;
}
function baValidateFilename_(name){const n=String(name||'attachment').trim();if(n.length>180)throw new Error('Attachment filename is too long.');if(/[\u0000-\u001f]/.test(n)||/\.\.(?:[\\/]|$)/.test(n))throw new Error('Attachment filename is not allowed.');return true;}
