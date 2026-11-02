import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const whatsNewModalConfig: ComponentConfig = {
  componentName: "WhatsNewModal",
  importPath: "@/components/remocn/whats-new-modal",
  controls: {
    theme: {
      type: "enum",
      default: "light",
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
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    userName: {
      type: "text-content",
      default: "Maya Chen",
      description: "User name",
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
