import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const worldSignupsConfig: ComponentConfig = {
  componentName: "WorldSignups",
  importPath: "@/components/remocn/world-signups",
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
    title: {
      type: "text-content",
      default: "Signups around the world",
      description: "Title",
    },
    counterLabel: {
      type: "text-content",
      default: "Signups today",
      description: "Counter label",
    },
    delta: {
      type: "text-content",
      default: "+18.2% vs. yesterday",
      description: "Delta",
    },
    startCount: {
      type: "number",
      default: 12847,
      min: 0,
      max: 38541,
      step: 1,
      description: "Start count",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
