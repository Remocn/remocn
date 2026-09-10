# Inline Word Roll

Reference: seconds 1–4 of user-provided zBcFAFAZZryzvwMy.mp4. Recreate only the
word switching as a separate registry primitive. Fixed prefix "Looking for",
changing leads/customers/subscribers/appointments/demos/quotes/registrants/trials/
conversions, with a question mark attached to each word. Outgoing text rolls up;
incoming text arrives from below through a vertically masked one-line window.
Smoothly center the phrase as word widths change. Accelerate successive switches.

Transparent React/Remotion primitive, no dependency on previous shader items.
Measure real DOM text widths after font load. Use one stable fit scale based on
the longest phrase, interpolate line width during switches, and derive each
pair and its progress directly from the frame. No cumulative state or CSS clock.
Default interval 12 frames, multiplier 0.9, roll duration 6. Prevent overlapping
rolls by flooring intervals to the transition length. Final word holds.

Ship source, controls, docs, navigation, changelog, preview registration and both
registry artifacts. Verify timing endpoints, acceleration, reverse seeking,
portrait fit, render and types. Keep the dev server stopped and show the MP4.
