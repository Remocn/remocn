# shader-color-panels

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Overlapping translucent color panels sliding past each other. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-color-panels
```

Lands at `components/remocn/shader-color-panels.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#3a3a52", "#4a4a68", "#52527a", "#5a5a8a"]` |
| `colorBack` | `string` | `"#12121a"` |
| `density` | `number` | `3` |
| `length` | `number` | `1.1` |

Any other `ColorPanels` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderColorPanels speed={0.6} />} padding={0}>
  <SoftBlurIn text="Layered." color="#fafafa" />
</Backdrop>
```

## Use when

- You want an architectural, glassy backdrop of translucent panes sliding past each other.
- A scene benefits from layered depth without organic blob motion.
- You want the panel count tunable via `density`.

## Don't use when

- You want organic, flowing motion — use `shader-warp` or `shader-metaballs`.
- The overlap patterns would clutter dense foreground content — lower `density`.
- You need a single smooth gradient — use `shader-mesh-gradient`.
