BrightAce V66 — Country Flag Display Fix

This package fixes the country flag display in the global phone picker.

What changed:
- Replaced device-dependent system emoji rendering for the visible country flag with a bundled color flag webfont.
- Bundled only the regional-indicator flag glyphs needed by the BrightAce country picker (small webfont; no external flag CDN request).
- Kept the country list alphabetical by country/territory name.
- Kept the visible two-letter country initials beside the flag.
- Corrected the phone-picker submit/value lookup to use the actual hidden country select.
- Updated the phone-picker script cache version to v=20261003a so the corrected JavaScript is fetched instead of the older cached version.

Flag source / attribution:
- Mozilla's Twemoji COLR/CPAL project: https://github.com/mozilla/twemoji-colr
- The visual emoji artwork is from Twemoji and is redistributed under CC BY 4.0.
- BrightAce's bundled font is a subset containing the regional-indicator flag glyphs/ligatures needed for this picker.
- Attribution and license information are also included in assets/fonts/BRIGHTACE-FLAG-ATTRIBUTION.txt.

No external flag image service is required by the new picker.
