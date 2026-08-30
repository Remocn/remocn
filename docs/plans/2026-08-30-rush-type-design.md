# Rush Type

## Reference

Adapt the supplied `rush-type` WebGL study into a standalone, deterministic
Remotion registry component. A lowercase word rests long enough to read on a
flat black frame, then grows rapidly through a vertical orbit. Motion spreads
the same white glyph into differently shuttered red, green, and blue channels
before the next word resolves from the blur.

The defining invariant is that every motion-dependent term is exactly zero at
rest. A resting frame contains a pixel-sharp white word on black with coincident
RGB channels. There is no authored color tint, chromatic-aberration pass,
feedback buffer, horizontal blur, or crossfade to a separate white state.

## Rendering

`RushType` owns a full-frame WebGL canvas. The glyph atlas contains the current
and next words. Each output channel samples the same monochrome texture over a
different shutter length and divides by its accumulated sample weight. Green
uses the longest shutter, red an intermediate shutter, and blue the shortest,
producing color only while the scale changes.

The shader sweeps vertical scale rather than position. It fits a quadratic
through the shutter start, current instant, and shutter end so the blur remains
defined around the near-point turn. Perspective, yaw, and limited pitch are
evaluated once per output frame; rotation is not swept through the shutter, so
vertical stems remain crisp. Bloom, CRT modulation, rolling shutter, along-word
lag, swap separation, and the neutral ground are all multiplied by motion
progress and therefore vanish exactly at rest.

The supplied implementation's `GLOW_BASE = 0.03` contradicts the flat-black
rest invariant. The Remotion adaptation removes that base contribution and
gates the ground entirely on motion progress.

The canvas does not expose framebuffer readback through `toDataURL()`,
`readPixels()`, or a feedback pass. Its WebGL context therefore uses
`preserveDrawingBuffer: false`: preserving the previous framebuffer adds a
large sustained GPU cost without changing the authored pixels. Remotion frame
capture must still be verified on both a resting frame and a motion frame.

## Timeline

All state is a pure function of `useCurrentFrame()`, `fps`, component props, and
the phrase. There are no animation frames, timers, wall clocks, scroll values,
pointer state, visibility observers, device-dependent sample counts, or random
draws. Rendering any frame directly must produce the same pixels as rendering
the full sequence up to that frame.

Each word cycle contains a short near-point hang, an arrival from the blast, a
long readable rest, and a fast departure back toward the camera. The word swap
occurs at the cycle boundary inside the near-point shutter. Incoming and
outgoing samples receive opposite scale separation only while that shutter
contains the swap, preventing a legible double exposure.

## Component

The registry item is named `rush-type` and exports `RushType`,
`RushTypeProps`, timeline helpers, and a natural-length helper. The primary
controls are:

- `phrase`: whitespace-delimited words;
- `fontSize`: resting glyph size;
- `fontWeight`: 400, 500, 600, or 700;
- `verticalStretch`: authored peak vertical scale before perspective;
- `chromaticSpread`: separation between the three shutter lengths;
- `restDuration`: readable rest in frames;
- `peakHoldDuration`: near-point hang in frames;
- `speed`: the shared remocn playback multiplier.

The React API also accepts `fontFamily` and `className`. Technical shader
constants stay internal until a demonstrated use case warrants expanding the
public surface. Text and channel colors are intentionally not configurable.

## Integration

Add the component and customizer config, register it in the preview index and
remocn registry, add its typography documentation and example, then regenerate
the preview manifest and registry artifacts. The component is full-frame and
does not declare element dimensions.

## Verification

Unit-test phrase normalization, cycle timing, word selection, shutter ratios,
swap-window behavior, and the exact rest pose. Add a pixel-level or shader-state
assertion proving that every effect strength is zero during rest and that the
three channel scales coincide. Run focused Biome checks, TypeScript, the test
suite, registry and manifest builds, and render representative rest, departure,
peak-swap, and arrival frames for visual inspection.
