# shader-dot-orbit

**Tier:** `remocn` (animation) · **Vibe:** tech · **Natural length:** 150f @ 30fps

Dots orbiting on concentric paths across the frame. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-dot-orbit
```

Lands at `components/remocn/shader-dot-orbit.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colors` | `string[]` | `["#4a4a68", "#52527a", "#3a3a5c"]` |
| `size` | `number` | `1` |
| `spreading` | `number` | `1` |

Any other `DotOrbit` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderDotOrbit speed={0.6} />} padding={0}>
  <SoftBlurIn text="In orbit." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a structured dot-grid backdrop with gentle orbital motion.
- A tech scene benefits from a regular pattern that reads as "network" or "system".
- You want dot size/spread tunable via `size`/`spreading`.

## Don't use when

- You want a static dot grid — the static `dot-grid` shader is intentionally not shipped; use a CSS grid.
- You want organic, flowing motion — use `shader-warp` or `shader-metaballs`.
- The regular pattern would clash with dense foreground content.
