/* BrightAce Global Phone Picker — compact country flag + dial code + number field. */
(function(){
  'use strict';
  const SCRIPT_URL=document.currentScript?.src||'';
  const ASSET_BASE=SCRIPT_URL?new URL('../',SCRIPT_URL).href:(location.origin+location.pathname.replace(/[^/]*$/,''));
  const COUNTRIES=[
    ['KE','Kenya','254'],['UG','Uganda','256'],['TZ','Tanzania','255'],['RW','Rwanda','250'],['ET','Ethiopia','251'],['ZA','South Africa','27'],['NG','Nigeria','234'],['GH','Ghana','233'],['ZM','Zambia','260'],['ZW','Zimbabwe','263'],['MW','Malawi','265'],['MZ','Mozambique','258'],['BW','Botswana','267'],['NA','Namibia','264'],['SN','Senegal','221'],['CI','Côte d’Ivoire','225'],['CM','Cameroon','237'],['EG','Egypt','20'],['MA','Morocco','212'],['DZ','Algeria','213'],['TN','Tunisia','216'],['LY','Libya','218'],
    ['US','United States','1'],['CA','Canada','1'],['MX','Mexico','52'],['BR','Brazil','55'],['AR','Argentina','54'],['CL','Chile','56'],['CO','Colombia','57'],['PE','Peru','51'],['VE','Venezuela','58'],
    ['GB','United Kingdom','44'],['IE','Ireland','353'],['FR','France','33'],['DE','Germany','49'],['ES','Spain','34'],['IT','Italy','39'],['PT','Portugal','351'],['NL','Netherlands','31'],['BE','Belgium','32'],['CH','Switzerland','41'],['AT','Austria','43'],['SE','Sweden','46'],['NO','Norway','47'],['DK','Denmark','45'],['FI','Finland','358'],['IS','Iceland','354'],['PL','Poland','48'],['CZ','Czechia','420'],['SK','Slovakia','421'],['HU','Hungary','36'],['RO','Romania','40'],['BG','Bulgaria','359'],['GR','Greece','30'],['UA','Ukraine','380'],['RS','Serbia','381'],['HR','Croatia','385'],['SI','Slovenia','386'],['BA','Bosnia & Herzegovina','387'],['AL','Albania','355'],['EE','Estonia','372'],['LV','Latvia','371'],['LT','Lithuania','370'],['MT','Malta','356'],['CY','Cyprus','357'],['LU','Luxembourg','352'],
    ['AE','United Arab Emirates','971'],['SA','Saudi Arabia','966'],['QA','Qatar','974'],['KW','Kuwait','965'],['BH','Bahrain','973'],['OM','Oman','968'],['IL','Israel','972'],['JO','Jordan','962'],['LB','Lebanon','961'],['TR','Türkiye','90'],['IR','Iran','98'],['IQ','Iraq','964'],
    ['IN','India','91'],['PK','Pakistan','92'],['BD','Bangladesh','880'],['LK','Sri Lanka','94'],['NP','Nepal','977'],['BT','Bhutan','975'],['MV','Maldives','960'],['AF','Afghanistan','93'],
    ['CN','China','86'],['JP','Japan','81'],['KR','South Korea','82'],['TW','Taiwan','886'],['HK','Hong Kong','852'],['MO','Macao','853'],['SG','Singapore','65'],['MY','Malaysia','60'],['ID','Indonesia','62'],['TH','Thailand','66'],['VN','Vietnam','84'],['PH','Philippines','63'],['KH','Cambodia','855'],['LA','Laos','856'],['MM','Myanmar','95'],['BN','Brunei','673'],
    ['AU','Australia','61'],['NZ','New Zealand','64'],['FJ','Fiji','679'],['PG','Papua New Guinea','675'],['WS','Samoa','685'],['TO','Tonga','676'],['VU','Vanuatu','678'],['SB','Solomon Islands','677'],
    ['RU','Russia','7'],['KZ','Kazakhstan','7'],['UZ','Uzbekistan','998'],['KG','Kyrgyzstan','996'],['TJ','Tajikistan','992'],['TM','Turkmenistan','993'],['AZ','Azerbaijan','994'],['GE','Georgia','995'],['AM','Armenia','374'],['BY','Belarus','375'],['MD','Moldova','373'],
    ['JM','Jamaica','1'],['TT','Trinidad & Tobago','1'],['BB','Barbados','1'],['BS','Bahamas','1'],['AG','Antigua & Barbuda','1'],['DM','Dominica','1'],['GD','Grenada','1'],['LC','Saint Lucia','1'],['VC','Saint Vincent & Grenadines','1'],['KN','Saint Kitts & Nevis','1'],['DO','Dominican Republic','1'],['HT','Haiti','509'],['CU','Cuba','53'],
    ['LI','Liechtenstein','423'],['MC','Monaco','377'],['SM','San Marino','378'],['VA','Vatican City','39'],['AD','Andorra','376'],['YE','Yemen','967'],['SY','Syria','963'],['PS','Palestine','970'],['MN','Mongolia','976'],['TL','Timor-Leste','670'],
    ['SD','Sudan','249'],['SS','South Sudan','211'],['SO','Somalia','252'],['DJ','Djibouti','253'],['ER','Eritrea','291'],['BI','Burundi','257'],['CD','DR Congo','243'],['CG','Republic of the Congo','242'],['GA','Gabon','241'],['GQ','Equatorial Guinea','240'],['ST','São Tomé & Príncipe','239'],['AO','Angola','244'],['CV','Cabo Verde','238'],['GM','Gambia','220'],['GN','Guinea','224'],['GW','Guinea-Bissau','245'],['LR','Liberia','231'],['SL','Sierra Leone','232'],['TG','Togo','228'],['BJ','Benin','229'],['BF','Burkina Faso','226'],['NE','Niger','227'],['TD','Chad','235'],['CF','Central African Republic','236'],['ML','Mali','223'],['MR','Mauritania','222'],
    ['MU','Mauritius','230'],['SC','Seychelles','248'],['KM','Comoros','269'],['MG','Madagascar','261'],['RE','Réunion','262'],['SH','Saint Helena','290'],['LS','Lesotho','266'],['SZ','Eswatini','268'],
    ['GU','Guam','1'],['PR','Puerto Rico','1'],['VI','U.S. Virgin Islands','1'],['AS','American Samoa','1'],['MP','Northern Mariana Islands','1'],['PF','French Polynesia','689'],['NC','New Caledonia','687'],['GF','French Guiana','594'],['AW','Aruba','297'],['CW','Curaçao','599'],['SX','Sint Maarten','1'],['BM','Bermuda','1'],['KY','Cayman Islands','1'],['VG','British Virgin Islands','1'],['TC','Turks & Caicos','1']
  ];
  const unique=[];const seen=new Set();COUNTRIES.forEach(x=>{if(!seen.has(x[0])){seen.add(x[0]);unique.push(x)}});unique.sort((a,b)=>a[1].localeCompare(b[1],'en',{sensitivity:'base'}));
  const flag=iso=>String(iso||'').toUpperCase().replace(/[A-Z]/g,c=>String.fromCodePoint(127397+c.charCodeAt(0)));
  const FLAG_FONT='BrightAceFlags';
  const digits=v=>String(v||'').replace(/\D/g,'');
  function infer(v){let n=digits(v);if(n.startsWith('00'))n=n.slice(2);const ordered=unique.slice().sort((a,b)=>b[2].length-a[2].length);for(const c of ordered){if(n.startsWith(c[2])&&n.length>c[2].length+5)return c;}if(/^0[17]\d{8}$/.test(n))return unique.find(x=>x[0]==='KE');return null;}
  function localPart(input,code){let n=digits(input);if(n.startsWith('00'))n=n.slice(2);const ordered=unique.slice().sort((a,b)=>b[2].length-a[2].length);for(const c of ordered){if(n.startsWith(c[2])&&n.length>c[2].length+5){n=n.slice(c[2].length);break;}}if(/^0\d+/.test(n))n=n.slice(1);return n;}
  function fullValue(input,select){const opt=select?.options?.[select.selectedIndex];const code=String(opt?.dataset?.dial||'').replace(/\D/g,'');const local=localPart(input.value,code);return local?`+${code}${local}`:'';}
  const EXAMPLES={US:'(201) 555-0123',CA:'(416) 555-0123',GB:'7400 123456',KE:'712 345 678',TZ:'712 345 678',UG:'712 345 678',RW:'788 123 456',ZA:'71 234 5678',NG:'801 234 5678',GH:'24 123 4567',IN:'98765 43210',PK:'300 1234567',BD:'1712 345678',AU:'412 345 678',NZ:'21 234 567',DE:'151 23456789',FR:'6 12 34 56 78',IT:'312 345 6789',ES:'612 345 678',BR:'11 91234-5678',MX:'55 1234 5678',JP:'90 1234 5678',CN:'138 0013 8000',AE:'50 123 4567',SA:'50 123 4567',TR:'501 234 5678'};
  function countryByCode(code){return unique.find(c=>c[2]===String(code).replace(/\D/g,''));}
  function styles(){
    if(document.getElementById('baPhonePickerStyles'))return;
    const s=document.createElement('style');s.id='baPhonePickerStyles';s.textContent=`
      @font-face{font-family:BrightAceFlags;src:url("${ASSET_BASE}assets/fonts/brightace-flags.woff2") format("woff2"),url("${ASSET_BASE}assets/fonts/brightace-flags.ttf") format("truetype");font-display:swap}
      .ba-phone-picker{display:grid;grid-template-columns:118px minmax(0,1fr);gap:8px;align-items:stretch;width:100%;position:relative}
      .ba-phone-picker .ba-phone-country{width:100%;min-width:0;box-sizing:border-box;border:1px solid #cddbea;border-radius:11px;padding:9px 9px;background:#fff;color:#10263f;font-weight:800;cursor:pointer;position:relative;z-index:4;transition:.18s ease;box-shadow:0 1px 2px rgba(3,21,47,.04)}
      .ba-phone-picker .ba-phone-country:hover{border-color:#08a8b8;box-shadow:0 5px 18px rgba(3,21,47,.09)}
      .ba-phone-picker .ba-phone-country.is-open{border-color:#08a8b8;box-shadow:0 0 0 3px rgba(8,168,184,.12),0 8px 22px rgba(3,21,47,.12)}
      .ba-phone-picker .ba-phone-country-display{display:flex;align-items:center;gap:7px;justify-content:center;height:100%;font-weight:850}
      .ba-phone-picker .ba-phone-country-flag,.ba-country-option-flag{font-family:BrightAceFlags,"Twemoji Mozilla","Segoe UI Emoji",sans-serif;font-size:1.42rem;line-height:1;display:inline-flex;align-items:center;justify-content:center;min-width:1.45em;text-align:center}
      .ba-phone-picker .ba-phone-country-code{font-size:.8rem;letter-spacing:.05em}
      .ba-phone-picker .ba-phone-chevron{font-size:.72rem;color:#5e6d83;transition:transform .18s ease}
      .ba-phone-picker .ba-phone-country.is-open .ba-phone-chevron{transform:rotate(180deg)}
      .ba-phone-picker .ba-phone-number{min-width:0;width:100%;box-sizing:border-box}
      .ba-phone-picker small{grid-column:1/-1;color:#6d7d8d;font-size:.72rem;margin-top:-2px}
      .ba-phone-picker .ba-phone-country-native{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
      .ba-country-menu{position:fixed;left:0;top:0;width:min(390px,calc(100vw - 28px));background:#fff;border:1px solid #bcd2e5;border-radius:17px;box-shadow:0 20px 55px rgba(3,21,47,.24),0 4px 16px rgba(3,21,47,.12);z-index:10000;overflow:hidden;display:none}
      .ba-country-menu.is-open{display:block;animation:baCountryIn .16s ease-out}
      @keyframes baCountryIn{from{opacity:0;transform:translateY(-5px) scale(.985)}to{opacity:1;transform:none}}
      .ba-country-menu-head{padding:13px 13px 11px;background:linear-gradient(135deg,#03152f 0%,#062654 68%,#075f7d 100%);color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}
      .ba-country-menu-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;font-size:.83rem;font-weight:900;letter-spacing:.01em}
      .ba-country-menu-title span:last-child{color:#ffca3a;font-size:.72rem;font-weight:800}
      .ba-country-search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(255,255,255,.3);border-radius:11px;padding:0 11px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
      .ba-country-search-icon{font-size:1rem;color:#087e89}
      .ba-country-search{width:100%;min-width:0;border:0!important;outline:0!important;padding:10px 0!important;background:transparent!important;color:#10263f!important;font-size:.88rem!important;font-weight:650}
      .ba-country-search::placeholder{color:#7a8999}
      .ba-country-list{max-height:310px;overflow:auto;padding:7px;background:#f7fbfe;overscroll-behavior:contain}
      .ba-country-list::-webkit-scrollbar{width:8px}.ba-country-list::-webkit-scrollbar-thumb{background:#b8ccda;border-radius:99px}.ba-country-list::-webkit-scrollbar-track{background:transparent}
      .ba-country-option{width:100%;display:grid;grid-template-columns:35px minmax(0,1fr) auto;align-items:center;gap:9px;border:0;border-radius:11px;background:transparent;padding:9px 9px;color:#10263f;text-align:left;cursor:pointer;font:inherit;transition:.14s ease}
      .ba-country-option:hover,.ba-country-option:focus-visible{background:linear-gradient(90deg,#e5f8fa,#fff);outline:none}
      .ba-country-option.is-selected{background:linear-gradient(90deg,#dff6f8,#eef7ff);box-shadow:inset 3px 0 0 #08a8b8}
      .ba-country-option-flag{font-size:1.55rem}
      .ba-country-option-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.86rem;font-weight:800}
      .ba-country-option-meta{display:flex;align-items:center;gap:7px;color:#64758a;font-size:.73rem;font-weight:750;white-space:nowrap}
      .ba-country-option-code{color:#075f7d;font-weight:900}
      .ba-country-option-check{color:#08a8b8;font-size:.9rem;font-weight:950;visibility:hidden}.ba-country-option.is-selected .ba-country-option-check{visibility:visible}
      .ba-country-empty{padding:24px 14px;text-align:center;color:#64758a;font-size:.83rem;font-weight:700}
      @media(max-width:520px){.ba-phone-picker{grid-template-columns:108px minmax(0,1fr)}.ba-country-menu{width:min(360px,calc(100vw - 20px));left:0}.ba-country-list{max-height:290px}}
    `;document.head.appendChild(s)
  }
  function isPhoneInput(input){const id=String(input.id||'').toLowerCase(),name=String(input.name||'').toLowerCase(),ph=String(input.placeholder||'').toLowerCase();return /phone|whatsapp|mobile|telephone|tel/.test(id+' '+name+' '+ph)}
  function formatLocal(value,iso){
    let n=digits(value);
    if(n.startsWith('0')) n=n.replace(/^0+/,'');
    const groups={KE:[3,3,3],TZ:[3,3,3],UG:[3,3,3],RW:[3,3,3],ZA:[2,3,4],NG:[3,3,4],GH:[2,3,4],IN:[5,5],PK:[3,7],BD:[4,6],US:[3,3,4],CA:[3,3,4],GB:[4,6],AU:[3,3,3],NZ:[2,3,4],DE:[3,4,5],FR:[1,2,2,2,2],IT:[3,3,4],ES:[3,3,3],BR:[2,5,4],MX:[2,4,4],JP:[2,4,4],CN:[3,4,4],AE:[2,3,4],SA:[2,3,4],TR:[3,3,4]};
    const gs=groups[iso]; if(!gs)return n.replace(/(\d{3})(?=\d)/g,'$1 ').trim();
    const out=[];let pos=0;for(const size of gs){if(pos>=n.length)break;out.push(n.slice(pos,pos+size));pos+=size;}if(pos<n.length)out.push(n.slice(pos));
    return out.join(iso==='US'||iso==='CA'?' ': ' ');
  }
  function maxLocalDigits(iso){const groups={KE:9,TZ:9,UG:9,RW:9,ZA:9,NG:10,GH:9,IN:10,PK:10,BD:10,US:10,CA:10,GB:10,AU:9,NZ:9,DE:12,FR:9,IT:10,ES:9,BR:11,MX:10,JP:10,CN:11,AE:9,SA:9,TR:10};return groups[iso]||15;}
  function enhance(input){
    if(!input||input.dataset.baPhoneEnhanced==='1'||input.disabled||input.readOnly||(!isPhoneInput(input)&&input.type!=='tel'))return;
    input.dataset.baPhoneEnhanced='1';input.type='tel';input.autocomplete=input.autocomplete||'tel';styles();
    const wrap=document.createElement('div');wrap.className='ba-phone-picker';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);input.classList.add('ba-phone-number');
    const originalName=input.getAttribute('name')||'';
    const fullHidden=document.createElement('input');fullHidden.type='hidden';fullHidden.className='ba-phone-full-value';
    if(originalName){fullHidden.name=originalName;input.dataset.baOriginalName=originalName;input.removeAttribute('name');}
    wrap.insertBefore(fullHidden,input);

    const select=document.createElement('select');select.className='ba-phone-country-native';select.setAttribute('aria-label','Country');select.tabIndex=-1;
    select.innerHTML=unique.map(c=>`<option value="${c[0]}" data-iso="${c[0]}" data-dial="${c[2]}" title="${c[1]}">${c[1]} +${c[2]}</option>`).join('');

    const display=document.createElement('button');display.type='button';display.className='ba-phone-country';display.setAttribute('aria-haspopup','listbox');display.setAttribute('aria-expanded','false');display.setAttribute('aria-label','Choose country');
    display.innerHTML='<span class="ba-phone-country-display"><span class="ba-phone-country-flag" aria-hidden="true"></span><span class="ba-phone-country-code"></span><span class="ba-phone-chevron">⌄</span></span>';

    const menu=document.createElement('div');menu.className='ba-country-menu';menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Choose your country');
    menu.innerHTML='<div class="ba-country-menu-head"><div class="ba-country-menu-title"><span>Choose your country</span><span class="ba-country-count"></span></div><div class="ba-country-search-wrap"><span class="ba-country-search-icon">⌕</span><input class="ba-country-search" type="search" autocomplete="off" placeholder="Search your country…" aria-label="Search your country"></div></div><div class="ba-country-list" role="listbox"></div>';

    const help=document.createElement('small');
    wrap.insertBefore(display,input);wrap.insertBefore(select,display);wrap.appendChild(menu);wrap.appendChild(help);

    const list=menu.querySelector('.ba-country-list'),search=menu.querySelector('.ba-country-search'),count=menu.querySelector('.ba-country-count');
    const initial=infer(input.value);if(initial)select.value=initial[0];
    // Once the user chooses a country, keep that country locked while they type.
    // A local number such as Kenya's 725... must never be reinterpreted as +7.
    let countryManuallySelected=false;
    function selected(){const opt=select.options[select.selectedIndex];return {iso:opt?.dataset.iso||select.value||'',code:opt?.dataset.dial||''};}
    function renderList(term=''){
      const q=String(term||'').trim().toLocaleLowerCase();
      const matches=unique.filter(c=>!q||c[1].toLocaleLowerCase().includes(q)||c[0].toLocaleLowerCase().includes(q)||c[2].includes(q));
      count.textContent=`${matches.length} countr${matches.length===1?'y':'ies'}`;
      list.innerHTML=matches.length?matches.map(c=>{const sel=c[0]===selected().iso;return `<button type="button" class="ba-country-option${sel?' is-selected':''}" data-code="${c[2]}" data-iso="${c[0]}" role="option" aria-selected="${sel}"><span class="ba-country-option-flag" aria-hidden="true">${flag(c[0])}</span><span class="ba-country-option-name">${c[1]}</span><span class="ba-country-option-meta"><span class="ba-country-option-code">${c[0]}</span><span>+${c[2]}</span><span class="ba-country-option-check">✓</span></span></button>`}).join(''):'<div class="ba-country-empty">No country found. Try another name or code.</div>';
      list.querySelectorAll('.ba-country-option').forEach(btn=>btn.addEventListener('click',()=>{select.value=btn.dataset.iso;countryManuallySelected=true;const c=selected();input.value=formatLocal(localPart(input.value,c.code),c.iso);updateUI();sync();closeMenu();input.focus();}));
    }
    function positionMenu(){const r=display.getBoundingClientRect();const gap=7;const mw=Math.min(390,window.innerWidth-28);let left=Math.min(Math.max(10,r.left),Math.max(10,window.innerWidth-mw-10));let top=r.bottom+gap;const mh=Math.min(430,window.innerHeight-20);if(top+mh>window.innerHeight-10){const above=r.top-gap-mh;if(above>=10)top=above;}menu.style.left=left+'px';menu.style.top=top+'px';menu.style.width=Math.min(390,window.innerWidth-28)+'px';menu.style.maxHeight=Math.max(260,Math.min(430,window.innerHeight-20))+'px';}
    function openMenu(){renderList(search.value);if(menu.parentNode!==document.body)document.body.appendChild(menu);menu.classList.add('is-open');display.classList.add('is-open');display.setAttribute('aria-expanded','true');positionMenu();window.addEventListener('resize',positionMenu);window.addEventListener('scroll',positionMenu,true);setTimeout(()=>search.focus(),0)}
    function closeMenu(){menu.classList.remove('is-open');display.classList.remove('is-open');display.setAttribute('aria-expanded','false');window.removeEventListener('resize',positionMenu);window.removeEventListener('scroll',positionMenu,true)}
    function updateUI(){const c=selected();const flagEl=display.querySelector('.ba-phone-country-flag');flagEl.textContent=flag(c.iso);flagEl.setAttribute('aria-label',c.iso||'');display.querySelector('.ba-phone-country-code').textContent=c.code?`+${c.code}`:'';const example=EXAMPLES[c.iso]||'';input.placeholder=example||'Local phone number';input.maxLength=maxLocalDigits(c.iso)+Math.ceil(maxLocalDigits(c.iso)/3)+3;help.textContent=example?`Enter the local number only. Example: ${example}`:'Enter the local number only.';if(menu.classList.contains('is-open'))renderList(search.value)}
    const c0=selected();input.value=initial?formatLocal(localPart(input.value,initial[2]),initial[0]):formatLocal(localPart(input.value,c0.code),c0.iso);updateUI();
    const sync=()=>{const c=selected(),full=fullValue(input,select);input.dataset.baPhoneFull=full;input.dataset.baPhoneCountry=c.iso;input.dataset.baPhoneCountryCode=c.code;fullHidden.value=full;};
    display.addEventListener('click',()=>menu.classList.contains('is-open')?closeMenu():openMenu());
    display.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='Enter'||e.key===' '){e.preventDefault();openMenu()}});
    search.addEventListener('input',()=>renderList(search.value));
    search.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeMenu();display.focus()}else if(e.key==='ArrowDown'){e.preventDefault();list.querySelector('.ba-country-option')?.focus()}});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target)&&!menu.contains(e.target))closeMenu()},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('is-open')){closeMenu();display.focus()}},true);
    input.addEventListener('input',()=>{const c=selected();if(!countryManuallySelected&&input.value.trim().startsWith('+')){const guessed=infer(input.value);if(guessed&&guessed[0]!==c.iso){select.value=guessed[0];updateUI();}}const cc=selected();const raw=digits(input.value).slice(0,maxLocalDigits(cc.iso));input.value=formatLocal(raw,cc.iso);sync();});
    input.addEventListener('blur',sync);sync();
  }
  function init(){document.querySelectorAll('input[type="tel"],input').forEach(enhance)}
  // The visible phone field stays local/national. Its hidden companion carries the full international value.
  // No submit-time mutation is performed, so the country code never flashes into the visible box.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.BrightAcePhonePicker={init,getValue:input=>{const picker=input?.closest?.('.ba-phone-picker'),select=picker?.querySelector('.ba-phone-country-native');return input&&select?fullValue(input,select):String(input?.value||'').trim();},countries:unique};
})();
