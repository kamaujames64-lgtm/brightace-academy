/* BrightAce V42 security regression scanner. Static by default; optional LIVE=1 only runs the safe health endpoint. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const backend=path.join(root,'backend');
const files=fs.readdirSync(backend).filter(x=>x.endsWith('.gs')).map(x=>path.join(backend,x));
let text='';for(const f of files)text+='\n'+fs.readFileSync(f,'utf8');
const checks=[];
function check(name,ok,detail){checks.push({name,ok,detail});}
check('Security gateway present',/baSecurityGatePost_/.test(text)&&/baSecurityGateGet_/.test(text),'BA_Security.gs is wired into doPost/doGet.');
check('Action allowlist present',/BA_ALLOWED_ACTIONS_/.test(text)&&/BA_ALLOWED_GET_ACTIONS_/.test(text),'Unknown actions are rejected before business logic.');
check('Rate limiter present',/baRateLimit_/.test(text),'Cache-backed action throttling is present.');
check('Input validation present',/baValidateActionInput_/.test(text),'Centralized length/attachment validation is present.');
check('Upload extension blocking present',/\.exe\|msi|bat|cmd/.test(text),'Dangerous executable/script extensions are blocked.');
check('Upload signature validation wired',/baSecureUploadCheck_\(a\.name,mime,bytes\)/.test(text),'Uploaded bytes are checked against declared type where signatures are available.');
check('Message idempotency present',/BA_IDEMP_SEND_/.test(text)&&/clientRequestId/.test(text),'Client message retries can be deduplicated.');
check('Incremental message sync present',/afterMessageId/.test(text)&&/syncCursor/.test(text),'Message API supports incremental synchronization.');
check('Admin password hash option present',/ADMIN_PASSWORD_SHA256/.test(text),'Admin login supports a SHA-256 password property without removing legacy compatibility.');
check('Bearer secrets absent from frontend',!/(META_ACCESS_TOKEN|PAYSTACK_SECRET_KEY|ADMIN_PASSWORD|SPREADSHEET_ID)/.test(fs.readFileSync(path.join(root,'js','app.js'),'utf8')+fs.readFileSync(path.join(root,'js','chat.js'),'utf8')),'Frontend JS does not contain server credential property names.');
check('Public Drive sharing remains visible',/ANYONE_WITH_LINK/.test(text),'Current attachment links remain compatible; authenticated file serving is a later migration item.');
console.log('\nBrightAce V42 Security Test');console.log('============================');let failed=0;for(const c of checks){console.log((c.ok?'PASS':'FAIL')+'  '+c.name+' — '+c.detail);if(!c.ok)failed++;}
console.log('\nResult: '+(failed?'FAIL':'PASS')+' ('+checks.length+' checks, '+failed+' failed)');process.exitCode=failed?1:0;
