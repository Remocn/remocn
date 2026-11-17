import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const indentStepsConfig: ComponentConfig = {
  componentName: "IndentSteps",
  importPath: "@/components/remocn/indent-steps",
  lists: {
    lines: {
      default: [
        "Write it in React.",
        "Render it in Remotion.",
        "Ship it tonight.",
      ],
      description: "Lines",
      max: 5,
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
      default: "tonight",
      description: "Highlight",
    },
    lineNumbers: {
      type: "boolean",
      default: true,
      description: "Line numbers",
    },
    exit: {
      type: "boolean",
      default: false,
      description: "Exit",
    },
    stagger: {
      type: "number",
      default: 20,
      min: 4,
      max: 40,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Hanken Grotesk", grain: true }),
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
