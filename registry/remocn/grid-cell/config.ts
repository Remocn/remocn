import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const gridCellConfig: ComponentConfig = {
  componentName: "GridCell",
  importPath: "@/components/remocn/grid-cell",
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
      default: "Introducing remocn 2.0",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "v2.0",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
