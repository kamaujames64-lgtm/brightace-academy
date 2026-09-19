/* BrightAce V42 — upload security helpers. */
function baAttachmentSignature_(bytes,mime){
  const b=bytes||[],m=String(mime||'').toLowerCase();
  if(m==='application/pdf')return b.length>=4&&String.fromCharCode.apply(null,b.slice(0,4))==='%PDF';
  if(m==='image/jpeg')return b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255;
  if(m==='image/png')return b.length>=8&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10;
  if(m==='image/gif')return b.length>=6&&String.fromCharCode.apply(null,b.slice(0,6)).match(/^GIF8[79]a$/);
  if(m==='image/webp')return b.length>=12&&String.fromCharCode.apply(null,b.slice(0,4))==='RIFF'&&String.fromCharCode.apply(null,b.slice(8,12))==='WEBP';
  if(/^audio\//.test(m)||/^video\//.test(m))return true; // container validation is delegated to Drive/WhatsApp for media.
  if(/officedocument|msword|ms-excel|ms-powerpoint|zip/.test(m))return b.length>=2&&b[0]===80&&b[1]===75;
  if(m==='application/rtf'||m==='text/plain'||m==='text/csv')return true;
  return true;
}
function baSecureUploadCheck_(name,mime,bytes){
  baValidateFilename_(name);validateUpload_(name,mime,bytes.length);
  if(!baAttachmentSignature_(bytes,mime))throw new Error('The uploaded file does not match its declared file type.');
  return true;
}
