#!/usr/bin/env node
/* Source-level privacy regression checks; no API calls and no account data. */
'use strict';
const fs=require('node:fs');const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../backend/Code.gs'),'utf8');
const security=fs.readFileSync(path.join(__dirname,'../backend/BA_Security.gs'),'utf8');
const tests=[
  ['Client dashboard summary authenticates before cache lookup',/function clientPortalSummary_\(d\)\s*\{[\s\S]{0,500}requireClientSession_\(token,phone\)[\s\S]{0,180}BA_CLIENT_SUMMARY_/.test(code)],
  ['Client dashboard data authenticates before cache lookup',/function clientPortalData_\(d\)\s*\{[\s\S]{0,500}requireClientSession_\(token,phone\)[\s\S]{0,180}BA_CLIENT_DASH_/.test(code)],
  ['Tutor sessions endpoint authenticates before cache lookup',/function clientTutorSessions_\(d\)\s*\{[\s\S]{0,500}requireClientSession_\(token,phone\)[\s\S]{0,180}BA_CLIENT_TUTOR_SESSIONS_FAST_V2_/.test(code)],
  ['Live chat authenticates conversation before reading cached messages',/function getMessages_\(id,clientSessionToken,phone,afterMessageId,clientAccessToken\)\s*\{[\s\S]{0,350}clientConversationFromSessionOrAccess_\([\s\S]{0,250}baMessageCacheKey_\(id\)/.test(code)],
  ['Session booking checks conversation belongs to verified client',/function clientRequestSessionBooking_\(d\)\s*\{[\s\S]{0,600}normalizePhone_\(c\.studentPhone\)!==phone/.test(code)],
  ['Assigned admin avatar exposes only assigned admin profile-picture URL',/function baAttachAssignedAdminPhotos_\(requests\)[\s\S]{0,900}r\.assignedAdminProfilePictureUrl=key\?String\(byUsername\[key\]\|\|''\):''/.test(code)],
  ['Expired admin/tutor session property cleanup exists',/function baPruneExpiredSessionTokens_\(\)/.test(code)],
  ['Rate limiting is wired to API request handling',/baRateLimit_\(/.test(security)]
];
let bad=0;for(const [name,ok] of tests){console.log((ok?'PASS: ':'FAIL: ')+name);if(!ok)bad++;}
console.log(`Source-level checks: ${tests.length-bad}/${tests.length} passed.`);
console.log('These checks inspect source patterns only. They do not prove runtime isolation; use brightace-privacy-isolation-test.js with two staging clients.');
if(bad)process.exitCode=1;
