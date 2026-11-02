import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shapeCutConfig: ComponentConfig = {
  componentName: "ShapeCut",
  importPath: "@/components/remocn/shape-cut",
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
      default: "Ideas move fast",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "remocn",
      description: "To",
    },
    shape: {
      type: "text-content",
      default: "circle",
      description: "Shape",
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
  durationInFrames: 110,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
