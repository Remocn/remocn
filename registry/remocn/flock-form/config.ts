import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const flockFormConfig: ComponentConfig = {
  componentName: "FlockForm",
  importPath: "@/components/remocn/flock-form",
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
    count: {
      type: "number",
      default: 340,
      min: 0,
      max: 1020,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 18,
      min: 0,
      max: 30,
      step: 1,
      description: "Arrival stagger",
      hiddenFromList: false,
    },
    birdSize: {
      type: "number",
      default: 1,
      min: 0.5,
      max: 2,
      step: 0.05,
      description: "Bird size",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ ink: false, grain: true }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
