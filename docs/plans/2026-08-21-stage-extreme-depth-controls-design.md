# Stage extreme depth controls design

## Goal

Allow the Stage customizer to create much stronger and experimental depth treatments without changing the current readable defaults.

## Control ranges

- `rotateX`: `-180..180`, step `1`, default `14`.
- `rotateY`: `-180..180`, step `1`, default `-20`.
- `perspective`: `50..5000`, step `25`, default `900`.
- `scale`: `0.1..3`, step `0.01`, default `0.86`.

Lower perspective values exaggerate foreshortening. The wider scale range supports both extreme pull-backs and oversized close-ups.

## Back face

Stage currently hides the plane's back face, which makes rotations beyond 90 degrees disappear. Change `backfaceVisibility` to `visible` so the experimental rotation range remains observable. The browser's natural mirrored rendering of the back face is acceptable and should be documented.

Do not duplicate the child surface to manufacture a separate back face. Long screenshots can already be thousands of pixels tall, so mounting a second copy would add unnecessary rendering and memory cost.

## Defaults and compatibility

Keep the existing Stage defaults unchanged. The component already accepts arbitrary numeric props; this change expands customizer reach and makes the back face visible. Existing compositions using normal rotations are unaffected.

## Documentation and verification

- Document that values near or beyond 90 degrees can reveal a mirrored back face.
- Document that very low perspective or high scale can deliberately clip most of the surface.
- Test the exact customizer ranges and defaults.
- Test that the generated transform preserves extreme numeric values.
- Rebuild the preview manifest.
- Run targeted tests, typecheck, lint, and production build.
- Visually inspect a strong-depth pose and a rotation beyond 90 degrees.
