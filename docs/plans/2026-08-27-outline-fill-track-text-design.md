# Outline Fill Track Text

## Reference

Recreate the typography transition from 00:28.333 through 00:30.800 in
`vVYqitqLt1Y2dgKy.mp4`. The source is 480x270 at 30 fps. The default copy is
`Keep 100%`, and the standalone component ends on the large, completely filled
`100%`. It does not include the following cut to the small sentence.

## Measurements

The lead word first becomes readable at approximately 00:28.400 and finishes
its rise at 00:28.933. Its visible baseline travels about 90 source pixels
upward while a broad violet-black field clears the glyphs. At the 1280x720
registry size, the default entrance offset is therefore 240 pixels.

The continuous horizontal move starts near 00:28.933. `Keep` crosses the left
edge while `100%` enters from the right at approximately 00:29.500. The track
decelerates until the value is centered at approximately 00:30.700. The source
glyphs occupy about 135 pixels vertically, which maps to a 368-pixel default
font size after matching Arial's cap height. Both the lead and value visual
centers sit about 32 source pixels left of the frame center, represented by an
84-pixel registry anchor offset.

The value first appears as a roughly one-source-pixel outline, represented by
a 3-pixel stroke at registry resolution. A white fill advances from the left
edge of `1` through both zeroes, the upper dot, the slash, and finally the lower
dot. The fill is readable from approximately 00:29.500 and completes near
00:30.750. The background is the same near-black violet as the surrounding
scene, represented by `#030012`; the fill is a cool white, represented by
`#f4f3f6`.

## Motion

The component has an 80-frame natural length at 30 fps. Frames 0-16 lift and
uncover `Keep`. Frames 16-24 move so slowly that they read as a short lead-word
hold, while the complete horizontal track travel runs from frames 16-72. The
value remains hidden until a hard reveal on frame 34. Its fill mask starts ten
frames earlier, so the `1` is already gaining weight at the cut, then the
visible fill continues through frame 72. The glyph opacity remains constant.
Frames 72-79 hold the filled value at its final anchor.

`Keep` and `100%` share one no-wrap track so their spacing and velocity cannot
diverge. The value is rendered twice at the same coordinates: an outlined base
remains visible for the whole travel, while a filled duplicate is exposed by a
left-to-right mask. This reproduces the sequential fill of the percent sign
without animating individual glyphs.

The final track travel is responsive to the measured value width. Values that
fit the composition stop on the reference anchor. If a value is wider than the
available frame, its right-side overflow is added to the travel so the camera
reaches the trailing glyphs and leaves them at a configurable end padding. The
track follows a symmetric ease-in-out curve with a visible acceleration from
rest and deceleration into the final hold.

The entrance uses a vertical mask plus a large radial violet-black field. The
field is separate from the text and soft in both axes, avoiding a rectangular
occluder. The lead word does not fade or scale.

## Component

The registry item is named `outline-fill-track-text` and exports
`OutlineFillTrackText`, `OutlineFillTrackTextProps`, and
`outlineFillTrackTextLength`. Public controls cover both text values,
typography, fill and outline colors, outline width, background and glow colors,
entrance offset, shared horizontal anchor, track travel, word gap, long-value
end padding, fill duration, playback speed, and the root class name.

The default implementation uses Arial/Helvetica to match the measured wide
geometric sans closely while remaining dependency-free. Empty strings remain
valid: an empty lead skips its visible glyphs, and an empty value leaves only
the background after the track move.

## Integration

Add the component and customizer config, register it in the preview index and
remocn registry, add the typography documentation and navigation entry, update
the SaaS typography changelog, then regenerate the preview manifest and
registry artifacts.

## Verification

Run focused Biome checks, TypeScript, customizer and docs metadata tests, and a
production build. Render the 80-frame 1280x720 composition at 30 fps and inspect
frames 0, 8, 16, 24, 34, 44, 56, 68, 72, and 79. The lead word must rise without
an opacity change, both words must follow the same horizontal transform, the
outline must remain visible ahead of the fill boundary, and the last frames
must hold a completely filled `100%` at the measured left-shifted anchor.
