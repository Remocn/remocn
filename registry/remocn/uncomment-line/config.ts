import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const uncommentLineConfig: ComponentConfig = {
  componentName: "UncommentLine",
  importPath: "@/components/remocn/uncomment-line",
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
    marker: {
      type: "text-content",
      default: "// ",
      description: "Marker",
    },
    highlight: {
      type: "number",
      default: -1,
      min: -10,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
