# shader-caustics

**Tier:** `remocn` (animation) · **Vibe:** elegant · **Natural length:** 150f @ 30fps

A field of refracted light — the bright filaments light makes through a rippling surface, denser toward the bottom. A custom WebGL shader written for remocn: frame-driven and deterministic (no wall-clock time).

## Install

```bash
shadcn add @remocn/shader-caustics
```

Lands at `components/remocn/shader-caustics.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#0a0a0a", "#2e2e33"]` |
| `accent` | `string` | `"#7F57FF"` |
| `accentAmount` | `number` | `0` |
| `scale` | `number` | `5.2` |
| `intensity` | `number` | `1` |
| `speed` | `number` | `1` |

## Example

```tsx
<Backdrop fill={<ShaderCaustics speed={1} scale={5.2} intensity={1} />} padding={0}>
  <SoftBlurIn text="Light, refracted." color="#fafafa" />
</Backdrop>
```

## Use when

- Water, light, or premium ambient backdrops where refracted-light filaments fit the mood.
- A calm, elegant scene wants motion without a strong directional pull.
- You want the light density to build toward one edge of the frame (denser toward the bottom by default).

## Don't use when

- You want structured cellular noise — use `shader-voronoi`.
- You want soft fog instead of filaments — use `shader-perlin-noise`.
