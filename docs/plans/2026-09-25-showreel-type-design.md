# Showreel type

Six typography components taken from a code-built motion showreel: heavy
grotesk words that move on the beat against flat fields. Each one isolates a
single typographic trick from that reel and makes it reusable in any video.

| Component | Beat from the reel | Kind |
| --- | --- | --- |
| `selection-snap` | "FRAME" inside a design-tool selection | Entrance |
| `lead-bar-type` | "EVERY" chasing a cursor bar | Entrance |
| `echo-stack` | "BOLD." on a drum of outline copies | Entrance + ambient drift |
| `type-wall` | A wall of "MOTION" rows | Sustained backdrop |
| `ring-text` | "TYPE IN MOTION" on a spinning 3D band | Sustained accent |
| `period-drop` | "CLAUDE." with a dropped period | End card |

## Shared decisions

- **DOM text, not glyph outlines.** Text stays text and the browser lays it
  out. The selection box in `selection-snap` is a wrapper around the word, so
  it follows the word's width while the weight grows. The dot in
  `period-drop` is an inline element after the word, so it lands where the
  word ends. Only three things are measured, with canvas `measureText` after
  the font has loaded: the final word size shown on the badge, the baseline
  inside a line box, and character advances around the ring.
- **Inter, variable.** `@remotion/google-fonts/Inter` serves one variable
  woff2 (`wght` 100–900) for every weight, so `font-variation-settings:
  "wght" N` gives continuous weight. `type-wall` also loads Anton for its
  narrow rows; neither the Google build of Inter nor Archivo has a `wdth`
  axis. Every component takes `fontFamily` to swap the face.
- **Units.** Sizes are reference px at a 720px-tall composition and scale by
  `unit = height / 720`, like `squiggle`.
- **Time.** `t = frame × 30 / fps × speed`, so the timelines below are in
  30fps frames at `speed = 1`. Every component takes `speed`.
- **Pure timelines.** Each file exports pure `get…` functions of `t` that the
  component renders from and the tests assert against.
- **Colors.** Components paint no background. Defaults come from the house
  palette: text `#fafafa`, accent `#D97757`. The site previews use the
  reel's fields and accents (orange `#ff4d1a`, electric blue `#2b3bff`,
  lime `#d4ff1f`) through config defaults and `previewBackdrop`.
- **Case.** Sentence-case default text everywhere except `type-wall`, where
  a wall of capitals is the effect.

## selection-snap

A thin word sits in a loose viewfinder. The frame snaps tight around it as a
design-tool selection while the word goes from Thin to Black and takes the
accent color. Handles pop on, and a dimension badge counts up to the word's
size.

Timeline:

| Frames | Beat |
| --- | --- |
| 0–8 | Word (weight `fromWeight`) and four corner brackets fade in; brackets settle from 1.06× |
| 14–28 | Snap: padding goes from loose (0.55em × 0.5em) to tight (0.12em × 0) with a small overshoot, `Easing.bezier(0.34, 1.3, 0.64, 1)` |
| 14–30 | Weight `fromWeight → toWeight`, ease-in-out cubic |
| 18–30 | Color `color → accent` |
| 16–26 | Bracket arms grow along the edges until they meet: the frame becomes a 1px box |
| 24–32 | Eight handles pop in, corners first, 1-frame stagger |
| 24–32 | Badge pops in below the box: scale 0.6 → 1, 8px rise |
| 24–38 | Badge numbers count from the loose size to the tight size, ease-out cubic |

Length 40. The box is the word's wrapper (`display: inline-block`,
`line-height: 1`), so its width tracks the text at every weight. The badge
reads `W × H` in reference px; the final width is measured on canvas at
`toWeight`. Selection color defaults to `#0d99ff`.

Props: `text` ("Frame"), `fontSize` (150), `fontFamily`, `fromWeight` (100),
`toWeight` (900), `color`, `accent`, `selectionColor`, `badge` (true),
`speed`.

## lead-bar-type

A thick cursor bar runs along the baseline. Each letter chases it in from the
left, smeared, and lands on the line with a small overshoot. When the bar
reaches the end it thins and stretches back into an underline under the whole
word.

Timeline:

| Frames | Beat |
| --- | --- |
| 0–4 | Bar grows from zero width at the word's left edge |
| 2–22 | Bar crosses the letters, ease-in-out sine, one equal time slot per letter |
| per letter | Starts when the bar is 35% into its slot. 9 frames: x from −0.3em, `scaleX` 1 + 0.8 × `smear` → 1 (origin right), horizontal blur → 0, opacity in 3 frames. Vertical: from −0.16em onto the baseline with a spring that overshoots below it, then settles |
| 22–34 | Bar thickness 0.16em → 0.045em, it drops below the baseline and its left edge runs back to the word start |

Length 36. The bar lives inside the span of the letter it is crossing and sits
at `left: p × 100%`, so it walks letter by letter without measuring advances.
Its vertical placement uses the baseline measured from the font's ascent and
descent.

Props: `text` ("Every"), `fontSize` (180), `fontWeight` (800), `fontFamily`,
`color`, `barColor`, `smear` (1), `speed`.

## echo-stack

The word lands in focus at the center while outline copies of it unfold above
and below and keep drifting vertically, like the one clear line on a spinning
drum.

- Main word: 0–14 blur 12px → 0, opacity 0 → 1, scale 1.04 → 1, ease-out
  cubic.
- Echo rows: `echoes` per side on a pitch of 1.05em. Every row is an outline
  copy (`-webkit-text-stroke`, transparent fill). The column scrolls one
  pitch every `cycle` frames (60) in `direction`, wrapping seamlessly.
- Echo opacity is computed per row from its distance `d` to the center, in
  pitches: 0 below 0.55 (hidden behind the main word), up to 1 at 1, then
  down to 0 at `echoes + 0.5`, times `echoOpacity` (0.35).
- Unfold: 8–26 the pitch grows from 0.6 to 1 and the echo opacity ramps in.

Length 26; the drift continues after it.

Props: `text` ("Bold."), `fontSize` (170), `fontWeight` (800), `fontFamily`,
`color`, `echoColor`, `echoes` (3), `echoOpacity` (0.35), `strokeWidth`
(1.5), `direction` ("up"), `cycle` (60), `speed`.

## type-wall

Rows of one word fill the frame. Neighbors run in opposite directions at
different speeds, and the faces alternate: Inter Black, Anton, outline Inter.
The center row runs on an accent band.

- Rows are `fontSize` tall with no gap, laid out from the vertical center
  (row 0) outward until the frame is covered.
- Each row repeats `"TEXT · "` enough times to cover the width twice and
  loops by translating a whole number of tokens, in percent, so no width
  measurement is needed. Speed is in tokens per second: `0.22 ×` a seeded
  factor in `[0.7, 1.3]`. Even rows run left, odd rows run right.
- Entrance: each row slides in from its own side, ease-out cubic over 20
  frames, staggered 2 frames per row away from the center. The accent band
  grows from the center over 6–20.

Length `sustained`.

Props: `text` ("MOTION"), `separator` ("·"), `fontSize` (64), `color`,
`accent`, `accentText`, `seed` (7), `speed`.

## ring-text

The text runs around a tilted band that spins. Each character is a panel
placed with `rotateY(θ) translateZ(R)`, and the band color is the panel
background. On the far side the letters read mirrored and the band darkens
with the cosine of its angle to the camera.

- `radius` (190 ref px) sets the ring. The text plus separator repeats as
  many times as fits the circumference, and the remainder is spread as
  letter spacing so the band closes without a seam. Advances are measured
  on canvas.
- Pose: `rotateZ(roll)` (−18°), `rotateX(tilt + wobble)` with `tilt` 62°
  and a 6° wobble over 150 frames, then `rotateY(φ)`.
- Spin: one turn per `period` frames (240). Entrance 0–30: scale 0.85 → 1,
  opacity in, and an extra 90° that decays with ease-out cubic, so the ring
  arrives spinning fast and settles to its cruise speed.

Length `sustained`.

Props: `text` ("Type in motion"), `separator` ("•"), `radius`, `fontSize`
(34), `fontWeight` (800), `fontFamily`, `color`, `band`, `tilt`, `roll`,
`period`, `speed`.

## period-drop

The word rises out of its baseline, then a colored dot falls from above the
frame, lands where the period goes, bounces twice with squash and stretch,
and settles as the period.

- Word: each letter rises from under a clip at its line box, 12 frames,
  ease-out quart, 2-frame stagger.
- Dot: an inline-block circle after the last letter, `dotSize` (0.2em),
  resting on the baseline.
- Fall from `0.62 × height` above the rest point, starting at frame 20,
  gravity-shaped over 12 frames. Bounces with restitution 0.35: the first
  lasts 8.4 frames and rises 12% of the drop, the second lasts 2.9 frames.
  Rest at about 43.3.
- Stretch in flight with speed: `scaleY` up to 1.3. Impact squash decays over
  about 3 frames: `scaleX` up to 1.3, `scaleY` down to 0.78, origin bottom.
  Both are capped. This is past the 2–4% squash in the motion principles on
  purpose: the bounce is the effect, as with `speed-lines` (1.3 × 0.8).

Length 44.

Props: `text` ("remocn"), `fontSize` (160), `fontWeight` (800),
`fontFamily`, `color`, `dotColor`, `dotSize`, `speed`.

## Integration

- Pages under `content/docs/typography/` with `component`, `vibe`, `length`,
  `useWhen`, `avoidWhen`; `avoidWhen` names existing replacements
  (`stretch-in`, `infinite-marquee`, `perspective-marquee`, `soft-blur-in`,
  `mask-reveal-up`, …). Added to `meta.json` and the typography index.
- `registry/remocn/registry.json` entries with `remotion` and
  `@remotion/google-fonts`; `registry/__index__.tsx` loaders; `config.ts`
  per component; tests in `__tests__`.
- One changelog entry for the six components.
- `bun run registry:build`, `bun run manifest:build`, tests, typecheck and
  lint; rendered frames checked before pushing.
