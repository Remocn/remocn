import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const perCharacterRiseConfig: ComponentConfig = {
  componentName: "PerCharacterRise",
  importPath: "@/components/remocn/per-character-rise",
  controls: {
    text: { type: "text", default: "One more thing.", label: "Text" },
    distance: {
      type: "number",
      default: 32,
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
