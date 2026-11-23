import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const layoutSwapConfig: ComponentConfig = {
  componentName: "LayoutSwap",
  importPath: "@/components/remocn/layout-swap",
  lists: {
    headlines: {
      default: [
        "Animations.",
        "Animations, transitions, backgrounds.",
        "Animations, transitions and backgrounds, ready to install.",
      ],
      description: "Headlines",
    },
  },
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
    highlight: {
      type: "text-content",
      default: "ready to install.",
      description: "Highlight",
    },
    align: {
      type: "enum",
      default: "center",
      variants: {
        center: {},
        left: {},
      },
      description: "Align",
    },
    hold: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    move: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Move",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Inter Tight" }),
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
