import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const axisFlexConfig: ComponentConfig = {
  componentName: "AxisFlex",
  importPath: "@/components/remocn/axis-flex",
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
    word: {
      type: "text-content",
      default: "elastic",
      description: "Word",
    },
    line: {
      type: "text-content",
      default: "One family, every width",
      description: "Line",
    },
    settleAt: {
      type: "number",
      default: 84,
      min: 20,
      max: 120,
      step: 1,
      description: "Settle at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Mona Sans", ink: false }),
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
