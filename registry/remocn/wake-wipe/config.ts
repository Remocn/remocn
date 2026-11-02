import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wakeWipeConfig: ComponentConfig = {
  componentName: "WakeWipe",
  importPath: "@/components/remocn/wake-wipe",
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
