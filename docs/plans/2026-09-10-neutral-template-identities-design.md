# Independent template identities

## Approved direction

The user approved replacing the recognizable reference brands in three existing
templates with independent neutral product demos. Keep the current edit rhythm,
animation mechanisms, durations, and existing import paths working. Update the
catalog titles, default content, pictures, logos, colors, documentation, generated
registry payloads, and local previews. Do not distribute reference soundtracks.

| Existing import / registry ID | Catalog identity | Direction |
| --- | --- | --- |
| fomo-limit-orders | Order Flow | Graphite / amber trading simulator, fictional DEMO asset, original stepped mark, fresh order copy and coherent sample figures. |
| x-ads-mcp | Workflow Console | Navy / ice-blue release automation, environments and topology symbols instead of countries, fresh tool logs and throughput chart, original connected-node mark. |
| launch-anything | Product Showcase | Cream / forest-green product studio, original workbench and architectural still-life imagery, fictional project interfaces, geometric marks, no customer endorsement claims. |

Catalog names and recommended exports become neutral. Existing registry IDs,
component exports, media slots, and legacy props remain compatible. New environment
props are preferred in Workflow Console; explicit legacy country props continue to
work. Historical reference-analysis plans remain historical records, not product
copy or default template assets.

## Content and assets

- All on-screen copy remains English and comes from editable content objects where
  useful. No SpaceX, Fomo, X, Grok, Launchanything.now, alo, Slack, Amplitude, HubSpot,
  cryptocurrency marks, recognizable mascot copies, or existing customer logos in
  the default pictures.
- SVG logos are authored in code. Imagegen creates four independent photographic
  plates for Product Showcase; no source-frame references are supplied. Store the
  images in `public/templates/product-showcase/`, then bundle them using the existing
  data-URI registry convention. Preserve the old media prop keys as compatibility
  slots, while documenting their new contents.
- Retain existing fonts. Use semantic palette values in the established hex format
  rather than introducing a second color notation. Verify foreground/background
  contrast and inspect composited frames.
- New previews are silent by default. User-supplied audio remains optional.

## Implementation plan

- [x] Replace Order Flow copy, sample figures, default wordmark, asset symbol, palette,
      Studio defaults, and catalog metadata.
- [x] Replace Workflow Console story, tool rows, logo, palette, environment carousel,
      graph copy, Studio defaults, and catalog metadata; preserve legacy props.
- [x] Generate and inspect four new Product Showcase plates. Replace its copy, sample
      screens, proof grid, mascot, logo, orbital imagery, and palette.
- [x] Update docs and changelog, add neutral named exports, rebuild asset bundles,
      registry payloads, and preview manifest.
- [x] Add regression checks for default brand removal and API compatibility; run
      targeted tests, typecheck, lint, and production build.
- [x] Review varied/default props and key frames; export all three local MP4 previews
      and verify their streams and duration.

`writing-plans` is not installed. This approved document contains the local design
and execution checklist. Only this plan is committed before implementation; ongoing
template changes from the preceding task are preserved.

## Verification

- Targeted template, customization, docs, and Unicode tests: 56 passed, 12,762 assertions.
- TypeScript and the production Next.js build pass (764 pages).
- Lint has no errors; the pre-existing unused CSS suppression warning remains. Biome skips the two generated photographic payloads above its 1 MiB default limit.
- The 38 shipped files across the three registry payloads exactly match their source files. The preview manifest has been rebuilt.
- Default scenes were reviewed in contact sheets; override handling and legacy API compatibility are covered by tests. The running XAdsMcp Studio route shows Workflow Console after hot reload.
- Final H.264 videos decode completely without errors: `out/order-flow.mp4` (1108 frames), `out/workflow-console.mp4` (2810 frames), and `out/product-showcase.mp4` (1600 frames), all 1920×1080 at 60 fps. Defaults are silent; no reference soundtrack was used.
- New independent render scripts use ANGLE; `--software` selects the slower software fallback. New exports are staged before replacing the final file.
- Original photo prompts and saved paths: `docs/plans/2026-09-10-product-showcase-assets.md`.
