const CHAT_KEY="brightace_chat_session_v5";
const DEFAULT_API="https://script.google.com/macros/s/AKfycbx6--Az56QTjbYLQaFB80qLPnD7AUDm0qoVPMX_mmlK_ttV7n5DTIyDHCEvrH9ZGodH/exec";
const CHAT_API_URL=window.BRIGHTACE_CHAT_API_URL||DEFAULT_API;
const POLL_MS=15000, MAX_FILE_MB=25, MAX_ATTACHMENTS=10;

function getRequestedContext(){try{const p=new URLSearchParams(window.location.search);return{service:(p.get("subject")||p.get("service")||"").trim(),resource:(p.get("resource")||"").trim(),help:(p.get("help")||"").trim()}}catch(e){return{service:"",resource:"",help:""}}}
function buildProfessionalRequest(service,resource,help){let s="Hello BrightAce Academy, I would like academic support";if(service)s+=" with "+service;if(resource)s+=(service?".":"")+" I am requesting help with the resource: "+resource;if(help)s+="\n\nHelp requested: "+help;s+=".\n\nPlease let me know the details you need from me. I can provide the specific questions, assignment instructions or requirements, relevant files/materials, and my preferred deadline. I would also like to discuss the appropriate support and next steps.";return s}
function prefillServiceRequest(){const c=getRequestedContext(),field=document.getElementById("taskDescription");if(!field||field.value.trim()||(!c.service&&!c.resource&&!c.help))return;field.value=buildProfessionalRequest(c.service,c.resource,c.help);const heading=document.querySelector("#chatStart h3"),helper=document.querySelector("#chatStart .chat-helper");if(heading)heading.textContent=c.resource?`Request help with ${c.resource}`:`Request help with ${c.service}`;if(helper)helper.textContent=c.resource?`Your request has been started for ${c.resource}. Please review the description and add any specific details before sending your request.`:`Your request has been started for ${c.service}. Please review the description and add any specific details before sending your request.`}

const startBox=document.getElementById("chatStart"),verificationArea=document.getElementById("verificationArea"),chatArea=document.getElementById("chatArea"),chatBody=document.getElementById("chatBody"),chatNotice=document.getElementById("chatNotice"),verificationNotice=document.getElementById("verificationNotice"),fileInput=document.getElementById("fileInput"),attachmentPreview=document.getElementById("attachmentPreview"),messageInput=document.getElementById("messageInput"),messageForm=document.getElementById("messageForm");
let session=null;
try{session=JSON.parse(localStorage.getItem(CHAT_KEY)||"null");}catch(e){localStorage.removeItem(CHAT_KEY);session=null;}
let selectedFiles=[],pollTimer=null,lastMessageSignature="",firstMessageRender=true,lastIncomingMessageIds=new Set(),firstIncomingSync=true,alertAudio=null;const pendingMessages=new Map();
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function apiReady(){return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(CHAT_API_URL)}
function setNotice(text,type="info"){if(!chatNotice)return;chatNotice.textContent=text;chatNotice.className="chat-notice "+type;chatNotice.hidden=!text}
function setVerificationNotice(text,type="info"){if(!verificationNotice)return;verificationNotice.textContent=text;verificationNotice.className="chat-notice "+type;verificationNotice.hidden=!text}
function fmtTime(v){const d=new Date(v);return Number.isNaN(d.getTime())?"":d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
function unlockChatAudio(){try{if(!alertAudio)alertAudio=new(window.AudioContext||window.webkitAudioContext)();if(alertAudio.state==="suspended")alertAudio.resume()}catch(e){}}
function playNewMessageSound(){try{unlockChatAudio();if(!alertAudio||alertAudio.state==="suspended")return;const now=alertAudio.currentTime,o=alertAudio.createOscillator(),g=alertAudio.createGain();o.type="sine";o.frequency.setValueAtTime(740,now);o.frequency.setValueAtTime(980,now+.11);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.14,now+.02);g.gain.exponentialRampToValueAtTime(.0001,now+.22);o.connect(g);g.connect(alertAudio.destination);o.start(now);o.stop(now+.24)}catch(e){}}
const WELCOME_MESSAGE="👋 Welcome to BrightAce Academy! I'm here to help you with your academic questions, assignments, and study needs. How can I help you today?";
function renderAttachment(a){
  if(!a)return"";
  if(Array.isArray(a))return `<div class="message-attachments">${a.map(renderAttachment).join("")}</div>`;
  const name=esc(a.name||"Attachment"),url=a.viewUrl||a.url||"",download=a.downloadUrl||url,type=String(a.mimeType||"");
  if(type.startsWith("image/")&&url)return `<a class="msg-image-link" href="${esc(url)}" target="_blank" rel="noopener"><img class="msg-image" src="${esc(url)}" alt="${name}"></a><div class="msg-file"><span>📎 ${name}</span><span class="msg-file-actions"><a href="${esc(url)}" target="_blank" rel="noopener">Open</a><a href="${esc(download)}" rel="noopener" download>Download</a></span></div>`;
  return `<div class="msg-file"><span>📎 ${name}</span>${url?`<span class="msg-file-actions"><a href="${esc(url)}" target="_blank" rel="noopener">Open</a><a href="${esc(download)}" rel="noopener" download>Download</a></span>`:""}</div>`;
}
function addMessage(m){const d=document.createElement("div"),sender=m.sender==="student"?"student":"admin";d.className="msg "+sender;d.dataset.messageId=m.id||"";d.innerHTML=`<div>${esc(m.text||"").replace(/\n/g,"<br>")}</div>${renderAttachment(m.attachment)}<small>${m.status==="sending"?"Sending…":fmtTime(m.timestamp||new Date())}</small>`;chatBody.appendChild(d)}
function renderMessages(messages){
  const sig=messages.map(m=>`${m.id||""}:${m.status||""}:${m.timestamp||""}:${JSON.stringify(m.attachment||null)}`).join("|");
  if(sig===lastMessageSignature&&chatBody.children.length)return;
  const nearBottom=chatBody.scrollHeight-chatBody.scrollTop-chatBody.clientHeight<90;
  const oldHeight=chatBody.scrollHeight,oldTop=chatBody.scrollTop;
  lastMessageSignature=sig;const pending=[...pendingMessages.values()];chatBody.innerHTML="";
  addMessage({id:"brightace-welcome",sender:"admin",text:WELCOME_MESSAGE,timestamp:session?.started||new Date()});
  messages.forEach(m=>{pendingMessages.delete(m.id);addMessage(m)});
  pending.forEach(m=>{if(!messages.some(x=>x.id===m.id))addMessage(m)});
  if(firstMessageRender||nearBottom)chatBody.scrollTop=chatBody.scrollHeight;
  else chatBody.scrollTop=oldTop+(chatBody.scrollHeight-oldHeight);
  firstMessageRender=false;
}
function openChat(){if(!startBox||!chatArea||!session?.verified)return;startBox.style.display="none";if(verificationArea)verificationArea.style.display="none";chatArea.style.display="block";document.getElementById("studentDisplay").textContent=session?.name||"Student";if(apiReady()){setNotice("Connected to BrightAce live chat.","success");syncMessages();clearInterval(pollTimer);pollTimer=setInterval(()=>{if(!document.hidden)syncMessages(true)},POLL_MS)}else{setNotice("Live chat requires the BrightAce server connection.","warning");renderMessages(session?.localMessages||[])}}
function formatWhatsAppDisplay(phone){const raw=String(phone||"").replace(/\D/g,"");if(!raw)return"WhatsApp number";return raw.startsWith("254")?"+"+raw:String(phone)}
function updateVerificationPhone(){const el=document.getElementById("verificationPhone"),intro=document.getElementById("verificationIntro");if(!session)return;const display=formatWhatsAppDisplay(session.phone);if(el)el.textContent="WhatsApp: "+display;if(intro)intro.textContent="We sent a 6-digit verification code to your WhatsApp number ("+display+"). Enter the code below to securely initiate your BrightAce live chat."}
function showVerification(){if(startBox)startBox.style.display="none";if(chatArea)chatArea.style.display="none";if(verificationArea)verificationArea.style.display="block";updateVerificationPhone();setNotice("Verification required before live chat can begin.","info");document.getElementById("verificationCode")?.focus()}
async function post(action,payload={}){const body=new URLSearchParams();body.set("payload",JSON.stringify({action,...payload}));const r=await fetch(CHAT_API_URL,{method:"POST",body,cache:"no-store"});const raw=await r.text();let d;try{d=JSON.parse(raw)}catch(e){throw Error("BrightAce server returned HTML instead of JSON. Please update the /exec deployment to the latest saved version.")}if(!d.ok)throw new Error(d.error||"Server error");return d}
async function startRemoteChat(){return post("startChat",{id:session.id,name:session.name,phone:session.phone,taskDescription:session.taskDescription,studentBudget:session.studentBudget,currency:session.currency,deadline:session.deadline,consent:true})}
async function sendVerificationRemote(){return post("sendVerification",{conversationId:session.id})}
async function verifyRemoteChat(code){return post("verifyChat",{conversationId:session.id,code:String(code||"").trim()})}
async function resendRemoteCode(){return post("resendVerification",{conversationId:session.id})}
async function syncMessages(background=false){if(!apiReady()||!session?.id||!session?.verified)return;try{const r=await fetch(`${CHAT_API_URL}?action=messages&sessionId=${encodeURIComponent(session.id)}`,{cache:"no-store"}),d=await r.json();if(d.ok){const messages=d.messages||[];const incoming=messages.filter(m=>String(m.sender||"").toLowerCase()!=="student");if(!firstIncomingSync&&incoming.some(m=>m.id&&!lastIncomingMessageIds.has(m.id)))playNewMessageSound();lastIncomingMessageIds=new Set(incoming.map(m=>m.id).filter(Boolean));firstIncomingSync=false;renderMessages(messages);if(!background)setNotice("Connected to BrightAce live chat.","success")}}catch(e){if(!background)setNotice("Live connection is temporarily unavailable. Retrying…","warning")}}
function setSelectedFiles(files){
  selectedFiles=Array.from(files||[]).slice(0,MAX_ATTACHMENTS);
  if((files?.length||0)>MAX_ATTACHMENTS)setNotice(`You can attach up to ${MAX_ATTACHMENTS} files per message.`,"warning");
  if(!attachmentPreview)return;
  if(!selectedFiles.length){attachmentPreview.hidden=true;attachmentPreview.innerHTML="";return}
  const invalid=selectedFiles.find(f=>f.size>MAX_FILE_MB*1024*1024);
  if(invalid){setNotice(`Each file must be smaller than ${MAX_FILE_MB} MB.`,"error");selectedFiles=[];if(fileInput)fileInput.value="";attachmentPreview.hidden=true;return}
  attachmentPreview.hidden=false;
  attachmentPreview.innerHTML=selectedFiles.map((f,i)=>`<span class="attachment-chip">📎 ${esc(f.name)} · ${(f.size/1024/1024).toFixed(1)} MB <button type="button" data-file-index="${i}" aria-label="Remove attachment">×</button></span>`).join("");
  attachmentPreview.querySelectorAll("[data-file-index]").forEach(b=>b.onclick=()=>{selectedFiles.splice(Number(b.dataset.fileIndex),1);if(fileInput)fileInput.value="";setSelectedFiles(selectedFiles)});
}
fileInput?.addEventListener("change",()=>setSelectedFiles(fileInput.files||[]));
const EMOJIS=["😀","😃","😄","😁","😆","😂","🤣","😊","😇","🙂","😉","😍","🥰","😎","🤓","🤩","🥳","😢","😭","😮","😲","🤔","🙄","😴","🤗","👍","👎","👏","🙏","💪","❤️","💯","🔥","✨","🎉","🎓","📚","📖","✏️","📝","🧮","🔬","💡","📊","📈","💻","✅","❌","❓","❗","⭐","🚀","💬"];
function createEmojiPicker(){if(!messageForm)return null;let p=document.getElementById("emojiPicker");if(p)return p;p=document.createElement("div");p.id="emojiPicker";p.className="emoji-picker";EMOJIS.forEach(e=>{const b=document.createElement("button");b.type="button";b.className="emoji-choice";b.textContent=e;b.addEventListener("click",()=>{const s=messageInput.selectionStart??messageInput.value.length,en=messageInput.selectionEnd??messageInput.value.length;messageInput.value=messageInput.value.slice(0,s)+e+messageInput.value.slice(en);messageInput.focus();messageInput.setSelectionRange(s+e.length,s+e.length);p.classList.remove("open")});p.appendChild(b)});messageForm.appendChild(p);return p}
document.getElementById("emojiBtn")?.addEventListener("click",e=>{e.preventDefault();createEmojiPicker()?.classList.toggle("open")});
document.addEventListener("click",e=>{const p=document.getElementById("emojiPicker"),b=document.getElementById("emojiBtn");if(p?.classList.contains("open")&&!p.contains(e.target)&&e.target!==b)p.classList.remove("open")});
document.getElementById("photoBtn")?.addEventListener("click",()=>{fileInput.accept="image/*";fileInput.click()});
document.getElementById("attachBtn")?.addEventListener("click",()=>{fileInput.accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";fileInput.click()});
function saveStartDraft(){try{localStorage.setItem("brightace_start_draft_v2",JSON.stringify({name:document.getElementById("studentName")?.value||"",phone:document.getElementById("studentPhone")?.value||"",taskDescription:document.getElementById("taskDescription")?.value||"",studentBudget:document.getElementById("studentBudget")?.value||"",currency:document.getElementById("studentCurrency")?.value||"KES",deadline:document.getElementById("studentDeadline")?.value||"",consent:!!document.getElementById("consent")?.checked}))}catch(e){}}
function restoreStartDraft(){try{const d=JSON.parse(localStorage.getItem("brightace_start_draft_v2")||localStorage.getItem("brightace_start_draft_v1")||"null");if(!d)return;["studentName","studentPhone","taskDescription","studentBudget","studentDeadline"].forEach(k=>{if(d[k]!==undefined&&document.getElementById(k))document.getElementById(k).value=d[k]});if(d.currency&&document.getElementById("studentCurrency"))document.getElementById("studentCurrency").value=d.currency;if(document.getElementById("consent"))document.getElementById("consent").checked=!!d.consent}catch(e){}}
["studentName","studentPhone","taskDescription","studentBudget","studentCurrency","studentDeadline","consent"].forEach(id=>document.getElementById(id)?.addEventListener("input",saveStartDraft));
restoreStartDraft();
(function applyEntryContext(){
  try{
    const q=new URLSearchParams(location.search),subject=q.get("subject"),resource=q.get("resource");
    const box=document.getElementById("taskDescription");if(!box)return;
    const context=subject?`I need help with ${subject}.`:resource?`I need help with ${resource}.`:"";
    if(context && !box.value.trim())box.value=context;
    if(context)saveStartDraft();
  }catch(e){}
})();

function returnToStartForm(){if(pollTimer){clearInterval(pollTimer);pollTimer=null}if(chatArea)chatArea.style.display="none";if(verificationArea)verificationArea.style.display="none";if(startBox)startBox.style.display="block";session=null;localStorage.removeItem(CHAT_KEY);restoreStartDraft();setNotice("You exited the BrightAce chat.","info")}
function editVerificationNumber(){if(pollTimer){clearInterval(pollTimer);pollTimer=null}if(verificationArea)verificationArea.style.display="none";if(chatArea)chatArea.style.display="none";if(startBox)startBox.style.display="block";const phone=document.getElementById("studentPhone");if(phone){phone.value=session?.phone||phone.value;phone.focus();phone.select()}setNotice("Edit your WhatsApp number, then submit the form again to receive a new verification code.","info");session=null;localStorage.removeItem(CHAT_KEY)}
document.getElementById("exitVerificationBtn")?.addEventListener("click",()=>{saveStartDraft();editVerificationNumber()});
document.getElementById("editNumberBtn")?.addEventListener("click",()=>{saveStartDraft();editVerificationNumber()});
document.getElementById("exitChatBtn")?.addEventListener("click",returnToStartForm);
document.getElementById("startForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const btn=document.getElementById("startChatBtn"),name=document.getElementById("studentName").value.trim(),phone=document.getElementById("studentPhone").value.trim(),task=document.getElementById("taskDescription").value.trim(),budget=Number(document.getElementById("studentBudget").value),currency=document.getElementById("studentCurrency").value,deadline=document.getElementById("studentDeadline").value.trim();
  if(!name||!phone||!task||!(budget>0))return;
  if(!apiReady()){setNotice("The BrightAce verification service is not connected. Please try again when the live service is available.","error");return}
  const oldText=btn?.textContent;
  session={id:"CHAT-"+Date.now().toString(36).toUpperCase(),name,phone,taskDescription:task,studentBudget:budget,currency,deadline,started:new Date().toISOString(),verified:false};
  localStorage.setItem(CHAT_KEY,JSON.stringify(session));localStorage.removeItem("brightace_start_draft_v2");
  // Show verification immediately. The network request is now background work.
  showVerification();setVerificationNotice("Creating your secure request and sending your 6-digit code…","info");
  if(btn){btn.disabled=true;btn.textContent="REQUEST RECEIVED ✓"}
  startRemoteChat().then(data=>{
    if(!data?.ok||!data.conversationId)throw new Error(data?.error||"The server did not create the verification request.");
    session.id=data.conversationId;localStorage.setItem(CHAT_KEY,JSON.stringify(session));
    return sendVerificationRemote();
  }).then(data=>{session.phone=data?.delivery?.phone||session.phone;localStorage.setItem(CHAT_KEY,JSON.stringify(session));updateVerificationPhone();setVerificationNotice("We sent a 6-digit verification code to your WhatsApp number. Enter it below to securely initiate your BrightAce live chat.","success")})
  .catch(err=>{setVerificationNotice(err?.message||"We could not start verification. Please try again.","error");if(btn){btn.disabled=false;btn.textContent=oldText||"START SECURE CHAT →"}})
});

let verificationBusy=false;
async function verifyAndConnect(){if(verificationBusy)return;const input=document.getElementById("verificationCode"),btn=document.getElementById("verifyBtn"),code=input?.value.trim()||"";if(!/^\d{6}$/.test(code))return setVerificationNotice("Enter the 6-digit code sent to your WhatsApp number.","error");verificationBusy=true;if(btn){btn.disabled=true;btn.textContent="VERIFYING…"}try{const d=await verifyRemoteChat(code);session.verified=true;session.clientAccessToken=d.clientAccessToken||session.clientAccessToken||"";session.localMessages=[];localStorage.setItem(CHAT_KEY,JSON.stringify(session));openChat();setNotice(d.message||"WhatsApp verified. Your BrightAce live chat is now connected.","success");post("notifyAdmin",{conversationId:session.id}).catch(()=>{});syncMessages().catch(()=>{})}catch(err){setVerificationNotice(err?.message||"The code could not be verified. Please try again.","error")}finally{verificationBusy=false;if(btn){btn.disabled=false;btn.textContent="VERIFY & CONNECT"}}}
document.getElementById("verificationForm")?.addEventListener("submit",async e=>{e.preventDefault();await verifyAndConnect()});
document.getElementById("verificationCode")?.addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,6);if(e.target.value.length===6)verifyAndConnect()});

document.getElementById("resendBtn")?.addEventListener("click",async()=>{if(!session?.id)return;const btn=document.getElementById("resendBtn");btn.disabled=true;btn.textContent="SENDING…";let exhausted=false;try{const d=await resendRemoteCode();if(d?.delivery?.phone){session.phone=d.delivery.phone;localStorage.setItem(CHAT_KEY,JSON.stringify(session));updateVerificationPhone()}setVerificationNotice((d.message||"A new 6-digit verification code has been sent to your WhatsApp number.")+(typeof d.remainingResends==="number"?" "+d.remainingResends+" new request"+(d.remainingResends===1?"":"s")+" remaining.":""),"success");if(typeof d.remainingResends==="number"&&d.remainingResends<=0){exhausted=true;btn.textContent="NO MORE CODES"}}catch(err){setVerificationNotice(err?.message||"A new code could not be sent.","error")}finally{if(!exhausted){btn.disabled=false;btn.textContent="REQUEST A NEW CODE"}}});


document.getElementById("clientDashboardBtn")?.addEventListener("click",()=>{unlockChatAudio();if(!session?.verified){setNotice("Please verify your WhatsApp number first.","error");return}localStorage.setItem(CHAT_KEY,JSON.stringify(session));sessionStorage.setItem(CHAT_KEY,JSON.stringify(session));location.href="client-dashboard.html"});
messageForm?.addEventListener("pointerdown",unlockChatAudio,{once:true});

messageForm?.addEventListener("submit",e=>{
  e.preventDefault();
  if(!session?.id||!session?.verified){setNotice("Please verify your WhatsApp number before starting the chat.","error");return}
  const text=messageInput.value.trim(),files=[...selectedFiles];
  if(!text&&!files.length)return;
  const sendBtn=messageForm.querySelector(".send-btn"),tempId="local-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  const pending={id:tempId,sender:"student",text,timestamp:new Date(),status:"sending"};
  if(files.length)pending.attachment=files.map(f=>({name:f.name,mimeType:f.type||"application/octet-stream",size:f.size,pending:true}));
  pendingMessages.set(tempId,pending);addMessage(pending);chatBody.scrollTop=chatBody.scrollHeight;
  messageInput.value="";const filesForSend=files;setSelectedFiles([]);if(fileInput)fileInput.value="";
  if(sendBtn){sendBtn.disabled=true;sendBtn.textContent="…"}
  const markFailed=(err)=>{const el=chatBody.querySelector(`[data-message-id="${tempId}"]`);if(el){el.classList.add("failed");const sm=el.querySelector("small");if(sm)sm.textContent="Failed — please try again";}pendingMessages.delete(tempId);setNotice(err?.message||"Message could not be sent. Please try again.","error");if(sendBtn){sendBtn.disabled=false;sendBtn.textContent="➤"}};
  const send=async()=>{
    const attachments=[];
    for(const file of filesForSend){
      const reader=new FileReader();
      const a=await new Promise((resolve,reject)=>{reader.onload=()=>resolve({name:file.name,mimeType:file.type||"application/octet-stream",size:file.size,dataUrl:reader.result});reader.onerror=()=>reject(new Error("Could not read attachment."));reader.readAsDataURL(file)});
      attachments.push(a);
    }
    const data=await post("sendMessage",{sessionId:session.id,text,attachments});
    if(!data?.ok)throw new Error(data?.error||"Message was not accepted by the server.");
    pendingMessages.delete(tempId);
    pendingMessages.set(data.messageId,{id:data.messageId,sender:"student",text,attachment:data.attachment||attachments,timestamp:new Date(),status:"sending"});
    post("deliverMessage",{sessionId:session.id,messageId:data.messageId,text,attachment:data.attachment||attachments}).catch(()=>{});
    setNotice("Message sent.","success");
    if(sendBtn){sendBtn.disabled=false;sendBtn.textContent="➤"}
    setTimeout(()=>syncMessages().catch(()=>{}),350);
  };
  send().catch(markFailed);
});

document.getElementById("refundToggle")?.addEventListener("click",()=>{const panel=document.getElementById("refundPanel"),btn=document.getElementById("refundToggle");if(!panel||!btn)return;const open=panel.hidden;panel.hidden=!open;btn.textContent=open?"✕ CLOSE REFUND REQUEST":"💳 REQUEST A REFUND";if(open)panel.scrollIntoView({behavior:"smooth",block:"nearest"})});
document.getElementById("refundCancel")?.addEventListener("click",()=>{const panel=document.getElementById("refundPanel"),btn=document.getElementById("refundToggle");if(panel)panel.hidden=true;if(btn)btn.textContent="💳 REQUEST A REFUND"});
document.getElementById("refundForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!session?.id||!session?.verified){const n=document.getElementById("refundNotice");if(n){n.textContent="Please verify and start your BrightAce chat before submitting a refund request.";n.className="chat-notice error";n.hidden=false}return}const btn=e.submitter,notice=document.getElementById("refundNotice"),setR=(t,type="info")=>{if(notice){notice.textContent=t;notice.className="chat-notice "+type;notice.hidden=!t}},reason=document.getElementById("refundReason")?.value.trim(),amount=Number(document.getElementById("refundAmount")?.value||0),currency=document.getElementById("refundCurrency")?.value||"KES",paymentRequestId=document.getElementById("refundPaymentRequestId")?.value.trim()||"";if(!paymentRequestId){setR("Please provide your payment/refund code.","error");return}if(!reason){setR("Please provide a reason for your refund request.","error");return}btn.disabled=true;try{await post("submitRefundRequest",{conversationId:session.id,paymentRequestId,amount,currency,reason,studentEmail:""});document.getElementById("refundReason").value="";document.getElementById("refundAmount").value="";setR("Refund request submitted. BrightAce Admin will review it and contact you through the chat/WhatsApp.","success");await syncMessages()}catch(err){setR(err?.message||"Refund request could not be submitted.","error")}finally{btn.disabled=false}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&session?.verified){syncMessages().catch(()=>{})}});


document.getElementById("newChatBtn")?.addEventListener("click",()=>{clearInterval(pollTimer);localStorage.removeItem(CHAT_KEY);localStorage.removeItem("brightace_start_draft_v2");localStorage.removeItem("brightace_start_draft_v1");localStorage.removeItem("brightace_chat_session_v4");location.reload()});

if(session?.verified)openChat();else if(session?.id&&session?.name&&session?.phone){showVerification();setVerificationNotice("Enter the 6-digit code sent to your WhatsApp number. If it has expired, request a new code.","info")}

prefillServiceRequest();
