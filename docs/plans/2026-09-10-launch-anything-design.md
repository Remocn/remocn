# Launch Anything — reference reconstruction

## Input and intended result

The supplied `v65cbn8n2DVV1tKi.mp4` is a 480×270, 799-frame H.264 video
at 30000/1001 fps, with a mono AAC soundtrack. Picture duration is 26.659967s;
audio runs to 26.726168s. It depicts the Launchanything.now launch film.

Reconstruct its full sequence as an installable, editable remocn template.
Keep the reference's copy and pacing by default. Output: 1920×1080, 60 fps,
1600 frames (26.666667s). The source MP4 is an analysis reference only.

## Measured cut points

| Reference time | Event |
| --- | --- |
| 0.00 | Chrome `Your` on black, left-to-right material reveal |
| ~1.00 | Smaller chrome `product`, followed by a clean white hold |
| ~2.50 | `is ready` over a mirrored twilight lake |
| 3.8038 | Hard cut to white, `Now let’s` |
| ~4.90 | Lateral title travel to a glass `Launch it` button and blue pointer |
| ~5.90 | Button grows into nested rounded glass apertures |
| ~7.33 | Aperture opens into a warm desk and laptop |
| ~8.43 | Shopper/mobile app screen |
| 9.242567 | Black exchange screen |
| 10.343667 | Data-app prompt screen |
| 11.244567 | Black order-entry screen |
| 12.345667 | Purple loyalty mascot and cards |
| 14.014 | Cycling integration names |
| 15.1151 | White field, floating brand marks and trust headline |
| 17.017 | `Any industry` over dark curved rims |
| ~18.58 | `We Launch it all.` |
| 20.2202 | Diagonal rocket and `Launch` |
| 20.6206 | Wide orbit shot, tiny ascending rocket |
| 21.021 | Large Earth shot |
| 21.554867 | Black frame, launch word contracts and types the domain |
| 23.7237 | White frame with triangle/dot logo; gradual scale-down to end |

Cut timestamps were checked with FFmpeg scene detection and quarter-second
frame sheets. `motion.ts` quantizes them to the closest 60-fps frame.

## Implementation

- Nine named Remotion sequences, split into scene files.
- Shader Text Reveal supplies the opening material. Its published API and local
  implementation were read before composition; it is a registry dependency.
- All motion uses the current frame. No CSS animation, wall clock, intervals,
  random calls, reference-video playback, or screen recording.
- A 480×270 design surface scales uniformly into the output composition.
- The desk and display share one transform. Display coordinates on the
  1672×941 generated desk are (647,368)–(1094,659), with the top corners inset.
- Seven independent React/SVG screens are authored on a 640×420 surface.
- Config exposes the opening words, domain, and accent. The Studio root also
  exposes nested copy, image replacements, partner logos, and optional audio.
- The installed template bundles its images as data URIs, following the existing
  template convention, and runs offline apart from user-supplied URLs.
- `--reference-audio` adds the user's original soundtrack only to the local
  review MP4, muxed after the independent picture render. No original audio
  or source video is distributed with the registry.

## Photographic plates and provenance

Four plates were created with the built-in `imagegen` tool using extracted
reference stills as visual references. Generated originals remain in the Codex
generated-images directory. Selected JPEG assets are saved in
`public/templates/launch-anything/`, then embedded by
`bun scripts/build-launch-assets.mts` into the installable `assets.ts`.

The references specify composition and lighting; their tiny, compressed images
are not used as final plates. The recreated photos, fine interface content,
partner glyphs, and Manrope typography approximate the reference's unavailable
production assets. Logo URLs, screen images, and background plates are replaceable.

### Final prompt set (built-in generation)

**Desk — `desk.jpg`:** Reconstruct the low-resolution reference as a sharp,
realistic 1920×1080 16:9 photograph. Match the wide front view, warm peach plaster
wall, large diagonal afternoon sunlight from top right, oak desk across bottom
25%, centered silver laptop, ceramic plant pot on left, white cylindrical speaker
just right, white cup farther right, books left, window blinds and plant shadows.
Laptop screen must be completely blank near-white, directly facing the camera,
with corners approximately (39%,39%), (65%,39%), (65%,70%), (39%,70%). Preserve
the reference proportions and framing; remove screen content. No added text,
logos, objects, or captions. One landscape photograph.

**Horizon — `horizon.jpg`:** Reconstruct the background in high resolution,
1920×1080. Remove all text. Mirror-calm lake at twilight, low flat black distant
shoreline at 52% height, narrow amber sunset band and reflection in the center,
fading upward into midnight blue sky and downward into navy still water. Keep
the minimal symmetrical composition. No mountains, foreground objects, bright
stars, sun disk, captions, or logos.

**Rocket — `rocket.jpg`:** One sharp photorealistic white orbital rocket flying
diagonally toward the upper right. Remove all text. Slender body with black stage
bands, nose at (63%,20%), tail at (47%,53%), long white-hot exhaust with pale
pink/orange fringes stretching toward (25%,95%). Deep navy background #081424
with a subtle local blue cast. Landscape 1920×1080. No logos, planets, stars,
letters, or additional spacecraft.

**Earth — `earth.jpg`:** Recreate the orbital Earth reference in sharp high
resolution; remove all text. Dark oceans, detailed white cloud swirls, thin
electric-blue atmosphere on the right rim, very dark left hemisphere with tiny
city lights. Center at 43% width and 50% height; diameter 110% of image height,
slightly cropped at top and bottom, right edge at 78% width. Pure black space.
Match illumination and composition. Landscape 1920×1080, no labels, wordmarks,
added starfield, sun, lens flare, or interface.

## Verification

- Render representative frames from every scene and at seven display changes.
- Check fit and crop at 1080p, including edited copy and a different accent.
- Compare source and reconstruction contact sheets, then render the full film
  with the local reference soundtrack for motion review.
- Verify timeline coverage, camera values, prop fallbacks, local import closure,
  registry packaging, docs metadata, type checking, and changed-file lint.
- Rebuild preview manifest and registry artifacts; keep the source MP4, analysis
  stills, review sheets, and rendered MP4 under ignored/local paths.

### Completed checks

- `bun run typecheck` passed.
- The template tests plus docs metadata, customizer configuration, and docs tabs
  tests passed: 30 tests, 0 failures, 3223 assertions.
- `bun run build` passed, including the new statically generated template page.
- `bun run lint` passed with only an existing unused suppression warning in
  `app/globals.css`.
- Preview manifest and registry builds passed. The final installable item contains
  all 14 source modules, four embedded images, the Manrope package dependency,
  and the `@remocn/shader-text-reveal` registry dependency.
- Representative stills and alternate copy/accent rendered successfully with
  software WebGL (`swangle`). Live Studio scrubbing was checked at the chrome
  introduction and the laptop showcase.
- The full MP4 rendered successfully: H.264, 1920×1080, 60 fps, 1600 frames,
  26.666667 seconds, 14,254,889 bytes. The local AAC soundtrack is mono 44.1 kHz
  and runs for 26.666009 seconds. An aligned decoded-audio subtraction against
  the reference measured a -51.9 dBFS mean residual after AAC recompression.
- The final film contact sheet was visually reviewed against the reference.
  `out/launch-anything.mp4` is the deliverable. For direct comparison,
  `out/launch-anything-comparison.mp4` places the original on the left and the
  recreation on the right with the same soundtrack and timeline.
