# shader-liquid-metal

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Molten metallic surface with flowing specular highlights. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders. Defaults to `shape="none"` so it fills the frame instead of rendering a centered emblem.

## Install

```bash
shadcn add @remocn/shader-liquid-metal
```

Lands at `components/remocn/shader-liquid-metal.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#2a2a30"` |
| `colorTint` | `string` | `"#8a8a95"` |
| `distortion` | `number` | `0.1` |
| `repetition` | `number` | `1.5` |
| `contour` | `number` | `0.4` |
| `softness` | `number` | `0.05` |
| `shape` | `string` | `"none"` |

Any other `LiquidMetal` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderLiquidMetal speed={0.6} />} padding={0}>
  <SoftBlurIn text="Forged." color="#fafafa" />
</Backdrop>
```

## Use when

- A premium, industrial, or luxury scene wants a brushed/molten metal surface.
- You want reflective, flowing highlights that read as material rather than color.
- The palette is neutral/monochrome and you want tint to lead subtly.

## Don't use when

- You want a centered metallic emblem — override `shape` back to a paper shape (this wrapper defaults to full-bleed `"none"`).
- The brief calls for color — liquid-metal is tonal; use `shader-warp` or `shader-mesh-gradient`.
- High contrast highlights would fight fine text — lower `contour`/`repetition`.
