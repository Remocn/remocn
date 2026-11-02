import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const deviceGrowsAroundConfig: ComponentConfig = {
  componentName: "DeviceGrowsAround",
  importPath: "@/components/remocn/device-grows-around",
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
    name: {
      type: "text-content",
      default: "Launch Film",
      description: "Name",
    },
    badge: {
      type: "text-content",
      default: "v2",
      description: "Badge",
    },
    subtitle: {
      type: "text-content",
      default: "Remocn Studio export",
      description: "Subtitle",
    },
    delta: {
      type: "text-content",
      default: "6,904 (16.7%) today",
      description: "Delta",
    },
    metric: {
      type: "number",
      default: 48213,
      min: 0,
      max: 144639,
      step: 1,
      description: "Metric",
      hiddenFromList: false,
    },
    total: {
      type: "number",
      default: 1284507,
      min: 0,
      max: 3853521,
      step: 1,
      description: "Total",
      hiddenFromList: false,
    },
    gain: {
      type: "number",
      default: 412880,
      min: 0,
      max: 1238640,
      step: 1,
      description: "Gain",
      hiddenFromList: false,
    },
  },
  durationInFrames: 186,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
