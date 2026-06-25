import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const scaleDownFadeConfig: ComponentConfig = {
  componentName: "ScaleDownFade",
  importPath: "@/components/remocn/scale-down-fade",
  controls: {
    text: { type: "text", default: "Quietly refined.", label: "Text" },
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
