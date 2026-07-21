# Plan 017: paper-wobble — the reshoot wobble for any content

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: S
- **Depends on**: 014
- **Category**: feature
- **Section**: Effects

## Goal

A wrapper that gives arbitrary content the per-pose "picked up and put back
down" jitter — the cheapest way to make any headline, card, or block feel
hand-shot. In the demo every act hand-rolls `paperJitter` into transforms;
this component packages that glue.

## Source

Pattern used throughout the demo, e.g.
`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/acts.tsx` lines
20–22 and 33–38 (jitter applied to a positioned wrapper div).

## API (contract)

```ts
export interface PaperWobbleProps {
  children: React.ReactNode;
  seed?: string;                // "wobble"
  amp?: number;                 // 1.4 px
  rotAmp?: number;              // 0.35 deg
  step?: number;                // 3
  className?: string;
  style?: React.CSSProperties;
}

export function PaperWobble(props: PaperWobbleProps): React.ReactElement;
```

## Behavior

- Renders a single `div` (`display: inline-block` by default) whose transform
  is `translate(j.x px, j.y px) rotate(j.rot deg)` from
  `paperJitter(frame, seed, { amp, rotAmp, step })`.
- `style` merges over the defaults; a user-provided `style.transform` is
  composed BEFORE the jitter transform (user transform first, jitter
  appended) so positioning still works.
- Zero layout opinion beyond inline-block; no size, no background.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/effects/paper-wobble.mdx`; add `"paper-wobble"` to
`content/docs/effects/meta.json` (pages become
`["index", "confetti", "paper-wobble"]`).

- title `Paper Wobble`
- description `Per-pose reshoot jitter that makes any content feel hand-placed on a desk`
- Usage: wrapping a headline and a card; note that kit components with
  built-in jitter (paper-sticker) do not need it.

## Customizer config

Controls: `amp` (number 0–6, step 0.1), `rotAmp` (number 0–2, step 0.05),
`seed` (text), `step` (number 1–6). Duration ~90f.

Preview needs demo children: if the customizer cannot inject children, add
`components/docs/examples/paper-wobble-example.tsx` (a short headline block)
and load it from `registry/__index__.tsx`, the way transition examples work.

## Skill reference

Row in **Backgrounds & Effects**:

- Use for: giving any block the stop-motion reshoot wobble — headlines, cards,
  stickers-adjacent content that must feel hand-placed.
- Avoid for: content that should sit rock-still (UI sims, code blocks mid-read)
  or smooth floating motion → `drift`.
- Deps: `@remocn/stop-motion`.

## components.mdx

Create the missing **`## Effects`** top-level section (between Transitions and
Compositions), intro line "Physical overlays and hand-made motion.", with the
`PaperWobble` card (href `/docs/effects/paper-wobble`). Plan 023 may fold the
existing Confetti card into this section.

## Tests

None (no pure helpers beyond the core, which plan 014 covers).

## Acceptance criteria (owner verifies)

1. Wrapped content holds each offset for a full step, then snaps to the next.
2. Two instances with different seeds wobble differently; same seed identical.
3. Standard: typecheck, biome, registry drift clean.

## Out of scope

- Slap-in entrance (that is `paper-sticker`).
- Scale/press effects.
