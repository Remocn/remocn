import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ridgelineConfig: ComponentConfig = {
  componentName: "Ridgeline",
  importPath: "@/components/remocn/ridgeline",
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
    highlightLabel: {
      type: "text-content",
      default: "With remocn",
      description: "Highlight label",
    },
    value: {
      type: "text-content",
      default: "2.6×",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "more videos per team",
      description: "Caption",
    },
    axisLabel: {
      type: "text-content",
      default: "videos per team, per month",
      description: "Axis label",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
