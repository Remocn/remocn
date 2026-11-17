import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const quadrantPlotConfig: ComponentConfig = {
  componentName: "QuadrantPlot",
  importPath: "@/components/remocn/quadrant-plot",
  lists: {
    xLabels: {
      default: ["Slow", "Fast"],
      description: "X axis ends",
      min: 2,
      max: 2,
    },
    yLabels: {
      default: ["Hard", "Easy"],
      description: "Y axis ends",
      min: 2,
      max: 2,
    },
  },
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
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Dot stagger",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
