# shader-spiral

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Rotating spiral arms radiating from the center. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-spiral
```

Lands at `components/remocn/shader-spiral.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colorFront` | `string` | `"#52527a"` |
| `density` | `number` | `1` |
| `strokeWidth` | `number` | `0.5` |
| `softness` | `number` | `0.2` |

Any other `Spiral` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderSpiral speed={0.5} />} padding={0}>
  <SoftBlurIn text="Drawn in." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a hypnotic, rotating radial background with visible arm structure.
- A transition or intro benefits from a strong "pulling in toward the center" motion.
- You want a two-tone, minimal look — `colorFront` on `colorBack`.

## Don't use when

- You want closed concentric rings rather than open arms — use `shader-swirl`.
- The center sits behind key text — the convergence point competes for attention.
- You need multi-color richness — spiral is duotone by default; use `shader-warp`.
