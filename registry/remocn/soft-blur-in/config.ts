import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const softBlurInConfig: ComponentConfig = {
  componentName: "SoftBlurIn",
  importPath: "@/components/remocn/soft-blur-in",
  controls: {
    text: { type: "text", default: "Think different.", label: "Text" },
    blur: {
      type: "number",
      default: 12,
      min: 1,
      max: 30,
      step: 1,
      label: "Blur",
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
