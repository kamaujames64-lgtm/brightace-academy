/* BrightAce client workspace shell + shared verified-session/data layer.
   Client ↔ Admin communication remains in chat.html.
   Client ↔ Tutor communication lives on the website against the same Work ID. */
(function(){
  "use strict";
  const KEY='brightace_chat_session_v5', LEGACY='brightace_client_session_v4';
  const API=window.BRIGHTACE_API_URL||'https://script.google.com/macros/s/AKfycbzwomGZZZwzKCCAEVhFo9OBTkgz_aKNA6DyO7cIYh_cN8g90e-8dCPl18Bs5XxaH13u/exec';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function getSession(){
    try{return JSON.parse(localStorage.getItem(KEY)||sessionStorage.getItem(KEY)||localStorage.getItem(LEGACY)||sessionStorage.getItem(LEGACY)||'null')}catch(e){return null}
  }
  function saveSession(s){try{localStorage.setItem(KEY,JSON.stringify(s));sessionStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
  function clearSession(){try{localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);localStorage.removeItem(LEGACY);sessionStorage.removeItem(LEGACY)}catch(e){}}
  function nav(active){
    const links=[
      ['client-dashboard.html','⌂','Dashboard'],
      ['client-requests.html','▤','My Requests'],
      ['client-tutoring.html','♟','My Tutor & Sessions'],
      ['chat.html','✉','Live Chat — Admin'],
      ['client-resources.html','▣','Study Resources'],
      ['client-work.html','▤','Assignments & Work'],
      ['client-progress.html','◒','My Progress'],
      ['client-payments.html','▰','Payments & Invoices'],
      ['client-profile.html','⚙','Profile & Settings']
    ];
    return `<aside class="ba-client-sidebar"><div class="ba-sidebar-brand"><a href="../index.html"><img src="../assets/brightace-logo.webp" alt="BrightAce Academy"></a><div><strong>Bright<span>Ace</span></strong><small>ACADEMY</small></div></div><nav>${links.map(x=>`<a class="${active===x[0]?'active':''}" href="${x[0]}"><span>${x[1]}</span>${x[2]}</a>`).join('')}</nav><div class="ba-sidebar-tip">💡 <strong>Small steps every day lead to big results!</strong><small>BrightAce Academy<br>Your success matters</small></div></aside>`
  }
  function head(s){const name=esc(s?.name||'Verified Client');const initial=esc((s?.name||'C').trim().charAt(0).toUpperCase());return `<header class="ba-client-top"><button class="ba-menu" type="button" aria-label="Open client menu">☰</button><div></div><div class="ba-top-profile"><span class="ba-avatar">${initial}</span><span><strong>${name}</strong><small>Client</small></span><span>⌄</span></div></header>`}
  async function post(action,p={},method='POST'){
    const payload={action,...p};
    if(method==='GET'){
      const u=new URL(API);u.searchParams.set('action',action);Object.keys(p).forEach(k=>u.searchParams.set(k,p[k]??''));
      const r=await fetch(u,{cache:'no-store'});const d=await r.json();if(!d.ok)throw Error(d.error||'Request failed');return d;
    }
    const b=new URLSearchParams();b.set('payload',JSON.stringify(payload));
    const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),45000);
    try{const r=await fetch(API,{method:'POST',body:b,cache:'no-store',signal:ctrl.signal});const raw=await r.text();let d;try{d=JSON.parse(raw)}catch(e){throw Error('BrightAce Apps Script returned HTML instead of JSON. Please deploy the latest backend to the existing /exec URL.')}if(!d.ok)throw Error(d.error||'Request failed');return d}
    catch(e){if(e.name==='AbortError')throw Error('BrightAce is taking too long to respond. Please refresh and try again.');throw e}
    finally{clearTimeout(tm)}
  }
  async function ensureSession(s){
    if(!s?.verified||!s.phone||!(s.id||s.conversationId))return false;
    try{
      const d=await post('clientDashboardBootstrap',{conversationId:s.id||s.conversationId,phone:s.phone,clientSessionToken:s.clientSessionToken||'',clientAccessToken:s.clientAccessToken||''});
      s.clientAccessToken=d.clientAccessToken||s.clientAccessToken||'';
      s.clientSessionToken=d.clientSessionToken||s.clientSessionToken||'';
      s.clientSessionExpiresAt=d.clientSessionExpiresAt||d.expiresAt||s.clientSessionExpiresAt||'';
      s.lastActivityAt=Date.now();saveSession(s);return true;
    }catch(e){
      // A recoverable token problem should be surfaced clearly; do not silently render empty pages.
      throw e;
    }
  }
  async function loadDashboard(s){
    await ensureSession(s);
    const d=await post('clientDashboard',{conversationId:s.id||s.conversationId,clientAccessToken:s.clientAccessToken,clientSessionToken:s.clientSessionToken,phone:s.phone});
    if(d.clientSessionToken&&d.clientSessionToken!==s.clientSessionToken){s.clientSessionToken=d.clientSessionToken;saveSession(s)}
    return d;
  }
  function shellError(root,e){root.innerHTML=`<div class="ba-error"><strong>We couldn't load this client workspace yet.</strong><p>${esc(e?.message||'Please try again.')}</p><p><a class="btn btn-primary" href="chat.html">RETURN TO LIVE CHAT</a></p></div>`}
  function statusOf(x){return String(x?.assignmentStatus||x?.status||'NEW REQUEST').replace(/_/g,' ')}
  function tutorOf(x){return x?.assignedTutor||x?.tutor||'Not assigned'}
  function render(page,d,s){
    const root=document.querySelector('[data-client-root]');if(!root)return;
    const reqs=Array.isArray(d.requests)?d.requests:[],cur=d.currentRequest||reqs[0]||{},sched=Array.isArray(d.schedules)?d.schedules:[],msgs=Array.isArray(d.messages)?d.messages:[],payments=Array.isArray(d.payments)?d.payments:[],subs=Array.isArray(d.tutorSubmissions)?d.tutorSubmissions:[];
    const status=statusOf(cur),tutor=tutorOf(cur);
    if(page==='requests'){
      root.innerHTML=`<div class="ba-page-head"><div><div class="eyebrow">CLIENT WORKSPACE</div><h1>My Requests</h1><p>Track every BrightAce request from intake through tutor assignment, delivery and completion.</p></div><a class="btn btn-primary" href="chat.html">＋ NEW REQUEST</a></div><div class="ba-stat-strip"><div><strong>${reqs.length}</strong><span>Total Requests</span></div><div><strong>${reqs.filter(x=>/COMPLETED|DONE|DELIVERED/i.test(statusOf(x))).length}</strong><span>Completed</span></div><div><strong>${reqs.filter(x=>!/COMPLETED|DONE|DELIVERED|CANCELLED|REJECTED/i.test(statusOf(x))).length}</strong><span>Active</span></div></div><div class="ba-card-grid">${reqs.map((x,i)=>`<article class="ba-card"><div class="ba-card-top"><div class="ba-icon">${i%2?'▤':'◉'}</div><span class="ba-pill ${/COMPLETED|DONE|DELIVERED/i.test(statusOf(x))?'green':''}">${esc(statusOf(x))}</span></div><h3>${esc(x.workDescription||x.subject||x.conversationId||'BrightAce Request')}</h3><p class="muted"><strong>Work ID:</strong> ${esc(x.conversationId||'—')}</p><div class="ba-meta-grid"><span><b>Tutor</b>${esc(tutorOf(x))}</span><span><b>Admin</b>${esc(x.assignedAdminName||'BrightAce Admin')}</span><span><b>Deadline</b>${esc(x.deadline||'As agreed')}</span><span><b>Payment</b>${esc(x.paymentStatus||'See Payments')}</span></div><button class="btn btn-outline" data-req="${esc(x.conversationId)}">OPEN WORKSPACE →</button></article>`).join('')||'<div class="ba-empty">No requests found yet. Start a request through BrightAce Live Chat.</div>'}</div>`;
      root.querySelectorAll('[data-req]').forEach(b=>b.onclick=()=>location.href='client-work.html?request='+encodeURIComponent(b.dataset.req));return;
    }
    if(page==='work'){
      const filter=new URLSearchParams(location.search).get('request');const list=filter?reqs.filter(x=>String(x.conversationId)===filter):reqs;
      root.innerHTML=`<div class="ba-page-head"><div><div class="eyebrow">CLIENT WORKSPACE</div><h1>Assignments &amp; Work</h1><p>Everything for a request stays attached to one Work ID — documents, tutor work, comments, sessions and admin updates.</p></div><a class="btn btn-outline" href="client-requests.html">← MY REQUESTS</a></div><div class="ba-work-list">${list.map(x=>{const id=String(x.conversationId||'');return `<article class="ba-card ba-work-card" data-work-id="${esc(id)}"><div class="ba-work-head"><div><span class="ba-pill">${esc(statusOf(x))}</span><h2>${esc(x.workDescription||id)}</h2><p class="muted">Work ID: ${esc(id)} · Tutor: ${esc(tutorOf(x))} · Admin: ${esc(x.assignedAdminName||'BrightAce Admin')}</p></div><a class="btn btn-primary" href="client-tutoring.html?request=${encodeURIComponent(id)}">TUTOR SPACE</a></div><div class="ba-work-columns"><div><h4>📎 Client Documents</h4><div data-docs><p class="muted">Loading…</p></div></div><div><h4>📤 Tutor Submissions</h4><div data-submissions><p class="muted">Loading…</p></div></div><div><h4>💬 Tutor Chat &amp; Activity</h4><div data-activity><p class="muted">Loading…</p></div></div></div><div class="ba-tutor-chat"><div><strong>Message your tutor</strong><small>Website chat for this Work ID. BrightAce Admin can see the work record for oversight. This does not use Live Chat.</small></div><div class="ba-chat-row"><textarea data-chat-input rows="2" placeholder="Write a message to ${esc(tutorOf(x))}…"></textarea><button class="btn btn-primary" data-send-chat="${esc(id)}">SEND</button></div><div data-chat-status class="muted"></div></div></article>`}).join('')||'<div class="ba-empty">No assignments found yet.</div>'}</div>`;
      root.querySelectorAll('[data-work-id]').forEach(async card=>{
        const id=card.dataset.workId;
        try{
          const r=await post('clientGetRequest',{conversationId:id,clientSessionToken:s.clientSessionToken,clientAccessToken:s.clientAccessToken,phone:s.phone});
          const x=r.request||{},ms=Array.isArray(x.messages)?x.messages:[],docs=Array.isArray(x.documents)?x.documents:[],tutorMsgs=ms.filter(m=>/^(student|tutor)$/i.test(String(m.sender||'')) && !/admin|whatsapp/i.test(String(m.source||'')));
          card.querySelector('[data-docs]').innerHTML=docs.map(a=>`<p>📄 ${esc(a.name||a.fileName||'Attachment')} ${a.viewUrl?`<a href="${esc(a.viewUrl)}" target="_blank" rel="noopener">OPEN</a>`:''}</p>`).join('')||'<p class="muted">No documents yet.</p>';
          card.querySelector('[data-submissions]').innerHTML=tutorMsgs.filter(m=>String(m.sender||'').toLowerCase()==='tutor'&&m.attachment).map(m=>`<p>${esc(m.text||'Tutor submission')} ${m.attachment?.viewUrl?`<a href="${esc(m.attachment.viewUrl)}" target="_blank" rel="noopener">OPEN</a>`:''}</p>`).join('')||'<p class="muted">No tutor submissions yet.</p>';
          card.querySelector('[data-activity]').innerHTML=tutorMsgs.slice(-6).map(m=>`<p><strong>${esc(m.senderName||m.sender||'Tutor')}</strong> — ${esc(m.text||'Attachment')}<small>${m.timestamp?` · ${new Date(m.timestamp).toLocaleString()}`:''}</small></p>`).join('')||'<p class="muted">No tutor activity yet.</p>';
          card.querySelector('[data-send-chat]').onclick=async()=>{const btn=card.querySelector('[data-send-chat]'),input=card.querySelector('[data-chat-input]'),statusEl=card.querySelector('[data-chat-status]'),text=input.value.trim();if(!text){statusEl.textContent='Write a message first.';return}btn.disabled=true;statusEl.textContent='Sending…';try{await post('clientSendComment',{conversationId:id,clientSessionToken:s.clientSessionToken,clientAccessToken:s.clientAccessToken,phone:s.phone,text});input.value='';statusEl.textContent='Message sent to your tutor.';const fresh=await post('clientGetRequest',{conversationId:id,clientSessionToken:s.clientSessionToken,clientAccessToken:s.clientAccessToken,phone:s.phone});const freshMsgs=(fresh.request?.messages||[]).filter(m=>/^(student|tutor)$/i.test(String(m.sender||''))&&!/admin|whatsapp/i.test(String(m.source||'')));card.querySelector('[data-activity]').innerHTML=freshMsgs.slice(-6).map(m=>`<p><strong>${esc(m.senderName||m.sender||'Tutor')}</strong> — ${esc(m.text||'Attachment')}<small>${m.timestamp?` · ${new Date(m.timestamp).toLocaleString()}`:''}</small></p>`).join('')||'<p class="muted">No tutor activity yet.</p>'}catch(e){statusEl.textContent=e.message||'Message could not be sent.'}finally{btn.disabled=false}};
        }catch(e){card.querySelector('[data-activity]').innerHTML=`<p class="muted">${esc(e.message||'Request details unavailable.')}</p>`}
      });return;
    }
    if(page==='progress'){
      const active=reqs.filter(x=>!/COMPLETED|DONE|DELIVERED|CANCELLED|REJECTED/i.test(statusOf(x)));const pct=cur.progressPercent!=null?Number(cur.progressPercent):(/COMPLETED|DONE|DELIVERED/i.test(status)?100:/READY_FOR_QA|SUBMITTED/i.test(String(cur.tutorWorkStatus||''))?85:/IN_PROGRESS|ASSIGNED/i.test(status)?60:25);
      root.innerHTML=`<div class="ba-page-head"><div><div class="eyebrow">CLIENT PROGRESS</div><h1>My Progress</h1><p>A simple overview of active work, tutoring sessions, tutor deliverables and recent activity.</p></div></div><div class="ba-progress-hero"><div><span class="ba-pill">${esc(status)}</span><h2>${esc(cur.workDescription||'Your BrightAce learning journey')}</h2><p>Assigned tutor: <strong>${esc(tutor)}</strong> · Admin: <strong>${esc(cur.assignedAdminName||'BrightAce Admin')}</strong></p><div class="ba-progress-bar"><span style="width:${Math.max(0,Math.min(100,pct))}%"></span></div></div><div class="ba-progress-ring"><strong>${Math.max(0,Math.min(100,pct))}%</strong><small>Progress</small></div></div><div class="ba-card-grid"><article class="ba-card"><h3>📚 Active Requests</h3><strong class="ba-big">${active.length}</strong><p>Requests currently being worked on.</p></article><article class="ba-card"><h3>📅 Sessions</h3><strong class="ba-big">${sched.length}</strong><p>Scheduled tutoring sessions.</p></article><article class="ba-card"><h3>📤 Tutor Work</h3><strong class="ba-big">${subs.length}</strong><p>Deliverables submitted by your tutor.</p></article><article class="ba-card"><h3>💬 Work Activity</h3><strong class="ba-big">${msgs.length}</strong><p>Recent activity on your current request.</p></article></div><div class="ba-card"><h3>Recent Activity</h3>${msgs.slice(-10).reverse().map(m=>`<div class="ba-activity"><strong>${esc(m.senderName||m.sender||'BrightAce')}</strong><span>${esc(m.text||'Attachment')}</span><small>${m.timestamp?new Date(m.timestamp).toLocaleString():''}</small></div>`).join('')||'<p class="muted">No recent activity.</p>'}</div>`;return;
    }
    if(page==='profile'){
      const name=esc(s.name||d.student?.name||'Verified Client'),phone=esc(s.phone||d.student?.phone||'');root.innerHTML=`<div class="ba-page-head"><div><div class="eyebrow">CLIENT ACCOUNT</div><h1>Profile &amp; Settings</h1><p>Your verified BrightAce identity and session security.</p></div></div><div class="ba-profile-grid"><section class="ba-card"><div class="ba-profile-top"><span class="ba-profile-avatar">${esc(name.charAt(0).toUpperCase())}</span><div><h2>${name}</h2><p>Verified Client</p><span class="ba-pill green">ACTIVE SESSION</span></div></div><h3>Personal Information</h3><label>Full Name<input value="${name}" readonly></label><label>WhatsApp Number<input value="${phone}" readonly></label><p class="muted">Your verified WhatsApp identity is the secure account boundary. Changes to identity details must be handled through BrightAce.</p></section><section class="ba-card"><h3>Security &amp; Access</h3><div class="ba-setting"><strong>WhatsApp verification</strong><span class="ba-pill green">VERIFIED</span></div><div class="ba-setting"><strong>Session security</strong><span>30-minute inactivity protection</span></div><div class="ba-setting"><strong>Live Chat</strong><span>Client ↔ BrightAce Admin</span></div><div class="ba-setting"><strong>Tutor communication</strong><span>Website Work / Tutor space</span></div><div class="ba-actions"><a class="btn btn-primary" href="chat.html">CONTACT ADMIN</a><button id="baEndSession" class="btn btn-outline">END SESSION</button></div></section></div>`;document.getElementById('baEndSession').onclick=async()=>{try{await post('clientEndSession',{phone:s.phone,clientSessionToken:s.clientSessionToken})}catch(e){}clearSession();location.href='chat.html';};
    }
  }
  async function renderTutoring(d,s){
    const root=document.querySelector('[data-client-root]');if(!root)return;
    const requestId=new URLSearchParams(location.search).get('request');const reqs=d.requests||[];const selected=requestId?reqs.find(x=>String(x.conversationId)===requestId):(d.currentRequest||reqs[0]);
    const sessions=(d.schedules||[]).filter(x=>!requestId||String(x.conversationId||'')===String(requestId));
    let tutorMsgs=[];
    if(selected){try{const r=await post('clientGetRequest',{conversationId:selected.conversationId,clientSessionToken:s.clientSessionToken,clientAccessToken:s.clientAccessToken,phone:s.phone});tutorMsgs=(r.request?.messages||[]).filter(m=>/^(student|tutor)$/i.test(String(m.sender||''))&&!/admin|whatsapp/i.test(String(m.source||'')));}catch(e){}}
    root.innerHTML=`<div class="ba-page-head"><div><div class="eyebrow">TUTORING WORKSPACE</div><h1>My Tutor &amp; Sessions</h1><p>Your scheduled tutoring, tutor profile and website conversation for the assigned Work ID.</p></div><a class="btn btn-primary" href="chat.html?service=Tutoring%20Session&amp;help=book-session">＋ BOOK SESSION</a></div><div class="ba-card-grid"><section class="ba-card"><h3>My Tutor</h3><div class="ba-tutor-profile"><div class="ba-profile-avatar">${esc((tutorOf(selected)||'T').charAt(0).toUpperCase())}</div><div><h2>${esc(tutorOf(selected))}</h2><p class="muted">Assigned to: ${esc(selected?.workDescription||'Your active request')}</p><span class="ba-pill">${esc(statusOf(selected||{}))}</span></div></div></section><section class="ba-card"><h3>Next Sessions</h3>${sessions.slice(0,3).map(x=>`<div class="ba-session"><strong>📅 ${esc(x.date)} · ${esc(x.startTime)}–${esc(x.endTime)}</strong><span>${esc(x.tutorName||tutorOf(selected)||'Tutor')}</span>${x.zoomLink?`<a class="btn btn-primary" href="${esc(x.zoomLink)}" target="_blank" rel="noopener">JOIN SESSION</a>`:'<small class="muted">Zoom link will appear when supplied by Admin.</small>'}</div>`).join('')||'<p class="muted">No sessions are currently scheduled.</p>'}</section></div><section class="ba-card ba-tutor-chat" style="margin-top:14px"><div class="ba-chat-head"><div><h3>💬 Chat with Your Tutor</h3><p class="muted">This is website-based tutor communication for the selected Work ID. BrightAce Live Chat remains separate and is always client ↔ admin.</p></div><select id="baTutorRequest">${reqs.map(x=>`<option value="${esc(x.conversationId)}" ${selected&&String(selected.conversationId)===String(x.conversationId)?'selected':''}>${esc(x.workDescription||x.conversationId)}</option>`).join('')}</select></div><div id="baTutorMessages" class="ba-tutor-messages">${tutorMsgs.slice(-30).map(m=>`<div class="ba-tutor-message ${String(m.sender).toLowerCase()==='student'?'mine':''}"><strong>${esc(m.senderName||m.sender||'Tutor')}</strong><div>${esc(m.text||'Attachment')}</div><small>${m.timestamp?new Date(m.timestamp).toLocaleString():''}</small></div>`).join('')||'<p class="muted">No tutor messages yet. Start the conversation below.</p>'}</div><div class="ba-chat-row"><textarea id="baTutorInput" rows="2" placeholder="Message your tutor about this work…"></textarea><button id="baTutorSend" class="btn btn-primary">SEND MESSAGE</button></div><div id="baTutorNotice" class="muted"></div></section>`;
    document.getElementById('baTutorRequest')?.addEventListener('change',e=>location.href='client-tutoring.html?request='+encodeURIComponent(e.target.value));
    document.getElementById('baTutorSend')?.addEventListener('click',async()=>{const btn=document.getElementById('baTutorSend'),input=document.getElementById('baTutorInput'),notice=document.getElementById('baTutorNotice'),id=document.getElementById('baTutorRequest')?.value||selected?.conversationId,text=input.value.trim();if(!id||!text){notice.textContent='Select a work item and enter a message.';return}btn.disabled=true;notice.textContent='Sending…';try{await post('clientSendComment',{conversationId:id,clientSessionToken:s.clientSessionToken,clientAccessToken:s.clientAccessToken,phone:s.phone,text});input.value='';notice.textContent='Message sent to your tutor.';setTimeout(()=>location.reload(),250)}catch(e){notice.textContent=e.message||'Message could not be sent.'}finally{btn.disabled=false}});
  }
  async function boot(){
    const page=document.body.dataset.clientPage;if(!page)return;
    const s=getSession();
    document.body.classList.add('ba-portal-enhanced');
    document.body.insertAdjacentHTML('afterbegin',nav(page==='messages'?'chat.html':'client-'+page+'.html'));
    document.body.insertAdjacentHTML('afterbegin',head(s||{}));
    const main=document.querySelector('main');if(main)main.classList.add('ba-client-main');
    document.querySelector('.ba-menu')?.addEventListener('click',()=>document.querySelector('.ba-client-sidebar')?.classList.toggle('open'));
    if(!s?.verified||!s.phone){if(page==='messages'){return}location.href='chat.html';return}
    if(!['requests','work','progress','profile','tutoring'].includes(page))return;
    document.body.classList.add('ba-rendered-workspace');
    const root=document.querySelector('[data-client-root]');
    if(!root)return;
    try{
      const d=await loadDashboard(s);window.BrightAceClientPortal={session:s,data:d};
      if(page==='tutoring'){await renderTutoring(d,s);document.querySelector('main > .section')?.setAttribute('data-legacy-tutoring','1');}else render(page,d,s);
    }catch(e){shellError(root,e)}
  }
  window.BrightAceClientPortalAPI={getSession,saveSession,clearSession,ensureSession,loadDashboard,post};
  window.BrightAcePortalShell={boot};
  document.addEventListener('DOMContentLoaded',boot);
})();
