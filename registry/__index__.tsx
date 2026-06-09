import type React from "react";
import { type ComponentConfig, SHARED_CONTROLS } from "@/lib/customizer-config";

import { AIGenerationCanvas } from "@/registry/remocn/ai-generation-canvas";
import { aiGenerationCanvasConfig } from "@/registry/remocn/ai-generation-canvas/config";
import { AnimatedBarChart } from "@/registry/remocn/animated-bar-chart";
import { animatedBarChartConfig } from "@/registry/remocn/animated-bar-chart/config";
import { AnimatedLineChart } from "@/registry/remocn/animated-line-chart";
import { animatedLineChartConfig } from "@/registry/remocn/animated-line-chart/config";
import { BlurReveal } from "@/registry/remocn/blur-reveal";
import { blurRevealConfig } from "@/registry/remocn/blur-reveal/config";
import { BoundingBoxSelector } from "@/registry/remocn/bounding-box-selector";
import { boundingBoxSelectorConfig } from "@/registry/remocn/bounding-box-selector/config";
import { BrowserFlow } from "@/registry/remocn/browser-flow";
import { browserFlowConfig } from "@/registry/remocn/browser-flow/config";
import { ChatToPreviewLayout } from "@/registry/remocn/chat-to-preview-layout";
import { chatToPreviewLayoutConfig } from "@/registry/remocn/chat-to-preview-layout/config";
import { ChromaticAberrationWipe } from "@/registry/remocn/chromatic-aberration-wipe";
import { chromaticAberrationWipeConfig } from "@/registry/remocn/chromatic-aberration-wipe/config";
import { CodeAccordion } from "@/registry/remocn/code-accordion";
import { codeAccordionConfig } from "@/registry/remocn/code-accordion/config";
import { CodeDiffWipe } from "@/registry/remocn/code-diff-wipe";
import { codeDiffWipeConfig } from "@/registry/remocn/code-diff-wipe/config";
import { DashboardPopulate } from "@/registry/remocn/dashboard-populate";
import { dashboardPopulateConfig } from "@/registry/remocn/dashboard-populate/config";
import { DataFlowPipes } from "@/registry/remocn/data-flow-pipes";
import { dataFlowPipesConfig } from "@/registry/remocn/data-flow-pipes/config";
import { DeviceMockupZoom } from "@/registry/remocn/device-mockup-zoom";
import { deviceMockupZoomConfig } from "@/registry/remocn/device-mockup-zoom/config";
import { DirectionalWipe } from "@/registry/remocn/directional-wipe";
import { directionalWipeConfig } from "@/registry/remocn/directional-wipe/config";
import { DragAndDropFlow } from "@/registry/remocn/drag-and-drop-flow";
import { dragAndDropFlowConfig } from "@/registry/remocn/drag-and-drop-flow/config";
import { DynamicGrid } from "@/registry/remocn/dynamic-grid";
import { dynamicGridConfig } from "@/registry/remocn/dynamic-grid/config";
import { EcosystemConstellation } from "@/registry/remocn/ecosystem-constellation";
import { ecosystemConstellationConfig } from "@/registry/remocn/ecosystem-constellation/config";
import { FrostedGlassWipe } from "@/registry/remocn/frosted-glass-wipe";
import { frostedGlassWipeConfig } from "@/registry/remocn/frosted-glass-wipe/config";
import { GitHubStars } from "@/registry/remocn/github-stars";
import { githubStarsConfig } from "@/registry/remocn/github-stars/config";
import { GlassCodeBlock } from "@/registry/remocn/glass-code-block";
import { glassCodeBlockConfig } from "@/registry/remocn/glass-code-block/config";
import { GridPixelateWipe } from "@/registry/remocn/grid-pixelate-wipe";
import { gridPixelateWipeConfig } from "@/registry/remocn/grid-pixelate-wipe/config";
import { HeroDeviceAssemble } from "@/registry/remocn/hero-device-assemble";
import { heroDeviceAssembleConfig } from "@/registry/remocn/hero-device-assemble/config";
import { ImageExpandToFullscreen } from "@/registry/remocn/image-expand-to-fullscreen";
import { imageExpandToFullscreenConfig } from "@/registry/remocn/image-expand-to-fullscreen/config";
import { InfiniteBentoPan } from "@/registry/remocn/infinite-bento-pan";
import { infiniteBentoPanConfig } from "@/registry/remocn/infinite-bento-pan/config";
import { InfiniteMarquee } from "@/registry/remocn/infinite-marquee";
import { infiniteMarqueeConfig } from "@/registry/remocn/infinite-marquee/config";
import { InlineHighlight } from "@/registry/remocn/inline-highlight";
import { inlineHighlightConfig } from "@/registry/remocn/inline-highlight/config";
import { KineticTypeMask } from "@/registry/remocn/kinetic-type-mask";
import { kineticTypeMaskConfig } from "@/registry/remocn/kinetic-type-mask/config";
import { LandingCodeShowcase } from "@/registry/remocn/landing-code-showcase";
import { landingCodeShowcaseConfig } from "@/registry/remocn/landing-code-showcase/config";
import { LiveCodeCompilation } from "@/registry/remocn/live-code-compilation";
import { liveCodeCompilationConfig } from "@/registry/remocn/live-code-compilation/config";
import { MarkerHighlight } from "@/registry/remocn/marker-highlight";
import { markerHighlightConfig } from "@/registry/remocn/marker-highlight/config";
import { MaskedSlideReveal } from "@/registry/remocn/masked-slide-reveal";
import { maskedSlideRevealConfig } from "@/registry/remocn/masked-slide-reveal/config";
import { MatrixDecode } from "@/registry/remocn/matrix-decode";
import { matrixDecodeConfig } from "@/registry/remocn/matrix-decode/config";
import { MeshGradientBg } from "@/registry/remocn/mesh-gradient-bg";
import { meshGradientBgConfig } from "@/registry/remocn/mesh-gradient-bg/config";
import { PerspectiveMarquee } from "@/registry/remocn/perspective-marquee";
import { perspectiveMarqueeConfig } from "@/registry/remocn/perspective-marquee/config";
import { PricingTierFocus } from "@/registry/remocn/pricing-tier-focus";
import { pricingTierFocusConfig } from "@/registry/remocn/pricing-tier-focus/config";
import { ProgressSteps } from "@/registry/remocn/progress-steps";
import { progressStepsConfig } from "@/registry/remocn/progress-steps/config";
import { RGBGlitchText } from "@/registry/remocn/rgb-glitch-text";
import { rgbGlitchTextConfig } from "@/registry/remocn/rgb-glitch-text/config";
import { ShimmerSweep } from "@/registry/remocn/shimmer-sweep";
import { shimmerSweepConfig } from "@/registry/remocn/shimmer-sweep/config";
import { SimulatedCursor } from "@/registry/remocn/simulated-cursor";
import { simulatedCursorConfig } from "@/registry/remocn/simulated-cursor/config";
import { SlotMachineRoll } from "@/registry/remocn/slot-machine-roll";
import { slotMachineRollConfig } from "@/registry/remocn/slot-machine-roll/config";
import { SpatialPush } from "@/registry/remocn/spatial-push";
import { spatialPushConfig } from "@/registry/remocn/spatial-push/config";
import { SpotlightCard } from "@/registry/remocn/spotlight-card";
import { spotlightCardConfig } from "@/registry/remocn/spotlight-card/config";
import { SpringPopIn } from "@/registry/remocn/spring-pop-in";
import { springPopInConfig } from "@/registry/remocn/spring-pop-in/config";
import { StaggeredFadeUp } from "@/registry/remocn/staggered-fade-up";
import { staggeredFadeUpConfig } from "@/registry/remocn/staggered-fade-up/config";
import { StrikethroughReplace } from "@/registry/remocn/strikethrough-replace";
import { strikethroughReplaceConfig } from "@/registry/remocn/strikethrough-replace/config";
import { SuccessConfetti } from "@/registry/remocn/success-confetti";
import { successConfettiConfig } from "@/registry/remocn/success-confetti/config";
import { TerminalSimulator } from "@/registry/remocn/terminal-simulator";
import { terminalSimulatorConfig } from "@/registry/remocn/terminal-simulator/config";
import { TerminalToBrowserDeploy } from "@/registry/remocn/terminal-to-browser-deploy";
import { terminalToBrowserDeployConfig } from "@/registry/remocn/terminal-to-browser-deploy/config";
import { ToastNotification } from "@/registry/remocn/toast-notification";
import { toastNotificationConfig } from "@/registry/remocn/toast-notification/config";
import { ToolMenuSlideIn } from "@/registry/remocn/tool-menu-slide-in";
import { toolMenuSlideInConfig } from "@/registry/remocn/tool-menu-slide-in/config";
import { TrackingIn } from "@/registry/remocn/tracking-in";
import { trackingInConfig } from "@/registry/remocn/tracking-in/config";
import { Typewriter } from "@/registry/remocn/typewriter";
import { typewriterConfig } from "@/registry/remocn/typewriter/config";
import { Accordion } from "@/registry/remocn-ui/accordion";
import { accordionConfig } from "@/registry/remocn-ui/accordion/config";
import { AlertDialog } from "@/registry/remocn-ui/alert-dialog";
import { alertDialogConfig } from "@/registry/remocn-ui/alert-dialog/config";
import { Button } from "@/registry/remocn-ui/button";
import { buttonConfig } from "@/registry/remocn-ui/button/config";
import { Spinner } from "@/registry/remocn-ui/spinner";
import { spinnerConfig } from "@/registry/remocn-ui/spinner/config";
import { ZoomThroughTransition } from "@/registry/remocn/zoom-through-transition";
import { zoomThroughTransitionConfig } from "@/registry/remocn/zoom-through-transition/config";

export interface RegistryEntry {
  Component: React.ComponentType<any>;
  config: ComponentConfig;
}

const registry: Record<string, RegistryEntry> = {
  "blur-reveal": { Component: BlurReveal, config: blurRevealConfig },
  typewriter: { Component: Typewriter, config: typewriterConfig },
  "inline-highlight": {
    Component: InlineHighlight,
    config: inlineHighlightConfig,
  },
  "strikethrough-replace": {
    Component: StrikethroughReplace,
    config: strikethroughReplaceConfig,
  },
  "staggered-fade-up": {
    Component: StaggeredFadeUp,
    config: staggeredFadeUpConfig,
  },
  "masked-slide-reveal": {
    Component: MaskedSlideReveal,
    config: maskedSlideRevealConfig,
  },
  "tracking-in": { Component: TrackingIn, config: trackingInConfig },
  "shimmer-sweep": { Component: ShimmerSweep, config: shimmerSweepConfig },
  "marker-highlight": {
    Component: MarkerHighlight,
    config: markerHighlightConfig,
  },
  "slot-machine-roll": {
    Component: SlotMachineRoll,
    config: slotMachineRollConfig,
  },
  "matrix-decode": { Component: MatrixDecode, config: matrixDecodeConfig },
  "rgb-glitch-text": { Component: RGBGlitchText, config: rgbGlitchTextConfig },
  "infinite-marquee": {
    Component: InfiniteMarquee,
    config: infiniteMarqueeConfig,
  },
  "perspective-marquee": {
    Component: PerspectiveMarquee,
    config: perspectiveMarqueeConfig,
  },
  "spotlight-card": { Component: SpotlightCard, config: spotlightCardConfig },
  "glass-code-block": {
    Component: GlassCodeBlock,
    config: glassCodeBlockConfig,
  },
  "code-accordion": { Component: CodeAccordion, config: codeAccordionConfig },
  "data-flow-pipes": { Component: DataFlowPipes, config: dataFlowPipesConfig },
  "mesh-gradient-bg": {
    Component: MeshGradientBg,
    config: meshGradientBgConfig,
  },
  "dynamic-grid": { Component: DynamicGrid, config: dynamicGridConfig },
  "spring-pop-in": { Component: SpringPopIn, config: springPopInConfig },
  "simulated-cursor": {
    Component: SimulatedCursor,
    config: simulatedCursorConfig,
  },
  "directional-wipe": {
    Component: DirectionalWipe,
    config: directionalWipeConfig,
  },
  "device-mockup-zoom": {
    Component: DeviceMockupZoom,
    config: deviceMockupZoomConfig,
  },
  "zoom-through-transition": {
    Component: ZoomThroughTransition,
    config: zoomThroughTransitionConfig,
  },
  "chat-to-preview-layout": {
    Component: ChatToPreviewLayout,
    config: chatToPreviewLayoutConfig,
  },
  "bounding-box-selector": {
    Component: BoundingBoxSelector,
    config: boundingBoxSelectorConfig,
  },
  "animated-line-chart": {
    Component: AnimatedLineChart,
    config: animatedLineChartConfig,
  },
  "animated-bar-chart": {
    Component: AnimatedBarChart,
    config: animatedBarChartConfig,
  },
  "terminal-simulator": {
    Component: TerminalSimulator,
    config: terminalSimulatorConfig,
  },
  "code-diff-wipe": { Component: CodeDiffWipe, config: codeDiffWipeConfig },
  "toast-notification": {
    Component: ToastNotification,
    config: toastNotificationConfig,
  },
  "drag-and-drop-flow": {
    Component: DragAndDropFlow,
    config: dragAndDropFlowConfig,
  },
  "progress-steps": { Component: ProgressSteps, config: progressStepsConfig },
  "success-confetti": {
    Component: SuccessConfetti,
    config: successConfettiConfig,
  },
  "frosted-glass-wipe": {
    Component: FrostedGlassWipe,
    config: frostedGlassWipeConfig,
  },
  "kinetic-type-mask": {
    Component: KineticTypeMask,
    config: kineticTypeMaskConfig,
  },
  "spatial-push": { Component: SpatialPush, config: spatialPushConfig },
  "grid-pixelate-wipe": {
    Component: GridPixelateWipe,
    config: gridPixelateWipeConfig,
  },
  "chromatic-aberration-wipe": {
    Component: ChromaticAberrationWipe,
    config: chromaticAberrationWipeConfig,
  },
  "hero-device-assemble": {
    Component: HeroDeviceAssemble,
    config: heroDeviceAssembleConfig,
  },
  "ecosystem-constellation": {
    Component: EcosystemConstellation,
    config: ecosystemConstellationConfig,
  },
  "ai-generation-canvas": {
    Component: AIGenerationCanvas,
    config: aiGenerationCanvasConfig,
  },
  "live-code-compilation": {
    Component: LiveCodeCompilation,
    config: liveCodeCompilationConfig,
  },
  "landing-code-showcase": {
    Component: LandingCodeShowcase,
    config: landingCodeShowcaseConfig,
  },
  "dashboard-populate": {
    Component: DashboardPopulate,
    config: dashboardPopulateConfig,
  },
  "terminal-to-browser-deploy": {
    Component: TerminalToBrowserDeploy,
    config: terminalToBrowserDeployConfig,
  },
  "browser-flow": { Component: BrowserFlow, config: browserFlowConfig },
  "pricing-tier-focus": {
    Component: PricingTierFocus,
    config: pricingTierFocusConfig,
  },
  "infinite-bento-pan": {
    Component: InfiniteBentoPan,
    config: infiniteBentoPanConfig,
  },
  "tool-menu-slide-in": {
    Component: ToolMenuSlideIn,
    config: toolMenuSlideInConfig,
  },
  "image-expand-to-fullscreen": {
    Component: ImageExpandToFullscreen,
    config: imageExpandToFullscreenConfig,
  },
  "github-stars": { Component: GitHubStars, config: githubStarsConfig },
  "button": { Component: Button, config: buttonConfig },
  "accordion": { Component: Accordion, config: accordionConfig },
  "alert-dialog": { Component: AlertDialog, config: alertDialogConfig },
  "spinner": { Component: Spinner, config: spinnerConfig },
};

// Append the shared controls (e.g. `speed`) to every component config so
// every animation in the customizer exposes the same baseline knobs.
for (const { config } of Object.values(registry)) {
  config.controls = { ...config.controls, ...SHARED_CONTROLS };
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

export default registry;
