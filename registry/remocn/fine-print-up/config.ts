import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const finePrintUpConfig: ComponentConfig = {
  componentName: "FinePrintUp",
  importPath: "@/components/remocn/fine-print-up",
  lists: {
    lines: {
      default: [
        "Every component you install is a file you own.",
        "Use it in paid client work. It’s MIT.",
        "No account and no watermark. Ever.",
      ],
      description: "Lines",
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
    closing: {
      type: "text-content",
      default: "That’s all the fine print.",
      description: "Closing",
    },
    travel: {
      type: "number",
      default: 26,
      min: 6,
      max: 60,
      step: 1,
      description: "Travel (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Gloock" }),
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
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
