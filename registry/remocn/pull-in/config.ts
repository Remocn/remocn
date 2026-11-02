import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pullInConfig: ComponentConfig = {
  componentName: "PullIn",
  importPath: "@/components/remocn/pull-in",
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
      default: "Now in",
      description: "Lead",
    },
    hold: {
      type: "number",
      default: 24,
      min: 0,
      max: 72,
      step: 1,
      description: "Hold",
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
