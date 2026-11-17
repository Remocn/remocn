import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const wakeWipeConfig: ComponentConfig = {
  componentName: "WakeWipe",
  importPath: "@/components/remocn/wake-wipe",
  lists: {
    lines: {
      default: [
        "Animations you own.",
        "Transitions that land.",
        "Ship the launch video today.",
      ],
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
      default: "today.",
      description: "Highlight",
    },
    eyebrow: {
      type: "text-content",
      default: "Inside remocn",
      description: "Eyebrow",
    },
    hold: {
      type: "number",
      default: 54,
      min: 0,
      max: 162,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    wake: {
      type: "number",
      default: 28,
      min: 8,
      max: 60,
      step: 1,
      description: "Wake (frames)",
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
    ...sceneControls({ font: "Figtree", grain: true }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
