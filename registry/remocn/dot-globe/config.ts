import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dotGlobeConfig: ComponentConfig = {
  componentName: "DotGlobe",
  importPath: "@/components/remocn/dot-globe",
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
    prefix: {
      type: "text-content",
      default: "Live in",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "countries",
      description: "Suffix",
    },
    count: {
      type: "number",
      default: 142,
      min: 0,
      max: 426,
      step: 1,
      description: "Count",
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
