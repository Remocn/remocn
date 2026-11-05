import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bounceLogoConfig: ComponentConfig = {
  componentName: "BounceLogo",
  importPath: "@/components/remocn/bounce-logo",
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
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    line: {
      type: "text-content",
      default: "Hit the corner.",
      description: "Line",
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
  durationInFrames: 168,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
