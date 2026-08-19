import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const animatedBarChartConfig: ComponentConfig = {
  componentName: "AnimatedBarChart",
  importPath: "@/components/remocn/animated-bar-chart",
  controls: {
    barColor: {
      type: "color",
      default: "#0ea5e9",
      description: "Bar color",
    },
    gap: {
      type: "number",
      min: 0,
      max: 80,
      step: 2,
      default: 16,
      description: "Gap",
      hiddenFromList: false,
    },
    staggerFrames: {
      type: "number",
      min: 0,
      max: 30,
      step: 1,
      default: 6,
      description: "Stagger frames",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
