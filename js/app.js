
(function(){
  "use strict";
  const KEY="brightace_alert_sound_v1";
  let ctx=null;
  function unlock(){
    try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume()}catch(e){}
  }
  function play(){
    try{unlock();if(!ctx||ctx.state==="suspended")return;const n=ctx.currentTime;
      const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(720,n);o.frequency.setValueAtTime(960,n+.10);
      g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(.13,n+.02);g.gain.exponentialRampToValueAtTime(.0001,n+.24);
      o.connect(g);g.connect(ctx.destination);o.start(n);o.stop(n+.25);
    }catch(e){}
  }
  function newItems(previous,current){
    if(!(previous instanceof Set)||!(current instanceof Set))return false;
    for(const id of current)if(id&&!previous.has(id))return true;
    return false;
  }
  window.BrightAceSound={unlock,play,newItems};
  document.addEventListener("click",unlock,{once:true,capture:true});
  document.addEventListener("keydown",unlock,{once:true,capture:true});

  const words=[["OPEN","OPENING…"],["CREATE","CREATING…"],["SEND","SENDING…"],["ADD","ADDING…"],["SAVE","SAVING…"],["SUBMIT","SUBMITTING…"],["CONFIRM","CONFIRMING…"],["UPDATE","UPDATING…"],["UPLOAD","UPLOADING…"],["DELETE","DELETING…"],["SUSPEND","SUSPENDING…"],["RESTORE","RESTORING…"],["CHECK","CHECKING…"],["LOGIN","SIGNING IN…"],["VERIFY","VERIFYING…"]];
  function feedback(btn){
    if(!btn||btn.dataset.baBusyGuard==="1"||btn.dataset.noGlobalFeedback==="1")return;
    const original=btn.dataset.baOriginal||btn.textContent.trim(),upper=original.toUpperCase();
    const hit=words.find(x=>upper.includes(x[0]));if(!hit)return;
    btn.dataset.baBusyGuard="1";btn.dataset.baOriginal=original;btn.setAttribute("aria-busy","true");
    btn.textContent=hit[1];
    window.setTimeout(()=>{if(btn.dataset.baBusyGuard==="1"){btn.textContent=original;btn.removeAttribute("aria-busy");delete btn.dataset.baBusyGuard;}},900);
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest("button");
    if(b&&!b.disabled)feedback(b);
  },true);
})();
function toggleMenu(){const nav=document.getElementById("siteNav");if(nav)nav.classList.toggle("open")}
document.addEventListener("click",e=>{const nav=document.getElementById("siteNav");if(nav&&nav.classList.contains("open")&&!e.target.closest(".nav"))nav.classList.remove("open")});
