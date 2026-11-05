import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const baselineDropConfig: ComponentConfig = {
  componentName: "BaselineDrop",
  importPath: "@/components/remocn/baseline-drop",
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
      default: "Ship the story.",
      description: "Text",
    },
    stagger: {
      type: "number",
      default: 11,
      min: 0,
      max: 33,
      step: 1,
      description: "Stagger",
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
