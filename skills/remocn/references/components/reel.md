# reel

**Tier:** `remocn` (animation) · **Vibe:** clean · **Natural length:** 160f @ 30fps

A fixed centered card where an ordered list of images stacks on the z-axis and each reveals over the last via a centre-out mask that expands from its middle. No camera move — the mask is the only motion.

## Install

```bash
shadcn add @remocn/reel
```

Lands at `components/remocn/reel.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `images` | `string[]` | required |
| `width` | `number` | `1180` |
| `height` | `number` | `676` |
| `radius` | `number` | `16` |
| `step` | `number` | `20` |
| `reveal` | `number` | `13` |
| `objectPosition` | `string` | `"top"` |
| `background` | `string` | `"#050506"` |

## Example

```tsx
<Reel images={[staticFile("shot-1.png"), staticFile("shot-2.png"), staticFile("shot-3.png")]} />
```

## Use when

- Showing a sequence of screenshots or product shots that should bloom open one over the last in a fixed frame.
- The story is "here's what the product looks like" across several views without a camera move.
- You want the reveal itself (the centre-out mask) to be the only motion in the scene.

## Don't use when

- You need a single framed photo rather than a sequence — use `polaroid` instead.
- You want a scrolling wall of items rather than a stacked reveal — use `infinite-marquee` or `perspective-marquee` instead.
