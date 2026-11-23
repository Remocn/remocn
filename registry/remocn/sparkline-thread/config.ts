import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const sparklineThreadConfig: ComponentConfig = {
  componentName: "SparklineThread",
  importPath: "@/components/remocn/sparkline-thread",
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
    metric: {
      type: "text-content",
      default: "+212%",
      description: "Metric",
    },
    label: {
      type: "text-content",
      default: "weekly renders",
      description: "Label",
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Point stagger",
      hiddenFromList: false,
    },
    drawDuration: {
      type: "number",
      default: 42,
      min: 12,
      max: 90,
      step: 1,
      description: "Draw (frames)",
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
