#!/usr/bin/env node
/* Static regression checks for the v107-client-history-performance OTP/session and service-worker cache gate. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const code=fs.readFileSync(path.join(root,'backend','Code.gs'),'utf8');
const portal=fs.readFileSync(path.join(root,'js','client-portal-pages.js'),'utf8');
const tests=[
 ['Service worker version bumped for security-gate rollout',/brightace-perf-20261030-v110-native-document-navigation/.test(sw)],
 ['Private client/tutor/admin documents bypass page cache',/isPrivateBrightAceDocument\(request\)\s*\|\|\s*isSecurityCriticalScript\(request\)/.test(sw)&&/event\.respondWith\(networkOnly\(request\)\)/.test(sw)],
 ['Authentication-critical scripts are network-only',/app\|client-portal-pages\|chat\|brightace-api-config\|admin-navigation/.test(sw)],
 ['Client session bootstrap runs before portal shell is added',(portal.indexOf('await ensureSession(s)')>=0&&portal.indexOf('await ensureSession(s)')<portal.indexOf("insertAdjacentHTML('afterbegin',nav("))],
 ['Chat read helper rejects access-token-only session minting',/function clientConversationFromSessionOrAccess_\(d\)\s*\{[\s\S]{0,500}if\(!token\)throw new Error[\s\S]{0,250}clientConversationFromSession_\(d\)/.test(code)],
 ['Admin reports page uses existing server-side report actions',fs.existsSync(path.join(root,'pages','admin-reports.html'))&&/adminResourceAnalytics/.test(fs.readFileSync(path.join(root,'pages','admin-reports.html'),'utf8'))&&/adminObservability/.test(fs.readFileSync(path.join(root,'pages','admin-reports.html'),'utf8'))],
 ['AdSense is clearly not represented as connected',/NOT CONNECTED/.test(fs.readFileSync(path.join(root,'pages','admin-reports.html'),'utf8'))]
];
let failed=0;for(const [name,ok] of tests){console.log((ok?'PASS: ':'FAIL: ')+name);if(!ok)failed++;}
console.log(`v107-client-history-performance security-gate checks: ${tests.length-failed}/${tests.length} passed.`);if(failed)process.exitCode=1;
