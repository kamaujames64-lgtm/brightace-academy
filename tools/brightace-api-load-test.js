#!/usr/bin/env node
/*
 * Staging-only authenticated API read load test. Requires a JSON file containing
 * unique test-only client sessions: [{"phone":"...","clientSessionToken":"...","workId":"..."}, ...].
 * Run: node tools/brightace-api-load-test.js https://STAGING.../exec ./staging-test-users.json 2000
 * It uses clientPortalSummary (read-only), ramps virtual users, and never logs tokens.
 * Do not point this at production without a scheduled, approved maintenance window.
 */
'use strict';
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const api=process.argv[2]||'';
const usersPath=process.argv[3]||'';
const maxUsers=Math.max(1,Math.min(2000,Number(process.argv[4]||2000)));
const stages=[10,25,50,100,250,500,1000,2000].filter(n=>n<=maxUsers);
function pct(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y);return Number(s[Math.min(s.length-1,Math.ceil(p*s.length)-1)].toFixed(1));}
async function main(){
  if(!/^https:\/\//i.test(api)||!api.includes('/exec')||!/staging|test|dev/i.test(api)){console.error('Safety stop: API URL must visibly identify a dedicated staging/test/dev /exec deployment. No requests sent.');process.exit(2)}
  if(!usersPath||!fs.existsSync(usersPath)){console.error('Supply a private JSON file of unique test-only client sessions. No requests sent.');process.exit(2)}
  let users;try{users=JSON.parse(fs.readFileSync(usersPath,'utf8'))}catch(_){console.error('Test-user JSON is invalid.');process.exit(2)}
  if(!Array.isArray(users)||users.length<maxUsers||users.slice(0,maxUsers).some(x=>!x.phone||!x.clientSessionToken)){console.error('Need '+maxUsers+' unique sessions with phone and clientSessionToken. No requests sent.');process.exit(2)}
  if(new Set(users.slice(0,maxUsers).map(x=>x.phone)).size<maxUsers||new Set(users.slice(0,maxUsers).map(x=>x.clientSessionToken)).size<maxUsers){console.error('Each virtual user must have a unique test phone and token. No requests sent.');process.exit(2)}
  const report=[];
  for(const stage of stages){
    const samples=[];let failed=0,unauthorized=0;const t0=performance.now();
    await Promise.all(users.slice(0,stage).map(async u=>{
      const start=performance.now();try{
        const body=new URLSearchParams();body.set('payload',JSON.stringify({action:'clientPortalSummary',phone:u.phone,clientSessionToken:u.clientSessionToken,conversationId:u.workId||''}));
        const r=await fetch(api,{method:'POST',body,cache:'no-store'});let d;try{d=await r.json()}catch(_){d=null}
        samples.push(performance.now()-start);if(!r.ok||!d||d.ok!==true){failed++;if(/session|expired|verify|authorized/i.test(String(d&&d.error||'')))unauthorized++;}
      }catch(_){samples.push(performance.now()-start);failed++;}
    }));
    const elapsed=(performance.now()-t0)/1000;
    report.push({virtualUsers:stage,requests:stage,elapsedSeconds:Number(elapsed.toFixed(2)),throughputRps:Number((stage/elapsed).toFixed(1)),latencyMs:{p50:pct(samples,.5),p95:pct(samples,.95),p99:pct(samples,.99)},failed,authFailures:unauthorized});
    console.log(JSON.stringify(report[report.length-1]));
    if(failed>Math.max(1,Math.floor(stage*.01))) {console.error('Stopping ramp after >1% failures; investigate staging logs before proceeding.');break;}
  }
  console.log('Metrics only. Never infer production capacity from staging; include realistic write/Drive/payment workflows in a separate approved test.');
}
main().catch(()=>{console.error('Load test failed; sensitive session data was not printed.');process.exit(1)});
