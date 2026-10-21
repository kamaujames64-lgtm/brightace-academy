/* BrightAce shared tutor navigation avatar: loads the signed-in tutor photo on every tutor page. */
(function(){
  'use strict';
  function init(){
    var link=document.querySelector('.ba-tutor-nav-links [data-nav-key="settings"]');
    if(!link)return;
    var avatar=link.querySelector('.ba-tutor-nav-avatar');
    if(!avatar){avatar=document.createElement('span');avatar.className='ba-tutor-nav-avatar';avatar.setAttribute('aria-hidden','true');link.prepend(avatar);}
    if(!document.getElementById('ba-tutor-nav-avatar-style')){var style=document.createElement('style');style.id='ba-tutor-nav-avatar-style';style.textContent='.ba-tutor-nav-links [data-nav-key="settings"]{gap:6px!important}.ba-tutor-nav-avatar{display:inline-grid;place-items:center;flex:0 0 24px;width:24px;height:24px;overflow:hidden;border-radius:50%;background:#e9f0f8;color:#10263f;font-size:14px;line-height:1}.ba-tutor-nav-avatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}@media(max-width:700px){.ba-tutor-nav-avatar{width:21px;height:21px;flex-basis:21px}}';document.head.appendChild(style);}
    var token=(window.BrightAceTutorSession&&window.BrightAceTutorSession.get&&window.BrightAceTutorSession.get())||sessionStorage.getItem('brightace_tutor_token_v1')||localStorage.getItem('brightace_tutor_token_v1')||'';
    if(!token){avatar.textContent='👤';return;}
    var api=window.BRIGHTACE_API_URL||'https://script.google.com/macros/s/AKfycbzs69au8SaV3o8wu2DHzD4VTY96oHVe0c_RUzEzzaMhD7yBkYnXujm_aJE7ZouY-JsK/exec';
    var body=new URLSearchParams();body.set('payload',JSON.stringify({action:'tutorDashboard',tutorToken:token,forceFreshProfile:true}));
    fetch(api,{method:'POST',body:body,cache:'no-store'}).then(function(r){return r.json()}).then(function(d){if(!d||!d.ok)return;var url=String(d.tutor&&d.tutor.profilePictureUrl||'').trim();if(!url){avatar.textContent='👤';return;}var img=document.createElement('img');img.src=url;img.alt='';img.loading='eager';img.decoding='async';img.onerror=function(){img.remove();avatar.textContent='👤'};avatar.replaceChildren(img)}).catch(function(){avatar.textContent='👤'});
  }
  window.BrightAceRefreshTutorNavAvatar=init;
  window.addEventListener('brightace:tutor-profile-photo-updated',init);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
