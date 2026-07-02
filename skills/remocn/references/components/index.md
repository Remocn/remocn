# remocn Component Index

Router for the per-component reference files in this directory. **Scan this table to pick candidates, then open only the `components/<name>.md` files you actually need** — do not read every file.

Columns: **Use for** / **Avoid for** are the first signal from each file's `## Use when` / `## Don't use when`. Read the file for the full prop table, example, and all bullets.

Install any entry: `shadcn add @remocn/<name>` (lands at `components/remocn/<name>.tsx`; deps auto-install).


## Text Animations

Tier `remocn`. Reveal / replace / emphasize text and numbers. Frame-driven, shared `speed` prop.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`blur-out-up`](blur-out-up.md) | A title or tagline needs a graceful upward exit before the next scene cuts in | You want a blurred entrance that resolves to crisp — that is `focus-blur-resolve`,… | 90f | premium | — |
| [`bottom-up-letters`](bottom-up-letters.md) | A short punchy word or acronym should land with clear, visible per-character energy | The text is a full sentence or phrase — the high stagger makes long strings feel… | 60f | clean | — |
| [`fade-through`](fade-through.md) | One label, stat, or short phrase needs to swap cleanly into another in the same slot | You want the incoming words to arrive one by one — use `per-word-crossfade` for a… | 90f | clean | — |
| [`focus-blur-resolve`](focus-blur-resolve.md) | A hero word or short phrase should feel like a camera lens pulling into focus | You want a clean departure upward after a crisp entrance — that arc belongs to… | 90f | premium | — |
| [`infinite-marquee`](infinite-marquee.md) | A scene needs ambient motion in the background or as a decorative band between sections | The text should enter, hold, then exit — that is a reveal animation, not a ticker; use… | 180f | clean | — |
| [`inline-highlight`](inline-highlight.md) | One keyword inside a sentence needs to draw attention through a color shift without any… | You want a physical drawn marker or filled background behind the word — use… | 90f | clean | — |
| [`kinetic-center-build`](kinetic-center-build.md) | A short headline should build word by word with satisfying kinetic momentum, locking… | The text is long (7+ words) — the centering re-balance on each word becomes… | 60f | premium | — |
| [`line-by-line-slide`](line-by-line-slide.md) | A multi-line headline or short paragraph needs a flowing, line-by-line entrance with a… | The text is a single short phrase — the stagger has nothing to stage; use… | 90f | clean | — |
| [`marker-highlight`](marker-highlight.md) | A key phrase inside a sentence needs a physical, hand-drawn-feeling highlight that… | You want a subtle color-only emphasis with no visible background — use… | 90f | playful | — |
| [`mask-reveal-up`](mask-reveal-up.md) | A multi-line headline or stacked list needs a clean, contained upward reveal that holds… | You need an exit animation too — `mask-reveal-up` holds in place after reveal; use… | 90f | clean | — |
| [`matrix-decode`](matrix-decode.md) | A hacker, terminal, or cyberpunk aesthetic is required and the scramble-to-reveal glyph… | The content is a human sentence or marketing copy — the glitchy scramble reads as… | 90f | tech | — |
| [`micro-scale-fade`](micro-scale-fade.md) | A label, subheading, or supporting text needs an entrance that feels polished without… | The reveal should be the hero moment with visible kinetic weight — use… | 60f | clean | — |
| [`number-wheel`](number-wheel.md) | A metric, stat, or count should animate to its value in a satisfying odometer roll | The value is not an integer — this component is designed for whole numbers; format… | 112f | data | — |
| [`per-character-rise`](per-character-rise.md) | A short word or phrase needs a crisp, sharp character-by-character entrance with even,… | You want a dramatic staircase effect where each letter visibly lags the previous — use… | 60f | clean | — |
| [`per-word-crossfade`](per-word-crossfade.md) | Two short phrases need to swap with a soft, word-by-word transition that reads as calm… | The transition should be a single-block fade with no word-level staging — use… | 90f | clean | — |
| [`perspective-marquee`](perspective-marquee.md) | A dark, cinematic background treatment is needed with text rolling into a 3D vanishing… | A flat, 2D looping ticker is sufficient — use `infinite-marquee` for a simpler, lighter… | 240f | premium | — |
| [`rgb-glitch-text`](rgb-glitch-text.md) | A tech, hacker, or cyberpunk scene needs a moment of digital corruption on a title | You need a full text entrance animation — the glitch is a momentary effect, not a… | 90f | tech | — |
| [`rolling-number`](rolling-number.md) | Animating a large integer metric on a stats or milestone slide (revenue, signups,… | The value includes a prefix or suffix like `$99` or `1.2M` — use `slot-machine-roll`… | 150f | data | — |
| [`scale-down-fade`](scale-down-fade.md) | A headline needs a confident, minimal entrance without any kinetic exaggeration | You want energy or playfulness — the scale-down reads as composed, not exciting; use… | 90f | clean | — |
| [`shared-axis-y`](shared-axis-y.md) | Swapping two text values in a slide-deck style transition (A → B → C chained in… | You only need to bring text in for the first time with no outgoing content — use… | 90f | clean | — |
| [`shared-axis-z`](shared-axis-z.md) | Conveying a zoom-in narrative: moving from a broad context to a focused point | The swap is a lateral topic change with no depth relationship — use `shared-axis-y` for… | 90f | clean | — |
| [`shimmer-sweep`](shimmer-sweep.md) | Highlighting a product name or pricing tier with a refined, metallic gleam — luxury… | You need the text to enter the scene — shimmer-sweep does not animate the text in; use… | 120f | premium | — |
| [`short-slide-down`](short-slide-down.md) | A multi-word headline should build its layout visibly — each word stacking to create a… | You are swapping between two text values — use `shared-axis-y` which handles the… | 60f | clean | — |
| [`short-slide-right`](short-slide-right.md) | A short headline should enter with horizontal momentum — reads as forward motion or… | You are transitioning between two texts — use `shared-axis-z` (depth) or… | 60f | clean | — |
| [`slot-machine-roll`](slot-machine-roll.md) | Revealing a price change, plan upgrade, or before/after value where the string includes… | The value is a large pure integer like `1,240,000` — use `rolling-number` which… | 90f | playful | — |
| [`soft-blur-in`](soft-blur-in.md) | A hero headline needs the Apple-style per-character soft reveal — premium, airy,… | You want a hard exit animation — `soft-blur-in` is an entrance only; pair with… | 60f | premium | — |
| [`spring-scale-in`](spring-scale-in.md) | The scene calls for energy and bounce — product launches, celebration moments, fun CTAs | The brand is serious, corporate, or premium — spring bounce reads as casual; use… | 60f | playful | — |
| [`staggered-fade-up`](staggered-fade-up.md) | A headline or body sentence is long and a simpler single-unit entrance would feel flat | The text is very short (1–2 words) and the stagger has nothing to reveal gradually —… | 90f | clean | — |
| [`strikethrough-replace`](strikethrough-replace.md) | Showing a problem being replaced by a solution — the strike communicates "we are… | You only need to bring text in for the first time with no "old" text to cross out —… | 120f | clean | — |
| [`top-down-letters`](top-down-letters.md) | A single uppercase word or short acronym should enter with structural weight — each… | The text is more than ~8 characters — many letters dropping sequentially stretches the… | 60f | clean | — |
| [`tracking-in`](tracking-in.md) | A title word or brand name should feel like it is focusing into place — tracking… | You want per-character stagger — `tracking-in` moves all letters as one unit; use… | 90f | premium | — |
| [`typewriter`](typewriter.md) | Simulating a command being typed into a terminal or input — pairs with… | The text is long — typing a paragraph at a readable speed eats far more frames than a… | 120f | clean | `@remocn/remocn-ui`, `@remocn/caret` |

## Backgrounds & Effects

Tier `remocn`. Animated foundations, cursors, one-shot effects.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`backdrop`](backdrop.md) | You need a scene background — wrap every composition in `Backdrop` rather than… | You need an infinitely looping ambient background as a standalone track — use… | 150f | clean | — |
| [`confetti`](confetti.md) | A milestone moment needs a celebratory payoff — product launch, plan completion,… | The video has a clean, minimal, or corporate tone — confetti reads as… | 90f | playful | — |
| [`dynamic-grid`](dynamic-grid.md) | You need a dark tech/SaaS background that feels alive but doesn't compete with text or… | The foreground content is dense or data-heavy — the moving grid adds visual noise… | 150f | premium | — |
| [`mesh-gradient-bg`](mesh-gradient-bg.md) | A legacy scene already uses this component and you must maintain visual consistency | You want a quality, production-grade background — `mesh-gradient-bg` is considered… | 150f | premium | — |
| [`simulated-cursor`](simulated-cursor.md) | You are recording a screen demo and need a synthetic cursor that moves predictably over… | You need a real screen recording — `simulated-cursor` draws a synthetic cursor overlay,… | 150f | clean | — |
| [`spotlight-card`](spotlight-card.md) | A hero or feature card needs a premium, editorial feel — the moving spotlight creates a… | The scene has a light or colorful background — `spotlight-card` defaults are… | 240f | premium | — |

## Shaders

Tier `remocn`. WebGL shader backdrops from `@paper-design/shaders`, wrapped for Remotion. Frozen to the current frame (`speed={0}` + `frame` from `useCurrentFrame()`) so renders stay deterministic; full-bleed; muted defaults; every raw paper prop forwarded via `...rest`. Deps: `@paper-design/shaders-react`.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`shader-mesh-gradient`](shader-mesh-gradient.md) | A quality, production-grade gradient backdrop with slow living color motion — the intended replacement for `mesh-gradient-bg` | You want structured, geometric background — use `dynamic-grid` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-grain-gradient`](shader-grain-gradient.md) | A gradient backdrop that needs analog film/print grain texture over the blend | You need crisp, clean color with no texture — use `shader-mesh-gradient` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-warp`](shader-warp.md) | A hero scene wants organic, liquid folds that feel alive but stay out of the way | You want tight, repeating structure — use `shader-swirl` or `shader-spiral` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-swirl`](shader-swirl.md) | A hypnotic radial background with clear concentric banded structure around a center | You want free-flowing liquid folds — use `shader-warp` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-water`](shader-water.md) | A calm, aquatic atmosphere with gentle refracted caustic highlights | The palette must be warm/vibrant — water reads cool by design | 150f | premium | `@paper-design/shaders-react` |
| [`shader-spiral`](shader-spiral.md) | A hypnotic rotating radial background with visible arm structure pulling toward center | You want closed concentric rings — use `shader-swirl` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-liquid-metal`](shader-liquid-metal.md) | A premium/industrial/luxury scene wants a molten, reflective metal surface | You want color rather than tonal metal — use `shader-warp` or `shader-mesh-gradient` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-color-panels`](shader-color-panels.md) | An architectural, glassy backdrop of translucent panes sliding past each other | You want organic flowing motion — use `shader-warp` or `shader-metaballs` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-neuro-noise`](shader-neuro-noise.md) | An AI/ML/tech scene wants an organic neural-web texture that reads as intelligence | You want smooth cloud noise — use `shader-perlin-noise` or `shader-simplex-noise` | 150f | tech | `@paper-design/shaders-react` |
| [`shader-perlin-noise`](shader-perlin-noise.md) | A soft, cloudy, organic backdrop that drifts slowly and stays calm | You want a smoother flowing field — use `shader-simplex-noise` | 150f | clean | `@paper-design/shaders-react` |
| [`shader-simplex-noise`](shader-simplex-noise.md) | The smoothest noise backdrop — fewer directional artifacts than Perlin | You want cloudier, softer fog — use `shader-perlin-noise` | 150f | clean | `@paper-design/shaders-react` |
| [`shader-voronoi`](shader-voronoi.md) | A cellular, crystalline backdrop that shifts and re-tessellates | You want soft, structureless fog — use `shader-perlin-noise` or `shader-simplex-noise` | 150f | tech | `@paper-design/shaders-react` |
| [`shader-dot-orbit`](shader-dot-orbit.md) | A structured dot-grid backdrop with gentle orbital motion (network/system vibe) | You want a static dot grid — use a CSS grid or `dynamic-grid` | 150f | tech | `@paper-design/shaders-react` |
| [`shader-dithering`](shader-dithering.md) | A retro/print 1-bit ordered-dither texture over a moving gradient | You want smooth, non-textured color — use `shader-mesh-gradient` | 150f | tech | `@paper-design/shaders-react` |
| [`shader-god-rays`](shader-god-rays.md) | A hero/reveal scene wants cinematic volumetric light rays from a corner source | You want structured or cellular motion — use `dynamic-grid` or `shader-voronoi` | 150f | premium | `@paper-design/shaders-react` |
| [`shader-smoke-ring`](shader-smoke-ring.md) | A single soft, centered smoke ring as a focal atmospheric element | You need a full-bleed edge-to-edge texture — use a noise or gradient shader | 150f | premium | `@paper-design/shaders-react` |
| [`shader-metaballs`](shader-metaballs.md) | A playful/organic scene wants lava-lamp blobs merging and splitting | The brand is strictly serious/corporate — metaballs read playful | 150f | playful | `@paper-design/shaders-react` |
| [`shader-pulsing-border`](shader-pulsing-border.md) | A pulsing lit frame around the scene edges that leaves the center clear for text | You want a full-field texture — the interior stays mostly `colorBack` | 150f | premium | `@paper-design/shaders-react` |

## Transitions

Tier `remocn`. Presentations for `@remotion/transitions` — pass to `TransitionSeries.Transition` between two sequences, pace with `linearTiming` or `springTiming`.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`whip-pan`](whip-pan.md) | Fast, energetic directional cuts — feature-to-feature jumps, montage rhythm; the default… | Calm or contemplative moments — the whip reads as urgency; use `focus-pull` | 26f | kinetic | — |
| [`push-through`](push-through.md) | The narrative moves deeper — zooming in on a feature, entering a product, climactic CTA… | Peer scenes moving sideways — the push implies hierarchy; use `whip-pan` | 40f | premium | — |
| [`focus-pull`](focus-pull.md) | Refined, editorial attention shifts — a cinematic alternative to `fade-through` for… | Cuts that need energy or direction — use `whip-pan` or `push-through` | 46f | premium | — |
| [`grain-dissolve`](grain-dissolve.md) | Editorial, textured chapter changes — the scene decomposes into grainy shapes and the next… | Fast cuts under ~50 frames — the intensity/softness sweep needs room; crisp minimal tone… | 76f | premium | `@paper-design/shaders-react` |
| [`wave-wipe`](wave-wipe.md) | The cut should feel like physical motion — a grainy swell washes up over the scene and the… | Horizontally-related scenes (steps in a flow) — the vertical sweep fights the reading… | 60f | premium | `@paper-design/shaders-react` |
| [`ripple-zoom`](ripple-zoom.md) | The narrative zooms in on a hero statement — the camera dives through grainy ripple rings… | Incoming scenes with opaque full-frame backgrounds — they hide the field and kill the… | 68f | premium | `@paper-design/shaders-react` |
| [`warp-dissolve`](warp-dissolve.md) | Chapter or mood changes — the outgoing scene melts into a liquid color field and the next… | Fast cuts under ~50 frames — the melt needs room to read; spatially related step-by-step… | 76f | premium | `@paper-design/shaders-react` |
| [`swirl-dissolve`](swirl-dissolve.md) | A dramatic chapter break where the frame visibly twists into a vortex — reveals, act… | Fast cuts under ~80 frames; repeated use — the vortex is a one-per-video statement move | 104f | premium | `@paper-design/shaders-react` |
| [`dither-dissolve`](dither-dissolve.md) | Retro/terminal/print aesthetics — a quick 40f cut behind an animated pixel-dither texture;… | Soft organic tone — the pixel grid reads technical; use `grain-dissolve` or… | 40f | retro | `@paper-design/shaders-react` |
| [`perlin-dissolve`](perlin-dissolve.md) | Organic, atmospheric chapter changes — a textured film dissolve that neutralizes strong… | Fast cuts — the threshold sweep needs ~100 frames; sharp geometric brand language — use… | 104f | premium | `@paper-design/shaders-react` |
| [`smoke-dissolve`](smoke-dissolve.md) | Moody, cinematic reveals emerging from mist — the new scene is born at the center of the… | Fast cuts; bright poster-like scenes — the smoke loses definition on light backgrounds | 104f | premium | `@paper-design/shaders-react` |

## UI Blocks

Tier `remocn`. Interface simulations for product demos.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`animated-bar-chart`](animated-bar-chart.md) | Showing comparative categorical metrics in a product demo — feature usage, plan… | The data represents change over time — continuous trends belong in… | 90f | data | — |
| [`animated-line-chart`](animated-line-chart.md) | Showing growth or trend over time — revenue curve, DAU climb, error-rate drop | The data is categorical (not time-ordered) — use `animated-bar-chart` to compare… | 90f | data | — |
| [`data-flow-pipes`](data-flow-pipes.md) | Visualizing a microservices or event-driven architecture where data moves between… | The workflow is sequential with discrete pass/fail steps — use `progress-steps`… | 180f | tech | — |
| [`glass-code-block`](glass-code-block.md) | A landing or hero scene needs an animated code backdrop that reads as "premium dev… | You need to animate a collapse of specific lines to focus attention — use… | 180f | tech | — |
| [`progress-steps`](progress-steps.md) | Showing a CI/CD pipeline, onboarding checklist, or multi-phase workflow completing step… | The data is quantitative and you need to show magnitudes — use `animated-bar-chart` or… | 150f | data | — |
| [`terminal-simulator`](terminal-simulator.md) | Demoing a CLI tool install sequence (`npm install`, `npx shadcn add`, build output) | You only need to type a single short string — use `typewriter` instead, which is… | 240f | tech | — |

## AI & Social Cards

Tier `remocn`. Brand / product card scenes. Render offline (gradient fallbacks).

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`chat-gpt`](chat-gpt.md) | Announcing a ChatGPT integration or GPT-powered feature where the OpenAI brand must be… | The product being demoed is Claude — use `claude-chat` instead to match Anthropic's UI… | 150f | tech | `@remocn/caret`, `@remocn/remocn-ui` |
| [`claude-chat`](claude-chat.md) | Announcing a Claude integration or Anthropic-powered feature where the Claude brand… | The product is Claude Code CLI — use `claude-code` instead, which shows the terminal… | 150f | tech | `@remocn/caret`, `@remocn/remocn-ui` |
| [`claude-code`](claude-code.md) | Depicting a Claude Code / agentic-CLI workflow as a recognizable branded surface in a… | You need a generic, unbranded terminal — use `terminal-simulator` | 160f | tech | `@remocn/caret`, `@remocn/remocn-ui` |
| [`github-stars`](github-stars.md) | Celebrating an OSS milestone — the count-up odometer landing on a star total is the… | You only need the number to roll up without the stargazer fly-through — use… | 120f | data | `@remocn/number-wheel` |
| [`logo-enter`](logo-enter.md) | Showing a cluster of brand/partner/integration logos arriving together ("works with…",… | You need a single product wordmark lockup — this is a multi-chip cluster, not one mark;… | 90f | social | — |
| [`opencode`](opencode.md) | Depicting the OpenCode TUI as a recognizable branded surface in a dev-tool demo | You're depicting a different product — use the matching card (`claude-code`, `v0`,… | 150f | tech | `@remocn/caret`, `@remocn/remocn-ui` |
| [`v0`](v0.md) | Depicting the Vercel v0 composer as a recognizable branded surface in a generative-UI… | You're depicting a different product — use the matching card (`chat-gpt`,… | 150f | tech | `@remocn/caret`, `@remocn/remocn-ui` |
| [`x-follow-card`](x-follow-card.md) | Showcasing a single X profile with the recognizable click-to-Follow payoff as the… | You're aggregating follower growth or notifications rather than one profile — use… | 165f | social | `@remocn/cursor` |
| [`x-followers-overview`](x-followers-overview.md) | A milestone or social-proof scene needs cycling follow notifications building to a… | You're highlighting one profile and a Follow click — use `x-follow-card` | 360f | data | `@remocn/confetti` |

## UI Primitives

Tier `remocn-ui`. Timeline-driven shadcn-style primitives. State-based API (`state`/`style`/`variant`), NO `speed`.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`accordion`](accordion.md) | Showing a collapsible FAQ or settings section expanding on a timeline cue | The content is always visible — there is no collapse state; lay it out statically… | 120f | clean | `@remocn/remocn-ui` |
| [`ai-prompt-flow`](ai-prompt-flow.md) | Demoing an AI product's full prompt-to-answer UX in a single self-contained scene | You only need to show a button press with a loading state — use `button` with… | state-driven | clean | `@remocn/remocn-ui`, `@remocn/input`, `@remocn/button`, `@remocn/skeleton`, `@remocn/skeleton-block`, `@remocn/toast` |
| [`alert-dialog`](alert-dialog.md) | Showing a destructive confirmation dialog (delete, reset, revoke) in a product demo | The action is non-destructive or form-based — use `dialog` instead | 120f | clean | `@remocn/remocn-ui` |
| [`blur-in`](blur-in.md) | Revealing an arbitrary JSX subtree (card, image, composed scene) with a premium blur… | You're animating a text-only line — use a purpose-built text reveal (`soft-blur-in`,… | 120f | premium | `@remocn/remocn-ui` |
| [`button`](button.md) | Showing the full interactive lifecycle of a CTA — hover → press → loading → success —… | You need a selectable row inside a menu — use `dropdown-menu-item` or… | 120f | clean | `@remocn/remocn-ui`, `@remocn/spinner` |
| [`caret`](caret.md) | Placing a blinking insertion cursor beside a text node or at the end of a typed string | You need the full input UX (focus ring, border, value reveal) — use `input` instead,… | 120f | tech | — |
| [`checkbox`](checkbox.md) | Showing a task being checked off in a to-do or onboarding list | The choice is mutually exclusive within a group — use `radio` instead | 120f | clean | `@remocn/remocn-ui` |
| [`checkout-flow`](checkout-flow.md) | Demoing a SaaS payment or upgrade UX end-to-end with cursor navigation and toast… | You only need a payment form without cursor animation — compose `field`, `input`,… | state-driven | clean | `@remocn/remocn-ui`, `@remocn/toggle-group`, `@remocn/input`, `@remocn/checkbox`, `@remocn/button`, `@remocn/field`, `@remocn/blur-in`, `@remocn/cursor`, `@remocn/toast` |
| [`combobox`](combobox.md) | Showing a searchable/filterable dropdown with a typed query narrowing the list on the… | The list is not filterable and selection is direct — use `select` (non-filterable… | 120f | clean | `@remocn/remocn-ui`, `@remocn/input`, `@remocn/select-item` |
| [`command-menu`](command-menu.md) | Demoing a ⌘K palette opening with a typed query filtering icon-labeled commands | The list has no icons or keyboard shortcuts and is triggered from a button — use… | 120f | tech | `@remocn/remocn-ui`, `@remocn/command-menu-item` |
| [`command-menu-item`](command-menu-item.md) | Isolating a single row's hover/press animation independently from the full palette | You want the full palette with search, backdrop, and multiple rows — use `command-menu`… | 120f | tech | `@remocn/remocn-ui` |
| [`context-menu`](context-menu.md) | Showing a right-click menu appearing at a cursor position over content in a product demo | The menu is triggered from a button in the UI — use `dropdown-menu` instead | 120f | clean | `@remocn/remocn-ui`, `@remocn/dropdown-menu-item` |
| [`cursor`](cursor.md) | Guiding the viewer's attention through a UI by animating a pointer between elements | You need a blinking text insertion cursor — use `caret` instead | 120f | clean | `@remocn/remocn-ui` |
| [`dialog`](dialog.md) | Showing a non-destructive modal (edit form, settings, profile update) opening and… | The action is irreversible or destructive — use `alert-dialog` instead | 120f | clean | `@remocn/remocn-ui` |
| [`drawer`](drawer.md) | Showing a mobile-style bottom sheet sliding up from the edge of the frame | The overlay should be a centered modal — use `dialog` instead | 120f | clean | `@remocn/remocn-ui` |
| [`dropdown-menu`](dropdown-menu.md) | Showing a button that opens an action list — the classic "Options" or account menu… | The menu is invoked by right-click at a cursor position — use `context-menu` instead | 120f | clean | `@remocn/remocn-ui`, `@remocn/button`, `@remocn/dropdown-menu-item` |
| [`dropdown-menu-item`](dropdown-menu-item.md) | Animating a single row's hover or press state independently from the full menu panel | You want the full dropdown with a button trigger and panel — use `dropdown-menu` instead | 120f | clean | `@remocn/remocn-ui` |
| [`field`](field.md) | Laying out one or more labeled form controls (label + animated input + description… | You need the control itself to animate — `field` is static layout only; place `input`,… | state-driven | clean | `@remocn/remocn-ui` |
| [`input`](input.md) | Showing a text field being focused, typed into, or validated at a specific frame | The trigger needs to open a searchable list — use `combobox` instead (which wraps input… | 120f | clean | `@remocn/remocn-ui`, `@remocn/caret` |
| [`onboarding-stepper-flow`](onboarding-stepper-flow.md) | Demoing a multi-step onboarding UX (account setup → plan selection → preferences) in… | The flow is a payment checkout — use `checkout-flow` instead (cursor-driven, card… | state-driven | clean | `@remocn/remocn-ui`, `@remocn/stepper`, `@remocn/input`, `@remocn/radio`, `@remocn/switch`, `@remocn/button` |
| [`popover`](popover.md) | Showing a hover-card with richer content (title + description) than a single-line… | You only need a single-line label — use `tooltip` instead (lighter, no… | 120f | clean | `@remocn/remocn-ui` |
| [`progress`](progress.md) | Showing a loading, upload, or completion bar animating to a target value | The state is binary (done/not done) — use `switch` instead | 120f | data | `@remocn/remocn-ui` |
| [`radio`](radio.md) | Demonstrating a single-choice selection moment in a form walkthrough | The control is binary on/off — use `switch` instead (sliding thumb reads more naturally… | 120f | clean | `@remocn/remocn-ui` |
| [`resizable`](resizable.md) | Demonstrating a code/preview split pane layout with its ratio animating across frames | You need fixed-width layout panels — plain CSS grid or flex avoids the drag-state… | 120f | clean | `@remocn/remocn-ui` |
| [`select`](select.md) | Demonstrating a dropdown menu opening and an option being highlighted or selected on… | You only need to show one item row in isolation — use `select-item` directly without… | 120f | clean | `@remocn/remocn-ui`, `@remocn/button`, `@remocn/select-item` |
| [`select-item`](select-item.md) | Building a custom select panel and needing item rows to animate their state… | You want the full dropdown with trigger button and panel — use `select` (the container)… | 120f | clean | `@remocn/remocn-ui` |
| [`settings-toggle-flow`](settings-toggle-flow.md) | Showing a complete settings interaction walkthrough for a product demo — zero assembly… | You need only one control type — use `switch`, `select`, or `slider` individually… | state-driven | clean | `@remocn/remocn-ui`, `@remocn/switch`, `@remocn/select`, `@remocn/slider`, `@remocn/button`, `@remocn/blur-in`, `@remocn/cursor`, `@remocn/toast` |
| [`sheet`](sheet.md) | Showing a slide-in edit panel or settings drawer with backdrop dim in a product demo | You need a full blocking modal with centered placement — use `alert-dialog` instead | 120f | clean | `@remocn/remocn-ui` |
| [`signup-flow`](signup-flow.md) | Showing a full onboarding or signup flow in a product launch or demo video | You need a generic form with custom fields — compose `input` + `button` + `cursor`… | state-driven | clean | `@remocn/remocn-ui`, `@remocn/cursor`, `@remocn/input`, `@remocn/button`, `@remocn/toast`, `@remocn/field`, `@remocn/blur-in` |
| [`skeleton`](skeleton.md) | Showing a loading state resolving to real content — the skeleton fades out as real UI… | You only need a single shimmer rectangle — use `skeleton-block` directly (no state API,… | 120f | clean | `@remocn/remocn-ui`, `@remocn/skeleton-block` |
| [`skeleton-block`](skeleton-block.md) | Building a custom skeleton layout by composing individual shimmer blocks at precise… | You want an automatic layout of shimmer + real content crossfade — use `skeleton`… | 120f | clean | `@remocn/remocn-ui` |
| [`slider`](slider.md) | Demonstrating a range control being dragged to a target value with hover/press thumb… | You need to show completion percentage with no thumb — use `progress` instead… | 120f | clean | `@remocn/remocn-ui` |
| [`spinner`](spinner.md) | Showing a loading indicator inside a button after a click (hover → press → loading… | You need a full-width loading bar with a track — use `progress` instead | 120f | clean | — |
| [`stepper`](stepper.md) | Showing a multi-step onboarding, checkout, or wizard flow advancing through numbered… | Steps have no sequential order — use `tabs` instead (tab switching without numbered… | 120f | clean | `@remocn/remocn-ui` |
| [`switch`](switch.md) | Showing a toggle being flipped in a settings panel walkthrough | The choice is one of multiple mutually exclusive options — use `radio` or `select`… | 120f | clean | `@remocn/remocn-ui` |
| [`tabs`](tabs.md) | Showing a tabbed UI switching between content panels in a product demo | Steps are sequential and ordered — use `stepper` instead (numbered connectors + check… | 120f | clean | `@remocn/remocn-ui` |
| [`toast`](toast.md) | Showing a success/error notification appear after an action (form submit, save, API… | The feedback is persistent and must not auto-dismiss — use a banner or inline alert… | 120f | clean | `@remocn/remocn-ui` |
| [`toggle-group`](toggle-group.md) | Showing a segmented control switching between view modes, time ranges, or mutually… | You need content panels that crossfade below the control — use `tabs` instead (full… | 120f | clean | `@remocn/remocn-ui` |
| [`tooltip`](tooltip.md) | Showing a hover tooltip appearing next to a UI element in a product walkthrough | You need title + description in the overlay — use `popover` instead (richer two-field… | 120f | clean | `@remocn/remocn-ui` |

## Core library

`@remocn/remocn-ui` — shared core lib (timeline-fold hook, theme context, color math) most UI Primitives depend on. Auto-installed transitively; you rarely add it directly. See `remocn-ui.md`.

