/* BrightAce V108 targeted repair regression checks. */
const fs=require('fs'),path=require('path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const phone=read('js/brightace-phone.js'),code=read('backend/Code.gs'),resources=read('backend/BA_Resources.gs'),page=read('pages/resources.html'),sw=read('sw.js');
const checks=[
 ['Explicit international phone numbers are preserved as +country-code digits',/if\(explicitInternational\)\{\s*const internationalDigits=digits\(raw\)\.replace\(\/\^00\//.test(phone)&&/return internationalDigits \? `\+\$\{internationalDigits\}` : ''/.test(phone)],
 ['Shared dial-code inference prefers the selected country',/function infer\(v,preferredIso\)/.test(phone)&&/same\.find\(x=>x\[0\]===preferredIso\)/.test(phone)],
 ['New OTP send uses targeted batched ranges',/function sendVerificationCode_\([\s\S]{0,1500}verifyState=sh\.getRange\([\s\S]{0,700}setValues\(\[verifyState\]\)/.test(code)],
 ['Returning-client OTP send uses targeted batched ranges',/function returningClientSendVerification_\([\s\S]{0,4500}verifyState=sh\.getRange\([\s\S]{0,700}setValues\(\[verifyState\]\)/.test(code)],
 ['Returning-client OTP verification uses targeted batched ranges',/function returningClientVerify_\([\s\S]{0,3500}verifyState=sh\.getRange\([\s\S]{0,2200}setValues\(\[verifyState\]\)/.test(code)],
 ['First-time OTP verification uses targeted batched ranges',/function verifyChat_\([\s\S]{0,3500}verifyState=sh\.getRange\([\s\S]{0,2200}setValues\(\[verifyState\]\)/.test(code)],
 ['Session issuance batches adjacent session fields',/function issueClientSession_\([\s\S]{0,1800}getRange\(client\.row,m\.sessionTokenHash,1,3\)\.setValues/.test(code)],
 ['Public resources catalog is cached',/function resourcePromotions_\([\s\S]{0,500}BA_PUBLIC_RESOURCE_PROMOTIONS_V2[\s\S]{0,1500}baCachePutJson_/.test(resources)],
 ['Public resources no longer call DriveApp for every card filename',/function baPromoPublic_\([\s\S]{0,1200}mediaFileName:""/.test(resources)],
 ['Admin promotion save/delete invalidate the public catalog cache',/baCacheRemove_\("BA_PUBLIC_RESOURCE_PROMOTIONS_V2"\)/.test(resources)],
 ['Public resources request times out and exposes retry',/setTimeout\(\(\)=>controller\.abort\(\),12000\)/.test(page)&&/retryPublicResources/.test(page)],
 ['Public resources layout includes tablet and phone breakpoints',/@media\(max-width:950px\)[\s\S]*#promoGrid[\s\S]*@media\(max-width:640px\)/.test(page)],
 ['Service worker cache namespace is V108',/brightace-perf-20261030-v108-phone-resource-otp-performance/.test(sw)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)failed++;}
console.log(`BrightAce V108 checks: ${checks.length-failed}/${checks.length} passed.`);if(failed)process.exitCode=1;
