# BrightAce V66 — Session + Phone + Profile Final Fix

## Fixed
- Fixed `client is not defined` in `clientDashboard_()` by resolving the verified client profile before returning profile-picture data.
- Client dashboard bootstrap no longer requires a saved conversation ID when a valid verified client session exists.
- Client workspace session recovery now works from the verified phone/session even when the browser has a stale request ID.
- Client session tokens are cached individually so a new verified tab/device does not invalidate another active client tab. Each session still expires after 30 minutes of inactivity.
- Expired client sessions redirect to the public home instead of leaving an expiration/error screen inside the portal.
- Global phone UI now shows a compact country selector with flag + country dial code on the left and a separate phone-number field on the right. Existing international formats are normalized for submission.
- Phone inputs are detected globally by type/id/name/placeholder, including older fields that were plain text inputs.
- Client profile picture now offers simple `CHOOSE FROM DEVICE` and `TAKE PHOTO` options, then opens the existing drag/zoom crop frame before saving.
- Existing profile crop behavior remains: user centers/zooms the face and only the cropped square is saved.

## Changed files
### Backend
- backend/Code.gs

### Frontend JavaScript
- js/client-portal-pages.js
- js/brightace-phone.js

### Existing HTML pages
- All HTML pages that already use the global phone picker retain the `brightace-phone.js` include from the previous V66 fix.

## Deployment
1. Replace/update `backend/Code.gs` in the SAME BrightAce Apps Script project.
2. Save the project.
3. Deploy a NEW VERSION of the existing Web App deployment. Keep the existing `/exec` URL.
4. Upload/deploy the updated frontend package.
5. Hard-refresh the website once after deployment.

No second Apps Script project is required.
