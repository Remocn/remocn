# Plan 021: polaroid — the living photograph frame

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: M
- **Depends on**: 014, 015 (handwrite renders the caption)
- **Category**: feature
- **Section**: UI Blocks

## Goal

An instant-photo frame: a media window on card stock with a handwritten
caption beneath. The media is `children`, so anything plays inside — an
`<OffthreadVideo>`, an `<Img>`, or a live Remotion composition, which is the
"living photograph" trick without pre-rendered files.

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/photos.tsx` lines
97–177 (`Polaroid`); the demo's `live`/`Freeze` machinery and asset manifest
stay behind.

## API (contract)

```ts
export interface PolaroidProps {
  children: React.ReactNode;
  caption?: string;
  captionAt?: number;     // 0, local frame the caption starts writing
  width?: number;         // 652
  frameColor?: string;    // "#fdfcf8"
  captionColor?: string;  // "#26242c"
  captionSize?: number;   // 36
  step?: number;          // 3, forwarded to the caption Handwrite
}

export function Polaroid(props: PolaroidProps): React.ReactElement;
```

## Behavior

- Geometry scales from `width`, preserving the demo's proportions of the
  652-wide card: side/top padding `16/652`, media window `620/652` wide with
  a `620:349` aspect, caption band `62/652` tall. At default width the pixel
  values match the demo exactly.
- Media window: `background: #100f14`, `overflow: hidden`; children are
  rendered at `width/height 100%`, `objectFit` is the child's concern.
- Card chrome: `frameColor` background, radius 4, shadow
  `0 8px 20px rgba(38,36,44,0.18), 0 2px 5px rgba(38,36,44,0.12)`.
- Caption renders via `Handwrite` (import from
  `@/components/remocn/handwrite`) with `delay={captionAt}`,
  `fontSize={captionSize}`, `color={captionColor}`, `perStep={1.4}`,
  `weight={600}`, `step` forwarded. No caption → empty band keeps the
  polaroid silhouette. `Handwrite` centres itself with `position: absolute;
  inset: 0` (the repo-wide typography convention), so the caption band MUST be
  `position: relative` with its explicit height — otherwise the caption escapes
  the band and centres over the nearest positioned ancestor.
- No jitter or positioning inside — wrap with `paper-wobble` or position
  externally. Freeze/live logic is the consumer's (`<Freeze>` around their
  video); the docs show the recipe.

## Registry entry

Standard, but `registryDependencies: ["@remocn/stop-motion", "@remocn/handwrite"]`
— this is the item that proves transitive dependency resolution
(`polaroid → handwrite → stop-motion`).

## Docs page

`content/docs/ui-blocks/polaroid.mdx`; add `"polaroid"` to
`content/docs/ui-blocks/meta.json`.

- title `Polaroid`
- description `An instant-photo frame with a handwritten caption for video, images, or live compositions`
- Usage: three examples — `<OffthreadVideo>` inside, a live composition
  inside, and the `<Freeze>` recipe for "photo stops playing when flipped
  aside".

## Customizer config

Controls: `caption` (text), `captionAt` (number 0–60), `width` (number
320–900), `captionSize` (number 20–56), `step` (number 1–6). Duration ~120f.
Preview children (a gradient or bundled still) via
`components/docs/examples/polaroid-example.tsx` if the customizer cannot
inject children.

## Skill reference

Row in **UI Blocks**:

- Use for: media in a hand-placed instant-photo frame with a handwritten
  caption — the living-photograph centerpiece of stop-motion scenes.
- Avoid for: a plain rounded video frame with no paper story → `backdrop`
  with padding.
- Deps: `@remocn/stop-motion`, `@remocn/handwrite`.

## components.mdx

Card in **UI Blocks → Paper & Scrapbook** (subsection created by plan 020):
name `Polaroid`, href `/docs/ui-blocks/polaroid`.

## Tests

Geometry helper (derived paddings/media size from `width`) extracted pure and
covered: default width reproduces the demo's 652/620/349/16/62 numbers;
proportions hold at other widths.

## Acceptance criteria (owner verifies)

1. Default polaroid is pixel-identical in proportions to the demo card.
2. A live composition inside the media window plays at full framerate while
   the wrapper (under `paper-wobble`) moves in poses.
3. `shadcn add @remocn/polaroid` on a clean project pulls `handwrite` and
   `stop-motion` transitively.
4. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- Stack/flip choreography and desk scatter (wave-2 compositions:
  polaroid-stack, photo-scatter).
- Built-in Freeze/live props.
