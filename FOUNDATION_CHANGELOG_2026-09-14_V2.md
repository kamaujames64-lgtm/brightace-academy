# BrightAce Academy — Foundation V2 Change Log
Date: 2026-09-14

This package is based on FOUNDATION-COMPLETE-2026-09-14 and makes a second correction/improvement pass against the requested Client/Admin/Tutor requirements.

## Key corrections
- Client WhatsApp access now permits new numbers automatically unless the number is blocked/suspended.
- One WhatsApp number remains tied to one client.
- Every newly started live-chat session receives a fresh verification requirement.
- Client suspension also blocks the WhatsApp access gate.
- Suspended tutors are blocked from receiving new assignments and their WhatsApp number is blocked.
- Tutor dashboard responses no longer expose gross client payment amount, BrightAce share, student budget, or other internal payment/security fields.
- Admin login receives a basic failed-attempt rate limit.
- Client payment page shows service details and request ID.
- Client payment/tutoring pages enforce the same 30-minute inactivity session rule.
- Client dashboard has a first-use tutorial.
- Client dashboard search filters visible dashboard records.
- Tutor work comments now include an emoji picker.
- Admin work assignments has a client/tutor/status search filter.
- Client admission copy now matches the requested non-pre-registration model.

## Important retained requirements
- Client test WhatsApp: 254725010628.
- Tutor test WhatsApp: 0725010628.
- Tutor test password/code: 121212 as already configured by the baseline test flow.
- Tutor payout: 50%.
- Minimum tutor withdrawal: KSh 2,000.
- Client/tutor work communication stays inside the website; WhatsApp remains separate for Admin↔Client and Admin↔Tutor operational messaging.
- Tutor availability remains advisory; Admin appointments remain authoritative.
