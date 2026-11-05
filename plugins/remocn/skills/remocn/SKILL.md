---
name: remocn
description: >
  Pick, install and compose remocn components: ready-made Remotion animations, transitions,
  backgrounds, captions, UI primitives and video templates from a shadcn registry. Use when
  building a video or scene out of prebuilt parts (product demo, launch, changelog, intro,
  social clip), adding an animation, transition or background to a Remotion project, or
  choosing between components. Activate for polished Remotion video work even when remocn
  isn't named. Works alongside the Remotion skills: questions about the Remotion API itself
  (interpolate, spring, Sequence, rendering, config) belong to them, not to this skill.
---

# remocn

Copy-paste components for Remotion videos. Components install via `shadcn` and land in
`components/remocn/` — you own the code.

## The catalog lives at remocn.dev

This skill does not carry a copy of the component catalog. There are ~800 components and they
change; a bundled copy goes stale silently. Read the live docs instead. The section map below
tells you where to look; the index tells you what is there.

**Start every component search here:**

```
https://remocn.dev/llms-components.txt
```

One table per category, every installable component, each row carrying `Use for` / `Avoid for`,
natural length, vibe, tier, dependencies, and a link to its full page. Scan it, shortlist, then
fetch only the pages you shortlisted.

**One component's full reference** — props with descriptions, worked examples, all use / don't-use
notes — is the docs URL with `.md` appended:

```
https://remocn.dev/docs/typography/blur-out-up.md
https://remocn.dev/docs/transitions/whip-pan.md
https://remocn.dev/docs/ui/components/dialog.md
```

The index gives you the exact URL per component — don't guess the section from the name, several
components live somewhere non-obvious.

Fetch with whatever your environment provides (a web-fetch tool, `curl`, `WebFetch`). If the
network is unavailable, say so and stop — do not invent props, defaults, or durations from memory,
and do not substitute a component you have not read. A wrong prop name fails at build; an invented
duration silently clips the animation.

## Where things live

The index has one table per docs section. Know the sections before you scan, because the same idea
can sit in several of them (a number reveal is in Numbers, not Typography; a whole app screen is in
Product Scenes, not UI Blocks).

| Section | What's in it | Groups |
|---|---|---|
| Typography | Text is the hero: headlines, statements, kinetic posters, word swaps | Statements, Headline reveals, Kinetic posters, Word swaps, Letter mechanics, Quotes |
| Numbers & Stats (`/docs/numbers`) | A number is the hero: counters, stat reveals, charts, prices, countdowns | Stat reveals, Counters, Charts, Comparisons, Countdowns & dates, Prices |
| Product Scenes (`/docs/product-scenes`) | Full staged app screens with a beginning, a middle and a payoff | Web app, Commerce & payments, Mobile, Analytics, AI & agents, Collaboration, Dev tools, Onboarding |
| UI Blocks | One UI element doing one thing: a card, a prompt box, a toggle, a cursor | Cards, Prompt boxes, Controls, Cursor & input, Callouts, Toolbars, Browser |
| Media & Collage (`/docs/media`) | Your screenshots, photos and footage as the hero | Screenshot tours, Grids & collages, Comparisons, Device frames |
| Logo Stings | Name and logo reveals, intro and end stings | Name reveals, Logo builds, End stings |
| Transitions | `TransitionPresentation`s and scene sequencers between beats | Wipes, Type transitions, Light, Match cuts, Morphs |
| Social | Vertical creator formats, social proof, hooks | Creator formats, Social proof, Hooks |
| Motion Graphics, Graphic Looks, Effects, Camera | Abstract shapes, stylised looks, lens effects, camera and physics moves | — |
| UI, Captions, Shaders, Filters, Layout, Compositions, Templates | Primitives, voiceover captions, shader backgrounds, filters, layout helpers, finished scenes and videos | — |

Which section a launch-video beat usually comes from:

- **Hook / problem:** Typography → Statements or Kinetic posters; Social → Hooks for vertical.
- **Positioning / name:** Logo Stings → Name reveals; Typography → Headline reveals.
- **Product reveal and features:** Product Scenes (whole screens) or UI Blocks (one element);
  Media & Collage when the user has real screenshots or footage.
- **Proof:** Numbers & Stats (a metric, a chart, a comparison); Social → Social proof for quotes and votes.
- **Pricing:** Numbers & Stats → Prices, or `pricing-reveal` in Product Scenes.
- **CTA / end:** Logo Stings → End stings; Typography → Statements.
- **Between beats:** Transitions.

## Installation

Prerequisites: a Remotion project (`npx create-video@latest`).

```bash
shadcn add @remocn/blur-out-up
```

`@remocn/<name>` is the canonical namespaced form (configured under `registries` in
`components.json`). The plain registry URL `https://remocn.dev/r/<name>.json` also works.

### Dependencies install automatically

Many components pull others via `registryDependencies` — `shadcn` installs them transitively.
For example, `shadcn add @remocn/typewriter` also pulls `@remocn/remocn-ui` and `@remocn/caret`.

- **`@remocn/remocn-ui`** is the shared core lib (timeline-fold hook, theme context, color math).
  Most UI Primitives depend on it. You rarely install it directly.

## Two tiers

remocn has two kinds of components — they have **different APIs**:

- **Animation tier** (`remocn`) — text animations, transitions, backgrounds, UI-block sims,
  brand/social cards, full compositions. Frame-driven. Shared props: `speed` (time multiplier),
  and for text: `fontSize`, `color`, `fontWeight`.
- **UI Primitives** (`remocn-ui`) — timeline-driven shadcn-style primitives (button, dialog,
  select, command-menu, tooltip…). State-based props (`state`, `style`, `variant`, `theme`).
  **No `speed` prop.** Built on `@remocn/remocn-ui`.

The index's `Tier` column tells you which one you are looking at before you open the page.

## Component patterns

Conventions differ by tier — don't assume animation-tier props on a primitive.

### Animation tier (`remocn`)

- Named `Props` interface per component (e.g. `BlurOutUpProps`).
- `speed?: number` — global time multiplier (default `1`), applied as `frame * speed`.
- Text components: `fontSize`, `color`, `fontWeight`.
- Transitions: lowercase factories (e.g. `whipPan(props)`) returning a `TransitionPresentation` — pass to `TransitionSeries.Transition` via `presentation`, pace with `linearTiming` / `springTiming`.
- `className?: string` on the root.

Most components in Typography, Numbers & Stats, Product Scenes, UI Blocks, Media & Collage, Logo
Stings and Social share these extra conventions — the page's props table says which apply:

- `theme?: "dark" | "light"` — the same piece ships in both looks; pick the one matching the video.
- `ground` / `groundParams` — an animated gradient ground from `@remocn/gsh` (installed
  automatically). It is WebGL2, so render with `--gl=angle` (CLI) or `chromiumOptions: { gl: "angle" }`;
  without it the ground renders black.
- Default images (`images`, `src`, `image`, `covers`…) point at `staticFile(...)` demo files that
  only exist in the remocn repo. Always pass the user's own images, or put files with those names in `public/`.
- Copy and data are props (`title`, `words`, `items`, `value`, `rows`…); defaults are placeholder
  launch copy, so replace them.
- `Length` is for the default props. Where it scales with content (word count, item count, number of
  rows), the page says how.
- Transitions come in two shapes. Some export a lowercase presentation factory for
  `TransitionSeries` next to a demo component — use the factory. Others are self-contained
  components that play the whole cut between their own two scenes — mount them as a scene. The
  page shows which one you have.

Not everything filed under transitions is a presentation: `slide-swap` and `spring-settle` are scene
sequencers that take a `scenes` array and own the whole timeline. The page says which one you have.

### UI Primitives (`remocn-ui`)

- State-based, **not** `speed`-based: `state` (e.g. `"open"` / `"closed"`), `style`, `variant`,
  `size`, `theme?: Partial<RemocnTheme>`.
- The opened/closed/active state is a pure function of the timeline (keyframed presets).
- Compose modal-layer primitives (dialog, alert-dialog, drawer) with a trigger element — see
  each component's example.

### Animation API

```tsx
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
const scale = spring({ fps, frame, config: { damping: 12, mass: 1, stiffness: 100 } });

// Deterministic randomness (NEVER Math.random())
import { random } from "@remotion/random";
const jitter = random(`seed-${frame}`);
```

### Composition structure

```tsx
import { Sequence, Series } from "remotion";

<Sequence from={30} durationInFrames={60}>
  <Typewriter text="npm install remocn" />
</Sequence>

<Series>
  <Series.Sequence durationInFrames={60}><SceneA /></Series.Sequence>
  <Series.Sequence durationInFrames={60}><SceneB /></Series.Sequence>
</Series>
```

### Canvas & timing

- **Canvas standard:** `1280×720 @ 30fps`. Components are laid out for it.
- **`Length` is the component's own motion, not the whole beat.** For a transition it is the value
  to pass to `linearTiming` / `springTiming`; for everything else it is the frame the animation
  finishes on. Treat it as the floor for the `Sequence` and add hold time when the element should
  stay on screen after it settles. `state-driven` means the component renders from its `state` prop
  and has no duration of its own.
- **Tone matching:** each entry carries a `vibe` tag (`tech`/`premium`/`data`/`clean`/`playful`/
  `social`/`paper`) — pick components whose vibe fits the brand. `paper` is the stop-motion kit: a
  quantized ~10-poses-per-second clock, handwriting and ink. Those components read as one world, so
  mix them with each other rather than with the smooth tiers.

## Design defaults — avoid AI-slop

Your **own** additions (text, scene chrome, cards — not the prebuilt components) stay restrained:
default tracking, sentence case, solid text color, subtle 1px elevation — no decorative
letter-spacing, ALL-CAPS, gradient text-fills, or glow shadows. Never strip these traits from a
component whose essence *is* the effect (`tracking-in`, social-card gradients, designed elevation).

Full do/avoid examples, design tokens, motion principles and the anti-pattern list live in the
Craft section:

```
https://remocn.dev/docs/craft/design-defaults.md
https://remocn.dev/docs/craft/motion-principles.md
https://remocn.dev/docs/craft/anti-patterns.md
```

## Gotchas (remocn-specific)

- **Terminal scroll is instant** — step-function `translateY`, never spring/ease the scroll.
- **`overflow: hidden` on split layouts** — prevents content breakage during width animations.
- **Cursor blink is deterministic** — `Math.floor(frame / 15) % 2 === 0`, not intervals.
- **Static files go in `public/`** — load via `staticFile('cursor.svg')`, not imports.
- **Social cards render offline** — `avatarUrl=""` / `coverUrl=""` fall back to gradients; no fetch.
- **Gradient grounds need WebGL** — any component with a `ground` prop renders black without `--gl=angle`.
- **Some pieces hard-code the remocn logo** — the page says so; swap it in the copied file.

General Remotion rules (no `Math.random()`, no `setInterval`, animate `transform` not `top`/`left`,
load fonts before render) live in the `remotion-best-practices` skill.

## Working alongside the Remotion skills

remocn is the component layer on top of Remotion, not a second guide to it. When Remotion's own
skills are installed (`remotion-create`, `remotion-render`, `remotion-best-practices`), let them
answer how Remotion works — project setup, the animation API, rendering, config — and use this
skill for what to put on screen: which remocn component, how long it runs, how beats chain. Don't
restate Remotion API docs here or in your answer; point to those skills or to remotion.dev.

## Composing a video

Don't dump components — compose one story. When asked to build a full video ("make a product demo",
"changelog video", "intro for my landing") and the `video` skill from the remocn plugin is installed,
follow it: it runs the whole brief → storyboard → install → compose → review flow below and hands
the result to Remocn Studio. Otherwise:

1. **Decide the strategy** — ready template vs compose from components vs build a new component. See
   `references/anatomy.md` §1.
2. **Follow the beats** — a product demo is Hook → Positioning → Product reveal → Features → Proof →
   CTA (last two optional). See `references/anatomy.md` §2.
3. **Use the recipe** — `references/archetypes/index.md` routes to per-archetype builds: content contract
   (infer → ask → placeholder), duration variants, beat→component slots, and a worked
   `<TransitionSeries>` skeleton.
4. **Pick each beat's component** from `https://remocn.dev/llms-components.txt`; match the `vibe` tag
   to the brand and budget its `Sequence` per Canvas & timing above.
5. **Caption the voice** — if the video has a voiceover or a talking head, transcribe it
   (`https://remocn.dev/docs/captions/getting-started/get-a-transcript.md`), pick a `caption-*` from the
   Captions table in the component index, and place it per
   `https://remocn.dev/docs/captions/getting-started/positioning.md`. Scripted on-screen text with no
   audio stays typography.
6. **Check the quality bar** — one accent, sentence-case kinetic type, real content, no glow halos, no
   feature-list enumeration. See `references/anatomy.md` §3.

## Reference

Bundled with this skill — the judgment that does not change per component:

- `references/anatomy.md` — composing a full video: strategy (template/compose/new), the product-demo beats, and the good-vs-slop quality bar.
- `references/archetypes/index.md` — router to per-archetype build recipes (product-demo flagship + changelog, feature-announcement, oss-showcase, cli-tool-demo, testimonial-reel, year-in-review, pricing-reveal, logo-bumper): content contract, duration variants, beat→slot map.

Fetched from remocn.dev — everything that tracks the components:

- `https://remocn.dev/llms-components.txt` — the component index. Always start here.
- `https://remocn.dev/docs/<section>/<name>.md` — one component's full reference.
- `https://remocn.dev/docs/craft/design-defaults.md` — anti-slop defaults and design tokens.
- `https://remocn.dev/docs/craft/motion-principles.md` — motion principles adapted to remocn.
- `https://remocn.dev/docs/craft/anti-patterns.md` — common generation mistakes and their fixes.
- `https://remocn.dev/llms.txt` — index of the whole documentation, if you need something else.
