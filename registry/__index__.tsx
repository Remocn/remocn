import type React from "react";
import { type ComponentConfig, SHARED_CONTROLS } from "@/lib/customizer-config";

import { AIGenerationCanvas } from "@/registry/remocn/ai-generation-canvas";
import { aiGenerationCanvasConfig } from "@/registry/remocn/ai-generation-canvas/config";
import { AnimatedBarChart } from "@/registry/remocn/animated-bar-chart";
import { animatedBarChartConfig } from "@/registry/remocn/animated-bar-chart/config";
import { AnimatedLineChart } from "@/registry/remocn/animated-line-chart";
import { animatedLineChartConfig } from "@/registry/remocn/animated-line-chart/config";
import { SoftBlurIn } from "@/registry/remocn/soft-blur-in";
import { softBlurInConfig } from "@/registry/remocn/soft-blur-in/config";
import { PerCharacterRise } from "@/registry/remocn/per-character-rise";
import { perCharacterRiseConfig } from "@/registry/remocn/per-character-rise/config";
import { BottomUpLetters } from "@/registry/remocn/bottom-up-letters";
import { bottomUpLettersConfig } from "@/registry/remocn/bottom-up-letters/config";
import { TopDownLetters } from "@/registry/remocn/top-down-letters";
import { topDownLettersConfig } from "@/registry/remocn/top-down-letters/config";
import { SpringScaleIn } from "@/registry/remocn/spring-scale-in";
import { springScaleInConfig } from "@/registry/remocn/spring-scale-in/config";
import { MicroScaleFade } from "@/registry/remocn/micro-scale-fade";
import { microScaleFadeConfig } from "@/registry/remocn/micro-scale-fade/config";
import { ScaleDownFade } from "@/registry/remocn/scale-down-fade";
import { scaleDownFadeConfig } from "@/registry/remocn/scale-down-fade/config";
import { BlurOutUp } from "@/registry/remocn/blur-out-up";
import { blurOutUpConfig } from "@/registry/remocn/blur-out-up/config";
import { FocusBlurResolve } from "@/registry/remocn/focus-blur-resolve";
import { focusBlurResolveConfig } from "@/registry/remocn/focus-blur-resolve/config";
import { LineByLineSlide } from "@/registry/remocn/line-by-line-slide";
import { lineByLineSlideConfig } from "@/registry/remocn/line-by-line-slide/config";
import { PerWordCrossfade } from "@/registry/remocn/per-word-crossfade";
import { perWordCrossfadeConfig } from "@/registry/remocn/per-word-crossfade/config";
import { FadeThrough } from "@/registry/remocn/fade-through";
import { fadeThroughConfig } from "@/registry/remocn/fade-through/config";
import { SharedAxisY } from "@/registry/remocn/shared-axis-y";
import { sharedAxisYConfig } from "@/registry/remocn/shared-axis-y/config";
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
import { LandingCodeShowcase } from "@/registry/remocn/landing-code-showcase";
import { landingCodeShowcaseConfig } from "@/registry/remocn/landing-code-showcase/config";
import { LiveCodeCompilation } from "@/registry/remocn/live-code-compilation";
import { liveCodeCompilationConfig } from "@/registry/remocn/live-code-compilation/config";
import { MarkerHighlight } from "@/registry/remocn/marker-highlight";
import { markerHighlightConfig } from "@/registry/remocn/marker-highlight/config";
import { MaskRevealUp } from "@/registry/remocn/mask-reveal-up";
import { maskRevealUpConfig } from "@/registry/remocn/mask-reveal-up/config";
import { MatrixDecode } from "@/registry/remocn/matrix-decode";
import { matrixDecodeConfig } from "@/registry/remocn/matrix-decode/config";
import { MeshGradientBg } from "@/registry/remocn/mesh-gradient-bg";
import { meshGradientBgConfig } from "@/registry/remocn/mesh-gradient-bg/config";
import { NumberWheel } from "@/registry/remocn/number-wheel";
import { numberWheelConfig } from "@/registry/remocn/number-wheel/config";
import { PerspectiveMarquee } from "@/registry/remocn/perspective-marquee";
import { perspectiveMarqueeConfig } from "@/registry/remocn/perspective-marquee/config";
import { PricingTierFocus } from "@/registry/remocn/pricing-tier-focus";
import { pricingTierFocusConfig } from "@/registry/remocn/pricing-tier-focus/config";
import { ProgressSteps } from "@/registry/remocn/progress-steps";
import { progressStepsConfig } from "@/registry/remocn/progress-steps/config";
import { RGBGlitchText } from "@/registry/remocn/rgb-glitch-text";
import { rgbGlitchTextConfig } from "@/registry/remocn/rgb-glitch-text/config";
import { RollingNumber } from "@/registry/remocn/rolling-number";
import { rollingNumberConfig } from "@/registry/remocn/rolling-number/config";
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
import { StaggeredFadeUp } from "@/registry/remocn/staggered-fade-up";
import { staggeredFadeUpConfig } from "@/registry/remocn/staggered-fade-up/config";
import { StrikethroughReplace } from "@/registry/remocn/strikethrough-replace";
import { strikethroughReplaceConfig } from "@/registry/remocn/strikethrough-replace/config";
import { TerminalSimulator } from "@/registry/remocn/terminal-simulator";
import { terminalSimulatorConfig } from "@/registry/remocn/terminal-simulator/config";
import { TerminalToBrowserDeploy } from "@/registry/remocn/terminal-to-browser-deploy";
import { terminalToBrowserDeployConfig } from "@/registry/remocn/terminal-to-browser-deploy/config";
import { ToolMenuSlideIn } from "@/registry/remocn/tool-menu-slide-in";
import { toolMenuSlideInConfig } from "@/registry/remocn/tool-menu-slide-in/config";
import { TrackingIn } from "@/registry/remocn/tracking-in";
import { trackingInConfig } from "@/registry/remocn/tracking-in/config";
import { Typewriter } from "@/registry/remocn/typewriter";
import { typewriterConfig } from "@/registry/remocn/typewriter/config";
import { XFollowCard } from "@/registry/remocn/x-follow-card";
import { xFollowCardConfig } from "@/registry/remocn/x-follow-card/config";
import { XFollowersOverview } from "@/registry/remocn/x-followers-overview";
import { xFollowersOverviewConfig } from "@/registry/remocn/x-followers-overview/config";
import { Confetti } from "@/registry/remocn/confetti";
import { confettiConfig } from "@/registry/remocn/confetti/config";
import { ChatGpt } from "@/registry/remocn/chat-gpt";
import { chatGptConfig } from "@/registry/remocn/chat-gpt/config";
import { V0 } from "@/registry/remocn/v0";
import { v0Config } from "@/registry/remocn/v0/config";
import { ClaudeCode } from "@/registry/remocn/claude-code";
import { claudeCodeConfig } from "@/registry/remocn/claude-code/config";
import { OpenCode } from "@/registry/remocn/opencode";
import { opencodeConfig } from "@/registry/remocn/opencode/config";
import { ClaudeChat } from "@/registry/remocn/claude-chat";
import { claudeChatConfig } from "@/registry/remocn/claude-chat/config";
import { Accordion } from "@/registry/remocn-ui/accordion";
import { accordionConfig } from "@/registry/remocn-ui/accordion/config";
import { AlertDialog } from "@/registry/remocn-ui/alert-dialog";
import { alertDialogConfig } from "@/registry/remocn-ui/alert-dialog/config";
import { Dialog } from "@/registry/remocn-ui/dialog";
import { dialogConfig } from "@/registry/remocn-ui/dialog/config";
import { Drawer } from "@/registry/remocn-ui/drawer";
import { drawerConfig } from "@/registry/remocn-ui/drawer/config";
import { Sheet } from "@/registry/remocn-ui/sheet";
import { sheetConfig } from "@/registry/remocn-ui/sheet/config";
import { Button } from "@/registry/remocn-ui/button";
import { buttonConfig } from "@/registry/remocn-ui/button/config";
import { Checkbox } from "@/registry/remocn-ui/checkbox";
import { checkboxConfig } from "@/registry/remocn-ui/checkbox/config";
import { Input } from "@/registry/remocn-ui/input";
import { inputConfig } from "@/registry/remocn-ui/input/config";
import { BlurInPreview } from "@/registry/remocn-ui/blur-in/preview";
import { blurInConfig } from "@/registry/remocn-ui/blur-in/config";
import { Radio } from "@/registry/remocn-ui/radio";
import { radioConfig } from "@/registry/remocn-ui/radio/config";
import { Spinner } from "@/registry/remocn-ui/spinner";
import { spinnerConfig } from "@/registry/remocn-ui/spinner/config";
import { CaretPreview } from "@/registry/remocn-ui/caret/preview";
import { caretConfig } from "@/registry/remocn-ui/caret/config";
import { Switch } from "@/registry/remocn-ui/switch";
import { switchConfig } from "@/registry/remocn-ui/switch/config";
import { Select } from "@/registry/remocn-ui/select";
import { selectConfig } from "@/registry/remocn-ui/select/config";
import { SelectItem } from "@/registry/remocn-ui/select-item";
import { selectItemConfig } from "@/registry/remocn-ui/select-item/config";
import { DropdownMenu } from "@/registry/remocn-ui/dropdown-menu";
import { dropdownMenuConfig } from "@/registry/remocn-ui/dropdown-menu/config";
import { DropdownMenuItem } from "@/registry/remocn-ui/dropdown-menu-item";
import { dropdownMenuItemConfig } from "@/registry/remocn-ui/dropdown-menu-item/config";
import { Tabs } from "@/registry/remocn-ui/tabs";
import { tabsConfig } from "@/registry/remocn-ui/tabs/config";
import { CursorPreview } from "@/registry/remocn-ui/cursor/preview";
import { cursorConfig } from "@/registry/remocn-ui/cursor/config";
import { ToastPreview } from "@/registry/remocn-ui/toast/preview";
import { toastConfig } from "@/registry/remocn-ui/toast/config";
import { CommandMenuItem } from "@/registry/remocn-ui/command-menu-item";
import { commandMenuItemConfig } from "@/registry/remocn-ui/command-menu-item/config";
import { CommandMenu } from "@/registry/remocn-ui/command-menu";
import { commandMenuConfig } from "@/registry/remocn-ui/command-menu/config";
import { TooltipPreview } from "@/registry/remocn-ui/tooltip/preview";
import { tooltipConfig } from "@/registry/remocn-ui/tooltip/config";
import { ProgressPreview } from "@/registry/remocn-ui/progress/preview";
import { progressConfig } from "@/registry/remocn-ui/progress/config";
import { SkeletonBlockPreview } from "@/registry/remocn-ui/skeleton-block/preview";
import { skeletonBlockConfig } from "@/registry/remocn-ui/skeleton-block/config";
import { SkeletonPreview } from "@/registry/remocn-ui/skeleton/preview";
import { skeletonConfig } from "@/registry/remocn-ui/skeleton/config";
import { SliderPreview } from "@/registry/remocn-ui/slider/preview";
import { sliderConfig } from "@/registry/remocn-ui/slider/config";
import { Combobox } from "@/registry/remocn-ui/combobox";
import { comboboxConfig } from "@/registry/remocn-ui/combobox/config";
import { PopoverPreview } from "@/registry/remocn-ui/popover/preview";
import { popoverConfig } from "@/registry/remocn-ui/popover/config";
import { ContextMenuPreview } from "@/registry/remocn-ui/context-menu/preview";
import { contextMenuConfig } from "@/registry/remocn-ui/context-menu/config";
import { ToggleGroup } from "@/registry/remocn-ui/toggle-group";
import { toggleGroupConfig } from "@/registry/remocn-ui/toggle-group/config";
import { StepperPreview } from "@/registry/remocn-ui/stepper/preview";
import { stepperConfig } from "@/registry/remocn-ui/stepper/config";
import { Resizable } from "@/registry/remocn-ui/resizable";
import { resizableConfig } from "@/registry/remocn-ui/resizable/config";
import { ZoomThroughTransition } from "@/registry/remocn/zoom-through-transition";
import { zoomThroughTransitionConfig } from "@/registry/remocn/zoom-through-transition/config";
import { BackdropDemo } from "@/components/docs/examples/backdrop-demo";
import { backdropConfig } from "@/registry/remocn/backdrop/config";

export interface RegistryEntry {
  Component: React.ComponentType<any>;
  config: ComponentConfig;
}

const registry: Record<string, RegistryEntry> = {
  "soft-blur-in": { Component: SoftBlurIn, config: softBlurInConfig },
  "per-character-rise": { Component: PerCharacterRise, config: perCharacterRiseConfig },
  "bottom-up-letters": { Component: BottomUpLetters, config: bottomUpLettersConfig },
  "top-down-letters": { Component: TopDownLetters, config: topDownLettersConfig },
  "spring-scale-in": { Component: SpringScaleIn, config: springScaleInConfig },
  "micro-scale-fade": { Component: MicroScaleFade, config: microScaleFadeConfig },
  "scale-down-fade": { Component: ScaleDownFade, config: scaleDownFadeConfig },
  "blur-out-up": { Component: BlurOutUp, config: blurOutUpConfig },
  "focus-blur-resolve": { Component: FocusBlurResolve, config: focusBlurResolveConfig },
  "line-by-line-slide": { Component: LineByLineSlide, config: lineByLineSlideConfig },
  "per-word-crossfade": { Component: PerWordCrossfade, config: perWordCrossfadeConfig },
  "fade-through": { Component: FadeThrough, config: fadeThroughConfig },
  "shared-axis-y": { Component: SharedAxisY, config: sharedAxisYConfig },
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
  "mask-reveal-up": {
    Component: MaskRevealUp,
    config: maskRevealUpConfig,
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
  "drag-and-drop-flow": {
    Component: DragAndDropFlow,
    config: dragAndDropFlowConfig,
  },
  "progress-steps": { Component: ProgressSteps, config: progressStepsConfig },
  "frosted-glass-wipe": {
    Component: FrostedGlassWipe,
    config: frostedGlassWipeConfig,
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
  "number-wheel": { Component: NumberWheel, config: numberWheelConfig },
  "rolling-number": { Component: RollingNumber, config: rollingNumberConfig },
  "x-follow-card": { Component: XFollowCard, config: xFollowCardConfig },
  "x-followers-overview": {
    Component: XFollowersOverview,
    config: xFollowersOverviewConfig,
  },
  "confetti": { Component: Confetti, config: confettiConfig },
  "backdrop": { Component: BackdropDemo, config: backdropConfig },
  "claude-chat": { Component: ClaudeChat, config: claudeChatConfig },
  "chat-gpt": { Component: ChatGpt, config: chatGptConfig },
  "v0": { Component: V0, config: v0Config },
  "claude-code": { Component: ClaudeCode, config: claudeCodeConfig },
  "opencode": { Component: OpenCode, config: opencodeConfig },
  "button": { Component: Button, config: buttonConfig },
  "accordion": { Component: Accordion, config: accordionConfig },
  "alert-dialog": { Component: AlertDialog, config: alertDialogConfig },
  "dialog": { Component: Dialog, config: dialogConfig },
  "sheet": { Component: Sheet, config: sheetConfig },
  "drawer": { Component: Drawer, config: drawerConfig },
  "checkbox": { Component: Checkbox, config: checkboxConfig },
  "input": { Component: Input, config: inputConfig },
  // blur-in WRAPS a single child, so the customizer Component is the
  // preview-only BlurInPreview wrapper (it supplies a fixed sample card and
  // centers it on a stage); the shipped BlurIn is a pure child-wrapper.
  "blur-in": { Component: BlurInPreview, config: blurInConfig },
  "radio": { Component: Radio, config: radioConfig },
  "switch": { Component: Switch, config: switchConfig },
  "select": { Component: Select, config: selectConfig },
  "select-item": { Component: SelectItem, config: selectItemConfig },
  "dropdown-menu": { Component: DropdownMenu, config: dropdownMenuConfig },
  "dropdown-menu-item": {
    Component: DropdownMenuItem,
    config: dropdownMenuItemConfig,
  },
  "tabs": { Component: Tabs, config: tabsConfig },
  // cursor's customizer Component is the preview-only CursorPreview wrapper (it
  // runs a fixed demo path through useCursorPath); the shipped Cursor is pure.
  "cursor": { Component: CursorPreview, config: cursorConfig },
  // toast's customizer Component is the preview-only ToastPreview wrapper (it
  // centers the toast on a theme-background stage); the shipped Toast is a
  // placement-agnostic card the caller positions.
  "toast": { Component: ToastPreview, config: toastConfig },
  "command-menu-item": {
    Component: CommandMenuItem,
    config: commandMenuItemConfig,
  },
  // command-menu needs NO preview wrapper: like dialog it renders an intrinsic
  // inset:0 backdrop + centered panel, so the customizer mounts it directly.
  "command-menu": { Component: CommandMenu, config: commandMenuConfig },
  // tooltip's customizer Component is the preview-only TooltipPreview wrapper: a
  // bare bubble has no backdrop and would not center as the composition root.
  "tooltip": { Component: TooltipPreview, config: tooltipConfig },
  // progress's customizer Component is the preview-only ProgressPreview wrapper:
  // a bare inline bar would sit top-left, so the wrapper centers it on a stage.
  "progress": { Component: ProgressPreview, config: progressConfig },
  // skeleton-block is the shimmer motion atom; its preview centers the bare block
  // on a stage. skeleton is the state atom whose preview supplies demo content +
  // placeholder for the loading↔loaded crossfade.
  "skeleton-block": {
    Component: SkeletonBlockPreview,
    config: skeletonBlockConfig,
  },
  "skeleton": { Component: SkeletonPreview, config: skeletonConfig },
  // slider's customizer Component is the preview-only SliderPreview wrapper: a
  // bare inline bar would sit top-left, so the wrapper centers it on a stage.
  "slider": { Component: SliderPreview, config: sliderConfig },
  // combobox registers RAW (no preview wrapper): like select it paints its own
  // opaque inset:0 wrapper, so the customizer mounts it directly and it centers.
  "combobox": { Component: Combobox, config: comboboxConfig },
  // popover's customizer Component is the preview-only PopoverPreview wrapper: a
  // bare card has no backdrop and would not center as the composition root.
  "popover": { Component: PopoverPreview, config: popoverConfig },
  // context-menu's customizer Component is the preview-only ContextMenuPreview
  // wrapper: a bare panel (transparent, caller-positioned) would sit top-left,
  // so the wrapper centers it on a stage.
  "context-menu": { Component: ContextMenuPreview, config: contextMenuConfig },
  // toggle-group registers RAW (no preview wrapper): like tabs it paints its own
  // opaque inset:0 centered stage, so the customizer mounts it directly.
  "toggle-group": { Component: ToggleGroup, config: toggleGroupConfig },
  // stepper's customizer Component is the preview-only StepperPreview wrapper: a
  // bare wide horizontal element would sit top-left, so the wrapper centers it.
  "stepper": { Component: StepperPreview, config: stepperConfig },
  // resizable registers RAW (no preview wrapper): its index.tsx already paints
  // an opaque inset:0 stage that centers the fixed-size bordered box, like tabs.
  "resizable": { Component: Resizable, config: resizableConfig },
  "spinner": { Component: Spinner, config: spinnerConfig },
  "caret": { Component: CaretPreview, config: caretConfig },
};

// Append the shared controls (e.g. `speed`) to every component config so
// every animation in the customizer exposes the same baseline knobs.
for (const { config } of Object.values(registry)) {
  config.controls = { ...config.controls, ...SHARED_CONTROLS };
}

const backdrop = registry["backdrop"];
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

const v0 = registry["v0"];
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

const opencode = registry["opencode"];
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
