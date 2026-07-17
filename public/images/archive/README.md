# Game Chronicle image assets

## `chronicle-reading-room.webp`

- Purpose: shared responsive atmosphere layer for the Contemporary Game Archive annual feature. It is not the complete annual visual by itself.
- Generation: created with Codex built-in image generation, then resized and compressed locally with Sharp.
- Final dimensions: 2400×1600 (3:2).
- Final format and budget: WebP, 139,376 bytes; target budget is no more than 350 KB.
- Composition: a warm archive reading desk with aged paper, blank catalog materials, film/contact-print material, brass tools, and one original unbranded controller-like archival object.
- Crop safety: the controller and primary archive objects sit inside the central 45% of the frame. Desktop and mobile both use a centered `object-position`; live headings and controls remain DOM text outside the bitmap.
- Prohibited content: readable text, numbers, logos, watermarks, identifiable commercial hardware, recognizable game characters, copied posters, and direct imitation of copyrighted game artwork.
- Loading: Next Image serves the annual atmosphere through responsive optimized variants. The source WebP remains 139,376 bytes; a typical 1366px archive workspace requests a much smaller optimized display variant.
- Failure behavior: `GameArchiveView` removes the failed image and retains the same geometry using its warm paper, oxblood, and halftone CSS fallback.
- Annual differentiation: `archiveModel` selects the representative plus the next two rating-priority games for every 2010–2026 year. `GameArchiveView` layers those untouched covers over this shared image in one of four deterministic DOM compositions. Each year exposes a unique cover-ID signature; year and game names remain live DOM text. This option avoids 17 separately generated AI images and keeps one coherent visual language.
- Crop safety: annual cover layers remain inside the center-safe region on desktop and mobile. If the atmosphere image fails, the same-size CSS paper/print surface remains; if a cover fails, `ArchiveCover` replaces it with the branded archive placeholder without a broken-image icon.
- Cover performance: `ArchiveCover` uses Next Image with fixed 480×720 intrinsic geometry, explicit responsive `sizes`, quality 68, skeleton state, and a stable fallback. The collection mounts eight records per batch; the first eight use eager/high fetch priority without creating route-change preload links, and later batches are appended by an IntersectionObserver or the accessible load-more control. Year intent prefetches at most three 256px optimized covers.
- Cover cache: all 992 catalog IDs already have an existing `public/covers/rawg/<id>.webp` produced by the project's cover cache/compression workflow. Archive UI resolves this existing cache by ID and lets Next Image create display-size variants instead of requesting remote RAWG originals. Original catalog fields and the RAWG data pipeline are unchanged.

Generation prompt summary:

> Original premium editorial photograph of a retro game-culture archive reading desk, warm side light, aged paper, blank contact sheets, film, brass, and an original unbranded controller silhouette; centered 3:2 composition; no text, logo, watermark, real character, recognizable poster, or branded hardware.

The original generated PNG remains outside the project under the Codex generated-image directory. Only the compressed project WebP is used at runtime.
