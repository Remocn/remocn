import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const indentStepsConfig: ComponentConfig = {
  componentName: "IndentSteps",
  importPath: "@/components/remocn/indent-steps",
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
