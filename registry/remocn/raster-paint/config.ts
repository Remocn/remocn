import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    scanLength: {
      type: "number",
      default: 58,
      min: 10,
      max: 150,
      step: 1,
      description: "Scan length (frames)",
      hiddenFromList: false,
    },
    trail: {
      type: "number",
      default: 12,
      min: 2,
      max: 40,
      step: 1,
      description: "Cool-down (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist Mono", grain: true }),
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
