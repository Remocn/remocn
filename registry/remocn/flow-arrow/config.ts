import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const flowArrowConfig: ComponentConfig = {
  componentName: "FlowArrow",
  importPath: "@/components/remocn/flow-arrow",
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
      default: "3×",
      description: "Metric",
    },
    label: {
      type: "text-content",
      default: "faster growth",
      description: "Label",
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    flight: {
      type: "number",
      default: 32,
      min: 12,
      max: 60,
      step: 1,
      description: "Flight (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Space Grotesk", grain: true }),
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
  durationInFrames: 155,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
