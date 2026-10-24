#!/usr/bin/env node
/* Source-level regression checks for shared tutor work status. No API calls or account data. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const code=read('backend/Code.gs');
const tutor=read('pages/tutor-work.html');
const client=read('js/client-portal-pages.js');
const tests=[
  ['Tutor page exposes a status selector and save action',/id="tutorWorkStatusSelect"/.test(tutor)&&/api\('tutorUpdateWorkStatus'/.test(tutor)],
  ['Backend authenticates the tutor before status changes',/function tutorUpdateWorkStatus_\(d\)\s*\{\s*const p=requireTutor_\(d\.tutorToken\)/.test(code)],
  ['Backend checks the canonical assigned tutor',/function tutorUpdateWorkStatus_\(d\)[\s\S]{0,500}This work is not assigned to you/.test(code)],
  ['Tutor cannot self-approve or self-request Admin QA revision',/if\(\["ACCEPTED","IN_PROGRESS","READY_FOR_QA"\]\.indexOf\(status\)<0\)/.test(code)],
  ['Status change is saved to canonical work record',/setByHeader_\(sh,c\.row,"tutorWorkStatus",status\)[\s\S]{0,120}setByHeader_\(sh,c\.row,"assignmentStatus",assignmentStatus\)/.test(code)],
  ['Status change is added to shared work timeline',/saveMessage_\(c\.conversationId,"tutor",messageText,"work-status"/.test(code)&&/updateConversation_\(c\.conversationId,new Date\(\),saved\.id\)/.test(code)],
  ['Client work data includes tutorWorkStatus',/function clientPortalData_\(d\)[\s\S]{0,2500}tutorWorkStatus:c\.tutorWorkStatus/.test(code)],
  ['Admin assigned-work view returns canonical work records including status',/function adminListWorkAssignments_\(token,fresh\)[\s\S]{0,1800}out\.push\(\{\.\.\.c/.test(code)],
  ['Client UI renders tutor work status explicitly',/Tutor work status/.test(client)&&/x\.tutorWorkStatus/.test(client)],
  ['Cache invalidation clears client, tutor, Admin and QA views',/function invalidateWorkCaches_\(conversationId,oldTutorPhone,newTutorPhone,studentPhone\)[\s\S]{0,800}BA_ADMIN_WORK_ASSIGNMENTS[\s\S]{0,500}BA_CLIENT_DASH_/.test(code)&&/invalidateWorkCaches_\(c\.conversationId,p\.tutorPhone,p\.tutorPhone,c\.studentPhone\)/.test(code)],
];
let failed=0;
for(const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(!ok)failed++;}
console.log(`Tutor status source checks: ${tests.length-failed}/${tests.length} passed.`);
if(failed)process.exitCode=1;
