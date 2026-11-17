import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 6,
      min: 0,
      max: 20,
      step: 1,
      description: "Cut stagger",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Headline weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
