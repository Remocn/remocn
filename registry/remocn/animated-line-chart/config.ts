import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const animatedLineChartConfig: ComponentConfig = {
  componentName: "AnimatedLineChart",
  importPath: "@/components/remocn/animated-line-chart",
  controls: {
    strokeColor: {
      type: "color",
      default: "#22c55e",
      description: "Stroke color",
    },
    strokeWidth: {
      type: "number",
      min: 1,
      max: 16,
      step: 1,
      default: 4,
      description: "Stroke width",
      hiddenFromList: false,
    },
    gridColor: {
      type: "color",
      default: "#27272a",
      description: "Grid color",
    },
    showDot: {
      type: "boolean",
      default: true,
      description: "Show leading dot",
    },
  },
  dimensions: { width: 1000, height: 500 },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
