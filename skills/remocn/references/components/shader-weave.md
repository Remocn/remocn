# shader-weave

**Tier:** `remocn` (animation) · **Vibe:** tactile · **Natural length:** 150f @ 30fps

A woven substrate — warp and weft threads crossing on a domain-warped grid, interlacing over and under like real cloth, with a slow sheen of light travelling across the fabric. Custom WebGL, frame-driven and deterministic.

## Install

```bash
shadcn add @remocn/shader-weave
```

Lands at `components/remocn/shader-weave.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#050506", "#0a0a0c", "#111015", "#1b1a22"]` |
| `accent` | `string` | `"#6733FF"` |
| `accentAmount` | `number` | `0` |
| `scale` | `number` | `22` |
| `warp` | `number` | `0.03` |
| `speed` | `number` | `1` |

## Example

```tsx
<Backdrop fill={<ShaderWeave speed={1} scale={22} warp={0.03} />} padding={0}>
  <SoftBlurIn text="Woven together." color="#fafafa" />
</Backdrop>
```

## Use when

- Tactile, crafted, "made-of" textures — fabric, mesh, or substrate metaphors.
- A scene wants a slow sheen of light traveling across a textured surface.
- The brand voice is handcrafted or material rather than digital and smooth.

## Don't use when

- You want a smooth gradient field — use `shader-mesh-gradient`.
- You want organic noise instead of a woven structure — use `shader-neuro-noise`.
