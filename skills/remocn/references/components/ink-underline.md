# ink-underline

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 120f @ 30fps

A free-standing ink stroke dragged across in a few stop-motion poses. The curve carries a per-seed wobble, so the same seed always draws the same hand. Place it under a headline, URL, or stat.

## Install

```bash
shadcn add @remocn/ink-underline
```

Lands at `components/remocn/ink-underline.tsx`. Pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `width` | `number` | required |
| `color` | `string` | `"#6f7f35"` |
| `thickness` | `number` | `9` |
| `pressure` | `number` | `1` |
| `release` | `number` | `0.15` |
| `grain` | `number` | `1` |
| `delay` | `number` | `0` |
| `durationSteps` | `number` | `5` |
| `seed` | `string` | `"ink"` |
| `step` | `number` | `3` |

Renders in normal flow as a block of `width` by `thickness + 4` — stack it in a flex column, no positioning needed.

## Example

```tsx
<InkUnderline width={420} delay={handwriteDuration("remocn.dev")} />
```

## Use when

- A hand-dragged ink underline belongs beneath a written headline, URL, or stat — pairs with `handwrite`, with `delay` set from `handwriteDuration`.
- The scene already runs on the stop-motion clock and the stroke should arrive in the same discrete poses.

## Don't use when

- You are painting a highlight behind a word inside a sentence — use `marker-highlight`.
- You want to circle or strike through something: neither is this component.
