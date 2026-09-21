const CHAT_KEY="brightace_chat_session_v5";
const DEFAULT_API=(window.BRIGHTACE_API_URL||"https://script.google.com/macros/s/AKfycbzwomGZZZwzKCCAEVhFo9OBTkgz_aKNA6DyO7cIYh_cN8g90e-8dCPl18Bs5XxaH13u/exec");
const CHAT_API_URL=window.BRIGHTACE_CHAT_API_URL||DEFAULT_API;
const POLL_MS=20000, MAX_FILE_MB=25, MAX_ATTACHMENTS=10; let syncMessagesBusy=false;

function showClientStartAfterExpiry(){
  if(startBox)startBox.style.display="block";
  if(verificationArea)verificationArea.style.display="none";
  if(chatArea)chatArea.style.display="none";
  setNotice("Your verified client session could not be restored. Please verify your WhatsApp number again.","warning");
  try{history.replaceState({},document.title,window.location.pathname)}catch(e){}
}
function getRequestedContext(){try{const p=new URLSearchParams(window.location.search);return{service:(p.get("subject")||p.get("service")||"").trim(),resource:(p.get("resource")||"").trim(),help:(p.get("help")||"").trim()}}catch(e){return{service:"",resource:"",help:""}}}
function buildProfessionalRequest(service,resource,help){let s="Hello BrightAce Academy, I would like academic support";if(service)s+=" with "+service;if(resource)s+=(service?".":"")+" I am requesting help with the resource: "+resource;if(help)s+="\n\nHelp requested: "+help;s+=".\n\nPlease let me know the details you need from me. I can provide the specific questions, assignment instructions or requirements, relevant files/materials, and my preferred deadline. I would also like to discuss the appropriate support and next steps.";return s}
function prefillServiceRequest(){const c=getRequestedContext(),field=document.getElementById("taskDescription");if(!field||field.value.trim()||(!c.service&&!c.resource&&!c.help))return;field.value=buildProfessionalRequest(c.service,c.resource,c.help);const heading=document.querySelector("#chatStart h3"),helper=document.querySelector("#chatStart .chat-helper");if(heading)heading.textContent=c.resource?`Request help with ${c.resource}`:`Request help with ${c.service}`;if(helper)helper.textContent=c.resource?`Your request has been started for ${c.resource}. Please review the description and add any specific details before sending your request.`:`Your request has been started for ${c.service}. Please review the description and add any specific details before sending your request.`}

const startBox=document.getElementById("chatStart"),verificationArea=document.getElementById("verificationArea"),chatArea=document.getElementById("chatArea"),chatBody=document.getElementById("chatBody"),chatNotice=document.getElementById("chatNotice"),verificationNotice=document.getElementById("verificationNotice"),fileInput=document.getElementById("fileInput"),attachmentPreview=document.getElementById("attachmentPreview"),messageInput=document.getElementById("messageInput"),messageForm=document.getElementById("messageForm");
let session=null;
try{session=JSON.parse(localStorage.getItem(CHAT_KEY)||"null");}catch(e){localStorage.removeItem(CHAT_KEY);session=null;}
let selectedFiles=[],pollTimer=null,lastMessageSignature="",firstMessageRender=true,lastIncomingMessageIds=new Set(),firstIncomingSync=true,alertAudio=null,lastSyncCursor="";const pendingMessages=new Map();
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
function addMessage(m){const d=document.createElement("div"),sender=m.sender==="student"?"student":"admin";d.className="msg "+sender;d.dataset.messageId=m.id||"";const safeText=esc(m.text||"").replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g,"<br>");d.innerHTML=`<div>${safeText}</div>${renderAttachment(m.attachment)}<small>${m.status==="sending"?"Sending…":fmtTime(m.timestamp||new Date())}</small>`;chatBody.appendChild(d)}
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
function showClientTutorial(){
  const phone=String(session?.phone||"").replace(/\\D/g,"");
  const key=phone?"brightace_client_onboarding_v4_"+phone:"brightace_client_onboarding_v4_guest";
  if(localStorage.getItem(key))return;
  const steps=[
    ["📝","1 OF 5","Start your request","Tell BrightAce what you need, add your WhatsApp number and the request details, then send. No student account is required."],
    ["🔐","2 OF 5","Verify your WhatsApp","We send a 6-digit code to your WhatsApp. Enter it here to securely open your BrightAce support session."],
    ["💬","3 OF 5","Chat with BrightAce","After verification, Live Chat connects you with BrightAce Admin. You can send messages and files while your request is handled."],
    ["📊","4 OF 5","Your dashboard","Your private dashboard shows your requests, progress, tutor information, documents, payments and tutoring sessions."],
    ["🧭","5 OF 5","Move around easily","Use the buttons for Live Chat, Dashboard, Payments and Tutoring. You can return to Live Chat whenever you need help. Your secure session expires after 30 minutes without activity."]
  ];
  let step=0;
  const box=document.createElement("div");box.id="brightaceTutorial";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");
  box.innerHTML=`<div style="position:fixed;inset:0;background:rgba(8,25,40,.58);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px"><div style="position:relative;width:min(500px,100%);background:#fff;border-radius:24px;padding:30px 28px 24px;box-shadow:0 24px 80px rgba(0,0,0,.24);text-align:center"><button id="baTutClose" type="button" aria-label="Close guide" style="position:absolute;right:14px;top:12px;border:0;background:#f1f5f8;border-radius:50%;width:36px;height:36px;font-size:24px;cursor:pointer;color:#486071">×</button><div id="baTutIcon" style="width:64px;height:64px;margin:8px auto 15px;border-radius:20px;background:#eef7f8;display:grid;place-items:center;font-size:30px"></div><div id="baTutStep" style="font-size:11px;font-weight:800;letter-spacing:.12em;color:#54708a;margin-bottom:7px"></div><h2 id="baTutTitle" style="margin:0 0 9px;font-size:25px"></h2><p id="baTutText" style="margin:0 auto;max-width:410px;line-height:1.65;color:#526676"></p><div id="baTutDots" style="display:flex;justify-content:center;gap:7px;margin:22px 0"></div><button id="baTutNext" type="button" class="btn btn-primary"></button><div style="margin-top:12px;font-size:12px;color:#718394">A quick, friendly guide — you can close it at any time.</div></div></div>`;
  document.body.appendChild(box);
  const root=box.firstElementChild,icon=box.querySelector("#baTutIcon"),label=box.querySelector("#baTutStep"),title=box.querySelector("#baTutTitle"),body=box.querySelector("#baTutText"),dots=box.querySelector("#baTutDots"),next=box.querySelector("#baTutNext");
  dots.innerHTML=steps.map((_,i)=>`<span style="width:${i===0?"22px":"7px"};height:7px;border-radius:8px;background:${i===0?"#0f7f8c":"#d6e0e6"};display:block"></span>`).join("");
  const finish=()=>{localStorage.setItem(key,"1");box.remove()};
  const render=()=>{const x=steps[step];icon.textContent=x[0];label.textContent=x[1];title.textContent=x[2];body.textContent=x[3];[...dots.children].forEach((d,i)=>{d.style.width=i===step?"22px":"7px";d.style.background=i===step?"#0f7f8c":"#d6e0e6"});next.textContent=step===steps.length-1?"DONE — LET'S START":"NEXT →"};
  box.querySelector("#baTutClose").onclick=finish;
  next.onclick=()=>{if(step<steps.length-1){step++;render()}else finish()};
  root.addEventListener("click",e=>{if(e.target===root)finish()});
  render();
}
function openChat(){if(!startBox||!chatArea||!session?.verified)return;startBox.style.display="none";if(verificationArea)verificationArea.style.display="none";chatArea.style.display="block";document.getElementById("studentDisplay").textContent=session?.name||"Student";showClientTutorial();if(apiReady()){setNotice("Connected to BrightAce live chat.","success");syncMessages();if(pollTimer)pollTimer();pollTimer=window.BrightAceScheduler.start("client-live-chat",()=>{if(session?.verified)return syncMessages(true)},POLL_MS)}else{setNotice("Live chat requires the BrightAce server connection.","warning");renderMessages(session?.localMessages||[])}}
function formatWhatsAppDisplay(phone){const raw=String(phone||"").replace(/\D/g,"");if(!raw)return"WhatsApp number";return raw.startsWith("254")?"+"+raw:String(phone)}
function updateVerificationPhone(){const el=document.getElementById("verificationPhone"),intro=document.getElementById("verificationIntro");if(!session)return;const display=formatWhatsAppDisplay(session.phone);if(el)el.textContent="WhatsApp: "+display;if(intro)intro.textContent="We sent a 6-digit verification code to your WhatsApp number ("+display+"). Enter the code below to securely initiate your BrightAce live chat."}
function showVerification(){if(startBox)startBox.style.display="none";if(chatArea)chatArea.style.display="none";if(verificationArea)verificationArea.style.display="block";updateVerificationPhone();setNotice("Verification required before live chat can begin.","info");document.getElementById("verificationCode")?.focus()}
async function post(action,payload={}){const body=new URLSearchParams();body.set("payload",JSON.stringify({action,...payload}));const r=await fetch(CHAT_API_URL,{method:"POST",body,cache:"no-store"});const raw=await r.text();let d;try{d=JSON.parse(raw)}catch(e){throw Error("BrightAce /exec returned HTML instead of JSON. This usually means the production Web App is serving an older Apps Script deployment. Redeploy the latest V46 backend as a new version of the SAME Web App and keep the existing /exec URL.")}if(!d.ok)throw new Error(d.error||"Server error");return d}
async function startRemoteChat(){return post("startChat",{id:session.id,name:session.name,phone:session.phone,taskDescription:session.taskDescription,studentBudget:session.studentBudget,currency:session.currency,deadline:session.deadline,consent:true})}
async function sendVerificationRemote(){return post("sendVerification",{conversationId:session.id})}
async function verifyRemoteChat(code){return post("verifyChat",{conversationId:session.id,code:String(code||"").trim()})}
async function resendRemoteCode(){return post("resendVerification",{conversationId:session.id})}
async function syncMessages(background=false,recoveryAttempt=false){if(syncMessagesBusy||!apiReady()||!session?.id||!session?.verified)return;syncMessagesBusy=true;try{const cursor=lastSyncCursor||"";const qs=`action=messages&sessionId=${encodeURIComponent(session.id)}&clientSessionToken=${encodeURIComponent(session.clientSessionToken||"")}&clientAccessToken=${encodeURIComponent(session.clientAccessToken||"")}&phone=${encodeURIComponent(session.phone||"")}&afterMessageId=${encodeURIComponent(cursor)}`;const r=await fetch(`${CHAT_API_URL}?${qs}`,{cache:"no-store"}),raw=await r.text();let d;try{d=JSON.parse(raw)}catch(e){throw Error("BrightAce /exec returned HTML instead of JSON. The production Web App is not serving the current API. Redeploy the latest backend as a new version of the SAME Web App and keep the existing /exec URL.")}if(d.ok){if(d.clientSessionToken){session.clientSessionToken=d.clientSessionToken;session.clientSessionExpiresAt=new Date(Date.now()+30*60*1000).toISOString();session.lastActivityAt=Date.now();localStorage.setItem(CHAT_KEY,JSON.stringify(session));}const messages=(d.messages||[]).slice().sort((a,b)=>new Date(a.timestamp||0)-new Date(b.timestamp||0));if(d.syncCursor)lastSyncCursor=String(d.syncCursor);const incoming=messages.filter(m=>String(m.sender||"").toLowerCase()!=="student");if(!firstIncomingSync&&incoming.some(m=>m.id&&!lastIncomingMessageIds.has(m.id)))playNewMessageSound();lastIncomingMessageIds=new Set([...lastIncomingMessageIds,...incoming.map(m=>m.id).filter(Boolean)]);firstIncomingSync=false;if(messages.length){const existing=[...chatBody.querySelectorAll('.msg')].map(el=>el.dataset.messageId).filter(Boolean);if(cursor&&existing.length){const merged=[];messages.forEach(m=>merged.push(m));const current=session.localMessages||[];renderMessages([...current,...merged]);session.localMessages=[...current,...merged].slice(-100);}else{renderMessages(messages);session.localMessages=messages.slice(-100);}}else if(!cursor){renderMessages([]);session.localMessages=[];}if(!background)setNotice("Connected to BrightAce live chat.","success")}}catch(e){const msg=String(e?.message||"");if(!recoveryAttempt&&session?.clientAccessToken&&/session|expired|verify|verified client|does not belong/i.test(msg)){try{const d=await post("clientDashboardBootstrap",{conversationId:session.id,phone:session.phone,clientSessionToken:session.clientSessionToken||"",clientAccessToken:session.clientAccessToken||""});session.clientAccessToken=d.clientAccessToken||session.clientAccessToken;session.clientSessionToken=d.clientSessionToken||session.clientSessionToken;session.clientSessionExpiresAt=d.clientSessionExpiresAt||session.clientSessionExpiresAt;session.lastActivityAt=Date.now();localStorage.setItem(CHAT_KEY,JSON.stringify(session));lastSyncCursor="";syncMessagesBusy=false;return await syncMessages(background,true)}catch(recoverErr){}}if(!background)setNotice("Live connection is temporarily unavailable. Retrying…","warning")}finally{syncMessagesBusy=false}}function setSelectedFiles(files){
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

function returnToStartForm(){if(pollTimer){pollTimer();pollTimer=null}if(chatArea)chatArea.style.display="none";if(verificationArea)verificationArea.style.display="none";if(startBox)startBox.style.display="block";session=null;localStorage.removeItem(CHAT_KEY);restoreStartDraft();setNotice("You exited the BrightAce chat.","info")}
function editVerificationNumber(){if(pollTimer){pollTimer();pollTimer=null}if(verificationArea)verificationArea.style.display="none";if(chatArea)chatArea.style.display="none";if(startBox)startBox.style.display="block";const phone=document.getElementById("studentPhone");if(phone){phone.value=session?.phone||phone.value;phone.focus();phone.select()}setNotice("Edit your WhatsApp number, then submit the form again to receive a new verification code.","info");session=null;localStorage.removeItem(CHAT_KEY)}
document.getElementById("exitVerificationBtn")?.addEventListener("click",()=>{saveStartDraft();editVerificationNumber()});
document.getElementById("editNumberBtn")?.addEventListener("click",()=>{saveStartDraft();editVerificationNumber()});
document.getElementById("exitChatBtn")?.addEventListener("click",returnToStartForm);
document.getElementById("startForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const btn=document.getElementById("startChatBtn"),name=document.getElementById("studentName").value.trim(),phone=document.getElementById("studentPhone").value.trim(),task=document.getElementById("taskDescription").value.trim()||"General BrightAce support request",budget=Math.max(0,Number(document.getElementById("studentBudget").value||0)),currency=document.getElementById("studentCurrency").value,deadline=document.getElementById("studentDeadline").value.trim();
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
async function verifyAndConnect(){if(verificationBusy)return;const input=document.getElementById("verificationCode"),btn=document.getElementById("verifyBtn"),code=input?.value.trim()||"";if(!/^\d{6}$/.test(code))return setVerificationNotice("Enter the 6-digit code sent to your WhatsApp number.","error");verificationBusy=true;if(btn){btn.disabled=true;btn.textContent="VERIFYING…"}try{const d=await verifyRemoteChat(code);session.verified=true;session.clientAccessToken=d.clientAccessToken||session.clientAccessToken||"";session.clientSessionToken=d.clientSessionToken||session.clientSessionToken||"";session.clientSessionExpiresAt=d.clientSessionExpiresAt||"";session.lastActivityAt=Date.now();session.localMessages=[];lastSyncCursor="";localStorage.setItem(CHAT_KEY,JSON.stringify(session));openChat();setNotice(d.message||"WhatsApp verified. Your BrightAce live chat is now connected.","success");post("notifyAdmin",{conversationId:session.id}).catch(()=>{});syncMessages().catch(()=>{})}catch(err){setVerificationNotice(err?.message||"The code could not be verified. Please try again.","error")}finally{verificationBusy=false;if(btn){btn.disabled=false;btn.textContent="VERIFY & CONNECT"}}}
document.getElementById("verificationForm")?.addEventListener("submit",async e=>{e.preventDefault();await verifyAndConnect()});
document.getElementById("verificationCode")?.addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,6);if(e.target.value.length===6)verifyAndConnect()});

document.getElementById("resendBtn")?.addEventListener("click",async()=>{if(!session?.id)return;const btn=document.getElementById("resendBtn");btn.disabled=true;btn.textContent="SENDING…";let exhausted=false;try{const d=await resendRemoteCode();if(d?.delivery?.phone){session.phone=d.delivery.phone;localStorage.setItem(CHAT_KEY,JSON.stringify(session));updateVerificationPhone()}setVerificationNotice((d.message||"A new 6-digit verification code has been sent to your WhatsApp number.")+(typeof d.remainingResends==="number"?" "+d.remainingResends+" new request"+(d.remainingResends===1?"":"s")+" remaining.":""),"success");if(typeof d.remainingResends==="number"&&d.remainingResends<=0){exhausted=true;btn.textContent="NO MORE CODES"}}catch(err){setVerificationNotice(err?.message||"A new code could not be sent.","error")}finally{if(!exhausted){btn.disabled=false;btn.textContent="REQUEST A NEW CODE"}}});


document.getElementById("securePaymentBtn")?.addEventListener("click",async e=>{
  e.preventDefault();
  const btn=e.currentTarget;
  if(!session?.verified){location.href="chat.html";return;}
  btn.dataset.originalText=btn.dataset.originalText||btn.textContent.trim();
  btn.textContent="OPENING PAYMENT…";
  try{
    const d=await post("clientDashboard",{conversationId:session.id,clientAccessToken:session.clientAccessToken,clientSessionToken:session.clientSessionToken,phone:session.phone});
    const pending=(d.payments||[]).find(x=>String(x.status||"").toUpperCase()!=="PAID"&&x.requestId);
    if(pending) location.href="payment.html?request="+encodeURIComponent(pending.requestId);
    else location.href="client-payments.html";
  }catch(err){ location.href="client-payments.html"; }
});
document.getElementById("clientDashboardBtn")?.addEventListener("click",()=>{unlockChatAudio();if(!session?.verified){setNotice("Please verify your WhatsApp number first.","error");return}session.lastActivityAt=Date.now();localStorage.setItem(CHAT_KEY,JSON.stringify(session));sessionStorage.setItem(CHAT_KEY,JSON.stringify(session));location.href="client-dashboard.html"});
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
    const clientRequestId=tempId;const data=await post("sendMessage",{sessionId:session.id,text,attachments,clientRequestId});
    if(!data?.ok)throw new Error(data?.error||"Message was not accepted by the server.");
    pendingMessages.delete(tempId);
    pendingMessages.set(data.messageId,{id:data.messageId,sender:"student",text,attachment:data.attachment||attachments,timestamp:new Date(),status:"sending"});
    post("deliverMessage",{sessionId:session.id,clientSessionToken:session.clientSessionToken,phone:session.phone,messageId:data.messageId,text,attachment:data.attachment||attachments}).catch(()=>{});
    setNotice("Message sent.","success");
    if(sendBtn){sendBtn.disabled=false;sendBtn.textContent="➤"}
    setTimeout(()=>syncMessages().catch(()=>{}),350);
  };
  send().catch(markFailed);
});

document.addEventListener("visibilitychange",()=>{if(!document.hidden&&session?.verified){syncMessages().catch(()=>{})}});



// Returning clients: open an independent returning-user form, then verify the existing BrightAce request.
const returningForm=document.getElementById("returningClientForm");
const returningArea=document.getElementById("returningClientArea");
const returningVerificationArea=document.getElementById("returningVerificationArea");
const returningVerificationForm=document.getElementById("returningVerificationForm");
const showReturningClientBtn=document.getElementById("showReturningClientBtn");
const hideReturningClientBtn=document.getElementById("hideReturningClientBtn");
let returningConversationId="";
showReturningClientBtn?.addEventListener("click",()=>{
  if(returningArea)returningArea.style.display="block";
  if(document.getElementById("chatStart"))document.getElementById("chatStart").style.display="none";
  document.getElementById("returningClientName")?.focus();
});
hideReturningClientBtn?.addEventListener("click",()=>{
  if(returningArea)returningArea.style.display="none";
  if(document.getElementById("chatStart"))document.getElementById("chatStart").style.display="block";
});
async function beginReturningClient(name,phone){
  const d=await post("returningClientSendVerification",{name,phone});
  returningConversationId=d.conversationId;
  if(returningVerificationArea)returningVerificationArea.style.display="block";
  const intro=document.getElementById("returningVerificationIntro");
  if(intro)intro.textContent="We found your existing BrightAce request. Enter the 6-digit verification code sent to "+(phone||"your WhatsApp number")+".";
  const n=document.getElementById("returningVerificationCode");if(n)n.focus();
  const note=document.getElementById("returningVerificationNotice");if(note){note.textContent=d.message||"A 6-digit verification code has been sent.";note.className="chat-notice success";note.hidden=false}
}
returningForm?.addEventListener("submit",async e=>{
  e.preventDefault();unlockChatAudio();
  const btn=document.getElementById("returningClientBtn");
  const name=document.getElementById("returningClientName")?.value.trim();
  const phone=document.getElementById("returningClientPhone")?.value.trim();
  if(!name||!phone)return;
  if(btn){btn.disabled=true;btn.textContent="SENDING CODE…"}
  try{await beginReturningClient(name,phone);if(btn)btn.textContent="CODE SENT ✓"}catch(err){setNotice(err?.message||"We could not find your existing BrightAce request.","error");if(btn){btn.disabled=false;btn.textContent="SEND VERIFICATION CODE →"}}
});
returningVerificationForm?.addEventListener("submit",async e=>{
  e.preventDefault();unlockChatAudio();
  const btn=document.getElementById("returningVerifyBtn"),code=document.getElementById("returningVerificationCode")?.value.trim();
  if(!returningConversationId||!/^\d{6}$/.test(code||""))return;
  if(btn){btn.disabled=true;btn.textContent="VERIFYING…"}
  try{
    const d=await post("returningClientVerify",{conversationId:returningConversationId,code});
    session={id:d.conversationId||returningConversationId,name:d.clientName||document.getElementById("returningClientName")?.value.trim()||"",phone:document.getElementById("returningClientPhone")?.value.trim()||"",started:new Date().toISOString(),verified:true,clientAccessToken:d.clientAccessToken,clientSessionToken:d.clientSessionToken,clientSessionExpiresAt:d.clientSessionExpiresAt,lastActivityAt:Date.now()};
    localStorage.setItem(CHAT_KEY,JSON.stringify(session));sessionStorage.setItem(CHAT_KEY,JSON.stringify(session));
    if(returningArea)returningArea.style.display="none";
    if(returningVerificationArea)returningVerificationArea.style.display="none";
    openChat();scheduleClientExpiry();setNotice("Welcome back. Your existing BrightAce request is now connected.","success");playNewMessageSound();
  }catch(err){const note=document.getElementById("returningVerificationNotice");if(note){note.textContent=err?.message||"Verification failed. Please try again.";note.className="chat-notice error";note.hidden=false}if(btn){btn.disabled=false;btn.textContent="VERIFY & CONTINUE"}}
});
document.getElementById("returningResendBtn")?.addEventListener("click",async e=>{
  const btn=e.currentTarget,name=document.getElementById("returningClientName")?.value.trim(),phone=document.getElementById("returningClientPhone")?.value.trim();if(!phone||!name)return;
  btn.disabled=true;btn.textContent="SENDING…";
  try{await beginReturningClient(name,phone);btn.textContent="CODE SENT ✓"}catch(err){const note=document.getElementById("returningVerificationNotice");if(note){note.textContent=err?.message||"A new code could not be sent.";note.className="chat-notice error";note.hidden=false}}finally{setTimeout(()=>{btn.disabled=false;btn.textContent="SEND NEW CODE"},800)}
});

document.getElementById("newChatBtn")?.addEventListener("click",()=>{if(pollTimer){pollTimer();pollTimer=null}localStorage.removeItem(CHAT_KEY);localStorage.removeItem("brightace_start_draft_v2");localStorage.removeItem("brightace_start_draft_v1");localStorage.removeItem("brightace_chat_session_v4");location.reload()});

let clientInactivityTimer=null,lastClientServerTouch=0;
if(new URLSearchParams(window.location.search).get("session")==="expired"){session=null;localStorage.removeItem(CHAT_KEY);sessionStorage.removeItem(CHAT_KEY);showClientStartAfterExpiry();}

function expireClientSession(){clearTimeout(clientInactivityTimer);const old=session;session=null;localStorage.removeItem(CHAT_KEY);sessionStorage.removeItem(CHAT_KEY);if(pollTimer){pollTimer();pollTimer=null}if(old?.clientSessionToken)post("clientEndSession",{phone:old.phone,clientSessionToken:old.clientSessionToken}).catch(()=>{});showClientStartAfterExpiry()}
function scheduleClientExpiry(){if(!session?.verified)return;const last=Number(session.lastActivityAt||0),remaining=30*60*1000-(Date.now()-last);if(!last||remaining<=0){expireClientSession();return}clearTimeout(clientInactivityTimer);clientInactivityTimer=setTimeout(expireClientSession,remaining)}
function resetClientActivity(){if(!session?.verified)return;const now=Date.now();if(session.lastActivityAt&&now-Number(session.lastActivityAt)>30*60*1000){expireClientSession();return}session.lastActivityAt=now;try{localStorage.setItem(CHAT_KEY,JSON.stringify(session))}catch(e){}scheduleClientExpiry();if(session.clientSessionToken&&Date.now()-lastClientServerTouch>5*60*1000){lastClientServerTouch=Date.now();post("clientTouchSession",{clientSessionToken:session.clientSessionToken,phone:session.phone}).then(r=>{session.clientSessionExpiresAt=r.expiresAt;localStorage.setItem(CHAT_KEY,JSON.stringify(session));scheduleClientExpiry()}).catch(e=>{if(/session|expired|verify/i.test(String(e?.message||"")))expireClientSession()})}}
document.addEventListener("click",resetClientActivity,{passive:true});document.addEventListener("keydown",resetClientActivity,{passive:true});document.addEventListener("input",resetClientActivity,{passive:true});
if(session?.verified)openChat();else if(session?.id&&session?.name&&session?.phone){showVerification();setVerificationNotice("Enter the 6-digit code sent to your WhatsApp number. If it has expired, request a new code.","info")}

prefillServiceRequest();
if(!session?.verified)showClientTutorial();
if(session?.verified){
  if(!session.clientSessionToken||!session.lastActivityAt||Date.now()-Number(session.lastActivityAt)>30*60*1000)expireClientSession();
  else {openChat();scheduleClientExpiry();}
}
