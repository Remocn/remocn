import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const branchTreeConfig: ComponentConfig = {
  componentName: "BranchTree",
  importPath: "@/components/remocn/branch-tree",
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
      default: "variants",
      description: "Title",
    },
    rootLabel: {
      type: "text-content",
      default: "1 component",
      description: "Root label",
    },
    depth: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Depth",
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
