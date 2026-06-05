# remocn Component Reference

Complete props and usage for all 65 components. Install any component:

```bash
npx shadcn@latest add https://remocn.dev/r/<name>.json
```

---

## Text Animations

### blur-reveal

Text fades from heavy blur to sharp focus.

```tsx
<BlurReveal text="Hello World" blur={10} fontSize={48} color="#171717" fontWeight={600} speed={1} />
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Text to reveal |
| `blur` | `number` | `10` | Initial blur radius in px |
| `fontSize` | `number` | `48` | Font size |
| `color` | `string` | `"#171717"` | Text color |
| `fontWeight` | `number` | `600` | Font weight |
| `speed` | `number` | `1` | Time multiplier |

### typewriter

Character-by-character typing with deterministic blinking cursor.

```tsx
<Typewriter text="npm install remocn" charsPerSecond={20} cursor={true} cursorColor="#22c55e" />
```

| Prop | Type | Default |
|---|---|---|
| `text` | `string` | required |
| `cursor` | `boolean` | `true` |
| `charsPerSecond` | `number` | `20` |
| `cursorColor` | `string` | `"#fafafa"` |
| `fontSize` | `number` | `48` |
| `color` | `string` | `"#171717"` |

### inline-highlight

Animate one word's color in a sentence using `interpolateColors`.

```tsx
<InlineHighlight text="Build videos fast" highlightWord="fast" toColor="#0ea5e9" />
```

### text-fade-replace

Cross-fade between two strings without layout shift. Uses `position: absolute` layering.

```tsx
<TextFadeReplace from="Loading..." to="Complete!" />
```

### strikethrough-replace

Draws strike line across old text, then reveals new text.

```tsx
<StrikethroughReplace from="$99/mo" to="$49/mo" />
```

### staggered-fade-up

Words fade in and slide up one after another.

```tsx
<StaggeredFadeUp text="Build amazing videos" staggerDelay={5} distance={20} fontSize={64} />
```

| Prop | Type | Default |
|---|---|---|
| `text` | `string` | required |
| `staggerDelay` | `number` | `5` |
| `distance` | `number` | `20` |

### masked-slide-reveal

Words slide up from behind a clipped mask (`overflow: hidden` container with fixed `line-height`).

```tsx
<MaskedSlideReveal text="Reveal from below" />
```

### tracking-in

Letter-spacing collapses from wide to normal with spring bounce + blur clear.

```tsx
<TrackingIn text="LAUNCH" />
```

### shimmer-sweep

Light sweep across muted text using `background-clip: text` and `background-position` animation.

```tsx
<ShimmerSweep text="AI-powered generation" />
```

### marker-highlight

Colored marker block draws behind a phrase. Uses `::after` or absolute div with `z-index: -1`.

```tsx
<MarkerHighlight text="Important" highlightColor="#facc15" />
```

### slot-machine-roll

Vertical reel scrolls characters from one value to another. `overflow: hidden` container.

```tsx
<SlotMachineRoll from="$99" to="$199" />
```

### matrix-decode

Random characters resolve left-to-right. Uses `random(seed)` from `@remotion/random`.

```tsx
<MatrixDecode text="ENCRYPTED" />
```

### rgb-glitch-text

Three RGB-offset text copies jitter briefly. Three `position: absolute` layers offset 2-5px.

```tsx
<RGBGlitchText text="GLITCH" />
```

### infinite-marquee

Seamless looping horizontal strip. Duplicated content with `translateX` cycling.

```tsx
<InfiniteMarquee text="REMOCN · REMOTION · REACT ·" />
```

---

## Backgrounds & Primitives

### mesh-gradient-bg

Drifting gradient blobs. Accepts color array.

```tsx
<MeshGradientBg colors={["#0ea5e9", "#9333ea", "#f97316"]} blur={120} />
```

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | blue/purple/orange |
| `blur` | `number` | `120` |
| `background` | `string` | `"#050505"` |

### dynamic-grid

Moving grid/dot background via CSS `linear-gradient` or SVG `<pattern>`.

```tsx
<DynamicGrid cellSize={40} />
```

### spring-pop-in

Elastic scale-in wrapper. Wraps any children.

```tsx
<SpringPopIn damping={12} mass={1} stiffness={100} delayInFrames={0}>
  <MyComponent />
</SpringPopIn>
```

| Prop | Type | Default |
|---|---|---|
| `children` | `ReactNode` | default demo card |
| `damping` | `number` | `12` |
| `mass` | `number` | `1` |
| `stiffness` | `number` | `100` |
| `delayInFrames` | `number` | `0` |

### simulated-cursor

Mouse cursor following waypoints with click ripple.

```tsx
<SimulatedCursor waypoints={[{ x: 100, y: 200 }, { x: 500, y: 300, click: true }]} />
```

### pulsing-indicator

Continuous pulse using `Math.sin(frame / speed)` mapped to scale 0.9–1.1.

```tsx
<PulsingIndicator />
```

---

## Transitions & Wipes

All transitions accept `from` and `to` as `ReactNode` children (the two scenes).

### frosted-glass-wipe

Sliding frosted glass pane reveals new scene. Three layers: Scene A, Scene B, glass panel.

```tsx
<FrostedGlassWipe
  from={<SceneA />}
  to={<SceneB />}
  transitionDuration={30}
  glassBlur={24}
/>
```

| Prop | Type | Default |
|---|---|---|
| `from` | `ReactNode` | blue panel |
| `to` | `ReactNode` | purple panel |
| `transitionStart` | `number` | 40% of duration |
| `transitionDuration` | `number` | `30` |
| `glassBlur` | `number` | `24` |

### chromatic-aberration-wipe

Ultra-fast slide with RGB glitch at peak velocity.

```tsx
<ChromaticAberrationWipe from={<A />} to={<B />} aberrationOffset={8} />
```

### directional-wipe

Classic push/slide transition. Uses `transform: translateX/Y` (never `left`/`top`).

```tsx
<DirectionalWipe from={<A />} to={<B />} direction="left" />
```

### kinetic-type-mask

Giant text masks the next scene. Text scales exponentially via `transform: scale(100)`.

```tsx
<KineticTypeMask text="NEXT" from={<A />} to={<B />} />
```

### spatial-push

New scene physically presses old one back with 3D perspective.

```tsx
<SpatialPush from={<A />} to={<B />} />
```

### grid-pixelate-wipe

Dissolve through deterministic grid of mask cells.

```tsx
<GridPixelateWipe from={<A />} to={<B />} columns={12} rows={8} />
```

### zoom-through-transition

Aggressive scale into element center with exponential easing.

```tsx
<ZoomThroughTransition from={<A />} to={<B />} />
```

### swipe-transition-wipe

Side-by-side flick with parallax background and darkening outgoing layer.

```tsx
<SwipeTransitionWipe from={<A />} to={<B />} />
```

---

## UI Blocks

### glass-code-block

Premium frosted-glass code window with regex tokenizer and staggered line reveal.

```tsx
<GlassCodeBlock
  code={`const x = 42;\nconsole.log(x);`}
  title="app.tsx"
  fontSize={16}
  staggerFrames={3}
/>
```

| Prop | Type | Default |
|---|---|---|
| `code` | `string` | sample code |
| `title` | `string` | `"app.tsx"` |
| `fontSize` | `number` | `16` |
| `staggerFrames` | `number` | `3` |
| `showTrafficLights` | `boolean` | `true` |
| `glassColor` | `string` | semi-transparent |

### terminal-simulator

CLI window with chunked line output and step-function scroll.

```tsx
<TerminalSimulator
  lines={[
    { text: "npm run build", type: "command", delay: 0 },
    { text: "Compiling...", type: "log", delay: 12 },
    { text: "Build complete", type: "success", delay: 14 },
  ]}
  prompt="$"
  title="~/project"
/>
```

Line types: `"command"` | `"log"` | `"success"` | `"error"`. Lines ending in `"..."` auto-pause for 18 frames.

### browser-flow

Full Safari/Chrome simulation: typed URL, progress bar, page render, scroll, cursor click.

```tsx
<BrowserFlow url="https://remocn.dev" />
```

### animated-line-chart

SVG line chart that draws via `stroke-dashoffset` animation with optional leading dot.

```tsx
<AnimatedLineChart data={[10, 40, 30, 80, 60, 90]} strokeColor="#0ea5e9" />
```

### animated-bar-chart

Bars spring up from baseline in staggered cascade via `scaleY` with `transform-origin: bottom`.

```tsx
<AnimatedBarChart data={[40, 70, 30, 90, 55]} />
```

### cursor-flow

Realistic bezier-pathed mouse movement with click physics (scale dip on click target).

```tsx
<CursorFlow
  waypoints={[
    { x: 200, y: 300, hold: 10 },
    { x: 600, y: 400, click: true, label: "Submit" },
  ]}
  segmentDuration={30}
/>
```

### data-flow-pipes

Glowing packets on SVG bezier pipes using `stroke-dasharray` + `stroke-dashoffset` animation.

```tsx
<DataFlowPipes nodes={[...]} />
```

### morphing-modal

Card lifts from grid and blooms to full-screen. Heavy spring on 5 properties simultaneously.

```tsx
<MorphingModal />
```

### code-diff-wipe

Before/after code via `clip-path: inset()` animation.

```tsx
<CodeDiffWipe before={oldCode} after={newCode} />
```

### code-accordion

Collapses a line range with spring height animation. Placeholder shows "N lines collapsed".

```tsx
<CodeAccordion code={longCode} collapseFrom={10} collapseTo={45} />
```

### toast-notification

Positioned toast with spring entry and interpolated exit.

```tsx
<ToastNotification message="Deployed!" type="success" />
```

### device-mockup-zoom

Pull back from UI to reveal it inside device frame loaded via `staticFile()`.

```tsx
<DeviceMockupZoom device="laptop" />
```

### spotlight-card

Radial gradient follows cursor coordinates over card's microborder.

```tsx
<SpotlightCard />
```

### perspective-marquee

3D-tilted infinite marquee with depth-of-field blur on distant items.

```tsx
<PerspectiveMarquee items={["Logo1", "Logo2", "Logo3"]} />
```

### success-confetti

Deterministic confetti using `random(seed)` from `@remotion/random`. Canvas-rendered particles.

```tsx
<SuccessConfetti headline="Shipped!" />
```

---

## Full Compositions

### product-launch-trailer

Multi-scene cinematic sequence: pulsing logo → zoom-through → 3D bento fly-over → confetti.

```tsx
<ProductLaunchTrailer
  logoLabel="⚡"
  productName="My App"
  versionLabel="v1.0"
  accentPeach="#fbbf24"
  accentLavender="#a78bfa"
  accentMint="#34d399"
/>
```

### dashboard-populate

Empty dashboard cascades to life: KPI count-ups, bar bounces, line traces, donut fill.

```tsx
<DashboardPopulate accentColor="#0ea5e9" kpiTarget={12847} />
```

### terminal-to-browser-deploy

CLI deploy completes → terminal blurs → browser window springs from deploy URL.

```tsx
<TerminalToBrowserDeploy />
```

### landing-code-showcase

Split-screen: code types on left, preview renders on right with sparks.

```tsx
<LandingCodeShowcase />
```

### changelog-bite

Looping square card: before/after diff with frosted glass wipe and pulsing "New" pill.

```tsx
<ChangelogBite />
```

### hero-device-assemble

Floating layers spring together into laptop/phone mockup, screen wakes with shimmer.

```tsx
<HeroDeviceAssemble />
```

### pipeline-journey

Kanban ticket arcs across columns with landing effects and final confetti.

```tsx
<PipelineJourney />
```

### ecosystem-constellation

Central logo orbited by integration satellites with pulsing data lines.

```tsx
<EcosystemConstellation />
```

### ai-generation-canvas

Prompt input → header morph → skeleton dashboard → populated cards.

```tsx
<AIGenerationCanvas />
```

### visual-docs-snippet

Tutorial flow: cursor arcs to button, clicks, bounding box + tooltip explain result.

```tsx
<VisualDocsSnippet />
```
