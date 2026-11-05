import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const timerDuelConfig: ComponentConfig = {
  componentName: "TimerDuel",
  importPath: "@/components/remocn/timer-duel",
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
    beforeLabel: {
      type: "text-content",
      default: "Before",
      description: "Before label",
    },
    afterLabel: {
      type: "text-content",
      default: "With remocn",
      description: "After label",
    },
    before: {
      type: "number",
      default: 2718.4,
      min: 0,
      max: 8155.2,
      step: 0.01,
      description: "Before",
      hiddenFromList: false,
    },
    after: {
      type: "number",
      default: 70.9,
      min: 0,
      max: 212.7,
      step: 0.01,
      description: "After",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
