# Release Teaser validation

Completed 2026-09-10 for the approved fictional Orvio 2 identity.

## Deliverable

- Registry item: `release-teaser`; component: `ReleaseTeaser`.
- 1920 × 1080, 960 frames at 60000/1001 fps, exactly 16.016 seconds.
- Eight installable source files, no third-party runtime beyond Remotion and Fontsource Inter; registry artifact 28,795 bytes.
- Original beveled open-ring geometry, graphite/ice-blue lighting, five new English statements, original foreground mark and closing title. No source footage, source logo, source-brand text, or source soundtrack ships.
- Brand, release, tagline, five statements, theme, lighting, optional logo/audio, and reduced motion are configurable. Each chapter has its own explicit Studio sequence.
- Live Studio left open at `http://localhost:4005/ReleaseTeaser`, paused at frame 790.

## Checks

- `bun test registry/remocn-templates lib/docs-meta.test.ts lib/docs-tabs.test.ts lib/customizer-config.test.ts registry/remocn/typed-split-wipe`: **81 tests passed**, 12 files, 29,577 assertions.
- New template: 14 tests covering picture-clock duration, sequence coverage at multiple frame rates, explicit Studio tracks, matrix equivalence, normalization, Unicode, content fitting, focus transitions, deterministic seeking, reduced motion, geometry, projection, contrast, and installable dependency closure.
- `bun run typecheck`: passed.
- `bun run lint`: no errors; pre-existing unused suppression in `app/globals.css:316`. Pre-existing large Product Showcase files produce informational size notices.
- `bun run registry:build` and `bun run manifest:build`: passed, 300 preview entries. All eight serialized template files exactly match their source files.
- `bun run build`: passed, 770 generated pages. Pre-existing dynamic-filesystem tracing warning in the OG route remains unrelated and unchanged.
- `git diff --check`: passed.

## Visual and playback checks

`bun run review:release-teaser` rendered 32 representative frames, including all scene boundaries, first/last frames, camera reveal, lighting fade, and text focus transitions. Eight additional frames cover a warm alternate brand with long copy, Ukrainian, emoji and reduced motion, plus a custom SVG logo replacing both the background and foreground mark. Two repeated out-of-order seeks reproduce the exact PNG hashes:

- Frame 60: `23988703934a69880cee855c839f21a5e24bcf39a6c8dfa366540706002bce0c`
- Frame 790: `34dd5ab985f8f2e64b149b89d98ee147691ac7d58366cf9d8028dc1bbc5b51fb`

Reviewed `out/release-teaser/overview.jpg`, `custom-overview.jpg`, individual final/title frames, custom-logo frame, and the live Studio screenshot at frame 790. Continuous normals and per-strip gradient shading remove visible tessellation; a cached rotation matrix and 96-segment mesh reduce per-frame work. Canvas color channels are cached, avoiding per-frame pixel readback.

The final Studio playback check started at 20:48:03 UTC and ran through complete loops: no new console warnings or errors, and the visible playback counter reached 60.0 FPS. Expected hot-reload notices from earlier source edits are excluded from this final playback check. All six named sequences and the closing editable layers were visible in the timeline.

No full MP4 was exported: the user asked for an editable template. `bun run render:release-teaser` is ready for an explicit export request and uses an atomic staging file. Default audio is silent.
