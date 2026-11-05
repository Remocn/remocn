import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const socialSchedulerConfig: ComponentConfig = {
  componentName: "SocialScheduler",
  importPath: "@/components/remocn/social-scheduler",
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
    handle: {
      type: "text-content",
      default: "remocn",
      description: "Handle",
    },
    weekLabel: {
      type: "text-content",
      default: "Oct 26 – 30, 2026",
      description: "Week label",
    },
    pick: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
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
  durationInFrames: 228,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
