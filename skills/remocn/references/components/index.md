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

## Transitions & Wipes

Tier `remocn`. Swap between two scenes — wrap `from` / `to` as ReactNode plus `transitionDuration`.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`chromatic-aberration-wipe`](chromatic-aberration-wipe.md) | Cuts between scenes need to feel fast, kinetic, and slightly chaotic — tech product… | The video tone is calm, professional, or corporate — the RGB glitch reads as… | 90f | premium | — |
| [`device-mockup-zoom`](device-mockup-zoom.md) | An app demo video needs the classic "zoom out to reveal the product in a device" moment | You are transitioning between two unrelated scenes — this is a reveal effect for a… | 120f | premium | — |
| [`directional-wipe`](directional-wipe.md) | Scenes are spatially related and should feel like pages sliding — feature steps,… | You want a dramatic, high-energy cut — the slide is clean but understated; use… | 90f | premium | — |
| [`frosted-glass-wipe`](frosted-glass-wipe.md) | The video tone is refined and editorial — the frosted pane reads as premium Apple-style… | The transition needs to be fast or punchy — `transitionDuration` of 30 frames is a… | 90f | premium | — |
| [`grid-pixelate-wipe`](grid-pixelate-wipe.md) | The transition should feel designed and deliberate — the grid dissolve reads as an… | The scenes are spatially related and the transition should feel like physical movement… | 90f | premium | — |
| [`image-expand-to-fullscreen`](image-expand-to-fullscreen.md) | You are demoing an image editing, content creation, or media app and want to show the… | You need a generic scene-to-scene swap — this component encodes a specific feed→editor… | 180f | premium | — |
| [`spatial-push`](spatial-push.md) | The narrative moves deeper into a topic — "zooming in" on a feature, entering a… | You need a fast, energy-forward cut — the scale-based push reads as deliberate and… | 90f | premium | — |
| [`zoom-through-transition`](zoom-through-transition.md) | The outgoing scene needs a dramatic, high-velocity exit that commands attention before… | You need a two-sided transition (swap `from` and `to` scenes in one component) —… | 60f | premium | — |

## UI Blocks

Tier `remocn`. Interface simulations for product demos.

| Component | Use for | Avoid for | Length | Vibe | Deps |
|---|---|---|---|---|---|
| [`animated-bar-chart`](animated-bar-chart.md) | Showing comparative categorical metrics in a product demo — feature usage, plan… | The data represents change over time — continuous trends belong in… | 90f | data | — |
| [`animated-line-chart`](animated-line-chart.md) | Showing growth or trend over time — revenue curve, DAU climb, error-rate drop | The data is categorical (not time-ordered) — use `animated-bar-chart` to compare… | 90f | data | — |
| [`code-accordion`](code-accordion.md) | Demoing a refactor or AI edit where boilerplate collapses to focus on the changed lines | You want to show a before/after diff between two versions of a file — use… | 150f | tech | — |
| [`code-diff-wipe`](code-diff-wipe.md) | Showing an AI-assisted code transformation — old implementation wipes away to reveal… | You want to collapse/fold part of a file to focus attention — use `code-accordion`… | 120f | tech | — |
| [`data-flow-pipes`](data-flow-pipes.md) | Visualizing a microservices or event-driven architecture where data moves between… | The workflow is sequential with discrete pass/fail steps — use `progress-steps`… | 180f | tech | — |
| [`drag-and-drop-flow`](drag-and-drop-flow.md) | Demoing a file upload or import feature in a product walkthrough scene | The interaction you're demoing involves multiple tools or a palette — use… | 150f | tech | — |
| [`glass-code-block`](glass-code-block.md) | A landing or hero scene needs an animated code backdrop that reads as "premium dev… | You need to animate a collapse of specific lines to focus attention — use… | 180f | tech | — |
| [`progress-steps`](progress-steps.md) | Showing a CI/CD pipeline, onboarding checklist, or multi-phase workflow completing step… | The data is quantitative and you need to show magnitudes — use `animated-bar-chart` or… | 150f | data | — |
| [`terminal-simulator`](terminal-simulator.md) | Demoing a CLI tool install sequence (`npm install`, `npx shadcn add`, build output) | You only need to type a single short string — use `typewriter` instead, which is… | 240f | tech | — |
| [`tool-menu-slide-in`](tool-menu-slide-in.md) | Demoing an AI-powered editor or design tool where a contextual action bar appears after… | The interaction is a file being dropped into a zone — use `drag-and-drop-flow` instead | 180f | tech | — |

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

