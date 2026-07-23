import { iconScatterExampleCode } from "@/components/docs/examples/icon-scatter-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const iconScatterConfig: ComponentConfig = {
  componentName: "iconScatter",
  importPath: "@/components/remocn/icon-scatter",
  controls: {
    count: {
      type: "number",
      default: 15,
      min: 4,
      max: 30,
      step: 1,
      label: "Icon count",
    },
    color: { type: "color", default: "#fafafa", label: "Icons" },
    coverColor: { type: "color", default: "#0a0a0a", label: "Cover" },
    flyDistance: {
      type: "number",
      default: 260,
      min: 80,
      max: 500,
      step: 10,
      label: "Fly distance",
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: iconScatterExampleCode,
};
