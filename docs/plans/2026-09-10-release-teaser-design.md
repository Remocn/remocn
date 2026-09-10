# Release Teaser — Orvio 2

## Approved direction

The user approved a new `release-teaser` template on 2026-09-10: retain the reference's full sixteen-second rhythm, replace its identity with fictional Orvio 2, an original dimensional open-ring mark, graphite and ice-blue lighting, and original English copy. This is a reusable Remotion template, not a flattened edit of the source movie.

Reference: `/Users/dev_wandry/Downloads/mi9mwKtAjPQuPHrW (1).mp4`. Picture: 480 frames at 30000/1001 fps, 16.016 seconds; container/audio: 16.064 seconds. Preserve the picture timing at 60000/1001 fps, 960 frames, 1920 × 1080. The extra audio padding is not part of the visual story.

## Visual and motion system

Five centered statements resolve softly from the middle outward, hold, then disappear into darkness. A close-up of a beveled open ring turns slowly beneath them, its edges revealed by moving light. Around 10.2 seconds the camera pulls back to disclose the complete original mark behind the final title. The background returns to darkness while the title holds through the last frame.

Copy: “Start with an idea”; “Make room\nfor better work”; “Bring every detail to life”; “Move together.\nGo further.”; “A fresh chapter.\nNo starting over.” Final title: “Orvio 2”; supporting line: “Your next chapter starts here.”

Palette: nearly black #050709, graphite #151C22, soft white #F2F5F7, ice-blue #9BC8DD. Inter 500/600 for the quiet centered typography. No inherited names, logos, numeric emblem, footage, music, or claims.

Considered alternatives: strict monochrome would stay closer to the reference; the approved blue edge lighting makes the new identity more distinct without changing the mood. A raster/3D video background would lock the lighting and camera; procedural projected geometry keeps both deterministic and editable without adding a heavyweight 3D dependency.

## Architecture and content contract

Self-contained files in `registry/remocn-templates/release-teaser/`: root/config, content defaults/resolver, timing/math, procedural mark geometry, background renderer, statement scene, closing scene, and UI helpers. Timeline-driven drawing only; no wall-clock animation or random state. All five copy slots, brand name, release, closing line, theme, custom logo, lighting intensity, and reduced motion are configurable. Default audio is silent; an optional user-owned `audioSrc` is supported.

Native SVG is used for the original foreground mark; the background is a deterministically projected and lit beveled ring. A custom `logoSrc` replaces both foreground and background with a flat custom-logo treatment rather than pretending an arbitrary bitmap is a 3D model. Empty text slots fall back independently; Unicode-safe character reveals and line fitting keep alternate content intact. Reduced motion removes camera travel, rotation, character staggering, and blur.

## Implementation checklist

- [x] Inspect repository, reference contact sheets, and complete scene order.
- [x] Present alternatives and secure user approval.
- [x] Record the approved design. The unavailable writing-plans skill is replaced by this local checklist.
- [ ] Build deterministic timing, content resolution, and geometry helpers.
- [ ] Build the procedural background, five editable statements, and release lockup.
- [ ] Add registry entry, preview config, Studio root/controls, docs, changelog, and review script.
- [ ] Test boundaries, Unicode, alternate props, geometry, reduced motion, and package closure.
- [ ] Rebuild registry and manifest; run typecheck, lint, relevant tests, and production build.
- [ ] Review representative frames and alternate identity; verify live Studio playback and leave it open.

No full MP4 export is requested. Validation renders are still frames; an explicit render command will be available for later use.
