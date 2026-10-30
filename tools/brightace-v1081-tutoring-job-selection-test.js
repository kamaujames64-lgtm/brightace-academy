'use strict';
const fs=require('fs'),path=require('path'),base=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(base,'js/client-portal-pages.js'),'utf8');
const html=fs.readFileSync(path.join(base,'pages/client-tutoring.html'),'utf8');
const css=fs.readFileSync(path.join(base,'css/client-portal.css'),'utf8');
const backend=fs.readFileSync(path.join(base,'backend/Code.gs'),'utf8');
const checks=[
 ['each request card itself is selectable',/data-tutoring-job-card/.test(js)&&/role=\"button\"/.test(js)],
 ['no dropdown or separate SELECT REQUEST control remains',!/baTutorJobPicker/.test(js)&&!/data-select-tutoring-job/.test(js)&&!/SELECT REQUEST/.test(js)],
 ['selected request is visibly highlighted',/ba-tutor-job-card \${isSelected\?'selected'/.test(js)&&/\.ba-tutor-job-card\.selected/.test(css)],
 ['selection updates URL and details without a page reload',/history\.replaceState/.test(js)&&/renderTutoring\(d,s\)/.test(js)],
 ['switching a request uses preloaded data without a new backend call',/const selectTutoringJob=id=>[\s\S]{0,650}renderTutoring\(d,s\)/.test(js)&&!/const selectTutoringJob=id=>[\s\S]{0,650}(?:post\(|fetch\()/.test(js)],
 ['selection is keyboard accessible',/tabindex=\"0\"/.test(js)&&/e\.key==='Enter'\|\|e\.key===' '/.test(js)],
 ['all tutor profiles and sessions are preloaded by the backend',/baTutorProfilesFast_\(requests\)/.test(backend)&&/baClientSchedulesFast_\(phone,Object\.keys\(ids\)\)/.test(backend)],
 ['all job messages and tutor submissions are preloaded',/tutorSubmissions=tutorUpdates/.test(js)===false&&/tutorSubmissions:tutorSubmissions\.slice/.test(backend)&&/messages:messages\.slice/.test(backend)],
 ['job feedback and tutor QA notes are included in preload',/clientFeedback:c\.clientFeedback/.test(backend)&&/tutorSubmissionNote:c\.tutorSubmissionNote/.test(backend)&&/qaNotes:c\.qaNotes/.test(backend)],
 ['client tutoring page cache-busts the preloaded selection frontend',/20261030v110-card-selection-preloaded/.test(html)]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`${checks.length-failed}/${checks.length} checks passed`);process.exitCode=failed?1:0;
