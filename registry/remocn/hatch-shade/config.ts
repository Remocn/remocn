import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
