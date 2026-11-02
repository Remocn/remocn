import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const aspectSlitConfig: ComponentConfig = {
  componentName: "AspectSlit",
  importPath: "@/components/remocn/aspect-slit",
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
      default: "Now showing.",
      description: "Title",
    },
    caption: {
      type: "text-content",
      default: "A launch film, built in React.",
      description: "Caption",
    },
    slit: {
      type: "number",
      default: 0.125,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Slit",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
