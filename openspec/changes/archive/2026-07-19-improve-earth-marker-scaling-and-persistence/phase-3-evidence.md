## Phase 3 finalization evidence

### Human visual acceptance

Acceptance date: 2026-07-19.

The user completed the required manual review after Phase 2 and explicitly confirmed that the current implementation has no blocking issue and is ready for final delivery:

- the default 72 px cover size is acceptable;
- the 48–112 px control works as intended;
- covers remain visible during drag, wheel zoom, automatic rotation, and programmatic country flight;
- France, Poland, Belgium, and Japan show no blocking overlap or layout problem;
- cover persistence works as intended;
- the current interaction smoothness, control layout, focus/reduced-motion behavior, occlusion, and 390×844 usability have no blocking acceptance issue.

This evidence satisfies task 3.1 and authorizes the final automated validation and documentation work in task 3.2. It does not expand the accepted product surface to Atlas and does not authorize RAWG, country-inference, source-game-data, release, cross-platform packaging, README, or course-report work.

### Final automated validation and contract audit

The final test-contract audit confirmed that the historical France `>=18` floor came from the former 56 px default. At the accepted 72 px default and 1440×900, France stabilizes at 14 direct markers with `+21` truthful overflow and repeats with identical semantic/layout identities and coordinates; its accepted range is 10–18. Poland stabilizes at 8 with `+6` overflow inside its 6–12 range. With the filter tray open, France produced 20 / 12 / 7 direct markers at 48 / 72 / 112 px and overflow 15 / 23 / 28, preserving the 35-game total. Belgium aggregation and Japan component-aware multi-island placement remain covered.

The safe-space audit confirmed that densely overlapping Global aggregate dots are not a reliable selector for a test whose contract is post-selection camera framing. The test now uses the product's country directory, waits for explicit camera settled state, preserves every SafeViewport assertion, and does not use forced clicks.

Final accepted verification for the unchanged product/test workspace before documentation-only closeout:

- Earth Playwright: 63/63 passed, 0 skipped, serialized;
- complete project Playwright: 80/80 passed, 0 skipped, serialized;
- Node tests: 56/56 passed;
- lint, TypeScript, optimized build, strict OpenSpec validation, and `git diff --check`: passed;
- README, dependencies, Hub/Chronicle implementation, RAWG/country inference/source data, Atlas, release, packaging, course-report, and backup refs remained out of scope.

### Closeout authorization

- The user explicitly authorized the remaining OpenSpec sync/archive and fast-forward Git closeout in this run after the accepted final validation.
- Phase 3 is complete at 19/19 before archival; Atlas remains deferred and is not represented as delivered.
