# Phase 1 evidence

## Pre-edit repository baseline

- Branch: `feat/improve-earth-marker-scaling-and-persistence`
- `HEAD`, `main`, and `origin/main`: `f1a943186e71ee7282d8176b3449fca2ab21973f`
- Initial `git status --short`: only `?? openspec/changes/improve-earth-marker-scaling-and-persistence/`
- `main` is an ancestor of `HEAD`: yes
- `origin/main` is an ancestor of `HEAD`: yes
- `refs/heads/backup/course-submission-20260719`: `f1a943186e71ee7282d8176b3449fca2ab21973f`
- `refs/tags/backup-pre-course-release-20260719`: `23f29ebb79eee16d9543c12ea3781a111a44be68`

## Phase 1 implementation file set

Confirmed against `docs/02_FEATURE_MAP.md` before creating product helpers or tests:

- `src/lib/coverSize.ts`: pure cover-size constants, numeric normalization, storage parsing, and safe storage read contract. It is deliberately not connected to `GameEarthApp` in Phase 1.
- `src/lib/markerContracts.ts`: pure semantic marker identity and interaction-quality policy. It deliberately does not provide a DOM registry or change rendering behavior.
- `tests/cover-size-contract.test.ts`: unit coverage for cover-size anchors, step alignment, invalid input, versioned storage, and storage failures.
- `tests/marker-contracts.test.ts`: unit coverage for game/aggregate/overflow identity and idle/drag/zoom/programmatic/auto-rotate/settling/cover-size/reduced-motion policy.
- `tests/e2e/earth-marker-phase1.spec.ts`: 1440x900 characterization and diagnostic probes for current marker hiding, DOM/image identity, requests, accepted-set changes, canvas ownership, console, hydration, and representative navigation paths.
- `docs/00_PROJECT_INDEX.md`: living-document index entries for the new pure contracts and Phase 1 browser suite.
- `docs/02_FEATURE_MAP.md`: living-document entries for the new contract and test paths.

No Phase 2 renderer, CSS visibility, collision, camera, SafeViewport, UI, persistence wiring, or DOM-registry change is included.

## Reproduction and production measurements

Verified at 1440x900 by `tests/e2e/earth-marker-phase1.spec.ts`:

- Global drag: the marker DOM count and `data-marker-visible-count` remain nonzero, every probed marker/button and image node remains connected and identical, `is-globe-interacting` and `is-globe-low-detail` are present, and the low-detail CSS makes every marker `visibility: hidden`. Back-face opacity remains an independent signal. Canvas count remains one.
- Global to France programmatic focus: `is-globe-low-detail` is present, but the current country accepted set is not available until collision settles, so `data-marker-visible-count`, marker DOM count, and therefore `htmlElementsData` are temporarily zero. After the camera settles, France marker DOM returns and computed CSS visibility is restored.
- France drag and continuous wheel: the existing marker DOM remains connected with the same probed button/image nodes while low-detail CSS makes every current marker `visibility: hidden`; `data-marker-visible-count` remains nonzero.
- France camera-tool zoom: existing markers are hidden during the programmatic camera animation and visible again after `data-camera-travelling` returns to `false`.
- France keyboard cover-size change: the current product value changes from 56 to 60, the accepted semantic/layout set changes, retained semantic identities do not retain all corresponding DOM/image nodes, and the already-loaded cover URL request counts do not increase.
- Poland and Canada programmatic focus/rapid switching: each latest country state settles correctly with one canvas, one camera controller, two OrbitControls lifecycle listeners, and one ResizeObserver.
- Country detail and game detail transitions are exercised in the France characterization.
- Console errors: 0. Hydration warnings: 0. WebGL warnings in production baseline: 0.

Production-style auto-rotate baseline from the same verified run (current markers hidden by low-detail CSS during sampling):

| Context | FPS | p95 frame | max frame | long tasks | markers | images | hidden | canvas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Global | 58.9 | 18.7 ms | 34.4 ms | 0 | 22 | 0 | 22 | 1 |
| France | 48.3 | 33.4 ms | 35.0 ms | 0 | 18 | 18 | 18 | 1 |
| Poland | 48.6 | 33.4 ms | 34.3 ms | 0 | 9 | 9 | 9 | 1 |

The run observed 19 cover requests for 19 unique URLs across the complete Global/France/Poland navigation sequence, with no duplicate URL request. These measurements are machine/run observations and are intended as the pre-Phase-2 comparison baseline.
