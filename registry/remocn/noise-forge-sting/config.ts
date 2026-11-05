import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const noiseForgeStingConfig: ComponentConfig = {
  componentName: "NoiseForgeSting",
  importPath: "@/components/remocn/noise-forge-sting",
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
    tagline: {
      type: "text-content",
      default: "Launch videos, built from parts.",
      description: "Tagline",
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
