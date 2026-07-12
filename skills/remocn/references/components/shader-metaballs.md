# shader-metaballs

**Tier:** `remocn` (animation) · **Vibe:** playful · **Natural length:** 150f @ 30fps

Organic blobs merging and splitting like lava. Frame-driven (`speed={0}` + `frame` from `useCurrentFrame()`) for deterministic renders.

## Install

```bash
shadcn add @remocn/shader-metaballs
```

Lands at `components/remocn/shader-metaballs.tsx`. Installs `@paper-design/shaders-react`.

## Props

| Prop | Type | Default |
|---|---|---|
| `speed` | `number` | `1` |
| `colorBack` | `string` | `"#12121a"` |
| `colors` | `string[]` | `["#3a3a5c", "#52527a", "#8a8a95"]` |
| `count` | `number` | `10` |
| `size` | `number` | `0.83` |

Any other `Metaballs` prop is forwarded through `...rest`.

## Example

```tsx
<Backdrop fill={<ShaderMetaballs speed={0.7} />} padding={0}>
  <SoftBlurIn text="Merge." color="#fafafa" />
</Backdrop>
```

## Use when

- A playful or organic scene wants lava-lamp blobs merging and splitting.
- You want soft, rounded motion that reads as fun without being childish.
- You want blob count/size tunable via `count`/`size`.

## Don't use when

- The brand is strictly serious/corporate — metaballs read playful.
- You want structured or geometric motion — use `shader-dot-orbit` or `shader-voronoi`.
- Blobs would obscure dense foreground content — lower `count`/`size`.
