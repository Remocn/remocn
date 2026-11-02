import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const fontCycleConfig: ComponentConfig = {
  componentName: "FontCycle",
  importPath: "@/components/remocn/font-cycle",
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
    word: {
      type: "text-content",
      default: "Launch",
      description: "Word",
    },
    showLabel: {
      type: "boolean",
      default: true,
      description: "Show label",
    },
    passes: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Passes",
      hiddenFromList: false,
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
