# Earth Explorer atmosphere assets

These files are original, text-free atmosphere images used only by Earth Explorer. They carry no required information; `src/app/globals.css` provides the complete CSS fallback when the images are absent, loading, or blocked.

## Approved asset

Candidate A was generated with the built-in image generation tool and explicitly selected by the user on 2026-07-18. The generated PNG source is intentionally not part of the project. Only compressed WebP deliveries are retained.

| File | Dimensions | Bytes | SHA-256 | Delivery |
| --- | ---: | ---: | --- | --- |
| `earth-atmosphere-archive-1280.webp` | 1280×721 | 18,662 | `9b872fffa16999088e9157456b4e1369776edac9ab6b116ad0de79c2ce539a25` | Viewports up to 1366 px wide |
| `earth-atmosphere-archive-1672.webp` | 1672×941 | 43,520 | `1332cfa7cf3cae568f34849c333329973d8b9035a5b8d58892cfc35694cef70d` | Wider desktop viewports |

Both files are below the Phase 5 budgets of 180 KB for the small delivery and 320 KB for the wide delivery. They were encoded with `cwebp` 1.6.0 from the selected 1672×941 PNG, with metadata removed.

Phase 6 production verification confirmed that each fresh Earth visit requests only the responsive WebP selected for the viewport, the decorative image creates no extra canvas or layout shift, and an aborted request retains the complete CSS composition and working Globe controls. Detailed measurements are stored in `docs/EARTH_EXPLORER_VALIDATION.md`.

## Composition contract

- The middle 50–52% of the width and roughly 76% of the height stays calm and low contrast for the Globe.
- The rightmost 25–27% stays dark and low detail for the country/game panel.
- Responsive delivery uses a slightly left-biased `cover` crop inside the Globe workspace. A radial alpha mask reduces the calm central Globe zone to 10% image weight, rises gradually through the outer field, and reaches full mask weight only at the far edges.
- The delivered image is composited above the opaque Globe backdrop but below the chart grid, WebGL canvas, markers, tools, and right panel. Its 64% layer opacity with near-neutral brightness/saturation produces an effective peripheral visual strength of roughly 50–64% while the center remains deliberately subdued.
- The image is decorative, has empty alternative text, cannot receive input, and mounts only while Earth Explorer is active.
- A failed decorative image hides itself after `error`, preventing a broken-image glyph while the CSS material fallback remains visible.
- The approved asset contains no text, logo, watermark, map, country border, game-poster imitation, character, dominant starfield, or central competing subject.

## Final generation prompt

```text
Use case: stylized-concept
Asset type: Earth Explorer desktop-wide environmental atmosphere background, 16:9 landscape
Primary request: create an original, text-free, extremely restrained archival observatory atmosphere that can sit behind a large interactive 3D globe
Scene/backdrop: near-black charcoal and ink-green darkness with faint aged archive-paper fibers, subtle mineral dust, oxidized-brass patina only near the far left and outer edges, and a soft optical vignette
Style/medium: premium tactile mixed-media texture, understated retro-futurism, museum archive material study, realistic paper and mineral grain rather than illustration
Composition/framing: wide landscape; preserve a very calm low-contrast central safe zone spanning roughly the middle 50% of width and 76% of height for the Globe; preserve the rightmost 25% as an even darker low-detail safe zone for a details panel; all visual interest must stay peripheral and low-frequency; no central object
Lighting/mood: dim, contemplative, dense charcoal blacks, muted ink green, oxidized brass, trace dark oxblood, warm aged-paper undertone
Constraints: purely atmospheric background, no readable information, no focal subject, no bright highlights, no dominant starfield; the Globe must remain visually dominant when overlaid
Avoid: any text, letters, numbers, logo, watermark, UI, interface frame, map, world map, globe, country border, coastline, chart labels, game character, person, game poster imitation, spacecraft, planet, celestial body, central circle, strong stars, neon cyan, neon magenta, symmetrical hero object
```
