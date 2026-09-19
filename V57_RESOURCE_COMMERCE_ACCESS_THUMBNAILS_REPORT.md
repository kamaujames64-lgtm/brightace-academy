# V57 — Resource Commerce + Secure Access

## Added
- Small Drive-backed thumbnail image for each resource, shown on public Resources, checkout, Admin Resources, and My Resources.
- Resource purchase history and verified My Resources library.
- Purchase-to-client linking using verified WhatsApp phone and/or client email.
- Duplicate paid-purchase prevention.
- Access/open/download audit records in `RESOURCE_ACCESS`.
- Admin sales/revenue workspace with paid, refunded and net USD totals.
- Resource refund workflow and access revocation for full refunds.
- Resource purchase reconciliation checks.
- Payment-provider abstraction (`BRIGHTACE_RESOURCE_PAYMENT_PROVIDER`, current provider `PAYSTACK`) so future provider replacement is isolated to the provider adapter.
- Resource sheets included in disaster-recovery critical data set.
- Paystack webhook recognizes resource purchases as well as existing BrightAce service payments.

## Thumbnail setup
Upload a small JPG/PNG/WEBP image to Google Drive, then enter its Drive file ID in Admin → Resources → Thumbnail image Drive file ID. The image is used only for visual identification; the actual paid resource file remains separately controlled.

## Access model
A verified client can see paid resources in My Resources and request an access/download URL through the backend. Full refunds revoke BrightAce access. Google Drive sharing still controls the final file itself; this remains a payment/access gate rather than DRM.

## Payment-provider independence
The resource commerce layer calls provider-neutral functions for initialize, verify and refund. Current production configuration remains Paystack through `BRIGHTACE_RESOURCE_PAYMENT_PROVIDER=PAYSTACK`. A future provider can replace that adapter without changing the resource catalog, thumbnail system, purchase records, My Resources UI, or core reconciliation model.

## Existing design preserved
V57 keeps the BrightAce navigation, typography, card system and existing resource workflow intact. The new thumbnail is intentionally small and visual, not a redesign of the Resources page.
