# Plan 019: paper-field — the warm xerox-paper backdrop

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: S
- **Depends on**: 014
- **Category**: feature
- **Section**: Layout

## Goal

The desk every paper scene sits on: a warm paper field whose soft blotches
breathe on the stop-motion clock, with a faint page-edge vignette. This is
the kit's one background component (explicit exception to the
no-component-background rule, same as `backdrop`).

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/paper.tsx` lines
13–45 (`PaperField`).

## API (contract)

```ts
export type PaperBlot = {
  x: number;        // % of width
  y: number;        // % of height
  r: number;        // radius, % of width
  opacity: number;
  seed: string;
};

export interface PaperFieldProps {
  color?: string;        // "#f1eee7"
  blotColor?: string;    // "rgb(120,112,96)"
  blots?: PaperBlot[];   // defaults to the demo's 4-blot preset
  breathe?: number;      // 0.5 px of per-pose blot drift
  vignette?: boolean;    // true
  step?: number;         // 3
}

export function PaperField(props: PaperFieldProps): React.ReactElement;
```

## Behavior

- `AbsoluteFill` with `background: color`.
- Each blot renders as a radial-gradient layer at `(x + j.x)% (y + j.y)%`
  where `j = paperJitter(frame, "paper:" + seed, { amp: breathe, rotAmp: 0, step })`
  — the blotches breathe one pose at a time. Gradient fades `blotColor` at
  `opacity` to transparent at 70%, ellipse `r% × r*0.8%`.
- Default preset = the demo's four blots
  (`{22,18,46,0.05} {74,62,52,0.045} {38,86,40,0.04} {88,14,34,0.035}`).
- `vignette` adds the demo's page-edge gradient (transparent to
  `rgba(96,88,72,0.1)` at the corners).
- The blotches are paper texture at ≤5% opacity, not decorative glows — keep
  the opacities in that range in docs examples too.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/layout/paper-field.mdx`; add `"paper-field"` to
`content/docs/layout/meta.json` (pages become
`["index", "backdrop", "drift", "paper-field"]` — keep existing order, append).

- title `Paper Field`
- description `A warm paper backdrop whose blotches breathe on the stop-motion clock`
- Usage: as the scene root under handwrite/sticker content; note it replaces
  `Backdrop` for paper scenes, not stacks with it.

## Customizer config

Controls: `color` (color), `blotColor` (color), `breathe` (number 0–3, step
0.1), `vignette` (boolean), `step` (number 1–6). Duration ~90f.

## Skill reference

Row in **Backgrounds & Effects**:

- Use for: the warm xerox-paper desk under stop-motion scrapbook scenes —
  pairs with `handwrite`, `paper-sticker`, `polaroid`.
- Avoid for: dark, techy, or neon scenes → shader backgrounds
  (`shader-grain-gradient` etc.).
- Deps: `@remocn/stop-motion`.

## components.mdx

Card under **Layout**: name `PaperField`, href `/docs/layout/paper-field`,
status `stable`.

## Tests

None (rendering only; jitter covered by plan 014).

## Acceptance criteria (owner verifies)

1. Field reads as warm paper, blotches shift subtly once per pose.
2. `blots={[]}` yields a flat color field; custom presets render where told.
3. Standard: typecheck, biome, registry drift clean.

## Out of scope

- Ruled/grid/graph-paper variants, coffee stains (rejected from backlog).
- Any content slot — it is a background, `children` not accepted.
