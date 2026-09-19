/* BrightAce V42 — centralized cache helpers. Fail-open by design; source-of-truth remains Sheets. */
function baCacheGetJson_(key){try{const v=CacheService.getScriptCache().get(String(key));return v?safeJson_(v):null}catch(e){return null}}
function baCachePutJson_(key,value,ttl){try{CacheService.getScriptCache().put(String(key),JSON.stringify(value),Math.max(1,Number(ttl||60)));return true}catch(e){return false}}
function baCacheRemove_(key){try{CacheService.getScriptCache().remove(String(key));return true}catch(e){return false}}
