#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const sw=read('sw.js'),portal=read('js/client-portal-pages.js'),tutoring=read('pages/client-tutoring.html'),code=read('backend/Code.gs'),tutor=read('pages/tutor.html'),work=read('pages/tutor-work.html'),speed=read('js/brightace-speed-engine.js');
const checks=[
 ['Service worker uses the v105 cache namespace',/brightace-perf-20261028-v105-network-first-workspace-fix/.test(sw)],
 ['HTML documents use network-first rather than stale-while-revalidate',/async function networkFirstPage\(/.test(sw)&&/networkFirstPage\(request\)/.test(sw)&&!/staleWhileRevalidatePage\(request\)/.test(sw)],
 ['Static assets are network-first with offline fallback',/async function networkFirstStatic\(/.test(sw)&&/networkFirstStatic\(request\)/.test(sw)],
 ['My Tutors & Sessions uses the shared client portal shell',/data-client-page="tutoring"/.test(tutoring)&&/client-portal-pages\.js\?v=20261028-workspace-v105/.test(tutoring)],
 ['Tutor sessions are registered as an SPA route',/['\"]client-tutoring\.html['\"]\s*:\s*['\"]tutoring['\"]/.test(portal)],
 ['Tutor sessions route fetches live tutoring data and renders in-shell',/page===['\"]tutoring['\"]\?await loadTutorSessionsFresh\(s\)/.test(portal)&&/if\(page===['\"]tutoring['\"]\)await renderTutoring\(d,s\)/.test(portal)],
 ['Unified tutoring page retains session booking and deep-link details',/baBookSessionForm/.test(portal)&&/clientRequestSessionBooking/.test(portal)&&/id=\"baSessionDetail\"/.test(portal)],
 ['Client workspaces refresh status in background without document reload',/setInterval\(async function\(\)/.test(portal)&&/history\.pushState/.test(portal)&&/page!==targetPage/.test(portal)],
 ['Transient session bootstrap failures do not silently clear client sessions',/Your sign-in has been kept/.test(portal)&&/isDefinitiveSessionFailure/.test(portal)],
 ['Expired client sessions return to sign-in instead of public home',read('js/chat.js').includes('window.location.replace("chat.html?mode=returning")')&&portal.includes('chat.html?mode=returning&reason=session')],
 ['Back-forward cache restores revalidate before exposing private pages',/event\.persisted/.test(portal)&&/document\.documentElement\.style\.visibility=\x27hidden\x27/.test(portal)&&/ensureSession\(live\)/.test(portal)],
 ['Tutor sessions profile photo cache is versioned past old cached responses',/BA_CLIENT_TUTOR_SESSIONS_FAST_V3_/.test(code)],
 ['Tutor acceptance is idempotent across later workflow states',/alreadyAccepted:true/.test(code)&&/\[\"ACCEPTED\",\"IN_PROGRESS\",\"READY_FOR_QA\",\"REVISION_REQUESTED\",\"QA_APPROVED\",\"COMPLETED\"\]/.test(code)],
 ['Accepting work publishes a shared timeline status and invalidates caches',/Work accepted by tutor[\s\S]{0,220}work-status/.test(code)&&/updateConversation_\(c\.conversationId,new Date\(\),saved\.id\)/.test(code)&&/invalidateWorkCaches_\(c\.conversationId,p\.tutorPhone,p\.tutorPhone,c\.studentPhone\)/.test(code)],
 ['Tutor cannot rewind accepted or QA-approved work to an earlier stage',/const allowed=\{[\s\S]{0,250}IN_PROGRESS:\[/.test(code)&&/no longer accepting tutor submissions/.test(code)],
 ['Tutor acceptance controls disable after QA approval or completion',/\"QA_APPROVED\",\"COMPLETED\"/.test(tutor)&&/\"QA_APPROVED\",\"COMPLETED\"/.test(work)],
 ['Public soft navigation waits for new styles and preserves shared CSS',/await Promise\.race\(\[Promise\.all\(added\)/.test(speed)&&/currentLinks\.forEach/.test(speed)]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(!ok)failed++;}
console.log(`BrightAce v105 workspace regression checks: ${checks.length-failed}/${checks.length} passed.`);if(failed)process.exitCode=1;
