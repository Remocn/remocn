import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
