import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const sharedAxisZConfig: ComponentConfig = {
  componentName: "SharedAxisZ",
  importPath: "@/components/remocn/shared-axis-z",
  controls: {
    fromText: {
      type: "text-content",
      default: "Zooming between states.",
      description: "From text",
    },
    toText: {
      type: "text-content",
      default: "Elevate and settle.",
      description: "To text",
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
  dimensions: { width: 870, height: 100 },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
