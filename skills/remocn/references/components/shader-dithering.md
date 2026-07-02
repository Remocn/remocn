# shader-dithering

**Tier:** `remocn` (animation) · **Vibe:** tech · **Natural length:** 150f @ 30fps

Ordered-dither shading over an animated gradient field. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders. Defaults to `shape="wave"` so it fills the frame instead of rendering a centered sphere.

## Install

```bash
shadcn add @remocn/shader-dithering
```

Lands at `components/remocn/shader-dithering.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colorFront` | `string` | `"#6a6a85"` |
| `shape` | `string` | `"wave"` |
| `type` | `string` | `"4x4"` |
| `size` | `number` | `2` |

Any other `Dithering` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderDithering speed={0.6} />} padding={0}>
  <SoftBlurIn text="Ordered noise." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a retro/print, 1-bit ordered-dither texture over a moving gradient.
- A tech or lo-fi scene benefits from visible bayer/ordered dot structure.
- You want the matrix tunable via `type` (`"2x2"`, `"4x4"`, `"8x8"`).

## Don't use when

- You want a centered dithered sphere — override `shape` (this wrapper defaults to full-bleed `"wave"`).
- You want smooth, non-textured color — use `shader-mesh-gradient`.
- The dot pattern would reduce legibility of small text — raise `size` or use a solid `backdrop`.
