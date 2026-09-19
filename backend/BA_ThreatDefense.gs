/* BrightAce V63 — threat defense for malformed requests and uploaded archives.
   Apps Script cannot run a full commercial AV engine, so this is a defensive
   pre-storage layer: strict payload bounds, archive-entry inspection, executable
   and script blocking, and zip-bomb limits. */
const BA_V63_MAX_REQUEST_BYTES_=20*1024*1024;
const BA_V63_MAX_ARCHIVE_ENTRIES_=800;
const BA_V63_MAX_ARCHIVE_UNPACKED_=80*1024*1024;
function baThreatCheckRawRequest_(e){
  const n=Number(e&&e.postData&&e.postData.length||0); if(n>BA_V63_MAX_REQUEST_BYTES_)throw new Error('Request is too large.'); return true;
}
function baThreatCheckObject_(body){
  if(!body||typeof body!=='object')throw new Error('Invalid request payload.');
  ['__proto__','prototype','constructor'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(body,k))throw new Error('Invalid request payload.');});
  return true;
}
function baThreatCheckArchive_(bytes,mime,name){
  const m=String(mime||'').toLowerCase(),n=String(name||'').toLowerCase();
  const zipLike=/zip|officedocument|msword|ms-excel|ms-powerpoint/.test(m)||/\.(zip|docx|xlsx|pptx|docm|xlsm|pptm)$/i.test(n);
  if(!zipLike)return true;
  try{
    const blobs=Utilities.unzip(Utilities.newBlob(bytes,mime,name));
    if(blobs.length>BA_V63_MAX_ARCHIVE_ENTRIES_)throw new Error('Archive contains too many files.');
    let total=0;
    blobs.forEach(function(b){const bn=String(b.getName()||'').toLowerCase();total+=Number(b.getBytes().length||0);if(total>BA_V63_MAX_ARCHIVE_UNPACKED_)throw new Error('Archive expands beyond the allowed safety limit.');if(/(^|[\\/])(vbaProject\.bin|[\w .-]+\.(exe|dll|scr|com|bat|cmd|ps1|vbs|js|jse|mjs|cjs|hta|sh|bash|php|phtml|jar|apk|msi|iso))$/i.test(bn))throw new Error('Archive contains a blocked executable or script.');if(/(^|[\\/])(?:autorun\.inf|desktop\.ini)$/i.test(bn)&&/\.(exe|dll|bat|cmd|scr)$/i.test(bn))throw new Error('Archive contains a suspicious autorun payload.');});
  }catch(e){throw new Error(String(e&&e.message||'Archive security validation failed.'));}
  return true;
}
function baThreatSecureUploadCheck_(name,mime,bytes){
  baSecureUploadCheck_(name,mime,bytes);baThreatCheckArchive_(bytes,mime,name);return true;
}
