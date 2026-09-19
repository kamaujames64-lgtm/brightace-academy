# BrightAce Academy V62 — Speed + Security Hardening

## Objective
Increase response speed on high-traffic resource paths while tightening the application against malformed requests, executable/script uploads, archive bombs, and unauthorized API actions.

## Performance changes
- Added `BA_Performance.gs` with short-lived Script Cache indexes for resource catalog, purchase IDs, access IDs, and paid-purchase duplicate checks.
- Public/admin resource catalogs are cached for 30 seconds and invalidated on resource writes.
- Purchase/access lookups use cached row indexes, then read the current sheet row so access status is not trusted from cache.
- Duplicate paid-purchase checks use a cached identity set and invalidate on purchase/access mutations.
- Existing UI polling and V61 functionality are preserved.

## Security changes
- Added `BA_ThreatDefense.gs`.
- Rejects oversized POST payloads before business logic.
- Rejects suspicious object keys associated with prototype-pollution payloads.
- Upload security now includes archive/Office inspection.
- ZIP/Office containers are checked for entry count and expanded-size limits.
- Blocks embedded executables, scripts, VBA project payloads and common autorun payloads.
- Existing filename, MIME, size and magic-byte validation remains in place.
- Expanded API action allowlists to cover the resource/recovery/operations endpoints instead of relying on implicit routing.

## Security model
This is defense-in-depth, not a replacement for Google Drive/Google Apps Script platform security or commercial antivirus. The upload layer prevents common executable/script/archive abuse before storage; it does not claim to prove an arbitrary file is malware-free.

## Compatibility
- Built directly from V61.
- V61 timed resource access remains intact.
- Resource revoke/restore remains intact.
- Student My Resources, analytics, refunds, reconciliation, payment-provider abstraction, Drive delivery, and existing design remain intact.

## Validation
- Static backend syntax/balance checks performed.
- Duplicate top-level function check performed.
- V62 build/API markers verified.
- ZIP integrity verified.
- No live production penetration test or antivirus scan is claimed.
