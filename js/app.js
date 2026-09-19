
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
  const deadlineSeen=new Map();
  function deadlineInfo(job){
    const id=String(job?.conversationId||job?.requestId||job?.assignmentId||"");
    if(!id)return null;
    const raw=job?.deadline;
    if(!raw)return null;
    const dt=new Date(raw).getTime();
    if(!Number.isFinite(dt))return null;
    const hours=(dt-Date.now())/3600000;
    return {id,hours,deadline:dt};
  }
  function checkDeadlines(jobs,options={}){
    const now=Date.now(), windowHours=Number(options.windowHours||24), keyPrefix=String(options.keyPrefix||"deadline");
    const due=[];
    (jobs||[]).forEach(job=>{
      const x=deadlineInfo(job); if(!x || x.hours<0 || x.hours>windowHours)return;
      const day=Math.floor(now/86400000), key=keyPrefix+":"+x.id+":"+day;
      if(!deadlineSeen.has(key)){deadlineSeen.set(key,true);due.push({...x,job});}
    });
    if(due.length) play();
    return due;
  }
  function notify(type,key){
    const k=String(type||"notification")+":"+String(key||Date.now());
    try{
      const seen=JSON.parse(sessionStorage.getItem("brightace_sound_events_v1")||"{}");
      if(seen[k])return false; seen[k]=Date.now();
      const cutoff=Date.now()-86400000;
      Object.keys(seen).forEach(x=>{if(Number(seen[x])<cutoff)delete seen[x]});
      sessionStorage.setItem("brightace_sound_events_v1",JSON.stringify(seen));
    }catch(e){}
    play(); return true;
  }
  window.BrightAceSound={unlock,play,newItems,checkDeadlines,notify};

/* BrightAce V52: visibility-aware polling scheduler. It avoids permanent interval
   timers in background tabs, prevents overlapping refreshes, and refreshes once
   when the page becomes visible again. */
window.BrightAceScheduler = window.BrightAceScheduler || {
  start: function(name, fn, intervalMs, options){
    var active=true, timer=null, running=false, delay=Math.max(5000,Number(intervalMs)||20000), immediateOnVisible=options&&options.immediateOnVisible!==false;
    function clear(){if(timer){clearTimeout(timer);timer=null}}
    function schedule(ms){clear();if(!active||document.hidden)return;timer=setTimeout(tick,Math.max(1000,ms||delay))}
    async function tick(){
      timer=null;if(!active||document.hidden)return;
      if(running){schedule(delay);return}
      running=true;
      try{await Promise.resolve(fn(true))}catch(e){}
      finally{running=false;if(active&&!document.hidden)schedule(delay)}
    }
    function visible(){if(!active||document.hidden)return;if(immediateOnVisible&&!running)tick();else schedule(delay)}
    document.addEventListener("visibilitychange",visible);
    schedule(delay);
    return function(){active=false;clear();document.removeEventListener("visibilitychange",visible)};
  }
};
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
/* BrightAce admin session: one canonical browser token shared by all admin workspaces. */
window.BrightAceAdminSession = window.BrightAceAdminSession || {
  key: "brightace_admin_active_token_v4",
  get: function(){
    return localStorage.getItem(this.key) || sessionStorage.getItem(this.key) ||
      localStorage.getItem("brightace_admin_token_v4") || sessionStorage.getItem("brightace_admin_token_v4") ||
      localStorage.getItem("brightace_admin_token_v3") || sessionStorage.getItem("brightace_admin_token_v3") || "";
  },
  set: function(token){
    token=String(token||"").trim(); if(!token)return;
    localStorage.setItem(this.key,token); sessionStorage.setItem(this.key,token);
    localStorage.setItem("brightace_admin_token_v4",token); sessionStorage.setItem("brightace_admin_token_v4",token);
    localStorage.removeItem("brightace_admin_token_v3"); sessionStorage.removeItem("brightace_admin_token_v3");
  },
  clear: function(){
    [this.key,"brightace_admin_token_v4","brightace_admin_token_v3"].forEach(function(k){localStorage.removeItem(k);sessionStorage.removeItem(k);});
  }
};

/* BrightAce tutor session: one canonical token shared by Tutor Dashboard, Work, Wallet, Profile and Messages. */
window.BrightAceTutorSession = window.BrightAceTutorSession || {
  key: "brightace_tutor_token_v1", handoffKey: "brightace_tutor_handoff_v1", handoffAtKey: "brightace_tutor_handoff_at_v1",
  get: function(){return sessionStorage.getItem(this.key)||localStorage.getItem(this.key)||sessionStorage.getItem("brightace_tutor_token")||localStorage.getItem("brightace_tutor_token")||"";},
  set: function(token){token=String(token||"").trim();if(!token)return;sessionStorage.setItem(this.key,token);localStorage.setItem(this.key,token);sessionStorage.removeItem("brightace_tutor_token");localStorage.removeItem("brightace_tutor_token");},
  clear: function(){[this.key,"brightace_tutor_token",this.handoffKey,this.handoffAtKey].forEach(function(k){try{sessionStorage.removeItem(k)}catch(e){}try{localStorage.removeItem(k)}catch(e){}});},
  handoff: function(){var t=this.get();if(!t)return "";try{sessionStorage.setItem(this.handoffKey,t);localStorage.setItem(this.handoffKey,t);var now=String(Date.now());sessionStorage.setItem(this.handoffAtKey,now);localStorage.setItem(this.handoffAtKey,now);}catch(e){}return t;},
  consumeHandoff: function(){var t="",at=0;try{t=sessionStorage.getItem(this.handoffKey)||localStorage.getItem(this.handoffKey)||"";at=Number(sessionStorage.getItem(this.handoffAtKey)||localStorage.getItem(this.handoffAtKey)||0);}catch(e){}if(t&&at&&Date.now()-at>120000)t="";if(t)this.set(t);try{sessionStorage.removeItem(this.handoffKey);localStorage.removeItem(this.handoffKey);sessionStorage.removeItem(this.handoffAtKey);localStorage.removeItem(this.handoffAtKey)}catch(e){}return t;}
};
document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest('a[href="tutor-wallet.html"]'):null;if(a&&window.BrightAceTutorSession)window.BrightAceTutorSession.handoff();},true);
