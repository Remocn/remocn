import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const vennMergeConfig: ComponentConfig = {
  componentName: "VennMerge",
  importPath: "@/components/remocn/venn-merge",
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
    center: {
      type: "text-content",
      default: "remocn",
      description: "Center",
    },
    caption: {
      type: "text-content",
      default: "Motion design, written as code.",
      description: "Caption",
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
