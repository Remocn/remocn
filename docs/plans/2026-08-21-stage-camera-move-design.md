# Stage with an integrated camera

## Goal

Build one installable `Stage` component that turns a screenshot, recording, or live React scene into a studio-shot video. The studio presentation and operator movement are one experience: a static stage without a usable camera path is not the product promised by the ui.camera reference.

`camera-move` is not a registry item. Its keyframe math, deterministic handheld motion, demos, documentation, and tests belong to `stage`.

## Chosen approach

`Stage` renders one explicit content plane and moves a camera target across it. The plane may be much taller than the composition. Camera keys address normalized points on that plane: `y: 0` is its top and `y: 1` is its bottom. This keeps a storyboard independent of the screenshot's pixel dimensions and makes long-site tours readable.

Alternatives considered:

- `scrollFrom` and `scrollTo` would be simpler but could not express holds, returns, or differently eased sections.
- A nested `Stage.Camera` API would preserve separate concepts but would recreate the split the unified component is meant to remove.
- Scrolling content inside a fixed tilted viewport would be easier to implement, but it reads as webpage scrolling rather than a camera flying over a stationary product surface.

## Public API

```ts
interface StageKey {
  at: number;
  x?: number;
  y?: number;
  zoom?: number;
  rotate?: number;
  easing?: EasingFunction;
}

interface StageProps {
  children: ReactNode;
  contentSize?: { width: number; height: number };
  moves?: StageKey[];
  shake?: number;
  seed?: string;

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

`contentSize` is the plane's logical aspect ratio. The plane is fitted to the stage width and its full height is derived from that ratio. When omitted, it defaults to the current composition dimensions.

`x` and `y` select the point on the plane held at the composition centre. Both default to `0.5` and clamp to `0..1`. `zoom` defaults to `1`; `rotate` is camera roll and defaults to `0`. The destination key's `easing` controls arrival into that key and defaults to `EXPO` from `scene-motion`.

`moves={[]}` produces a static centred shot. Keys are sorted by `at`, duplicate frames use the last supplied key, endpoints clamp, and identical adjacent poses create a hold. `shake` clamps to `0..1` and combines seeded smooth noise with low-frequency sine motion. It never calls `Math.random()`.

## Geometry and layers

The outer stage is the camera viewport and clips overflow. A content plane is centred in composition coordinates, scaled to a useful studio width, and given an explicit pixel height from `contentSize`. For every frame, Stage calculates the target point on that plane, moves it to the composition centre, and makes it the transform origin. Zoom, camera roll, and the stronger studio perspective therefore happen around the current target rather than around the centre of a several-thousand-pixel element.

The default pose is deliberately stronger than the first implementation: approximately `rotateX: 14`, `rotateY: -20`, `perspective: 900`. A 24-frame `SETTLE_SOFT` entrance blends into the sustained camera path. The component's documented length is `sustained`, because camera movement may span the entire Sequence.

Layers remain backdrop, floor reflection, contact shadow, content plane, and light. Reflection and shadow describe the visible studio area and do not require mounting `children` twice. This keeps live React scenes and media safe.

## Demo asset and customizer

The preview uses an optimized full-page WebP capture of the live `remocn.dev` homepage. At design time the page is approximately `1265 x 9164`. The screenshot is stored as a local public asset so Remotion renders are deterministic and do not depend on the live site or network.

The demo lasts about 300 frames and follows several beats from hero to lower sections. Its key list contains holds so the tour reads as an operator choosing details rather than an automated scroll.

The customizer exposes one storyboard preset selector plus the stage pose and handheld controls. Its generated snippet prints the real `contentSize` and `moves` array. There is no `camera-move` preview or configuration.

## Registry and documentation migration

Remove `camera-move` from:

- `registry/remocn/registry.json`
- `registry/__index__.tsx` and the generated preview manifest
- registry artifacts
- layout navigation, cards, and component documentation
- changelog wording that presents it as a separate component

The Stage page becomes the single source of truth for camera coordinates, long content, holds, easing, deterministic shake, text resampling, content bleed, and composition with `CameraLens`.

## Verification

Move camera tests under `stage` and cover:

- key sorting and duplicate frames;
- empty moves and endpoint clamps;
- per-segment easing and holds;
- normalized top, centre, and bottom targets on a tall plane;
- transform origin and translation for long content;
- camera pan before zoom;
- deterministic seeded shake;
- safe fallbacks for invalid `contentSize`.

Then run registry build, preview-manifest build, docs metadata tests, focused Stage tests, typecheck, lint, production build, and visual inspection of the long-site tour.
