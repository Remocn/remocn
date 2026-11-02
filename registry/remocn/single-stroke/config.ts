import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const singleStrokeConfig: ComponentConfig = {
  componentName: "SingleStroke",
  importPath: "@/components/remocn/single-stroke",
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
    value: {
      type: "text-content",
      default: "27",
      description: "Value",
    },
    unit: {
      type: "text-content",
      default: "Mar",
      description: "Unit",
    },
    label: {
      type: "text-content",
      default: "Demo day. Every team shows a film.",
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
