import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const liveActivityConfig: ComponentConfig = {
  componentName: "LiveActivity",
  importPath: "@/components/remocn/live-activity",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    date: {
      type: "text-content",
      default: "Tuesday, October 24",
      description: "Date",
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
  durationInFrames: 285,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
