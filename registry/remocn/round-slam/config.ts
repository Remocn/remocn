import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const roundSlamConfig: ComponentConfig = {
  componentName: "RoundSlam",
  importPath: "@/components/remocn/round-slam",
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
    round: {
      type: "text-content",
      default: "ROUND 1",
      description: "Round",
    },
    call: {
      type: "text-content",
      default: "SHIP!",
      description: "Call",
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
  durationInFrames: 110,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
