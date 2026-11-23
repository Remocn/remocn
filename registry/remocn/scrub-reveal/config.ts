import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    scrub: {
      type: "number",
      default: 118,
      min: 40,
      max: 200,
      step: 2,
      description: "Scrub (frames)",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
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
  durationInFrames: 172,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
