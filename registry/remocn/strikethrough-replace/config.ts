import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const strikethroughReplaceConfig: ComponentConfig = {
  componentName: "StrikethroughReplace",
  importPath: "@/components/remocn/strikethrough-replace",
  controls: {
    from: {
      type: "text-content",
      default: "$49/mo",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Free",
      description: "To",
    },
    lineColor: {
      type: "color",
      default: "#ff5e3a",
      description: "Line color",
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 96,
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
      default: "700",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  dimensions: { width: 300, height: 130 },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
