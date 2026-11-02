import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const numberSplitConfig: ComponentConfig = {
  componentName: "NumberSplit",
  importPath: "@/components/remocn/number-split",
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
    total: {
      type: "text-content",
      default: "300+",
      description: "Total",
    },
    label: {
      type: "text-content",
      default: "components",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
