import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const statusPageConfig: ComponentConfig = {
  componentName: "StatusPage",
  importPath: "@/components/remocn/status-page",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    url: {
      type: "text-content",
      default: "status.remocn.dev",
      description: "Url",
    },
    year: {
      type: "number",
      default: 2026,
      min: 0,
      max: 6078,
      step: 1,
      description: "Year",
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
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
