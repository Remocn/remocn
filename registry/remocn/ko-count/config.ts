import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const koCountConfig: ComponentConfig = {
  componentName: "KoCount",
  importPath: "@/components/remocn/ko-count",
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
    word: {
      type: "text-content",
      default: "Knockout",
      description: "Word",
    },
    subline: {
      type: "text-content",
      default: "The old workflow did not get up.",
      description: "Subline",
    },
    label: {
      type: "text-content",
      default: "The count",
      description: "Label",
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
