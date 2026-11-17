import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const overheardConfig: ComponentConfig = {
  componentName: "Overheard",
  importPath: "@/components/remocn/overheard",
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
      default: "It’s in the repo.",
      description: "Highlight",
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    pause: {
      type: "number",
      default: 26,
      min: 0,
      max: 60,
      step: 1,
      description: "Pause (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Young Serif" }),
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
