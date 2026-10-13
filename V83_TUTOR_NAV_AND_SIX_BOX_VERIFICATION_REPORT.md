# V83 Tutor Navigation & Six-Digit Verification UI

## Changes
- Unified the fixed tutor navigation across all seven tutor pages using the same BrightAce navy/gold header, logo sizing, active state, and compact menu styling.
- Removed horizontal scrolling from the navigation containers. At smaller widths, menu items wrap into rows rather than becoming horizontally scrollable.
- Kept the Admin link hidden in tutor navigation.
- Added a reusable six-box numeric OTP interface to tutor sign-in verification and both client verification flows on the chat page (new and returning client).
- Preserved the original input IDs and code-reading flow by synchronizing the six visible digit boxes to the existing underlying inputs. Supports numeric-only entry, auto-advance, backspace navigation, paste, and six-digit validation.

## Validation
- JavaScript syntax and ZIP integrity checks performed locally.
- Live WhatsApp delivery, authenticated login, and real browser visual QA require deployment and were not simulated.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
