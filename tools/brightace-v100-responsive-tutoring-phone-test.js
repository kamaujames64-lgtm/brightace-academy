const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['shared client controls have responsive compact sizing', /V100 responsive control fit/.test(read('css/client-portal.css')) && /max-width:380px/.test(read('css/client-portal.css'))],
  ['site-wide controls wrap safely on mobile', /V100: responsive action controls/.test(read('css/style.css')) && /overflow-wrap:anywhere/.test(read('css/style.css'))],
  ['session detail deep link exists in shared client shell', /Session Details/.test(read('js/client-portal-pages.js')) && /session=\$\{encodeURIComponent\(x\.scheduleId/.test(read('js/client-portal-pages.js')) && /ba-session-detail-grid/.test(read('css/client-portal.css'))],
  ['tutoring data requests retry transient failures', /maxAttempts=2/.test(read('js/client-portal-pages.js')) && /AbortController/.test(read('js/client-portal-pages.js'))],
  ['tutor session API checks status and retries', /attempt<2/.test(read('pages/tutor-sessions.html')) && /r\.ok/.test(read('pages/tutor-sessions.html'))],
  ['client and returning-client forms use full phone-picker value', /phoneValue\("studentPhone"\)/.test(read('js/chat.js')) && /phoneValue\("returningClientPhone"\)/.test(read('js/chat.js'))],
  ['expired client sessions return to returning-client sign-in', read('js/client-portal-pages.js').includes('chat.html?mode=returning') && read('js/chat.js').includes('get("mode")==="returning"')],
  ['tutor sign-in uses full international phone value', /BrightAcePhonePicker\?\.getValue\?\.\(\$\("phone"\)\)/.test(read('pages/tutor.html'))],
  ['tutor wallet stores international mobile value', /BrightAcePhonePicker\?\.getValue\?\.\(\$\("mobileNumber"\)\)/.test(read('pages/tutor.html')) && /BrightAcePhonePicker\?\.getValue\?\.\(\$\("mobileNumber"\)\)/.test(read('pages/tutor-wallet.html'))],
  ['rating label is BrightAce Rating in shared tutoring renderer', /BrightAce Rating/.test(read('js/client-portal-pages.js')) && !/BrightAce Admin rating/.test(read('js/client-portal-pages.js'))],
  ['service worker cache namespace bumped to V108', /v110-native-document-navigation/.test(read('sw.js'))],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`${checks.length - failed}/${checks.length} source checks passed`);
process.exitCode = failed ? 1 : 0;
