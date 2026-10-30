const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let failed = 0, passed = 0;
function check(name, ok, detail='') { if(ok) { passed++; console.log('PASS', name); } else { failed++; console.error('FAIL', name, detail); } }
const tutor = fs.readFileSync(path.join(root, 'pages/tutor.html'), 'utf8');
const currency = fs.readFileSync(path.join(root, 'js/brightace-currency.js'), 'utf8');
const config = fs.readFileSync(path.join(root, 'js/brightace-api-config.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const allFiles = [];
function walk(dir) { for(const item of fs.readdirSync(dir,{withFileTypes:true})) { const full=path.join(dir,item.name); if(item.isDirectory()) walk(full); else if(/\.(html|js|gs|json|py)$/.test(item.name) && item.name !== 'brightace-v92-fetch-recovery-test.js') allFiles.push(full); } }
walk(root);
const endpoints = new Set();
for(const file of allFiles) { const s=fs.readFileSync(file,'utf8'); for(const m of s.matchAll(/AKfycb[A-Za-z0-9_-]+/g)) endpoints.add(m[0]); }
check('Only one Google Apps Script deployment ID is referenced', endpoints.size===1, [...endpoints].join(', '));
check('Currency service follows centralized production API URL', currency.includes('w.BRIGHTACE_API_URL') && currency.includes('AKfycbzs69au8SaV3o8wu2DHzD4VTY96oHVe0c_RUzEzzaMhD7yBkYnXujm_aJE7ZouY-JsK') && !currency.includes('AKfycbzwomGZZ'), 'Currency endpoint mismatch remains');
check('Tutor Overview deduplicates in-flight safe reads', tutor.includes('baReadInflight') && tutor.includes('baReadInflight.has(requestKey)'));
check('Tutor Overview retries only safe reads', tutor.includes('safeRead?3:1') && tutor.includes('Write actions are never automatically retried'));
check('Tutor Overview avoids overlapping dashboard refreshes', tutor.includes('tutorOverviewLoadBusy') && tutor.includes('if(tutorOverviewLoadBusy)return'));
check('Admin-message failure no longer discards loaded dashboard data', tutor.includes('adminMessagesFailed') && tutor.includes('Your overview data is still loaded'));
const scheduler=tutor.slice(tutor.indexOf('BrightAceScheduler.start("tutor-dashboard"')); check('Dashboard polling does not reload withdrawals on every tick', scheduler.includes('load(true)') && !scheduler.slice(0,180).includes('loadWithdrawals') && scheduler.includes('30000'));
check('Service worker cache version bumped for V100 responsive tutoring and phone update', sw.includes('brightace-perf-20261030-v110-native-document-navigation'));
check('Central API config matches the sole deployment ID', config.includes([...endpoints][0]));

const earnings=fs.readFileSync(path.join(root,'pages/tutor-earnings.html'),'utf8');
const backend=fs.readFileSync(path.join(root,'backend/Code.gs'),'utf8');
const resources=fs.readFileSync(path.join(root,'pages/resources.html'),'utf8');
const docker=fs.readFileSync(path.join(root,'python-service/Dockerfile'),'utf8');
check('Tutor refund display hides percentage and shows adjustment amount', !/50% share of the refunded amount/i.test(earnings) && earnings.includes('tutorShareAdjustment') && earnings.includes('Refund account updates'));
check('Tutor balance colors reflect negative vs nonnegative balances', earnings.includes('ba-balance-negative') && earnings.includes('ba-balance-positive') && earnings.includes('balance<0'));
check('Tutor refund details include reason from refund record', backend.includes('refundReasonsById') && backend.includes('reason:refundReasonsById[refundId]'));
check('Client request access action is allowed and dispatched', fs.readFileSync(path.join(root,'backend/BA_Security.gs'),'utf8').includes("'publicRequestIntakeStatus'") && backend.includes('body.action === "publicRequestIntakeStatus"'));
check('Resource internal links do not force new tabs', resources.includes('function linkTarget(url)') && resources.includes("location.origin?'':' target=\\\"_blank\\\""));
check('Render container honors platform PORT', docker.includes('${PORT:-8000}'));

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
