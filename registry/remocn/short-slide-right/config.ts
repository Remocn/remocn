import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const shortSlideRightConfig: ComponentConfig = {
  componentName: "ShortSlideRight",
  importPath: "@/components/remocn/short-slide-right",
  controls: {
    text: { type: "text", default: "Move with intent.", label: "Text" },
    distance: {
      type: "number",
      default: 24,
      min: 0,
      max: 120,
      step: 1,
      label: "Distance",
    },
    staggerDelay: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
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
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
