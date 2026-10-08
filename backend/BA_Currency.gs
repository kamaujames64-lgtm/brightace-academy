/** BrightAce Academy — currency display and document conversion layer.
 * USD is the default display currency. Financial records are never rewritten.
 */
const BA_FX_CURRENCIES_=['USD','EUR','GBP','CHF','CAD','AUD','NZD','JPY','CNY','SGD','HKD','AED','SAR','ZAR','NGN','GHS','KES','UGX','TZS','RWF','ETB','EGP','INR','PKR','BDT','MYR','THB','TRY','BRL'];
const BA_FX_FALLBACK_={USD:1,EUR:0.92,GBP:0.79,CHF:0.80,CAD:1.38,AUD:1.52,NZD:1.76,JPY:149,CNY:7.18,SGD:1.35,HKD:7.82,AED:3.6725,SAR:3.75,ZAR:17.8,NGN:1550,GHS:15.5,KES:129,UGX:3600,TZS:2650,RWF:1450,ETB:124,EGP:48,INR:84,PKR:283,BDT:121,MYR:4.25,THB:33.5,TRY:42,BRL:5.35};
function baCurrencyAllowed_(code){return BA_FX_CURRENCIES_.indexOf(String(code||'').toUpperCase())>=0;}
function baNormalizeCurrency_(code){const c=String(code||'USD').trim().toUpperCase();return baCurrencyAllowed_(c)?c:'USD';}
function baFxRatesData_(){
  const cache=CacheService.getScriptCache(),key='BA_FX_USD_RATES_V2',hit=cache.get(key);
  if(hit){const parsed=safeJson_(hit);if(parsed&&parsed.rates)return parsed;}
  let rates=Object.assign({},BA_FX_FALLBACK_),source='fallback';
  try{
    const r=UrlFetchApp.fetch('https://open.er-api.com/v6/latest/USD',{muteHttpExceptions:true,followRedirects:true,timeout:8000});
    const x=JSON.parse(r.getContentText()||'{}');
    if(r.getResponseCode()<300&&x&&x.result==='success'&&x.rates){
      BA_FX_CURRENCIES_.forEach(c=>{const n=Number(x.rates[c]);if(n>0)rates[c]=n;});
      rates.USD=1;source='open.er-api.com';
    }
  }catch(e){/* safe fallback */}
  const out={ok:true,base:'USD',rates:rates,source:source,generatedAt:new Date().toISOString(),cachedForSeconds:3600};
  try{cache.put(key,JSON.stringify(out),3600);}catch(e){}
  return out;
}
function baFxRates_(){return json_(baFxRatesData_());}
function baConvertAmount_(amount,from,to){
  const n=Number(amount),a=baNormalizeCurrency_(from),b=baNormalizeCurrency_(to);if(!isFinite(n))return 0;if(a===b)return Math.round(n*100)/100;
  const rates=baFxRatesData_().rates,rf=Number(rates[a]),rt=Number(rates[b]);if(!(rf>0)||!(rt>0))return Math.round(n*100)/100;
  return Math.round((n/rf*rt)*100)/100;
}
function baMoneyDisplay_(amount,from,to){const target=baNormalizeCurrency_(to);return {amount:baConvertAmount_(amount,from,target),currency:target,originalAmount:Number(amount||0),originalCurrency:baNormalizeCurrency_(from)};}
