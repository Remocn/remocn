import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rulerAlignConfig: ComponentConfig = {
  componentName: "RulerAlign",
  importPath: "@/components/remocn/ruler-align",
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
    text: {
      type: "text-content",
      default: "Made to measure.",
      description: "Text",
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
  durationInFrames: 225,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
