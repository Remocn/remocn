import type React from "react";
import { type ComponentConfig, SHARED_CONTROLS } from "@/lib/customizer-config";

import { animatedBarChartConfig } from "@/registry/remocn/animated-bar-chart/config";
import { animatedLineChartConfig } from "@/registry/remocn/animated-line-chart/config";
import { backdropConfig } from "@/registry/remocn/backdrop/config";
import { blurOutUpConfig } from "@/registry/remocn/blur-out-up/config";
import { bottomUpLettersConfig } from "@/registry/remocn/bottom-up-letters/config";
import { chatGptConfig } from "@/registry/remocn/chat-gpt/config";
import { chatToPreviewLayoutConfig } from "@/registry/remocn/chat-to-preview-layout/config";
import { claudeChatConfig } from "@/registry/remocn/claude-chat/config";
import { claudeCodeConfig } from "@/registry/remocn/claude-code/config";
import { confettiConfig } from "@/registry/remocn/confetti/config";
import { dataFlowPipesConfig } from "@/registry/remocn/data-flow-pipes/config";
import { ditherDissolveConfig } from "@/registry/remocn/dither-dissolve/config";
import { driftConfig } from "@/registry/remocn/drift/config";
import { dynamicGridConfig } from "@/registry/remocn/dynamic-grid/config";
import { ecosystemConstellationConfig } from "@/registry/remocn/ecosystem-constellation/config";
import { fadeThroughConfig } from "@/registry/remocn/fade-through/config";
import { focusBlurResolveConfig } from "@/registry/remocn/focus-blur-resolve/config";
import { focusPullConfig } from "@/registry/remocn/focus-pull/config";
import { githubSponsorsConfig } from "@/registry/remocn/github-sponsors/config";
import { githubStarsConfig } from "@/registry/remocn/github-stars/config";
import { glassCodeBlockConfig } from "@/registry/remocn/glass-code-block/config";
import { glassCodeWalkConfig } from "@/registry/remocn/glass-code-walk/config";
import { grainDissolveConfig } from "@/registry/remocn/grain-dissolve/config";
import { iconAlertTriangleConfig } from "@/registry/remocn/icon-alert-triangle/config";
import { iconArrowDownConfig } from "@/registry/remocn/icon-arrow-down/config";
import { iconArrowLeftConfig } from "@/registry/remocn/icon-arrow-left/config";
import { iconArrowRightConfig } from "@/registry/remocn/icon-arrow-right/config";
import { iconArrowUpConfig } from "@/registry/remocn/icon-arrow-up/config";
import { iconBellConfig } from "@/registry/remocn/icon-bell/config";
import { iconBookmarkConfig } from "@/registry/remocn/icon-bookmark/config";
import { iconCameraConfig } from "@/registry/remocn/icon-camera/config";
import { iconCheckCircleConfig } from "@/registry/remocn/icon-check-circle/config";
import { iconCheckConfig } from "@/registry/remocn/icon-check/config";
import { iconChevronDownConfig } from "@/registry/remocn/icon-chevron-down/config";
import { iconChevronLeftConfig } from "@/registry/remocn/icon-chevron-left/config";
import { iconChevronRightConfig } from "@/registry/remocn/icon-chevron-right/config";
import { iconChevronUpConfig } from "@/registry/remocn/icon-chevron-up/config";
import { iconCopyConfig } from "@/registry/remocn/icon-copy/config";
import { iconDownloadConfig } from "@/registry/remocn/icon-download/config";
import { iconExternalLinkConfig } from "@/registry/remocn/icon-external-link/config";
import { iconEyeOffConfig } from "@/registry/remocn/icon-eye-off/config";
import { iconEyeConfig } from "@/registry/remocn/icon-eye/config";
import { iconFilterConfig } from "@/registry/remocn/icon-filter/config";
import { iconFlameConfig } from "@/registry/remocn/icon-flame/config";
import { iconHeartConfig } from "@/registry/remocn/icon-heart/config";
import { iconImageConfig } from "@/registry/remocn/icon-image/config";
import { iconInfoConfig } from "@/registry/remocn/icon-info/config";
import { iconKeyConfig } from "@/registry/remocn/icon-key/config";
import { iconLayoutGridConfig } from "@/registry/remocn/icon-layout-grid/config";
import { iconLinkConfig } from "@/registry/remocn/icon-link/config";
import { iconLoaderConfig } from "@/registry/remocn/icon-loader/config";
import { iconLockConfig } from "@/registry/remocn/icon-lock/config";
import { iconLogOutConfig } from "@/registry/remocn/icon-log-out/config";
import { iconMailConfig } from "@/registry/remocn/icon-mail/config";
import { iconMaximizeConfig } from "@/registry/remocn/icon-maximize/config";
import { iconMenuConfig } from "@/registry/remocn/icon-menu/config";
import { iconMessageCircleConfig } from "@/registry/remocn/icon-message-circle/config";
import { iconMicConfig } from "@/registry/remocn/icon-mic/config";
import { iconMoreHorizontalConfig } from "@/registry/remocn/icon-more-horizontal/config";
import { iconPartyPopperConfig } from "@/registry/remocn/icon-party-popper/config";
import { iconPauseConfig } from "@/registry/remocn/icon-pause/config";
import { iconPencilConfig } from "@/registry/remocn/icon-pencil/config";
import { iconPlayConfig } from "@/registry/remocn/icon-play/config";
import { iconPlusConfig } from "@/registry/remocn/icon-plus/config";
import { iconRefreshCwConfig } from "@/registry/remocn/icon-refresh-cw/config";
import { iconSaveConfig } from "@/registry/remocn/icon-save/config";
import { iconSearchConfig } from "@/registry/remocn/icon-search/config";
import { iconSendConfig } from "@/registry/remocn/icon-send/config";
import { iconSettingsConfig } from "@/registry/remocn/icon-settings/config";
import { iconShare2Config } from "@/registry/remocn/icon-share-2/config";
import { iconSkipForwardConfig } from "@/registry/remocn/icon-skip-forward/config";
import { iconSparklesConfig } from "@/registry/remocn/icon-sparkles/config";
import { iconStarConfig } from "@/registry/remocn/icon-star/config";
import { iconThumbsUpConfig } from "@/registry/remocn/icon-thumbs-up/config";
import { iconTrashConfig } from "@/registry/remocn/icon-trash/config";
import { iconUploadConfig } from "@/registry/remocn/icon-upload/config";
import { iconUserPlusConfig } from "@/registry/remocn/icon-user-plus/config";
import { iconUserConfig } from "@/registry/remocn/icon-user/config";
import { iconUsersConfig } from "@/registry/remocn/icon-users/config";
import { iconVideoConfig } from "@/registry/remocn/icon-video/config";
import { iconVolume2Config } from "@/registry/remocn/icon-volume-2/config";
import { iconVolumeXConfig } from "@/registry/remocn/icon-volume-x/config";
import { iconXConfig } from "@/registry/remocn/icon-x/config";
import { iconZapConfig } from "@/registry/remocn/icon-zap/config";
import { infiniteBentoPanConfig } from "@/registry/remocn/infinite-bento-pan/config";
import { infiniteMarqueeConfig } from "@/registry/remocn/infinite-marquee/config";
import { inlineHighlightConfig } from "@/registry/remocn/inline-highlight/config";
import { kineticCenterBuildConfig } from "@/registry/remocn/kinetic-center-build/config";
import { lineByLineSlideConfig } from "@/registry/remocn/line-by-line-slide/config";
import { liveCodeCompilationConfig } from "@/registry/remocn/live-code-compilation/config";
import { logoEnterConfig } from "@/registry/remocn/logo-enter/config";
import { markerHighlightConfig } from "@/registry/remocn/marker-highlight/config";
import { maskRevealUpConfig } from "@/registry/remocn/mask-reveal-up/config";
import { matrixDecodeConfig } from "@/registry/remocn/matrix-decode/config";
import { meshGradientBgConfig } from "@/registry/remocn/mesh-gradient-bg/config";
import { microScaleFadeConfig } from "@/registry/remocn/micro-scale-fade/config";
import { numberWheelConfig } from "@/registry/remocn/number-wheel/config";
import { opencodeConfig } from "@/registry/remocn/opencode/config";
import { perCharacterRiseConfig } from "@/registry/remocn/per-character-rise/config";
import { perWordCrossfadeConfig } from "@/registry/remocn/per-word-crossfade/config";
import { perlinDissolveConfig } from "@/registry/remocn/perlin-dissolve/config";
import { perspectiveMarqueeConfig } from "@/registry/remocn/perspective-marquee/config";
import { progressStepsConfig } from "@/registry/remocn/progress-steps/config";
import { pushThroughConfig } from "@/registry/remocn/push-through/config";
import { rgbGlitchTextConfig } from "@/registry/remocn/rgb-glitch-text/config";
import { rippleZoomConfig } from "@/registry/remocn/ripple-zoom/config";
import { rollingNumberConfig } from "@/registry/remocn/rolling-number/config";
import { rolodexFlipConfig } from "@/registry/remocn/rolodex-flip/config";
import { scaleDownFadeConfig } from "@/registry/remocn/scale-down-fade/config";
import { shaderColorPanelsConfig } from "@/registry/remocn/shader-color-panels/config";
import { shaderDitheringConfig } from "@/registry/remocn/shader-dithering/config";
import { shaderDotOrbitConfig } from "@/registry/remocn/shader-dot-orbit/config";
import { shaderGodRaysConfig } from "@/registry/remocn/shader-god-rays/config";
import { shaderGrainGradientConfig } from "@/registry/remocn/shader-grain-gradient/config";
import { shaderLiquidMetalConfig } from "@/registry/remocn/shader-liquid-metal/config";
import { shaderMeshGradientConfig } from "@/registry/remocn/shader-mesh-gradient/config";
import { shaderMetaballsConfig } from "@/registry/remocn/shader-metaballs/config";
import { shaderNeuroNoiseConfig } from "@/registry/remocn/shader-neuro-noise/config";
import { shaderPerlinNoiseConfig } from "@/registry/remocn/shader-perlin-noise/config";
import { shaderPulsingBorderConfig } from "@/registry/remocn/shader-pulsing-border/config";
import { shaderSimplexNoiseConfig } from "@/registry/remocn/shader-simplex-noise/config";
import { shaderSmokeRingConfig } from "@/registry/remocn/shader-smoke-ring/config";
import { shaderSpiralConfig } from "@/registry/remocn/shader-spiral/config";
import { shaderSwirlConfig } from "@/registry/remocn/shader-swirl/config";
import { shaderVoronoiConfig } from "@/registry/remocn/shader-voronoi/config";
import { shaderWarpConfig } from "@/registry/remocn/shader-warp/config";
import { shaderWaterConfig } from "@/registry/remocn/shader-water/config";
import { sharedAxisYConfig } from "@/registry/remocn/shared-axis-y/config";
import { sharedAxisZConfig } from "@/registry/remocn/shared-axis-z/config";
import { shimmerSweepConfig } from "@/registry/remocn/shimmer-sweep/config";
import { shortSlideDownConfig } from "@/registry/remocn/short-slide-down/config";
import { shortSlideRightConfig } from "@/registry/remocn/short-slide-right/config";
import { simulatedCursorConfig } from "@/registry/remocn/simulated-cursor/config";
import { slotMachineRollConfig } from "@/registry/remocn/slot-machine-roll/config";
import { smokeDissolveConfig } from "@/registry/remocn/smoke-dissolve/config";
import { softBlurInConfig } from "@/registry/remocn/soft-blur-in/config";
import { spotlightCardConfig } from "@/registry/remocn/spotlight-card/config";
import { springScaleInConfig } from "@/registry/remocn/spring-scale-in/config";
import { staggeredFadeUpConfig } from "@/registry/remocn/staggered-fade-up/config";
import { strikethroughReplaceConfig } from "@/registry/remocn/strikethrough-replace/config";
import { swirlDissolveConfig } from "@/registry/remocn/swirl-dissolve/config";
import { terminalCursorZoomConfig } from "@/registry/remocn/terminal-cursor-zoom/config";
import { terminalSimulatorConfig } from "@/registry/remocn/terminal-simulator/config";
import { topDownLettersConfig } from "@/registry/remocn/top-down-letters/config";
import { trackingInConfig } from "@/registry/remocn/tracking-in/config";
import { typewriterConfig } from "@/registry/remocn/typewriter/config";
import { v0Config } from "@/registry/remocn/v0/config";
import { valueSwapConfig } from "@/registry/remocn/value-swap/config";
import { warpDissolveConfig } from "@/registry/remocn/warp-dissolve/config";
import { waveWipeConfig } from "@/registry/remocn/wave-wipe/config";
import { whipPanConfig } from "@/registry/remocn/whip-pan/config";
import { xFollowCardConfig } from "@/registry/remocn/x-follow-card/config";
import { xFollowersOverviewConfig } from "@/registry/remocn/x-followers-overview/config";
import { zoomBlurConfig } from "@/registry/remocn/zoom-blur/config";
import { accordionConfig } from "@/registry/remocn-ui/accordion/config";
import { alertDialogConfig } from "@/registry/remocn-ui/alert-dialog/config";
import { blurInConfig } from "@/registry/remocn-ui/blur-in/config";
import { buttonConfig } from "@/registry/remocn-ui/button/config";
import { caretConfig } from "@/registry/remocn-ui/caret/config";
import { checkboxConfig } from "@/registry/remocn-ui/checkbox/config";
import { comboboxConfig } from "@/registry/remocn-ui/combobox/config";
import { commandMenuConfig } from "@/registry/remocn-ui/command-menu/config";
import { commandMenuItemConfig } from "@/registry/remocn-ui/command-menu-item/config";
import { contextMenuConfig } from "@/registry/remocn-ui/context-menu/config";
import { cursorConfig } from "@/registry/remocn-ui/cursor/config";
import { dialogConfig } from "@/registry/remocn-ui/dialog/config";
import { drawerConfig } from "@/registry/remocn-ui/drawer/config";
import { dropdownMenuConfig } from "@/registry/remocn-ui/dropdown-menu/config";
import { dropdownMenuItemConfig } from "@/registry/remocn-ui/dropdown-menu-item/config";
import { inputConfig } from "@/registry/remocn-ui/input/config";
import { messageBubbleConfig } from "@/registry/remocn-ui/message-bubble/config";
import { popoverConfig } from "@/registry/remocn-ui/popover/config";
import { progressConfig } from "@/registry/remocn-ui/progress/config";
import { radioConfig } from "@/registry/remocn-ui/radio/config";
import { resizableConfig } from "@/registry/remocn-ui/resizable/config";
import { selectConfig } from "@/registry/remocn-ui/select/config";
import { selectItemConfig } from "@/registry/remocn-ui/select-item/config";
import { sheetConfig } from "@/registry/remocn-ui/sheet/config";
import { skeletonConfig } from "@/registry/remocn-ui/skeleton/config";
import { skeletonBlockConfig } from "@/registry/remocn-ui/skeleton-block/config";
import { sliderConfig } from "@/registry/remocn-ui/slider/config";
import { spinnerConfig } from "@/registry/remocn-ui/spinner/config";
import { stepperConfig } from "@/registry/remocn-ui/stepper/config";
import { switchConfig } from "@/registry/remocn-ui/switch/config";
import { tabsConfig } from "@/registry/remocn-ui/tabs/config";
import { toastConfig } from "@/registry/remocn-ui/toast/config";
import { toggleGroupConfig } from "@/registry/remocn-ui/toggle-group/config";
import { tooltipConfig } from "@/registry/remocn-ui/tooltip/config";
import { typingIndicatorConfig } from "@/registry/remocn-ui/typing-indicator/config";

export interface RegistryEntry {
  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
  load: () => Promise<{ default: React.ComponentType<any> }>;
  config: ComponentConfig;
}

const registry: Record<string, RegistryEntry> = {
  "soft-blur-in": {
    load: () =>
      import("@/registry/remocn/soft-blur-in").then((m) => ({
        default: m.SoftBlurIn,
      })),
    config: softBlurInConfig,
  },
  "per-character-rise": {
    load: () =>
      import("@/registry/remocn/per-character-rise").then((m) => ({
        default: m.PerCharacterRise,
      })),
    config: perCharacterRiseConfig,
  },
  "bottom-up-letters": {
    load: () =>
      import("@/registry/remocn/bottom-up-letters").then((m) => ({
        default: m.BottomUpLetters,
      })),
    config: bottomUpLettersConfig,
  },
  "top-down-letters": {
    load: () =>
      import("@/registry/remocn/top-down-letters").then((m) => ({
        default: m.TopDownLetters,
      })),
    config: topDownLettersConfig,
  },
  "spring-scale-in": {
    load: () =>
      import("@/registry/remocn/spring-scale-in").then((m) => ({
        default: m.SpringScaleIn,
      })),
    config: springScaleInConfig,
  },
  "micro-scale-fade": {
    load: () =>
      import("@/registry/remocn/micro-scale-fade").then((m) => ({
        default: m.MicroScaleFade,
      })),
    config: microScaleFadeConfig,
  },
  "scale-down-fade": {
    load: () =>
      import("@/registry/remocn/scale-down-fade").then((m) => ({
        default: m.ScaleDownFade,
      })),
    config: scaleDownFadeConfig,
  },
  "blur-out-up": {
    load: () =>
      import("@/registry/remocn/blur-out-up").then((m) => ({
        default: m.BlurOutUp,
      })),
    config: blurOutUpConfig,
  },
  "focus-blur-resolve": {
    load: () =>
      import("@/registry/remocn/focus-blur-resolve").then((m) => ({
        default: m.FocusBlurResolve,
      })),
    config: focusBlurResolveConfig,
  },
  "line-by-line-slide": {
    load: () =>
      import("@/registry/remocn/line-by-line-slide").then((m) => ({
        default: m.LineByLineSlide,
      })),
    config: lineByLineSlideConfig,
  },
  "per-word-crossfade": {
    load: () =>
      import("@/registry/remocn/per-word-crossfade").then((m) => ({
        default: m.PerWordCrossfade,
      })),
    config: perWordCrossfadeConfig,
  },
  "fade-through": {
    load: () =>
      import("@/registry/remocn/fade-through").then((m) => ({
        default: m.FadeThrough,
      })),
    config: fadeThroughConfig,
  },
  "shared-axis-y": {
    load: () =>
      import("@/registry/remocn/shared-axis-y").then((m) => ({
        default: m.SharedAxisY,
      })),
    config: sharedAxisYConfig,
  },
  "shared-axis-z": {
    load: () =>
      import("@/registry/remocn/shared-axis-z").then((m) => ({
        default: m.SharedAxisZ,
      })),
    config: sharedAxisZConfig,
  },
  "short-slide-right": {
    load: () =>
      import("@/registry/remocn/short-slide-right").then((m) => ({
        default: m.ShortSlideRight,
      })),
    config: shortSlideRightConfig,
  },
  "kinetic-center-build": {
    load: () =>
      import("@/registry/remocn/kinetic-center-build").then((m) => ({
        default: m.KineticCenterBuild,
      })),
    config: kineticCenterBuildConfig,
  },
  "short-slide-down": {
    load: () =>
      import("@/registry/remocn/short-slide-down").then((m) => ({
        default: m.ShortSlideDown,
      })),
    config: shortSlideDownConfig,
  },
  typewriter: {
    load: () =>
      import("@/registry/remocn/typewriter").then((m) => ({
        default: m.Typewriter,
      })),
    config: typewriterConfig,
  },
  "inline-highlight": {
    load: () =>
      import("@/registry/remocn/inline-highlight").then((m) => ({
        default: m.InlineHighlight,
      })),
    config: inlineHighlightConfig,
  },
  "strikethrough-replace": {
    load: () =>
      import("@/registry/remocn/strikethrough-replace").then((m) => ({
        default: m.StrikethroughReplace,
      })),
    config: strikethroughReplaceConfig,
  },
  "staggered-fade-up": {
    load: () =>
      import("@/registry/remocn/staggered-fade-up").then((m) => ({
        default: m.StaggeredFadeUp,
      })),
    config: staggeredFadeUpConfig,
  },
  "mask-reveal-up": {
    load: () =>
      import("@/registry/remocn/mask-reveal-up").then((m) => ({
        default: m.MaskRevealUp,
      })),
    config: maskRevealUpConfig,
  },
  "tracking-in": {
    load: () =>
      import("@/registry/remocn/tracking-in").then((m) => ({
        default: m.TrackingIn,
      })),
    config: trackingInConfig,
  },
  "shimmer-sweep": {
    load: () =>
      import("@/registry/remocn/shimmer-sweep").then((m) => ({
        default: m.ShimmerSweep,
      })),
    config: shimmerSweepConfig,
  },
  "marker-highlight": {
    load: () =>
      import("@/registry/remocn/marker-highlight").then((m) => ({
        default: m.MarkerHighlight,
      })),
    config: markerHighlightConfig,
  },
  "slot-machine-roll": {
    load: () =>
      import("@/registry/remocn/slot-machine-roll").then((m) => ({
        default: m.SlotMachineRoll,
      })),
    config: slotMachineRollConfig,
  },
  "matrix-decode": {
    load: () =>
      import("@/registry/remocn/matrix-decode").then((m) => ({
        default: m.MatrixDecode,
      })),
    config: matrixDecodeConfig,
  },
  "rgb-glitch-text": {
    load: () =>
      import("@/registry/remocn/rgb-glitch-text").then((m) => ({
        default: m.RGBGlitchText,
      })),
    config: rgbGlitchTextConfig,
  },
  "infinite-marquee": {
    load: () =>
      import("@/registry/remocn/infinite-marquee").then((m) => ({
        default: m.InfiniteMarquee,
      })),
    config: infiniteMarqueeConfig,
  },
  "perspective-marquee": {
    load: () =>
      import("@/registry/remocn/perspective-marquee").then((m) => ({
        default: m.PerspectiveMarquee,
      })),
    config: perspectiveMarqueeConfig,
  },
  "spotlight-card": {
    load: () =>
      import("@/registry/remocn/spotlight-card").then((m) => ({
        default: m.SpotlightCard,
      })),
    config: spotlightCardConfig,
  },
  "glass-code-block": {
    load: () =>
      import("@/registry/remocn/glass-code-block").then((m) => ({
        default: m.GlassCodeBlock,
      })),
    config: glassCodeBlockConfig,
  },
  "glass-code-walk": {
    load: () =>
      import("@/registry/remocn/glass-code-walk").then((m) => ({
        default: m.GlassCodeWalk,
      })),
    config: glassCodeWalkConfig,
  },
  "data-flow-pipes": {
    load: () =>
      import("@/registry/remocn/data-flow-pipes").then((m) => ({
        default: m.DataFlowPipes,
      })),
    config: dataFlowPipesConfig,
  },
  "mesh-gradient-bg": {
    load: () =>
      import("@/registry/remocn/mesh-gradient-bg").then((m) => ({
        default: m.MeshGradientBg,
      })),
    config: meshGradientBgConfig,
  },
  "shader-mesh-gradient": {
    load: () =>
      import("@/registry/remocn/shader-mesh-gradient").then((m) => ({
        default: m.ShaderMeshGradient,
      })),
    config: shaderMeshGradientConfig,
  },
  "shader-grain-gradient": {
    load: () =>
      import("@/registry/remocn/shader-grain-gradient").then((m) => ({
        default: m.ShaderGrainGradient,
      })),
    config: shaderGrainGradientConfig,
  },
  "shader-warp": {
    load: () =>
      import("@/registry/remocn/shader-warp").then((m) => ({
        default: m.ShaderWarp,
      })),
    config: shaderWarpConfig,
  },
  "shader-swirl": {
    load: () =>
      import("@/registry/remocn/shader-swirl").then((m) => ({
        default: m.ShaderSwirl,
      })),
    config: shaderSwirlConfig,
  },
  "shader-water": {
    load: () =>
      import("@/registry/remocn/shader-water").then((m) => ({
        default: m.ShaderWater,
      })),
    config: shaderWaterConfig,
  },
  "shader-spiral": {
    load: () =>
      import("@/registry/remocn/shader-spiral").then((m) => ({
        default: m.ShaderSpiral,
      })),
    config: shaderSpiralConfig,
  },
  "shader-liquid-metal": {
    load: () =>
      import("@/registry/remocn/shader-liquid-metal").then((m) => ({
        default: m.ShaderLiquidMetal,
      })),
    config: shaderLiquidMetalConfig,
  },
  "shader-color-panels": {
    load: () =>
      import("@/registry/remocn/shader-color-panels").then((m) => ({
        default: m.ShaderColorPanels,
      })),
    config: shaderColorPanelsConfig,
  },
  "shader-neuro-noise": {
    load: () =>
      import("@/registry/remocn/shader-neuro-noise").then((m) => ({
        default: m.ShaderNeuroNoise,
      })),
    config: shaderNeuroNoiseConfig,
  },
  "shader-perlin-noise": {
    load: () =>
      import("@/registry/remocn/shader-perlin-noise").then((m) => ({
        default: m.ShaderPerlinNoise,
      })),
    config: shaderPerlinNoiseConfig,
  },
  "shader-simplex-noise": {
    load: () =>
      import("@/registry/remocn/shader-simplex-noise").then((m) => ({
        default: m.ShaderSimplexNoise,
      })),
    config: shaderSimplexNoiseConfig,
  },
  "shader-voronoi": {
    load: () =>
      import("@/registry/remocn/shader-voronoi").then((m) => ({
        default: m.ShaderVoronoi,
      })),
    config: shaderVoronoiConfig,
  },
  "shader-dot-orbit": {
    load: () =>
      import("@/registry/remocn/shader-dot-orbit").then((m) => ({
        default: m.ShaderDotOrbit,
      })),
    config: shaderDotOrbitConfig,
  },
  "shader-dithering": {
    load: () =>
      import("@/registry/remocn/shader-dithering").then((m) => ({
        default: m.ShaderDithering,
      })),
    config: shaderDitheringConfig,
  },
  "shader-god-rays": {
    load: () =>
      import("@/registry/remocn/shader-god-rays").then((m) => ({
        default: m.ShaderGodRays,
      })),
    config: shaderGodRaysConfig,
  },
  "shader-smoke-ring": {
    load: () =>
      import("@/registry/remocn/shader-smoke-ring").then((m) => ({
        default: m.ShaderSmokeRing,
      })),
    config: shaderSmokeRingConfig,
  },
  "shader-metaballs": {
    load: () =>
      import("@/registry/remocn/shader-metaballs").then((m) => ({
        default: m.ShaderMetaballs,
      })),
    config: shaderMetaballsConfig,
  },
  "shader-pulsing-border": {
    load: () =>
      import("@/registry/remocn/shader-pulsing-border").then((m) => ({
        default: m.ShaderPulsingBorder,
      })),
    config: shaderPulsingBorderConfig,
  },
  "dynamic-grid": {
    load: () =>
      import("@/registry/remocn/dynamic-grid").then((m) => ({
        default: m.DynamicGrid,
      })),
    config: dynamicGridConfig,
  },
  "simulated-cursor": {
    load: () =>
      import("@/registry/remocn/simulated-cursor").then((m) => ({
        default: m.SimulatedCursor,
      })),
    config: simulatedCursorConfig,
  },
  "swirl-dissolve": {
    load: () =>
      import("@/components/docs/examples/swirl-dissolve-example").then((m) => ({
        default: m.SwirlDissolveExampleScene,
      })),
    config: swirlDissolveConfig,
  },
  "dither-dissolve": {
    load: () =>
      import("@/components/docs/examples/dither-dissolve-example").then(
        (m) => ({ default: m.DitherDissolveExampleScene }),
      ),
    config: ditherDissolveConfig,
  },
  "perlin-dissolve": {
    load: () =>
      import("@/components/docs/examples/perlin-dissolve-example").then(
        (m) => ({ default: m.PerlinDissolveExampleScene }),
      ),
    config: perlinDissolveConfig,
  },
  "smoke-dissolve": {
    load: () =>
      import("@/components/docs/examples/smoke-dissolve-example").then((m) => ({
        default: m.SmokeDissolveExampleScene,
      })),
    config: smokeDissolveConfig,
  },
  "grain-dissolve": {
    load: () =>
      import("@/components/docs/examples/grain-dissolve-example").then((m) => ({
        default: m.GrainDissolveExampleScene,
      })),
    config: grainDissolveConfig,
  },
  "icon-alert-triangle": {
    load: () =>
      import("@/registry/remocn/icon-alert-triangle").then((m) => ({
        default: m.AlertTriangleIcon,
      })),
    config: iconAlertTriangleConfig,
  },
  "icon-arrow-down": {
    load: () =>
      import("@/registry/remocn/icon-arrow-down").then((m) => ({
        default: m.ArrowDownIcon,
      })),
    config: iconArrowDownConfig,
  },
  "icon-arrow-left": {
    load: () =>
      import("@/registry/remocn/icon-arrow-left").then((m) => ({
        default: m.ArrowLeftIcon,
      })),
    config: iconArrowLeftConfig,
  },
  "icon-arrow-right": {
    load: () =>
      import("@/registry/remocn/icon-arrow-right").then((m) => ({
        default: m.ArrowRightIcon,
      })),
    config: iconArrowRightConfig,
  },
  "icon-arrow-up": {
    load: () =>
      import("@/registry/remocn/icon-arrow-up").then((m) => ({
        default: m.ArrowUpIcon,
      })),
    config: iconArrowUpConfig,
  },
  "icon-bell": {
    load: () =>
      import("@/registry/remocn/icon-bell").then((m) => ({
        default: m.BellIcon,
      })),
    config: iconBellConfig,
  },
  "icon-bookmark": {
    load: () =>
      import("@/registry/remocn/icon-bookmark").then((m) => ({
        default: m.BookmarkIcon,
      })),
    config: iconBookmarkConfig,
  },
  "icon-camera": {
    load: () =>
      import("@/registry/remocn/icon-camera").then((m) => ({
        default: m.CameraIcon,
      })),
    config: iconCameraConfig,
  },
  "icon-check": {
    load: () =>
      import("@/registry/remocn/icon-check").then((m) => ({
        default: m.CheckIcon,
      })),
    config: iconCheckConfig,
  },
  "icon-chevron-down": {
    load: () =>
      import("@/registry/remocn/icon-chevron-down").then((m) => ({
        default: m.ChevronDownIcon,
      })),
    config: iconChevronDownConfig,
  },
  "icon-chevron-left": {
    load: () =>
      import("@/registry/remocn/icon-chevron-left").then((m) => ({
        default: m.ChevronLeftIcon,
      })),
    config: iconChevronLeftConfig,
  },
  "icon-chevron-right": {
    load: () =>
      import("@/registry/remocn/icon-chevron-right").then((m) => ({
        default: m.ChevronRightIcon,
      })),
    config: iconChevronRightConfig,
  },
  "icon-chevron-up": {
    load: () =>
      import("@/registry/remocn/icon-chevron-up").then((m) => ({
        default: m.ChevronUpIcon,
      })),
    config: iconChevronUpConfig,
  },
  "icon-copy": {
    load: () =>
      import("@/registry/remocn/icon-copy").then((m) => ({
        default: m.CopyIcon,
      })),
    config: iconCopyConfig,
  },
  "icon-download": {
    load: () =>
      import("@/registry/remocn/icon-download").then((m) => ({
        default: m.DownloadIcon,
      })),
    config: iconDownloadConfig,
  },
  "icon-external-link": {
    load: () =>
      import("@/registry/remocn/icon-external-link").then((m) => ({
        default: m.ExternalLinkIcon,
      })),
    config: iconExternalLinkConfig,
  },
  "icon-eye-off": {
    load: () =>
      import("@/registry/remocn/icon-eye-off").then((m) => ({
        default: m.EyeOffIcon,
      })),
    config: iconEyeOffConfig,
  },
  "icon-eye": {
    load: () =>
      import("@/registry/remocn/icon-eye").then((m) => ({
        default: m.EyeIcon,
      })),
    config: iconEyeConfig,
  },
  "icon-filter": {
    load: () =>
      import("@/registry/remocn/icon-filter").then((m) => ({
        default: m.FilterIcon,
      })),
    config: iconFilterConfig,
  },
  "icon-flame": {
    load: () =>
      import("@/registry/remocn/icon-flame").then((m) => ({
        default: m.FlameIcon,
      })),
    config: iconFlameConfig,
  },
  "icon-heart": {
    load: () =>
      import("@/registry/remocn/icon-heart").then((m) => ({
        default: m.HeartIcon,
      })),
    config: iconHeartConfig,
  },
  "icon-image": {
    load: () =>
      import("@/registry/remocn/icon-image").then((m) => ({
        default: m.ImageIcon,
      })),
    config: iconImageConfig,
  },
  "icon-info": {
    load: () =>
      import("@/registry/remocn/icon-info").then((m) => ({
        default: m.InfoIcon,
      })),
    config: iconInfoConfig,
  },
  "icon-key": {
    load: () =>
      import("@/registry/remocn/icon-key").then((m) => ({
        default: m.KeyIcon,
      })),
    config: iconKeyConfig,
  },
  "icon-layout-grid": {
    load: () =>
      import("@/registry/remocn/icon-layout-grid").then((m) => ({
        default: m.LayoutGridIcon,
      })),
    config: iconLayoutGridConfig,
  },
  "icon-link": {
    load: () =>
      import("@/registry/remocn/icon-link").then((m) => ({
        default: m.LinkIcon,
      })),
    config: iconLinkConfig,
  },
  "icon-loader": {
    load: () =>
      import("@/registry/remocn/icon-loader").then((m) => ({
        default: m.LoaderIcon,
      })),
    config: iconLoaderConfig,
  },
  "icon-lock": {
    load: () =>
      import("@/registry/remocn/icon-lock").then((m) => ({
        default: m.LockIcon,
      })),
    config: iconLockConfig,
  },
  "icon-log-out": {
    load: () =>
      import("@/registry/remocn/icon-log-out").then((m) => ({
        default: m.LogOutIcon,
      })),
    config: iconLogOutConfig,
  },
  "icon-mail": {
    load: () =>
      import("@/registry/remocn/icon-mail").then((m) => ({
        default: m.MailIcon,
      })),
    config: iconMailConfig,
  },
  "icon-maximize": {
    load: () =>
      import("@/registry/remocn/icon-maximize").then((m) => ({
        default: m.MaximizeIcon,
      })),
    config: iconMaximizeConfig,
  },
  "icon-menu": {
    load: () =>
      import("@/registry/remocn/icon-menu").then((m) => ({
        default: m.MenuIcon,
      })),
    config: iconMenuConfig,
  },
  "icon-message-circle": {
    load: () =>
      import("@/registry/remocn/icon-message-circle").then((m) => ({
        default: m.MessageCircleIcon,
      })),
    config: iconMessageCircleConfig,
  },
  "icon-mic": {
    load: () =>
      import("@/registry/remocn/icon-mic").then((m) => ({
        default: m.MicIcon,
      })),
    config: iconMicConfig,
  },
  "icon-more-horizontal": {
    load: () =>
      import("@/registry/remocn/icon-more-horizontal").then((m) => ({
        default: m.MoreHorizontalIcon,
      })),
    config: iconMoreHorizontalConfig,
  },
  "icon-party-popper": {
    load: () =>
      import("@/registry/remocn/icon-party-popper").then((m) => ({
        default: m.PartyPopperIcon,
      })),
    config: iconPartyPopperConfig,
  },
  "icon-pause": {
    load: () =>
      import("@/registry/remocn/icon-pause").then((m) => ({
        default: m.PauseIcon,
      })),
    config: iconPauseConfig,
  },
  "icon-pencil": {
    load: () =>
      import("@/registry/remocn/icon-pencil").then((m) => ({
        default: m.PencilIcon,
      })),
    config: iconPencilConfig,
  },
  "icon-play": {
    load: () =>
      import("@/registry/remocn/icon-play").then((m) => ({
        default: m.PlayIcon,
      })),
    config: iconPlayConfig,
  },
  "icon-plus": {
    load: () =>
      import("@/registry/remocn/icon-plus").then((m) => ({
        default: m.PlusIcon,
      })),
    config: iconPlusConfig,
  },
  "icon-refresh-cw": {
    load: () =>
      import("@/registry/remocn/icon-refresh-cw").then((m) => ({
        default: m.RefreshCwIcon,
      })),
    config: iconRefreshCwConfig,
  },
  "icon-save": {
    load: () =>
      import("@/registry/remocn/icon-save").then((m) => ({
        default: m.SaveIcon,
      })),
    config: iconSaveConfig,
  },
  "icon-search": {
    load: () =>
      import("@/registry/remocn/icon-search").then((m) => ({
        default: m.SearchIcon,
      })),
    config: iconSearchConfig,
  },
  "icon-send": {
    load: () =>
      import("@/registry/remocn/icon-send").then((m) => ({
        default: m.SendIcon,
      })),
    config: iconSendConfig,
  },
  "icon-settings": {
    load: () =>
      import("@/registry/remocn/icon-settings").then((m) => ({
        default: m.SettingsIcon,
      })),
    config: iconSettingsConfig,
  },
  "icon-share-2": {
    load: () =>
      import("@/registry/remocn/icon-share-2").then((m) => ({
        default: m.Share2Icon,
      })),
    config: iconShare2Config,
  },
  "icon-skip-forward": {
    load: () =>
      import("@/registry/remocn/icon-skip-forward").then((m) => ({
        default: m.SkipForwardIcon,
      })),
    config: iconSkipForwardConfig,
  },
  "icon-sparkles": {
    load: () =>
      import("@/registry/remocn/icon-sparkles").then((m) => ({
        default: m.SparklesIcon,
      })),
    config: iconSparklesConfig,
  },
  "icon-star": {
    load: () =>
      import("@/registry/remocn/icon-star").then((m) => ({
        default: m.StarIcon,
      })),
    config: iconStarConfig,
  },
  "icon-thumbs-up": {
    load: () =>
      import("@/registry/remocn/icon-thumbs-up").then((m) => ({
        default: m.ThumbsUpIcon,
      })),
    config: iconThumbsUpConfig,
  },
  "icon-trash": {
    load: () =>
      import("@/registry/remocn/icon-trash").then((m) => ({
        default: m.TrashIcon,
      })),
    config: iconTrashConfig,
  },
  "icon-upload": {
    load: () =>
      import("@/registry/remocn/icon-upload").then((m) => ({
        default: m.UploadIcon,
      })),
    config: iconUploadConfig,
  },
  "icon-user-plus": {
    load: () =>
      import("@/registry/remocn/icon-user-plus").then((m) => ({
        default: m.UserPlusIcon,
      })),
    config: iconUserPlusConfig,
  },
  "icon-user": {
    load: () =>
      import("@/registry/remocn/icon-user").then((m) => ({
        default: m.UserIcon,
      })),
    config: iconUserConfig,
  },
  "icon-users": {
    load: () =>
      import("@/registry/remocn/icon-users").then((m) => ({
        default: m.UsersIcon,
      })),
    config: iconUsersConfig,
  },
  "icon-video": {
    load: () =>
      import("@/registry/remocn/icon-video").then((m) => ({
        default: m.VideoIcon,
      })),
    config: iconVideoConfig,
  },
  "icon-volume-2": {
    load: () =>
      import("@/registry/remocn/icon-volume-2").then((m) => ({
        default: m.Volume2Icon,
      })),
    config: iconVolume2Config,
  },
  "icon-volume-x": {
    load: () =>
      import("@/registry/remocn/icon-volume-x").then((m) => ({
        default: m.VolumeXIcon,
      })),
    config: iconVolumeXConfig,
  },
  "icon-check-circle": {
    load: () =>
      import("@/registry/remocn/icon-check-circle").then((m) => ({
        default: m.CheckCircleIcon,
      })),
    config: iconCheckCircleConfig,
  },
  "icon-x": {
    load: () =>
      import("@/registry/remocn/icon-x").then((m) => ({
        default: m.XIcon,
      })),
    config: iconXConfig,
  },
  "icon-zap": {
    load: () =>
      import("@/registry/remocn/icon-zap").then((m) => ({
        default: m.ZapIcon,
      })),
    config: iconZapConfig,
  },
  "wave-wipe": {
    load: () =>
      import("@/components/docs/examples/wave-wipe-example").then((m) => ({
        default: m.WaveWipeExampleScene,
      })),
    config: waveWipeConfig,
  },
  "ripple-zoom": {
    load: () =>
      import("@/components/docs/examples/ripple-zoom-example").then((m) => ({
        default: m.RippleZoomExampleScene,
      })),
    config: rippleZoomConfig,
  },
  "whip-pan": {
    load: () =>
      import("@/components/docs/examples/whip-pan-example").then((m) => ({
        default: m.WhipPanExampleScene,
      })),
    config: whipPanConfig,
  },
  "push-through": {
    load: () =>
      import("@/components/docs/examples/push-through-example").then((m) => ({
        default: m.PushThroughExampleScene,
      })),
    config: pushThroughConfig,
  },
  "focus-pull": {
    load: () =>
      import("@/components/docs/examples/focus-pull-example").then((m) => ({
        default: m.FocusPullExampleScene,
      })),
    config: focusPullConfig,
  },
  "zoom-blur": {
    load: () =>
      import("@/components/docs/examples/zoom-blur-example").then((m) => ({
        default: m.ZoomBlurExampleScene,
      })),
    config: zoomBlurConfig,
  },
  "warp-dissolve": {
    load: () =>
      import("@/components/docs/examples/warp-dissolve-example").then((m) => ({
        default: m.WarpDissolveExampleScene,
      })),
    config: warpDissolveConfig,
  },
  "chat-to-preview-layout": {
    load: () =>
      import("@/registry/remocn/chat-to-preview-layout").then((m) => ({
        default: m.ChatToPreviewLayout,
      })),
    config: chatToPreviewLayoutConfig,
  },
  "animated-line-chart": {
    load: () =>
      import("@/registry/remocn/animated-line-chart").then((m) => ({
        default: m.AnimatedLineChart,
      })),
    config: animatedLineChartConfig,
  },
  "animated-bar-chart": {
    load: () =>
      import("@/registry/remocn/animated-bar-chart").then((m) => ({
        default: m.AnimatedBarChart,
      })),
    config: animatedBarChartConfig,
  },
  "terminal-simulator": {
    load: () =>
      import("@/registry/remocn/terminal-simulator").then((m) => ({
        default: m.TerminalSimulator,
      })),
    config: terminalSimulatorConfig,
  },
  "terminal-cursor-zoom": {
    load: () =>
      import("@/registry/remocn/terminal-cursor-zoom").then((m) => ({
        default: m.TerminalCursorZoom,
      })),
    config: terminalCursorZoomConfig,
  },
  "progress-steps": {
    load: () =>
      import("@/registry/remocn/progress-steps").then((m) => ({
        default: m.ProgressSteps,
      })),
    config: progressStepsConfig,
  },
  "ecosystem-constellation": {
    load: () =>
      import("@/registry/remocn/ecosystem-constellation").then((m) => ({
        default: m.EcosystemConstellation,
      })),
    config: ecosystemConstellationConfig,
  },
  "live-code-compilation": {
    load: () =>
      import("@/registry/remocn/live-code-compilation").then((m) => ({
        default: m.LiveCodeCompilation,
      })),
    config: liveCodeCompilationConfig,
  },
  "infinite-bento-pan": {
    load: () =>
      import("@/registry/remocn/infinite-bento-pan").then((m) => ({
        default: m.InfiniteBentoPan,
      })),
    config: infiniteBentoPanConfig,
  },
  "github-sponsors": {
    load: () =>
      import("@/registry/remocn/github-sponsors").then((m) => ({
        default: m.GitHubSponsors,
      })),
    config: githubSponsorsConfig,
  },
  "github-stars": {
    load: () =>
      import("@/registry/remocn/github-stars").then((m) => ({
        default: m.GitHubStars,
      })),
    config: githubStarsConfig,
  },
  "logo-enter": {
    load: () =>
      import("@/registry/remocn/logo-enter").then((m) => ({
        default: m.LogoEnter,
      })),
    config: logoEnterConfig,
  },
  "number-wheel": {
    load: () =>
      import("@/registry/remocn/number-wheel").then((m) => ({
        default: m.NumberWheel,
      })),
    config: numberWheelConfig,
  },
  "rolling-number": {
    load: () =>
      import("@/registry/remocn/rolling-number").then((m) => ({
        default: m.RollingNumber,
      })),
    config: rollingNumberConfig,
  },
  "rolodex-flip": {
    load: () =>
      import("@/components/docs/examples/rolodex-flip-example").then((m) => ({
        default: m.RolodexFlipExampleScene,
      })),
    config: rolodexFlipConfig,
  },
  "value-swap": {
    load: () =>
      import("@/components/docs/examples/value-swap-example").then((m) => ({
        default: m.ValueSwapExampleScene,
      })),
    config: valueSwapConfig,
  },
  "x-follow-card": {
    load: () =>
      import("@/registry/remocn/x-follow-card").then((m) => ({
        default: m.XFollowCard,
      })),
    config: xFollowCardConfig,
  },
  "x-followers-overview": {
    load: () =>
      import("@/registry/remocn/x-followers-overview").then((m) => ({
        default: m.XFollowersOverview,
      })),
    config: xFollowersOverviewConfig,
  },
  confetti: {
    load: () =>
      import("@/registry/remocn/confetti").then((m) => ({
        default: m.Confetti,
      })),
    config: confettiConfig,
  },
  backdrop: {
    load: () =>
      import("@/components/docs/examples/backdrop-demo").then((m) => ({
        default: m.BackdropDemo,
      })),
    config: backdropConfig,
  },
  drift: {
    load: () =>
      import("@/components/docs/examples/drift-example").then((m) => ({
        default: m.DriftExampleScene,
      })),
    config: driftConfig,
  },
  "claude-chat": {
    load: () =>
      import("@/registry/remocn/claude-chat").then((m) => ({
        default: m.ClaudeChat,
      })),
    config: claudeChatConfig,
  },
  "chat-gpt": {
    load: () =>
      import("@/registry/remocn/chat-gpt").then((m) => ({
        default: m.ChatGpt,
      })),
    config: chatGptConfig,
  },
  v0: {
    load: () => import("@/registry/remocn/v0").then((m) => ({ default: m.V0 })),
    config: v0Config,
  },
  "claude-code": {
    load: () =>
      import("@/registry/remocn/claude-code").then((m) => ({
        default: m.ClaudeCode,
      })),
    config: claudeCodeConfig,
  },
  opencode: {
    load: () =>
      import("@/registry/remocn/opencode").then((m) => ({
        default: m.OpenCode,
      })),
    config: opencodeConfig,
  },
  button: {
    load: () =>
      import("@/registry/remocn-ui/button").then((m) => ({
        default: m.Button,
      })),
    config: buttonConfig,
  },
  accordion: {
    load: () =>
      import("@/registry/remocn-ui/accordion").then((m) => ({
        default: m.Accordion,
      })),
    config: accordionConfig,
  },
  "alert-dialog": {
    load: () =>
      import("@/registry/remocn-ui/alert-dialog").then((m) => ({
        default: m.AlertDialog,
      })),
    config: alertDialogConfig,
  },
  dialog: {
    load: () =>
      import("@/registry/remocn-ui/dialog").then((m) => ({
        default: m.Dialog,
      })),
    config: dialogConfig,
  },
  sheet: {
    load: () =>
      import("@/registry/remocn-ui/sheet").then((m) => ({ default: m.Sheet })),
    config: sheetConfig,
  },
  drawer: {
    load: () =>
      import("@/registry/remocn-ui/drawer").then((m) => ({
        default: m.Drawer,
      })),
    config: drawerConfig,
  },
  checkbox: {
    load: () =>
      import("@/registry/remocn-ui/checkbox").then((m) => ({
        default: m.Checkbox,
      })),
    config: checkboxConfig,
  },
  input: {
    load: () =>
      import("@/registry/remocn-ui/input").then((m) => ({ default: m.Input })),
    config: inputConfig,
  },
  // blur-in WRAPS a single child, so the customizer Component is the
  // preview-only BlurInPreview wrapper (it supplies a fixed sample card and
  // centers it on a stage); the shipped BlurIn is a pure child-wrapper.
  "blur-in": {
    load: () =>
      import("@/registry/remocn-ui/blur-in/preview").then((m) => ({
        default: m.BlurInPreview,
      })),
    config: blurInConfig,
  },
  radio: {
    load: () =>
      import("@/registry/remocn-ui/radio").then((m) => ({ default: m.Radio })),
    config: radioConfig,
  },
  switch: {
    load: () =>
      import("@/registry/remocn-ui/switch").then((m) => ({
        default: m.Switch,
      })),
    config: switchConfig,
  },
  select: {
    load: () =>
      import("@/registry/remocn-ui/select").then((m) => ({
        default: m.Select,
      })),
    config: selectConfig,
  },
  "select-item": {
    load: () =>
      import("@/registry/remocn-ui/select-item").then((m) => ({
        default: m.SelectItem,
      })),
    config: selectItemConfig,
  },
  "dropdown-menu": {
    load: () =>
      import("@/registry/remocn-ui/dropdown-menu").then((m) => ({
        default: m.DropdownMenu,
      })),
    config: dropdownMenuConfig,
  },
  "dropdown-menu-item": {
    load: () =>
      import("@/registry/remocn-ui/dropdown-menu-item").then((m) => ({
        default: m.DropdownMenuItem,
      })),
    config: dropdownMenuItemConfig,
  },
  tabs: {
    load: () =>
      import("@/registry/remocn-ui/tabs").then((m) => ({ default: m.Tabs })),
    config: tabsConfig,
  },
  // cursor's customizer Component is the preview-only CursorPreview wrapper (it
  // runs a fixed demo path through useCursorPath); the shipped Cursor is pure.
  cursor: {
    load: () =>
      import("@/registry/remocn-ui/cursor/preview").then((m) => ({
        default: m.CursorPreview,
      })),
    config: cursorConfig,
  },
  // toast's customizer Component is the preview-only ToastPreview wrapper (it
  // centers the toast on a theme-background stage); the shipped Toast is a
  // placement-agnostic card the caller positions.
  toast: {
    load: () =>
      import("@/registry/remocn-ui/toast/preview").then((m) => ({
        default: m.ToastPreview,
      })),
    config: toastConfig,
  },
  "message-bubble": {
    load: () =>
      import("@/registry/remocn-ui/message-bubble/preview").then((m) => ({
        default: m.MessageBubblePreview,
      })),
    config: messageBubbleConfig,
  },
  "typing-indicator": {
    load: () =>
      import("@/registry/remocn-ui/typing-indicator/preview").then((m) => ({
        default: m.TypingIndicatorPreview,
      })),
    config: typingIndicatorConfig,
  },
  "command-menu-item": {
    load: () =>
      import("@/registry/remocn-ui/command-menu-item").then((m) => ({
        default: m.CommandMenuItem,
      })),
    config: commandMenuItemConfig,
  },
  // command-menu needs NO preview wrapper: like dialog it renders an intrinsic
  // inset:0 backdrop + centered panel, so the customizer mounts it directly.
  "command-menu": {
    load: () =>
      import("@/registry/remocn-ui/command-menu").then((m) => ({
        default: m.CommandMenu,
      })),
    config: commandMenuConfig,
  },
  // tooltip's customizer Component is the preview-only TooltipPreview wrapper: a
  // bare bubble has no backdrop and would not center as the composition root.
  tooltip: {
    load: () =>
      import("@/registry/remocn-ui/tooltip/preview").then((m) => ({
        default: m.TooltipPreview,
      })),
    config: tooltipConfig,
  },
  // progress's customizer Component is the preview-only ProgressPreview wrapper:
  // a bare inline bar would sit top-left, so the wrapper centers it on a stage.
  progress: {
    load: () =>
      import("@/registry/remocn-ui/progress/preview").then((m) => ({
        default: m.ProgressPreview,
      })),
    config: progressConfig,
  },
  // skeleton-block is the shimmer motion atom; its preview centers the bare block
  // on a stage. skeleton is the state atom whose preview supplies demo content +
  // placeholder for the loading↔loaded crossfade.
  "skeleton-block": {
    load: () =>
      import("@/registry/remocn-ui/skeleton-block/preview").then((m) => ({
        default: m.SkeletonBlockPreview,
      })),
    config: skeletonBlockConfig,
  },
  skeleton: {
    load: () =>
      import("@/registry/remocn-ui/skeleton/preview").then((m) => ({
        default: m.SkeletonPreview,
      })),
    config: skeletonConfig,
  },
  // slider's customizer Component is the preview-only SliderPreview wrapper: a
  // bare inline bar would sit top-left, so the wrapper centers it on a stage.
  slider: {
    load: () =>
      import("@/registry/remocn-ui/slider/preview").then((m) => ({
        default: m.SliderPreview,
      })),
    config: sliderConfig,
  },
  // combobox registers RAW (no preview wrapper): like select it paints its own
  // opaque inset:0 wrapper, so the customizer mounts it directly and it centers.
  combobox: {
    load: () =>
      import("@/registry/remocn-ui/combobox").then((m) => ({
        default: m.Combobox,
      })),
    config: comboboxConfig,
  },
  // popover's customizer Component is the preview-only PopoverPreview wrapper: a
  // bare card has no backdrop and would not center as the composition root.
  popover: {
    load: () =>
      import("@/registry/remocn-ui/popover/preview").then((m) => ({
        default: m.PopoverPreview,
      })),
    config: popoverConfig,
  },
  // context-menu's customizer Component is the preview-only ContextMenuPreview
  // wrapper: a bare panel (transparent, caller-positioned) would sit top-left,
  // so the wrapper centers it on a stage.
  "context-menu": {
    load: () =>
      import("@/registry/remocn-ui/context-menu/preview").then((m) => ({
        default: m.ContextMenuPreview,
      })),
    config: contextMenuConfig,
  },
  // toggle-group registers RAW (no preview wrapper): like tabs it paints its own
  // opaque inset:0 centered stage, so the customizer mounts it directly.
  "toggle-group": {
    load: () =>
      import("@/registry/remocn-ui/toggle-group").then((m) => ({
        default: m.ToggleGroup,
      })),
    config: toggleGroupConfig,
  },
  // stepper's customizer Component is the preview-only StepperPreview wrapper: a
  // bare wide horizontal element would sit top-left, so the wrapper centers it.
  stepper: {
    load: () =>
      import("@/registry/remocn-ui/stepper/preview").then((m) => ({
        default: m.StepperPreview,
      })),
    config: stepperConfig,
  },
  // resizable registers RAW (no preview wrapper): its index.tsx already paints
  // an opaque inset:0 stage that centers the fixed-size bordered box, like tabs.
  resizable: {
    load: () =>
      import("@/registry/remocn-ui/resizable").then((m) => ({
        default: m.Resizable,
      })),
    config: resizableConfig,
  },
  spinner: {
    load: () =>
      import("@/registry/remocn-ui/spinner").then((m) => ({
        default: m.Spinner,
      })),
    config: spinnerConfig,
  },
  caret: {
    load: () =>
      import("@/registry/remocn-ui/caret/preview").then((m) => ({
        default: m.CaretPreview,
      })),
    config: caretConfig,
  },
};

// Append the shared controls (e.g. `speed`) to every component config so
// every animation in the customizer exposes the same baseline knobs.
for (const { config } of Object.values(registry)) {
  config.controls = { ...config.controls, ...SHARED_CONTROLS };
}

const backdrop = registry.backdrop;
if (backdrop) {
  delete backdrop.config.controls.speed;
}

// github-stars must land its count-up exactly on the final frame. A speed < 1
// would stop the shared progress driver short (the count never reaches the
// total), so this component intentionally deviates from SHARED_CONTROLS and
// caps `speed` at a minimum of 1. Reassigning the existing key keeps its order.
const githubStars = registry["github-stars"];
if (githubStars) {
  githubStars.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

// github-sponsors plays its heart draw, avatar blur-stagger, and headline/CTA
// off the shared progress timeline; a speed < 1 would stall the driver before
// the lockup completes, so cap min:1 like github-stars.
const githubSponsors = registry["github-sponsors"];
if (githubSponsors) {
  githubSponsors.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const numberWheel = registry["number-wheel"];
if (numberWheel) {
  numberWheel.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const rollingNumber = registry["rolling-number"];
if (rollingNumber) {
  rollingNumber.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const xFollowCard = registry["x-follow-card"];
if (xFollowCard) {
  xFollowCard.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

// x-followers-overview cycles notifications then blur-reveals the total at a
// fixed point in the timeline. A speed < 1 would stall the driver before the
// reveal frame, so cap min:1 like github-stars.
const xFollowersOverview = registry["x-followers-overview"];
if (xFollowersOverview) {
  xFollowersOverview.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const claudeChat = registry["claude-chat"];
if (claudeChat) {
  claudeChat.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const chatGpt = registry["chat-gpt"];
if (chatGpt) {
  chatGpt.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const v0 = registry.v0;
if (v0) {
  v0.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const claudeCode = registry["claude-code"];
if (claudeCode) {
  claudeCode.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

const opencode = registry.opencode;
if (opencode) {
  opencode.config.controls.speed = {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  };
}

export default registry;
