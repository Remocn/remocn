import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const inkBloomConfig: ComponentConfig = {
  componentName: "InkBloom",
  importPath: "@/components/remocn/ink-bloom",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    seed: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    resolveAt: {
      type: "number",
      default: 100,
      min: 40,
      max: 150,
      step: 1,
      description: "Resolve (frame)",
      hiddenFromList: false,
    },
    sink: {
      type: "number",
      default: 0.33,
      min: 0.1,
      max: 0.6,
      step: 0.01,
      description: "Sink depth",
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
