const CHAT_KEY="brightace_chat_session_v4";
const DEFAULT_API="https://script.google.com/macros/s/AKfycbz3yb5GmCDcyr1epRauGmPVyPFUcmzGy5s3X4Gs74a5J08kFzHHWKC05MX2hHW1UnWH/exec";
const CHAT_API_URL=window.BRIGHTACE_CHAT_API_URL||DEFAULT_API;
const POLL_MS=5000, MAX_FILE_MB=10;

/* SUBJECT / SERVICE PREFILL — preserves the complete request form. */
function getRequestedService(){try{const params=new URLSearchParams(window.location.search);return (params.get("subject")||params.get("service")||"").trim()}catch(e){return ""}}
function buildProfessionalRequest(service){if(!service)return "";return `Hello BrightAce Academy, I would like help with ${service}.\n\nPlease let me know the details you need from me. I can provide the specific questions, assignment instructions or requirements, relevant files/materials, and my preferred deadline. I would also like to discuss the appropriate support and next steps.`}
function prefillServiceRequest(){const service=getRequestedService(),field=document.getElementById("taskDescription");if(!service||!field||field.value.trim())return;field.value=buildProfessionalRequest(service);field.focus();field.setSelectionRange(field.value.length,field.value.length);const heading=document.querySelector("#chatStart h3"),helper=document.querySelector("#chatStart .chat-helper");if(heading)heading.textContent=`Request help with ${service}`;if(helper)helper.textContent=`Your request has been started for ${service}. Please review the description below and add any specific details before sending your request.`}

const startBox=document.getElementById("chatStart"),chatArea=document.getElementById("chatArea"),chatBody=document.getElementById("chatBody"),chatNotice=document.getElementById("chatNotice"),fileInput=document.getElementById("fileInput"),attachmentPreview=document.getElementById("attachmentPreview"),messageInput=document.getElementById("messageInput"),messageForm=document.getElementById("messageForm");
let session=null;
try{session=JSON.parse(localStorage.getItem(CHAT_KEY)||"null");}catch(e){localStorage.removeItem(CHAT_KEY);session=null;}
let selectedFile=null,pollTimer=null,lastMessageSignature="";
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function apiReady(){return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(CHAT_API_URL)}
function setNotice(text,type="info"){if(!chatNotice)return;chatNotice.textContent=text;chatNotice.className="chat-notice "+type;chatNotice.hidden=!text}
function fmtTime(v){const d=new Date(v);return Number.isNaN(d.getTime())?"":d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
const WELCOME_MESSAGE="👋 Welcome to BrightAce Academy! I'm here to help you with your academic questions, assignments, and study needs. How can I help you today?";
function money(n,c){try{return new Intl.NumberFormat(undefined,{style:"currency",currency:c||"KES"}).format(Number(n||0))}catch(e){return `${c||""} ${Number(n||0).toFixed(2)}`}}
function renderAttachment(a){if(!a)return"";const name=esc(a.name||"Attachment"),url=a.viewUrl||a.url||"#",type=String(a.mimeType||"");if(type.startsWith("image/")&&url!=="#")return `<a class="msg-image-link" href="${esc(url)}" target="_blank" rel="noopener"><img class="msg-image" src="${esc(url)}" alt="${name}"></a><div class="msg-file"><span>📎 ${name}</span><a href="${esc(url)}" target="_blank" rel="noopener">View / Download</a></div>`;return `<div class="msg-file"><span>📎 ${name}</span>${url!=="#"?`<a href="${esc(url)}" target="_blank" rel="noopener">View / Download</a>`:""}</div>`}
function addMessage(m){const d=document.createElement("div"),sender=m.sender==="student"?"student":"tutor";d.className="msg "+sender;d.dataset.messageId=m.id||"";d.innerHTML=`<div>${esc(m.text||"").replace(/\n/g,"<br>")}</div>${renderAttachment(m.attachment)}<small>${fmtTime(m.timestamp||new Date())}</small>`;chatBody.appendChild(d)}
function renderMessages(messages){const sig=messages.map(m=>`${m.id||""}:${m.status||""}:${m.timestamp||""}`).join("|");if(sig===lastMessageSignature&&chatBody.children.length)return;lastMessageSignature=sig;chatBody.innerHTML="";addMessage({id:"brightace-welcome",sender:"tutor",text:WELCOME_MESSAGE,timestamp:session?.started||new Date()});messages.forEach(addMessage);chatBody.scrollTop=chatBody.scrollHeight}
function openChat(){if(!startBox||!chatArea)return;startBox.style.display="none";chatArea.style.display="block";document.getElementById("studentDisplay").textContent=session?.name||"Student";if(apiReady()){setNotice("Connected to BrightAce live chat.","success");syncMessages();clearInterval(pollTimer);pollTimer=setInterval(syncMessages,POLL_MS)}else{setNotice("Preview mode: connect the Apps Script URL to make this chat live.","warning");renderMessages(session?.localMessages||[])}}
async function post(action,payload={}){const body=new URLSearchParams();body.set("payload",JSON.stringify({action,...payload}));const r=await fetch(CHAT_API_URL,{method:"POST",body});const d=await r.json();if(!d.ok)throw new Error(d.error||"Server error");return d}
async function startRemoteChat(){return post("startChat",{id:session.id,name:session.name,phone:session.phone,taskDescription:session.taskDescription,studentBudget:session.studentBudget,currency:session.currency,deadline:session.deadline,firstMessage:session.taskDescription,consent:true})}
async function syncMessages(){if(!apiReady()||!session?.id)return;try{const r=await fetch(`${CHAT_API_URL}?action=messages&sessionId=${encodeURIComponent(session.id)}`),d=await r.json();if(d.ok){renderMessages(d.messages||[]);setNotice("Connected to BrightAce live chat.","success")}}catch(e){setNotice("Live connection is temporarily unavailable. Retrying…","warning")}}
function setSelectedFile(file){selectedFile=file||null;if(!attachmentPreview)return;if(!file){attachmentPreview.hidden=true;attachmentPreview.innerHTML="";return}const mb=file.size/1024/1024;if(mb>MAX_FILE_MB){setNotice(`Please choose a file smaller than ${MAX_FILE_MB} MB.`,"error");selectedFile=null;fileInput.value="";attachmentPreview.hidden=true;return}attachmentPreview.hidden=false;attachmentPreview.innerHTML=`<span>📎 ${esc(file.name)} · ${mb.toFixed(1)} MB</span><button type="button" id="removeAttachment" aria-label="Remove attachment">×</button>`;document.getElementById("removeAttachment")?.addEventListener("click",()=>{fileInput.value="";setSelectedFile(null)})}
fileInput?.addEventListener("change",()=>setSelectedFile(fileInput.files?.[0]||null));
const EMOJIS=["😀","😃","😄","😁","😆","😂","🤣","😊","😇","🙂","😉","😍","🥰","😎","🤓","🤩","🥳","😢","😭","😮","😲","🤔","🙄","😴","🤗","👍","👎","👏","🙏","💪","❤️","💯","🔥","✨","🎉","🎓","📚","📖","✏️","📝","🧮","🔬","💡","📊","📈","💻","✅","❌","❓","❗","⭐","🚀","💬"];
function createEmojiPicker(){if(!messageForm)return null;let p=document.getElementById("emojiPicker");if(p)return p;p=document.createElement("div");p.id="emojiPicker";p.className="emoji-picker";EMOJIS.forEach(e=>{const b=document.createElement("button");b.type="button";b.className="emoji-choice";b.textContent=e;b.addEventListener("click",()=>{const s=messageInput.selectionStart??messageInput.value.length,en=messageInput.selectionEnd??messageInput.value.length;messageInput.value=messageInput.value.slice(0,s)+e+messageInput.value.slice(en);messageInput.focus();messageInput.setSelectionRange(s+e.length,s+e.length);p.classList.remove("open")});p.appendChild(b)});messageForm.appendChild(p);return p}
document.getElementById("emojiBtn")?.addEventListener("click",e=>{e.preventDefault();createEmojiPicker()?.classList.toggle("open")});
document.addEventListener("click",e=>{const p=document.getElementById("emojiPicker"),b=document.getElementById("emojiBtn");if(p?.classList.contains("open")&&!p.contains(e.target)&&e.target!==b)p.classList.remove("open")});
document.getElementById("photoBtn")?.addEventListener("click",()=>{fileInput.accept="image/*";fileInput.click()});
document.getElementById("attachBtn")?.addEventListener("click",()=>{fileInput.accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";fileInput.click()});
function saveStartDraft(){try{localStorage.setItem("brightace_start_draft_v1",JSON.stringify({name:document.getElementById("studentName")?.value||"",phone:document.getElementById("studentPhone")?.value||"",taskDescription:document.getElementById("taskDescription")?.value||"",studentBudget:document.getElementById("studentBudget")?.value||"",currency:document.getElementById("studentCurrency")?.value||"KES",deadline:document.getElementById("studentDeadline")?.value||"",consent:!!document.getElementById("consent")?.checked}))}catch(e){}}
function restoreStartDraft(){try{const d=JSON.parse(localStorage.getItem("brightace_start_draft_v1")||"null");if(!d)return;["studentName","studentPhone","taskDescription","studentBudget","studentDeadline"].forEach(k=>{if(d[k]!==undefined&&document.getElementById(k))document.getElementById(k).value=d[k]});if(d.currency&&document.getElementById("studentCurrency"))document.getElementById("studentCurrency").value=d.currency;if(document.getElementById("consent"))document.getElementById("consent").checked=!!d.consent}catch(e){}}
["studentName","studentPhone","taskDescription","studentBudget","studentCurrency","studentDeadline","consent"].forEach(id=>document.getElementById(id)?.addEventListener("input",saveStartDraft));
restoreStartDraft();
document.getElementById("startForm")?.addEventListener("submit",async e=>{e.preventDefault();
  const btn=document.getElementById("startChatBtn");
  const name=document.getElementById("studentName").value.trim();
  const phone=document.getElementById("studentPhone").value.trim();
  const task=document.getElementById("taskDescription").value.trim();
  const budget=Number(document.getElementById("studentBudget").value);
  const currency=document.getElementById("studentCurrency").value;
  const deadline=document.getElementById("studentDeadline").value.trim();
  if(!name||!phone||!task||!(budget>0))return;
  const oldText=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="SENDING REQUEST…";}
  session={id:"CHAT-"+Date.now().toString(36).toUpperCase(),name,phone,taskDescription:task,studentBudget:budget,currency,deadline,started:new Date().toISOString(),localMessages:[]};
  localStorage.setItem(CHAT_KEY,JSON.stringify(session));
  if(!apiReady()){
    session.localMessages=[{sender:"student",text:task,timestamp:new Date()}];
    localStorage.setItem(CHAT_KEY,JSON.stringify(session));
    openChat();renderMessages(session.localMessages);setNotice("Preview mode: the live Apps Script connection is not configured.","warning");
    if(btn){btn.disabled=false;btn.textContent=oldText;}
    return;
  }
  try{
    const data=await startRemoteChat();
    if(!data?.ok||!data.conversationId)throw new Error(data?.error||"The server did not create a conversation.");
    session.id=data.conversationId;session.localMessages=[];localStorage.setItem(CHAT_KEY,JSON.stringify(session));localStorage.removeItem("brightace_start_draft_v1");
    openChat();
    syncMessages().catch(()=>{});
    setNotice("Request sent to BrightAce Admin. Your chat is now connected.","success");
  }catch(err){
    // Keep every field and the generated request locally so a temporary backend
    // error never wipes the student's request. The student can retry safely.
    if(startBox)startBox.style.display="block";
    if(chatArea)chatArea.style.display="none";
    const msg=(err&&err.message)||"We could not send your request. Please try again.";
    setNotice("Request was not submitted: "+msg+" Your information is still on this form; please try again.","error");
  }finally{if(btn){btn.disabled=false;btn.textContent=oldText;}}
});
messageForm?.addEventListener("submit",async e=>{e.preventDefault();
  if(!session?.id){setNotice("Please start a chat first.","error");return;}
  const text=messageInput.value.trim(),file=selectedFile;
  if(!text&&!file)return;
  const sendBtn=messageForm.querySelector(".send-btn");
  if(sendBtn){sendBtn.disabled=true;sendBtn.textContent="…";}
  try{
    let attachment=null;
    if(file){
      const reader=new FileReader();
      attachment=await new Promise((resolve,reject)=>{reader.onload=()=>resolve({name:file.name,mimeType:file.type||"application/octet-stream",size:file.size,dataUrl:reader.result});reader.onerror=()=>reject(new Error("Could not read the attachment."));reader.readAsDataURL(file)})
    }
    if(apiReady()){
      const data=await post("sendMessage",{sessionId:session.id,text,attachment});
      if(!data?.ok)throw new Error(data?.error||"Message was not accepted by the server.");
      // Clear only after the server confirms the message was saved.
      messageInput.value="";setSelectedFile(null);if(fileInput)fileInput.value="";
      // The message is already persisted by the server. Do not make the user
      // wait for a second GET/poll before clearing the composer. Refresh in the background.
      syncMessages().catch(()=>{});
      setNotice(data.whatsapp?.sentTo?"Message sent.":"Message submitted.","success");
    }else{
      session.localMessages=session.localMessages||[];session.localMessages.push({id:"local-"+Date.now(),sender:"student",text,attachment:file?{name:file.name,mimeType:file.type}:null,timestamp:new Date()});
      localStorage.setItem(CHAT_KEY,JSON.stringify(session));messageInput.value="";setSelectedFile(null);if(fileInput)fileInput.value="";renderMessages(session.localMessages);setNotice("Message added in preview mode.","warning");
    }
  }catch(err){
    // Never lose the text the student typed when a network/server error occurs.
    setNotice((err&&err.message)||"Message could not be sent. Please try again.","error");
  }finally{if(sendBtn){sendBtn.disabled=false;sendBtn.textContent="➤";}}
});
document.getElementById("refundToggle")?.addEventListener("click",()=>{const panel=document.getElementById("refundPanel");const btn=document.getElementById("refundToggle");if(!panel||!btn)return;const open=panel.hidden;panel.hidden=!open;btn.textContent=open?"✕ CLOSE REFUND REQUEST":"💳 REQUEST A REFUND";if(open)panel.scrollIntoView({behavior:"smooth",block:"nearest"});});
document.getElementById("refundCancel")?.addEventListener("click",()=>{const panel=document.getElementById("refundPanel"),btn=document.getElementById("refundToggle");if(panel)panel.hidden=true;if(btn)btn.textContent="💳 REQUEST A REFUND";});
document.getElementById("refundForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!session?.id){const n=document.getElementById("refundNotice");if(n){n.textContent="Please start or restore your BrightAce chat before submitting a refund request.";n.className="chat-notice error";n.hidden=false}return}const btn=e.submitter;const notice=document.getElementById("refundNotice");const setR=(t,type="info")=>{if(notice){notice.textContent=t;notice.className="chat-notice "+type;notice.hidden=!t}};const reason=document.getElementById("refundReason")?.value.trim();const amount=Number(document.getElementById("refundAmount")?.value||0);const currency=document.getElementById("refundCurrency")?.value||"KES";const paymentRequestId=document.getElementById("refundPaymentRequestId")?.value.trim()||"";if(!reason){setR("Please provide a reason for your refund request.","error");return}btn.disabled=true;try{const d=await post("submitRefundRequest",{conversationId:session.id,paymentRequestId,amount,currency,reason,studentEmail:""});document.getElementById("refundReason").value="";document.getElementById("refundAmount").value="";setR("Refund request submitted. BrightAce Admin will review it and contact you through the chat/WhatsApp.","success");await syncMessages()}catch(err){setR((err&&err.message)||"Refund request could not be submitted.","error")}finally{btn.disabled=false}});
document.getElementById("newChatBtn")?.addEventListener("click",()=>{clearInterval(pollTimer);localStorage.removeItem(CHAT_KEY);localStorage.removeItem("brightace_chat_session_v3");localStorage.removeItem("brightace_chat_session_v2");location.reload()});
if(session)openChat();


// Prefill only the task description from a selected subject/service.
prefillServiceRequest();
