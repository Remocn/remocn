import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const animatedBarChartConfig: ComponentConfig = {
  componentName: "AnimatedBarChart",
  importPath: "@/components/remocn/animated-bar-chart",
  controls: {
    barColor: { type: "color", default: "#0ea5e9", label: "Bar color" },
    gap: {
      type: "number",
      default: 16,
      min: 0,
      max: 80,
      step: 2,
      label: "Gap",
    },
    staggerFrames: {
      type: "number",
      default: 6,
      min: 0,
      max: 30,
      step: 1,
      label: "Stagger frames",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
