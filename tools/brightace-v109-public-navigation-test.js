'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sw=read('sw.js'),app=read('js/app.js'),notFound=read('404.html');
assert.match(sw,/v110-native-document-navigation/,'service worker namespace must be bumped');
assert.match(sw,/if \(isPage\(request\)\) return;/,'service worker must not intercept HTML document navigation');
assert.doesNotMatch(app,/fetch\(u\.href/,'HTML page prefetch requests must be removed');
assert.match(notFound,/location\.replace\(target\+location\.search\+location\.hash\)/,'404 helper must repair common page-path and case variants');
assert.ok(fs.existsSync(path.join(root,'.nojekyll')),'.nojekyll must exist');
const publicFiles=['index.html',...['subjects','resources','homework-help','how-it-works','about','faq','contact','privacy','terms'].map(x=>`pages/${x}.html`)];
for(const file of publicFiles){const html=read(file);assert.doesNotMatch(html,/brightace-speed-engine\.js/,'public page must use native full-document navigation');for(const m of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)){const href=m[1];if(/^(?:https?:|mailto:|tel:|#|javascript:)/i.test(href))continue;const clean=href.split(/[?#]/,1)[0];if(!clean)continue;const target=path.resolve(path.dirname(path.join(root,file)),clean);assert.ok(target.startsWith(root+path.sep)||target===root,`${file}: link escapes package: ${href}`);assert.ok(fs.existsSync(target),`${file}: missing local target ${href}`);}}
console.log('BrightAce V110 public navigation checks passed, including native document routing and all local public links.');
