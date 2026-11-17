import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const resClimbConfig: ComponentConfig = {
  componentName: "ResClimb",
  importPath: "@/components/remocn/res-climb",
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
      default: "200+",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "components, ready to drop in",
      description: "Label",
    },
    eyebrow: {
      type: "text-content",
      default: "remocn registry",
      description: "Eyebrow",
    },
    snapAt: {
      type: "number",
      default: 28,
      min: 0,
      max: 90,
      step: 1,
      description: "First snap (frame)",
      hiddenFromList: false,
    },
    build: {
      type: "number",
      default: 12,
      min: 0,
      max: 40,
      step: 1,
      description: "Build (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Onest", grain: true }),
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
  durationInFrames: 115,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
