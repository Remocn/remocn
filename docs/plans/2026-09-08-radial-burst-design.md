# Radial Burst

Approved direction: a standard geometric motion-design stinger for an
introducing video. A central circle pops in, divides into rounded radial
segments, rotates and reforms into a ring. The ring expands beyond the frame,
leaving a clean field for the next title or scene. No built-in text or logo.

The default palette is white geometry over remocn's primary purple, `#a800b7`.
Controls expose segment count, burst radius, stroke thickness, rotation, both
colors, speed, and looping. Transparent backgrounds allow overlay use.

Author a four-second sequence at 30 fps with deterministic SVG geometry:
circle arrival (0–18), radial burst (18–42), rotating assembly (42–84),
anticipation (84–96), expanding ring exit (96–114), and clean tail (114–120).
Morph cubic segment paths from straight radial capsules into circular arcs;
close the gaps before switching to a complete ring. Fit geometry to the shorter
composition dimension, but calculate the exit radius from the diagonal so it
clears landscape, square, and portrait frames. All motion derives from the
Remotion frame; the non-looping version remains cleared after completion.

Implementation: create the component and controls; add Effects documentation,
navigation, preview registration, and changelog; regenerate registry artifacts
and the preview manifest. Verify timing boundaries, geometry, looping, and
frame coverage with focused tests. Render the default sequence and alternate
segment counts/aspect ratios, inspect the assembly and exit, then check the
live docs controls and production build.


## Expressive revision

The user requested a more extravagant result after reviewing the first version.
The default now stretches the spokes into broad, tapered ribbons, bends them
into an asymmetric pinwheel, and tilts the geometry as a single plane. Warm
cream accents and sampled contour echoes emphasize the changing silhouette.
The closing ring expands through its earlier contours for a portal-like exit.
Intensity controls the deformation and tilt; zero restores the classic version.
Ribbon twist, echo count, and accent color are independently editable.
The timeline, transparent overlay support, and clean final frame remain.
