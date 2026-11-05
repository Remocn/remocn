import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const fillerCutConfig: ComponentConfig = {
  componentName: "FillerCut",
  importPath: "@/components/remocn/filler-cut",
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
    transcript: {
      type: "text-content",
      default: "So, um, ship your, like, launch video, uh, today. You know?",
      description: "Transcript",
    },
    keep: {
      type: "text-content",
      default: "Ship your launch video today.",
      description: "Keep",
    },
    highlight: {
      type: "text-content",
      default: "today.",
      description: "Highlight",
    },
    showTime: {
      type: "boolean",
      default: true,
      description: "Show time",
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
