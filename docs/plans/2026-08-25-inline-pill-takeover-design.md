# Inline Pill Takeover

## Reference

Recreate the full typography beat shown from 00:08.000 to 00:09.000 in
`LtDRmo2bVZySoIKZ.mp4`. The component is text-only: the reference icon and
background remain outside its scope.

## Motion

The initial line reads `powering 20% — of the Internet.`. A short white pill
occupies the dash position. Over the first 18 frames, the pill expands from the
center to reveal `Start building`, physically pushing the left and right text
apart. The pill text is already laid out at full width and is exposed through
the pill's overflow clip rather than typed.

Starting on frame 2, the surrounding text gains blur and fades away, reaching
zero opacity with the pill expansion on frame 18. The pill then holds briefly.
On frame 21 it begins a takeover push-in: a fast scale from 1 to about 1.9 by
frame 24, followed by a slower settle to 2.15 on frame 30.

## Component

The registry item is named `inline-pill-takeover` and exports
`InlinePillTakeover` plus its props interface. A centered flex row owns three
siblings: `before`, the clipped pill, and `after`. Animating the pill's explicit
width lets flex layout displace the surrounding text without brittle absolute
positions.

The public API covers the three strings, typography and pill colors, expansion
and takeover timing, takeover scale, outer-text blur, playback speed, and a
root class name. Defaults reproduce the reference copy.

## Integration

Add the component source and preview config, register it in the remocn
registry and preview index, add its typography documentation and navigation
entry, include it in the branch changelog, then regenerate the preview
manifest and shadcn registry artifacts.

## Verification

Run typecheck, focused lint, metadata and customizer tests, then render frames
0, 6, 12, 18, 21, 24, and 30. The pill must reveal from its center, move both
outer text spans through layout, fully replace their visual focus by frame 18,
and perform the measured two-stage takeover without painting a background or
icon.
