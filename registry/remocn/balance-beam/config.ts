import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const balanceBeamConfig: ComponentConfig = {
  componentName: "BalanceBeam",
  importPath: "@/components/remocn/balance-beam",
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
    accentLabel: {
      type: "text-content",
      default: "remocn",
      description: "Accent label",
    },
    title: {
      type: "text-content",
      default: "One block.",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Outweighs the whole stack.",
      description: "Subtitle",
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
