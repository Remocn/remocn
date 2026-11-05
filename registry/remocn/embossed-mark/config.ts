import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const embossedMarkConfig: ComponentConfig = {
  componentName: "EmbossedMark",
  importPath: "@/components/remocn/embossed-mark",
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
    name: {
      type: "text-content",
      default: "emocn",
      description: "Name",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
