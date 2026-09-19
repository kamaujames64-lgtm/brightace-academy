#!/usr/bin/env node
/* BrightAce V53 deployment checker. Usage: API_URL=https://script.google.com/macros/s/.../exec node tools/brightace-deployment-check.js */
const API_URL=process.env.API_URL||process.argv[2];
if(!API_URL){console.error('Usage: API_URL=https://script.google.com/macros/s/.../exec node tools/brightace-deployment-check.js');process.exit(2);}
const EXPECTED_BUILD_PREFIX='2026-09-19-V53-';
(async()=>{
  try{
    const r=await fetch(API_URL+'?action=health',{redirect:'follow'});
    const text=await r.text();let data;try{data=JSON.parse(text)}catch(e){console.error('FAIL: /exec did not return JSON. First response bytes:',text.slice(0,300));process.exit(1)}
    const build=String(data.build||'');
    const ok=Boolean(data.ok)&&build.indexOf(EXPECTED_BUILD_PREFIX)===0&&data.api==='brightace-json-v53';
    console.log(JSON.stringify({ok,status:r.status,build:data.build||null,api:data.api||null,service:data.service||null},null,2));
    process.exit(ok?0:1);
  }catch(e){console.error('FAIL: unable to reach /exec:',e.message);process.exit(1)}
})();
