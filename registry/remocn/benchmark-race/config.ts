import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    note: {
      type: "text-content",
      default: "lower is better",
      description: "Note",
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
    race: {
      type: "number",
      default: 42,
      min: 12,
      max: 120,
      step: 2,
      description: "Race (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist", grain: true }),
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
