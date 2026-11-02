import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cardCreateConfig: ComponentConfig = {
  componentName: "CardCreate",
  importPath: "@/components/remocn/card-create",
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
    holder: {
      type: "text-content",
      default: "Maya Chen",
      description: "Holder",
    },
    last4: {
      type: "text-content",
      default: "4821",
      description: "Last4",
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
  durationInFrames: 370,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
