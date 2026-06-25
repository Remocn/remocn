import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const blurOutUpConfig: ComponentConfig = {
  componentName: "BlurOutUp",
  importPath: "@/components/remocn/blur-out-up",
  controls: {
    text: { type: "text", default: "Clear in, airy out.", label: "Text" },
    staggerDelay: {
      type: "number",
      default: 1,
      min: 0,
      max: 8,
      step: 1,
      label: "Stagger",
    },
    fontSize: {
      type: "number",
      default: 72,
      min: 12,
      max: 160,
      step: 1,
      label: "Font size",
    },
    color: { type: "color", default: "#171717", label: "Color" },
    fontWeight: {
      type: "select",
      default: "600",
      options: FONT_WEIGHT_OPTIONS,
      label: "Font weight",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
