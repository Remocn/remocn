# `cursor` — verification tests

Pure / deterministic verification for the `cursor` component
(`registry/remocn-ui/cursor/`). The render path (`index.tsx`) is a **pure
renderer** — it never reads the frame — but it imports `useRemocnTheme` which
pulls React context that cannot run headlessly. So render is NOT exercised
here. This suite covers the pieces that ARE pure: the exported `cursorPathAt`
core, the `ripplePhase` / `clickPress` phase presets, and `cursorConfig.snippet`
codegen.

## Animation model — value-channel cursor

Cursor follows the **value-channel** deviation from the state-atom pattern:

**Value path** (`style?: CursorStyle` prop):  
`<Cursor>` is a frame-free pure renderer. The animated `CursorStyle` (position,
ripple phase, press scale) is fed in from the caller. The component does not
know whether the style came from a resting preset or a live interpolated frame.

**Hook** (`useCursorPath`):  
The caller uses `useCursorPath(waypoints, opts)` which reads `useCurrentFrame()`
once and delegates to the pure core `cursorPathAt(waypoints, raw, opts)`. The
pure core is exported and directly tested here by injecting `raw`.

**Pure core** (`cursorPathAt`):  
`useCursorPath` is exactly `cursorPathAt(waypoints, useCurrentFrame() * speed, opts)`.
The tests replicate this by calling `cursorPathAt` with an explicit `raw` frame.
This is the MIRROR pattern (see STYLE-GUIDE §10): no replica needed since the
pure core is directly exported.

**Phase presets** (`ripplePhase`, `clickPress`):  
Exported pure functions — no frame reading, no side effects, tested directly.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/cursor/__tests__
```

`cursor.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **Constants** — `DEFAULT_DURATION=24`, `CLICK_FRAMES=16`, `PRESS_FRAMES=8`.

- **`ripplePhase(sinceClick)`** — exported pure preset (mirrors
  `use-cursor-path.ts` lines 59-71). Asserts: zero opacity/scale before a
  click and at/past `CLICK_FRAMES`; opacity=0.5 and scale=0 at the click
  moment (sinceClick=0); correct numeric values at the midpoint and near
  expiry; opacity decreases monotonically and scale increases monotonically
  across the full window.

- **`clickPress(sinceClick)`** — exported pure preset (mirrors
  `use-cursor-path.ts` lines 78-86). Asserts: returns 1 before the click and
  at/past `PRESS_FRAMES`; 1 at frame 0; 0 (fully pressed) at the half-way
  dip; non-zero and less-than-1 near the end; down-then-up triangle shape via
  monotonicity checks on the down and up phases.

- **`cursorPathAt(waypoints, raw, opts)`** — pure core of `useCursorPath`
  (mirrors `use-cursor-path.ts` lines 111-188). Asserts:
  - Empty waypoints: returns origin with scale=1, no ripple.
  - Before first arrival: cursor parks at `first.x/y`, pressScale=1.
  - Move window interpolation: correct lerped x/y at t=0, t=0.5, t=1 with
    default `inOut` easing.
  - Easing override: `linear` and `out` produce distinct positions at the
    midpoint; numerics match the easing formula.
  - Custom per-waypoint `duration`: narrower window shifts the interpolation
    midpoint; `opts.defaultDuration` changes the effective window.
  - `scale` invariant: always 1 (pressedScale is computed by the component).
  - Click visuals: rippleOpacity=0 before the click waypoint; 0.5 at arrival
    (sinceClick=0); decays to 0 after CLICK_FRAMES; pressScale dips to 0 at
    PRESS_FRAMES/2 and returns to 1 at PRESS_FRAMES.
  - Multiple clicks: only the most recent active click determines the ripple.
  - Press/drag: `press:true` on the FROM waypoint sets pressScale=0 until the
    next waypoint arrives; resets to 1 afterward.
  - Speed contract: `speed=2` halves the raw frame needed to reach a waypoint;
    `speed=0.5` doubles it; `speed=1` matches the no-option default.
  - Three-waypoint path: correct segment selection and position ranges at each
    boundary.

- **`cursorConfig.controls`** — control wiring assertions: `variant` is a
  `select` with options `["arrow","pointer"]` and default `"arrow"`; `size` is
  a `number` with default 28, min 16, max 64; `mode` is a `select` with
  options `["light","dark"]` and default `"light"`; `rippleColor` is a `color`
  with default `"#171717"`.

- **`cursorConfig.snippet`** — pure JSX string builder. Asserts: both import
  lines (`Cursor` and `useCursorPath`) are present with correct paths;
  `<Cursor` element and `style={style}` prop always appear; ends with `/>`;
  default props (`variant="arrow"`, `size=28`, `mode="light"`) are omitted;
  non-default props are emitted with correct JSX syntax.

**Cursor render** is a pure `(style) => visual` observable only via Remotion
render; it is not unit-tested here.

## Import strategy

`cursor.test.ts` imports via **relative paths**:

- `../use-cursor-path` — relative, for `cursorPathAt`, `ripplePhase`,
  `clickPress`, `DEFAULT_DURATION`, `CLICK_FRAMES`, `PRESS_FRAMES`,
  `CursorWaypoint`
- `../config` — relative, for `cursorConfig`

Neither `cursorPathAt` nor `ripplePhase` nor `clickPress` call
`useCurrentFrame()` at import time or at call time — `useCursorPath` is the
only frame-reading export, and we do not import it. `bun test` resolves tsconfig
`paths`, so the `@/lib/remocn-ui` alias is available when needed but not used
in this file.

## Determinism grep checklist (run manually; must print NOTHING)

`cursor/index.tsx` is a pure renderer — the component must contain **none** of
the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/cursor/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-cursor-path.ts` is the frame-reading hook file. It intentionally calls
`useCurrentFrame()` inside `useCursorPath` — this is the correct and only place
in the cursor package where the frame is read. The pure exported surface
(`cursorPathAt`, `ripplePhase`, `clickPress`) does NOT call `useCurrentFrame`.

Tier-wide sweep for `index.tsx`:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/cursor/index.tsx registry/remocn-ui/core/*.ts
```
