# brush

**Tier:** `remocn` (core library) · **Vibe:** paper

The shared brush engine behind the kit's ink marks. It turns a spine — an ordered list of points — into a filled ribbon whose width follows a pressure profile, and roughens the edges with a noise displacement filter. `ink-underline`, `ink-arrow` and `scribble-circle` all draw through it, which is why a mark made with any of them reads as the same physical brush.

Auto-installed transitively by those components; you rarely add it directly.

## Install

```bash
shadcn add @remocn/brush
```

Lands at `components/remocn/brush.tsx`. Pulls in `@remocn/stop-motion`.

## API

| Export | Purpose |
|---|---|
| `brushRibbon(spine, { strokeWidth, pressure, release, progress })` | The `d` of a filled variable-width ribbon along `spine` |
| `brushHalfWidth({ strokeWidth, pressure, release }, t)` | Half-width at normalized position `t` |
| `brushReach(strokeWidth, grain)` | How far the mark can land outside its spine — use it for viewBox margins |
| `brushGrainScale(strokeWidth, grain)` | Displacement amplitude of the grain filter |
| `brushFilterId(seed, strokeWidth, grain)` | Stable filter id; distinct per weight and grain |
| `<BrushGrain seed strokeWidth grain />` | Renders the `<defs><filter>` the ribbon references |
| `sampleCubic(from, c1, c2, to, points?)` | Samples a cubic bezier into a spine |
| `sampleLine(from, to, points?)` | Samples a straight segment into a spine |

## Why a ribbon and not a stroke

An SVG `stroke` has one width for its whole length, so a pen-pressure taper is impossible with it. `brushRibbon` offsets the spine by a per-sample half-width and fills the resulting outline instead.

That also changes how drawing is animated: `strokeDashoffset` does not apply to a fill, so the ribbon is **regenerated per pose** truncated at `progress`. The taper stays anchored to the whole spine, so the mark thickens as it travels rather than rescaling as it grows.

## Pressure

`pressure` is the weight at the start and `release` the weight at the end, both as fractions of `strokeWidth`.

- `pressure < release` — opens thin, closes thick. The `scribble-circle` and `ink-arrow` gesture.
- `pressure > release` — lands thick, lifts into a dry tail. The `ink-underline` gesture.
- `pressure === release` — a uniform band, no taper.

## Grain

`grain` displaces the ribbon edges by an amplitude proportional to `strokeWidth`. Where the ribbon is thicker than that amplitude the edges merely go ragged; where it is thinner — which is exactly the tapered end, by construction — it breaks apart into dry-brush flecks. So a tapered mark is never uniformly filled in and never ends abruptly. `grain: 0` switches the filter off.

Because the displacement pushes past the ribbon, always pad a viewBox with `brushReach(strokeWidth, grain)` rather than `strokeWidth / 2`.

## Use when

- Building a new hand-made ink mark that should match the rest of the kit.
- You need a variable-width stroke in Remotion at all.

## Don't use when

- A constant-width stroke is fine — a plain `<path stroke>` is cheaper and simpler.
- The mark must animate via `strokeDashoffset`; a filled ribbon cannot.
