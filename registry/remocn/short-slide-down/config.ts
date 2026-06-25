import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const shortSlideDownConfig: ComponentConfig = {
  componentName: "ShortSlideDown",
  importPath: "@/components/remocn/short-slide-down",
  controls: {
    text: { type: "text", default: "Build from above.", label: "Text" },
    entryOffset: {
      type: "number",
      default: 28,
      min: 8,
      max: 80,
      step: 1,
      label: "Entry offset",
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
