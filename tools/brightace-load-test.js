#!/usr/bin/env node
"use strict";
/* Safe production probe. It performs GET-only health/version requests and never
   sends credentials or mutating actions. Set BRIGHTACE_EXEC_URL to the existing
   /exec URL. This is intentionally separate from the application package so a
   real load test can be run from a network that can reach Apps Script. */
const url=process.env.BRIGHTACE_EXEC_URL;
const users=Math.max(1,Math.min(1000,Number(process.env.USERS||100)));
const rounds=Math.max(1,Math.min(20,Number(process.env.ROUNDS||1)));
if(!url){console.error("Set BRIGHTACE_EXEC_URL to the production /exec URL.");process.exit(2);}
if(!/^https:\/\//i.test(url)){console.error("BRIGHTACE_EXEC_URL must use HTTPS.");process.exit(2);}
const base=url.replace(/[?].*$/,'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function probe(action){const t=Date.now();try{const r=await fetch(base+"?action="+encodeURIComponent(action),{redirect:"follow"});const body=await r.text();let json=null;try{json=JSON.parse(body)}catch(e){};return {ok:r.ok&&!!json,ms:Date.now()-t,status:r.status,action,api:json&&json.api,build:json&&json.build};}catch(e){return {ok:false,ms:Date.now()-t,status:0,action,error:String(e&&e.message||e)}}}
(async()=>{const jobs=[];for(let round=0;round<rounds;round++){for(let i=0;i<users;i++)jobs.push(probe(i%2?'health':'version'));await sleep(50);}const results=await Promise.all(jobs);const ok=results.filter(x=>x.ok);const ms=results.map(x=>x.ms).sort((a,b)=>a-b);const pct=p=>ms[Math.min(ms.length-1,Math.floor((p/100)*ms.length))];const summary={users,rounds,requests:results.length,successful:ok.length,failed:results.length-ok.length,successRate:results.length?ok.length/results.length:0,p50Ms:pct(50),p95Ms:pct(95),p99Ms:pct(99),build:[...new Set(ok.map(x=>x.build).filter(Boolean))],api:[...new Set(ok.map(x=>x.api).filter(Boolean))],errors:[...[...new Set(results.filter(x=>!x.ok).map(x=>x.error||(`HTTP ${x.status}`)))] .slice(0,10)]};console.log(JSON.stringify(summary,null,2));process.exit(summary.failed?1:0)})().catch(e=>{console.error(e);process.exit(1)});
