import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const macroPanConfig: ComponentConfig = {
  componentName: "MacroPan",
  importPath: "@/components/remocn/macro-pan",
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
    title: {
      type: "text-content",
      default: "Built to move.",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "remocn",
      description: "Label",
    },
    index: {
      type: "text-content",
      default: "01",
      description: "Index",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
