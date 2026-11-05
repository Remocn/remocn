import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chunkStackConfig: ComponentConfig = {
  componentName: "ChunkStack",
  importPath: "@/components/remocn/chunk-stack",
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
    text: {
      type: "text-content",
      default: "learn motion by making it",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "making",
      description: "Highlight",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
