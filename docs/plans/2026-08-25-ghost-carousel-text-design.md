# Ghost Carousel Text

## Reference

Recreate the typography beat around 00:20.000 through 00:22.200 in
`XSHgA_pUBKpD4PXG.mp4`. The default copy follows the reference: a bright
monospace statement with `delivering` highlighted in green and a dim second
line that reads like reflected or predicted continuation text.

## Motion

The complete beat begins slightly before the requested range. Frames 0–25
reveal each line from left to right while its leading edge stays near the
center, making the growing line expand outward without fading. Frames 26–67
hold the readable copy with a restrained leftward drift.

At frame 68 the text begins its carousel exit. The block accelerates left,
recedes slightly on the z-axis, and turns only enough to suggest depth without
visibly compressing the glyphs. A moving horizontal mask removes the right
side while the fixed left feather catches the leading characters. The accent
is gone near frame 73 and the remaining central text clears by frame 80.

The dim line is not a vertically flipped duplicate. It is a separate string in
normal reading orientation at roughly fifteen percent opacity, aligned beneath
the main statement with the same reveal and exit geometry.

## Component

The registry item is named `ghost-carousel-text` and exports
`GhostCarouselText` plus its props interface. Content is provided through
`text`, `accent`, and `ghostText`; the accent is highlighted wherever its first
exact match occurs in the main line.

Public controls cover reveal, exit timing, ghost opacity, exit travel, depth,
turn, typography, colors, playback speed, and root class name. The component
paints no background. Its preview uses `#101010` to match the source.

## Integration

Add the source and customizer config, register it in the remocn registry and
preview index, add typography documentation and navigation, extend the SaaS
typography changelog, then regenerate the preview manifest and registry
artifacts.

## Verification

Run focused Biome checks, TypeScript, customizer and documentation tests. Render
an 81-frame 1280x720 preview at 30 fps and inspect the first reveal, the
two-line hold, the first exit frame, the accent cutoff, and the final clear.
The reveal must not animate opacity, the ghost line must remain upright, and
the glyph height must stay visually stable until the exit mask reaches it.
