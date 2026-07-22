# page-turn

**Tier:** `remocn` (transition) · **Vibe:** paper · **Natural length:** 128f @ 30fps

A `TransitionPresentation` for `@remotion/transitions`. The exiting scene lifts and rotates up and away like a notebook page being turned, in quantized stop-motion poses, revealing the entering scene beneath.

## Install

```bash
shadcn add @remocn/page-turn
```

Lands at `components/remocn/page-turn.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `angle` | `number` | `-7` |
| `origin` | `string` | `"18% 100%"` |
| `poses` | `number` | `8` |

Pairs with `linearTiming({ durationInFrames: 24 })` — eight poses at three frames each.

## Example

```tsx
<TransitionSeries.Transition
  timing={linearTiming({ durationInFrames: 24 })}
  presentation={pageTurn()}
/>
```

## Use when

- Act breaks in paper or scrapbook stop-motion videos — the current page physically leaves and the next scene is already living beneath it.
- You want the outgoing scene to pass IN FRONT of the incoming one. This is the only transition in the catalog that does that: the exiting wrapper takes `zIndex: 2`, inverting the TransitionSeries default.

## Don't use when

- You need a smooth cinematic cut between UI scenes — use `whip-pan` or `push-through`.
- You want a dissolve — use the shader dissolve family.
- The entering scene needs its own entrance animation: here the reveal IS the entrance, and the entering scene is rendered untouched.
