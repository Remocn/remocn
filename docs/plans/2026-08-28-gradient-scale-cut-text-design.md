# Gradient Scale Cut Text

## Reference

Recreate the typography cycle around 00:12.900 through 00:14.000 in
`ykwRvJLcuCvNzUAV.mp4`. The source is 480x270 at 30 fps and the default copy is
`Introducing`. The component includes the oversized reveal, the hard scale cut,
the compact settling move, and a short final hold. The following CodeRabbit logo
scene is outside the component.

## Measurements

The oversized phase occupies source frames 00:12.900 through 00:13.300. Its
visible glyph height remains approximately 140 pixels while the line moves
about 150 source pixels left. The full text extends beyond the right edge, and
a soft reveal boundary exposes progressively more letters. At the 1280x720
registry size, the matching defaults are a 520-pixel giant font and 400 pixels
of horizontal travel.

The scale cut occurs between adjacent source frames at 00:13.300 and
00:13.333. The visible glyph height changes from roughly 141 pixels to 37
pixels without an interpolated intermediate size. The compact layer begins
near source center x=295 and settles near x=235, a leftward move of about 60
source pixels or 160 registry pixels. Its visible width grows from about 174 to
233 source pixels while a broad blur clears, then resolves to a final line
roughly 200 pixels wide. A 112-pixel registry font with a 0.87 horizontal scale
closely matches the settled height and width.

The fill is a fixed horizontal text gradient rather than a moving highlight.
Its left edge is a saturated orange near `#f04a14`, it transitions through a
warm peach, and the right portion resolves to a cool white near `#f3f1f1`. A
soft left-to-right mask exposes that gradient over a near-black red ghost layer.
The background is black.

## Motion

The component has a 36-frame natural length at 30 fps. Frames 0-12 show the
giant layer and translate it left while the shared reveal advances. Frame 13
switches visibility to the compact layer with no scale interpolation. Frames
13-21 move that layer most of the 160 pixels left, grow it to a measured 1.18
overshoot, and reduce its blur to zero. Frames 21-33 return it to its final scale
while completing the remaining 24 pixels of travel. The reveal continues
through frame 33, and frames 34-35 hold the completed line.

Position and scale use separate progress curves after the cut. The compact line
holds its starting x position for the first two frames, makes the dominant
leftward snap on the following frame, then eases through the remainder. Scale
and blur remain continuous across that positional snap.

The two phases are separate, overlapping DOM layers. They share text,
typography colors, and one deterministic reveal-progress value, but each owns
its position, scale, blur, and font size. This avoids transform-origin drift at
the cut and guarantees that no intermediate scale can appear. Text opacity
remains constant; visibility changes as a discrete frame condition.

The gradient fill is duplicated over a persistent ghost layer and clipped by
a soft mask. The mask boundary advances across the complete measured text box,
so alternate copy remains supported without per-character timing.

## Component

The registry item is named `gradient-scale-cut-text` and exports
`GradientScaleCutText`, `GradientScaleCutTextProps`, and
`gradientScaleCutTextLength`. Public controls cover the text, giant and compact
font sizes, final horizontal anchor, both travel distances, cut frame, reveal
softness, compact blur, ghost and background colors, gradient start and end
colors, font weight, playback speed, and root class name.

## Integration

Add the component and customizer config, register it in the preview index and
remocn registry, add a typography documentation page and navigation entry,
update the SaaS typography changelog, then regenerate the preview manifest and
registry artifacts.

## Verification

Run focused Biome checks, TypeScript, customizer and docs metadata tests, and a
production build. Render the 36-frame 1280x720 composition and inspect frames
0, 4, 8, 12, 13, 14, 17, 21, 28, 33, and 35. Frame 12 must contain only the
giant layer and frame 13 only the compact layer. The mask must continue across
the cut, the compact text must clear its blur while moving left, and the last
two frames must hold the fully revealed gradient line without opacity changes.
