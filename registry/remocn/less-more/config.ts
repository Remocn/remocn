import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const lessMoreConfig: ComponentConfig = {
  componentName: "LessMore",
  importPath: "@/components/remocn/less-more",
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
    less: {
      type: "text-content",
      default: "Less explaining.",
      description: "Less",
    },
    more: {
      type: "text-content",
      default: "More showing.",
      description: "More",
    },
    swapAt: {
      type: "number",
      default: 34,
      min: 0,
      max: 90,
      step: 1,
      description: "Swap at (frame)",
      hiddenFromList: false,
    },
    fillAt: {
      type: "number",
      default: 80,
      min: 0,
      max: 120,
      step: 1,
      description: "Fill at (frame)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: "#1185FE", description: "Accent" },
    ...sceneControls({ font: "Figtree" }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
