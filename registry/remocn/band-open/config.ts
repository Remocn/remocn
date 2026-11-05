import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bandOpenConfig: ComponentConfig = {
  componentName: "BandOpen",
  importPath: "@/components/remocn/band-open",
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
    line: {
      type: "text-content",
      default: "Launch day",
      description: "Line",
    },
    src: {
      type: "text-content",
      default: "reel/reel-2.jpg",
      description: "Src",
    },
    meta: {
      type: "text-content",
      default: "Thursday · 09:00 · remocn.dev",
      description: "Meta",
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
