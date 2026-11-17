import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const hatchShadeConfig: ComponentConfig = {
  componentName: "HatchShade",
  importPath: "@/components/remocn/hatch-shade",
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
      default: "24",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "new components, drawn for launch week",
      description: "Caption",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    density: {
      type: "number",
      default: 1,
      min: 0.5,
      max: 2,
      step: 0.1,
      description: "Hatch density",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Fraunces", grain: true }),
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
