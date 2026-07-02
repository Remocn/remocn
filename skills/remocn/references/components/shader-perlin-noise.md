# shader-perlin-noise

**Tier:** `remocn` (animation) · **Vibe:** clean · **Natural length:** 150f @ 30fps

Classic Perlin noise clouds drifting across the frame. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-perlin-noise
```

Lands at `components/remocn/shader-perlin-noise.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colorFront` | `string` | `"#6a6a85"` |
| `proportion` | `number` | `0.35` |
| `softness` | `number` | `0.1` |

Any other `PerlinNoise` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderPerlinNoise speed={0.5} />} padding={0}>
  <SoftBlurIn text="Soft drift." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a soft, cloudy, organic backdrop that drifts slowly and stays calm.
- A clean scene needs texture without structure or color.
- You want a duotone fog — `colorFront` clouds over `colorBack`.

## Don't use when

- You want a smoother, more flowing field — use `shader-simplex-noise`.
- You want neural-web filaments — use `shader-neuro-noise`.
- You need sharp cellular structure — use `shader-voronoi`.
