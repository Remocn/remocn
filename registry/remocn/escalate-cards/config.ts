import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const escalateCardsConfig: ComponentConfig = {
  componentName: "EscalateCards",
  importPath: "@/components/remocn/escalate-cards",
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
    date: {
      type: "text-content",
      default: "OCTOBER 30",
      description: "Date",
    },
    firstBeat: {
      type: "number",
      default: 26,
      min: 0,
      max: 78,
      step: 1,
      description: "First beat",
      hiddenFromList: false,
    },
    accel: {
      type: "number",
      default: 0.6,
      min: 0,
      max: 1.8,
      step: 0.01,
      description: "Accel",
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
