import {
  type ComponentConfig,
  enumVariants,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const sheenSlideInConfig: ComponentConfig = {
  componentName: "SheenSlideIn",
  importPath: "@/components/remocn/sheen-slide-in",
  controls: {
    text: {
      type: "text-content",
      default: "Introducing",
      description: "Text",
    },
    exitAt: {
      type: "number",
      min: 30,
      max: 150,
      step: 5,
      default: 60,
      description: "Exit frame",
      hiddenFromList: false,
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
    baseColor: {
      type: "color",
      default: "#18181b",
      description: "Base color",
    },
    sheenColor: {
      type: "color",
      default: "#4f8ef7",
      description: "Sheen color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: enumVariants(FONT_WEIGHT_OPTIONS),
      description: "Font weight",
    },
  },
  dimensions: { width: 620, height: 120 },
  durationInFrames: 70,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
