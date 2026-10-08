# BrightAce V66 — Session, Global Phone & Profile Fix

## Updated backend (.gs)
- `backend/Code.gs`
  - Reworked `clientDashboardBootstrap_()` so a valid 30-minute client session is authoritative before the saved conversation ID/access token.
  - Added recovery when a saved conversation ID is stale/missing.
  - Added server-backed client profile picture upload/removal using Google Drive + CLIENTS sheet.
  - Added profile picture fields to CLIENTS sheet headers.
  - Returned client profile picture URL in dashboard/bootstrap responses.
  - Hardened payment reference TextFinder against empty search values.
- `backend/BA_Security.gs`
  - Allowlisted `clientUploadProfile` and `clientRemoveProfile`.
- `backend/BA_Data.gs`
  - Added explicit phone-column/empty lookup protection to the client conversation index helper.

## Updated frontend JS
- `js/client-portal-pages.js`
  - Session-related API failures now immediately redirect to the public home page rather than showing an expired-session dashboard error.
  - Client profile photo is uploaded to the backend/Drive after browser crop instead of being saved only in localStorage.
- `js/brightace-phone.js`
  - New dependency-free global country/flag phone selector.
  - Editable telephone inputs receive country selection and international formatting assistance.
  - Existing field IDs and backend contracts are preserved.

## Profile crop
- Existing `js/brightace-profile-cropper.js` is retained and used by both client and tutor profile flows.
- User can choose an image, drag it inside the crop frame, zoom it, reset it, and save only the framed crop.
- Client crop is now persisted to Google Drive and its URL recorded in Google Sheets.
- Tutor crop flow remains Drive/Sheets-backed.

## Phone coverage
- Global country/flag selector added to 46 HTML pages containing the site UI.
- Backend normalization continues to accept `+countrycode`, `00countrycode`, spaces/dashes/parentheses and legacy Kenyan local formats.
- International storage remains digits-only E.164-compatible (maximum 15 digits).

## Performance / data architecture
- Google Sheets remains the source of truth.
- Google Drive remains the file store.
- Existing CacheService hot paths remain in place.
- Client dashboard cache is preserved and invalidated when profile/request data changes.
- No Three.js/public 3D component is reintroduced.

## Deployment
Update the three `.gs` files listed above in the existing Apps Script project and deploy a new version of the same Web App `/exec` deployment. Upload/replace the updated frontend JS/HTML files from this package.

Do not create a second Apps Script project or change the production `/exec` URL unless intentionally migrating the deployment.
