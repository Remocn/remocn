# crumple-toss

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 48f to crumple and throw at the defaults, 90f as a scene

Crushes an element into a ball of paper and throws it out of frame. Everything else in the kit **arrives** — this is the only way to take one thing off the desk while the scene around it keeps running.

It unlocks the beat product videos lean on: *this is how it used to work* → crumple → *here is the new way*. Stack the replacement behind it and it is revealed as the ball leaves.

## Install

```bash
shadcn add @remocn/crumple-toss
```

Lands at `components/remocn/crumple-toss.tsx`. Pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `children` | `React.ReactNode` | required |
| `width` | `number` | required |
| `height` | `number` | required |
| `at` | `number` | required |
| `segments` | `number` | `9` |
| `randomness` | `number` | `0.6` |
| `crumpleSteps` | `number` | `7` |
| `tossSteps` | `number` | `9` |
| `direction` | `number` | `-35` |
| `distance` | `number` | `900` |
| `spin` | `number` | `220` |
| `crushTo` | `number` | `0.34` |
| `seed` | `string` | `"toss"` |
| `step` | `number` | `3` |

The children are never touched — all motion lives on the wrapper — so a `polaroid`, a chart, or a whole composed card can be thrown unmodified.

`direction` is screen-space: `0` throws right, **negative throws upward**, past `±90` throws left. `distance` is the **scale of the arc, not the pixels travelled** — gravity is added on top of the launch, so a `distance` of 900 puts the ball 737px right and 294px down.

The card is **sliced into wedges** radiating from its centre; each wedge carries its own copy of the content, clipped to its slice, and folds inward while rotating and shrinking. The wad *is* the card, folded — there is no hide-the-card-and-show-a-ball swap, which is visible as a cut. At rest the wedges tile the card exactly, so nothing shows before `at`. Each panel picks up a tone from a small palette as it folds, giving lit faces and shadowed creases instead of a flat blob.

`width` and `height` are required because the fold geometry is in pixels and measuring the child would not survive Remotion's server-side render — the same call `scribble-circle` makes. `segments` sets how many pieces the paper tears into; `crushTo` is the size of the finished wad as a fraction of the shorter side. `randomness` is how uneven the fold is — at `0` every wedge folds identically and `seed` stops mattering entirely; at `1` the wedges tear at uneven angles, tilt hard, and land at different depths.

Opacity drops once on the final flight pose and then the component **returns null**. In absolute positioning that is invisible; in normal flow the box collapses on that frame, so wrap it in an `<AbsoluteFill>` or a sized container if the layout must hold.

## Example

```tsx
<div style={{ position: "relative", width: 380, height: 220 }}>
  <div style={{ position: "absolute", inset: 0 }}>
    <NewWayCard />
  </div>
  <div style={{ position: "absolute", inset: 0 }}>
    <CrumpleToss width={380} height={220} at={6}>
      <OldWayCard />
    </CrumpleToss>
  </div>
</div>
```

## Use when

- Discarding something on screen — the old plan, the wrong answer, the previous version.
- Building a before/after beat where the replacement is revealed as the ball leaves.

## Don't use when

- You want a general element exit in a clean UI scene — this one is loud and physical; use a fade instead.
- You need a scene-level exit that replaces the whole frame — that is `page-turn`. This is **not** a `TransitionPresentation` and does not belong in a `<TransitionSeries>`.
- You want the ball to land, bounce, or hit a wastebasket; none of that is here.
