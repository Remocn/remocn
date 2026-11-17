import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const gravityGridConfig: ComponentConfig = {
  componentName: "GravityGrid",
  importPath: "@/components/remocn/gravity-grid",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    caption: {
      type: "text-content",
      default: "Launch videos, in components.",
      description: "Caption",
    },
    impactAt: {
      type: "number",
      default: 72,
      min: 30,
      max: 120,
      step: 1,
      description: "Impact (frame)",
      hiddenFromList: false,
    },
    wellDepth: {
      type: "number",
      default: 5.4,
      min: 1,
      max: 10,
      step: 0.2,
      description: "Well depth",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Hanken Grotesk", grain: true }),
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
