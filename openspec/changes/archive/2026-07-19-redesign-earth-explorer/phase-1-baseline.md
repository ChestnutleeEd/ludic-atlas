# Phase 1 browser baseline

Recorded on 2026-07-17 from `f076bd46396a7c3fbccd9805641d710258649068` before product-code edits, using the existing local Next.js development server and a real Chromium browser.

## Renderer and viewport evidence

| Viewport | Globe canvas bounds `(x, y, width, height)` | Canvas count |
| --- | --- | --- |
| 1280×720 fresh Earth entry | `(24, 90, 1232, 610)` | 1 |
| 1366×768 fresh Earth entry | `(24, 90, 1318, 658)` | 1 |
| 1440×900 settled Earth | `(24, 90, 1392, 790)` | 1 |
| 1920×1080 settled Earth | `(24, 90, 1872, 970)` | 1 |
| 390×844 | `(18, 86, 354, 740)` | 1 |

The known responsive-shrink defect is reproducible: after resizing a mounted 1440px view to 1366px the canvas remained 1392px wide, and after 1920→1280 it remained 1872px wide. Fixing that belongs to Phase 2.

## Diagnostics, geography, and markers

- Browser console errors: 0; warnings: 0 during the fresh Earth check.
- Runtime geography request: `world-countries-lite.geojson`, 329,077 transfer bytes and 1,110,450 decoded bytes in the observed development request.
- France: 35 eligible games produced 5 rendered marker elements, including one `+30` overflow marker.
- Poland: 14 eligible games produced 8 rendered marker elements, including one `+6` overflow marker.

## Local-view round trips

- Earth initial entry: 1 canvas.
- Earth → Hub: 0 canvases; Hub → Earth: 1 canvas.
- Earth → Hub → Chronicle: 0 canvases in Chronicle; Chronicle → Hub → Earth: 1 canvas.
- `pathname` remained `/` throughout.
