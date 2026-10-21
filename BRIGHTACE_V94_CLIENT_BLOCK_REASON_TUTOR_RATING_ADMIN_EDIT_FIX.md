# BrightAce Academy V94 — Client Block Reasons, Tutor Ratings and Admin Editing

## Changes
- `backend/BA_Security.gs`: adds the new authenticated tutor-edit action to the existing API action allowlist.
- `backend/Code.gs`: build identity advanced to V94; public access preflight returns the restriction reason from the active block record; suspended/inactive client accounts receive a safe explanation. Adds an authenticated `adminUpdateTutor` action that edits an existing tutor profile without changing admission status, and invalidates tutor profile/admin caches.
- `js/client-portal-pages.js`: checks blocked status before rendering cached client workspace content and displays a reason-bearing access notice; shared logout already revokes the server session and clears legacy browser session keys.
- `js/chat.js`: blocked clients see a non-dismissible access notice with the reason; the blocked flow hides new-client, returning-client and OTP verification panels and removes the return-to-verification action. Existing server-side checks remain authoritative.
- `pages/admin-tutors.html`: adds an Edit Details action and edit/save/cancel form for existing admitted tutors, including name, display name, email, professional title, description, rating, WhatsApp number/type, alternative phone and emergency contact details.
- `pages/client-tutoring.html`: displays the assigned tutor's star rating on the selected tutor profile and job cards; client logout now also requests server-side session revocation.
- `tools/brightace-v88-resource-test.js` and `tools/brightace-v94-client-access-tutor-test.js`: expanded regression checks for restriction reasons, server-side access denial, ratings, tutor editing and logout.
- `BRIGHTACE_V94_CLIENT_BLOCK_REASON_TUTOR_RATING_ADMIN_EDIT_FIX.md`: this change report.
- `sw.js` and `pages/chat.html`: cache namespace and chat script URL updated so browsers fetch the fixes.

## Validation
- Contract suite: **51 passed, 0 failed**.
- `node --check` passed for changed JavaScript, inline scripts in the affected HTML pages, and all Apps Script `.gs` files (parsed as JavaScript).
- ZIP integrity check is run after packaging.

Source-level checks only. Production behavior still requires deployment and staging tests using dedicated test accounts. No live Apps Script deployment was performed.
