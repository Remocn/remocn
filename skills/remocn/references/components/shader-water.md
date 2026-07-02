# shader-water

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Caustic water-surface ripples with subtle refraction. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-water
```

Lands at `components/remocn/shader-water.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#16202b"` |
| `colorHighlight` | `string` | `"#5a6a7a"` |
| `highlights` | `number` | `0.06` |
| `waves` | `number` | `0.3` |
| `caustic` | `number` | `0.08` |

Any other `Water` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderWater speed={0.6} />} padding={0}>
  <SoftBlurIn text="Below the surface." color="#fafafa" />
</Backdrop>
```

## Use when

- A scene wants a calm, aquatic atmosphere with gentle refracted highlights.
- You need a cool, dark blue backdrop that moves slowly without pulling focus.
- The brief calls for depth or "flow" imagery (data lakes, streaming, calm).

## Don't use when

- The palette must be warm or vibrant — water reads cool by design; recolor via `colorHighlight`/`colorBack` or choose another shader.
- You want sharp geometric motion — use `shader-swirl` or `dynamic-grid`.
- Bright caustics would fight small text — lower `caustic`/`highlights` or use a solid `backdrop`.
