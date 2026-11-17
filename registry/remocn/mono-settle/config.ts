import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const monoSettleConfig: ComponentConfig = {
  componentName: "MonoSettle",
  importPath: "@/components/remocn/mono-settle",
  lists: {
    lines: {
      default: ["From your editor", "to the edit."],
      description: "Lines",
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
      default: "the edit.",
      description: "Highlight",
    },
    settleAt: {
      type: "number",
      default: 36,
      min: 0,
      max: 90,
      step: 1,
      description: "Settle at (frame)",
      hiddenFromList: false,
    },
    sweep: {
      type: "number",
      default: 26,
      min: 0,
      max: 60,
      step: 1,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
