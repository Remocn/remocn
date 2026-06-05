---
name: remocn
description: >
  Build Remotion videos with remocn — a shadcn registry of 65+ copy-paste animation components.
  Use when composing video scenes, adding text animations, transitions, backgrounds, UI blocks,
  or full compositions in a Remotion project. Triggers include "remocn", "video component",
  "add animation", "text reveal", "scene transition", "product demo video", "remotion component",
  "blur reveal", "typewriter", "terminal simulator", "glass code block", or any Remotion video
  composition task. Even if the user doesn't mention remocn, activate when they need polished
  video primitives for Remotion.
---

# remocn

Copy-paste animation components for Remotion videos. Components install via `npx shadcn` and land
in `components/remocn/` — you own the code.

## Installation

Prerequisites: a Remotion project (`npx create-video@latest`).

```bash
# Add any component
npx shadcn@latest add https://remocn.dev/r/blur-reveal.json

# Component lands at components/remocn/blur-reveal.tsx
```

The registry URL pattern is `https://remocn.dev/r/<component-name>.json`.

## Component Categories

Choose components by what you're building. Read `references/components.md` for the full catalog
with props, descriptions, and implementation notes.

### Text Animations

Reveal, replace, and emphasize text.

| Component | Use case |
|---|---|
| `blur-reveal` | Fade in from heavy blur to sharp focus |
| `typewriter` | Character-by-character typing with blinking cursor |
| `inline-highlight` | Animate one word's color in a sentence |
| `text-fade-replace` | Cross-fade between two strings without layout shift |
| `strikethrough-replace` | Strike old text, reveal new text |
| `staggered-fade-up` | Words fade+slide up in a wave |
| `masked-slide-reveal` | Words slide up out of a clipped mask |
| `tracking-in` | Letter-spacing collapses with spring bounce |
| `shimmer-sweep` | Light sweep across text via `background-clip: text` |
| `marker-highlight` | Marker block draws behind a phrase |
| `slot-machine-roll` | Vertical reel scroll between values |
| `matrix-decode` | Random characters resolve into target text |
| `rgb-glitch-text` | RGB-offset jitter glitch effect |
| `infinite-marquee` | Seamless looping horizontal text strip |

### Backgrounds & Primitives

Animated foundations and micro-interactions.

| Component | Use case |
|---|---|
| `mesh-gradient-bg` | Drifting amorphous gradient blobs |
| `dynamic-grid` | Subtle moving grid/dot background |
| `spring-pop-in` | Elastic scale-in wrapper for any element |
| `simulated-cursor` | Mouse cursor moving between waypoints with click feedback |
| `pulsing-indicator` | Continuous pulsing dot for loading/live states |

### Transitions & Wipes

Swap between scenes.

| Component | Use case |
|---|---|
| `directional-wipe` | Push one scene out while sliding another in |
| `frosted-glass-wipe` | Sliding frosted glass pane between scenes |
| `kinetic-type-mask` | Giant text as a window into the next scene |
| `spatial-push` | New scene physically presses old one back |
| `grid-pixelate-wipe` | Dissolve through a grid of mask cells |
| `chromatic-aberration-wipe` | Ultra-fast slide with RGB glitch at peak |
| `zoom-through-transition` | Aggressive scale into element center |
| `swipe-transition-wipe` | Side-by-side flick with parallax + dimming |

### UI Blocks

Interface simulations for product demos.

| Component | Use case |
|---|---|
| `glass-code-block` | Frosted-glass code editor with syntax highlighting |
| `terminal-simulator` | CLI window with chunked line output and auto-scroll |
| `browser-flow` | Safari/Chrome simulation with URL bar and page render |
| `toast-notification` | System toast that pops in, holds, slides out |
| `animated-line-chart` | SVG line chart that draws on progressively |
| `animated-bar-chart` | Bars spring up in a staggered cascade |
| `code-diff-wipe` | Before/after code reveal via clip-path |
| `code-accordion` | Collapse a range of code lines with a placeholder |
| `device-mockup-zoom` | Pull back from UI to reveal device frame |
| `morphing-modal` | Card lifts off grid and blooms into full-screen modal |
| `spotlight-card` | Radial spotlight follows cursor over card border |
| `progress-steps` | Multi-step pipeline with sequential activation |
| `drag-and-drop-flow` | Simulated file drag into dropzone |
| `bounding-box-selector` | Figma-style selection rectangle |
| `chat-to-preview-layout` | Two-column layout where chat shrinks, preview grows |
| `staggered-bento-grid` | Cards cascade into bento grid |
| `cursor-flow` | Realistic bezier-pathed mouse with click physics |
| `data-flow-pipes` | Glowing packets travel along SVG bezier pipes |
| `perspective-marquee` | 3D-tilted infinite marquee with depth blur |
| `success-confetti` | Deterministic seeded confetti burst |
| `pricing-tier-focus` | Focused tier rises while siblings dim |
| `infinite-bento-pan` | Camera drifts across oversized bento grid |

### Full Compositions

Ready-to-use multi-scene sequences.

| Component | Use case |
|---|---|
| `product-launch-trailer` | Logo → zoom-through → 3D bento → confetti version drop |
| `hero-device-assemble` | Floating layers spring together into device mockup |
| `changelog-bite` | Looping before/after diff card with frosted wipe |
| `terminal-to-browser-deploy` | CLI deploy → blur → browser springs from URL |
| `landing-code-showcase` | Split-screen: code types left, preview renders right |
| `live-code-compilation` | Split-screen HMR-style code + live preview |
| `dashboard-populate` | Empty dashboard cascades to life with animated data |
| `pipeline-journey` | Kanban ticket arcs across columns with confetti |
| `ecosystem-constellation` | Central logo orbited by integration satellites |
| `ai-generation-canvas` | Prompt → header → skeleton → populated cards |
| `visual-docs-snippet` | Cursor clicks button, bounding box + tooltip explain it |
| `ai-generate-overlay` | Source blurs under shimmer grid, new image fades in |
| `tool-menu-slide-in` | Glass tool palette slides up with staggered icons |
| `image-expand-to-fullscreen` | Image lifts from feed post into fullscreen editor |
| `brush-stroke-simulator` | Finger brushes across image revealing pixelated layer |
| `volumetric-rays` | Cinematic god rays through text/logo silhouette |

## Component Patterns

All remocn components follow these conventions:

### Props

- Every component exports a named `Props` interface (e.g., `BlurRevealProps`)
- `speed?: number` — global time multiplier (default `1`), applied as `frame * speed`
- `className?: string` — optional CSS class on root element
- Category-specific defaults: text components have `fontSize`, `color`, `fontWeight`; transitions have `transitionStart`, `transitionDuration`

### Animation API

Components use Remotion's core animation primitives:

```tsx
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Linear interpolation
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

// Spring physics
const scale = spring({ fps, frame, config: { damping: 12, mass: 1, stiffness: 100 } });

// Deterministic randomness (NEVER use Math.random())
import { random } from "@remotion/random";
const jitter = random(`seed-${frame}`);
```

### Composition structure

```tsx
import { Composition, Sequence, Series } from "remotion";

// Sequence for timed sub-scenes
<Sequence from={30} durationInFrames={60}>
  <BlurReveal text="Hello" />
</Sequence>

// Series for back-to-back items
<Series>
  <Series.Sequence durationInFrames={60}><SceneA /></Series.Sequence>
  <Series.Sequence durationInFrames={60}><SceneB /></Series.Sequence>
</Series>
```

### Transitions wrap two scenes

```tsx
<FrostedGlassWipe
  from={<SceneA />}
  to={<SceneB />}
  transitionDuration={30}
/>
```

## Gotchas

- **Never use `Math.random()`** — renders are multi-pass. Use `random(seed)` from `@remotion/random`
- **Never use `setInterval`/`setTimeout`** — derive everything from `useCurrentFrame()`
- **Animate `transform` not `top`/`left`** — avoids layout reflow during frame rendering
- **Fonts must be loaded before render** — use `@remotion/google-fonts` or `@remotion/fonts`
- **Static files go in `public/`** — load via `staticFile('cursor.svg')`, not imports
- **Cursor blink must be deterministic** — `Math.floor(frame / 15) % 2 === 0`, not intervals
- **Terminal scroll is instant** — use step-function `translateY`, never spring/ease the scroll
- **`overflow: hidden` on split layouts** — prevents content breakage during width animations
- **`extrapolateRight: "clamp"` by default** — prevents values overshooting their target range

## Composing a Video

Typical workflow for a product demo:

1. **Pick a background**: `mesh-gradient-bg` or `dynamic-grid`
2. **Add a title reveal**: `blur-reveal`, `staggered-fade-up`, or `tracking-in`
3. **Show the product**: `browser-flow`, `terminal-simulator`, or `glass-code-block`
4. **Transition between scenes**: `frosted-glass-wipe`, `spatial-push`, or `directional-wipe`
5. **End with impact**: `success-confetti`, `product-launch-trailer`, or `pricing-tier-focus`

Or use a full composition like `product-launch-trailer` and customize its sub-scenes.

## Reference

For the complete component catalog with detailed implementation notes and props:

→ `references/components.md`
