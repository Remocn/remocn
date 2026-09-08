# fomo Limit Orders — reference reconstruction

The user's requested design is the supplied `heGPf4RW1YSlg8I5.mp4` itself.
Create a new template; retain the separate introducing-product work.

Source picture: 480×270, 60 fps, 1,219 frames (20.3167 seconds).
Reconstruction master: 1920×1080, 60 fps, 1,219 frames.

Recreate the text, UI, colors, camera movement, slider-to-caret morph, foreshortened
order control, filled-order confirmation, and wordmark as editable React/SVG.
Do not substitute a playback of the source video for reconstructed scenes.

Use a 480×270 design coordinate system scaled to the composition, measured
camera keyframes, and frame-derived motion. Keep content and theme defaults in
one file. The original source audio accompanies the local comparison export;
the distributable component accepts a replaceable audioSrc.

1. Sample every scene and determine transition boundaries at native frame rate.
2. Reconstruct the interface, typography, and geometric lighting as source.
3. Match motion and timing, using the measured fomo contraction curve.
4. Register a separate template, documentation page, Studio entry, and render.
5. Compare source/reconstruction frames at matching timestamps, correct visible
   discrepancies, render MP4, validate types, metadata, installation, and timing.

Exact authoring assets and fonts are not available in the encoded reference.
Any residual reconstruction differences should be reported honestly.

## Delivered and verified

- Standalone registry item: `fomo-limit-orders`, 11 source files, seven shots.
- Export: `out/fomo-limit-orders.mp4`, H.264 1920×1080, 60 fps, 1219 picture frames; AAC soundtrack extracted from the supplied reference. Audio container padding gives 20.373 seconds versus 20.317 seconds of picture.
- Compared matching timestamps and boundary frames in `out/fomo-review/`; fixed phone camera scale, slider figures and layout, caret continuity, and the runway camera target.
- Production Next.js build passed. Component lint passed. 17 timing, import-graph, and documentation checks passed.
- Installed all 11 files through the built shadcn registry into a separate consumer project. TypeScript passed with ES2020 after replacing `String.replaceAll` with a compatible regular-expression replacement.
- Reference typography, glass shading, and projected 3D control geometry remain approximations; original design assets were not present in the supplied compressed MP4.
