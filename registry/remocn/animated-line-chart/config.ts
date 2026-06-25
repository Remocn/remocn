import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const animatedLineChartConfig: ComponentConfig = {
  componentName: "AnimatedLineChart",
  importPath: "@/components/remocn/animated-line-chart",
  controls: {
    strokeColor: { type: "color", default: "#22c55e", label: "Stroke color" },
    strokeWidth: {
      type: "number",
      default: 4,
      min: 1,
      max: 16,
      step: 1,
      label: "Stroke width",
    },
    gridColor: { type: "color", default: "#27272a", label: "Grid color" },
    showDot: { type: "boolean", default: true, label: "Show leading dot" },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
