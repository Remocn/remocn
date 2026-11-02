import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const flutedGlassConfig: ComponentConfig = {
  componentName: "FlutedGlass",
  importPath: "@/components/remocn/fluted-glass",
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
      default: "In focus.",
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
  durationInFrames: 145,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
