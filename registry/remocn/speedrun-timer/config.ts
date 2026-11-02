import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const speedrunTimerConfig: ComponentConfig = {
  componentName: "SpeedrunTimer",
  importPath: "@/components/remocn/speedrun-timer",
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
    category: {
      type: "text-content",
      default: "Launch video · Any%",
      description: "Category",
    },
    banner: {
      type: "text-content",
      default: "World record",
      description: "Banner",
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
