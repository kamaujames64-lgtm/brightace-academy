# BrightAce Admin & Tutor Profile Photo / Public Details — V14

## Changes
- Added a dedicated `pages/admin-profile.html` page for the signed-in administrator's profile photo and client-facing professional title/description.
- Added camera capture using the existing BrightAce profile cropper, file selection, crop/zoom workflow, upload/change, and remove-photo controls to the admin profile page.
- Added a `My Profile` navigation link from the Admin Dashboard and Admin Team page.
- Updated the tutor profile page with `TAKE PHOTO`, file selection, the same cropper workflow, and editable professional title and description.
- Added authenticated backend actions for admin photo upload/removal and public-profile updates, plus tutor professional-detail updates.
- Added a `professionalTitle` column to the TUTORS sheet schema without removing existing fields. Tutor title and description now flow through tutor profile APIs and client-facing assigned-tutor data.
- Updated the client tutoring workspace to show the tutor's professional title and description alongside their profile photo when supplied.
- Bumped the service-worker cache version to `brightace-v66-runtime-20261011-profile-v14`.
- Preserved the existing profile-photo validation and 5 MB upload limit for admin/tutor uploads.

## Validation
- Node.js syntax checks passed for `backend/Code.gs`, `backend/BA_Speed.gs`, the client portal script, and inline scripts in modified profile/admin pages.
- ZIP integrity verified after packaging.
- Live Google Apps Script / Drive upload behavior was not testable from this local archive; deploy the included backend files and test photo upload, removal, and public profile display in the production web app.
