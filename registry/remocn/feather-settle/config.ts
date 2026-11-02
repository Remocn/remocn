import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const featherSettleConfig: ComponentConfig = {
  componentName: "FeatherSettle",
  importPath: "@/components/remocn/feather-settle",
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
    text: {
      type: "text-content",
      default: "Your launch, landing softly.",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "softly",
      description: "Highlight",
    },
    stagger: {
      type: "number",
      default: 13,
      min: 0,
      max: 39,
      step: 1,
      description: "Stagger",
      hiddenFromList: false,
    },
    fall: {
      type: "number",
      default: 68,
      min: 0,
      max: 204,
      step: 1,
      description: "Fall",
      hiddenFromList: false,
    },
    sway: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Sway",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
