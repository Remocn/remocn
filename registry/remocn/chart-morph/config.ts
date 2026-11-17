import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const chartMorphConfig: ComponentConfig = {
  componentName: "ChartMorph",
  importPath: "@/components/remocn/chart-morph",
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
    suffix: {
      type: "text-content",
      default: "k",
      description: "Suffix",
    },
    caption: {
      type: "text-content",
      default: "renders in May",
      description: "Caption",
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 100,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Bar stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Manrope", grain: true }),
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
  durationInFrames: 182,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
