
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

/* BrightAce V87: interaction-safe, visibility-aware polling scheduler.
   Polling is staggered to avoid synchronized request bursts. Refreshes never
   overlap, are paused in hidden tabs, and are deferred while the user is typing
   or actively interacting with a control. One shared listener avoids leaks. */
window.BrightAceInteraction = window.BrightAceInteraction || {lastAt:0};
if(!window.__baInteractionListenersBound){
  window.__baInteractionListenersBound=true;
  ['pointerdown','keydown','input','touchstart','wheel'].forEach(function(evt){
    document.addEventListener(evt,function(){window.BrightAceInteraction.lastAt=Date.now();if(document.body)document.body.dataset.baBusyUntil=String(Date.now()+1800)},{passive:true,capture:true});
  });
}
window.BrightAceScheduler = window.BrightAceScheduler || {
  start: function(name, fn, intervalMs, options){
    var active=true,timer=null,running=false,lastRun=0,delay=Math.max(5000,Number(intervalMs)||20000),
        immediateOnVisible=!!(options&&options.immediateOnVisible===true),
        jitter=Math.min(2500,Math.max(250,Math.round(delay*.12)));
    function clear(){if(timer){clearTimeout(timer);timer=null}}
    function userBusy(){
      var el=document.activeElement;
      if(el&&(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)||el.isContentEditable))return true;
      if(document.body&&document.body.dataset.baBusyUntil&&Date.now()<Number(document.body.dataset.baBusyUntil))return true;
      return false;
    }
    function nextDelay(base){return Math.max(1000,base+(Math.random()*2-1)*jitter)}
    function schedule(ms){clear();if(!active||document.hidden)return;timer=setTimeout(tick,nextDelay(ms||delay))}
    async function tick(){
      timer=null;if(!active||document.hidden)return;
      if(running){schedule(delay);return}
      if(userBusy()){schedule(Math.min(delay,5000));return}
      running=true;lastRun=Date.now();
      try{await Promise.resolve(fn(true))}catch(e){}
      finally{running=false;if(active&&!document.hidden)schedule(delay)}
    }
    function visible(){if(!active||document.hidden)return;if(immediateOnVisible&&Date.now()-lastRun>delay*.8&&!userBusy())tick();else schedule(delay)}
    document.addEventListener('visibilitychange',visible);
    schedule(Math.max(1000,delay*Math.random()));
    return function(){active=false;clear();document.removeEventListener('visibilitychange',visible)};
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
    try{window.__baIdleSessionActivate&&window.__baIdleSessionActivate()}catch(e){}
  },
  clear: function(){
    [this.key,"brightace_admin_token_v4","brightace_admin_token_v3","brightace_admin_last_user_activity_v1"].forEach(function(k){localStorage.removeItem(k);sessionStorage.removeItem(k);});
  }
};

/* BrightAce tutor session: one canonical token shared by Tutor Dashboard, Work, Wallet, Profile and Messages. */
window.BrightAceTutorSession = window.BrightAceTutorSession || {
  key: "brightace_tutor_token_v1", handoffKey: "brightace_tutor_handoff_v1", handoffAtKey: "brightace_tutor_handoff_at_v1",
  get: function(){return sessionStorage.getItem(this.key)||localStorage.getItem(this.key)||sessionStorage.getItem("brightace_tutor_token")||localStorage.getItem("brightace_tutor_token")||"";},
  set: function(token){token=String(token||"").trim();if(!token)return;sessionStorage.setItem(this.key,token);localStorage.setItem(this.key,token);sessionStorage.removeItem("brightace_tutor_token");localStorage.removeItem("brightace_tutor_token");try{window.__baIdleSessionActivate&&window.__baIdleSessionActivate()}catch(e){}},
  clear: function(){[this.key,"brightace_tutor_token",this.handoffKey,this.handoffAtKey,"brightace_tutor_last_user_activity_v1"].forEach(function(k){try{sessionStorage.removeItem(k)}catch(e){}try{localStorage.removeItem(k)}catch(e){}});},
  handoff: function(){var t=this.get();if(!t)return "";try{sessionStorage.setItem(this.handoffKey,t);localStorage.setItem(this.handoffKey,t);var now=String(Date.now());sessionStorage.setItem(this.handoffAtKey,now);localStorage.setItem(this.handoffAtKey,now);}catch(e){}return t;},
  consumeHandoff: function(){var t="",at=0;try{t=sessionStorage.getItem(this.handoffKey)||localStorage.getItem(this.handoffKey)||"";at=Number(sessionStorage.getItem(this.handoffAtKey)||localStorage.getItem(this.handoffAtKey)||0);}catch(e){}if(t&&at&&Date.now()-at>120000)t="";if(t)this.set(t);try{sessionStorage.removeItem(this.handoffKey);localStorage.removeItem(this.handoffKey);sessionStorage.removeItem(this.handoffAtKey);localStorage.removeItem(this.handoffAtKey)}catch(e){}return t;}
};
document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest('a[href="tutor-wallet.html"]'):null;if(a&&window.BrightAceTutorSession)window.BrightAceTutorSession.handoff();},true);

/* BrightAce V106: real-user inactivity policy for privileged workspaces.
 * API polling is deliberately NOT counted as user activity. Tutor and admin
 * sessions end after 30 minutes without interaction; client inactivity remains
 * governed by the existing WhatsApp-verification session policy.
 */
(function(){
  "use strict";
  var path=String(location.pathname||"").toLowerCase();
  var isAdmin=/(^|\/)admin(?:[-.]|\/|$)/.test(path)&&!/admin-login\.html$/.test(path)&&!/admin-recovery\.html$/.test(path);
  var isTutor=/(^|\/)tutor(?:[-.]|\.html$|\/)/.test(path)&&!/tutor-login\.html$/.test(path);
  if(!isAdmin&&!isTutor)return;
  var idleMs=30*60*1000,role=isAdmin?"admin":"tutor",stampKey="brightace_"+role+"_last_user_activity_v1";
  var touchEvery=60*1000,lastTouch=0,lastPointerActivity=0,timer=null,expired=false,active=false,apiUrl=window.BRIGHTACE_API_URL||"https://script.google.com/macros/s/AKfycbzs69au8SaV3o8wu2DHzD4VTY96oHVe0c_RUzEzzaMhD7yBkYnXujm_aJE7ZouY-JsK/exec";
  function session(){try{return isAdmin?window.BrightAceAdminSession?.get?.():window.BrightAceTutorSession?.get?.()}catch(e){return ""}}
  function clearSession(){try{if(isAdmin)window.BrightAceAdminSession?.clear?.();else window.BrightAceTutorSession?.clear?.()}catch(e){}try{[stampKey].forEach(function(k){localStorage.removeItem(k);sessionStorage.removeItem(k)});if(isAdmin){["brightace_admin_active_token_v4","brightace_admin_token_v4","brightace_admin_token_v3"].forEach(function(k){localStorage.removeItem(k);sessionStorage.removeItem(k)})}else{["brightace_tutor_token_v1","brightace_tutor_token"].forEach(function(k){localStorage.removeItem(k);sessionStorage.removeItem(k)})}}catch(e){}}
  function loginUrl(){var file=isAdmin?"admin-login.html":"tutor.html";if(path.indexOf("/pages/")<0)file="pages/"+file;return file+"?reason=idle"}
  function expire(){if(expired)return;expired=true;if(timer)clearTimeout(timer);clearSession();try{sessionStorage.setItem("brightace_idle_logout_notice_v1",role)}catch(e){}location.replace(loginUrl())}
  function readStamp(){var n=0;try{n=Number(localStorage.getItem(stampKey)||sessionStorage.getItem(stampKey)||0)}catch(e){}return n}
  function schedule(){if(timer)clearTimeout(timer);timer=null;if(!session())return;var last=readStamp();if(!last){last=Date.now();try{localStorage.setItem(stampKey,String(last));sessionStorage.setItem(stampKey,String(last))}catch(e){}}var left=idleMs-(Date.now()-last);if(left<=0){expire();return}timer=setTimeout(check,left+25)}
  function check(){if(!session())return;if(Date.now()-readStamp()>=idleMs){expire();return}schedule()}
  function touchServer(now){if(now-lastTouch<touchEvery||!session())return;lastTouch=now;var payload=isAdmin?{action:"adminTouchSession",adminToken:session()}:{action:"tutorTouchSession",tutorToken:session()},b=new URLSearchParams();b.set("payload",JSON.stringify(payload));fetch(apiUrl,{method:"POST",body:b,cache:"no-store",keepalive:true}).then(function(r){return r.text()}).then(function(raw){var d;try{d=JSON.parse(raw)}catch(e){return}if(!d.ok&&/login is required|expired|verify/i.test(String(d.error||"")))expire()}).catch(function(){});}
  function activate(){if(expired||!session())return;var now=Date.now(),last=readStamp();if(last&&now-last>=idleMs){expire();return}if(!last){try{localStorage.setItem(stampKey,String(now));sessionStorage.setItem(stampKey,String(now))}catch(e){}}active=true;schedule();touchServer(now)}
  function activity(){if(expired||!session())return;var now=Date.now(),last=readStamp();if(last&&now-last>=idleMs){expire();return}try{localStorage.setItem(stampKey,String(now));sessionStorage.setItem(stampKey,String(now))}catch(e){}active=true;schedule();touchServer(now)}
  ["pointerdown","keydown","input","change","touchstart","wheel","click"].forEach(function(evt){document.addEventListener(evt,activity,{passive:true,capture:true})});
  function pointerMove(){var now=Date.now();if(now-lastPointerActivity>=10000){lastPointerActivity=now;activity()}}
  document.addEventListener("pointermove",pointerMove,{passive:true,capture:true});document.addEventListener("mousemove",pointerMove,{passive:true,capture:true});
  window.addEventListener("storage",function(e){if(e.key===stampKey){schedule()}else if(e.key===(isAdmin?"brightace_admin_active_token_v4":"brightace_tutor_token_v1")&&!e.newValue&&session())expire()});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)check()});window.addEventListener("pageshow",check);
  window.__baIdleSessionActivate=activate;activate();
})();

/* BrightAce V110 — reliable document navigation.
 * The service worker may cache static assets only. HTML pages are always loaded
 * by the browser as complete documents; no navigation interception or prefetch.
 */
(function(){
  "use strict";
  function registerFastNavigation(){
    if(!('serviceWorker' in navigator))return;
    try{
      var base=location.pathname.indexOf('/pages/')>=0?'../':'./';
      navigator.serviceWorker.register(base+'sw.js',{scope:base,updateViaCache:'none'}).catch(function(){});
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',registerFastNavigation,{once:true});else registerFastNavigation();
})();
