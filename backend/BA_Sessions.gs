/* BrightAce V42 — session constants/helpers. Existing session formats remain compatible. */
const BA_SESSION_POLICY_={clientIdleMs:30*60*1000,tutorMaxMs:30*24*60*60*1000,adminMaxMs:30*24*60*60*1000,ownerMaxMs:10*365*24*60*60*1000};
function baTokenLooksStrong_(token){return /^[A-Za-z0-9_-]{40,200}$/.test(String(token||''));}
