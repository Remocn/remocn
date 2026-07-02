# shader-warp

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Domain-warped color field that folds and stretches like liquid. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-warp
```

Lands at `components/remocn/shader-warp.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#12121a", "#3a3a5c", "#12121a", "#52527a"]` |
| `proportion` | `number` | `0.5` |
| `softness` | `number` | `1` |
| `distortion` | `number` | `0.2` |
| `swirl` | `number` | `0.4` |

Any other `Warp` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderWarp speed={0.7} />} padding={0}>
  <SoftBlurIn text="Fluid by default." color="#fafafa" />
</Backdrop>
```

## Use when

- A hero scene wants organic, liquid motion that feels alive but stays out of the way.
- You want a flowing alternative to a static gradient with more directional movement.
- The palette is dark and you want folds of a single accent to read as depth.

## Don't use when

- Text legibility over the whole frame is critical — raise `softness` and keep `distortion` low, or use a solid `backdrop`.
- You want tight, repeating structure — use `shader-swirl` (banded) or `shader-spiral`.
- You need a metallic sheen rather than color folds — use `shader-liquid-metal`.
