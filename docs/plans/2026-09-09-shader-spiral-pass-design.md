# Shader Spiral Pass

Create a separate TransitionSeries presentation using the existing Light Tunnel
material. The camera follows the centered axis into the spiral and exits into
the next scene. Preserve the fixed color phase, fast inward flow and soft center.

Reuse the GPU renderer through a registry dependency instead of duplicating the
hero GLSL. Add an optional camera zoom argument with default 1 so the background
retains its current rendering. The transition sets it from a smooth accelerating
progress curve. Shader time also accelerates continuously as the camera dives.

Cover the current scene by progress 0.18; exchange the React layers at 0.2 while
the shader is opaque. At 0.64 start opening a soft central aperture, expanding
beyond the composition diagonal by progress 1. Mask the incoming scene itself
over the opaque shader, with the feather confined inside the opening and capped
at 12% of its radius. Apply scene scale inside the mask so it cannot expand the
visible aperture. This prevents content leaking through the surrounding ribbons.
Only the entering presentation renders a WebGL canvas. Exact endpoints contain
only their corresponding scenes. Derive all animation from presentation progress.

Use 72 frames at 30 fps for the transition, with 48-frame holds on both sides
in the 168-frame preview. Expose speed, spirals, twist, zoom, softness and timeOffset.
Add docs, a two-scene example, preview registration, changelog and build artifacts.
Verify endpoint coverage, deterministic seeking, portrait exit coverage, WebGL
compilation and the existing Light Tunnel background's unchanged default output.
