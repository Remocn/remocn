# Stage and camera move

## Goal

Add two independent scene wrappers inspired by product-photography studios. `Stage` controls presentation: backdrop, perspective pose, contact shadow, floor reflection, and light. `Camera` controls sustained operator movement inside one scene. They compose without knowing about each other.

```tsx
<Camera moves={moves}>
  <Stage>
    <ProductScene />
  </Stage>
</Camera>
```

## Chosen approach

Use deterministic Remotion frame math and CSS transforms. This keeps both components compatible with arbitrary React children and avoids canvas capture, WebGL support checks, or a preset-only API. `Stage` exposes flat visual props so the existing customizer can render a control for every value. `Camera` keeps the storyboard-shaped `moves` array and gives its customizer a small preset selector that prints the corresponding array in the generated snippet.

Alternatives considered:

- A preset-only `Stage` would be easier to art-direct but would prevent callers from matching an existing brand or composition.
- A nested `appearance` object would group props neatly but would not fit the current flat customizer schema.
- Canvas or WebGL could produce richer lighting and blur, but would make arbitrary live React children harder to support and is unnecessary for a single-plane studio treatment.

## Stage

`Stage` renders five full-frame layers in this order: backdrop, floor reflection, contact shadow, subject, and lighting gradient. The subject is a single plane regardless of the depth of its descendants.

```ts
interface StageProps {
  children: ReactNode;
  backdrop?: string;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
  scale?: number;
  radius?: number;
  reflection?: number;
  shadow?: number;
  light?: number;
  className?: string;
}
```

The plane enters over 24 frames. Its opacity, vertical travel, scale, and final rotation settle with `SETTLE_SOFT` from `scene-motion`; values clamp before and after the entrance. `reflection`, `shadow`, and `light` are normalized strengths from 0 to 1. `radius` is a percentage of composition width, matching `Backdrop`. The backdrop accepts any CSS background value.

Reflection is a transformed duplicate of the subject beneath the floor line, faded with a CSS mask. It is marked inaccessible and non-interactive. Contact shadow is an elliptical blurred layer that follows the final pose. The light is a non-interactive gradient overlay.

## Camera move

`Camera` accepts `moves`, `shake`, and `seed`. An empty move list returns the neutral pose. Move coordinates describe the camera, so positive `x` moves the rendered content left. Pan is calculated in pixels from the unzoomed composition dimensions and applied outside the centered scale layer, keeping a quarter-frame pan consistent at every zoom.

```ts
interface CameraKey {
  at: number;
  x?: number;
  y?: number;
  zoom?: number;
  rotate?: number;
  easing?: EasingFunction;
}

interface CameraProps {
  children: ReactNode;
  moves?: CameraKey[];
  shake?: number;
  seed?: string;
}
```

Keys are copied and sorted by `at`. Duplicate frames use the last supplied key. Missing pose fields inherit the neutral values (`x: 0`, `y: 0`, `zoom: 1`, `rotate: 0`), not the previous key. Before the first key and after the last key, the pose clamps to that endpoint. Within the active segment, every field interpolates separately. The destination key's `easing` controls the arrival into that key and defaults to `EXPO`. Identical adjacent poses naturally create a hold.

Camera roll uses inverse content rotation, just like pan uses inverse translation. Zoom remains centered. The outer wrapper clips overflow; documentation tells users to provide enough content bleed for pull-backs and pans.

Handheld shake is deterministic. It combines two low-amplitude sine waves with seeded, smoothly interpolated noise from Remotion's `random()`. `shake` is clamped to 0–1 and affects translation plus a small roll. No `Math.random()` is used.

## Demos and documentation

`Stage` gets a product-card demo with direct controls for its flat props. `Camera` gets `push-in`, `orbit`, and `three-beat` presets. Its custom snippet expands the selected preset to the real `moves` array.

The layout index lists `Backdrop`, `Drift`, `Chat to Preview Layout`, `Stage`, and `Camera Move`. The new pages document composition with `CameraLens`, the text-resampling caveat from `Drift`, content bleed, clamp behavior, holds, and why camera move is not a transition. The changelog groups both additions under `### New components` and includes a live preview.

## Verification

Add focused tests for key sorting, duplicate frames, endpoint clamping, per-segment easing, holds, neutral empty moves, pre-zoom pan math, and deterministic shake. Then run:

```bash
bun run registry:build
bun test lib/docs-meta.test.ts
bun run typecheck
bun run lint
```
