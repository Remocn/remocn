import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const depthHeadlineConfig: ComponentConfig = {
  componentName: "DepthHeadline",
  importPath: "@/components/remocn/depth-headline",
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
      default: "Studio",
      description: "Title",
    },
    caption: {
      type: "text-content",
      default: "Studio",
      description: "Caption",
    },
    showLogo: {
      type: "boolean",
      default: true,
      description: "Show logo",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
