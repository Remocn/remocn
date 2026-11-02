import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const timesTurnConfig: ComponentConfig = {
  componentName: "TimesTurn",
  importPath: "@/components/remocn/times-turn",
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
      default: "3",
      description: "Value",
    },
    before: {
      type: "text-content",
      default: "%",
      description: "Before",
    },
    label: {
      type: "text-content",
      default: "more launch cuts from the same storyboard",
      description: "Label",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
