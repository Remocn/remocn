import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const blueprintConfig: ComponentConfig = {
  componentName: "Blueprint",
  importPath: "@/components/remocn/blueprint",
  controls: {
    blueprintColor: {
      type: "color",
      default: "#173C8F",
      description: "Blueprint",
    },
    lineColor: { type: "color", default: "#FFFFFF", description: "Lines" },
    calloutColor: {
      type: "color",
      default: "#E5322D",
      description: "Callout",
    },
    productColor: {
      type: "color",
      default: "#E5322D",
      description: "Product",
    },
    background: {
      type: "color",
      default: "#FFFFFF",
      description: "Background",
    },
  },
  durationInFrames: 75,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#173C8F" },
};
