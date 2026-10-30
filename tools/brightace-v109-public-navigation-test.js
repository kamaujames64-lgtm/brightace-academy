'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const engine = read('js/brightace-speed-engine.js');
const sw = read('sw.js');
const home = read('index.html');
const notFound = read('404.html');
assert.match(engine, /softNavigation:\s*false/, 'soft navigation must be disabled by default');
assert.match(engine, /if \(!cfg\.softNavigation\) return;/, 'click handler must leave navigation to the browser');
assert.match(engine, /pageIsSafeForSoftNavigation/, 'soft-nav safety guard remains available if explicitly enabled');
assert.match(sw, /v109-public-navigation-fix/, 'service worker cache namespace must be bumped');
assert.match(home, /brightace-speed-engine\.js\?v=1\.0\.2/, 'home must request fresh speed-engine asset');
assert.match(notFound, /Return to BrightAce Academy/, 'GitHub Pages 404 page must provide a home route');
assert.ok(fs.existsSync(path.join(root, '.nojekyll')), '.nojekyll must exist');
// Check every local link in the public navigation set resolves to a file in this package.
const publicFiles = ['index.html', ...['subjects','resources','homework-help','how-it-works','about','faq','contact','privacy','terms'].map(x => `pages/${x}.html`)];
for (const file of publicFiles) {
  const html = read(file);
  for (const m of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (/^(?:https?:|mailto:|tel:|#|javascript:)/i.test(href)) continue;
    const clean = href.split(/[?#]/, 1)[0];
    if (!clean) continue;
    const target = path.resolve(path.dirname(path.join(root, file)), clean);
    assert.ok(target.startsWith(root + path.sep) || target === root, `${file}: link escapes package: ${href}`);
    assert.ok(fs.existsSync(target), `${file}: missing local target ${href}`);
  }
}
console.log('BrightAce V109 public navigation checks: 6 core assertions + local public-link audit passed.');
