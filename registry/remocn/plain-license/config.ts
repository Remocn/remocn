import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const plainLicenseConfig: ComponentConfig = {
  componentName: "PlainLicense",
  importPath: "@/components/remocn/plain-license",
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
    highlight: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
    },
    step: {
      type: "number",
      default: 40,
      min: 0,
      max: 120,
      step: 1,
      description: "Step",
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
  durationInFrames: 220,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
