# shader-voronoi

**Tier:** `remocn` (animation) · **Vibe:** tech · **Natural length:** 150f @ 30fps

Animated Voronoi cells shifting and re-tessellating. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-voronoi
```

Lands at `components/remocn/shader-voronoi.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#3a3a5c", "#52527a"]` |
| `colorGap` | `string` | `"#12121a"` |
| `distortion` | `number` | `0.4` |
| `gap` | `number` | `0.04` |
| `glow` | `number` | `0` |

Any other `Voronoi` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderVoronoi speed={0.6} />} padding={0}>
  <SoftBlurIn text="Tessellated." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a cellular, crystalline backdrop that shifts and re-tessellates.
- A tech scene benefits from clear cell structure with dark gaps between cells.
- You want the gap thickness tunable via `gap`.

## Don't use when

- You want soft, structureless fog — use `shader-perlin-noise` or `shader-simplex-noise`.
- You want a glow-heavy look — `glow` defaults to `0` on purpose; keep it low to avoid decorative bloom.
- Busy cells would clutter dense foreground content — lower `distortion` or use a solid `backdrop`.
