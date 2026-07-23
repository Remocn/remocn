# caret-wipe

**Tier:** `remocn` (transition) · **Vibe:** clean · **Natural length:** 40f @ 30fps

A text caret sweeps across the frame, erasing the outgoing scene behind it and typing the next scene in ahead of it — a cursor rewriting the screen.

## Install

```bash
shadcn add @remocn/caret-wipe
```

Lands at `components/remocn/caret-wipe.tsx`.

## Props

`caretWipe(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `direction` | `"left" \| "right"` | `"right"` |
| `caretColor` | `string` | `"#C3E88D"` |
| `caretWidth` | `number` | `3` |
| `caretHeight` | `number` | `0.5` |

## Example

```tsx
<TransitionSeries.Transition
  timing={linearTiming({ durationInFrames: 40 })}
  presentation={caretWipe({ direction: "right" })}
/>
```

## Use when

- Dev-tool, editor, or terminal demos where a typing cursor is the natural through-line between scenes.
- The scenes are UI or text surfaces that plausibly get "typed" or "erased."
- A directional wipe with a clear metaphor fits better than a generic dissolve.

## Don't use when

- The scenes aren't text or UI surfaces — the caret metaphor has nothing to type over.
- You want a textured dissolve instead of a directional wipe — use `ascii-dissolve` or `dither-dissolve`.
