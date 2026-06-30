# logo-enter

**Tier:** `remocn` (animation) · **Vibe:** social · **Natural length:** 90f @ 30fps

A stacked group of round, ring-bordered brand chips that spring in one-by-one (scale-up + small slide, staggered) and then hold. Ships a sample set of AI-tool marks so it renders immediately; swap the `logos` prop for your own inline-SVG marks. Enter-only — compose the exit with a transition.

## Install

```bash
shadcn add @remocn/logo-enter
```

Lands at `components/remocn/logo-enter.tsx`. Renders transparent — set the scene background with `backdrop`.

## Props

| Prop | Type | Default |
|---|---|---|
| `logos` | `Logo[]` | `SAMPLE_LOGOS` |
| `diameter` | `number` | `118` |
| `overlap` | `number` | `38` |
| `ringColor` | `string` | `"#0B0B0C"` |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` |
| `stagger` | `number` | `7` |
| `speed` | `number` | `1` |

## Example

```tsx
<LogoEnter logos={MY_LOGOS} orientation="horizontal" stagger={7} />
```

## Use when

- Showing a cluster of brand/partner/integration logos arriving together ("works with…", an AI-tool lineup, an icon cloud).
- A positioning or proof beat needs several marks to land as a stacked, overlapping group.
- You want logo chips that spring in and hold, with the exit owned by your `TransitionSeries` transition.

## Don't use when

- You need a single product wordmark lockup — this is a multi-chip cluster, not one mark; build a lightweight lockup or resolve kinetic text (`kinetic-center-build`, `per-character-rise`) into the name.
- You're depicting one specific brand's product UI — use the matching card (`chat-gpt`, `claude-code`, `v0`, `opencode`).
- The logos must orbit or scatter in 3D rather than stack — compose your own layout; this one stacks on a single axis.
