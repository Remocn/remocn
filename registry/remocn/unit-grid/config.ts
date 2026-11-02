import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const unitGridConfig: ComponentConfig = {
  componentName: "UnitGrid",
  importPath: "@/components/remocn/unit-grid",
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
    caption: {
      type: "text-content",
      default: "1 in 3 teams ship weekly",
      description: "Caption",
    },
    total: {
      type: "number",
      default: 100,
      min: 0,
      max: 300,
      step: 1,
      description: "Total",
      hiddenFromList: false,
    },
    highlighted: {
      type: "number",
      default: 33,
      min: 0,
      max: 99,
      step: 1,
      description: "Highlighted",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
