# dynamic-grid

**Tier:** `remocn` (animation) · **Vibe:** premium · **Natural length:** 150f @ 30fps

Subtle moving grid background with configurable cell size and scroll direction. Lines drift continuously — diagonal by default — giving a quiet sense of depth without distracting from foreground content.

## Install

```bash
shadcn add @remocn/dynamic-grid
```

Lands at `components/remocn/dynamic-grid.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `cellSize` | `number` | `40` |
| `lineColor` | `string` | `"#27272a"` |
| `background` | `string` | `"#0a0a0a"` |
| `speed` | `number` | `0.5` |
| `direction` | `"diagonal" \| "horizontal" \| "vertical"` | `"diagonal"` |

## Example

```tsx
<Backdrop fill={<DynamicGrid cellSize={48} lineColor="#3f3f46" speed={0.4} />} padding={0}>
  <SoftBlurIn text="Build in public." color="#fafafa" />
</Backdrop>
```

## Use when

- You need a dark tech/SaaS background that feels alive but doesn't compete with text or UI.
- The scene calls for structured geometric motion — grid suits developer tools, dashboards, and infrastructure products.
- You want a sustained loopable background that reads as premium without gradient blobs.

## Don't use when

- The foreground content is dense or data-heavy — the moving grid adds visual noise behind already-busy UI; use a solid `Backdrop` fill instead.
- You want a warm, colorful, or organic mood — the grid is inherently cold and structured; use `spotlight-card` for a cooler dramatic feel or a solid color for warmth.
- The video is light-themed — `dynamic-grid` defaults are dark; inverting it (light lines on white) looks washed out; use a solid background or `spotlight-card` on a light palette.
