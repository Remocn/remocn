import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const lineCascadeConfig: ComponentConfig = {
  componentName: "LineCascade",
  importPath: "@/components/remocn/line-cascade",
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
      default: "240",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "launch films rendered with remocn today",
      description: "Caption",
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 300,
      max: 700,
      step: 100,
      description: "Caption weight",
      hiddenFromList: false,
    },
    lineSpacing: {
      type: "number",
      default: 6.5,
      min: 4,
      max: 12,
      step: 0.5,
      description: "Line spacing",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
