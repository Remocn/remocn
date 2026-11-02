import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cometHeadlineConfig: ComponentConfig = {
  componentName: "CometHeadline",
  importPath: "@/components/remocn/comet-headline",
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
    eyebrow: {
      type: "text-content",
      default: "New in remocn",
      description: "Eyebrow",
    },
    headline: {
      type: "text-content",
      default: "Every launch beat, already in orbit.",
      description: "Headline",
    },
    highlight: {
      type: "text-content",
      default: "in orbit",
      description: "Highlight",
    },
    subhead: {
      type: "text-content",
      default: "Reveals, feature heads and stats as drop-in Remotion scenes.",
      description: "Subhead",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
