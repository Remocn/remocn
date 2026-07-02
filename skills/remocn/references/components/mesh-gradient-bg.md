# mesh-gradient-bg

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Living gradient with amorphous color blobs slowly drifting across the frame. Blobs are implemented as blurred radial shapes animated with sinusoidal offsets.

## Install

```bash
shadcn add @remocn/mesh-gradient-bg
```

Lands at `components/remocn/mesh-gradient-bg.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#ff0080", "#7928ca", "#00d4ff", "#ffb800"]` |
| `speed` | `number` | `1` |
| `background` | `string` | `"#0a0a0a"` |
| `blur` | `number` | `80` |

## Example

```tsx
<Backdrop fill={<MeshGradientBg colors={["#1a1a2e", "#16213e", "#0f3460", "#533483"]} speed={0.5} />} padding={0}>
  <SoftBlurIn text="Launch day." color="#fafafa" />
</Backdrop>
```

## Use when

- A legacy scene already uses this component and you must maintain visual consistency.
- The brief explicitly calls for a colorful gradient blob background and no alternative is acceptable.
- You are prototyping quickly and the final background will be replaced before export.

## Don't use when

- You want a quality, production-grade gradient — `mesh-gradient-bg` is considered low-quality in this library and should be avoided; use `shader-mesh-gradient` (WebGL, frame-driven) as the direct replacement, `dynamic-grid` for a structured dark background, `spotlight-card` for a dramatic lit-card feel, or a solid theme color via a `backdrop` fill.
- The design aesthetic is clean or minimal — blurred color blobs read as generic AI-generated output and undermine premium positioning.
- Text legibility matters — drifting saturated blobs create unpredictable contrast behind foreground content; use a solid or grid background that keeps the text readable at every frame.
