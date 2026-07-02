# shader-smoke-ring

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Soft smoke ring curling and dissipating in place. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders. Object-sizing shader — the ring sits centered on `colorBack`.

## Install

```bash
shadcn add @remocn/shader-smoke-ring
```

Lands at `components/remocn/shader-smoke-ring.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colors` | `string[]` | `["#c8c8d0"]` |
| `radius` | `number` | `0.25` |
| `thickness` | `number` | `0.65` |
| `scale` | `number` | `0.8` |

Any other `SmokeRing` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderSmokeRing speed={0.5} />} padding={0}>
  <SoftBlurIn text="Dissipate." color="#fafafa" />
</Backdrop>
```

## Use when

- You want a single soft, centered smoke ring as a focal atmospheric element.
- A minimal, premium scene benefits from one curling shape on a dark field.
- You want a neutral, near-monochrome look (override `colors` to tint).

## Don't use when

- You need a full-bleed edge-to-edge texture — this is a centered object; use a noise or gradient shader.
- The center sits behind key text — the ring draws the eye inward.
- You want multiple elements or busy motion — smoke-ring is deliberately singular.
