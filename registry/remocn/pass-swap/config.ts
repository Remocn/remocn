import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const passSwapConfig: ComponentConfig = {
  componentName: "PassSwap",
  importPath: "@/components/remocn/pass-swap",
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
    shape: {
      type: "enum",
      default: "mixed",
      variants: {
        slab: {},
        disc: {},
        mixed: {},
      },
      description: "Shape",
    },
    accentLastWord: {
      type: "boolean",
      default: true,
      description: "Accent last word",
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
