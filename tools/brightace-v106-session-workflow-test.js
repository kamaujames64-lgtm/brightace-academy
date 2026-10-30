#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('js/app.js'),code=read('backend/Code.gs'),chat=read('js/chat.js'),portal=read('js/client-portal-pages.js'),qa=read('pages/admin-quality.html'),sw=read('sw.js'),sessions=read('backend/BA_Sessions.gs');
const checks=[
 ['Tutor/admin idle timeout is 30 minutes and tracks real user interaction',/idleMs=30\*60\*1000/.test(app)&&/pointerdown.*keydown.*input.*change/.test(app)&&/API polling is deliberately NOT counted/.test(app)&&/function loginUrl\(\)[\s\S]{0,180}path\.indexOf\("\/pages\/"\)<0/.test(app)],
 ['Tutor/admin sessions have server-side idle validation',/now-Number\(p\.lastSeenAt\)>=idleLimit/.test(code)&&/Admin session expired after 30 minutes without activity/.test(code)&&/Tutor session expired after 30 minutes without activity/.test(code)],
 ['Only explicit tutor/admin touch actions refresh server inactivity timestamps',/function adminTouchSession_\(/.test(code)&&/function tutorTouchSession_\(/.test(code)&&/adminTouchSession/.test(app)&&/tutorTouchSession/.test(app)],
 ['Admin owner sessions are not reconstructed from missing bearer-token records',/A missing server-side session record is not reconstructed/.test(code)&&!/if\(!p && token\.indexOf\("OWNER_"\)===0\)/.test(code)],
 ['Client inactivity remains 30 minutes and requires fresh WhatsApp verification',/clientIdleMs:30\*60\*1000/.test(sessions)&&/Your client session has expired after inactivity\. Please verify your WhatsApp number again\./.test(code)&&/30-minute inactivity timeout/.test(portal)],
 ['Client chat polling no longer resets last real user activity',/session\.lastActivityAt=Date\.now\(\);sessionStorage\.setItem\(CHAT_KEY/.test(chat)&&!/if\(d\.clientSessionToken\)\{session\.clientSessionToken=d\.clientSessionToken;session\.clientSessionExpiresAt=new Date\(Date\.now\(\)\+30\*60\*1000\)\.toISOString\(\);session\.lastActivityAt=Date\.now\(\)/.test(chat)],
 ['Client authenticated reads do not refresh inactivity',/must not extend inactivity/.test(code)&&!/baRefreshClientSessionCache_\(hash,cached,now\);\s*return client/.test(code)],
 ['Client session cache recovery preserves last recorded activity timestamp',/const recoveredActivity=sheetLast,expiresAt=recoveredActivity\+maxIdle/.test(code)],
 ['Client bootstrap revalidates but does not renew last activity',/const activityAt=Number\(client\.lastActivityAt\|\|0\),exp=new Date\(activityAt\+30\*60\*1000\)/.test(code)&&!/setByHeader_\(getClientSheet_\(\),client\.row,\"lastActivityAt\",new Date\(\)\)/.test(code)&&/Date\.now\(\)-storedActivity>=30\*60\*1000/.test(chat)],
 ['QA can review only tutor submissions ready for QA',/QA can review only a tutor submission marked Ready for QA/.test(code)&&/currentWork!=="READY_FOR_QA"/.test(code)],
 ['QA decisions are idempotent and closed work cannot be revised',/alreadyReviewed:true/.test(code)&&/This request is closed and cannot be changed by QA/.test(code)],
 ['Completion requires QA approval and confirmed payment',/QA must approve the tutor's final submission before this work can be marked completed/.test(code)&&/payment must be confirmed as PAID/.test(code)],
 ['Completion updates both client and tutor and invalidates caches',/marked COMPLETED after QA approval/.test(code)&&/saveTutorMessage_\(normalizePhone_\(c\.assignedTutorPhone\)/.test(code)&&/invalidateWorkCaches_\(c\.conversationId,c\.assignedTutorPhone,c\.assignedTutorPhone,c\.studentPhone\)/.test(code)],
 ['Reassigning work resets stale tutor and QA stage; closed requests cannot be reassigned',/const resetStage=tutorChanged\|\|!oldTutorPhone\|\|!preserveStage/.test(code)&&/This request is closed\. Use the Admin restore workflow/.test(code)&&/\["tutorWorkStatus","RECEIVED"\],\["qaStatus","PENDING"\]/.test(code)],
 ['QA UI disables completion until approval and distinguishes waiting stages',/WAITING FOR QA APPROVAL/.test(qa)&&/WAITING FOR TUTOR REVISION/.test(qa)&&/WAITING FOR TUTOR SUBMISSION/.test(qa)],
 ['Existing notification sound and unlock flow remain available',/window\.BrightAceSound=\{unlock,play,newItems,checkDeadlines,notify\}/.test(app)&&/document\.addEventListener\("click",unlock/.test(app)&&/playNewMessageSound\(\)/.test(chat)],
 ['Shared app.js is network-only and service-worker cache is bumped',/app\.js\?v=20261028v106-idle-session-sound/.test(read('pages/tutor.html'))&&/brightace-perf-20261030-v108-phone-resource-otp-performance/.test(sw)&&/function isSecurityCriticalScript[\s\S]{0,250}app\|client-portal-pages/.test(sw)]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(!ok)failed++;}
console.log(`BrightAce V106 session/workflow regression checks: ${checks.length-failed}/${checks.length} passed.`);if(failed)process.exitCode=1;
