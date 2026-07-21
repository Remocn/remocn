# paper-wobble

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 90f @ 30fps

A wrapper that gives arbitrary content the per-pose reshoot jitter: one offset held for a whole stop-motion pose, then a snap to the next. The cheapest way to make a headline, card, or block feel hand-placed on a desk.

## Install

```bash
shadcn add @remocn/paper-wobble
```

Lands at `components/remocn/paper-wobble.tsx`. Pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `children` | `React.ReactNode` | required |
| `seed` | `string` | `"wobble"` |
| `amp` | `number` | `1.4` |
| `rotAmp` | `number` | `0.35` |
| `step` | `number` | `3` |
| `className` | `string` | — |
| `style` | `React.CSSProperties` | — |

`display: inline-block` and nothing else — no size, no background, no positioning. A `transform` passed via `style` is applied first, with the jitter appended.

## Example

```tsx
<PaperWobble seed="title">
  <h1>Shot on a desk</h1>
</PaperWobble>
```

## Use when

- Any block should carry the stop-motion reshoot wobble — headlines, cards, or content that must feel hand-placed rather than laid out.
- Two or more elements should read as separate objects on a desk: give each its own `seed`.

## Don't use when

- The content should sit rock-still — UI simulations, code blocks being read.
- You want smooth floating motion rather than discrete poses — use `drift`.
- The component already jitters itself, like `paper-sticker`; wrapping it just doubles the shake.
