import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const betaThanksConfig: ComponentConfig = {
  componentName: "BetaThanks",
  importPath: "@/components/remocn/beta-thanks",
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
    tag: {
      type: "text-content",
      default: "beta",
      description: "Tag",
    },
    status: {
      type: "text-content",
      default: "is out.",
      description: "Status",
    },
    before: {
      type: "text-content",
      default: "Thank you,",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "testers.",
      description: "After",
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
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Big Shoulders" }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
