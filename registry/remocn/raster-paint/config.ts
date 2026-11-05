import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rasterPaintConfig: ComponentConfig = {
  componentName: "RasterPaint",
  importPath: "@/components/remocn/raster-paint",
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
      default: "10x",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "Faster renders in remocn 2.0",
      description: "Label",
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
