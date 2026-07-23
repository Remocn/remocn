# shader-strata

**Tier:** `remocn` (animation) · **Vibe:** calm · **Natural length:** 150f @ 30fps

Fine horizontal sediment layers displaced by fbm noise, each drifting at its own depth speed, so the stack reads as a living foundation rather than a gradient. Custom WebGL, frame-driven and deterministic.

## Install

```bash
shadcn add @remocn/shader-strata
```

Lands at `components/remocn/shader-strata.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#050507", "#0a0a0d", "#111014", "#17161b"]` |
| `accent` | `string` | `"#6733FF"` |
| `accentAmount` | `number` | `0` |
| `layers` | `number` | `14` |
| `amplitude` | `number` | `0.16` |
| `speed` | `number` | `1` |

## Example

```tsx
<Backdrop fill={<ShaderStrata speed={1} layers={14} amplitude={0.16} />} padding={0}>
  <SoftBlurIn text="Built on bedrock." color="#fafafa" />
</Backdrop>
```

## Use when

- Calm, grounded, geological ambient backdrops — foundations, stability, "built on" narratives.
- A scene wants texture and depth without directional motion.
- You want each layer moving at its own depth speed rather than a single flat gradient.

## Don't use when

- You want motion with a clear direction or flow — use `shader-warp`.
- You want cellular texture instead of layered sediment — use `shader-voronoi`.
