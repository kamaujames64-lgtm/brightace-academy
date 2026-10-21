#!/usr/bin/env node
/*
 * BrightAce Academy local static-bundle load test.
 * IMPORTANT: this tests the checked-out static website bundle on localhost only.
 * It does NOT represent Google Apps Script, Google Sheets, Drive, GitHub Pages,
 * or a production API capacity test. Use a separately authorized staging API
 * test before claiming backend capacity.
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const vus = Math.max(1, Math.min(5000, Number(process.argv[2] || 2000)));
const rounds = Math.max(1, Math.min(10, Number(process.argv[3] || 1)));
const assets = [
  '/', '/index.html', '/css/style.css', '/css/client-portal.css',
  '/js/app.js', '/js/client-portal-pages.js', '/js/chat.js', '/sw.js'
];
const buffers = new Map();
function resolveFile(urlPath) {
  let pathname = decodeURIComponent(String(urlPath || '/').split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  try { if (!fs.statSync(file).isFile()) return null; } catch (_) { return null; }
  return file;
}
function loadBuffer(file) {
  if (!buffers.has(file)) buffers.set(file, fs.readFileSync(file));
  return buffers.get(file);
}
const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (!file) { res.writeHead(404, {'content-type':'text/plain'}); res.end('not found'); return; }
  const ext = path.extname(file).toLowerCase();
  const type = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.css' ? 'text/css; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'application/octet-stream';
  const body = loadBuffer(file);
  res.writeHead(200, {'content-type':type,'content-length':body.length,'cache-control':'no-store'});
  res.end(body);
});
function percentile(values, p) { if (!values.length) return 0; const a=values.slice().sort((x,y)=>x-y); return a[Math.min(a.length-1,Math.ceil(p*a.length)-1)]; }
function request(url) {
  const started = performance.now();
  return fetch(url, { cache:'no-store' }).then(async r => {
    await r.arrayBuffer();
    return { status:r.status, ms:performance.now()-started };
  }).catch(() => ({status:0,ms:performance.now()-started}));
}
(async () => {
  server.listen(0, '127.0.0.1', async () => {
    const base = `http://127.0.0.1:${server.address().port}`;
    const timings=[], failures=[];
    const start=performance.now();
    // Every virtual user walks the same initial page-load asset sequence.
    const users=Array.from({length:vus}, async (_,u) => {
      for (let r=0;r<rounds;r++) {
        for (const asset of assets) {
          const result=await request(base+asset);
          timings.push(result.ms);
          if (result.status!==200) failures.push({user:u,asset,status:result.status});
        }
      }
    });
    await Promise.all(users);
    const elapsed=(performance.now()-start)/1000;
    console.log(JSON.stringify({
      test:'BrightAce local static-bundle synthetic load',
      scope:'localhost static files only; not the deployed Apps Script/Sheets backend',
      virtualUsers:vus,roundsPerUser:rounds,requestsPerUser:assets.length*rounds,
      totalRequests:timings.length,elapsedSeconds:Number(elapsed.toFixed(2)),
      throughputRps:Number((timings.length/elapsed).toFixed(1)),
      latencyMs:{p50:Number(percentile(timings,.50).toFixed(1)),p95:Number(percentile(timings,.95).toFixed(1)),p99:Number(percentile(timings,.99).toFixed(1)),max:Number(Math.max(...timings).toFixed(1))},
      failedRequests:failures.length,non200Samples:failures.slice(0,10),
      interpretation:'This confirms only that the local static bundle can be served under this synthetic request pattern. It is not evidence of 2,000-user production or backend capacity.'
    },null,2));
    server.close();
    if(failures.length) process.exitCode=1;
  });
})();
