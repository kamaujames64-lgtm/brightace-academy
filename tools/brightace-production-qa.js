#!/usr/bin/env node
/* BrightAce V55 — offline/static production-readiness audit.
   Usage: node tools/brightace-production-qa.js [projectRoot]
   This does not contact the production /exec endpoint.
*/
const fs=require('fs'),path=require('path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const fail=[];const pass=[];
function ok(name,detail){pass.push({name,detail});}
function bad(name,detail){fail.push({name,detail});}
function read(rel){const f=path.join(root,rel);if(!fs.existsSync(f)){bad('Missing file',rel);return ''}return fs.readFileSync(f,'utf8');}
const code=read('backend/Code.gs');
const dep=read('backend/BA_Deployment.gs');
const recovery=read('backend/BA_DisasterRecovery.gs');
const qa=read('backend/BA_ProductionQA.gs');
const admin=read('pages/admin.html');
const qapage=read('pages/admin-production-qa.html');
const marker='2026-09-19-V55-END-TO-END-QA-PRODUCTION-READINESS';
if(code.includes(marker))ok('V55 build marker','Code.gs declares the V55 build marker.');else bad('V55 build marker','Expected marker missing from Code.gs.');
if(code.includes('brightace-json-v55')&&dep.includes('brightace-json-v55'))ok('V55 JSON marker','API marker is present.');else bad('V55 JSON marker','API marker missing.');
for(const f of ['BA_Security.gs','BA_Sessions.gs','BA_RateLimit.gs','BA_Data.gs','BA_Cache.gs','BA_Messages.gs','BA_Sync.gs','BA_Validation.gs','BA_Files.gs','BA_ClientHistory.gs','BA_MessageDelivery.gs','BA_FinancialIntegrity.gs','BA_Observability.gs','BA_DisasterRecovery.gs','BA_ProductionQA.gs']){if(fs.existsSync(path.join(root,'backend',f)))ok('Backend module',f);else bad('Backend module',f);}
for(const action of ['adminProductionQa','adminRecoveryManifest','adminCreateRecoverySnapshot','adminFinancialIntegrity','adminObservability']){if(code.includes('"'+action+'"'))ok('Action route',action);else bad('Action route',action);}
if(admin.includes('admin-production-qa.html'))ok('Admin navigation','Production QA workspace linked.');else bad('Admin navigation','Production QA link missing.');
if(qapage.includes('adminProductionQa'))ok('QA workspace','Production QA page calls the protected endpoint.');else bad('QA workspace','Endpoint call missing.');
if(/message(?:body|text)?|message_content|body|content|raw[_ -]?message/.test(recovery)&&recovery.includes('baRecoverySensitiveHeader_'))ok('Recovery data redaction','Message/body/content fields are included in sensitive-header filtering.');else bad('Recovery data redaction','Message/body/content exclusion not found.');
const files=fs.readdirSync(path.join(root,'backend')).filter(f=>f.endsWith('.gs'));
const names=new Map();
for(const f of files){const s=fs.readFileSync(path.join(root,'backend',f),'utf8');for(const m of s.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)){const n=m[1];if(!names.has(n))names.set(n,[]);names.get(n).push(f);}}
const dups=[...names].filter(([,v])=>v.length>1);
if(!dups.length)ok('Duplicate top-level functions','0 duplicates across backend .gs files.');else bad('Duplicate top-level functions',dups.map(([n,v])=>n+' ['+v.join(', ')+']').join('; '));
let delimiter=true;for(const f of files){const s=fs.readFileSync(path.join(root,'backend',f),'utf8');let a=0,b=0,c=0;for(const ch of s){if(ch==='{')a++;if(ch==='}')b++;if(ch==='(')c++;if(ch===')')c--;}if(a!==b||c!==0){delimiter=false;bad('Delimiter balance',`${f}: braces ${a}/${b}, paren balance ${c}`);}}if(delimiter)ok('Delimiter balance','All backend files balanced.');
console.log(JSON.stringify({ok:fail.length===0,summary:{passed:pass.length,failed:fail.length,total:pass.length+fail.length},passed:pass,failed:fail},null,2));
process.exit(fail.length?1:0);
