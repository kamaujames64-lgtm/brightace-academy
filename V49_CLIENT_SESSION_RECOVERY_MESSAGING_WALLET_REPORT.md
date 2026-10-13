# BrightAce Academy V49 — Client Session Recovery + Messaging/Wallet Continuation

## Purpose
V49 is built directly from the V48 Messaging Delivery + Tutor Wallet Session package. The primary correction is the recurring client error: **“Your verified client session could not be restored. Please verify your WhatsApp number again.”** when a legitimate client still has a valid per-request access token.

## V49 correction
- Individual conversation `verificationStatus` is no longer treated as the client dashboard session boundary during bootstrap.
- A valid client session token remains the first recovery path.
- If the short-lived client session token is missing, stale, or rotated, the server can recover the client session from the conversation’s `clientAccessToken`, provided the request belongs to the supplied WhatsApp number and the server-side 30-minute activity window has not expired.
- `clientDashboard_` also performs the same access-token recovery if a normal dashboard request encounters a stale session token.
- Client Dashboard, Client Payments, and Client Tutoring now pass the existing `clientAccessToken` into bootstrap recovery instead of discarding it.

## Security boundary
The fallback does not accept a phone number alone. It requires the exact conversation ID, matching normalized WhatsApp number, matching per-request `clientAccessToken`, an existing BrightAce client record, and recent server-side activity. After successful recovery a new short-lived client session token is issued.

## Preserved from V48
- Durable messaging delivery queue and retry/dead-letter processing.
- Tutor Payment Wallet navigation/session handoff.
- V47 complete client request history behavior.
- Existing UI/design and unrelated functionality.

## Deployment
Deploy the entire V49 `backend/` folder as a new version of the same Apps Script Web App and keep the same production `/exec` URL. Then verify the deployment with the V49 read-only deployment checker.

## Testing limitation
This package includes static/regression checks. A real production 500-user stress test is not claimed unless the deployed `/exec` is reachable from the test environment and the test is actually executed.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
