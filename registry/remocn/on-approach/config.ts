import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const onApproachConfig: ComponentConfig = {
  componentName: "OnApproach",
  importPath: "@/components/remocn/on-approach",
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
    lead: {
      type: "text-content",
      default: "Wheels up",
      description: "Lead",
    },
    interval: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Interval",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
