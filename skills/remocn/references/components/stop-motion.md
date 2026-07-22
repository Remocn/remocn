# stop-motion (core library)

**Tier:** `remocn` (shared core) · Not a visual component.

The quantized clock behind the stop-motion kit. Instead of a smooth 30fps timeline, everything samples a stepped clock — one pose every `step` frames (default `3`, so 10 poses per second at 30fps). Springs sampled on that clock keep their overshoot as hand-placed poses, and every object gets a per-pose paper jitter: the reshoot wobble of a photo that was picked up and put back down.

## Install

```bash
shadcn add @remocn/stop-motion
```

You rarely install it directly — it is pulled transitively as a `registryDependency` whenever you add a stop-motion component (`handwrite`, `paper-wobble`, `polaroid`, `page-turn`, …). It lands at `lib/remocn/stop-motion.ts` and is imported as `@/lib/remocn/stop-motion`.

## Exports

| Export | What it does |
|--------|--------------|
| `DEFAULT_STEP` | `3` — frames per pose, the kit-wide tempo default |
| `qf(frame, step?)` | quantized frame: `floor(frame / step) * step` |
| `qstep(frame, step?)` | quantized pose index: `floor(frame / step)` |
| `hash01(seed)` | deterministic `0..1` from a string seed |
| `hashRange(seed, lo, hi)` | deterministic value inside `[lo, hi]` |
| `paperJitter(frame, seed, { amp?, rotAmp?, step? })` | per-pose `{ x, y, rot }` wobble; `amp` in px (default `1.4`), `rotAmp` in degrees (default `0.35`) |
| `steppedSpring({ frame, fps, delay?, step?, config? })` | a Remotion `spring()` that only moves when the clock ticks |
| `steppedRamp(frame, from, to, { ease?, step? })` | quantized `0..1` progress over `[from, to]` |

## Example

```tsx
import { useCurrentFrame, useVideoConfig } from "remotion";
import { paperJitter, steppedSpring } from "@/lib/remocn/stop-motion";

export const Card = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = steppedSpring({ frame, fps, delay: 6 });
  const wobble = paperJitter(frame, "card");

  return (
    <div
      style={{
        opacity: enter,
        transform: `translate(${wobble.x}px, ${wobble.y}px) rotate(${wobble.rot}deg) scale(${enter})`,
      }}
    />
  );
};
```

## Use when

- You are authoring your own paper/stop-motion element and want it to share the kit's tempo and wobble instead of re-implementing them.
- You need deterministic randomness — `hash01` / `hashRange` give the same value on every render, so server renders and browser previews match.

## Don't use when

- You just want to use an existing stop-motion component — add the component (`shadcn add @remocn/<name>`); this lib comes along automatically.
- Your animation should run smooth. The whole point of this clock is that it does not.
