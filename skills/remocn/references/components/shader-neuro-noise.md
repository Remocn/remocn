# shader-neuro-noise

**Tier:** `remocn` (animation) · **Vibe:** tech · **Natural length:** 150f @ 30fps

Organic neural-web noise field that slowly morphs. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-neuro-noise
```

Lands at `components/remocn/shader-neuro-noise.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorFront` | `string` | `"#8a8a95"` |
| `colorMid` | `string` | `"#4a4a68"` |
| `colorBack` | `string` | `"#12121a"` |
| `brightness` | `number` | `0.05` |
| `contrast` | `number` | `0.3` |

Any other `NeuroNoise` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderNeuroNoise speed={0.5} />} padding={0}>
  <SoftBlurIn text="Neural by design." color="#fafafa" />
</Backdrop>
```

## Use when

- An AI / ML / tech scene wants an organic neural-web texture that reads as "intelligence".
- You want slow morphing structure behind text without hard geometry.
- The palette is dark and you want a filamentary web to sit low-contrast in the back.

## Don't use when

- You want smooth cloud noise instead of web filaments — use `shader-perlin-noise` or `shader-simplex-noise`.
- The brief is playful or warm — neuro-noise reads technical.
- Bright filaments would fight small text — lower `brightness`/`contrast`.
