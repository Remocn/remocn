# shader-grain-gradient

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Grainy multi-stop gradient that drifts slowly with film-grain texture laid over the blend. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-grain-gradient
```

Lands at `components/remocn/shader-grain-gradient.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#3a3a52", "#4a4a68", "#5a5a7e"]` |
| `colorBack` | `string` | `"#12121a"` |
| `softness` | `number` | `0.6` |
| `intensity` | `number` | `0.2` |
| `noise` | `number` | `0.15` |

Any other `GrainGradient` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderGrainGradient speed={0.5} />} padding={0}>
  <SoftBlurIn text="Grain and glow." color="#fafafa" />
</Backdrop>
```

## Use when

- A gradient backdrop needs analog texture — the grain reads as film/print rather than flat digital.
- The scene tone is premium and editorial and you want subtle motion that does not distract.
- You want the gradient softened; raise `softness`/`noise` for an even quieter field.

## Don't use when

- You need crisp, clean color with no texture — use `shader-mesh-gradient`.
- Foreground content is tiny text — heavy grain can reduce contrast; lower `intensity`/`noise` or pick a solid `backdrop`.
- You want structured geometry — use `dynamic-grid`.
