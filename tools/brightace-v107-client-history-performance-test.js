#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const portal=fs.readFileSync('js/client-portal-pages.js','utf8');
const code=fs.readFileSync('backend/Code.gs','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const speed=fs.readFileSync('backend/BA_Speed.gs','utf8');
const history=fs.readFileSync('pages/client-history.html','utf8');
const checks=[
 ['Client History is present in dashboard navigation',/\['client-history\.html'.*'History'\]/.test(portal)],
 ['History has a dedicated private noindex page using the shared authenticated shell',/data-client-page="history"/.test(history)&&/noindex,nofollow/.test(history)&&/client-portal-pages\.js\?v=20261029v107-client-history-performance/.test(history)],
 ['History displays older completed and rejected jobs only',/page==='history'\?allReqs\.filter\(isArchivedRequest\)/.test(portal)&&/function terminalKind/.test(portal)&&/REJECTED/.test(portal)&&/COMPLETED/.test(portal)],
 ['Seven-day grace period uses a fixed seven-day duration',/TERMINAL_GRACE_MS=7\*24\*60\*60\*1000/.test(portal)],
 ['Requests with missing terminal timestamps are not silently archived',/function terminalTimestamp[\s\S]{0,350}return Number\.isFinite\(t\)&&t>0\?t:0/.test(portal)],
 ['Operational pages hide only archived requests, not recent completed/rejected jobs',/allReqs\.filter\(isOperationalRequest\)/.test(portal)&&/const jobsAll=reqs\.filter\(x=>isOperationalRequest\(x\)&&!\/\(CANCELLED\)\/i\.test\(status\(x\)\)\)/.test(portal)],
 ['History provides links to work details and messages for follow-up',/client-work\.html\?request=\$\{encodeURIComponent\(id\)\}/.test(portal)&&/client-messages\.html\?request=\$\{encodeURIComponent\(id\)\}/.test(portal)],
 ['Message API calls are deduplicated while identical requests are in flight',/clientTutorSessions\|clientWorkMessages/.test(portal)&&/API_INFLIGHT\.has\(dedupeKey\)/.test(portal)],
 ['SPA navigation clears page-specific polling timers',/function clearClientPageTimers[\s\S]{0,160}clearInterval\(id\)/.test(portal)&&/clearClientPageTimers\(\);/.test(portal)],
 ['Tutor session cache avoids a duplicate request for very fresh snapshots while retaining revalidation',/cached&&Date\.now\(\)-cached\.savedAt<15000/.test(portal)&&/post\('clientTutorSessions',base\)/.test(portal)],
 ['Portal data uses cached per-conversation message row indexes instead of scanning the entire ID column',/BA_FAST_MSG_CONV_ID/.test(code)&&!/getRange\(2,mm\.conversationId,last-1,1\)\.getValues\(\)/.test(code)],
 ['New messages invalidate the matching conversation index immediately',/remove\('BA_FAST_MSG_CONV_ID\|'\+String\(id\)\)/.test(code)],
 ['Client history response contains completion and rejection dates',/rejectedAt:c\.rejectedAt,rejectionReason:c\.rejectionReason,status:c\.status/.test(code)],
 ['Client status changes invalidate summary and tutor-session caches for prompt live updates',/BA_CLIENT_SUMMARY_/.test(speed)&&/BA_CLIENT_TUTOR_SESSIONS_FAST_V3_/.test(speed)],
 ['Service worker namespace is bumped for V110',/brightace-perf-20261030-v110-native-document-navigation/.test(sw)]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(!ok)failed++;}
console.log(`BrightAce V107 client history/performance checks: ${checks.length-failed}/${checks.length} passed.`);if(failed)process.exitCode=1;
