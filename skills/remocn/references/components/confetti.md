# confetti

**Tier:** `remocn` (animation) · **Vibe:** playful · **Natural length:** 90f @ 30fps

Deterministic confetti burst overlay for Remotion — seeded particles with gravity, spin, and flutter so every render is frame-identical. Layer it over any scene as a celebratory one-shot effect.

## Install

```bash
shadcn add @remocn/confetti
```

Lands at `components/remocn/confetti.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `particleCount` | `number` | `140` |
| `colors` | `string[]` | `DEFAULT_COLORS` |
| `originX` | `number` | `0.5` |
| `originY` | `number` | `0.5` |
| `startFrame` | `number` | `0` |
| `lifetime` | `number` | `90` |
| `power` | `number` | `17` |
| `gravity` | `number` | `0.45` |
| `size` | `number` | `13` |
| `seed` | `number` | `1` |

## Example

```tsx
<AbsoluteFill>
  <Backdrop fill="#0f0f0f" padding={0}>
    <SoftBlurIn text="You shipped it!" color="#fafafa" />
  </Backdrop>
  <Confetti particleCount={200} originX={0.5} originY={0.3} power={22} />
</AbsoluteFill>
```

## Use when

- A milestone moment needs a celebratory payoff — product launch, plan completion, success screen.
- You want a deterministic particle burst that renders identically on every export pass (seed-controlled).
- The effect should fire mid-composition at a specific frame via `startFrame`.

## Don't use when

- The video has a clean, minimal, or corporate tone — confetti reads as celebration-specific and breaks professional pacing; use a subtle shader backdrop like `shader-grain-gradient` instead.
- You need a looping ambient particle background — confetti is a one-shot burst with gravity falloff, not a loop; use `shader-dot-orbit` for sustained motion.
- The burst should originate from a specific UI element offscreen — `originX`/`originY` are normalized 0–1 to the frame, not element-relative; compose with `AbsoluteFill` positioning instead.
