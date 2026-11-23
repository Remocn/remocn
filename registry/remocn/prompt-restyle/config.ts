import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const promptRestyleConfig: ComponentConfig = {
  componentName: "PromptRestyle",
  importPath: "@/components/remocn/prompt-restyle",
  lists: {
    instructions: {
      default: ["make it bigger", "tighten it up", "set “you own” in serif"],
      description: "Instructions",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    headline: {
      type: "text-content",
      default: "Launch videos from parts you own.",
      description: "Headline",
    },
    highlight: {
      type: "text-content",
      default: "you own",
      description: "Highlight",
    },
    stepGap: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Step gap (frames)",
      hiddenFromList: false,
    },
    accentFont: {
      type: "font-family",
      default: "Instrument Serif",
      description: "Accent font",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
