import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const softBlurInConfig: ComponentConfig = {
  componentName: "SoftBlurIn",
  importPath: "@/components/remocn/soft-blur-in",
  controls: {
    text: {
      type: "text-content",
      default: "Think different.",
      description: "Text",
    },
    blur: {
      type: "number",
      min: 1,
      max: 30,
      step: 1,
      default: 12,
      description: "Blur",
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
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  dimensions: { width: 600, height: 100 },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
