# shader-gem-smoke

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Paper's Gem Smoke shader driven by the current frame — animated color fields flowing behind and inside a glassy logo silhouette. Feed a brand mark via `image` (a URL, e.g. `staticFile("symbol.svg")`); the shape is cached so every frame renders the same smoke.

## Install

```bash
shadcn add @remocn/shader-gem-smoke
```

Lands at `components/remocn/shader-gem-smoke.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `image` | `string` | — |
| `speed` | `number` | `1` |
| `colors` | `string[]` | `["#3a3a5c", "#52527a"]` |
| `colorBack` | `string` | `"#0a0a10"` |
| `innerDistortion` | `number` | `0.8` |
| `outerDistortion` | `number` | `0.6` |
| `outerGlow` | `number` | `0.55` |
| `innerGlow` | `number` | `1` |
| `size` | `number` | `0.8` |

Any other `GemSmoke` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderGemSmoke image={staticFile("symbol.svg")} speed={1} colorBack="#0a0a10" />} padding={0}>
  <SoftBlurIn text="Introducing." color="#fafafa" />
</Backdrop>
```

## Use when

- Brand or logo reveals that want smoke living inside and around a mark.
- You have a static brand asset (SVG/PNG) to feed as `image` and want it treated as a glassy silhouette.
- A premium product intro wants color fields flowing through a recognizable shape.

## Don't use when

- You have no logo or mark to feed as `image` — use `shader-smoke-ring` or `shader-neuro-noise` for a shapeless field instead.
- The brand mark should stay static and legible — the smoke will distort its read.
