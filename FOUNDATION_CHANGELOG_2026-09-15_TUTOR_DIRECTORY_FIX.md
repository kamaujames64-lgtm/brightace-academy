# BrightAce Academy — Tutor Directory Dashboard Fix
Date: 2026-09-15

Focused one-change correction requested from the Tutor Directory.

## Problem found
The Tutor Directory page contained TWO elements with the same HTML id `tutorPreview`:
1. the attachment-preview area inside the private tutor chat composer;
2. the actual Tutor Dashboard Preview modal.

Because JavaScript resolves `getElementById('tutorPreview')` to the first occurrence, the OPEN DASHBOARD button could complete the API call and change to `OPENED ✓` while the actual dashboard modal remained hidden.

## Correction
- Renamed the attachment preview element to `tutorAttachmentPreview`.
- Updated its JavaScript reference.
- Kept the real dashboard modal as the unique `tutorPreview` element.
- Added a dedicated `CLIENT ↔ ADMIN` preview tab so the admin can inspect the client/admin conversation for every request assigned to the selected tutor.
- Existing Tutor Dashboard, Client View and Admin ↔ Tutor views remain intact.

No unrelated workflow or architecture was redesigned.
