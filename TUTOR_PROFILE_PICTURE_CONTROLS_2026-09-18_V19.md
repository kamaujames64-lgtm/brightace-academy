# BrightAce Academy — Tutor Profile Picture Controls V19 — 2026-09-18

## Scope
One change only: tutor profile-picture management. Existing design, architecture, workflows, payout/currency logic, messaging, and unrelated functionality are left intact.

## Implemented
- Tutors can upload a professional profile picture.
- Tutors can replace/change the existing profile picture.
- Tutors can remove their profile picture and return to the default placeholder.
- Server-side authorization requires the authenticated tutor token for upload/remove.
- Allowed image types remain JPG/JPEG, PNG, WEBP, and GIF.
- Maximum file size remains 5 MB.
- Server validates the data URL and checks the image file signature, rather than trusting only the browser-reported MIME type.
- Uploaded files receive server-generated profile-specific filenames; the original filename is not used as the stored Drive filename.
- Profile files are viewable by link so the existing client/Admin profile-display architecture can render them.
- Replacing/removing a picture cleans up the tutor's previous profile file when it is in the BrightAce attachment folder.
- Tutor profile data and related Admin/client/tutor caches are invalidated after a change so stale pictures are not retained by the existing short cache windows.
- Profile URLs are normalized to Google Drive thumbnail URLs for consistent, clear rendering.
- Existing stored profile URLs are also normalized when read, so older uploaded pictures continue to work.
- Tutor profile, tutor overview, Admin tutor directory/preview, and Client Dashboard/request views retain the existing layout while using the normalized profile image.
- Image-load failures fall back to the normal profile placeholder instead of leaving a broken-image icon.

## Not changed
- No database/ledger redesign.
- No changes to tutor payments, withdrawals, currency conversion, assignments, messaging, login, or client workflows.
- No changes to existing page architecture.
