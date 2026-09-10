# Shader Text Reveal

Reference: the first two seconds of the user-supplied v65cbn8n2DVV1tKi.mp4.
Show "Your", then "product", centered on black, about one second per word.
The user selected the existing @remocn hero shader as the letter material.
Preserve its original field and halftone GLSL, using a separate composite pass
for the reference-inspired reveal and exit, leaving a pale white surface.
A diagonal dark wave clears the first word. The final word holds.

Implement a typography primitive, ShaderTextReveal. Rasterize each word into a
transparent canvas texture after its font loads. Use a custom WebGL2 fragment
shader for the spatial reveal, the original hero field and halftone material,
localized refraction and exit. The OpenShaders material is clipped to the letters, with no background overlay. Use a small scale settle, with no directional text travel.

The canvas is transparent. A demo backdrop supplies black. Auto-fit text within
72% of frame width; use fontSize as a maximum. Space-separated input gives words;
newlines give phrases. Default wordDuration 30 frames, intensity 1, fontSize 400.
Timing is deterministic from useCurrentFrame. Prepare textures once, upload only
on word changes, dispose GPU resources on teardown, and fail explicit render
errors. Preserve the earlier shader-seam experiment separately.

Validate reference frame comparisons, transition boundaries, repeated-frame
identity, text fitting, portrait, registry output, typecheck and docs metadata.
Keep the dev server stopped as requested; deliver the rendered MP4 directly.
