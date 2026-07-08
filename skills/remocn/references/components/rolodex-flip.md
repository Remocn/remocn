# rolodex-flip

**Tier:** `remocn` (typography) · **Vibe:** tech · **Natural length:** 110f @ 30fps

Inline 3D word cycler — flips through `items` on a rolodex card (±85° rotateX, outgoing tips up with `Easing.in` cubic, incoming turns in from below half a flip later with `Easing.out` cubic). An invisible longest-item sizer keeps line width and baseline rock-solid. Inherits parent typography — inline span, no font/color props. First item shows immediately, last item persists. Deps: `remotion` only.

## Install

```bash
shadcn add @remocn/rolodex-flip
```

Lands at `components/remocn/rolodex-flip.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `items` | `string[]` | — |
| `from` | `number` | `0` |
| `interval` | `number` | `20` |
| `flipDuration` | `number` | `10` |
| `className` | `string` | — |
| `style` | `CSSProperties` | — |

## Example

```tsx
import { RolodexFlip } from "@/components/remocn/rolodex-flip";

export const MyScene = () => (
  <span style={{ fontFamily: "monospace", fontSize: 36 }}>
    $ npx shadcn add{" "}
    <RolodexFlip items={["button", "dialog", "command", "tabs", "chart-area"]} />
  </span>
);
```

## Use when

- Cycling package, feature, or value names inside a held line — install commands, "works with X" beats, plan-name cycling.
- The canonical "any component, same command" bit.

## Avoid when

- The values are numbers with a counting narrative — use `number-wheel` or `rolling-number`.
- Only two values swap once — `value-swap`, `shared-axis-y`, or `per-word-crossfade` is lighter.
- The line reflows per value — the fixed sizer width shows a gap next to short values.
