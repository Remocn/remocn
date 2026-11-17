import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const dominoRunConfig: ComponentConfig = {
  componentName: "DominoRun",
  importPath: "@/components/remocn/domino-run",
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
    value: {
      type: "text-content",
      default: "10×",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "Every push tips a bigger one.",
      description: "Caption",
    },
    count: {
      type: "number",
      default: 13,
      min: 0,
      max: 39,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 1.2,
      min: 0,
      max: 6,
      step: 0.2,
      description: "Domino stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque", ink: false, grain: true }),
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
