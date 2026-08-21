# Stage smooth descent design

## Goal

Make a continuous top-to-bottom camera move the default Stage example. The camera should never hold or change direction. Acceleration and deceleration should be limited to short regions at the beginning and end, with a constant-speed middle.

## Preset

Add `smooth-descent` to the existing Stage presets and make it the default. Keep `site-tour`, `hero-push`, and `section-hop` as selectable alternatives.

The default 300-frame path uses four keys:

- Frame 0: top target, zero starting velocity.
- Frame 30: end of the cubic acceleration ramp.
- Frame 269: start of the cubic deceleration ramp.
- Frame 299: bottom target, zero ending velocity.

The target stays horizontally centered with constant zoom and roll. The vertical targets are approximately `0.035`, `0.071`, `0.919`, and `0.955`.

## Velocity continuity

The first segment uses `Easing.in(Easing.cubic)`, the middle segment uses `Easing.linear`, and the final segment uses `Easing.out(Easing.cubic)`.

For a 30-frame cubic ramp, the ramp displacement is one third of the distance that the constant middle velocity would travel in the same time. This matches the velocity at both segment boundaries and avoids a visible speed jump.

## Defaults and snippet

The Stage customizer defaults to `smooth-descent`. Default handheld shake becomes `0` so the intended path reads as a clean continuous move. Users can still add shake manually.

The generated snippet imports `Easing` from Remotion and prints named easing expressions instead of serializing easing functions.

## Verification

- Test that the preset has no adjacent identical targets and progresses strictly downward.
- Test continuity around frames 30 and 269 within a small tolerance.
- Rebuild the preview manifest.
- Run targeted tests, typecheck, lint, and production build.
- Visually inspect the beginning, constant-speed middle, and ending ramp.
