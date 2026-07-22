# scribble-circle

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 30f to draw at the defaults, 150f as a scene

A brush loop swept around a region of the frame — the strongest annotation gesture in the kit. `ink-underline` emphasises a line of text; this points at an area. The typical shot is a product screenshot with the brush going round the one price, button, or number that matters.

The mark is a filled ribbon with a pressure profile, not a constant-width stroke: it opens thin and pale, thickens all the way round, and ends blunt and fully loaded.

## Install

```bash
shadcn add @remocn/scribble-circle
```

Lands at `components/remocn/scribble-circle.tsx`. Pulls in `@remocn/stop-motion` and `@remocn/brush`.

## Props

| Prop | Type | Default |
|---|---|---|
| `width` | `number` | required |
| `height` | `number` | required |
| `color` | `string` | `"#6f7f35"` |
| `strokeWidth` | `number` | `14` |
| `pressure` | `number` | `0.2` |
| `grain` | `number` | `1` |
| `delay` | `number` | `0` |
| `durationSteps` | `number` | `10` |
| `laps` | `number` | `1.15` |
| `seed` | `string` | `"scribble"` |
| `step` | `number` | `3` |

`width`/`height` are required and there is no children API: measuring a child needs `getBoundingClientRect`, which does not run in Remotion's server-side render, so an auto-sizing version would look right in the browser preview and collapse in the exported video.

`laps` is the character knob — `1.15` overshoots the start by ~54° so it never reads as a drawn `<ellipse>`, `2` is a double loop, `0.9` an open arc.

`pressure` is where the brush opens, as a fraction of `strokeWidth`; `1` removes the taper. `grain` displaces the ribbon edges by an amplitude proportional to `strokeWidth`, so the thick end merely goes ragged while the thin opening breaks into dry-brush flecks — the stroke is never uniformly filled in. `grain: 0` gives clean vector edges.

The root element keeps the nominal `width`/`height`; only the SVG overflows.

## Example

```tsx
<div style={{ position: "relative" }}>
  <PricingCard />
  <div style={{ position: "absolute", left: 326, top: 119 }}>
    <ScribbleCircle width={108} height={62} delay={18} />
  </div>
</div>
```

## Use when

- Circling the one element that matters — a button, a number, a row in a screenshot.
- Building the full annotation beat: circle the thing, then point at it with `ink-arrow`.

## Don't use when

- You need a permanent border or a focus ring. This is a gesture that happens once, not a state.
- You want a rectangular or bracket-shaped annotation, or to cross something out.
- The target's size is not known at author time — this component cannot measure it.
