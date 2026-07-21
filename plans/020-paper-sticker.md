# Plan 020: paper-sticker — a taped paper chip that slaps down

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: S
- **Depends on**: 014
- **Category**: feature
- **Section**: UI Blocks

## Goal

A small paper chip that slaps onto the scene over two poses and keeps a fixed
hand-placed tilt plus per-pose wobble. The demo uses it for mono repo labels;
in the registry it is a generic container for any short content.

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/paper.tsx` lines
50–79 (`Sticker`).

## API (contract)

```ts
export interface PaperStickerProps {
  children: React.ReactNode;
  at?: number;           // 0, local frame the sticker slaps down
  seed?: string;         // "sticker"
  padding?: string;      // "10px 16px"
  background?: string;   // "#fbfaf6"
  borderColor?: string;  // "rgba(38,36,44,0.55)"
  maxTilt?: number;      // 2.6 deg
  step?: number;         // 3
}

export function PaperSticker(props: PaperStickerProps): React.ReactElement;
```

## Behavior

- Returns `null` before `at`; slap-in over two poses
  (`steppedRamp(frame, at, at + 2 * step)`): lands at `scale(1.12)` on the
  first pose, settles to 1.
- Fixed rotation `hashRange(seed + ":rot", -maxTilt, maxTilt)` plus per-pose
  `paperJitter(frame, "sticker:" + seed, { amp: 0.7, rotAmp: 0.2, step })` —
  built-in, no `paper-wobble` needed on top.
- Chrome: `inline-block`, 1px `borderColor` border, radius 3, shadow
  `0 2px 5px rgba(38,36,44,0.14)`.
- Content styling (font, size, color) belongs to the children — the demo's
  mono font stays in the demo.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/ui-blocks/paper-sticker.mdx`; add `"paper-sticker"` to
`content/docs/ui-blocks/meta.json`.

- title `Paper Sticker`
- description `A taped paper chip that slaps onto the scene over two stop-motion poses`
- Usage: a mono label chip on a paper field, plus a staggered group
  (`at={i * 6}`) mirroring the demo's wild page.

## Customizer config

Controls: `at` (number 0–60), `padding` (text), `background` (color),
`maxTilt` (number 0–8, step 0.2), `seed` (text), `step` (number 1–6).
Duration ~90f. Preview children (a short mono label) via
`components/docs/examples/paper-sticker-example.tsx` if the customizer cannot
inject children.

## Skill reference

Row in **UI Blocks**:

- Use for: short labels, chips, and callout notes that should exist as
  physical taped paper on a stop-motion scene.
- Avoid for: long text or interactive-looking UI — it is a paper prop; for a
  media frame with a caption → `polaroid`.
- Deps: `@remocn/stop-motion`.

## components.mdx

Create a **`### Paper & Scrapbook`** subsection under **UI Blocks** with the
`PaperSticker` card (href `/docs/ui-blocks/paper-sticker`). Plan 021 adds
`Polaroid` to the same subsection.

## Tests

None (no pure helpers).

## Acceptance criteria (owner verifies)

1. Sticker pops in with a visible two-pose slap, then wobbles per pose.
2. Different seeds produce different tilts; `maxTilt={0}` sits square.
3. Standard: typecheck, biome, registry drift clean.

## Out of scope

- Visible tape strips (backlog: `tape`), rubber stamps (backlog:
  `rubber-stamp`).
- Exit animation.
