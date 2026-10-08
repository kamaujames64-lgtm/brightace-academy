/* BrightAce universal message composer: emoji + multi-file attachments. */
(function(){
'use strict';
const EMOJIS=["😀","😃","😄","😁","😂","🤣","😊","😉","😍","🥰","😎","🤩","🥳","😢","😭","😮","😲","🤔","🙄","😴","🤗","👍","👏","🙏","💪","❤️","💯","🔥","✨","🎉","🎓","📚","📖","✏️","📝","🧮","🔬","💡","📊","💻","✅","❌","❓","❗","⭐","🚀","💬"];
const MAX=25*1024*1024, MAX_FILES=10;
const state=new WeakMap();
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function css(){if(document.getElementById("baComposerCss"))return;const s=document.createElement("style");s.id="baComposerCss";s.textContent=`
.ba-composer{position:relative;margin-top:6px}.ba-composer-tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}.ba-composer-tool{border:1px solid #d5e0e8;background:#fff;border-radius:9px;padding:6px 10px;cursor:pointer;font-weight:700;color:#17324d}.ba-composer-tool:hover{background:#f3f8fb}.ba-composer-files{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.ba-composer-file{font-size:.76rem;background:#eef5f8;border-radius:999px;padding:5px 8px;display:inline-flex;gap:5px;align-items:center}.ba-composer-file button{border:0;background:none;cursor:pointer;font-weight:900}.ba-emoji-panel{display:none;position:absolute;z-index:1000;bottom:42px;left:0;width:min(330px,calc(100vw - 30px));padding:10px;background:#fff;border:1px solid #d5e0e8;border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,.15);grid-template-columns:repeat(9,1fr);gap:3px}.ba-emoji-panel.open{display:grid}.ba-emoji-choice{border:0;background:#fff;padding:7px;cursor:pointer;border-radius:7px;font-size:20px}.ba-emoji-choice:hover{background:#eef5f8}`;
document.head.appendChild(s)}
function readFile(f){return new Promise((resolve,reject)=>{if(f.size>MAX)return reject(Error("Each attachment must be 25 MB or smaller."));const r=new FileReader();r.onload=()=>resolve({name:f.name,mimeType:f.type||"application/octet-stream",size:f.size,dataUrl:String(r.result||"")});r.onerror=()=>reject(Error("Could not read "+f.name));r.readAsDataURL(f)})}
function enhance(el){
 if(!el||el.dataset.baComposerEnhanced==="1"||el.disabled||el.readOnly)return;
 el.dataset.baComposerEnhanced="1";css();const st={files:[]};state.set(el,st);
 const wrap=document.createElement("div");wrap.className="ba-composer";el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);
 const tools=document.createElement("div");tools.className="ba-composer-tools";
 const emoji=document.createElement("button");emoji.type="button";emoji.className="ba-composer-tool";emoji.textContent="😊 Emoji";emoji.setAttribute("aria-label","Insert emoji");
 const attach=document.createElement("button");attach.type="button";attach.className="ba-composer-tool";attach.textContent="📎 Attach files";attach.setAttribute("aria-label","Attach files");
 const photo=document.createElement("button");photo.type="button";photo.className="ba-composer-tool";photo.textContent="📷 Photo";photo.setAttribute("aria-label","Take or choose a photo");
 const input=document.createElement("input");input.type="file";input.multiple=true;input.hidden=true;input.accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.mp3,.wav,.m4a,.mp4,.mov,.webm";
 const cam=document.createElement("input");cam.type="file";cam.hidden=true;cam.accept="image/*";cam.capture="user";
 const files=document.createElement("div");files.className="ba-composer-files";
 const panel=document.createElement("div");panel.className="ba-emoji-panel";EMOJIS.forEach(x=>{const b=document.createElement("button");b.type="button";b.className="ba-emoji-choice";b.textContent=x;b.onclick=()=>{const a=el.selectionStart??el.value.length,bp=el.selectionEnd??el.value.length;el.value=el.value.slice(0,a)+x+el.value.slice(bp);el.focus();el.setSelectionRange(a+x.length,a+x.length);panel.classList.remove("open");el.dispatchEvent(new Event("input",{bubbles:true}))};panel.appendChild(b)});
 tools.append(emoji,attach,photo,input,cam);wrap.appendChild(tools);wrap.appendChild(files);wrap.appendChild(panel);
 emoji.onclick=e=>{e.preventDefault();panel.classList.toggle("open")};
 attach.onclick=e=>{e.preventDefault();input.click()};
 photo.onclick=e=>{e.preventDefault();cam.click()};
 document.addEventListener("click",e=>{if(panel.classList.contains("open")&&!panel.contains(e.target)&&e.target!==emoji)panel.classList.remove("open")},{passive:true});
 const add=async list=>{const arr=Array.from(list||[]);if(st.files.length+arr.length>MAX_FILES){alert("You can attach up to 10 files.");return}for(const f of arr){try{st.files.push(await readFile(f))}catch(err){alert(err.message)}}render()};
 const render=()=>{files.innerHTML=st.files.map((f,i)=>`<span class="ba-composer-file" title="${esc(f.name)}">📎 ${esc(f.name.slice(0,28))}<button type="button" data-remove="${i}" aria-label="Remove ${esc(f.name)}">×</button></span>`).join("");files.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{st.files.splice(Number(b.dataset.remove),1);render()})};
 input.onchange=()=>{add(input.files);input.value=""};cam.onchange=()=>{add(cam.files);cam.value=""};
}
function init(root=document){root.querySelectorAll?.("textarea").forEach(enhance)}
window.BrightAceComposer={init,getAttachments:el=>(state.get(el)?.files||[]).slice(),clear:el=>{const x=state.get(el);if(x)x.files=[];init(document);}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>init());else init();
new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)init(n)}))).observe(document.documentElement,{childList:true,subtree:true});
})();