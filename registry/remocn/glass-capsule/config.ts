import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glassCapsuleConfig: ComponentConfig = {
  componentName: "GlassCapsule",
  importPath: "@/components/remocn/glass-capsule",
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
    focus: {
      type: "text-content",
      default: "move",
      description: "Focus",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
