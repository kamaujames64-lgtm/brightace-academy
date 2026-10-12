# BrightAce Academy V72 — Profile Visibility & Backend Fix

## Starting point
Built from the complete BrightAce Academy V71 — Profile Settings and Intake project ZIP. Existing page structure, role-specific navigation, API endpoint, and other application workflows are retained.

## Changes

### 1. Profile picture formats and display compatibility
- Tutor and admin file pickers now accept `image/*`, so users can select any image format their browser can decode.
- The existing cropper normalizes selected photos to JPEG before upload. This keeps saved profile photos consistent and widely displayable even when the original image was PNG, WEBP, GIF, BMP, SVG, HEIC, or another format supported by that browser. Animated images become a still profile portrait.
- Existing upload size limit remains 5 MB; server-side validation continues to verify the uploaded JPEG data.

### 2. Tutor profile photos visible to clients
- Client “My Tutors & Sessions” responses now include the assigned tutor’s picture, professional title, and description from the tutor profile record.
- Client tutoring pages show the tutor’s picture and professional title on the selected assignment and job cards.

### 3. Client profile photos visible to tutors
- Tutor work payloads now include the associated client’s profile picture URL.
- Tutor dashboard work cards display the client’s profile picture next to the client name.
- Client-photo updates/removals invalidate relevant tutor dashboard caches; tutor profile changes invalidate the fast tutor-profile cache and client tutoring snapshots so updated pictures propagate promptly.

### 4. Fixed “Invalid argument: key” when toggling new client requests
- Added the missing `CONFIG.newRequestIntakeKey` configuration value: `NEW_CLIENT_REQUEST_INTAKE_ENABLED`.
- Both intake status reads and writes now use a validated, non-empty Script Properties key.
- The setter rejects non-boolean values with a clear message rather than attempting an invalid write.
- The existing polite paused-intake message and the promise not to interrupt existing conversations or scheduled sessions remain intact.

## Validation performed
- JavaScript syntax checks passed for 49 inline page scripts.
- Backend `Code.gs` and `BA_Speed.gs` syntax checks passed under Node.js parsing.
- Existing regression suite: 5/5 checks passed.
- Existing security suite: 11/11 checks passed.
- ZIP integrity check passed.

## Deployment notes / limits
- Deploy the updated `backend/Code.gs` and `backend/BA_Speed.gs` to the existing Google Apps Script project, then deploy a new Web App version for the live site to receive the intake-key fix and profile API changes.
- Profile photos are stored as link-viewable Drive thumbnails to match the current app’s image-serving model. Emergency contact information is not added to public profile responses.
- “Every format” means every image format the user’s browser can decode and draw to canvas. Formats unsupported by a particular browser (some HEIC/HEIF files, for example) may need to be converted before selection.
- No production deployment or authenticated live browser test was performed. The load-test script was not run because `BRIGHTACE_EXEC_URL` was not configured in the test environment.
