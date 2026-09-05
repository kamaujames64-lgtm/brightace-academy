
const CHAT_KEY="brightace_chat_session_v1";
let session=JSON.parse(localStorage.getItem(CHAT_KEY)||"null");
const startBox=document.getElementById("chatStart"), chatArea=document.getElementById("chatArea"), chatBody=document.getElementById("chatBody");
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function addMessage(text,sender="tutor",time=new Date()){const d=document.createElement("div");d.className="msg "+sender;d.innerHTML=`<div>${esc(text).replace(/\n/g,"<br>")}</div><small style="opacity:.65;display:block;margin-top:4px">${time.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small>`;chatBody.appendChild(d);chatBody.scrollTop=chatBody.scrollHeight}
function openChat(){startBox.style.display="none";chatArea.style.display="block";chatBody.innerHTML="";addMessage("Hi! Welcome to BrightAce Academy. How can I help you today?","tutor");if(session?.firstMessage)addMessage(session.firstMessage,"student",new Date(session.started))}
document.getElementById("startForm")?.addEventListener("submit",async e=>{e.preventDefault();session={id:"CHAT-"+Date.now().toString(36).toUpperCase(),name:document.getElementById("studentName").value.trim(),phone:document.getElementById("studentPhone").value.trim(),firstMessage:document.getElementById("firstMessage").value.trim(),started:new Date().toISOString()};localStorage.setItem(CHAT_KEY,JSON.stringify(session));openChat()});
document.getElementById("messageForm")?.addEventListener("submit",async e=>{e.preventDefault();const i=document.getElementById("messageInput"),t=i.value.trim();if(!t)return;addMessage(t,"student");i.value=""});
if(session)openChat();
