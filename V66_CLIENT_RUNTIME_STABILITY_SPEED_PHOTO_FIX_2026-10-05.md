# BrightAce V66 Client Runtime, Photo & Navigation Stability Fix — 2026-10-05

- Removed the Currency Converter UI and script from the distribution.
- Client workspace now serves cached/stale dashboard data while the server refreshes in the background, reducing navigation blocking.
- Client API uses a short first timeout plus retry and a longer second attempt; stale dashboard data remains usable on slow Apps Script responses.
- Profile camera input uses the device capture flow and accepts image/*; cropper normalizes supported image inputs to a valid JPEG data URL.
- Backend profile upload accepts common image formats and no longer throws the JPEG-only validation message for non-JPEG uploads.
- Service worker cache version bumped to invalidate stale frontend assets.
