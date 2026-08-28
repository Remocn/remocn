# Centered Word Build

## Reference

Recreate the typography animation shown from 00:04.000 to 00:06.000 in
`LtDRmo2bVZySoIKZ.mp4`. The component is text-only: the reference icon and
background are not part of it.

## Motion

The phrase is built as a centered visible prefix. Each new word appears on a
hard cut at full opacity, starting `0.18em` below the baseline and settling
upward over nine frames. In the same frame, the full visible prefix recenters
and begins a cumulative camera push-in. The whole line scales by another 3.5%
over those nine frames and holds that closer scale until the next word. For the
default four-word phrase, the measured reveal frames at 30 fps are 0, 11, 22,
and 30. The resulting line scales are 1, 1.035, 1.07, and 1.105.

After the completed phrase holds, a soft opacity mask crosses the text from
left to right. The measured exit begins on frame 51 and finishes on frame 63.
The component remains transparent throughout.

## Component

The registry item is named `centered-word-build` and exports
`CenteredWordBuild`, its props interface, and a length helper. The public props
cover text styling, accelerating word cadence, word rise, cumulative zoom,
settle duration, exit timing, playback speed, and a text class name. Defaults
reproduce `everything we learn from`.

The reveal clock establishes two even beats before it accelerates: `wordGap`
defines those first two intervals and `accel` multiplies every interval after
them. Defaults of `wordGap={11}` and `accel={0.75}` yield reveal frames 0, 11,
22, and 30 after rounding, matching the reference while remaining useful for
phrases with more words.

`rise`, `zoomStep`, and `settleFrames` form one synchronized gesture. Only the
new word translates upward; the scale applies to the whole visible phrase and
is never reset. Opacity is intentionally not animated.

## Integration

Add the component source and preview config, register it in the remocn
registry and preview index, add the typography documentation and navigation
entry, then regenerate the preview manifest and shadcn registry artifacts.
The branch-level changelog entry will include the new component.

## Verification

Run the metadata test, typecheck, lint for touched files, registry and manifest
checks, then render the preview at representative reveal and exit frames. The
frame sequence should show hard-cut word additions, exact recentering, and a
cumulative whole-line push-in, upward settling of only the new word, and a
continuous left-to-right fade with no background or icon.
