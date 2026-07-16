# Implementation Acceptance: 游戏地球沉浸体验优化

## Automated verification

- [x] Node tests cover atomic cross-region selection, 100-action last intent, camera cancellation / shortest arc / reduced motion, stable marker caps, nine representative countries, holes, MultiPolygon, and date-line geometry.
- [x] Browser tests cover 1280×720, 1440×900, 1920×1080, resize canvas identity, mobile sheet behavior, rapid 10/100 selection, nine-country selection, truthful aggregation, scoped theme, keyboard focus, reduced motion, Hub, and Archive.
- [x] ESLint completes with no warning or error.
- [x] TypeScript completes with no error.
- [x] Production build completes and statically prerenders `/` and `/earth-pro`.

## Visual acceptance

- [x] 1440×900 headed screenshot shows a compact one-line header and the globe as the dominant first-screen surface.
- [x] The filter tray starts collapsed and expands without adding a second set of map camera controls.
- [x] Earth uses deep navy / black surfaces, cyan geography / focus, magenta selection, white primary text, and muted blue-gray secondary text.
- [x] Right panel scrolls internally; mobile keeps the three sheet states and globe controls reachable.
- [x] Hub, Archive, and Earth Explorer Pro styling remains scoped outside `.is-earth-mode`.

## Performance sampling

Production `next start` was sampled in a headed Playwright browser for three rounds at each fixed viewport. This desktop automation session is display/GPU-throttled to roughly 15–18 presentation frames per second, so the figures below are an environment ceiling rather than a physical-device FPS claim.

| Viewport | Round FPS | p95 frame gap | max frame gap |
| --- | --- | --- | --- |
| 1280×720 | 16.0 / 17.1 / 17.1 | 66.8 / 66.7 / 66.7 ms | 83.3 / 66.8 / 66.8 ms |
| 1440×900 | 16.5 / 17.4 / 17.5 | 67.0 / 66.7 / 66.7 ms | 83.3 / 67.7 / 67.5 ms |
| 1920×1080 | 16.8 / 17.6 / 17.4 | 67.6 / 66.7 / 66.8 ms | 83.4 / 66.8 / 67.7 ms |

Ten alternating Sweden/Japan selections updated the semantic final state in 107.1–392.6ms (180.9ms average) in the same throttled headed session. The deterministic camera duration is capped at 600ms; new intent and user interaction cancel older animation frames.

Code-level performance changes verified independently of the automation display cap:

- [x] WebGL canvas identity survives resize and rapid selection.
- [x] Hover no longer rebuilds the game marker model.
- [x] Drag no longer replaces cover descriptors / DOM with dot descriptors.
- [x] Decorative country points are merged and non-pickable at reduced geometry resolution.
- [x] Pixel ratio remains capped at 1.25 and antialiasing remains disabled.
- [x] Visibility modifier skips unchanged style writes.
- [x] Camera animation is cancellable, shortest-arc, reduced-motion aware, and no longer has a duplicate command path.

## Environment limit

Physical-device 60 FPS cannot be certified from the Codex desktop's virtualized headed Chromium display. Local validation should use Chrome Performance on the user's actual GPU; all deterministic correctness, layout, DOM stability, and production-build gates are automated here.
