# Plan 016: ink-underline — an ink stroke dragged across in a few poses

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: S
- **Depends on**: 014
- **Category**: feature
- **Section**: Typography

## Goal

A standalone hand-dragged ink underline that draws itself across in a few
stop-motion poses. Distinct from `marker-highlight` (a paint swipe BEHIND a
word inside a sentence): this is a free-standing stroke you place under a
headline, URL, or number.

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/ink.tsx` lines
99–142 (`MarkerStroke`).

## API (contract)

```ts
export interface InkUnderlineProps {
  width: number;
  color?: string;         // "#6f7f35"
  thickness?: number;     // 9
  delay?: number;         // 0
  durationSteps?: number; // 5 poses to draw
  seed?: string;          // "ink"
  step?: number;          // 3
}

export function InkUnderline(props: InkUnderlineProps): React.ReactElement;
```

## Behavior

- SVG cubic path across `width` with a per-seed vertical wobble
  (`hashRange(seed + ":w", -1.2, 1.2)`), `strokeLinecap: round`,
  opacity `0.82`.
- Draw progress = `steppedRamp(frame, delay, delay + durationSteps * step)`
  with ease-out cubic, applied via `pathLength/strokeDasharray/strokeDashoffset`.
- Hidden (opacity 0) until the first pose.
- Renders in normal flow (a `div` of `width × thickness + 4`), so it stacks
  under text in a flex column exactly like the demo.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/typography/ink-underline.mdx`; add `"ink-underline"` to
`content/docs/typography/meta.json` right after `"marker-highlight"`.

- title `Ink Underline`
- description `A hand-dragged ink stroke that draws itself across in a few stop-motion poses`
- Usage: paired with `Handwrite` under a written URL (mirror the demo's
  finale), delay set from `handwriteDuration`.

## Customizer config

Controls: `width` (number 100–800), `color` (color), `thickness` (number
2–24), `durationSteps` (number 2–10), `seed` (text), `step` (number 1–6).
Duration ~60f.

## Skill reference

Row in **Text Animations**:

- Use for: a hand-dragged ink underline beneath a written headline, URL, or
  stat — pairs with `handwrite`.
- Avoid for: painting a highlight behind a word inside a sentence →
  `marker-highlight`.
- Deps: `@remocn/stop-motion`.

## components.mdx

Card under **Typography → Highlights**: name `InkUnderline`, href
`/docs/typography/ink-underline`, status `stable`.

## Tests

None required (no pure helpers). If a path-building helper gets extracted,
cover its determinism.

## Acceptance criteria (owner verifies)

1. Stroke draws in visible discrete poses, not smoothly.
2. Same `seed` renders the identical wobble every time.
3. Standard: typecheck, biome, registry drift clean.

## Out of scope

- Circling/enclosing an element (backlog: `scribble-circle`).
- Strikethrough (backlog: `ink-cross-out`).
