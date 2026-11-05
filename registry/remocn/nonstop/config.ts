import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const nonstopConfig: ComponentConfig = {
  componentName: "Nonstop",
  importPath: "@/components/remocn/nonstop",
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
    label: {
      type: "text-content",
      default: "From idea to export",
      description: "Label",
    },
    unit: {
      type: "text-content",
      default: "stops",
      description: "Unit",
    },
    from: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
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
  durationInFrames: 185,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
