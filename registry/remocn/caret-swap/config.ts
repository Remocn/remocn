import {
  type ComponentConfig,
  enumVariants,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const caretSwapConfig: ComponentConfig = {
  componentName: "CaretSwap",
  importPath: "@/components/remocn/caret-swap",
  controls: {
    fromText: {
      type: "text-content",
      default: "Executing it?",
      description: "From text",
    },
    toText: {
      type: "text-content",
      default: "That's where everyone quits",
      description: "To text",
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    swapAt: {
      type: "number",
      min: 10,
      max: 120,
      step: 5,
      default: 20,
      description: "Swap frame",
      hiddenFromList: false,
    },
    typeSpeed: {
      type: "number",
      min: 1,
      max: 6,
      step: 1,
      default: 1,
      description: "Frames / char",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    caretColor: {
      type: "color",
      default: "#FF4DAA",
      description: "Caret top",
    },
    caretColorEnd: {
      type: "color",
      default: "#8A5CF6",
      description: "Caret bottom",
    },
    fontWeight: {
      type: "enum",
      default: "400",
      variants: enumVariants(FONT_WEIGHT_OPTIONS),
      description: "Font weight",
    },
  },
  dimensions: { width: 1100, height: 120 },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#fdf6f0" },
};
