# Kinetic Morph Text

Approved direction: a reusable registry typography component inspired by the
supplied reference's independent letters, rotating clusters, outline echoes,
and reconstruction into a new phrase. The reference's hand-shaped arrangement
and copy are not reproduced. Default copy and all documentation are English.

`KineticMorphText` accepts pipe- or newline-separated phrases through `text`.
It assembles the first phrase, holds for reading, then moves through the list.
Matching graphemes retain their identity and move to their new positions;
unmatched letters soften, stretch, and blend into replacement glyphs near the
middle of a curved flight. Additional letters enter and excess letters leave.
The final phrase holds unless `loop` is enabled.

Use native SVG text and measured advances with a system font, avoiding font
downloads or external assets. Soft glyph blending is a local blur/threshold
effect, not interpolation of font outlines. All poses and contour echoes are
pure functions of the Remotion frame, so seeking and rendering are repeatable.
Fit the longest phrase within the composition, preserving spaces, punctuation,
and grapheme clusters. Ignore empty entries; empty input renders no letters.

Controls cover text, font size/weight, text/background colors, flight spread,
rotation, morph amount, outline trails, transition/hold frames, loop, and the
shared speed multiplier. Export a duration helper for longer phrase sequences.

Implementation sequence:

1. Build and verify phrase parsing, character matching, frame timing, and poses.
2. Add measured typography, SVG glyph blending, and sampled contour echoes.
3. Register the component, controls, documentation, navigation, and changelog.
4. Regenerate registry and preview artifacts; run focused tests and TypeScript.
5. Render the default sequence and alternate copy, inspect transition and hold
   frames, and verify editable controls in the docs preview.
