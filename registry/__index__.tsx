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
