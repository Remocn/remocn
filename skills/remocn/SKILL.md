---
name: remocn
description: >
  Build Remotion videos with remocn — copy-paste animation components and timeline-driven
  UI primitives from a shadcn registry. Use when composing a video or scene in a Remotion
  project, adding a single animation, transition, background, or UI-block sim, or reaching
  for a video-ready UI primitive (button, dialog, command menu). Activate for polished
  Remotion video work even when remocn isn't named.
---

# remocn

Copy-paste components for Remotion videos. Components install via `shadcn` and land in
`components/remocn/` — you own the code.

## Installation

Prerequisites: a Remotion project (`npx create-video@latest`).

```bash
# Add any component (namespaced shadcn registry)
shadcn add @remocn/blur-out-up

# Component lands at components/remocn/blur-out-up.tsx
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

## Component categories

Pick by what you're building. The catalog is split one file per component under
`references/components/`. **Start at `references/components/index.md`** — a router table grouped by
these categories with a `Use for` / `Avoid for` signal per component. Scan it, pick candidates, then
open only the `references/components/<name>.md` files you need (full props, example, all use / don't-use
notes). Don't read every file.

| Category | Tier | Use for |
|---|---|---|
| **Text Animations** | `remocn` | Reveal/replace/emphasize text (`typewriter`, `blur-out-up`, `tracking-in`, `rolling-number`, `shimmer-sweep`…) |
| **Backgrounds & Effects** | `remocn` | Animated foundations, cursors, one-shot effects (`simulated-cursor`, `confetti`, `backdrop`) |
| **Shaders** | `remocn` | WebGL shader backdrops, frame-driven for deterministic renders (`shader-mesh-gradient`, `shader-warp`, `shader-voronoi`, `shader-god-rays`, `shader-metaballs`…) |
| **Transitions** | `remocn` | TransitionSeries presentations between two scenes (`whip-pan`, `push-through`, `focus-pull`, `grain-dissolve`, `wave-wipe`…) |
| **UI Blocks** | `remocn` | Interface sims for product demos (`terminal-simulator`, `glass-code-block`, `animated-bar-chart`, `progress-steps`…) |
| **AI & Social Cards** | `remocn` | Brand/product card scenes (`chat-gpt`, `claude-code`, `v0`, `github-stars`, `x-follow-card`…) |
| **UI Primitives** | `remocn-ui` | shadcn-style primitives for video (`button`, `dialog`, `select`, `command-menu`, `tooltip`…) |

## Component patterns

Conventions differ by tier — don't assume animation-tier props on a primitive.

### Animation tier (`remocn`)

- Named `Props` interface per component (e.g. `BlurOutUpProps`).
- `speed?: number` — global time multiplier (default `1`), applied as `frame * speed`.
- Text components: `fontSize`, `color`, `fontWeight`.
- Transitions: lowercase factories (e.g. `whipPan(props)`) returning a `TransitionPresentation` — pass to `TransitionSeries.Transition` via `presentation`, pace with `linearTiming` / `springTiming`.
- `className?: string` on the root.

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
- **Budget each Sequence around the component's natural length** — the `Length` column in
  `components/index.md` (and each file's `Natural length`). Under-budgeting clips the animation;
  over-budgeting leaves dead air.
- **Tone matching:** each catalog entry carries a `vibe` tag (`tech`/`premium`/`data`/`clean`/
  `playful`/`social`) — pick components whose vibe fits the brand.
- **Palette & fonts:** stay within the library's tokens (`references/design.md` → tokens) so your
  own elements don't clash.

## Design defaults — avoid AI-slop

Your **own** additions (text, scene chrome, cards — not the prebuilt components) stay restrained:
default tracking, sentence case, solid text color, subtle 1px elevation — no decorative
letter-spacing, ALL-CAPS, gradient text-fills, or glow shadows. Never strip these traits from a
component whose essence *is* the effect (`tracking-in`, social-card gradients, designed elevation).

Full do/avoid examples + design tokens: `references/design.md`. Motion quality (timing,
anticipation, staging, easing): `references/motion-principles.md`.

## Gotchas (remocn-specific)

- **Terminal scroll is instant** — step-function `translateY`, never spring/ease the scroll.
- **`overflow: hidden` on split layouts** — prevents content breakage during width animations.
- **Cursor blink is deterministic** — `Math.floor(frame / 15) % 2 === 0`, not intervals.
- **Static files go in `public/`** — load via `staticFile('cursor.svg')`, not imports.
- **Social cards render offline** — `avatarUrl=""` / `coverUrl=""` fall back to gradients; no fetch.

General Remotion rules (no `Math.random()`, no `setInterval`, animate `transform` not `top`/`left`,
load fonts before render) live in the `remotion-best-practices` skill.

## Composing a video

Don't dump components — compose one story. When asked to build a full video ("make a product demo",
"changelog video", "intro for my landing"):

1. **Decide the strategy** — ready template vs compose from components vs build a new component. See
   `references/anatomy.md` §1.
2. **Follow the beats** — a product demo is Hook → Positioning → Product reveal → Features → Proof →
   CTA (last two optional). See `references/anatomy.md` §2.
3. **Use the recipe** — `references/archetypes/index.md` routes to per-archetype builds: content contract
   (infer → ask → placeholder), duration variants, beat→component slots, and a worked
   `<TransitionSeries>` skeleton.
4. **Pick each beat's component** from `references/components/index.md`; match the `vibe` tag to the
   brand and budget its `Sequence` per Canvas & timing above.
5. **Check the quality bar** — one accent, sentence-case kinetic type, real content, no glow halos, no
   feature-list enumeration. See `references/anatomy.md` §3.

## Reference

- `references/anatomy.md` — composing a full video: strategy (template/compose/new), the product-demo beats, and the good-vs-slop quality bar.
- `references/archetypes/index.md` — router to per-archetype build recipes (product-demo flagship + changelog, feature-announcement, oss-showcase, cli-tool-demo, testimonial-reel, year-in-review, pricing-reveal, logo-bumper): content contract, duration variants, beat→slot map.
- `references/components/index.md` — router table (all components, grouped by category, with `Use for` / `Avoid for`). Open `references/components/<name>.md` for one component's full props, example, and use / don't-use notes.
- `references/design.md` — anti-slop design defaults (do/avoid) + design tokens (palette, fonts, canvas).
- `references/motion-principles.md` — motion-design principles adapted to remocn + Remotion.
- `references/anti-patterns.md` — common generation mistakes and their fixes.
