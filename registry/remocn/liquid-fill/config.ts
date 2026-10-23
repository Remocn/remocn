import { liquidFillExampleCode } from "@/components/docs/examples/liquid-fill-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const liquidFillConfig: ComponentConfig = {
  componentName: "LiquidFill",
  importPath: "@/components/remocn/liquid-fill",
  controls: {
    liquidColor: { type: "color", default: "#E5322D", description: "Liquid" },
    outlineColor: { type: "color", default: "#FFFFFF", description: "Outline" },
    bubbleColor: { type: "color", default: "#FFFFFF", description: "Bubbles" },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 78,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: liquidFillExampleCode,
};
