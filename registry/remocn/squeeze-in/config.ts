import {
  type ComponentConfig,
  enumVariants,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const squeezeInConfig: ComponentConfig = {
  componentName: "SqueezeIn",
  importPath: "@/components/remocn/squeeze-in",
  controls: {
    text: {
      type: "text-content",
      default: "commas",
      description: "Text",
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
    stagger: {
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      description: "Frames / char",
      hiddenFromList: false,
    },
    squeeze: {
      type: "number",
      min: 0,
      max: 0.2,
      step: 0.01,
      default: 0.03,
      description: "Extra gap (em)",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: enumVariants(FONT_WEIGHT_OPTIONS),
      description: "Font weight",
    },
  },
  dimensions: { width: 620, height: 110 },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
