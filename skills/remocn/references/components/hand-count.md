# hand-count

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 54f counting at the defaults, 270f as a scene

A counting number in the paper voice. Every pose the value advances and the digits are **written again** — same number, different hand. That re-drawing is the whole illusion; it is how a flipbook counter behaves and how no other number in the registry behaves.

## Install

```bash
shadcn add @remocn/hand-count
```

Lands at `components/remocn/hand-count.tsx`. Pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `to` | `number` | required |
| `from` | `number` | `0` |
| `delay` | `number` | `0` |
| `durationSteps` | `number` | `18` |
| `decimals` | `number` | `0` |
| `prefix` | `string` | `""` |
| `suffix` | `string` | `""` |
| `fontSize` | `number` | `96` |
| `color` | `string` | `"#26242c"` |
| `weight` | `400 \| 500 \| 600 \| 700` | `700` |
| `ease` | `"in-out" \| "out" \| "linear"` | `"in-out"` |
| `align` | `"left" \| "center"` | `"center"` |
| `fontFamily` | `string` | Caveat |
| `seed` | `string` | `"count"` |
| `step` | `number` | `3` |

The component fills its parent with `position: absolute; inset: 0` — give it a frame and it centres inside it.

`handCountDuration({ delay, durationSteps, step })` returns the frame the number actually **settles** on. That is not always `delay + durationSteps * step`: the stop-motion clock saturates on the quantized frame, so an off-grid `delay` pushes the landing to the next pose boundary. Size the `<Sequence>` from the helper, and keep `delay` a multiple of `step` so the two agree.

The value lands on `to` exactly, and the jitter freezes the moment it does — the settled number holds perfectly still.

`ease` defaults to `in-out`: it opens on a barely-there move, counts through the middle, and settles gently, so every pose carries a visible digit change. `out` front-loads hard — roughly a quarter of the count lands in the first pose and the tail barely moves — which suits a number arriving under something else. There is no spring mode: springs start fast by construction, and the overshoot would show a price climbing past its own figure before falling back.

Installed alongside `handwrite`, the Caveat face loads once (`@remotion/google-fonts` de-duplicates per family) and both render in the same hand.

## Example

```tsx
<HandCount to={19} prefix="$" decimals={2} suffix="/mo" delay={12} />
```

## Use when

- A stat, price, or count belongs in a hand-made scene — the number should arrive by being written, not by rolling.
- A paper pricing reveal or year-in-review needs its figure in the same voice as the rest of the shot.
- You want a unit or currency written in the same hand as the digits — `prefix` and `suffix` jitter along with them.

## Don't use when

- The scene is a slick product UI or a dashboard metric — use `rolling-number` or `number-wheel`, which glide a mechanical typeface.
- You need per-digit odometer choreography — that is `number-wheel`'s job.
- You need locale grouping separators (`1,000`) or full currency formatting; `prefix` and `decimals` are the whole surface here.
