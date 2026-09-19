# BrightAce Academy V58 — Student Resource Library

Build marker: `2026-09-19-V58-STUDENT-RESOURCE-LIBRARY`
JSON API marker: `brightace-json-v58`

## Purpose
V58 continues directly from V57 and expands the paid Google Drive resource system into a student-facing resource library and discovery experience without changing the existing BrightAce visual language or unrelated workflows.

## Included
- Verified-client resource catalog endpoint: `clientResourceCatalog`.
- Public Resources catalog now supports search, category filtering and sorting.
- Verified clients see resources they already purchased as `IN MY RESOURCES` instead of being sent through duplicate checkout.
- Student My Resources library supports search, category filtering and sorting.
- My Resources shows purchase count and active-access status.
- Existing thumbnail images remain visible on catalog and student-library cards.
- Resource access continues to be ownership-checked against the verified client session.
- Full refunds continue to revoke resource access.
- Unpublishing a resource does not delete an existing paid student's library entitlement; it removes the resource from the public catalog while the paid entitlement remains governed by purchase/access state.
- Payment-provider abstraction from V57 is retained.
- V57 admin commerce, reconciliation, thumbnail management and Drive delivery are retained.
- Disaster-recovery resource sheets remain included.

## API changes
GET/POST support added for:
- `clientResourceCatalog`

Existing actions retained:
- `resources`
- `resourceInitializePayment`
- `resourceVerifyPayment`
- `clientResourceLibrary`
- `clientResourceAccess`
- `adminListResources`
- `adminSaveResource`
- `adminDeleteResource`
- `adminResourceCommerce`
- `adminResourceReconciliation`
- `adminRefundResource`

## Validation
- Backend function duplicate scan: PASS — 0 duplicate function names.
- Backend V58 build marker: PASS.
- JSON API marker: PASS.
- New `clientResourceCatalog_` function: PASS.
- Resources page inline JavaScript syntax: PASS.
- My Resources inline JavaScript syntax: PASS.
- Admin Resources inline JavaScript syntax: PASS.
- ZIP integrity: PASS.

## Production testing limitation
No live production mutation or real payment was executed during this build. A real Paystack transaction and deployed `/exec` test must still be performed manually after deployment.

## Deployment
Deploy the V58 Apps Script backend as a **new version of the existing production Web App** while keeping the same `/exec` URL. Do not create a second production endpoint.
