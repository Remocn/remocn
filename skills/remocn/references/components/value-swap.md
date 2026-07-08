# value-swap

**Tier:** `remocn` (typography) · **Vibe:** clean · **Natural length:** 100f @ 30fps

In-place vertical value swap at explicit frames — the outgoing value slides up and fades (`Easing.inOut` cubic) as the incoming one rides in from below in one continuous motion, while an invisible longest-value sizer keeps the width stable. Inline `span` inheriting parent typography — no font/color props. String analog of `rolling-number` for arbitrary text. `direction="down"` mirrors the motion. Deps: `remotion` only.

## Install

```bash
shadcn add @remocn/value-swap
```

Lands at `components/remocn/value-swap.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `values` | `string[]` | — |
| `at` | `number \| number[]` | — |
| `duration` | `number` | `10` |
| `distance` | `number` | `12` |
| `direction` | `"up" \| "down"` | `"up"` |
| `className` | `string` | — |
| `style` | `CSSProperties` | — |

## Example

```tsx
import { ValueSwap } from "@/components/remocn/value-swap";

export const MyScene = () => (
  <span style={{ fontSize: 40, fontWeight: 600 }}>
    <ValueSwap values={["Draft", "In review", "Shipped"]} at={[30, 60]} />
  </span>
);
```

## Use when

- A value changes at a specific story beat — before/after price, status promotion, a hex/token flip.
- You control the exact swap frames.

## Avoid when

- Values should cycle continuously as a montage — use `rolodex-flip` with its own rhythm instead.
- The value is a large pure number counting up — `rolling-number` or `number-wheel` reads as data.
