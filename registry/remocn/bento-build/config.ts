import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bentoBuildConfig: ComponentConfig = {
  componentName: "BentoBuild",
  importPath: "@/components/remocn/bento-build",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    eyebrow: {
      type: "text-content",
      default: "Features",
      description: "Eyebrow",
    },
    heading: {
      type: "text-content",
      default: "Everything a launch video needs.",
      description: "Heading",
    },
    columns: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
