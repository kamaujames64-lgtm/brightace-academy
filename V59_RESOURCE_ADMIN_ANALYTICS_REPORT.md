# BrightAce Academy V59 — Resource Admin & Analytics

## Scope
Built directly from V58. This release adds a read-only resource analytics engine and an Admin Resources analytics workspace while preserving the existing public catalog, client library, payments, thumbnails, refunds, reconciliation, and payment-provider abstraction.

## Analytics
- Total resources and published resources
- Paid resource sales count
- Gross paid revenue in USD
- Refunded amount in USD
- Net resource revenue in USD
- Resource access/open events
- Resource download events
- Per-resource performance table
- Revenue and activity grouped by category
- Last access and last download timestamps where available
- Provider shown from the existing provider abstraction

## Data sources
- `RESOURCE_PURCHASES` for sales/revenue/refunds
- `RESOURCE_ACCESS` for access/download counters
- `RESOURCES` for resource metadata and categories

## Safety
Analytics is read-only. It does not create payments, purchases, access records, refunds, or resource changes. Existing Super Admin protection is retained.

## Important interpretation
`accessCount` is the accumulated BrightAce access/open counter, while `downloadCount` is the accumulated download counter. They are not unique-user counts. Historical access rows are aggregate counters, so this release does not fabricate daily/monthly traffic history.

## Deployment
Deploy the backend as a new Apps Script version while keeping the existing production `/exec` URL. The frontend files remain compatible with the same API URL.

## Validation
Static validation performed after build: duplicate top-level function scan, delimiter balance, V59/API markers, analytics function/action presence, permission-map presence, admin analytics UI presence, and ZIP integrity. No live production payment or load test was claimed.
