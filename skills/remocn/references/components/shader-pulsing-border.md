# shader-pulsing-border

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Glowing border frame that pulses around the edges. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-pulsing-border
```

Lands at `components/remocn/shader-pulsing-border.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colors` | `string[]` | `["#52527a", "#8a8a95", "#3a3a5c"]` |
| `roundness` | `number` | `0.25` |
| `thickness` | `number` | `0.1` |
| `intensity` | `number` | `0.2` |
| `bloom` | `number` | `0.25` |

Any other `PulsingBorder` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderPulsingBorder speed={0.6} />} padding={0}>
  <SoftBlurIn text="Framed." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a pulsing lit frame around the scene edges to contain foreground content.
- A premium reveal benefits from an edge glow that leaves the center clear for text.
- You want corner radius / thickness tunable via `roundness`/`thickness`.

## Don't use when

- The brief bans decorative glow — keep `bloom`/`intensity` restrained so the border does not read as AI-slop neon.
- You want a full-field texture — the interior stays mostly `colorBack`; use a noise or gradient shader.
- The scene already has a strong border/frame in the layout.
