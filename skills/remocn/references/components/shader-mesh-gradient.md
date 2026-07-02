# shader-mesh-gradient

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

WebGL mesh gradient with drifting color blobs, driven per-frame. The production-grade replacement for the low-quality `mesh-gradient-bg`. Deterministic: the shader is frozen (`speed={0}`) and its `frame` uniform is driven from `useCurrentFrame()`, so every render pass is identical.

## Install

```bash
shadcn add @remocn/shader-mesh-gradient
```

Lands at `components/remocn/shader-mesh-gradient.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#12121a", "#232338", "#3a3a5c", "#52527a"]` |
| `distortion` | `number` | `0.6` |
| `swirl` | `number` | `0.1` |

Any other `@paper-design/shaders-react` `MeshGradient` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderMeshGradient speed={0.6} />} padding={0}>
  <SoftBlurIn text="Launch day." color="#fafafa" />
</Backdrop>
```

## Use when

- You need a quality, production-grade gradient backdrop — this is the intended replacement for `mesh-gradient-bg`.
- A hero or title scene wants slow, living color motion behind foreground text without competing for attention.
- The brand palette is soft/dark and you want the gradient to lead only when you override `colors`.

## Don't use when

- You want a structured, geometric background — use `dynamic-grid`.
- The shader must animate on a wall clock rather than the timeline — these wrappers are frame-driven by design; that is what keeps renders deterministic.
- You need a static, single-frame image — a solid `backdrop` fill is lighter.
