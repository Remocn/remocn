import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const betaThanksConfig: ComponentConfig = {
  componentName: "BetaThanks",
  importPath: "@/components/remocn/beta-thanks",
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
    tag: {
      type: "text-content",
      default: "beta",
      description: "Tag",
    },
    status: {
      type: "text-content",
      default: "is out.",
      description: "Status",
    },
    before: {
      type: "text-content",
      default: "Thank you,",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "testers.",
      description: "After",
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
