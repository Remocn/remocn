import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const choreFoldConfig: ComponentConfig = {
  componentName: "ChoreFold",
  importPath: "@/components/remocn/chore-fold",
  lists: {
    steps: {
      default: [
        "Export the audio.",
        "Send it off for a transcript.",
        "Fix every timestamp by hand.",
        "Style each line to match.",
        "Render the whole film again.",
      ],
      description: "Steps",
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
    label: {
      type: "text-content",
      default: "By hand",
      description: "Label",
    },
    name: {
      type: "text-content",
      default: "Captions",
      description: "Name",
    },
    result: {
      type: "text-content",
      default: "does all of that.",
      description: "Result",
    },
    payoff: {
      type: "text-content",
      default: "You just talk.",
      description: "Payoff",
    },
    lineStagger: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Geologica" }),
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
