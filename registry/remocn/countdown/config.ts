import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const countdownConfig: ComponentConfig = {
  componentName: "Countdown",
  importPath: "@/components/remocn/countdown",
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
    finalLabel: {
      type: "text-content",
      default: "Live",
      description: "Final label",
    },
    caption: {
      type: "text-content",
      default: "remocn 2.0",
      description: "Caption",
    },
    indicator: {
      type: "boolean",
      default: true,
      description: "Indicator",
    },
    from: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    beat: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Beat",
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
