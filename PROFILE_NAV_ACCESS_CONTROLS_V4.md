# BrightAce Academy — Responsive Navigation & Client Access Controls (v4)

Based on the latest v3 profile-photo ZIP.

## Changes
- Added responsive navigation/avatar safeguards for client, tutor, and admin navigation on small phones, Android devices, and tablets. Profile photos retain circular cropping and fixed flex sizing; admin profile-chip text collapses on very narrow screens to prevent overflow.
- Added a polite, accessible capacity modal on the public Live Chat request form when new-client intake is paused. It includes the requested message and a Returning Client action that opens the existing returning-client verification flow.
- Added a public read-only intake-status action so the form can show the modal before initiating a new request. Backend startChat and clientCreateRequest checks remain authoritative.
- Added Client Admissions controls for the admin to pause/resume new requests, block a WhatsApp/contact number with an internal reason, view currently blocked contacts, and unblock a contact.
- Standardized blocked/suspended contact errors to explain that access is restricted and direct the user to the Contact link at the foot of the page if they believe the decision is unfair. Backend enforcement remains in place.
- Updated cache-busting versions for changed navigation styles and the chat script.

## Files changed
- `backend/Code.gs`
- `pages/admin-clients.html`
- `pages/chat.html`
- `js/chat.js`
- `css/client-portal.css`
- `css/admin-navigation.css`
- HTML files referencing the updated CSS or chat script versions (cache-busting only).

## Validation
- JavaScript syntax check passed for `js/chat.js` and `backend/Code.gs`.
- Inline JavaScript syntax checks passed for `pages/admin-clients.html` and `pages/chat.html`.
- ZIP integrity checked after packaging. Live Google Apps Script deployment and physical Android/tablet testing are still required.
