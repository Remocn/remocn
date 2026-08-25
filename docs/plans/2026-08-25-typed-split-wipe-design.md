# Typed Split Wipe

## Reference

Recreate the typography beat from 00:00.000 through approximately 00:02.300
in `XSHgA_pUBKpD4PXG.mp4`. The default copy is `Introducing X Ads MCP`, split
into a prefix, a central anchor, and a suffix so the exit can preserve the
reference's fixed layout and independent wipe directions.

## Motion

Frames 0–29 type the full line without a cursor. Characters become visible in
hard steps and the currently visible substring remains centered while it
grows. Frames 30–49 hold the completed line.

At frame 50, the component switches to a fixed full-line layout so disappearing
letters never cause reflow. `Introducing` clips from right to left. The suffix
is split into words: `Ads` and then `MCP` clip from left to right with a short
stagger. The `X` anchor remains visible longer and exits last. The wipe clips
through glyphs rather than fading or translating whole characters.

## Component

The registry item is named `typed-split-wipe` and exports `TypedSplitWipe`
plus its props interface. Its primary content API is `prefix`, `anchor`, and
`suffix`; defaults produce `Introducing X Ads MCP`. Public controls cover the
typing duration, exit start and duration, suffix-word stagger, typography,
playback speed, and root class name.

The component paints no background. Its preview uses near-black so the warm
white type matches the source footage.

## Integration

Add the component source and customizer config, register it in the remocn
registry and preview index, add typography documentation and navigation, add a
changelog entry, then regenerate the preview manifest and registry artifacts.

## Verification

Run focused Biome checks, TypeScript, customizer and docs metadata tests, then
render a 75-frame 1280×720 preview at 30 fps. Inspect the typed build, full hold,
and frames 50–69 of the exit. The enter must re-center the current substring;
the exit must keep all surviving glyphs in their original positions and show
the measured opposing clip directions.
