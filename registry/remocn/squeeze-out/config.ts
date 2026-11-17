import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const squeezeOutConfig: ComponentConfig = {
  componentName: "SqueezeOut",
  importPath: "@/components/remocn/squeeze-out",
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
      default: "Freshly pressed frames.",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "",
      description: "Highlight",
    },
    squeeze: {
      type: "number",
      default: 0.26,
      min: 0.1,
      max: 1,
      step: 0.01,
      description: "Squeeze",
      hiddenFromList: false,
    },
    relax: {
      type: "number",
      default: 30,
      min: 4,
      max: 60,
      step: 1,
      description: "Relax (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Anton" }),
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
