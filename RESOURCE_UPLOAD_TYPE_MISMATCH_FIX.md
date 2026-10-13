# Resource upload type mismatch fix

## Symptom
The public resource image upload could fail with: `The uploaded file does not match its declared file type.`

## Root cause
Google Apps Script's `Utilities.base64DecodeWebSafe()` returns a Java byte array where byte values with the high bit set may be represented as negative signed numbers. The signature validator compared those values directly to positive byte values (for example, JPEG `0xFF` and PNG `0x89`). Valid JPG/PNG files could therefore be rejected even though their file signatures were correct.

## Repair
- Added `baUnsignedByte_()` to normalize byte values to the unsigned 0–255 range before checking file signatures.
- Updated image/document/archive signature checks in `backend/BA_Files.gs` to use normalized bytes.
- Updated video container checks in `backend/BA_Resources.gs` for the same signed-byte issue (notably WebM's leading signature bytes).
- Kept MIME allow-lists, extension checks, upload size limits, and the block on active web content/SVG in place.

## Validation
- Manually checked the updated signature checks against canonical JPEG, PNG, GIF, WebP, BMP, TIFF, ICO, PDF, ZIP, and WebM magic-byte patterns using unsigned-byte normalization.
- Confirmed the changed files are included in the ZIP and archive integrity passes.
- This is a source repair. It must be deployed to the Google Apps Script web app version that the public/admin website calls before it will affect live uploads.
