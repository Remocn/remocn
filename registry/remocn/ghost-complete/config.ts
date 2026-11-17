import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ghostCompleteConfig: ComponentConfig = {
  componentName: "GhostComplete",
  importPath: "@/components/remocn/ghost-complete",
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
    title: {
      type: "text-content",
      default: "Launch notes",
      description: "Title",
    },
    typed: {
      type: "text-content",
      default: "Ship the",
      description: "Typed",
    },
    keyLabel: {
      type: "text-content",
      default: "Tab",
      description: "Key label",
    },
    hintLabel: {
      type: "text-content",
      default: "to accept",
      description: "Hint label",
    },
    keepLastFill: {
      type: "boolean",
      default: true,
      description: "Keep last fill",
    },
    showLogo: {
      type: "boolean",
      default: true,
      description: "Show logo",
    },
    hold: {
      type: "number",
      default: 16,
      min: 0,
      max: 48,
      step: 1,
      description: "Ghost hold (frames)",
      hiddenFromList: false,
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
