/* BrightAce V42 — incremental synchronization helpers. */
function baSyncCursor_(messages){const list=Array.isArray(messages)?messages:[];return list.length?String(list[list.length-1].id||''):'';}
function baSyncResponse_(messages,afterId){const full=Array.isArray(messages)?messages:[];return {messages:baMessageListAfter_(full,afterId),syncCursor:baSyncCursor_(full)};}
