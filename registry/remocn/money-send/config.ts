import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const moneySendConfig: ComponentConfig = {
  componentName: "MoneySend",
  importPath: "@/components/remocn/money-send",
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
    recipient: {
      type: "text-content",
      default: "Maya Chen",
      description: "Recipient",
    },
    currency: {
      type: "text-content",
      default: "USD",
      description: "Currency",
    },
    note: {
      type: "text-content",
      default: "Dinner 🍜",
      description: "Note",
    },
    amount: {
      type: "number",
      default: 120,
      min: 0,
      max: 360,
      step: 1,
      description: "Amount",
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
  durationInFrames: 260,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
