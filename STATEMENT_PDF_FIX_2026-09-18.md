# BrightAce Statement PDF Fix — 2026-09-18

Scope: transaction statement downloads only.

- Owner/main admin: dedicated transaction statement download from Admin Dashboard.
- Client: transaction statement now downloads as a PDF rather than CSV.
- Tutor: transaction statement now downloads as a PDF rather than CSV.
- All statements use the same BrightAce layout, with the BrightAce logo at the top and a faded logo watermark in the background.
- Admin statement is server-authorized for SUPER_ADMIN only.
- Tutor statement includes tutor payments and withdrawal transactions.
- No external PDF library is required; the statement PDF generator is bundled in `js/statement-pdf.js`.
- Existing payment, wallet, withdrawal, client, tutor, assignment and navigation logic is otherwise unchanged.
