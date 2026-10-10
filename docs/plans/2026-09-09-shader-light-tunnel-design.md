# Shader Light Tunnel

Use the original @remocn hero field and halftone GLSL. The user requested that
only its mapping be adapted to straight tunnel flight. Preserve the original
field equations, constants and colors. Replace the field's position input with
a cylindrical perspective mapping: angle wraps seamlessly with sin/cos, depth
comes from inverse screen radius, and time advances world Z. No camera X/Y
translation, gaze drift or roll. Keep a fixed central vanishing point.

Make circular motion more visible with an explicit time-based rotation of the
material in addition to winding along Z. Use (0.3 * z + 1.5 * time) * twist,
giving about 75 degrees per second at default speed and twist. Twist zero removes
the angular motion; speed zero freezes all motion. Keep the original hero field
and halftone source intact and do not rotate the camera or screen-space dots.

Repeat the angular mapping three times by default to add more spiral ribbons.
Multiply the whole angle (including its time term) by an integer `spirals`,
clamped to 1–6, so density changes preserve rotation speed and remain seamless.
This reuses the same hero evaluation per pixel; no extra field passes.

Hold the original hero material at time zero to remove its animated color and
breathing cycle, which dims the ribbons over time. In the adapter, rename its
time input to a constant material phase and give the tunnel mapping its own
frame-driven time. Keep the original hero GLSL constants intact. Rotation and
forward travel continue; the material no longer progresses into darker phases.

Add inward flow on top of rotation with a logarithmic radial phase:
5 * log(radius / (0.55 * depth)) + 12 * time. Drive the sampling ring and its
offset with this phase, moving folds toward the center at r(t) = r(0) * exp(-2.4t).
The user requested a faster flow after reviewing the reference's 1–3 second
segment. Use four times the initial inward speed, reaching one tenth of the
starting radius in about 0.96 seconds; leave the angular speed unchanged.
Keep this independent of twist so inward motion works with rotation disabled.
Use coordinate deformation only, preserving the fixed color phase and exposure.

Render the adapted hero field into an offscreen texture, then run the original
halftone pass. Replace the dark center mask with a local 5x5 Gaussian blur of
the field texture (sigma 0.025 of composition height). Prefilter taps with
generated mipmaps to prevent high-frequency spiral ghosting. Blend it over halftone
with a Gaussian center weight (sigma 0.065), removing the outlined hole without
blurring the outer ribbons. Apply optional exposure. Dispose GPU resources and resize the
render target as necessary. Remove the previous custom volume shader and color
palette controls. Props are speed, twist, spirals, glow, depth and timeOffset.

Verify GLSL identity of the retained hero source, GPU rendering, deterministic
seeking, speed-zero freezing, portrait and perspective extremes. Update source,
controls, documentation, changelog and generated registry artifacts.
