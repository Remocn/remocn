import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const layeredCutoutConfig: ComponentConfig = {
  componentName: "LayeredCutout",
  importPath: "@/components/remocn/layered-cutout",
  controls: {
    theme: {
      type: "enum",
      default: "light",
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
    tagline: {
      type: "text-content",
      default: "Launch films, cut from components.",
      description: "Tagline",
    },
    layers: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Layers",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
