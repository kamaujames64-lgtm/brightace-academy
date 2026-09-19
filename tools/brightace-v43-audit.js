/* BrightAce V43 scalability audit — static only, no production mutation. */
const fs=require('fs'),path=require('path');
const backend=path.join(__dirname,'..','backend');
const code=fs.readFileSync(path.join(backend,'Code.gs'),'utf8');
const data=fs.readFileSync(path.join(backend,'BA_Data.gs'),'utf8');
const cache=fs.readFileSync(path.join(backend,'BA_Cache.gs'),'utf8');
const checks=[];
function check(name,ok,detail){checks.push({name,ok,detail});}
check('Conversation phone index',/baConversationIdsForPhone_/.test(data)&&/BA_CLIENT_CONV_IDS_/.test(data),'Client conversation IDs are cached for short-lived lookup reuse.');
check('Exact payment lookup',/function findPaymentRequest_/.test(code)&&/createTextFinder\(id\)/.test(code)&&!/function findPaymentRequest_\(requestId\)\{\s*const sh=getPaymentSheet_\(\),?\s*rows=sh\.getDataRange/.test(code),'Payment request lookup uses the payment-request column rather than loading the entire sheet.');
check('Client message fan-out bounded',/function clientAllMessages_/.test(code)&&/const ids=baConversationIdsForPhone_\(target\)/.test(code)&&/readConversationMessages_\(id\)/.test(code),'Client message aggregation uses per-conversation cached reads.');
check('Request schedules cached',/BA_SCHEDULES_/.test(code),'Conversation schedules are cached and invalidated when conversations update.');
check('Request payments cached',/BA_PAYMENTS_/.test(code),'Conversation payments are cached and invalidated on conversation/payment changes.');
check('Tutor dashboard cache extended',/BA_TUTOR_DASH_/.test(code)&&/JSON\.stringify\(response\),8/.test(code),'Expensive tutor dashboard assembly is not repeated every couple of seconds.');
check('Incremental chat sync',/afterMessageId/.test(code)&&/baSyncResponse_/.test(code),'Chat requests can ask only for messages after the last cursor.');
check('Cache helpers centralized',/baCacheGetJson_/.test(cache)&&/baCachePutJson_/.test(cache),'Cache reads/writes use shared fail-open helpers.');
let failed=0;console.log('\nBrightAce V43 Hot-Path Audit\n============================');for(const c of checks){console.log((c.ok?'PASS':'FAIL')+'  '+c.name+' — '+c.detail);if(!c.ok)failed++;}console.log('\nResult: '+(failed?'FAIL':'PASS')+' ('+checks.length+' checks, '+failed+' failed)');process.exitCode=failed?1:0;
