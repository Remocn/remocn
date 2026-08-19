import { iconScatterExampleCode } from "@/components/docs/examples/icon-scatter-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const iconScatterConfig: ComponentConfig = {
  componentName: "iconScatter",
  importPath: "@/components/remocn/icon-scatter",
  controls: {
    count: {
      type: "number",
      min: 4,
      max: 30,
      step: 1,
      default: 15,
      description: "Icon count",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#fafafa",
      description: "Icons",
    },
    coverColor: {
      type: "color",
      default: "#0a0a0a",
      description: "Cover",
    },
    flyDistance: {
      type: "number",
      min: 80,
      max: 500,
      step: 10,
      default: 260,
      description: "Fly distance",
      hiddenFromList: false,
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: iconScatterExampleCode,
};
