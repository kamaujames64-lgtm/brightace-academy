# BrightAce Academy V71 — Profile, Settings & Intake Improvements

## Scope
Built on BrightAce Academy V70 — Navigation Contrast Fix. Existing project structure, API endpoint configuration, navigation design, tutor work tools, admin operations and finance features are retained.

## Profile duplication and navigation
- Removed the duplicate profile-picture upload/editor section from the tutor dashboard. The dashboard retains one compact profile identity card and a clear link to Settings.
- Consolidated tutor profile editing, profile-picture upload/removal, professional title/description, alternative phone and emergency contact details into `pages/tutor-profile.html`.
- Added a clear **Settings** item to tutor navigation across tutor pages.
- Replaced the admin navigation's **My Profile** item with **Settings** under SYSTEM and rebuilt `pages/admin-profile.html` as an account settings page.
- Increased clarity of tutor professional titles in the tutor dashboard and admin tutor directory/dashboard preview.

## Tutor settings
- Existing profile-picture upload/crop/remove workflow is retained, with a consistent 5 MB limit matching the backend.
- Professional title and description are editable.
- Alternative phone, emergency contact name and emergency contact phone are saved in the TUTORS sheet using new additive columns.
- Tutor settings explain the current authentication model: tutor sign-in uses WhatsApp verification codes, not passwords. No insecure or unused tutor-password mechanism was added. Changing the registered sign-in number requires Admin verification.

## Admin settings
- Admin profile picture upload/crop/remove retained and aligned to the backend's 5 MB limit.
- Professional title and description editable.
- Alternative phone and emergency contact details saved in the administrator record.
- Added a secure **Change Admin Password** form using the existing `adminChangeOwnPassword` backend action, including current-password verification, 8-character minimum and confirmation match.
- Added a Client Admissions / Tutor Capacity control on the Settings page. The existing dashboard toggle is also relabelled for clarity.

## Intake pause behavior
- When admissions are paused, new chat/request starts and final client request submissions are blocked with a polite message explaining that tutors are fully booked and inviting the client to check back soon.
- Existing conversations, assignments and scheduled sessions are not cancelled or modified.
- Intake pause state is stored through the existing server-side Script Properties control (`NEW_REQUEST_INTAKE_ENABLED`).

## Backend and security
- Added `alternativePhone`, `emergencyContactName` and `emergencyContactPhone` as non-destructive tutor-sheet columns.
- Extended tutor/admin profile update and session-profile responses to persist and return the new fields where appropriate.
- Added existing profile-update/upload/remove actions to the backend security allow-list; the project previously routed these actions but did not list them in the gateway allow-list.
- Allowed authenticated admins to manage their own profile and change their own password even when their operational permissions are restricted. Legacy plaintext admin passwords are converted to SHA-256 hashes before profile actions persist the administrator list.
- Updated service-worker version to invalidate stale V70 assets.

## Validation performed
- Node syntax checks passed for modified inline scripts, backend `Code.gs`, `BA_Security.gs`, and admin navigation JavaScript.
- Existing BrightAce static regression suite passed: 5 checks, 0 failures.
- All 15 admin navigation destinations were verified to exist.
- Static checks confirmed the duplicate tutor dashboard profile editor is removed, new settings actions are allow-listed, and intake pause checks exist at both new-chat and final request-submission points.
- ZIP integrity check performed after packaging.

## Deployment note
No live production deployment or authenticated browser test was performed. Backend changes in `backend/Code.gs` and `backend/BA_Security.gs` must be deployed to the existing Google Apps Script Web App as a new version before the new profile/contact fields, admin password form, and server-enforced intake pause behavior will work against production. Deploy the full project according to the existing BrightAce deployment process; retain the current `/exec` endpoint URL unless intentionally changing deployments.
