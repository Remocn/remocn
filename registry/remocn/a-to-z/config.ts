import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const aToZConfig: ComponentConfig = {
  componentName: "AToZ",
  importPath: "@/components/remocn/a-to-z",
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
    finale: {
      type: "text-content",
      default: "zero lock-in.",
      description: "Finale",
    },
    connector: {
      type: "text-content",
      default: "is for",
      description: "Connector",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
