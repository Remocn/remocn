import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const upCloseConfig: ComponentConfig = {
  componentName: "UpClose",
  importPath: "@/components/remocn/up-close",
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
    close: {
      type: "text-content",
      default: "Up close, it’s code.",
      description: "Close",
    },
    wide: {
      type: "text-content",
      default: "From here, it’s your launch.",
      description: "Wide",
    },
    zoom: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Zoom",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
