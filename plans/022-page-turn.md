# Plan 022: page-turn — the notebook page swings away

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: M
- **Depends on**: 014
- **Category**: feature
- **Section**: Transitions

## Goal

A `TransitionPresentation` for `@remotion/transitions`: the exiting scene
lifts up and away like a notebook page being turned, in quantized stop-motion
poses, revealing the entering scene beneath. Replaces the demo's ad-hoc
`PageExit` wrapper with a proper catalog transition.

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/paper.tsx` lines
84–103 (`PageExit`: translateY to -920 on 720p, rotate -7deg, origin
`18% 100%`, ease-in cubic over 24 frames = 8 poses).

## API (contract)

```ts
export type PageTurnProps = {
  angle?: number;    // -7 deg rotation at full lift
  origin?: string;   // "18% 100%" transform origin
  poses?: number;    // 8 discrete stop-motion poses
};

export function pageTurn(
  props?: PageTurnProps,
): TransitionPresentation<PageTurnProps>;
```

File shape mirrors `registry/remocn/push-through/index.tsx` (typed
presentation component + factory export).

## Behavior

- **Z-order is the point**: the EXITING wrapper gets `zIndex: 2` so the page
  stays above the scene it reveals — the opposite of the TransitionSeries
  default where entering paints on top. The entering wrapper renders children
  untouched (`zIndex` auto, no transform).
- Exit transform: `translateY(-p * height * 1.28) rotate(angle * p)` with
  `transformOrigin: origin`; `height` from `useVideoConfig()` (the demo's
  920px on a 720-tall comp ≈ 1.28×height).
- Ease-in cubic applied to progress, then progress is quantized to `poses`
  discrete values (`floor(eased * poses) / poses` style) so the page moves in
  hand-shot jumps regardless of the timing function the user picks. `poses`
  defaults to 8, matching the demo's 24-frame turn at step 3.
- Recommended pairing in docs: `linearTiming({ durationInFrames: 24 })`.

## Registry entry

Standard shape of the other transitions. `registryDependencies:
["@remocn/stop-motion"]` only if the implementation actually imports the core
(quantization here is progress-based, so it likely needs nothing — then omit
registryDependencies and keep `dependencies: ["remotion", "@remotion/transitions"]`,
matching push-through).

## Docs page

`content/docs/transitions/page-turn.mdx`; add `"page-turn"` to
`content/docs/transitions/meta.json`.

- title `Page Turn`
- description `The exiting scene swings up and away like a notebook page in stop-motion poses`
- Usage: `TransitionSeries` with two paper scenes, `pageTurn()` +
  `linearTiming({ durationInFrames: 24 })`; call out the z-order behavior
  (exiting stays on top by design).

## Customizer / preview

Transitions preview through example scenes:
`components/docs/examples/page-turn-example.tsx` (two contrasting paper
scenes A → B, modeled on `push-through-example.tsx`), loaded from
`registry/__index__.tsx` with a `config.ts` whose controls follow the other
transition configs (`angle` -20–20, `poses` 2–16, plus whatever shared
controls `push-through`/`focus-pull` expose — match at implementation).

## Skill reference

Row in **Transitions**:

- Use for: act breaks in paper/scrapbook stop-motion videos — the current
  page physically leaves and the next scene is already living beneath.
- Avoid for: smooth cinematic cuts between UI scenes → `whip-pan`,
  `push-through`; dissolves → the shader dissolve family.
- Deps: `@remotion/transitions`.

## components.mdx

Card under **Transitions → Camera Motion**: name `PageTurn`, href
`/docs/transitions/page-turn`.

## Tests

Quantization helper extracted pure and covered: `poses` bucketing hits 0 and
1 exactly at the ends, is monotonic, and produces exactly `poses` distinct
values.

## Acceptance criteria (owner verifies)

1. In the docs preview the outgoing page visibly stays ABOVE the incoming
   scene while lifting away.
2. Motion happens in discrete poses, not a smooth sweep; `poses` control
   changes the pose count.
3. Works inside `TransitionSeries` with both `linearTiming` and
   `springTiming` without breaking pose quantization.
4. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- An entering-side animation (the reveal IS the entering animation).
- Page curl/fold 3D deformation.
- The standalone `PageExit`-style wrapper (rejected — TransitionSeries covers
  it; an outro can transition into a bare `paper-field` scene).
