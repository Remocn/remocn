import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const headlineToLineConfig: ComponentConfig = {
  componentName: "HeadlineToLine",
  importPath: "@/components/remocn/headline-to-line",
  lists: {
    words: {
      default: ["Your", "launch", "video"],
      description: "Words",
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
    continuation: {
      type: "text-content",
      default: ", built from blocks you own",
      description: "Continuation",
    },
    accentIndex: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent index",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 6,
      min: 0,
      max: 20,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    charsPerFrame: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Characters per frame",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
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
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
