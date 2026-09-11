# Brand Guidelines validation

## Automated and visual checks

- 67 tests across the template suite, docs metadata/navigation, customizer schemas, and Unicode typing passed. The new template contributes 11 tests / 8,385 assertions.
- TypeScript passed. The production Next.js build generated 767 pages successfully.
- All 10 installable files matched their generated registry payload. The preview manifest contains 299 entries.
- Inspected 36 representative reference-clock frames, including cuts at 117/118 and 805/806, palette/type overlap, the deletion phase, all type styles, collage travel, and closing tiles/mark.
- Inspected six alternate-brand samples with a long opening line, a long type specimen, Ukrainian characters, custom closing words, a different accent, and reduced motion. Text remained in frame.
- Default WCAG contrast ratios: paper/ink 13.94:1, paper/accent 5.06:1, ink/stone 10.16:1.
- Original generated PNGs were retained; only JPEG encoding was applied for bundled assets. No source-video frames, logos, fonts, or audio were shipped.

## Studio regression and workaround

Live playback in Remotion 4.0.513 produced React's `Maximum update depth exceeded` warning inside the collage, despite headless frame rendering passing. The warning was reproduced on multiple playback loops, with tagged traces localizing it to frames 689–798 and the Studio player's frame-update callback.

Narrowing checks:

- Empty scene: clean over repeated playback.
- One static Remotion `Img`: clean.
- Five static `Img` instances from one mapped call site: clean.
- Full moving collage: warnings recur.
- Removing repeated text interactivity, changing the camera wrapper, hiding the collage's generated child tracks, or memoizing static content did not independently resolve the warning. Unhelpful removals/hiding were reverted.
- Native images only in Studio's interactive preview avoid the observed nested-media registration loop. `BrandImage` retains `Img` for rendering and embedded Players; no asset changes or library upgrade are needed. This is a local compatibility workaround, not a claim to have fixed Remotion itself.

The warning depends on the live Studio scheduler and its media registration, so a shallow unit test would not exercise the failure. Browser regression procedure: open `/BrandGuidelines`, seek to 710, start playback, allow at least two full loops, and assert that new console errors contain no `Maximum update depth` messages. Repeat after changing a photo/brand override. The headless review command covers export rendering separately.

Temporary empty/image-only scenes and console instrumentation were removed. Review outputs are under `out/brand-guidelines/`; the generated asset prompts are in the adjacent asset-provenance document.

Final clean Studio check: with the ordinary child tracks restored and all diagnostic code removed, playback from frame 710 continued for multiple complete loops with zero new console errors. The final native-image Studio view was visually checked against the headless collage sample. The 42-frame review, TypeScript, the 67-test suite, registry/source parity and the production build were rerun after the compatibility change.

Pre-existing warnings remain outside this task: an unused suppression in `app/globals.css`, oversized generated Product Showcase assets skipped by Biome, and broad filesystem tracing in the docs OG-image route.
