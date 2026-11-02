import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const parallaxLockupConfig: ComponentConfig = {
  componentName: "ParallaxLockup",
  importPath: "@/components/remocn/parallax-lockup",
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
    accentLine: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent line",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
