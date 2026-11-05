import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const speedTrapConfig: ComponentConfig = {
  componentName: "SpeedTrap",
  importPath: "@/components/remocn/speed-trap",
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
    unit: {
      type: "text-content",
      default: "km/h",
      description: "Unit",
    },
    banner: {
      type: "text-content",
      default: "Top speed",
      description: "Banner",
    },
    previousLabel: {
      type: "text-content",
      default: "2025",
      description: "Previous label",
    },
    comparison: {
      type: "text-content",
      default: "vs last year",
      description: "Comparison",
    },
    label: {
      type: "text-content",
      default: "Speed trap · Sector 3",
      description: "Label",
    },
    value: {
      type: "number",
      default: 348,
      min: 0,
      max: 1044,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    previous: {
      type: "number",
      default: 300,
      min: 0,
      max: 900,
      step: 1,
      description: "Previous",
      hiddenFromList: false,
    },
    max: {
      type: "number",
      default: 360,
      min: 0,
      max: 1080,
      step: 1,
      description: "Max",
      hiddenFromList: false,
    },
  },
  durationInFrames: 115,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
