#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const checks=[];
const successorV63=codeMarker=>codeMarker.includes("2026-09-19-V63-PRODUCTION-HARDENING-SECURITY-QA");
function check(name,ok,detail){checks.push({name,ok:Boolean(ok),detail});}
const code=read("backend/Code.gs"), deploy=read("backend/BA_Deployment.gs"), delivery=read("backend/BA_MessageDelivery.gs"), app=read("js/app.js"), wallet=read("pages/tutor-wallet.html"), tutor=read("pages/tutor.html");
check("V49 build marker",code.includes("2026-09-19-V49-CLIENT-SESSION-RECOVERY-MESSAGING-WALLET")||successorV63(code),"V49 requirements are retained by the current V63 release.");
check("V49 JSON health marker",code.includes("brightace-json-v49")||code.includes("brightace-json-v63"),"A later V63 health marker supersedes the historical V49 marker.");
check("V49 deployment marker",(deploy.includes("brightace-json-v49")&&deploy.includes("V49"))||deploy.includes("brightace-json-v63"),"Current deployment metadata is V63 and supersedes the historical V49 marker.");
check("Durable delivery queue module",delivery.includes("MESSAGE_DELIVERY_QUEUE")&&delivery.includes("baProcessMessageDeliveryQueue_"));
check("Bounded retry/dead-letter",delivery.includes("maxAttempts")&&delivery.includes('"DEAD"')&&delivery.includes('"RETRY"'));
check("Idempotent queue ids",delivery.includes("queueId")&&delivery.includes("return baMessageDeliveryRow_"));
check("Admin message enqueues durably",code.includes("baEnqueueMessageDelivery_")&&code.includes('direction:"ADMIN_TO_CLIENT"'));
check("Tutor admin message enqueues durably",code.includes('direction:"TUTOR_TO_ADMIN"')&&code.includes("baProcessMessageDelivery_"));
check("Tutor wallet canonical handoff",app.includes("BrightAceTutorSession.handoff")&&app.includes('tutor-wallet.html'));
check("Wallet page consumes canonical session",wallet.includes("consumeHandoff")&&wallet.includes("BrightAceTutorSession?.get?.()"));
check("Wallet does not force sign-in when token exists",wallet.includes('$("login").hidden=true;$("app").hidden=false;'));
check("Tutor navigation wallet markers",tutor.includes('data-tutor-wallet-link="1"'));
const failures=checks.filter(x=>!x.ok);console.log(JSON.stringify({ok:failures.length===0,total:checks.length,passed:checks.length-failures.length,failures,checks},null,2));process.exit(failures.length?1:0);
