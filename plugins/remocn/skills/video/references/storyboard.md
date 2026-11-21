# Storyboard format

The storyboard is the contract between planning and building. The `video-director` agent writes it,
the `video` skill shows it to the user and builds from it, and the `scene-reviewer` agent checks the
render against it. Keep it in this shape so each of them can read the others' output.

## Shape

````markdown
# Storyboard: <video title>

- **Archetype:** <product-demo | changelog | feature-announcement | oss-showcase | cli-tool-demo |
  testimonial-reel | year-in-review | pricing-reveal | logo-bumper | custom>
- **Slug:** <kebab-case, ASCII, becomes src/videos/<slug>/>
- **Canvas:** 1280×720 @ 60fps (or 1080×1920 / 1080×1080 when the brief asks for vertical / square)
- **Target:** <seconds from the brief>s · **Planned:** <total frames>f = <seconds>s
- **Vibe:** <tech | premium | data | clean | playful | social | paper> · **Accent:** <one hex>

| # | Beat | Component | Content | Own length | Hold | Sequence | Transition out |
|---|---|---|---|---|---|---|---|
| 1 | Hook | `kinetic-center-build` | "Your team has tasks everywhere" | 45f | 120f | 165f | `fade()` 18f |
| 2 | ... | ... | ... | ... | ... | ... | ... |

**Install:** `npx shadcn add @remocn/kinetic-center-build @remocn/per-character-rise ...`

**Content still missing:** <fields the user should supply; placeholders used meanwhile>

**Build new:** <any beat no catalog component covers, with one line on what to build — or "none">
````

## Rules for the numbers

- **Every frame count in the storyboard is counted at 30 fps**: the table, the transition frames and
  **Planned**. That is the unit of a component's `Length` and of every frame prop a component takes,
  so the whole plan stays in one unit. The video itself runs at 60 fps, so **double each count where
  it is handed to Remotion**: `durationInFrames` and `from` of a `<Sequence>`, `<Series.Sequence>`
  or `<TransitionSeries.Sequence>`, the length in `linearTiming()` / `springTiming()` and
  `meta.durationInFrames`. Frame counts passed as props to a component stay as the table gives
  them. At another frame rate scale those Remotion-facing counts by `fps / 30`.
- **Own length** is the component's `Length` from `https://remocn.dev/llms-components.txt` (frames at
  30fps). It is the floor, never the whole beat. `state-driven` components have no own length: give
  them the time their state changes need.
- **Hold** is time on screen after the motion settles. Text needs roughly 4 frames per character
  read at a glance, and never less than 30 frames.
- **Sequence** = own length + hold. Doubled, this is the `durationInFrames` of the beat's
  `<TransitionSeries.Sequence>` (or `<Series.Sequence>`) at 60 fps: 165f in the table is
  `durationInFrames={330}` in the code.
- **Transition out** is a presentation plus its timing frames. In a `TransitionSeries` adjacent
  sequences overlap by the transition's length, so
  `Planned = sum(Sequence) − sum(transition frames)`.
- **Planned** must land within ±10% of **Target**. Trim holds before trimming beats; drop a beat
  before squeezing every hold below its floor.

## Rules for the picks

- One lead component per beat, chosen from the index, with its docs page read (`.md` URL) before it
  goes in the table. Supporting components layered in the same beat go in the same cell, after the
  lead. Never a component you have not read.
- A piece no catalog component covers is named in backticks too and listed under **Build new**. It
  stays out of the install line.
- Respect `Avoid for`: when a pick's avoid note matches the beat, take the replacement it names in
  backticks.
- One vibe across the video. `paper` components only mix with other `paper` components.
- One accent color. Everything else neutral.
