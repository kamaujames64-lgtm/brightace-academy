# BrightAce Statement PDF Authentication Fix — 2026-09-18

Scope: statement PDF presentation/authentication only. Existing application workflows and backend architecture retained.

Changes:
- Removed the visual fallback that could print “Not available” for missing statement reference/integrity values.
- Statement generation now requires a real statement reference, 64-character SHA-256 integrity code, and verification URL returned by the backend; otherwise it stops with a deployment-specific error instead of issuing an unauthenticated-looking statement.
- Replaced the previous JPEG QR embedding with a crisp 300×300 black/white QR raster embedded directly into the PDF. The QR is generated from the returned online verification URL with high error correction and a quiet zone.
- Added a cleaner document-authentication panel with the full statement reference and full SHA-256 integrity code.
- Added a professional digital-authentication seal and clearer verification instruction.
- Retained the existing BrightAce branding, date range, transactions, totals, owner/client/tutor statement types, and verification page workflow.

Important:
The production Apps Script deployment must contain the matching current backend Code.gs. If the live deployment does not return statementReference, integrityHash, and verificationUrl, the new PDF generator intentionally refuses to create a statement rather than displaying “Not available.”
