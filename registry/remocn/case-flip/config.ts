import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caseFlipConfig: ComponentConfig = {
  componentName: "CaseFlip",
  importPath: "@/components/remocn/case-flip",
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
      default: "Launch it LOUD",
      description: "Text",
    },
    accentWord: {
      type: "text-content",
      default: "LOUD",
      description: "Accent word",
    },
    showGuides: {
      type: "boolean",
      default: true,
      description: "Show guides",
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
