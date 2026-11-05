import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const galtonStackConfig: ComponentConfig = {
  componentName: "GaltonStack",
  importPath: "@/components/remocn/galton-stack",
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
    label: {
      type: "text-content",
      default: "95% of renders under 2s",
      description: "Label",
    },
    markerLabel: {
      type: "text-content",
      default: "2s",
      description: "Marker label",
    },
    count: {
      type: "number",
      default: 260,
      min: 0,
      max: 780,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    marker: {
      type: "number",
      default: 0.733,
      min: 0,
      max: 2.2,
      step: 0.01,
      description: "Marker",
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
