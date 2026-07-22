# Plan 015: handwrite — text laid down letter by letter on the stop-motion clock

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: M
- **Depends on**: 014
- **Category**: feature
- **Section**: Typography

## Goal

The core text voice of the kit: handwritten text where letters arrive one or
two per stop-motion pose, each glyph keeping its own fixed slant and baseline
wobble, the newest letter settling from a slightly heavier press.

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/ink.tsx` lines
29–94 (`Handwrite`, `handwriteDuration`).

## API (contract)

```ts
export interface HandwriteProps {
  text: string;
  fontSize?: number;                 // 54
  color?: string;                    // "#26242c"
  delay?: number;                    // 0, frames on the local clock
  perStep?: number;                  // 1.6 letters per pose
  weight?: 400 | 500 | 600 | 700;    // 600
  align?: "left" | "center";         // "center"
  fontFamily?: string;               // Caveat (loaded internally)
  step?: number;                     // 3
}

export function Handwrite(props: HandwriteProps): React.ReactElement;

export function handwriteDuration(
  text: string,
  options?: { perStep?: number; step?: number },
): number;
```

## Behavior

- Shown-letter count = `floor(qstep(qf(frame) - delay) * perStep)`, clamped
  at 0 — identical mechanics to the demo, with `step` threaded through.
- Per-glyph fixed slant `hashRange("hw:" + text + ":" + i + ":r", -3.2, 3.2)`
  deg and baseline offset `±1.8` px — stable across frames.
- Letters inside the freshest pose render at `scale(1.06)` (the press), then
  settle to 1.
- `white-space: pre-wrap` on the container, `pre` per glyph; multi-line text
  via `\n` works.
- Font: `loadFont` from `@remotion/google-fonts/Caveat`, subsets `["latin"]`,
  weights `["400","500","600","700"]`, at module top level. `fontFamily` prop
  overrides the resolved family (fallback chain ends in `cursive`).
- No jitter inside the component — wrap with `paper-wobble` for the reshoot
  wobble.

## Registry entry

Standard, plus `dependencies: ["remotion", "@remotion/google-fonts"]` — match
the exact dependency spelling used by `number-wheel`/`claude-code` in
`registry/remocn/registry.json`. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/typography/handwrite.mdx`; add `"handwrite"` to
`content/docs/typography/meta.json` pages right after `"typewriter"`.

- title `Handwrite`
- description `Handwritten text laid down letter by letter on a quantized stop-motion clock`
- Usage example: a headline written over a plain paper background, plus a
  `handwriteDuration` snippet for sizing a `<Sequence>`.

## Customizer config

Controls: `text` (text), `fontSize` (number 24–120), `perStep` (number
0.5–4, step 0.1), `weight` (select), `color` (color), `align` (select),
`step` (number 1–6). Duration ~120f.

## Skill reference

Row in **Text Animations**:

- Use for: captions, labels, and headlines that should read as pen-written on
  paper — the core text voice of stop-motion scrapbook scenes.
- Avoid for: terminal or typing simulation — that is `typewriter`; smooth
  per-character reveals on the real clock → `soft-blur-in` / `per-character-rise`.
- Deps: `@remocn/stop-motion`.

## components.mdx

Card under **Typography → Reveals**: name `Handwrite`, href
`/docs/typography/handwrite`, status `stable`.

## Tests

`handwriteDuration`: exact frame math for known strings, `perStep` and `step`
variations, unicode (`Array.from`) length handling.

## Acceptance criteria (owner verifies)

1. Component renders letters pose-by-pose in the docs preview; slant/baseline
   stable while paused vs playing.
2. `handwriteDuration("hello")` matches when the last letter lands (+1 step).
3. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- Cross-out / correction behavior (backlog: `ink-cross-out`).
- Cursor or caret of any kind.
