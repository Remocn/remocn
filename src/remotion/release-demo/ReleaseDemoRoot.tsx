import { Composition } from "remotion";
import { ReleaseDemo, releaseDemoLength } from "./release-demo";
import { releaseDemoSchema } from "./selection";

// Remocn 3 release film. Hard cuts only. Registered by release-demo-entry.ts;
// Studio finds this file from that entry's name, which lets it save props.
// Studio: bun run studio:release-demo. Switch categories and pieces on and
// off in the props panel and press Save: Studio writes them back into the
// defaultProps literal below, which is why it stays a plain literal.
// Render: bun run render:release-demo
export function ReleaseDemoRoot() {
  return (
    <Composition
      id="release-demo"
      component={ReleaseDemo}
      schema={releaseDemoSchema}
      calculateMetadata={({ props }) => ({
        durationInFrames: releaseDemoLength(props),
      })}
      durationInFrames={300}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        speed: 2,
        minShare: 0.5,
        categories: [
          {
            title: "Typography",
            enabled: true,
            pieces: [
              {
                name: "bug-dock",
                enabled: true,
              },
              {
                name: "aspect-slit",
                enabled: false,
              },
              {
                name: "double-take",
                enabled: false,
              },
              {
                name: "headline-to-line",
                enabled: false,
              },
              {
                name: "intelligence-glow",
                enabled: true,
              },
              {
                name: "negation-drop",
                enabled: true,
                seconds: 1.5,
              },
              {
                name: "phrase-list-bridge",
                enabled: true,
              },
              {
                name: "point-expand",
                enabled: false,
              },
              {
                name: "riddle-clues",
                enabled: false,
              },
              {
                name: "uncomment-line",
                enabled: true,
                seconds: 1.5,
              },
              {
                name: "block-swap",
                enabled: true,
              },
              {
                name: "cooling-type",
                enabled: true,
              },
              {
                name: "cover-ring",
                enabled: true,
              },
              {
                name: "dot-type",
                enabled: true,
              },
              {
                name: "parallax-lockup",
                enabled: true,
              },
              {
                name: "pulse-line",
                enabled: true,
              },
              {
                name: "rewrite-bars",
                enabled: false,
              },
              {
                name: "stripe-mask",
                enabled: false,
              },
              {
                name: "torn-edge",
                enabled: false,
              },
              {
                name: "word-pullback",
                enabled: false,
              },
              {
                name: "drop-timer",
                enabled: true,
              },
              {
                name: "escalate-cards",
                enabled: true,
                share: 1,
              },
              {
                name: "line-relief",
                enabled: true,
              },
              {
                name: "round-slam",
                enabled: true,
              },
              {
                name: "sold-out",
                enabled: true,
              },
              {
                name: "strobe-words",
                enabled: true,
              },
              {
                name: "pass-swap",
                enabled: false,
              },
              {
                name: "yes-run",
                enabled: true,
                speed: 1,
              },
              {
                name: "liquid-word",
                enabled: true,
              },
              {
                name: "macro-letter-pan",
                enabled: true,
              },
              {
                name: "stack-letters",
                enabled: true,
              },
              {
                name: "absorb-stack",
                enabled: false,
              },
              {
                name: "and-you",
                enabled: false,
              },
              {
                name: "answer-first",
                enabled: false,
              },
              {
                name: "beta-thanks",
                enabled: false,
              },
              {
                name: "changelog-scroll",
                enabled: false,
              },
              {
                name: "chore-fold",
                enabled: false,
              },
              {
                name: "column-reflow",
                enabled: false,
              },
              {
                name: "cool-down",
                enabled: false,
              },
              {
                name: "coy-denial",
                enabled: false,
              },
              {
                name: "crew-of-one",
                enabled: false,
              },
              {
                name: "crunch",
                enabled: false,
              },
              {
                name: "cut-off",
                enabled: false,
              },
              {
                name: "edit-ripple",
                enabled: false,
              },
              {
                name: "embargo-lift",
                enabled: false,
              },
              {
                name: "exactly",
                enabled: false,
              },
              {
                name: "factor-out",
                enabled: false,
              },
              {
                name: "feature-trio",
                enabled: false,
              },
              {
                name: "filler-cut",
                enabled: false,
              },
              {
                name: "fine-print-up",
                enabled: false,
              },
              {
                name: "hot-stage",
                enabled: false,
              },
              {
                name: "idea-set",
                enabled: false,
              },
              {
                name: "in-proportion",
                enabled: false,
              },
              {
                name: "indent-steps",
                enabled: false,
              },
              {
                name: "index-list",
                enabled: false,
              },
              {
                name: "keep-words",
                enabled: false,
              },
              {
                name: "known-terms",
                enabled: false,
              },
              {
                name: "landing-confirmed",
                enabled: false,
              },
              {
                name: "loop-break",
                enabled: false,
              },
              {
                name: "moves-up",
                enabled: false,
              },
              {
                name: "name-gloss",
                enabled: false,
              },
              {
                name: "no-buts",
                enabled: false,
              },
              {
                name: "not-yet",
                enabled: false,
              },
              {
                name: "overnight",
                enabled: false,
              },
              {
                name: "peek-shut",
                enabled: false,
              },
              {
                name: "pitch-blanks",
                enabled: false,
              },
              {
                name: "plain-license",
                enabled: false,
              },
              {
                name: "post-script",
                enabled: false,
              },
              {
                name: "rsvp",
                enabled: false,
              },
              {
                name: "run-on",
                enabled: false,
              },
              {
                name: "script-cut",
                enabled: false,
              },
              {
                name: "scrub-reveal",
                enabled: false,
              },
              {
                name: "story-dip",
                enabled: false,
              },
              {
                name: "tagline-justify",
                enabled: false,
              },
              {
                name: "they-are-you",
                enabled: false,
              },
              {
                name: "three-steps",
                enabled: false,
              },
              {
                name: "tldr-on-top",
                enabled: false,
              },
              {
                name: "turnabout",
                enabled: false,
              },
              {
                name: "verbed",
                enabled: false,
              },
              {
                name: "we-call-it",
                enabled: false,
              },
              {
                name: "week-shipped",
                enabled: false,
              },
              {
                name: "what-sticks",
                enabled: false,
              },
              {
                name: "which-means",
                enabled: false,
              },
              {
                name: "whole-page",
                enabled: false,
              },
              {
                name: "your-name-here",
                enabled: false,
              },
              {
                name: "acronym-expand",
                enabled: false,
              },
              {
                name: "baseline-drop",
                enabled: false,
              },
              {
                name: "beam-split",
                enabled: false,
              },
              {
                name: "bokeh-title",
                enabled: false,
              },
              {
                name: "comet-headline",
                enabled: false,
              },
              {
                name: "counter-reveal",
                enabled: false,
              },
              {
                name: "cursor-frame",
                enabled: false,
              },
              {
                name: "depth-headline",
                enabled: false,
              },
              {
                name: "ellipsis-resolve",
                enabled: false,
              },
              {
                name: "enhance-count",
                enabled: false,
              },
              {
                name: "feather-settle",
                enabled: false,
              },
              {
                name: "feature-headline",
                enabled: false,
              },
              {
                name: "flick-swap",
                enabled: false,
              },
              {
                name: "focus-pan-text",
                enabled: false,
              },
              {
                name: "glass-capsule",
                enabled: false,
              },
              {
                name: "grid-cell",
                enabled: false,
              },
              {
                name: "italic-speed",
                enabled: false,
              },
              {
                name: "lights-out",
                enabled: false,
              },
              {
                name: "macro-pan",
                enabled: false,
              },
              {
                name: "mono-settle",
                enabled: false,
              },
              {
                name: "mono-voice",
                enabled: false,
              },
              {
                name: "ndot-resolve",
                enabled: false,
              },
              {
                name: "out-of-context",
                enabled: false,
              },
              {
                name: "path-text",
                enabled: false,
              },
              {
                name: "photo-caret",
                enabled: false,
              },
              {
                name: "photo-fill-type",
                enabled: false,
              },
              {
                name: "point-intro",
                enabled: false,
              },
              {
                name: "poster-crop",
                enabled: false,
              },
              {
                name: "prompt-restyle",
                enabled: false,
              },
              {
                name: "scan-reveal",
                enabled: false,
              },
              {
                name: "serif-rise",
                enabled: false,
              },
              {
                name: "slash-wipe",
                enabled: false,
              },
              {
                name: "slide-doors",
                enabled: false,
              },
              {
                name: "slit-scan",
                enabled: false,
              },
              {
                name: "speed-ramp-word",
                enabled: false,
              },
              {
                name: "spotlight-text",
                enabled: false,
              },
              {
                name: "two-hit",
                enabled: false,
              },
              {
                name: "unmask-line",
                enabled: false,
              },
              {
                name: "wake-wipe",
                enabled: false,
              },
              {
                name: "waveform-title",
                enabled: false,
              },
              {
                name: "word-gap-media",
                enabled: false,
              },
              {
                name: "boss-bar",
                enabled: false,
              },
              {
                name: "chunk-stack",
                enabled: false,
              },
              {
                name: "edge-fit",
                enabled: false,
              },
              {
                name: "feature-chips-flow",
                enabled: false,
              },
              {
                name: "full-bleed-type",
                enabled: false,
              },
              {
                name: "glyph-relay",
                enabled: false,
              },
              {
                name: "got-em",
                enabled: false,
              },
              {
                name: "hook-uncurl",
                enabled: false,
              },
              {
                name: "kill-feed",
                enabled: false,
              },
              {
                name: "ko-count",
                enabled: false,
              },
              {
                name: "oval-type",
                enabled: false,
              },
              {
                name: "rep-stack",
                enabled: false,
              },
              {
                name: "spine-turn",
                enabled: false,
              },
              {
                name: "split-word",
                enabled: false,
              },
              {
                name: "tategaki-turn",
                enabled: false,
              },
              {
                name: "walkout-name",
                enabled: false,
              },
              {
                name: "word-acts",
                enabled: false,
              },
              {
                name: "word-stack",
                enabled: false,
              },
              {
                name: "wrapped-squash",
                enabled: false,
              },
              {
                name: "anagram-shuffle",
                enabled: false,
              },
              {
                name: "diff-swap",
                enabled: false,
              },
              {
                name: "flank-roll-swap",
                enabled: false,
              },
              {
                name: "focus-front-swap",
                enabled: false,
              },
              {
                name: "half-built",
                enabled: false,
              },
              {
                name: "layout-swap",
                enabled: false,
              },
              {
                name: "layover",
                enabled: false,
              },
              {
                name: "less-more",
                enabled: false,
              },
              {
                name: "nonstop",
                enabled: false,
              },
              {
                name: "on-approach",
                enabled: false,
              },
              {
                name: "pinned-word",
                enabled: false,
              },
              {
                name: "pull-in",
                enabled: false,
              },
              {
                name: "ruby-press",
                enabled: false,
              },
              {
                name: "select-replace",
                enabled: false,
              },
              {
                name: "typo-fix",
                enabled: false,
              },
              {
                name: "width-lock",
                enabled: false,
              },
              {
                name: "word-insert",
                enabled: false,
              },
              {
                name: "word-ladder",
                enabled: false,
              },
              {
                name: "a-to-z",
                enabled: false,
              },
              {
                name: "axis-flex",
                enabled: false,
              },
              {
                name: "caret-letter",
                enabled: false,
              },
              {
                name: "case-flip",
                enabled: false,
              },
              {
                name: "font-cycle",
                enabled: false,
              },
              {
                name: "hidden-word",
                enabled: false,
              },
              {
                name: "kerning-snap",
                enabled: false,
              },
              {
                name: "letter-relay",
                enabled: false,
              },
              {
                name: "long-vowel",
                enabled: false,
              },
              {
                name: "magnet-letters",
                enabled: false,
              },
              {
                name: "rubberband-word",
                enabled: false,
              },
              {
                name: "ruler-align",
                enabled: false,
              },
              {
                name: "scissors-cut",
                enabled: false,
              },
              {
                name: "shed-weight",
                enabled: false,
              },
              {
                name: "squeeze-out",
                enabled: false,
              },
              {
                name: "tittle-drop",
                enabled: false,
              },
              {
                name: "weight-wave",
                enabled: false,
              },
              {
                name: "changed-mind",
                enabled: false,
              },
              {
                name: "deadpan-box",
                enabled: false,
              },
              {
                name: "overheard",
                enabled: false,
              },
              {
                name: "quote-hero",
                enabled: false,
              },
              {
                name: "said-who",
                enabled: false,
              },
            ],
          },
          {
            title: "Numbers & Stats",
            enabled: true,
            pieces: [
              {
                name: "compact-stat",
                enabled: false,
              },
              {
                name: "dot-globe",
                enabled: true,
              },
              {
                name: "dot-map",
                enabled: true,
              },
              {
                name: "figure-reels",
                enabled: true,
              },
              {
                name: "figure-to-label",
                enabled: true,
              },
              {
                name: "grid-snap-poster",
                enabled: true,
              },
              {
                name: "level-up",
                enabled: true,
              },
              {
                name: "magnitude-push",
                enabled: true,
              },
              {
                name: "point-hop",
                enabled: true,
              },
              {
                name: "raster-paint",
                enabled: false,
              },
              {
                name: "shape-pack",
                enabled: false,
              },
              {
                name: "stat-inline",
                enabled: false,
              },
              {
                name: "stem-stretch",
                enabled: true,
              },
              {
                name: "studio-reflection",
                enabled: true,
              },
              {
                name: "tall-count",
                enabled: true,
              },
              {
                name: "ticker-tape",
                enabled: true,
              },
              {
                name: "uptime-strip",
                enabled: false,
              },
              {
                name: "zero-stretch",
                enabled: true,
              },
              {
                name: "churn-count",
                enabled: false,
              },
              {
                name: "combo-counter",
                enabled: true,
              },
              {
                name: "contribution-heatmap",
                enabled: false,
              },
              {
                name: "diminuendo",
                enabled: true,
              },
              {
                name: "live-ticker",
                enabled: false,
              },
              {
                name: "lumen-count",
                enabled: false,
              },
              {
                name: "number-mosaic",
                enabled: true,
              },
              {
                name: "smash-count",
                enabled: false,
              },
              {
                name: "candle-rally",
                enabled: true,
              },
              {
                name: "chart-morph",
                enabled: false,
              },
              {
                name: "crosshair-lock",
                enabled: false,
              },
              {
                name: "growth-line",
                enabled: false,
              },
              {
                name: "off-the-charts",
                enabled: false,
              },
              {
                name: "sankey-flow",
                enabled: true,
              },
              {
                name: "sparkline-thread",
                enabled: false,
              },
              {
                name: "stacked-shift",
                enabled: true,
              },
              {
                name: "time-breakdown",
                enabled: true,
              },
              {
                name: "dot-sort",
                enabled: false,
              },
              {
                name: "high-score",
                enabled: true,
              },
              {
                name: "measure-dim",
                enabled: true,
              },
              {
                name: "timer-duel",
                enabled: true,
              },
              {
                name: "clock-sweep",
                enabled: true,
              },
              {
                name: "bracket-focus",
                enabled: false,
              },
              {
                name: "branch-tree",
                enabled: false,
              },
              {
                name: "chevron-run",
                enabled: false,
              },
              {
                name: "concentric-scale",
                enabled: false,
              },
              {
                name: "domino-run",
                enabled: false,
              },
              {
                name: "fraction-split",
                enabled: false,
              },
              {
                name: "hatch-shade",
                enabled: false,
              },
              {
                name: "hex-fill",
                enabled: false,
              },
              {
                name: "lean-count",
                enabled: false,
              },
              {
                name: "line-cascade",
                enabled: false,
              },
              {
                name: "max-q",
                enabled: false,
              },
              {
                name: "moire-reveal",
                enabled: false,
              },
              {
                name: "mvp-card",
                enabled: false,
              },
              {
                name: "number-split",
                enabled: false,
              },
              {
                name: "plus-open",
                enabled: false,
              },
              {
                name: "press-stat",
                enabled: false,
              },
              {
                name: "radial-bars",
                enabled: false,
              },
              {
                name: "rank-climb",
                enabled: false,
              },
              {
                name: "roman-edition",
                enabled: false,
              },
              {
                name: "spec-sheet",
                enabled: false,
              },
              {
                name: "stat-rail",
                enabled: false,
              },
              {
                name: "stat-sequence",
                enabled: false,
              },
              {
                name: "thread-weave",
                enabled: false,
              },
              {
                name: "times-turn",
                enabled: false,
              },
              {
                name: "timing-tower",
                enabled: false,
              },
              {
                name: "unit-grid",
                enabled: false,
              },
              {
                name: "version-hero",
                enabled: false,
              },
              {
                name: "abacus-count",
                enabled: false,
              },
              {
                name: "beat-count",
                enabled: false,
              },
              {
                name: "carry-count",
                enabled: false,
              },
              {
                name: "cell-divide",
                enabled: false,
              },
              {
                name: "core-sum",
                enabled: false,
              },
              {
                name: "flash-count",
                enabled: false,
              },
              {
                name: "fuchidori-count",
                enabled: false,
              },
              {
                name: "gear-shift",
                enabled: false,
              },
              {
                name: "module-count",
                enabled: false,
              },
              {
                name: "packed-count",
                enabled: false,
              },
              {
                name: "pitch-over",
                enabled: false,
              },
              {
                name: "res-climb",
                enabled: false,
              },
              {
                name: "row-count",
                enabled: false,
              },
              {
                name: "slim-count",
                enabled: false,
              },
              {
                name: "stripe-count",
                enabled: false,
              },
              {
                name: "tally-marks",
                enabled: false,
              },
              {
                name: "weight-cut",
                enabled: false,
              },
              {
                name: "activity-rings",
                enabled: false,
              },
              {
                name: "block-city",
                enabled: false,
              },
              {
                name: "bubble-pack",
                enabled: false,
              },
              {
                name: "cut-stat",
                enabled: false,
              },
              {
                name: "distribution-shift",
                enabled: false,
              },
              {
                name: "flow-arrow",
                enabled: false,
              },
              {
                name: "galton-stack",
                enabled: false,
              },
              {
                name: "log-rescale",
                enabled: false,
              },
              {
                name: "pixel-bars",
                enabled: false,
              },
              {
                name: "ridgeline",
                enabled: false,
              },
              {
                name: "share-donut",
                enabled: false,
              },
              {
                name: "slope-chart",
                enabled: false,
              },
              {
                name: "spring-bars",
                enabled: false,
              },
              {
                name: "streamgraph",
                enabled: false,
              },
              {
                name: "treemap-split",
                enabled: false,
              },
              {
                name: "waterfall-chart",
                enabled: false,
              },
              {
                name: "area-compare",
                enabled: false,
              },
              {
                name: "balance-beam",
                enabled: false,
              },
              {
                name: "beeswarm",
                enabled: false,
              },
              {
                name: "benchmark-race",
                enabled: false,
              },
              {
                name: "dumbbell-shift",
                enabled: false,
              },
              {
                name: "quadrant-plot",
                enabled: false,
              },
              {
                name: "radar-compare",
                enabled: false,
              },
              {
                name: "score-bug",
                enabled: false,
              },
              {
                name: "speed-trap",
                enabled: false,
              },
              {
                name: "thin-slab",
                enabled: false,
              },
              {
                name: "versus-split",
                enabled: false,
              },
              {
                name: "calendar-pick",
                enabled: false,
              },
              {
                name: "countdown",
                enabled: false,
              },
              {
                name: "launch-date",
                enabled: false,
              },
              {
                name: "ruler-scrub",
                enabled: false,
              },
              {
                name: "shot-clock",
                enabled: false,
              },
              {
                name: "single-stroke",
                enabled: false,
              },
              {
                name: "split-flash",
                enabled: false,
              },
              {
                name: "t-minus",
                enabled: false,
              },
              {
                name: "free-as-in",
                enabled: false,
              },
              {
                name: "ipo-open",
                enabled: false,
              },
              {
                name: "price-page",
                enabled: false,
              },
              {
                name: "price-slate",
                enabled: false,
              },
              {
                name: "the-tab",
                enabled: false,
              },
            ],
          },
          {
            title: "UI Blocks",
            enabled: true,
            pieces: [
              {
                name: "achievement-pop",
                enabled: true,
              },
              {
                name: "border-beam",
                enabled: false,
              },
              {
                name: "card-fan",
                enabled: true,
              },
              {
                name: "glow-born-card",
                enabled: true,
              },
              {
                name: "launch-days",
                enabled: true,
              },
              {
                name: "pill-morph",
                enabled: false,
              },
              {
                name: "rim-draw-card",
                enabled: true,
              },
              {
                name: "card-push-line",
                enabled: true,
              },
              {
                name: "caret-dolly",
                enabled: true,
              },
              {
                name: "ghost-complete",
                enabled: true,
              },
              {
                name: "multi-file-drop",
                enabled: true,
              },
              {
                name: "query-cascade",
                enabled: false,
              },
              {
                name: "keycap-press",
                enabled: false,
              },
              {
                name: "rotary-dial",
                enabled: false,
              },
              {
                name: "toggle-on",
                enabled: false,
              },
              {
                name: "drop-upload",
                enabled: true,
              },
              {
                name: "macro-tab-name",
                enabled: true,
              },
              {
                name: "menu-pick",
                enabled: true,
              },
              {
                name: "ui-callout",
                enabled: true,
              },
              {
                name: "toolbar-unfurl",
                enabled: true,
              },
              {
                name: "url-bar-cta",
                enabled: false,
              },
            ],
          },
          {
            title: "Product Scenes",
            enabled: true,
            pieces: [
              {
                name: "file-dropzone",
                enabled: true,
              },
              {
                name: "bento-build",
                enabled: true,
              },
              {
                name: "macro-click",
                enabled: true,
              },
              {
                name: "sheet-formula",
                enabled: true,
              },
              {
                name: "tile-snake-loader",
                enabled: true,
              },
              {
                name: "wireframe-to-final",
                enabled: false,
              },
              {
                name: "card-create",
                enabled: false,
              },
              {
                name: "coupon-apply",
                enabled: true,
              },
              {
                name: "grid-to-app",
                enabled: true,
              },
              {
                name: "invoice-paid",
                enabled: true,
              },
              {
                name: "mobile-paywall",
                enabled: false,
              },
              {
                name: "money-send",
                enabled: true,
              },
              {
                name: "pricing-reveal",
                enabled: true,
              },
              {
                name: "stock-scrub",
                enabled: true,
              },
              {
                name: "app-store-listing",
                enabled: true,
              },
              {
                name: "home-widget",
                enabled: false,
              },
              {
                name: "notification-avalanche",
                enabled: true,
              },
              {
                name: "phone-scroll",
                enabled: false,
              },
              {
                name: "phone-trio",
                enabled: true,
              },
              {
                name: "ride-tracking",
                enabled: true,
              },
              {
                name: "bracket-win",
                enabled: true,
              },
              {
                name: "device-grows-around",
                enabled: true,
              },
              {
                name: "leaderboard-climb",
                enabled: true,
              },
              {
                name: "live-dashboard",
                enabled: true,
              },
              {
                name: "send-fountain",
                enabled: true,
              },
              {
                name: "world-signups",
                enabled: true,
              },
              {
                name: "ai-answer-sources",
                enabled: false,
              },
              {
                name: "ai-image-grid",
                enabled: false,
              },
              {
                name: "graph-relayout",
                enabled: true,
              },
              {
                name: "node-trail",
                enabled: false,
              },
              {
                name: "prompt-swell",
                enabled: false,
              },
              {
                name: "channel-reactions",
                enabled: true,
              },
              {
                name: "invite-team",
                enabled: true,
              },
              {
                name: "multiplayer-cursors",
                enabled: true,
              },
              {
                name: "deploy-pipeline",
                enabled: false,
              },
              {
                name: "pr-merge",
                enabled: true,
              },
              {
                name: "status-page",
                enabled: true,
              },
              {
                name: "heat-drain-reveal",
                enabled: false,
              },
              {
                name: "whats-new-modal",
                enabled: true,
              },
              {
                name: "design-audit",
                enabled: true,
              },
              {
                name: "browser-extension",
                enabled: false,
              },
              {
                name: "calendar-booking",
                enabled: false,
              },
              {
                name: "chaos-to-order",
                enabled: false,
              },
              {
                name: "flow-builder",
                enabled: false,
              },
              {
                name: "roadmap-timeline",
                enabled: false,
              },
              {
                name: "social-scheduler",
                enabled: false,
              },
              {
                name: "table-filter",
                enabled: false,
              },
              {
                name: "timeline-editor",
                enabled: false,
              },
              {
                name: "video-watch-page",
                enabled: false,
              },
              {
                name: "button-to-card",
                enabled: false,
              },
              {
                name: "cart-add",
                enabled: false,
              },
              {
                name: "live-activity",
                enabled: false,
              },
              {
                name: "now-playing",
                enabled: false,
              },
              {
                name: "streak-reward",
                enabled: false,
              },
              {
                name: "swipe-deck",
                enabled: false,
              },
              {
                name: "analytics-funnel",
                enabled: false,
              },
              {
                name: "tilt-settle-list",
                enabled: false,
              },
              {
                name: "prompt-to-app",
                enabled: false,
              },
              {
                name: "voice-agent",
                enabled: false,
              },
              {
                name: "video-call",
                enabled: false,
              },
              {
                name: "feature-flag-rollout",
                enabled: false,
              },
              {
                name: "redline-measure",
                enabled: false,
              },
              {
                name: "audit-boxes",
                enabled: false,
              },
              {
                name: "scan-fix",
                enabled: false,
              },
              {
                name: "token-tags",
                enabled: false,
              },
              {
                name: "layout-guides",
                enabled: false,
              },
            ],
          },
          {
            title: "Transitions",
            enabled: true,
            pieces: [
              {
                name: "band-open",
                enabled: true,
              },
              {
                name: "band-shift",
                enabled: true,
              },
              {
                name: "card-swipe-cover",
                enabled: true,
              },
              {
                name: "color-bars",
                enabled: false,
              },
              {
                name: "diagonal-split",
                enabled: true,
              },
              {
                name: "hairline-open",
                enabled: true,
              },
              {
                name: "replay-wipe",
                enabled: true,
              },
              {
                name: "ring-cut",
                enabled: false,
              },
              {
                name: "tile-wave",
                enabled: true,
              },
              {
                name: "baton-word",
                enabled: true,
              },
              {
                name: "column-slide",
                enabled: true,
              },
              {
                name: "cue-word",
                enabled: true,
              },
              {
                name: "halftone-cut",
                enabled: false,
              },
              {
                name: "letter-gate",
                enabled: true,
              },
              {
                name: "shape-cut",
                enabled: true,
              },
              {
                name: "window-trail",
                enabled: true,
              },
              {
                name: "beam-sweep",
                enabled: true,
              },
              {
                name: "bloom-ring",
                enabled: true,
              },
              {
                name: "flash-sweep",
                enabled: true,
              },
              {
                name: "light-burn-to-line",
                enabled: true,
              },
              {
                name: "ring-burst",
                enabled: false,
              },
              {
                name: "slit-reveal",
                enabled: false,
              },
              {
                name: "strobe-montage",
                enabled: true,
              },
              {
                name: "caret-collapse",
                enabled: true,
                share: 0.9,
                speed: 1,
              },
              {
                name: "disc-pop",
                enabled: false,
              },
              {
                name: "press-warp-dive",
                enabled: true,
              },
              {
                name: "hot-slab-morph",
                enabled: true,
              },
            ],
          },
          {
            title: "Motion Graphics",
            enabled: true,
            pieces: [
              {
                name: "dot-field-morph",
                enabled: true,
              },
              {
                name: "flock-form",
                enabled: true,
              },
              {
                name: "ring-align",
                enabled: true,
              },
              {
                name: "chord-ring",
                enabled: true,
              },
              {
                name: "fourier-sum",
                enabled: false,
              },
              {
                name: "path-search",
                enabled: true,
              },
              {
                name: "pattern-tile",
                enabled: true,
              },
              {
                name: "venn-merge",
                enabled: true,
              },
            ],
          },
          {
            title: "Graphic Looks",
            enabled: true,
            pieces: [
              {
                name: "embossed-mark",
                enabled: true,
              },
              {
                name: "fluted-glass",
                enabled: true,
              },
              {
                name: "frosted-clear",
                enabled: true,
              },
              {
                name: "led-ticker",
                enabled: true,
              },
            ],
          },
          {
            title: "Logo Stings",
            enabled: true,
            pieces: [
              {
                name: "bass-drop",
                enabled: false,
              },
              {
                name: "blink-cut",
                enabled: false,
              },
              {
                name: "bracket-index",
                enabled: true,
              },
              {
                name: "collab-lockup",
                enabled: true,
              },
              {
                name: "dynamic-letter",
                enabled: true,
              },
              {
                name: "first-light",
                enabled: false,
              },
              {
                name: "flip-sting",
                enabled: false,
              },
              {
                name: "giant-mark-backdrop",
                enabled: true,
              },
              {
                name: "glyph-block-decode",
                enabled: true,
              },
              {
                name: "gravity-grid",
                enabled: false,
              },
              {
                name: "heat-trace",
                enabled: false,
              },
              {
                name: "ink-bloom",
                enabled: false,
              },
              {
                name: "introducing",
                enabled: false,
              },
              {
                name: "light-signature",
                enabled: false,
              },
              {
                name: "light-trail-write",
                enabled: true,
              },
              {
                name: "neural-pulse",
                enabled: false,
              },
              {
                name: "noise-forge-sting",
                enabled: true,
              },
              {
                name: "photo-halo",
                enabled: true,
              },
              {
                name: "play-of-the-game",
                enabled: true,
              },
              {
                name: "sequel-numeral",
                enabled: true,
              },
              {
                name: "signal-resolve",
                enabled: false,
              },
              {
                name: "snap-click",
                enabled: false,
              },
              {
                name: "spell-out",
                enabled: true,
              },
              {
                name: "split-match",
                enabled: true,
              },
              {
                name: "title-converge",
                enabled: true,
              },
              {
                name: "word-burst-cards",
                enabled: true,
              },
              {
                name: "glyph-matrix",
                enabled: false,
              },
              {
                name: "logo-construct",
                enabled: true,
              },
              {
                name: "quadtree-mark",
                enabled: false,
              },
              {
                name: "ripple-mark",
                enabled: true,
              },
              {
                name: "shape-morph-o",
                enabled: true,
              },
              {
                name: "squircle-wave",
                enabled: true,
              },
              {
                name: "transit-lines",
                enabled: true,
              },
              {
                name: "bounce-logo",
                enabled: false,
              },
              {
                name: "cta-collapse-mark",
                enabled: false,
              },
              {
                name: "flood-sting",
                enabled: true,
              },
              {
                name: "paper-plane",
                enabled: true,
              },
            ],
          },
          {
            title: "Media & Collage",
            enabled: false,
            pieces: [
              {
                name: "looks-like-this",
                enabled: true,
              },
              {
                name: "screenshot-tour",
                enabled: true,
              },
              {
                name: "shot-answers",
                enabled: true,
              },
              {
                name: "up-close",
                enabled: true,
              },
              {
                name: "grid-montage",
                enabled: true,
              },
              {
                name: "panel-split",
                enabled: true,
              },
              {
                name: "shards-to-grid",
                enabled: true,
              },
              {
                name: "before-after",
                enabled: true,
              },
              {
                name: "theme-flip",
                enabled: true,
              },
              {
                name: "device-morph",
                enabled: true,
              },
            ],
          },
          {
            title: "Social",
            enabled: false,
            pieces: [
              {
                name: "duet-split",
                enabled: true,
              },
              {
                name: "reels-feed",
                enabled: true,
              },
              {
                name: "speedrun-timer",
                enabled: true,
              },
              {
                name: "story-text",
                enabled: true,
              },
              {
                name: "year-in-review",
                enabled: true,
              },
              {
                name: "milestone-roll",
                enabled: true,
              },
              {
                name: "rating-laurel",
                enabled: true,
              },
              {
                name: "testimonial-stack",
                enabled: true,
              },
              {
                name: "upvote-burst",
                enabled: true,
              },
              {
                name: "waitlist-swarm",
                enabled: true,
              },
              {
                name: "crash-zoom",
                enabled: true,
              },
              {
                name: "hook-punch",
                enabled: true,
              },
              {
                name: "pov-setup",
                enabled: true,
              },
            ],
          },
          {
            title: "Effects",
            enabled: false,
            pieces: [
              {
                name: "glass-lens",
                enabled: true,
              },
            ],
          },
          {
            title: "Camera & Physics",
            enabled: false,
            pieces: [
              {
                name: "layered-cutout",
                enabled: true,
              },
            ],
          },
        ],
      }}
    />
  );
}
