import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const crosshairLockConfig: ComponentConfig = {
  componentName: "CrosshairLock",
  importPath: "@/components/remocn/crosshair-lock",
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
      default: "Peak",
      description: "Label",
    },
    value: {
      type: "text-content",
      default: "2.4k/min",
      description: "Value",
    },
    x: {
      type: "number",
      default: 0.7,
      min: 0,
      max: 2.1,
      step: 0.01,
      description: "X",
      hiddenFromList: false,
    },
    y: {
      type: "number",
      default: 0.94,
      min: 0,
      max: 2.82,
      step: 0.01,
      description: "Y",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
