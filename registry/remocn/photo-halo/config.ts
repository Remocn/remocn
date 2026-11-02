import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const photoHaloConfig: ComponentConfig = {
  componentName: "PhotoHalo",
  importPath: "@/components/remocn/photo-halo",
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
    accentWord: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent word",
      hiddenFromList: false,
    },
  },
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
