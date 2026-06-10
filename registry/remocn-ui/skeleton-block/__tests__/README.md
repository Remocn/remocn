# `skeleton-block` — verification tests

Pure / deterministic verification for the `skeleton-block` component
(`registry/remocn-ui/skeleton-block/`).

## Why render is NOT unit-tested

`SkeletonBlock` is a **motion atom** — it is the only file in the skeleton
primitive family explicitly allowed to read the frame. It calls
`useCurrentFrame()` directly (index.tsx line 52) and also calls
`useRemocnTheme()`. Neither can be invoked outside a Remotion render context,
so the render path is excluded from unit tests (STYLE-GUIDE §10).

The shimmer offset computation is module-private:

```ts
// index.tsx lines 52-54
const frame = useCurrentFrame() * speed;
const progress = (frame % SWEEP_FRAMES) / SWEEP_FRAMES;
const positionX = 100 - progress * 200;
```

`SWEEP_FRAMES` (60) and `positionX` are not exported. The seamless-loop
property and monotonicity within a cycle are documented below for manual
verification; they cannot be exercised by a unit test without a render
context.

## Shimmer math — documented for manual verification

| Property | Value / Formula |
|----------|-----------------|
| `SWEEP_FRAMES` | 60 (one full sweep at speed=1) |
| `progress` | `(frame * speed % 60) / 60` — wraps every 60 effective frames |
| `positionX` | `100 - progress * 200` — travels from 100% to −100% across one period |
| Frame 0 | `positionX = 100%` |
| Frame 30 (mid) | `positionX = 0%` |
| Frame 60 (loop end) | `positionX = 100%` (60 % 60 = 0 → same as frame 0) |

**Seamless-loop invariant:** `positionX(frame=0) === positionX(frame=60)`.
Because the gradient is 200% wide and tiles, position 100% and −100% are
visually identical — the loop wraps without a jump.

**Monotonic within a cycle:** `positionX` decreases strictly from 100% to
(approaching) −100% as `frame` goes from 0 to 59. The highlight band sweeps
left→right on screen.

**Speed contract:** `speed > 1` compresses the cycle: at `speed=2`, one full
sweep takes 30 raw frames (`effective = raw * speed`).

These properties are verified by reading the source and the numeric table
above. To confirm in a real render, set up a Remotion composition with
`<SkeletonBlock />` and scrub from frame 0 to frame 60.

## Pure surface that IS tested

Only `skeletonBlockConfig` (from `config.ts`) is a pure value and is
unit-tested. `config.ts` imports no React hooks and has no side effects.

## How to run

```bash
bun install
bun test registry/remocn-ui/skeleton-block/__tests__
```

## What is covered

- **`skeletonBlockConfig.controls`** — control wiring: `width` is a `number`
  control with default=240, min=40, max=600; `height` is a `number` control
  with default=20, min=8, max=120; `radius` is a `number` control with
  default=6, min=0, max=60.

- **`skeletonBlockConfig.snippet`** — pure JSX string builder. Asserts:
  `import { SkeletonBlock }` from the correct path; `<SkeletonBlock` element
  ending with `/>` (self-closing); default `width=240`, `height=20`, and
  `radius=6` are omitted; when all props are default the element is the
  compact form `<SkeletonBlock/>`; non-default width/height/radius are emitted
  with the correct values; only changed props are emitted when some are
  default; numeric round-trips for width.

## Import strategy

`skeleton-block.test.ts` imports only:

- `../config` — relative, for `skeletonBlockConfig`

`SkeletonBlock` itself is NOT imported — it calls `useCurrentFrame()` and
`useRemocnTheme()` which require a Remotion render context.

## Determinism note

`skeleton-block/index.tsx` legitimately reads `useCurrentFrame()` — it is the
motion atom for the skeleton primitive. This is by design, not a violation.
The determinism grep target for this primitive is `skeleton/index.tsx` (the
state atom parent), NOT `skeleton-block/index.tsx`.

For completeness, `skeleton-block/index.tsx` must NOT contain any of:
`useState`, `useEffect`, `onClick`, `onChange`, `addEventListener`,
`Date.now`, `Math.random`, `requestAnimationFrame` (non-deterministic
patterns). `useCurrentFrame()` is the single frame-reading call and is
expected. Run:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/skeleton-block/index.tsx
```

Expected: **no output** (only `useCurrentFrame` is present, which is correct).
