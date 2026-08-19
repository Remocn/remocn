import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const logoEnterConfig: ComponentConfig = {
  componentName: "LogoEnter",
  importPath: "@/components/remocn/logo-enter",
  controls: {
    diameter: {
      type: "number",
      min: 48,
      step: 1,
      default: 118,
      description: "Diameter",
      hiddenFromList: false,
    },
    overlap: {
      type: "number",
      min: 0,
      step: 1,
      default: 38,
      description: "Overlap",
      hiddenFromList: false,
    },
    ringColor: {
      type: "color",
      default: "#fff",
      description: "Ring",
    },
    orientation: {
      type: "enum",
      default: "horizontal",
      variants: {
        horizontal: {},
        vertical: {},
      },
      description: "Orientation",
    },
    stagger: {
      type: "number",
      min: 0,
      step: 1,
      default: 7,
      description: "Stagger",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
