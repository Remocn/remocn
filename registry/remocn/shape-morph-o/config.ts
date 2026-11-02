import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shapeMorphOConfig: ComponentConfig = {
  componentName: "ShapeMorphO",
  importPath: "@/components/remocn/shape-morph-o",
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
      default: "remocn",
      description: "Word",
    },
    mark: {
      type: "boolean",
      default: true,
      description: "Mark",
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
