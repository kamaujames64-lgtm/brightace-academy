#!/usr/bin/env node
/**
 * BrightAce V47 static contract audit.
 * Checks the source package for the "complete client request history" contract
 * and deployment/readiness invariants. It does not mutate production data.
 */
const fs=require("fs"), path=require("path");
const root=path.resolve(__dirname,"..");
const code=fs.readFileSync(path.join(root,"backend","Code.gs"),"utf8");
const hist=fs.readFileSync(path.join(root,"backend","BA_ClientHistory.gs"),"utf8");
const dash=fs.readFileSync(path.join(root,"pages","client-dashboard.html"),"utf8");
const deployment=fs.readFileSync(path.join(root,"backend","BA_Deployment.gs"),"utf8");
const checks=[
  ["V47 build marker", /V47-CLIENT-HISTORY-500-USER-READINESS/.test(code)],
  ["JSON API marker", /brightace-json-v47/.test(code)],
  ["complete client history helper", /function baClientRequestHistory_\(/.test(hist)],
  ["history uses conversation index", /baConversationIdsForPhone_/.test(hist)],
  ["history does not filter verification status", !/verificationStatus.*filter|filter.*verificationStatus/i.test(hist)],
  ["session owns historical request access", /verified client session is the authorization boundary/.test(code)],
  ["request index invalidated on new request", /baInvalidateClientRequestHistory_\(phone\)/.test(code)],
  ["request index invalidated on deletion", /baInvalidateClientRequestHistory_\(deletedClientPhone\)/.test(code)],
  ["dashboard says all requests", /All Requests/.test(dash)],
  ["dashboard deletion contract visible", /unless it was permanently deleted by an Admin/.test(dash)],
  ["deployment helper retained", /BRIGHTACE_BUILD/.test(deployment)],
  ["client dashboard load-test action", /"clientDashboard"/.test(fs.readFileSync(path.join(root,"tools","brightace-load-test.js"),"utf8"))]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?"PASS":"FAIL"} ${name}`);if(!ok)failed++}
process.exitCode=failed?2:0;
