import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const handwriteConfig: ComponentConfig = {
  componentName: "Handwrite",
  importPath: "@/components/remocn/handwrite",
  controls: {
    text: { type: "text", default: "Made by hand", label: "Text" },
    fontSize: {
      type: "number",
      default: 72,
      min: 24,
      max: 120,
      step: 1,
      label: "Font size",
    },
    perStep: {
      type: "number",
      default: 1.6,
      min: 0.5,
      max: 4,
      step: 0.1,
      label: "Letters / pose",
    },
    weight: {
      type: "select",
      default: "600",
      options: FONT_WEIGHT_OPTIONS,
      label: "Font weight",
    },
    color: { type: "color", default: "#26242c", label: "Color" },
    align: {
      type: "select",
      default: "center",
      options: ["center", "left"],
      label: "Align",
    },
    step: {
      type: "number",
      default: 3,
      min: 1,
      max: 6,
      step: 1,
      label: "Frames / pose",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
