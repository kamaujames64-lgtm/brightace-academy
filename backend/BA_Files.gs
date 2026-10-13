/* BrightAce V42 — upload security helpers. */
function baUnsignedByte_(bytes,index){return (Number((bytes||[])[index])||0)&255;}
function baAttachmentSignature_(bytes,mime){
  const b=bytes||[],m=String(mime||'').toLowerCase(),u=i=>baUnsignedByte_(b,i);
  if(m==='application/pdf')return b.length>=4&&String.fromCharCode.apply(null,b.slice(0,4).map((_,i)=>u(i)))==='%PDF';
  if(m==='image/jpeg')return b.length>=3&&u(0)===255&&u(1)===216&&u(2)===255;
  if(m==='image/png')return b.length>=8&&u(0)===137&&u(1)===80&&u(2)===78&&u(3)===71&&u(4)===13&&u(5)===10&&u(6)===26&&u(7)===10;
  if(m==='image/gif')return b.length>=6&&String.fromCharCode.apply(null,b.slice(0,6).map((_,i)=>u(i))).match(/^GIF8[79]a$/);
  if(m==='image/webp')return b.length>=12&&String.fromCharCode.apply(null,b.slice(0,4).map((_,i)=>u(i)))==='RIFF'&&String.fromCharCode.apply(null,b.slice(8,12).map((_,i)=>u(i+8)))==='WEBP';
  if(m==='image/avif')return b.length>=12&&String.fromCharCode.apply(null,b.slice(4,8).map((_,i)=>u(i+4)))==='ftyp'&&/avif|avis/.test(String.fromCharCode.apply(null,b.slice(8,16).map((_,i)=>u(i+8))));
  if(m==='image/bmp')return b.length>=2&&u(0)===66&&u(1)===77;
  if(m==='image/tiff')return b.length>=4&&((u(0)===73&&u(1)===73&&u(2)===42&&u(3)===0)||(u(0)===77&&u(1)===77&&u(2)===0&&u(3)===42));
  if(m==='image/x-icon'||m==='image/vnd.microsoft.icon')return b.length>=4&&u(0)===0&&u(1)===0&&u(2)===1&&u(3)===0;
  if(m==='image/heic'||m==='image/heif')return b.length>=12&&String.fromCharCode.apply(null,b.slice(4,8).map((_,i)=>u(i+4)))==='ftyp';
  if(/^image\//.test(m))return b.length>0; // Browser/Drive support varies for less common image codecs; keep the original file bytes.
  if(/^audio\//.test(m))return true; // Audio codecs/containers vary; Drive stores the original bytes.
  if(/^video\//.test(m))return true; // Resource upload performs a container check for supported video types.
  if(/officedocument|zip/.test(m))return b.length>=2&&u(0)===80&&u(1)===75;
  if(/msword|ms-excel|ms-powerpoint/.test(m))return (b.length>=2&&u(0)===80&&u(1)===75)||(b.length>=8&&u(0)===208&&u(1)===207&&u(2)===17&&u(3)===224&&u(4)===161&&u(5)===177&&u(6)===26&&u(7)===225);
  if(m==='application/rtf'||m==='text/plain'||m==='text/csv')return true;
  return true;
}
function baSecureUploadCheck_(name,mime,bytes){
  baValidateFilename_(name);validateUpload_(name,mime,bytes.length);
  if(!baAttachmentSignature_(bytes,mime))throw new Error('The uploaded file does not match its declared file type.');
  return true;
}
