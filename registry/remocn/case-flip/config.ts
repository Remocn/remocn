import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    flip: {
      type: "number",
      default: 10,
      min: 4,
      max: 30,
      step: 1,
      description: "Flip (frames)",
      hiddenFromList: false,
    },
    pause: {
      type: "number",
      default: 12,
      min: 0,
      max: 60,
      step: 1,
      description: "Pause between waves (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque" }),
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
