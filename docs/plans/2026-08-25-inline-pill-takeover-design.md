# Inline Pill Takeover

## Reference

Recreate the full typography beat shown from 00:08.000 to 00:09.000 in
`LtDRmo2bVZySoIKZ.mp4`. The component is text-only: the reference icon and
background remain outside its scope.

## Motion

The initial line reads `powering 20% — of the Internet.`. A short white pill
occupies the dash position. Over the first 12 frames, explicit width and height
values expand the pill background outward from its center, exposing `Start
building` and physically pushing the left and right text apart. No transform is
applied to this reveal, so the text keeps a fixed local font size. It becomes
visible through a hard opacity switch and remains clipped by the growing pill
until enough background has opened around it.

Starting on frame 2, the surrounding text gains blur and fades away, reaching
zero opacity on frame 18 while the pill background keeps expanding. An
independent camera wrapper starts moving on frame 12: it grows from scale 1 to
1.25 through frame 23, cuts on frame 24 to 86% of the final close-up scale,
then eases from 86% to 100% by frame 30. At the same moment the width reveal
finishes, a second local pill animation begins. Through frame 36 it grows the
background width from scale 1 to 1.08 and its height independently from 1 to
1.16 while the text keeps its local font size. Separate width and height
controls keep the vertical expansion visible without making the CTA too wide.
The pill therefore grows toward the approaching camera and continues moving
after the camera settles. The discontinuity is intentional: it should read as
an impact too fast for the viewer to perceive as a continuous zoom.

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
