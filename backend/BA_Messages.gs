/* BrightAce V42 — message synchronization primitives. */
function baMessageListAfter_(messages,afterId){
  if(!afterId)return messages||[];const list=Array.isArray(messages)?messages:[],idx=list.findIndex(function(x){return String(x.id||'')===String(afterId)});return idx<0?list:list.slice(idx+1);
}
function baMessageCacheKey_(conversationId){return 'BA_MSG_'+String(conversationId||'');}
