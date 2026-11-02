import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const columnSlideConfig: ComponentConfig = {
  componentName: "ColumnSlide",
  importPath: "@/components/remocn/column-slide",
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
    from: {
      type: "text-content",
      default: "Plan the launch",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Launch day",
      description: "To",
    },
    columns: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Columns",
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
  durationInFrames: 96,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
