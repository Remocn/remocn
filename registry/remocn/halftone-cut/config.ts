import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const halftoneCutConfig: ComponentConfig = {
  componentName: "HalftoneCut",
  importPath: "@/components/remocn/halftone-cut",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    from: {
      type: "text-content",
      default: "Draft one",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Final cut",
      description: "To",
    },
    spread: {
      type: "number",
      default: 34,
      min: 10,
      max: 70,
      step: 1,
      description: "Wave (frames)",
      hiddenFromList: false,
    },
    dotSize: {
      type: "number",
      default: 20,
      min: 8,
      max: 48,
      step: 1,
      description: "Dot size",
      hiddenFromList: false,
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
  durationInFrames: 108,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
