import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const topDownLettersConfig: ComponentConfig = {
  componentName: "TopDownLetters",
  importPath: "@/components/remocn/top-down-letters",
  controls: {
    text: { type: "text", default: "Signal", label: "Text" },
    staggerDelay: {
      type: "number",
      default: 3,
      min: 1,
      max: 12,
      step: 1,
      label: "Stagger",
    },
    distance: {
      type: "number",
      default: 46,
      min: 0,
      max: 120,
      step: 1,
      label: "Distance",
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
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
