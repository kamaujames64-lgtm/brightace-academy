/* BrightAce Python bridge v1.
 * Server-side only: the Render service key never reaches GitHub Pages.
 * First enabled feature is the bounded text_stats smoke test.
 */
function baAdminPythonJob_(body){
  const requestId=Utilities.getUuid();
  const started=Date.now();
  try{
    const profile=getAdminProfile_(String(body&&body.adminToken||''));
    if(String(profile&&profile.role||'').toUpperCase()!=='SUPER_ADMIN'){
      return json_({ok:false,requestId:requestId,error:'Only the super administrator may run Python service tests.'});
    }
    const feature=String(body&&body.feature||'').trim();
    if(feature!=='text_stats'){
      return json_({ok:false,requestId:requestId,error:'This Python feature is not enabled through BrightAce yet.'});
    }
    const input=body&&body.input;
    if(!input||typeof input!=='object'||Array.isArray(input)){
      return json_({ok:false,requestId:requestId,error:'Input must be an object.'});
    }
    const inputKeys=Object.keys(input);
    if(inputKeys.some(function(k){return k!=='text';})){
      return json_({ok:false,requestId:requestId,error:'Only the text input field is permitted for this feature.'});
    }
    if(typeof input.text!=='string'){
      return json_({ok:false,requestId:requestId,error:'Input field text must be a string.'});
    }
    if(input.text.length>100000){
      return json_({ok:false,requestId:requestId,error:'Text exceeds the 100,000-character limit.'});
    }
    const props=PropertiesService.getScriptProperties();
    const rawUrl=String(props.getProperty('PYTHON_SERVICE_URL')||'').trim().replace(/\/+$/,'');
    const key=String(props.getProperty('PYTHON_SERVICE_API_KEY')||'').trim();
    if(!/^https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?$/.test(rawUrl)){
      return json_({ok:false,requestId:requestId,error:'Python service URL is not configured as a valid HTTPS origin.'});
    }
    if(key.length<32){
      return json_({ok:false,requestId:requestId,error:'Python service credentials are not configured.'});
    }
    const response=UrlFetchApp.fetch(rawUrl+'/api/v1/jobs',{
      method:'post',contentType:'application/json',
      headers:{'X-BrightAce-Service-Key':key},
      payload:JSON.stringify({feature:'text_stats',input:{text:input.text}}),
      muteHttpExceptions:true
    });
    const status=response.getResponseCode();
    let data={};
    try{data=JSON.parse(response.getContentText()||'{}');}catch(parseError){data={};}
    console.log(JSON.stringify({event:'PYTHON_PROXY',requestId:requestId,status:status,durationMs:Date.now()-started}));
    if(status<200||status>=300||data.ok!==true){
      return json_({ok:false,requestId:requestId,error:'Python service request failed.',upstreamStatus:status});
    }
    return json_({ok:true,requestId:requestId,jobId:String(data.job_id||''),feature:'text_stats',result:data.result||{},durationMs:Date.now()-started});
  }catch(err){
    console.log(JSON.stringify({event:'PYTHON_PROXY',requestId:requestId,status:'error',durationMs:Date.now()-started}));
    return json_({ok:false,requestId:requestId,error:'Python service request could not be completed. Check the service deployment and server-side configuration.'});
  }
}
