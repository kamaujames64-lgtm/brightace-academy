#!/usr/bin/env node
/* Read-only two-client privacy isolation test for an explicitly configured staging API.
 * Required env vars: BRIGHTACE_STAGING_API_URL, BA_TEST_CLIENT_A_PHONE,
 * BA_TEST_CLIENT_A_TOKEN, BA_TEST_CLIENT_A_WORK_ID, BA_TEST_CLIENT_B_PHONE,
 * BA_TEST_CLIENT_B_TOKEN, BA_TEST_CLIENT_B_WORK_ID.
 * Never prints tokens or response bodies. Use dedicated test accounts only.
 */
'use strict';
const api = process.env.BRIGHTACE_STAGING_API_URL || '';
const a = {phone:process.env.BA_TEST_CLIENT_A_PHONE||'', token:process.env.BA_TEST_CLIENT_A_TOKEN||'', work:process.env.BA_TEST_CLIENT_A_WORK_ID||''};
const b = {phone:process.env.BA_TEST_CLIENT_B_PHONE||'', token:process.env.BA_TEST_CLIENT_B_TOKEN||'', work:process.env.BA_TEST_CLIENT_B_WORK_ID||''};
function fail(msg){console.error('FAIL: '+msg);process.exitCode=1;}
function assert(ok,msg){if(!ok)fail(msg);else console.log('PASS: '+msg);}
async function call(action,who){
  const body=new URLSearchParams();body.set('payload',JSON.stringify({action,phone:who.phone,clientSessionToken:who.token,conversationId:who.work}));
  const res=await fetch(api,{method:'POST',body,cache:'no-store'});
  let data;try{data=await res.json()}catch(_){throw Error('API did not return JSON')}
  if(!res.ok||!data||data.ok!==true)throw Error('API rejected the test session/action');
  return data;
}
(async()=>{
  if(!/^https:\/\//i.test(api)||!api.includes('/exec')){console.error('Set BRIGHTACE_STAGING_API_URL to the dedicated staging Apps Script /exec URL.');process.exit(2)}
  if(!a.phone||!a.token||!a.work||!b.phone||!b.token||!b.work){console.error('Provide both dedicated test-client phone/token/work-ID triples. No requests were sent.');process.exit(2)}
  if(a.phone===b.phone||a.work===b.work){console.error('Test clients must have distinct phone numbers and work IDs. No requests were sent.');process.exit(2)}
  try{
    const [ad,bd,at,bt]=await Promise.all([
      call('clientPortalData',a),call('clientPortalData',b),
      call('clientTutorSessions',a),call('clientTutorSessions',b)
    ]);
    const aText=JSON.stringify({requests:ad.requests,messages:ad.messages,documents:ad.documents,payments:ad.payments,schedules:ad.schedules,bookings:ad.bookingRequests});
    const bText=JSON.stringify({requests:bd.requests,messages:bd.messages,documents:bd.documents,payments:bd.payments,schedules:bd.schedules,bookings:bd.bookingRequests});
    const aTutor=JSON.stringify({requests:at.requests,schedules:at.schedules,bookingRequests:at.bookingRequests});
    const bTutor=JSON.stringify({requests:bt.requests,schedules:bt.schedules,bookingRequests:bt.bookingRequests});
    assert(!aText.includes(b.work)&&!aTutor.includes(b.work),'Client A responses do not include Client B work ID');
    assert(!bText.includes(a.work)&&!bTutor.includes(a.work),'Client B responses do not include Client A work ID');
    const aIds=new Set((ad.requests||[]).map(x=>String(x.conversationId||'')));
    const bIds=new Set((bd.requests||[]).map(x=>String(x.conversationId||'')));
    assert(!aIds.has(b.work),'Client A request list excludes Client B work');
    assert(!bIds.has(a.work),'Client B request list excludes Client A work');
    console.log('Completed read-only client isolation checks. This does not replace tutor/admin, file-download, payment, or copied-ID authorization tests.');
  }catch(e){fail('Privacy isolation check could not complete ('+String(e&&e.message||'request error')+'). Check staging deployment and test sessions.');}
})();
