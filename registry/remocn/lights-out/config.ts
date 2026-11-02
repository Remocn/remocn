import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lightsOutConfig: ComponentConfig = {
  componentName: "LightsOut",
  importPath: "@/components/remocn/lights-out",
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
    title: {
      type: "text-content",
      default: "SHIP IT.",
      description: "Title",
    },
    beat: {
      type: "number",
      default: 10,
      min: 0,
      max: 30,
      step: 1,
      description: "Beat",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 24,
      min: 0,
      max: 72,
      step: 1,
      description: "Hold",
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
  durationInFrames: 112,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
