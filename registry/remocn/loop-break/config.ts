import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const loopBreakConfig: ComponentConfig = {
  componentName: "LoopBreak",
  importPath: "@/components/remocn/loop-break",
  lists: {
    loop: {
      default: ["Render the cut.", "Spot a typo.", "Start over."],
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
    fix: {
      type: "text-content",
      default: "Change one word. Done.",
      description: "Fix",
    },
    highlight: {
      type: "text-content",
      default: "Done.",
      description: "Highlight",
    },
    passes: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Passes",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
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
  durationInFrames: 215,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
