# shader-swirl

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Concentric bands swirling around a center point. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-swirl
```

Lands at `components/remocn/shader-swirl.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#52527a", "#3a3a5c", "#232338"]` |
| `colorBack` | `string` | `"#12121a"` |
| `bandCount` | `number` | `4` |
| `twist` | `number` | `0.1` |
| `softness` | `number` | `0.2` |

Any other `Swirl` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderSwirl speed={0.6} />} padding={0}>
  <SoftBlurIn text="Spun up." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a hypnotic, radial background with clear banded structure around a center.
- A scene benefits from rotational motion that reads as "spinning up" or focus.
- You want the band count tunable — raise `bandCount` for tighter rings.

## Don't use when

- You want free-flowing liquid folds rather than concentric bands — use `shader-warp`.
- The center would sit behind critical text — the convergence point draws the eye.
- You want spiral arms instead of closed rings — use `shader-spiral`.
