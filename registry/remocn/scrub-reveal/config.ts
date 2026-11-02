import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const scrubRevealConfig: ComponentConfig = {
  componentName: "ScrubReveal",
  importPath: "@/components/remocn/scrub-reveal",
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
      default:
        "Every frame is code. Every cut is yours. Ship the film your product deserves.",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "Every cut is yours.",
      description: "Highlight",
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
  durationInFrames: 172,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
