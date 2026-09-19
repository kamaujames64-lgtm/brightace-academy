/* BrightAce V43 static regression checks. Does not mutate production. */
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'backend','Code.gs'),'utf8');const chat=fs.readFileSync(path.join(root,'js','chat.js'),'utf8');
const checks=[];function c(n,o,d){checks.push({n,o,d})}
const actions=[...code.matchAll(/body\.action === ['"]([^'"]+)['"]/g)].map(m=>m[1]);
const sec=fs.readFileSync(path.join(root,'backend','BA_Security.gs'),'utf8');const allowed=new Set([...sec.matchAll(/'([^']+)'/g)].map(m=>m[1]));
c('No duplicate top-level function names',new Set([...code.matchAll(/^function\s+(\w+)\s*\(/gm)].map(m=>m[1])).size===[...code.matchAll(/^function\s+(\w+)\s*\(/gm)].length,'Backend function names are unique.');
c('All POST actions remain allowlisted',actions.every(a=>allowed.has(a)),'Security gateway includes every existing doPost action.');
c('Chat incremental sync retained',/afterMessageId/.test(chat)&&/clientRequestId/.test(chat),'Chat UI now uses incremental sync and idempotent send IDs.');
c('Existing API endpoint retained',/script\.google\.com\/macros\/s\/.+\/exec/.test(fs.readFileSync(path.join(root,'js','brightace-api-config.js'),'utf8')),'Production API configuration remains present.');
c('V43 modules present', ['BA_Security.gs','BA_Sessions.gs','BA_RateLimit.gs','BA_Data.gs','BA_Cache.gs','BA_Messages.gs','BA_Sync.gs','BA_Monitor.gs','BA_Validation.gs','BA_Files.gs'].every(x=>fs.existsSync(path.join(root,'backend',x))),'Requested modular backend structure remains present.');
let failed=0;console.log('\nBrightAce V43 Regression Test\n=============================');for(const x of checks){console.log((x.o?'PASS':'FAIL')+'  '+x.n+' — '+x.d);if(!x.o)failed++;}console.log('\nResult: '+(failed?'FAIL':'PASS')+' ('+checks.length+' checks, '+failed+' failed)');process.exitCode=failed?1:0;
