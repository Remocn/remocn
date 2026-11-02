import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const whichMeansConfig: ComponentConfig = {
  componentName: "WhichMeans",
  importPath: "@/components/remocn/which-means",
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
    name: {
      type: "text-content",
      default: "Live preview",
      description: "Name",
    },
    label: {
      type: "text-content",
      default: "New",
      description: "Label",
    },
    hinge: {
      type: "text-content",
      default: "which means",
      description: "Hinge",
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
