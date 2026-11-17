import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const concentricScaleConfig: ComponentConfig = {
  componentName: "ConcentricScale",
  importPath: "@/components/remocn/concentric-scale",
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
    beat: {
      type: "number",
      default: 30,
      min: 10,
      max: 60,
      step: 1,
      description: "Ring beat (frames)",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 200,
      max: 600,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
