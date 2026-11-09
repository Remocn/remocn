import type React from "react";
import {
  type ComponentConfig,
  type ResolvedComponentConfig,
  resolveConfig,
} from "@/lib/customizer-config";

export interface RegistryEntry {
  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
  load: () => Promise<{ default: React.ComponentType<any> }>;
  loadConfig: () => Promise<ComponentConfig>;
}

const registry: Record<string, RegistryEntry> = {
  "release-teaser": {
    load: () =>
      import("@/registry/remocn-templates/release-teaser").then((m) => ({
        default: m.ReleaseTeaser,
      })),
    loadConfig: () =>
      import("@/registry/remocn-templates/release-teaser").then(
        (m) => m.releaseTeaserConfig,
      ),
  },
  "changelog-video": {
    load: () =>
      import("@/registry/remocn-templates/changelog-video").then((m) => ({
        default: m.ChangelogVideo,
      })),
    loadConfig: () =>
      import("@/registry/remocn-templates/changelog-video").then(
        (m) => m.changelogVideoConfig,
      ),
  },
  "brand-guidelines": {
    load: () =>
      import("@/registry/remocn-templates/brand-guidelines").then((m) => ({
        default: m.BrandGuidelines,
      })),
    loadConfig: () =>
      import("@/registry/remocn-templates/brand-guidelines").then(
        (m) => m.brandGuidelinesConfig,
      ),
  },
  "workflow-console": {
    load: () =>
      import("@/registry/remocn-templates/workflow-console").then((m) => ({
        default: m.WorkflowConsole,
      })),
    loadConfig: () =>
      import("@/registry/remocn-templates/workflow-console").then(
        (m) => m.workflowConsoleConfig,
      ),
  },
  "launch-anything": {
    load: () =>
      import("@/registry/remocn-templates/launch-anything").then((m) => ({
        default: m.ProductShowcase,
      })),
    loadConfig: () =>
      import("@/registry/remocn-templates/launch-anything").then(
        (m) => m.launchAnythingConfig,
      ),
  },
  "fomo-limit-orders": {
    load: () =>
      import("@/registry/remocn-templates/fomo-limit-orders").then((m) => ({
        default: m.OrderFlow,
      })),
    loadConfig: () =>
      import("@/registry/remocn-templates/fomo-limit-orders").then(
        (m) => m.fomoLimitOrdersConfig,
      ),
  },
  "shader-spiral-pass": {
    load: () =>
      import("@/components/docs/examples/shader-spiral-pass-example").then(
        (m) => ({ default: m.ShaderSpiralPassExampleScene }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/shader-spiral-pass/config").then(
        (m) => m.shaderSpiralPassConfig,
      ),
  },
  "shader-light-tunnel": {
    load: () =>
      import("@/registry/remocn/shader-light-tunnel").then((m) => ({
        default: m.ShaderLightTunnel,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-light-tunnel/config").then(
        (m) => m.shaderLightTunnelConfig,
      ),
  },
  "inline-word-roll": {
    load: () =>
      import("@/registry/remocn/inline-word-roll").then((m) => ({
        default: m.InlineWordRoll,
      })),
    loadConfig: () =>
      import("@/registry/remocn/inline-word-roll/config").then(
        (m) => m.inlineWordRollConfig,
      ),
  },
  "shader-text-reveal": {
    load: () =>
      import("@/registry/remocn/shader-text-reveal").then((m) => ({
        default: m.ShaderTextReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-text-reveal/config").then(
        (m) => m.shaderTextRevealConfig,
      ),
  },
  "shader-seam": {
    load: () =>
      import("@/components/docs/examples/shader-seam-example").then((m) => ({
        default: m.ShaderSeamExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-seam/config").then(
        (m) => m.shaderSeamConfig,
      ),
  },
  "search-reveal": {
    load: () =>
      import("@/registry/remocn/search-reveal").then((m) => ({
        default: m.SearchReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/search-reveal/config").then(
        (m) => m.searchRevealConfig,
      ),
  },
  "type-fossil": {
    load: () =>
      import("@/registry/remocn/type-fossil").then((m) => ({
        default: m.TypeFossil,
      })),
    loadConfig: () =>
      import("@/registry/remocn/type-fossil/config").then(
        (m) => m.typeFossilConfig,
      ),
  },
  "soft-blur-in": {
    load: () =>
      import("@/registry/remocn/soft-blur-in").then((m) => ({
        default: m.SoftBlurIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/soft-blur-in/config").then(
        (m) => m.softBlurInConfig,
      ),
  },
  "word-stream": {
    load: () =>
      import("@/registry/remocn/word-stream").then((m) => ({
        default: m.WordStream,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-stream/config").then(
        (m) => m.wordStreamConfig,
      ),
  },
  "word-push": {
    load: () =>
      import("@/registry/remocn/word-push").then((m) => ({
        default: m.WordPush,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-push/config").then(
        (m) => m.wordPushConfig,
      ),
  },
  "sheen-slide-in": {
    load: () =>
      import("@/registry/remocn/sheen-slide-in").then((m) => ({
        default: m.SheenSlideIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/sheen-slide-in/config").then(
        (m) => m.sheenSlideInConfig,
      ),
  },
  "squeeze-in": {
    load: () =>
      import("@/registry/remocn/squeeze-in").then((m) => ({
        default: m.SqueezeIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/squeeze-in/config").then(
        (m) => m.squeezeInConfig,
      ),
  },
  "fog-rise": {
    load: () =>
      import("@/registry/remocn/fog-rise").then((m) => ({
        default: m.FogRise,
      })),
    loadConfig: () =>
      import("@/registry/remocn/fog-rise/config").then((m) => m.fogRiseConfig),
  },
  "caret-swap": {
    load: () =>
      import("@/registry/remocn/caret-swap").then((m) => ({
        default: m.CaretSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caret-swap/config").then(
        (m) => m.caretSwapConfig,
      ),
  },
  "zoom-words": {
    load: () =>
      import("@/registry/remocn/zoom-words").then((m) => ({
        default: m.ZoomWords,
      })),
    loadConfig: () =>
      import("@/registry/remocn/zoom-words/config").then(
        (m) => m.zoomWordsConfig,
      ),
  },
  "centered-word-build": {
    load: () =>
      import("@/registry/remocn/centered-word-build").then((m) => ({
        default: m.CenteredWordBuild,
      })),
    loadConfig: () =>
      import("@/registry/remocn/centered-word-build/config").then(
        (m) => m.centeredWordBuildConfig,
      ),
  },
  "inline-pill-takeover": {
    load: () =>
      import("@/registry/remocn/inline-pill-takeover").then((m) => ({
        default: m.InlinePillTakeover,
      })),
    loadConfig: () =>
      import("@/registry/remocn/inline-pill-takeover/config").then(
        (m) => m.inlinePillTakeoverConfig,
      ),
  },
  "typed-split-wipe": {
    load: () =>
      import("@/registry/remocn/typed-split-wipe").then((m) => ({
        default: m.TypedSplitWipe,
      })),
    loadConfig: () =>
      import("@/registry/remocn/typed-split-wipe/config").then(
        (m) => m.typedSplitWipeConfig,
      ),
  },
  "shadow-sweep-text": {
    load: () =>
      import("@/registry/remocn/shadow-sweep-text").then((m) => ({
        default: m.ShadowSweepText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shadow-sweep-text/config").then(
        (m) => m.shadowSweepTextConfig,
      ),
  },
  "outline-fill-track-text": {
    load: () =>
      import("@/registry/remocn/outline-fill-track-text").then((m) => ({
        default: m.OutlineFillTrackText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/outline-fill-track-text/config").then(
        (m) => m.outlineFillTrackTextConfig,
      ),
  },
  "gradient-scale-cut-text": {
    load: () =>
      import("@/registry/remocn/gradient-scale-cut-text").then((m) => ({
        default: m.GradientScaleCutText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/gradient-scale-cut-text/config").then(
        (m) => m.gradientScaleCutTextConfig,
      ),
  },
  "rush-type": {
    load: () =>
      import("@/registry/remocn/rush-type").then((m) => ({
        default: m.RushType,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rush-type/config").then(
        (m) => m.rushTypeConfig,
      ),
  },
  "per-character-rise": {
    load: () =>
      import("@/registry/remocn/per-character-rise").then((m) => ({
        default: m.PerCharacterRise,
      })),
    loadConfig: () =>
      import("@/registry/remocn/per-character-rise/config").then(
        (m) => m.perCharacterRiseConfig,
      ),
  },
  "bottom-up-letters": {
    load: () =>
      import("@/registry/remocn/bottom-up-letters").then((m) => ({
        default: m.BottomUpLetters,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bottom-up-letters/config").then(
        (m) => m.bottomUpLettersConfig,
      ),
  },
  "top-down-letters": {
    load: () =>
      import("@/registry/remocn/top-down-letters").then((m) => ({
        default: m.TopDownLetters,
      })),
    loadConfig: () =>
      import("@/registry/remocn/top-down-letters/config").then(
        (m) => m.topDownLettersConfig,
      ),
  },
  "spring-scale-in": {
    load: () =>
      import("@/registry/remocn/spring-scale-in").then((m) => ({
        default: m.SpringScaleIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spring-scale-in/config").then(
        (m) => m.springScaleInConfig,
      ),
  },
  "micro-scale-fade": {
    load: () =>
      import("@/registry/remocn/micro-scale-fade").then((m) => ({
        default: m.MicroScaleFade,
      })),
    loadConfig: () =>
      import("@/registry/remocn/micro-scale-fade/config").then(
        (m) => m.microScaleFadeConfig,
      ),
  },
  "scale-down-fade": {
    load: () =>
      import("@/registry/remocn/scale-down-fade").then((m) => ({
        default: m.ScaleDownFade,
      })),
    loadConfig: () =>
      import("@/registry/remocn/scale-down-fade/config").then(
        (m) => m.scaleDownFadeConfig,
      ),
  },
  "blur-out-up": {
    load: () =>
      import("@/registry/remocn/blur-out-up").then((m) => ({
        default: m.BlurOutUp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/blur-out-up/config").then(
        (m) => m.blurOutUpConfig,
      ),
  },
  "focus-blur-resolve": {
    load: () =>
      import("@/registry/remocn/focus-blur-resolve").then((m) => ({
        default: m.FocusBlurResolve,
      })),
    loadConfig: () =>
      import("@/registry/remocn/focus-blur-resolve/config").then(
        (m) => m.focusBlurResolveConfig,
      ),
  },
  "line-by-line-slide": {
    load: () =>
      import("@/registry/remocn/line-by-line-slide").then((m) => ({
        default: m.LineByLineSlide,
      })),
    loadConfig: () =>
      import("@/registry/remocn/line-by-line-slide/config").then(
        (m) => m.lineByLineSlideConfig,
      ),
  },
  "per-word-crossfade": {
    load: () =>
      import("@/registry/remocn/per-word-crossfade").then((m) => ({
        default: m.PerWordCrossfade,
      })),
    loadConfig: () =>
      import("@/registry/remocn/per-word-crossfade/config").then(
        (m) => m.perWordCrossfadeConfig,
      ),
  },
  "fade-through": {
    load: () =>
      import("@/registry/remocn/fade-through").then((m) => ({
        default: m.FadeThrough,
      })),
    loadConfig: () =>
      import("@/registry/remocn/fade-through/config").then(
        (m) => m.fadeThroughConfig,
      ),
  },
  "shared-axis-y": {
    load: () =>
      import("@/registry/remocn/shared-axis-y").then((m) => ({
        default: m.SharedAxisY,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shared-axis-y/config").then(
        (m) => m.sharedAxisYConfig,
      ),
  },
  "shared-axis-z": {
    load: () =>
      import("@/registry/remocn/shared-axis-z").then((m) => ({
        default: m.SharedAxisZ,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shared-axis-z/config").then(
        (m) => m.sharedAxisZConfig,
      ),
  },
  "short-slide-right": {
    load: () =>
      import("@/registry/remocn/short-slide-right").then((m) => ({
        default: m.ShortSlideRight,
      })),
    loadConfig: () =>
      import("@/registry/remocn/short-slide-right/config").then(
        (m) => m.shortSlideRightConfig,
      ),
  },
  "kinetic-center-build": {
    load: () =>
      import("@/registry/remocn/kinetic-center-build").then((m) => ({
        default: m.KineticCenterBuild,
      })),
    loadConfig: () =>
      import("@/registry/remocn/kinetic-center-build/config").then(
        (m) => m.kineticCenterBuildConfig,
      ),
  },
  "short-slide-down": {
    load: () =>
      import("@/registry/remocn/short-slide-down").then((m) => ({
        default: m.ShortSlideDown,
      })),
    loadConfig: () =>
      import("@/registry/remocn/short-slide-down/config").then(
        (m) => m.shortSlideDownConfig,
      ),
  },
  typewriter: {
    load: () =>
      import("@/registry/remocn/typewriter").then((m) => ({
        default: m.Typewriter,
      })),
    loadConfig: () =>
      import("@/registry/remocn/typewriter/config").then(
        (m) => m.typewriterConfig,
      ),
  },
  "hand-count": {
    load: () =>
      import("@/registry/remocn/hand-count").then((m) => ({
        default: m.HandCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hand-count/config").then(
        (m) => m.handCountConfig,
      ),
  },
  handwrite: {
    load: () =>
      import("@/registry/remocn/handwrite").then((m) => ({
        default: m.Handwrite,
      })),
    loadConfig: () =>
      import("@/registry/remocn/handwrite/config").then(
        (m) => m.handwriteConfig,
      ),
  },
  "inline-highlight": {
    load: () =>
      import("@/registry/remocn/inline-highlight").then((m) => ({
        default: m.InlineHighlight,
      })),
    loadConfig: () =>
      import("@/registry/remocn/inline-highlight/config").then(
        (m) => m.inlineHighlightConfig,
      ),
  },
  "strikethrough-replace": {
    load: () =>
      import("@/registry/remocn/strikethrough-replace").then((m) => ({
        default: m.StrikethroughReplace,
      })),
    loadConfig: () =>
      import("@/registry/remocn/strikethrough-replace/config").then(
        (m) => m.strikethroughReplaceConfig,
      ),
  },
  "staggered-fade-up": {
    load: () =>
      import("@/registry/remocn/staggered-fade-up").then((m) => ({
        default: m.StaggeredFadeUp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/staggered-fade-up/config").then(
        (m) => m.staggeredFadeUpConfig,
      ),
  },
  "mask-reveal-up": {
    load: () =>
      import("@/registry/remocn/mask-reveal-up").then((m) => ({
        default: m.MaskRevealUp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/mask-reveal-up/config").then(
        (m) => m.maskRevealUpConfig,
      ),
  },
  "tracking-in": {
    load: () =>
      import("@/registry/remocn/tracking-in").then((m) => ({
        default: m.TrackingIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tracking-in/config").then(
        (m) => m.trackingInConfig,
      ),
  },
  "shimmer-sweep": {
    load: () =>
      import("@/registry/remocn/shimmer-sweep").then((m) => ({
        default: m.ShimmerSweep,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shimmer-sweep/config").then(
        (m) => m.shimmerSweepConfig,
      ),
  },
  "marker-highlight": {
    load: () =>
      import("@/registry/remocn/marker-highlight").then((m) => ({
        default: m.MarkerHighlight,
      })),
    loadConfig: () =>
      import("@/registry/remocn/marker-highlight/config").then(
        (m) => m.markerHighlightConfig,
      ),
  },
  "ink-underline": {
    load: () =>
      import("@/components/docs/examples/ink-underline-example").then((m) => ({
        default: m.InkUnderlineExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ink-underline/config").then(
        (m) => m.inkUnderlineConfig,
      ),
  },
  "slot-machine-roll": {
    load: () =>
      import("@/registry/remocn/slot-machine-roll").then((m) => ({
        default: m.SlotMachineRoll,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slot-machine-roll/config").then(
        (m) => m.slotMachineRollConfig,
      ),
  },
  "matrix-decode": {
    load: () =>
      import("@/registry/remocn/matrix-decode").then((m) => ({
        default: m.MatrixDecode,
      })),
    loadConfig: () =>
      import("@/registry/remocn/matrix-decode/config").then(
        (m) => m.matrixDecodeConfig,
      ),
  },
  "gooey-morph": {
    load: () =>
      import("@/registry/remocn/gooey-morph").then((m) => ({
        default: m.GooeyMorph,
      })),
    loadConfig: () =>
      import("@/registry/remocn/gooey-morph/config").then(
        (m) => m.gooeyMorphConfig,
      ),
  },
  "stretch-in": {
    load: () =>
      import("@/registry/remocn/stretch-in").then((m) => ({
        default: m.StretchIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stretch-in/config").then(
        (m) => m.stretchInConfig,
      ),
  },
  "selection-snap": {
    load: () =>
      import("@/registry/remocn/selection-snap").then((m) => ({
        default: m.SelectionSnap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/selection-snap/config").then(
        (m) => m.selectionSnapConfig,
      ),
  },
  "echo-stack": {
    load: () =>
      import("@/registry/remocn/echo-stack").then((m) => ({
        default: m.EchoStack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/echo-stack/config").then(
        (m) => m.echoStackConfig,
      ),
  },
  "type-wall": {
    load: () =>
      import("@/registry/remocn/type-wall").then((m) => ({
        default: m.TypeWall,
      })),
    loadConfig: () =>
      import("@/registry/remocn/type-wall/config").then(
        (m) => m.typeWallConfig,
      ),
  },
  "ring-text": {
    load: () =>
      import("@/registry/remocn/ring-text").then((m) => ({
        default: m.RingText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ring-text/config").then(
        (m) => m.ringTextConfig,
      ),
  },
  "period-drop": {
    load: () =>
      import("@/registry/remocn/period-drop").then((m) => ({
        default: m.PeriodDrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/period-drop/config").then(
        (m) => m.periodDropConfig,
      ),
  },
  "outline-trace": {
    load: () =>
      import("@/registry/remocn/outline-trace").then((m) => ({
        default: m.OutlineTrace,
      })),
    loadConfig: () =>
      import("@/registry/remocn/outline-trace/config").then(
        (m) => m.outlineTraceConfig,
      ),
  },
  "glyph-anatomy": {
    load: () =>
      import("@/registry/remocn/glyph-anatomy").then((m) => ({
        default: m.GlyphAnatomy,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glyph-anatomy/config").then(
        (m) => m.glyphAnatomyConfig,
      ),
  },
  "stripe-type": {
    load: () =>
      import("@/registry/remocn/stripe-type").then((m) => ({
        default: m.StripeType,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stripe-type/config").then(
        (m) => m.stripeTypeConfig,
      ),
  },
  "path-ride": {
    load: () =>
      import("@/registry/remocn/path-ride").then((m) => ({
        default: m.PathRide,
      })),
    loadConfig: () =>
      import("@/registry/remocn/path-ride/config").then(
        (m) => m.pathRideConfig,
      ),
  },
  "type-repeater": {
    load: () =>
      import("@/registry/remocn/type-repeater").then((m) => ({
        default: m.TypeRepeater,
      })),
    loadConfig: () =>
      import("@/registry/remocn/type-repeater/config").then(
        (m) => m.typeRepeaterConfig,
      ),
  },
  "chromatic-wave": {
    load: () =>
      import("@/registry/remocn/chromatic-wave").then((m) => ({
        default: m.ChromaticWave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chromatic-wave/config").then(
        (m) => m.chromaticWaveConfig,
      ),
  },
  "extrude-pop": {
    load: () =>
      import("@/registry/remocn/extrude-pop").then((m) => ({
        default: m.ExtrudePop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/extrude-pop/config").then(
        (m) => m.extrudePopConfig,
      ),
  },
  "perspective-squeeze": {
    load: () =>
      import("@/registry/remocn/perspective-squeeze").then((m) => ({
        default: m.PerspectiveSqueeze,
      })),
    loadConfig: () =>
      import("@/registry/remocn/perspective-squeeze/config").then(
        (m) => m.perspectiveSqueezeConfig,
      ),
  },
  "kinetic-morph-text": {
    load: () =>
      import("@/registry/remocn/kinetic-morph-text").then((m) => ({
        default: m.KineticMorphText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/kinetic-morph-text/config").then(
        (m) => m.kineticMorphTextConfig,
      ),
  },
  "kinetic-warp": {
    load: () =>
      import("@/registry/remocn/kinetic-warp").then((m) => ({
        default: m.KineticWarp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/kinetic-warp/config").then(
        (m) => m.kineticWarpConfig,
      ),
  },
  "rgb-glitch-text": {
    load: () =>
      import("@/registry/remocn/rgb-glitch-text").then((m) => ({
        default: m.RGBGlitchText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rgb-glitch-text/config").then(
        (m) => m.rgbGlitchTextConfig,
      ),
  },
  "infinite-marquee": {
    load: () =>
      import("@/registry/remocn/infinite-marquee").then((m) => ({
        default: m.InfiniteMarquee,
      })),
    loadConfig: () =>
      import("@/registry/remocn/infinite-marquee/config").then(
        (m) => m.infiniteMarqueeConfig,
      ),
  },
  "perspective-marquee": {
    load: () =>
      import("@/registry/remocn/perspective-marquee").then((m) => ({
        default: m.PerspectiveMarquee,
      })),
    loadConfig: () =>
      import("@/registry/remocn/perspective-marquee/config").then(
        (m) => m.perspectiveMarqueeConfig,
      ),
  },
  "glass-code-block": {
    load: () =>
      import("@/registry/remocn/glass-code-block").then((m) => ({
        default: m.GlassCodeBlock,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glass-code-block/config").then(
        (m) => m.glassCodeBlockConfig,
      ),
  },
  "glass-code-walk": {
    load: () =>
      import("@/registry/remocn/glass-code-walk").then((m) => ({
        default: m.GlassCodeWalk,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glass-code-walk/config").then(
        (m) => m.glassCodeWalkConfig,
      ),
  },
  "code-morph": {
    load: () =>
      import("@/registry/remocn/code-morph").then((m) => ({
        default: m.CodeMorph,
      })),
    loadConfig: () =>
      import("@/registry/remocn/code-morph/config").then(
        (m) => m.codeMorphConfig,
      ),
  },
  "shader-mesh-gradient": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient").then((m) => ({
        default: m.ShaderMeshGradient,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient/config").then(
        (m) => m.shaderMeshGradientConfig,
      ),
  },
  "shader-mesh-gradient-dusk": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-dusk").then((m) => ({
        default: m.ShaderMeshGradientDusk,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-dusk/config").then(
        (m) => m.shaderMeshGradientDuskConfig,
      ),
  },
  "shader-mesh-gradient-lagoon": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-lagoon").then((m) => ({
        default: m.ShaderMeshGradientLagoon,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-lagoon/config").then(
        (m) => m.shaderMeshGradientLagoonConfig,
      ),
  },
  "shader-mesh-gradient-peach": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-peach").then((m) => ({
        default: m.ShaderMeshGradientPeach,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-peach/config").then(
        (m) => m.shaderMeshGradientPeachConfig,
      ),
  },
  "shader-mesh-gradient-aurora": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-aurora").then((m) => ({
        default: m.ShaderMeshGradientAurora,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-aurora/config").then(
        (m) => m.shaderMeshGradientAuroraConfig,
      ),
  },
  "shader-mesh-gradient-lavender": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-lavender").then((m) => ({
        default: m.ShaderMeshGradientLavender,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-lavender/config").then(
        (m) => m.shaderMeshGradientLavenderConfig,
      ),
  },
  "shader-mesh-gradient-ember": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-ember").then((m) => ({
        default: m.ShaderMeshGradientEmber,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-ember/config").then(
        (m) => m.shaderMeshGradientEmberConfig,
      ),
  },
  "shader-mesh-gradient-mint": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-mint").then((m) => ({
        default: m.ShaderMeshGradientMint,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-mint/config").then(
        (m) => m.shaderMeshGradientMintConfig,
      ),
  },
  "shader-mesh-gradient-synthwave": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-synthwave").then((m) => ({
        default: m.ShaderMeshGradientSynthwave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-synthwave/config").then(
        (m) => m.shaderMeshGradientSynthwaveConfig,
      ),
  },
  "shader-mesh-gradient-ink": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient-ink").then((m) => ({
        default: m.ShaderMeshGradientInk,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-mesh-gradient-ink/config").then(
        (m) => m.shaderMeshGradientInkConfig,
      ),
  },
  "shader-grain-gradient": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient").then((m) => ({
        default: m.ShaderGrainGradient,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient/config").then(
        (m) => m.shaderGrainGradientConfig,
      ),
  },
  "shader-grain-gradient-sunrise": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-sunrise").then((m) => ({
        default: m.ShaderGrainGradientSunrise,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-sunrise/config").then(
        (m) => m.shaderGrainGradientSunriseConfig,
      ),
  },
  "shader-grain-gradient-nebula": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-nebula").then((m) => ({
        default: m.ShaderGrainGradientNebula,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-nebula/config").then(
        (m) => m.shaderGrainGradientNebulaConfig,
      ),
  },
  "shader-grain-gradient-orb": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-orb").then((m) => ({
        default: m.ShaderGrainGradientOrb,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-orb/config").then(
        (m) => m.shaderGrainGradientOrbConfig,
      ),
  },
  "shader-grain-gradient-horizon": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-horizon").then((m) => ({
        default: m.ShaderGrainGradientHorizon,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-horizon/config").then(
        (m) => m.shaderGrainGradientHorizonConfig,
      ),
  },
  "shader-grain-gradient-blush": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-blush").then((m) => ({
        default: m.ShaderGrainGradientBlush,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-blush/config").then(
        (m) => m.shaderGrainGradientBlushConfig,
      ),
  },
  "shader-grain-gradient-tide": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-tide").then((m) => ({
        default: m.ShaderGrainGradientTide,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-tide/config").then(
        (m) => m.shaderGrainGradientTideConfig,
      ),
  },
  "shader-grain-gradient-arcade": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-arcade").then((m) => ({
        default: m.ShaderGrainGradientArcade,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-arcade/config").then(
        (m) => m.shaderGrainGradientArcadeConfig,
      ),
  },
  "shader-grain-gradient-dune": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-dune").then((m) => ({
        default: m.ShaderGrainGradientDune,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-dune/config").then(
        (m) => m.shaderGrainGradientDuneConfig,
      ),
  },
  "shader-grain-gradient-ultraviolet": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient-ultraviolet").then(
        (m) => ({
          default: m.ShaderGrainGradientUltraviolet,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/shader-grain-gradient-ultraviolet/config").then(
        (m) => m.shaderGrainGradientUltravioletConfig,
      ),
  },
  "shader-warp": {
    load: () =>
      import("@/registry/remocn/shader-warp").then((m) => ({
        default: m.ShaderWarp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp/config").then(
        (m) => m.shaderWarpConfig,
      ),
  },
  "shader-warp-silk": {
    load: () =>
      import("@/registry/remocn/shader-warp-silk").then((m) => ({
        default: m.ShaderWarpSilk,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-silk/config").then(
        (m) => m.shaderWarpSilkConfig,
      ),
  },
  "shader-warp-sunset": {
    load: () =>
      import("@/registry/remocn/shader-warp-sunset").then((m) => ({
        default: m.ShaderWarpSunset,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-sunset/config").then(
        (m) => m.shaderWarpSunsetConfig,
      ),
  },
  "shader-warp-ocean": {
    load: () =>
      import("@/registry/remocn/shader-warp-ocean").then((m) => ({
        default: m.ShaderWarpOcean,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-ocean/config").then(
        (m) => m.shaderWarpOceanConfig,
      ),
  },
  "shader-warp-marble": {
    load: () =>
      import("@/registry/remocn/shader-warp-marble").then((m) => ({
        default: m.ShaderWarpMarble,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-marble/config").then(
        (m) => m.shaderWarpMarbleConfig,
      ),
  },
  "shader-warp-acid": {
    load: () =>
      import("@/registry/remocn/shader-warp-acid").then((m) => ({
        default: m.ShaderWarpAcid,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-acid/config").then(
        (m) => m.shaderWarpAcidConfig,
      ),
  },
  "shader-warp-cream": {
    load: () =>
      import("@/registry/remocn/shader-warp-cream").then((m) => ({
        default: m.ShaderWarpCream,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-cream/config").then(
        (m) => m.shaderWarpCreamConfig,
      ),
  },
  "shader-warp-deep-sea": {
    load: () =>
      import("@/registry/remocn/shader-warp-deep-sea").then((m) => ({
        default: m.ShaderWarpDeepSea,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-deep-sea/config").then(
        (m) => m.shaderWarpDeepSeaConfig,
      ),
  },
  "shader-warp-rose-gold": {
    load: () =>
      import("@/registry/remocn/shader-warp-rose-gold").then((m) => ({
        default: m.ShaderWarpRoseGold,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-rose-gold/config").then(
        (m) => m.shaderWarpRoseGoldConfig,
      ),
  },
  "shader-warp-storm": {
    load: () =>
      import("@/registry/remocn/shader-warp-storm").then((m) => ({
        default: m.ShaderWarpStorm,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-warp-storm/config").then(
        (m) => m.shaderWarpStormConfig,
      ),
  },
  "shader-swirl": {
    load: () =>
      import("@/registry/remocn/shader-swirl").then((m) => ({
        default: m.ShaderSwirl,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl/config").then(
        (m) => m.shaderSwirlConfig,
      ),
  },
  "shader-swirl-candy": {
    load: () =>
      import("@/registry/remocn/shader-swirl-candy").then((m) => ({
        default: m.ShaderSwirlCandy,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-candy/config").then(
        (m) => m.shaderSwirlCandyConfig,
      ),
  },
  "shader-swirl-sunburst": {
    load: () =>
      import("@/registry/remocn/shader-swirl-sunburst").then((m) => ({
        default: m.ShaderSwirlSunburst,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-sunburst/config").then(
        (m) => m.shaderSwirlSunburstConfig,
      ),
  },
  "shader-swirl-hypno": {
    load: () =>
      import("@/registry/remocn/shader-swirl-hypno").then((m) => ({
        default: m.ShaderSwirlHypno,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-hypno/config").then(
        (m) => m.shaderSwirlHypnoConfig,
      ),
  },
  "shader-swirl-neon": {
    load: () =>
      import("@/registry/remocn/shader-swirl-neon").then((m) => ({
        default: m.ShaderSwirlNeon,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-neon/config").then(
        (m) => m.shaderSwirlNeonConfig,
      ),
  },
  "shader-swirl-tide": {
    load: () =>
      import("@/registry/remocn/shader-swirl-tide").then((m) => ({
        default: m.ShaderSwirlTide,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-tide/config").then(
        (m) => m.shaderSwirlTideConfig,
      ),
  },
  "shader-swirl-citrus": {
    load: () =>
      import("@/registry/remocn/shader-swirl-citrus").then((m) => ({
        default: m.ShaderSwirlCitrus,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-citrus/config").then(
        (m) => m.shaderSwirlCitrusConfig,
      ),
  },
  "shader-swirl-ember": {
    load: () =>
      import("@/registry/remocn/shader-swirl-ember").then((m) => ({
        default: m.ShaderSwirlEmber,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-ember/config").then(
        (m) => m.shaderSwirlEmberConfig,
      ),
  },
  "shader-swirl-lilac": {
    load: () =>
      import("@/registry/remocn/shader-swirl-lilac").then((m) => ({
        default: m.ShaderSwirlLilac,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-lilac/config").then(
        (m) => m.shaderSwirlLilacConfig,
      ),
  },
  "shader-swirl-retro": {
    load: () =>
      import("@/registry/remocn/shader-swirl-retro").then((m) => ({
        default: m.ShaderSwirlRetro,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-swirl-retro/config").then(
        (m) => m.shaderSwirlRetroConfig,
      ),
  },
  "shader-water": {
    load: () =>
      import("@/registry/remocn/shader-water").then((m) => ({
        default: m.ShaderWater,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-water/config").then(
        (m) => m.shaderWaterConfig,
      ),
  },
  "shader-spiral": {
    load: () =>
      import("@/registry/remocn/shader-spiral").then((m) => ({
        default: m.ShaderSpiral,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-spiral/config").then(
        (m) => m.shaderSpiralConfig,
      ),
  },
  "shader-liquid-metal": {
    load: () =>
      import("@/registry/remocn/shader-liquid-metal").then((m) => ({
        default: m.ShaderLiquidMetal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-liquid-metal/config").then(
        (m) => m.shaderLiquidMetalConfig,
      ),
  },
  "shader-color-panels": {
    load: () =>
      import("@/registry/remocn/shader-color-panels").then((m) => ({
        default: m.ShaderColorPanels,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-color-panels/config").then(
        (m) => m.shaderColorPanelsConfig,
      ),
  },
  "shader-neuro-noise": {
    load: () =>
      import("@/registry/remocn/shader-neuro-noise").then((m) => ({
        default: m.ShaderNeuroNoise,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-neuro-noise/config").then(
        (m) => m.shaderNeuroNoiseConfig,
      ),
  },
  "shader-perlin-noise": {
    load: () =>
      import("@/registry/remocn/shader-perlin-noise").then((m) => ({
        default: m.ShaderPerlinNoise,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-perlin-noise/config").then(
        (m) => m.shaderPerlinNoiseConfig,
      ),
  },
  "shader-simplex-noise": {
    load: () =>
      import("@/registry/remocn/shader-simplex-noise").then((m) => ({
        default: m.ShaderSimplexNoise,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-simplex-noise/config").then(
        (m) => m.shaderSimplexNoiseConfig,
      ),
  },
  "shader-voronoi": {
    load: () =>
      import("@/registry/remocn/shader-voronoi").then((m) => ({
        default: m.ShaderVoronoi,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-voronoi/config").then(
        (m) => m.shaderVoronoiConfig,
      ),
  },
  "shader-dot-orbit": {
    load: () =>
      import("@/registry/remocn/shader-dot-orbit").then((m) => ({
        default: m.ShaderDotOrbit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-dot-orbit/config").then(
        (m) => m.shaderDotOrbitConfig,
      ),
  },
  "shader-dithering": {
    load: () =>
      import("@/registry/remocn/shader-dithering").then((m) => ({
        default: m.ShaderDithering,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-dithering/config").then(
        (m) => m.shaderDitheringConfig,
      ),
  },
  "shader-god-rays": {
    load: () =>
      import("@/registry/remocn/shader-god-rays").then((m) => ({
        default: m.ShaderGodRays,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-god-rays/config").then(
        (m) => m.shaderGodRaysConfig,
      ),
  },
  "shader-smoke-ring": {
    load: () =>
      import("@/registry/remocn/shader-smoke-ring").then((m) => ({
        default: m.ShaderSmokeRing,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-smoke-ring/config").then(
        (m) => m.shaderSmokeRingConfig,
      ),
  },
  "shader-metaballs": {
    load: () =>
      import("@/registry/remocn/shader-metaballs").then((m) => ({
        default: m.ShaderMetaballs,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-metaballs/config").then(
        (m) => m.shaderMetaballsConfig,
      ),
  },
  "shader-pulsing-border": {
    load: () =>
      import("@/registry/remocn/shader-pulsing-border").then((m) => ({
        default: m.ShaderPulsingBorder,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-pulsing-border/config").then(
        (m) => m.shaderPulsingBorderConfig,
      ),
  },
  "simulated-cursor": {
    load: () =>
      import("@/registry/remocn/simulated-cursor").then((m) => ({
        default: m.SimulatedCursor,
      })),
    loadConfig: () =>
      import("@/registry/remocn/simulated-cursor/config").then(
        (m) => m.simulatedCursorConfig,
      ),
  },
  keystroke: {
    load: () =>
      import("@/registry/remocn/keystroke").then((m) => ({
        default: m.Keystroke,
      })),
    loadConfig: () =>
      import("@/registry/remocn/keystroke/config").then(
        (m) => m.keystrokeConfig,
      ),
  },
  "swirl-dissolve": {
    load: () =>
      import("@/components/docs/examples/swirl-dissolve-example").then((m) => ({
        default: m.SwirlDissolveExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/swirl-dissolve/config").then(
        (m) => m.swirlDissolveConfig,
      ),
  },
  "dither-dissolve": {
    load: () =>
      import("@/components/docs/examples/dither-dissolve-example").then(
        (m) => ({ default: m.DitherDissolveExampleScene }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/dither-dissolve/config").then(
        (m) => m.ditherDissolveConfig,
      ),
  },
  "perlin-dissolve": {
    load: () =>
      import("@/components/docs/examples/perlin-dissolve-example").then(
        (m) => ({ default: m.PerlinDissolveExampleScene }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/perlin-dissolve/config").then(
        (m) => m.perlinDissolveConfig,
      ),
  },
  "smoke-dissolve": {
    load: () =>
      import("@/components/docs/examples/smoke-dissolve-example").then((m) => ({
        default: m.SmokeDissolveExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/smoke-dissolve/config").then(
        (m) => m.smokeDissolveConfig,
      ),
  },
  "grain-dissolve": {
    load: () =>
      import("@/components/docs/examples/grain-dissolve-example").then((m) => ({
        default: m.GrainDissolveExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/grain-dissolve/config").then(
        (m) => m.grainDissolveConfig,
      ),
  },
  "icon-activity": {
    load: () =>
      import("@/registry/remocn-icons/icon-activity").then((m) => ({
        default: m.ActivityIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-activity/config").then(
        (m) => m.iconActivityConfig,
      ),
  },
  "icon-alert-triangle": {
    load: () =>
      import("@/registry/remocn-icons/icon-alert-triangle").then((m) => ({
        default: m.AlertTriangleIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-alert-triangle/config").then(
        (m) => m.iconAlertTriangleConfig,
      ),
  },
  "icon-arrow-down": {
    load: () =>
      import("@/registry/remocn-icons/icon-arrow-down").then((m) => ({
        default: m.ArrowDownIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-arrow-down/config").then(
        (m) => m.iconArrowDownConfig,
      ),
  },
  "icon-arrow-left": {
    load: () =>
      import("@/registry/remocn-icons/icon-arrow-left").then((m) => ({
        default: m.ArrowLeftIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-arrow-left/config").then(
        (m) => m.iconArrowLeftConfig,
      ),
  },
  "icon-arrow-right": {
    load: () =>
      import("@/registry/remocn-icons/icon-arrow-right").then((m) => ({
        default: m.ArrowRightIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-arrow-right/config").then(
        (m) => m.iconArrowRightConfig,
      ),
  },
  "icon-arrow-up": {
    load: () =>
      import("@/registry/remocn-icons/icon-arrow-up").then((m) => ({
        default: m.ArrowUpIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-arrow-up/config").then(
        (m) => m.iconArrowUpConfig,
      ),
  },
  "icon-at-sign": {
    load: () =>
      import("@/registry/remocn-icons/icon-at-sign").then((m) => ({
        default: m.AtSignIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-at-sign/config").then(
        (m) => m.iconAtSignConfig,
      ),
  },
  "icon-award": {
    load: () =>
      import("@/registry/remocn-icons/icon-award").then((m) => ({
        default: m.AwardIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-award/config").then(
        (m) => m.iconAwardConfig,
      ),
  },
  "icon-bar-chart-3": {
    load: () =>
      import("@/registry/remocn-icons/icon-bar-chart-3").then((m) => ({
        default: m.BarChart3Icon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-bar-chart-3/config").then(
        (m) => m.iconBarChart3Config,
      ),
  },
  "icon-bell": {
    load: () =>
      import("@/registry/remocn-icons/icon-bell").then((m) => ({
        default: m.BellIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-bell/config").then(
        (m) => m.iconBellConfig,
      ),
  },
  "icon-bookmark": {
    load: () =>
      import("@/registry/remocn-icons/icon-bookmark").then((m) => ({
        default: m.BookmarkIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-bookmark/config").then(
        (m) => m.iconBookmarkConfig,
      ),
  },
  "icon-calendar": {
    load: () =>
      import("@/registry/remocn-icons/icon-calendar").then((m) => ({
        default: m.CalendarIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-calendar/config").then(
        (m) => m.iconCalendarConfig,
      ),
  },
  "icon-camera": {
    load: () =>
      import("@/registry/remocn-icons/icon-camera").then((m) => ({
        default: m.CameraIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-camera/config").then(
        (m) => m.iconCameraConfig,
      ),
  },
  "icon-check": {
    load: () =>
      import("@/registry/remocn-icons/icon-check").then((m) => ({
        default: m.CheckIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-check/config").then(
        (m) => m.iconCheckConfig,
      ),
  },
  "icon-chevron-down": {
    load: () =>
      import("@/registry/remocn-icons/icon-chevron-down").then((m) => ({
        default: m.ChevronDownIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-chevron-down/config").then(
        (m) => m.iconChevronDownConfig,
      ),
  },
  "icon-chevron-left": {
    load: () =>
      import("@/registry/remocn-icons/icon-chevron-left").then((m) => ({
        default: m.ChevronLeftIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-chevron-left/config").then(
        (m) => m.iconChevronLeftConfig,
      ),
  },
  "icon-chevron-right": {
    load: () =>
      import("@/registry/remocn-icons/icon-chevron-right").then((m) => ({
        default: m.ChevronRightIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-chevron-right/config").then(
        (m) => m.iconChevronRightConfig,
      ),
  },
  "icon-chevron-up": {
    load: () =>
      import("@/registry/remocn-icons/icon-chevron-up").then((m) => ({
        default: m.ChevronUpIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-chevron-up/config").then(
        (m) => m.iconChevronUpConfig,
      ),
  },
  "icon-clock": {
    load: () =>
      import("@/registry/remocn-icons/icon-clock").then((m) => ({
        default: m.ClockIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-clock/config").then(
        (m) => m.iconClockConfig,
      ),
  },
  "icon-cloud": {
    load: () =>
      import("@/registry/remocn-icons/icon-cloud").then((m) => ({
        default: m.CloudIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-cloud/config").then(
        (m) => m.iconCloudConfig,
      ),
  },
  "icon-code": {
    load: () =>
      import("@/registry/remocn-icons/icon-code").then((m) => ({
        default: m.CodeIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-code/config").then(
        (m) => m.iconCodeConfig,
      ),
  },
  "icon-copy": {
    load: () =>
      import("@/registry/remocn-icons/icon-copy").then((m) => ({
        default: m.CopyIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-copy/config").then(
        (m) => m.iconCopyConfig,
      ),
  },
  "icon-credit-card": {
    load: () =>
      import("@/registry/remocn-icons/icon-credit-card").then((m) => ({
        default: m.CreditCardIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-credit-card/config").then(
        (m) => m.iconCreditCardConfig,
      ),
  },
  "icon-crown": {
    load: () =>
      import("@/registry/remocn-icons/icon-crown").then((m) => ({
        default: m.CrownIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-crown/config").then(
        (m) => m.iconCrownConfig,
      ),
  },
  "icon-database": {
    load: () =>
      import("@/registry/remocn-icons/icon-database").then((m) => ({
        default: m.DatabaseIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-database/config").then(
        (m) => m.iconDatabaseConfig,
      ),
  },
  "icon-dollar-sign": {
    load: () =>
      import("@/registry/remocn-icons/icon-dollar-sign").then((m) => ({
        default: m.DollarSignIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-dollar-sign/config").then(
        (m) => m.iconDollarSignConfig,
      ),
  },
  "icon-download": {
    load: () =>
      import("@/registry/remocn-icons/icon-download").then((m) => ({
        default: m.DownloadIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-download/config").then(
        (m) => m.iconDownloadConfig,
      ),
  },
  "icon-external-link": {
    load: () =>
      import("@/registry/remocn-icons/icon-external-link").then((m) => ({
        default: m.ExternalLinkIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-external-link/config").then(
        (m) => m.iconExternalLinkConfig,
      ),
  },
  "icon-eye-off": {
    load: () =>
      import("@/registry/remocn-icons/icon-eye-off").then((m) => ({
        default: m.EyeOffIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-eye-off/config").then(
        (m) => m.iconEyeOffConfig,
      ),
  },
  "icon-eye": {
    load: () =>
      import("@/registry/remocn-icons/icon-eye").then((m) => ({
        default: m.EyeIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-eye/config").then(
        (m) => m.iconEyeConfig,
      ),
  },
  "icon-file-text": {
    load: () =>
      import("@/registry/remocn-icons/icon-file-text").then((m) => ({
        default: m.FileTextIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-file-text/config").then(
        (m) => m.iconFileTextConfig,
      ),
  },
  "icon-filter": {
    load: () =>
      import("@/registry/remocn-icons/icon-filter").then((m) => ({
        default: m.FilterIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-filter/config").then(
        (m) => m.iconFilterConfig,
      ),
  },
  "icon-flame": {
    load: () =>
      import("@/registry/remocn-icons/icon-flame").then((m) => ({
        default: m.FlameIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-flame/config").then(
        (m) => m.iconFlameConfig,
      ),
  },
  "icon-folder": {
    load: () =>
      import("@/registry/remocn-icons/icon-folder").then((m) => ({
        default: m.FolderIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-folder/config").then(
        (m) => m.iconFolderConfig,
      ),
  },
  "icon-gem": {
    load: () =>
      import("@/registry/remocn-icons/icon-gem").then((m) => ({
        default: m.GemIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-gem/config").then(
        (m) => m.iconGemConfig,
      ),
  },
  "icon-gift": {
    load: () =>
      import("@/registry/remocn-icons/icon-gift").then((m) => ({
        default: m.GiftIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-gift/config").then(
        (m) => m.iconGiftConfig,
      ),
  },
  "icon-globe": {
    load: () =>
      import("@/registry/remocn-icons/icon-globe").then((m) => ({
        default: m.GlobeIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-globe/config").then(
        (m) => m.iconGlobeConfig,
      ),
  },
  "icon-heart": {
    load: () =>
      import("@/registry/remocn-icons/icon-heart").then((m) => ({
        default: m.HeartIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-heart/config").then(
        (m) => m.iconHeartConfig,
      ),
  },
  "icon-help-circle": {
    load: () =>
      import("@/registry/remocn-icons/icon-help-circle").then((m) => ({
        default: m.HelpCircleIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-help-circle/config").then(
        (m) => m.iconHelpCircleConfig,
      ),
  },
  "icon-home": {
    load: () =>
      import("@/registry/remocn-icons/icon-home").then((m) => ({
        default: m.HomeIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-home/config").then(
        (m) => m.iconHomeConfig,
      ),
  },
  "icon-image": {
    load: () =>
      import("@/registry/remocn-icons/icon-image").then((m) => ({
        default: m.ImageIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-image/config").then(
        (m) => m.iconImageConfig,
      ),
  },
  "icon-inbox": {
    load: () =>
      import("@/registry/remocn-icons/icon-inbox").then((m) => ({
        default: m.InboxIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-inbox/config").then(
        (m) => m.iconInboxConfig,
      ),
  },
  "icon-info": {
    load: () =>
      import("@/registry/remocn-icons/icon-info").then((m) => ({
        default: m.InfoIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-info/config").then(
        (m) => m.iconInfoConfig,
      ),
  },
  "icon-key": {
    load: () =>
      import("@/registry/remocn-icons/icon-key").then((m) => ({
        default: m.KeyIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-key/config").then(
        (m) => m.iconKeyConfig,
      ),
  },
  "icon-layout-grid": {
    load: () =>
      import("@/registry/remocn-icons/icon-layout-grid").then((m) => ({
        default: m.LayoutGridIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-layout-grid/config").then(
        (m) => m.iconLayoutGridConfig,
      ),
  },
  "icon-link": {
    load: () =>
      import("@/registry/remocn-icons/icon-link").then((m) => ({
        default: m.LinkIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-link/config").then(
        (m) => m.iconLinkConfig,
      ),
  },
  "icon-loader": {
    load: () =>
      import("@/registry/remocn-icons/icon-loader").then((m) => ({
        default: m.LoaderIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-loader/config").then(
        (m) => m.iconLoaderConfig,
      ),
  },
  "icon-lock": {
    load: () =>
      import("@/registry/remocn-icons/icon-lock").then((m) => ({
        default: m.LockIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-lock/config").then(
        (m) => m.iconLockConfig,
      ),
  },
  "icon-log-out": {
    load: () =>
      import("@/registry/remocn-icons/icon-log-out").then((m) => ({
        default: m.LogOutIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-log-out/config").then(
        (m) => m.iconLogOutConfig,
      ),
  },
  "icon-mail": {
    load: () =>
      import("@/registry/remocn-icons/icon-mail").then((m) => ({
        default: m.MailIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-mail/config").then(
        (m) => m.iconMailConfig,
      ),
  },
  "icon-maximize": {
    load: () =>
      import("@/registry/remocn-icons/icon-maximize").then((m) => ({
        default: m.MaximizeIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-maximize/config").then(
        (m) => m.iconMaximizeConfig,
      ),
  },
  "icon-menu": {
    load: () =>
      import("@/registry/remocn-icons/icon-menu").then((m) => ({
        default: m.MenuIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-menu/config").then(
        (m) => m.iconMenuConfig,
      ),
  },
  "icon-message-circle": {
    load: () =>
      import("@/registry/remocn-icons/icon-message-circle").then((m) => ({
        default: m.MessageCircleIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-message-circle/config").then(
        (m) => m.iconMessageCircleConfig,
      ),
  },
  "icon-mic": {
    load: () =>
      import("@/registry/remocn-icons/icon-mic").then((m) => ({
        default: m.MicIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-mic/config").then(
        (m) => m.iconMicConfig,
      ),
  },
  "icon-monitor": {
    load: () =>
      import("@/registry/remocn-icons/icon-monitor").then((m) => ({
        default: m.MonitorIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-monitor/config").then(
        (m) => m.iconMonitorConfig,
      ),
  },
  "icon-moon": {
    load: () =>
      import("@/registry/remocn-icons/icon-moon").then((m) => ({
        default: m.MoonIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-moon/config").then(
        (m) => m.iconMoonConfig,
      ),
  },
  "icon-more-horizontal": {
    load: () =>
      import("@/registry/remocn-icons/icon-more-horizontal").then((m) => ({
        default: m.MoreHorizontalIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-more-horizontal/config").then(
        (m) => m.iconMoreHorizontalConfig,
      ),
  },
  "icon-package": {
    load: () =>
      import("@/registry/remocn-icons/icon-package").then((m) => ({
        default: m.PackageIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-package/config").then(
        (m) => m.iconPackageConfig,
      ),
  },
  "icon-party-popper": {
    load: () =>
      import("@/registry/remocn-icons/icon-party-popper").then((m) => ({
        default: m.PartyPopperIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-party-popper/config").then(
        (m) => m.iconPartyPopperConfig,
      ),
  },
  "icon-pause": {
    load: () =>
      import("@/registry/remocn-icons/icon-pause").then((m) => ({
        default: m.PauseIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-pause/config").then(
        (m) => m.iconPauseConfig,
      ),
  },
  "icon-pencil": {
    load: () =>
      import("@/registry/remocn-icons/icon-pencil").then((m) => ({
        default: m.PencilIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-pencil/config").then(
        (m) => m.iconPencilConfig,
      ),
  },
  "icon-phone": {
    load: () =>
      import("@/registry/remocn-icons/icon-phone").then((m) => ({
        default: m.PhoneIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-phone/config").then(
        (m) => m.iconPhoneConfig,
      ),
  },
  "icon-play": {
    load: () =>
      import("@/registry/remocn-icons/icon-play").then((m) => ({
        default: m.PlayIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-play/config").then(
        (m) => m.iconPlayConfig,
      ),
  },
  "icon-plus": {
    load: () =>
      import("@/registry/remocn-icons/icon-plus").then((m) => ({
        default: m.PlusIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-plus/config").then(
        (m) => m.iconPlusConfig,
      ),
  },
  "icon-plus-circle": {
    load: () =>
      import("@/registry/remocn-icons/icon-plus-circle").then((m) => ({
        default: m.PlusCircleIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-plus-circle/config").then(
        (m) => m.iconPlusCircleConfig,
      ),
  },
  "icon-refresh-cw": {
    load: () =>
      import("@/registry/remocn-icons/icon-refresh-cw").then((m) => ({
        default: m.RefreshCwIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-refresh-cw/config").then(
        (m) => m.iconRefreshCwConfig,
      ),
  },
  "icon-rocket": {
    load: () =>
      import("@/registry/remocn-icons/icon-rocket").then((m) => ({
        default: m.RocketIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-rocket/config").then(
        (m) => m.iconRocketConfig,
      ),
  },
  "icon-save": {
    load: () =>
      import("@/registry/remocn-icons/icon-save").then((m) => ({
        default: m.SaveIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-save/config").then(
        (m) => m.iconSaveConfig,
      ),
  },
  "icon-search": {
    load: () =>
      import("@/registry/remocn-icons/icon-search").then((m) => ({
        default: m.SearchIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-search/config").then(
        (m) => m.iconSearchConfig,
      ),
  },
  "icon-send": {
    load: () =>
      import("@/registry/remocn-icons/icon-send").then((m) => ({
        default: m.SendIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-send/config").then(
        (m) => m.iconSendConfig,
      ),
  },
  "icon-settings": {
    load: () =>
      import("@/registry/remocn-icons/icon-settings").then((m) => ({
        default: m.SettingsIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-settings/config").then(
        (m) => m.iconSettingsConfig,
      ),
  },
  "icon-share-2": {
    load: () =>
      import("@/registry/remocn-icons/icon-share-2").then((m) => ({
        default: m.Share2Icon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-share-2/config").then(
        (m) => m.iconShare2Config,
      ),
  },
  "icon-shield": {
    load: () =>
      import("@/registry/remocn-icons/icon-shield").then((m) => ({
        default: m.ShieldIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-shield/config").then(
        (m) => m.iconShieldConfig,
      ),
  },
  "icon-shopping-cart": {
    load: () =>
      import("@/registry/remocn-icons/icon-shopping-cart").then((m) => ({
        default: m.ShoppingCartIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-shopping-cart/config").then(
        (m) => m.iconShoppingCartConfig,
      ),
  },
  "icon-skip-forward": {
    load: () =>
      import("@/registry/remocn-icons/icon-skip-forward").then((m) => ({
        default: m.SkipForwardIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-skip-forward/config").then(
        (m) => m.iconSkipForwardConfig,
      ),
  },
  "icon-smartphone": {
    load: () =>
      import("@/registry/remocn-icons/icon-smartphone").then((m) => ({
        default: m.SmartphoneIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-smartphone/config").then(
        (m) => m.iconSmartphoneConfig,
      ),
  },
  "icon-sparkles": {
    load: () =>
      import("@/registry/remocn-icons/icon-sparkles").then((m) => ({
        default: m.SparklesIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-sparkles/config").then(
        (m) => m.iconSparklesConfig,
      ),
  },
  "icon-star": {
    load: () =>
      import("@/registry/remocn-icons/icon-star").then((m) => ({
        default: m.StarIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-star/config").then(
        (m) => m.iconStarConfig,
      ),
  },
  "icon-sun": {
    load: () =>
      import("@/registry/remocn-icons/icon-sun").then((m) => ({
        default: m.SunIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-sun/config").then(
        (m) => m.iconSunConfig,
      ),
  },
  "icon-tag": {
    load: () =>
      import("@/registry/remocn-icons/icon-tag").then((m) => ({
        default: m.TagIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-tag/config").then(
        (m) => m.iconTagConfig,
      ),
  },
  "icon-target": {
    load: () =>
      import("@/registry/remocn-icons/icon-target").then((m) => ({
        default: m.TargetIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-target/config").then(
        (m) => m.iconTargetConfig,
      ),
  },
  "icon-terminal": {
    load: () =>
      import("@/registry/remocn-icons/icon-terminal").then((m) => ({
        default: m.TerminalIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-terminal/config").then(
        (m) => m.iconTerminalConfig,
      ),
  },
  "icon-thumbs-up": {
    load: () =>
      import("@/registry/remocn-icons/icon-thumbs-up").then((m) => ({
        default: m.ThumbsUpIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-thumbs-up/config").then(
        (m) => m.iconThumbsUpConfig,
      ),
  },
  "icon-timer": {
    load: () =>
      import("@/registry/remocn-icons/icon-timer").then((m) => ({
        default: m.TimerIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-timer/config").then(
        (m) => m.iconTimerConfig,
      ),
  },
  "icon-trash": {
    load: () =>
      import("@/registry/remocn-icons/icon-trash").then((m) => ({
        default: m.TrashIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-trash/config").then(
        (m) => m.iconTrashConfig,
      ),
  },
  "icon-trending-down": {
    load: () =>
      import("@/registry/remocn-icons/icon-trending-down").then((m) => ({
        default: m.TrendingDownIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-trending-down/config").then(
        (m) => m.iconTrendingDownConfig,
      ),
  },
  "icon-trending-up": {
    load: () =>
      import("@/registry/remocn-icons/icon-trending-up").then((m) => ({
        default: m.TrendingUpIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-trending-up/config").then(
        (m) => m.iconTrendingUpConfig,
      ),
  },
  "icon-trophy": {
    load: () =>
      import("@/registry/remocn-icons/icon-trophy").then((m) => ({
        default: m.TrophyIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-trophy/config").then(
        (m) => m.iconTrophyConfig,
      ),
  },
  "icon-upload": {
    load: () =>
      import("@/registry/remocn-icons/icon-upload").then((m) => ({
        default: m.UploadIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-upload/config").then(
        (m) => m.iconUploadConfig,
      ),
  },
  "icon-user-plus": {
    load: () =>
      import("@/registry/remocn-icons/icon-user-plus").then((m) => ({
        default: m.UserPlusIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-user-plus/config").then(
        (m) => m.iconUserPlusConfig,
      ),
  },
  "icon-user": {
    load: () =>
      import("@/registry/remocn-icons/icon-user").then((m) => ({
        default: m.UserIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-user/config").then(
        (m) => m.iconUserConfig,
      ),
  },
  "icon-users": {
    load: () =>
      import("@/registry/remocn-icons/icon-users").then((m) => ({
        default: m.UsersIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-users/config").then(
        (m) => m.iconUsersConfig,
      ),
  },
  "icon-video": {
    load: () =>
      import("@/registry/remocn-icons/icon-video").then((m) => ({
        default: m.VideoIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-video/config").then(
        (m) => m.iconVideoConfig,
      ),
  },
  "icon-volume-2": {
    load: () =>
      import("@/registry/remocn-icons/icon-volume-2").then((m) => ({
        default: m.Volume2Icon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-volume-2/config").then(
        (m) => m.iconVolume2Config,
      ),
  },
  "icon-volume-x": {
    load: () =>
      import("@/registry/remocn-icons/icon-volume-x").then((m) => ({
        default: m.VolumeXIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-volume-x/config").then(
        (m) => m.iconVolumeXConfig,
      ),
  },
  "icon-wallet": {
    load: () =>
      import("@/registry/remocn-icons/icon-wallet").then((m) => ({
        default: m.WalletIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-wallet/config").then(
        (m) => m.iconWalletConfig,
      ),
  },
  "icon-check-circle": {
    load: () =>
      import("@/registry/remocn-icons/icon-check-circle").then((m) => ({
        default: m.CheckCircleIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-check-circle/config").then(
        (m) => m.iconCheckCircleConfig,
      ),
  },
  "icon-x": {
    load: () =>
      import("@/registry/remocn-icons/icon-x").then((m) => ({
        default: m.XIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-x/config").then(
        (m) => m.iconXConfig,
      ),
  },
  "icon-x-circle": {
    load: () =>
      import("@/registry/remocn-icons/icon-x-circle").then((m) => ({
        default: m.XCircleIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-x-circle/config").then(
        (m) => m.iconXCircleConfig,
      ),
  },
  "icon-zap": {
    load: () =>
      import("@/registry/remocn-icons/icon-zap").then((m) => ({
        default: m.ZapIcon,
      })),
    loadConfig: () =>
      import("@/registry/remocn-icons/icon-zap/config").then(
        (m) => m.iconZapConfig,
      ),
  },
  "wave-wipe": {
    load: () =>
      import("@/components/docs/examples/wave-wipe-example").then((m) => ({
        default: m.WaveWipeExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/wave-wipe/config").then(
        (m) => m.waveWipeConfig,
      ),
  },
  "ripple-zoom": {
    load: () =>
      import("@/components/docs/examples/ripple-zoom-example").then((m) => ({
        default: m.RippleZoomExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ripple-zoom/config").then(
        (m) => m.rippleZoomConfig,
      ),
  },
  "whip-pan": {
    load: () =>
      import("@/components/docs/examples/whip-pan-example").then((m) => ({
        default: m.WhipPanExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/whip-pan/config").then((m) => m.whipPanConfig),
  },
  "push-through": {
    load: () =>
      import("@/components/docs/examples/push-through-example").then((m) => ({
        default: m.PushThroughExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/push-through/config").then(
        (m) => m.pushThroughConfig,
      ),
  },
  "focus-pull": {
    load: () =>
      import("@/components/docs/examples/focus-pull-example").then((m) => ({
        default: m.FocusPullExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/focus-pull/config").then(
        (m) => m.focusPullConfig,
      ),
  },
  "zoom-blur": {
    load: () =>
      import("@/components/docs/examples/zoom-blur-example").then((m) => ({
        default: m.ZoomBlurExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/zoom-blur/config").then(
        (m) => m.zoomBlurConfig,
      ),
  },
  "lens-zoom": {
    load: () =>
      import("@/components/docs/examples/lens-zoom-example").then((m) => ({
        default: m.LensZoomExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/lens-zoom/config").then(
        (m) => m.lensZoomConfig,
      ),
  },
  "glitch-cut": {
    load: () =>
      import("@/components/docs/examples/glitch-cut-example").then((m) => ({
        default: m.GlitchCutExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glitch-cut/config").then(
        (m) => m.glitchCutConfig,
      ),
  },
  "ember-burn": {
    load: () =>
      import("@/components/docs/examples/ember-burn-example").then((m) => ({
        default: m.EmberBurnExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ember-burn/config").then(
        (m) => m.emberBurnConfig,
      ),
  },
  "particle-dissolve": {
    load: () =>
      import("@/components/docs/examples/particle-dissolve-example").then(
        (m) => ({ default: m.ParticleDissolveExampleScene }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/particle-dissolve/config").then(
        (m) => m.particleDissolveConfig,
      ),
  },
  "grid-wave": {
    load: () =>
      import("@/components/docs/examples/grid-wave-example").then((m) => ({
        default: m.GridWaveExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/grid-wave/config").then(
        (m) => m.gridWaveConfig,
      ),
  },
  displacement: {
    load: () =>
      import("@/components/docs/examples/displacement-example").then((m) => ({
        default: m.DisplacementExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/displacement/config").then(
        (m) => m.displacementConfig,
      ),
  },
  "vhs-filter": {
    load: () =>
      import("@/components/docs/examples/vhs-filter-example").then((m) => ({
        default: m.VhsFilterExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/vhs-filter/config").then(
        (m) => m.vhsFilterConfig,
      ),
  },
  "crt-screen": {
    load: () =>
      import("@/components/docs/examples/crt-screen-example").then((m) => ({
        default: m.CrtScreenExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/crt-screen/config").then(
        (m) => m.crtScreenConfig,
      ),
  },
  "sustained-glitch": {
    load: () =>
      import("@/components/docs/examples/sustained-glitch-example").then(
        (m) => ({ default: m.SustainedGlitchExampleScene }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/sustained-glitch/config").then(
        (m) => m.sustainedGlitchConfig,
      ),
  },
  "pixelate-region": {
    load: () =>
      import("@/components/docs/examples/pixelate-region-example").then(
        (m) => ({ default: m.PixelateRegionExampleScene }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/pixelate-region/config").then(
        (m) => m.pixelateRegionConfig,
      ),
  },
  "ascii-render": {
    load: () =>
      import("@/components/docs/examples/ascii-render-example").then((m) => ({
        default: m.AsciiRenderExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ascii-render/config").then(
        (m) => m.asciiRenderConfig,
      ),
  },
  "halftone-print": {
    load: () =>
      import("@/components/docs/examples/halftone-print-example").then((m) => ({
        default: m.HalftonePrintExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/halftone-print/config").then(
        (m) => m.halftonePrintConfig,
      ),
  },
  "underwater-ripple": {
    load: () =>
      import("@/components/docs/examples/underwater-ripple-example").then(
        (m) => ({ default: m.UnderwaterRippleExampleScene }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/underwater-ripple/config").then(
        (m) => m.underwaterRippleConfig,
      ),
  },
  "camera-lens": {
    load: () =>
      import("@/components/docs/examples/camera-lens-example").then((m) => ({
        default: m.CameraLensExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/camera-lens/config").then(
        (m) => m.cameraLensConfig,
      ),
  },
  "security-cam": {
    load: () =>
      import("@/components/docs/examples/security-cam-example").then((m) => ({
        default: m.SecurityCamExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/security-cam/config").then(
        (m) => m.securityCamConfig,
      ),
  },
  hologram: {
    load: () =>
      import("@/components/docs/examples/hologram-example").then((m) => ({
        default: m.HologramExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hologram/config").then((m) => m.hologramConfig),
  },
  "tv-power-off": {
    load: () =>
      import("@/components/docs/examples/tv-power-off-example").then((m) => ({
        default: m.TvPowerOffExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tv-power-off/config").then(
        (m) => m.tvPowerOffConfig,
      ),
  },
  "slide-swap": {
    load: () =>
      import("@/components/docs/examples/slide-swap-example").then((m) => ({
        default: m.SlideSwapExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slide-swap/config").then(
        (m) => m.slideSwapConfig,
      ),
  },
  "spring-settle": {
    load: () =>
      import("@/components/docs/examples/spring-settle-example").then((m) => ({
        default: m.SpringSettleExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spring-settle/config").then(
        (m) => m.springSettleConfig,
      ),
  },
  "warp-dissolve": {
    load: () =>
      import("@/components/docs/examples/warp-dissolve-example").then((m) => ({
        default: m.WarpDissolveExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/warp-dissolve/config").then(
        (m) => m.warpDissolveConfig,
      ),
  },
  "chat-to-preview-layout": {
    load: () =>
      import("@/registry/remocn/chat-to-preview-layout").then((m) => ({
        default: m.ChatToPreviewLayout,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chat-to-preview-layout/config").then(
        (m) => m.chatToPreviewLayoutConfig,
      ),
  },
  "animated-line-chart": {
    load: () =>
      import("@/registry/remocn/animated-line-chart").then((m) => ({
        default: m.AnimatedLineChart,
      })),
    loadConfig: () =>
      import("@/registry/remocn/animated-line-chart/config").then(
        (m) => m.animatedLineChartConfig,
      ),
  },
  "animated-bar-chart": {
    load: () =>
      import("@/registry/remocn/animated-bar-chart").then((m) => ({
        default: m.AnimatedBarChart,
      })),
    loadConfig: () =>
      import("@/registry/remocn/animated-bar-chart/config").then(
        (m) => m.animatedBarChartConfig,
      ),
  },
  "terminal-simulator": {
    load: () =>
      import("@/registry/remocn/terminal-simulator").then((m) => ({
        default: m.TerminalSimulator,
      })),
    loadConfig: () =>
      import("@/registry/remocn/terminal-simulator/config").then(
        (m) => m.terminalSimulatorConfig,
      ),
  },
  "terminal-cursor-zoom": {
    load: () =>
      import("@/registry/remocn/terminal-cursor-zoom").then((m) => ({
        default: m.TerminalCursorZoom,
      })),
    loadConfig: () =>
      import("@/registry/remocn/terminal-cursor-zoom/config").then(
        (m) => m.terminalCursorZoomConfig,
      ),
  },
  "ecosystem-constellation": {
    load: () =>
      import("@/registry/remocn/ecosystem-constellation").then((m) => ({
        default: m.EcosystemConstellation,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ecosystem-constellation/config").then(
        (m) => m.ecosystemConstellationConfig,
      ),
  },
  "live-code-compilation": {
    load: () =>
      import("@/registry/remocn/live-code-compilation").then((m) => ({
        default: m.LiveCodeCompilation,
      })),
    loadConfig: () =>
      import("@/registry/remocn/live-code-compilation/config").then(
        (m) => m.liveCodeCompilationConfig,
      ),
  },
  "infinite-bento-pan": {
    load: () =>
      import("@/registry/remocn/infinite-bento-pan").then((m) => ({
        default: m.InfiniteBentoPan,
      })),
    loadConfig: () =>
      import("@/registry/remocn/infinite-bento-pan/config").then(
        (m) => m.infiniteBentoPanConfig,
      ),
  },
  "github-sponsors": {
    load: () =>
      import("@/registry/remocn/github-sponsors").then((m) => ({
        default: m.GitHubSponsors,
      })),
    loadConfig: () =>
      import("@/registry/remocn/github-sponsors/config").then(
        (m) => m.githubSponsorsConfig,
      ),
  },
  "github-stars": {
    load: () =>
      import("@/registry/remocn/github-stars").then((m) => ({
        default: m.GitHubStars,
      })),
    loadConfig: () =>
      import("@/registry/remocn/github-stars/config").then(
        (m) => m.githubStarsConfig,
      ),
  },
  "logo-enter": {
    load: () =>
      import("@/registry/remocn/logo-enter").then((m) => ({
        default: m.LogoEnter,
      })),
    loadConfig: () =>
      import("@/registry/remocn/logo-enter/config").then(
        (m) => m.logoEnterConfig,
      ),
  },
  "number-wheel": {
    load: () =>
      import("@/registry/remocn/number-wheel").then((m) => ({
        default: m.NumberWheel,
      })),
    loadConfig: () =>
      import("@/registry/remocn/number-wheel/config").then(
        (m) => m.numberWheelConfig,
      ),
  },
  "rolling-number": {
    load: () =>
      import("@/registry/remocn/rolling-number").then((m) => ({
        default: m.RollingNumber,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rolling-number/config").then(
        (m) => m.rollingNumberConfig,
      ),
  },
  "rolodex-flip": {
    load: () =>
      import("@/components/docs/examples/rolodex-flip-example").then((m) => ({
        default: m.RolodexFlipExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rolodex-flip/config").then(
        (m) => m.rolodexFlipConfig,
      ),
  },
  "value-swap": {
    load: () =>
      import("@/components/docs/examples/value-swap-example").then((m) => ({
        default: m.ValueSwapExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/value-swap/config").then(
        (m) => m.valueSwapConfig,
      ),
  },
  "x-follow-card": {
    load: () =>
      import("@/registry/remocn/x-follow-card").then((m) => ({
        default: m.XFollowCard,
      })),
    loadConfig: () =>
      import("@/registry/remocn/x-follow-card/config").then(
        (m) => m.xFollowCardConfig,
      ),
  },
  "x-followers-overview": {
    load: () =>
      import("@/registry/remocn/x-followers-overview").then((m) => ({
        default: m.XFollowersOverview,
      })),
    loadConfig: () =>
      import("@/registry/remocn/x-followers-overview/config").then(
        (m) => m.xFollowersOverviewConfig,
      ),
  },
  "cursor-gravity": {
    load: () =>
      import("@/registry/remocn/cursor-gravity").then((m) => ({
        default: m.CursorGravity,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cursor-gravity/config").then(
        (m) => m.cursorGravityConfig,
      ),
  },
  "radial-burst": {
    load: () =>
      import("@/registry/remocn/radial-burst").then((m) => ({
        default: m.RadialBurst,
      })),
    loadConfig: () =>
      import("@/registry/remocn/radial-burst/config").then(
        (m) => m.radialBurstConfig,
      ),
  },
  "bauhaus-build": {
    load: () =>
      import("@/registry/remocn/bauhaus-build").then((m) => ({
        default: m.BauhausBuild,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bauhaus-build/config").then(
        (m) => m.bauhausBuildConfig,
      ),
  },
  "mondrian-split": {
    load: () =>
      import("@/registry/remocn/mondrian-split").then((m) => ({
        default: m.MondrianSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/mondrian-split/config").then(
        (m) => m.mondrianSplitConfig,
      ),
  },
  "truchet-flip": {
    load: () =>
      import("@/registry/remocn/truchet-flip").then((m) => ({
        default: m.TruchetFlip,
      })),
    loadConfig: () =>
      import("@/registry/remocn/truchet-flip/config").then(
        (m) => m.truchetFlipConfig,
      ),
  },
  "trim-burst": {
    load: () =>
      import("@/registry/remocn/trim-burst").then((m) => ({
        default: m.TrimBurst,
      })),
    loadConfig: () =>
      import("@/registry/remocn/trim-burst/config").then(
        (m) => m.trimBurstConfig,
      ),
  },
  "speed-lines": {
    load: () =>
      import("@/registry/remocn/speed-lines").then((m) => ({
        default: m.SpeedLines,
      })),
    loadConfig: () =>
      import("@/registry/remocn/speed-lines/config").then(
        (m) => m.speedLinesConfig,
      ),
  },
  squiggle: {
    load: () =>
      import("@/registry/remocn/squiggle").then((m) => ({
        default: m.Squiggle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/squiggle/config").then((m) => m.squiggleConfig),
  },
  confetti: {
    load: () =>
      import("@/registry/remocn/confetti").then((m) => ({
        default: m.Confetti,
      })),
    loadConfig: () =>
      import("@/registry/remocn/confetti/config").then((m) => m.confettiConfig),
  },
  "paper-wobble": {
    load: () =>
      import("@/components/docs/examples/paper-wobble-example").then((m) => ({
        default: m.PaperWobbleExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/paper-wobble/config").then(
        (m) => m.paperWobbleConfig,
      ),
  },
  "paper-sticker": {
    load: () =>
      import("@/components/docs/examples/paper-sticker-example").then((m) => ({
        default: m.PaperStickerExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/paper-sticker/config").then(
        (m) => m.paperStickerConfig,
      ),
  },
  polaroid: {
    load: () =>
      import("@/components/docs/examples/polaroid-example").then((m) => ({
        default: m.PolaroidExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/polaroid/config").then((m) => m.polaroidConfig),
  },
  "check-list": {
    load: () =>
      import("@/components/docs/examples/check-list-example").then((m) => ({
        default: m.CheckListExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/check-list/config").then(
        (m) => m.checkListConfig,
      ),
  },
  "crumple-toss": {
    load: () =>
      import("@/components/docs/examples/crumple-toss-example").then((m) => ({
        default: m.CrumpleTossExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/crumple-toss/config").then(
        (m) => m.crumpleTossConfig,
      ),
  },
  "scribble-circle": {
    load: () =>
      import("@/components/docs/examples/scribble-circle-example").then(
        (m) => ({
          default: m.ScribbleCircleExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/scribble-circle/config").then(
        (m) => m.scribbleCircleConfig,
      ),
  },
  "page-turn": {
    load: () =>
      import("@/components/docs/examples/page-turn-example").then((m) => ({
        default: m.PageTurnExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/page-turn/config").then(
        (m) => m.pageTurnConfig,
      ),
  },
  "ink-arrow": {
    load: () =>
      import("@/components/docs/examples/ink-arrow-example").then((m) => ({
        default: m.InkArrowExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ink-arrow/config").then(
        (m) => m.inkArrowConfig,
      ),
  },
  backdrop: {
    load: () =>
      import("@/components/docs/examples/backdrop-demo").then((m) => ({
        default: m.BackdropDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/backdrop/config").then((m) => m.backdropConfig),
  },
  drift: {
    load: () =>
      import("@/components/docs/examples/drift-example").then((m) => ({
        default: m.DriftExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/drift/config").then((m) => m.driftConfig),
  },
  stage: {
    load: () =>
      import("@/components/docs/examples/stage-example").then((m) => ({
        default: m.StageExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stage/config").then((m) => m.stageConfig),
  },
  "claude-chat": {
    load: () =>
      import("@/registry/remocn/claude-chat").then((m) => ({
        default: m.ClaudeChat,
      })),
    loadConfig: () =>
      import("@/registry/remocn/claude-chat/config").then(
        (m) => m.claudeChatConfig,
      ),
  },
  "chat-gpt": {
    load: () =>
      import("@/registry/remocn/chat-gpt").then((m) => ({
        default: m.ChatGpt,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chat-gpt/config").then((m) => m.chatGptConfig),
  },
  v0: {
    load: () => import("@/registry/remocn/v0").then((m) => ({ default: m.V0 })),
    loadConfig: () =>
      import("@/registry/remocn/v0/config").then((m) => m.v0Config),
  },
  "claude-code": {
    load: () =>
      import("@/registry/remocn/claude-code").then((m) => ({
        default: m.ClaudeCode,
      })),
    loadConfig: () =>
      import("@/registry/remocn/claude-code/config").then(
        (m) => m.claudeCodeConfig,
      ),
  },
  opencode: {
    load: () =>
      import("@/registry/remocn/opencode").then((m) => ({
        default: m.OpenCode,
      })),
    loadConfig: () =>
      import("@/registry/remocn/opencode/config").then((m) => m.opencodeConfig),
  },
  "agent-run": {
    load: () =>
      import("@/registry/remocn/agent-run").then((m) => ({
        default: m.AgentRun,
      })),
    loadConfig: () =>
      import("@/registry/remocn/agent-run/config").then(
        (m) => m.agentRunConfig,
      ),
  },
  button: {
    load: () =>
      import("@/registry/remocn-ui/button").then((m) => ({
        default: m.Button,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/button/config").then((m) => m.buttonConfig),
  },
  accordion: {
    load: () =>
      import("@/registry/remocn-ui/accordion").then((m) => ({
        default: m.Accordion,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/accordion/config").then(
        (m) => m.accordionConfig,
      ),
  },
  "alert-dialog": {
    load: () =>
      import("@/registry/remocn-ui/alert-dialog").then((m) => ({
        default: m.AlertDialog,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/alert-dialog/config").then(
        (m) => m.alertDialogConfig,
      ),
  },
  dialog: {
    load: () =>
      import("@/registry/remocn-ui/dialog").then((m) => ({
        default: m.Dialog,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/dialog/config").then((m) => m.dialogConfig),
  },
  sheet: {
    load: () =>
      import("@/registry/remocn-ui/sheet").then((m) => ({ default: m.Sheet })),
    loadConfig: () =>
      import("@/registry/remocn-ui/sheet/config").then((m) => m.sheetConfig),
  },
  drawer: {
    load: () =>
      import("@/registry/remocn-ui/drawer").then((m) => ({
        default: m.Drawer,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/drawer/config").then((m) => m.drawerConfig),
  },
  checkbox: {
    load: () =>
      import("@/registry/remocn-ui/checkbox").then((m) => ({
        default: m.Checkbox,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/checkbox/config").then(
        (m) => m.checkboxConfig,
      ),
  },
  input: {
    load: () =>
      import("@/registry/remocn-ui/input").then((m) => ({ default: m.Input })),
    loadConfig: () =>
      import("@/registry/remocn-ui/input/config").then((m) => m.inputConfig),
  },
  // blur-in WRAPS a single child, so the customizer Component is the
  // preview-only BlurInPreview wrapper (it supplies a fixed sample card and
  // centers it on a stage); the shipped BlurIn is a pure child-wrapper.
  "blur-in": {
    load: () =>
      import("@/registry/remocn-ui/blur-in/preview").then((m) => ({
        default: m.BlurInPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/blur-in/config").then((m) => m.blurInConfig),
  },
  radio: {
    load: () =>
      import("@/registry/remocn-ui/radio").then((m) => ({ default: m.Radio })),
    loadConfig: () =>
      import("@/registry/remocn-ui/radio/config").then((m) => m.radioConfig),
  },
  switch: {
    load: () =>
      import("@/registry/remocn-ui/switch").then((m) => ({
        default: m.Switch,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/switch/config").then((m) => m.switchConfig),
  },
  select: {
    load: () =>
      import("@/registry/remocn-ui/select").then((m) => ({
        default: m.Select,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/select/config").then((m) => m.selectConfig),
  },
  "select-item": {
    load: () =>
      import("@/registry/remocn-ui/select-item").then((m) => ({
        default: m.SelectItem,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/select-item/config").then(
        (m) => m.selectItemConfig,
      ),
  },
  "select-menu": {
    load: () =>
      import("@/registry/remocn-ui/select-menu").then((m) => ({
        default: m.SelectMenu,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/select-menu/config").then(
        (m) => m.selectMenuConfig,
      ),
  },
  "dropdown-menu": {
    load: () =>
      import("@/registry/remocn-ui/dropdown-menu").then((m) => ({
        default: m.DropdownMenu,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/dropdown-menu/config").then(
        (m) => m.dropdownMenuConfig,
      ),
  },
  "dropdown-menu-item": {
    load: () =>
      import("@/registry/remocn-ui/dropdown-menu-item").then((m) => ({
        default: m.DropdownMenuItem,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/dropdown-menu-item/config").then(
        (m) => m.dropdownMenuItemConfig,
      ),
  },
  tabs: {
    load: () =>
      import("@/registry/remocn-ui/tabs").then((m) => ({ default: m.Tabs })),
    loadConfig: () =>
      import("@/registry/remocn-ui/tabs/config").then((m) => m.tabsConfig),
  },
  // cursor's customizer Component is the preview-only CursorPreview wrapper (it
  // runs a fixed demo path through useCursorPath); the shipped Cursor is pure.
  cursor: {
    load: () =>
      import("@/registry/remocn-ui/cursor/preview").then((m) => ({
        default: m.CursorPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/cursor/config").then((m) => m.cursorConfig),
  },
  // toast's customizer Component is the preview-only ToastPreview wrapper (it
  // centers the toast on a theme-background stage); the shipped Toast is a
  // placement-agnostic card the caller positions.
  toast: {
    load: () =>
      import("@/registry/remocn-ui/toast/preview").then((m) => ({
        default: m.ToastPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/toast/config").then((m) => m.toastConfig),
  },
  "message-bubble": {
    load: () =>
      import("@/registry/remocn-ui/message-bubble/preview").then((m) => ({
        default: m.MessageBubblePreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/message-bubble/config").then(
        (m) => m.messageBubbleConfig,
      ),
  },
  "typing-indicator": {
    load: () =>
      import("@/registry/remocn-ui/typing-indicator/preview").then((m) => ({
        default: m.TypingIndicatorPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/typing-indicator/config").then(
        (m) => m.typingIndicatorConfig,
      ),
  },
  "command-menu-item": {
    load: () =>
      import("@/registry/remocn-ui/command-menu-item").then((m) => ({
        default: m.CommandMenuItem,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/command-menu-item/config").then(
        (m) => m.commandMenuItemConfig,
      ),
  },
  // command-menu needs NO preview wrapper: like dialog it renders an intrinsic
  // inset:0 backdrop + centered panel, so the customizer mounts it directly.
  "command-menu": {
    load: () =>
      import("@/registry/remocn-ui/command-menu").then((m) => ({
        default: m.CommandMenu,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/command-menu/config").then(
        (m) => m.commandMenuConfig,
      ),
  },
  // tooltip's customizer Component is the preview-only TooltipPreview wrapper: a
  // bare bubble has no backdrop and would not center as the composition root.
  tooltip: {
    load: () =>
      import("@/registry/remocn-ui/tooltip/preview").then((m) => ({
        default: m.TooltipPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/tooltip/config").then(
        (m) => m.tooltipConfig,
      ),
  },
  // progress's customizer Component is the preview-only ProgressPreview wrapper:
  // a bare inline bar would sit top-left, so the wrapper centers it on a stage.
  progress: {
    load: () =>
      import("@/registry/remocn-ui/progress/preview").then((m) => ({
        default: m.ProgressPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/progress/config").then(
        (m) => m.progressConfig,
      ),
  },
  // skeleton-block is the shimmer motion atom; its preview centers the bare block
  // on a stage. skeleton is the state atom whose preview supplies demo content +
  // placeholder for the loading↔loaded crossfade.
  "skeleton-block": {
    load: () =>
      import("@/registry/remocn-ui/skeleton-block/preview").then((m) => ({
        default: m.SkeletonBlockPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/skeleton-block/config").then(
        (m) => m.skeletonBlockConfig,
      ),
  },
  skeleton: {
    load: () =>
      import("@/registry/remocn-ui/skeleton/preview").then((m) => ({
        default: m.SkeletonPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/skeleton/config").then(
        (m) => m.skeletonConfig,
      ),
  },
  // slider's customizer Component is the preview-only SliderPreview wrapper: a
  // bare inline bar would sit top-left, so the wrapper centers it on a stage.
  slider: {
    load: () =>
      import("@/registry/remocn-ui/slider/preview").then((m) => ({
        default: m.SliderPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/slider/config").then((m) => m.sliderConfig),
  },
  // combobox registers RAW (no preview wrapper): like select it paints its own
  // opaque inset:0 wrapper, so the customizer mounts it directly and it centers.
  combobox: {
    load: () =>
      import("@/registry/remocn-ui/combobox").then((m) => ({
        default: m.Combobox,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/combobox/config").then(
        (m) => m.comboboxConfig,
      ),
  },
  // popover's customizer Component is the preview-only PopoverPreview wrapper: a
  // bare card has no backdrop and would not center as the composition root.
  popover: {
    load: () =>
      import("@/registry/remocn-ui/popover/preview").then((m) => ({
        default: m.PopoverPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/popover/config").then(
        (m) => m.popoverConfig,
      ),
  },
  // context-menu's customizer Component is the preview-only ContextMenuPreview
  // wrapper: a bare panel (transparent, caller-positioned) would sit top-left,
  // so the wrapper centers it on a stage.
  "context-menu": {
    load: () =>
      import("@/registry/remocn-ui/context-menu/preview").then((m) => ({
        default: m.ContextMenuPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/context-menu/config").then(
        (m) => m.contextMenuConfig,
      ),
  },
  // toggle-group registers RAW (no preview wrapper): like tabs it paints its own
  // opaque inset:0 centered stage, so the customizer mounts it directly.
  "toggle-group": {
    load: () =>
      import("@/registry/remocn-ui/toggle-group").then((m) => ({
        default: m.ToggleGroup,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/toggle-group/config").then(
        (m) => m.toggleGroupConfig,
      ),
  },
  // stepper's customizer Component is the preview-only StepperPreview wrapper: a
  // bare wide horizontal element would sit top-left, so the wrapper centers it.
  stepper: {
    load: () =>
      import("@/registry/remocn-ui/stepper/preview").then((m) => ({
        default: m.StepperPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/stepper/config").then(
        (m) => m.stepperConfig,
      ),
  },
  // resizable registers RAW (no preview wrapper): its index.tsx already paints
  // an opaque inset:0 stage that centers the fixed-size bordered box, like tabs.
  resizable: {
    load: () =>
      import("@/registry/remocn-ui/resizable").then((m) => ({
        default: m.Resizable,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/resizable/config").then(
        (m) => m.resizableConfig,
      ),
  },
  spinner: {
    load: () =>
      import("@/registry/remocn-ui/spinner").then((m) => ({
        default: m.Spinner,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/spinner/config").then(
        (m) => m.spinnerConfig,
      ),
  },
  caret: {
    load: () =>
      import("@/registry/remocn-ui/caret/preview").then((m) => ({
        default: m.CaretPreview,
      })),
    loadConfig: () =>
      import("@/registry/remocn-ui/caret/config").then((m) => m.caretConfig),
  },
  "ascii-dissolve": {
    load: () =>
      import("@/components/docs/examples/ascii-dissolve-example").then((m) => ({
        default: m.AsciiDissolveExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ascii-dissolve/config").then(
        (m) => m.asciiDissolveConfig,
      ),
  },
  "caret-wipe": {
    load: () =>
      import("@/components/docs/examples/caret-wipe-example").then((m) => ({
        default: m.CaretWipeExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caret-wipe/config").then(
        (m) => m.caretWipeConfig,
      ),
  },
  "icon-scatter": {
    load: () =>
      import("@/components/docs/examples/icon-scatter-example").then((m) => ({
        default: m.IconScatterExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/icon-scatter/config").then(
        (m) => m.iconScatterConfig,
      ),
  },
  "shader-caustics": {
    load: () =>
      import("@/registry/remocn/shader-caustics").then((m) => ({
        default: m.ShaderCaustics,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-caustics/config").then(
        (m) => m.shaderCausticsConfig,
      ),
  },
  "shader-gem-smoke": {
    load: () =>
      import("@/registry/remocn/shader-gem-smoke").then((m) => ({
        default: m.ShaderGemSmoke,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-gem-smoke/config").then(
        (m) => m.shaderGemSmokeConfig,
      ),
  },
  "shader-strata": {
    load: () =>
      import("@/registry/remocn/shader-strata").then((m) => ({
        default: m.ShaderStrata,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-strata/config").then(
        (m) => m.shaderStrataConfig,
      ),
  },
  "shader-weave": {
    load: () =>
      import("@/registry/remocn/shader-weave").then((m) => ({
        default: m.ShaderWeave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shader-weave/config").then(
        (m) => m.shaderWeaveConfig,
      ),
  },
  reel: {
    load: () =>
      import("@/components/docs/examples/reel-example").then((m) => ({
        default: m.ReelExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/reel/config").then((m) => m.reelConfig),
  },
  "caption-karaoke": {
    load: () =>
      import("@/components/docs/examples/caption-karaoke-example").then(
        (m) => ({
          default: m.CaptionKaraokeExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-karaoke/config").then(
        (m) => m.captionKaraokeConfig,
      ),
  },
  "caption-highlight-box": {
    load: () =>
      import("@/components/docs/examples/caption-highlight-box-example").then(
        (m) => ({
          default: m.CaptionHighlightBoxExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-highlight-box/config").then(
        (m) => m.captionHighlightBoxConfig,
      ),
  },
  "caption-active-pop": {
    load: () =>
      import("@/components/docs/examples/caption-active-pop-example").then(
        (m) => ({
          default: m.CaptionActivePopExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-active-pop/config").then(
        (m) => m.captionActivePopConfig,
      ),
  },
  "caption-word-pop": {
    load: () =>
      import("@/components/docs/examples/caption-word-pop-example").then(
        (m) => ({
          default: m.CaptionWordPopExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-word-pop/config").then(
        (m) => m.captionWordPopConfig,
      ),
  },
  "caption-bounce-in": {
    load: () =>
      import("@/components/docs/examples/caption-bounce-in-example").then(
        (m) => ({
          default: m.CaptionBounceInExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-bounce-in/config").then(
        (m) => m.captionBounceInConfig,
      ),
  },
  "caption-blur-in": {
    load: () =>
      import("@/components/docs/examples/caption-blur-in-example").then(
        (m) => ({
          default: m.CaptionBlurInExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-blur-in/config").then(
        (m) => m.captionBlurInConfig,
      ),
  },
  "caption-rise": {
    load: () =>
      import("@/components/docs/examples/caption-rise-example").then((m) => ({
        default: m.CaptionRiseExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-rise/config").then(
        (m) => m.captionRiseConfig,
      ),
  },
  "caption-typewriter": {
    load: () =>
      import("@/components/docs/examples/caption-typewriter-example").then(
        (m) => ({
          default: m.CaptionTypewriterExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-typewriter/config").then(
        (m) => m.captionTypewriterConfig,
      ),
  },
  "caption-slot": {
    load: () =>
      import("@/components/docs/examples/caption-slot-example").then((m) => ({
        default: m.CaptionSlotExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-slot/config").then(
        (m) => m.captionSlotConfig,
      ),
  },
  "caption-subtitle": {
    load: () =>
      import("@/components/docs/examples/caption-subtitle-example").then(
        (m) => ({
          default: m.CaptionSubtitleExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-subtitle/config").then(
        (m) => m.captionSubtitleConfig,
      ),
  },
  "caption-dim-progress": {
    load: () =>
      import("@/components/docs/examples/caption-dim-progress-example").then(
        (m) => ({
          default: m.CaptionDimProgressExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-dim-progress/config").then(
        (m) => m.captionDimProgressConfig,
      ),
  },
  "caption-underline": {
    load: () =>
      import("@/components/docs/examples/caption-underline-example").then(
        (m) => ({
          default: m.CaptionUnderlineExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-underline/config").then(
        (m) => m.captionUnderlineConfig,
      ),
  },
  "caption-scramble": {
    load: () =>
      import("@/components/docs/examples/caption-scramble-example").then(
        (m) => ({
          default: m.CaptionScrambleExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-scramble/config").then(
        (m) => m.captionScrambleConfig,
      ),
  },
  "caption-weight": {
    load: () =>
      import("@/components/docs/examples/caption-weight-example").then((m) => ({
        default: m.CaptionWeightExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-weight/config").then(
        (m) => m.captionWeightConfig,
      ),
  },
  "caption-emoji": {
    load: () =>
      import("@/components/docs/examples/caption-emoji-example").then((m) => ({
        default: m.CaptionEmojiExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-emoji/config").then(
        (m) => m.captionEmojiConfig,
      ),
  },
  "caption-speaker": {
    load: () =>
      import("@/components/docs/examples/caption-speaker-example").then(
        (m) => ({
          default: m.CaptionSpeakerExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-speaker/config").then(
        (m) => m.captionSpeakerConfig,
      ),
  },
  "caption-stack": {
    load: () =>
      import("@/components/docs/examples/caption-stack-example").then((m) => ({
        default: m.CaptionStackExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-stack/config").then(
        (m) => m.captionStackConfig,
      ),
  },
  "caption-outline": {
    load: () =>
      import("@/components/docs/examples/caption-outline-example").then(
        (m) => ({
          default: m.CaptionOutlineExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-outline/config").then(
        (m) => m.captionOutlineConfig,
      ),
  },
  "caption-marker": {
    load: () =>
      import("@/components/docs/examples/caption-marker-example").then((m) => ({
        default: m.CaptionMarkerExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-marker/config").then(
        (m) => m.captionMarkerConfig,
      ),
  },
  "caption-stamp": {
    load: () =>
      import("@/components/docs/examples/caption-stamp-example").then((m) => ({
        default: m.CaptionStampExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-stamp/config").then(
        (m) => m.captionStampConfig,
      ),
  },
  "caption-handwrite": {
    load: () =>
      import("@/components/docs/examples/caption-handwrite-example").then(
        (m) => ({
          default: m.CaptionHandwriteExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-handwrite/config").then(
        (m) => m.captionHandwriteConfig,
      ),
  },
  "caption-redact": {
    load: () =>
      import("@/components/docs/examples/caption-redact-example").then((m) => ({
        default: m.CaptionRedactExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-redact/config").then(
        (m) => m.captionRedactConfig,
      ),
  },
  "caption-prosody": {
    load: () =>
      import("@/components/docs/examples/caption-prosody-example").then(
        (m) => ({
          default: m.CaptionProsodyExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-prosody/config").then(
        (m) => m.captionProsodyConfig,
      ),
  },
  "caption-timeline": {
    load: () =>
      import("@/components/docs/examples/caption-timeline-example").then(
        (m) => ({
          default: m.CaptionTimelineExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-timeline/config").then(
        (m) => m.captionTimelineConfig,
      ),
  },
  "caption-teleprompter": {
    load: () =>
      import("@/components/docs/examples/caption-teleprompter-example").then(
        (m) => ({
          default: m.CaptionTeleprompterExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-teleprompter/config").then(
        (m) => m.captionTeleprompterConfig,
      ),
  },
  "caption-knockout": {
    load: () =>
      import("@/components/docs/examples/caption-knockout-example").then(
        (m) => ({
          default: m.CaptionKnockoutExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-knockout/config").then(
        (m) => m.captionKnockoutConfig,
      ),
  },
  "caption-slice": {
    load: () =>
      import("@/components/docs/examples/caption-slice-example").then((m) => ({
        default: m.CaptionSliceExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-slice/config").then(
        (m) => m.captionSliceConfig,
      ),
  },
  "caption-cube": {
    load: () =>
      import("@/components/docs/examples/caption-cube-example").then((m) => ({
        default: m.CaptionCubeExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-cube/config").then(
        (m) => m.captionCubeConfig,
      ),
  },
  "caption-split-flap": {
    load: () =>
      import("@/components/docs/examples/caption-split-flap-example").then(
        (m) => ({
          default: m.CaptionSplitFlapExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-split-flap/config").then(
        (m) => m.captionSplitFlapConfig,
      ),
  },
  "caption-label-maker": {
    load: () =>
      import("@/components/docs/examples/caption-label-maker-example").then(
        (m) => ({
          default: m.CaptionLabelMakerExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/caption-label-maker/config").then(
        (m) => m.captionLabelMakerConfig,
      ),
  },
  "caption-drop": {
    load: () =>
      import("@/components/docs/examples/caption-drop-example").then((m) => ({
        default: m.CaptionDropExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caption-drop/config").then(
        (m) => m.captionDropConfig,
      ),
  },
  "iris-wipe": {
    load: () =>
      import("@/components/docs/examples/iris-wipe-example").then((m) => ({
        default: m.IrisWipeExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/iris-wipe/config").then(
        (m) => m.irisWipeConfig,
      ),
  },
  "venetian-blinds": {
    load: () =>
      import("@/components/docs/examples/venetian-blinds-example").then(
        (m) => ({
          default: m.VenetianBlindsExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/venetian-blinds/config").then(
        (m) => m.venetianBlindsConfig,
      ),
  },
  "paper-tear": {
    load: () =>
      import("@/components/docs/examples/paper-tear-example").then((m) => ({
        default: m.PaperTearExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/paper-tear/config").then(
        (m) => m.paperTearConfig,
      ),
  },
  "pixel-sort": {
    load: () =>
      import("@/components/docs/examples/pixel-sort-example").then((m) => ({
        default: m.PixelSortExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pixel-sort/config").then(
        (m) => m.pixelSortConfig,
      ),
  },
  "light-leak": {
    load: () =>
      import("@/components/docs/examples/light-leak-example").then((m) => ({
        default: m.LightLeakExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/light-leak/config").then(
        (m) => m.lightLeakConfig,
      ),
  },
  hyperspace: {
    load: () =>
      import("@/components/docs/examples/hyperspace-example").then((m) => ({
        default: m.HyperspaceExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hyperspace/config").then(
        (m) => m.hyperspaceConfig,
      ),
  },
  "orbit-lock": {
    load: () =>
      import("@/components/docs/examples/orbit-lock-example").then((m) => ({
        default: m.OrbitLockExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/orbit-lock/config").then(
        (m) => m.orbitLockConfig,
      ),
  },
  "puzzle-snap": {
    load: () =>
      import("@/components/docs/examples/puzzle-snap-example").then((m) => ({
        default: m.PuzzleSnapExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/puzzle-snap/config").then(
        (m) => m.puzzleSnapConfig,
      ),
  },
  spotlight: {
    load: () =>
      import("@/components/docs/examples/spotlight-example").then((m) => ({
        default: m.SpotlightExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spotlight/config").then(
        (m) => m.spotlightConfig,
      ),
  },
  "neon-sign": {
    load: () =>
      import("@/registry/remocn/neon-sign").then((m) => ({
        default: m.NeonSign,
      })),
    loadConfig: () =>
      import("@/registry/remocn/neon-sign/config").then(
        (m) => m.neonSignConfig,
      ),
  },
  inflate: {
    load: () =>
      import("@/components/docs/examples/inflate-example").then((m) => ({
        default: m.InflateExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/inflate/config").then((m) => m.inflateConfig),
  },
  "liquid-fill": {
    load: () =>
      import("@/components/docs/examples/liquid-fill-example").then((m) => ({
        default: m.LiquidFillExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/liquid-fill/config").then(
        (m) => m.liquidFillConfig,
      ),
  },
  "accordion-unfold": {
    load: () =>
      import("@/components/docs/examples/accordion-unfold-example").then(
        (m) => ({
          default: m.AccordionUnfoldExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/accordion-unfold/config").then(
        (m) => m.accordionUnfoldConfig,
      ),
  },
  "anamorphic-flare": {
    load: () =>
      import("@/components/docs/examples/anamorphic-flare-example").then(
        (m) => ({
          default: m.AnamorphicFlareExampleScene,
        }),
      ),
    loadConfig: () =>
      import("@/registry/remocn/anamorphic-flare/config").then(
        (m) => m.anamorphicFlareConfig,
      ),
  },
  "pendulum-wave": {
    load: () =>
      import("@/registry/remocn/pendulum-wave").then((m) => ({
        default: m.PendulumWave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pendulum-wave/config").then(
        (m) => m.pendulumWaveConfig,
      ),
  },
  "flow-field": {
    load: () =>
      import("@/registry/remocn/flow-field").then((m) => ({
        default: m.FlowField,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flow-field/config").then(
        (m) => m.flowFieldConfig,
      ),
  },
  "isometric-build": {
    load: () =>
      import("@/registry/remocn/isometric-build").then((m) => ({
        default: m.IsometricBuild,
      })),
    loadConfig: () =>
      import("@/registry/remocn/isometric-build/config").then(
        (m) => m.isometricBuildConfig,
      ),
  },
  "life-grid": {
    load: () =>
      import("@/registry/remocn/life-grid").then((m) => ({
        default: m.LifeGrid,
      })),
    loadConfig: () =>
      import("@/registry/remocn/life-grid/config").then(
        (m) => m.lifeGridConfig,
      ),
  },
  "string-art": {
    load: () =>
      import("@/registry/remocn/string-art").then((m) => ({
        default: m.StringArt,
      })),
    loadConfig: () =>
      import("@/registry/remocn/string-art/config").then(
        (m) => m.stringArtConfig,
      ),
  },
  "topo-lines": {
    load: () =>
      import("@/registry/remocn/topo-lines").then((m) => ({
        default: m.TopoLines,
      })),
    loadConfig: () =>
      import("@/registry/remocn/topo-lines/config").then(
        (m) => m.topoLinesConfig,
      ),
  },
  phyllotaxis: {
    load: () =>
      import("@/registry/remocn/phyllotaxis").then((m) => ({
        default: m.Phyllotaxis,
      })),
    loadConfig: () =>
      import("@/registry/remocn/phyllotaxis/config").then(
        (m) => m.phyllotaxisConfig,
      ),
  },
  "parallax-depth": {
    load: () =>
      import("@/components/docs/examples/parallax-depth-example").then((m) => ({
        default: m.ParallaxDepthExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/parallax-depth/config").then(
        (m) => m.parallaxDepthConfig,
      ),
  },
  "dolly-zoom": {
    load: () =>
      import("@/components/docs/examples/dolly-zoom-example").then((m) => ({
        default: m.DollyZoomExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dolly-zoom/config").then(
        (m) => m.dollyZoomConfig,
      ),
  },
  turntable: {
    load: () =>
      import("@/components/docs/examples/turntable-example").then((m) => ({
        default: m.TurntableExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/turntable/config").then(
        (m) => m.turntableConfig,
      ),
  },
  "tiny-planet": {
    load: () =>
      import("@/components/docs/examples/tiny-planet-example").then((m) => ({
        default: m.TinyPlanetExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tiny-planet/config").then(
        (m) => m.tinyPlanetConfig,
      ),
  },
  "exploded-view": {
    load: () =>
      import("@/components/docs/examples/exploded-view-example").then((m) => ({
        default: m.ExplodedViewExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/exploded-view/config").then(
        (m) => m.explodedViewConfig,
      ),
  },
  "gravity-pile": {
    load: () =>
      import("@/components/docs/examples/gravity-pile-example").then((m) => ({
        default: m.GravityPileExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/gravity-pile/config").then(
        (m) => m.gravityPileConfig,
      ),
  },
  "cloth-reveal": {
    load: () =>
      import("@/components/docs/examples/cloth-reveal-example").then((m) => ({
        default: m.ClothRevealExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cloth-reveal/config").then(
        (m) => m.clothRevealConfig,
      ),
  },
  "impact-shake": {
    load: () =>
      import("@/components/docs/examples/impact-shake-example").then((m) => ({
        default: m.ImpactShakeExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/impact-shake/config").then(
        (m) => m.impactShakeConfig,
      ),
  },
  "riso-print": {
    load: () =>
      import("@/components/docs/examples/riso-print-example").then((m) => ({
        default: m.RisoPrintExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/riso-print/config").then(
        (m) => m.risoPrintConfig,
      ),
  },
  "line-boil": {
    load: () =>
      import("@/components/docs/examples/line-boil-example").then((m) => ({
        default: m.LineBoilExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/line-boil/config").then(
        (m) => m.lineBoilConfig,
      ),
  },
  blueprint: {
    load: () =>
      import("@/registry/remocn/blueprint").then((m) => ({
        default: m.Blueprint,
      })),
    loadConfig: () =>
      import("@/registry/remocn/blueprint/config").then(
        (m) => m.blueprintConfig,
      ),
  },
  "duotone-beat": {
    load: () =>
      import("@/registry/remocn/duotone-beat").then((m) => ({
        default: m.DuotoneBeat,
      })),
    loadConfig: () =>
      import("@/registry/remocn/duotone-beat/config").then(
        (m) => m.duotoneBeatConfig,
      ),
  },
  "comic-panels": {
    load: () =>
      import("@/components/docs/examples/comic-panels-example").then((m) => ({
        default: m.ComicPanelsExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/comic-panels/config").then(
        (m) => m.comicPanelsConfig,
      ),
  },
  "long-shadow": {
    load: () =>
      import("@/registry/remocn/long-shadow").then((m) => ({
        default: m.LongShadow,
      })),
    loadConfig: () =>
      import("@/registry/remocn/long-shadow/config").then(
        (m) => m.longShadowConfig,
      ),
  },
  synthwave: {
    load: () =>
      import("@/components/docs/examples/synthwave-example").then((m) => ({
        default: m.SynthwaveExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/synthwave/config").then(
        (m) => m.synthwaveConfig,
      ),
  },
  "brick-mosaic": {
    load: () =>
      import("@/registry/remocn/brick-mosaic").then((m) => ({
        default: m.BrickMosaic,
      })),
    loadConfig: () =>
      import("@/registry/remocn/brick-mosaic/config").then(
        (m) => m.brickMosaicConfig,
      ),
  },
  "x-ray-scan": {
    load: () =>
      import("@/components/docs/examples/x-ray-scan-example").then((m) => ({
        default: m.XRayScanExampleScene,
      })),
    loadConfig: () =>
      import("@/registry/remocn/x-ray-scan/config").then(
        (m) => m.xRayScanConfig,
      ),
  },
  "toolbar-unfurl": {
    load: () =>
      import("@/registry/remocn/toolbar-unfurl").then((m) => ({
        default: m.ToolbarUnfurl,
      })),
    loadConfig: () =>
      import("@/registry/remocn/toolbar-unfurl/config").then(
        (m) => m.toolbarUnfurlConfig,
      ),
  },
  "glyph-relay": {
    load: () =>
      import("@/registry/remocn/glyph-relay").then((m) => ({
        default: m.GlyphRelay,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glyph-relay/config").then(
        (m) => m.glyphRelayConfig,
      ),
  },
  "press-warp-dive": {
    load: () =>
      import("@/registry/remocn/press-warp-dive").then((m) => ({
        default: m.PressWarpDiveDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/press-warp-dive/config").then(
        (m) => m.pressWarpDiveConfig,
      ),
  },
  "giant-mark-backdrop": {
    load: () =>
      import("@/registry/remocn/giant-mark-backdrop").then((m) => ({
        default: m.GiantMarkBackdrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/giant-mark-backdrop/config").then(
        (m) => m.giantMarkBackdropConfig,
      ),
  },
  "macro-tab-name": {
    load: () =>
      import("@/registry/remocn/macro-tab-name").then((m) => ({
        default: m.MacroTabName,
      })),
    loadConfig: () =>
      import("@/registry/remocn/macro-tab-name/config").then(
        (m) => m.macroTabNameConfig,
      ),
  },
  "cta-collapse-mark": {
    load: () =>
      import("@/registry/remocn/cta-collapse-mark").then((m) => ({
        default: m.CtaCollapseMark,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cta-collapse-mark/config").then(
        (m) => m.ctaCollapseMarkConfig,
      ),
  },
  "node-trail": {
    load: () =>
      import("@/registry/remocn/node-trail").then((m) => ({
        default: m.NodeTrail,
      })),
    loadConfig: () =>
      import("@/registry/remocn/node-trail/config").then(
        (m) => m.nodeTrailConfig,
      ),
  },
  "graph-relayout": {
    load: () =>
      import("@/registry/remocn/graph-relayout").then((m) => ({
        default: m.GraphRelayout,
      })),
    loadConfig: () =>
      import("@/registry/remocn/graph-relayout/config").then(
        (m) => m.graphRelayoutConfig,
      ),
  },
  "letter-gate": {
    load: () =>
      import("@/registry/remocn/letter-gate").then((m) => ({
        default: m.LetterGateDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/letter-gate/config").then(
        (m) => m.letterGateConfig,
      ),
  },
  "device-grows-around": {
    load: () =>
      import("@/registry/remocn/device-grows-around").then((m) => ({
        default: m.DeviceGrowsAround,
      })),
    loadConfig: () =>
      import("@/registry/remocn/device-grows-around/config").then(
        (m) => m.deviceGrowsAroundConfig,
      ),
  },
  "send-fountain": {
    load: () =>
      import("@/registry/remocn/send-fountain").then((m) => ({
        default: m.SendFountain,
      })),
    loadConfig: () =>
      import("@/registry/remocn/send-fountain/config").then(
        (m) => m.sendFountainConfig,
      ),
  },
  "glow-born-card": {
    load: () =>
      import("@/registry/remocn/glow-born-card").then((m) => ({
        default: m.GlowBornCard,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glow-born-card/config").then(
        (m) => m.glowBornCardConfig,
      ),
  },
  "multi-file-drop": {
    load: () =>
      import("@/registry/remocn/multi-file-drop").then((m) => ({
        default: m.MultiFileDrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/multi-file-drop/config").then(
        (m) => m.multiFileDropConfig,
      ),
  },
  "rim-draw-card": {
    load: () =>
      import("@/registry/remocn/rim-draw-card").then((m) => ({
        default: m.RimDrawCard,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rim-draw-card/config").then(
        (m) => m.rimDrawCardConfig,
      ),
  },
  "heat-drain-reveal": {
    load: () =>
      import("@/registry/remocn/heat-drain-reveal").then((m) => ({
        default: m.HeatDrainReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/heat-drain-reveal/config").then(
        (m) => m.heatDrainRevealConfig,
      ),
  },
  "tile-snake-loader": {
    load: () =>
      import("@/registry/remocn/tile-snake-loader").then((m) => ({
        default: m.TileSnakeLoader,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tile-snake-loader/config").then(
        (m) => m.tileSnakeLoaderConfig,
      ),
  },
  "photo-caret": {
    load: () =>
      import("@/registry/remocn/photo-caret").then((m) => ({
        default: m.PhotoCaret,
      })),
    loadConfig: () =>
      import("@/registry/remocn/photo-caret/config").then(
        (m) => m.photoCaretConfig,
      ),
  },
  "flank-roll-swap": {
    load: () =>
      import("@/registry/remocn/flank-roll-swap").then((m) => ({
        default: m.FlankRollSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flank-roll-swap/config").then(
        (m) => m.flankRollSwapConfig,
      ),
  },
  "light-burn-to-line": {
    load: () =>
      import("@/registry/remocn/light-burn-to-line").then((m) => ({
        default: m.LightBurnToLineDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/light-burn-to-line/config").then(
        (m) => m.lightBurnToLineConfig,
      ),
  },
  "hot-slab-morph": {
    load: () =>
      import("@/registry/remocn/hot-slab-morph").then((m) => ({
        default: m.HotSlabMorphDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hot-slab-morph/config").then(
        (m) => m.hotSlabMorphConfig,
      ),
  },
  "noise-forge-sting": {
    load: () =>
      import("@/registry/remocn/noise-forge-sting").then((m) => ({
        default: m.NoiseForgeSting,
      })),
    loadConfig: () =>
      import("@/registry/remocn/noise-forge-sting/config").then(
        (m) => m.noiseForgeStingConfig,
      ),
  },
  "glyph-block-decode": {
    load: () =>
      import("@/registry/remocn/glyph-block-decode").then((m) => ({
        default: m.GlyphBlockDecode,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glyph-block-decode/config").then(
        (m) => m.glyphBlockDecodeConfig,
      ),
  },
  "word-burst-cards": {
    load: () =>
      import("@/registry/remocn/word-burst-cards").then((m) => ({
        default: m.WordBurstCards,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-burst-cards/config").then(
        (m) => m.wordBurstCardsConfig,
      ),
  },
  "cooling-type": {
    load: () =>
      import("@/registry/remocn/cooling-type").then((m) => ({
        default: m.CoolingType,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cooling-type/config").then(
        (m) => m.coolingTypeConfig,
      ),
  },
  "focus-front-swap": {
    load: () =>
      import("@/registry/remocn/focus-front-swap").then((m) => ({
        default: m.FocusFrontSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/focus-front-swap/config").then(
        (m) => m.focusFrontSwapConfig,
      ),
  },
  "macro-letter-pan": {
    load: () =>
      import("@/registry/remocn/macro-letter-pan").then((m) => ({
        default: m.MacroLetterPan,
      })),
    loadConfig: () =>
      import("@/registry/remocn/macro-letter-pan/config").then(
        (m) => m.macroLetterPanConfig,
      ),
  },
  "focus-pan-text": {
    load: () =>
      import("@/registry/remocn/focus-pan-text").then((m) => ({
        default: m.FocusPanText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/focus-pan-text/config").then(
        (m) => m.focusPanTextConfig,
      ),
  },
  "card-swipe-cover": {
    load: () =>
      import("@/registry/remocn/card-swipe-cover").then((m) => ({
        default: m.CardSwipeCoverDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/card-swipe-cover/config").then(
        (m) => m.cardSwipeCoverConfig,
      ),
  },
  "caret-collapse": {
    load: () =>
      import("@/registry/remocn/caret-collapse").then((m) => ({
        default: m.CaretCollapseDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caret-collapse/config").then(
        (m) => m.caretCollapseConfig,
      ),
  },
  "bloom-ring": {
    load: () =>
      import("@/registry/remocn/bloom-ring").then((m) => ({
        default: m.BloomRingDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bloom-ring/config").then(
        (m) => m.bloomRingConfig,
      ),
  },
  "beam-sweep": {
    load: () =>
      import("@/registry/remocn/beam-sweep").then((m) => ({
        default: m.BeamSweepDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/beam-sweep/config").then(
        (m) => m.beamSweepConfig,
      ),
  },
  "disc-pop": {
    load: () =>
      import("@/registry/remocn/disc-pop").then((m) => ({
        default: m.DiscPopDemo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/disc-pop/config").then((m) => m.discPopConfig),
  },
  "strobe-montage": {
    load: () =>
      import("@/registry/remocn/strobe-montage").then((m) => ({
        default: m.StrobeMontage,
      })),
    loadConfig: () =>
      import("@/registry/remocn/strobe-montage/config").then(
        (m) => m.strobeMontageConfig,
      ),
  },
  "band-open": {
    load: () =>
      import("@/registry/remocn/band-open").then((m) => ({
        default: m.BandOpen,
      })),
    loadConfig: () =>
      import("@/registry/remocn/band-open/config").then(
        (m) => m.bandOpenConfig,
      ),
  },
  "headline-to-line": {
    load: () =>
      import("@/registry/remocn/headline-to-line").then((m) => ({
        default: m.HeadlineToLine,
      })),
    loadConfig: () =>
      import("@/registry/remocn/headline-to-line/config").then(
        (m) => m.headlineToLineConfig,
      ),
  },
  "word-gap-media": {
    load: () =>
      import("@/registry/remocn/word-gap-media").then((m) => ({
        default: m.WordGapMedia,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-gap-media/config").then(
        (m) => m.wordGapMediaConfig,
      ),
  },
  "caret-dolly": {
    load: () =>
      import("@/registry/remocn/caret-dolly").then((m) => ({
        default: m.CaretDolly,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caret-dolly/config").then(
        (m) => m.caretDollyConfig,
      ),
  },
  "card-push-line": {
    load: () =>
      import("@/registry/remocn/card-push-line").then((m) => ({
        default: m.CardPushLine,
      })),
    loadConfig: () =>
      import("@/registry/remocn/card-push-line/config").then(
        (m) => m.cardPushLineConfig,
      ),
  },
  "phrase-list-bridge": {
    load: () =>
      import("@/registry/remocn/phrase-list-bridge").then((m) => ({
        default: m.PhraseListBridge,
      })),
    loadConfig: () =>
      import("@/registry/remocn/phrase-list-bridge/config").then(
        (m) => m.phraseListBridgeConfig,
      ),
  },
  "word-pullback": {
    load: () =>
      import("@/registry/remocn/word-pullback").then((m) => ({
        default: m.WordPullback,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-pullback/config").then(
        (m) => m.wordPullbackConfig,
      ),
  },
  "figure-reels": {
    load: () =>
      import("@/registry/remocn/figure-reels").then((m) => ({
        default: m.FigureReels,
      })),
    loadConfig: () =>
      import("@/registry/remocn/figure-reels/config").then(
        (m) => m.figureReelsConfig,
      ),
  },
  "figure-to-label": {
    load: () =>
      import("@/registry/remocn/figure-to-label").then((m) => ({
        default: m.FigureToLabel,
      })),
    loadConfig: () =>
      import("@/registry/remocn/figure-to-label/config").then(
        (m) => m.figureToLabelConfig,
      ),
  },
  "drop-upload": {
    load: () =>
      import("@/registry/remocn/drop-upload").then((m) => ({
        default: m.DropUpload,
      })),
    loadConfig: () =>
      import("@/registry/remocn/drop-upload/config").then(
        (m) => m.dropUploadConfig,
      ),
  },
  "macro-click": {
    load: () =>
      import("@/registry/remocn/macro-click").then((m) => ({
        default: m.MacroClick,
      })),
    loadConfig: () =>
      import("@/registry/remocn/macro-click/config").then(
        (m) => m.macroClickConfig,
      ),
  },
  "calendar-pick": {
    load: () =>
      import("@/registry/remocn/calendar-pick").then((m) => ({
        default: m.CalendarPick,
      })),
    loadConfig: () =>
      import("@/registry/remocn/calendar-pick/config").then(
        (m) => m.calendarPickConfig,
      ),
  },
  "button-to-card": {
    load: () =>
      import("@/registry/remocn/button-to-card").then((m) => ({
        default: m.ButtonToCard,
      })),
    loadConfig: () =>
      import("@/registry/remocn/button-to-card/config").then(
        (m) => m.buttonToCardConfig,
      ),
  },
  "prompt-swell": {
    load: () =>
      import("@/registry/remocn/prompt-swell").then((m) => ({
        default: m.PromptSwell,
      })),
    loadConfig: () =>
      import("@/registry/remocn/prompt-swell/config").then(
        (m) => m.promptSwellConfig,
      ),
  },
  "grid-to-app": {
    load: () =>
      import("@/registry/remocn/grid-to-app").then((m) => ({
        default: m.GridToApp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/grid-to-app/config").then(
        (m) => m.gridToAppConfig,
      ),
  },
  "leaderboard-climb": {
    load: () =>
      import("@/registry/remocn/leaderboard-climb").then((m) => ({
        default: m.LeaderboardClimb,
      })),
    loadConfig: () =>
      import("@/registry/remocn/leaderboard-climb/config").then(
        (m) => m.leaderboardClimbConfig,
      ),
  },
  "phone-trio": {
    load: () =>
      import("@/registry/remocn/phone-trio").then((m) => ({
        default: m.PhoneTrio,
      })),
    loadConfig: () =>
      import("@/registry/remocn/phone-trio/config").then(
        (m) => m.phoneTrioConfig,
      ),
  },
  "photo-halo": {
    load: () =>
      import("@/registry/remocn/photo-halo").then((m) => ({
        default: m.PhotoHalo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/photo-halo/config").then(
        (m) => m.photoHaloConfig,
      ),
  },
  "cover-ring": {
    load: () =>
      import("@/registry/remocn/cover-ring").then((m) => ({
        default: m.CoverRing,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cover-ring/config").then(
        (m) => m.coverRingConfig,
      ),
  },
  "card-fan": {
    load: () =>
      import("@/registry/remocn/card-fan").then((m) => ({
        default: m.CardFan,
      })),
    loadConfig: () =>
      import("@/registry/remocn/card-fan/config").then((m) => m.cardFanConfig),
  },
  "tilt-settle-list": {
    load: () =>
      import("@/registry/remocn/tilt-settle-list").then((m) => ({
        default: m.TiltSettleList,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tilt-settle-list/config").then(
        (m) => m.tiltSettleListConfig,
      ),
  },
  "shards-to-grid": {
    load: () =>
      import("@/registry/remocn/shards-to-grid").then((m) => ({
        default: m.ShardsToGrid,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shards-to-grid/config").then(
        (m) => m.shardsToGridConfig,
      ),
  },
  "stat-rail": {
    load: () =>
      import("@/registry/remocn/stat-rail").then((m) => ({
        default: m.StatRail,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stat-rail/config").then(
        (m) => m.statRailConfig,
      ),
  },
  "panel-split": {
    load: () =>
      import("@/registry/remocn/panel-split").then((m) => ({
        default: m.PanelSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/panel-split/config").then(
        (m) => m.panelSplitConfig,
      ),
  },
  "flood-sting": {
    load: () =>
      import("@/registry/remocn/flood-sting").then((m) => ({
        default: m.FloodSting,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flood-sting/config").then(
        (m) => m.floodStingConfig,
      ),
  },
  "riddle-clues": {
    load: () =>
      import("@/registry/remocn/riddle-clues").then((m) => ({
        default: m.RiddleClues,
      })),
    loadConfig: () =>
      import("@/registry/remocn/riddle-clues/config").then(
        (m) => m.riddleCluesConfig,
      ),
  },
  "coy-denial": {
    load: () =>
      import("@/registry/remocn/coy-denial").then((m) => ({
        default: m.CoyDenial,
      })),
    loadConfig: () =>
      import("@/registry/remocn/coy-denial/config").then(
        (m) => m.coyDenialConfig,
      ),
  },
  "peek-shut": {
    load: () =>
      import("@/registry/remocn/peek-shut").then((m) => ({
        default: m.PeekShut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/peek-shut/config").then(
        (m) => m.peekShutConfig,
      ),
  },
  "no-buts": {
    load: () =>
      import("@/registry/remocn/no-buts").then((m) => ({
        default: m.NoButs,
      })),
    loadConfig: () =>
      import("@/registry/remocn/no-buts/config").then((m) => m.noButsConfig),
  },
  "in-proportion": {
    load: () =>
      import("@/registry/remocn/in-proportion").then((m) => ({
        default: m.InProportion,
      })),
    loadConfig: () =>
      import("@/registry/remocn/in-proportion/config").then(
        (m) => m.inProportionConfig,
      ),
  },
  exactly: {
    load: () =>
      import("@/registry/remocn/exactly").then((m) => ({
        default: m.Exactly,
      })),
    loadConfig: () =>
      import("@/registry/remocn/exactly/config").then((m) => m.exactlyConfig),
  },
  "which-means": {
    load: () =>
      import("@/registry/remocn/which-means").then((m) => ({
        default: m.WhichMeans,
      })),
    loadConfig: () =>
      import("@/registry/remocn/which-means/config").then(
        (m) => m.whichMeansConfig,
      ),
  },
  "chore-fold": {
    load: () =>
      import("@/registry/remocn/chore-fold").then((m) => ({
        default: m.ChoreFold,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chore-fold/config").then(
        (m) => m.choreFoldConfig,
      ),
  },
  "name-gloss": {
    load: () =>
      import("@/registry/remocn/name-gloss").then((m) => ({
        default: m.NameGloss,
      })),
    loadConfig: () =>
      import("@/registry/remocn/name-gloss/config").then(
        (m) => m.nameGlossConfig,
      ),
  },
  "price-page": {
    load: () =>
      import("@/registry/remocn/price-page").then((m) => ({
        default: m.PricePage,
      })),
    loadConfig: () =>
      import("@/registry/remocn/price-page/config").then(
        (m) => m.pricePageConfig,
      ),
  },
  "free-as-in": {
    load: () =>
      import("@/registry/remocn/free-as-in").then((m) => ({
        default: m.FreeAsIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/free-as-in/config").then(
        (m) => m.freeAsInConfig,
      ),
  },
  "the-tab": {
    load: () =>
      import("@/registry/remocn/the-tab").then((m) => ({
        default: m.TheTab,
      })),
    loadConfig: () =>
      import("@/registry/remocn/the-tab/config").then((m) => m.theTabConfig),
  },
  "not-yet": {
    load: () =>
      import("@/registry/remocn/not-yet").then((m) => ({
        default: m.NotYet,
      })),
    loadConfig: () =>
      import("@/registry/remocn/not-yet/config").then((m) => m.notYetConfig),
  },
  "moves-up": {
    load: () =>
      import("@/registry/remocn/moves-up").then((m) => ({
        default: m.MovesUp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/moves-up/config").then((m) => m.movesUpConfig),
  },
  "half-built": {
    load: () =>
      import("@/registry/remocn/half-built").then((m) => ({
        default: m.HalfBuilt,
      })),
    loadConfig: () =>
      import("@/registry/remocn/half-built/config").then(
        (m) => m.halfBuiltConfig,
      ),
  },
  "what-sticks": {
    load: () =>
      import("@/registry/remocn/what-sticks").then((m) => ({
        default: m.WhatSticks,
      })),
    loadConfig: () =>
      import("@/registry/remocn/what-sticks/config").then(
        (m) => m.whatSticksConfig,
      ),
  },
  "tldr-on-top": {
    load: () =>
      import("@/registry/remocn/tldr-on-top").then((m) => ({
        default: m.TldrOnTop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tldr-on-top/config").then(
        (m) => m.tldrOnTopConfig,
      ),
  },
  "factor-out": {
    load: () =>
      import("@/registry/remocn/factor-out").then((m) => ({
        default: m.FactorOut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/factor-out/config").then(
        (m) => m.factorOutConfig,
      ),
  },
  "post-script": {
    load: () =>
      import("@/registry/remocn/post-script").then((m) => ({
        default: m.PostScript,
      })),
    loadConfig: () =>
      import("@/registry/remocn/post-script/config").then(
        (m) => m.postScriptConfig,
      ),
  },
  rsvp: {
    load: () =>
      import("@/registry/remocn/rsvp").then((m) => ({
        default: m.Rsvp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rsvp/config").then((m) => m.rsvpConfig),
  },
  "your-name-here": {
    load: () =>
      import("@/registry/remocn/your-name-here").then((m) => ({
        default: m.YourNameHere,
      })),
    loadConfig: () =>
      import("@/registry/remocn/your-name-here/config").then(
        (m) => m.yourNameHereConfig,
      ),
  },
  verbed: {
    load: () =>
      import("@/registry/remocn/verbed").then((m) => ({
        default: m.Verbed,
      })),
    loadConfig: () =>
      import("@/registry/remocn/verbed/config").then((m) => m.verbedConfig),
  },
  "pitch-blanks": {
    load: () =>
      import("@/registry/remocn/pitch-blanks").then((m) => ({
        default: m.PitchBlanks,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pitch-blanks/config").then(
        (m) => m.pitchBlanksConfig,
      ),
  },
  "we-call-it": {
    load: () =>
      import("@/registry/remocn/we-call-it").then((m) => ({
        default: m.WeCallIt,
      })),
    loadConfig: () =>
      import("@/registry/remocn/we-call-it/config").then(
        (m) => m.weCallItConfig,
      ),
  },
  crunch: {
    load: () =>
      import("@/registry/remocn/crunch").then((m) => ({
        default: m.Crunch,
      })),
    loadConfig: () =>
      import("@/registry/remocn/crunch/config").then((m) => m.crunchConfig),
  },
  overnight: {
    load: () =>
      import("@/registry/remocn/overnight").then((m) => ({
        default: m.Overnight,
      })),
    loadConfig: () =>
      import("@/registry/remocn/overnight/config").then(
        (m) => m.overnightConfig,
      ),
  },
  "story-dip": {
    load: () =>
      import("@/registry/remocn/story-dip").then((m) => ({
        default: m.StoryDip,
      })),
    loadConfig: () =>
      import("@/registry/remocn/story-dip/config").then(
        (m) => m.storyDipConfig,
      ),
  },
  "out-of-context": {
    load: () =>
      import("@/registry/remocn/out-of-context").then((m) => ({
        default: m.OutOfContext,
      })),
    loadConfig: () =>
      import("@/registry/remocn/out-of-context/config").then(
        (m) => m.outOfContextConfig,
      ),
  },
  "answer-first": {
    load: () =>
      import("@/registry/remocn/answer-first").then((m) => ({
        default: m.AnswerFirst,
      })),
    loadConfig: () =>
      import("@/registry/remocn/answer-first/config").then(
        (m) => m.answerFirstConfig,
      ),
  },
  "double-take": {
    load: () =>
      import("@/registry/remocn/double-take").then((m) => ({
        default: m.DoubleTake,
      })),
    loadConfig: () =>
      import("@/registry/remocn/double-take/config").then(
        (m) => m.doubleTakeConfig,
      ),
  },
  turnabout: {
    load: () =>
      import("@/registry/remocn/turnabout").then((m) => ({
        default: m.Turnabout,
      })),
    loadConfig: () =>
      import("@/registry/remocn/turnabout/config").then(
        (m) => m.turnaboutConfig,
      ),
  },
  "run-on": {
    load: () =>
      import("@/registry/remocn/run-on").then((m) => ({
        default: m.RunOn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/run-on/config").then((m) => m.runOnConfig),
  },
  "loop-break": {
    load: () =>
      import("@/registry/remocn/loop-break").then((m) => ({
        default: m.LoopBreak,
      })),
    loadConfig: () =>
      import("@/registry/remocn/loop-break/config").then(
        (m) => m.loopBreakConfig,
      ),
  },
  "crew-of-one": {
    load: () =>
      import("@/registry/remocn/crew-of-one").then((m) => ({
        default: m.CrewOfOne,
      })),
    loadConfig: () =>
      import("@/registry/remocn/crew-of-one/config").then(
        (m) => m.crewOfOneConfig,
      ),
  },
  "they-are-you": {
    load: () =>
      import("@/registry/remocn/they-are-you").then((m) => ({
        default: m.TheyAreYou,
      })),
    loadConfig: () =>
      import("@/registry/remocn/they-are-you/config").then(
        (m) => m.theyAreYouConfig,
      ),
  },
  "and-you": {
    load: () =>
      import("@/registry/remocn/and-you").then((m) => ({
        default: m.AndYou,
      })),
    loadConfig: () =>
      import("@/registry/remocn/and-you/config").then((m) => m.andYouConfig),
  },
  "edit-ripple": {
    load: () =>
      import("@/registry/remocn/edit-ripple").then((m) => ({
        default: m.EditRipple,
      })),
    loadConfig: () =>
      import("@/registry/remocn/edit-ripple/config").then(
        (m) => m.editRippleConfig,
      ),
  },
  "script-cut": {
    load: () =>
      import("@/registry/remocn/script-cut").then((m) => ({
        default: m.ScriptCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/script-cut/config").then(
        (m) => m.scriptCutConfig,
      ),
  },
  "known-terms": {
    load: () =>
      import("@/registry/remocn/known-terms").then((m) => ({
        default: m.KnownTerms,
      })),
    loadConfig: () =>
      import("@/registry/remocn/known-terms/config").then(
        (m) => m.knownTermsConfig,
      ),
  },
  "changed-mind": {
    load: () =>
      import("@/registry/remocn/changed-mind").then((m) => ({
        default: m.ChangedMind,
      })),
    loadConfig: () =>
      import("@/registry/remocn/changed-mind/config").then(
        (m) => m.changedMindConfig,
      ),
  },
  "said-who": {
    load: () =>
      import("@/registry/remocn/said-who").then((m) => ({
        default: m.SaidWho,
      })),
    loadConfig: () =>
      import("@/registry/remocn/said-who/config").then((m) => m.saidWhoConfig),
  },
  overheard: {
    load: () =>
      import("@/registry/remocn/overheard").then((m) => ({
        default: m.Overheard,
      })),
    loadConfig: () =>
      import("@/registry/remocn/overheard/config").then(
        (m) => m.overheardConfig,
      ),
  },
  "baton-word": {
    load: () =>
      import("@/registry/remocn/baton-word").then((m) => ({
        default: m.BatonWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/baton-word/config").then(
        (m) => m.batonWordConfig,
      ),
  },
  "cue-word": {
    load: () =>
      import("@/registry/remocn/cue-word").then((m) => ({
        default: m.CueWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cue-word/config").then((m) => m.cueWordConfig),
  },
  "cut-off": {
    load: () =>
      import("@/registry/remocn/cut-off").then((m) => ({
        default: m.CutOff,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cut-off/config").then((m) => m.cutOffConfig),
  },
  "beta-thanks": {
    load: () =>
      import("@/registry/remocn/beta-thanks").then((m) => ({
        default: m.BetaThanks,
      })),
    loadConfig: () =>
      import("@/registry/remocn/beta-thanks/config").then(
        (m) => m.betaThanksConfig,
      ),
  },
  "embargo-lift": {
    load: () =>
      import("@/registry/remocn/embargo-lift").then((m) => ({
        default: m.EmbargoLift,
      })),
    loadConfig: () =>
      import("@/registry/remocn/embargo-lift/config").then(
        (m) => m.embargoLiftConfig,
      ),
  },
  "plain-license": {
    load: () =>
      import("@/registry/remocn/plain-license").then((m) => ({
        default: m.PlainLicense,
      })),
    loadConfig: () =>
      import("@/registry/remocn/plain-license/config").then(
        (m) => m.plainLicenseConfig,
      ),
  },
  "keep-words": {
    load: () =>
      import("@/registry/remocn/keep-words").then((m) => ({
        default: m.KeepWords,
      })),
    loadConfig: () =>
      import("@/registry/remocn/keep-words/config").then(
        (m) => m.keepWordsConfig,
      ),
  },
  "whole-page": {
    load: () =>
      import("@/registry/remocn/whole-page").then((m) => ({
        default: m.WholePage,
      })),
    loadConfig: () =>
      import("@/registry/remocn/whole-page/config").then(
        (m) => m.wholePageConfig,
      ),
  },
  "fine-print-up": {
    load: () =>
      import("@/registry/remocn/fine-print-up").then((m) => ({
        default: m.FinePrintUp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/fine-print-up/config").then(
        (m) => m.finePrintUpConfig,
      ),
  },
  "looks-like-this": {
    load: () =>
      import("@/registry/remocn/looks-like-this").then((m) => ({
        default: m.LooksLikeThis,
      })),
    loadConfig: () =>
      import("@/registry/remocn/looks-like-this/config").then(
        (m) => m.looksLikeThisConfig,
      ),
  },
  "shot-answers": {
    load: () =>
      import("@/registry/remocn/shot-answers").then((m) => ({
        default: m.ShotAnswers,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shot-answers/config").then(
        (m) => m.shotAnswersConfig,
      ),
  },
  "up-close": {
    load: () =>
      import("@/registry/remocn/up-close").then((m) => ({
        default: m.UpClose,
      })),
    loadConfig: () =>
      import("@/registry/remocn/up-close/config").then((m) => m.upCloseConfig),
  },
  "yes-run": {
    load: () =>
      import("@/registry/remocn/yes-run").then((m) => ({
        default: m.YesRun,
      })),
    loadConfig: () =>
      import("@/registry/remocn/yes-run/config").then((m) => m.yesRunConfig),
  },
  "week-shipped": {
    load: () =>
      import("@/registry/remocn/week-shipped").then((m) => ({
        default: m.WeekShipped,
      })),
    loadConfig: () =>
      import("@/registry/remocn/week-shipped/config").then(
        (m) => m.weekShippedConfig,
      ),
  },
  "a-to-z": {
    load: () =>
      import("@/registry/remocn/a-to-z").then((m) => ({
        default: m.AToZ,
      })),
    loadConfig: () =>
      import("@/registry/remocn/a-to-z/config").then((m) => m.aToZConfig),
  },
  "carry-count": {
    load: () =>
      import("@/registry/remocn/carry-count").then((m) => ({
        default: m.CarryCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/carry-count/config").then(
        (m) => m.carryCountConfig,
      ),
  },
  "chunk-stack": {
    load: () =>
      import("@/registry/remocn/chunk-stack").then((m) => ({
        default: m.ChunkStack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chunk-stack/config").then(
        (m) => m.chunkStackConfig,
      ),
  },
  "spell-out": {
    load: () =>
      import("@/registry/remocn/spell-out").then((m) => ({
        default: m.SpellOut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spell-out/config").then(
        (m) => m.spellOutConfig,
      ),
  },
  "feather-settle": {
    load: () =>
      import("@/registry/remocn/feather-settle").then((m) => ({
        default: m.FeatherSettle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/feather-settle/config").then(
        (m) => m.featherSettleConfig,
      ),
  },
  "churn-count": {
    load: () =>
      import("@/registry/remocn/churn-count").then((m) => ({
        default: m.ChurnCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/churn-count/config").then(
        (m) => m.churnCountConfig,
      ),
  },
  "bug-dock": {
    load: () =>
      import("@/registry/remocn/bug-dock").then((m) => ({
        default: m.BugDock,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bug-dock/config").then((m) => m.bugDockConfig),
  },
  "two-hit": {
    load: () =>
      import("@/registry/remocn/two-hit").then((m) => ({
        default: m.TwoHit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/two-hit/config").then((m) => m.twoHitConfig),
  },
  "absorb-stack": {
    load: () =>
      import("@/registry/remocn/absorb-stack").then((m) => ({
        default: m.AbsorbStack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/absorb-stack/config").then(
        (m) => m.absorbStackConfig,
      ),
  },
  layover: {
    load: () =>
      import("@/registry/remocn/layover").then((m) => ({
        default: m.Layover,
      })),
    loadConfig: () =>
      import("@/registry/remocn/layover/config").then((m) => m.layoverConfig),
  },
  nonstop: {
    load: () =>
      import("@/registry/remocn/nonstop").then((m) => ({
        default: m.Nonstop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/nonstop/config").then((m) => m.nonstopConfig),
  },
  "on-approach": {
    load: () =>
      import("@/registry/remocn/on-approach").then((m) => ({
        default: m.OnApproach,
      })),
    loadConfig: () =>
      import("@/registry/remocn/on-approach/config").then(
        (m) => m.onApproachConfig,
      ),
  },
  "negation-drop": {
    load: () =>
      import("@/registry/remocn/negation-drop").then((m) => ({
        default: m.NegationDrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/negation-drop/config").then(
        (m) => m.negationDropConfig,
      ),
  },
  "weight-cut": {
    load: () =>
      import("@/registry/remocn/weight-cut").then((m) => ({
        default: m.WeightCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/weight-cut/config").then(
        (m) => m.weightCutConfig,
      ),
  },
  "hook-uncurl": {
    load: () =>
      import("@/registry/remocn/hook-uncurl").then((m) => ({
        default: m.HookUncurl,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hook-uncurl/config").then(
        (m) => m.hookUncurlConfig,
      ),
  },
  diminuendo: {
    load: () =>
      import("@/registry/remocn/diminuendo").then((m) => ({
        default: m.Diminuendo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/diminuendo/config").then(
        (m) => m.diminuendoConfig,
      ),
  },
  "core-sum": {
    load: () =>
      import("@/registry/remocn/core-sum").then((m) => ({
        default: m.CoreSum,
      })),
    loadConfig: () =>
      import("@/registry/remocn/core-sum/config").then((m) => m.coreSumConfig),
  },
  "cool-down": {
    load: () =>
      import("@/registry/remocn/cool-down").then((m) => ({
        default: m.CoolDown,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cool-down/config").then(
        (m) => m.coolDownConfig,
      ),
  },
  "idea-set": {
    load: () =>
      import("@/registry/remocn/idea-set").then((m) => ({
        default: m.IdeaSet,
      })),
    loadConfig: () =>
      import("@/registry/remocn/idea-set/config").then((m) => m.ideaSetConfig),
  },
  "row-count": {
    load: () =>
      import("@/registry/remocn/row-count").then((m) => ({
        default: m.RowCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/row-count/config").then(
        (m) => m.rowCountConfig,
      ),
  },
  "spine-turn": {
    load: () =>
      import("@/registry/remocn/spine-turn").then((m) => ({
        default: m.SpineTurn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spine-turn/config").then(
        (m) => m.spineTurnConfig,
      ),
  },
  "packed-count": {
    load: () =>
      import("@/registry/remocn/packed-count").then((m) => ({
        default: m.PackedCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/packed-count/config").then(
        (m) => m.packedCountConfig,
      ),
  },
  "less-more": {
    load: () =>
      import("@/registry/remocn/less-more").then((m) => ({
        default: m.LessMore,
      })),
    loadConfig: () =>
      import("@/registry/remocn/less-more/config").then(
        (m) => m.lessMoreConfig,
      ),
  },
  "times-turn": {
    load: () =>
      import("@/registry/remocn/times-turn").then((m) => ({
        default: m.TimesTurn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/times-turn/config").then(
        (m) => m.timesTurnConfig,
      ),
  },
  "stripe-count": {
    load: () =>
      import("@/registry/remocn/stripe-count").then((m) => ({
        default: m.StripeCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stripe-count/config").then(
        (m) => m.stripeCountConfig,
      ),
  },
  "window-trail": {
    load: () =>
      import("@/registry/remocn/window-trail").then((m) => ({
        default: m.WindowTrail,
      })),
    loadConfig: () =>
      import("@/registry/remocn/window-trail/config").then(
        (m) => m.windowTrailConfig,
      ),
  },
  "fuchidori-count": {
    load: () =>
      import("@/registry/remocn/fuchidori-count").then((m) => ({
        default: m.FuchidoriCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/fuchidori-count/config").then(
        (m) => m.fuchidoriCountConfig,
      ),
  },
  "ruby-press": {
    load: () =>
      import("@/registry/remocn/ruby-press").then((m) => ({
        default: m.RubyPress,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ruby-press/config").then(
        (m) => m.rubyPressConfig,
      ),
  },
  "tategaki-turn": {
    load: () =>
      import("@/registry/remocn/tategaki-turn").then((m) => ({
        default: m.TategakiTurn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tategaki-turn/config").then(
        (m) => m.tategakiTurnConfig,
      ),
  },
  "pitch-over": {
    load: () =>
      import("@/registry/remocn/pitch-over").then((m) => ({
        default: m.PitchOver,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pitch-over/config").then(
        (m) => m.pitchOverConfig,
      ),
  },
  "hot-stage": {
    load: () =>
      import("@/registry/remocn/hot-stage").then((m) => ({
        default: m.HotStage,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hot-stage/config").then(
        (m) => m.hotStageConfig,
      ),
  },
  "first-light": {
    load: () =>
      import("@/registry/remocn/first-light").then((m) => ({
        default: m.FirstLight,
      })),
    loadConfig: () =>
      import("@/registry/remocn/first-light/config").then(
        (m) => m.firstLightConfig,
      ),
  },
  "flash-count": {
    load: () =>
      import("@/registry/remocn/flash-count").then((m) => ({
        default: m.FlashCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flash-count/config").then(
        (m) => m.flashCountConfig,
      ),
  },
  "pull-in": {
    load: () =>
      import("@/registry/remocn/pull-in").then((m) => ({
        default: m.PullIn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pull-in/config").then((m) => m.pullInConfig),
  },
  "gear-shift": {
    load: () =>
      import("@/registry/remocn/gear-shift").then((m) => ({
        default: m.GearShift,
      })),
    loadConfig: () =>
      import("@/registry/remocn/gear-shift/config").then(
        (m) => m.gearShiftConfig,
      ),
  },
  "slide-doors": {
    load: () =>
      import("@/registry/remocn/slide-doors").then((m) => ({
        default: m.SlideDoors,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slide-doors/config").then(
        (m) => m.slideDoorsConfig,
      ),
  },
  "lean-count": {
    load: () =>
      import("@/registry/remocn/lean-count").then((m) => ({
        default: m.LeanCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/lean-count/config").then(
        (m) => m.leanCountConfig,
      ),
  },
  "shed-weight": {
    load: () =>
      import("@/registry/remocn/shed-weight").then((m) => ({
        default: m.ShedWeight,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shed-weight/config").then(
        (m) => m.shedWeightConfig,
      ),
  },
  "serif-rise": {
    load: () =>
      import("@/registry/remocn/serif-rise").then((m) => ({
        default: m.SerifRise,
      })),
    loadConfig: () =>
      import("@/registry/remocn/serif-rise/config").then(
        (m) => m.serifRiseConfig,
      ),
  },
  "module-count": {
    load: () =>
      import("@/registry/remocn/module-count").then((m) => ({
        default: m.ModuleCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/module-count/config").then(
        (m) => m.moduleCountConfig,
      ),
  },
  "roman-edition": {
    load: () =>
      import("@/registry/remocn/roman-edition").then((m) => ({
        default: m.RomanEdition,
      })),
    loadConfig: () =>
      import("@/registry/remocn/roman-edition/config").then(
        (m) => m.romanEditionConfig,
      ),
  },
  "single-stroke": {
    load: () =>
      import("@/registry/remocn/single-stroke").then((m) => ({
        default: m.SingleStroke,
      })),
    loadConfig: () =>
      import("@/registry/remocn/single-stroke/config").then(
        (m) => m.singleStrokeConfig,
      ),
  },
  "slim-count": {
    load: () =>
      import("@/registry/remocn/slim-count").then((m) => ({
        default: m.SlimCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slim-count/config").then(
        (m) => m.slimCountConfig,
      ),
  },
  "squeeze-out": {
    load: () =>
      import("@/registry/remocn/squeeze-out").then((m) => ({
        default: m.SqueezeOut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/squeeze-out/config").then(
        (m) => m.squeezeOutConfig,
      ),
  },
  "edge-fit": {
    load: () =>
      import("@/registry/remocn/edge-fit").then((m) => ({
        default: m.EdgeFit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/edge-fit/config").then((m) => m.edgeFitConfig),
  },
  "smash-count": {
    load: () =>
      import("@/registry/remocn/smash-count").then((m) => ({
        default: m.SmashCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/smash-count/config").then(
        (m) => m.smashCountConfig,
      ),
  },
  "sequel-numeral": {
    load: () =>
      import("@/registry/remocn/sequel-numeral").then((m) => ({
        default: m.SequelNumeral,
      })),
    loadConfig: () =>
      import("@/registry/remocn/sequel-numeral/config").then(
        (m) => m.sequelNumeralConfig,
      ),
  },
  "menu-pick": {
    load: () =>
      import("@/registry/remocn/menu-pick").then((m) => ({
        default: m.MenuPick,
      })),
    loadConfig: () =>
      import("@/registry/remocn/menu-pick/config").then(
        (m) => m.menuPickConfig,
      ),
  },
  "press-stat": {
    load: () =>
      import("@/registry/remocn/press-stat").then((m) => ({
        default: m.PressStat,
      })),
    loadConfig: () =>
      import("@/registry/remocn/press-stat/config").then(
        (m) => m.pressStatConfig,
      ),
  },
  "unmask-line": {
    load: () =>
      import("@/registry/remocn/unmask-line").then((m) => ({
        default: m.UnmaskLine,
      })),
    loadConfig: () =>
      import("@/registry/remocn/unmask-line/config").then(
        (m) => m.unmaskLineConfig,
      ),
  },
  "point-hop": {
    load: () =>
      import("@/registry/remocn/point-hop").then((m) => ({
        default: m.PointHop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/point-hop/config").then(
        (m) => m.pointHopConfig,
      ),
  },
  "mono-settle": {
    load: () =>
      import("@/registry/remocn/mono-settle").then((m) => ({
        default: m.MonoSettle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/mono-settle/config").then(
        (m) => m.monoSettleConfig,
      ),
  },
  "uncomment-line": {
    load: () =>
      import("@/registry/remocn/uncomment-line").then((m) => ({
        default: m.UncommentLine,
      })),
    loadConfig: () =>
      import("@/registry/remocn/uncomment-line/config").then(
        (m) => m.uncommentLineConfig,
      ),
  },
  "enhance-count": {
    load: () =>
      import("@/registry/remocn/enhance-count").then((m) => ({
        default: m.EnhanceCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/enhance-count/config").then(
        (m) => m.enhanceCountConfig,
      ),
  },
  "mono-voice": {
    load: () =>
      import("@/registry/remocn/mono-voice").then((m) => ({
        default: m.MonoVoice,
      })),
    loadConfig: () =>
      import("@/registry/remocn/mono-voice/config").then(
        (m) => m.monoVoiceConfig,
      ),
  },
  "beat-count": {
    load: () =>
      import("@/registry/remocn/beat-count").then((m) => ({
        default: m.BeatCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/beat-count/config").then(
        (m) => m.beatCountConfig,
      ),
  },
  "magnitude-push": {
    load: () =>
      import("@/registry/remocn/magnitude-push").then((m) => ({
        default: m.MagnitudePush,
      })),
    loadConfig: () =>
      import("@/registry/remocn/magnitude-push/config").then(
        (m) => m.magnitudePushConfig,
      ),
  },
  "prompt-restyle": {
    load: () =>
      import("@/registry/remocn/prompt-restyle").then((m) => ({
        default: m.PromptRestyle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/prompt-restyle/config").then(
        (m) => m.promptRestyleConfig,
      ),
  },
  "block-swap": {
    load: () =>
      import("@/registry/remocn/block-swap").then((m) => ({
        default: m.BlockSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/block-swap/config").then(
        (m) => m.blockSwapConfig,
      ),
  },
  "rewrite-bars": {
    load: () =>
      import("@/registry/remocn/rewrite-bars").then((m) => ({
        default: m.RewriteBars,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rewrite-bars/config").then(
        (m) => m.rewriteBarsConfig,
      ),
  },
  "long-vowel": {
    load: () =>
      import("@/registry/remocn/long-vowel").then((m) => ({
        default: m.LongVowel,
      })),
    loadConfig: () =>
      import("@/registry/remocn/long-vowel/config").then(
        (m) => m.longVowelConfig,
      ),
  },
  "compact-stat": {
    load: () =>
      import("@/registry/remocn/compact-stat").then((m) => ({
        default: m.CompactStat,
      })),
    loadConfig: () =>
      import("@/registry/remocn/compact-stat/config").then(
        (m) => m.compactStatConfig,
      ),
  },
  "plus-open": {
    load: () =>
      import("@/registry/remocn/plus-open").then((m) => ({
        default: m.PlusOpen,
      })),
    loadConfig: () =>
      import("@/registry/remocn/plus-open/config").then(
        (m) => m.plusOpenConfig,
      ),
  },
  "res-climb": {
    load: () =>
      import("@/registry/remocn/res-climb").then((m) => ({
        default: m.ResClimb,
      })),
    loadConfig: () =>
      import("@/registry/remocn/res-climb/config").then(
        (m) => m.resClimbConfig,
      ),
  },
  "filler-cut": {
    load: () =>
      import("@/registry/remocn/filler-cut").then((m) => ({
        default: m.FillerCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/filler-cut/config").then(
        (m) => m.fillerCutConfig,
      ),
  },
  "stem-stretch": {
    load: () =>
      import("@/registry/remocn/stem-stretch").then((m) => ({
        default: m.StemStretch,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stem-stretch/config").then(
        (m) => m.stemStretchConfig,
      ),
  },
  "pulse-line": {
    load: () =>
      import("@/registry/remocn/pulse-line").then((m) => ({
        default: m.PulseLine,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pulse-line/config").then(
        (m) => m.pulseLineConfig,
      ),
  },
  "lumen-count": {
    load: () =>
      import("@/registry/remocn/lumen-count").then((m) => ({
        default: m.LumenCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/lumen-count/config").then(
        (m) => m.lumenCountConfig,
      ),
  },
  "width-lock": {
    load: () =>
      import("@/registry/remocn/width-lock").then((m) => ({
        default: m.WidthLock,
      })),
    loadConfig: () =>
      import("@/registry/remocn/width-lock/config").then(
        (m) => m.widthLockConfig,
      ),
  },
  "tall-count": {
    load: () =>
      import("@/registry/remocn/tall-count").then((m) => ({
        default: m.TallCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tall-count/config").then(
        (m) => m.tallCountConfig,
      ),
  },
  "pinned-word": {
    load: () =>
      import("@/registry/remocn/pinned-word").then((m) => ({
        default: m.PinnedWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pinned-word/config").then(
        (m) => m.pinnedWordConfig,
      ),
  },
  "zero-stretch": {
    load: () =>
      import("@/registry/remocn/zero-stretch").then((m) => ({
        default: m.ZeroStretch,
      })),
    loadConfig: () =>
      import("@/registry/remocn/zero-stretch/config").then(
        (m) => m.zeroStretchConfig,
      ),
  },
  "wake-wipe": {
    load: () =>
      import("@/registry/remocn/wake-wipe").then((m) => ({
        default: m.WakeWipe,
      })),
    loadConfig: () =>
      import("@/registry/remocn/wake-wipe/config").then(
        (m) => m.wakeWipeConfig,
      ),
  },
  "comet-headline": {
    load: () =>
      import("@/registry/remocn/comet-headline").then((m) => ({
        default: m.CometHeadline,
      })),
    loadConfig: () =>
      import("@/registry/remocn/comet-headline/config").then(
        (m) => m.cometHeadlineConfig,
      ),
  },
  "indent-steps": {
    load: () =>
      import("@/registry/remocn/indent-steps").then((m) => ({
        default: m.IndentSteps,
      })),
    loadConfig: () =>
      import("@/registry/remocn/indent-steps/config").then(
        (m) => m.indentStepsConfig,
      ),
  },
  "point-expand": {
    load: () =>
      import("@/registry/remocn/point-expand").then((m) => ({
        default: m.PointExpand,
      })),
    loadConfig: () =>
      import("@/registry/remocn/point-expand/config").then(
        (m) => m.pointExpandConfig,
      ),
  },
  "layout-swap": {
    load: () =>
      import("@/registry/remocn/layout-swap").then((m) => ({
        default: m.LayoutSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/layout-swap/config").then(
        (m) => m.layoutSwapConfig,
      ),
  },
  "acronym-expand": {
    load: () =>
      import("@/registry/remocn/acronym-expand").then((m) => ({
        default: m.AcronymExpand,
      })),
    loadConfig: () =>
      import("@/registry/remocn/acronym-expand/config").then(
        (m) => m.acronymExpandConfig,
      ),
  },
  "diff-swap": {
    load: () =>
      import("@/registry/remocn/diff-swap").then((m) => ({
        default: m.DiffSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/diff-swap/config").then(
        (m) => m.diffSwapConfig,
      ),
  },
  "heat-trace": {
    load: () =>
      import("@/registry/remocn/heat-trace").then((m) => ({
        default: m.HeatTrace,
      })),
    loadConfig: () =>
      import("@/registry/remocn/heat-trace/config").then(
        (m) => m.heatTraceConfig,
      ),
  },
  "thin-slab": {
    load: () =>
      import("@/registry/remocn/thin-slab").then((m) => ({
        default: m.ThinSlab,
      })),
    loadConfig: () =>
      import("@/registry/remocn/thin-slab/config").then(
        (m) => m.thinSlabConfig,
      ),
  },
  "stat-inline": {
    load: () =>
      import("@/registry/remocn/stat-inline").then((m) => ({
        default: m.StatInline,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stat-inline/config").then(
        (m) => m.statInlineConfig,
      ),
  },
  "launch-days": {
    load: () =>
      import("@/registry/remocn/launch-days").then((m) => ({
        default: m.LaunchDays,
      })),
    loadConfig: () =>
      import("@/registry/remocn/launch-days/config").then(
        (m) => m.launchDaysConfig,
      ),
  },
  "cut-stat": {
    load: () =>
      import("@/registry/remocn/cut-stat").then((m) => ({
        default: m.CutStat,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cut-stat/config").then((m) => m.cutStatConfig),
  },
  "slash-wipe": {
    load: () =>
      import("@/registry/remocn/slash-wipe").then((m) => ({
        default: m.SlashWipe,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slash-wipe/config").then(
        (m) => m.slashWipeConfig,
      ),
  },
  "light-signature": {
    load: () =>
      import("@/registry/remocn/light-signature").then((m) => ({
        default: m.LightSignature,
      })),
    loadConfig: () =>
      import("@/registry/remocn/light-signature/config").then(
        (m) => m.lightSignatureConfig,
      ),
  },
  "studio-reflection": {
    load: () =>
      import("@/registry/remocn/studio-reflection").then((m) => ({
        default: m.StudioReflection,
      })),
    loadConfig: () =>
      import("@/registry/remocn/studio-reflection/config").then(
        (m) => m.studioReflectionConfig,
      ),
  },
  "flick-swap": {
    load: () =>
      import("@/registry/remocn/flick-swap").then((m) => ({
        default: m.FlickSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flick-swap/config").then(
        (m) => m.flickSwapConfig,
      ),
  },
  introducing: {
    load: () =>
      import("@/registry/remocn/introducing").then((m) => ({
        default: m.Introducing,
      })),
    loadConfig: () =>
      import("@/registry/remocn/introducing/config").then(
        (m) => m.introducingConfig,
      ),
  },
  "feature-headline": {
    load: () =>
      import("@/registry/remocn/feature-headline").then((m) => ({
        default: m.FeatureHeadline,
      })),
    loadConfig: () =>
      import("@/registry/remocn/feature-headline/config").then(
        (m) => m.featureHeadlineConfig,
      ),
  },
  "before-after": {
    load: () =>
      import("@/registry/remocn/before-after").then((m) => ({
        default: m.BeforeAfter,
      })),
    loadConfig: () =>
      import("@/registry/remocn/before-after/config").then(
        (m) => m.beforeAfterConfig,
      ),
  },
  "feature-trio": {
    load: () =>
      import("@/registry/remocn/feature-trio").then((m) => ({
        default: m.FeatureTrio,
      })),
    loadConfig: () =>
      import("@/registry/remocn/feature-trio/config").then(
        (m) => m.featureTrioConfig,
      ),
  },
  "magnet-letters": {
    load: () =>
      import("@/registry/remocn/magnet-letters").then((m) => ({
        default: m.MagnetLetters,
      })),
    loadConfig: () =>
      import("@/registry/remocn/magnet-letters/config").then(
        (m) => m.magnetLettersConfig,
      ),
  },
  "ruler-align": {
    load: () =>
      import("@/registry/remocn/ruler-align").then((m) => ({
        default: m.RulerAlign,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ruler-align/config").then(
        (m) => m.rulerAlignConfig,
      ),
  },
  "scissors-cut": {
    load: () =>
      import("@/registry/remocn/scissors-cut").then((m) => ({
        default: m.ScissorsCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/scissors-cut/config").then(
        (m) => m.scissorsCutConfig,
      ),
  },
  "tittle-drop": {
    load: () =>
      import("@/registry/remocn/tittle-drop").then((m) => ({
        default: m.TittleDrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tittle-drop/config").then(
        (m) => m.tittleDropConfig,
      ),
  },
  "cursor-frame": {
    load: () =>
      import("@/registry/remocn/cursor-frame").then((m) => ({
        default: m.CursorFrame,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cursor-frame/config").then(
        (m) => m.cursorFrameConfig,
      ),
  },
  "caret-letter": {
    load: () =>
      import("@/registry/remocn/caret-letter").then((m) => ({
        default: m.CaretLetter,
      })),
    loadConfig: () =>
      import("@/registry/remocn/caret-letter/config").then(
        (m) => m.caretLetterConfig,
      ),
  },
  "point-intro": {
    load: () =>
      import("@/registry/remocn/point-intro").then((m) => ({
        default: m.PointIntro,
      })),
    loadConfig: () =>
      import("@/registry/remocn/point-intro/config").then(
        (m) => m.pointIntroConfig,
      ),
  },
  "grid-cell": {
    load: () =>
      import("@/registry/remocn/grid-cell").then((m) => ({
        default: m.GridCell,
      })),
    loadConfig: () =>
      import("@/registry/remocn/grid-cell/config").then(
        (m) => m.gridCellConfig,
      ),
  },
  "spotlight-text": {
    load: () =>
      import("@/registry/remocn/spotlight-text").then((m) => ({
        default: m.SpotlightText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spotlight-text/config").then(
        (m) => m.spotlightTextConfig,
      ),
  },
  "border-beam": {
    load: () =>
      import("@/registry/remocn/border-beam").then((m) => ({
        default: m.BorderBeam,
      })),
    loadConfig: () =>
      import("@/registry/remocn/border-beam/config").then(
        (m) => m.borderBeamConfig,
      ),
  },
  "walkout-name": {
    load: () =>
      import("@/registry/remocn/walkout-name").then((m) => ({
        default: m.WalkoutName,
      })),
    loadConfig: () =>
      import("@/registry/remocn/walkout-name/config").then(
        (m) => m.walkoutNameConfig,
      ),
  },
  "ko-count": {
    load: () =>
      import("@/registry/remocn/ko-count").then((m) => ({
        default: m.KoCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ko-count/config").then((m) => m.koCountConfig),
  },
  "play-of-the-game": {
    load: () =>
      import("@/registry/remocn/play-of-the-game").then((m) => ({
        default: m.PlayOfTheGame,
      })),
    loadConfig: () =>
      import("@/registry/remocn/play-of-the-game/config").then(
        (m) => m.playOfTheGameConfig,
      ),
  },
  "t-minus": {
    load: () =>
      import("@/registry/remocn/t-minus").then((m) => ({
        default: m.TMinus,
      })),
    loadConfig: () =>
      import("@/registry/remocn/t-minus/config").then((m) => m.tMinusConfig),
  },
  "max-q": {
    load: () =>
      import("@/registry/remocn/max-q").then((m) => ({
        default: m.MaxQ,
      })),
    loadConfig: () =>
      import("@/registry/remocn/max-q/config").then((m) => m.maxQConfig),
  },
  "landing-confirmed": {
    load: () =>
      import("@/registry/remocn/landing-confirmed").then((m) => ({
        default: m.LandingConfirmed,
      })),
    loadConfig: () =>
      import("@/registry/remocn/landing-confirmed/config").then(
        (m) => m.landingConfirmedConfig,
      ),
  },
  "drop-timer": {
    load: () =>
      import("@/registry/remocn/drop-timer").then((m) => ({
        default: m.DropTimer,
      })),
    loadConfig: () =>
      import("@/registry/remocn/drop-timer/config").then(
        (m) => m.dropTimerConfig,
      ),
  },
  "sold-out": {
    load: () =>
      import("@/registry/remocn/sold-out").then((m) => ({
        default: m.SoldOut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/sold-out/config").then((m) => m.soldOutConfig),
  },
  "got-em": {
    load: () =>
      import("@/registry/remocn/got-em").then((m) => ({
        default: m.GotEm,
      })),
    loadConfig: () =>
      import("@/registry/remocn/got-em/config").then((m) => m.gotEmConfig),
  },
  "ipo-open": {
    load: () =>
      import("@/registry/remocn/ipo-open").then((m) => ({
        default: m.IpoOpen,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ipo-open/config").then((m) => m.ipoOpenConfig),
  },
  "candle-rally": {
    load: () =>
      import("@/registry/remocn/candle-rally").then((m) => ({
        default: m.CandleRally,
      })),
    loadConfig: () =>
      import("@/registry/remocn/candle-rally/config").then(
        (m) => m.candleRallyConfig,
      ),
  },
  "chevron-run": {
    load: () =>
      import("@/registry/remocn/chevron-run").then((m) => ({
        default: m.ChevronRun,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chevron-run/config").then(
        (m) => m.chevronRunConfig,
      ),
  },
  "high-score": {
    load: () =>
      import("@/registry/remocn/high-score").then((m) => ({
        default: m.HighScore,
      })),
    loadConfig: () =>
      import("@/registry/remocn/high-score/config").then(
        (m) => m.highScoreConfig,
      ),
  },
  "boss-bar": {
    load: () =>
      import("@/registry/remocn/boss-bar").then((m) => ({
        default: m.BossBar,
      })),
    loadConfig: () =>
      import("@/registry/remocn/boss-bar/config").then((m) => m.bossBarConfig),
  },
  "achievement-pop": {
    load: () =>
      import("@/registry/remocn/achievement-pop").then((m) => ({
        default: m.AchievementPop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/achievement-pop/config").then(
        (m) => m.achievementPopConfig,
      ),
  },
  "kill-feed": {
    load: () =>
      import("@/registry/remocn/kill-feed").then((m) => ({
        default: m.KillFeed,
      })),
    loadConfig: () =>
      import("@/registry/remocn/kill-feed/config").then(
        (m) => m.killFeedConfig,
      ),
  },
  "mvp-card": {
    load: () =>
      import("@/registry/remocn/mvp-card").then((m) => ({
        default: m.MvpCard,
      })),
    loadConfig: () =>
      import("@/registry/remocn/mvp-card/config").then((m) => m.mvpCardConfig),
  },
  "bracket-win": {
    load: () =>
      import("@/registry/remocn/bracket-win").then((m) => ({
        default: m.BracketWin,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bracket-win/config").then(
        (m) => m.bracketWinConfig,
      ),
  },
  "timing-tower": {
    load: () =>
      import("@/registry/remocn/timing-tower").then((m) => ({
        default: m.TimingTower,
      })),
    loadConfig: () =>
      import("@/registry/remocn/timing-tower/config").then(
        (m) => m.timingTowerConfig,
      ),
  },
  "shot-clock": {
    load: () =>
      import("@/registry/remocn/shot-clock").then((m) => ({
        default: m.ShotClock,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shot-clock/config").then(
        (m) => m.shotClockConfig,
      ),
  },
  "speed-trap": {
    load: () =>
      import("@/registry/remocn/speed-trap").then((m) => ({
        default: m.SpeedTrap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/speed-trap/config").then(
        (m) => m.speedTrapConfig,
      ),
  },
  "crash-zoom": {
    load: () =>
      import("@/registry/remocn/crash-zoom").then((m) => ({
        default: m.CrashZoom,
      })),
    loadConfig: () =>
      import("@/registry/remocn/crash-zoom/config").then(
        (m) => m.crashZoomConfig,
      ),
  },
  "pov-setup": {
    load: () =>
      import("@/registry/remocn/pov-setup").then((m) => ({
        default: m.PovSetup,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pov-setup/config").then(
        (m) => m.povSetupConfig,
      ),
  },
  "speedrun-timer": {
    load: () =>
      import("@/registry/remocn/speedrun-timer").then((m) => ({
        default: m.SpeedrunTimer,
      })),
    loadConfig: () =>
      import("@/registry/remocn/speedrun-timer/config").then(
        (m) => m.speedrunTimerConfig,
      ),
  },
  "round-slam": {
    load: () =>
      import("@/registry/remocn/round-slam").then((m) => ({
        default: m.RoundSlam,
      })),
    loadConfig: () =>
      import("@/registry/remocn/round-slam/config").then(
        (m) => m.roundSlamConfig,
      ),
  },
  "level-up": {
    load: () =>
      import("@/registry/remocn/level-up").then((m) => ({
        default: m.LevelUp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/level-up/config").then((m) => m.levelUpConfig),
  },
  "combo-counter": {
    load: () =>
      import("@/registry/remocn/combo-counter").then((m) => ({
        default: m.ComboCounter,
      })),
    loadConfig: () =>
      import("@/registry/remocn/combo-counter/config").then(
        (m) => m.comboCounterConfig,
      ),
  },
  "hook-punch": {
    load: () =>
      import("@/registry/remocn/hook-punch").then((m) => ({
        default: m.HookPunch,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hook-punch/config").then(
        (m) => m.hookPunchConfig,
      ),
  },
  "milestone-roll": {
    load: () =>
      import("@/registry/remocn/milestone-roll").then((m) => ({
        default: m.MilestoneRoll,
      })),
    loadConfig: () =>
      import("@/registry/remocn/milestone-roll/config").then(
        (m) => m.milestoneRollConfig,
      ),
  },
  "duet-split": {
    load: () =>
      import("@/registry/remocn/duet-split").then((m) => ({
        default: m.DuetSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/duet-split/config").then(
        (m) => m.duetSplitConfig,
      ),
  },
  "intelligence-glow": {
    load: () =>
      import("@/registry/remocn/intelligence-glow").then((m) => ({
        default: m.IntelligenceGlow,
      })),
    loadConfig: () =>
      import("@/registry/remocn/intelligence-glow/config").then(
        (m) => m.intelligenceGlowConfig,
      ),
  },
  "ghost-complete": {
    load: () =>
      import("@/registry/remocn/ghost-complete").then((m) => ({
        default: m.GhostComplete,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ghost-complete/config").then(
        (m) => m.ghostCompleteConfig,
      ),
  },
  "query-cascade": {
    load: () =>
      import("@/registry/remocn/query-cascade").then((m) => ({
        default: m.QueryCascade,
      })),
    loadConfig: () =>
      import("@/registry/remocn/query-cascade/config").then(
        (m) => m.queryCascadeConfig,
      ),
  },
  "liquid-word": {
    load: () =>
      import("@/registry/remocn/liquid-word").then((m) => ({
        default: m.LiquidWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/liquid-word/config").then(
        (m) => m.liquidWordConfig,
      ),
  },
  "oval-type": {
    load: () =>
      import("@/registry/remocn/oval-type").then((m) => ({
        default: m.OvalType,
      })),
    loadConfig: () =>
      import("@/registry/remocn/oval-type/config").then(
        (m) => m.ovalTypeConfig,
      ),
  },
  "live-ticker": {
    load: () =>
      import("@/registry/remocn/live-ticker").then((m) => ({
        default: m.LiveTicker,
      })),
    loadConfig: () =>
      import("@/registry/remocn/live-ticker/config").then(
        (m) => m.liveTickerConfig,
      ),
  },
  "ticker-tape": {
    load: () =>
      import("@/registry/remocn/ticker-tape").then((m) => ({
        default: m.TickerTape,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ticker-tape/config").then(
        (m) => m.tickerTapeConfig,
      ),
  },
  "price-slate": {
    load: () =>
      import("@/registry/remocn/price-slate").then((m) => ({
        default: m.PriceSlate,
      })),
    loadConfig: () =>
      import("@/registry/remocn/price-slate/config").then(
        (m) => m.priceSlateConfig,
      ),
  },
  "score-bug": {
    load: () =>
      import("@/registry/remocn/score-bug").then((m) => ({
        default: m.ScoreBug,
      })),
    loadConfig: () =>
      import("@/registry/remocn/score-bug/config").then(
        (m) => m.scoreBugConfig,
      ),
  },
  "versus-split": {
    load: () =>
      import("@/registry/remocn/versus-split").then((m) => ({
        default: m.VersusSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/versus-split/config").then(
        (m) => m.versusSplitConfig,
      ),
  },
  "replay-wipe": {
    load: () =>
      import("@/registry/remocn/replay-wipe").then((m) => ({
        default: m.ReplayWipe,
      })),
    loadConfig: () =>
      import("@/registry/remocn/replay-wipe/config").then(
        (m) => m.replayWipeConfig,
      ),
  },
  "bass-drop": {
    load: () =>
      import("@/registry/remocn/bass-drop").then((m) => ({
        default: m.BassDrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bass-drop/config").then(
        (m) => m.bassDropConfig,
      ),
  },
  "escalate-cards": {
    load: () =>
      import("@/registry/remocn/escalate-cards").then((m) => ({
        default: m.EscalateCards,
      })),
    loadConfig: () =>
      import("@/registry/remocn/escalate-cards/config").then(
        (m) => m.escalateCardsConfig,
      ),
  },
  "flip-sting": {
    load: () =>
      import("@/registry/remocn/flip-sting").then((m) => ({
        default: m.FlipSting,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flip-sting/config").then(
        (m) => m.flipStingConfig,
      ),
  },
  "lights-out": {
    load: () =>
      import("@/registry/remocn/lights-out").then((m) => ({
        default: m.LightsOut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/lights-out/config").then(
        (m) => m.lightsOutConfig,
      ),
  },
  "italic-speed": {
    load: () =>
      import("@/registry/remocn/italic-speed").then((m) => ({
        default: m.ItalicSpeed,
      })),
    loadConfig: () =>
      import("@/registry/remocn/italic-speed/config").then(
        (m) => m.italicSpeedConfig,
      ),
  },
  "split-flash": {
    load: () =>
      import("@/registry/remocn/split-flash").then((m) => ({
        default: m.SplitFlash,
      })),
    loadConfig: () =>
      import("@/registry/remocn/split-flash/config").then(
        (m) => m.splitFlashConfig,
      ),
  },
  "dynamic-letter": {
    load: () =>
      import("@/registry/remocn/dynamic-letter").then((m) => ({
        default: m.DynamicLetter,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dynamic-letter/config").then(
        (m) => m.dynamicLetterConfig,
      ),
  },
  "snap-click": {
    load: () =>
      import("@/registry/remocn/snap-click").then((m) => ({
        default: m.SnapClick,
      })),
    loadConfig: () =>
      import("@/registry/remocn/snap-click/config").then(
        (m) => m.snapClickConfig,
      ),
  },
  "scrub-reveal": {
    load: () =>
      import("@/registry/remocn/scrub-reveal").then((m) => ({
        default: m.ScrubReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/scrub-reveal/config").then(
        (m) => m.scrubRevealConfig,
      ),
  },
  "aspect-slit": {
    load: () =>
      import("@/registry/remocn/aspect-slit").then((m) => ({
        default: m.AspectSlit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/aspect-slit/config").then(
        (m) => m.aspectSlitConfig,
      ),
  },
  "parallax-lockup": {
    load: () =>
      import("@/registry/remocn/parallax-lockup").then((m) => ({
        default: m.ParallaxLockup,
      })),
    loadConfig: () =>
      import("@/registry/remocn/parallax-lockup/config").then(
        (m) => m.parallaxLockupConfig,
      ),
  },
  "deadpan-box": {
    load: () =>
      import("@/registry/remocn/deadpan-box").then((m) => ({
        default: m.DeadpanBox,
      })),
    loadConfig: () =>
      import("@/registry/remocn/deadpan-box/config").then(
        (m) => m.deadpanBoxConfig,
      ),
  },
  "stripe-mask": {
    load: () =>
      import("@/registry/remocn/stripe-mask").then((m) => ({
        default: m.StripeMask,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stripe-mask/config").then(
        (m) => m.stripeMaskConfig,
      ),
  },
  "full-bleed-type": {
    load: () =>
      import("@/registry/remocn/full-bleed-type").then((m) => ({
        default: m.FullBleedType,
      })),
    loadConfig: () =>
      import("@/registry/remocn/full-bleed-type/config").then(
        (m) => m.fullBleedTypeConfig,
      ),
  },
  "rep-stack": {
    load: () =>
      import("@/registry/remocn/rep-stack").then((m) => ({
        default: m.RepStack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rep-stack/config").then(
        (m) => m.repStackConfig,
      ),
  },
  "title-converge": {
    load: () =>
      import("@/registry/remocn/title-converge").then((m) => ({
        default: m.TitleConverge,
      })),
    loadConfig: () =>
      import("@/registry/remocn/title-converge/config").then(
        (m) => m.titleConvergeConfig,
      ),
  },
  "macro-pan": {
    load: () =>
      import("@/registry/remocn/macro-pan").then((m) => ({
        default: m.MacroPan,
      })),
    loadConfig: () =>
      import("@/registry/remocn/macro-pan/config").then(
        (m) => m.macroPanConfig,
      ),
  },
  "split-match": {
    load: () =>
      import("@/registry/remocn/split-match").then((m) => ({
        default: m.SplitMatch,
      })),
    loadConfig: () =>
      import("@/registry/remocn/split-match/config").then(
        (m) => m.splitMatchConfig,
      ),
  },
  "bounce-logo": {
    load: () =>
      import("@/registry/remocn/bounce-logo").then((m) => ({
        default: m.BounceLogo,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bounce-logo/config").then(
        (m) => m.bounceLogoConfig,
      ),
  },
  "glyph-matrix": {
    load: () =>
      import("@/registry/remocn/glyph-matrix").then((m) => ({
        default: m.GlyphMatrix,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glyph-matrix/config").then(
        (m) => m.glyphMatrixConfig,
      ),
  },
  "ndot-resolve": {
    load: () =>
      import("@/registry/remocn/ndot-resolve").then((m) => ({
        default: m.NdotResolve,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ndot-resolve/config").then(
        (m) => m.ndotResolveConfig,
      ),
  },
  "shape-morph-o": {
    load: () =>
      import("@/registry/remocn/shape-morph-o").then((m) => ({
        default: m.ShapeMorphO,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shape-morph-o/config").then(
        (m) => m.shapeMorphOConfig,
      ),
  },
  "axis-flex": {
    load: () =>
      import("@/registry/remocn/axis-flex").then((m) => ({
        default: m.AxisFlex,
      })),
    loadConfig: () =>
      import("@/registry/remocn/axis-flex/config").then(
        (m) => m.axisFlexConfig,
      ),
  },
  "blink-cut": {
    load: () =>
      import("@/registry/remocn/blink-cut").then((m) => ({
        default: m.BlinkCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/blink-cut/config").then(
        (m) => m.blinkCutConfig,
      ),
  },
  "word-acts": {
    load: () =>
      import("@/registry/remocn/word-acts").then((m) => ({
        default: m.WordActs,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-acts/config").then(
        (m) => m.wordActsConfig,
      ),
  },
  "depth-headline": {
    load: () =>
      import("@/registry/remocn/depth-headline").then((m) => ({
        default: m.DepthHeadline,
      })),
    loadConfig: () =>
      import("@/registry/remocn/depth-headline/config").then(
        (m) => m.depthHeadlineConfig,
      ),
  },
  "speed-ramp-word": {
    load: () =>
      import("@/registry/remocn/speed-ramp-word").then((m) => ({
        default: m.SpeedRampWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/speed-ramp-word/config").then(
        (m) => m.speedRampWordConfig,
      ),
  },
  "pass-swap": {
    load: () =>
      import("@/registry/remocn/pass-swap").then((m) => ({
        default: m.PassSwap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pass-swap/config").then(
        (m) => m.passSwapConfig,
      ),
  },
  "photo-fill-type": {
    load: () =>
      import("@/registry/remocn/photo-fill-type").then((m) => ({
        default: m.PhotoFillType,
      })),
    loadConfig: () =>
      import("@/registry/remocn/photo-fill-type/config").then(
        (m) => m.photoFillTypeConfig,
      ),
  },
  "bracket-index": {
    load: () =>
      import("@/registry/remocn/bracket-index").then((m) => ({
        default: m.BracketIndex,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bracket-index/config").then(
        (m) => m.bracketIndexConfig,
      ),
  },
  "select-replace": {
    load: () =>
      import("@/registry/remocn/select-replace").then((m) => ({
        default: m.SelectReplace,
      })),
    loadConfig: () =>
      import("@/registry/remocn/select-replace/config").then(
        (m) => m.selectReplaceConfig,
      ),
  },
  "wrapped-squash": {
    load: () =>
      import("@/registry/remocn/wrapped-squash").then((m) => ({
        default: m.WrappedSquash,
      })),
    loadConfig: () =>
      import("@/registry/remocn/wrapped-squash/config").then(
        (m) => m.wrappedSquashConfig,
      ),
  },
  "rubberband-word": {
    load: () =>
      import("@/registry/remocn/rubberband-word").then((m) => ({
        default: m.RubberbandWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rubberband-word/config").then(
        (m) => m.rubberbandWordConfig,
      ),
  },
  "story-text": {
    load: () =>
      import("@/registry/remocn/story-text").then((m) => ({
        default: m.StoryText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/story-text/config").then(
        (m) => m.storyTextConfig,
      ),
  },
  "anagram-shuffle": {
    load: () =>
      import("@/registry/remocn/anagram-shuffle").then((m) => ({
        default: m.AnagramShuffle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/anagram-shuffle/config").then(
        (m) => m.anagramShuffleConfig,
      ),
  },
  "word-ladder": {
    load: () =>
      import("@/registry/remocn/word-ladder").then((m) => ({
        default: m.WordLadder,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-ladder/config").then(
        (m) => m.wordLadderConfig,
      ),
  },
  "hidden-word": {
    load: () =>
      import("@/registry/remocn/hidden-word").then((m) => ({
        default: m.HiddenWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hidden-word/config").then(
        (m) => m.hiddenWordConfig,
      ),
  },
  "column-reflow": {
    load: () =>
      import("@/registry/remocn/column-reflow").then((m) => ({
        default: m.ColumnReflow,
      })),
    loadConfig: () =>
      import("@/registry/remocn/column-reflow/config").then(
        (m) => m.columnReflowConfig,
      ),
  },
  "word-insert": {
    load: () =>
      import("@/registry/remocn/word-insert").then((m) => ({
        default: m.WordInsert,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-insert/config").then(
        (m) => m.wordInsertConfig,
      ),
  },
  "typo-fix": {
    load: () =>
      import("@/registry/remocn/typo-fix").then((m) => ({
        default: m.TypoFix,
      })),
    loadConfig: () =>
      import("@/registry/remocn/typo-fix/config").then((m) => m.typoFixConfig),
  },
  "font-cycle": {
    load: () =>
      import("@/registry/remocn/font-cycle").then((m) => ({
        default: m.FontCycle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/font-cycle/config").then(
        (m) => m.fontCycleConfig,
      ),
  },
  "case-flip": {
    load: () =>
      import("@/registry/remocn/case-flip").then((m) => ({
        default: m.CaseFlip,
      })),
    loadConfig: () =>
      import("@/registry/remocn/case-flip/config").then(
        (m) => m.caseFlipConfig,
      ),
  },
  "path-text": {
    load: () =>
      import("@/registry/remocn/path-text").then((m) => ({
        default: m.PathText,
      })),
    loadConfig: () =>
      import("@/registry/remocn/path-text/config").then(
        (m) => m.pathTextConfig,
      ),
  },
  "ellipsis-resolve": {
    load: () =>
      import("@/registry/remocn/ellipsis-resolve").then((m) => ({
        default: m.EllipsisResolve,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ellipsis-resolve/config").then(
        (m) => m.ellipsisResolveConfig,
      ),
  },
  "letter-relay": {
    load: () =>
      import("@/registry/remocn/letter-relay").then((m) => ({
        default: m.LetterRelay,
      })),
    loadConfig: () =>
      import("@/registry/remocn/letter-relay/config").then(
        (m) => m.letterRelayConfig,
      ),
  },
  "stack-letters": {
    load: () =>
      import("@/registry/remocn/stack-letters").then((m) => ({
        default: m.StackLetters,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stack-letters/config").then(
        (m) => m.stackLettersConfig,
      ),
  },
  "weight-wave": {
    load: () =>
      import("@/registry/remocn/weight-wave").then((m) => ({
        default: m.WeightWave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/weight-wave/config").then(
        (m) => m.weightWaveConfig,
      ),
  },
  "kerning-snap": {
    load: () =>
      import("@/registry/remocn/kerning-snap").then((m) => ({
        default: m.KerningSnap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/kerning-snap/config").then(
        (m) => m.kerningSnapConfig,
      ),
  },
  "baseline-drop": {
    load: () =>
      import("@/registry/remocn/baseline-drop").then((m) => ({
        default: m.BaselineDrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/baseline-drop/config").then(
        (m) => m.baselineDropConfig,
      ),
  },
  "scan-reveal": {
    load: () =>
      import("@/registry/remocn/scan-reveal").then((m) => ({
        default: m.ScanReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/scan-reveal/config").then(
        (m) => m.scanRevealConfig,
      ),
  },
  "beam-split": {
    load: () =>
      import("@/registry/remocn/beam-split").then((m) => ({
        default: m.BeamSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/beam-split/config").then(
        (m) => m.beamSplitConfig,
      ),
  },
  "strobe-words": {
    load: () =>
      import("@/registry/remocn/strobe-words").then((m) => ({
        default: m.StrobeWords,
      })),
    loadConfig: () =>
      import("@/registry/remocn/strobe-words/config").then(
        (m) => m.strobeWordsConfig,
      ),
  },
  "torn-edge": {
    load: () =>
      import("@/registry/remocn/torn-edge").then((m) => ({
        default: m.TornEdge,
      })),
    loadConfig: () =>
      import("@/registry/remocn/torn-edge/config").then(
        (m) => m.tornEdgeConfig,
      ),
  },
  "squircle-wave": {
    load: () =>
      import("@/registry/remocn/squircle-wave").then((m) => ({
        default: m.SquircleWave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/squircle-wave/config").then(
        (m) => m.squircleWaveConfig,
      ),
  },
  "ring-burst": {
    load: () =>
      import("@/registry/remocn/ring-burst").then((m) => ({
        default: m.RingBurst,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ring-burst/config").then(
        (m) => m.ringBurstConfig,
      ),
  },
  "band-shift": {
    load: () =>
      import("@/registry/remocn/band-shift").then((m) => ({
        default: m.BandShift,
      })),
    loadConfig: () =>
      import("@/registry/remocn/band-shift/config").then(
        (m) => m.bandShiftConfig,
      ),
  },
  "tile-wave": {
    load: () =>
      import("@/registry/remocn/tile-wave").then((m) => ({
        default: m.TileWave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tile-wave/config").then(
        (m) => m.tileWaveConfig,
      ),
  },
  "glass-capsule": {
    load: () =>
      import("@/registry/remocn/glass-capsule").then((m) => ({
        default: m.GlassCapsule,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glass-capsule/config").then(
        (m) => m.glassCapsuleConfig,
      ),
  },
  "dot-type": {
    load: () =>
      import("@/registry/remocn/dot-type").then((m) => ({
        default: m.DotType,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dot-type/config").then((m) => m.dotTypeConfig),
  },
  "flock-form": {
    load: () =>
      import("@/registry/remocn/flock-form").then((m) => ({
        default: m.FlockForm,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flock-form/config").then(
        (m) => m.flockFormConfig,
      ),
  },
  "ring-align": {
    load: () =>
      import("@/registry/remocn/ring-align").then((m) => ({
        default: m.RingAlign,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ring-align/config").then(
        (m) => m.ringAlignConfig,
      ),
  },
  "word-stack": {
    load: () =>
      import("@/registry/remocn/word-stack").then((m) => ({
        default: m.WordStack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/word-stack/config").then(
        (m) => m.wordStackConfig,
      ),
  },
  "split-word": {
    load: () =>
      import("@/registry/remocn/split-word").then((m) => ({
        default: m.SplitWord,
      })),
    loadConfig: () =>
      import("@/registry/remocn/split-word/config").then(
        (m) => m.splitWordConfig,
      ),
  },
  "counter-reveal": {
    load: () =>
      import("@/registry/remocn/counter-reveal").then((m) => ({
        default: m.CounterReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/counter-reveal/config").then(
        (m) => m.counterRevealConfig,
      ),
  },
  "slit-scan": {
    load: () =>
      import("@/registry/remocn/slit-scan").then((m) => ({
        default: m.SlitScan,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slit-scan/config").then(
        (m) => m.slitScanConfig,
      ),
  },
  "moire-reveal": {
    load: () =>
      import("@/registry/remocn/moire-reveal").then((m) => ({
        default: m.MoireReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/moire-reveal/config").then(
        (m) => m.moireRevealConfig,
      ),
  },
  "thread-weave": {
    load: () =>
      import("@/registry/remocn/thread-weave").then((m) => ({
        default: m.ThreadWeave,
      })),
    loadConfig: () =>
      import("@/registry/remocn/thread-weave/config").then(
        (m) => m.threadWeaveConfig,
      ),
  },
  "fourier-sum": {
    load: () =>
      import("@/registry/remocn/fourier-sum").then((m) => ({
        default: m.FourierSum,
      })),
    loadConfig: () =>
      import("@/registry/remocn/fourier-sum/config").then(
        (m) => m.fourierSumConfig,
      ),
  },
  "cell-divide": {
    load: () =>
      import("@/registry/remocn/cell-divide").then((m) => ({
        default: m.CellDivide,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cell-divide/config").then(
        (m) => m.cellDivideConfig,
      ),
  },
  "hex-fill": {
    load: () =>
      import("@/registry/remocn/hex-fill").then((m) => ({
        default: m.HexFill,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hex-fill/config").then((m) => m.hexFillConfig),
  },
  "log-rescale": {
    load: () =>
      import("@/registry/remocn/log-rescale").then((m) => ({
        default: m.LogRescale,
      })),
    loadConfig: () =>
      import("@/registry/remocn/log-rescale/config").then(
        (m) => m.logRescaleConfig,
      ),
  },
  "off-the-charts": {
    load: () =>
      import("@/registry/remocn/off-the-charts").then((m) => ({
        default: m.OffTheCharts,
      })),
    loadConfig: () =>
      import("@/registry/remocn/off-the-charts/config").then(
        (m) => m.offTheChartsConfig,
      ),
  },
  "shape-pack": {
    load: () =>
      import("@/registry/remocn/shape-pack").then((m) => ({
        default: m.ShapePack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shape-pack/config").then(
        (m) => m.shapePackConfig,
      ),
  },
  "pattern-tile": {
    load: () =>
      import("@/registry/remocn/pattern-tile").then((m) => ({
        default: m.PatternTile,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pattern-tile/config").then(
        (m) => m.patternTileConfig,
      ),
  },
  "line-cascade": {
    load: () =>
      import("@/registry/remocn/line-cascade").then((m) => ({
        default: m.LineCascade,
      })),
    loadConfig: () =>
      import("@/registry/remocn/line-cascade/config").then(
        (m) => m.lineCascadeConfig,
      ),
  },
  "hatch-shade": {
    load: () =>
      import("@/registry/remocn/hatch-shade").then((m) => ({
        default: m.HatchShade,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hatch-shade/config").then(
        (m) => m.hatchShadeConfig,
      ),
  },
  "path-search": {
    load: () =>
      import("@/registry/remocn/path-search").then((m) => ({
        default: m.PathSearch,
      })),
    loadConfig: () =>
      import("@/registry/remocn/path-search/config").then(
        (m) => m.pathSearchConfig,
      ),
  },
  "transit-lines": {
    load: () =>
      import("@/registry/remocn/transit-lines").then((m) => ({
        default: m.TransitLines,
      })),
    loadConfig: () =>
      import("@/registry/remocn/transit-lines/config").then(
        (m) => m.transitLinesConfig,
      ),
  },
  "slope-chart": {
    load: () =>
      import("@/registry/remocn/slope-chart").then((m) => ({
        default: m.SlopeChart,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slope-chart/config").then(
        (m) => m.slopeChartConfig,
      ),
  },
  ridgeline: {
    load: () =>
      import("@/registry/remocn/ridgeline").then((m) => ({
        default: m.Ridgeline,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ridgeline/config").then(
        (m) => m.ridgelineConfig,
      ),
  },
  beeswarm: {
    load: () =>
      import("@/registry/remocn/beeswarm").then((m) => ({
        default: m.Beeswarm,
      })),
    loadConfig: () =>
      import("@/registry/remocn/beeswarm/config").then((m) => m.beeswarmConfig),
  },
  "chart-morph": {
    load: () =>
      import("@/registry/remocn/chart-morph").then((m) => ({
        default: m.ChartMorph,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chart-morph/config").then(
        (m) => m.chartMorphConfig,
      ),
  },
  "dumbbell-shift": {
    load: () =>
      import("@/registry/remocn/dumbbell-shift").then((m) => ({
        default: m.DumbbellShift,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dumbbell-shift/config").then(
        (m) => m.dumbbellShiftConfig,
      ),
  },
  "stacked-shift": {
    load: () =>
      import("@/registry/remocn/stacked-shift").then((m) => ({
        default: m.StackedShift,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stacked-shift/config").then(
        (m) => m.stackedShiftConfig,
      ),
  },
  "tally-marks": {
    load: () =>
      import("@/registry/remocn/tally-marks").then((m) => ({
        default: m.TallyMarks,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tally-marks/config").then(
        (m) => m.tallyMarksConfig,
      ),
  },
  "abacus-count": {
    load: () =>
      import("@/registry/remocn/abacus-count").then((m) => ({
        default: m.AbacusCount,
      })),
    loadConfig: () =>
      import("@/registry/remocn/abacus-count/config").then(
        (m) => m.abacusCountConfig,
      ),
  },
  "fraction-split": {
    load: () =>
      import("@/registry/remocn/fraction-split").then((m) => ({
        default: m.FractionSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/fraction-split/config").then(
        (m) => m.fractionSplitConfig,
      ),
  },
  "balance-beam": {
    load: () =>
      import("@/registry/remocn/balance-beam").then((m) => ({
        default: m.BalanceBeam,
      })),
    loadConfig: () =>
      import("@/registry/remocn/balance-beam/config").then(
        (m) => m.balanceBeamConfig,
      ),
  },
  "domino-run": {
    load: () =>
      import("@/registry/remocn/domino-run").then((m) => ({
        default: m.DominoRun,
      })),
    loadConfig: () =>
      import("@/registry/remocn/domino-run/config").then(
        (m) => m.dominoRunConfig,
      ),
  },
  "spring-bars": {
    load: () =>
      import("@/registry/remocn/spring-bars").then((m) => ({
        default: m.SpringBars,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spring-bars/config").then(
        (m) => m.springBarsConfig,
      ),
  },
  "dot-sort": {
    load: () =>
      import("@/registry/remocn/dot-sort").then((m) => ({
        default: m.DotSort,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dot-sort/config").then((m) => m.dotSortConfig),
  },
  "flow-arrow": {
    load: () =>
      import("@/registry/remocn/flow-arrow").then((m) => ({
        default: m.FlowArrow,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flow-arrow/config").then(
        (m) => m.flowArrowConfig,
      ),
  },
  "dot-map": {
    load: () =>
      import("@/registry/remocn/dot-map").then((m) => ({
        default: m.DotMap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dot-map/config").then((m) => m.dotMapConfig),
  },
  "sankey-flow": {
    load: () =>
      import("@/registry/remocn/sankey-flow").then((m) => ({
        default: m.SankeyFlow,
      })),
    loadConfig: () =>
      import("@/registry/remocn/sankey-flow/config").then(
        (m) => m.sankeyFlowConfig,
      ),
  },
  "branch-tree": {
    load: () =>
      import("@/registry/remocn/branch-tree").then((m) => ({
        default: m.BranchTree,
      })),
    loadConfig: () =>
      import("@/registry/remocn/branch-tree/config").then(
        (m) => m.branchTreeConfig,
      ),
  },
  "chord-ring": {
    load: () =>
      import("@/registry/remocn/chord-ring").then((m) => ({
        default: m.ChordRing,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chord-ring/config").then(
        (m) => m.chordRingConfig,
      ),
  },
  "waterfall-chart": {
    load: () =>
      import("@/registry/remocn/waterfall-chart").then((m) => ({
        default: m.WaterfallChart,
      })),
    loadConfig: () =>
      import("@/registry/remocn/waterfall-chart/config").then(
        (m) => m.waterfallChartConfig,
      ),
  },
  "galton-stack": {
    load: () =>
      import("@/registry/remocn/galton-stack").then((m) => ({
        default: m.GaltonStack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/galton-stack/config").then(
        (m) => m.galtonStackConfig,
      ),
  },
  "bubble-pack": {
    load: () =>
      import("@/registry/remocn/bubble-pack").then((m) => ({
        default: m.BubblePack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bubble-pack/config").then(
        (m) => m.bubblePackConfig,
      ),
  },
  "treemap-split": {
    load: () =>
      import("@/registry/remocn/treemap-split").then((m) => ({
        default: m.TreemapSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/treemap-split/config").then(
        (m) => m.treemapSplitConfig,
      ),
  },
  "venn-merge": {
    load: () =>
      import("@/registry/remocn/venn-merge").then((m) => ({
        default: m.VennMerge,
      })),
    loadConfig: () =>
      import("@/registry/remocn/venn-merge/config").then(
        (m) => m.vennMergeConfig,
      ),
  },
  "fluted-glass": {
    load: () =>
      import("@/registry/remocn/fluted-glass").then((m) => ({
        default: m.FlutedGlass,
      })),
    loadConfig: () =>
      import("@/registry/remocn/fluted-glass/config").then(
        (m) => m.flutedGlassConfig,
      ),
  },
  "frosted-clear": {
    load: () =>
      import("@/registry/remocn/frosted-clear").then((m) => ({
        default: m.FrostedClear,
      })),
    loadConfig: () =>
      import("@/registry/remocn/frosted-clear/config").then(
        (m) => m.frostedClearConfig,
      ),
  },
  "embossed-mark": {
    load: () =>
      import("@/registry/remocn/embossed-mark").then((m) => ({
        default: m.EmbossedMark,
      })),
    loadConfig: () =>
      import("@/registry/remocn/embossed-mark/config").then(
        (m) => m.embossedMarkConfig,
      ),
  },
  "halftone-cut": {
    load: () =>
      import("@/registry/remocn/halftone-cut").then((m) => ({
        default: m.HalftoneCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/halftone-cut/config").then(
        (m) => m.halftoneCutConfig,
      ),
  },
  "column-slide": {
    load: () =>
      import("@/registry/remocn/column-slide").then((m) => ({
        default: m.ColumnSlide,
      })),
    loadConfig: () =>
      import("@/registry/remocn/column-slide/config").then(
        (m) => m.columnSlideConfig,
      ),
  },
  "ring-cut": {
    load: () =>
      import("@/registry/remocn/ring-cut").then((m) => ({
        default: m.RingCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ring-cut/config").then((m) => m.ringCutConfig),
  },
  "quadtree-mark": {
    load: () =>
      import("@/registry/remocn/quadtree-mark").then((m) => ({
        default: m.QuadtreeMark,
      })),
    loadConfig: () =>
      import("@/registry/remocn/quadtree-mark/config").then(
        (m) => m.quadtreeMarkConfig,
      ),
  },
  "raster-paint": {
    load: () =>
      import("@/registry/remocn/raster-paint").then((m) => ({
        default: m.RasterPaint,
      })),
    loadConfig: () =>
      import("@/registry/remocn/raster-paint/config").then(
        (m) => m.rasterPaintConfig,
      ),
  },
  "pixel-bars": {
    load: () =>
      import("@/registry/remocn/pixel-bars").then((m) => ({
        default: m.PixelBars,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pixel-bars/config").then(
        (m) => m.pixelBarsConfig,
      ),
  },
  "bracket-focus": {
    load: () =>
      import("@/registry/remocn/bracket-focus").then((m) => ({
        default: m.BracketFocus,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bracket-focus/config").then(
        (m) => m.bracketFocusConfig,
      ),
  },
  "crosshair-lock": {
    load: () =>
      import("@/registry/remocn/crosshair-lock").then((m) => ({
        default: m.CrosshairLock,
      })),
    loadConfig: () =>
      import("@/registry/remocn/crosshair-lock/config").then(
        (m) => m.crosshairLockConfig,
      ),
  },
  "measure-dim": {
    load: () =>
      import("@/registry/remocn/measure-dim").then((m) => ({
        default: m.MeasureDim,
      })),
    loadConfig: () =>
      import("@/registry/remocn/measure-dim/config").then(
        (m) => m.measureDimConfig,
      ),
  },
  "three-steps": {
    load: () =>
      import("@/registry/remocn/three-steps").then((m) => ({
        default: m.ThreeSteps,
      })),
    loadConfig: () =>
      import("@/registry/remocn/three-steps/config").then(
        (m) => m.threeStepsConfig,
      ),
  },
  "number-split": {
    load: () =>
      import("@/registry/remocn/number-split").then((m) => ({
        default: m.NumberSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/number-split/config").then(
        (m) => m.numberSplitConfig,
      ),
  },
  "radial-bars": {
    load: () =>
      import("@/registry/remocn/radial-bars").then((m) => ({
        default: m.RadialBars,
      })),
    loadConfig: () =>
      import("@/registry/remocn/radial-bars/config").then(
        (m) => m.radialBarsConfig,
      ),
  },
  "radar-compare": {
    load: () =>
      import("@/registry/remocn/radar-compare").then((m) => ({
        default: m.RadarCompare,
      })),
    loadConfig: () =>
      import("@/registry/remocn/radar-compare/config").then(
        (m) => m.radarCompareConfig,
      ),
  },
  "concentric-scale": {
    load: () =>
      import("@/registry/remocn/concentric-scale").then((m) => ({
        default: m.ConcentricScale,
      })),
    loadConfig: () =>
      import("@/registry/remocn/concentric-scale/config").then(
        (m) => m.concentricScaleConfig,
      ),
  },
  "changelog-scroll": {
    load: () =>
      import("@/registry/remocn/changelog-scroll").then((m) => ({
        default: m.ChangelogScroll,
      })),
    loadConfig: () =>
      import("@/registry/remocn/changelog-scroll/config").then(
        (m) => m.changelogScrollConfig,
      ),
  },
  "waveform-title": {
    load: () =>
      import("@/registry/remocn/waveform-title").then((m) => ({
        default: m.WaveformTitle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/waveform-title/config").then(
        (m) => m.waveformTitleConfig,
      ),
  },
  "line-relief": {
    load: () =>
      import("@/registry/remocn/line-relief").then((m) => ({
        default: m.LineRelief,
      })),
    loadConfig: () =>
      import("@/registry/remocn/line-relief/config").then(
        (m) => m.lineReliefConfig,
      ),
  },
  "sparkline-thread": {
    load: () =>
      import("@/registry/remocn/sparkline-thread").then((m) => ({
        default: m.SparklineThread,
      })),
    loadConfig: () =>
      import("@/registry/remocn/sparkline-thread/config").then(
        (m) => m.sparklineThreadConfig,
      ),
  },
  "area-compare": {
    load: () =>
      import("@/registry/remocn/area-compare").then((m) => ({
        default: m.AreaCompare,
      })),
    loadConfig: () =>
      import("@/registry/remocn/area-compare/config").then(
        (m) => m.areaCompareConfig,
      ),
  },
  "rank-climb": {
    load: () =>
      import("@/registry/remocn/rank-climb").then((m) => ({
        default: m.RankClimb,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rank-climb/config").then(
        (m) => m.rankClimbConfig,
      ),
  },
  "time-breakdown": {
    load: () =>
      import("@/registry/remocn/time-breakdown").then((m) => ({
        default: m.TimeBreakdown,
      })),
    loadConfig: () =>
      import("@/registry/remocn/time-breakdown/config").then(
        (m) => m.timeBreakdownConfig,
      ),
  },
  "index-list": {
    load: () =>
      import("@/registry/remocn/index-list").then((m) => ({
        default: m.IndexList,
      })),
    loadConfig: () =>
      import("@/registry/remocn/index-list/config").then(
        (m) => m.indexListConfig,
      ),
  },
  "grid-snap-poster": {
    load: () =>
      import("@/registry/remocn/grid-snap-poster").then((m) => ({
        default: m.GridSnapPoster,
      })),
    loadConfig: () =>
      import("@/registry/remocn/grid-snap-poster/config").then(
        (m) => m.gridSnapPosterConfig,
      ),
  },
  "spec-sheet": {
    load: () =>
      import("@/registry/remocn/spec-sheet").then((m) => ({
        default: m.SpecSheet,
      })),
    loadConfig: () =>
      import("@/registry/remocn/spec-sheet/config").then(
        (m) => m.specSheetConfig,
      ),
  },
  "toggle-on": {
    load: () =>
      import("@/registry/remocn/toggle-on").then((m) => ({
        default: m.ToggleOn,
      })),
    loadConfig: () =>
      import("@/registry/remocn/toggle-on/config").then(
        (m) => m.toggleOnConfig,
      ),
  },
  "rotary-dial": {
    load: () =>
      import("@/registry/remocn/rotary-dial").then((m) => ({
        default: m.RotaryDial,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rotary-dial/config").then(
        (m) => m.rotaryDialConfig,
      ),
  },
  "uptime-strip": {
    load: () =>
      import("@/registry/remocn/uptime-strip").then((m) => ({
        default: m.UptimeStrip,
      })),
    loadConfig: () =>
      import("@/registry/remocn/uptime-strip/config").then(
        (m) => m.uptimeStripConfig,
      ),
  },
  "quadrant-plot": {
    load: () =>
      import("@/registry/remocn/quadrant-plot").then((m) => ({
        default: m.QuadrantPlot,
      })),
    loadConfig: () =>
      import("@/registry/remocn/quadrant-plot/config").then(
        (m) => m.quadrantPlotConfig,
      ),
  },
  streamgraph: {
    load: () =>
      import("@/registry/remocn/streamgraph").then((m) => ({
        default: m.Streamgraph,
      })),
    loadConfig: () =>
      import("@/registry/remocn/streamgraph/config").then(
        (m) => m.streamgraphConfig,
      ),
  },
  "clock-sweep": {
    load: () =>
      import("@/registry/remocn/clock-sweep").then((m) => ({
        default: m.ClockSweep,
      })),
    loadConfig: () =>
      import("@/registry/remocn/clock-sweep/config").then(
        (m) => m.clockSweepConfig,
      ),
  },
  "ruler-scrub": {
    load: () =>
      import("@/registry/remocn/ruler-scrub").then((m) => ({
        default: m.RulerScrub,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ruler-scrub/config").then(
        (m) => m.rulerScrubConfig,
      ),
  },
  "timer-duel": {
    load: () =>
      import("@/registry/remocn/timer-duel").then((m) => ({
        default: m.TimerDuel,
      })),
    loadConfig: () =>
      import("@/registry/remocn/timer-duel/config").then(
        (m) => m.timerDuelConfig,
      ),
  },
  "contribution-heatmap": {
    load: () =>
      import("@/registry/remocn/contribution-heatmap").then((m) => ({
        default: m.ContributionHeatmap,
      })),
    loadConfig: () =>
      import("@/registry/remocn/contribution-heatmap/config").then(
        (m) => m.contributionHeatmapConfig,
      ),
  },
  "distribution-shift": {
    load: () =>
      import("@/registry/remocn/distribution-shift").then((m) => ({
        default: m.DistributionShift,
      })),
    loadConfig: () =>
      import("@/registry/remocn/distribution-shift/config").then(
        (m) => m.distributionShiftConfig,
      ),
  },
  "share-donut": {
    load: () =>
      import("@/registry/remocn/share-donut").then((m) => ({
        default: m.ShareDonut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/share-donut/config").then(
        (m) => m.shareDonutConfig,
      ),
  },
  "unit-grid": {
    load: () =>
      import("@/registry/remocn/unit-grid").then((m) => ({
        default: m.UnitGrid,
      })),
    loadConfig: () =>
      import("@/registry/remocn/unit-grid/config").then(
        (m) => m.unitGridConfig,
      ),
  },
  "led-ticker": {
    load: () =>
      import("@/registry/remocn/led-ticker").then((m) => ({
        default: m.LedTicker,
      })),
    loadConfig: () =>
      import("@/registry/remocn/led-ticker/config").then(
        (m) => m.ledTickerConfig,
      ),
  },
  "ripple-mark": {
    load: () =>
      import("@/registry/remocn/ripple-mark").then((m) => ({
        default: m.RippleMark,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ripple-mark/config").then(
        (m) => m.rippleMarkConfig,
      ),
  },
  "poster-crop": {
    load: () =>
      import("@/registry/remocn/poster-crop").then((m) => ({
        default: m.PosterCrop,
      })),
    loadConfig: () =>
      import("@/registry/remocn/poster-crop/config").then(
        (m) => m.posterCropConfig,
      ),
  },
  "collab-lockup": {
    load: () =>
      import("@/registry/remocn/collab-lockup").then((m) => ({
        default: m.CollabLockup,
      })),
    loadConfig: () =>
      import("@/registry/remocn/collab-lockup/config").then(
        (m) => m.collabLockupConfig,
      ),
  },
  "tagline-justify": {
    load: () =>
      import("@/registry/remocn/tagline-justify").then((m) => ({
        default: m.TaglineJustify,
      })),
    loadConfig: () =>
      import("@/registry/remocn/tagline-justify/config").then(
        (m) => m.taglineJustifyConfig,
      ),
  },
  "shape-cut": {
    load: () =>
      import("@/registry/remocn/shape-cut").then((m) => ({
        default: m.ShapeCut,
      })),
    loadConfig: () =>
      import("@/registry/remocn/shape-cut/config").then(
        (m) => m.shapeCutConfig,
      ),
  },
  "hairline-open": {
    load: () =>
      import("@/registry/remocn/hairline-open").then((m) => ({
        default: m.HairlineOpen,
      })),
    loadConfig: () =>
      import("@/registry/remocn/hairline-open/config").then(
        (m) => m.hairlineOpenConfig,
      ),
  },
  "diagonal-split": {
    load: () =>
      import("@/registry/remocn/diagonal-split").then((m) => ({
        default: m.DiagonalSplit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/diagonal-split/config").then(
        (m) => m.diagonalSplitConfig,
      ),
  },
  "slit-reveal": {
    load: () =>
      import("@/registry/remocn/slit-reveal").then((m) => ({
        default: m.SlitReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/slit-reveal/config").then(
        (m) => m.slitRevealConfig,
      ),
  },
  "wireframe-to-final": {
    load: () =>
      import("@/registry/remocn/wireframe-to-final").then((m) => ({
        default: m.WireframeToFinal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/wireframe-to-final/config").then(
        (m) => m.wireframeToFinalConfig,
      ),
  },
  "dot-field-morph": {
    load: () =>
      import("@/registry/remocn/dot-field-morph").then((m) => ({
        default: m.DotFieldMorph,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dot-field-morph/config").then(
        (m) => m.dotFieldMorphConfig,
      ),
  },
  "feature-chips-flow": {
    load: () =>
      import("@/registry/remocn/feature-chips-flow").then((m) => ({
        default: m.FeatureChipsFlow,
      })),
    loadConfig: () =>
      import("@/registry/remocn/feature-chips-flow/config").then(
        (m) => m.featureChipsFlowConfig,
      ),
  },
  "version-hero": {
    load: () =>
      import("@/registry/remocn/version-hero").then((m) => ({
        default: m.VersionHero,
      })),
    loadConfig: () =>
      import("@/registry/remocn/version-hero/config").then(
        (m) => m.versionHeroConfig,
      ),
  },
  "benchmark-race": {
    load: () =>
      import("@/registry/remocn/benchmark-race").then((m) => ({
        default: m.BenchmarkRace,
      })),
    loadConfig: () =>
      import("@/registry/remocn/benchmark-race/config").then(
        (m) => m.benchmarkRaceConfig,
      ),
  },
  "dot-globe": {
    load: () =>
      import("@/registry/remocn/dot-globe").then((m) => ({
        default: m.DotGlobe,
      })),
    loadConfig: () =>
      import("@/registry/remocn/dot-globe/config").then(
        (m) => m.dotGlobeConfig,
      ),
  },
  "waitlist-swarm": {
    load: () =>
      import("@/registry/remocn/waitlist-swarm").then((m) => ({
        default: m.WaitlistSwarm,
      })),
    loadConfig: () =>
      import("@/registry/remocn/waitlist-swarm/config").then(
        (m) => m.waitlistSwarmConfig,
      ),
  },
  "signal-resolve": {
    load: () =>
      import("@/registry/remocn/signal-resolve").then((m) => ({
        default: m.SignalResolve,
      })),
    loadConfig: () =>
      import("@/registry/remocn/signal-resolve/config").then(
        (m) => m.signalResolveConfig,
      ),
  },
  "keycap-press": {
    load: () =>
      import("@/registry/remocn/keycap-press").then((m) => ({
        default: m.KeycapPress,
      })),
    loadConfig: () =>
      import("@/registry/remocn/keycap-press/config").then(
        (m) => m.keycapPressConfig,
      ),
  },
  "launch-date": {
    load: () =>
      import("@/registry/remocn/launch-date").then((m) => ({
        default: m.LaunchDate,
      })),
    loadConfig: () =>
      import("@/registry/remocn/launch-date/config").then(
        (m) => m.launchDateConfig,
      ),
  },
  "light-trail-write": {
    load: () =>
      import("@/registry/remocn/light-trail-write").then((m) => ({
        default: m.LightTrailWrite,
      })),
    loadConfig: () =>
      import("@/registry/remocn/light-trail-write/config").then(
        (m) => m.lightTrailWriteConfig,
      ),
  },
  "color-bars": {
    load: () =>
      import("@/registry/remocn/color-bars").then((m) => ({
        default: m.ColorBars,
      })),
    loadConfig: () =>
      import("@/registry/remocn/color-bars/config").then(
        (m) => m.colorBarsConfig,
      ),
  },
  "grid-montage": {
    load: () =>
      import("@/registry/remocn/grid-montage").then((m) => ({
        default: m.GridMontage,
      })),
    loadConfig: () =>
      import("@/registry/remocn/grid-montage/config").then(
        (m) => m.gridMontageConfig,
      ),
  },
  "stat-sequence": {
    load: () =>
      import("@/registry/remocn/stat-sequence").then((m) => ({
        default: m.StatSequence,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stat-sequence/config").then(
        (m) => m.statSequenceConfig,
      ),
  },
  "quote-hero": {
    load: () =>
      import("@/registry/remocn/quote-hero").then((m) => ({
        default: m.QuoteHero,
      })),
    loadConfig: () =>
      import("@/registry/remocn/quote-hero/config").then(
        (m) => m.quoteHeroConfig,
      ),
  },
  "activity-rings": {
    load: () =>
      import("@/registry/remocn/activity-rings").then((m) => ({
        default: m.ActivityRings,
      })),
    loadConfig: () =>
      import("@/registry/remocn/activity-rings/config").then(
        (m) => m.activityRingsConfig,
      ),
  },
  "glass-lens": {
    load: () =>
      import("@/registry/remocn/glass-lens").then((m) => ({
        default: m.GlassLens,
      })),
    loadConfig: () =>
      import("@/registry/remocn/glass-lens/config").then(
        (m) => m.glassLensConfig,
      ),
  },
  "pill-morph": {
    load: () =>
      import("@/registry/remocn/pill-morph").then((m) => ({
        default: m.PillMorph,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pill-morph/config").then(
        (m) => m.pillMorphConfig,
      ),
  },
  "layered-cutout": {
    load: () =>
      import("@/registry/remocn/layered-cutout").then((m) => ({
        default: m.LayeredCutout,
      })),
    loadConfig: () =>
      import("@/registry/remocn/layered-cutout/config").then(
        (m) => m.layeredCutoutConfig,
      ),
  },
  "neural-pulse": {
    load: () =>
      import("@/registry/remocn/neural-pulse").then((m) => ({
        default: m.NeuralPulse,
      })),
    loadConfig: () =>
      import("@/registry/remocn/neural-pulse/config").then(
        (m) => m.neuralPulseConfig,
      ),
  },
  "bokeh-title": {
    load: () =>
      import("@/registry/remocn/bokeh-title").then((m) => ({
        default: m.BokehTitle,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bokeh-title/config").then(
        (m) => m.bokehTitleConfig,
      ),
  },
  "block-city": {
    load: () =>
      import("@/registry/remocn/block-city").then((m) => ({
        default: m.BlockCity,
      })),
    loadConfig: () =>
      import("@/registry/remocn/block-city/config").then(
        (m) => m.blockCityConfig,
      ),
  },
  "flash-sweep": {
    load: () =>
      import("@/registry/remocn/flash-sweep").then((m) => ({
        default: m.FlashSweep,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flash-sweep/config").then(
        (m) => m.flashSweepConfig,
      ),
  },
  "logo-construct": {
    load: () =>
      import("@/registry/remocn/logo-construct").then((m) => ({
        default: m.LogoConstruct,
      })),
    loadConfig: () =>
      import("@/registry/remocn/logo-construct/config").then(
        (m) => m.logoConstructConfig,
      ),
  },
  "ink-bloom": {
    load: () =>
      import("@/registry/remocn/ink-bloom").then((m) => ({
        default: m.InkBloom,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ink-bloom/config").then(
        (m) => m.inkBloomConfig,
      ),
  },
  "gravity-grid": {
    load: () =>
      import("@/registry/remocn/gravity-grid").then((m) => ({
        default: m.GravityGrid,
      })),
    loadConfig: () =>
      import("@/registry/remocn/gravity-grid/config").then(
        (m) => m.gravityGridConfig,
      ),
  },
  "number-mosaic": {
    load: () =>
      import("@/registry/remocn/number-mosaic").then((m) => ({
        default: m.NumberMosaic,
      })),
    loadConfig: () =>
      import("@/registry/remocn/number-mosaic/config").then(
        (m) => m.numberMosaicConfig,
      ),
  },
  "growth-line": {
    load: () =>
      import("@/registry/remocn/growth-line").then((m) => ({
        default: m.GrowthLine,
      })),
    loadConfig: () =>
      import("@/registry/remocn/growth-line/config").then(
        (m) => m.growthLineConfig,
      ),
  },
  countdown: {
    load: () =>
      import("@/registry/remocn/countdown").then((m) => ({
        default: m.Countdown,
      })),
    loadConfig: () =>
      import("@/registry/remocn/countdown/config").then(
        (m) => m.countdownConfig,
      ),
  },
  "paper-plane": {
    load: () =>
      import("@/registry/remocn/paper-plane").then((m) => ({
        default: m.PaperPlane,
      })),
    loadConfig: () =>
      import("@/registry/remocn/paper-plane/config").then(
        (m) => m.paperPlaneConfig,
      ),
  },
  "chaos-to-order": {
    load: () =>
      import("@/registry/remocn/chaos-to-order").then((m) => ({
        default: m.ChaosToOrder,
      })),
    loadConfig: () =>
      import("@/registry/remocn/chaos-to-order/config").then(
        (m) => m.chaosToOrderConfig,
      ),
  },
  "notification-avalanche": {
    load: () =>
      import("@/registry/remocn/notification-avalanche").then((m) => ({
        default: m.NotificationAvalanche,
      })),
    loadConfig: () =>
      import("@/registry/remocn/notification-avalanche/config").then(
        (m) => m.notificationAvalancheConfig,
      ),
  },
  "phone-scroll": {
    load: () =>
      import("@/registry/remocn/phone-scroll").then((m) => ({
        default: m.PhoneScroll,
      })),
    loadConfig: () =>
      import("@/registry/remocn/phone-scroll/config").then(
        (m) => m.phoneScrollConfig,
      ),
  },
  "screenshot-tour": {
    load: () =>
      import("@/registry/remocn/screenshot-tour").then((m) => ({
        default: m.ScreenshotTour,
      })),
    loadConfig: () =>
      import("@/registry/remocn/screenshot-tour/config").then(
        (m) => m.screenshotTourConfig,
      ),
  },
  "ui-callout": {
    load: () =>
      import("@/registry/remocn/ui-callout").then((m) => ({
        default: m.UiCallout,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ui-callout/config").then(
        (m) => m.uiCalloutConfig,
      ),
  },
  "theme-flip": {
    load: () =>
      import("@/registry/remocn/theme-flip").then((m) => ({
        default: m.ThemeFlip,
      })),
    loadConfig: () =>
      import("@/registry/remocn/theme-flip/config").then(
        (m) => m.themeFlipConfig,
      ),
  },
  "testimonial-stack": {
    load: () =>
      import("@/registry/remocn/testimonial-stack").then((m) => ({
        default: m.TestimonialStack,
      })),
    loadConfig: () =>
      import("@/registry/remocn/testimonial-stack/config").then(
        (m) => m.testimonialStackConfig,
      ),
  },
  "upvote-burst": {
    load: () =>
      import("@/registry/remocn/upvote-burst").then((m) => ({
        default: m.UpvoteBurst,
      })),
    loadConfig: () =>
      import("@/registry/remocn/upvote-burst/config").then(
        (m) => m.upvoteBurstConfig,
      ),
  },
  "bento-build": {
    load: () =>
      import("@/registry/remocn/bento-build").then((m) => ({
        default: m.BentoBuild,
      })),
    loadConfig: () =>
      import("@/registry/remocn/bento-build/config").then(
        (m) => m.bentoBuildConfig,
      ),
  },
  "pricing-reveal": {
    load: () =>
      import("@/registry/remocn/pricing-reveal").then((m) => ({
        default: m.PricingReveal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pricing-reveal/config").then(
        (m) => m.pricingRevealConfig,
      ),
  },
  "url-bar-cta": {
    load: () =>
      import("@/registry/remocn/url-bar-cta").then((m) => ({
        default: m.UrlBarCta,
      })),
    loadConfig: () =>
      import("@/registry/remocn/url-bar-cta/config").then(
        (m) => m.urlBarCtaConfig,
      ),
  },
  "table-filter": {
    load: () =>
      import("@/registry/remocn/table-filter").then((m) => ({
        default: m.TableFilter,
      })),
    loadConfig: () =>
      import("@/registry/remocn/table-filter/config").then(
        (m) => m.tableFilterConfig,
      ),
  },
  "flow-builder": {
    load: () =>
      import("@/registry/remocn/flow-builder").then((m) => ({
        default: m.FlowBuilder,
      })),
    loadConfig: () =>
      import("@/registry/remocn/flow-builder/config").then(
        (m) => m.flowBuilderConfig,
      ),
  },
  "multiplayer-cursors": {
    load: () =>
      import("@/registry/remocn/multiplayer-cursors").then((m) => ({
        default: m.MultiplayerCursors,
      })),
    loadConfig: () =>
      import("@/registry/remocn/multiplayer-cursors/config").then(
        (m) => m.multiplayerCursorsConfig,
      ),
  },
  "channel-reactions": {
    load: () =>
      import("@/registry/remocn/channel-reactions").then((m) => ({
        default: m.ChannelReactions,
      })),
    loadConfig: () =>
      import("@/registry/remocn/channel-reactions/config").then(
        (m) => m.channelReactionsConfig,
      ),
  },
  "deploy-pipeline": {
    load: () =>
      import("@/registry/remocn/deploy-pipeline").then((m) => ({
        default: m.DeployPipeline,
      })),
    loadConfig: () =>
      import("@/registry/remocn/deploy-pipeline/config").then(
        (m) => m.deployPipelineConfig,
      ),
  },
  "live-dashboard": {
    load: () =>
      import("@/registry/remocn/live-dashboard").then((m) => ({
        default: m.LiveDashboard,
      })),
    loadConfig: () =>
      import("@/registry/remocn/live-dashboard/config").then(
        (m) => m.liveDashboardConfig,
      ),
  },
  "file-dropzone": {
    load: () =>
      import("@/registry/remocn/file-dropzone").then((m) => ({
        default: m.FileDropzone,
      })),
    loadConfig: () =>
      import("@/registry/remocn/file-dropzone/config").then(
        (m) => m.fileDropzoneConfig,
      ),
  },
  "calendar-booking": {
    load: () =>
      import("@/registry/remocn/calendar-booking").then((m) => ({
        default: m.CalendarBooking,
      })),
    loadConfig: () =>
      import("@/registry/remocn/calendar-booking/config").then(
        (m) => m.calendarBookingConfig,
      ),
  },
  "ai-image-grid": {
    load: () =>
      import("@/registry/remocn/ai-image-grid").then((m) => ({
        default: m.AiImageGrid,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ai-image-grid/config").then(
        (m) => m.aiImageGridConfig,
      ),
  },
  "device-morph": {
    load: () =>
      import("@/registry/remocn/device-morph").then((m) => ({
        default: m.DeviceMorph,
      })),
    loadConfig: () =>
      import("@/registry/remocn/device-morph/config").then(
        (m) => m.deviceMorphConfig,
      ),
  },
  "pr-merge": {
    load: () =>
      import("@/registry/remocn/pr-merge").then((m) => ({
        default: m.PrMerge,
      })),
    loadConfig: () =>
      import("@/registry/remocn/pr-merge/config").then((m) => m.prMergeConfig),
  },
  "status-page": {
    load: () =>
      import("@/registry/remocn/status-page").then((m) => ({
        default: m.StatusPage,
      })),
    loadConfig: () =>
      import("@/registry/remocn/status-page/config").then(
        (m) => m.statusPageConfig,
      ),
  },
  "video-call": {
    load: () =>
      import("@/registry/remocn/video-call").then((m) => ({
        default: m.VideoCall,
      })),
    loadConfig: () =>
      import("@/registry/remocn/video-call/config").then(
        (m) => m.videoCallConfig,
      ),
  },
  "invite-team": {
    load: () =>
      import("@/registry/remocn/invite-team").then((m) => ({
        default: m.InviteTeam,
      })),
    loadConfig: () =>
      import("@/registry/remocn/invite-team/config").then(
        (m) => m.inviteTeamConfig,
      ),
  },
  "timeline-editor": {
    load: () =>
      import("@/registry/remocn/timeline-editor").then((m) => ({
        default: m.TimelineEditor,
      })),
    loadConfig: () =>
      import("@/registry/remocn/timeline-editor/config").then(
        (m) => m.timelineEditorConfig,
      ),
  },
  "ride-tracking": {
    load: () =>
      import("@/registry/remocn/ride-tracking").then((m) => ({
        default: m.RideTracking,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ride-tracking/config").then(
        (m) => m.rideTrackingConfig,
      ),
  },
  "mobile-paywall": {
    load: () =>
      import("@/registry/remocn/mobile-paywall").then((m) => ({
        default: m.MobilePaywall,
      })),
    loadConfig: () =>
      import("@/registry/remocn/mobile-paywall/config").then(
        (m) => m.mobilePaywallConfig,
      ),
  },
  "sheet-formula": {
    load: () =>
      import("@/registry/remocn/sheet-formula").then((m) => ({
        default: m.SheetFormula,
      })),
    loadConfig: () =>
      import("@/registry/remocn/sheet-formula/config").then(
        (m) => m.sheetFormulaConfig,
      ),
  },
  "whats-new-modal": {
    load: () =>
      import("@/registry/remocn/whats-new-modal").then((m) => ({
        default: m.WhatsNewModal,
      })),
    loadConfig: () =>
      import("@/registry/remocn/whats-new-modal/config").then(
        (m) => m.whatsNewModalConfig,
      ),
  },
  "money-send": {
    load: () =>
      import("@/registry/remocn/money-send").then((m) => ({
        default: m.MoneySend,
      })),
    loadConfig: () =>
      import("@/registry/remocn/money-send/config").then(
        (m) => m.moneySendConfig,
      ),
  },
  "stock-scrub": {
    load: () =>
      import("@/registry/remocn/stock-scrub").then((m) => ({
        default: m.StockScrub,
      })),
    loadConfig: () =>
      import("@/registry/remocn/stock-scrub/config").then(
        (m) => m.stockScrubConfig,
      ),
  },
  "card-create": {
    load: () =>
      import("@/registry/remocn/card-create").then((m) => ({
        default: m.CardCreate,
      })),
    loadConfig: () =>
      import("@/registry/remocn/card-create/config").then(
        (m) => m.cardCreateConfig,
      ),
  },
  "reels-feed": {
    load: () =>
      import("@/registry/remocn/reels-feed").then((m) => ({
        default: m.ReelsFeed,
      })),
    loadConfig: () =>
      import("@/registry/remocn/reels-feed/config").then(
        (m) => m.reelsFeedConfig,
      ),
  },
  "swipe-deck": {
    load: () =>
      import("@/registry/remocn/swipe-deck").then((m) => ({
        default: m.SwipeDeck,
      })),
    loadConfig: () =>
      import("@/registry/remocn/swipe-deck/config").then(
        (m) => m.swipeDeckConfig,
      ),
  },
  "streak-reward": {
    load: () =>
      import("@/registry/remocn/streak-reward").then((m) => ({
        default: m.StreakReward,
      })),
    loadConfig: () =>
      import("@/registry/remocn/streak-reward/config").then(
        (m) => m.streakRewardConfig,
      ),
  },
  "rating-laurel": {
    load: () =>
      import("@/registry/remocn/rating-laurel").then((m) => ({
        default: m.RatingLaurel,
      })),
    loadConfig: () =>
      import("@/registry/remocn/rating-laurel/config").then(
        (m) => m.ratingLaurelConfig,
      ),
  },
  "ai-answer-sources": {
    load: () =>
      import("@/registry/remocn/ai-answer-sources").then((m) => ({
        default: m.AiAnswerSources,
      })),
    loadConfig: () =>
      import("@/registry/remocn/ai-answer-sources/config").then(
        (m) => m.aiAnswerSourcesConfig,
      ),
  },
  "now-playing": {
    load: () =>
      import("@/registry/remocn/now-playing").then((m) => ({
        default: m.NowPlaying,
      })),
    loadConfig: () =>
      import("@/registry/remocn/now-playing/config").then(
        (m) => m.nowPlayingConfig,
      ),
  },
  "year-in-review": {
    load: () =>
      import("@/registry/remocn/year-in-review").then((m) => ({
        default: m.YearInReview,
      })),
    loadConfig: () =>
      import("@/registry/remocn/year-in-review/config").then(
        (m) => m.yearInReviewConfig,
      ),
  },
  "video-watch-page": {
    load: () =>
      import("@/registry/remocn/video-watch-page").then((m) => ({
        default: m.VideoWatchPage,
      })),
    loadConfig: () =>
      import("@/registry/remocn/video-watch-page/config").then(
        (m) => m.videoWatchPageConfig,
      ),
  },
  "voice-agent": {
    load: () =>
      import("@/registry/remocn/voice-agent").then((m) => ({
        default: m.VoiceAgent,
      })),
    loadConfig: () =>
      import("@/registry/remocn/voice-agent/config").then(
        (m) => m.voiceAgentConfig,
      ),
  },
  "prompt-to-app": {
    load: () =>
      import("@/registry/remocn/prompt-to-app").then((m) => ({
        default: m.PromptToApp,
      })),
    loadConfig: () =>
      import("@/registry/remocn/prompt-to-app/config").then(
        (m) => m.promptToAppConfig,
      ),
  },
  "browser-extension": {
    load: () =>
      import("@/registry/remocn/browser-extension").then((m) => ({
        default: m.BrowserExtension,
      })),
    loadConfig: () =>
      import("@/registry/remocn/browser-extension/config").then(
        (m) => m.browserExtensionConfig,
      ),
  },
  "app-store-listing": {
    load: () =>
      import("@/registry/remocn/app-store-listing").then((m) => ({
        default: m.AppStoreListing,
      })),
    loadConfig: () =>
      import("@/registry/remocn/app-store-listing/config").then(
        (m) => m.appStoreListingConfig,
      ),
  },
  "live-activity": {
    load: () =>
      import("@/registry/remocn/live-activity").then((m) => ({
        default: m.LiveActivity,
      })),
    loadConfig: () =>
      import("@/registry/remocn/live-activity/config").then(
        (m) => m.liveActivityConfig,
      ),
  },
  "home-widget": {
    load: () =>
      import("@/registry/remocn/home-widget").then((m) => ({
        default: m.HomeWidget,
      })),
    loadConfig: () =>
      import("@/registry/remocn/home-widget/config").then(
        (m) => m.homeWidgetConfig,
      ),
  },
  "cart-add": {
    load: () =>
      import("@/registry/remocn/cart-add").then((m) => ({
        default: m.CartAdd,
      })),
    loadConfig: () =>
      import("@/registry/remocn/cart-add/config").then((m) => m.cartAddConfig),
  },
  "coupon-apply": {
    load: () =>
      import("@/registry/remocn/coupon-apply").then((m) => ({
        default: m.CouponApply,
      })),
    loadConfig: () =>
      import("@/registry/remocn/coupon-apply/config").then(
        (m) => m.couponApplyConfig,
      ),
  },
  "invoice-paid": {
    load: () =>
      import("@/registry/remocn/invoice-paid").then((m) => ({
        default: m.InvoicePaid,
      })),
    loadConfig: () =>
      import("@/registry/remocn/invoice-paid/config").then(
        (m) => m.invoicePaidConfig,
      ),
  },
  "roadmap-timeline": {
    load: () =>
      import("@/registry/remocn/roadmap-timeline").then((m) => ({
        default: m.RoadmapTimeline,
      })),
    loadConfig: () =>
      import("@/registry/remocn/roadmap-timeline/config").then(
        (m) => m.roadmapTimelineConfig,
      ),
  },
  "analytics-funnel": {
    load: () =>
      import("@/registry/remocn/analytics-funnel").then((m) => ({
        default: m.AnalyticsFunnel,
      })),
    loadConfig: () =>
      import("@/registry/remocn/analytics-funnel/config").then(
        (m) => m.analyticsFunnelConfig,
      ),
  },
  "world-signups": {
    load: () =>
      import("@/registry/remocn/world-signups").then((m) => ({
        default: m.WorldSignups,
      })),
    loadConfig: () =>
      import("@/registry/remocn/world-signups/config").then(
        (m) => m.worldSignupsConfig,
      ),
  },
  "social-scheduler": {
    load: () =>
      import("@/registry/remocn/social-scheduler").then((m) => ({
        default: m.SocialScheduler,
      })),
    loadConfig: () =>
      import("@/registry/remocn/social-scheduler/config").then(
        (m) => m.socialSchedulerConfig,
      ),
  },
  "feature-flag-rollout": {
    load: () =>
      import("@/registry/remocn/feature-flag-rollout").then((m) => ({
        default: m.FeatureFlagRollout,
      })),
    loadConfig: () =>
      import("@/registry/remocn/feature-flag-rollout/config").then(
        (m) => m.featureFlagRolloutConfig,
      ),
  },
  "redline-measure": {
    load: () =>
      import("@/registry/remocn/redline-measure").then((m) => ({
        default: m.RedlineMeasure,
      })),
    loadConfig: () =>
      import("@/registry/remocn/redline-measure/config").then(
        (m) => m.redlineMeasureConfig,
      ),
  },
  "audit-boxes": {
    load: () =>
      import("@/registry/remocn/audit-boxes").then((m) => ({
        default: m.AuditBoxes,
      })),
    loadConfig: () =>
      import("@/registry/remocn/audit-boxes/config").then(
        (m) => m.auditBoxesConfig,
      ),
  },
  "scan-fix": {
    load: () =>
      import("@/registry/remocn/scan-fix").then((m) => ({
        default: m.ScanFix,
      })),
    loadConfig: () =>
      import("@/registry/remocn/scan-fix/config").then((m) => m.scanFixConfig),
  },
  "token-tags": {
    load: () =>
      import("@/registry/remocn/token-tags").then((m) => ({
        default: m.TokenTags,
      })),
    loadConfig: () =>
      import("@/registry/remocn/token-tags/config").then(
        (m) => m.tokenTagsConfig,
      ),
  },
  "layout-guides": {
    load: () =>
      import("@/registry/remocn/layout-guides").then((m) => ({
        default: m.LayoutGuides,
      })),
    loadConfig: () =>
      import("@/registry/remocn/layout-guides/config").then(
        (m) => m.layoutGuidesConfig,
      ),
  },
  "design-audit": {
    load: () =>
      import("@/registry/remocn/design-audit").then((m) => ({
        default: m.DesignAudit,
      })),
    loadConfig: () =>
      import("@/registry/remocn/design-audit/config").then(
        (m) => m.designAuditConfig,
      ),
  },
};

const configCache = new Map<string, Promise<ResolvedComponentConfig>>();

export function loadComponentConfig(
  slug: string,
): Promise<ResolvedComponentConfig> {
  let promise = configCache.get(slug);
  if (!promise) {
    const entry = registry[slug];
    if (!entry) throw new Error(`Unknown registry entry: ${slug}`);
    promise = entry.loadConfig().then((config) => resolveConfig(slug, config));
    configCache.set(slug, promise);
  }
  return promise;
}

export default registry;
