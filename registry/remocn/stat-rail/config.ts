import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const statRailConfig: ComponentConfig = {
  componentName: "StatRail",
  importPath: "@/components/remocn/stat-rail",
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
      default: "The *future* of launch video is code",
      description: "Tagline",
    },
  },
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
