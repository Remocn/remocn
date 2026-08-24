import {
  type ComponentConfig,
  enumVariants,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const wordPushConfig: ComponentConfig = {
  componentName: "WordPush",
  importPath: "@/components/remocn/word-push",
  controls: {
    text: {
      type: "text-content",
      default: "move at your own pace",
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
    wordGap: {
      type: "number",
      min: 3,
      max: 30,
      step: 1,
      default: 10,
      description: "Frames / word",
      hiddenFromList: false,
    },
    accel: {
      type: "number",
      min: 0.5,
      max: 1,
      step: 0.05,
      default: 0.8,
      description: "Gap shrink / word",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "400",
      variants: enumVariants(FONT_WEIGHT_OPTIONS),
      description: "Font weight",
    },
  },
  dimensions: { width: 760, height: 110 },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
