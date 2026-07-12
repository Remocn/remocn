# shader-god-rays

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Volumetric light rays radiating from an off-screen source. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-god-rays
```

Lands at `components/remocn/shader-god-rays.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colorBloom` | `string` | `"#3a3a5c"` |
| `colors` | `string[]` | `["#5a5a7e", "#8a8a95", "#ffffff", "#3a3a5c"]` |
| `intensity` | `number` | `0.8` |
| `density` | `number` | `0.3` |
| `bloom` | `number` | `0.4` |

Any other `GodRays` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderGodRays speed={0.5} />} padding={0}>
  <SoftBlurIn text="Into the light." color="#fafafa" />
</Backdrop>
```

## Use when

- A hero or reveal scene wants cinematic volumetric light rays from a corner source.
- You want atmosphere and depth behind a title without geometric structure.
- The palette is dark and you want soft neutral rays (override `colors` to brand-tint).

## Don't use when

- The brief bans decorative glow — this is a genuine volumetric shader, but keep `bloom`/`intensity` restrained so it does not read as an AI-slop glow.
- You want structured or cellular motion — use `shader-dot-orbit` or `shader-voronoi`.
- Bright rays would wash out foreground text — lower `intensity`/`bloom`.
