# remocn Anti-Patterns

Common mistakes when generating remocn videos. Each is something the model tends to do wrong.

## 1. Clipping a component by under-budgeting its Sequence

Every component has a natural length (the `Length` column in `components/index.md`, and the
`Natural length` meta line in each `components/<name>.md`). Budget the `Sequence` around it.

```tsx
// ❌ blur-out-up needs ~90f, gets cut at 30
<Sequence durationInFrames={30}><BlurOutUp text="Launch" /></Sequence>
// ✅
<Sequence durationInFrames={90}><BlurOutUp text="Launch" /></Sequence>
```

## 2. Mounting a transition as a component

Transitions are presentations for `@remotion/transitions` — pass them to `TransitionSeries.Transition`, never mount them directly.

```tsx
// ❌
<WhipPan />
<SceneB />
// ✅
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={70}><SceneA /></TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 26 })}
    presentation={whipPan()}
  />
  <TransitionSeries.Sequence durationInFrames={70}><SceneB /></TransitionSeries.Sequence>
</TransitionSeries>
```

## 3. Animation-tier props on a UI Primitive

Primitives (`remocn-ui`) are state-based and have **no `speed`**. Drive them with `state`.

```tsx
// ❌
<Dialog speed={2} />
// ✅
<Dialog state="open" />
```

## 4. Wrong canvas size

The standard composition is `1280×720 @ 30fps`. Components are laid out for it. Don't invent
`1920×1080` and wonder why things are off-center.

## 5. Animating layout properties

Animate `transform` (and individual `translate`/`scale`), never `top`/`left`/`width`/`height` —
layout animation reflows every frame and breaks split layouts.

```tsx
// ❌ left: interpolate(frame, [0,30], [0,200])
// ✅ transform: `translateX(${interpolate(frame,[0,30],[0,200])}px)`
```

## 6. Non-deterministic code

Renders are multi-pass — `Math.random()`, `setInterval`/`setTimeout`, `Date.now()` all produce
flicker or diverging frames.

```tsx
// ❌ const x = Math.random();
// ✅ import { random } from "@remotion/random"; const x = random(`seed-${frame}`);
```

## 7. Mishandling registryDependencies

Dependencies install **automatically** — don't tell the user to add them manually, and don't
inline-copy a dependency's code. Also: don't import deeper than one path segment
(`@/components/remocn/<name>`); the tsconfig glob doesn't resolve `<name>/helpers`.

## 8. Loading fonts mid-render

Load fonts once before render via `@remotion/google-fonts` (`loadFont()`), not inside a component
body per frame. Unloaded fonts flash fallback in the export.

## 9. Hardcoding a background on a component

remocn components render **transparent** — they don't own a background. Set the scene background
with `backdrop` (or your own container), not by hardcoding a fill into the component.

## 10. Slop styling on your own additions

ALL-CAPS + wide tracking + gradient text + glow shadows on text *you* add. See `design.md`.

## 11. Everything enters on one frame

Stagger sibling entrances (3–6f). Landing a whole group simultaneously reads robotic. See
`motion-principles.md` → Follow-Through & Overlapping Action.
