# Shadow Sweep Text

## Reference

Recreate the full typography cycle beginning at 00:05.000 in
`vVYqitqLt1Y2dgKy.mp4`. The source is 480x270 at 30 fps and the default copy is
`are abandoned`. The component includes the reveal, its brief fully visible
hold, and the returning shadow that removes the line.

## Measurements

The first readable text appears at 00:05.033. The incoming occluder's soft
edge clears the complete line between 00:05.733 and 00:05.800. The line remains
fully readable for roughly three frames before the exit occluder starts at
00:05.900. The last readable pixels disappear at 00:06.233.

During the complete cycle, the line eases from below and slightly right toward
its resting position. Comparing the same `are` glyphs once they are readable
gives approximately -6 source pixels horizontally and -36 source pixels
vertically. At the 1280x720 registry canvas this is a default travel of 16
pixels left and 96 pixels up. The source glyphs are about
30 pixels tall. Matching the measured 256-pixel line width against Arial Bold
metrics gives a 36-pixel source CSS size, corresponding to a 96-pixel default
font size in the registry.

The sampled background is a near-black violet, represented by `#030012`. The
occluder is darker at `#000008`; its compressed soft transition measures about
45 to 55 source pixels, or approximately 130 pixels at registry resolution.
The text is a cool gray represented by `#aaa6b5`.

## Motion

The component has a 37-frame natural length. Frames 0-23 move the first dark
occluder to the right, exposing the text from left to right. Frames 24-26 form
the short readable hold. Frames 27-36 move a second dark occluder from the left
across the line, covering it in the same direction. The text itself never
changes opacity.

Text coverage and the visible shadow are separate layers. A directional mask
controls which glyph pixels are readable during the enter and exit, while an
independent Gaussian field travels over the mask boundary. The field is built
from a radial gradient that fades horizontally and vertically, so it has no
rectangular body or concrete contour. This keeps the shadow dense over the
letters without exposing the geometry of the DOM element that carries it.

The text's diagonal movement runs across the full cycle with a strong ease-out:
it starts 16 pixels right and 96 pixels below its final position, then moves
up and left without a scale or blur animation.

## Component

The registry item is named `shadow-sweep-text` and exports `ShadowSweepText`
plus its props interface. Public controls cover the copy, typography,
background and shadow colors, shadow softness, vertical rise, horizontal drift,
playback speed, and root class name. Defaults reproduce the measured reference.

Unlike most typography components, this component paints its own background
because the dark field and darker physical occluders are inseparable parts of
the effect.

## Integration

Add the component source and customizer config, register it in the remocn
registry and preview index, add typography documentation and navigation, add a
changelog entry, then regenerate the preview manifest and registry artifacts.

## Verification

Run focused Biome checks, TypeScript, customizer and docs metadata tests, then
render a 37-frame 1280x720 preview at 30 fps. Inspect frames 0, 1, 8, 16, 23,
26, 27, 31, 35, and 36. The text must remain at constant element opacity,
travel up and left, become fully readable for only a short hold, and disappear
under the returning shadow. A pixel-gradient check on the covered frame must
not find a hard horizontal or vertical rectangle edge around the Gaussian
field.
