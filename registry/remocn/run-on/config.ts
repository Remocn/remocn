import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const runOnConfig: ComponentConfig = {
  componentName: "RunOn",
  importPath: "@/components/remocn/run-on",
  lists: {
    joiners: {
      default: ["and", "then"],
      description: "Joiners",
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
    text: {
      type: "text-content",
      default:
        "Open last year’s project and relink the fonts and nudge every keyframe and render and spot a typo and render it all again",
      description: "Text",
    },
    promise: {
      type: "text-content",
      default: "Or change one line.",
      description: "Promise",
    },
    highlight: {
      type: "text-content",
      default: "one line",
      description: "Highlight",
    },
    hold: {
      type: "number",
      default: 16,
      min: 0,
      max: 60,
      step: 1,
      description: "Hold (frames)",
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
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "DM Sans" }),
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
