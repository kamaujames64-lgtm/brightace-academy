# BrightAce Academy v15 — Admin Chat + Selection + Notification Fix

Targeted patch based on v14. Replace only backend/Code.gs, pages/admin.html, and add css/admin-chat.css.

Fixes:
- Admin request/tutor selections persist during polling instead of resetting.
- Admin can open a request and chat with the student before assigning work.
- Admin messages are stored in MESSAGES and sent to the student's WhatsApp when configured.
- Selected conversation chat auto-refreshes.
- Added explicit sound-test control and stronger browser-audio unlock path.
- Tutor financial privacy remains unchanged.

The public pages/SEO files are untouched by this patch.

The supplied ChatGPT shared link could not be retrieved as an image asset; upload the intended photo before adding it as the global static background.


## v17 additions
- Hardened student request submission so saved requests are not lost if WhatsApp notification fails.
- Persists the start form draft until the request is successfully created.
- Improved Drive attachment links for admin/student viewing and downloading.
- Added student refund request form with reason and optional amount/payment request ID.
- Added Admin Refund Requests section with approve/reject workflow; approved KES/USD refunds can be submitted to Paystack when a verified transaction reference is available. EUR requests are recorded for manual review.
- Made the Admin ↔ Tutor WhatsApp section explicit and visible.
