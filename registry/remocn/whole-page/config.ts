import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wholePageConfig: ComponentConfig = {
  componentName: "WholePage",
  importPath: "@/components/remocn/whole-page",
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
    title: {
      type: "text-content",
      default: "What we believe",
      description: "Title",
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
  durationInFrames: 390,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
