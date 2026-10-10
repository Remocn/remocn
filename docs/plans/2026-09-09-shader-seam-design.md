# Shader Seam

The latest direction replaces travel with disappearance. Preserve the original
OpenShaders field and halftone GLSL, at its original position, scale and rotation.
Default shader speed to zero. Reveal the shader with an organic density threshold,
exchange the React scenes during a fully opaque interval, then dissolve the
material in place. Bright folds survive longer than dark areas. Static smooth
noise breaks up the density without a moving edge, floating particles or trails.

Use a frame-derived phase: appearance ends at 0.34, scene exchange at 0.4,
dissolve begins at 0.46 and ends at 1. Keep a fully opaque interval around the
exchange so the scenes never visibly jump. Render only one WebGL canvas on the
entering layer. No readPixels, raster scene masks or HTML capture are needed.

Keep shaderSeam() and the OpenShaderSource adapter. Replace direction, width and
distortion with softness (0.02–0.4, default 0.18) and detail (0–1, default 0.65).
Verify endpoint visibility, opaque exchange, deterministic seeking, full GPU
render, portrait and alternate shaders. Update controls, docs and registry output.
