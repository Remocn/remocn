import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const deadpanBoxConfig: ComponentConfig = {
  componentName: "DeadpanBox",
  importPath: "@/components/remocn/deadpan-box",
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
    quote: {
      type: "text-content",
      default: "Nobody watches launch videos.",
      description: "Quote",
    },
    attribution: {
      type: "text-content",
      default: "Founder. Nobody watched the launch.",
      description: "Attribution",
    },
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
