'use strict';
const fs=require('fs'),path=require('path'),base=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(base,'js/client-portal-pages.js'),'utf8');
const html=fs.readFileSync(path.join(base,'pages/client-tutoring.html'),'utf8');
const css=fs.readFileSync(path.join(base,'css/client-portal.css'),'utf8');
const checks=[
 ['job selector is rendered for multiple requests',/baTutorJobPicker/.test(js)&&/jobsAll\.length>1/.test(js)],
 ['each job has a dedicated selection control',/data-select-tutoring-job/.test(js)&&/SELECT REQUEST/.test(js)],
 ['selection updates the request query without reloading',/history\.replaceState/.test(js)&&/renderTutoring\(d,s\)/.test(js)],
 ['selected request state is accessible',/aria-pressed/.test(js)&&/aria-current/.test(js)],
 ['job-specific details remain driven by selected request',/sessionsFor\(jobKey\(selected\)\)/.test(js)&&/selected\.tutorAdminRating/.test(js)&&/selected\.tutorDescription/.test(js)],
 ['mobile and tablet responsive styles exist',/@media\(max-width:700px\)/.test(css)&&/ba-tutor-job-picker/.test(css)],
 ['tutoring page cache-busts updated JS and CSS',/20261030v1081-tutoring-job-picker/.test(html)]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`${checks.length-failed}/${checks.length} checks passed`);process.exitCode=failed?1:0;
