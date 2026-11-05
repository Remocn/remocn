import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const coverRingConfig: ComponentConfig = {
  componentName: "CoverRing",
  importPath: "@/components/remocn/cover-ring",
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
      default: "Launch videos aren't edited anymore",
      description: "Line",
    },
    caption: {
      type: "text-content",
      default: "They're composed.",
      description: "Caption",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
