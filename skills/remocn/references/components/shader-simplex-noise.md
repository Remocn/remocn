# shader-simplex-noise

**Tier:** `remocn` (animation) · **Vibe:** clean · **Natural length:** 150f @ 30fps

Simplex noise flow field, smoother than Perlin. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-simplex-noise
```

Lands at `components/remocn/shader-simplex-noise.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#12121a", "#3a3a5c", "#52527a", "#8a8a95"]` |
| `stepsPerColor` | `number` | `2` |
| `softness` | `number` | `0.1` |

Any other `SimplexNoise` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderSimplexNoise speed={0.5} />} padding={0}>
  <SoftBlurIn text="Smooth field." color="#fafafa" />
</Backdrop>
```

## Use when

- You want the smoothest of the noise backdrops — fewer directional artifacts than Perlin.
- A clean, minimal scene needs gentle multi-stop color drift.
- You want posterized banding control via `stepsPerColor`.

## Don't use when

- You want cloudier, softer fog — use `shader-perlin-noise`.
- You want cellular structure — use `shader-voronoi`.
- You want neural-web filaments — use `shader-neuro-noise`.
