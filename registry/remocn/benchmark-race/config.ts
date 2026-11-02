import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const benchmarkRaceConfig: ComponentConfig = {
  componentName: "BenchmarkRace",
  importPath: "@/components/remocn/benchmark-race",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    unit: {
      type: "text-content",
      default: "s",
      description: "Unit",
    },
    statement: {
      type: "text-content",
      default: "12× faster",
      description: "Statement",
    },
    title: {
      type: "text-content",
      default: "Cold render, 1080p · median of 50 runs",
      description: "Title",
    },
    decimals: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Decimals",
      hiddenFromList: false,
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
